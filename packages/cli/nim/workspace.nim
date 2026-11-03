## Per-invocation discovery, explicit binding, client preference and task policy.
## Retains the TypeScript envelope/selection distinction:
## a sole-app selection does not mutate boundApp or the envelope's projectId.
import std/[times, json, os, strutils, asyncdispatch, tables, algorithm]
import ./core, ./args, ./code_service, ./json_wire
import ./project_status, ./command_probe
import ./host_client, ./contract_failure, ./target_discovery, ./diagnostic_selection
import ./session_history
import ./docs_compute, ./docs_snapshots, ./inference_assets

const scopes = ["workspace", "runtime-actions", "visual-capture", "evidence-retain", "external-effects"]
const taskNote = "Covered by the task authorization the developer already gave; not re-requested per tool call."
type WorkspaceContext = object
  root, client, selector, reason: string
  discovery, boundApp: JsonNode

proc isoNow(): string = now().utc.format("yyyy-MM-dd'T'HH:mm:ss'.'fff'Z'")
proc hasValue(n: JsonNode): bool = n != nil and n.kind != JNull
proc cacheDir(root: string): string = root / "node_modules/.cache/xplat/agent"
proc safeClient(client: string): bool =
  if client.len < 1 or client.len > 64: return false
  for ch in client:
    if ch notin {'a'..'z','A'..'Z','0'..'9','_','-'}: return false
  true
proc preferenceJson(node: JsonNode): string =
  # std/json pretty() accepts an indentation width, not an indentation char.
  var lines: seq[string]
  for line in wireJson(node,pretty=true,indent=1).splitLines():
    var prefix = 0
    while prefix < line.len and line[prefix] == ' ': inc prefix
    lines.add(repeat('\t', prefix) & line[prefix..^1])
  lines.join("\n") & "\n"
proc preference(root, client: string): JsonNode =
  if not safeClient(client): return nil
  let saved = readJson(cacheDir(root) / (client & ".json"))
  let id = field(saved, "appId")
  if id != nil and id.kind == JString: return saved
  nil
proc selectedApps(context: WorkspaceContext, selector: string): JsonNode =
  result = newJArray()
  for app in context.discovery["apps"]:
    if app["id"] == %selector or app["relativeRoot"] == %selector or app["name"] == %selector:
      result.add(app)
proc makeContext(values: JsonNode): WorkspaceContext =
  result.root = if hasValue(field(values,"project")): normalizedPath(absolutePath(text(values["project"]))) else: getCurrentDir()
  result.client = if hasValue(field(values,"client")): text(values["client"]) else: getEnv("XPLAT_AGENT_CLIENT", "default")
  if result.client == "" and not hasValue(field(values,"client")): result.client = "default"
  let explicit = text(field(values,"app"))
  let saved = if explicit != "": nil else: preference(result.root, result.client)
  result.selector = if hasValue(field(values,"app")): explicit else: text(field(saved,"appId"))
  result.discovery = discover(result.root)
  if result.selector != "":
    let matches = selectedApps(result, result.selector)
    if matches.len == 1:
      result.boundApp = matches[0]
      result.reason = if explicit != "": "explicit" elif saved != nil: "preference" else: "configured"
proc selection(context: WorkspaceContext): JsonNode =
  if context.boundApp != nil:
    return %*{"state": "bound", "app": context.boundApp, "reason": context.reason}
  let apps = context.discovery["apps"]
  if context.selector != "": return %*{"state": "ambiguous", "candidates": apps}
  if apps.len == 0: return %*{"state": "none", "reason": "no-apps"}
  if apps.len == 1: return %*{"state": "bound", "app": apps[0], "reason": "sole-app"}
  %*{"state": "ambiguous", "candidates": apps}
proc envelopeContext(context: WorkspaceContext, name: string, values: JsonNode): JsonNode =
  result = %*{"command": name, "projectId": newJNull()}
  if truthy(field(values,"platform")): result["platform"] = values["platform"]
  if context.boundApp != nil:
    result["projectId"] = context.boundApp["id"]
    result["selection"] = %*{"state": "bound", "appId": context.boundApp["id"], "reason": context.reason}
