## Private native-host namespace and bounded descriptor storage.
import std/[os, json, options]
import ./host_bootstrap, ./native_identity, ./digests, ./strictjson, ./json_wire, ./jsonutil, ./js_text

type
  FileStamp* = tuple[device: DeviceId, file: FileId]
  HostPaths* = object
    workspace*, directory*, descriptor*, socket*, lock*, log*: string

proc hostPaths*(workspace: string): HostPaths =
  if '\0' in workspace: raise newException(ValueError,"Workspace contains NUL")
  result.workspace = expandFilename(absolutePath(workspace))
  if not dirExists(result.workspace): raise newException(ValueError,"Host workspace must be a directory")
  let key = sha256Hex(utf8ForWrite(result.workspace))[0..<32]
  # Dependency reinstalls and `clean` must not erase a live owner's credentials
  # or replace its lifetime-lock inode while application resources still exist.
  result.directory = getHomeDir() / ".cache/octane-xplat/nim-hosts" / key
  result.descriptor = result.directory / "host.json"
  result.lock = result.directory / "host.lock"
  result.log = result.directory / "host.log"
  result.socket = getHomeDir() / ".cache/octane-xplat/nim-ipc" /
    (key & ".sock")
  if utf8ForWrite(result.socket).len >= 104:
    raise newException(ValueError,"Native host socket path exceeds the macOS path limit")

when defined(macosx):
  import std/posix
  proc renameNative(source, destination: cstring): cint {.importc: "rename", header: "<stdio.h>".}

  proc existingPrivateHostDirectory*(path: string): bool =
    var info: Stat
    if lstat(cstring(utf8ForWrite(path)),info) != 0:
      if errno == ENOENT: return false
      raiseOSError(osLastError())
    if not S_ISDIR(info.st_mode) or info.st_uid != geteuid() or (info.st_mode and Mode(0o077)) != Mode(0):
      raise newException(OSError,"Native host directories must be private and owned by the current user")
    true

  proc privateHostDirectory*(path: string) =
    createDir(parentDir(path))
    if posix.mkdir(cstring(utf8ForWrite(path)),Mode(0o700)) != 0 and errno != EEXIST:
      raiseOSError(osLastError())
    var info: Stat
    if lstat(cstring(utf8ForWrite(path)),info) != 0: raiseOSError(osLastError())
    if not S_ISDIR(info.st_mode) or info.st_uid != geteuid() or (info.st_mode and Mode(0o077)) != Mode(0):
      raise newException(OSError,"Native host directories must be private and owned by the current user")

  proc prepareHostPaths*(paths: HostPaths) =
    privateHostDirectory(paths.directory)
    privateHostDirectory(parentDir(paths.socket))

  proc stamp(fd: cint): FileStamp =
    var info: Stat
    if fstat(fd,info) != 0: raiseOSError(osLastError())
    (DeviceId(info.st_dev),FileId(info.st_ino))

  proc readHostFile*(path: string, maximum = 16384): Option[string] =
    var fd: cint
    try: fd = openPrivateHostFile(path,O_RDONLY)
    except OSError as error:
      if error.errorCode == ENOENT: return none(string)
      raise
    defer: discard posix.close(fd)
    var bytes: string
    var buffer: array[4096,char]
    while true:
      let count = posix.read(fd,addr buffer[0],buffer.len)
      if count < 0:
        if errno == EINTR: continue
        raiseOSError(osLastError())
      if count == 0: return some(bytes)
      if count > maximum-bytes.len: raise newException(IOError,"Native host descriptor exceeds its byte limit")
      let offset = bytes.len
      bytes.setLen(offset+count)
      copyMem(addr bytes[offset],addr buffer[0],count)

  proc removeHostFile*(path: string, owned: FileStamp) =
    try:
      if getFileInfo(path,followSymlink=false).id == owned: removeFile(path)
    except OSError: discard

  proc publishHostFile*(path, bytes: string): FileStamp =
    let temporary = path & "." & freshId("tmp_")
    let fd = openPrivateHostFile(temporary,O_WRONLY or O_CREAT or O_EXCL)
    var open = true
    let owned = stamp(fd)
    defer:
      if open: discard posix.close(fd)
      removeHostFile(temporary,owned)
    var offset = 0
    while offset < bytes.len:
      let count = posix.write(fd,unsafeAddr bytes[offset],bytes.len-offset)
      if count < 0:
        if errno == EINTR: continue
        raiseOSError(osLastError())
      if count == 0: raise newException(IOError,"Could not write the native host descriptor")
      offset += count
    let closed = posix.close(fd)
    open = false
    if closed != 0: raiseOSError(osLastError())
    if renameNative(cstring(utf8ForWrite(temporary)),cstring(utf8ForWrite(path))) != 0: raiseOSError(osLastError())
    owned
else:
  proc existingPrivateHostDirectory*(path: string): bool = raise newException(OSError,"Native host storage is not implemented on this host")
  proc privateHostDirectory*(path: string) = raise newException(OSError,"Native host storage is not implemented on this host")
  proc prepareHostPaths*(paths: HostPaths) = raise newException(OSError,"Native host storage is not implemented on this host")
  proc readHostFile*(path: string, maximum = 16384): Option[string] = none(string)
  proc removeHostFile*(path: string, owned: FileStamp) = discard
  proc publishHostFile*(path, bytes: string): FileStamp = raise newException(OSError,"Native host storage is not implemented on this host")

proc readHostDescriptor*(paths: HostPaths): JsonNode =
  let bytes = readHostFile(paths.descriptor)
  if bytes.isNone: return nil
  let value = parseStrictJson(decodeUtf8(bytes.get()))
  if value.kind != JObject or field(value,"version") != %1 or field(value,"implementation") != %"nim" or
      field(value,"workspaceRoot") != %paths.workspace or field(value,"socketPath") != %paths.socket:
    raise newException(ValueError,"Unrecognized native host descriptor; preserve it and inspect the native host cache")
  for key in ["token","startedAt"]:
    if field(value,key) == nil or value[key].kind != JString or value[key].getStr().len == 0:
      raise newException(ValueError,"Invalid native host descriptor")
  if value["token"].getStr().len != 64 or field(value,"pid") == nil or value["pid"].kind != JInt or value["pid"].getInt() <= 0:
    raise newException(ValueError,"Invalid native host descriptor")
  if field(value,"identity") == nil or value["identity"].kind != JObject:
    raise newException(ValueError,"Invalid native host identity")
  value
