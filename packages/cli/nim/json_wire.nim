## Well-formed JSON output, including a UTF-16 slice's lone surrogate.
import std/[json, strutils, math]

proc safeNumbers(node: JsonNode): JsonNode =
  if node == nil: return newJNull()
  case node.kind
  of JFloat:
    if classify(node.getFloat()) in [fcNan,fcInf,fcNegInf]: return newJNull()
    if node.getFloat() == 0: return %0
    return node
  of JObject:
    result = newJObject()
    for key, value in node: result[key] = safeNumbers(value)
  of JArray:
    result = newJArray()
    for value in node: result.add(safeNumbers(value))
  else: return node

proc wireJson*(node: JsonNode, pretty = false, indent = 2): string =
  let safe = safeNumbers(node)
  let encoded = if pretty: safe.pretty(indent=indent) else: $safe
  var at = 0
  while at < encoded.len:
    if at+2 < encoded.len and ord(encoded[at]) == 0xed and
        ord(encoded[at+1]) in 0xa0..0xbf and ord(encoded[at+2]) in 0x80..0xbf:
      let code = ((ord(encoded[at]) and 0xf) shl 12) or
        ((ord(encoded[at+1]) and 0x3f) shl 6) or (ord(encoded[at+2]) and 0x3f)
      result.add("\\u" & toHex(code,4).toLowerAscii())
      at += 3
    else:
      result.add(encoded[at])
      inc at