proc grantList(): JsonNode =
  result = newJArray()
  for scope in scopes:
    var extra = false
    for supplied in getEnv("XPLAT_PERMISSIONS").split(','):
      if jsTrim(supplied) == scope: extra = true
    if extra:
      result.add(%*{"revocable": true, "scope": scope, "state": "granted", "source": "server-config"})
    elif scope in ["workspace", "runtime-actions"]:
      result.add(%*{"scope": scope, "state": "granted", "source": "task-authorization", "grantedAt": isoNow(), "revocable": false, "note": taskNote})
    else: result.add(%*{"scope": scope, "state": "required", "revocable": true})
proc policyCheck(grant: JsonNode): JsonNode =
  if text(grant["state"]) == "granted": return %*{"granted": true}
  let scope = text(grant["scope"])
  let recovery = if scope == "visual-capture":
    %*{"action": "Ask the developer to approve visual capture for this task", "detail": "The developer can grant it through the agent client approval prompt, or by starting the server with the visual-capture scope (e.g. XPLAT_MCP_PERMISSIONS=visual-capture)."}
  else: %*{"action": "Ask the developer to grant this permission for the current task"}
  %*{"granted": false, "error": {"code": "permission_denied", "message": "Permission \"" & scope & "\" has not been granted.", "recovery": recovery, "context": {"scope": scope, "state": grant["state"]}}}
proc workspaceCommand*(name: string, values: JsonNode): JsonNode =
  if name notin ["app select", "permissions", "code read", "code search"]: return nil
  var context: WorkspaceContext
  try: context = makeContext(values)
  except CatchableError as error:
    return %*{"contractVersion": 1, "ok": false, "context": {"command": name, "projectId": newJNull()}, "error": {"code": "execution_failure", "message": "Workspace discovery failed: " & error.msg}}
  var payload: JsonNode
  var failure: JsonNode
  try:
    if name == "permissions":
      let grants = grantList()
      let requested = text(field(values,"scope"))
      if requested == "": payload = %*{"grants": grants}
      else:
        for grant in grants:
          if text(grant["scope"]) == requested: payload = %*{"grant": grant, "check": policyCheck(grant)}
    elif name == "app select":
      let requested = text(values["selector"])
      let matches = selectedApps(context, requested)
      if matches.len == 0:
        failure = %*{"code": "invalid_selection", "message": "No app matches \"" & requested & "\".", "recovery": {"action": "Pick an id from candidates, or check the workspace root."}, "context": {"candidates": context.discovery["apps"]}}
      elif matches.len > 1:
        failure = %*{"code": "ambiguous_selection", "message": "\"" & requested & "\" matches several apps.", "recovery": {"action": "Pass an exact app id from the candidates."}, "context": {"candidates": matches}}
      else:
        context.boundApp = matches[0]
        context.reason = "explicit"
        if not safeClient(context.client):
          # Reads already reject unsafe client names in the reference. Apply the
          # same scope boundary to writes so a client cannot escape the cache.
          failure = %*{"code": "invalid_selection", "message": "Client must contain 1–64 ASCII letters, digits, underscores or hyphens."}
        else:
          let path = cacheDir(context.root) / (context.client & ".json")
          createDir(cacheDir(context.root))
          writeFile(path, preferenceJson(%*{"client": context.client, "appId": context.boundApp["id"], "appName": context.boundApp["name"], "selectedAt": isoNow()}))
          payload = %*{"bound": context.boundApp, "reason": "explicit", "preference": {"client": context.client, "path": path}}
    else:
      let selected = context.selection()
      if text(selected["state"]) == "ambiguous":
        var candidates = newJArray()
        for app in selected["candidates"]: candidates.add(app["id"])
        failure = %*{"code": "ambiguous_selection",
          "message": "Several apps are detected — code retrieval targets the bound app and its installed packages, never a guessed one.",
          "recovery": {"action": "Bind an app first — `xplat app select` (CLI) or xplat_select_app (MCP)."},
          "context": {"candidates": candidates}}
      else:
        let options = values.copy()
        options["app"] = if text(selected["state"]) == "bound": selected["app"] else: newJNull()
        options["workspaceKind"] = context.discovery["workspace"]["kind"]
        let service = newCodeService(context.root)
        payload = if name == "code read": service.codeRead(options) else: service.codeSearch(options)
        if truthy(field(payload,"status")):
          var detail = field(payload,"detail")
          if detail == nil or detail.kind == JNull: detail = field(payload,"reason")
          if detail == nil or detail.kind == JNull: detail = payload["status"]
          var errorContext = newJObject()
          for key in ["status","reason","corpus","path"]:
            let value = field(payload,key)
            if value != nil: errorContext[key] = value
          failure = %*{"code": (if text(payload["status"]) == "unavailable": "unavailable" else: "invalid_selection"),
            "message": detail,"context": errorContext}
  except CatchableError as error:
    failure = %*{"code": "execution_failure", "message": error.msg}
  result = %*{"contractVersion": 1, "ok": failure == nil, "context": envelopeContext(context, name, values)}
  if failure != nil: result["error"] = failure
  else: result["data"] = payload
