## Route locations, input fingerprints, validated worker plans and native publication.
import std/[os, json, strutils, tables, sets, options, algorithm]
when defined(posix): import std/posix
else: import std/tempfiles
import ./route_config, ./jsonutil, ./js_text, ./digests

type
  RouteWarningSink* = proc(message: string) {.closure.}
  RouteGeneration* = object
    count*: Option[int]
    outputs*: OrderedTable[string,string]
    warnings*: seq[string]
var generatedSequence: uint64
proc nodeJoin(parts: varargs[string]): string =
  let path = parts.join($DirSep)
  if path.len == 0: "." else: normalizedPath(path)
proc exists(path: string): bool =
  if '\0' in path: return false
  fileExists(utf8ForWrite(path)) or dirExists(utf8ForWrite(path))
proc fsPath(path: string): string =
  if '\0' in path: raise newException(ValueError,"Path must not contain NUL")
  utf8ForWrite(path)
proc readText(path: string): string = decodeUtf8(readFile(fsPath(path)))
proc routeLocation*(cwd: string, directory, output: Option[string], allowMissingSources = false,
    previousDirectory = ""): tuple[root,dir,base,outputDirectory: string,config: JsonNode] =
  let root = absolutePath(cwd)
  let config = loadRoutingConfig(root,allowMissingSources)
  var dir: string
  if directory.isSome: dir = directory.get()
  elif field(config,"directory") != nil: dir = config["directory"].getStr()
  else:
    for candidate in ["app", "src/app"]:
      if exists(nodeJoin(root,candidate)): dir = candidate; break
    if dir.len == 0 and previousDirectory.len > 0:
      for candidate in ["app", "src/app"]:
        if nodeJoin(root,candidate) == previousDirectory: dir = candidate; break
    if dir.len == 0 and config != nil: dir = "src/app"
  if dir.len == 0: return (root,dir,"","",config)
  let chosenOut = if output.isSome: output.get()
    elif field(config,"out") != nil: config["out"].getStr()
    else: nodeJoin(dir,"..","routes.gen")
  let base = if chosenOut.endsWith(".ts"): chosenOut[0..^4] else: chosenOut
  let outputDirectory = nodeJoin(root,base,"..")
  (root,dir,base,outputDirectory,config)


proc routeInputFingerprint*(cwd: string, directory, output: Option[string]): string =
  let location = routeLocation(cwd,directory,output)
  var records: seq[string]
  var ancestors = initHashSet[string]()
  let generated = nodeJoin(location.root,location.base) & "."
  proc visit(path: string) =
    if location.base.len > 0 and path.startsWith(generated): return
    if dirExists(fsPath(path)):
      let canonical = expandFilename(fsPath(path))
      if canonical in ancestors: raise newException(ValueError,"Route directory contains a symlink cycle")
      ancestors.incl(canonical)
      defer: ancestors.excl(canonical)
      records.add("D" & path)
      var children: seq[string]
      for kind, child in walkDir(fsPath(path)): children.add(child)
      children.sort(jsStringCompare)
      for child in children: visit(child)
    elif fileExists(fsPath(path)): records.add("F" & path & "\0" & sha256Hex(readFile(fsPath(path))))
    else: records.add("M" & path)
  visit(location.root / "xplat.routes.json")
  if location.dir.len > 0: visit(nodeJoin(location.root,location.dir))
  var references: seq[string]
  let manifests = field(location.config,"manifests")
  if manifests != nil:
    for entry in manifests: references.add(text(entry["module"]))
  for key in ["context","transitions"]:
    let entry = field(location.config,key)
    if entry != nil: references.add(text(entry["module"]))
  for reference in references:
    let path = nodeJoin(location.root,reference)
    visit(path)
    if dirExists(parentDir(path)):
      var siblings: seq[string]
      for kind, file in walkDir(parentDir(path)):
        if file.startsWith(path & "."): siblings.add(file)
      siblings.sort(jsStringCompare)
      for file in siblings: visit(file)
  sha256Hex(records.join("\0"))

proc validateRoutePlan*(data: JsonNode, cwd: string, directory, output: Option[string], bake = true): RouteGeneration =
  let location = routeLocation(cwd,directory,output)
  if data == nil or data.kind != JObject or field(data,"version") != %1:
    raise newException(ValueError,"Unsupported route artifact plan")
  let count = field(data,"count")
  result.outputs = initOrderedTable[string,string]()
  if count == %false: result.count = none(int)
  elif count != nil and count.kind == JInt and count.getInt() >= 0: result.count = some(count.getInt())
  else: raise newException(ValueError,"Invalid route count")
  if result.count.isSome != (location.dir.len > 0): raise newException(ValueError,"Route plan source selection mismatch")
  let outputs = field(data,"outputs")
  if outputs == nil or outputs.kind != JArray: raise newException(ValueError,"Invalid route outputs")
  var allowed = initHashSet[string]()
  if location.dir.len > 0:
    let base = nodeJoin(location.root,location.base)
    for suffix in [".contracts.ts",".types.ts",".data.ts",".manifest.json"]: allowed.incl(base & suffix)
    for target in ["web","ios","android","mobile","macos","windows","linux"]:
      allowed.incl(base & "." & target & ".ts")
      allowed.incl(base & ".catalog." & target & ".ts")
  for entry in outputs:
    if entry.kind != JObject or field(entry,"file") == nil or entry["file"].kind != JString or field(entry,"source") == nil or entry["source"].kind != JString:
      raise newException(ValueError,"Invalid route artifact")
    let path = entry["file"].getStr()
    if path notin allowed or result.outputs.hasKey(path): raise newException(ValueError,"Unexpected or duplicate route output destination")
    result.outputs[path] = entry["source"].getStr()
  for path in allowed:
    if (not path.endsWith(".data.ts") or bake or not fileExists(fsPath(path))) and not result.outputs.hasKey(path): raise newException(ValueError,"Incomplete route artifact plan")
  if result.count.isNone and outputs.len != 0: raise newException(ValueError,"Unexpected no-source artifacts")

proc publishRoutes*(generation: RouteGeneration) =
  ## Publish complete files individually, preserving existing output symlinks.
  for file, source in generation.outputs:
    createDir(parentDir(fsPath(file)))
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
