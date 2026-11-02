## Owned asynchronous jobs with cooperative cancellation and bounded history.
## A terminal record is published only after its runner has settled.
import std/[asyncdispatch, json, tables, algorithm]
import ./jsonutil, ./managed_process, ./native_identity, ./contract_failure

type
  JobProgress* = proc(progress: JsonNode) {.closure.}
  JobRunner* = proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.closure.}
  JobEntry = ref object
    value: JsonNode
    scope: string
    signal: ProcessCancel
    completion: Future[void]
    order: int
  JobRegistry* = ref object
    entries: OrderedTable[string,JobEntry]
    historyLimit, order: int
    closing: bool

proc newJobRegistry*(historyLimit = 200): JobRegistry =
  if historyLimit < 0: raise newException(ValueError,"Job history limit must be nonnegative")
  discard getGlobalDispatcher()
  JobRegistry(historyLimit: historyLimit)

proc isLive(entry: JobEntry): bool = text(entry.value["state"]) in ["queued","running","cancelling"]
proc trim(registry: JobRegistry) =
  var finished: seq[JobEntry]
  for entry in registry.entries.values:
    if not entry.isLive(): finished.add(entry)
  if finished.len <= registry.historyLimit: return
  finished.sort(proc(left, right: JobEntry): int =
    result = cmp(text(left.value["finishedAt"]),text(right.value["finishedAt"]))
    if result == 0: result = cmp(left.order,right.order))
  for index in 0..<finished.len-registry.historyLimit:
    registry.entries.del(text(finished[index].value["jobId"]))

proc jobStatus*(registry: JobRegistry, id: string): JsonNode =
  if registry.entries.hasKey(id): registry.entries[id].value.copy() else: newJNull()
proc listJobs*(registry: JobRegistry): JsonNode =
  result = newJArray()
  for entry in registry.entries.values: result.add(entry.value.copy())
proc setJobProgress*(registry: JobRegistry, id: string, progress: JsonNode): JsonNode =
  if not registry.entries.hasKey(id): return newJNull()
  let entry = registry.entries[id]
  if not entry.isLive(): return newJNull()
  if progress == nil or progress.kind != JObject: raise newException(ValueError,"Expected a job progress object")
  let previous = field(entry.value,"progress")
  let combined = if previous == nil: newJObject() else: previous.copy()
  for key,value in progress: combined[key] = value.copy()
  entry.value["progress"] = combined
  entry.value.copy()

proc finishRunner(registry: JobRegistry, entry: JobEntry, run: JobRunner): Future[void] {.async.} =
  entry.value["state"] = %"running"
  try:
    let progress: JobProgress = proc(value: JsonNode) =
      discard registry.setJobProgress(text(entry.value["jobId"]),value)
    let pending = run(entry.signal,progress)
    if pending == nil: raise newException(ValueError,"Job runner did not return a future")
    let output = await pending
    entry.value["state"] = %(if text(entry.value["state"]) == "cancelling": "cancelled" else: "succeeded")
    if output != nil: entry.value["result"] = output.copy()
  except CatchableError as error:
    entry.value["state"] = %(if text(entry.value["state"]) == "cancelling": "cancelled" else: "failed")
    if text(entry.value["state"]) == "failed": entry.value["error"] = failureData(error)
  finally:
    entry.value["finishedAt"] = %utcTimestamp()
    entry.signal = nil
    entry.completion.complete()
    registry.trim()

proc startJob*(registry: JobRegistry, input: JsonNode, run: JobRunner = nil, scope = ""): JsonNode =
  if registry.closing: raise newException(ValueError,"Job registry is shutting down")
  if input == nil or input.kind != JObject or field(input,"kind") == nil or
      input["kind"].kind != JString or input["kind"].getStr().len == 0:
    raise newException(ValueError,"Job kind must be a nonempty string")
  for key in ["sessionId","requestKey"]:
    let value = field(input,key)
    if value != nil and value.kind notin [JNull,JString]: raise newException(ValueError,"Job " & key & " must be a string")
  if truthy(field(input,"requestKey")):
    for entry in registry.entries.values:
      if entry.scope == scope and entry.isLive() and jsStrictEqual(field(entry.value,"requestKey"),field(input,"requestKey")) and
          jsStrictEqual(entry.value["kind"],input["kind"]) and jsStrictEqual(field(entry.value,"sessionId"),field(input,"sessionId")):
        return %*{"job": entry.value.copy(),"deduplicated": true}
  let id = freshId("job_")
  inc registry.order
  let value = %*{"jobId": id,"kind": input["kind"],"state": "queued","createdAt": utcTimestamp()}
  for key in ["sessionId","requestKey"]:
    if field(input,key) != nil: value[key] = input[key].copy()
  let entry = JobEntry(value: value.copy(),scope: scope,order: registry.order)
  registry.entries[id] = entry
  if run != nil:
    entry.signal = newProcessCancel()
    entry.completion = newFuture[void]("Job runner completion")
    asyncCheck registry.finishRunner(entry,run)
  %*{"job": entry.value.copy(),"deduplicated": false}

proc finalizable(registry: JobRegistry, id: string): JobEntry =
  if not registry.entries.hasKey(id): return nil
  let entry = registry.entries[id]
  if not entry.isLive(): return nil
  if entry.completion != nil and not entry.completion.finished:
    raise newException(ValueError,"An owned job runner must settle before publishing its terminal result")
  entry
proc succeedJob*(registry: JobRegistry, id: string, output: JsonNode): JsonNode =
  let entry = registry.finalizable(id)
  if entry == nil: return newJNull()
  entry.value["state"] = %"succeeded"
  if output != nil: entry.value["result"] = output.copy()
  entry.value["finishedAt"] = %utcTimestamp()
  registry.trim()
  entry.value.copy()
proc failJob*(registry: JobRegistry, id: string, error: JsonNode): JsonNode =
  let entry = registry.finalizable(id)
  if entry == nil: return newJNull()
  entry.value["state"] = %"failed"
  if error != nil: entry.value["error"] = error.copy()
  entry.value["finishedAt"] = %utcTimestamp()
  registry.trim()
  entry.value.copy()
proc cancelJob*(registry: JobRegistry, id: string): JsonNode =
  if not registry.entries.hasKey(id): return newJNull()
  let entry = registry.entries[id]
  if entry.isLive():
    if entry.completion != nil and not entry.completion.finished:
      entry.value["state"] = %"cancelling"
      entry.signal.cancel()
    else:
      entry.value["state"] = %"cancelled"
      entry.value["finishedAt"] = %utcTimestamp()
      registry.trim()
  entry.value.copy()

proc waitJob*(registry: JobRegistry, id: string): Future[JsonNode] {.async.} =
  if not registry.entries.hasKey(id): return newJNull()
  let entry = registry.entries[id]
  if entry.completion != nil: await entry.completion
  return entry.value.copy()
proc closeJobs*(registry: JobRegistry): Future[void] {.async.} =
  registry.closing = true
  var entries: seq[JobEntry]
  for entry in registry.entries.values: entries.add(entry)
  for entry in entries: discard registry.cancelJob(text(entry.value["jobId"]))
  for entry in entries:
    if entry.completion != nil: await entry.completion
