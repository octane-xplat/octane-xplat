## Native route planning and typecheck-only emission. The parser callback consumes
## source snapshots; it must not execute application modules or the old CLI.
import std/[os, json, strutils, tables, sets, options, algorithm, tempfiles]
when defined(posix): import std/posix
import ./route_config, ./route_metadata, ./route_paths, ./route_templates
import ./jsonutil, ./js_json, ./js_text, ./locale_sort

type
  RouteAnalyzer* = proc(source, file: string): JsonNode {.closure.}
  RouteWarningSink* = proc(message: string) {.closure.}
  RouteGeneration* = object
    count*: Option[int] # none is the reference's false; some(0) is an empty program.
    outputs*: OrderedTable[string,string]
    warnings*: seq[string]

const targets = ["web", "ios", "android", "mobile", "macos", "windows", "linux"]
const suffixOrder = ["web", "mobile", "ios", "android", "macos", "windows", "linux"]
const loaderExtensions = ["ts", "mts", "cts", "js", "mjs", "cjs"]
const hooks = [("loader","loader"), ("beforeLoad","guard"), ("group","group"),
  ("validateSearch","validateSearch"), ("head","head"), ("ErrorBoundary","errorBoundary")]
var generatedSequence: uint64

proc nodeJoin(parts: varargs[string]): string =
  let path = parts.join($DirSep)
  if path.len == 0: "." else: normalizedPath(path)
proc slashes(path: string): string =
  when DirSep != '/': path.replace(DirSep,'/')
  else: path
proc exists(path: string): bool =
  if '\0' in path: return false
  fileExists(utf8ForWrite(path)) or dirExists(utf8ForWrite(path))
proc fsPath(path: string): string =
  if '\0' in path: raise newException(ValueError,"Path must not contain NUL")
  utf8ForWrite(path)
proc readText(path: string): string = decodeUtf8(readFile(fsPath(path)))
proc stringList(node: JsonNode): seq[string] =
  if node != nil and node.kind == JArray:
    for value in node: result.add(value.getStr())
proc quote(value: string): string = jsStringify(%value)
proc segmentPath(route: JsonNode): string = "/" & stringList(route["segments"]).join("/")

proc stemFor(path: string, markdown = false): string =
  var parts = path.split('/')
  var base = parts[^1]
  let extensions = if markdown: @["md"] else: @["tsrx", "tsx", "ts", "mts", "cts", "js", "mjs", "cjs", "jsx"]
  for ext in extensions:
    if base.endsWith("." & ext): base = base[0..<base.len-ext.len-1]; break
  for suffix in suffixOrder:
    if base.endsWith("." & suffix): base = base[0..<base.len-suffix.len-1]; break
  for presentation in ["modal", "fade", "push"]:
    if base.endsWith("+" & presentation): base = base[0..<base.len-presentation.len-1]; break
  parts[^1] = base
  parts.join("/")

proc platformSuffix(path: string): string =
  var stem: string
  for ext in ["tsx", "tsrx"]:
    if path.endsWith("." & ext): stem = path[0..<path.len-ext.len-1]; break
  for suffix in suffixOrder:
    if stem.endsWith("." & suffix): return suffix

proc routeFiles(path: string): seq[string] =
  var children: seq[string]
  for kind, child in walkDir(fsPath(path)): children.add(lastPathPart(child))
  children.sort(jsStringCompare)
  for name in children:
    let file = nodeJoin(path,name)
    let info = getFileInfo(fsPath(file)) # stat every entry, including links.
    if info.kind == pcDir: result.add(routeFiles(file))
    elif splitFile(name).ext in [".tsx", ".tsrx", ".md"]: result.add(file)

proc routeLocation(cwd: string, directory, output: Option[string]): tuple[root,dir,base,outputDirectory: string,config: JsonNode] =
  let root = absolutePath(cwd)
  let config = loadRoutingConfig(root)
  var dir: string
  if directory.isSome: dir = directory.get()
  elif field(config,"directory") != nil: dir = config["directory"].getStr()
  else:
    for candidate in ["app", "src/app"]:
      if exists(nodeJoin(root,candidate)): dir = candidate; break
    if dir.len == 0 and config != nil: dir = "src/app"
  if dir.len == 0: return (root,dir,"","",config)
  let chosenOut = if output.isSome: output.get()
    elif field(config,"out") != nil: config["out"].getStr()
    else: nodeJoin(dir,"..","routes.gen")
  let base = if chosenOut.endsWith(".ts"): chosenOut[0..^4] else: chosenOut
  let outputDirectory = nodeJoin(root,base,"..")
  (root,dir,base,outputDirectory,config)

