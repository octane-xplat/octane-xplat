## Explicit daemon job handoff. Engine jobs retain their separate ownership rules.
import std/[os, strutils]
import ./windows_security # Compile the private file/security SDK boundary.
{.compile: "bootstrap_windows.c".}
const header = currentSourcePath().parentDir / "bootstrap_windows.h"
const bootstrapJobVariable* = "XPLAT_NIM_BOOTSTRAP_JOB"
proc windowsLaunch*(executable, line, cwd, log: cstring, environment: cstringArray,
  count: csize_t, pid, error: ptr uint32): pointer {.importc: "xplat_bootstrap_spawn", header: header.}
proc windowsLaunchPoll*(launch: pointer, code, active, error: ptr uint32): cint {.importc: "xplat_bootstrap_poll", header: header.}
proc windowsLaunchStop*(launch: pointer, error: ptr uint32): cint {.importc: "xplat_bootstrap_stop", header: header.}
proc windowsLaunchRelease*(launch: pointer) {.importc: "xplat_bootstrap_release", header: header.}
proc nativeAdopt(value: uint64, error: ptr uint32): cint {.importc: "xplat_bootstrap_adopt", header: header.}
proc nativeAlive(pid: uint32): cint {.importc: "xplat_bootstrap_alive", header: header.}
proc adoptBootstrapOwner*() =
  let raw = getEnv(bootstrapJobVariable)
  delEnv(bootstrapJobVariable)
  if raw.len == 0: raise newException(OSError,"Internal Windows owner requires an owned bootstrap launch")
  let value = parseBiggestUInt(raw)
  var error: uint32
  if nativeAdopt(uint64(value),addr error) == 0:
    raiseOSError(OSErrorCode(error),"Cannot adopt the native owner's inherited job")
proc bootstrapProcessAlive*(pid: int): bool =
  if pid <= 0 or uint64(pid) > uint64(high(uint32)): return false
  nativeAlive(uint32(pid)) != 0
