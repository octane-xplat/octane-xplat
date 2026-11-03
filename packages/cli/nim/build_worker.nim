## Selected-project Node operations, owned and bounded by the native process manager.
import std/[os, json, strutils, strtabs, asyncdispatch, monotimes, times]
when defined(macosx): import ./private_temp_macos
elif defined(linux): import ./private_temp_linux
elif defined(windows): import ./private_windows
when defined(windows): import std/options
import ./managed_process, ./jsonutil, ./strictjson, ./js_json, ./js_text, ./pathutil
import ./digests, ./route_metadata
import ./contract_failure

const workerProtocol = "octane-build-worker"
proc privateWorkerDirectory(): string =
  when defined(macosx) or defined(linux):
    # createTempDir follows the caller's umask. mkdtemp creates 0700 atomically,
    # before any project source, request data or result can enter the directory.
    createPrivateTempDirectory(getTempDir() / "xplat-worker-")
  elif defined(windows): windowsPrivateTempDirectory(getTempDir(),"xplat-worker-")
  else:
    raise contractFailure("unavailable","Private project-worker storage is not implemented on this host.")

proc projectBuildRoot*(project: string, packageName = "@octane-xplat/build"): string =
  if packageName notin ["@octane-xplat/build","@octane-xplat/macos-build"]:
    raise newException(ValueError,"Unsupported project worker package")
  var current = absolutePath(project)
  while true:
    let package = current / "node_modules" / packageName
    let manifest = readJson(package / "package.json")
    if text(field(manifest,"name")) == packageName:
      return expandFilename(package)
    let parent = parentOrSelf(current)
    if parent == current: break
    current = parent
  raise contractFailure("prerequisite_missing","Install " & packageName & " in the selected project (for example: bun add --dev " & packageName & ").")

proc projectWorker*(project: string, packageName = "@octane-xplat/build", entryKey = "./worker"): string =
  let root = projectBuildRoot(project,packageName)
  let entry = text(field(field(readJson(root / "package.json"),"exports"),entryKey))
  if entry.startsWith("./"):
    let file = normalizedPath(root / entry)
    if file.startsWith(root & $DirSep) and fileExists(file): return file
  raise contractFailure("prerequisite_missing","The project's " & packageName & " does not provide " &
    (if entryKey == "./worker": "build worker v1" else: "development worker v1") & ". Update it with your project package manager.")

