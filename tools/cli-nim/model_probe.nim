## Test-only real native model/index adapter. Not shipped in the CLI package.
import std/[json, math]
import ../../packages/cli/nim/[minilm_model, onnx_runtime, minilm_tokenizer,
  embedding_pool, docs_index, strictjson, json_wire, jsonutil]

proc values(node: JsonNode): seq[float32] =
  for value in node:
    if value.kind in {JFloat,JInt}: result.add(float32(value.getFloat()))
    elif value.kind == JNull: result.add(0'f32)
    else:
      case value.getStr()
      of "NaN": result.add(float32(NaN))
      of "Infinity": result.add(float32(Inf))
      of "-Infinity": result.add(float32(NegInf))
      else: raise newException(ValueError,"Invalid fixture float")
proc integers(node: JsonNode): seq[int64] =
  for value in node: result.add(value.getBiggestInt())
proc strings(node: JsonNode): seq[string] =
  for value in node: result.add(value.getStr())

var embedder: DocsEmbedder
var currentDirectory, currentLibrary: string
var currentOptimization = -1
try:
  for line in stdin.lines:
    let request = parseStrictJson(line)
    try:
      var value: JsonNode
      let operation = text(request["operation"])
      let optimization = if field(request,"optimization") == nil: 1 else: request["optimization"].getInt()
      if operation == "pool":
        value = %poolEmbedding(values(request["values"]),integers(request["mask"]),request["dimensions"].getInt())
      elif operation == "id": value = %nativeModelId(optimization)
      elif operation in ["run","closed-session"]:
        let session = openOrtSession(text(request["library"]),text(request["model"]),optimization)
        try:
          let encoded = MiniLmEncoding(input_ids: integers(request["ids"]),attention_mask: integers(request["mask"]),
            token_type_ids: integers(request["types"]))
          if operation == "closed-session": session.close(); session.close()
          value = %session.runMiniLm(encoded)
        finally: session.close(); session.close()
      else:
        let directory = text(request["directory"])
        let library = text(request["library"])
        if embedder == nil or currentDirectory != directory or currentLibrary != library or currentOptimization != optimization:
          if embedder != nil: embedder.dispose()
          embedder = localNativeEmbedder(directory,library,optimization)
          currentDirectory = directory
          currentLibrary = library
          currentOptimization = optimization
        case operation
        of "prepare": embedder.prepare(); value = newJNull()
        of "dispose": embedder.dispose(); embedder.dispose(); value = newJNull()
        of "embed": value = %embedder.embed(strings(request["texts"]))
        of "index":
          value = newJArray()
          for action in request["actions"]:
            case text(action["operation"])
            of "prepare": value.add(prepareDocsIndex(request["documents"],text(request["binding"]),text(request["cacheDir"]),embedder))
            of "search": value.add(searchDocsIndex(request["documents"],text(request["binding"]),text(request["cacheDir"]),
              text(action["query"]),embedder,(if field(action,"limit") == nil: 10 else: action["limit"].getInt()),
              (if field(action,"mode") == nil: "hybrid" else: text(action["mode"]))))
            else: raise newException(ValueError,"Unknown index operation")
        else: raise newException(ValueError,"Unknown model operation")
      echo wireJson(%*{"ok": true,"value": value})
    except CatchableError as error:
      echo wireJson(%*{"ok": false,"message": error.msg})
finally:
  if embedder != nil: embedder.dispose()
