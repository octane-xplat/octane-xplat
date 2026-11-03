## Project-installed lint engine; native argv, output and process ownership.
import std/[os, json, strutils, strtabs, options, asyncdispatch]
import ./managed_process, ./jsonutil

proc lintHelpRequested*(args: seq[string]): bool =
  for arg in args:
    if arg == "--": return false
    if arg in ["--help","-h"]: return true
    if arg.startsWith("-") and arg != "--fix": return false

proc lintEntry(project: string): string =
  var current = absolutePath(project)
  while true:
    let package = current / "node_modules/@octane-xplat/lint"
    if dirExists(package) or symlinkExists(package):
      let root = expandFilename(package)
      let manifest = readJson(root / "package.json")
      let entry = text(field(field(manifest,"exports"),"./bin"))
      if field(manifest,"name") == %"@octane-xplat/lint" and entry.startsWith("./"):
        let file = normalizedPath(root / entry)
        if file.startsWith(root & $DirSep) and fileExists(file):
          let canonical = expandFilename(file)
          if canonical.startsWith(root & $DirSep): return canonical
      raise newException(ValueError,"The project's @octane-xplat/lint does not provide a valid ./bin entry. Reinstall or update it with your project package manager.")
    let parent = parentDir(current)
    if parent == "" or parent == current: break
    current = parent
  raise newException(ValueError,"Install @octane-xplat/lint in the project (for example: bun add --dev @octane-xplat/lint).")

proc runLint*(project: string, args: seq[string]): Future[int] {.async.} =
  installProcessSignalHandlers()
  let runner = lintEntry(project)
  let manager = newProcessManager()
  # Project tools must not be supplied by global module paths or preloads.
  let environment = newStringTable({"NODE_PATH": "","NODE_OPTIONS": ""},modeCaseSensitive)
  try:
    let child = manager.spawnManaged("node",@[runner] & args,cwd=project,env=environment,
      onData=proc(stream, bytes: string) =
        if stream == "stdout": stdout.write(bytes); stdout.flushFile()
        else: stderr.write(bytes); stderr.flushFile())
    let status = await child.exit
    if interruptedSignal() != 0: return 128+interruptedSignal()
    if status.errorCode == "ENOENT":
      raise newException(ValueError,"Node >=22.22.2 is required for lint. Install Node and retry.")
    if status.error != "": raise newException(ValueError,status.error)
    if status.signal.isSome: raise newException(ValueError,"lint stopped by " & status.signal.get())
    return status.exitStatus()
  finally: await manager.close()
