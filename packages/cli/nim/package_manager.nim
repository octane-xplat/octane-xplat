## Native project/workspace/lockfile interpretation. No dependency code executes.
import std/[json, os, strutils, sets, tables]
import yaml/[parser, stream, data]
import yaml/tojson
import ./jsonutil, ./strictjson, ./jsonc, ./workspace_glob, ./pathutil, ./js_text

proc present(node: JsonNode): bool = node != nil and node.kind != JNull
proc exists(path: string): bool = fileExists(path) or dirExists(path)
proc readProjectPackage*(root: string): JsonNode =
  if exists(root / "package.json"): parseStrictJson(decodeUtf8(readFile(root / "package.json")))
  else: newJObject()
proc parseYamlDocument*(source: string): JsonNode =
  type Frame = object
    mapping, key: bool
    seen: HashSet[string]
  var frames: seq[Frame]
  var parser = initYamlParser()
  var events = parser.parse(source)
  let buffered = newBufferYamlStream()
  var scalarAnchors = initTable[string,Event]()
  for original in events:
    var event = original
    if event.kind == yamlStartDoc: scalarAnchors.clear()
    if event.kind == yamlScalar and event.scalarProperties.anchor != yAnchorNone:
      scalarAnchors[$event.scalarProperties.anchor] = event
    elif event.kind == yamlAlias and scalarAnchors.hasKey($event.aliasTarget):
      let target = scalarAnchors[$event.aliasTarget]
      event = scalarEvent(target.scalarContent,tag=target.scalarProperties.tag,style=target.scalarStyle)
    elif event.kind == yamlStartMap and event.mapProperties.anchor != yAnchorNone:
      scalarAnchors.del($event.mapProperties.anchor)
    elif event.kind == yamlStartSeq and event.seqProperties.anchor != yAnchorNone:
      scalarAnchors.del($event.seqProperties.anchor)
    case event.kind
    of yamlStartMap, yamlStartSeq:
      if frames.len > 0 and frames[^1].mapping:
        if frames[^1].key: raise newException(ValueError,"Non-scalar YAML key")
        frames[^1].key = true
      frames.add(Frame(mapping:event.kind == yamlStartMap,key:true,seen:initHashSet[string]()))
    of yamlEndMap, yamlEndSeq:
      discard frames.pop()
    of yamlScalar, yamlAlias:
      if frames.len > 0 and frames[^1].mapping:
        if frames[^1].key:
          if event.kind != yamlScalar: raise newException(ValueError,"YAML alias key")
          let key = event.scalarContent
          if key in frames[^1].seen: raise newException(ValueError,"Duplicate YAML key: " & key)
          frames[^1].seen.incl(key)
          event.scalarProperties.anchor = yAnchorNone
        frames[^1].key = not frames[^1].key
    else: discard
    buffered.put(event)
  var constructed: YamlStream = buffered
  let documents = constructJson(constructed)
  if documents.len == 0: return newJNull()
  if documents.len != 1: raise newException(ValueError,"Expected one YAML document")
  documents[0]
proc readProjectWorkspace*(root: string, selectedManager: JsonNode = nil): JsonNode =
  let pkg = readProjectPackage(root)
  let declared = text(field(pkg,"packageManager")).split('@')[0]
  let manager = if present(selectedManager): text(selectedManager) else: declared
  let yaml = root / "pnpm-workspace.yaml"
  if manager != "bun" and exists(yaml):
    try:
      let parsed = parseYamlDocument(decodeUtf8(readFile(yaml)))
      return if present(parsed): parsed else: newJObject()
    except CatchableError as error: raise newException(ValueError,"Cannot read " & yaml & ": " & error.msg)
  let workspace = field(pkg,"workspaces")
  result = newJObject()
  let packages = if workspace != nil and workspace.kind == JArray: workspace else: field(workspace,"packages")
  result["packages"] = if present(packages): packages else: newJArray()
  for key in ["catalog", "catalogs"]:
    let direct = field(pkg,key)
    let nested = field(workspace,key)
    result[key] = if present(direct): direct elif present(nested): nested else: newJObject()
  for key in ["overrides", "patchedDependencies"]:
    let direct = field(pkg,key)
    result[key] = if present(direct): direct else: newJObject()
proc workspaceMembers*(root: string, manager: JsonNode = nil): seq[string] =
  let patterns = field(readProjectWorkspace(root,manager),"packages")
  var included, excluded: seq[string]
  if present(patterns):
    if patterns.kind != JArray: raise newException(ValueError,"Workspace packages must be an array")
    for pattern in patterns:
      if pattern.kind != JString: raise newException(ValueError,"Workspace patterns must be strings")
      let value = pattern.getStr()
      if value.startsWith("!"): excluded.add(value[1..^1])
      else: included.add(value)
  workspaceGlob(normalizedPath(absolutePath(root)),included,excluded)
proc packageManagerRoot*(dir: string): string =
  let start = normalizedPath(absolutePath(dir))
  var at = parentOrSelf(start)
  while at != parentOrSelf(at):
    if exists(at / "package.json") or exists(at / "pnpm-workspace.yaml"):
      if start in workspaceMembers(at): return at
    at = parentOrSelf(at)
  start
