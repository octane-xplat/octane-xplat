## Installed-version docs binding and page reads. Index/search wiring is separate.
import std/[json, os, strtabs, options]
import ./jsonutil, ./docs_binding, ./docs_snapshots, ./docs_retrieval, ./docs_guidance, ./provenance

type DocsService* = ref object
  root: string
  repo: JsonNode
  snapshots: SnapshotContext
  installation: JsonNode
  fingerprint: string
  revision: int

proc newDocsService*(root: string, cacheDir = defaultDocsCacheDir(), repo: JsonNode = nil,
    gitPath = "git", timeoutMs = 60000, environment: StringTableRef = nil,
    runner: SnapshotGitRunner = nil): DocsService =
  DocsService(root: root,repo: repo,snapshots: newSnapshotContext(cacheDir,gitPath,timeoutMs,environment,runner))
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
