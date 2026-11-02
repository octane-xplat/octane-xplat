import ../../packages/cli/nim/core
import ../../packages/cli/nim/[docs_binding, code_scope]
import ../../packages/cli/nim/json_wire
import ../../packages/cli/nim/native_http
import std/[json, os, strutils, asyncdispatch, osproc]
when defined(posix): import std/posix

when defined(posix):
  var childPid: Pid
  proc forward(sig: cint) {.noconv.} =
    if childPid > 0: discard kill(childPid, sig)

const catalogText = staticRead("catalog.json")
let args = commandLineParams()
let cmd = if args.len == 0: "catalog" else: args[0]
try:
  case cmd
  of "catalog", "--help", "schema":
    let data = parseJson(catalogText)
    if cmd == "--help": stdout.write(text(data["help"]))
    elif cmd == "schema":
      if args.len < 2 or not data["schemas"].hasKey(args[1]):
        stderr.writeLine("Unknown command"); quit(2)
      echo wireJson(data["schemas"][args[1]])
    else: echo wireJson(data["catalog"])
  of "discover": echo wireJson(discover(absolutePath(args[1])))
  of "platforms": echo wireJson(platforms(absolutePath(args[1])))
  of "binding": echo wireJson(binding(absolutePath(args[1]), absolutePath(args[2])))
  of "identity": echo wireJson(resolveInstallations(absolutePath(args[1])))
  of "files": echo wireJson(listCorpusFiles(absolutePath(args[1]), limit = parseInt(args[2])))
  of "repo-roots": echo wireJson(frameworkRepoRoots(absolutePath(args[1])))
  of "http":
    try:
      let client = newHttpClient()
      defer: client.close()
      let settings = newHttpOptions()
      settings.timeoutMs = 10000
      let response = waitFor client.fetch(args[1],settings)
      echo wireJson(%*{"status": response.status, "body": waitFor response.readText()})
    except CatchableError:
      stderr.writeLine("HTTP request failed"); quit(5)
  of "child":
    try:
      let p = startProcess(args[1], args = args[2..^1], options = {poParentStreams})
      when defined(posix):
        childPid = Pid(p.processID)
        signal(SIGTERM, forward)
        signal(SIGINT, forward)
      let code = p.waitForExit()
      p.close()
      quit(code)
    except CatchableError:
      stderr.writeLine("Child launch failed"); quit(5)
  else: stderr.writeLine("Unknown prototype command"); quit(2)
except CatchableError:
  stderr.writeLine("Probe failed"); quit(5)
