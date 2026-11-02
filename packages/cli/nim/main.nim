## Parallel native entry. Never falls back to the TypeScript CLI.
import ./core, ./args, ./workspace, ./strictjson, ./json_wire, ./js_text, ./process_exit
import std/[sysrand, terminal, json, os, strutils]

const metadata = staticRead("metadata.json")
let data = parseJson(metadata)
let argv = block:
  var decoded: seq[string]
  for arg in commandLineParams(): decoded.add(decodeUtf8(arg))
  decoded
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
  echo wireJson(envelope,pretty=true)
proc humanError(command: string, error: JsonNode) =
  var message = "xplat " & command & ": " & text(error["code"]) & ": " & text(error["message"])
  let action = text(field(field(error, "recovery"), "action"))
  if action != "": message.add("\n  → " & action)
  stderr.writeLine(utf8ForWrite(message))
proc failure(command, code, message: string, status: int) =
  if "--json" in argv:
    emit(%*{"contractVersion": 1, "ok": false, "context": {"command": command, "projectId": newJNull()}, "error": {"code": code, "message": message}})
  else: stderr.writeLine(message)
  exitProcess(status)
proc errorExit(code: string): int =
  case code
  of "invalid_selection", "ambiguous_selection", "not_found": 2
  of "prerequisite_missing", "unavailable", "unsupported_capability", "target_busy": 3
  of "permission_denied": 4
  of "disconnected_runtime": 6
  of "timeout": 7
  of "cancelled": 8
  else: 5

if argv.len == 0 or argv == @["--help"] or argv == @["-h"]:
  echo "xplat — experimental Nim CLI"
  echo "Native commands: catalog, clean, permissions, app select, code search, code read, guidance, docs read; all agent commands expose --help and --schema."
  echo "Other command execution is pending. Install @octane-xplat/cli@latest for the TypeScript CLI."
  quit(0)
if argv == @["--version"]:
  echo text(data["version"])
  quit(0)
var name = argv[0]
var count = 1
var members: seq[string]
for candidate, spec in data["commands"]:
  if candidate.startsWith(name & " "): members.add(candidate)
if members.len > 0:
  if argv.len == 1 or argv[1] in ["--help", "-h"]:
    if "--json" in argv:
      emit(%*{"contractVersion": 1, "ok": false, "context": {"command": name, "projectId": newJNull()}, "error": {"code": "invalid_selection", "message": "`xplat " & name & "` needs a subcommand.", "recovery": {"action": "Commands: " & members.join(", ") & "."}}})
      quit(2)
    echo "xplat " & name & " — command group\n\nCommands:"
    for member in members:
      echo "  " & member.alignLeft(16) & " " & text(data["commands"][member]["descriptor"]["summary"])
    echo "\nRun `xplat " & name & " <command> --help` or `--schema` for a command's contract."
    quit(0)
  if argv[1] == "--schema":
    var schemas = newJArray()
    for member in members: schemas.add(data["commands"][member]["schema"]["data"])
    emit(%*{"contractVersion": 1, "ok": true, "context": {"command": name, "projectId": newJNull()}, "data": {"commands": schemas}})
    quit(0)
  name.add(" " & argv[1]); count = 2
if data["commands"].hasKey(name):
  let cmd = data["commands"][name]
  if "--schema" in argv:
    emit(cmd["schema"]); quit(0)
  let parsed = parseArgs(cmd["descriptor"], argv[count..^1])
  if parsed.hasKey("errors"):
    let error = parsed["errors"][0]
    if "--json" in argv:
      emit(%*{"contractVersion": 1, "ok": false, "context": {"command": name, "projectId": newJNull()}, "error": error})
    else: humanError(name, error)
    quit(2)
  if parsed["help"].getBool():
    stdout.write(text(cmd["help"])); quit(0)
  if name == "catalog":
    if "--json" in argv: emit(data["catalog"])
    else: echo "Native commands: catalog, clean, permissions, app select, code search, code read, guidance, docs read. Other command execution is pending; use --json for contracts and coverage."
    quit(0)
  let reply = workspaceCommand(name, parsed["values"])
  if reply != nil:
    if truthy(field(parsed["values"],"json")): emit(reply)
    elif reply["ok"].getBool(): echo utf8ForWrite(workspaceHuman(name, reply["data"]))
    else: humanError(name, reply["error"])
    if reply["ok"].getBool(): quit(0)
    let code = text(reply["error"]["code"])
    quit(errorExit(code))
  failure(name, "unavailable", "Command execution is not yet ported to Nim: " & name, 3)
if name == "clean":
  if argv.len > 1:
    if argv == @["clean", "--help"]:
      echo "xplat clean — Remove generated builds and caches; preserve authored native sources"
      quit(0)
    failure(name, "invalid_selection", "clean takes no arguments", 2)
  let root = getCurrentDir()
  # Match strict JSON.parse before any deletion; invalid manifests must not clean.
  var manifest = newJObject()
  if fileExists(root / "package.json"):
    try: manifest = parseStrictJson(decodeUtf8(readFile(root / "package.json")))
    except CatchableError:
      failure(name, "execution_failure", "Cannot read package.json: invalid JSON", 5)
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
if "--json" in argv:
  emit(%*{"contractVersion": 1, "ok": false, "context": {"command": name, "projectId": newJNull()}, "error": {"code": "invalid_selection", "message": "Unknown command `xplat " & name & "`.", "recovery": {"action": "Run `xplat catalog --json` for the machine-readable command list, or `xplat " & argv[0] & " --help`."}}})
else: stderr.writeLine("Unknown command `xplat " & name & "`.")
quit(2)
