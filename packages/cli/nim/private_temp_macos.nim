## The macOS SDK declares mkdtemp in unistd.h; Nim 2.2.12 names stdlib.h.
import std/os

proc nativeMkdtemp(pattern: cstring): cstring {.importc: "mkdtemp", header: "<unistd.h>".}
proc createPrivateTempDirectory*(prefix: string): string =
  if '\0' in prefix: raise newException(ValueError,"Temporary directory prefix contains NUL")
  var pattern = prefix & "XXXXXX"
  # Keep the owning Nim string live while the SDK mutates its suffix.
  if nativeMkdtemp(cstring(pattern)) == nil: raiseOSError(osLastError())
  pattern
