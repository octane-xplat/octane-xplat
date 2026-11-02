## Current-source retrieval with labeled corpora, freshness and local indexing.
import std/[json, os, strutils, sets, times, math, asyncdispatch, options]
import ./jsonutil, ./code_scope, ./code_retrieval, ./code_index, ./js_text, ./provenance, ./command_output
from ./args import jsTrim

type
  GitProbe* = proc(command: string, args: seq[string]): string {.closure.}
  WorkspaceKindProbe* = proc(): string {.closure.}
  CodeService* = ref object
    root, workspaceKind: string
    index: CodeIndex
    gitProbe: GitProbe
    kindProbe: WorkspaceKindProbe

proc newCodeService*(root: string, workspaceKind = "", gitProbe: GitProbe = nil,
    kindProbe: WorkspaceKindProbe = nil): CodeService =
  CodeService(root: root,workspaceKind: workspaceKind,index: newCodeIndex(),gitProbe: gitProbe,kindProbe: kindProbe)
proc kind(service: CodeService, explicit: JsonNode): string =
  if explicit != nil and explicit.kind != JNull: text(explicit)
  elif service.kindProbe != nil: service.kindProbe()
  else: service.workspaceKind
proc corporaFor(service: CodeService, app, workspaceKind: JsonNode): JsonNode =
  collectCorpora(service.root,service.kind(workspaceKind),app)

proc corpusFiles(corpora: JsonNode, platform = ""): JsonNode =
  var files = newJArray()
  var coverage = newJArray()
  for corpus in corpora:
    let found = listCorpusFiles(text(corpus["root"]),platform)
    for file in found["files"]:
      let tagged = file.copy()
      tagged["corpus"] = corpus
      files.add(tagged)
    var entry = %*{"corpus": corpus["corpus"],"root": corpus["root"],"files": found["files"].len}
    let package = field(corpus,"package")
    if package != nil and package.kind != JNull: entry["package"] = package
    let label = field(corpus,"label")
    if label != nil and label.kind != JNull: entry["root"] = label
    if truthy(found["truncated"]): entry["truncated"] = %true
    coverage.add(entry)
  %*{"files": files,"coverage": coverage}

proc treeMarker(service: CodeService): string =
  proc run(args: seq[string]): string =
    if service.gitProbe != nil: return service.gitProbe("git",args)
    let reply = captureCommand("git",args)
    if reply.timedOut or reply.exitCode != 0: raise newException(OSError,"Git freshness unavailable")
    decodeUtf8(reply.output)
  try:
    let head = jsTrim(run(@["-C",service.root,"rev-parse","HEAD"]))
    var dirty = 0
    for line in run(@["-C",service.root,"status","--porcelain","-uno"]).split('\n'):
      if line != "": inc dirty
    return "HEAD " & utf16Slice(head,0,12) & (if dirty > 0: ", " & $dirty & " uncommitted" else: ", clean")
  except CatchableError: return "not a git checkout — freshness is per-read mtimes"

proc sourceProvenance(corpus: JsonNode): JsonNode =
  if text(corpus["corpus"]) == "app":
    return provenance(%*{"source": "app-source","scope": "project","match": "exact"})
  let registry = text(field(corpus,"kind")) == "registry"
  provenance(%*{"source": "framework-source","scope": (if registry: "release" else: "project"),
    "package": corpus["package"],"requestedVersion": field(corpus,"version"),
    "servedVersion": (if registry: field(corpus,"version") else: %"development"),"match": "exact"})

