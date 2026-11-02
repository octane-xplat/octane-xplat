## Public human-oriented routes command; native orchestration, project JS baking.
import std/[json, asyncdispatch, options, strutils]
import ./route_operation, ./route_watch, ./managed_process, ./jsonutil, ./js_text
import ./args

proc parseOrchestrationArguments*(descriptor: JsonNode, argv: seq[string]): JsonNode =
  var normalized: seq[string]
  for token in argv:
    var expanded = token
    if token.startsWith("-") and not token.startsWith("--") and token.len >= 2:
      for flag in descriptor["flags"]:
        if token[1..1] == text(field(flag,"short")):
          if token.len == 2: expanded = "--" & text(flag["flag"])
          elif token[2] == '=': expanded = "--" & text(flag["flag"]) & token[2..^1]
          break
    normalized.add(expanded)
  result = parseArgs(descriptor,normalized)
  if result.hasKey("errors"):
    for error in result["errors"]:
      if error.hasKey("recovery"):
        error["recovery"]["action"] = %("Run `xplat " & text(descriptor["name"]) & " --help` for usage.")

proc generated(count: int) =
  stdout.writeLine("Generated route contracts and platform catalogs — " & $count & " route" & (if count == 1: "" else: "s"))
  stdout.flushFile()

proc runRoutes*(project: string, values: JsonNode): Future[int] {.async.} =
  installProcessSignalHandlers()
  let directory = if field(values,"dir") == nil: none(string) else: some(text(values["dir"]))
  let output = if field(values,"out") == nil: none(string) else: some(text(values["out"]))
  if truthy(field(values,"watch")):
    var status = 0
    let watcher = startRouteWatcher(project,directory,output,
      onGenerated=proc(count: Option[int]) =
        if count.isSome: status = 0; generated(count.get()),
      onError=proc(message: string) = status = 1; stderr.writeLine(utf8ForWrite(message)))
    try:
      let count = await watcher.ready
      if count.isNone:
        stderr.writeLine("No route dir found — configure xplat.routes.json or pass --dir.")
        return 1
      stdout.writeLine("Watching route sources and xplat.routes.json — Ctrl+C stops watching")
      stdout.flushFile()
      while interruptedSignal() == 0 and not watcher.finished(): await sleepAsync(10)
      return if interruptedSignal() != 0: 128+interruptedSignal() else: status
    finally: await watcher.close()
  let count = await generateNativeRoutes(project,directory,output,
    onWarn=proc(message: string) = stderr.writeLine(utf8ForWrite(message)))
  if count.isNone:
    stderr.writeLine("No route dir found — expected ./app, ./src/app, or xplat.routes.json (or pass --dir).")
    return 1
  generated(count.get())
  return 0
