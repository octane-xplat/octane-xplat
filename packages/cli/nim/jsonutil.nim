import std/[json, math]
import ./strictjson

proc readJson*(path: string): JsonNode =
  try: result = parseStrictJson(readFile(path))
  except CatchableError: result = newJNull()
proc field*(n: JsonNode, key: string): JsonNode =
  if n != nil and n.kind == JObject: n.getOrDefault(key)
  else: nil
proc text*(n: JsonNode): string =
  if n != nil and n.kind == JString: n.getStr else: ""
proc truthy*(n: JsonNode): bool =
  if n == nil: return false
  case n.kind
  of JNull: false
  of JBool: n.getBool()
  of JInt: n.getBiggestInt() != 0
  of JFloat: n.getFloat() != 0 and classify(n.getFloat()) != fcNan
  of JString: n.getStr().len > 0
  else: true
proc deps*(n: JsonNode): JsonNode =
  result = newJObject()
  for section in ["dependencies", "devDependencies"]:
    let d = field(n, section)
    if d != nil and d.kind == JObject:
      for k, v in d: result[k] = v
