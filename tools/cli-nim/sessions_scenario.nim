## Test-only state/cleanup scenarios; never compiled into the public CLI.
import std/[asyncdispatch, json, strutils]
import ../../packages/cli/nim/[sessions, jsonutil, strictjson, managed_process]
when defined(macosx): import std/posix

proc makeCleanup(specification: JsonNode, calls: JsonNode, id: string): SessionCleanup =
  let spec = if specification == nil: newJObject() else: specification.copy()
  result = proc(): Future[JsonNode] {.async.} =
    calls.add(%id)
    let delay = field(spec,"delayMs")
    if delay != nil: await sleepAsync(delay.getInt())
    if field(spec,"fail") == %true: raise newException(ValueError,"Fixture cleanup failure")
    let released = field(spec,"released")
    return %*{"released": (if released == nil: newJArray() else: released)}

proc sessionScenario*(request: JsonNode): Future[JsonNode] {.async.} =
  let registry = newSessionRegistry()
  let events = newJArray()
  let calls = newJArray()
  var tokens: seq[int]
  tokens.add(registry.watchSessions(proc(value: JsonNode) = events.add(value)))
  if field(request,"observerThrows") == %true:
    tokens.add(registry.watchSessions(proc(value: JsonNode) = raise newException(ValueError,"Fixture observer failure")))
  var observerEnds: seq[Future[JsonNode]]
  if field(request,"endOnReady") == %true:
    tokens.add(registry.watchSessions(proc(value: JsonNode) =
      if text(value["state"]) == "ready": observerEnds.add(registry.endSession(text(value["sessionId"])))))
  var replies = newJArray()
  for step in request["steps"]:
    var value = newJNull()
    let id = text(field(step,"id"))
    try:
      case text(step["op"])
      of "bind": value = registry.bindOwnedSession(step["input"],makeCleanup(field(step,"cleanup"),calls,text(field(step["input"],"sessionId"))))
      of "attach":
        let cleanup = if field(step,"cleanup") == nil: nil else: makeCleanup(step["cleanup"],calls,text(field(step["input"],"sessionId")))
        value = registry.attachSession(step["input"],cleanup)
      of "get": value = registry.getSession(id)
      of "list": value = registry.listSessions()
      of "usable": value = registry.requireUsableSession(id)
      of "ready": value = registry.markSessionReady(id,field(step,"meta"))
      of "disconnect": value = registry.markSessionDisconnected(id,field(step,"detail"))
      of "launch": registry.setSessionLaunch(id,step["progress"])
      of "fail": registry.markSessionFailed(id,step["error"])
      of "end": value = await registry.endSession(id)
      of "concurrent-end":
        let first = registry.endSession(id)
        let second = registry.endSession(id)
        let waited = not first.finished and not second.finished and registry.cleanupPending(id)
        value = %*{"waited": waited,"first": await first,"second": await second,"pendingAfter": registry.cleanupPending(id)}
      of "mutate-snapshot":
        let snapshot = registry.getSession(id)
        snapshot["appId"] = %"outside"
        let identity = field(snapshot,"buildIdentity")
        if identity != nil and identity.kind == JObject: identity["label"] = %"outside"
        value = registry.getSession(id)
      of "mutate-end":
        let snapshot = await registry.endSession(id)
        snapshot["ended"] = %false
        value = await registry.endSession(id)
      of "shutdown": value = await registry.shutdownSessions()
      else: raise newException(ValueError,"Unknown session scenario operation")
      replies.add(%*{"ok": true,"value": value})
    except CatchableError as error: replies.add(%*{"ok": false,"message": error.msg})
  for ending in observerEnds: discard await ending
  for token in tokens: registry.unwatchSessions(token)
  return %*{"replies": replies,"events": events,"cleanupCalls": calls,"observerFailures": registry.observerFailureCount()}

proc sessionProcessScenario*(request: JsonNode): Future[JsonNode] {.async.} =
  when defined(macosx):
    let registry = newSessionRegistry()
    let manager = newProcessManager()
    var bytes: string
    var args: seq[string]
    for value in request["args"]: args.add(value.getStr())
    let child = manager.spawnManaged(text(request["command"]),args,graceMs=100,
      onData=proc(stream, chunk: string) =
        if stream == "stdout" and bytes.len < 128: bytes.add(chunk))
    try:
      var waited = 0
      while "armed" notin bytes and not child.exit.finished and waited < 8000:
        await sleepAsync(10)
        waited += 10
      if "armed" notin bytes: raise newException(ValueError,"Owned fixture did not arm its signal handlers")
      let pids = parseStrictJson(readFile(text(request["marker"])))
      proc alive(pid: int): bool = posix.kill(Pid(pid),0) == 0 or errno != ESRCH
      var cleanupCalls = 0
      let cleanup: SessionCleanup = proc(): Future[JsonNode] {.async.} =
        inc cleanupCalls
        await child.stop()
        return %*{"released": ["owned process group"]}
      discard registry.bindOwnedSession(%*{"sessionId": "owned","appId": ".","platform": "web","targetId": "web"},cleanup)
      discard registry.attachSession(%*{"sessionId": "attached","appId": ".","platform": "web","targetId": "web"})
      let attached = await registry.endSession("attached")
      var preserved = not child.exit.finished
      for pid in pids: preserved = preserved and alive(pid.getInt())
      let first = registry.endSession("owned")
      let second = registry.endSession("owned")
      let pending = not first.finished and not second.finished and registry.cleanupPending("owned")
      let firstReply = await first
      let secondReply = await second
      var stillAlive = newJArray()
      for pid in pids: stillAlive.add(%alive(pid.getInt()))
      result = %*{"attached": attached,"preservedBeforeRelease": preserved,"waitedForCleanup": pending,
        "first": firstReply,"second": secondReply,"cleanupCalls": cleanupCalls,
        "exitFinishedBeforeManagerClose": child.exit.finished,"aliveBeforeManagerClose": stillAlive}
    finally: await manager.close()
  else: raise newException(ValueError,"Process session fixture requires macOS")
