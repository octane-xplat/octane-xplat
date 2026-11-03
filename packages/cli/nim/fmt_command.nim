## Canonical project formatter plans; native validation and source publication.
import std/[os, json, strutils, sets, asyncdispatch, tempfiles]
when defined(windows): import std/widestrs
import ./build_worker, ./managed_process, ./jsonutil, ./js_text, ./digests

type
  FormatScope = object
    lexical, canonical: string
    directory: bool
  FormatArtifact = object
    file, canonical, digest, code: string
    info: FileInfo
    changed: bool

proc within(path, root: string): bool =
  path == root or path.startsWith(root & $DirSep)

proc selection(project: string, inputs: seq[string]): seq[FormatScope] =
  for input in (if inputs.len == 0: @[project] else: inputs):
    let file = absolutePath(input,project)
    var info: FileInfo
    try: info = getFileInfo(file,followSymlink=false)
    except OSError: raise newException(ValueError,"no such file or directory: " & input)
    if info.kind in [pcLinkToFile,pcLinkToDir]:
      raise newException(ValueError,"not following symlink: " & input)
    if info.kind notin [pcFile,pcDir]: raise newException(ValueError,"not a regular source path: " & input)
    result.add(FormatScope(lexical:file,canonical:expandFilename(file),directory:info.kind == pcDir))

proc unchanged(entry: FormatArtifact): bool =
  let info = getFileInfo(entry.file,followSymlink=false)
  info.kind == pcFile and info.id == entry.info.id and
    info.permissions == entry.info.permissions and info.lastWriteTime == entry.info.lastWriteTime and
    expandFilename(entry.file) == entry.canonical and sha256Hex(readFile(entry.file)) == entry.digest

proc permissionMode(permissions: set[FilePermission]): int =
  for (permission, bit) in [(fpUserRead,0o400),(fpUserWrite,0o200),(fpUserExec,0o100),
      (fpGroupRead,0o040),(fpGroupWrite,0o020),(fpGroupExec,0o010),
      (fpOthersRead,0o004),(fpOthersWrite,0o002),(fpOthersExec,0o001)]:
    if permission in permissions: result = result or bit

proc validateArtifacts(plan: JsonNode, scopes: seq[FormatScope]): seq[FormatArtifact] =
  let files = field(plan,"files")
  if files == nil or files.kind != JArray: raise newException(ValueError,"Invalid format artifact plan")
  var seen = initHashSet[string]()
  for file in files:
    for key in ["file","sourceSha256","code"]:
      if field(file,key) == nil or file[key].kind != JString:
        raise newException(ValueError,"Invalid format artifact field: " & key)
    if field(file,"changed") == nil or file["changed"].kind != JBool or
        field(file,"mode") == nil or file["mode"].kind != JInt:
      raise newException(ValueError,"Invalid format artifact metadata")
    let path = file["file"].getStr()
    if '\0' in path or not isAbsolute(path) or normalizedPath(path) != path or path in seen or
        splitFile(path).ext notin [".js",".mjs",".cjs",".jsx",".ts",".mts",".cts",".tsx",".tsrx"]:
      raise newException(ValueError,"Unexpected or duplicate format destination")
    seen.incl(path)
    let info = getFileInfo(path,followSymlink=false)
    if info.kind != pcFile: raise newException(ValueError,"Format destination is not a regular file: " & path)
    if getFileSize(path) > 64*1024*1024: raise newException(ValueError,"Format source exceeds 64 MiB")
    if (file["mode"].getInt() and 0o777) != permissionMode(info.permissions):
      raise newException(ValueError,path & ": permissions changed since it was read — left untouched")
    let canonical = expandFilename(path)
    var allowed = false
    for scope in scopes:
      if (if scope.directory: within(path,scope.lexical) and within(canonical,scope.canonical)
          else: path == scope.lexical and canonical == scope.canonical): allowed = true
    if not allowed: raise newException(ValueError,"Format destination is outside the selected paths: " & path)
    let digest = file["sourceSha256"].getStr()
    if digest.len != 64 or digest.find(AllChars - {'0'..'9','a'..'f'}) >= 0:
      raise newException(ValueError,"Invalid format source digest")
    let entry = FormatArtifact(file:path,canonical:canonical,digest:digest,
      code:utf8ForWrite(file["code"].getStr()),changed:file["changed"].getBool(),info:info)
    if not entry.unchanged(): raise newException(ValueError,path & ": changed since it was read — left untouched")
    # The formatter compares decoded text, while stale-input protection uses
    # raw bytes. Invalid UTF-8 replacement alone is not a requested rewrite.
    if entry.changed != (entry.code != utf8ForWrite(decodeUtf8(readFile(path)))):
      raise newException(ValueError,"Inconsistent format changed flag")
    result.add(entry)

