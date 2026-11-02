## Native tsconfig.envs.json expansion. The caller supplies the ambient source
## root explicitly; installation/resource resolution belongs to the command.
import std/[os, json, strutils, tables, sets, algorithm, unicode, math]
import ./jsonc, ./jsonutil, ./json_wire, ./js_text, ./workspace_glob
from ./args import jsNumber

const envManifest* = "tsconfig.envs.json"
const platformModuleSuffixes* = ["", ".web", ".ios", ".android", ".mobile",
  ".native", ".macos", ".linux", ".gtk", ".windows"]
const environments = ["web", "native", "macos", "linux", "gtk", "windows"]
const libOrder = ["ESNext", "DOM", "DOM.Iterable"]

proc nullish(node: JsonNode): bool = node == nil or node.kind == JNull
proc absolute(dir, path: string): string = normalizedPath(absolutePath(path,absolutePath(dir)))
proc exists(path: string): bool =
  if '\0' in path: return false
  let bytes = utf8ForWrite(path)
  fileExists(bytes) or dirExists(bytes)

proc jsCompare(left, right: string): int =
  let a = utf16Units(left)
  let b = utf16Units(right)
  for i in 0..<min(a.len,b.len):
    if a[i] != b[i]: return cmp(a[i],b[i])
  cmp(a.len,b.len)

proc property(node: JsonNode, key: string): JsonNode =
  if node.kind == JObject: return node[key]
  let at = parseInt(key)
  if node.kind == JArray: return node[at]
  %utf16Slice(node.getStr(),at,at+1)

proc iterable(node: JsonNode, label: string): seq[JsonNode] =
  if nullish(node): return
  if node.kind == JArray:
    for item in node: result.add(item)
  elif node.kind == JString:
    # JS for...of iterates Unicode scalars, unlike indexed string properties.
    for rune in node.getStr().runes: result.add(%rune.toUTF8())
  else: raise newException(ValueError,label & " is not iterable")

proc addUnique(values: var seq[JsonNode], value: JsonNode) =
  for other in values:
    if jsStrictEqual(value,other): return
  values.add(value)

proc loadEnvManifest*(dir: string): JsonNode =
  let path = dir / envManifest
  if not exists(path): return nil
  var manifest: JsonNode
  try: manifest = parseJsonc(decodeUtf8(readFile(utf8ForWrite(path))))
  except ValueError as error:
    raise newException(ValueError,path & ": invalid JSON — " & error.msg)
  if manifest.kind != JObject:
    raise newException(ValueError,path & ": expected a JSON object")
  let envs = field(manifest,"environments")
  if envs == nil or envs.kind != JObject or envs.len == 0:
    raise newException(ValueError,path & ": expected a non-empty \"environments\" object")
  %*{"path": path,"manifest": manifest}

proc sourceFile(path: string): bool =
  splitFile(path).ext in [".ts", ".tsx", ".mts", ".cts", ".tsrx", ".js", ".jsx", ".mjs", ".cjs"]

proc expandGlobs(dir: string, patterns: JsonNode, label: string,
    required = true, sourcesOnly = true): OrderedSet[string] =
  result = initOrderedSet[string]()
  for pattern in iterable(patterns,label & " patterns"):
    var matched: seq[string]
    try:
      if pattern.kind != JString: raise newException(ValueError,"pattern must be a string")
      matched = filesystemGlob(dir,@[pattern.getStr()],@[])
    except ValueError as error:
      raise newException(ValueError,label & ": bad pattern \"" & scalarString(pattern) & "\" — " & error.msg)
    var kept = 0
    for file in matched:
      if not sourcesOnly or sourceFile(file): result.incl(file); inc kept
    if required and kept == 0:
      raise newException(ValueError,label & ": pattern \"" & scalarString(pattern) & "\" matched no source files")

proc resolveEnvFiles(dir: string, entry: JsonNode, label: string): seq[string] =
  var files = expandGlobs(dir,field(entry,"include"),label)
  for file in iterable(field(entry,"files"),label & " files"):
    if file.kind != JString: raise newException(ValueError,"path must be a string")
    let path = absolute(dir,file.getStr())
    if not exists(path):
      raise newException(ValueError,label & ": file \"" & file.getStr() & "\" does not exist")
    files.incl(path)
  let excluded = expandGlobs(dir,field(entry,"exclude"),label,false,false)
  for file in files:
    var ignored = false
    for path in excluded:
      if file == path or file.startsWith(path & "/"): ignored = true; break
    if not ignored: result.add(file)
  if result.len == 0:
    raise newException(ValueError,label & ": resolved no files — an empty program would pass vacuously")
  result.sort(jsCompare)

proc barrelEnv(rel: string): string =
  if rel == "src/index.ts": return "any"
  if not rel.startsWith("src/index.") or not rel.endsWith(".ts"): return ""
  let suffix = rel[10..^4]
  if suffix in ["ios", "android", "mobile", "native"]: return "native"
  if suffix in environments: return suffix

