## Read-only tool queries with bounded capture and owned timeout/cancellation.
import std/[asyncdispatch, options, strtabs, monotimes, times]
import ./managed_process, ./js_text

type ProbeCancelledError* = object of CatchableError

proc probeCommand*(command: string, args: seq[string], cwd = "",
    environment: StringTableRef = nil, timeoutMs = 15000,
    maxStdoutBytes = 1024*1024, signal: ProcessCancel = nil): Future[Option[string]] {.async.} =
  if timeoutMs <= 0: raise newException(ValueError,"Probe timeout must be positive")
  if maxStdoutBytes < 0: raise newException(ValueError,"Probe output bound must be nonnegative")
  if (signal != nil and signal.cancelled) or interruptedSignal() != 0:
    raise newException(ProbeCancelledError,"Command probe cancelled")
  let manager = newProcessManager()
  let stop = newProcessCancel()
  let started = getMonoTime()
  var output: string
  var exceeded, timedOut, cancelled: bool
  result = none(string)
  try:
    try:
      let child = manager.spawnManaged(command,args,cwd=cwd,env=environment,signal=stop,graceMs=100,
        onData=proc(stream, bytes: string) =
          if stream == "stdout" and not exceeded:
            if bytes.len > maxStdoutBytes-output.len: exceeded = true; stop.cancel()
            else: output.add(bytes))
      while not child.exit.finished:
        if (signal != nil and signal.cancelled) or interruptedSignal() != 0:
          cancelled = true
          stop.cancel()
        if (getMonoTime()-started).inMilliseconds >= timeoutMs:
          timedOut = true
          stop.cancel()
        await sleepAsync(5)
      let status = await child.exit
      if not exceeded and not timedOut and not cancelled and status.error.len == 0 and status.exitStatus() == 0:
        result = some(decodeUtf8(output))
    except OSError, ValueError: discard # Query failure, never evidence of readiness.
  finally: await manager.close()
  if cancelled or (signal != nil and signal.cancelled) or interruptedSignal() != 0:
    raise newException(ProbeCancelledError,"Command probe cancelled")
