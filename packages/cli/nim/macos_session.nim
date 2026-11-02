## Owned development-engine lifetime. The worker owns compiler/HMR semantics.
import std/[os, json, asyncdispatch, strtabs, strutils, monotimes, times]
import ./managed_process, ./runtime_logs, ./sessions, ./host_storage, ./native_identity
import ./build_worker, ./runtime_build, ./route_operation, ./strictjson, ./js_text
import ./contract_failure, ./jsonutil, ./json_wire

type OwnedDevRun* = ref object
  logs*: RuntimeLogs
  signal: ProcessCancel
  pending: Future[void]
  ending: bool
  launching*: bool

proc newOwnedDevRun*(logs: RuntimeLogs): OwnedDevRun =
  OwnedDevRun(logs: logs,signal: newProcessCancel(),launching: true)

proc stopDevRun*(run: OwnedDevRun): Future[JsonNode] {.async.} =
  run.ending = true
  run.signal.cancel()
  if run.pending != nil: await run.pending
  return %*{"released": ["owned development engine and process group", "native session resource directory"]}

proc cancelled(run: OwnedDevRun): bool = run.signal.cancelled or interruptedSignal() != 0

proc work(run: OwnedDevRun, registry: SessionRegistry, app, session: JsonNode,
    parent: string, timeoutMs: int): Future[void] {.async.} =
  let id = text(session["sessionId"])
  let root = text(app["root"])
  let manager = newProcessManager()
  var directory: string
  var stamp: FileStamp
  try:
    if run.cancelled(): raise contractFailure("cancelled","Session launch cancelled")
    requireProjectVite(root)
    let worker = projectWorker(root,"@octane-xplat/macos-build","./dev-worker")
    privateHostDirectory(parent)
    directory = parent / id
    if dirExists(directory) or fileExists(directory) or symlinkExists(directory):
      raise newException(ValueError,"Session resource identity already exists")
    privateHostDirectory(directory)
    stamp = getFileInfo(directory,followSymlink=false).id
    let resource = directory / "resources"
    privateHostDirectory(resource)
    let input = directory / "request.json"
    let output = directory / "ready.json"
    writeFile(input,wireJson(%*{"protocol": "octane-dev-worker","version": 1,"id": id,
      "operation": "macos-dev","project": root,"resourceRoot": resource}))
    registry.setSessionLaunch(id,%*{"phase": "generating routes"})
    var routeLines: ProcessLines
    proc captureRoutes(bytes: string, eof = false) =
      for line in routeLines.feed(bytes,"stderr",eof):
        discard run.logs.appendLog(line.line,stream=line.stream,source="routes",lineTruncated=line.lineTruncated)
    try:
      discard await generateNativeRoutes(root,signal=run.signal,
        onWarn=proc(message: string) = discard run.logs.appendLog(message,stream="stderr",level="warn"),
        onDiagnostic=proc(bytes: string) = captureRoutes(bytes))
    finally: captureRoutes("",true)
    if run.cancelled(): raise contractFailure("cancelled","Session launch cancelled")
    let environment = newStringTable(modeCaseSensitive)
    environment["NODE_PATH"] = ""
    environment["NODE_OPTIONS"] = ""
    let child = manager.spawnManaged("node",@[worker,input,output],cwd=root,env=environment,signal=run.signal,graceMs=5000,
      onLine=proc(line: ProcessLine) = discard run.logs.appendLog(line.line,stream=line.stream,source="macos-dev",lineTruncated=line.lineTruncated),
      onNote=proc(message: string) = discard run.logs.noteLog(message))
    registry.setSessionLaunch(id,%*{"phase": "starting dev host"})
    let started = getMonoTime()
    var ready = false
    while not child.exit.finished:
      if run.cancelled(): raise contractFailure("cancelled","Session launch cancelled")
      if (getMonoTime()-started).inMilliseconds >= timeoutMs:
        raise contractFailure("timeout","macOS development engine did not become ready before its deadline")
      if fileExists(output):
        if getFileSize(output) > 65536: raise newException(ValueError,"Development readiness exceeds 64 KiB")
        let response = parseStrictJson(decodeUtf8(readFile(output)))
        if field(response,"protocol") != %"octane-dev-worker" or field(response,"version") != %1 or
            field(response,"id") != %id or field(response,"ok") == nil or response["ok"].kind != JBool:
          raise newException(ValueError,"Invalid development readiness response")
        if response["ok"] != %true:
          raise contractFailure("execution_failure",text(field(field(response,"error"),"message")))
        let data = field(response,"data")
        let pid = field(data,"pid")
        let executable = text(field(data,"executable"))
        if pid == nil or pid.kind != JInt or pid.getInt() <= 0 or
            not fileExists(executable) or not expandFilename(executable).startsWith(expandFilename(resource) & "/bundle/"):
          raise newException(ValueError,"Incomplete development readiness metadata")
        ready = true
        break
      await sleepAsync(10)
    if not ready:
      let status = await child.exit
      raise contractFailure((if status.errorCode == "ENOENT": "prerequisite_missing" else: "execution_failure"),
        "macOS development engine exited before readiness (" & $status.exitStatus() & "): " & status.error)
    let identity = await sourceRevision(root,run.signal)
    identity["label"] = %"macos dev"
    if run.cancelled(): raise contractFailure("cancelled","Session launch cancelled")
    run.launching = false
    registry.setSessionLaunch(id,%*{"phase": "ready","readiness": "confirmed"})
    discard registry.markSessionReady(id,%*{"processKind": "fresh","buildIdentity": identity})
    discard run.logs.noteLog("macOS development session ready")
    let status = await child.exit
    if not run.ending:
      discard registry.markSessionDisconnected(id,%("Development engine exited (" & $status.exitStatus() & ")"))
      discard run.logs.noteLog("Development engine exited; session data is historical")
  except CatchableError as error:
    if not run.ending:
      registry.markSessionFailed(id,failureData(error))
      discard run.logs.appendLog(error.msg,stream="stderr",source="launch")
  finally:
    run.launching = false
    await manager.close()
    if directory.len > 0 and dirExists(directory) and not symlinkExists(directory) and
        getFileInfo(directory,followSymlink=false).id == stamp:
      removeDir(directory)

proc startDevRun*(run: OwnedDevRun, registry: SessionRegistry, app, session: JsonNode,
    parent: string, timeoutMs = 300000) =
  if run.pending != nil: raise newException(ValueError,"Development runner already started")
  run.pending = newFuture[void]("Development runner ownership")
  proc advance(): Future[void] {.async.} =
    try:
      await run.work(registry,app,session,parent,timeoutMs)
      run.pending.complete()
    except CatchableError as error: run.pending.fail(error)
  asyncCheck advance()

proc devRunFinished*(run: OwnedDevRun): bool = run.pending != nil and run.pending.finished
proc forgetDevLogs*(run: OwnedDevRun) =
  if run.devRunFinished(): run.logs = nil
