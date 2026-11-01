## FTS5 + cached embedding retrieval over a version-bound Markdown inventory.
## Model loading is an explicit provider boundary, never a JS/runtime fallback.
import std/[json, os, strutils, tables, math, algorithm, unicode]
import unicodedb/[properties, types]
import ./sqlite_store, ./jsonutil, ./json_wire, ./strictjson, ./js_text, ./markdown_chunks, ./digests
from ./args import jsTrim

type
  EmbeddingPrepare* = proc() {.closure.}
  EmbeddingBatch* = proc(texts: seq[string]): seq[seq[float]] {.closure.}
  EmbeddingDispose* = proc() {.closure.}
  DocsEmbedder* = ref object
    id*: string
    prepare*: EmbeddingPrepare
    embed*: EmbeddingBatch
    dispose*: EmbeddingDispose

const schema = """PRAGMA busy_timeout=10000;
CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS chunks (snapshot TEXT, key TEXT, data TEXT, PRIMARY KEY(snapshot,key));
CREATE VIRTUAL TABLE IF NOT EXISTS fulltext USING fts5(snapshot UNINDEXED, key UNINDEXED, text);
CREATE TABLE IF NOT EXISTS embeddings (model TEXT, hash TEXT, vector TEXT, PRIMARY KEY(model,hash));"""

proc digest(text: string): string = sha256Hex(utf8ForWrite(text))
proc embeddingText*(chunk: JsonNode): string =
  text(chunk["title"]) & "\n" & text(chunk["heading"]) & "\n" & text(chunk["content"])
proc docsInventory*(documents: JsonNode, binding: string): JsonNode =
  let chunks = newJArray()
  for document in documents:
    for chunk in chunkMarkdown(document): chunks.add(chunk)
  %*{"chunks": chunks,"snapshot": digest("sections-v1:" & binding & ":" & wireJson(chunks))}
proc database(cacheDir: string): SqliteDatabase =
  createDir(cacheDir)
  result = openSqlite(cacheDir / "search-v1.sqlite")
  try: result.exec(schema)
  except CatchableError:
    result.close()
    raise
proc snapshotExists(db: SqliteDatabase, snapshot: string): bool =
  db.query("SELECT id FROM snapshots WHERE id=?",[%snapshot]).len > 0
proc sync(db: SqliteDatabase, snapshot: string, chunks: JsonNode) =
  if db.snapshotExists(snapshot): return
  db.exec("BEGIN IMMEDIATE")
  try:
    if not db.snapshotExists(snapshot):
      let row = db.prepare("INSERT INTO chunks VALUES (?,?,?)")
      defer: row.close()
      let fts = db.prepare("INSERT INTO fulltext VALUES (?,?,?)")
      defer: fts.close()
      for chunk in chunks:
        row.run([%snapshot,chunk["key"],%wireJson(chunk)])
        fts.run([%snapshot,chunk["key"],%(text(chunk["path"]) & "\n" & embeddingText(chunk))])
      let record = db.prepare("INSERT INTO snapshots VALUES (?)")
      defer: record.close()
      record.run([%snapshot])
    db.exec("COMMIT")
  except CatchableError:
    db.exec("ROLLBACK")
    raise
proc validVector(values: JsonNode): bool =
  if values == nil or values.kind != JArray or values.len == 0: return false
  for value in values:
    if value.kind notin {JInt,JFloat} or classify(value.getFloat()) in {fcNan,fcInf,fcNegInf}: return false
  true
proc vector(db: SqliteDatabase, embedder: DocsEmbedder, chunk: JsonNode): JsonNode =
  let rows = db.query("SELECT vector FROM embeddings WHERE model=? AND hash=?",[%embedder.id,%digest(embeddingText(chunk))])
  if rows.len == 0: return nil
  let values = parseStrictJson(text(rows[0]["vector"]))
  if validVector(values): values else: nil
proc normalizeEmbedding*(values: seq[float]): seq[float] =
  if values.len == 0: raise newException(ValueError,"Invalid embedding vector")
  var scale = 0.0
  for value in values:
    if classify(value) in {fcNan,fcInf,fcNegInf}: raise newException(ValueError,"Invalid embedding vector")
    scale = max(scale,abs(value))
  if scale == 0: raise newException(ValueError,"Zero embedding vector")
  # Scaled compensated summation keeps hypot's finite/subnormal behavior.
  var sum, correction: float
  for value in values:
    let scaled = value/scale
    let term = scaled*scaled-correction
    let next = sum+term
    correction = (next-sum)-term
    sum = next
  let norm = sqrt(sum)*scale
  for value in values: result.add(value/norm)
proc runEmbedding(embedder: DocsEmbedder, texts: seq[string]): seq[seq[float]] =
  if embedder == nil or embedder.embed == nil: raise newException(IOError,"Embedding provider is unavailable")
  embedder.embed(texts)

