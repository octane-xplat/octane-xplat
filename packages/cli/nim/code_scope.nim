## Code corpus boundaries and file discovery. Exclude private/generated paths
## before reading, then validate canonical targets for explicitly requested files.
import std/[json, os, strutils, sets, algorithm, times]
import ./jsonutil, ./docs_binding

const skipDirs = ["node_modules", ".git", ".hg", ".svn", "dist", "build", "out", "coverage", "platforms", ".turbo", ".next", ".output", ".nuxt", ".svelte-kit", "research", "generated", ".agents", ".devin", ".claude", ".idea", ".vscode"]
const secretDirs = [".ssh", ".gnupg", "secrets", ".secrets", "private"]
const extensions = ["ts", "tsx", "tsrx", "js", "jsx", "mjs", "cjs", "mts", "cts", "css", "scss", "swift", "kt", "kts", "java", "m", "mm", "h", "c", "cc", "cpp", "cs"]
const secretFiles = [".npmrc", ".netrc", ".pypirc", ".git-credentials", "credentials.json", "service-account.json", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"]
const secretSuffixes = ["pem", "key", "p12", "pfx", "keystore", "jks", "mobileprovision", "provisionprofile", "asc", "gpg", "secret"]
const maxFileBytes* = 256 * 1024
const maxFilesPerCorpus* = 8000
proc exists(path: string): bool = fileExists(path) or dirExists(path)
proc resolveAt(base, path: string): string =
  normalizedPath(if path.isAbsolute(): absolutePath(path) else: absolutePath(base / path))
proc within(path, root: string): bool =
  let normalized = normalizedPath(absolutePath(root))
  path == normalized or path.startsWith(normalized & DirSep)
proc posix(path: string): string = path.replace(DirSep,'/')
proc exclusionReason*(path: string): JsonNode =
  let parts = path.split('/')
  for index in 0..<parts.high:
    if parts[index] in skipDirs or parts[index] in secretDirs or parts[index].startsWith("."): return %"excluded-directory"
  let name = parts[^1]
  if name.startsWith("."): return %"dotfile"
  if name in secretFiles: return %"secret-or-private-config"
  let words = name.split('.')
  if words.len > 1 and words[^1].toLowerAscii() in secretSuffixes: return %"secret-or-private-config"
  if words.len >= 3 and words[^2] in ["gen","generated","min"] and words[^1] in ["js","ts","tsx","css","mjs","cjs"]: return %"generated-output"
  if name.endsWith(".map"): return %"generated-output"
  for marker in ["pnpm-lock","package-lock","yarn.lock","bun.lock"]:
    if name.contains(marker): return %"generated-output"
  if words.len < 2 or words[^1] notin extensions: return %"not-code"
  nil
proc marksFor(tier: string): seq[string] =
  case tier
  of "web": @["web"]
  of "mobile": @["ios","android"]
  of "native": @["ios","android","macos","windows","linux"]
  of "ios", "android", "macos", "windows", "linux": @[tier]
  else: @[]
proc filePlatforms*(path: string): seq[string] =
  let parts = path.split('/')
  var seen = initHashSet[string]()
  for index in 0..<parts.high:
    for platform in marksFor(parts[index]):
      if platform notin seen: seen.incl(platform); result.add(platform)
  let words = lastPathPart(path).split('.')
  if words.len >= 3:
    for platform in marksFor(words[^2]):
      if platform notin seen: seen.incl(platform); result.add(platform)
proc appliesToPlatform*(path: string, platform = ""): bool =
  if platform == "": return true
  let marks = filePlatforms(path)
  marks.len == 0 or platform in marks
proc listCorpusFiles*(root: string, platform = "", limit = maxFilesPerCorpus): JsonNode =
  var files = newJArray()
  var truncated = false
  proc visit(directory, relative: string) =
    if files.len >= limit: truncated = true; return
    var entries: seq[tuple[path: string,kind: PathComponent]]
    try:
      for kind, path in walkDir(directory): entries.add((path,kind))
    except OSError: return
    entries.sort(proc(a,b: tuple[path:string,kind:PathComponent]):int = cmp(lastPathPart(a.path),lastPathPart(b.path)))
    for entry in entries:
      if files.len >= limit: truncated = true; return
      let name = lastPathPart(entry.path)
      let rel = if relative == "": name else: relative & "/" & name
      if entry.kind == pcDir:
        if name in skipDirs or name in secretDirs or name.startsWith("."): continue
        visit(entry.path,rel)
        continue
      if entry.kind != pcFile or exclusionReason(rel) != nil or not appliesToPlatform(rel,platform): continue
      var info: FileInfo
      try: info = getFileInfo(entry.path)
      except OSError: continue
      if info.size == 0 or info.size > maxFileBytes: continue
      if info.size > 8192:
        try:
          if readFile(entry.path).contains('\0'): continue
        except CatchableError: continue
      let modified = float(info.lastWriteTime.toUnix()) * 1000.0 + float(info.lastWriteTime.nanosecond()) / 1000000.0
      files.add(%*{"abs": entry.path,"rel": posix(rel),"mtimeMs": modified,"size": info.size})
  visit(root,"")
  %*{"files": files,"truncated": truncated}
proc frameworkRoots*(appRoot: string): JsonNode =
  result = newJArray()
  for pkg in resolveInstallations(appRoot)["packages"]:
    let location = field(pkg,"installPath")
    if not truthy(location): continue
    var real = location.getStr()
    try: real = expandFilename(real)
    except OSError: discard
    if not exists(real): continue
    let linked = text(pkg["kind"]) == "linked" and not real.contains(DirSep & ".pnpm" & DirSep)
    let src = real / "src"
    result.add(%*{"corpus": "framework","package": pkg["name"],"version": pkg["version"],"kind": (if linked: "linked" else: "registry"),"provisional": text(pkg["source"]) == "lockfile-provisional","root": (if exists(src): src else: real),"packageRoot": real})
proc frameworkRepoRoots*(root: string): JsonNode =
  result = newJArray()
  var entries: seq[string]
  try:
    for kind, path in walkDir(root / "packages"):
      if kind == pcDir and not lastPathPart(path).startsWith("."): entries.add(path)
  except OSError: return
  entries.sort()
  for entry in entries:
    let src = entry / "src"
    if not exists(src): continue
    let manifest = readJson(entry / "package.json")
    let name = field(manifest,"name")
    result.add(%*{"corpus": "framework","package": (if name != nil and name.kind != JNull: name else: %lastPathPart(entry)),"version": newJNull(),"kind": "workspace","provisional": false,"root": src,"packageRoot": entry})
proc collectCorpora*(workspaceRoot, workspaceKind: string, app: JsonNode): JsonNode =
  var candidates = newJArray()
  if truthy(app):
    var corpus = %*{"corpus": "app","package": newJNull(),"root": app["root"],"base": workspaceRoot}
    let label = field(app,"relativeRoot")
    if label != nil: corpus["label"] = label
    candidates.add(corpus)
    for item in frameworkRoots(text(app["root"])): candidates.add(item)
  if workspaceKind == "framework-repo":
    for item in frameworkRepoRoots(workspaceRoot): candidates.add(item)
  var seen = initHashSet[string]()
  result = newJArray()
  for item in candidates:
    let key = text(item["corpus"]) & ":" & text(item["package"]) & ":" & text(item["root"])
    if key notin seen: seen.incl(key); result.add(item)
proc codeRef*(corpus, key: string): string = "xplat-code://" & corpus & "/" & key
proc parseCodeRef*(reference: string): JsonNode =
  let prefix = "xplat-code://"
  if not reference.startsWith(prefix): return nil
  let body = reference[prefix.len..^1]
  if body.contains({'\r','\n'}) or body.contains("\xE2\x80\xA8") or body.contains("\xE2\x80\xA9"): return nil
  let slash = body.find('/')
  if slash < 0 or slash == body.high: return nil
  let corpus = body[0..<slash]
  if corpus notin ["app","framework"]: return nil
  %*{"corpus": corpus,"key": body[slash+1..^1]}
proc safeRealpath(path: string): string =
  try: expandFilename(path)
  except OSError: ""
proc resolveCorpusFile(corpus: JsonNode, path, key: string): JsonNode =
  let root = text(corpus["root"])
  if not within(path,root): return %*{"error": "out-of-scope"}
  let exclusionRoot = if field(corpus,"packageRoot") != nil: text(corpus["packageRoot"]) else: root
  let excluded = exclusionReason(posix(relativePath(path,exclusionRoot)))
  if excluded != nil: return %*{"error": "excluded","detail": key & " is excluded (" & text(excluded) & ")"}
  let real = safeRealpath(path)
  let realRoot = safeRealpath(root)
  let realExclusionRoot = safeRealpath(exclusionRoot)
  if real == "" or realRoot == "" or realExclusionRoot == "": return %*{"error": "unavailable"}
  if not within(real,realRoot): return %*{"error": "out-of-scope"}
  let targetExcluded = exclusionReason(posix(relativePath(real,realExclusionRoot)))
  if targetExcluded != nil: return %*{"error": "excluded","detail": key & " is excluded (" & text(targetExcluded) & ")"}
  %*{"abs": real,"rel": posix(relativePath(path,root)),"corpus": corpus}
proc resolveCodePath*(corpora: JsonNode, corpus, key: string): JsonNode =
  if corpus == "" or key == "" or ".." in key.split('/') or key.startsWith("/"): return %*{"error": "out-of-scope"}
  if corpus == "app":
    for candidate in corpora:
      if text(candidate["corpus"]) == "app":
        let base = if field(candidate,"base") != nil: text(candidate["base"]) else: text(candidate["root"])
        return resolveCorpusFile(candidate,resolveAt(base,key),key)
    return %*{"error": "unavailable","detail": "no app corpus (no bound app)"}
  var selected: JsonNode
  var longest = -1
  for candidate in corpora:
    let package = text(candidate["package"])
    if text(candidate["corpus"]) == "framework" and key.startsWith(package & "/") and package.len > longest:
      longest = package.len; selected = candidate
  if selected == nil: return %*{"error": "unavailable","detail": "framework package for \"" & key & "\" is not in scope"}
  resolveCorpusFile(selected,resolveAt(text(selected["root"]),key[longest+1..^1]),key)
proc codeKeyFor*(corpus, file: JsonNode): string =
  if text(corpus["corpus"]) == "app":
    let base = if field(corpus,"base") != nil: text(corpus["base"]) else: text(corpus["root"])
    posix(relativePath(text(file["abs"]),base))
  else: text(corpus["package"]) & "/" & text(file["rel"])
