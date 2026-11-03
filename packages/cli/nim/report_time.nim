## Explicit ISO/Apple .ips timestamp syntax, normalized to UTC milliseconds.
import std/[times, strutils, options]

proc reportTime*(value: string): Option[int64] =
  try:
    let source = value.strip()
    if source.len < 20 or source[10] notin {'T',' '}: return none(int64)
    var base = source[0..<19]
    base[10] = 'T'
    let instant = parse(base,"yyyy-MM-dd'T'HH:mm:ss",utc()).toTime().toUnix()*1000
    var at = 19
    var milliseconds: int64
    if source[at] == '.':
      inc at
      let first = at
      while at < source.len and source[at] in {'0'..'9'}: inc at
      if at == first: return none(int64)
      milliseconds = int64(parseInt((source[first..<at] & "000")[0..<3]))
    while at < source.len and source[at] == ' ': inc at
    if at >= source.len: return none(int64)
    let zone = source[at..^1]
    var offset: int64
    if zone != "Z":
      if zone.len notin [5,6] or zone[0] notin {'+','-'}: return none(int64)
      let digits = zone[1..^1].replace(":","")
      if digits.len != 4 or (zone.len == 6 and zone[3] != ':'): return none(int64)
      for ch in digits:
        if ch notin {'0'..'9'}: return none(int64)
      let hours = parseInt(digits[0..<2])
      let minutes = parseInt(digits[2..<4])
      if hours > 23 or minutes > 59: return none(int64)
      offset = int64(hours*60+minutes)*60000*(if zone[0] == '-': -1 else: 1)
    some(instant+milliseconds-offset)
  except CatchableError: none(int64)

proc reportTimestamp*(milliseconds: int64): string =
  let seconds = milliseconds div 1000-(if milliseconds mod 1000 < 0: 1 else: 0)
  let fraction = milliseconds-seconds*1000
  fromUnix(seconds).utc.format("yyyy-MM-dd'T'HH:mm:ss") & "." & align($fraction,3,'0') & "Z"
