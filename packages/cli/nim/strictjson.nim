## Validate RFC 8259 grammar before using Nim's more permissive JSON reader.
## Manifests use JSON.parse semantics; Bun lockfiles intentionally use JSONC.
import std/[json, unicode, strutils]

proc parseStrictJson*(source: string): JsonNode =
  var at = 0
  var edits: seq[tuple[first,last: int,content: string]]
  proc invalid() {.noreturn.} =
    raise newException(ValueError, "Invalid JSON")
  proc whitespace() =
    while at < source.len and source[at] in {' ', '\t', '\r', '\n'}: inc at
  proc take(ch: char) =
    if at >= source.len or source[at] != ch: invalid()
    inc at
  proc lowUnit(position: int): tuple[bytes,code: int] =
    if position+5 < source.len and source[position] == '\\' and source[position+1] == 'u':
      for next in position+2..position+5:
        if source[next] notin {'0'..'9','a'..'f','A'..'F'}: return (0,0)
      let code = parseHexInt(source[position+2..position+5])
      if code in 0xdc00..0xdfff: return (6,code)
    elif position+2 < source.len and ord(source[position]) == 0xed and
        ord(source[position+1]) in 0xb0..0xbf and ord(source[position+2]) in 0x80..0xbf:
      return (3,0xd000 or ((ord(source[position+1]) and 0x3f) shl 6) or (ord(source[position+2]) and 0x3f))
    (0,0)
  proc stringToken() =
    take('"')
    while at < source.len:
      let ch = source[at]
      inc at
      if ch == '"': return
      if ord(ch) < 32: invalid()
      if ch == '\\':
        if at >= source.len: invalid()
        let escaped = source[at]
        inc at
        if escaped == 'u':
          let escapeStart = at-2
          let digitsStart = at
          for i in 0..<4:
            if at >= source.len or source[at] notin {'0'..'9','a'..'f','A'..'F'}: invalid()
            inc at
          var code = parseHexInt(source[digitsStart..<at])
          if code in 0xd800..0xdfff:
            # JSON.parse keeps lone UTF-16 surrogates, whereas std/json rejects
            # them. Feed the constructor WTF-8 for a lone unit, or ordinary
            # UTF-8 for an adjacent valid pair. json_wire escapes lone units.
            if code in 0xd800..0xdbff:
              let low = lowUnit(at)
              if low.bytes > 0:
                code = 0x10000 + ((code-0xd800) shl 10) + low.code-0xdc00
                at += low.bytes
            edits.add((escapeStart,at,Rune(code).toUTF8()))
        elif escaped notin {'"','\\','/','b','f','n','r','t'}: invalid()
      elif ord(ch) == 0xed and at+1 < source.len and
          ord(source[at]) in 0xa0..0xaf and ord(source[at+1]) in 0x80..0xbf:
        # A semantic JS input string can mix a raw high unit with an escaped
        # low unit. Canonicalize before std/json inserts object keys: doing it
        # afterward could lose the last-write order of duplicate properties.
        let first = at-1
        let high = 0xd000 or ((ord(source[at]) and 0x3f) shl 6) or (ord(source[at+1]) and 0x3f)
        at += 2
        let low = lowUnit(at)
        if low.bytes > 0:
          at += low.bytes
          let code = 0x10000 + ((high-0xd800) shl 10) + low.code-0xdc00
          edits.add((first,at,Rune(code).toUTF8()))
    invalid()
  proc value(depth: int)
  proc value(depth: int) =
    # Bound recursive native stack usage on untrusted project metadata.
    if depth > 512: invalid()
    whitespace()
    if at >= source.len: invalid()
    case source[at]
    of '"': stringToken()
    of '{':
      inc at
      whitespace()
      if at < source.len and source[at] == '}': inc at; return
      while true:
        stringToken()
        whitespace(); take(':'); value(depth+1); whitespace()
        if at < source.len and source[at] == '}': inc at; return
        take(','); whitespace()
    of '[':
      inc at
      whitespace()
      if at < source.len and source[at] == ']': inc at; return
      while true:
        value(depth+1); whitespace()
        if at < source.len and source[at] == ']': inc at; return
        take(',')
    of 't','f','n':
      let literal = if source[at] == 't': "true" elif source[at] == 'f': "false" else: "null"
      for ch in literal: take(ch)
    of '-', '0'..'9':
      let numberStart = at
      if source[at] == '-': inc at
      let digitsStart = at
      if at >= source.len: invalid()
      if source[at] == '0': inc at
      elif source[at] in {'1'..'9'}:
        while at < source.len and source[at] in {'0'..'9'}: inc at
      else: invalid()
      let digitsEnd = at
      var integer = true
      if at < source.len and source[at] == '.':
        integer = false
        inc at
        let start = at
        while at < source.len and source[at] in {'0'..'9'}: inc at
        if at == start: invalid()
      if at < source.len and source[at] in {'e','E'}:
        integer = false
        inc at
        if at < source.len and source[at] in {'+','-'}: inc at
        let start = at
        while at < source.len and source[at] in {'0'..'9'}: inc at
        if at == start: invalid()
      # JSON.parse uses IEEE doubles. std/json otherwise preserves overflowing
      # integer tokens as a private raw-string variant, whose getFloat is 0.
      if integer:
        let digits = source[digitsStart..<digitsEnd]
        if (source[numberStart] == '-' and digits == "0") or
            digits.len > 16 or (digits.len == 16 and digits > "9007199254740991"):
          edits.add((at,at,".0"))
    else: invalid()
  value(0)
  whitespace()
  if at != source.len: invalid()
  if edits.len == 0: return parseJson(source)
  var normalized = ""
  var copied = 0
  for edit in edits:
    normalized.add(source[copied..<edit.first])
    normalized.add(edit.content)
    copied = edit.last
  normalized.add(source[copied..^1])
  parseJson(normalized)
