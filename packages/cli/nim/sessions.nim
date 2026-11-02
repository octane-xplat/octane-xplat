## Session identity, state and cleanup ownership. Transport/runtime composition is separate.
import std/[asyncdispatch, json, tables]
import ./jsonutil, ./native_identity

type
  SessionCleanup* = proc(): Future[JsonNode] {.closure.}
  SessionWatcher* = proc(session: JsonNode) {.closure.}
  SessionEntry = ref object
    value: JsonNode
    cleanup: SessionCleanup
    ending: Future[JsonNode]
  SessionRegistry* = ref object
    entries: OrderedTable[string,SessionEntry]
    watchers: OrderedTable[int,SessionWatcher]
    notifications: seq[JsonNode]
    watcherId, observerFailures: int
    closing, notifying: bool

proc newSessionRegistry*(): SessionRegistry =
  discard getGlobalDispatcher()
  SessionRegistry()

proc observerFailureCount*(registry: SessionRegistry): int = registry.observerFailures
proc notify(registry: SessionRegistry, value: JsonNode) =
  registry.notifications.add(value.copy())
  if registry.notifying: return
  registry.notifying = true
  try:
    while registry.notifications.len > 0:
      let observed = registry.notifications[0]
      registry.notifications.delete(0)
      # Observers may subscribe, unsubscribe or change session state reentrantly.
      var callbacks: seq[SessionWatcher]
      for callback in registry.watchers.values: callbacks.add(callback)
      for callback in callbacks:
        try: callback(observed.copy())
        except CatchableError: inc registry.observerFailures
  finally: registry.notifying = false

proc watchSessions*(registry: SessionRegistry, watcher: SessionWatcher): int =
  if registry.closing: raise newException(ValueError,"Session registry is shutting down")
  if watcher == nil: raise newException(ValueError,"Expected a session observer")
  inc registry.watcherId
  registry.watchers[registry.watcherId] = watcher
  registry.watcherId
proc unwatchSessions*(registry: SessionRegistry, token: int) = registry.watchers.del(token)

proc getSession*(registry: SessionRegistry, id: string): JsonNode =
  if registry.entries.hasKey(id): registry.entries[id].value.copy() else: newJNull()
proc listSessions*(registry: SessionRegistry): JsonNode =
  result = newJArray()
  for entry in registry.entries.values: result.add(entry.value.copy())
proc cleanupPending*(registry: SessionRegistry, id: string): bool =
  registry.entries.hasKey(id) and registry.entries[id].ending != nil and not registry.entries[id].ending.finished

proc sessionId(registry: SessionRegistry, input: JsonNode): string =
  if registry.closing: raise newException(ValueError,"Session registry is shutting down")
  if input == nil or input.kind != JObject: raise newException(ValueError,"Expected session input")
  for key in ["appId","platform","targetId"]:
    let value = field(input,key)
    if value == nil or value.kind != JString or value.getStr().len == 0:
      raise newException(ValueError,"Session " & key & " must be a nonempty string")
  let supplied = field(input,"sessionId")
  if supplied == nil or supplied.kind == JNull: result = freshId("sess_")
  elif supplied.kind == JString and supplied.getStr().len > 0: result = supplied.getStr()
  else: raise newException(ValueError,"Session identity must be a nonempty string")
  if registry.entries.hasKey(result): raise newException(ValueError,"Session identity already exists: " & result)

proc bindSession(registry: SessionRegistry, input: JsonNode, owned: bool, cleanup: SessionCleanup): JsonNode =
  let id = registry.sessionId(input)
  let value = %*{"sessionId": id,"appId": input["appId"],"platform": input["platform"],
    "targetId": input["targetId"],"ownership": (if owned: "owned" else: "attached"),
    "state": (if owned: "starting" else: "ready"),"createdAt": utcTimestamp(),"processKind": newJNull()}
  if field(input,"detail") != nil: value["detail"] = input["detail"].copy()
  if not owned:
    for key in ["processKind","buildIdentity"]:
      let item = field(input,key)
      if item != nil: value[key] = item.copy()
  registry.entries[id] = SessionEntry(value: value.copy(),cleanup: cleanup)
  registry.notify(value)
  registry.entries[id].value.copy()
proc bindOwnedSession*(registry: SessionRegistry, input: JsonNode, cleanup: SessionCleanup = nil): JsonNode =
  registry.bindSession(input,true,cleanup)
proc attachSession*(registry: SessionRegistry, input: JsonNode): JsonNode = registry.bindSession(input,false,nil)

