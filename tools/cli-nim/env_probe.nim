## Test-only environment expansion driver, excluded from the native tarball.
import std/[json, os, options, tables, asyncdispatch, strutils, strtabs]
import ../../packages/cli/nim/[typecheck_envs, strictjson, jsonutil, json_wire, workspace_glob]
import ../../packages/cli/nim/route_config
import ../../packages/cli/nim/route_paths
import ../../packages/cli/nim/[route_generation, digests, js_text]
import ../../packages/cli/nim/route_operation
import ../../packages/cli/nim/build_worker
import ../../packages/cli/nim/managed_process
import ../../packages/cli/nim/[prerequisites, command_probe]
import ../../packages/cli/nim/target_discovery
import ./sessions_scenario
import ./jobs_scenario
import ../../packages/cli/nim/[runtime_logs, runtime_build]
import ../../packages/cli/nim/contract_failure
import ../../packages/cli/nim/macos_build

proc logsScenario(request: JsonNode): JsonNode =
  let logs = newRuntimeLogs((if field(request,"limit") == nil: 2000 else: request["limit"].getInt()),
    (if field(request,"byteLimit") == nil: 2*1024*1024 else: request["byteLimit"].getInt()))
  var observed = newJArray()
  let watcher = logs.watchLogs(proc(record: JsonNode) = observed.add(record.copy()))
  if field(request,"badObserver") == %true:
    discard logs.watchLogs(proc(record: JsonNode) =
      record["line"] = %"observer mutation"
      raise newException(ValueError,"observer failure"))
  result = newJArray()
  for step in request["steps"]:
    var value: JsonNode
    case text(step["op"])
    of "append": value = logs.appendLog(text(step["line"]),
      stream=(if field(step,"stream") == nil: "stdout" else: text(step["stream"])),
      source=text(field(step,"source")),level=text(field(step,"level")),lineTruncated=field(step,"lineTruncated") == %true)
    of "note": value = logs.noteLog(text(step["line"]))
    of "reset": logs.resetLogs(text(step["reason"])); value = newJNull()
    of "unwatch": logs.unwatchLogs(watcher); value = newJNull()
    of "observed": value = observed.copy()
    of "errors": value = %logs.logObserverFailures()
    of "read":
      value = logs.readLogs((if field(step,"cursor") == nil or step["cursor"].kind == JNull: none(int) else: some(step["cursor"].getInt())),
        (if field(step,"limit") == nil: 500 else: step["limit"].getInt()),text(field(step,"stream")))
    of "mutate":
      let snapshot = logs.readLogs()
      if snapshot["records"].len > 0: snapshot["records"][0]["line"] = %"caller mutation"
      value = newJNull()
    else: raise newException(ValueError,"Unknown log scenario")
    result.add(if value == nil: newJNull() else: value.copy())

proc commandQuery(request: JsonNode): Future[JsonNode] {.async.} =
  let signal = newProcessCancel()
  if field(request,"preabort") == %true: signal.cancel()
  let env = newStringTable(modeCaseSensitive)
  if field(request,"env") != nil:
    for key,item in request["env"]: env[key] = item.getStr()
  var args: seq[string]
  for value in request["args"]: args.add(value.getStr())
  let pending = probeCommand(text(request["cmd"]),args,cwd=text(request["dir"]),environment=env,
    timeoutMs=(if field(request,"timeoutMs") == nil: 15000 else: request["timeoutMs"].getInt()),
    maxStdoutBytes=(if field(request,"limit") == nil: 1024*1024 else: request["limit"].getInt()),signal=signal)
  while not pending.finished:
    if field(request,"cancelFile") != nil and fileExists(text(request["cancelFile"])): signal.cancel()
    await sleepAsync(5)
  let value = await pending
  return if value.isSome: %value.get() else: newJNull()

