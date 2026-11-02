## Presence observations, not claims that a runtime, SDK target or device is ready.
import std/[asyncdispatch, json, options, strtabs, strutils]
import ./command_probe, ./managed_process
from ./args import jsTrim

type ToolProbe* = proc(command: string, args: seq[string]): Future[Option[string]] {.closure.}

proc checkPrerequisites*(platforms: seq[string], probe: ToolProbe,
    manager = "bun"): Future[JsonNode] {.async.} =
  if manager notin ["bun", "pnpm"]: raise newException(ValueError,"Unsupported project package manager: " & manager)
  result = newJArray()
  for id in ["node", manager, "git", "xcode", "adb", "chromium"]:
    var relevant = true
    var row: JsonNode
    var command = id
    var args = @["--version"]
    var remedy: string
    case id
    of "node":
      row = %*{"id": id,"name": "Node.js"}
      remedy = "Install Node >=22.22.2 for the project's JavaScript build tools."
    of "bun", "pnpm":
      row = %*{"id": id,"name": id}
      remedy = if id == "bun": "Install Bun — runtime sessions spawn the app’s toolchain through `bun run`."
        else: "Install pnpm — project commands use `pnpm exec`."
    of "git":
      row = %*{"id": id,"name": "Git"}
      remedy = "Install Git — version-matched documentation checkouts need it."
    of "xcode":
      relevant = "ios" in platforms or "macos" in platforms
      row = %*{"id": id,"name": "Xcode command line tools","platforms": ["ios", "macos"]}
      command = "xcodebuild"
      args = @["-version"]
      remedy = "Install Xcode and run `xcode-select --install`."
    of "adb":
      relevant = "android" in platforms
      row = %*{"id": id,"name": "Android Debug Bridge","platforms": ["android"]}
      remedy = "Install Android platform-tools (adb on PATH)."
    of "chromium":
      if "web" in platforms:
        result.add(%*{"id": id,"name": "Chromium browser","platforms": ["web"],"status": "unknown",
          "remedy": "Web acceptance checks target Chromium; install it before browser verification runs."})
      continue
    else: discard
    if not relevant: continue
    let observed = await probe(command,args)
    if observed.isSome and observed.get().len > 0:
      row["status"] = %"satisfied"
      row["detail"] = %(if id in ["xcode", "adb"]: observed.get().split('\n')[0] else: jsTrim(observed.get()))
    else:
      row["status"] = %"missing"
      row["remedy"] = %remedy
    result.add(row)

proc checkHostPrerequisites*(platforms: seq[string], cwd: string, manager = "bun",
    environment: StringTableRef = nil, signal: ProcessCancel = nil): Future[JsonNode] =
  let probe: ToolProbe = proc(command: string, args: seq[string]): Future[Option[string]] =
    probeCommand(command,args,cwd=cwd,environment=environment,signal=signal)
  checkPrerequisites(platforms,probe,manager)
