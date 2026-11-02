## Native route operation. Project workers supply compiler analysis and JS baking.
import std/[asyncdispatch, json, options]
import ./route_generation, ./build_worker, ./managed_process, ./jsonutil
import ./digests, ./js_text

proc checkRouteCancellation*(signal: ProcessCancel = nil) =
  if interruptedSignal() != 0 or (signal != nil and signal.cancelled):
    raise newException(ValueError,"Route generation cancelled")

proc prepareRoutes*(project: string, directory = none(string), output = none(string),
    bake = true, signal: ProcessCancel = nil, onWarn: RouteWarningSink = nil): Future[RouteGeneration] {.async.} =
  checkRouteCancellation(signal)
  let sources = collectRouteSources(project,directory,output)
  let metadata = await analyzeRouteSources(project,sources,signal=signal)
  checkRouteCancellation(signal)
  let analyzer: RouteAnalyzer = proc(source, file: string): JsonNode =
    let entry = field(metadata,file)
    if entry == nil or text(field(entry,"sha256")) != sha256Hex(utf8ForWrite(source)):
      raise newException(ValueError,"Route source changed during analysis; retry generation: " & file)
    entry["metadata"]
  result = planRoutes(project,analyzer,directory,output,onWarn,bake)
  if result.count.isNone: return
  if bake and (result.bakeRequest["loaders"].len > 0 or result.bakeRequest["markdown"].len > 0):
    let data = await runBuildWorker(project,"route-bake",result.bakeRequest,signal=signal,
      onDiagnostic=proc(bytes: string) = stderr.write(bytes))
    result.applyBakedData(data)
  checkRouteCancellation(signal)

proc generateNativeRoutes*(project: string, directory = none(string), output = none(string),
    bake = true, signal: ProcessCancel = nil, onWarn: RouteWarningSink = nil): Future[Option[int]] {.async.} =
  let planned = await prepareRoutes(project,directory,output,bake,signal,onWarn)
  checkRouteCancellation(signal)
  planned.publishRoutes()
  return planned.count
