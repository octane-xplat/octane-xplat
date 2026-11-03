## Native discovery, policy, queues and outcomes around an authenticated app bridge.
## JavaScript field/RegExp validation is a selected-project worker operation.
import std/[os, json, asyncdispatch, tables, monotimes, times, strutils, math]
import ./jsonutil, ./json_wire, ./js_text, ./jobs, ./managed_process, ./native_identity
import ./actions_bridge, ./action_endpoints, ./native_http, ./build_worker, ./contract_failure, ./digests

type
  ActionEntry = ref object
    endpoint, announcement: JsonNode
    seen: MonoTime
    gone: bool
  ActionInvocation = object
    public: JsonNode
    root, action, requestKey, fingerprint: string
  ActionQueue = ref object
    running: bool
    waiting: seq[string]
  ActionAdmission = ref object
    signal: ProcessCancel
    completion: Future[void]
  ActionValidator* = proc(root, phase: string, action, value: JsonNode, signal: ProcessCancel): Future[JsonNode] {.closure.}
  ActionService* = ref object
    jobs: JobRegistry
    client: HttpClient
    fetch: BridgeFetch
    validate: ActionValidator
    entries: OrderedTable[string,ActionEntry]
    invocations: OrderedTable[string,ActionInvocation]
    queues: Table[string,ActionQueue]
    admissions: Table[string,ActionAdmission]
    closing: bool

proc nullable(value: JsonNode): JsonNode =
  if value == nil: newJNull() else: value

proc nativeActionValidation(root, phase: string, action, value: JsonNode, signal: ProcessCancel): Future[JsonNode] {.async.} =
  let response = await runBuildWorker(root,"action-validate",%*{"phase": phase,"action": action,"value": nullable(value)},5000,signal)
  if field(response,"declaration") == nil or response["declaration"].kind != JArray:
    raise contractFailure("execution_failure","Invalid project action validator response")
  for error in response["declaration"]:
    if error.kind != JString: raise contractFailure("execution_failure","Invalid action declaration diagnostics")
  if response["declaration"].len > 0:
    raise contractFailure("unavailable","The app announced an invalid action declaration.",%*{"context": {"errors": response["declaration"]}})
  let checked = field(response,"checked")
  if checked == nil or checked.kind != JObject or field(checked,"ok") == nil or checked["ok"].kind != JBool:
    raise contractFailure("execution_failure","Invalid project action validation result")
  if checked["ok"] == %true and (field(checked,"value") == nil or checked["value"].kind != JObject):
    raise contractFailure("execution_failure","Action validator omitted its checked object")
  if checked["ok"] == %false:
    if field(checked,"errors") == nil or checked["errors"].kind != JArray:
      raise contractFailure("execution_failure","Action validator omitted diagnostics")
    for error in checked["errors"]:
      if error.kind != JString: raise contractFailure("execution_failure","Invalid action validator diagnostic")
  return checked.copy()

proc newActionService*(jobs: JobRegistry, fetch: BridgeFetch = nil, validate: ActionValidator = nil): ActionService =
  result = ActionService(jobs: jobs,fetch: fetch,validate: validate)
  if result.fetch == nil:
    result.client = newHttpClient()
    let client = result.client
    result.fetch = proc(url: string, settings: HttpOptions): Future[HttpResponse] = native_http.fetch(client,url,settings)
  if result.validate == nil: result.validate = nativeActionValidation
proc closeActionService*(service: ActionService) =
  if service != nil:
    service.closing = true
    if service.client != nil: service.client.close()

proc shutdownActionService*(service: ActionService): Future[void] {.async.} =
  if service == nil: return
  service.closing = true
  var pending: seq[ActionAdmission]
  for admission in service.admissions.values: pending.add(admission)
  for admission in pending: admission.signal.cancel()
  try:
    for admission in pending: await admission.completion
  finally: service.closeActionService()

proc bridgeFor(entry: ActionEntry): BridgeEndpoint =
  BridgeEndpoint(url: text(entry.endpoint["url"]),token: text(entry.endpoint["token"]))
