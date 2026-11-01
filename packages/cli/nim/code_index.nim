## Local TF-IDF index. Builds yield after every 40 input files; exact retrieval
## stays independent. Served stale candidates are revalidated against source.
import std/[json, strutils, unicode, tables, sets, math, algorithm, asyncdispatch]
import ./jsonutil, ./js_text, ./code_retrieval, ./digests
from ./args import jsTrim

const chunkLines = 48
const chunkStride = 40
const maxIndexFiles = 4000
const maxIndexBytes = 8 * 1024 * 1024
const maxChunks = 15000
type
  CorpusCollector* = proc(): JsonNode {.closure.}
  FileAcceptance* = proc(file: JsonNode): bool {.closure.}
  ManifestEntry = tuple[mtimeMs: float, size: float]
  CodeChunk = object
    file: JsonNode
    startLine, endLine: int
    text, hash: string
    tokens: seq[string]
    vector: OrderedTable[string,float]
    norm: float
  CodeIndex* = ref object
    manifest: OrderedTable[string,ManifestEntry]
    chunks: seq[CodeChunk]
    idf: OrderedTable[string,float]
    state, detail: string
    building: Future[void]
    revision, builtFiles: int
    truncated: bool

proc newCodeIndex*(): CodeIndex =
  # Configure callSoon before registering completed-future cleanup callbacks.
  discard getGlobalDispatcher()
  CodeIndex(state: "not-built")

proc codeTokens*(text: string): seq[string] =
  for word in codeWords(text):
    for piece in word.split('_'):
      let runes = piece.toRunes()
      var part = ""
      for at, rune in runes:
        if at > 0:
          let previous = int(runes[at-1])
          let current = int(rune)
          let next = if at+1 < runes.len: int(runes[at+1]) else: -1
          if current in (ord('A')..ord('Z')) and
              (previous in (ord('a')..ord('z')) or previous in (ord('0')..ord('9')) or
                (previous in (ord('A')..ord('Z')) and next in (ord('a')..ord('z')))):
            let lower = jsLower(part)
            if utf16Length(lower) >= 2: result.add(lower)
            part = ""
        part.add(rune.toUTF8())
      let lower = jsLower(part)
      if utf16Length(lower) >= 2: result.add(lower)
    var ascii = true
    for ch in word:
      if ch notin {'a'..'z','A'..'Z','0'..'9','_','$'}: ascii = false
    if utf16Length(word) >= 2 and ascii: result.add(jsLower(word))

proc chunkFile(file: JsonNode, content: string): seq[CodeChunk] =
  let lines = content.split('\n')
  var start = 0
  while start < lines.len:
    let stop = min(lines.len,start+chunkLines)
    let region = lines[start..<stop].join("\n")
    if utf16Length(jsTrim(region)) >= 40 or result.len == 0:
      result.add(CodeChunk(file: %*{"abs": file["abs"],"rel": file["rel"],"corpus": file["corpus"]},
        startLine: start+1,endLine: stop,text: region,hash: sha1Hex(region),
        tokens: codeTokens(text(file["rel"]) & "\n" & region)))
      if stop == lines.len: break
    start += chunkStride

proc fileKey(file: JsonNode): string =
  let corpus = file["corpus"]
  text(corpus["corpus"]) & ":" & text(field(corpus,"package")) & ":" & text(file["rel"])
proc entry(file: JsonNode): ManifestEntry =
  (field(file,"mtimeMs").getFloat(),field(file,"size").getFloat())
proc manifestDrift(index: CodeIndex, files: JsonNode): bool =
  if files.len != index.manifest.len: return true
  for file in files:
    let key = fileKey(file)
    if key notin index.manifest or index.manifest[key] != entry(file): return true
  false

proc build(index: CodeIndex, files: JsonNode): Future[void] {.async.} =
  try:
    var manifest: OrderedTable[string,ManifestEntry]
    for file in files: manifest[fileKey(file)] = entry(file)
    var chunks: seq[CodeChunk]
    var frequency: OrderedTable[string,int]
    var bytes, counted: int
    var capped = false
    for at in 0..<files.len:
      let file = files[at]
      if counted >= maxIndexFiles or bytes > maxIndexBytes or chunks.len >= maxChunks:
        capped = true
        break
      var content: string
      try: content = readSource(text(file["abs"]))
      except CatchableError: continue
      bytes += utf16Length(content)
      inc counted
      for chunk in chunkFile(file,content):
        if chunks.len >= maxChunks:
          capped = true
          break
        chunks.add(chunk)
        var seen = initHashSet[string]()
        for token in chunk.tokens:
          if token notin seen:
            frequency[token] = frequency.getOrDefault(token)+1
            seen.incl(token)
      if at mod 40 == 39: await sleepAsync(0)
    var idf: OrderedTable[string,float]
    for token, count in frequency: idf[token] = ln(1+float(chunks.len)/float(count))
    for chunk in chunks.mitems:
      var tf: OrderedTable[string,int]
      for token in chunk.tokens: tf[token] = tf.getOrDefault(token)+1
      var norm = 0.0
      for token, count in tf:
        let weight = float(count)*idf.getOrDefault(token)
        chunk.vector[token] = weight
        norm += weight*weight
      chunk.norm = if norm == 0: 1.0 else: sqrt(norm)
    index.manifest = manifest
    index.chunks = chunks
    index.idf = idf
    index.builtFiles = counted
    index.truncated = capped
    inc index.revision
    index.state = "ready"
    index.detail = if capped: "index coverage capped at " & $counted & " files / " & $chunks.len & " chunks" else: ""
  except CatchableError as error:
    index.state = "unavailable"
    index.detail = "index build failed: " & error.msg