proc workspaceDocsCommand*(name: string, values: JsonNode): Future[JsonNode] {.async.} =
  var context: WorkspaceContext
  try: context = makeContext(values)
  except CatchableError as error:
    return %*{"contractVersion": 1,"ok": false,"context": {"command": name,"projectId": newJNull()},
      "error": {"code": "execution_failure","message": "Workspace discovery failed: " & error.msg}}
  result = %*{"contractVersion": 1,"ok": false,"context": envelopeContext(context,name,values)}
  try:
    let selected = context.selection()
    if name == "docs read" and not truthy(field(values,"ref")) and
        not (truthy(field(values,"package")) and truthy(field(values,"path"))):
      raise contractFailure("invalid_selection","Pass --ref from docs search, or --package with --path.",
        %*{"recovery": {"action": "Run `xplat docs search` to get a versioned ref."}})
    if text(selected["state"]) != "bound":
      raise contractFailure((if text(selected["state"]) == "ambiguous": "ambiguous_selection" else: "invalid_selection"),
        "Bind an app before retrieving docs.",%*{"recovery": {"action": "Bind an app first — `xplat app select` (CLI) or xplat_select_app (MCP)."}})
    # Native mutable/private data has its own namespace beside the reference
    # cache. Read/search/index share the exact same version-pinned snapshots.
    let operation = if name == "guidance": "service-guidance" else: "service-" & name[5..^1]
    result["data"] = await runNativeDocsCompute(%*{"operation": operation,"root": selected["app"]["root"],
      "cacheDir": nativeDocsCacheDir(),"assetRoot": nativeAssetRoot(),"options": values})
    result["ok"] = %true
  except CatchableError as error: result["error"] = failureData(error)

proc workspaceStatusCommand*(name: string, values, metadata: JsonNode): Future[JsonNode] {.async.} =
  var context: WorkspaceContext
  try: context = makeContext(values)
  except CatchableError as error:
    return %*{"contractVersion": 1,"ok": false,"context": {"command": name,"projectId": newJNull()},
      "error": {"code": "execution_failure","message": "Workspace discovery failed: " & error.msg}}
  result = %*{"contractVersion": 1,"ok": true,"context": envelopeContext(context,name,values)}
  try:
    let report = await buildNativeStatus(context.root,context.discovery,context.selection(),
      %*{"name": "@octane-xplat/cli","version": metadata["version"]},grantList(),
      metadata["capabilityIds"],metadata["boundaries"])
    if name == "status": result["data"] = report
    else:
      var matrices = newJArray()
      for matrix in report["capabilities"]:
        if not truthy(field(values,"platform")) or matrix["platform"] == values["platform"]: matrices.add(matrix)
      result["data"] = %*{"capabilities": matrices}
  except CatchableError as error:
    result["ok"] = %false
    result["error"] = %*{"code": (if error of ProbeCancelledError: "cancelled" else: "execution_failure"),"message": error.msg}