proc entryKey(server, instance: JsonNode): string = text(server) & "/" & text(instance)
proc belongs(entry: ActionEntry, app: JsonNode): bool = sameActionRoot(text(entry.endpoint["appRoot"]),text(app["root"]))
proc validAnnouncement(value: JsonNode): bool =
  if value == nil or value.kind != JObject or field(value,"protocol") != %"xplat-dev-actions" or
      (field(value,"version") != nil and field(value,"version") != %1): return false
  for key in ["appInstanceId","platform","announcedAt"]:
    if field(value,key) == nil or value[key].kind != JString: return false
  let id = text(value["appInstanceId"])
  if id.len notin 1..256 or id.contains({'/','\0'}): return false
  let revision = field(value,"revision")
  if revision == nil or revision.kind notin [JInt,JFloat]: return false
  let number = revision.getFloat()
  if classify(number) in {fcNan,fcInf,fcNegInf} or number < 0 or number > 9007199254740991.0 or floor(number) != number: return false
  let actions = field(value,"actions")
  if actions == nil or actions.kind != JArray or actions.len > 1000: return false
  var ids = newJObject()
  for action in actions:
    if action.kind != JObject or field(action,"id") == nil or action["id"].kind != JString or text(action["id"]).len notin 2..128: return false
    let id = text(action["id"])
    if ids.hasKey(id): return false
    ids[id] = %true
  true

proc actionAvailability(action: JsonNode, platform: JsonNode): JsonNode =
  let availability = field(action,"availability")
  let platforms = field(availability,"platforms")
  if platforms != nil and platforms.kind == JArray and platform notin platforms:
    return %*{"ready": false,"reason": "not applicable on " & text(platform)}
  if field(availability,"ready") == %false:
    let reason = field(availability,"reason")
    return %*{"ready": false,"reason": (if reason == nil or reason.kind == JNull: %"reported unavailable by the app" else: reason)}
  %*{"ready": true}

proc refreshEndpoint(service: ActionService, found: JsonNode, signal: HttpCancel): Future[JsonNode] {.async.} =
  let server = found["serverId"]
  let registry = await fetchBridgeRegistry(service.fetch,BridgeEndpoint(url: text(found["url"]),token: text(found["token"])),signal)
  for entry in service.entries.values:
    if entry.endpoint["serverId"] == server and sameActionRoot(text(entry.endpoint["appRoot"]),text(found["appRoot"])): entry.gone = true
  if field(registry,"ok") != %true:
    return %*{"reachable": false,"error": nullable(field(registry,"error")),"announced": 0}
  let announcements = field(field(registry,"data"),"instances")
  if announcements == nil or announcements.kind != JArray or announcements.len > 1000:
    return %*{"reachable": false,"error": {"code": "invalid_registry","message": "Invalid development registry response"},"announced": 0}
  var count = 0
  for announcement in announcements:
    if not validAnnouncement(announcement): continue
    let key = entryKey(server,announcement["appInstanceId"])
    if not service.entries.hasKey(key) and service.entries.len >= 1000:
      var oldest = ""
      for name, entry in service.entries:
        if entry.gone: oldest = name; break
      if oldest != "": service.entries.del(oldest)
      else: raise contractFailure("unavailable","Native development instance history exceeds 1000 entries; no instance was selected.")
    service.entries[key] = ActionEntry(endpoint: found.copy(),announcement: announcement.copy(),seen: getMonoTime())
    inc count
  return %*{"reachable": true,"announced": count}

proc watchRefresh(signal: ProcessCancel, abort, done: HttpCancel): Future[void] {.async.} =
  while not done.cancelled:
    if (signal != nil and signal.cancelled) or interruptedSignal() != 0: abort.cancel(); return
    await sleepAsync(5)

proc refresh(service: ActionService, app: JsonNode, signal: ProcessCancel = nil): Future[JsonNode] {.async.} =
  if (signal != nil and signal.cancelled) or interruptedSignal() != 0: raise contractFailure("cancelled","Development action discovery cancelled")
  let found = scanActionEndpoints(text(app["root"]))
  var servers: seq[string]
  for item in found: servers.add(text(item["serverId"]))
  for entry in service.entries.values:
    if entry.belongs(app) and text(entry.endpoint["serverId"]) notin servers: entry.gone = true
  var pending: seq[Future[JsonNode]]
  let abort = newHttpCancel()
  let done = newHttpCancel()
  let monitor = watchRefresh(signal,abort,done)
  try:
    for item in found: pending.add(service.refreshEndpoint(item,abort))
    let results = await all(pending)
    if abort.cancelled: raise contractFailure("cancelled","Development action discovery cancelled")
    return %*{"count": found.len,"results": results}
  finally:
    done.cancel()
    await monitor

