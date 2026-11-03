## Installed-version documentation service. Call blocking work in an owned child.
import std/[json, os, strtabs, options, asyncdispatch]
import ./jsonutil, ./docs_binding, ./docs_snapshots, ./docs_retrieval, ./docs_guidance, ./provenance
import ./js_text, ./docs_files, ./contract_failure

type DocsService* = ref object
  root: string
  repo: JsonNode
  snapshots: SnapshotContext
  installation: JsonNode
  fingerprint: string
  revision: int

proc newDocsService*(root: string, cacheDir = defaultDocsCacheDir(), repo: JsonNode = nil,
    gitPath = "git", timeoutMs = 60000, environment: StringTableRef = nil,
    runner: SnapshotGitRunner = nil, stagingDir = ""): DocsService =
  DocsService(root: root,repo: repo,snapshots: newSnapshotContext(cacheDir,gitPath,timeoutMs,environment,runner,stagingDir))
proc refreshInstallation(service: DocsService): JsonNode =
  let found = resolveInstallations(service.root)
  let fingerprint = text(found["fingerprint"])
  if service.installation == nil or fingerprint != service.fingerprint:
    service.installation = found
    service.fingerprint = fingerprint
    inc service.revision
  service.installation
proc docsRefresh*(service: DocsService): JsonNode =
  let before = service.revision
  let installation = service.refreshInstallation()
  %*{"bindingRevision": service.revision,"changed": service.revision != before,
    "packages": installation["packages"],"discrepancies": installation["discrepancies"]}
proc docsStatus*(service: DocsService, gitAvailable: Option[bool] = none(bool)): JsonNode =
  let installation = if service.installation == nil: service.refreshInstallation() else: service.installation
  %*{"identity": {"workspaceRoot": service.root,"packages": installation["packages"],
      "fingerprint": installation["fingerprint"],"discrepancies": installation["discrepancies"]},
    "bindingRevision": service.revision,"git": (if (if gitAvailable.isSome: gitAvailable.get() else: service.snapshots.gitAvailable()): "available" else: "unavailable"),
    "cacheDir": service.snapshots.cacheDir}
proc docsGuidance*(service: DocsService): JsonNode =
  let installation = if service.installation == nil: service.refreshInstallation() else: service.installation
  %*{"bindingRevision": service.revision,"entries": tailoredGuidance(installation)}

proc attachFallback(reply, package: JsonNode): JsonNode =
  if text(field(reply,"status")) != "unavailable" or truthy(field(reply,"fallback")): return reply
  result = reply.copy()
  let path = field(package,"installPath")
  result["fallback"] = if truthy(path): %*{"kind": "installed-source","path": path}
    else: %*{"kind": "none","detail": "package is not installed; lockfile entry is provisional"}
proc nullish(value, fallback: JsonNode): JsonNode =
  if value == nil or value.kind == JNull: fallback else: value
proc bindDocsPackage*(service: DocsService, package: JsonNode, version: JsonNode = nil,
    acceptMovedTag = false): JsonNode =
  let requested = if version == nil: field(package,"version") else: version
  let linked = field(package,"kind") == %"linked"
  let outside = not jsStrictEqual(requested,field(package,"version")) and not (linked and requested == %"development")
  let name = field(package,"name")
  if not outside and linked:
    let path = field(package,"installPath")
    let docs = if truthy(path): developmentDocsDir(text(path)) else: nil
    if not truthy(docs):
      let fallback = %*{"kind": "installed-source"}
      if path != nil: fallback["path"] = path
      return unavailable("docs-absent",%*{"source": "development-docs","package": name,
        "fallback": fallback})
    return %*{"status": "bound","dir": parentDir(text(docs)),"dev": true,"prov": provenance(%*{
      "source": "development-docs","package": name,"requestedVersion": requested,
      "servedVersion": "development","match": "exact"})}
  let mapping = releaseMapping(scalarString(name),scalarString(requested),
    (if service.repo == nil or service.repo.kind == JNull: nil else: service.repo))
  if mapping == nil: return unavailable("no-release-mapping",%*{"package": name,"requestedVersion": requested})
  let acquired = service.snapshots.ensureSnapshot(%*{"packageName": name,"version": requested,
    "repo": mapping["repo"],"tag": mapping["tag"],"packageDir": mapping["dir"],"acceptMovedTag": acceptMovedTag})
  if text(acquired["status"]) != "bound": return attachFallback(acquired,package)
  result = acquired.copy()
  let fields = boundProvenance(acquired,%*{"packageName": name,"version": requested})
  fields["repo"] = mapping["repo"]
  fields["match"] = %(if outside: "outside-installed-binding" else: "exact")
  result["prov"] = provenance(fields)

