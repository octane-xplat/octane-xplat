## Project build orchestration. Installed engines execute configuration/plugins.
import std/[os, json, asyncdispatch, options, strutils, strtabs, monotimes, times]
import ./core, ./package_manager, ./managed_process, ./runtime_logs
import ./route_operation, ./command_probe, ./contract_failure
import ./macos_build, ./build_worker

proc requireProjectVite(root: string) =
  for modules in nodeModulesDirs(root):
    let manifest = readJson(modules / "vite/package.json")
    if field(manifest,"name") == %"vite" and fileExists(modules / ".bin/vite"): return
  raise contractFailure("prerequisite_missing","Install Vite in the selected project before building.",
    %*{"recovery": {"action": "Install the app's dependencies with its selected package manager."}})

proc sourceRevision*(root: string, signal: ProcessCancel = nil): Future[JsonNode] {.async.} =
  result = newJObject()
  let head = await probeCommand("git",@["-C",root,"rev-parse","HEAD"],cwd=root,signal=signal)
  if head.isNone or head.get().strip().len == 0: return
  let dirty = await probeCommand("git",@["-C",root,"status","--porcelain"],cwd=root,signal=signal)
  result["revision"] = %(head.get().strip() & (if dirty.isSome and dirty.get().strip().len > 0: "-dirty" else: ""))

proc runProjectBuild*(app: JsonNode, platform: string, logs: RuntimeLogs, signal: ProcessCancel,
    report: proc(progress: JsonNode) {.closure.} = nil, timeoutMs = 900000): Future[JsonNode] {.async.} =
  if timeoutMs <= 0: raise newException(ValueError,"Build deadline must be positive")
  if platform notin ["web","macos"]: raise contractFailure("unavailable","Native " & platform & " build engine integration is pending.")
  when not defined(macosx): raise contractFailure("unavailable","Native process ownership is not implemented on this host.")
  let root = text(app["root"])
  if report != nil: report(%*{"phase": "starting","platform": platform})
  requireProjectVite(root)
  if platform == "macos": discard projectWorker(root,"@octane-xplat/macos-build")
  var routeLines: ProcessLines
  proc captureRoutes(bytes: string, eof = false) =
    for line in routeLines.feed(bytes,"stderr",eof):
      discard logs.appendLog(line.line,stream=line.stream,source="routes",lineTruncated=line.lineTruncated)
  try:
    discard await generateNativeRoutes(root,signal=signal,
      onWarn=proc(message: string) = discard logs.appendLog(message,stream="stderr",level="warn"),
      onDiagnostic=proc(bytes: string) = captureRoutes(bytes))
  finally: captureRoutes("",eof=true)
  if signal != nil and signal.cancelled: raise contractFailure("cancelled","Build cancelled.")
  if platform == "macos":
    if report != nil: report(%*{"phase": "building","platform": platform})
    let built = await runMacOSBuild(root,logs,signal,timeoutMs)
    built["platform"] = %platform
    built["appId"] = app["id"]
    built["buildIdentity"] = await sourceRevision(root,signal)
    return built
  let command = packageManagerExec(root,@["vite","build"])
  var args: seq[string]
  for value in command["args"]: args.add(value.getStr())
  let environment = newStringTable(modeCaseSensitive)
  environment["NODE_PATH"] = ""
  environment["NODE_OPTIONS"] = ""
  let manager = newProcessManager()
  let stop = newProcessCancel()
  try:
    let child = manager.spawnManaged(text(command["cmd"]),args,cwd=root,env=environment,signal=stop,
      onLine=proc(line: ProcessLine) = discard logs.appendLog(line.line,stream=line.stream,lineTruncated=line.lineTruncated),
      onNote=proc(line: string) = discard logs.noteLog(line))
    if report != nil: report(%*{"phase": "building","platform": platform})
    let started = getMonoTime()
    var timedOut = false
    while not child.exit.finished:
      if (signal != nil and signal.cancelled) or interruptedSignal() != 0: stop.cancel()
      if (getMonoTime()-started).inMilliseconds >= timeoutMs:
        timedOut = true
        stop.cancel()
      await sleepAsync(5)
    let finished = await child.exit
    if timedOut: raise contractFailure("timeout","Build engine exceeded its deadline.")
    if (signal != nil and signal.cancelled) or interruptedSignal() != 0: raise contractFailure("cancelled","Build cancelled.")
    if finished.error.len > 0:
      raise contractFailure("prerequisite_missing","Could not run the app package manager: " & finished.error,
        %*{"recovery": {"action": "Install the selected package manager and the app's dependencies."}})
    if finished.exitStatus() != 0:
      var tail = newJArray()
      for record in logs.readLogs(limit=25)["records"]: tail.add(record["line"])
      raise contractFailure("execution_failure","vite build exited " & $finished.exitStatus() & ".",
        %*{"context": {"tail": tail},"retryable": false})
    let identity = await sourceRevision(root,signal)
    return %*{"platform": platform,"appId": app["id"],"summary": "vite build succeeded","buildIdentity": identity}
  finally: await manager.close()
