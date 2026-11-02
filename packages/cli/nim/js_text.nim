## Node-compatible UTF-8 decoding and JavaScript UTF-16 string operations.
## UTF-16 slices may contain a lone surrogate, stored internally as WTF-8;
## json_wire escapes those code units before writing JSON to a byte stream.
import std/[unicode, strutils, math]
import unicodedb/[properties, types, casing, segmentation]

proc decodeUtf8*(bytes: string): string =
  # WHATWG UTF-8 decoder, replacement mode. In particular, reconsume an invalid
  # continuation as a new leading byte; do not collapse adjacent invalid bytes.
  var at = 0
  while at < bytes.len:
    let first = ord(bytes[at])
    inc at
    if first < 128:
      result.add(char(first))
      continue
    var needed, code: int
    var lower = 0x80
    var upper = 0xbf
    if first in 0xc2..0xdf:
      needed = 1; code = first and 0x1f
    elif first in 0xe0..0xef:
      needed = 2; code = first and 0xf
      if first == 0xe0: lower = 0xa0
      if first == 0xed: upper = 0x9f
    elif first in 0xf0..0xf4:
      needed = 3; code = first and 7
      if first == 0xf0: lower = 0x90
      if first == 0xf4: upper = 0x8f
    else:
      result.add("\uFFFD")
      continue
    var valid = true
    for index in 0..<needed:
      if at >= bytes.len or ord(bytes[at]) notin lower..upper:
        valid = false
        break
      code = (code shl 6) or (ord(bytes[at]) and 0x3f)
      inc at
      lower = 0x80; upper = 0xbf
    result.add(if valid: Rune(code).toUTF8() else: "\uFFFD")

proc utf16Units*(value: string): seq[uint16] =
  for rune in value.runes:
    let code = int(rune)
    if code <= 0xffff: result.add(uint16(code))
    else:
      result.add(uint16(0xd800 + ((code - 0x10000) shr 10)))
      result.add(uint16(0xdc00 + ((code - 0x10000) and 0x3ff)))

proc utf16Length*(value: string): int =
  for rune in value.runes: result += (if int(rune) > 0xffff: 2 else: 1)

proc jsStringCompare*(left, right: string): int =
  let a = utf16Units(left)
  let b = utf16Units(right)
  for i in 0..<min(a.len,b.len):
    if a[i] != b[i]: return cmp(a[i],b[i])
  cmp(a.len,b.len)

proc utf16Text*(units: openArray[uint16]): string =
  var at = 0
  while at < units.len:
    var code = int(units[at])
    inc at
    if code in 0xd800..0xdbff and at < units.len and units[at] in 0xdc00'u16..0xdfff'u16:
      code = 0x10000 + ((code-0xd800) shl 10) + int(units[at])-0xdc00
      inc at
    result.add(Rune(code).toUTF8())

proc sliceIndex(index, length: int): int =
  if index < 0: max(0,length+index) else: min(index,length)

proc utf16Slice*(value: string, first: int, last = high(int)): string =
  let units = utf16Units(value)
  let start = sliceIndex(first,units.len)
  let stop = sliceIndex(last,units.len)
  if stop <= start: return ""
  utf16Text(units.toOpenArray(start,stop-1))

proc numberIndex(value: float, length: int): int =
  if classify(value) == fcNan: return 0
  let index = trunc(value)
  let bounded = if index < 0: max(0.0,float(length)+index) else: min(index,float(length))
  int(bounded)

proc utf16SliceNumber*(value: string, first, last: float): string =
  let length = utf16Length(value)
  utf16Slice(value,numberIndex(first,length),numberIndex(last,length))

proc hasSurrogateUnits(value: string): bool =
  var at = value.find('\xed')
  while at >= 0:
    if at+2 < value.len and ord(value[at+1]) in 0xa0..0xbf and ord(value[at+2]) in 0x80..0xbf: return true
    at = value.find('\xed',at+1)
  false
proc utf16Find*(value, needle: string): int =
  if hasSurrogateUnits(value) or hasSurrogateUnits(needle):
    let source = utf16Units(value)
    let target = utf16Units(needle)
    if target.len > source.len: return -1
    for at in 0..source.len-target.len:
      var matches = true
      for offset, unit in target:
        if source[at+offset] != unit: matches = false; break
      if matches: return at
    return -1
  let at = value.find(needle)
  if at < 0: return -1
  utf16Length(value[0..<at])
proc utf16Contains*(value, needle: string): bool = utf16Find(value,needle) >= 0

proc cased(rune: Rune): bool = utmCased in rune.unicodeTypes()
proc caseIgnorable(rune: Rune): bool =
  rune.unicodeCategory() in ctgMn + ctgMe + ctgCf + ctgLm + ctgSk or
    rune.wordBreakProp() in [sgwMidLetter,sgwMidNumLet,sgwSingleQuote]

proc jsLower*(value: string): string =
  let runes = value.toRunes()
  var precedingCased = false
  for at, rune in runes:
    if int(rune) == 0x3a3:
      var next = at+1
      while next < runes.len and caseIgnorable(runes[next]): inc next
      let followingCased = next < runes.len and cased(runes[next])
      result.add(if precedingCased and not followingCased: "ς" else: "σ")
    else:
      for lower in rune.lowerCase(): result.add(lower.toUTF8())
    if not caseIgnorable(rune): precedingCased = cased(rune)

proc wordCharacter*(rune: Rune): bool =
  int(rune) in [ord('_'),ord('$')] or rune.unicodeCategory() in ctgL + ctgN

proc codeWords*(text: string): seq[string] =
  var word = ""
  for rune in text.runes:
    if wordCharacter(rune): word.add(rune.toUTF8())
    elif word != "": result.add(word); word = ""
  if word != "": result.add(word)

proc utf8ForWrite*(text: string): string =
  # Node encodes each lone UTF-16 unit as one replacement character when a
  # string is written to a byte stream or passed to a hash implementation.
  for rune in text.runes:
    result.add(if int(rune) in 0xd800..0xdfff: "\uFFFD" else: rune.toUTF8())
