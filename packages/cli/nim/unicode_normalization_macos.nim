## Lazy system ICU NFD. Singletons belong to ICU; retain its library while used.
## API: https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/unorm2_8h.html
import std/[dynlib, strutils]
import ./js_text

type
  GetNfd = proc(error: ptr int32): pointer {.cdecl.}
  Normalize = proc(normalizer: pointer, source: ptr uint16, length: int32,
    dest: ptr uint16, capacity: int32, error: ptr int32): int32 {.cdecl.}
  GetVersion = proc(version: ptr array[4,uint8]) {.cdecl.}
  NfdNormalizer* = ref object
    library: LibHandle
    instance: pointer
    normalizeText: Normalize
    version*: string

proc close*(normalizer: NfdNormalizer) =
  if normalizer == nil: return
  normalizer.instance = nil
  normalizer.normalizeText = nil
  if normalizer.library != nil: unloadLib(normalizer.library)
  normalizer.library = nil

proc newNfdNormalizer*(): NfdNormalizer =
  result = NfdNormalizer(library: loadLib("/usr/lib/libicucore.A.dylib"))
  if result.library == nil: raise newException(OSError,"System ICU normalization is unavailable")
  try:
    let getNfd = cast[GetNfd](symAddr(result.library,"unorm2_getNFDInstance"))
    let getVersion = cast[GetVersion](symAddr(result.library,"u_getVersion"))
    result.normalizeText = cast[Normalize](symAddr(result.library,"unorm2_normalize"))
    if getNfd == nil or getVersion == nil or result.normalizeText == nil:
      raise newException(OSError,"System ICU normalization symbols are unavailable")
    var error = 0'i32
    result.instance = getNfd(addr error)
    if result.instance == nil or error > 0: raise newException(OSError,"System ICU cannot open NFD normalization")
    var version: array[4,uint8]
    getVersion(addr version)
    var parts: seq[string]
    for value in version: parts.add($value)
    result.version = parts.join(".")
  except CatchableError:
    result.close()
    raise

proc nfd*(normalizer: NfdNormalizer, text: string): string =
  if normalizer == nil or normalizer.instance == nil: raise newException(IOError,"NFD normalizer is closed")
  let units = utf16Units(text)
  if units.len == 0: return ""
  if units.len >= int(high(int32)): raise newException(ValueError,"Normalization input is too large")
  var error = 0'i32
  let length = normalizer.normalizeText(normalizer.instance,unsafeAddr units[0],int32(units.len),nil,0,addr error)
  # U_BUFFER_OVERFLOW_ERROR=15 is the documented result of a size-only call.
  if (error > 0 and error != 15) or length < 0 or length == high(int32):
    raise newException(OSError,"System ICU normalization failed")
  var dest = newSeq[uint16](int(length)+1)
  error = 0
  let written = normalizer.normalizeText(normalizer.instance,unsafeAddr units[0],int32(units.len),
    addr dest[0],int32(dest.len),addr error)
  if error > 0 or written != length: raise newException(OSError,"System ICU normalization failed")
  dest.setLen(int(written))
  utf16Text(dest)