proc docsRead*(service: DocsService, options: JsonNode): JsonNode =
  discard service.refreshInstallation()
  var target = field(options,"package")
  var path = field(options,"path")
  var requested = field(options,"version")
  let reference = field(options,"ref")
  if truthy(reference):
    let parsed = parseDocRef(scalarString(reference))
    if parsed == nil: return %*{"status": "invalid-ref","ref": reference}
    target = parsed["package"]
    path = parsed["path"]
    requested = nullish(requested,parsed["version"])
  var package: JsonNode
  for candidate in service.installation["packages"]:
    if jsStrictEqual(field(candidate,"name"),target): package = candidate; break
  if package == nil and truthy(requested):
    package = %*{"version": requested,"kind": "registry","installPath": newJNull()}
    if target != nil: package["name"] = target
  if package == nil:
    result = %*{"status": "unavailable","reason": "package-not-installed"}
    if target != nil: result["package"] = target
    return
  let bound = service.bindDocsPackage(package,nullish(requested,field(package,"version")))
  if text(bound["status"]) != "bound": return attachFallback(bound,package)
  if path == nil or path.kind == JNull:
    raise newException(ValueError,"Cannot read properties of " & (if path == nil: "undefined" else: "null") & " (reading 'endsWith')")
  if path.kind != JString: raise newException(ValueError,"relPath.endsWith is not a function")
  let offset = field(options,"offset")
  let limit = field(options,"limit")
  let page = readPage(text(bound["dir"]),text(path),
    (if offset == nil: 0.0 else: offset.getFloat()),(if limit == nil: 24000.0 else: limit.getFloat()))
  if page == nil:
    return attachFallback(unavailable("docs-absent",%*{"package": field(package,"name"),
      "requestedVersion": nullish(requested,field(package,"version")),"tag": field(bound["prov"],"tag")}),package)
  result = page.copy()
  if offset != nil: result["offset"] = offset
  result["ref"] = %docRef(scalarString(field(package,"name")),scalarString(field(bound["prov"],"servedVersion")),text(path))
  result["provenance"] = bound["prov"]
  result["bindingRevision"] = %service.revision

proc resolveDocsTagConflict*(service: DocsService, name, version, resolution: JsonNode): JsonNode =
  let installation = if service.installation == nil: service.refreshInstallation() else: service.installation
  var package: JsonNode
  for candidate in installation["packages"]:
    if jsStrictEqual(field(candidate,"name"),name): package = candidate; break
  if package == nil: package = %*{"name": name,"version": version,"kind": "registry","installPath": newJNull()}
  if resolution == %"cached": return %*{"status": "kept-cached","package": name,"version": version}
  if resolution == %"remote":
    let bound = service.bindDocsPackage(package,version,true)
    if text(bound["status"]) == "bound":
      result = %*{"status": "rebound","package": name,"version": version}
      let commit = field(bound,"commit")
      if commit != nil: result["commit"] = commit
      return
    return bound
  %*{"status": "invalid-resolution","resolution": resolution}

type DocsCompute* = proc(request: JsonNode): Future[JsonNode] {.closure.}

proc targets(service: DocsService, options: JsonNode): JsonNode =
  let installation = service.refreshInstallation()
  let name = field(options,"package")
  result = newJArray()
  for package in installation["packages"]:
    if not truthy(name) or jsStrictEqual(field(package,"name"),name): result.add(package)
  let version = field(options,"version")
  if truthy(name) and truthy(version) and result.len == 0:
    result.add(%*{"name": name,"version": version,"kind": "registry","installPath": newJNull(),"source": "explicit-request"})

proc searchBinding(bound: JsonNode): string =
  let repo = field(bound["prov"],"repo")
  (if repo == nil or repo.kind == JNull: "" else: scalarString(repo)) & ":" &
    scalarString(nullish(field(bound,"commit"),bound["dir"]))

proc documents(service: DocsService, bound, package, options: JsonNode): JsonNode =
  let mapping = releaseMapping(text(field(package,"name")),text(field(package,"version")),service.repo)
  let packageDir = text(field(mapping,"dir"))
  result = newJArray()
  var bytes = 0
  for document in listDocs(text(bound["dir"])):
    let path = text(document["path"])
    let corpus = text(document["corpus"])
    if truthy(field(options,"corpus")) and options["corpus"] != document["corpus"]: continue
    if corpus == "readme" and path != packageDir & "/README.md": continue
    if path == "packages/tsrx-typegen/CHANGELOG.md" and field(package,"name") != %"tsrx-typegen": continue
    if field(package,"name") == %"tsrx-typegen" and corpus == "changelog" and path != "packages/tsrx-typegen/CHANGELOG.md": continue
    if result.len >= 10000: raise contractFailure("unavailable","Documentation inventory exceeds 10000 files")
    let content = readDocumentationText(text(document["file"]))
    bytes += content.len
    if bytes > 32*1024*1024: raise contractFailure("unavailable","Documentation inventory exceeds 32 MiB")
    if truthy(field(options,"platform")) and options["platform"] notin platformsOf(path,content): continue
    result.add(%*{"path": path,"corpus": corpus,"content": content})

