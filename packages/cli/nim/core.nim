import std/[json, os, strutils, algorithm]
import ./jsonutil, ./package_manager
from ./args import jsNumber
export jsonutil

proc platforms*(dir: string): JsonNode =
  result = newJArray()
  let m = readJson(dir / "package.json")
  if not truthy(m): return
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
proc discover*(root: string): JsonNode =
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
    if not truthy(m): continue
    let targets = field(field(m, "xplat"), "targets")
    let ps = platforms(dir)
    var xd = false
    for name, spec in deps(m):
      if name.startsWith("@octane-xplat/") or name in ["octane", "@nativescript-community/octane"]: xd = true
    if targets == nil and not (xd and (ps.len > 0 or fileExists(dir / "nativescript.config.ts"))): continue
    let rel = relativePath(dir, root)
    let name = if field(m, "name") != nil and field(m, "name").kind != JNull: m["name"] else: %lastPathPart(rel)
    apps.add(%*{"id": rel, "name": name, "root": dir, "relativeRoot": rel, "kind": (if framework and rel.startsWith("packages/"): "framework-package" else: "consumer-app"), "platforms": ps})
  result = %*{"workspace": {"root": root, "kind": (if not truthy(rm): "empty" elif framework: "framework-repo" else: "consumer")}, "apps": apps}
proc binding*(root, app: string): JsonNode =
  let declared = deps(readJson(app / "package.json"))
  var installed = newJArray()
  var resolved = false
  for name, spec in declared:
    if not name.startsWith("@octane-xplat/"): continue
    let packageRoot = installedPackageRoot(app,name)
    let manifest = if packageRoot == nil: nil else: readJson(packageRoot.getStr() / "package.json")
    if truthy(field(manifest,"version")):
      installed.add(%*{"name": name, "version": manifest["version"], "source": "installed"})
      resolved = true
    elif text(spec) == "workspace:*" or text(spec).startsWith("link:") or text(spec).startsWith("file:"):
      installed.add(%*{"name": name, "version": spec, "source": "workspace", "declared": spec})
      resolved = true
    else: installed.add(%*{"name": name, "version": newJNull(), "source": "unresolved", "declared": spec})
  let locked = lockedVersions(root,app,declared)
  if installed.len == 0 and locked.len == 0: return %*{"packages": [], "status": "unresolved"}
  result = %*{"packages": (if resolved: installed else: locked), "status": (if resolved: "installed" else: "provisional")}
  for lock in locked:
    for actual in installed:
      let version = text(lock["version"])
      if actual["name"] == lock["name"] and truthy(actual["version"]) and truthy(lock["version"]) and actual["version"] != lock["version"] and not (version.startsWith("workspace:") or version.startsWith("link:") or version.startsWith("file:")):
        let rendered = if lock["version"].kind == JString: version elif lock["version"].kind == JFloat: jsNumber(lock["version"].getFloat()) else: $lock["version"]
        let installedVersion = if actual["version"].kind == JString: text(actual["version"]) elif actual["version"].kind == JFloat: jsNumber(actual["version"].getFloat()) else: $actual["version"]
        result["discrepancy"] = %("Lockfile records " & text(lock["name"]) & "@" & rendered & " but the installation has " & installedVersion & "; using the actual installation.")