proc publicInstance(key: string, entry: ActionEntry): JsonNode =
  result = %*{"key": key,"appInstanceId": entry.announcement["appInstanceId"],"serverId": entry.endpoint["serverId"],
    "appLabel": newJNull(),"platform": entry.announcement["platform"],"revision": entry.announcement["revision"],
    "announcedAt": entry.announcement["announcedAt"],"state": (if entry.gone: "disconnected" elif (getMonoTime()-entry.seen).inMilliseconds > 15000: "stale" else: "ready"),
    "location": newJNull(),"actions": newJArray()}
  for key in ["appLabel","location"]:
    if field(entry.announcement,key) != nil: result[key] = entry.announcement[key].copy()
  for action in entry.announcement["actions"]:
    let value = action.copy()
    value["liveAvailability"] = actionAvailability(action,entry.announcement["platform"])
    result["actions"].add(value)

proc listActions*(service: ActionService, app: JsonNode, signal: ProcessCancel = nil): Future[JsonNode] {.async.} =
  let observed = await service.refresh(app,signal)
  var live = newJArray()
  var disconnected = newJArray()
  for key,entry in service.entries:
    if not entry.belongs(app): continue
    let value = publicInstance(key,entry)
    if entry.gone:
      value["actionCount"] = %value["actions"].len
      value.delete("actions")
      disconnected.add(value)
    else: live.add(value)
  var unreachable = 0
  var messages: seq[string]
  for found in observed["results"]:
    if field(found,"reachable") != %true:
      inc unreachable
      messages.add(text(field(field(found,"error"),"message")))
  var state, detail: string
  if observed["count"].getInt() == 0 and live.len+disconnected.len == 0:
    state = "no-bridge"
    detail = "No development bridge is running for this app. Start the app in dev mode (xplat dev); the xplatDevBridge vite plugin ships in the xplatNative preset and the scaffolded web config."
  elif observed["count"].getInt() > 0 and unreachable == observed["count"].getInt():
    state = "bridge-unreachable"
    detail = "Dev-bridge session files exist but no endpoint answered (" & messages.join("; ") & ")."
  elif live.len == 0:
    state = "no-instance"
    detail = "A development bridge is reachable but no app instance has announced a registry — the app may not be running, or it did not start the dev-actions bridge."
  else: state = "live"
  result = %*{"state": state,"instances": live,"disconnected": disconnected}
  if detail != "": result["detail"] = %detail

proc requireActionGrant*(grants: JsonNode, scope: string) =
  if grants != nil and grants.kind == JArray:
    for grant in grants:
      if grant == %scope: return
  raise contractFailure("permission_denied","Permission \"" & scope & "\" has not been granted.",
    %*{"recovery": {"action": "Ask the developer to grant this permission for the current task"}})

proc selectEntry(service: ActionService, app, params: JsonNode): tuple[key: string, entry: ActionEntry] =
  var candidates: seq[tuple[key: string, entry: ActionEntry]]
  for key,entry in service.entries:
    if not entry.belongs(app): continue
    if truthy(field(params,"appInstanceId")):
      if entry.announcement["appInstanceId"] == params["appInstanceId"]: candidates.add((key,entry))
    elif not entry.gone: candidates.add((key,entry))
  if candidates.len == 0:
    if truthy(field(params,"appInstanceId")): raise contractFailure("not_found","No app instance \"" & text(params["appInstanceId"]) & "\".")
    raise contractFailure("unavailable","No live app instance announced a registry.",%*{"recovery": {"action": "Start the app in dev mode, then call xplat_dev_actions."}})
  if candidates.len > 1:
    var choices = newJArray()
    for candidate in candidates:
      choices.add(%*{"appInstanceId": candidate.entry.announcement["appInstanceId"],"platform": candidate.entry.announcement["platform"],"appLabel": nullable(field(candidate.entry.announcement,"appLabel"))})
    raise contractFailure("ambiguous_selection","Several app instances announced registries; invocation targets are never shared silently.",
      %*{"context": {"candidates": choices},"recovery": {"action": "Pass appInstanceId from xplat_dev_actions."}})
  let picked = candidates[0]
  if picked.entry.gone: raise contractFailure("disconnected_runtime","App instance \"" & text(picked.entry.announcement["appInstanceId"]) & "\" is disconnected; its last registry is historical.",%*{"retryable": true})
  # Freeze the token/registry validated by this admission across async workers.
  (picked.key,ActionEntry(endpoint: picked.entry.endpoint.copy(),announcement: picked.entry.announcement.copy(),seen: picked.entry.seen))

