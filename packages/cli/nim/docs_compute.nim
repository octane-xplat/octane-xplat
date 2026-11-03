## Owned same-executable compute boundary. CPU/SQLite/model work stays outside hosts.
import std/[os, json, asyncdispatch, options, strutils, monotimes, times]
import ./host_storage, ./host_bootstrap, ./native_identity, ./strictjson, ./json_wire, ./jsonutil
import ./managed_process, ./contract_failure, ./docs_index, ./minilm_model, ./inference_assets

const protocol = "octane-native-docs"
const maxRequestBytes = 32*1024*1024
const maxResponseBytes = 8*1024*1024

type ComputeObserver* = proc(pid: int) {.closure.}

proc nativeDocsComputeChild*(operationDirectory: string): Future[void] {.async.} =
  if not existingPrivateHostDirectory(operationDirectory): raise newException(ValueError,"Missing private compute directory")
  let bytes = readHostFile(operationDirectory / "request.json",maxRequestBytes)
  if bytes.isNone: raise newException(ValueError,"Missing native compute request")
  let request = parseStrictJson(bytes.get())
  let id = extractFilename(operationDirectory)
  if field(request,"protocol") != %protocol or field(request,"version") != %1 or field(request,"id") != %id:
    raise newException(ValueError,"Invalid native compute request identity")
  var response = %*{"protocol": protocol,"version": 1,"id": id,"ok": false}
  try:
    let operation = text(field(request,"operation"))
    if operation notin ["index","search"]: raise contractFailure("invalid_selection","Invalid native compute operation")
    let documents = field(request,"documents")
    if documents == nil or documents.kind != JArray or documents.len > 10000:
      raise contractFailure("invalid_selection","Invalid documentation inventory")
    for document in documents:
      for key in ["path","corpus","content"]:
        if field(document,key) == nil or document[key].kind != JString: raise contractFailure("invalid_selection","Invalid documentation record")
    let cache = text(field(request,"cacheDir"))
    let assets = text(field(request,"assetRoot"))
    if not isAbsolute(cache) or not isAbsolute(assets) or '\0' in cache or '\0' in assets:
      raise contractFailure("invalid_selection","Compute caches must be absolute paths without NUL")
    var embedder: DocsEmbedder
    let mode = if field(request,"mode") == nil: "hybrid" else: text(request["mode"])
    if mode notin ["hybrid","lexical"]: raise contractFailure("invalid_selection","Invalid documentation retrieval mode")
    let binding = text(field(request,"binding"))
    if operation == "index":
      var locations = nativeAssetLocations(assets)
      # Empty inventories must not trigger optional downloads. Inventory work
      # remains in this cancellable child, including this initial chunk count.
      if docsInventory(documents,binding)["chunks"].len > 0:
        locations = await prepareNativeAssets(assets,operationDirectory,true)
      embedder = localNativeEmbedder(locations.modelDirectory,locations.libraryPath)
      response["value"] = prepareDocsIndex(documents,binding,cache,embedder)
    else:
      # A lexical/fallback search neither downloads nor loads the runtime. A
      # prepared hybrid index opts into native inference lazily through embed().
      let locations = nativeAssetLocations(assets)
      embedder = localNativeEmbedder(locations.modelDirectory,locations.libraryPath)
      let limit = field(request,"limit")
      if limit != nil and (limit.kind != JInt or limit.getInt() < 1 or limit.getInt() > 50): raise contractFailure("invalid_selection","Invalid search limit")
      let query = field(request,"query")
      if query == nil or query.kind != JString or query.getStr().len == 0 or query.getStr().len > 8192:
        raise contractFailure("invalid_selection","Invalid documentation search query")
      response["value"] = searchDocsIndex(documents,binding,cache,text(query),embedder,
        (if limit == nil: 10 else: limit.getInt()),mode)
    response["ok"] = %true
  except CatchableError as error: response["error"] = failureData(error)
  let output = wireJson(response)
  if output.len > maxResponseBytes: raise newException(IOError,"Native compute response exceeds its byte limit")
  discard publishHostFile(operationDirectory / "response.json",output)

proc runNativeDocsCompute*(operation: JsonNode, signal: ProcessCancel = nil, timeoutMs = 900000,
    observer: ComputeObserver = nil): Future[JsonNode] {.async.} =
  let root = text(field(operation,"assetRoot"))
  if not isAbsolute(root) or '\0' in root:
    raise contractFailure("invalid_selection","Native asset root must be absolute and contain no NUL")
  privateHostDirectory(root)
  let operations = root / "operations"
  privateHostDirectory(operations)
  let directory = operations / freshId("docs_")
  privateHostDirectory(directory)
  let stamp = getFileInfo(directory,followSymlink=false).id
  let request = operation.copy()
  request["protocol"] = %protocol
  request["version"] = %1
  request["id"] = %extractFilename(directory)
  let bytes = wireJson(request)
  let manager = newProcessManager()
  let cancel = if signal == nil: newProcessCancel() else: signal
  try:
    if bytes.len > maxRequestBytes: raise contractFailure("invalid_selection","Documentation inventory exceeds 32 MiB")
    if cancel.cancelled or interruptedSignal() != 0: raise contractFailure("cancelled","Native docs operation cancelled")
    discard publishHostFile(directory / "request.json",bytes)
    let child = manager.spawnManaged(getAppFilename(),@["--internal-docs-compute",directory],signal=cancel,graceMs=250)
    if observer != nil: observer(child.pid)
    let started = getMonoTime()
    while not child.exit.finished:
      if cancel.cancelled or interruptedSignal() != 0: raise contractFailure("cancelled","Native docs operation cancelled")
      if (getMonoTime()-started).inMilliseconds >= timeoutMs: raise contractFailure("timeout","Native docs operation timed out")
      await sleepAsync(10)
    let status = await child.exit
    if cancel.cancelled or interruptedSignal() != 0: raise contractFailure("cancelled","Native docs operation cancelled")
    if status.exitStatus() != 0: raise contractFailure("execution_failure","Native docs compute process exited (" & $status.exitStatus() & ")")
    let output = readHostFile(directory / "response.json",maxResponseBytes)
    if output.isNone: raise contractFailure("execution_failure","Native docs compute returned no response")
    let response = parseStrictJson(output.get())
    if field(response,"protocol") != %protocol or field(response,"version") != %1 or field(response,"id") != request["id"] or
        field(response,"ok") == nil or response["ok"].kind != JBool:
      raise contractFailure("execution_failure","Invalid native docs compute response")
    if response["ok"] == %false:
      let error = field(response,"error")
      if error == nil or error.kind != JObject: raise contractFailure("execution_failure","Invalid native docs error response")
      raise contractFailure(text(field(error,"code")),text(field(error,"message")),error)
    if field(response,"value") == nil: raise contractFailure("execution_failure","Native compute returned no value")
    return response["value"]
  finally:
    await manager.close()
    if dirExists(directory) and not symlinkExists(directory) and getFileInfo(directory,followSymlink=false).id == stamp:
      removeDir(directory)