proc sessionApps(context: WorkspaceContext): JsonNode =
  if context.selector.len > 0 and context.boundApp == nil:
    raise contractFailure("invalid_selection","The selected app does not exist in this workspace.")
  let selected = context.selection()
  if selected["state"] == %"bound": %*[selected["app"]] else: context.discovery["apps"]

proc visibleSessions(context: WorkspaceContext, current: JsonNode, owner: string): JsonNode =
  let apps = context.sessionApps()
  var records = initTable[string,JsonNode]()
  for app in apps:
    for retained in listHistorySessions(context.root,app,owner): records[text(retained["sessionId"])] = retained
  for live in current:
    var allowed = false
    for app in apps:
      if app["id"] == live["appId"]: allowed = true
    if not allowed: continue
    let id = text(live["sessionId"])
    let merged = if records.hasKey(id): records[id].copy() else: newJObject()
    for key,value in live: merged[key] = value.copy()
    records[id] = merged
  var ordered: seq[JsonNode]
  for record in records.values: ordered.add(record)
  ordered.sort(proc(a,b: JsonNode): int =
    proc stamp(record: JsonNode): string =
      if field(record,"startedAt") != nil: text(record["startedAt"]) else: text(record["createdAt"])
    let order = cmp(stamp(b),stamp(a))
    if order == 0: cmp(text(a["sessionId"]),text(b["sessionId"])) else: order)
  result = newJArray()
  for record in ordered: result.add(record)