proc runBuildWorker*(project, operation: string, payload: JsonNode,
    timeoutMs = 60000, signal: ProcessCancel = nil, environment: StringTableRef = nil,
    onDiagnostic: proc(bytes: string) {.closure.} = nil,
    onWarning: proc(message: string) {.closure.} = nil,
    packageName = "@octane-xplat/build",
    onOutput: proc(stream, bytes: string) {.closure.} = nil,
    workerSource = ""): Future[JsonNode] {.async.} =
  if timeoutMs <= 0: raise newException(ValueError,"Worker timeout must be positive")
  if signal != nil and signal.cancelled: raise contractFailure("cancelled","Build operation cancelled")
  let root = absolutePath(project)
  var worker = if workerSource.len == 0: projectWorker(root,packageName) else: ""
  let temporary = privateWorkerDirectory()
  let manager = newProcessManager()
  let cancellation = newProcessCancel()
  let started = getMonoTime()
  let id = $getCurrentProcessId() & "-" & $started.ticks
  try:
    if workerSource.len > 0:
      worker = temporary / "operation.mjs"
      when defined(windows): discard windowsPublishPrivate(worker,workerSource)
      else: writeFile(worker,workerSource)
    let request = newJObject()
    if payload != nil and payload.kind == JObject:
      for key,value in payload: request[key] = value
    request["protocol"] = %workerProtocol
    request["version"] = %1
    request["id"] = %id
    request["operation"] = %operation
    request["project"] = %root
    let encoded = jsStringify(request)
    if encoded.len > 64*1024*1024: raise newException(ValueError,"Build worker request exceeds 64 MiB")
    let input = temporary / "request.json"
    let output = temporary / "result.json"
    when defined(windows):
      # Node writes in place. Precreation preserves the explicit user owner/DACL,
      # independently of its token-default owner for newly created files.
      discard windowsPublishPrivate(input,encoded)
      discard windowsPublishPrivate(output,"")
    else: writeFile(input,encoded)
    var diagnostics: string
    let workerEnvironment = newStringTable(modeCaseSensitive)
    if environment != nil:
      for key,value in environment: workerEnvironment[key] = value
    # Do not let a global module path or preload silently supply project tools.
    workerEnvironment["NODE_PATH"] = ""
    workerEnvironment["NODE_OPTIONS"] = ""
    let child = manager.spawnManaged("node",@[worker,input,output],cwd=root,env=workerEnvironment,signal=cancellation,graceMs=500,
      onData=proc(stream, bytes: string) =
        if onOutput != nil: onOutput(stream,bytes)
        if onDiagnostic != nil: onDiagnostic(bytes)
        if diagnostics.len < 65536: diagnostics.add(bytes[0..<min(bytes.len,65536-diagnostics.len)]))
    var timedOut = false
    while not child.exit.finished:
      if (signal != nil and signal.cancelled) or interruptedSignal() != 0: cancellation.cancel()
      if (getMonoTime()-started).inMilliseconds >= timeoutMs:
        timedOut = true
        cancellation.cancel()
      await sleepAsync(5)
    let status = await child.exit
    if timedOut: raise contractFailure("timeout","Project build worker timed out")
    if cancellation.cancelled: raise contractFailure("cancelled","Build operation cancelled")
    if status.errorCode == "ENOENT": raise contractFailure("prerequisite_missing","Node >=22.22.2 is required for project build operations; install Node and retry.")
    var responseBytes: string
    when defined(windows):
      let saved = windowsReadPrivate(output,64*1024*1024)
      if saved.isSome: responseBytes = saved.get()
    else:
      if fileExists(output):
        if getFileSize(output) > 64*1024*1024: raise newException(ValueError,"Build worker result exceeds 64 MiB")
        responseBytes = readFile(output)
    if responseBytes.len == 0:
      raise newException(ValueError,"Project build worker exited " & $status.exitStatus() & " without a result" & (if diagnostics.len > 0: ": " & decodeUtf8(diagnostics).strip() else: ""))
    let response = parseStrictJson(decodeUtf8(responseBytes))
    if text(field(response,"protocol")) != workerProtocol or field(response,"version") != %1 or text(field(response,"id")) != id or
        field(response,"ok") == nil or response["ok"].kind != JBool:
      raise newException(ValueError,"Unsupported or mismatched project build worker response")
    let warnings = field(response,"warnings")
    if warnings != nil:
      if warnings.kind != JArray: raise newException(ValueError,"Invalid worker warnings")
      for warning in warnings:
        if warning.kind != JString: raise newException(ValueError,"Invalid worker warning")
        if onWarning != nil: onWarning(warning.getStr())
    if not response["ok"].getBool():
      let message = text(field(field(response,"error"),"message"))
      let file = text(field(field(response,"error"),"file"))
      if message == "Unsupported build operation: " & operation:
        raise contractFailure("prerequisite_missing","The project's build worker does not support " & operation &
          ". Update " & packageName & " in the selected project with your package manager and retry.")
      let code = text(field(field(response,"error"),"code"))
      raise contractFailure((if code in ["prerequisite_missing","unavailable"]: code else: "execution_failure"),
        (if file.len > 0 and file notin message: file & ": " else: "") &
        (if message.len > 0: message else: "Project build operation failed"))
    if status.exitStatus() != 0: raise newException(ValueError,"Project build worker failed after writing its result")
    if field(response,"data") == nil: raise newException(ValueError,"Project build worker omitted result data")
    return response["data"]
  finally:
    await manager.close()
    removeDir(temporary)

proc analyzeRouteSources*(project: string, files: JsonNode, timeoutMs = 60000,
    signal: ProcessCancel = nil): Future[JsonNode] {.async.} =
  result = newJObject()
  if files.len == 0: return
  let data = await runBuildWorker(project,"route-analyze",%*{"files": files},timeoutMs,signal)
  if data.kind != JArray or data.len != files.len: raise newException(ValueError,"Project worker returned an incomplete route analysis")
  var expected = newJObject()
  for entry in files: expected[entry["file"].getStr()] = %sha256Hex(utf8ForWrite(entry["source"].getStr()))
  for entry in data:
    let file = text(field(entry,"file"))
    if field(expected,file) == nil or field(result,file) != nil or field(entry,"sha256") != expected[file]:
      raise newException(ValueError,"Project worker returned a mismatched route snapshot")
    discard routeMetadata(field(entry,"metadata"))
    result[file] = entry