proc hit(service: CodeService, corpus, file, fields: JsonNode): JsonNode =
  var freshness = %*{"state": "current","contentHash": fields["contentHash"]}
  var modified = field(fields,"mtimeMs")
  if modified == nil or modified.kind == JNull: modified = field(file,"mtimeMs")
  if modified != nil: freshness["mtimeMs"] = modified
  result = %*{"ref": codeRef(text(corpus["corpus"]),codeKeyFor(corpus,file)),"corpus": corpus["corpus"],
    "path": file["rel"],"line": fields["line"],"endLine": fields["endLine"],"excerpt": fields["excerpt"],
    "matchType": fields["matchType"],"score": fields["score"],"freshness": freshness,"provenance": sourceProvenance(corpus)}
  let package = field(corpus,"package")
  if package != nil and package.kind != JNull: result["package"] = package
  if text(fields["matchType"]) == "semantic": result["indexRevision"] = service.index.indexStatus()["revision"]
  if truthy(field(corpus,"provisional")): result["provisional"] = %true

proc selectionRequired(): JsonNode =
  %*{"status": "selection-required","detail": "Code retrieval needs a bound app: the app corpus is the bound app, the framework corpus is its installed packages. Select the app first — xplat_select_app (MCP) or `xplat app select` (CLI)."}
proc option(options: JsonNode, key: string, default: JsonNode): JsonNode =
  let value = field(options,key)
  if value == nil: default else: value

proc codeStatus*(service: CodeService, app: JsonNode = nil, workspaceKind: JsonNode = nil,
    freshness: Option[string] = none(string)): JsonNode =
  let collected = corpusFiles(service.corporaFor(app,workspaceKind))
  %*{"state": "ready","detail": "exact search reads current source; semantic index is local-only and builds on demand",
    "freshness": (if freshness.isSome: freshness.get() else: service.treeMarker()),"files": collected["files"].len,"corpora": collected["coverage"],
    "semantic": service.index.indexStatus()}

proc codeSearch*(service: CodeService, options: JsonNode): JsonNode =
  let app = field(options,"app")
  let workspaceKind = field(options,"workspaceKind")
  if not truthy(app) and service.kind(workspaceKind) != "framework-repo": return selectionRequired()
  let mode = text(option(options,"mode",%"auto"))
  if mode notin ["auto","exact","semantic"]:
    return %*{"status": "invalid-selection","detail": "mode must be one of auto, exact, semantic"}
  let query = text(field(options,"query"))
  if jsTrim(query) == "": return %*{"status": "invalid-selection","detail": "query is required"}
  let corpusName = text(option(options,"corpus",%"all"))
  let package = field(options,"package")
  let platform = text(field(options,"platform"))
  let limit = int(option(options,"limit",%10).getFloat())
  var corpora = newJArray()
  for corpus in service.corporaFor(app,workspaceKind):
    if corpusName != "all" and corpus["corpus"] != %corpusName: continue
    if truthy(package) and field(corpus,"package") != package: continue
    corpora.add(corpus)
  let collected = corpusFiles(corpora,platform)
  let files = collected["files"]
  var results = newJArray()
  var seen = initHashSet[string]()
  if mode != "semantic":
    for found in searchCodeFiles(files,query,limit):
      var fields = found.copy()
      fields["matchType"] = %"exact"
      results.add(service.hit(found["corpus"],found["file"],fields))
      seen.incl(text(found["corpus"]["corpus"]) & ":" & text(found["file"]["rel"]) & ":" & $found["line"])
  var semantic = %*{"state": "not-requested"}
  if mode != "exact" and query != "":
    let collect: CorpusCollector = proc(): JsonNode = corpusFiles(service.corporaFor(app,workspaceKind))["files"]
    semantic = service.index.ensureIndex(collect)
    if text(semantic["state"]) in ["ready","stale"]:
      var accepted = initHashSet[string]()
      for file in files: accepted.incl(text(file["abs"]))
      let accept: FileAcceptance = proc(file: JsonNode): bool =
        text(file["abs"]) in accepted and appliesToPlatform(text(file["rel"]),platform)
      let found = service.index.searchIndex(query,limit,accept)
      let dropped = found["droppedStale"].getInt()
      if dropped > 0:
        semantic["droppedStale"] = %dropped
        semantic["detail"] = %($dropped & " stale result(s) failed revalidation against current source and were dropped")
      for candidate in found["hits"]:
        let chunk = candidate["chunk"]
        let file = chunk["file"]
        let key = text(file["corpus"]["corpus"]) & ":" & text(file["rel"]) & ":" & $chunk["startLine"]
        if mode != "semantic" and key in seen: continue
        var current = file
        for available in files:
          if available["abs"] == file["abs"]: current = available; break
        let lines = text(chunk["text"]).split('\n')
        let excerpt = jsTrim(utf16Slice(lines[0..<min(12,lines.len)].join("\n"),0,900))
        let fields = %*{"matchType": "semantic","score": floor(candidate["score"].getFloat()*1000+0.5)/1000,
          "line": chunk["startLine"],"endLine": chunk["endLine"],"excerpt": excerpt,
          "contentHash": text(chunk["hash"])[0..<12],"mtimeMs": field(current,"mtimeMs")}
        results.add(service.hit(file["corpus"],current,fields))
  var limited = newJArray()
  let stop = if limit < 0: max(0,results.len+limit) else: min(limit,results.len)
  for at in 0..<stop: limited.add(results[at])
  %*{"mode": mode,"results": limited,"semantic": semantic,"coverage": collected["coverage"],"tree": service.treeMarker()}