for line in stdin.lines:
  var routeRequest = false
  var warnings: seq[string]
  try:
    let request = parseStrictJson(line)
    let dir = text(request["dir"])
    var value: JsonNode
    case text(request["operation"])
    of "runtime-logs": value = logsScenario(request)
    of "native-build":
      let logs = newRuntimeLogs()
      let signal = newProcessCancel()
      try:
        value = waitFor runProjectBuild(%*{"id": ".","root": dir},
          (if field(request,"platform") == nil: "web" else: text(request["platform"])),logs,signal,
          timeoutMs=(if field(request,"timeoutMs") == nil: 900000 else: request["timeoutMs"].getInt()))
      except CatchableError as error: value = %*{"error": failureData(error),"logs": logs.readLogs()}
    of "publish-macos":
      var preserve = false
      try: value = publishMacOSArtifacts(dir,text(request["stage"]),request["plan"],preserve)
      except CatchableError as error: value = %*{"error": failureData(error),"preserveStage": preserve}
    of "jobs": value = waitFor jobScenario(request)
    of "job-process": value = waitFor jobProcessScenario(request)
    of "session-process": value = waitFor sessionProcessScenario(request)
    of "sessions": value = waitFor sessionScenario(request)
    of "host-block":
      let blocked = hostBlock(text(request["platform"]),text(request["host"]))
      value = if blocked.isSome: %blocked.get() else: newJNull()
    of "target-parse":
      let raw = field(request,"output")
      let output = if raw == nil or raw.kind == JNull: none(string) else: some(raw.getStr())
      value = if text(request["platform"]) == "ios": iosTargets(output) else: androidTargets(output)
    of "target-query":
      let env = newStringTable(modeCaseSensitive)
      if field(request,"env") != nil:
        for key,item in request["env"]: env[key] = item.getStr()
      let signal = newProcessCancel()
      if field(request,"preabort") == %true: signal.cancel()
      value = waitFor discoverHostMobileTargets(text(request["platform"]),dir,env,signal)
    of "command-probe": value = waitFor commandQuery(request)
    of "prerequisites":
      var platforms: seq[string]
      for item in request["platforms"]: platforms.add(item.getStr())
      let env = newStringTable(modeCaseSensitive)
      if field(request,"env") != nil:
        for key,item in request["env"]: env[key] = item.getStr()
      value = waitFor checkHostPrerequisites(platforms,dir,
        manager=(if field(request,"manager") == nil: "bun" else: text(request["manager"])),environment=env)
    of "load": value = loadEnvManifest(dir)
    of "routing": value = loadRoutingConfig(dir,field(request,"allowMissingSources") == %true)
    of "route-path": value = routeFor(text(request["path"]),field(request,"markdown") == %true)
    of "route-segment": value = %normalizeRouteSegment(text(request["segment"]))
    of "route-param":
      let name = routeParamName(text(request["segment"]))
      value = if name.isSome: %name.get() else: newJNull()
    of "route-generate":
      routeRequest = true
      let directory = if field(request,"directory") == nil: none(string) else: some(text(request["directory"]))
      let output = if field(request,"output") == nil: none(string) else: some(text(request["output"]))
      let planned = waitFor prepareRoutes(dir,directory,output,bake=false,
        onWarn=proc(message: string) = warnings.add(message))
      if field(request,"publish") == %true: planned.publishRoutes()
      var outputs = newJObject()
      for file, source in planned.outputs: outputs[relativePath(file,dir)] = %source
      value = %*{"count": (if planned.count.isNone: %false else: %planned.count.get()),"warnings": planned.warnings,"outputs": outputs}
    of "build-worker":
      let signal = newProcessCancel()
      if field(request,"preabort") == %true: signal.cancel()
      let env = newStringTable(modeCaseSensitive)
      if field(request,"env") != nil:
        for key,item in request["env"]: env[key] = item.getStr()
      value = waitFor runBuildWorker(dir,text(request["call"]),request["payload"],
        (if field(request,"timeoutMs") == nil: 60000 else: request["timeoutMs"].getInt()),signal,env,
        proc(bytes: string) =
          stderr.write(bytes)
          if field(request,"cancelOnDiagnostic") != nil and text(request["cancelOnDiagnostic"]) in bytes: signal.cancel())
    of "expand":
      let loaded = loadEnvManifest(dir)
      if loaded == nil: value = newJNull()
      else:
        let programs = expandEnvPrograms(dir,loaded,text(request["ambientRoot"]))
        value = %*{"programs": programs,"written": readFile(text(programs[0]["configPath"]))}
    of "glob": value = %filesystemGlob(dir,@[text(request["pattern"])],@[])
    else: raise newException(ValueError,"Unknown operation")
    echo wireJson(%*{"ok": true,"value": (if value == nil: newJNull() else: value)})
  except CatchableError as error:
    var failure = %*{"ok": false,"message": error.msg}
    if routeRequest: failure["warnings"] = %warnings
    echo wireJson(failure)
