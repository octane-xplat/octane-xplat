## Test-only code provider and index driver. Never packaged as a CLI command.
import std/[json, os, times, strutils, math, asyncdispatch]
import ../../packages/cli/nim/[jsonutil, strictjson, json_wire, js_text, code_retrieval, code_index, code_service, code_scope, command_output]
from ../../packages/cli/nim/args import jsNumber

proc jsonSemantics(node: JsonNode): JsonNode =
  case node.kind
  of JNull: return %*{"kind": "null"}
  of JBool: return %*{"kind": "boolean","value": node}
  of JString:
    var bytes: seq[int]
    for byte in utf8ForWrite(node.getStr()): bytes.add(ord(byte))
    return %*{"kind": "string","units": utf16Units(node.getStr()),"utf8": bytes}
  of JInt,JFloat: return %*{"kind": "number","text": jsNumber(node.getFloat()),"negativeZero": classify(node.getFloat()) == fcNegZero}
  of JArray:
    var items = newJArray()
    for item in node: items.add(jsonSemantics(item))
    return %*{"kind": "array","items": items}
  of JObject:
    var fields = newJObject()
    for key, value in node: fields[key] = jsonSemantics(value)
    return %*{"kind": "object","fields": fields}

proc mutate(step: JsonNode): bool =
  case text(step["operation"])
  of "write":
    let path = text(step["path"])
    createDir(parentDir(path))
    writeFile(path,text(step["text"]))
    if field(step,"mtime") != nil: setLastModificationTime(path,fromUnix(int64(step["mtime"].getFloat())))
    return true
  of "remove":
    removeFile(text(step["path"]))
    return true
  else: return false
proc filesFor(request: JsonNode): JsonNode =
  let root = text(field(request,"root"))
  if root == "": return request["files"]
  result = listCorpusFiles(root)["files"]
  for file in result: file["corpus"] = %*{"corpus": "app","package": newJNull(),"root": root}
proc run(request: JsonNode): JsonNode =
  case text(request["operation"])
  of "tokens": return %codeTokens(text(request["text"]))
  of "lower": return %jsLower(text(request["text"]))
  of "decode":
    var bytes = ""
    for value in request["bytes"]: bytes.add(char(value.getInt()))
    return %decodeUtf8(bytes)
  of "slice": return %utf16SliceNumber(text(request["text"]),request["first"].getFloat(),request["last"].getFloat())
  of "wire": return parseStrictJson(text(request["source"]))
  of "json-semantics": return jsonSemantics(parseStrictJson(text(request["source"])))
  of "read-json": return readJson(text(request["path"]))
  of "read-json-semantics": return jsonSemantics(readJson(text(request["path"])))
  of "read": return readCodeFile(text(request["path"]),field(request,"offset").getFloat(),field(request,"limit").getFloat(24000))
  of "search": return searchCodeFiles(request["files"],text(request["query"]),int(field(request,"limit").getFloat(10)))
  of "capture":
    var args: seq[string]
    for arg in request["args"]: args.add(arg.getStr())
    var captured = captureCommand(text(request["command"]),args,text(field(request,"cwd")),int(field(request,"timeout").getFloat(5000)),int(field(request,"maxBytes").getFloat(1024*1024)))
    captured.output = decodeUtf8(captured.output)
    captured.error = decodeUtf8(captured.error)
    return %captured
  of "index":
    let index = newCodeIndex()
    result = newJArray()
    for step in request["steps"]:
      if mutate(step): continue
      let collect: CorpusCollector = proc(): JsonNode =
        if truthy(field(step,"fail")): raise newException(ValueError,"fixture enumeration failed")
        filesFor(request)
      case text(step["operation"])
      of "ensure": result.add(index.ensureIndex(collect))
      of "ready": result.add(waitFor index.readyIndex(collect))
      of "status": result.add(index.indexStatus())
      of "preparing": result.add(%index.preparing())
      of "search":
        let names = field(step,"accept")
        let accept: FileAcceptance = if names == nil: nil else:
          proc(file: JsonNode): bool =
            for name in names:
              if file["rel"] == name: return true
            false
        result.add(index.searchIndex(text(step["query"]),int(field(step,"limit").getFloat(10)),accept))
      else: raise newException(ValueError,"Unknown index step")
  of "service":
    var git: GitProbe
    let tree = field(request,"git")
    if tree != nil:
      git = proc(command: string,args: seq[string]): string =
        if truthy(field(tree,"fail")): raise newException(OSError,"fixture git unavailable")
        if "rev-parse" in args: text(field(tree,"head")) else: text(field(tree,"dirty"))
    let service = newCodeService(text(request["root"]),text(field(request,"kind")),git)
    result = newJArray()
    for step in request["steps"]:
      if mutate(step): continue
      let options = step.copy()
      if field(options,"app") == nil and field(request,"app") != nil: options["app"] = request["app"]
      case text(step["operation"])
      of "search": result.add(service.codeSearch(options))
      of "read": result.add(service.codeRead(options))
      of "status": result.add(service.codeStatus(field(options,"app"),field(options,"workspaceKind")))
      of "prepare": result.add(waitFor service.prepareCodeIndex(field(options,"app"),field(options,"workspaceKind")))
      else: raise newException(ValueError,"Unknown service step")
  else: raise newException(ValueError,"Unknown code probe operation")

for line in stdin.lines:
  try:
    let value = run(parseStrictJson(line))
    echo wireJson(%*{"ok": true,"value": (if value == nil: newJNull() else: value)})
  except CatchableError as error:
    echo wireJson(%*{"ok": false,"message": error.msg})
