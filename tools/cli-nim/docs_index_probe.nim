## Test-only index entry with explicit fixture embeddings, never a model claim.
import std/[json, math, os]
import ../../packages/cli/nim/[docs_index, sqlite_store, jsonutil, strictjson, json_wire]
proc floats(node: JsonNode): seq[float] =
  if node == nil or node.kind != JArray: raise newException(ValueError,"Invalid embedding vector")
  for value in node:
    if value.kind notin {JInt,JFloat}: raise newException(ValueError,"Invalid embedding vector")
    result.add(value.getFloat())
for line in stdin.lines:
  let request = parseStrictJson(line)
  var replies = newJArray()
  for action in request["actions"]:
    var batches = newJArray()
    var prepared, disposed: int
    let config = if field(action,"embedder") == nil: request["embedder"] else: action["embedder"]
    let embedder = DocsEmbedder(id: text(config["id"]))
    embedder.prepare = proc() =
      inc prepared
      if field(config,"prepareError") == %true: raise newException(IOError,"fixture prepare failure")
    embedder.dispose = proc() =
      inc disposed
      if field(config,"disposeError") == %true: raise newException(IOError,"fixture dispose failure")
    embedder.embed = proc(texts: seq[string]): seq[seq[float]] =
      batches.add(%texts)
      if field(config,"failBatch").getInt() == batches.len: raise newException(IOError,"fixture embed failure")
      for value in texts:
        case text(field(config,"invalidVector"))
        of "empty": result.add(newSeq[float]())
        of "zero": result.add(@[0.0,0.0])
        of "nonfinite": result.add(@[Inf])
        else:
          let vector = field(config["vectors"],value)
          if vector == nil: raise newException(IOError,"fixture vector is missing")
          result.add(floats(vector))
      if field(config,"countMismatch") == %true and result.len > 0: result.setLen(result.len-1)
    try:
      var value: JsonNode
      case text(action["operation"])
      of "inventory": value = docsInventory(request["documents"],text(request["binding"]))
      of "normalize": value = %normalizeEmbedding(floats(action["values"]))
      of "prepare": value = prepareDocsIndex(request["documents"],text(request["binding"]),text(request["cacheDir"]),embedder)
      of "search": value = searchDocsIndex(request["documents"],text(request["binding"]),text(request["cacheDir"]),
        text(action["query"]),embedder,(if field(action,"limit") == nil: 10 else: action["limit"].getInt()),
        (if field(action,"mode") == nil: "hybrid" else: text(action["mode"])))
      of "exec", "query":
        let db = openSqlite(text(request["cacheDir"]) / "search-v1.sqlite")
        try:
          if text(action["operation"]) == "exec": db.exec(text(action["sql"])); value = newJNull()
          else: value = db.query(text(action["sql"]))
        finally: db.close()
      else: raise newException(ValueError,"Unknown index action")
      replies.add(%*{"ok": true,"value": value,"batches": batches,"prepared": prepared,"disposed": disposed})
    except CatchableError as error:
      let reply = %*{"ok": false,"batches": batches,"prepared": prepared,"disposed": disposed}
      if error of ValueError and error.msg == "Invalid JSON": reply["kind"] = %"invalid-json"
      else: reply["message"] = %error.msg
      replies.add(reply)
  echo wireJson(replies)
