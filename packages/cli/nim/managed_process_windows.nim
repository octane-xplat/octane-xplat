## Included only by managed_process.nim; share its public types and line decoder.
## SDK handles and foreign-thread console callbacks stay inside the C adapter.
import ./windows_argv, ./windows_environment
{.compile: "process_windows.c".}
const windowsProcessHeader = currentSourcePath().parentDir / "process_windows.h"
proc nativeSpawn(executable, commandLine, cwd: cstring, environment: cstringArray, count: csize_t,
  pid, error: ptr culong): pointer {.importc: "xplat_windows_spawn", header: windowsProcessHeader.}
proc nativeRead(child: pointer, stream: cint, buffer: pointer, capacity: culong,
  count, error: ptr culong): cint {.importc: "xplat_windows_read", header: windowsProcessHeader.}
proc nativePoll(child: pointer, code, active, error: ptr culong): cint {.importc: "xplat_windows_poll", header: windowsProcessHeader.}
proc nativeStop(child: pointer, error: ptr culong): cint {.importc: "xplat_windows_stop", header: windowsProcessHeader.}
proc nativeRelease(child: pointer) {.importc: "xplat_windows_release", header: windowsProcessHeader.}
proc nativeInstallSignals(): cint {.importc: "xplat_windows_install_signals", header: windowsProcessHeader.}
proc interruptedSignal*(): int {.importc: "xplat_windows_interrupted", header: windowsProcessHeader.}

var windowsLive: Table[int, ManagedProcess]
var windowsExitHooked = false
proc cleanupWindowsAtExit() {.noconv.} =
  for child in windowsLive.values:
    nativeRelease(child.nativeProcess)
    child.nativeProcess = nil
proc installProcessSignalHandlers*() =
  if nativeInstallSignals() == 0: raiseOSError(osLastError())
proc windowsBytes(value: string): string =
  if '\0' in value: raise newException(ValueError,"Child arguments and environment must not contain NUL")
  utf8ForWrite(value)
proc windowsExecutable(command, cwd: string, env: StringTableRef): string =
  var directories: seq[string]
  if '\\' in command or '/' in command or ':' in command:
    directories = @[""]
  else:
    directories = @[cwd]
    for directory in env.getOrDefault("PATH").split(';'):
      if directory != "": directories.add(directory.strip(chars={'"'}))
  let suffixes = if splitFile(command).ext == "": @[".com",".exe",""] else: @[""]
  for directory in directories:
    for suffix in suffixes:
      let candidate = absolutePath(directory / (command & suffix),cwd)
      if fileExists(candidate) and not dirExists(candidate): return candidate
  raiseOSError(OSErrorCode(2)) # ERROR_FILE_NOT_FOUND; never consult the owner's PATH.
proc windowsNote(child: ManagedProcess, message: string) =
  if child.onNote != nil: child.onNote(message)
proc beginWindowsStop(child: ManagedProcess) =
  if child.stopping or child.exit.finished: return
  child.stopping = true
  var error: culong
  if nativeStop(child.nativeProcess,addr error) == 0: raiseOSError(OSErrorCode(error))
  # Windows has no argv-only POSIX TERM grace. Terminate the owned job directly.
  child.status.signal = some("SIGTERM")
  child.status.signalNumber = 15
  child.windowsNote("stopping pid=" & $child.pid & " (terminate owned Windows job)")
proc drainWindows(child: ManagedProcess, streamId: cint, fd: var cint,
    decoder: var ProcessLines, stream: string) =
  if fd < 0: return
  var buffer: array[8192,char]
  var total = 0
  while total < 65536:
    var count, error: culong
    let status = nativeRead(child.nativeProcess,streamId,addr buffer[0],culong(buffer.len),addr count,addr error)
    if status < 0:
      fd = -1
      raiseOSError(OSErrorCode(error))
    var bytes = newString(int(count))
    if count > 0: copyMem(addr bytes[0],addr buffer[0],int(count))
    if count > 0 and child.onData != nil and child.status.error == "": child.onData(stream,bytes)
    let lines = decoder.feed(bytes,stream,eof=status == 1)
    if status == 1: fd = -1
    for line in lines:
      if child.onLine != nil and child.status.error == "": child.onLine(line)
    if count == 0: return
    total += int(count)
