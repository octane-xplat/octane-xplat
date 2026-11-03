## Compile the shared SDK security boundary once, without importing hash engines.
import std/os
{.compile: "private_windows.c".}
{.passL: "advapi32.lib".}
const windowsPrivateHeader* = currentSourcePath().parentDir / "private_windows.h"
proc checkOwner(handle: pointer, error: ptr uint32): cint {.importc: "xplat_private_security_check", header: windowsPrivateHeader.}
proc verifyWindowsPrivateOwner*(handle: pointer) =
  var error: uint32
  if checkOwner(handle,addr error) < 0:
    raiseOSError(OSErrorCode(error),"Native endpoint must have the current user's private owner and ACL")
