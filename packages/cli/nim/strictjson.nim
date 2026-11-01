## Validate RFC 8259 grammar before using Nim's more permissive JSON reader.
## Manifests use JSON.parse semantics; Bun lockfiles intentionally use JSONC.
import std/json

proc parseStrictJson*(source: string): JsonNode =
  var at = 0
  proc invalid() {.noreturn.} =
    raise newException(ValueError, "Invalid JSON")
  proc whitespace() =
    while at < source.len and source[at] in {' ', '\t', '\r', '\n'}: inc at
  proc take(ch: char) =
    if at >= source.len or source[at] != ch: invalid()
    inc at
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
          for i in 0..<4:
            if at >= source.len or source[at] notin {'0'..'9','a'..'f','A'..'F'}: invalid()
            inc at
        elif escaped notin {'"','\\','/','b','f','n','r','t'}: invalid()
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
      if source[at] == '-': inc at
      if at >= source.len: invalid()
      if source[at] == '0': inc at
      elif source[at] in {'1'..'9'}:
        while at < source.len and source[at] in {'0'..'9'}: inc at
      else: invalid()
      if at < source.len and source[at] == '.':
        inc at
        let start = at
        while at < source.len and source[at] in {'0'..'9'}: inc at
        if at == start: invalid()
      if at < source.len and source[at] in {'e','E'}:
        inc at
        if at < source.len and source[at] in {'+','-'}: inc at
        let start = at
        while at < source.len and source[at] in {'0'..'9'}: inc at
        if at == start: invalid()
    else: invalid()
  value(0)
  whitespace()
  if at != source.len: invalid()
  parseJson(source)
