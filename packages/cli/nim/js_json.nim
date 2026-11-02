## JSON.stringify formatting for generated programs and embedded JSON literals.
import std/[json, strutils, math]
import ./jsonutil, ./json_wire
from ./args import jsNumber

proc jsStringify*(node: JsonNode, pretty = false): string =
  proc encode(value: JsonNode, depth: int): string =
    if value == nil: return "null"
    let prefix = if pretty: repeat('\t',depth+1) else: ""
    let newline = if pretty: "\n" else: ""
    let ending = if pretty: "\n" & repeat('\t',depth) else: ""
    let separator = if pretty: ",\n" else: ","
    case value.kind
    of JObject:
      if value.len == 0: return "{}"
      var entries: seq[string]
      for key in jsObjectKeys(value):
        entries.add(prefix & wireJson(%key) & (if pretty: ": " else: ":") & encode(value[key],depth+1))
      "{" & newline & entries.join(separator) & ending & "}"
    of JArray:
      if value.len == 0: return "[]"
      var entries: seq[string]
      for item in value: entries.add(prefix & encode(item,depth+1))
      "[" & newline & entries.join(separator) & ending & "]"
    of JInt, JFloat:
      let number = value.getFloat()
      if classify(number) in [fcNan,fcInf,fcNegInf]: "null"
      else: jsNumber(number)
    else: wireJson(value)
  encode(node,0)
