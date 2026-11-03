## Release compatibility and installed graph inspection. Metadata only: no JS execution.
import std/[os, json, strutils, tables, sets]
import ./package_manager, ./jsonutil, ./js_text

const
  dependencySections = ["dependencies","devDependencies","optionalDependencies"]
  coreEngine = "@octane-xplat/nativescript-mason-core"
  fullEngine = "@octane-xplat/nativescript-masonkit"
  legacyEngine = "@triniwiz/nativescript-masonkit"

proc mergeSections(node: JsonNode, sections: openArray[string]): JsonNode =
  result = newJObject()
  for section in sections:
    let entries = field(node,section)
    for name in jsObjectKeys(entries): result[name] = entries[name]

proc readManifest(root: string): JsonNode =
  let path = root / "package.json"
  if not fileExists(path): raise newException(ValueError,"Missing package.json: " & path)
  if getFileSize(path) > 64*1024*1024: raise newException(ValueError,"Package metadata exceeds 64 MiB")
  result = readProjectPackage(root)
  if result.kind != JObject: raise newException(ValueError,"Package manifest must be an object: " & path)

proc localSpecifier(spec: JsonNode): bool =
  let value = text(spec)
  for prefix in ["workspace:","link:","file:","portal:"]:
    if value.startsWith(prefix): return true

proc nativeCliPin(spec: JsonNode, frameworkVersion: string): string =
  let value = text(spec)
  let prefix = frameworkVersion & "-nim."
  if not value.startsWith(prefix): return ""
  let number = value[prefix.len..^1]
  if number.len == 0 or (number.len > 1 and number[0] == '0'): return ""
  for ch in number:
    if ch notin {'0'..'9'}: return ""
  value

proc atLeast(actual, minimum: string): bool =
  proc parts(value: string): seq[int] =
    let clean = if value.startsWith("v"): value[1..^1] else: value
    for part in clean.split({'-','.'}):
      if result.len == 3: break
      let token = part.strip()
      if token.len == 0: result.add(0); continue
      for ch in token:
        if ch notin {'0'..'9'}: return @[]
      try: result.add(parseInt(token))
      except ValueError: return @[]
  let left = parts(actual)
  let right = parts(minimum)
  if left.len != 3 or right.len != 3: return false
  for index in 0..<3:
    if left[index] != right[index]: return left[index] > right[index]
  true