proc pumpWindows(manager: ProcessManager) {.async.} =
  await sleepAsync(0)
  try:
    while manager.children.len > 0:
      var children: seq[ManagedProcess]
      for child in manager.children.values: children.add(child)
      for child in children:
        try:
          if interruptedSignal() != 0 or (child.signal != nil and child.signal.cancelled): child.beginWindowsStop()
          child.drainWindows(0,child.stdoutFd,child.stdoutLines,"stdout")
          child.drainWindows(1,child.stderrFd,child.stderrLines,"stderr")
        except CatchableError as error:
          child.status.error = error.msg
          child.status.errorCode = "capture"
          child.onLine = nil; child.onData = nil; child.onNote = nil
          child.beginWindowsStop()
        var code, active, error: culong
        let status = nativePoll(child.nativeProcess,addr code,addr active,addr error)
        if status < 0:
          child.status.error = "Unable to observe owned Windows job: " & osErrorMsg(OSErrorCode(error))
          child.status.errorCode = "process_job"
          child.beginWindowsStop()
          continue
        if status == 1:
          if child.status.signal.isNone: child.status.code = some(int(code))
          # A leader can exit while descendants retain pipes or continue silently.
          # The still-owned job handle is safe even after a PID is reused.
          if active > 0:
            if nativeStop(child.nativeProcess,addr error) == 0: raiseOSError(OSErrorCode(error))
          elif child.stdoutFd < 0 and child.stderrFd < 0:
            child.exited = true
            manager.children.del(child.pid)
            windowsLive.del(child.pid)
            nativeRelease(child.nativeProcess)
            child.nativeProcess = nil
            try: child.windowsNote("process " & $child.pid & " exited")
            except CatchableError as error: child.status.error = error.msg
            child.exit.complete(child.status)
      if manager.children.len > 0: await sleepAsync(5)
  finally: manager.pumping = false
proc stop*(child: ManagedProcess): Future[void] =
  if child.stopFuture == nil:
    child.stopFuture = newFuture[void]("Managed Windows process stop")
    child.beginWindowsStop()
    child.exit.addCallback(proc() = child.stopFuture.complete())
  child.stopFuture
proc spawnManaged*(manager: ProcessManager, command: string, args: seq[string] = @[], cwd = "",
    env: StringTableRef = nil, signal: ProcessCancel = nil, graceMs = 3000,
    onLine: proc(line: ProcessLine) {.closure.} = nil,
    onData: proc(stream, bytes: string) {.closure.} = nil,
    onNote: proc(line: string) {.closure.} = nil): ManagedProcess =
  if manager.closed: raise newException(ValueError,"Process manager is closed")
  if graceMs < 0: raise newException(ValueError,"Process grace must be nonnegative")
  let cmd = windowsBytes(command)
  if cmd == "": raise newException(ValueError,"Child command must not be empty")
  var arguments = @[windowsQuoted(cmd)]
  for arg in args: arguments.add(windowsQuoted(windowsBytes(arg)))
  let base = windowsBytes(if cwd == "": getCurrentDir() else: absolutePath(cwd))
  let environment = newStringTable(modeCaseInsensitive)
  for key,value in windowsEnvironmentPairs(): environment[key] = value
  if env != nil:
    for key,value in env:
      if '=' in key or key == "": raise newException(ValueError,"Invalid child environment name")
      environment[windowsBytes(key)] = windowsBytes(value)
  var entries: seq[string]
  for key,value in environment: entries.add(windowsBytes(key & "=" & value))
  let envC = allocCStringArray(entries)
  defer: deallocCStringArray(envC)
  result = ManagedProcess(manager: manager,exit: newFuture[ProcessExit]("Managed Windows process exit"),
    stdoutFd: 0,stderrFd: 0,signal: signal,graceMs: graceMs,onLine: onLine,onData: onData,onNote: onNote)
  var pid, error: culong
  try:
    let executable = windowsExecutable(cmd,base,environment)
    result.nativeProcess = nativeSpawn(cstring(executable),cstring(arguments.join(" ")),cstring(base),envC,csize_t(entries.len),addr pid,addr error)
    if result.nativeProcess == nil: raiseOSError(OSErrorCode(error))
  except OSError as error:
    let name = case error.errorCode
      of 2,3: "ENOENT"
      of 5: "EACCES"
      of 267: "ENOTDIR"
      of 193: "ENOEXEC"
      else: "WIN32_" & $error.errorCode
    result.exited = true
    result.status = ProcessExit(code: some(-1),error: "spawn " & cmd & " " & name,errorCode: name)
    result.windowsNote("spawn failed: " & result.status.error)
    result.exit.complete(result.status)
    return
  result.pid = int(pid)
  manager.children[result.pid] = result
  windowsLive[result.pid] = result
  if not windowsExitHooked: addExitProc(cleanupWindowsAtExit); windowsExitHooked = true
  if not manager.pumping:
    manager.pumping = true
    asyncCheck manager.pumpWindows()
  result.windowsNote("spawned pid=" & $result.pid & ": " & command)
  if signal != nil and signal.cancelled: result.beginWindowsStop()
proc close*(manager: ProcessManager): Future[void] {.async.} =
  if manager == nil: return
  manager.closed = true
  var pending: seq[Future[void]]
  for child in manager.children.values: pending.add(child.stop())
  for task in pending: await task