proc checkRevision(entry: ActionEntry, params: JsonNode) =
  let revision = field(params,"registryRevision")
  if revision != nil and not jsStrictEqual(revision,entry.announcement["revision"]):
    raise contractFailure("stale_identity","Registry revision " & scalarString(revision) & " is stale (current " & scalarString(entry.announcement["revision"]) & ").",
      %*{"retryable": true,"recovery": {"action": "Rediscover with xplat_dev_actions and invoke against the new revision."}})

proc liveJob(service: ActionService, id: string): bool =
  let job = service.jobs.jobStatus(id)
  text(field(job,"state")) in ["queued","running","cancelling"]

proc runQueued(service: ActionService, key: string, serialized: bool, signal: ProcessCancel,
    progress: JobProgress, work: proc(): Future[JsonNode] {.closure.}): Future[JsonNode] {.async.} =
  if not serialized: return await work()
  if not service.queues.hasKey(key): service.queues[key] = ActionQueue()
  let queue = service.queues[key]
  let ticket = freshId("wait_")
  queue.waiting.add(ticket)
  var acquired = false
  try:
    if queue.running or queue.waiting.len > 1: progress(%*{"phase": "queued","message": "serialized behind a running action"})
    while queue.running or queue.waiting[0] != ticket:
      if signal.cancelled: raise contractFailure("cancelled","Queued invocation was cancelled before dispatch.",%*{"context": {"outcome": "not-run"}})
      await sleepAsync(10)
    if signal.cancelled: raise contractFailure("cancelled","Queued invocation was cancelled before dispatch.",%*{"context": {"outcome": "not-run"}})
    queue.waiting.delete(0)
    queue.running = true
    acquired = true
    return await work()
  finally:
    if acquired: queue.running = false
    else:
      let at = queue.waiting.find(ticket)
      if at >= 0: queue.waiting.delete(at)
    if not queue.running and queue.waiting.len == 0: service.queues.del(key)

proc watchInvocation(signal: ProcessCancel, deadline: MonoTime, abort, done: HttpCancel): Future[void] {.async.} =
  while not done.cancelled:
    if signal.cancelled or getMonoTime() >= deadline: abort.cancel(); return
    await sleepAsync(5)