proc codeRead*(service: CodeService, options: JsonNode): JsonNode =
  let app = field(options,"app")
  let workspaceKind = field(options,"workspaceKind")
  if not truthy(app) and service.kind(workspaceKind) != "framework-repo": return selectionRequired()
  let reference = text(field(options,"ref"))
  var key = text(field(options,"path"))
  if reference == "" and key == "":
    return %*{"status": "invalid-selection","detail": "a search ref or an explicit corpus + path is required"}
  var corpusName = text(option(options,"corpus",%"app"))
  if corpusName == "": corpusName = "app"
  if reference != "":
    let parsed = parseCodeRef(reference)
    if parsed == nil: return %*{"status": "invalid-ref","ref": reference}
    corpusName = text(parsed["corpus"]); key = text(parsed["key"])
  let package = text(field(options,"package"))
  if package != "" and corpusName == "framework" and key != "" and not key.startsWith(package & "/"):
    key = package & "/" & key
  let resolved = resolveCodePath(service.corporaFor(app,workspaceKind),corpusName,key)
  if field(resolved,"error") != nil:
    result = %*{"status": resolved["error"],"corpus": corpusName,"path": key}
    let detail = field(resolved,"detail")
    if detail != nil: result["detail"] = detail
    return
  let offset = option(options,"offset",%0).getFloat()
  let limit = option(options,"limit",%24000).getFloat()
  let page = readCodeFile(text(resolved["abs"]),offset,limit)
  if page == nil:
    return %*{"status": "unavailable","reason": "file-vanished-or-binary",
      "detail": key & " no longer reads as current source","corpus": corpusName}
  let corpus = resolved["corpus"]
  result = page.copy()
  result["ref"] = %codeRef(text(corpus["corpus"]),if text(corpus["corpus"]) == "app": key else:
    text(corpus["package"]) & "/" & text(resolved["rel"]))
  result["corpus"] = corpus["corpus"]
  result["path"] = resolved["rel"]
  let pkg = field(corpus,"package")
  if pkg != nil and pkg.kind != JNull: result["package"] = pkg
  var freshness = %*{"state": "current","contentHash": page["contentHash"]}
  try:
    let modified = getFileInfo(text(resolved["abs"])).lastWriteTime
    freshness["mtimeMs"] = %(float(modified.toUnix())*1000+float(modified.nanosecond())/1000000)
  except OSError: discard
  result["freshness"] = freshness
  result["provenance"] = sourceProvenance(corpus)
  result["tree"] = %service.treeMarker()

proc prepareCodeIndex*(service: CodeService, app: JsonNode = nil, workspaceKind: JsonNode = nil): Future[JsonNode] =
  let collect: CorpusCollector = proc(): JsonNode = corpusFiles(service.corporaFor(app,workspaceKind))["files"]
  service.index.readyIndex(collect)
