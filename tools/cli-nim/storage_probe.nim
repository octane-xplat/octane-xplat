## Test-only private-storage and lock operations. No production test API.
import std/[os, json, options, strutils, base64]
import ../../packages/cli/nim/[host_storage, host_bootstrap, strictjson, json_wire, jsonutil]

var held: HostLock
proc run(request: JsonNode): JsonNode =
  let path = text(field(request,"path"))
  case text(request["operation"])
  of "directory":
    privateHostDirectory(path)
    %*{"ok": true,"private": existingPrivateHostDirectory(path)}
  of "existing": %*{"ok": true,"private": existingPrivateHostDirectory(path)}
  of "publish":
    let stamp = publishHostFile(path,decode(text(request["base64"])))
    %*{"ok": true,"device": $stamp.device,"file": $stamp.file}
  of "read":
    let data = readHostFile(path,(if field(request,"maximum") == nil: 16384 else: request["maximum"].getInt()))
    %*{"ok": true,"absent": data.isNone,"base64": (if data.isSome: encode(data.get()) else: "")}
  of "remove":
    removeHostFile(path,(DeviceId(parseBiggestInt(text(request["device"]))),FileId(parseBiggestInt(text(request["file"])))))
    %*{"ok": true}
  of "lock":
    if held != nil: raise newException(ValueError,"Fixture already holds a lock")
    held = tryHostLock(path)
    %*{"ok": true,"acquired": held != nil}
  of "unlock":
    held.closeHostLock()
    held = nil
    %*{"ok": true}
  else: raise newException(ValueError,"Unknown private storage fixture operation")

try:
  var line: string
  while stdin.readLine(line):
    try: echo wireJson(run(parseStrictJson(line)))
    except OSError as error: echo wireJson(%*{"ok": false,"code": error.errorCode,"error": error.msg})
    except CatchableError as error: echo wireJson(%*{"ok": false,"error": error.msg})
    stdout.flushFile()
finally: held.closeHostLock()
