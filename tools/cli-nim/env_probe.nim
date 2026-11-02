## Test-only environment expansion driver, excluded from the native tarball.
import std/[json, os]
import ../../packages/cli/nim/[typecheck_envs, strictjson, jsonutil, json_wire, workspace_glob]
import ../../packages/cli/nim/route_config
for line in stdin.lines:
  try:
    let request = parseStrictJson(line)
    let dir = text(request["dir"])
    var value: JsonNode
    case text(request["operation"])
    of "load": value = loadEnvManifest(dir)
    of "routing": value = loadRoutingConfig(dir,field(request,"allowMissingSources") == %true)
    of "expand":
      let loaded = loadEnvManifest(dir)
      if loaded == nil: value = newJNull()
      else:
        let programs = expandEnvPrograms(dir,loaded,text(request["ambientRoot"]))
        value = %*{"programs": programs,"written": readFile(text(programs[0]["configPath"]))}
    of "glob": value = %filesystemGlob(dir,@[text(request["pattern"])],@[])
    else: raise newException(ValueError,"Unknown operation")
    echo wireJson(%*{"ok": true,"value": (if value == nil: newJNull() else: value)})
  except CatchableError as error:
    echo wireJson(%*{"ok": false,"message": error.msg})
