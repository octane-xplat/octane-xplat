## Incremental UTF-8 and UTF-16-bounded line framing for managed child pipes.
import std/strutils
import ./js_text

type
  ProcessLine* = object
    stream*, line*: string
    lineTruncated*: bool
  ProcessLines* = object
    tail, pending: string
    discarding: bool

proc completePrefix(bytes: string): int =
  ## Retain only a valid, incomplete UTF-8 suffix for the next write.
  result = bytes.len
  for at in max(0,bytes.len-3)..<bytes.len:
    let first = ord(bytes[at])
    let length = if first in 0xc2..0xdf: 2 elif first in 0xe0..0xef: 3
      elif first in 0xf0..0xf4: 4 else: 0
    if length == 0 or bytes.len-at >= length: continue
    var valid = true
    for index in at+1..<bytes.len:
      let byte = ord(bytes[index])
      let lower = if index == at+1 and first == 0xe0: 0xa0
        elif index == at+1 and first == 0xf0: 0x90 else: 0x80
      let upper = if index == at+1 and first == 0xed: 0x9f
        elif index == at+1 and first == 0xf4: 0x8f else: 0xbf
      if byte notin lower..upper: valid = false; break
    if valid: return at

proc feed*(decoder: var ProcessLines, bytes, stream: string, eof = false): seq[ProcessLine] =
  let combined = decoder.tail & bytes
  let ending = if eof: combined.len else: completePrefix(combined)
  let text = decodeUtf8(combined[0..<ending])
  decoder.tail = combined[ending..^1]
  var at = 0
  while at < text.len:
    let newline = text.find('\n',at)
    let stop = if newline < 0: text.len else: newline+1
    if not decoder.discarding: decoder.pending.add(text[at..<stop])
    if utf16Length(decoder.pending) > 8192:
      result.add(ProcessLine(stream: stream,line: utf16Slice(decoder.pending,0,8192),lineTruncated: true))
      decoder.pending = ""
      decoder.discarding = true
    if newline >= 0:
      if not decoder.discarding:
        var line = decoder.pending[0..^2]
        if line.endsWith("\r"): line.setLen(line.len-1)
        result.add(ProcessLine(stream: stream,line: line))
      decoder.pending = ""
      decoder.discarding = false
    at = stop
  if eof and decoder.pending != "":
    result.add(ProcessLine(stream: stream,line: decoder.pending))
    decoder.pending = ""
