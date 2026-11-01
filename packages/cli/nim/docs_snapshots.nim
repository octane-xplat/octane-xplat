## Exact-tag, commit-pinned documentation snapshots. Checkout contents are data.
import std/[json, os, strutils, unicode, strtabs, tempfiles, times]
import ./jsonutil, ./strictjson, ./json_wire, ./js_text, ./digests, ./provenance, ./command_output
from ./args import jsTrim

type
  SnapshotGitRunner* = proc(args: seq[string], cwd: string): string {.closure.}
  SnapshotContext* = object
    cacheDir*, gitPath*: string
    environment*: StringTableRef
    timeoutMs*: int
    runner*: SnapshotGitRunner

proc defaultDocsCacheDir*(): string =
  getEnv("XPLAT_MCP_CACHE",getHomeDir() / ".cache" / "octane-xplat" / "mcp-docs")
proc newSnapshotContext*(cacheDir = defaultDocsCacheDir(), gitPath = "git", timeoutMs = 60000,
    environment: StringTableRef = nil, runner: SnapshotGitRunner = nil): SnapshotContext =
  SnapshotContext(cacheDir: cacheDir,
    gitPath: gitPath,timeoutMs: timeoutMs,environment: environment,runner: runner)

proc git(ctx: SnapshotContext, args: seq[string], cwd = ""): string =
  if ctx.runner != nil: return ctx.runner(args,cwd)
  let environment = newStringTable(modeCaseSensitive)
  for key, value in envPairs(): environment[key] = value
  environment["GIT_TERMINAL_PROMPT"] = "0"
  environment["GIT_ASKPASS"] = "true"
  if ctx.environment != nil:
    for key, value in ctx.environment: environment[key] = value
  let captured = captureCommand(ctx.gitPath,args,cwd,ctx.timeoutMs,16*1024*1024,environment)
  if captured.timedOut or captured.exitCode != 0: raise newException(OSError,"Git command unavailable")
  decodeUtf8(captured.output)
proc gitAvailable*(ctx: SnapshotContext): bool =
  try:
    discard ctx.git(@["--version"])
    true
  except CatchableError: false

proc words(value: string): seq[string] =
  var word = ""
  for rune in value.runes:
    if jsTrim(rune.toUTF8()) == "":
      if word != "": result.add(word); word = ""
    else: word.add(rune.toUTF8())
  if word != "": result.add(word)
proc remoteTagSha*(ctx: SnapshotContext, repo, tag: string): JsonNode =
  var commit = newJNull()
  for line in ctx.git(@["ls-remote",repo,"refs/tags/" & tag,"refs/tags/" & tag & "^{}"]).split('\n'):
    let pieces = words(line)
    if pieces.len == 0: continue
    if pieces.len < 2: raise newException(ValueError,"Remote tag output has no ref")
    if pieces[1].endsWith("^{}"): return %*{"commit": pieces[0]}
    commit = %pieces[0]
  %*{"commit": commit}

proc exists(path: string): bool = fileExists(path) or dirExists(path)
proc acquire(ctx: SnapshotContext, options: JsonNode): JsonNode =
  createDir(ctx.cacheDir)
  let temporary = createTempDir("tmp-","",ctx.cacheDir)
  defer:
    if dirExists(temporary): removeDir(temporary)
  discard ctx.git(@["init","-q",temporary])
  discard ctx.git(@["-c","core.hooksPath=/dev/null","fetch","-q","--depth","1",text(options["repo"]),
    "refs/tags/" & text(options["tag"])],temporary)
  discard ctx.git(@["checkout","-q","--detach","FETCH_HEAD"],temporary)
  let commit = jsTrim(ctx.git(@["rev-parse","HEAD"],temporary))
  let package = readJson(temporary / text(options["packageDir"]) / "package.json")
  if not jsStrictEqual(field(package,"name"),field(options,"packageName")) or
      not jsStrictEqual(field(package,"version"),field(options,"version")):
    let found = newJObject()
    for key in ["name","version"]:
      let value = field(package,key)
      if value != nil: found[key] = value
    return %*{"error": "metadata-mismatch","commit": commit,"found": found}
  let repoKey = sha256Hex(utf8ForWrite(text(options["repo"])))[0..<16]
  let destination = ctx.cacheDir / "snapshots" / repoKey / commit
  if not exists(destination):
    createDir(parentDir(destination))
    moveDir(temporary,destination)
  %*{"dir": destination,"commit": commit}

