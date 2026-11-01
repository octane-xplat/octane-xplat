## macOS ICU adapter for the reference's default Intl.Collator ordering.
## Lazy loading keeps collation out of commands that do not sort documents.
import std/dynlib
import ./js_text

type
  OpenCollator = proc(locale: cstring, error: ptr int32): pointer {.cdecl.}
  CloseCollator = proc(collator: pointer) {.cdecl.}
  CompareText = proc(collator: pointer, left: ptr uint16, leftLength: int32,
    right: ptr uint16, rightLength: int32): int32 {.cdecl.}
  DefaultLocale = proc(): cstring {.cdecl.}
  LocaleSorter* = object
    library: LibHandle
    collator: pointer
    closeCollator: CloseCollator
    compareText: CompareText

proc close*(sorter: var LocaleSorter) =
  if sorter.collator != nil: sorter.closeCollator(sorter.collator)
  if sorter.library != nil: unloadLib(sorter.library)
  sorter.collator = nil
  sorter.library = nil

proc newLocaleSorter*(locale = ""): LocaleSorter =
  result.library = loadLib("/usr/lib/libicucore.A.dylib")
  if result.library == nil: raise newException(OSError,"System ICU collation is unavailable")
  try:
    # Keep symbols local to the owned library handle; no compiler headers or
    # private npm/runtime payload are required.
    let openCollator = cast[OpenCollator](symAddr(result.library,"ucol_open"))
    result.closeCollator = cast[CloseCollator](symAddr(result.library,"ucol_close"))
    result.compareText = cast[CompareText](symAddr(result.library,"ucol_strcoll"))
    let defaultLocale = cast[DefaultLocale](symAddr(result.library,"uloc_getDefault"))
    if openCollator == nil or result.closeCollator == nil or result.compareText == nil or defaultLocale == nil:
      raise newException(OSError,"System ICU collation symbols are unavailable")
    var requested = if locale != "": locale else: $defaultLocale()
    # V8 translates ICU's fallback locale before constructing Intl.Collator.
    # https://chromium.googlesource.com/v8/v8/+/refs/heads/main/src/execution/isolate.cc
    if locale == "" and requested in ["en_US_POSIX","c"]: requested = "en-US"
    var error = 0'i32
    result.collator = openCollator(cstring(requested),addr error)
    if result.collator == nil or error > 0:
      raise newException(OSError,"System ICU cannot open collation: " & requested)
  except CatchableError:
    result.close()
    raise

proc compare*(sorter: LocaleSorter, left, right: string): int =
  let a = utf16Units(left)
  let b = utf16Units(right)
  int(sorter.compareText(sorter.collator,
    (if a.len == 0: nil else: unsafeAddr a[0]),int32(a.len),
    (if b.len == 0: nil else: unsafeAddr b[0]),int32(b.len)))