proc workspaceHostCommand*(name: string, values: JsonNode): Future[JsonNode] {.async.} =
  var context: WorkspaceContext
  try: context = makeContext(values)
  except CatchableError as error:
    return %*{"contractVersion": 1,"ok": false,"context": {"command": name,"projectId": newJNull()},"error": failureData(error)}
  result = %*{"contractVersion": 1,"ok": true,"context": envelopeContext(context,name,values)}
  try:
    if name == "diagnostics": validateDiagnosticSelection(values)
    var requestedApp: JsonNode
    if name in ["runtime build","session start","session attach","targets"] or (name == "diagnostics" and not truthy(field(values,"jobId"))):
      if name == "runtime build" and not truthy(field(values,"platform")): raise contractFailure("invalid_selection","--platform is required for a build.")
      if name == "session attach" and not truthy(field(values,"platform")): raise contractFailure("invalid_selection","--platform is required for attachment.")
      let selected = context.selection()
      if selected["state"] != %"bound":
        raise contractFailure((if context.selector.len == 0 and context.discovery["apps"].len > 1: "ambiguous_selection" else: "invalid_selection"),
          "Select an app. Pass --app or run from the app directory.")
      requestedApp = selected["app"]["id"]
    var host: HostConnection
    if name in ["runtime build","session start","session attach"]: host = await ensureNativeHost(context.root)
    else:
      try: host = await connectNativeHost(context.root)
      except ContractFailure as error:
        if text(error.detail["code"]) != "disconnected_runtime" or
            name notin ["session list","session status","session end","diagnostics"] or
            (name == "diagnostics" and truthy(field(values,"jobId"))): raise
    let owner = if host == nil: "" else: text(field(host.identity,"ownerId"))
    if name in ["session list","session status","session end"]:
      var current = newJArray()
      if host != nil:
        let reply = await host.callNativeHost("sessions.list",newJObject())
        if field(reply,"ok") != %true: raise contractFailure("disconnected_runtime","The native owner did not answer the session read.")
        current = reply["result"]["sessions"]
      var visible = newJArray()
      if name == "session end":
        # Known live ownership is sufficient. Unrelated retained corruption
        # must not prevent releasing this app's active session resources.
        let apps = context.sessionApps()
        for record in current:
          if record["sessionId"] != field(values,"sessionId"): continue
          for app in apps:
            if app["id"] == record["appId"]: visible.add(record)
      if visible.len == 0: visible = context.visibleSessions(current,owner)
      if name == "session list": result["data"] = %*{"sessions": visible}; return
      let id = text(field(values,"sessionId"))
      var selected: JsonNode
      for record in visible:
        if record["sessionId"] == %id: selected = record
      if selected == nil: raise contractFailure("not_found","No retained session with this id for the selected app.")
      if name == "session status": result["data"] = %*{"session": selected}; return
      var live = false
      for record in current:
        if record["sessionId"] == %id: live = true
      if not live:
        let confirmed = field(selected,"cleanupConfirmed") == %true
        result["data"] = %*{"result": {"sessionId": id,"ended": confirmed}}
        if not confirmed:
          result["data"]["result"]["note"] = %"Session owner is unavailable; retained diagnostics remain readable, but live process cleanup cannot be confirmed. No recorded PID was signalled."
        return
    if host == nil:
      if name == "targets":
        result["data"] = nativeTargetReport(context.selection()["app"],newJArray(),field(values,"platform")); return
      if name == "diagnostics" and not truthy(field(values,"jobId")):
        result["data"] = await historyDiagnostics(context.root,context.selection()["app"],values); return
      raise contractFailure("not_found","No agent runtime host is running — no sessions or jobs exist for this workspace.")
    var methodName: string
    var params = newJObject()
    case name
    of "session attach":
      methodName = "runtime.attach"
      for key in ["platform","targetId"]:
        if field(values,key) != nil: params[key] = values[key]
    of "targets": methodName = "sessions.list"
    of "session start":
      methodName = "runtime.launch"
      for key in ["target","requestKey","browserMode"]:
        if field(values,key) != nil: params[key] = values[key]
    of "runtime build":
      methodName = "runtime.build"
      params["platform"] = values["platform"]
      if field(values,"requestKey") != nil: params["requestKey"] = values["requestKey"]
    of "diagnostics":
      methodName = "runtime.readDiagnostics"
      for key in ["jobId","sessionId","reportId","cursor","limit","stream","platform"]:
        if field(values,key) != nil: params[key] = values[key]
    of "session list": methodName = "sessions.list"
    of "session status", "session end":
      methodName = if name == "session status": "sessions.get" else: "session.end"
      params["sessionId"] = values["sessionId"]
    of "job status", "job cancel":
      methodName = if name == "job status": "jobs.status" else: "jobs.cancel"
      params["jobId"] = values["jobId"]
    else: raise contractFailure("invalid_selection","Unknown native host command")
    var grants = newJArray()
    for grant in grantList():
      if text(grant["state"]) == "granted": grants.add(grant["scope"])
    let appId = if requestedApp != nil: requestedApp elif context.boundApp == nil: newJNull() else: context.boundApp["id"]
    let reply = await host.callNativeHost(methodName,params,appId,grants)
    if field(reply,"ok") != %true:
      result["ok"] = %false
      result["error"] = reply["error"]
    elif name == "targets": result["data"] = nativeTargetReport(context.selection()["app"],reply["result"]["sessions"],field(values,"platform"))
    else: result["data"] = reply["result"]
  except CatchableError as error:
    result["ok"] = %false
    result["error"] = failureData(error)

