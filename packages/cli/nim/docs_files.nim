## Bounded Markdown discovery. Lexical names are refs; canonical targets set scope.
import std/[os, strutils, algorithm, sets]
import ./js_text, ./contract_failure

const maxDocumentationBytes* = 4*1024*1024

proc within(path, root: string): bool = path == root or path.startsWith(root & DirSep)

proc documentationTargetWithin*(root, path: string): bool =
  if '\0' in root or '\0' in path: return false
  try: within(expandFilename(path),expandFilename(root))
  except OSError: false

proc documentationFiles*(root, directory: string, recursive = true): seq[string] =
  if '\0' in root or '\0' in directory: raise contractFailure("invalid_selection","Documentation path contains NUL")
  if not dirExists(directory): return
  let boundary = expandFilename(root)
  let corpus = expandFilename(directory)
  if not within(corpus,boundary): return
  var seen = initHashSet[string]()
  var files: seq[string]
  var entries = 0
  proc walk(path: string, depth: int) =
    let canonical = expandFilename(path)
    if not within(canonical,corpus) or canonical in seen: return
    if depth > 64: raise contractFailure("unavailable","Documentation directory depth exceeds 64")
    seen.incl(canonical)
    var names: seq[string]
    for kind, child in walkDir(path):
      inc entries
      if entries > 65536: raise contractFailure("unavailable","Documentation inventory exceeds 65536 entries")
      names.add(child)
    names.sort()
    for child in names:
      let name = lastPathPart(child)
      if name.startsWith('.') or name == "node_modules": continue
      if not fileExists(child) and not dirExists(child): continue
      let target = expandFilename(child)
      if not within(target,corpus): continue
      if dirExists(child):
        if recursive: walk(child,depth+1)
      elif name.endsWith(".md"):
        if files.len >= 10000: raise contractFailure("unavailable","Documentation inventory exceeds 10000 files")
        files.add(child)
  walk(directory,0)
  files

when defined(posix):
  import std/posix
  proc readDocumentationText*(path: string): string =
    if '\0' in path: raise contractFailure("invalid_selection","Documentation path contains NUL")
    let fd = posix.open(cstring(utf8ForWrite(path)),O_RDONLY or O_CLOEXEC or O_NONBLOCK)
    if fd < 0: raiseOSError(osLastError())
    defer: discard posix.close(fd)
    var info: Stat
    if fstat(fd,info) != 0: raiseOSError(osLastError())
    if not S_ISREG(info.st_mode): raise contractFailure("unavailable","Documentation must be a regular file")
    if info.st_size > maxDocumentationBytes: raise contractFailure("unavailable","Documentation file exceeds 4 MiB")
    var bytes: string
    var buffer: array[16384,char]
    while true:
      let count = posix.read(fd,addr buffer[0],buffer.len)
      if count == 0: break
      if count < 0:
        if errno == EINTR: continue
        raiseOSError(osLastError())
      if count > maxDocumentationBytes-bytes.len: raise contractFailure("unavailable","Documentation file exceeds 4 MiB")
      let offset = bytes.len
      bytes.setLen(offset+count)
      copyMem(addr bytes[offset],addr buffer[0],count)
    decodeUtf8(bytes)
else:
  proc readDocumentationText*(path: string): string =
    if '\0' in path: raise contractFailure("invalid_selection","Documentation path contains NUL")
    if getFileSize(path) > maxDocumentationBytes: raise contractFailure("unavailable","Documentation file exceeds 4 MiB")
    let bytes = readFile(path)
    if bytes.len > maxDocumentationBytes: raise contractFailure("unavailable","Documentation file exceeds 4 MiB")
    decodeUtf8(bytes)