proc execute(service: ActionService, app: JsonNode, entry: ActionEntry, action, input: JsonNode,
    requestId: string, timeoutMs: int, signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.async.} =
  # A queued action must not run a stale registry after waiting for its slot.
  if signal.cancelled: raise contractFailure("cancelled","Invocation cancelled before dispatch.",%*{"context": {"outcome": "not-run"}})
  let registry = await fetchBridgeRegistry(service.fetch,bridgeFor(entry))
  var current: JsonNode
  let announced = field(field(registry,"data"),"instances")
  if announced != nil and announced.kind == JArray:
    for candidate in announced:
      if validAnnouncement(candidate) and candidate["appInstanceId"] == entry.announcement["appInstanceId"]: current = candidate
  if field(registry,"ok") != %true or current == nil:
    raise contractFailure("disconnected_runtime","The selected app instance disappeared before dispatch.",%*{"context": {"outcome": "not-run","requestId": requestId}})
  if not jsStrictEqual(current["revision"],entry.announcement["revision"]):
    raise contractFailure("stale_identity","The registry changed while this action waited; rediscover before invoking.",%*{"context": {"outcome": "not-run","requestId": requestId}})
  var currentAction: JsonNode
  for declaration in current["actions"]:
    if declaration["id"] == action["id"]: currentAction = declaration
  if currentAction == nil or currentAction != action:
    raise contractFailure("stale_identity","The action declaration changed before dispatch; rediscover before invoking.",%*{"context": {"outcome": "not-run","requestId": requestId}})
  if signal.cancelled: raise contractFailure("cancelled","Invocation cancelled before dispatch.",%*{"context": {"outcome": "not-run"}})
  let submitted = await submitInvocation(service.fetch,bridgeFor(entry),%*{"requestId": requestId,"appInstanceId": entry.announcement["appInstanceId"],
    "actionId": action["id"],"registryRevision": entry.announcement["revision"],"input": input})
  if field(submitted,"ok") != %true:
    let expired = field(submitted,"status") == %404 and field(field(submitted,"error"),"code") == %"not_found"
    raise contractFailure((if expired or field(field(submitted,"error"),"code") == %"unreachable": "disconnected_runtime" else: "execution_failure"),
      (if expired: "App instance expired before accepting the invocation. The action was not run." else: "Invocation was not delivered: " & text(field(field(submitted,"error"),"message")) & ". Its outcome is unknown — the app may have received it."),
      %*{"context": {"outcome": (if expired: "not-run" else: "unknown"),"requestId": requestId}})
  let acknowledgement = field(submitted,"data")
  if field(acknowledgement,"accepted") != %true or
      (field(acknowledgement,"requestId") != nil and acknowledgement["requestId"] != %requestId):
    raise contractFailure("execution_failure","The bridge returned an invalid invocation acknowledgement. Its outcome is unknown and was not retried.",
      %*{"context": {"outcome": "unknown","requestId": requestId}})
  progress(%*{"phase": "dispatched","message": "invocation " & requestId & " accepted by the dev bridge"})
  let deadline = getMonoTime()+initDuration(milliseconds=timeoutMs)
  let abort = newHttpCancel()
  let done = newHttpCancel()
  let monitor = watchInvocation(signal,deadline,abort,done)
  try:
    while getMonoTime() < deadline:
      let response = await awaitInvocation(service.fetch,bridgeFor(entry),requestId,
        float(min(25000,max(1000,(deadline-getMonoTime()).inMilliseconds))),abort)
      if signal.cancelled:
        if field(field(action,"execution"),"cancellable") == %true:
          discard await cancelInvocation(service.fetch,bridgeFor(entry),requestId)
          let grace = await awaitInvocation(service.fetch,bridgeFor(entry),requestId,5000)
          if field(grace,"ok") == %true and truthy(field(field(grace,"data"),"outcome")):
            return %*{"outcome": grace["data"]["outcome"],"outputValidation": "not-performed-after-cancellation"}
        return %*{"outcome": {"requestId": requestId,"status": "cancelled","partialEffects": ["cancellation was best-effort — the app may still have completed the action"],"completedAt": utcTimestamp()}}
      if getMonoTime() >= deadline: break
      if field(response,"ok") != %true:
        if field(response,"status") == %0:
          raise contractFailure("disconnected_runtime","Lost the dev bridge while \"" & text(action["id"]) & "\" was in flight. The outcome is unknown and was not retried.",%*{"context": {"outcome": "unknown","requestId": requestId}})
        await sleepAsync(10)
        continue
      let outcome = field(field(response,"data"),"outcome")
      if not truthy(outcome): await sleepAsync(5); continue
      if field(outcome,"requestId") != nil and outcome["requestId"] != %requestId:
        raise contractFailure("execution_failure","The bridge returned an outcome for another request. This invocation's outcome is unknown.",
          %*{"context": {"outcome": "unknown","requestId": requestId}})
      let status = text(field(outcome,"status"))
      if status == "unknown" and field(field(outcome,"error"),"code") == %"disconnected_runtime":
        raise contractFailure("disconnected_runtime","App instance stopped announcing. The outcome is unknown and was not retried.",%*{"context": {"outcome": "unknown","requestId": requestId,"partialEffects": nullable(field(outcome,"partialEffects"))}})
      if status == "succeeded":
        var checked: JsonNode
        try: checked = await service.validate(text(app["root"]),"output",action,field(outcome,"result"),signal)
        except CatchableError as error:
          raise contractFailure("execution_failure","The action ran but its result could not be validated. It was not undone.",%*{"context": {"validation": failureData(error),"partialEffects": (if field(outcome,"partialEffects") == nil: %*["unknown"] else: outcome["partialEffects"])}})
        if field(checked,"ok") != %true:
          raise contractFailure("execution_failure","Action \"" & text(action["id"]) & "\" ran but its output failed the declared result contract. The action was not undone.",
            %*{"context": {"errors": checked["errors"],"partialEffects": (if field(outcome,"partialEffects") == nil: %*["unknown"] else: outcome["partialEffects"])}})
        let validated = outcome.copy()
        validated["result"] = checked["value"]
        return %*{"outcome": validated}
      let partial = field(outcome,"partialEffects")
      if status == "failed":
        let error = field(outcome,"error")
        let code = text(field(error,"code"))
        let context = newJObject()
        if partial != nil: context["partialEffects"] = partial
        let failures = field(error,"failures")
        if failures != nil and failures.kind == JArray and failures.len > 0:
          context["failures"] = newJArray()
          for at in 0..<min(20,failures.len):
            let clean = newJObject()
            for key in ["handler","label","name","message","stack","sourceStack"]:
              let value = field(failures[at],key)
              if value != nil and value.kind == JString: clean[key] = value.copy()
            context["failures"].add(clean)
        raise contractFailure((if code in ["invalid_selection","stale_identity","cancelled","unavailable","target_busy","navigation_blocked","navigation_failed"]: code else: "execution_failure"),
          (if field(error,"message") == nil: "action failed" else: text(error["message"])),%*{"context": context})
      if status == "cancelled": raise contractFailure("cancelled","Action \"" & text(action["id"]) & "\" reported cancelled" & (if partial != nil and partial.kind == JArray and partial.len > 0: " after partial effects" else: "") & ".",%*{"context": {"partialEffects": nullable(partial)}})
      raise contractFailure("execution_failure","Action \"" & text(action["id"]) & "\" finished with an unknown outcome — check app state manually.",%*{"context": {"partialEffects": (if partial == nil: %*["unknown"] else: partial),"requestId": requestId}})
    discard await cancelInvocation(service.fetch,bridgeFor(entry),requestId)
    raise contractFailure("timeout","Action \"" & text(action["id"]) & "\" exceeded its " & $timeoutMs & "ms bound. Cancellation was requested; whether it ran is unknown.",%*{"context": {"outcome": "unknown","requestId": requestId}})
  finally:
    done.cancel()
    await monitor

