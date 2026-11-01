include "../../packages/cli/nim/core"

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
      echo data["schemas"][args[1]]
    else: echo data["catalog"]
  of "discover": echo discover(absolutePath(args[1]))
  of "platforms": echo platforms(absolutePath(args[1]))
  of "binding": echo binding(absolutePath(args[1]), absolutePath(args[2]))
  of "http":
    try:
      let client = newHttpClient(timeout = 10000)
      defer: client.close()
      let response = client.request(args[1])
      echo %*{"status": int(response.code), "body": response.body}
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
