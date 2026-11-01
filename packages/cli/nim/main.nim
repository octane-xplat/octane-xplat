## Parallel native entry. Never falls back to the TypeScript CLI.
include core
import std/[sysrand, terminal]

const metadata = staticRead("metadata.json")
let data = parseJson(metadata)
let argv = commandLineParams()
proc requestId(): string =
  var bytes = urandom(16)
  bytes[6] = (bytes[6] and 15) or 64
  bytes[8] = (bytes[8] and 63) or 128
  result = "req-"
  for i, b in bytes:
    if i in [4, 6, 8, 10]: result.add('-')
    result.add(toHex(b, 2).toLowerAscii())
proc emit(payload: JsonNode) =
  var envelope = payload.copy()
  envelope["requestId"] = %requestId()
  echo envelope.pretty()
proc failure(command, code, message: string, status: int) =
  if "--json" in argv:
    emit(%*{"contractVersion": 1, "ok": false, "context": {"command": command, "projectId": newJNull()}, "error": {"code": code, "message": message}})
  else: stderr.writeLine(message)
  quit(status)

if argv.len == 0 or argv == @["--help"] or argv == @["-h"]:
  echo "xplat — experimental Nim CLI"
  echo "Native commands: catalog, clean; all agent commands expose --help and --schema."
  echo "Other command execution is pending. Install @octane-xplat/cli@latest for the TypeScript CLI."
  quit(0)
if argv == @["--version"]:
  echo text(data["version"])
  quit(0)
var name = argv[0]
var count = 1
if argv.len > 1 and data["commands"].hasKey(name & " " & argv[1]):
  name.add(" " & argv[1]); count = 2
if data["commands"].hasKey(name):
  let cmd = data["commands"][name]
  if "--schema" in argv:
    emit(cmd["schema"]); quit(0)
  if "--help" in argv or "-h" in argv:
    # Help only succeeds for valid supplied options, as in the reference parser.
    if argv.len == count + 1:
      stdout.write(text(cmd["help"])); quit(0)
  if name == "catalog":
    for arg in argv[count..^1]:
      if arg != "--json":
        failure(name, "invalid_selection", "Unexpected catalog argument: " & arg, 2)
    if "--json" in argv: emit(data["catalog"])
    else: echo "Native commands: catalog, clean. Other command execution is pending; use --json for contracts and coverage."
    quit(0)
  failure(name, "unavailable", "Command execution is not yet ported to Nim: " & name, 3)
if name == "clean":
  if argv.len > 1:
    if argv == @["clean", "--help"]:
      echo "xplat clean — Remove generated builds and caches; preserve authored native sources"
      quit(0)
    failure(name, "invalid_selection", "clean takes no arguments", 2)
  let root = getCurrentDir()
  # Match strict JSON.parse before any deletion; invalid manifests must not clean.
  let manifest = if fileExists(root / "package.json"): parseJson(readFile(root / "package.json")) else: newJObject()
  var paths: seq[string]
  for path in ["dist", ".ns-vite-build", "node_modules/.vite", "node_modules/.cache/xplat"]:
    if dirExists(root / path) or fileExists(root / path): paths.add(path)
  if (field(field(manifest, "nativescript"), "platforms") == nil or field(field(manifest, "nativescript"), "platforms").kind == JNull) and dirExists(root / "platforms"):
    for kind, path in walkDir(root / "platforms"):
      if lastPathPart(path) != "macos": paths.add("platforms" / lastPathPart(path))
  if paths.len == 0:
    echo "Nothing to clean"; quit(0)
  if stdout.isatty:
    stdout.write("Remove " & paths.join(", ") & "? [y/N] ")
    if stdin.readLine().toLowerAscii() notin ["y", "yes"]:
      echo "Cancelled"; quit(0)
  for path in paths:
    let target = root / path
    if symlinkExists(target) or not dirExists(target): removeFile(target)
    else: removeDir(target)
  echo "Cleaned " & paths.join(", ")
  quit(0)
failure(name, "invalid_selection", "Unknown command: " & name, 2)
