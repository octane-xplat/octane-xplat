## Test-only bootstrap operations and a self-terminating native daemon fixture.
import std/[asyncdispatch, json, os, strutils, strtabs, options, monotimes, times]
import std/osproc
import ../../packages/cli/nim/[host_bootstrap, managed_process, strictjson, json_wire, jsonutil]
import ../../packages/cli/nim/[agent_host, host_client, host_storage, jobs, sessions, contract_failure]
when defined(macosx) or defined(linux): import std/posix
when defined(windows):
  import ../../packages/cli/nim/[windows_bootstrap, windows_environment]
  proc getStdHandle(kind: uint32): pointer {.stdcall, importc: "GetStdHandle", header: "<windows.h>".}
  proc getFileType(handle: pointer): uint32 {.stdcall, importc: "GetFileType", header: "<windows.h>".}
  proc ownProcessHandle(): pointer {.stdcall, importc: "GetCurrentProcess", header: "<windows.h>".}
  proc terminateOwnProcess(handle: pointer, code: uint32): cint {.stdcall, importc: "TerminateProcess", header: "<windows.h>".}
when defined(windows):
  var guardAdopted = false

proc identity(args: seq[string]): Future[void] {.async.} =
  when defined(macosx) or defined(linux):
    installProcessSignalHandlers()
    let expectedParent = parseInt(args[2])
    var waited = 0
    while expectedParent > 0 and int(getppid()) == expectedParent and waited < 3000:
      await sleepAsync(5)
      waited += 5
    let lock = if args[3] == "": nil else: tryHostLock(args[3])
    try:
      var actual, expected: Stat
      let nullStdin = fstat(0,actual) == 0 and posix.stat("/dev/null",expected) == 0 and
        S_ISCHR(actual.st_mode) and actual.st_rdev == expected.st_rdev
      if args.len > 6 and args[6].len > 0:
        let descendant = osproc.startProcess(getAppFilename(),args = @["identity",args[6],"0","",(if args.len > 7: args[7] else: args[4]),"ignore"],options={poParentStreams})
        # Same process group; unlike spawnManaged this fixture must not detach.
        defer: osproc.close(descendant)
      writeFile(args[1],wireJson(%*{"pid": int(getpid()),"parent": int(getppid()),"session": int(getsid(0)),
        "group": int(getpgrp()),"cwd": getCurrentDir(),"sentinel": getEnv("XPLAT_HOST_FIXTURE"),
        "stdinIsNull": nullStdin,"lockAcquired": lock != nil}))
      stdout.writeLine("fixture stdout")
      stdout.flushFile()
      stderr.writeLine("fixture stderr")
      let started = getMonoTime()
      let duration = parseInt(args[4])
      while (getMonoTime()-started).inMilliseconds < duration and
          (args.len > 5 and args[5] == "ignore" or interruptedSignal() == 0): await sleepAsync(5)
    finally: lock.closeHostLock()
  elif defined(windows):
    installProcessSignalHandlers()
    let expectedParent = parseInt(args[2])
    var waited = 0
    while expectedParent > 0 and bootstrapProcessAlive(expectedParent) and waited < 3000:
      await sleepAsync(5)
      waited += 5
    let lock = if args[3] == "": nil else: tryHostLock(args[3])
    try:
      if args.len > 6 and args[6].len > 0:
        let descendant = osproc.startProcess(getAppFilename(),
          args = @["identity",args[6],"0","",(if args.len > 7: args[7] else: args[4]),"ignore"],options={poParentStreams})
        defer: osproc.close(descendant)
      var drives = newJObject()
      for key,value in windowsEnvironmentPairs():
        if windowsDriveVariable(key): drives[key] = %value
      writeFile(args[1],wireJson(%*{"pid": getCurrentProcessId(),"cwd": getCurrentDir(),"driveDirectories": drives,
        "sentinel": getEnv("XPLAT_HOST_FIXTURE"),"stdinIsNull": getFileType(getStdHandle(0xfffffff6'u32)) == 2,
        "lockAcquired": lock != nil,"guardAdopted": guardAdopted,
        "bootstrapEnvironmentCleared": getEnv(bootstrapJobVariable).len == 0,"argv": args}))
      stdout.writeLine("fixture stdout"); stdout.flushFile()
      stderr.writeLine("fixture stderr"); stderr.flushFile()
      let started = getMonoTime()
      let duration = parseInt(args[4])
      while (getMonoTime()-started).inMilliseconds < duration and
          (args.len > 5 and args[5] == "ignore" or interruptedSignal() == 0): await sleepAsync(5)
      if args.len > 5 and args[5] == "crash":
        # Kernel exit bypasses Nim defers; only job-handle closure reaps children.
        if terminateOwnProcess(ownProcessHandle(),193) == 0: raiseOSError(osLastError())
    finally: lock.closeHostLock()
  else: raise newException(OSError,"Host fixture requires a supported native host")

proc operation(request: JsonNode): Future[JsonNode] {.async.} =
  case text(request["operation"])
  of "private-directory":
    privateHostDirectory(text(request["path"]))
    return %*{"ok": true}
  of "connect", "ensure", "call", "paths":
    let root = text(request["root"])
    if text(request["operation"]) == "paths":
      let paths = hostPaths(root)
      return %*{"descriptor": paths.descriptor,"socket": paths.socket,"directory": paths.directory,"lock": paths.lock}
    let host = if text(request["operation"]) == "ensure":
        await ensureNativeHost(root,executable=text(field(request,"executable")),
          timeoutMs=(if field(request,"timeoutMs") == nil: 8000 else: request["timeoutMs"].getInt()))
      else: await connectNativeHost(root)
    if host == nil: return %*{"ok": true,"absent": true}
    if text(request["operation"]) == "call":
      return await host.callNativeHost(text(request["method"]),
        (if field(request,"params") == nil: newJObject() else: request["params"]))
    return %*{"ok": true,"pid": host.pid,"identity": host.identity}
  of "lock":
    installProcessSignalHandlers()
    let lock = tryHostLock(text(request["path"]))
    try:
      let reply = %*{"ok": true,"acquired": lock != nil}
      if field(request,"hold") == %true and lock != nil:
        echo wireJson(reply)
        stdout.flushFile()
        while interruptedSignal() == 0: await sleepAsync(5)
        return nil
      return reply
    finally: lock.closeHostLock()
  of "launch":
    let environment = newStringTable(modeCaseSensitive)
    for key,value in request["env"]: environment[key] = value.getStr()
    var args: seq[string]
    for value in request["args"]: args.add(value.getStr())
    let before = getCurrentDir()
    let parentLock = if field(request,"lockPath") == nil: nil else: tryHostLock(text(request["lockPath"]))
    var launch: DetachedLaunch
    when defined(macosx) or defined(linux):
      if field(request,"closeStdin") == %true: discard posix.close(0)
    try:
      launch = launchDetached(text(request["command"]),args,text(request["cwd"]),text(request["log"]),environment)
      if field(request,"stop") == %true:
        let marker = text(field(request,"marker"))
        var waited = 0
        while marker.len > 0 and not fileExists(marker) and waited < 3000 and not launch.pollLaunch():
          await sleepAsync(5)
          waited += 5
        await launch.stopUnpublishedLaunch(50)
      return %*{"ok": true,"pid": launch.pid,"parentCwdPreserved": getCurrentDir() == before,
        "finished": launch.pollLaunch(),"exitCode": (if launch.exitCode.isSome: %launch.exitCode.get() else: newJNull())}
    finally:
      launch.releaseLaunch()
      parentLock.closeHostLock()
  of "empty-handles":
    when defined(macosx) or defined(linux):
      var before, after: Stat
      let validBefore = fstat(0,before) == 0
      var lock: HostLock
      new(lock)
      lock.closeHostLock()
      var launch: DetachedLaunch
      new(launch)
      await launch.stopUnpublishedLaunch()
      return %*{"ok": true,"safe": validBefore and fstat(0,after) == 0 and before.st_ino == after.st_ino and launch.pollLaunch()}
    else: raise newException(OSError,"Host fixture requires a qualified POSIX host")
  else: raise newException(ValueError,"Unknown bootstrap fixture operation")

try:
  let args = commandLineParams()
  when defined(windows):
    if args.len > 0 and args[0] in ["--internal-agent-host","identity"]:
      if args[0] == "--internal-agent-host" or getEnv(bootstrapJobVariable).len > 0:
        adoptBootstrapOwner()
        guardAdopted = true
  if args.len > 0 and args[0] == "--internal-agent-host":
    let extension: NativeHostDispatch = proc(host: NativeHost, request: JsonNode): Future[JsonNode] {.async.} =
      if field(request,"token") != nil: raise newException(ValueError,"Host credentials reached the engine boundary")
      if text(request["method"]) != "fixture.start": raise contractFailure("invalid_selection","Unknown fixture method")
      let manager = newProcessManager()
      let cleanup: SessionCleanup = proc(): Future[JsonNode] {.async.} =
        await manager.close()
        return %*{"released": ["fixture process"]}
      let session = host.sessions.bindOwnedSession(%*{"appId": ".","platform": "macos","targetId": "macos"},cleanup)
      let id = text(session["sessionId"])
      let runner: JobRunner = proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.async.} =
        let marker = text(request["params"]["marker"])
        let child = manager.spawnManaged(getAppFilename(),@["identity",marker,"0","","30000","ignore",marker & ".descendant"],signal=signal,graceMs=50)
        discard host.sessions.markSessionReady(id)
        let finished = await child.exit
        return %*{"code": finished.exitStatus()}
      return %*{"session": session,"job": host.jobs.startJob(%*{"kind": "fixture","sessionId": id},runner)["job"]}
    waitFor runNativeHost(args[1],%*{"name": "native-host-fixture","version": "1"},extension,
      idleMs=max(250,parseInt(getEnv("XPLAT_AGENT_HOST_IDLE_MS","120000"))))
  elif args.len > 0 and args[0] == "identity": waitFor identity(args)
  else:
    let response = waitFor operation(parseStrictJson(stdin.readLine()))
    if response != nil: echo wireJson(response)
except CatchableError as error: echo wireJson(%*{"ok": false,"message": error.msg})
