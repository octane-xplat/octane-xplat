## Native typecheck orchestration; compiler execution stays in the project toolchain.
import std/[os, json, asyncdispatch]
import ./route_operation, ./build_worker, ./typecheck_envs, ./managed_process
import ./package_manager, ./jsonutil, ./js_text

proc generateTypecheckRoutes*(project: string, signal: ProcessCancel = nil): Future[void] {.async.} =
  discard await generateNativeRoutes(project,bake=false,signal=signal,
    onWarn=proc(message: string) = stderr.writeLine(utf8ForWrite(message)))

proc ambientRoot(project: string, loaded: JsonNode): string =
  # Native/macOS globals are the same inert declaration assets shipped by the
  # reference. Optional renderer source globals remain optional, as in npm installs.
  var required: seq[string]
  let environments = field(field(loaded,"manifest"),"environments")
  for env in ["native", "macos"]:
    if field(environments,env) != nil: required.add(env & ".d.ts")
  if required.len == 0 and field(environments,"gtk") == nil: return ""
  result = projectBuildRoot(project) / "dist"
  for file in required:
    if not fileExists(result / "typecheck-globals" / file):
      raise newException(ValueError,"Update the project's @octane-xplat/cli; required typecheck declarations are missing: " & file)

proc requireProjectChecker(project: string) =
  var current = absolutePath(project)
  while true:
    if fileExists(current / "node_modules" / ".bin" / "tsrx-tsc"): return
    let parent = parentDir(current)
    if parent.len == 0 or parent == current: break
    current = parent
  raise newException(ValueError,"Install the project's TSRX checker before typechecking (for example: bun add --dev @tsrx/typescript-plugin typescript).")

proc runTypecheck*(project: string): Future[int] {.async.} =
  installProcessSignalHandlers()
  await generateTypecheckRoutes(project)
  var configs: seq[string]
  if fileExists(project / "tsconfig.json"): configs.add("tsconfig.json")
  let loaded = loadEnvManifest(project)
  if loaded != nil:
    let programs = expandEnvPrograms(project,loaded,ambientRoot(project,loaded))
    for program in programs: configs.add(text(program["configPath"]))
  elif fileExists(project / "tsconfig.native.json"): configs.add("tsconfig.native.json")
  if configs.len > 0: requireProjectChecker(project)
  let manager = newProcessManager()
  try:
    for config in configs:
      let command = packageManagerExec(project,@["tsrx-tsc", "--noEmit", "-p", config])
      var args: seq[string]
      for value in command["args"]: args.add(value.getStr())
      # Preserve every diagnostic byte and stream, adding a prefix at line starts
      # without buffering an unbounded line or decoding partial UTF-8 chunks.
      var stdoutStart = true
      var stderrStart = true
      proc writeTagged(stream, bytes: string) =
        var atStart = if stream == "stdout": stdoutStart else: stderrStart
        var encoded: string
        for ch in bytes:
          if atStart: encoded.add("[tsc] "); atStart = false
          encoded.add(ch)
          if ch == '\n': atStart = true
        if stream == "stdout": stdout.write(encoded); stdout.flushFile(); stdoutStart = atStart
        else: stderr.write(encoded); stderr.flushFile(); stderrStart = atStart
      let child = manager.spawnManaged(text(command["cmd"]),args,cwd=project,onData=writeTagged)
      let status = await child.exit
      if not stdoutStart: stdout.writeLine("")
      if not stderrStart: stderr.writeLine("")
      if interruptedSignal() != 0: return 128+interruptedSignal()
      if status.error.len > 0: raise newException(ValueError,status.error)
      if status.exitStatus() != 0:
        stderr.writeLine("Typecheck failed (compiler exit " & $status.exitStatus() & ")")
        return 1
    stdout.writeLine("Typecheck clean")
    return 0
  finally: await manager.close()
