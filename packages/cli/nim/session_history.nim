## Native-only durable evidence. A retained owner identity never authorizes signals.
import std/[os, json, options, strutils, algorithm, tables, math, asyncdispatch]
import ./host_storage, ./host_bootstrap, ./native_identity, ./digests
import ./strictjson, ./json_wire, ./js_text, ./jsonutil, ./contract_failure
import ./native_reports
when defined(macosx):
  import std/posix
  proc renameNative(source, destination: cstring): cint {.importc: "rename", header: "<stdio.h>".}

const segmentBytes* = 512*1024
const retainedRuns* = 20
const historyCoverage = "Forwarded tool/host output. This stream excludes output before capture and OS report files. Native reports are returned separately."
type HistoryCapture* = ref object
  directory, root, appRoot, owner: string
  session: JsonNode
  bytes, segmentLimit, runLimit: int
  closed, appendFailed: bool
  error*: string

proc validHistoryId*(id: string): bool =
  if id.len != 41 or not id.startsWith("sess_"): return false
  for ch in id[5..^1]:
    if ch notin {'a'..'f','0'..'9','-'}: return false
  true

proc historyRoot*(workspace: string, app: JsonNode, create = false): string =
  let parent = hostPaths(workspace).directory
  let appRoot = expandFilename(text(app["root"]))
  let history = parent / "history"
  result = history / sha256Hex(utf8ForWrite(appRoot))
  for path in [parent,history,result]:
    if create: privateHostDirectory(path)
    elif not existingPrivateHostDirectory(path): return result

proc rawSession(directory, appRoot, id: string): JsonNode =
  if not validHistoryId(id): raise contractFailure("invalid_selection","Invalid session id.")
  if not existingPrivateHostDirectory(directory):
    raise contractFailure("not_found","No retained session with this id for the selected app.")
  let bytes = readHostFile(directory / "session.json",65536)
  if bytes.isNone: raise contractFailure("not_found","No retained session with this id for the selected app.")
  result = parseStrictJson(decodeUtf8(bytes.get()))
  if field(result,"version") != %2 or field(result,"storeVersion") != %1 or field(result,"implementation") != %"nim" or
      field(result,"sessionId") != %id or field(result,"appRoot") != %appRoot:
    raise contractFailure("execution_failure","Invalid native retained session metadata.")
  for key in ["appId","platform","targetId","ownerId","startedAt","createdAt","state","ownership"]:
    let item = field(result,key)
    if item == nil or item.kind != JString or item.getStr().len == 0:
      raise contractFailure("execution_failure","Incomplete native retained session metadata.")
  if field(result,"endedAt") == nil or result["endedAt"].kind notin [JNull,JString]:
    raise contractFailure("execution_failure","Invalid native retained session end time.")
  if result["state"] notin [%"starting",%"ready",%"failed",%"stopped",%"disconnected"] or
      result["ownership"] notin [%"owned",%"attached"] or
      field(result,"pid") == nil or result["pid"].kind != JInt or result["pid"].getInt() <= 0:
    raise contractFailure("execution_failure","Invalid native retained session state or identity.")

proc observedSession(run: JsonNode, owner: string): JsonNode =
  result = run.copy()
  let ended = run["endedAt"].kind != JNull
  let live = owner.len > 0 and run["ownerId"] == %owner
  result["historical"] = %(ended or not live)
  result["cleanupConfirmed"] = %ended
  if not ended and not live:
    result["state"] = %"disconnected"
    result["detail"] = %"The recorded native owner is unavailable. Retained data is historical; live process cleanup cannot be confirmed."

proc readHistorySession*(workspace: string, app: JsonNode, id: string, owner = ""): JsonNode =
  let root = historyRoot(workspace,app)
  observedSession(rawSession(root / id,expandFilename(text(app["root"])),id),owner)

proc listHistorySessions*(workspace: string, app: JsonNode, owner = "", platform = ""): JsonNode =
  let root = historyRoot(workspace,app)
  result = newJArray()
  if not dirExists(root): return
  var runs: seq[JsonNode]
  for kind,path in walkDir(root):
    let id = extractFilename(path)
    if not validHistoryId(id): continue
    var run: JsonNode
    try: run = readHistorySession(workspace,app,id,owner)
    except ContractFailure as error:
      if text(error.detail["code"]) == "not_found": continue
      raise
    if platform.len == 0 or run["platform"] == %platform: runs.add(run)
  runs.sort(proc(a,b: JsonNode): int =
    let order = cmp(text(b["startedAt"]),text(a["startedAt"]))
    if order == 0: cmp(text(a["sessionId"]),text(b["sessionId"])) else: order)
  for run in runs: result.add(run)

proc metadata(capture: HistoryCapture) =
  if capture.error.len > 0: capture.session["retentionError"] = %capture.error
  discard publishHostFile(capture.directory / "session.json",wireJson(capture.session))

