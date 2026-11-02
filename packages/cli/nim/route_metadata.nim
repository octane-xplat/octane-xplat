## Stable compiler-worker metadata; no dependency on a JavaScript parser AST.
import std/json
proc routeMetadata*(value: JsonNode): JsonNode =
  if value == nil or value.kind != JObject: raise newException(ValueError,"Invalid route metadata from project worker")
  for key,item in value:
    if key == "dataMode":
      if item.kind != JString or item.getStr() notin ["baked", "live"]: raise newException(ValueError,"Invalid route data mode from project worker")
    elif key in ["loader", "guard", "group", "validateSearch", "head", "errorBoundary"]:
      if item.kind != JBool: raise newException(ValueError,"Invalid route capability from project worker")
    else: raise newException(ValueError,"Unknown route metadata field from project worker: " & key)
  value