proc workspaceHuman*(name: string, payload: JsonNode): string =
  if name == "session attach": return "Attached session " & text(payload["session"]["sessionId"]) & " (" & text(payload["session"]["state"]) & ")\nOnly lifecycle events are captured; application output stays in its existing terminal."
  if name == "targets":
    var lines: seq[string]
    for platform in payload["platforms"]:
      lines.add(text(platform["platform"]) & (if truthy(field(platform,"reason")): ": " & text(platform["reason"]) else: ""))
      for target in platform["targets"]: lines.add("  " & text(target["targetId"]) & " — " & text(target["name"]) & (if target["busy"] == %true: " (busy)" else: ""))
    return lines.join("\n")
  if name == "session start": return "Session " & text(payload["session"]["sessionId"]) & " (" & text(payload["session"]["state"]) & ")\nPoll: xplat session status " & text(payload["session"]["sessionId"])
  if name == "runtime build":
    return "Build job " & text(payload["job"]["jobId"]) & " (" & text(payload["job"]["state"]) & ")\nPoll: xplat job status " & text(payload["job"]["jobId"])
  if name == "diagnostics":
    if field(payload,"report") != nil:
      let report = payload["report"]
      return text(report["id"]) & " — " & text(report["kind"]) & " (" & text(report["association"]) & ")\n" & text(report["content"])
    if field(payload,"sessions") != nil:
      var lines = @[text(payload["note"])]
      for session in payload["sessions"]: lines.add(text(session["sessionId"]) & " — " & text(session["platform"]) & " (" & text(session["state"]) & ")")
      if payload["sessions"].len == 0: lines.add("No retained sessions.")
      return lines.join("\n")
    let native = payload["coverage"]["nativeReports"]
    var lines = @["Native reports: " & text(native["status"]) & ". " & text(native["detail"])]
    for report in payload["reports"]:
      lines.add(text(report["id"]) & " — " & text(report["kind"]) & " (" & text(report["association"]) & "): " & text(report["summary"]))
    for record in payload["logs"]["records"]: lines.add("[" & text(record["stream"]) & "] " & text(record["line"]))
    if payload["logs"]["records"].len == 0: lines.add("No records.")
    return lines.join("\n")
  if name == "session list":
    var lines: seq[string]
    for session in payload["sessions"]:
      lines.add(text(session["sessionId"]) & " — " & text(session["platform"]) & " on " & text(session["targetId"]) &
        " (" & text(session["ownership"]) & ", " & text(session["state"]) & ")")
    return if lines.len == 0: "No retained sessions." else: lines.join("\n")
  if name == "session status": return wireJson(payload["session"],pretty=true)
  if name in ["job status","job cancel"]: return wireJson(payload["job"],pretty=true)
  if name == "session end":
    let ended = payload["result"]
    var lines = @[text(ended["sessionId"]) & ": " & (if ended["ended"].getBool(): "ended" elif truthy(field(ended,"note")): "cleanup not confirmed" else: "not found")]
    for key in ["released","preserved"]:
      let items = field(ended,key)
      if items != nil:
        for item in items: lines.add("  " & key & ": " & text(item))
    if truthy(field(ended,"note")): lines.add(text(ended["note"]))
    return lines.join("\n")
  if name == "status":
    var lines = @["Workspace: " & text(payload["identity"]["workspace"]["root"]) & " (" & text(payload["identity"]["workspace"]["kind"]) & ")",
      "Server: " & text(payload["server"]["name"]) & "@" & text(payload["server"]["version"])]
    let selected = payload["identity"]["selection"]
    case text(selected["state"])
    of "bound": lines.add("App: " & scalarString(selected["app"]["id"]) & " (" & scalarString(selected["app"]["name"]) & ") — " & scalarString(selected["reason"]))
    of "ambiguous":
      var candidates: seq[string]
      for app in selected["candidates"]: candidates.add(scalarString(app["id"]))
      lines.add("App: ambiguous — candidates: " & candidates.join(", "))
    else: lines.add("App: none detected (" & scalarString(selected["reason"]) & ")")
    let framework = field(payload["identity"],"framework")
    if framework != nil and framework.kind != JNull:
      for package in framework["packages"]:
        let version = field(package,"version")
        lines.add("  " & scalarString(package["name"]) & "@" & (if version == nil or version.kind == JNull: "?" else: scalarString(version)) & " (" & scalarString(package["source"]) & ")")
    lines.add("Docs: " & text(payload["docs"]["state"]) & " — " & text(payload["docs"]["detail"]))
    lines.add("Code: " & text(payload["codeIndex"]["state"]) & " — " & text(payload["codeIndex"]["detail"]))
    for prerequisite in payload["prerequisites"]:
      if text(prerequisite["status"]) == "missing": lines.add("Missing: " & text(prerequisite["name"]) & " — " & text(prerequisite["remedy"]))
    for step in payload["nextSteps"]: lines.add("Next: " & text(step))
    return lines.join("\n")
  if name == "capabilities":
    var lines: seq[string]
    for matrix in payload["capabilities"]:
      lines.add(text(matrix["platform"]) & (if matrix["declared"].getBool(): ":" else: " (not declared):"))
      for capability in matrix["capabilities"]:
        var line = "  " & text(capability["capability"]) & ": " & text(capability["status"])
        if truthy(field(capability,"detail")): line.add(" — " & text(capability["detail"]))
        lines.add(line)
    return lines.join("\n")
  if name == "docs index":
    var lines: seq[string]
    for entry in payload["results"]:
      var line = text(field(entry["provenance"],"package")) & ": " & text(entry["status"])
      if truthy(field(entry,"reason")): line.add(" (" & text(entry["reason"]) & ")")
      else: line.add(" — " & $entry["chunks"].getInt() & " chunks, " & $entry["embedded"].getInt() & " new embeddings")
      lines.add(line)
    for entry in payload["unavailable"]:
      lines.add("unavailable: " & text(if field(entry,"reason") == nil: field(entry,"status") else: entry["reason"]))
    return lines.join("\n")
  if name == "docs search":
    var lines: seq[string]
    for retrieval in payload["retrieval"]:
      var line = text(retrieval["package"]) & ": " & text(retrieval["used"])
      if truthy(field(retrieval,"reason")): line.add(" (" & text(retrieval["reason"]) & "; run xplat docs index)")
      lines.add(line)
    for hit in payload["results"]:
      let provenance = hit["provenance"]
      var label = " [" & text(if field(provenance,"servedVersion") == nil: field(provenance,"source") else: provenance["servedVersion"])
      if truthy(field(provenance,"match")): label.add(", " & text(provenance["match"]))
      if truthy(field(provenance,"offline")): label.add(", offline")
      label.add("]")
      lines.add(text(hit["title"]) & " — " & text(hit["path"]) & label)
      lines.add("  ref: " & text(hit["ref"]))
    for entry in payload["unavailable"]:
      let package = field(field(entry,"provenance"),"package")
      lines.add("unavailable: " & text(if package == nil: field(entry,"package") else: package) & " — " & text(entry["reason"]))
    if payload["results"].len == 0: lines.add("No hits.")
    return lines.join("\n")
  if name == "docs read":
    if truthy(field(payload,"status")): return text(payload["status"]) & ": " & text(field(payload,"reason"))
    let provenance = field(payload,"provenance")
    var label = ""
    if truthy(provenance):
      let version = field(provenance,"servedVersion")
      label = " [" & scalarString(if version == nil or version.kind == JNull: field(provenance,"source") else: version)
      if truthy(field(provenance,"match")): label.add(", " & scalarString(provenance["match"]))
      if truthy(field(provenance,"offline")): label.add(", offline")
      label.add("]")
    return text(field(payload,"ref")) & label & "\n" & text(field(payload,"content"))
  if name == "guidance":
    var lines: seq[string]
    for entry in payload["entries"]: lines.add(text(entry["title"]) & ": ")
    return lines.join("\n")
  if name == "app select":
    return "Bound " & text(payload["bound"]["id"]) & " (" & text(payload["bound"]["name"]) & ") — preference saved for client \"" & text(payload["preference"]["client"]) & "\""
  if name == "code read":
    return text(payload["path"]) & " (" & text(payload["corpus"]) & ")\n" & text(payload["content"])
  if name == "code search":
    var lines: seq[string]
    for hit in payload["results"]:
      lines.add(text(hit["corpus"]) & ":" & text(hit["path"]) & ":" & $hit["line"] & " — " & jsTrim(text(hit["excerpt"]).split('\n')[0]))
      lines.add("  ref: " & text(hit["ref"]))
    return if lines.len == 0: "No hits." else: lines.join("\n")
  var grants = field(payload,"grants")
  if grants == nil: grants = %*[payload["grant"]]
  var lines: seq[string]
  for grant in grants:
    var line = text(grant["scope"]) & ": " & text(grant["state"])
    if truthy(field(grant,"note")): line.add(" — " & text(grant["note"]))
    lines.add(line)
  let check = field(payload,"check")
  if check != nil and not check["granted"].getBool(): lines.add("Check: " & text(check["error"]["message"]))
  lines.join("\n")