proc prune(capture: HistoryCapture) =
  var runs: seq[JsonNode]
  if not dirExists(capture.root): return
  for kind,path in walkDir(capture.root):
    let id = extractFilename(path)
    if not validHistoryId(id): continue
    var run: JsonNode
    try: run = rawSession(path,capture.appRoot,id)
    except ContractFailure as error:
      if text(error.detail["code"]) == "not_found": continue
      raise
    if run["endedAt"].kind != JNull or run["ownerId"] != %capture.owner: runs.add(run)
  runs.sort(proc(a,b: JsonNode): int =
    proc stamp(run: JsonNode): string =
      if run["endedAt"].kind != JNull: text(run["endedAt"]) else: text(run["startedAt"])
    let order = cmp(stamp(b),stamp(a))
    if order == 0: cmp(text(a["sessionId"]),text(b["sessionId"])) else: order)
  for index in capture.runLimit..<runs.len:
    let path = capture.root / text(runs[index]["sessionId"])
    if existingPrivateHostDirectory(path):
      let stamp = getFileInfo(path,followSymlink=false).id
      discard rawSession(path,capture.appRoot,text(runs[index]["sessionId"]))
      if existingPrivateHostDirectory(path) and getFileInfo(path,followSymlink=false).id == stamp: removeDir(path)

proc newHistoryCapture*(workspace: string, app, session: JsonNode, owner: string,
    segmentLimit = segmentBytes, runLimit = retainedRuns): HistoryCapture =
  if owner.len == 0 or segmentLimit < 1024 or runLimit < 0:
    raise newException(ValueError,"Invalid session retention settings")
  let id = text(session["sessionId"])
  if not validHistoryId(id): raise contractFailure("invalid_selection","Invalid session id.")
  let root = historyRoot(workspace,app,true)
  let directory = root / id
  if dirExists(directory) or fileExists(directory) or symlinkExists(directory):
    raise contractFailure("execution_failure","Native history identity already exists.")
  privateHostDirectory(directory)
  result = HistoryCapture(directory: directory,root: root,appRoot: expandFilename(text(app["root"])),
    owner: owner,session: session.copy(),segmentLimit: segmentLimit,runLimit: runLimit)
  for key,value in %*{"version": 2,"storeVersion": 1,"implementation": "nim","ownerId": owner,
      "pid": getCurrentProcessId(),"appRoot": result.appRoot,"startedAt": session["createdAt"],"endedAt": newJNull(),"origin": "agent"}:
    result.session[key] = value.copy()
  result.metadata()
  try: result.prune()
  except CatchableError as error: result.error = error.msg

proc updateHistory*(capture: HistoryCapture, session: JsonNode) =
  try:
    for key,value in session: capture.session[key] = value.copy()
    capture.metadata()
  except CatchableError as error: capture.error = error.msg

proc appendHistory*(capture: HistoryCapture, record: JsonNode) =
  if capture.closed or capture.appendFailed: return
  try:
    let bytes = wireJson(record) & "\n"
    if bytes.len > capture.segmentLimit: raise newException(ValueError,"Development log record exceeds segment bound")
    when defined(macosx):
      if capture.bytes > 0 and capture.bytes+bytes.len > capture.segmentLimit:
        let current = capture.directory / "current.jsonl"
        let previous = capture.directory / "previous.jsonl"
        if renameNative(cstring(utf8ForWrite(current)),cstring(utf8ForWrite(previous))) != 0: raiseOSError(osLastError())
        capture.bytes = 0
      let fd = openPrivateHostFile(capture.directory / "current.jsonl",O_WRONLY or O_CREAT or O_APPEND)
      defer: discard posix.close(fd)
      var at = 0
      while at < bytes.len:
        let written = posix.write(fd,unsafeAddr bytes[at],bytes.len-at)
        if written < 0:
          if errno == EINTR: continue
          raiseOSError(osLastError())
        if written == 0: raise newException(IOError,"Incomplete history append")
        at += written
      capture.bytes += bytes.len
    else: raise newException(OSError,"Session history is not implemented on this host")
  except CatchableError as error:
    capture.error = error.msg
    capture.appendFailed = true

proc finishHistory*(capture: HistoryCapture, session: JsonNode) =
  if capture == nil or capture.closed: return
  try:
    for key,value in session: capture.session[key] = value.copy()
    capture.session["endedAt"] = %utcTimestamp()
    capture.metadata()
    capture.closed = true
    capture.prune()
  except CatchableError as error: capture.error = error.msg

