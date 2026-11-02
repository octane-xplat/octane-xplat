## Read-only runtime inventory. Session ownership/busy state belongs to its caller.
import std/[asyncdispatch, json, options, strutils, strtabs]
import ./jsonutil, ./strictjson, ./prerequisites, ./command_probe, ./managed_process
from ./args import jsTrim

when defined(macosx):
  const currentHost* = "darwin"
elif defined(windows):
  const currentHost* = "win32"
elif defined(linux):
  const currentHost* = "linux"
else:
  const currentHost* = hostOS

proc hostBlock*(platform: string, host = currentHost): Option[string] =
  let required = case platform
    of "web", "android": ""
    of "ios", "macos": "darwin"
    of "linux": "linux"
    of "windows": "win32"
    else: raise newException(ValueError,"Unknown target platform: " & platform)
  if required == "" or required == host: return none(string)
  proc label(value: string): string =
    case value
    of "darwin": "macOS"
    of "win32": "Windows"
    of "linux": "Linux"
    else: value
  some("requires a " & label(required) & " host (this server runs on " & label(host) & ")")

proc missing(reason: string): JsonNode = %*{"targets": [],"reason": reason}

proc nativeTargetReport*(app, sessions, selected: JsonNode): JsonNode =
  let wanted = if truthy(selected): %*[selected] else: app["platforms"]
  var platforms = newJArray()
  for platform in wanted:
    var declared = false
    for candidate in app["platforms"]:
      if candidate == platform: declared = true
    var row = %*{"platform": platform,"declared": declared,"targets": []}
    let blocked = hostBlock(text(platform))
    if not declared:
      row["reason"] = %("App \"" & text(app["id"]) & "\" does not declare this platform.")
    elif blocked.isSome: row["reason"] = %blocked.get()
    elif platform == %"macos":
      var target = %*{"targetId": "macos","name": "macOS AppKit/WKWebView dev host","kind": "host","availability": "available","busy": false}
      for session in sessions:
        if session["appId"] == app["id"] and session["platform"] == platform and
            session["targetId"] == %"macos" and text(session["state"]) notin ["stopped","failed"]:
          target["busy"] = %true
          target["session"] = %*{"sessionId": session["sessionId"],"ownership": session["ownership"],"state": session["state"]}
          break
      row["targets"].add(target)
    else: row["reason"] = %"Native launch/target composition for this platform is pending."
    platforms.add(row)
  %*{"app": app["id"],"platforms": platforms}

proc iosTargets*(output: Option[string]): JsonNode =
  if output.isNone or output.get().len == 0:
    return missing("xcrun simctl unavailable — install Xcode and the iOS simulator runtime")
  try:
    let doc = parseStrictJson(output.get())
    if doc.kind != JObject: raise newException(ValueError,"Expected a simctl object")
    let devices = field(doc,"devices")
    if devices == nil or devices.kind == JNull: return %*{"targets": []}
    if devices.kind != JObject: raise newException(ValueError,"Expected simulator groups")
    var booted, stopped: seq[JsonNode]
    for runtime in jsObjectKeys(devices):
      let list = devices[runtime]
      if list.kind != JArray: raise newException(ValueError,"Expected a simulator list")
      var version = ""
      for marker in ["iOS-", "iOS "]:
        let start = runtime.find(marker)
        if start < 0: continue
        var at = start+marker.len
        while at < runtime.len and runtime[at] in {'0'..'9','-'}:
          version.add(if runtime[at] == '-': '.' else: runtime[at])
          inc at
        break
      for device in list:
        if device.kind != JObject: raise newException(ValueError,"Expected a simulator object")
        let available = field(device,"isAvailable")
        if available == nil or available.kind == JNull: continue
        if available.kind != JBool: raise newException(ValueError,"Expected simulator availability")
        if not available.getBool(): continue
        let id = field(device,"udid")
        let name = field(device,"name")
        if id == nil or id.kind != JString or id.getStr().len == 0 or
            name == nil or name.kind != JString or name.getStr().len == 0:
          raise newException(ValueError,"Available simulator has no identity")
        let running = field(device,"state") == %"Booted"
        let target = %*{"targetId": id,"name": name.getStr() &
            (if version == "": "" else: " iOS " & version) & (if running: " (booted)" else: ""),
          "kind": "simulator","booted": running,"availability": "available"}
        if running: booted.add(target) else: stopped.add(target)
    result = %*{"targets": booted & stopped}
  except CatchableError:
    result = missing("xcrun simctl output could not be parsed")

proc androidTargets*(output: Option[string]): JsonNode =
  if output.isNone or output.get().len == 0:
    return missing("adb unavailable — install Android platform-tools (adb on PATH)")
  var targets = newJArray()
  let lines = output.get().split('\n')
  for index in 1..<lines.len:
    let line = jsTrim(lines[index])
    if not line.endsWith("\tdevice"): continue
    let serial = line.split('\t')[0]
    if serial.len == 0: continue # An empty serial cannot identify a usable target.
    let emulator = serial.startsWith("emulator-")
    targets.add(%*{"targetId": serial,"name": serial & (if emulator: " (emulator)" else: " (device)"),
      "kind": (if emulator: "emulator" else: "device"),"availability": "available"})
  %*{"targets": targets}

proc discoverMobileTargets*(platform: string, query: ToolProbe): Future[JsonNode] {.async.} =
  case platform
  of "ios": return iosTargets(await query("xcrun",@["simctl","list","devices","available","-j"]))
  of "android": return androidTargets(await query("adb",@["devices"]))
  else: raise newException(ValueError,"Expected ios or android target inventory")

proc discoverHostMobileTargets*(platform, cwd: string, environment: StringTableRef = nil,
    signal: ProcessCancel = nil): Future[JsonNode] =
  let query: ToolProbe = proc(command: string, args: seq[string]): Future[Option[string]] =
    probeCommand(command,args,cwd=cwd,environment=environment,signal=signal)
  discoverMobileTargets(platform,query)