proc collectRouteSources*(cwd: string, directory = none(string), output = none(string)): JsonNode =
  let (root,dir,base,outputDirectory,config) = routeLocation(cwd,directory,output)
  result = newJArray()
  if dir.len == 0: return
  let tree = nodeJoin(root,dir)
  if not exists(tree): return
  for file in routeFiles(tree):
    let relative = slashes(relativePath(file,tree))
    if file.startsWith(nodeJoin(root,base) & ".") or relative.endsWith(".md") or lastPathPart(stemFor(relative)) == "_layout": continue
    result.add(%*{"file": slashes(relativePath(file,root)),"source": readText(file)})

proc planRoutesForTypecheck*(cwd: string, analyzer: RouteAnalyzer,
    directory = none(string), output = none(string), onWarn: RouteWarningSink = nil): RouteGeneration =
  result.count = none(int)
  result.outputs = initOrderedTable[string,string]()
  var warnings: seq[string]
  proc warn(message: string) =
    warnings.add(message)
    if onWarn != nil: onWarn(message)
  let (root,dir,base,outputDirectory,config) = routeLocation(cwd,directory,output)
  if dir.len == 0: return
  createDir(fsPath(outputDirectory))
  proc moduleRef(file: string): string =
    let relative = slashes(relativePath(file,outputDirectory))
    if relative.startsWith("."): relative else: "./" & relative
  proc exportType(reference: JsonNode): string =
    "typeof import(" & quote(moduleRef(nodeJoin(root,text(reference["module"])))) & ")[" & quote(text(reference["export"])) & "]"
  let contextType = if field(config,"context") != nil: "RouteRootContext<" & exportType(config["context"]) & ">" else: "Record<string, unknown>"
  var seen = initOrderedTable[string,JsonNode]()
  var variants = initOrderedTable[string,seq[JsonNode]]()
  var paths: seq[string]
  var layouts = initHashSet[string]()
  let tree = nodeJoin(root,dir)
  if exists(tree):
    for file in routeFiles(tree):
      if file.startsWith(nodeJoin(root,base) & "."): continue
      let relative = slashes(relativePath(file,tree))
      let markdown = relative.endsWith(".md")
      if not markdown: paths.add(relative)
      if not markdown and lastPathPart(stemFor(relative)) == "_layout":
        let parts = relative.split('/')
        layouts.incl(parts[0..<parts.len-1].join("/"))
        continue
      let route = routeFor(relative,markdown)
      if route == nil: continue
      route["file"] = %relative
      if markdown:
        route["dataMode"] = %"baked"
        route["md"] = %true
        if route["params"].len > 0:
          warn("markdown route '" & relative & "' declares a param — .md files bake one document; for param'd content use a [param] route + .loader.ts that bakes a table")
          continue
      else:
        if analyzer == nil: raise newException(ValueError,"Native route generation requires the project compiler parser")
        let metadata = routeMetadata(analyzer(readText(file),slashes(relativePath(file,root))))
        for key,value in metadata: route[key] = value
        let leaf = newJObject()
        for key,value in route: leaf[key] = value
        variants.mgetOrPut(text(route["name"]),@[]).add(leaf)
      let name = text(route["name"])
      let previous = seen.getOrDefault(name)
      if previous == nil: seen[name] = route
      elif truthy(field(route,"md")) and not truthy(field(previous,"md")):
        warn("route '" & name & "' has both a component file and " & text(route["file"]) & " — keeping the component")
      elif truthy(field(previous,"md")) and not truthy(field(route,"md")):
        warn("route '" & name & "' has both " & text(previous["file"]) & " and a component file — keeping the component")
        seen[name] = route
      elif truthy(field(route,"dataMode")) and truthy(field(previous,"dataMode")) and route["dataMode"] != previous["dataMode"]:
        warn("route '" & name & "' declares dataMode '" & text(previous["dataMode"]) & "' and '" & text(route["dataMode"]) & "' in different leaves — keeping '" & text(previous["dataMode"]) & "'")
      elif truthy(field(route,"dataMode")) and not truthy(field(previous,"dataMode")):
        previous["dataMode"] = route["dataMode"]
      if previous != nil:
        for flag in ["loader", "guard", "head", "errorBoundary"]:
          if not truthy(field(previous,flag)) and truthy(field(route,flag)): previous[flag] = route[flag]
  var list: seq[JsonNode]
  for name, route in seen: list.add(route)
  var sorter = newLocaleSorter()
  try: list.sort(proc(a,b: JsonNode): int = sorter.compare(text(a["name"]),text(b["name"])))
  finally: sorter.close()
  var patternNames = initTable[string,JsonNode]()
  for route in list:
    var shape: seq[string]
    for segment in stringList(route["segments"]):
      let param = routeParamName(segment)
      shape.add(if param.isSome and param.get().len > 0:
        (if segment.startsWith("*"): "*" elif segment.endsWith("?"): ":?" else: ":") else: segment)
    let key = shape.join("/")
    let previous = patternNames.getOrDefault(key)
    if previous != nil and previous["name"] != route["name"]:
      raise newException(ValueError,"route/incompatible-platform-params: " & text(previous["file"]) & " and " & text(route["file"]) & " describe the same URL pattern with different parameter names; use the same bracket names across platform variants")
    patternNames[key] = route
  var loaders = initOrderedTable[string,string]()
  var markdown: seq[JsonNode]
  for route in list:
    if text(field(route,"dataMode")) != "baked": continue
    if truthy(field(route,"md")): markdown.add(route); continue
    let name = text(route["name"])
    let stem = stemFor(text(route["file"]))
    for ext in loaderExtensions:
      let candidate = nodeJoin(root,dir,stem & ".loader." & ext)
      if exists(candidate): loaders[name] = candidate; break
    if not loaders.hasKey(name):
      raise newException(ValueError,"baked route '" & name & "' (" & text(route["file"]) & ") has no loader sibling — expected " & dir & "/" & stem & ".loader.{" & loaderExtensions.join(",") & "}")
  var platforms = initTable[string,seq[string]]()
  for route in list:
    let name = text(route["name"])
    for target in targets:
      var available = truthy(field(route,"md"))
      for leaf in variants.getOrDefault(name):
        let suffix = platformSuffix(text(leaf["file"]))
        if suffix.len == 0 or suffix == target or (suffix == "web" and target == "linux") or
            (suffix == "mobile" and target in ["ios", "android"]): available = true
      if available: platforms.mgetOrPut(name,@[]).add(target)
  var contracts, availability, variantChecks, exportChecks, callbackTypes, guardInputs, loaderInputs, names, params, presents: seq[string]
  let targetUnion = block:
    var items: seq[string]
    for target in targets: items.add(quote(target))
    items.join(" | ")
  for i, route in list:
    let name = text(route["name"])
    let path = segmentPath(route)
    let isMarkdown = truthy(field(route,"md"))
    let module = if isMarkdown: "{ dataMode: 'baked' }" else: "typeof import(" & quote(moduleRef(nodeJoin(root,dir,text(route["file"])))) & ")"
    let baked = if isMarkdown: "import('@octane-xplat/ui/markdown').MdDoc"
      elif text(field(route,"dataMode")) == "baked": "RouteBakedLoaderData<typeof import(" & quote(moduleRef(loaders[name])) & ")>"
      else: "unknown"
    let bakedArgument = if text(field(route,"dataMode")) == "baked": ", " & baked else: ""
    contracts.add("\t" & quote(path) & ": FileRouteContract<" & quote(path) & ", " & module & ", RootContext" & bakedArgument & ">" &
      (if platforms[name].len != targets.len: " & { readonly platformOnly: true }" else: ""))
    var available: seq[string]
    for target in platforms[name]: available.add(quote(target))
    availability.add("\t" & quote(path) & ": " & available.join(" | "))
    for leaf in variants.getOrDefault(name):
      if leaf["file"] == route["file"]: continue
      let otherModule = "typeof import(" & quote(moduleRef(nodeJoin(root,dir,text(leaf["file"])))) & ")"
      let otherBaked = if text(field(route,"dataMode")) == "baked": ", RouteBakedLoaderData<typeof import(" & quote(moduleRef(loaders[name])) & ")>" else: ""
      let otherContract = "FileRouteContract<" & quote(path) & ", " & otherModule & ", RootContext" & otherBaked & ">"
      variantChecks.add("\t// " & quote(path) & ": " & text(route["file"]) & " ↔ " & text(leaf["file"]) & "\n\tCheckRouteVariant<FileRouteContracts[" & quote(path) & "], " & otherContract & ">,\n\tCheckRouteVariant<" & otherContract & ", FileRouteContracts[" & quote(path) & "]>,")
    if not isMarkdown:
      callbackTypes.add("type Guard_" & $i & " = FileRouteGuardArgs<" & quote(path) & ", " & module & ", RootContext>\ntype Loader_" & $i & " = FileRouteLoaderArgs<" & quote(path) & ", " & module & ", RootContext>")
      guardInputs.add("\t" & quote(path) & ": Guard_" & $i)
      loaderInputs.add("\t" & quote(path) & ": Loader_" & $i)
    names.add("\n\t| '" & name & "'")
    var fields: seq[string]
    for segment in stringList(route["segments"]):
      if segment.startsWith("*"):
        let field = if segment.len > 1: segment[1..^1] else: "*"
        fields.add("'" & field & "'?: string")
      elif segment.startsWith(":"):
        fields.add(segment[1..<segment.len-(if segment.endsWith("?"): 1 else: 0)] & (if segment.endsWith("?"): "?: string" else: ": string"))
    params.add("\t'" & name & "': { " & fields.join("; ") & " }")
    if truthy(field(route,"presentation")): presents.add("\t'" & name & "': '" & text(route["presentation"]) & "'")
  for name, leaves in variants:
    for leaf in leaves:
      let module = "typeof import(" & quote(moduleRef(nodeJoin(root,dir,text(leaf["file"])))) & ")"
      for (name,flag) in hooks:
        if not truthy(field(leaf,flag)): continue
        exportChecks.add("\t// " & text(leaf["file"]) & ": " & name & "\n\tCheckRouteExport<" & quote(name) & ", " & module & "[" & quote(name) & "]" &
          (if name == "validateSearch": ", import('@octane-xplat/ui/routing/core').RouteSearchValidationCheck<" & module & "[" & quote(name) & "]>" else: "") & ">,")
  var manifestContracts: string
  let manifests = field(config,"manifests")
  if manifests != nil:
    for reference in manifests: manifestContracts.add(", ContractsOf<" & exportType(reference) & ">")
  let shapes = if exportChecks.len > 0: renderRouteTemplate("exportShapes","4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",[]) else: ""
  result.outputs[nodeJoin(root,base & ".contracts.ts")] = renderRouteTemplate("contracts","8232f8447573fff2c18054fb64c8267350f07c61afc4648743a95fabf865e4ec",[
    contextType, contracts.join("\n"), availability.join("\n"), targetUnion,
    (if variantChecks.len > 0: "type CheckRouteVariant<Expected, Actual extends Omit<Expected, 'platformOnly'>> = Actual" else: ""),
    variantChecks.join("\n"), shapes, exportChecks.join("\n"), manifestContracts, targetUnion, manifestContracts,
    callbackTypes.join("\n"), guardInputs.join("\n"), loaderInputs.join("\n"),
    (if names.len > 0: names.join("") else: "never"),
    (if params.len > 0: params.join("\n") else: "\t// no param routes"),
    (if presents.len > 0: presents.join("\n") else: "\t// no declared presentation defaults")])
  let baseName = lastPathPart(base)
  let contractsRef = "./" & baseName & ".contracts"
  let transitions = field(config,"transitions")
  var stackFields: seq[string]
  for stack in stringList(field(config,"stacks")): stackFields.add("\t\t" & quote(stack) & ": unknown")
  result.outputs[nodeJoin(root,base & ".types.ts")] = renderRouteTemplate("registration","4b8472c6da1dc388b8554e0973427114fb538e3bd36bfd18baf849c9e5db7950",[
    quote(contractsRef),quote(contractsRef),
    (if transitions != nil: "import type { TransitionNames } from '@octane-xplat/ui/routing/core'\ntype CustomTransitions = { [Key in TransitionNames<" & exportType(transitions) & ">]: unknown }\n" else: ""),
    stackFields.join("\n"),(if transitions != nil: "\tinterface AppRouteTransitions extends CustomTransitions {}\n" else: "")])
  let dataFile = nodeJoin(root,base & ".data.ts")
  if (loaders.len == 0 and markdown.len == 0) or not exists(dataFile):
    result.outputs[dataFile] = renderRouteTemplate("data","c882a552e754ed512bb19c48a7755e9423cf2a2e35ab700349eeca4111ef77e7",[quote("{}")])
  var sortedLayouts, screens: seq[string]
  for layout in layouts: sortedLayouts.add(layout)
  sortedLayouts.sort(jsStringCompare)
  for route in list: screens.add(text(route["name"]))
  screens.sort(jsStringCompare)
  let manifestJson = %*{"version": 1,"layouts": sortedLayouts,"screens": screens,"routes": []}
  for route in list:
    let name = text(route["name"])
    var chain: seq[string]
    if "" in layouts: chain.add("")
    let parts = name.split('/')
    for i in 1..<parts.len:
      let layout = parts[0..<i].join("/")
      if layout in layouts: chain.add(layout)
    let record = %*{"name": name,"platforms": platforms[name],"path": (if name == "index": "" else: name),"params": route["params"]}
    for key in ["presentation", "transition", "dataMode"]:
      if truthy(field(route,key)): record[key] = route[key]
    record["layouts"] = %chain
    record["source"] = %(dir & "/" & text(route["file"]))
    record["loader"] = %(truthy(field(route,"loader")) or truthy(field(route,"group")) or truthy(field(route,"md")) or loaders.hasKey(name))
    record["guard"] = %(truthy(field(route,"guard")) or truthy(field(route,"group")))
    record["head"] = %truthy(field(route,"head"))
    record["errorBoundary"] = %truthy(field(route,"errorBoundary"))
    manifestJson["routes"].add(record)
  result.outputs[nodeJoin(root,base & ".manifest.json")] = jsStringify(manifestJson,pretty=true) & "\n"
  let relative = slashes(relativePath(nodeJoin(root,dir),outputDirectory))
  let globDir = if relative.startsWith("."): relative else: "./" & relative
  proc globLiteral(path: string): string =
    for ch in path:
      if ch in {'\\','*','?','{','}','(',')','!','@','+','[',']'}: result.add('\\')
      result.add(ch)
  proc exactExclusions(preferences: seq[string]): seq[string] =
    var candidates: seq[tuple[path,identity: string,rank: int]]
    var best = initTable[string,int]()
    for path in paths:
      let suffix = platformSuffix(path)
      let rank = if suffix.len == 0: preferences.len else: preferences.find(suffix)
      if rank < 0: continue
      let route = routeFor(path)
      let identity = if route != nil: "route:" & text(route["name"]) else: "layout:" & path.split('/')[0..^2].join("/")
      candidates.add((path,identity,rank))
      best[identity] = min(best.getOrDefault(identity,high(int)),rank)
    for file in candidates:
      if file.rank > best[file.identity]: result.add("\t\t'!" & globDir & "/" & globLiteral(file.path) & "'")
  var markdownRows: seq[string]
  for route in markdown:
    markdownRows.add("\t\t{ path: " & quote(text(route["name"])) & ", screen: MarkdownScreen, dataMode: 'baked', source: " & quote(dir & "/" & text(route["file"])) & " },")
  let markdownGlue = if markdown.len > 0: renderRouteTemplate("markdown","e9d1ab30a20432ac25dc30a8517a1c30ccc04544fdb4dd48961113ee2cd44ff2",[markdownRows.join("\n")]) else: ""
  var manifestImports: seq[string]
  var catalogParts = @["fileRoutes"]
  if markdown.len > 0: catalogParts.add("markdownRoutes")
  if manifests != nil:
    for i in 0..<manifests.len:
      let reference = manifests[i]
      manifestImports.add("import { " & text(reference["export"]) & " as configured" & $i & " } from " & quote(moduleRef(nodeJoin(root,text(reference["module"])))))
      catalogParts.add("configured" & $i)
  let definitions = newJArray()
  for route in list:
    if truthy(field(route,"md")): continue
    definitions.add(%*{"name": route["name"],"segments": route["segments"],"params": route["params"],
      "file": dir & "/" & text(route["file"]),"platforms": platforms[text(route["name"])]})
  for target in ["web", "ios", "android", "mobile", "linux", "macos", "windows"]:
    let preferences = if target == "linux": @["linux", "web"] elif target in ["ios", "android"]: @[target,"mobile"] else: @[target]
    var exclusions: seq[string]
    let suffixes = if target == "web": @["mobile", "ios", "android", "macos", "windows", "linux"]
      elif target == "macos": @["web", "ios", "android", "mobile", "windows", "linux"]
      elif target == "windows": @["web", "ios", "android", "mobile", "macos", "linux"]
      else: @["web", "ios", "android", "mobile", "macos", "windows", "linux"]
    for suffix in suffixes:
      if suffix notin preferences: exclusions.add("\t\t'!" & globDir & "/**/*." & suffix & ".{tsrx,tsx}'")
    exclusions.add(exactExclusions(preferences))
    let prefer = if target in ["web", "macos", "windows"]: "['" & target & "']" else: jsStringify(%preferences)
    let catalog = renderRouteTemplate("catalog","cff9a73d957e521e3d4c4434fda0d6ef5335a70212dc4a34c3b42b8fdff2c5c8",[
      "",baseName,baseName,quote(target),quote(target),
      (if markdown.len > 0: "import { MarkdownScreen } from '@octane-xplat/ui/markdown'\n" else: ""),
      manifestImports.join("\n"),"export type { RouteName, RouteParams, RoutePresentations } from './" & baseName & ".contracts'",
      globDir,globDir,exclusions.join(",\n"),globDir,exclusions.join(",\n"),prefer,quote(globDir),jsStringify(definitions),markdownGlue,catalogParts.join(", ")])
    let catalogRef = "./" & baseName & ".catalog." & target
    result.outputs[nodeJoin(root,base & ".catalog." & target & ".ts")] = catalog
    let context = field(config,"context")
    var settings: string
    for key in ["base", "allowedOrigins", "allowedSchemes"]:
      if field(config,key) != nil: settings.add("\t" & key & ": " & jsStringify(config[key]) & ",\n")
    result.outputs[nodeJoin(root,base & "." & target & ".ts")] = renderRouteTemplate("platform","b0fce2422c4765a802489650b6670e96250dd1c72eab6a7f9fbb8fd91e620a3b",[
      baseName,quote(catalogRef),
      (if context != nil: "import { " & text(context["export"]) & " as routeContext } from " & quote(moduleRef(nodeJoin(root,text(context["module"])))) & "\n" else: ""),
      (if transitions != nil: "import { " & text(transitions["export"]) & " as routeTransitions } from " & quote(moduleRef(nodeJoin(root,text(transitions["module"])))) & "\n" else: ""),
      quote(catalogRef),(if context != nil: "\tcontext: routeContext,\n" else: ""),(if transitions != nil: "\ttransitions: routeTransitions,\n" else: ""),
      (if field(config,"stacks") != nil and config["stacks"].len > 0: "\tstacks: " & jsStringify(config["stacks"]) & ",\n" else: ""), settings])
  result.count = some(list.len)
  result.warnings = warnings

