## Per-request app selection and native ownership around project-installed engines.
import std/[json, os, asyncdispatch, tables, options, math]
import ./agent_host, ./runtime_build, ./runtime_logs, ./jobs, ./managed_process, ./core, ./contract_failure
import ./sessions, ./macos_session, ./host_storage, ./diagnostic_selection

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
    raise contractFailure("invalid_selection","No app is bound. Select an app.")
  raise contractFailure("ambiguous_selection","Multiple apps are available. Pass --app to select an app.")

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
  var sessionRuns = initOrderedTable[string,OwnedDevRun]()
  var launchKeys = initTable[string,JsonNode]()
  result = proc(host: NativeHost, request: JsonNode): Future[JsonNode] {.async.} =
    let methodName = text(request["method"])
    let params = request["params"]
    case methodName
    of "runtime.launch":
      for key in params.keys:
        if key notin ["target","requestKey","browserMode"]: raise contractFailure("invalid_selection","Unknown launch option: " & key)
      requireRuntimeGrant(request)
      let app = selectedApp(root,request)
      let selector = field(params,"target")
      if selector != nil and selector.kind notin [JNull,JString]:
        raise contractFailure("invalid_selection","Expected a target id or platform name")
      var declared = false
      for platform in app["platforms"]:
        if platform == %"macos": declared = true
      if not truthy(selector) and app["platforms"].len > 1:
        raise contractFailure("ambiguous_selection","This app declares several platforms. Select an explicit target, for example: xplat session start macos.")
      if not declared or (truthy(selector) and selector != %"macos"):
        raise contractFailure("invalid_selection","Select the macos target declared by this app; other native launch engines are pending.")
      when not defined(macosx): raise contractFailure("unavailable","macOS development requires a Mac")
      if field(params,"browserMode") != nil: raise contractFailure("invalid_selection","--browser-mode applies to web sessions")
      let key = field(params,"requestKey")
      if key != nil and key.kind notin [JNull,JString]: raise contractFailure("invalid_selection","requestKey must be a string")
      for current in host.sessions.listSessions():
        if current["appId"] == app["id"] and current["platform"] == %"macos" and text(current["state"]) notin ["stopped","failed"]:
          let id = text(current["sessionId"])
          if sessionRuns.hasKey(id) and sessionRuns[id].launching:
            let previous = launchKeys.getOrDefault(id)
            if not truthy(key) or not truthy(previous) or key == previous:
              return %*{"session": current,"deduplicated": true}
          raise contractFailure("target_busy","A live session already owns this app's macos target.",%*{"context": {"sessionId": id}})
      let logs = newRuntimeLogs()
      let run = newOwnedDevRun(logs)
      let cleanup: SessionCleanup = proc(): Future[JsonNode] {.async.} = return await run.stopDevRun()
      let session = host.sessions.bindOwnedSession(%*{"appId": app["id"],"platform": "macos","targetId": "macos",
        "detail": "launch on macOS development host"},cleanup)
      let id = text(session["sessionId"])
      var retired: seq[string]
      for old, entry in sessionRuns:
        if entry.devRunFinished(): retired.add(old)
      for old in retired:
        if sessionRuns.len < 40: break
        sessionRuns[old].forgetDevLogs()
        sessionRuns.del(old)
        launchKeys.del(old)
      sessionRuns[id] = run
      launchKeys[id] = if key == nil: newJNull() else: key.copy()
      host.sessions.setSessionLaunch(id,%*{"phase": "starting"})
      run.startDevRun(host.sessions,app,session,hostPaths(root).directory / "sessions")
      return %*{"session": host.sessions.getSession(id),"deduplicated": false}
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
      if platform notin [%"web",%"macos"]: raise contractFailure("unavailable","Native " & platform.getStr() & " build engine integration is pending.")
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
      validateDiagnosticSelection(params)
      let id = field(params,"jobId")
      let sessionId = field(params,"sessionId")
      var selected: JsonNode
      if not truthy(id): selected = selectedApp(root,request)
      if not truthy(id) and not truthy(sessionId):
        var records = newJArray()
        for record in host.sessions.listSessions():
          if record["appId"] == selected["id"] and
              (not truthy(field(params,"platform")) or record["platform"] == params["platform"]): records.add(record)
        return %*{"sessions": records,"note": "Select --session SESSION_ID to read logs. Native captures currently last only while the workspace host lives."}
      var capture: RuntimeLogs
      if sessionId != nil and sessionId.kind == JString and sessionRuns.hasKey(sessionId.getStr()):
        let session = host.sessions.getSession(sessionId.getStr())
        if session["appId"] != selected["id"]: raise contractFailure("not_found","No retained capture for this session in the selected app")
        if truthy(field(params,"platform")) and session["platform"] != params["platform"]:
          raise contractFailure("invalid_selection","The selected run belongs to another platform.")
        capture = sessionRuns[sessionId.getStr()].logs
      elif id != nil and id.kind == JString and captures.hasKey(id.getStr()):
        capture = captures[id.getStr()]
      if capture == nil:
        raise contractFailure("not_found","No retained log capture for this job or session. Capture history is bounded.")
      var cursor = none(int)
      let fromSeq = field(params,"cursor")
      if fromSeq != nil:
        cursor = some(integral(fromSeq,0,9007199254740991,0))
      let limit = integral(field(params,"limit"),1,5000,500)
      let stream = field(params,"stream")
      if stream != nil and stream notin [%"stdout",%"stderr",%"lifecycle"]: raise contractFailure("invalid_selection","Invalid log stream.")
      let logs = capture.readLogs(cursor,limit,text(stream))
      var payload = %*{"logs": logs,"reports": [],"coverage": {"logs": "captured","nativeReports": {"status": "unavailable",
        "detail": (if sessionId != nil: "Native report lookup for development sessions is pending." else: "Build jobs have output captures but no development session or native report lookup.")}}}
      if truthy(sessionId):
        payload["sessionId"] = sessionId
        payload["session"] = host.sessions.getSession(sessionId.getStr())
      return payload
    else: raise contractFailure("invalid_selection","Unknown native runtime method.")
