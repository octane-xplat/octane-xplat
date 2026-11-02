## Shared CLI/RPC selector validation before app/capture lookup.
import std/json
import ./jsonutil, ./contract_failure

proc validateDiagnosticSelection*(values: JsonNode) =
  for key in ["sessionId","jobId","reportId","platform","stream"]:
    let value = field(values,key)
    if value != nil and value.kind notin [JNull,JString]:
      raise contractFailure("invalid_selection",key & " must be a string")
  let platform = field(values,"platform")
  if truthy(platform) and platform notin [%"web",%"ios",%"android",%"macos",%"linux",%"windows"]:
    raise contractFailure("invalid_selection","Unknown platform")
  if truthy(field(values,"sessionId")) and truthy(field(values,"jobId")):
    raise contractFailure("invalid_selection","Pass only one of --session or --job.")
  if truthy(platform) and truthy(field(values,"jobId")):
    raise contractFailure("invalid_selection","--platform filters sessions; a job id already selects its capture.")
  let paginated = field(values,"cursor") != nil or field(values,"limit") != nil or field(values,"stream") != nil
  if truthy(field(values,"reportId")):
    if not truthy(field(values,"sessionId")) or paginated:
      raise contractFailure("invalid_selection","--report requires --session and cannot be combined with log pagination or stream filters.")
    raise contractFailure("unavailable","Native report lookup for development sessions is pending.")
  if paginated and not truthy(field(values,"sessionId")) and not truthy(field(values,"jobId")):
    raise contractFailure("invalid_selection","Log pagination and stream filters require --session or --job.")
