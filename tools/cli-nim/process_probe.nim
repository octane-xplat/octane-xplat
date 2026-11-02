## Test-only process and line-decoder driver; never part of the public CLI.
import std/[asyncdispatch, json, strtabs, options, base64, os, monotimes, times]
import ../../packages/cli/nim/[managed_process, strictjson, json_wire, jsonutil]
import ../../packages/cli/nim/process_exit
when defined(macosx): import std/posix

proc lineJson(line: ProcessLine): JsonNode =
  result = %*{"stream": line.stream,"line": line.line}
  if line.lineTruncated: result["lineTruncated"] = %true
proc later(signal, done: ProcessCancel, ms: int) {.async.} =
  var elapsed = 0
  while elapsed < ms and not done.cancelled:
    await sleepAsync(min(5,ms-elapsed))
    elapsed += min(5,ms-elapsed)
  if not done.cancelled: signal.cancel()

proc execute(request: JsonNode, owner: ProcessManager = nil): Future[JsonNode] {.async.} =
  if text(field(request,"operation")) == "exit": exitProcess(request["status"].getInt())
  if text(field(request,"operation")) == "parallel":
    let shared = newProcessManager()
    try:
      var pending: seq[Future[JsonNode]]
      for item in request["requests"]: pending.add(execute(item,shared))
      result = newJArray()
      for task in pending: result.add(await task)
      return
    finally: await shared.close()
  if text(field(request,"operation")) == "lines":
    var decoder: ProcessLines
    var records = newJArray()
    for chunk in request["chunks"]:
      for line in decoder.feed(decode(chunk.getStr()),"stdout"): records.add(lineJson(line))
    for line in decoder.feed("","stdout",eof=true): records.add(lineJson(line))
    return records
  let started = getMonoTime()
  let manager = if owner == nil: newProcessManager() else: owner
  let signal = newProcessCancel()
  let done = newProcessCancel()
  var cancellation: Future[void]
  if field(request,"preabort") == %true: signal.cancel()
  if field(request,"abortMs") != nil: cancellation = later(signal,done,request["abortMs"].getInt())
  var records = newJArray()
  var notes = newJArray()
  var output, errors: string
  let env = newStringTable(modeCaseSensitive)
  if field(request,"env") != nil:
    for key,value in request["env"]: env[key] = value.getStr()
  var args: seq[string]
  if field(request,"args") != nil:
    for arg in request["args"]: args.add(arg.getStr())
  let before = getCurrentDir()
  if field(request,"signals") == %true: installProcessSignalHandlers()
  var extraFd = -1.cint
  try:
    when defined(macosx):
      if field(request,"leakFile") != nil:
        let original = posix.open(cstring(text(request["leakFile"])),O_RDONLY)
        if original < 0: raiseOSError(osLastError())
        extraFd = fcntl(original,F_DUPFD,100)
        discard posix.close(original)
        if extraFd < 0: raiseOSError(osLastError())
        if fcntl(extraFd,F_SETFD,0) < 0: raiseOSError(osLastError())
        env["NIM_PROCESS_LEAK_FD"] = $extraFd
    let child = manager.spawnManaged(text(request["cmd"]),args,cwd=text(field(request,"cwd")),env=env,signal=signal,
      graceMs=(if field(request,"graceMs") == nil: 100 else: request["graceMs"].getInt()),
      onLine=proc(line: ProcessLine) =
        if records.len >= 20000: raise newException(IOError,"Probe record bound")
        records.add(lineJson(line))
        if line.line == text(field(request,"stopOnLine")) and field(request,"stopOnLine") != nil: signal.cancel()
        if field(request,"sinkError") == %true: raise newException(IOError,"fixture sink failure"),
      onData=proc(stream, bytes: string) =
        if field(request,"raw") == %true:
          if stream == "stdout": output.add(bytes)
          else: errors.add(bytes),
      onNote=proc(line: string) = notes.add(%line))
    if field(request,"ownerReady") == %true:
      # Parent tests can signal/exit this owner only after its child is ready.
      while records.len == 0 and not child.exit.finished: await sleepAsync(5)
      echo wireJson(%*{"pid": child.pid,"ready": records})
      stdout.flushFile()
    if field(request,"quitOwner") == %true: exitProcess(0)
    if field(request,"closeOnLine") != nil:
      while not child.exit.finished:
        var reached = false
        for record in records:
          if record["line"] == request["closeOnLine"]: reached = true
        if reached: break
        await sleepAsync(5)
      await manager.close()
    if field(request,"doubleStop") == %true:
      let first = child.stop()
      if child.stop() != first: raise newException(IOError,"stop future must be shared")
      await first
    let status = await child.exit
    result = %*{"records": records,"notes": notes,"pid": child.pid,"cwdUnchanged": before == getCurrentDir(),
      "elapsedMs": (getMonoTime()-started).inMilliseconds(),
      "exit": {"code": (if status.code.isSome: %status.code.get() else: newJNull()),
        "signal": (if status.signal.isSome: %status.signal.get() else: newJNull())}}
    if status.error != "": result["exit"]["error"] = %status.error; result["exit"]["errorCode"] = %status.errorCode
    if field(request,"raw") == %true:
      result["stdoutBase64"] = %encode(output)
      result["stderrBase64"] = %encode(errors)
    if field(request,"repeatStop") == %true: await child.stop()
  finally:
    when defined(macosx):
      if extraFd >= 0: discard posix.close(extraFd)
    done.cancel()
    if cancellation != nil: await cancellation
    if owner == nil: await manager.close()

for line in stdin.lines:
  try:
    echo wireJson(waitFor execute(parseStrictJson(line)))
    if interruptedSignal() != 0: exitProcess(128+interruptedSignal())
  except CatchableError as error: echo wireJson(%*{"invalid": error.msg})
