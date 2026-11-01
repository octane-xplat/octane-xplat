import std/[json, os]
import ../../packages/cli/nim/[package_manager, core, workspace_glob, jsonc, strictjson, json_wire]
for line in stdin.lines:
  let r = parseStrictJson(line)
  try:
    var value: JsonNode
    let dir = if r.hasKey("dir"): r["dir"].getStr() else: getCurrentDir()
    let manager = r.getOrDefault("manager")
    case r["operation"].getStr()
    of "workspace": value = readProjectWorkspace(dir,manager)
    of "members": value = %workspaceMembers(dir,manager)
    of "root": value = %packageManagerRoot(dir)
    of "manager": value = %packageManagerFor(dir,manager)
    of "exec":
      var args: seq[string]
      for arg in r["args"]: args.add(arg.getStr())
      value = packageManagerExec(dir,args)
    of "bun": value = readBunLock(dir)
    of "versions": value = bunLockedVersions(dir)
    of "binding": value = binding(r["root"].getStr(),dir)
    of "installed": value = installedPackageRoot(dir,r["name"].getStr())
    of "glob":
      var included, excluded: seq[string]
      for pattern in r["patterns"]: included.add(pattern.getStr())
      for pattern in r["excluded"]: excluded.add(pattern.getStr())
      value = %workspaceGlob(dir,included,excluded)
    of "jsonc": value = parseJsonc(r["source"].getStr())
    else: raise newException(ValueError,"Unknown operation")
    echo wireJson(%*{"ok": true,"value": (if value == nil: newJNull() else: value)})
  except CatchableError as error: echo wireJson(%*{"ok": false,"message": error.msg})
