## Descriptor-driven parsing, matching agent/parse.ts. No command effects here.
import std/[json, strutils, unicode, math]

proc str(n: JsonNode): string =
  if n != nil and n.kind == JString: n.getStr else: ""
proc get(n: JsonNode, key: string): JsonNode =
  if n != nil and n.kind == JObject: n.getOrDefault(key) else: nil
proc parseFailure(message: string, action = ""): JsonNode =
  var err = %*{"code": "invalid_selection", "message": message}
  if action != "": err["recovery"] = %*{"action": action}
  %*{"errors": [err]}
proc utf16Len(s: string): int =
  for rune in s.runes: result += (if int(rune) > 0xffff: 2 else: 1)
proc jsWhitespace*(r: Rune): bool =
  let n = int(r)
  n in [9,10,11,12,13,32,0xa0,0x1680,0x2028,0x2029,0x202f,0x205f,0x3000,0xfeff] or (n >= 0x2000 and n <= 0x200a)
proc jsTrim*(raw: string): string =
  let runes = raw.toRunes()
  var first = 0
  var last = runes.len
  while first < last and jsWhitespace(runes[first]): inc first
  while last > first and jsWhitespace(runes[last-1]): dec last
  for i in first..<last: result.add($runes[i])
proc number(raw: string): float =
  let s = jsTrim(raw)
  if s == "": return 0
  if s.contains('_'): raise newException(ValueError, "Invalid number")
  # Number() accepts unsigned hexadecimal, octal and binary spellings.
  if s.len > 2 and s[0] == '0' and s[1] in {'x','X','b','B','o','O'}:
    let base = if s[1] in {'x','X'}: 16 elif s[1] in {'b','B'}: 2 else: 8
    result = 0
    for ch in s[2..^1]:
      let digit = if ch in {'0'..'9'}: ord(ch)-ord('0') elif ch in {'a'..'f'}: ord(ch)-ord('a')+10 elif ch in {'A'..'F'}: ord(ch)-ord('A')+10 else: -1
      if digit < 0 or digit >= base: raise newException(ValueError, "Invalid number")
      result = result * float(base) + float(digit)
  else: result = parseFloat(s)
proc jsNumber*(n: float): string =
  if n == 0: return "0"
  case classify(n)
  of fcNan: return "NaN"
  of fcInf: return "Infinity"
  of fcNegInf: return "-Infinity"
  else: discard
  # Nim's pinned runtime uses Dragonbox shortest-roundtrip digits. Preserve
  # those digits, but use ECMAScript's decimal/scientific notation thresholds.
  let raw = $abs(n)
  let exponentAt = raw.find({'e','E'})
  let coefficient = if exponentAt < 0: raw else: raw[0..<exponentAt]
  let exponent = if exponentAt < 0: 0 else: parseInt(raw[exponentAt+1..^1])
  let dot = coefficient.find('.')
  var point = (if dot < 0: coefficient.len else: dot) + exponent
  var digits = coefficient.replace(".", "")
  while digits.len > 1 and digits[0] == '0':
    digits.delete(0..0)
    dec point
  while digits.len > 1 and digits[^1] == '0': digits.setLen(digits.len-1)
  if n < 0: result.add('-')
  if point > 21 or point <= -6:
    result.add(digits[0])
    if digits.len > 1: result.add('.'); result.add(digits[1..^1])
    result.add('e')
    if point > 0: result.add('+')
    result.add($(point-1))
  elif point <= 0: result.add("0." & repeat('0',-point) & digits)
  elif point >= digits.len: result.add(digits & repeat('0',point-digits.len))
  else: result.add(digits[0..<point] & "." & digits[point..^1])

proc parseArgs*(command: JsonNode, argv: seq[string]): JsonNode =
  let name = str(command["name"])
  var values = newJObject()
  var positionals: seq[string]
  var help = false
  var i = 0
  while i < argv.len:
    let token = argv[i]
    inc i
    if token == "--":
      positionals.add(argv[i..^1]); break
    if not token.startsWith("-"):
      positionals.add(token); continue
    let eq = token.find('=')
    let flagToken = if eq < 0: token else: token[0..<eq]
    let flag = if flagToken.startsWith("--"): flagToken[2..^1] else: flagToken[1..^1]
    var raw = if eq < 0: "" else: token[eq+1..^1]
    var supplied = eq >= 0
    if flag in ["help", "h"]:
      help = true; continue
    var def: JsonNode
    for candidate in command["flags"]:
      if str(candidate["flag"]) == flag: def = candidate
    if def == nil:
      return parseFailure("Unknown option --" & flag & " for `xplat " & name & "`.", "Run `xplat " & name & " --help` or `--schema` for its contract.")
    let kind = str(def["type"])
    if not supplied and kind != "boolean":
      if i >= argv.len or (argv[i].startsWith("-") and argv[i] != "-"):
        return parseFailure("--" & flag & " expects a value.")
      raw = argv[i]; inc i; supplied = true
    var value: JsonNode
    case kind
    of "boolean":
      if supplied: return parseFailure("--" & flag & " takes no value")
      value = %true
    of "integer":
      var n: float
      try: n = number(raw)
      except ValueError: return parseFailure("--" & flag & " expects an integer, got \"" & raw & "\"")
      if n.classify in {fcNan, fcInf, fcNegInf} or n != trunc(n):
        return parseFailure("--" & flag & " expects an integer, got \"" & raw & "\"")
      if get(def, "min") != nil and n < def["min"].getFloat():
        return parseFailure("--" & flag & " must be >= " & $def["min"] & ", got " & jsNumber(n))
      if get(def, "max") != nil and n > def["max"].getFloat():
        return parseFailure("--" & flag & " must be <= " & $def["max"] & ", got " & jsNumber(n))
      # JSON.stringify serializes negative zero as 0.
      value = if n == 0: %0 else: %n
    of "enum":
      var accepted = false
      var choices: seq[string]
      for choice in def["values"]:
        choices.add(str(choice))
        if str(choice) == raw: accepted = true
      if not accepted: return parseFailure("--" & flag & " must be one of " & choices.join(", ") & " — got \"" & raw & "\"")
      value = %raw
    else: value = %raw
    let key = if get(def,"key") != nil: str(def["key"]) else: flag
    values[key] = value
  if help: return %*{"values": values, "help": true}
  for def in command["flags"]:
    let key = if get(def,"key") != nil: str(def["key"]) else: str(def["flag"])
    if not values.hasKey(key) and get(def,"default") != nil: values[key] = def["default"]
  let expected = command["positionals"]
  var required: seq[string]
  for def in expected:
    if get(def,"required") != nil and def["required"].getBool(): required.add(str(def["name"]))
  if positionals.len < required.len:
    return parseFailure("Missing required argument <" & required[0] & "> for `xplat " & name & "`.", "Run `xplat " & name & " --help` for usage.")
  if positionals.len > expected.len:
    return parseFailure("Unexpected argument \"" & positionals[expected.len] & "\" for `xplat " & name & "`.", "Run `xplat " & name & " --help` for usage.")
  for index in 0..<expected.len:
    let def = expected[index]
    if index >= positionals.len: continue
    let value = positionals[index]
    if get(def,"min") != nil and utf16Len(value) < def["min"].getInt():
      return parseFailure("<" & str(def["name"]) & "> must be at least " & $def["min"] & " character(s).")
    if get(def,"max") != nil and utf16Len(value) > def["max"].getInt():
      return parseFailure("<" & str(def["name"]) & "> must be at most " & $def["max"] & " characters.")
    values[str(def["name"])] = %value
  %*{"values": values, "help": false}
