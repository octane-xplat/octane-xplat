## Explicit checksummed optional downloads. Ordinary search never downloads assets.
import std/[os, json, options, asyncdispatch, strutils, monotimes, times]
import ./native_http, ./managed_process, ./host_storage, ./host_bootstrap, ./command_output
import ./strictjson, ./jsonutil, ./json_wire, ./digests, ./native_identity, ./contract_failure, ./js_text

const modelManifest = staticRead("../../../tools/cli-nim/model-assets.json")
const runtimeManifest = staticRead("../../../tools/cli-nim/ort-runtime.json")
type
  AssetUrlResolver* = proc(key, official: string): string {.closure.}
  NativeAssets* = object
    modelDirectory*, libraryPath*: string
  AssetPin = object
    key, path, url, digest: string
    bytes: int

proc nativeAssetRoot*(): string = getHomeDir() / ".cache/octane-xplat/nim-inference"
proc nativeAssetLocations*(root: string): NativeAssets =
  let model = parseStrictJson(modelManifest)
  let runtime = parseStrictJson(runtimeManifest)
  result.modelDirectory = root / "models" / text(model["name"]) / text(model["revision"])
  result.libraryPath = root / "runtime" / (text(runtime["version"]) & "-darwin-arm64") /
    text(runtime["targets"]["darwin-arm64"]["library"])

proc interrupted(signal: ProcessCancel): bool = (signal != nil and signal.cancelled) or interruptedSignal() != 0
proc check(signal: ProcessCancel) =
  if signal.interrupted(): raise contractFailure("cancelled","Native inference preparation cancelled")
proc validAsset(path: string, bytes: int, digest: string): bool =
  try:
    let content = readHostFile(path,bytes)
    content.isSome and content.get().len == bytes and sha256Hex(content.get()) == digest
  except CatchableError: false

when defined(macosx):
  import std/posix
  proc renameNative(source, destination: cstring): cint {.importc: "rename", header: "<stdio.h>".}
  proc moveAsset(source, destination: string) =
    if renameNative(cstring(utf8ForWrite(source)),cstring(utf8ForWrite(destination))) != 0: raiseOSError(osLastError())
  proc writeChunk(fd: cint, bytes: string) =
    var at = 0
    while at < bytes.len:
      let count = posix.write(fd,unsafeAddr bytes[at],bytes.len-at)
      if count < 0:
        if errno == EINTR: continue
        raiseOSError(osLastError())
      if count == 0: raise newException(IOError,"Incomplete inference asset write")
      at += count
else:
  proc moveAsset(source, destination: string) = raise newException(OSError,"Native asset publication requires macOS")

proc fetchAsset(client: HttpClient, pin: AssetPin, staging: string, signal: ProcessCancel,
    resolver: AssetUrlResolver): Future[void] {.async.} =
  signal.check()
  when defined(macosx):
    let fd = openPrivateHostFile(staging,O_WRONLY or O_CREAT or O_EXCL)
    var opened = true
    defer:
      if opened: discard posix.close(fd)
    let cancel = newHttpCancel()
    let settings = newHttpOptions()
    settings.timeoutMs = 120000
    settings.maxBodyBytes = pin.bytes
    settings.signal = cancel
    settings.onChunk = proc(bytes: string) = writeChunk(fd,bytes)
    let pending = client.fetch((if resolver == nil: pin.url else: resolver(pin.key,pin.url)),settings)
    while not pending.finished:
      if signal.interrupted(): cancel.cancel()
      await sleepAsync(10)
    let response = await pending
    let complete = response.finishStream()
    while not complete.finished:
      if signal.interrupted(): cancel.cancel()
      await sleepAsync(10)
    await complete
    let closed = posix.close(fd)
    opened = false
    if closed != 0: raiseOSError(osLastError())
    signal.check()
    if not response.ok(): raise newException(IOError,"Inference asset download failed (HTTP " & $response.status & "): " & pin.key)
    if not validAsset(staging,pin.bytes,pin.digest):
      raise newException(IOError,"Inference asset checksum/size mismatch: " & pin.key)
  else: raise contractFailure("unsupported_capability","Native model delivery is not implemented on this host")

proc downloadAsset(client: HttpClient, pin: AssetPin, staging: string, signal: ProcessCancel,
    resolver: AssetUrlResolver): Future[void] {.async.} =
  try: await fetchAsset(client,pin,staging,signal,resolver)
  except HttpFailure as error:
    signal.check()
    if error.kind == hfTimeout: raise contractFailure("timeout","Inference asset transfer timed out: " & pin.key)
    raise newException(IOError,"Inference asset transfer failed: " & pin.key & " (" & $error.kind & ")")

