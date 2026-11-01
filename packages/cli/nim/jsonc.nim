## JSONC comment/trailing-comma normalization followed by strict JSON grammar.
## Never remove characters inside quoted strings or repair missing values.
import std/[json, strutils]
import ./strictjson

proc parseJsonc*(source: string): JsonNode =
  var clean = source
  var at = 0
  var quoted = false
  while at < source.len:
    let ch = source[at]
    if quoted:
      if ch == '\\': at += 2; continue
      if ch == '"': quoted = false
      inc at; continue
    if ch == '"': quoted = true; inc at; continue
    if ch == '/' and at+1 < source.len and source[at+1] == '/':
      while at < source.len and source[at] notin {'\r','\n'}: clean[at] = ' '; inc at
    elif ch == '/' and at+1 < source.len and source[at+1] == '*':
      clean[at] = ' '; clean[at+1] = ' '; at += 2
      var ended = false
      while at < source.len:
        if source[at] == '*' and at+1 < source.len and source[at+1] == '/':
          clean[at] = ' '; clean[at+1] = ' '; at += 2; ended = true; break
        if source[at] notin {'\r','\n'}: clean[at] = ' '
        inc at
      if not ended: raise newException(ValueError, "Unterminated JSONC comment")
    else: inc at
  at = 0
  quoted = false
  var previous = '\0'
  while at < clean.len:
    let ch = clean[at]
    if quoted:
      if ch == '\\': at += 2; continue
      if ch == '"': quoted = false; previous = '"'
      inc at; continue
    if ch == '"': quoted = true; inc at; continue
    if ch == ',' and previous notin {'[','{',':',',','\0'}:
      var next = at+1
      while next < clean.len and clean[next] in {' ','\t','\r','\n'}: inc next
      if next < clean.len and clean[next] in {']','}'}: clean[at] = ' '; inc at; continue
    if ch notin {' ','\t','\r','\n'}: previous = ch
    inc at
  parseStrictJson(clean)
