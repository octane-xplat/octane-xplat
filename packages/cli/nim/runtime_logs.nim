## Bounded ordered runtime logs. Cursors disclose retention gaps and reset markers.
import std/[json, options, tables, deques]
import ./native_identity, ./jsonutil, ./json_wire

type
  LogWatcher* = proc(record: JsonNode) {.closure.}
  StoredLog = object
    value: JsonNode
    bytes: int
  RuntimeLogs* = ref object
    records: Deque[StoredLog]
    limit, byteLimit, retainedBytes, sequence, dropped, watcherId, observerErrors: int
    resetMarker: JsonNode
    watchers: OrderedTable[int,LogWatcher]

proc newRuntimeLogs*(limit = 2000, byteLimit = 2*1024*1024): RuntimeLogs =
  if limit < 0 or byteLimit < 0: raise newException(ValueError,"Log retention must be nonnegative")
  RuntimeLogs(limit: limit,byteLimit: byteLimit,records: initDeque[StoredLog](),resetMarker: newJNull())
proc logSize*(logs: RuntimeLogs): int = logs.records.len
proc logObserverFailures*(logs: RuntimeLogs): int = logs.observerErrors
proc oldest(logs: RuntimeLogs): int =
  if logs.records.len == 0: logs.sequence+1 else: logs.records.peekFirst().value["seq"].getInt()

proc appendLog*(logs: RuntimeLogs, line: string, stream = "stdout", source = "", level = "", lineTruncated = false): JsonNode =
  inc logs.sequence
  let record = %*{"seq": logs.sequence,"ts": utcTimestamp(),"stream": stream,"line": line}
  if source.len > 0: record["source"] = %source
  if level.len > 0: record["level"] = %level
  if lineTruncated: record["lineTruncated"] = %true
  let bytes = wireJson(record).len
  logs.records.addLast(StoredLog(value: record,bytes: bytes))
  logs.retainedBytes += bytes
  while logs.records.len > logs.limit or logs.retainedBytes > logs.byteLimit:
    logs.retainedBytes -= logs.records.popFirst().bytes
    inc logs.dropped
  var callbacks: seq[LogWatcher]
  for callback in logs.watchers.values: callbacks.add(callback)
  for callback in callbacks:
    try: callback(record.copy())
    except CatchableError: inc logs.observerErrors
  record.copy()

proc noteLog*(logs: RuntimeLogs, line: string): JsonNode = logs.appendLog(line,stream="lifecycle")
proc watchLogs*(logs: RuntimeLogs, callback: LogWatcher): int =
  if callback == nil: raise newException(ValueError,"A log watcher is required")
  inc logs.watcherId
  logs.watchers[logs.watcherId] = callback
  logs.watcherId
proc unwatchLogs*(logs: RuntimeLogs, id: int) = logs.watchers.del(id)
proc resetLogs*(logs: RuntimeLogs, reason: string) =
  logs.records.clear()
  logs.retainedBytes = 0
  logs.dropped = 0
  logs.resetMarker = %*{"at": utcTimestamp(),"reason": reason}
  discard logs.noteLog("log capture reset: " & reason)

proc readLogs*(logs: RuntimeLogs, cursor = none(int), limit = 500, stream = ""): JsonNode =
  if limit < 0: raise newException(ValueError,"Log read limit must be nonnegative")
  let base = logs.oldest()
  let fromSeq = if cursor.isSome: cursor.get() else: base+max(0,logs.records.len-limit)-1
  var page = newJArray()
  for stored in logs.records:
    let record = stored.value
    if page.len >= limit: break
    if record["seq"].getInt() > fromSeq and (stream.len == 0 or record["stream"] == %stream): page.add(record.copy())
  let truncated = cursor.isSome and cursor.get() < base-1
  %*{"records": page,"nextCursor": (if page.len > 0: page[page.len-1]["seq"].getInt() elif cursor.isSome: cursor.get() else: base-1),
    "oldestSeq": base,"newestSeq": logs.sequence,"truncated": truncated,"dropped": (if truncated: logs.dropped else: 0),"reset": logs.resetMarker.copy()}
