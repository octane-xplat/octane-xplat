## Test-only documentation retrieval entry; never shipped in the native package.
import std/json
import ../../packages/cli/nim/[docs_retrieval, markdown_chunks, locale_sort, jsonutil, json_wire, strictjson]
for line in stdin.lines:
  let request = parseStrictJson(line)
  try:
    var value: JsonNode
    case text(request["operation"])
    of "chunks": value = chunkMarkdown(request["document"])
    of "title": value = %titleOf(text(request["content"]),text(request["path"]))
    of "platforms": value = platformsOf(text(request["path"]),text(request["content"]))
    of "list": value = listDocs(text(request["root"]))
    of "search": value = searchDocs(text(request["root"]),text(request["query"]),
      text(field(request,"corpus")),text(field(request,"platform")),
      (if field(request,"limit") == nil: 10 else: request["limit"].getInt()),text(field(request,"packageDir")))
    of "read": value = readPage(text(request["root"]),text(request["path"]),
      (if field(request,"offset") == nil: 0.0 else: request["offset"].getFloat()),
      (if field(request,"limit") == nil: 24000.0 else: request["limit"].getFloat()))
    of "reference": value = %docRef(text(request["package"]),text(request["version"]),text(request["path"]))
    of "parse-reference": value = parseDocRef(text(request["reference"]))
    of "collation":
      var sorter = newLocaleSorter(text(field(request,"locale")))
      try: value = %sorter.compare(text(request["left"]),text(request["right"]))
      finally: sorter.close()
    else: raise newException(ValueError,"Unknown operation")
    echo wireJson(%*{"ok": true,"value": (if value == nil: newJNull() else: value)})
  except CatchableError as error: echo wireJson(%*{"ok": false,"message": error.msg})
