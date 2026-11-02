## Project worker constructs packages; native ownership validates and publishes.
import std/[os, json, asyncdispatch, tempfiles]
import ./build_worker, ./runtime_logs, ./managed_process, ./host_bootstrap
import ./jsonutil, ./contract_failure

proc renameArtifact(source, destination: string) =
  when defined(macosx):
    proc renameNative(source, destination: cstring): cint {.importc: "rename", header: "<stdio.h>".}
    if renameNative(source.cstring,destination.cstring) != 0: raiseOSError(osLastError())
  else: raise newException(OSError,"Native macOS artifact publication requires macOS")

proc executableName(value: JsonNode): string =
  if value == nil or value.kind != JString: raise newException(ValueError,"Missing macOS executable name")
  result = value.getStr()
  if result.len == 0 or result[0] notin {'a'..'z','A'..'Z','0'..'9'}:
    raise newException(ValueError,"Invalid macOS executable name")
  for ch in result:
    if ch notin {'a'..'z','A'..'Z','0'..'9','.','_',' ','-'}: raise newException(ValueError,"Invalid macOS executable name")

proc publishMacOSArtifacts*(root, stage: string, plan: JsonNode, preserveStage: var bool): JsonNode =
  if field(plan,"version") != %1: raise newException(ValueError,"Unsupported macOS artifact plan")
  let name = executableName(field(plan,"executableName"))
  let app = stage / (name & ".app")
  let dmg = stage / (name & "-macos-universal.dmg")
  let executable = app / "Contents/MacOS" / name
  if field(plan,"appPath") != %app or field(plan,"dmgPath") != %dmg or
      not dirExists(app) or symlinkExists(app) or not fileExists(executable) or
      expandFilename(executable) != executable or not fileExists(app / "Contents/Info.plist") or
      not fileExists(dmg) or symlinkExists(dmg) or getFileSize(dmg) == 0:
    raise newException(ValueError,"Incomplete or mismatched macOS artifact plan")
  let appPath = root / (name & ".app")
  let dmgPath = root / (name & "-macos-universal.dmg")
  if symlinkExists(appPath) or symlinkExists(dmgPath) or fileExists(appPath) or dirExists(dmgPath):
    raise newException(ValueError,"Refusing incompatible existing macOS artifact destinations")
  let oldApp = stage / "previous.app"
  let oldDmg = stage / "previous.dmg"
  for backup in [oldApp,oldDmg]:
    if fileExists(backup) or dirExists(backup) or symlinkExists(backup):
      raise newException(ValueError,"Unexpected macOS backup path in worker staging")
  var appMoved, dmgMoved, appPublished, dmgPublished: bool
  try:
    if dirExists(appPath): renameArtifact(appPath,oldApp); appMoved = true
    if fileExists(dmgPath): renameArtifact(dmgPath,oldDmg); dmgMoved = true
    renameArtifact(app,appPath); appPublished = true
    renameArtifact(dmg,dmgPath); dmgPublished = true
  except CatchableError as original:
    var recovery: seq[string]
    try:
      if dmgPublished: renameArtifact(dmgPath,dmg)
      if dmgMoved: renameArtifact(oldDmg,dmgPath)
    except CatchableError as error: recovery.add(error.msg)
    try:
      if appPublished: renameArtifact(appPath,app)
      if appMoved: renameArtifact(oldApp,appPath)
    except CatchableError as error: recovery.add(error.msg)
    if recovery.len > 0:
      preserveStage = true
      raise contractFailure("execution_failure","macOS artifact publication and rollback failed. Recovery files remain in " & stage,
        %*{"context": {"publicationError": original.msg,"rollbackErrors": recovery},
          "recovery": {"action": "Preserve and inspect the recovery files before retrying this build."}})
    raise original
  %*{"appPath": appPath,"dmgPath": dmgPath}

proc runMacOSBuild*(root: string, logs: RuntimeLogs, signal: ProcessCancel,
    timeoutMs = 900000): Future[JsonNode] {.async.} =
  discard projectWorker(root,"@octane-xplat/macos-build")
  let release = root / "artifacts/macos-universal"
  for directory in [root / "artifacts", release]:
    if symlinkExists(directory): raise newException(ValueError,"macOS artifact directories must not be symlinks")
    createDir(directory)
  let lock = tryHostLock(release / ".xplat-build.lock")
  if lock == nil: raise contractFailure("target_busy","Another native macOS build owns this app's output directory.")
  var stage: string
  var preserveStage = false
  try:
    stage = createTempDir(".xplat-macos-","",release)
    let identity = getFileInfo(stage,followSymlink=false).id
    try:
      var output, errors: ProcessLines
      proc capture(stream, bytes: string, eof = false) =
        let lines = if stream == "stdout": output.feed(bytes,stream,eof) else: errors.feed(bytes,stream,eof)
        for line in lines:
          discard logs.appendLog(line.line,stream=stream,source="macos-build",lineTruncated=line.lineTruncated)
      var plan: JsonNode
      try:
        plan = await runBuildWorker(root,"macos-package",%*{"stagingRoot": stage},timeoutMs=timeoutMs,signal=signal,
          packageName="@octane-xplat/macos-build",onOutput=proc(stream, bytes: string) = capture(stream,bytes))
      finally:
        capture("stdout","",true)
        capture("stderr","",true)
      if (signal != nil and signal.cancelled) or interruptedSignal() != 0:
        raise contractFailure("cancelled","Build cancelled before macOS artifact publication.")
      if getFileInfo(stage,followSymlink=false).id != identity or symlinkExists(stage):
        raise newException(ValueError,"macOS staging ownership changed before publication")
      let artifacts = publishMacOSArtifacts(release,stage,plan,preserveStage)
      discard logs.noteLog("Published macOS app and DMG: " & text(artifacts["appPath"]))
      return %*{"summary": "macOS package build succeeded","artifacts": artifacts}
    finally:
      if not preserveStage and dirExists(stage) and not symlinkExists(stage) and
          getFileInfo(stage,followSymlink=false).id == identity: removeDir(stage)
  finally: lock.closeHostLock()
