## Windows SDK storage boundary; only imported on Windows.
## Private NTFS objects use explicit owner/DACLs, never POSIX mode emulation.
import std/[os, options]
import ./js_text, ./native_identity, ./windows_security

const header = windowsPrivateHeader
type
  PrivateStamp {.importc: "XplatPrivateStamp", header: header, bycopy.} = object
    device: uint32
    file: uint64
  WindowsFileStamp* = tuple[device: DeviceId, file: FileId]
proc directory(path: cstring, create: cint, error: ptr uint32): cint {.importc: "xplat_private_directory", header: header.}
proc read(path: cstring, maximum: csize_t, bytes: ptr cstring, length: ptr csize_t,
  error: ptr uint32): cint {.importc: "xplat_private_read", header: header.}
proc release(bytes: pointer) {.importc: "xplat_private_free", header: header.}
proc publish(path, temporary, bytes: cstring, length: csize_t, stamp: ptr PrivateStamp,
  error: ptr uint32): cint {.importc: "xplat_private_publish", header: header.}
proc remove(path: cstring, stamp: PrivateStamp, error: ptr uint32): cint {.importc: "xplat_private_remove", header: header.}
proc lock(path: cstring, error: ptr uint32): pointer {.importc: "xplat_private_lock", header: header.}
proc windowsUnlock*(handle: pointer) {.importc: "xplat_private_unlock", header: header.}

proc pathBytes(path: string): string =
  if '\0' in path: raise newException(ValueError,"Native private path contains NUL")
  utf8ForWrite(path)
proc windowsPrivateDirectory*(path: string, create: bool): bool =
  let bytes = pathBytes(path)
  var error: uint32
  let status = directory(cstring(bytes),cint(create),addr error)
  if status < 0: raiseOSError(OSErrorCode(error),"Native storage needs a private current-user NTFS directory")
  status == 0
proc windowsExclusivePrivateDirectory*(path: string): bool =
  var error: uint32
  let status = directory(cstring(pathBytes(path)),2,addr error)
  if status < 0: raiseOSError(OSErrorCode(error),"Cannot exclusively create the private native directory")
  status == 0
proc windowsPrivateTempDirectory*(parent, prefix: string): string =
  for attempt in 0..<20:
    let candidate = parent / freshId(prefix)
    if windowsExclusivePrivateDirectory(candidate): return candidate
  raise newException(OSError,"Unable to allocate a fresh private native directory")

proc windowsReadPrivate*(path: string, maximum: int): Option[string] =
  if maximum < 0: raise newException(ValueError,"Native file byte limit cannot be negative")
  var bytes: cstring
  var length: csize_t
  var error: uint32
  let status = read(cstring(pathBytes(path)),csize_t(maximum),addr bytes,addr length,addr error)
  if status < 0: raiseOSError(OSErrorCode(error),"Cannot read the bounded private native file")
  if status == 1: return none(string)
  defer: release(bytes)
  var output = newString(int(length))
  if length > 0: copyMem(addr output[0],bytes,int(length))
  some(output)
proc windowsPublishPrivate*(path, bytes: string): WindowsFileStamp =
  let destination = pathBytes(path)
  let temporary = destination & "." & freshId("tmp_")
  var stamp: PrivateStamp
  var error: uint32
  if publish(cstring(destination),cstring(temporary),cstring(bytes),csize_t(bytes.len),addr stamp,addr error) < 0:
    raiseOSError(OSErrorCode(error),"Cannot atomically publish the private native file")
  (cast[DeviceId](stamp.device),cast[FileId](stamp.file))
proc windowsRemovePrivate*(path: string, owned: WindowsFileStamp) =
  # Cleanup is identity-bound and best effort, matching the POSIX boundary.
  try:
    var error: uint32
    discard remove(cstring(pathBytes(path)),PrivateStamp(device: cast[uint32](owned.device),
      file: cast[uint64](owned.file)),addr error)
  except CatchableError: discard
proc windowsTryLock*(path: string): pointer =
  var error: uint32
  result = lock(cstring(pathBytes(path)),addr error)
  if result == nil and error != 33'u32: # ERROR_LOCK_VIOLATION is ordinary contention.
    raiseOSError(OSErrorCode(error),"Cannot acquire the private native lifetime lock")