proc tabJsonValue(node: JsonNode, depth: int): string =
  case node.kind
  of JObject:
    if node.len == 0: return "{}"
    var entries: seq[string]
    for key in jsObjectKeys(node):
      entries.add(repeat('\t',depth+1) & wireJson(%key) & ": " & tabJsonValue(node[key],depth+1))
    "{\n" & entries.join(",\n") & "\n" & repeat('\t',depth) & "}"
  of JArray:
    if node.len == 0: return "[]"
    var entries: seq[string]
    for value in node: entries.add(repeat('\t',depth+1) & tabJsonValue(value,depth+1))
    "[\n" & entries.join(",\n") & "\n" & repeat('\t',depth) & "]"
  of JInt, JFloat:
    let value = node.getFloat()
    if classify(value) in [fcNan,fcInf,fcNegInf]: "null"
    else: jsNumber(value)
  else: wireJson(node)

proc tabJson(node: JsonNode): string =
  tabJsonValue(node,0) & "\n"

proc expandEnvPrograms*(dir: string, loaded: JsonNode, ambientRoot: string): JsonNode =
  let manifest = loaded["manifest"]
  var errors: seq[string]
  var resolved = initOrderedTable[string,seq[string]]()
  var files = initHashSet[string]()
  var ambient = initOrderedSet[string]()
  var lib, types: seq[JsonNode]
  for env in jsObjectKeys(manifest["environments"]):
    let entry = manifest["environments"][env]
    if env notin environments:
      errors.add(envManifest & ": unknown environment \"" & env & "\" — expected one of: " & environments.join(", "))
      continue
    if entry.kind != JObject:
      errors.add(envManifest & ": environment \"" & env & "\" must be an object")
      continue
    for key in jsObjectKeys(field(entry,"compilerOptions")):
      if key != "types": errors.add(envManifest & ": environment \"" & env & "\" sets compilerOptions." & key &
        ", but all environments share one program now — move it to the top-level compilerOptions (or a per-file pragma for jsxImportSource)")
    let envFiles = resolveEnvFiles(dir,entry,envManifest & " environment \"" & env & "\"")
    resolved[env] = envFiles
    for file in envFiles: files.incl(file)
    let extra = case env
      of "native": @["typecheck-globals/native.d.ts"]
      of "macos": @["typecheck-globals/macos.d.ts", "../../macos-appkit/src/host-globals.d.ts"]
      of "gtk": @["../../linux-gtk-renderer/src/host-globals.d.ts"]
      else: @[]
    for rel in extra:
      let path = absolute(ambientRoot,rel)
      if exists(path): ambient.incl(path)
    lib.addUnique(%"ESNext")
    if env in ["web", "linux"]:
      lib.addUnique(%"DOM"); lib.addUnique(%"DOM.Iterable")
    for value in iterable(field(field(entry,"compilerOptions"),"types"),"environment types"):
      types.addUnique(value)
  var barrels = filesystemGlob(dir,@["src/index*.ts"],@[])
  barrels.sort()
  for path in barrels:
    let rel = relativePath(path,dir).replace('\\','/')
    let env = barrelEnv(rel)
    if env == "": continue
    var claimed = false
    for key, envFiles in resolved:
      if env != "any" and key != env: continue
      for file in envFiles:
        if file.endsWith("/" & rel): claimed = true; break
    if not claimed:
      errors.add(envManifest & ": " & rel & (if env == "any": " is not checked by any declared environment"
        else: " exists but is not claimed by the \"" & env & "\" environment"))
  let top = field(manifest,"compilerOptions")
  let suffixes = field(top,"moduleSuffixes")
  if suffixes != nil and suffixes != %platformModuleSuffixes:
    errors.add(envManifest & ": compilerOptions.moduleSuffixes is fixed — use the platform precedence order " &
      wireJson(%platformModuleSuffixes).replace(", ",",") & " or omit it (inherited)")
  for value in iterable(field(top,"lib"),"top.lib"): lib.addUnique(value)
  for value in iterable(field(top,"types"),"top.types"): types.addUnique(value)
  if errors.len > 0: raise newException(ValueError,errors.join("\n"))
  var orderedLib = newJArray()
  for value in libOrder:
    for item in lib:
      if jsStrictEqual(item,%value): orderedLib.add(item)
  for item in lib:
    if item.kind != JString or item.getStr() notin libOrder: orderedLib.add(item)
  let options = %*{"jsxImportSource": "@octane-xplat/jsx","lib": orderedLib}
  for key in jsObjectKeys(top): options[key] = property(top,key)
  options["moduleSuffixes"] = %platformModuleSuffixes
  if types.len > 0: options["types"] = %types
  var allFiles: seq[string]
  for file in ambient: allFiles.add(file)
  var sorted: seq[string]
  for file in files: sorted.add(file)
  sorted.sort(jsCompare)
  allFiles.add(sorted)
  let config = %*{"extends": loaded["path"],"compilerOptions": options,
    "files": allFiles,"include": [],"exclude": []}
  let outDir = dir / "node_modules" / ".cache" / "xplat-typecheck"
  createDir(utf8ForWrite(outDir))
  let configPath = outDir / "all.json"
  writeFile(utf8ForWrite(configPath),tabJson(config))
  %*[{"env": "all","configPath": configPath,"files": allFiles}]