proc indexStatus*(index: CodeIndex): JsonNode =
  result = %*{"state": (if index.state == "not-built": "unavailable" else: index.state),
    "backend": "local-tfidf","files": index.builtFiles,"chunks": index.chunks.len,"revision": index.revision}
  let detail = if index.detail != "": index.detail elif index.state == "not-built":
    "semantic index builds on first search; exact search needs no index" else: ""
  if detail != "": result["detail"] = %detail
  if index.truncated: result["truncated"] = %true

proc ensureIndex*(index: CodeIndex, collect: CorpusCollector): JsonNode =
  var files: JsonNode
  try: files = collect()
  except CatchableError as error:
    index.state = "unavailable"
    index.detail = "corpus enumeration failed: " & error.msg
    return index.indexStatus()
  let drift = index.state == "not-built" or index.manifestDrift(files)
  if drift and index.building == nil:
    index.state = if index.state == "not-built": "preparing" else: "stale"
    let pending = index.build(files)
    index.building = pending
    pending.addCallback(proc() =
      if index.building == pending: index.building = nil)
  elif drift: index.state = "stale"
  index.indexStatus()

proc readyIndex*(index: CodeIndex, collect: CorpusCollector): Future[JsonNode] {.async.} =
  discard index.ensureIndex(collect)
  let pending = index.building
  if pending != nil: await pending
  if index.building == pending: index.building = nil
  return index.indexStatus()
proc preparing*(index: CodeIndex): bool = index.building != nil

proc current(chunk: CodeChunk): bool =
  var content: string
  try: content = readSource(text(chunk.file["abs"]))
  except CatchableError: return false
  let lines = content.split('\n')
  let first = min(lines.len,chunk.startLine-1)
  let last = min(lines.len,chunk.endLine)
  sha1Hex(lines[first..<last].join("\n")) == chunk.hash

proc chunkJson(chunk: CodeChunk): JsonNode =
  var vector = newJObject()
  for token, weight in chunk.vector: vector[token] = %weight
  %*{"file": chunk.file,"startLine": chunk.startLine,"endLine": chunk.endLine,
    "text": chunk.text,"hash": chunk.hash,"tokens": chunk.tokens,"norm": chunk.norm,"vector": vector}

proc searchIndex*(index: CodeIndex, query: string, limit = 10, accept: FileAcceptance = nil): JsonNode =
  var hits = newJArray()
  var dropped = 0
  result = %*{"hits": hits,"droppedStale": dropped}
  if index.state notin ["ready","stale"]: return
  var tf: OrderedTable[string,int]
  for token in codeTokens(query): tf[token] = tf.getOrDefault(token)+1
  var vector: OrderedTable[string,float]
  var norm = 0.0
  for token, count in tf:
    let weight = float(count)*index.idf.getOrDefault(token,ln(1+float(max(1,index.chunks.len))))
    vector[token] = weight
    norm += weight*weight
  norm = if norm == 0: 1.0 else: sqrt(norm)
  var scored: seq[tuple[at: int,score: float]]
  for at, chunk in index.chunks:
    if accept != nil and not accept(chunk.file): continue
    var dot = 0.0
    for token, weight in vector:
      let chunkWeight = chunk.vector.getOrDefault(token)
      if chunkWeight != 0: dot += weight*chunkWeight
    if dot > 0: scored.add((at,dot/(norm*chunk.norm)))
  scored.sort(proc(a,b: tuple[at:int,score:float]): int =
    if a.score == b.score: cmp(a.at,b.at) else: cmp(b.score,a.score))
  for candidate in scored:
    if hits.len >= limit: break
    let chunk = index.chunks[candidate.at]
    if index.state == "stale" and not chunk.current():
      inc dropped
      continue
    hits.add(%*{"chunk": chunk.chunkJson(),"score": candidate.score})
  result["droppedStale"] = %dropped