proc prepareDocsIndex*(documents: JsonNode, binding, cacheDir: string, embedder: DocsEmbedder): JsonNode =
  if embedder == nil: raise newException(IOError,"Embedding provider is unavailable")
  let inventory = docsInventory(documents,binding)
  let chunks = inventory["chunks"]
  let snapshot = text(inventory["snapshot"])
  let db = database(cacheDir)
  try:
    if chunks.len > 0 and embedder.prepare != nil: embedder.prepare()
    db.sync(snapshot,chunks)
    var missing: OrderedTable[string,JsonNode]
    for chunk in chunks:
      if db.vector(embedder,chunk) == nil: missing[digest(embeddingText(chunk))] = chunk
    var pending: seq[tuple[key: string,chunk: JsonNode]]
    for key, chunk in missing: pending.add((key,chunk))
    var offset, embedded: int
    while offset < pending.len:
      let stop = min(pending.len,offset+32)
      var texts: seq[string]
      for at in offset..<stop: texts.add(embeddingText(pending[at].chunk))
      let vectors = runEmbedding(embedder,texts)
      if vectors.len != stop-offset: raise newException(ValueError,"Embedding count mismatch")
      var normalized: seq[seq[float]]
      for vector in vectors: normalized.add(normalizeEmbedding(vector))
      db.exec("BEGIN IMMEDIATE")
      try:
        let insert = db.prepare("INSERT OR REPLACE INTO embeddings VALUES (?,?,?)")
        defer: insert.close()
        for at in offset..<stop:
          insert.run([%embedder.id,%pending[at].key,%wireJson(%normalized[at-offset])])
        db.exec("COMMIT")
      except CatchableError:
        db.exec("ROLLBACK")
        raise
      embedded += stop-offset
      offset = stop
    return %*{"status": "ready","snapshot": snapshot,"model": embedder.id,"chunks": chunks.len,"embedded": embedded}
  finally:
    db.close()
    if embedder.dispose != nil: embedder.dispose()

proc queryTerms(value: string): seq[string] =
  var word: string
  for rune in value.runes:
    if int(rune) == ord('_') or rune.unicodeCategory() in ctgL + ctgN: word.add(rune.toUTF8())
    elif word != "": result.add(word); word = ""
  if word != "": result.add(word)
proc sliceStop(limit, length: int): int =
  if limit < 0: max(0,length+limit) else: min(limit,length)
proc searchDocsIndex*(documents: JsonNode, binding, cacheDir, query: string,
    embedder: DocsEmbedder, limit = 10, mode = "hybrid"): JsonNode =
  if embedder == nil: raise newException(IOError,"Embedding provider is unavailable")
  let inventory = docsInventory(documents,binding)
  let chunks = inventory["chunks"]
  let snapshot = text(inventory["snapshot"])
  let db = database(cacheDir)
  try:
    db.sync(snapshot,chunks)
    var terms: seq[string]
    for term in queryTerms(query): terms.add("\"" & term & "\"")
    var lexical = newJArray()
    if terms.len > 0:
      lexical = db.query("SELECT key FROM fulltext WHERE fulltext MATCH ? AND snapshot=? ORDER BY bm25(fulltext) LIMIT ?",
        [%terms.join(" OR "),%snapshot,%max(50,limit*5)])
    var ranks: OrderedTable[string,float]
    for at in 0..<lexical.len: ranks[text(lexical[at]["key"])] = 1.0/float(61+at)
    var used = "lexical"
    var reason = if mode == "hybrid": "index-not-ready" else: ""
    if mode == "hybrid" and chunks.len > 0:
      var vectors: seq[JsonNode]
      var complete = true
      for chunk in chunks:
        let found = db.vector(embedder,chunk)
        vectors.add(found)
        if found == nil: complete = false
      if complete:
        try:
          let raw = runEmbedding(embedder,@[query])
          if raw.len == 0: raise newException(ValueError,"Invalid embedding vector")
          let normalized = normalizeEmbedding(raw[0])
          var scored: seq[tuple[key: string,score: float]]
          for at, vector in vectors:
            if vector.len != normalized.len: raise newException(ValueError,"Embedding dimensions changed")
            var score = 0.0
            for dimension in 0..<vector.len:
              let product = vector[dimension].getFloat()*normalized[dimension]
              score += product
            if score >= 0.2: scored.add((text(chunks[at]["key"]),score))
          scored.sort(proc(a,b: tuple[key:string,score:float]): int = cmp(b.score,a.score))
          for at in 0..<min(scored.len,max(50,limit*5)):
            let key = scored[at].key
            ranks[key] = ranks.getOrDefault(key)+1.0/float(61+at)
          used = "hybrid"
          reason = ""
        except CatchableError: reason = "model-unavailable"
    let needle = jsLower(jsTrim(query))
    for chunk in chunks:
      if needle != "" and utf16Contains(jsLower(text(chunk["path"]) & "\n" & embeddingText(chunk)),needle):
        let key = text(chunk["key"])
        ranks[key] = ranks.getOrDefault(key)+1
    var byKey: Table[string,JsonNode]
    for chunk in chunks: byKey[text(chunk["key"])] = chunk
    var ordered: seq[tuple[key: string,score: float]]
    for key, score in ranks: ordered.add((key,score))
    ordered.sort(proc(a,b: tuple[key:string,score:float]): int = cmp(b.score,a.score))
    let results = newJArray()
    for at in 0..<sliceStop(limit,ordered.len): results.add(byKey[ordered[at].key])
    let retrieval = %*{"requested": mode,"used": used,"snapshot": snapshot,"model": embedder.id}
    if reason != "": retrieval["reason"] = %reason
    return %*{"retrieval": retrieval,"results": results}
  finally:
    db.close()
    if embedder.dispose != nil: embedder.dispose()