proc publishRoutes*(generation: RouteGeneration) =
  ## Publish complete files individually, preserving existing output symlinks.
  for file, source in generation.outputs:
    if exists(file) and readText(file) == source: continue
    let target = if exists(file): expandFilename(fsPath(file)) else: fsPath(file)
    when defined(posix):
      inc generatedSequence
      let temporary = target & ".tmp-" & $getCurrentProcessId() & "-" & $generatedSequence
      # open(0666) applies the caller's umask. mkstemp's private 0600 mode
      # would survive rename and silently change generated-file permissions.
      var descriptor = posix.open(cstring(temporary),O_WRONLY or O_CREAT or O_EXCL or O_CLOEXEC,Mode(0o666))
      if descriptor < 0: raiseOSError(osLastError())
      try:
        let bytes = utf8ForWrite(source)
        var written = 0
        while written < bytes.len:
          let count = posix.write(descriptor,unsafeAddr bytes[written],bytes.len-written)
          if count < 0:
            let error = osLastError()
            if error == OSErrorCode(EINTR): continue
            raiseOSError(error)
          if count == 0: raise newException(IOError,"Could not write complete generated route file")
          written += count
        let closed = posix.close(descriptor)
        descriptor = -1
        if closed != 0: raiseOSError(osLastError())
        moveFile(temporary,target)
      finally:
        if descriptor >= 0: discard posix.close(descriptor)
        if fileExists(temporary): removeFile(temporary)
    else:
      # This publication backend has runtime qualification only on macOS.
      let (handle, temporary) = createTempFile(lastPathPart(target) & ".tmp-","",parentDir(target))
      try:
        try: handle.write(utf8ForWrite(source))
        finally: handle.close()
        moveFile(temporary,target)
      finally:
        if fileExists(temporary): removeFile(temporary)
