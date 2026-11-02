## Foreground build command sharing the managed project engine with build jobs.
import std/[json, os, strutils, terminal, asyncdispatch]
import ./core, ./strictjson, ./js_text, ./runtime_build, ./runtime_logs, ./managed_process

proc runBuild*(project: string, values: JsonNode): Future[int] {.async.} =
  installProcessSignalHandlers()
  if fileExists(project / "package.json"):
    discard parseStrictJson(decodeUtf8(readFile(project / "package.json")))
  let declared = platforms(project)
  var available: seq[string]
  for platform in declared:
    if text(platform) != "windows": available.add(text(platform))
  var chosen: seq[string]
  let requested = field(values,"targets")
  if requested != nil:
    var kinds: seq[string]
    var invalid: seq[string]
    for part in text(requested).split(','):
      let kind = part.strip()
      kinds.add(kind)
      if kind notin available:
        let label = if kind.len == 0: "<empty>" else: kind
        if label notin invalid: invalid.add(label)
    if invalid.len > 0:
      stderr.writeLine("Unavailable build target(s): " & invalid.join(", ") & ". Available: " &
        (if available.len > 0: available.join(", ") else: "(none)"))
      return 1
    for kind in available:
      if kind in kinds: chosen.add(kind)
  elif available.len == 0:
    stderr.writeLine("Nothing to build — no web, NativeScript, macOS or Linux target is declared.")
    return 1
  elif stdout.isatty:
    stdout.write("Build targets (comma list; Enter selects " & available.join(",") & "): ")
    stdout.flushFile()
    var answer: string
    if not stdin.readLine(answer): return 0
    answer = answer.strip()
    if answer.len == 0: chosen = available
    else:
      var kinds: seq[string]
      for part in answer.split(','):
        let kind = part.strip()
        if kind notin available:
          stderr.writeLine("Unavailable build target: " & kind)
          return 1
        kinds.add(kind)
      for kind in available:
        if kind in kinds: chosen.add(kind)
  else: chosen = available
  # Validate every engine before route generation or compiler output publication.
  for platform in chosen:
    if platform != "web":
      stderr.writeLine("Native " & platform & " build engine integration is pending.")
      return 1
  let logs = newRuntimeLogs()
  let signal = newProcessCancel()
  var outputError: string
  let watcher = logs.watchLogs(proc(record: JsonNode) =
    if outputError.len > 0: return
    try:
      let line = utf8ForWrite(text(record["line"]))
      if record["stream"] == %"stdout": stdout.writeLine(line); stdout.flushFile()
      else: stderr.writeLine(line); stderr.flushFile()
    except CatchableError as error:
      # A failed foreground sink is an ownership event, not a passive observer.
      outputError = error.msg
      signal.cancel())
  try:
    for platform in chosen:
      discard await runProjectBuild(%*{"id": ".","root": project},platform,logs,signal)
  finally: logs.unwatchLogs(watcher)
  if interruptedSignal() != 0: return 128+interruptedSignal()
  stdout.writeLine("Build complete")
  return 0
