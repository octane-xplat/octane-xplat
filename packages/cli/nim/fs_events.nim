## Owned macOS file events; callbacks touch only the C queue, never Nim's GC.
import std/os
import ./js_text
type
  FileEvents* = ref object
    handle: pointer
  FileEventBatch* = object
    paths*: seq[string]
    mustScan*: bool

when defined(macosx):
  {.compile: "fs_events_shim.c".}
  {.passL: "-framework CoreServices -framework CoreFoundation".}
  proc nativeOpen(paths: ptr cstring, count: csize_t): pointer {.importc: "xplat_file_events_open".}
  proc nativeClose(handle: pointer) {.importc: "xplat_file_events_close".}
  proc nativeNext(handle: pointer, scan: ptr cint): cstring {.importc: "xplat_file_events_next".}
  proc nativeFree(path: cstring) {.importc: "xplat_file_events_free".}

proc openFileEvents*(paths: openArray[string]): FileEvents =
  when defined(macosx):
    if paths.len == 0: raise newException(ValueError,"File watcher requires at least one root")
    var bytes: seq[string]
    for path in paths:
      if '\0' in path: raise newException(ValueError,"Watch root must not contain NUL")
      bytes.add(utf8ForWrite(absolutePath(path)))
    var roots: seq[cstring]
    for path in bytes: roots.add(cstring(path))
    let handle = nativeOpen(addr roots[0],csize_t(roots.len))
    if handle == nil: raise newException(OSError,"Could not start macOS file watching")
    FileEvents(handle:handle)
  else: raise newException(OSError,"Native file watching is not implemented on this host")

proc close*(owner: FileEvents) =
  if owner == nil or owner.handle == nil: return
  when defined(macosx): nativeClose(owner.handle)
  owner.handle = nil

proc drain*(owner: FileEvents): FileEventBatch =
  if owner == nil or owner.handle == nil: raise newException(ValueError,"File watcher is closed")
  when defined(macosx):
    while true:
      var scan: cint
      let path = nativeNext(owner.handle,addr scan)
      if scan != 0: result.mustScan = true
      if path == nil: break
      try: result.paths.add(normalizedPath(decodeUtf8($path)))
      finally: nativeFree(path)
