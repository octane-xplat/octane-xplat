## Inert TypeScript code-generation literals; every dynamic slot is native.
import std/json
import ./strictjson, ./jsonutil
const source = staticRead("route_templates.json")
var templates: JsonNode

proc renderRouteTemplate*(name, expectedShape: string, values: openArray[string]): string =
  if templates == nil: templates = parseStrictJson(source)
  let definition = field(templates,name)
  if definition == nil or text(field(definition,"shapeHash")) != expectedShape:
    raise newException(ValueError,"Native route template '" & name & "' changed its dynamic structure; review the Nim renderer before generating output")
  let parts = definition["parts"]
  if parts.len != values.len+1:
    raise newException(ValueError,"Native route template '" & name & "' received an incorrect slot count")
  result = parts[0].getStr()
  for i, value in values: result.add(value); result.add(parts[i+1].getStr())
