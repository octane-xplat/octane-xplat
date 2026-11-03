## Development session lifetime. Only owned sessions start/stop engine processes.
import std/[os, json, asyncdispatch, strtabs, strutils, monotimes, times]
import ./managed_process, ./runtime_logs, ./sessions, ./host_storage, ./native_identity
import ./build_worker, ./runtime_build, ./route_operation, ./strictjson, ./js_text
import ./contract_failure, ./jsonutil, ./json_wire
import ./session_history, ./process_observation

type DevSessionRun* = ref object
  logs*: RuntimeLogs
  signal: ProcessCancel
  pending: Future[void]
  ending: bool
  launching*: bool
  history*: HistoryCapture
  registry: SessionRegistry
  sessionWatch: int
  attached: bool
  observed: seq[ObservedProcess]

proc newDevSessionRun*(logs: RuntimeLogs): DevSessionRun =
  DevSessionRun(logs: logs,signal: newProcessCancel(),launching: true)

proc newAttachedDevRun*(logs: RuntimeLogs, observed: seq[ObservedProcess]): DevSessionRun =
  if observed.len == 0: raise newException(ValueError,"An attachment needs an observed process identity")
  result = DevSessionRun(logs: logs,signal: newProcessCancel(),attached: true)
  for process in observed:
    result.observed.add(ObservedProcess(pid: process.pid,parent: process.parent,birth: process.birth))

proc stopDevRun*(run: DevSessionRun): Future[JsonNode] {.async.} =
  run.ending = true
  run.signal.cancel()
  if run.pending != nil: await run.pending
  if run.sessionWatch > 0:
    run.registry.unwatchSessions(run.sessionWatch)
    run.sessionWatch = 0
  if run.attached: return %*{"released": ["native attachment observer and lifecycle capture"]}
  return %*{"released": ["owned development engine and process group", "native session resource directory"]}

proc cancelled(run: DevSessionRun): bool = run.signal.cancelled or interruptedSignal() != 0

proc work(run: DevSessionRun, registry: SessionRegistry, app, session: JsonNode,
    parent, workspace, owner: string, timeoutMs: int): Future[void] {.async.} =
  let id = text(session["sessionId"])
  let root = text(app["root"])
  let manager = newProcessManager()
  var directory: string
  var stamp: FileStamp
  var logWatch: int
  try:
    run.history = newHistoryCapture(workspace,app,session,owner)
    let retained = run.history
    run.registry = registry
    run.sessionWatch = registry.watchSessions(proc(value: JsonNode) =
      if value["sessionId"] == %id: retained.updateHistory(value))
    logWatch = run.logs.watchLogs(proc(value: JsonNode) = retained.appendHistory(value))
    if run.cancelled(): raise contractFailure("cancelled","Session launch cancelled")
    if run.attached:
      var processes = newJArray()
      for process in run.observed:
        processes.add(%*{"pid": process.pid,"startTimeUs": $process.birth})
      retained.updateHistory(%*{"attachment": {"processes": processes,"identity": "inferred from cwd and command arguments",
        "output": "lifecycle-only","cleanupScope": "native observer and capture; external processes remain user-owned"}})
      discard run.logs.noteLog("Attached to existing development processes; application output stays in the user's terminal. Only lifecycle events are captured.")
      while not run.cancelled():
        var live = false
        try: live = sameObservedProcess(run.observed[0])
        except OSError as error:
          discard registry.markSessionDisconnected(id,%("Process observation is unavailable; attached data is historical: " & error.msg))
          discard run.logs.noteLog("Attachment observation unavailable; external processes were not signalled.")
          break
        if not live:
          discard registry.markSessionDisconnected(id,%"The observed development process identity is unavailable; attached data is historical.")
          discard run.logs.noteLog("Observed development process exited or changed identity; external processes were not signalled.")
          break
        await sleepAsync(200)
      return
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
    if run.history != nil: run.history.finishHistory(registry.getSession(id))
    if logWatch > 0: run.logs.unwatchLogs(logWatch)

proc startDevRun*(run: DevSessionRun, registry: SessionRegistry, app, session: JsonNode,
    parent, workspace, owner: string, timeoutMs = 300000) =
  if run.pending != nil: raise newException(ValueError,"Development runner already started")
  run.pending = newFuture[void]("Development runner ownership")
  proc advance(): Future[void] {.async.} =
    try:
      await run.work(registry,app,session,parent,workspace,owner,timeoutMs)
      run.pending.complete()
    except CatchableError as error: run.pending.fail(error)
  asyncCheck advance()

proc devRunFinished*(run: DevSessionRun): bool = run.pending != nil and run.pending.finished
proc forgetDevLogs*(run: DevSessionRun) =
  if run.devRunFinished():
    if run.sessionWatch > 0:
      run.registry.unwatchSessions(run.sessionWatch)
      run.sessionWatch = 0
    run.logs = nil
    run.history = nil
    run.registry = nil
