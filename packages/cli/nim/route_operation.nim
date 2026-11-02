## Native route operation. Project workers supply compiler analysis and JS baking.
import std/[asyncdispatch, json, options]
import ./route_generation, ./build_worker, ./managed_process

proc checkRouteCancellation*(signal: ProcessCancel = nil) =
  if interruptedSignal() != 0 or (signal != nil and signal.cancelled):
    raise newException(ValueError,"Route generation cancelled")

proc prepareRoutes*(project: string, directory = none(string), output = none(string),
    bake = true, signal: ProcessCancel = nil, onWarn: RouteWarningSink = nil): Future[RouteGeneration] {.async.} =
  checkRouteCancellation(signal)
  if routeLocation(project,directory,output).dir.len == 0:
    return validateRoutePlan(%*{"version": 1,"count": false,"outputs": []},project,directory,output)
  let fingerprint = routeInputFingerprint(project,directory,output)
  var request = %*{"bake": bake}
  if directory.isSome: request["directory"] = %directory.get()
  if output.isSome: request["output"] = %output.get()
  var warnings: seq[string]
  let data = await runBuildWorker(project,"route-plan",request,signal=signal,
    onDiagnostic=proc(bytes: string) = stderr.write(bytes),
    onWarning=proc(message: string) =
      warnings.add(message)
      if onWarn != nil: onWarn(message))
  checkRouteCancellation(signal)
  if fingerprint != routeInputFingerprint(project,directory,output):
    raise newException(ValueError,"Route source changed during planning; retry generation")
  result = validateRoutePlan(data,project,directory,output,bake)
  result.warnings = warnings
  checkRouteCancellation(signal)

proc generateNativeRoutes*(project: string, directory = none(string), output = none(string),
    bake = true, signal: ProcessCancel = nil, onWarn: RouteWarningSink = nil): Future[Option[int]] {.async.} =
  let planned = await prepareRoutes(project,directory,output,bake,signal,onWarn)
  checkRouteCancellation(signal)
  planned.publishRoutes()
  return planned.count
