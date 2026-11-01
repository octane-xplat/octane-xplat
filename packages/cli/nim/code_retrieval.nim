## Current-source exact/token search and bounded UTF-16 reads.
import std/[json, strutils, algorithm]
import ./jsonutil, ./digests, ./js_text
from ./args import jsTrim

proc contentHash*(text: string): string = sha1Hex(text)[0..<12]
proc readSource*(path: string): string = decodeUtf8(readFile(path))
proc asciiWord(ch: char): bool = ch in {'a'..'z','A'..'Z','0'..'9','_'}
proc identifier(text: string): bool =
  if text == "" or text[0] notin {'a'..'z','A'..'Z','_','$'}: return false
  for ch in text:
    if not asciiWord(ch) and ch != '$': return false
  true
proc boundaryMatch(content, needle: string): bool =
  var start = 0
  while start <= content.len-needle.len:
    let at = content.find(needle,start)
    if at < 0: return false
    let stop = at+needle.len
    let before = at > 0 and asciiWord(content[at-1])
    let after = stop < content.len and asciiWord(content[stop])
    if before != asciiWord(needle[0]) and after != asciiWord(needle[^1]): return true
    start = at+1
  false
proc excerptAt(content, needle: string, tokens: seq[string]): JsonNode =
  let lower = jsLower(content)
  var at = utf16Find(lower,needle)
  if at < 0:
    for token in tokens:
      at = utf16Find(lower,token)
      if at >= 0: break
  if at < 0: at = 0
  let lines = content.split('\n')
  let line = utf16Slice(content,0,at).split('\n').len-1
  let first = max(0,line-2)
  let last = min(lines.len,line+8)
  let excerpt = jsTrim(utf16Slice(lines[first..<last].join("\n"),0,900))
  %*{"line": first+1,"endLine": last,"excerpt": excerpt}

proc searchCodeFiles*(files: JsonNode, query: string, limit = 10): JsonNode =
  let trimmed = jsTrim(query)
  let needle = jsLower(trimmed)
  result = newJArray()
  if needle == "": return
  let tokens = codeWords(needle)
  let boost = identifier(trimmed)
  var scored: seq[JsonNode]
  for file in files:
    var content: string
    try: content = readSource(text(file["abs"]))
    except CatchableError: continue
    let hay = jsLower(text(file["rel"]) & "\n" & content)
    var score = 0
    for token in tokens:
      if hay.contains(token): inc score
    if score == 0: continue
    if hay.contains(needle): score += 100
    if boost and boundaryMatch(content,trimmed): score += 25
    if jsLower(text(file["rel"])).contains(needle): score += 10
    let excerpt = excerptAt(content,needle,tokens)
    scored.add(%*{"corpus": file["corpus"],"file": file,"score": score,
      "line": excerpt["line"],"endLine": excerpt["endLine"],"excerpt": excerpt["excerpt"],
      "contentHash": contentHash(content)})
  scored.sort(proc(a,b: JsonNode): int = cmp(b["score"].getInt(),a["score"].getInt()))
  let stop = if limit < 0: max(0,scored.len+limit) else: min(limit,scored.len)
  for at in 0..<stop: result.add(scored[at])

proc readCodeFile*(path: string, offset = 0.0, limit = 24000.0): JsonNode =
  var content: string
  try: content = readSource(path)
  except CatchableError: return nil
  if content.contains('\0'): return nil
  let sliced = utf16SliceNumber(content,offset,offset+limit)
  let length = utf16Length(content)
  let lines = content.split('\n').len
  let line = utf16SliceNumber(content,0,offset).split('\n').len
  let endLine = min(lines,line+sliced.split('\n').len-1)
  %*{"content": sliced,"offset": offset,
    "nextOffset": (if offset+limit < float(length): %(offset+limit) else: newJNull()),
    "totalLength": length,"line": line,"endLine": endLine,"contentHash": contentHash(content)}
