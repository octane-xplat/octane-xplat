## Test-only environment expansion driver, excluded from the native tarball.
import std/[json, os, options, tables, asyncdispatch, strutils, strtabs]
import ../../packages/cli/nim/[typecheck_envs, strictjson, jsonutil, json_wire, workspace_glob]
import ../../packages/cli/nim/route_config
import ../../packages/cli/nim/route_paths
import ../../packages/cli/nim/[route_generation, digests, js_text]
import ../../packages/cli/nim/route_templates
import ../../packages/cli/nim/build_worker
import ../../packages/cli/nim/managed_process
import ../../packages/cli/nim/[prerequisites, command_probe]
import ../../packages/cli/nim/target_discovery

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
      let sources = collectRouteSources(dir,directory,output)
      let cache = if field(request,"metadata") != nil: request["metadata"] else: waitFor analyzeRouteSources(dir,sources)
      let analyzer: RouteAnalyzer = proc(source, file: string): JsonNode =
        let entry = field(cache,file)
        if entry == nil or text(field(entry,"sha256")) != sha256Hex(utf8ForWrite(source)):
          raise newException(ValueError,"Route parser snapshot changed or is missing: " & file)
        if field(entry,"parserError") != nil: raise newException(ValueError,text(entry["parserError"]))
        entry["metadata"]
      let planned = planRoutes(dir,analyzer,
        (if field(request,"directory") == nil: none(string) else: some(text(request["directory"]))),
        (if field(request,"output") == nil: none(string) else: some(text(request["output"]))),
        proc(message: string) = warnings.add(message))
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
    of "route-template":
      var values: seq[string]
      for item in request["values"]: values.add(item.getStr())
      value = %renderRouteTemplate(text(request["name"]),text(request["shape"]),values)
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