proc docsIndex*(service: DocsService, options: JsonNode, compute: DocsCompute): Future[JsonNode] {.async.} =
  var results = newJArray()
  var unavailablePackages = newJArray()
  for package in service.targets(options):
    let bound = service.bindDocsPackage(package,nullish(field(options,"version"),field(package,"version")))
    if field(bound,"status") != %"bound": unavailablePackages.add(bound); continue
    try:
      let prepared = await compute(%*{"operation": "index","documents": service.documents(bound,package,newJObject()),
        "binding": searchBinding(bound)})
      let value = prepared.copy()
      value["provenance"] = bound["prov"].copy()
      results.add(value)
    except CatchableError:
      results.add(%*{"status": "unavailable","reason": "index-preparation-failed",
        "recovery": "Check model download access and cache permissions, then run docs index again. Completed batches are reusable.",
        "provenance": bound["prov"]})
  return %*{"results": results,"unavailable": unavailablePackages}

proc exactHits(service: DocsService, bound, package, options: JsonNode): JsonNode =
  let mapping = releaseMapping(text(field(package,"name")),text(field(package,"version")),service.repo)
  searchDocs(text(bound["dir"]),text(field(options,"query")),text(field(options,"corpus")),
    text(field(options,"platform")),(if field(options,"limit") == nil: 10 else: int(options["limit"].getFloat())),text(field(mapping,"dir")))

proc docHit(package, bound, hit: JsonNode): JsonNode =
  result = newJObject()
  for key in ["title","path","corpus","platforms","excerpt","line"]:
    result[key] = hit[key].copy()
  if truthy(field(hit,"endLine")):
    result["endLine"] = hit["endLine"].copy()
    result["heading"] = hit["heading"].copy()
  for key in ["releaseVersion","releaseDate"]:
    if truthy(field(hit,key)): result[key] = hit[key].copy()
  result["ref"] = %docRef(text(package["name"]),text(bound["prov"]["servedVersion"]),text(hit["path"]))
  result["provenance"] = bound["prov"].copy()
  if field(package,"source") == %"lockfile-provisional": result["provisional"] = %true

proc docsSearch*(service: DocsService, options: JsonNode, compute: DocsCompute): Future[JsonNode] {.async.} =
  let packages = service.targets(options)
  let started = service.revision
  let mode = if field(options,"mode") == nil: "hybrid" else: text(options["mode"])
  if mode notin ["exact","lexical","hybrid"]: raise contractFailure("invalid_selection","Invalid documentation search mode")
  var results = newJArray()
  var retrieval = newJArray()
  var failures = newJArray()
  var commits = newJObject()
  for package in packages:
    let bound = service.bindDocsPackage(package,nullish(field(options,"version"),field(package,"version")))
    if field(bound,"status") != %"bound": failures.add(bound); continue
    commits[text(package["name"])] = nullish(field(bound,"commit"),bound["dir"]).copy()
    var hits: JsonNode
    if mode == "exact":
      hits = service.exactHits(bound,package,options)
      retrieval.add(%*{"package": package["name"],"requested": mode,"used": "exact"})
    else:
      try:
        let request = %*{"operation": "search","documents": service.documents(bound,package,options),
          "binding": searchBinding(bound),"query": options["query"],"mode": mode}
        if field(options,"limit") != nil: request["limit"] = options["limit"]
        let found = await compute(request)
        hits = found["results"].copy()
        for hit in hits:
          hit["excerpt"] = %utf16Slice(text(hit["content"]),0,900)
          hit["platforms"] = platformsOf(text(hit["path"]),text(hit["content"]))
        let used = found["retrieval"].copy()
        used["package"] = package["name"]
        retrieval.add(used)
      except CatchableError:
        hits = service.exactHits(bound,package,options)
        retrieval.add(%*{"package": package["name"],"requested": mode,"used": "exact","reason": "index-unavailable"})
    if hits.len == 0 and not dirExists(text(bound["dir"]) / "docs"):
      let fields = %*{"package": package["name"],"requestedVersion": nullish(field(options,"version"),field(package,"version"))}
      for key in ["repo","tag"]:
        let value = field(bound["prov"],key)
        if value != nil: fields[key] = value
      failures.add(attachFallback(unavailable("docs-absent",fields),package))
      continue
    for hit in hits: results.add(docHit(package,bound,hit))
  for hit in results:
    let key = commits[text(hit["provenance"]["package"])]
    var compatible = newJArray()
    for name, commit in commits:
      if commit == key: compatible.add(%name)
    if compatible.len > 1: hit["provenance"]["verifiedCompatibleSet"] = compatible
  var unavailablePackages = newJArray()
  var conflicts = newJArray()
  for failure in failures:
    if field(failure,"status") == %"unavailable": unavailablePackages.add(failure)
    elif field(failure,"status") == %"tag-conflict": conflicts.add(failure)
  return %*{"retrieval": retrieval,"bindingRevision": service.revision,"bindingChangedDuring": service.revision != started,
    "results": results,"unavailable": unavailablePackages,"conflicts": conflicts,
    "projectGuidance": projectDocsGuidance(service.root,text(field(options,"query")))}