proc packageManagerFor*(dir: string, explicit: JsonNode = nil): string =
  let root = packageManagerRoot(dir)
  let pkg = readProjectPackage(root)
  let declared = if present(explicit): text(explicit) else: text(field(pkg,"packageManager")).split('@')[0]
  if declared != "":
    if declared in ["bun", "pnpm"]: return declared
    raise newException(ValueError,"Xplat supports Bun and pnpm projects; found packageManager " & declared & ".")
  let bun = exists(root / "bun.lock") or exists(root / "bun.lockb")
  let pnpm = exists(root / "pnpm-lock.yaml")
  if bun and pnpm: raise newException(ValueError,"Both Bun and pnpm lockfiles exist. Set packageManager in package.json or pass --package-manager.")
  if bun: return "bun"
  if pnpm: return "pnpm"
  if truthy(field(pkg,"patchedDependencies")): return "bun"
  if exists(root / "pnpm-workspace.yaml"): "pnpm" else: "bun"
proc packageManagerExec*(dir: string, args: seq[string]): JsonNode =
  let manager = packageManagerFor(dir)
  %*{"cmd": manager, "args": @[(if manager == "bun": "run" else: "exec")] & args}
proc readBunLock*(root: string): JsonNode =
  let file = root / "bun.lock"
  if not exists(file):
    if exists(root / "bun.lockb"):
      raise newException(ValueError,"xplat patches needs bun.lock. Run bun install --save-text-lockfile --lockfile-only to convert bun.lockb.")
    return nil
  try:
    result = parseJsonc(decodeUtf8(readFile(file)))
    if result == nil or result.kind notin {JObject,JArray}: raise newException(ValueError,"Invalid root")
  except CatchableError: raise newException(ValueError,"Cannot read " & file & ": invalid Bun lockfile")
proc versionPrefix(spec: string): bool =
  var at = 0
  for component in 0..<3:
    let start = at
    while at < spec.len and spec[at] in {'0'..'9'}: inc at
    if at == start: return false
    if component < 2:
      if at >= spec.len or spec[at] != '.': return false
      inc at
  true
proc bunLockedVersions*(dir: string): JsonNode =
  let root = packageManagerRoot(dir)
  if not exists(root / "bun.lock"): return nil
  let lock = readBunLock(root)
  if lock == nil: return nil
  let pkg = readProjectPackage(dir)
  let workspaces = field(lock,"workspaces")
  var importer: JsonNode
  if workspaces != nil and workspaces.kind == JObject:
    for path, member in workspaces:
      if normalizedPath(absolutePath(root / path)) == normalizedPath(absolutePath(dir)):
        importer = member; break
    if importer == nil: importer = field(workspaces, "")
  var owner = field(importer,"name")
  if not present(owner): owner = field(pkg,"name")
  let ownerText = if owner == nil: "undefined" else: text(owner)
  var declared = deps(pkg)
  let optional = field(pkg,"optionalDependencies")
  if optional != nil and optional.kind == JObject:
    for key, value in optional: declared[key] = value
  result = newJObject()
  for name, specifier in declared:
    var entry = field(field(lock,"packages"), ownerText & "/" & name)
    if not present(entry): entry = field(field(lock,"packages"), name)
    if entry == nil or entry.kind != JArray or entry.len == 0 or entry[0].kind != JString: continue
    let identity = entry[0].getStr()
    let at = identity.find('@',1)
    let spec = identity[at+1..^1]
    if spec.startsWith("workspace:"):
      let member = field(workspaces,spec[10..^1])
      if truthy(field(member,"version")): result[name] = member["version"]
    elif versionPrefix(spec): result[name] = %spec
proc nodeModulesDirs*(fromDir: string): seq[string] =
  var dir = normalizedPath(absolutePath(fromDir))
  while true:
    if lastPathPart(dir) != "node_modules": result.add(dir / "node_modules")
    let next = parentOrSelf(dir)
    if next == dir: break
    dir = next
proc installedPackageRoot*(fromDir, name: string): JsonNode =
  var paths = nodeModulesDirs(fromDir)
  var globalPaths: seq[string]
  for path in getEnv("NODE_PATH").split(PathSep):
    if path != "": globalPaths.add(path)
  let home = getHomeDir()
  globalPaths.add(home / ".node_modules")
  globalPaths.add(home / ".node_libraries")
  let node = findExe("node")
  if node != "": globalPaths.add(parentDir(parentDir(expandFilename(node))) / "lib/node")
  paths.add(globalPaths)
  for base in paths:
    let candidate = base / name
    if exists(candidate / "package.json"): return %expandFilename(candidate)
  nil
proc lockedVersions*(workspaceRoot, appDir: string, declared: JsonNode): JsonNode =
  result = newJArray()
  let bun = bunLockedVersions(appDir)
  if bun != nil:
    for name, spec in declared:
      if not name.startsWith("@octane-xplat/"): continue
      let version = field(bun,name)
      result.add(%*{"name": name,"version": (if present(version): version else: newJNull()),"source": "lockfile","declared": spec})
    return
  var dir = appDir
  while true:
    let file = dir / "pnpm-lock.yaml"
    if exists(file):
      try:
        let doc = parseYamlDocument(decodeUtf8(readFile(file)))
        var importer = field(field(doc,"importers"),relativePath(appDir,dir))
        if not present(importer): importer = field(field(doc,"importers"),".")
        let locked = deps(importer)
        for name, spec in declared:
          if not name.startsWith("@octane-xplat/"): continue
          var version = field(field(locked,name),"version")
          if not present(version): version = field(field(locked,name),"specifier")
          result.add(%*{"name": name,"version": (if present(version): version else: newJNull()),"source": "lockfile","declared": spec})
      except CatchableError: result = newJArray()
      return
    let next = parentOrSelf(dir)
    if next == dir or not normalizedPath(absolutePath(next)).startsWith(normalizedPath(absolutePath(workspaceRoot))): return
    dir = next
