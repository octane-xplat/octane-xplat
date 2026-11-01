import std/[json, math, strutils]
import ./strictjson, ./js_text
from ./args import jsNumber

proc readJson*(path: string): JsonNode =
  try: result = parseStrictJson(decodeUtf8(readFile(path)))
  except CatchableError: result = newJNull()
proc field*(n: JsonNode, key: string): JsonNode =
  if n != nil and n.kind == JObject: n.getOrDefault(key)
  else: nil
proc text*(n: JsonNode): string =
  if n != nil and n.kind == JString: n.getStr else: ""
proc jsStrictEqual*(left, right: JsonNode): bool =
  # JSON's int/float storage distinction is not a JS Number distinction.
  # Objects and arrays instead compare by identity, not structural contents.
  if left == nil or right == nil: return left == nil and right == nil
  if left.kind in {JInt,JFloat} and right.kind in {JInt,JFloat}:
    return left.getFloat() == right.getFloat()
  if left.kind != right.kind: return false
  if left.kind in {JObject,JArray}: return cast[pointer](left) == cast[pointer](right)
  left == right
proc scalarString*(value: JsonNode): string =
  if value == nil: return "undefined"
  case value.kind
  of JString: value.getStr()
  of JFloat, JInt: jsNumber(value.getFloat())
  of JObject: "[object Object]"
  of JArray:
    var parts: seq[string]
    for item in value:
      parts.add(if item.kind == JNull: "" else: scalarString(item))
    parts.join(",")
  else: $value
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
