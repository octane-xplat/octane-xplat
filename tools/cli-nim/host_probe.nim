## Test-only bootstrap operations and a self-terminating native daemon fixture.
import std/[asyncdispatch, json, os, strutils, strtabs, options, monotimes, times]
import ../../packages/cli/nim/[host_bootstrap, managed_process, strictjson, json_wire, jsonutil]
when defined(macosx): import std/posix

proc identity(args: seq[string]): Future[void] {.async.} =
  when defined(macosx):
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
  else: raise newException(OSError,"Host fixture requires macOS")

proc operation(request: JsonNode): Future[JsonNode] {.async.} =
  case text(request["operation"])
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
    when defined(macosx):
      if field(request,"closeStdin") == %true: discard posix.close(0)
    try:
      let launch = launchDetached(text(request["command"]),args,text(request["cwd"]),text(request["log"]),environment)
      if field(request,"stop") == %true:
        let marker = text(field(request,"marker"))
        var waited = 0
        while marker.len > 0 and not fileExists(marker) and waited < 3000 and not launch.pollLaunch():
          await sleepAsync(5)
          waited += 5
        await launch.stopUnpublishedLaunch(50)
      return %*{"ok": true,"pid": launch.pid,"parentCwdPreserved": getCurrentDir() == before,
        "finished": launch.pollLaunch(),"exitCode": (if launch.exitCode.isSome: %launch.exitCode.get() else: newJNull())}
    finally: parentLock.closeHostLock()
  of "empty-handles":
    when defined(macosx):
      var before, after: Stat
      let validBefore = fstat(0,before) == 0
      var lock: HostLock
      new(lock)
      lock.closeHostLock()
      var launch: DetachedLaunch
      new(launch)
      await launch.stopUnpublishedLaunch()
      return %*{"ok": true,"safe": validBefore and fstat(0,after) == 0 and before.st_ino == after.st_ino and launch.pollLaunch()}
    else: raise newException(OSError,"Host fixture requires macOS")
  else: raise newException(ValueError,"Unknown bootstrap fixture operation")

try:
  let args = commandLineParams()
  if args.len > 0 and args[0] == "identity": waitFor identity(args)
  else:
    let response = waitFor operation(parseStrictJson(stdin.readLine()))
    if response != nil: echo wireJson(response)
except CatchableError as error: echo wireJson(%*{"ok": false,"message": error.msg})