proc admitAction(service: ActionService, app, params, grants: JsonNode, signal: ProcessCancel): Future[JsonNode] {.async.} =
  requireActionGrant(grants,"runtime-actions")
  for key in params.keys:
    if key notin ["appInstanceId","actionId","input","registryRevision","requestKey"]: raise contractFailure("invalid_selection","Unknown action invocation option: " & key)
  for key in ["actionId","appInstanceId","requestKey"]:
    let value = field(params,key)
    if value != nil and (value.kind != JString or text(value).len > 256 or '\0' in text(value)):
      raise contractFailure("invalid_selection","Action " & key & " must be a string of at most 256 bytes without NUL")
  if not truthy(field(params,"actionId")): raise contractFailure("invalid_selection","An action id is required.")
  discard await service.refresh(app,signal)
  let picked = service.selectEntry(app,params)
  let entry = picked.entry
  checkRevision(entry,params)
  var action: JsonNode
  for declaration in entry.announcement["actions"]:
    if declaration["id"] == params["actionId"]: action = declaration.copy()
  if action == nil: raise contractFailure("invalid_selection","No action \"" & text(params["actionId"]) & "\" in the live registry.")
  let availability = actionAvailability(action,entry.announcement["platform"])
  if availability["ready"] == %false:
    let platforms = field(field(action,"availability"),"platforms")
    if (platforms != nil and platforms.kind == JArray and entry.announcement["platform"] notin platforms) or not truthy(field(field(action,"availability"),"route")):
      raise contractFailure("unavailable","Action \"" & text(action["id"]) & "\" is unavailable: " & text(availability["reason"]) & ".",%*{"retryable": true})
  if truthy(field(field(action,"effects"),"externalEffects")): requireActionGrant(grants,"external-effects")
  let checked = await service.validate(text(app["root"]),"input",action,field(params,"input"),signal)
  if service.closing or signal.cancelled: raise contractFailure("cancelled","Action validation cancelled before dispatch.",%*{"context": {"outcome": "not-run"}})
  if field(checked,"ok") != %true:
    raise contractFailure("invalid_selection","Invalid input for \"" & text(action["id"]) & "\".",%*{"context": {"errors": checked["errors"]},"recovery": {"action": "Fix the input against the declared contract and retry."}})
  let input = checked["value"].copy()
  let root = expandFilename(text(app["root"]))
  let requestKey = text(field(params,"requestKey"))
  let fingerprint = sha256Hex(wireJson(%*{"revision": entry.announcement["revision"],"input": input}))
  var live = 0
  for id, meta in service.invocations:
    if text(meta.public["instanceKey"]) != picked.key or meta.root != root: continue
    let running = service.liveJob(id)
    if running: inc live
    if requestKey != "" and meta.requestKey == requestKey and meta.action == text(action["id"]):
      if meta.fingerprint != fingerprint: raise contractFailure("invalid_selection","This request key already identifies different action input or registry revision; use its existing job to inspect the outcome.")
      if running:
        return %*{"job": service.jobs.jobStatus(id),"deduplicated": true,"requestId": meta.public["requestId"],"action": {"id": action["id"],"title": action["title"]},"registryRevision": entry.announcement["revision"]}
  let serialized = field(field(action,"execution"),"concurrency") != %"overlap"
  if live >= (if serialized: 8 else: 16): raise contractFailure("target_busy","The invocation queue for this app instance is full (" & $live & " pending).",%*{"retryable": true})
  let identity = root & "\0" & picked.key & "\0" & text(action["id"]) & "\0" & requestKey
  let requestId = if requestKey == "": freshId("req_") else: "req_" & sha256Hex(identity)[0..<32]
  let declaredTimeout = field(field(action,"execution"),"timeoutMs")
  let timeout = if declaredTimeout == nil: 30000 else: int(min(300000.0,max(1.0,declaredTimeout.getFloat())))
  let runner: JobRunner = proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.async.} =
    let work = proc(): Future[JsonNode] = service.execute(app.copy(),entry,action,input,requestId,timeout,signal,progress)
    try: return await service.runQueued(picked.key,serialized,signal,progress,work)
    except CatchableError as error:
      if not signal.cancelled: raise
      let detail = failureData(error)
      let notRun = field(field(detail,"context"),"outcome") == %"not-run"
      # Jobs publish cancelled after their runner settles. Keep evidence even
      # when an exception races cancellation; cancellation is never rollback.
      return %*{"outcome": {"requestId": requestId,"status": (if notRun: "cancelled" else: "unknown"),
        "notRun": notRun,"error": detail,"completedAt": utcTimestamp(),
        "partialEffects": (if notRun: newJArray() elif field(field(detail,"context"),"partialEffects") != nil: detail["context"]["partialEffects"] else: %*["cancellation was best-effort — the app may still have completed the action"])}}
  let spec = %*{"kind": "dev-action"}
  if field(params,"requestKey") != nil: spec["requestKey"] = params["requestKey"]
  while service.invocations.len >= 500:
    var oldest = ""
    for id in service.invocations.keys:
      if not service.liveJob(id): oldest = id; break
    if oldest == "": raise contractFailure("target_busy","Native action history is full of live jobs")
    service.invocations.del(oldest)
  let started = service.jobs.startJob(spec,runner,scope=identity)
  if started["deduplicated"] == %false:
    service.invocations[text(started["job"]["jobId"])] = ActionInvocation(public: %*{"jobId": started["job"]["jobId"],"instanceKey": picked.key,"requestId": requestId},
      root: root,action: text(action["id"]),requestKey: requestKey,fingerprint: fingerprint)
  return %*{"job": started["job"],"deduplicated": started["deduplicated"],"requestId": requestId,
    "action": {"id": action["id"],"title": action["title"]},"registryRevision": entry.announcement["revision"]}

proc invokeAction*(service: ActionService, app, params, grants: JsonNode): Future[JsonNode] {.async.} =
  if service.closing: raise contractFailure("unavailable","The native action service is shutting down.")
  let id = freshId("admit_")
  let admission = ActionAdmission(signal: newProcessCancel(),completion: newFuture[void]("Native action admission"))
  service.admissions[id] = admission
  try: return await service.admitAction(app,params,grants,admission.signal)
  finally:
    service.admissions.del(id)
    admission.completion.complete()

proc describeActionJob*(service: ActionService, id: string): JsonNode =
  let job = service.jobs.jobStatus(id)
  if job.kind == JNull: raise contractFailure("not_found","No job \"" & id & "\".",%*{"recovery": {"action": "Invoke an action first; finished history is bounded."}})
  if job["kind"] != %"dev-action": raise contractFailure("invalid_selection","Job \"" & id & "\" is a " & text(job["kind"]) & " job, not a dev-action invocation.",%*{"recovery": {"action": "Use `xplat job status` for other job kinds."}})
  result = %*{"job": job}
  if service.invocations.hasKey(id):
    for key,value in service.invocations[id].public: result[key] = value.copy()
