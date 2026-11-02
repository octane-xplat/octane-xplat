## Test-only registry traces and owned-process cancellation integration.
import std/[asyncdispatch, json, tables, strutils]
import ../../packages/cli/nim/[jobs, contract_failure, managed_process, jsonutil, strictjson]
when defined(macosx): import std/posix

type Control = ref object
  gate: Future[JsonNode]

proc runnerFor(specification: JsonNode, control: Control, calls: JsonNode, alias: string): JobRunner =
  let spec = specification.copy()
  if field(spec,"nilFuture") == %true:
    return proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] = nil
  result = proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.async.} =
    calls.add(%alias)
    if field(spec,"progress") != nil: progress(spec["progress"])
    var output: JsonNode
    if field(spec,"untilCancelled") == %true:
      while not signal.cancelled: await sleepAsync(1)
      let delay = field(spec,"cleanupDelayMs")
      if delay != nil: await sleepAsync(delay.getInt())
      output = field(spec,"result")
    elif field(spec,"gate") == %true: output = await control.gate
    else:
      let delay = field(spec,"delayMs")
      if delay != nil: await sleepAsync(delay.getInt())
      output = field(spec,"result")
    if field(spec,"failure") != nil:
      let failure = spec["failure"]
      if field(failure,"code") != nil:
        raise contractFailure(text(failure["code"]),text(failure["message"]),failure)
      raise newException(ValueError,text(field(failure,"message")))
    if field(spec,"bareContract") == %true: raise newException(ContractFailure,"Bare fixture failure")
    return output

proc jobScenario*(request: JsonNode): Future[JsonNode] {.async.} =
  let limit = field(request,"historyLimit")
  let registry = newJobRegistry(if limit == nil: 200 else: limit.getInt())
  var ids: Table[string,string]
  var controls: Table[string,Control]
  let calls = newJArray()
  var replies = newJArray()
  for step in request["steps"]:
    var value = newJNull()
    let alias = text(field(step,"alias"))
    let id = if ids.hasKey(alias): ids[alias] else: alias
    try:
      case text(step["op"])
      of "start":
        let spec = field(step,"runner")
        var runner: JobRunner
        if spec != nil:
          let control = Control(gate: newFuture[JsonNode]("fixture gate"))
          controls[alias] = control
          runner = runnerFor(spec,control,calls,alias)
        value = registry.startJob(step["input"],runner)
        ids[alias] = text(value["job"]["jobId"])
      of "status": value = registry.jobStatus(id)
      of "list": value = registry.listJobs()
      of "progress": value = registry.setJobProgress(id,step["progress"])
      of "succeed": value = registry.succeedJob(id,field(step,"result"))
      of "fail": value = registry.failJob(id,step["error"])
      of "cancel": value = registry.cancelJob(id)
      of "complete": controls[alias].gate.complete(field(step,"result"))
      of "wait": value = await registry.waitJob(id)
      of "pause": await sleepAsync(step["ms"].getInt())
      of "mutate-snapshot":
        let snapshot = registry.jobStatus(id)
        snapshot["state"] = %"outside"
        for key in ["progress","result","error"]:
          let nested = field(snapshot,key)
          if nested != nil and nested.kind == JObject: nested["outside"] = %true
        value = registry.jobStatus(id)
      of "close": await registry.closeJobs()
      else: raise newException(ValueError,"Unknown job scenario operation")
      replies.add(%*{"ok": true,"value": value})
    except CatchableError as error: replies.add(%*{"ok": false,"message": error.msg})
  return %*{"replies": replies,"runnerCalls": calls}

proc jobProcessScenario*(request: JsonNode): Future[JsonNode] {.async.} =
  when defined(macosx):
    let registry = newJobRegistry()
    let manager = newProcessManager()
    var child: ManagedProcess
    var bytes: string
    let runner: JobRunner = proc(signal: ProcessCancel, progress: JobProgress): Future[JsonNode] {.async.} =
      var args: seq[string]
      for value in request["args"]: args.add(value.getStr())
      child = manager.spawnManaged(text(request["command"]),args,signal=signal,graceMs=100,
        onData=proc(stream, chunk: string) =
          if stream == "stdout" and bytes.len < 128: bytes.add(chunk))
      progress(%*{"phase": "running","pid": child.pid})
      while not signal.cancelled and not child.exit.finished: await sleepAsync(5)
      await child.stop()
      return %*{"stopped": true}
    try:
      let started = registry.startJob(%*{"kind": "build","requestKey": "owned-process"},runner)
      let id = text(started["job"]["jobId"])
      if child == nil: raise newException(ValueError,"Owned job fixture failed to spawn")
      var waited = 0
      while "armed" notin bytes and not child.exit.finished and waited < 8000:
        await sleepAsync(10)
        waited += 10
      if "armed" notin bytes: raise newException(ValueError,"Owned job fixture did not arm its signal handlers")
      let pids = parseStrictJson(readFile(text(request["marker"])))
      let cancelling = registry.cancelJob(id)
      var prematureRejected = false
      try: discard registry.succeedJob(id,%*{"premature": true})
      except ValueError: prematureRejected = true
      let closing = registry.closeJobs()
      let pending = not closing.finished
      await closing
      var stillAlive = newJArray()
      for pid in pids:
        stillAlive.add(%(posix.kill(Pid(pid.getInt()),0) == 0 or errno != ESRCH))
      return %*{"cancelling": cancelling,"prematureRejected": prematureRejected,"closeWaited": pending,
        "job": registry.jobStatus(id),"exitFinishedBeforeManagerClose": child.exit.finished,"aliveBeforeManagerClose": stillAlive}
    finally: await manager.close()
  else: raise newException(ValueError,"Process job fixture requires macOS")