proc requireUsableSession*(registry: SessionRegistry, id: string): JsonNode =
  let session = registry.getSession(id)
  if session.kind == JNull:
    return %*{"usable": false,"error": {"code": "not_found","message": "No session \"" & id & "\".",
      "recovery": {"action": "List current sessions with xplat_sessions and rebind."}}}
  case text(session["state"])
  of "disconnected":
    return %*{"usable": false,"error": {"code": "disconnected_runtime",
      "message": "Session \"" & id & "\" is disconnected; last-known data is historical, not current.",
      "retryable": true,"recovery": {"action": "Reattach or start a new session."}}}
  of "stopped", "failed":
    return %*{"usable": false,"error": {"code": "stale_identity",
      "message": "Session \"" & id & "\" has stopped; its identity is stale.",
      "recovery": {"action": "Start a new session — restarting always gets a new identity."}}}
  else: return %*{"usable": true,"session": session}

proc liveEntry(registry: SessionRegistry, id: string): SessionEntry =
  if not registry.entries.hasKey(id): return nil
  let entry = registry.entries[id]
  if text(entry.value["state"]) in ["stopped","failed"]: return nil
  entry
proc markSessionReady*(registry: SessionRegistry, id: string, meta: JsonNode = nil): JsonNode =
  let entry = registry.liveEntry(id)
  if entry == nil: return newJNull()
  entry.value["state"] = %"ready"
  for key in ["processKind","buildIdentity"]:
    let value = field(meta,key)
    if truthy(value): entry.value[key] = value.copy()
  registry.notify(entry.value)
  entry.value.copy()
proc markSessionDisconnected*(registry: SessionRegistry, id: string, detail: JsonNode = nil): JsonNode =
  let entry = registry.liveEntry(id)
  if entry == nil: return newJNull()
  entry.value["state"] = %"disconnected"
  if detail != nil and detail.kind != JNull: entry.value["detail"] = detail.copy()
  registry.notify(entry.value)
  entry.value.copy()
proc mergeProgress(value, progress: JsonNode): JsonNode =
  if progress == nil or progress.kind != JObject: raise newException(ValueError,"Expected progress object")
  result = if value == nil or value.kind != JObject: newJObject() else: value.copy()
  for key,item in progress: result[key] = item.copy()
proc setSessionLaunch*(registry: SessionRegistry, id: string, progress: JsonNode) =
  let entry = registry.liveEntry(id)
  if entry == nil: return
  entry.value["launch"] = mergeProgress(field(entry.value,"launch"),progress)
  registry.notify(entry.value)
proc markSessionFailed*(registry: SessionRegistry, id: string, error: JsonNode) =
  if not registry.entries.hasKey(id): return
  let entry = registry.entries[id]
  if text(entry.value["state"]) == "stopped": return
  if error == nil or error.kind != JObject: raise newException(ValueError,"Expected session error")
  entry.value["state"] = %"failed"
  entry.value["launch"] = mergeProgress(field(entry.value,"launch"),%*{"phase": "failed","error": error})
  if field(error,"message") != nil: entry.value["detail"] = error["message"].copy()
  registry.notify(entry.value)

proc finishEnd(registry: SessionRegistry, entry: SessionEntry, id: string): Future[void] {.async.} =
  if text(entry.value["state"]) != "failed": entry.value["state"] = %"stopped"
  registry.notify(entry.value)
  var response = %*{"sessionId": id,"ended": true}
  if text(entry.value["ownership"]) == "attached":
    response["preserved"] = %*["attached user-owned session left running"]
  else:
    let cleanup = entry.cleanup
    entry.cleanup = nil
    var released = newJArray()
    try:
      if cleanup != nil:
        let output = await cleanup()
        let resources = field(output,"released")
        if resources != nil and resources.kind != JNull: released = resources.copy()
    except CatchableError:
      released = %*["cleanup reported a failure — inspect target state manually"]
    response["released"] = released
  entry.ending.complete(response)

proc endSnapshot(pending: Future[JsonNode]): Future[JsonNode] {.async.} =
  let response = await pending
  return response.copy()
proc endSession*(registry: SessionRegistry, id: string): Future[JsonNode] =
  if not registry.entries.hasKey(id):
    let absent = newFuture[JsonNode]("session.absent")
    absent.complete(%*{"sessionId": id,"ended": false})
    return absent
  let entry = registry.entries[id]
  if entry.ending == nil:
    # Publish the shared completion before notifying observers or invoking cleanup.
    entry.ending = newFuture[JsonNode]("session.cleanup")
    asyncCheck registry.finishEnd(entry,id)
  endSnapshot(entry.ending)
proc shutdownSessions*(registry: SessionRegistry): Future[JsonNode] {.async.} =
  registry.closing = true
  var ids: seq[string]
  for id in registry.entries.keys: ids.add(id)
  result = newJArray()
  for id in ids: result.add(await registry.endSession(id))
  registry.watchers.clear()