proc inspectCompatibility*(directory: string, pins, tools, builtinNames: JsonNode,
    maxPackages = 100000, checkCancelled: proc() {.closure.} = nil): JsonNode =
  let dir = expandFilename(absolutePath(directory))
  let root = packageManagerRoot(dir)
  let manager = packageManagerFor(root)
  let config = readProjectWorkspace(root,%manager)
  let pkg = readManifest(dir)
  let declared = mergeSections(pkg,dependencySections)
  let windows = truthy(field(declared,"@nativescript/windows")) or
    truthy(field(field(field(pkg,"xplat"),"targets"),"windows"))
  if windows and (truthy(field(declared,"@nativescript/ios")) or truthy(field(declared,"@nativescript/android"))):
    raise newException(ValueError,"Windows preview and mobile need separate workspace packages: their NativeScript pins differ")
  let profile = if windows: "windows" else: "default"
  proc catalogSpec(spec: JsonNode, name: string): JsonNode =
    result = spec
    if text(spec).startsWith("catalog:"):
      let catalog = text(spec)[8..^1]
      let value = if catalog.len > 0 and catalog != "default": field(field(field(config,"catalogs"),catalog),name)
        else: field(field(config,"catalog"),name)
      if value != nil and value.kind != JNull: result = value
  let cliPin = nativeCliPin(catalogSpec(field(declared,"@octane-xplat/cli"),"@octane-xplat/cli"),text(field(pins,"frameworkVersion")))
  if builtinNames == nil or builtinNames.kind != JArray:
    raise newException(ValueError,"Compatibility inspection requires the canonical Node builtin-name inventory")
  var builtins = initHashSet[string]()
  for name in builtinNames:
    if name.kind != JString: raise newException(ValueError,"Invalid Node builtin inventory")
    builtins.incl(name.getStr())
  var rows = newJArray()
  proc row(name: string, ok: bool, detail: string,
      hint = "run xplat upgrade, then bun run xplat doctor") =
    let item = %*{"name":name,"ok":ok,"detail":detail}
    if not ok: item["hint"] = %hint
    rows.add(item)
  proc managed(name: string): JsonNode =
    let framework = field(pins,"frameworkPackages")
    if framework != nil and framework.kind == JArray:
      for item in framework:
        if item == %name:
          return %*{"version":(if name == "@octane-xplat/cli" and cliPin.len > 0: %cliPin else: pins["frameworkVersion"]),"group":"framework","singleton":name == "@octane-xplat/ui"}
    let base = field(field(pins,"packages"),name)
    if base == nil: return nil
    result = base.copy()
    let overrides = field(field(field(pins,"profiles"),profile),name)
    for key in jsObjectKeys(overrides): result[key] = overrides[key]
  proc specifier(entry: JsonNode): JsonNode =
    let spec = field(entry,"specifier")
    if spec != nil and spec.kind != JNull: spec else: field(entry,"version")
  let toolPins = field(pins,"tools")
  row("compatibility Node",atLeast(text(field(tools,"node")),text(field(toolPins,"nodeMinimum"))),
    scalarString(field(tools,"node")) & "; requires >=" & text(field(toolPins,"nodeMinimum")),
    "install Node >=" & text(field(toolPins,"nodeMinimum")))
  let observed = field(tools,manager)
  row("compatibility " & manager,
    (if manager == "bun": atLeast(text(observed),text(field(toolPins,manager))) else: observed == field(toolPins,manager)),
    scalarString(observed) & "; expected " & text(field(toolPins,manager)),"use " & manager & " " & text(field(toolPins,manager)))
  let rootPkg = if fileExists(root / "package.json"): readManifest(root) else: pkg
  let declaredManager = field(rootPkg,"packageManager")
  row("compatibility packageManager",text(declaredManager).split('+')[0] == manager & "@" & text(field(toolPins,manager)),
    (if declaredManager == nil or declaredManager.kind == JNull: "packageManager is missing" else: scalarString(declaredManager)))
  var local = initHashSet[string]()
  let engine = if windows: fullEngine else: coreEngine
  var replaced: seq[string]
  for name in [coreEngine,fullEngine,legacyEngine]:
    if name != engine:
      replaced.add(name)
      if truthy(field(declared,name)):
        row("compatibility mason engine " & name,false,name & " was replaced by " & engine & "; both ship the native Mason framework","run bun run xplat upgrade")
  for name in jsObjectKeys(declared):
    let entry = managed(name)
    if entry == nil: continue
    let raw = declared[name]
    if raw.kind != JString: raise newException(ValueError,"Managed dependency specifier must be a string: " & name)
    let resolved = catalogSpec(raw,name)
    if localSpecifier(resolved): local.incl(name); continue
    let expected = specifier(entry)
    row("compatibility pin " & name,resolved == expected,scalarString(resolved) & "; expected " & scalarString(expected))
  if truthy(field(declared,"octane")) and not truthy(field(declared,"@tsrx/oxc")) and "octane" notin local:
    row("compatibility compiler peer @tsrx/oxc",false,"Octane requires the app to declare @tsrx/oxc")
  var replacedDeclared = false
  for name in replaced:
    if truthy(field(declared,name)): replacedDeclared = true
  if truthy(field(declared,"@nativescript-community/octane")) and not truthy(field(declared,engine)) and
      not replacedDeclared and "@nativescript-community/octane" notin local:
    row("compatibility mason engine " & engine,false,"the NativeScript driver requires " & engine & " for container layout","run bun run xplat upgrade (or add the catalog pin)")
  type Pending = tuple[fromDir,name: string,required: bool]
  var queue: seq[Pending]
  for name in jsObjectKeys(declared): queue.add((dir,name,not truthy(field(field(pkg,"optionalDependencies"),name))))
  var visited, checked = initHashSet[string]()
  var singletons = initOrderedTable[string,OrderedTable[string,string]]()
  var engines = initOrderedTable[string,string]()
  var index = 0
  while index < queue.len:
    if checkCancelled != nil: checkCancelled()
    if queue.len > maxPackages: raise newException(ValueError,"Installed compatibility graph exceeds package bound")
    let pending = queue[index]; inc index
    # require.resolve.paths returns null for builtin names, including node:
    # references. An unrelated on-disk package with that name is unreachable.
    if pending.name.startsWith("node:") or pending.name in builtins: continue
    let installed = installedPackageRoot(pending.fromDir,pending.name)
    if installed == nil:
      let key = pending.fromDir & ":" & pending.name
      if pending.required and (managed(pending.name) != nil or pending.name == coreEngine) and key notin checked:
        checked.incl(key)
        let relative = relativePath(pending.fromDir,dir)
        row("compatibility installed " & pending.name,false,"package is not installed (required by " & (if relative.len == 0: "." else: relative) & ")","run bun install")
      continue
    let location = installed.getStr()
    let dependency = readManifest(location)
    let identity = if field(dependency,"name") == nil or field(dependency,"name").kind == JNull: pending.name else: scalarString(dependency["name"])
    if identity in [coreEngine,fullEngine,legacyEngine]: engines[location] = identity
    let entry = managed(identity)
    if truthy(field(entry,"singleton")):
      if not singletons.hasKey(identity): singletons[identity] = initOrderedTable[string,string]()
      singletons[identity][location] = scalarString(field(dependency,"version"))
    let key = pending.name & ":" & location
    if entry != nil and pending.name notin local and key notin checked:
      checked.incl(key)
      if pending.fromDir == dir or truthy(field(entry,"singleton")):
        row("compatibility installed " & identity,field(dependency,"version") == field(entry,"version"),
          scalarString(field(dependency,"version")) & " at " & relativePath(location,dir) & "; expected " & scalarString(field(entry,"version")))
    if location in visited: continue
    visited.incl(location)
    let children = mergeSections(dependency,["dependencies","optionalDependencies","peerDependencies"])
    for child in jsObjectKeys(children):
      if localSpecifier(children[child]): local.incl(child)
      let required = not truthy(field(field(dependency,"optionalDependencies"),child)) and
        (truthy(field(field(dependency,"dependencies"),child)) or not truthy(field(field(field(dependency,"peerDependenciesMeta"),child),"optional")))
      queue.add((location,child,required))
  if engines.len > 0:
    var detail: seq[string]
    for path,name in engines: detail.add(name & " (" & relativePath(path,dir) & ")")
    row("compatibility installed mason engines",engines.len == 1 and detail[0].startsWith(engine & " ("),detail.join(", "),"keep exactly one " & engine & " copy in the app dependency graph")
  for name,copies in singletons:
    var detail: seq[string]
    for path,version in copies: detail.add(version & " (" & relativePath(path,dir) & ")")
    row("compatibility singleton " & name,copies.len == 1,
      (if copies.len == 1: "one runtime copy" else: $copies.len & " runtime copies: " & detail.join(", ")),
      "align dependency pins and remove nested runtime copies; run bun why " & name)
  rows
