## Per-invocation discovery, explicit binding, client preference and task policy.
## Retains the TypeScript envelope/selection distinction:
## a sole-app selection does not mutate boundApp or the envelope's projectId.
import std/[times, json, os, strutils]
import ./core, ./args

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
  for line in node.pretty(indent=1).splitLines():
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
  if name notin ["app select", "permissions"]: return nil
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
  except CatchableError as error:
    failure = %*{"code": "execution_failure", "message": error.msg}
  result = %*{"contractVersion": 1, "ok": failure == nil, "context": envelopeContext(context, name, values)}
  if failure != nil: result["error"] = failure
  else: result["data"] = payload
proc workspaceHuman*(name: string, payload: JsonNode): string =
  if name == "app select":
    return "Bound " & text(payload["bound"]["id"]) & " (" & text(payload["bound"]["name"]) & ") — preference saved for client \"" & text(payload["preference"]["client"]) & "\""
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