proc readBindings(ctx: SnapshotContext): JsonNode =
  try: parseStrictJson(decodeUtf8(readFile(ctx.cacheDir / "bindings.json")))
  except CatchableError: newJObject()
proc writeBindings(ctx: SnapshotContext, bindings: JsonNode) =
  createDir(ctx.cacheDir)
  let path = ctx.cacheDir / "bindings.json"
  let temporary = path & "." & $getCurrentProcessId() & ".tmp"
  var lines: seq[string]
  for line in wireJson(bindings,pretty=true,indent=1).splitLines():
    var prefix = 0
    while prefix < line.len and line[prefix] == ' ': inc prefix
    lines.add(repeat('\t',prefix) & line[prefix..^1])
  writeFile(temporary,lines.join("\n"))
  moveFile(temporary,path)
proc pickCached(cached: JsonNode, offline: bool): JsonNode =
  result = %*{"status": "bound","offline": offline}
  for key in ["dir","commit","tag"]:
    let value = field(cached,key)
    if value != nil: result[key] = value

proc ensureSnapshot*(ctx: SnapshotContext, options: JsonNode): JsonNode =
  let key = scalarString(options["packageName"]) & "@" & scalarString(options["version"])
  let bindings = ctx.readBindings()
  let cached = field(bindings,key)
  let fields = %*{"package": options["packageName"],"requestedVersion": options["version"],
    "repo": options["repo"],"tag": options["tag"]}
  let conflictFields = fields.copy()
  conflictFields.delete("tag")
  let cachedPath = text(field(cached,"dir"))
  let hasCache = cachedPath != "" and exists(cachedPath)
  if not ctx.gitAvailable():
    return if hasCache: pickCached(cached,true) else: unavailable("git-unavailable",fields)
  var remote: JsonNode
  try: remote = ctx.remoteTagSha(text(options["repo"]),text(options["tag"]))
  except CatchableError:
    return if hasCache: pickCached(cached,true) else: unavailable("remote-unavailable",fields)
  let remoteCommit = remote["commit"]
  let tag = options["tag"]
  let cachedCommit = field(cached,"commit")
  if not truthy(remoteCommit):
    if hasCache:
      let old = %*{"tag": tag}
      if cachedCommit != nil: old["commit"] = cachedCommit
      return tagConflict(old,%*{"tag": tag,"commit": newJNull()},conflictFields)
    return unavailable("tag-absent",fields)
  if truthy(cached) and cachedCommit != remoteCommit and not truthy(field(options,"acceptMovedTag")):
    let old = %*{"tag": tag}
    if cachedCommit != nil: old["commit"] = cachedCommit
    return tagConflict(old,%*{"tag": tag,"commit": remoteCommit},conflictFields)
  if cachedCommit == remoteCommit and hasCache: return pickCached(cached,false)
  var acquired: JsonNode
  try: acquired = ctx.acquire(options)
  except CatchableError:
    return if hasCache: pickCached(cached,true) else: unavailable("remote-unavailable",fields)
  if truthy(field(acquired,"error")): return unavailable("metadata-mismatch",fields)
  if acquired["commit"] != remoteCommit:
    return tagConflict(%*{"tag": tag,"commit": (if cachedCommit == nil: newJNull() else: cachedCommit)},
      %*{"tag": tag,"commit": remoteCommit},conflictFields)
  # The shared cache format intentionally remains compatible with TypeScript.
  bindings[key] = %*{"repo": options["repo"],"tag": tag,"commit": acquired["commit"],
    "dir": acquired["dir"],"packageDir": options["packageDir"],
    "verifiedAt": now().utc.format("yyyy-MM-dd'T'HH:mm:ss'.'fff'Z'")}
  ctx.writeBindings(bindings)
  %*{"status": "bound","dir": acquired["dir"],"commit": acquired["commit"],"tag": tag,"offline": false}

proc boundProvenance*(snapshot, options: JsonNode): JsonNode =
  result = %*{"source": "release-docs","package": options["packageName"],"requestedVersion": options["version"],
    "servedVersion": options["version"],"repo": (if field(snapshot,"repo") == nil: newJNull() else: snapshot["repo"]),
    "match": (if truthy(field(options,"shared")): "verified-compatible" else: "exact"),
    "offline": field(snapshot,"offline") == %true}
  for key in ["tag","commit"]:
    let value = field(snapshot,key)
    if value != nil: result[key] = value
