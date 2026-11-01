import std/[json, os, strutils, algorithm, httpclient, osproc]
import yaml/tojson
when defined(posix): import std/posix

proc readJson(path: string): JsonNode =
  try: result = parseJson(readFile(path))
  except CatchableError: result = newJNull()
proc field(n: JsonNode, key: string): JsonNode =
  if n != nil and n.kind == JObject: n.getOrDefault(key)
  else: nil
proc text(n: JsonNode): string =
  if n != nil and n.kind == JString: n.getStr else: ""
proc deps(n: JsonNode): JsonNode =
  result = newJObject()
  for section in ["dependencies", "devDependencies"]:
    let d = field(n, section)
    if d != nil and d.kind == JObject:
      for k, v in d: result[k] = v
proc platforms(dir: string): JsonNode =
  result = newJArray()
  let m = readJson(dir / "package.json")
  if m.kind != JObject: return
  for ext in ["js", "mjs", "ts", "cjs", "mts", "cts"]:
    if fileExists(dir / ("vite.config." & ext)):
      result.add(%"web")
      break
  let d = deps(m)
  if fileExists(dir / "nativescript.config.ts"):
    for p in ["ios", "android", "windows"]:
      if text(field(d, "@nativescript/" & p)) != "": result.add(%p)
  let targets = field(field(m, "xplat"), "targets")
  if text(field(field(targets, "macos"), "runtime")) == "appkit-node-api": result.add(%"macos")
  if text(field(field(targets, "linux"), "runtime")) in ["gtk", "webkitgtk"]: result.add(%"linux")
proc discover(root: string): JsonNode =
  let rm = readJson(root / "package.json")
  let framework = text(field(rm, "name")) == "octane-xplat" or text(field(readJson(root / "packages/ui/package.json"), "name")) == "@octane-xplat/ui"
  var dirs = @[root]
  proc visit(dir: string, depth: int) =
    if depth > 5: return
    var children: seq[string]
    try:
      for kind, path in walkDir(dir):
        let name = lastPathPart(path)
        if kind == pcDir and not name.startsWith(".") and name notin ["node_modules", "dist", "build", "coverage", "platforms", "research"]: children.add(path)
    except OSError: return
    children.sort()
    for path in children:
      if fileExists(path / "package.json"): dirs.add(path)
      visit(path, depth + 1)
  visit(root, 0)
  var apps = newJArray()
  for dir in dirs:
    let m = readJson(dir / "package.json")
    if m.kind != JObject: continue
    let targets = field(field(m, "xplat"), "targets")
    let ps = platforms(dir)
    var xd = false
    for name, spec in deps(m):
      if name.startsWith("@octane-xplat/") or name in ["octane", "@nativescript-community/octane"]: xd = true
    if targets == nil and not (xd and (ps.len > 0 or fileExists(dir / "nativescript.config.ts"))): continue
    let rel = relativePath(dir, root)
    let name = if field(m, "name") != nil: m["name"] else: %lastPathPart(rel)
    apps.add(%*{"id": rel, "name": name, "root": dir, "relativeRoot": rel, "kind": (if framework and rel.startsWith("packages/"): "framework-package" else: "consumer-app"), "platforms": ps})
  result = %*{"workspace": {"root": root, "kind": (if rm.kind != JObject: "empty" elif framework: "framework-repo" else: "consumer")}, "apps": apps}
proc binding(root, app: string): JsonNode =
  let declared = deps(readJson(app / "package.json"))
  var installed = newJArray()
  var locked = newJArray()
  var resolved = false
  for name, spec in declared:
    if not name.startsWith("@octane-xplat/"): continue
    var dir = app
    var version = ""
    while true:
      version = text(field(readJson(dir / "node_modules" / name / "package.json"), "version"))
      if version != "" or parentDir(dir) == dir: break
      dir = parentDir(dir)
    if version != "":
      installed.add(%*{"name": name, "version": version, "source": "installed"})
      resolved = true
    elif text(spec) == "workspace:*" or text(spec).startsWith("link:") or text(spec).startsWith("file:"):
      installed.add(%*{"name": name, "version": spec, "source": "workspace", "declared": spec})
      resolved = true
    else: installed.add(%*{"name": name, "version": newJNull(), "source": "unresolved", "declared": spec})
  var dir = app
  var lock: JsonNode
  var bun = false
  while true:
    if fileExists(dir / "bun.lock"):
      # Nim's JSON parser accepts comments and trailing commas; parity tested below.
      lock = parseJson(readFile(dir / "bun.lock"))
      bun = true
      break
    if dir == root or parentDir(dir) == dir: break
    dir = parentDir(dir)
  if not bun:
    dir = app
    while true:
      if fileExists(dir / "pnpm-lock.yaml"):
        try:
          let docs = loadToJson(readFile(dir / "pnpm-lock.yaml"))
          if docs.len > 0: lock = docs[0]
        except CatchableError: discard
        break
      if dir == root or parentDir(dir) == dir: break
      dir = parentDir(dir)
  if lock != nil:
    var importer = field(field(lock, "importers"), relativePath(app, dir))
    if importer == nil: importer = field(field(lock, "importers"), ".")
    let ld = deps(importer)
    for name, spec in declared:
      if not name.startsWith("@octane-xplat/"): continue
      var version: JsonNode
      if bun:
        let workspaces = field(lock, "workspaces")
        var owner = text(field(readJson(app / "package.json"), "name"))
        if workspaces != nil:
          for path, member in workspaces:
            if normalizedPath(dir / path) == normalizedPath(app): owner = text(field(member, "name"))
        var entry = field(field(lock, "packages"), owner & "/" & name)
        if entry == nil: entry = field(field(lock, "packages"), name)
        if entry != nil and entry.kind == JArray and entry.len > 0:
          let identity = text(entry[0])
          let specifier = identity[identity.find('@', 1)+1..^1]
          if specifier.startsWith("workspace:"): version = field(field(workspaces, specifier[10..^1]), "version")
          elif specifier.len > 0 and specifier[0].isDigit: version = %specifier
      else:
        version = field(field(ld, name), "version")
        if version == nil: version = field(field(ld, name), "specifier")
      locked.add(%*{"name": name, "version": (if version == nil: newJNull() else: version), "source": "lockfile", "declared": spec})
  result = %*{"packages": (if resolved: installed else: locked), "status": (if resolved: "installed" else: "provisional")}
  if installed.len == 0 and locked.len == 0: result["status"] = %"unresolved"
  for l in locked:
    for a in installed:
      let v = text(l["version"])
      if a["name"] == l["name"] and text(a["version"]) != "" and v != "" and a["version"] != l["version"] and not (v.startsWith("workspace:") or v.startsWith("link:") or v.startsWith("file:")):
        result["discrepancy"] = %("Lockfile records " & text(l["name"]) & "@" & v & " but the installation has " & text(a["version"]) & "; using the actual installation.")

