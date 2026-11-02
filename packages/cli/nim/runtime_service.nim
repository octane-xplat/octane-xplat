## Per-request app selection and native ownership around project-installed engines.
import std/[json, os, asyncdispatch, tables, options, math]
import ./agent_host, ./runtime_build, ./runtime_logs, ./jobs, ./managed_process, ./core, ./contract_failure

proc selectedApp(root: string, request: JsonNode): JsonNode =
  let inventory = discover(root)
  let id = field(request,"appId")
  if id != nil and id.kind != JNull:
    if id.kind != JString or id.getStr().len == 0: raise contractFailure("invalid_selection","A nonempty appId is required.")
    for app in inventory["apps"]:
      if app["id"] == id: return app
    raise contractFailure("invalid_selection","The requested app no longer exists in this workspace.")
  if inventory["apps"].len == 1: return inventory["apps"][0]
  if inventory["apps"].len == 0:
    raise contractFailure("invalid_selection","No app is bound. Select an app before building.")
  raise contractFailure("ambiguous_selection","Multiple apps are available. Pass --app to select the app to build.")

proc requireRuntimeGrant(request: JsonNode) =
  let grants = field(request,"grants")
  if grants != nil and grants.kind == JArray:
    for grant in grants:
      if grant == %"runtime-actions": return
  raise contractFailure("permission_denied","Permission \"runtime-actions\" has not been granted for this request.")

proc integral(node: JsonNode, minimum, maximum, default: int): int =
  if node == nil: return default
  if node.kind notin [JInt,JFloat]: raise contractFailure("invalid_selection","Expected an integer log selection.")
  let value = node.getFloat()
  if classify(value) in {fcNan,fcInf,fcNegInf} or floor(value) != value or value < float(minimum) or value > float(maximum):
    raise contractFailure("invalid_selection","Integer log selection is outside its bounds.")
  int(value)

proc runtimeDispatcher*(workspace: string, buildTimeoutMs = 900000): NativeHostDispatch =
  let root = expandFilename(absolutePath(workspace))
  var captures = initOrderedTable[string,RuntimeLogs]()
  result = proc(host: NativeHost, request: JsonNode): Future[JsonNode] {.async.} =
    let methodName = text(request["method"])
    let params = request["params"]
    case methodName
    of "runtime.build":
      requireRuntimeGrant(request)
      let app = selectedApp(root,request)
      let platform = field(params,"platform")
      if platform == nil or platform.kind != JString or platform.getStr().len == 0:
        raise contractFailure("invalid_selection","--platform is required for a build.")
      var declared = false
      for value in app["platforms"]:
        if value == platform: declared = true
      if not declared: raise contractFailure("invalid_selection","The selected app does not declare the requested platform.")
      if platform != %"web": raise contractFailure("unavailable","Native " & platform.getStr() & " build engine integration is pending.")
      let key = field(params,"requestKey")
      if key != nil and key.kind notin [JNull,JString]: raise contractFailure("invalid_selection","requestKey must be a string.")
      let logs = newRuntimeLogs()
      let runner: JobRunner = proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.async.} =
        return await runProjectBuild(app,platform.getStr(),logs,signal,progress,buildTimeoutMs)
      let input = %*{"kind": "build"}
      if field(params,"requestKey") != nil: input["requestKey"] = params["requestKey"]
      let started = host.jobs.startJob(input,runner,scope=text(app["id"]) & "\0" & platform.getStr())
      if started["deduplicated"] == %false:
        captures[text(started["job"]["jobId"])] = logs
        while captures.len > 40:
          var oldest: string
          for key in captures.keys: oldest = key; break
          captures.del(oldest)
      return started
    of "runtime.readDiagnostics":
      let id = field(params,"jobId")
      if id == nil or id.kind != JString or not captures.hasKey(id.getStr()):
        raise contractFailure("not_found","No retained log capture for this job. Job log history is bounded.")
      var cursor = none(int)
      let fromSeq = field(params,"cursor")
      if fromSeq != nil:
        cursor = some(integral(fromSeq,0,9007199254740991,0))
      let limit = integral(field(params,"limit"),1,5000,500)
      let stream = field(params,"stream")
      if stream != nil and stream notin [%"stdout",%"stderr",%"lifecycle"]: raise contractFailure("invalid_selection","Invalid log stream.")
      let logs = captures[id.getStr()].readLogs(cursor,limit,text(stream))
      return %*{"logs": logs,"reports": [],"coverage": {"logs": "captured","nativeReports": {"status": "unavailable",
        "detail": "Build jobs have output captures but no development session or native report lookup."}}}
    else: raise contractFailure("invalid_selection","Unknown native runtime method.")