proc publish(entry: FormatArtifact) =
  # Adjacent staging makes this a same-filesystem rename. Never permit a
  # high-level move helper's copy/delete fallback for source publication.
  let (handle, temporary) = createTempFile(".xplat-fmt-","",parentDir(entry.file))
  try:
    try: handle.write(entry.code)
    finally: handle.close()
    setFilePermissions(temporary,entry.info.permissions)
    if not entry.unchanged(): raise newException(ValueError,entry.file & ": changed since it was read — left untouched")
    when defined(posix):
      proc renameNative(source, destination: cstring): cint {.importc:"rename",header:"<stdio.h>".}
      if renameNative(temporary.cstring,entry.file.cstring) != 0: raiseOSError(osLastError())
    elif defined(windows):
      # MoveFileExW is an atomic same-volume replacement; source permissions
      # and alternate-stream behavior still require Windows qualification.
      proc moveNative(source, destination: WideCString, flags: uint32): int32 {.stdcall,importc:"MoveFileExW",dynlib:"kernel32".}
      if moveNative(newWideCString(temporary),newWideCString(entry.file),1) == 0: raiseOSError(osLastError())
    else: raise newException(OSError,"Atomic format publication is unavailable on this host")
  finally:
    if fileExists(temporary): removeFile(temporary)

proc runFmt*(project: string, args: seq[string], help, workerSource: string): Future[int] {.async.} =
  var check = false
  var stdinMode = false
  var stdinPath: string
  var inputs: seq[string]
  var index = 0
  var usageError: string
  while index < args.len:
    let arg = args[index]
    if arg == "--check": check = true
    elif arg == "--stdin-filepath":
      inc index
      if index >= args.len: usageError = "--stdin-filepath needs a path"; break
      stdinMode = true; stdinPath = args[index]
    elif arg.startsWith("--stdin-filepath="):
      stdinMode = true; stdinPath = arg[17..^1]
    elif arg in ["--help","-h"]:
      stdout.write(utf8ForWrite(help)); return 0
    elif arg.startsWith("-"): usageError = "unknown option \"" & arg & "\""; break
    else: inputs.add(arg)
    inc index
  if usageError.len == 0 and stdinMode and inputs.len > 0:
    usageError = "--stdin-filepath cannot be combined with paths"
  if usageError.len > 0:
    stderr.writeLine(utf8ForWrite("fmt: " & usageError & "\n\n" & help)); return 2
  var stdinValue = newJNull()
  var scopes: seq[FormatScope]
  if stdinMode:
    var source: string
    var buffer = newString(65536)
    while true:
      let count = stdin.readBuffer(addr buffer[0],buffer.len)
      if count == 0: break
      if source.len+count > 64*1024*1024: raise newException(ValueError,"Format input exceeds 64 MiB")
      source.add(buffer[0..<count])
    stdinValue = %*{"path":stdinPath,"source":decodeUtf8(source)}
  else: scopes = selection(project,inputs)
  installProcessSignalHandlers()
  let plan = await runBuildWorker(project,"fmt-plan",%*{"inputs":inputs,"stdin":stdinValue},
    workerSource=workerSource,onOutput=proc(stream,bytes:string) =
      # Library diagnostics cannot contaminate formatted stdin output.
      stderr.write(bytes); stderr.flushFile())
  if plan == nil or plan.kind != JObject or field(plan,"version") != %1 or
      field(plan,"kind") != %(if stdinMode: "stdin" else: "files"):
    raise newException(ValueError,"Unsupported format plan")
  let diagnostics = field(plan,"diagnostics")
  if diagnostics == nil or diagnostics.kind != JArray: raise newException(ValueError,"Invalid format diagnostics")
  for diagnostic in diagnostics:
    if diagnostic.kind != JString: raise newException(ValueError,"Invalid format diagnostic")
  if diagnostics.len > 0:
    for diagnostic in diagnostics: stderr.writeLine(utf8ForWrite(diagnostic.getStr()))
    return 2
  if interruptedSignal() != 0: return 128+interruptedSignal()
  if stdinMode:
    if field(plan,"code") == nil or plan["code"].kind != JString or field(plan,"changed") == nil or plan["changed"].kind != JBool:
      raise newException(ValueError,"Invalid stdin format result")
    if check: return (if plan["changed"].getBool(): 1 else: 0)
    stdout.write(utf8ForWrite(plan["code"].getStr()))
    return 0
  let artifacts = validateArtifacts(plan,scopes)
  var changed: seq[FormatArtifact]
  for entry in artifacts:
    if entry.changed: changed.add(entry)
  if check:
    for entry in changed: stderr.writeLine(utf8ForWrite(relativePath(entry.file,project) & ": would reformat"))
    return (if changed.len > 0: 1 else: 0)
  var written: seq[string]
  try:
    for entry in changed:
      if interruptedSignal() != 0:
        if written.len > 0: stderr.writeLine(utf8ForWrite("fmt: already wrote " & written.join(", ")))
        return 128+interruptedSignal()
      entry.publish()
      written.add(relativePath(entry.file,project))
  except CatchableError:
    if written.len > 0: stderr.writeLine(utf8ForWrite("fmt: already wrote " & written.join(", ")))
    raise
  if written.len > 0: stderr.writeLine("fmt: wrote " & $written.len & " file(s)")
  return 0