proc readHistoryLogs*(workspace: string, app: JsonNode, id: string, owner = "",
    cursor = none(int), limit = 500, stream = ""): JsonNode =
  if limit < 1 or limit > 5000 or (cursor.isSome and cursor.get() < 0):
    raise contractFailure("invalid_selection","Invalid log pagination selection.")
  if stream notin ["","stdout","stderr","lifecycle"]: raise contractFailure("invalid_selection","Invalid log stream.")
  let run = readHistorySession(workspace,app,id,owner)
  let directory = historyRoot(workspace,app) / id
  var seen = initTable[int,JsonNode]()
  var incomplete = false
  for name in ["previous.jsonl","current.jsonl","previous.jsonl"]:
    let data = readHostFile(directory / name,segmentBytes)
    if data.isNone: continue
    let bytes = data.get()
    if bytes.len > 0 and bytes[^1] != '\n': incomplete = true
    let last = bytes.rfind('\n')
    if last < 0: continue
    for line in bytes[0..last].splitLines():
      if line.len == 0: continue
      let record = parseStrictJson(decodeUtf8(line))
      let seq = field(record,"seq")
      if seq == nil or seq.kind != JInt or seq.getInt() < 1 or
          field(record,"line") == nil or record["line"].kind != JString or
          field(record,"ts") == nil or record["ts"].kind != JString or
          field(record,"stream") notin [%"stdout",%"stderr",%"lifecycle"]:
        raise contractFailure("execution_failure","Invalid retained log record.")
      if seen.hasKey(seq.getInt()) and seen[seq.getInt()] != record:
        raise contractFailure("execution_failure","Conflicting retained log records have the same sequence.")
      seen[seq.getInt()] = record
  var sequences: seq[int]
  for seq in seen.keys: sequences.add(seq)
  sequences.sort()
  for at in 1..<sequences.len:
    if sequences[at] != sequences[at-1]+1:
      raise contractFailure("execution_failure","Log files rotated during the read; retry.",%*{"retryable": true})
  let oldest = if sequences.len == 0: 1 else: sequences[0]
  let newest = if sequences.len == 0: 0 else: sequences[^1]
  if cursor.isSome and cursor.get() > newest:
    raise contractFailure("invalid_selection","Cursor is ahead of this session. Use a cursor returned for the same session ID.")
  var matching: seq[JsonNode]
  for seq in sequences:
    if (cursor.isNone or seq > cursor.get()) and (stream.len == 0 or seen[seq]["stream"] == %stream): matching.add(seen[seq])
  let first = if cursor.isNone: max(0,matching.len-limit) else: 0
  var page = newJArray()
  for at in first..<min(matching.len,first+limit): page.add(matching[at])
  let next = if matching.len > page.len: page[page.len-1]["seq"].getInt() else: newest
  %*{"session": run,"records": page,"nextCursor": next,"oldestSeq": oldest,"newestSeq": newest,
    "truncated": (if cursor.isSome: cursor.get() else: 0) < oldest-1,"dropped": oldest-1,
    "incompleteTail": incomplete,"historical": run["historical"],"capturedFrom": run["startedAt"],
    "coverage": (if run["ownership"] == %"attached": "Lifecycle events only. External process output stays in the user's terminal, including output before attachment." else: historyCoverage)}

proc historyDiagnostics*(workspace: string, app, params: JsonNode, owner = ""): Future[JsonNode] {.async.} =
  let id = text(field(params,"sessionId"))
  if id.len == 0:
    return %*{"sessions": listHistorySessions(workspace,app,owner,text(field(params,"platform"))),
      "note": "Select --session SESSION_ID to read retained logs. Native session history is app-scoped and remains readable without its owner."}
  let run = readHistorySession(workspace,app,id,owner)
  if truthy(field(params,"platform")) and run["platform"] != params["platform"]:
    raise contractFailure("invalid_selection","The selected run belongs to another platform.")
  let reportsDirectory = historyRoot(workspace,app) / id / "reports"
  if truthy(field(params,"reportId")):
    return %*{"sessionId": id,"report": readNativeReport(reportsDirectory,text(params["reportId"]))}
  proc integer(key: string, minimum, maximum, default: int): int =
    let value = field(params,key)
    if value == nil: return default
    if value.kind notin [JInt,JFloat]: raise contractFailure("invalid_selection","Expected an integer log selection.")
    let number = value.getFloat()
    if classify(number) in {fcNan,fcInf,fcNegInf} or floor(number) != number or number < float(minimum) or number > float(maximum):
      raise contractFailure("invalid_selection","Integer log selection is outside its bounds.")
    int(number)
  let cursor = if field(params,"cursor") == nil: none(int) else: some(integer("cursor",0,9007199254740991,0))
  let limit = integer("limit",1,5000,500)
  var logs = readHistoryLogs(workspace,app,id,owner,cursor,limit,text(field(params,"stream")))
  let session = logs["session"]
  if truthy(field(params,"platform")) and session["platform"] != params["platform"]:
    raise contractFailure("invalid_selection","The selected run belongs to another platform.")
  logs.delete("session")
  var native: JsonNode
  try: native = await discoverNativeReports(reportsDirectory,session)
  except CatchableError:
    native = %*{"reports": [],"coverage": {"status": "unavailable","detail": "Native report discovery or retention failed. Log capture remains readable."}}
  result = %*{"sessionId": id,"session": session,"logs": logs,"reports": native["reports"],
    "coverage": {"logs": "captured","nativeReports": native["coverage"]}}
  if truthy(field(session,"retentionError")):
    result["coverage"]["retention"] = %*{"status": "unavailable","detail": session["retentionError"]}
  if session["ownership"] == %"attached": result["coverage"]["applicationOutput"] = %"not-captured"