proc prepareNativeAssets*(root, operation: string, download = false, signal: ProcessCancel = nil,
    resolver: AssetUrlResolver = nil): Future[NativeAssets] {.async.} =
  when not (defined(macosx) and defined(arm64)):
    raise contractFailure("unsupported_capability","Native inference currently supports macOS arm64 only")
  signal.check()
  let model = parseStrictJson(modelManifest)
  let runtime = parseStrictJson(runtimeManifest)
  let target = runtime["targets"]["darwin-arm64"]
  result.modelDirectory = root / "models" / text(model["name"]) / text(model["revision"])
  let runtimeDirectory = root / "runtime" / (text(runtime["version"]) & "-darwin-arm64")
  result.libraryPath = runtimeDirectory / text(target["library"])
  var models: seq[AssetPin]
  for file,pin in model["files"]:
    models.add(AssetPin(key: "model/" & file,path: result.modelDirectory / file,bytes: pin["bytes"].getInt(),
      digest: text(pin["sha256"]),url: "https://huggingface.co/" & text(model["name"]) & "/resolve/" & text(model["revision"]) & "/" & file))
  var ready = true
  for pin in models:
    signal.check()
    ready = validAsset(pin.path,pin.bytes,pin.digest) and ready
  for file,pin in target["files"]:
    signal.check()
    ready = validAsset(runtimeDirectory / file,pin["bytes"].getInt(),text(pin["sha256"])) and ready
  if ready: return
  if not download: raise contractFailure("prerequisite_missing","Pinned native inference assets are absent or invalid; run docs index to prepare them explicitly.")
  for path in [root,root / "operations",operation]: privateHostDirectory(path)
  let began = getMonoTime()
  var lock: HostLock
  while lock == nil:
    signal.check()
    lock = tryHostLock(root / "prepare.lock")
    if lock == nil:
      if (getMonoTime()-began).inMilliseconds >= 300000: raise contractFailure("timeout","Another native inference preparation still owns the cache; retry.")
      await sleepAsync(25)
  defer: closeHostLock(lock)
  let client = newHttpClient()
  defer: client.close()
  for pin in models:
    signal.check()
    if validAsset(pin.path,pin.bytes,pin.digest): continue
    let staging = operation / freshId("asset_")
    try:
      await downloadAsset(client,pin,staging,signal,resolver)
      createDir(parentDir(pin.path))
      moveAsset(staging,pin.path)
    finally:
      if fileExists(staging): removeFile(staging)
  var runtimeReady = true
  for file,pin in target["files"]:
    runtimeReady = validAsset(runtimeDirectory / file,pin["bytes"].getInt(),text(pin["sha256"])) and runtimeReady
  if runtimeReady: return
  let archive = operation / "runtime.tgz"
  let extraction = operation / "extracted"
  privateHostDirectory(extraction)
  let archivePin = AssetPin(key: "runtime/archive",url: text(target["url"]),bytes: target["bytes"].getInt(),digest: text(target["sha256"]))
  try:
    await downloadAsset(client,archivePin,archive,signal,resolver)
    var args = @["-xzf",archive,"-C",extraction]
    for file,pin in target["files"]: args.add(text(target["directory"]) & "/" & file)
    # This function runs inside the isolated compute child. Keep tar in that
    # child's inherited group so the outer owner can cancel the complete tree.
    let captured = captureCommand("/usr/bin/tar",args,timeoutMs=120000,maxBytes=32768)
    if captured.timedOut: raise contractFailure("timeout","Native runtime extraction timed out")
    if captured.exitCode != 0: raise newException(IOError,"Pinned native runtime archive could not be extracted")
    signal.check()
    for file,pin in target["files"]:
      let source = extraction / text(target["directory"]) / file
      if symlinkExists(source) or not fileExists(source): raise newException(IOError,"Invalid native runtime archive member")
      setFilePermissions(source,{fpUserRead,fpUserWrite})
      if not validAsset(source,pin["bytes"].getInt(),text(pin["sha256"])):
        raise newException(IOError,"Pinned native runtime archive member checksum mismatch")
    for file,pin in target["files"]:
      let destination = runtimeDirectory / file
      createDir(parentDir(destination))
      moveAsset(extraction / text(target["directory"]) / file,destination)
  finally:
    if fileExists(archive): removeFile(archive)
    if dirExists(extraction): removeDir(extraction)
