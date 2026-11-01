## Installation identity for version-bound docs and framework code corpora.
## Resolve installed metadata without executing any installed dependency.
import std/[json, os, strutils, algorithm, sets]
import ./jsonutil, ./package_manager, ./digests, ./pathutil, ./js_text
from ./args import jsNumber

const releaseRepo = "https://github.com/octane-xplat/octane-xplat"
proc exists(path: string): bool = fileExists(path) or dirExists(path)
proc releaseMapping*(name, version: string, repo: JsonNode = nil): JsonNode =
  var directory, tag: string
  if name == "tsrx-typegen": directory = "packages/tsrx-typegen"; tag = "tsrx-typegen-v" & version
  elif name == "create-octane-xplat": directory = "packages/create"; tag = "v" & version
  elif name.startsWith("@octane-xplat/"): directory = "packages/" & name[14..^1]; tag = "v" & version
  else: return nil
  %*{"repo": (if repo == nil: %releaseRepo else: repo), "dir": directory, "tag": tag}
proc scalarString(value: JsonNode): string =
  if value == nil: return "undefined"
  case value.kind
  of JString: value.getStr()
  of JFloat, JInt: jsNumber(value.getFloat())
  of JObject: "[object Object]"
  of JArray:
    var parts: seq[string]
    for item in value:
      parts.add(if item.kind == JNull: "" else: scalarString(item))
    parts.join(",")
  else: $value
proc linkedSpec(root: string, spec: JsonNode): bool =
  let value = text(spec)
  if value.startsWith("link:") or value.startsWith("workspace:") or value.startsWith("portal:"): return true
  if not value.startsWith("file:") or value.len == 5 or value.contains({'\r','\n'}): return false
  let path = normalizedPath(absolutePath(value[5..^1], root))
  try: return getFileInfo(path).kind == pcDir
  except OSError:
    let lower = value.toLowerAscii()
    return not (lower.endsWith(".tgz") or lower.endsWith(".tar") or lower.endsWith(".tar.gz"))
proc documentationLockVersions(root: string): JsonNode =
  let bun = bunLockedVersions(root)
  if bun != nil: return bun
  result = newJObject()
  if not exists(root / "pnpm-lock.yaml"): return
  var doc: JsonNode
  try: doc = parseYamlDocument(decodeUtf8(readFile(root / "pnpm-lock.yaml")))
  except CatchableError: return
  let importer = field(field(doc,"importers"),".")
  let declared = deps(importer)
  for name, entry in declared:
    let raw = if entry.kind == JString: entry else: field(entry,"version")
    if truthy(raw):
      var version = scalarString(raw)
      let stop = version.find({'(','@'})
      if stop >= 0: version.setLen(stop)
      result[name] = %version
proc resolveInstallations*(root: string): JsonNode =
  let manifest = readJson(root / "package.json")
  var specs = deps(manifest)
  let peers = field(manifest,"peerDependencies")
  if peers != nil and peers.kind == JObject:
    for name, spec in peers: specs[name] = spec
  let locked = documentationLockVersions(root)
  var candidates = initHashSet[string]()
  for base in nodeModulesDirs(root):
    let directory = base / "@octane-xplat"
    if exists(directory):
      for kind, path in walkDir(directory):
        let name = lastPathPart(path)
        if not name.startsWith("."): candidates.incl("@octane-xplat/" & name)
  for name in ["tsrx-typegen","create-octane-xplat"]: candidates.incl(name)
  for name, value in specs:
    if releaseMapping(name,"0.0.0") != nil: candidates.incl(name)
  for name, value in locked:
    if releaseMapping(name,"0.0.0") != nil: candidates.incl(name)
  var names: seq[string]
  for name in candidates: names.add(name)
  names.sort()
  var packages = newJArray()
  var discrepancies = newJArray()
  var identities: seq[string]
  for name in names:
    if releaseMapping(name,"0.0.0") == nil: continue
    let location = installedPackageRoot(root,name)
    var installed: JsonNode
    if location != nil: installed = readJson(location.getStr() / "package.json")
    let lock = field(locked,name)
    let linked = linkedSpec(root,field(specs,name)) or (location != nil and symlinkExists(location.getStr()) and "node_modules" notin location.getStr().split(DirSep))
    let kind = if linked: "linked" else: "registry"
    if truthy(field(installed,"name")) and truthy(field(installed,"version")):
      let version = installed["version"]
      packages.add(%*{"name": name,"version": version,"kind": kind,"installPath": location,"source": "installed"})
      identities.add(name & "@" & scalarString(version) & ":" & kind)
      if truthy(lock) and lock != version:
        discrepancies.add(%(name & ": lockfile records " & scalarString(lock) & " but " & scalarString(version) & " is installed; using the installation"))
    elif truthy(lock):
      let provisionalKind = if linkedSpec(root,field(specs,name)): "linked" else: "registry"
      packages.add(%*{"name": name,"version": lock,"kind": provisionalKind,"installPath": newJNull(),"source": "lockfile-provisional"})
      identities.add(name & "@" & scalarString(lock) & ":" & provisionalKind)
  %*{"packages": packages,"discrepancies": discrepancies,"fingerprint": sha256Hex(utf8ForWrite(identities.join("\n")))}
proc developmentDocsDir*(installPath: string): JsonNode =
  var directory = expandFilename(installPath)
  for level in 0..<8:
    if exists(directory / "bun.lock") or exists(directory / "pnpm-workspace.yaml") or exists(directory / ".git"):
      let docs = directory / "docs"
      return if exists(docs): %docs else: nil
    let parent = parentOrSelf(directory)
    if parent == directory: break
    directory = parent
  nil
