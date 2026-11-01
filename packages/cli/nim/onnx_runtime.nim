## Lazy CPU ONNX Runtime over a checked C ABI. No JavaScript engine or bridge.
## Currently qualified for the exact official macOS arm64 library only.
import std/[os, dynlib]
import ./digests, ./js_text, ./minilm_tokenizer, ./embedding_pool

const
  ortVersion* = "1.31.1"
  miniLmModelSha* = "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1"
  ortMacArm64Sha* = "17500d6b1e37e70f43a2c57d94233a1bc29fbcb297be0a5f8c7c13184f3307ba"

type OrtSession* = ref object
  library: LibHandle
  handle: pointer
  version*: string

when defined(macosx) and defined(arm64):
  const shimHeader = currentSourcePath().parentDir / "ort_shim.h"
  {.compile: "ort_shim.c".}
  proc nativeVersion(base: pointer): cstring {.cdecl, importc: "xplat_ort_version", header: shimHeader.}
  proc nativeOpen(base, model: pointer, bytes: csize_t, optimization: cint, error: ptr cstring): pointer {.cdecl, importc: "xplat_ort_open", header: shimHeader.}
  proc nativeClose(context: pointer) {.cdecl, importc: "xplat_ort_close", header: shimHeader.}
  proc nativeRun(context: pointer, ids, mask, types: ptr int64, length: csize_t,
    output: ptr pointer, data: ptr ptr UncheckedArray[float32], count: ptr csize_t,
    error: ptr cstring): cint {.cdecl, importc: "xplat_ort_run", header: shimHeader.}
  proc nativeReleaseOutput(context, output: pointer) {.cdecl, importc: "xplat_ort_release_output", header: shimHeader.}
  proc nativeFreeError(error: cstring) {.cdecl, importc: "xplat_ort_free_error", header: shimHeader.}
  proc failure(error: cstring) {.noreturn.} =
    let message = if error == nil: "Native ONNX operation failed" else: decodeUtf8($error)
    nativeFreeError(error)
    raise newException(IOError,message)

proc close*(session: OrtSession) =
  if session == nil: return
  when defined(macosx) and defined(arm64):
    if session.handle != nil: nativeClose(session.handle)
  session.handle = nil
  if session.library != nil: unloadLib(session.library)
  session.library = nil

proc checkedModel(modelPath: string): string =
  if '\0' in modelPath: raise newException(ValueError,"Native model path contains a null byte")
  if not fileExists(modelPath): raise newException(IOError,"Pinned model file is absent or invalid; run docs index")
  result = readFile(modelPath)
  if sha256Hex(result) != miniLmModelSha: raise newException(IOError,"Pinned model file is absent or invalid; run docs index")
proc verifyOrtLibrary(libraryPath: string) =
  when defined(macosx) and defined(arm64):
    if '\0' in libraryPath: raise newException(ValueError,"Native model path contains a null byte")
    if sha256Hex(readFile(libraryPath)) != ortMacArm64Sha: raise newException(IOError,"Pinned native runtime checksum mismatch")
  else:
    raise newException(OSError,"Native ONNX inference is not yet implemented on this host")

proc verifyOrtAssets*(libraryPath, modelPath: string) =
  discard checkedModel(modelPath)
  verifyOrtLibrary(libraryPath)

proc openOrtSession*(libraryPath, modelPath: string, optimization = 1): OrtSession =
  if optimization notin [0,1,2,99]: raise newException(ValueError,"Invalid native graph optimization")
  let bytes = checkedModel(modelPath)
  verifyOrtLibrary(libraryPath)
  when defined(macosx) and defined(arm64):
    result = OrtSession()
    try:
      result.library = loadLib(absolutePath(libraryPath))
      if result.library == nil: raise newException(OSError,"Pinned native ONNX runtime is unavailable")
      type GetBase = proc(): pointer {.cdecl.}
      let getBase = cast[GetBase](symAddr(result.library,"OrtGetApiBase"))
      if getBase == nil: raise newException(OSError,"Native ONNX API symbol is unavailable")
      let base = getBase()
      if base == nil: raise newException(OSError,"Native ONNX API is unavailable")
      result.version = $nativeVersion(base)
      if result.version != ortVersion: raise newException(OSError,"Pinned native ONNX version mismatch")
      # Session construction consumes model bytes synchronously. Input/output
      # tensors have their own shorter, explicitly scoped borrowed lifetimes.
      var error: cstring
      result.handle = nativeOpen(base,unsafeAddr bytes[0],csize_t(bytes.len),cint(optimization),addr error)
      if result.handle == nil: failure(error)
    except CatchableError:
      result.close()
      raise

proc runMiniLm*(session: OrtSession, encoded: MiniLmEncoding): seq[float] =
  if session == nil or session.handle == nil: raise newException(IOError,"Native ONNX session is closed")
  let length = encoded.input_ids.len
  if length < 1 or length > 512 or encoded.attention_mask.len != length or encoded.token_type_ids.len != length:
    raise newException(ValueError,"Invalid MiniLM input shape")
  for id in encoded.input_ids:
    if id < 0 or id >= 30522: raise newException(ValueError,"Invalid MiniLM token ID")
  when defined(macosx) and defined(arm64):
    var output: pointer
    var data: ptr UncheckedArray[float32]
    var count: csize_t
    var error: cstring
    if nativeRun(session.handle,unsafeAddr encoded.input_ids[0],unsafeAddr encoded.attention_mask[0],
      unsafeAddr encoded.token_type_ids[0],csize_t(length),addr output,addr data,addr count,addr error) == 0: failure(error)
    defer: nativeReleaseOutput(session.handle,output)
    if data == nil or count != csize_t(length*384): raise newException(IOError,"Unexpected MiniLM embedding output")
    poolEmbedding(toOpenArray(data,0,int(count)-1),encoded.attention_mask,384)
  else:
    raise newException(OSError,"Native ONNX inference is not yet implemented on this host")
