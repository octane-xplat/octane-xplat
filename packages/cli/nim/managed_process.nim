## Owned argv-only POSIX children; no shell or JS runtime bridge.
## Completion includes pipe EOF; stop still owns the group after its leader exits.
import std/[asyncdispatch, os, strtabs, strutils, tables, options, monotimes, times, exitprocs]
import ./process_lines, ./js_text
export process_lines

type
  ProcessCancel* = ref object
    cancelled*: bool
  ProcessExit* = object
    code*: Option[int]
    signal*: Option[string]
    error*, errorCode*: string
    signalNumber: int
  ProcessManager* = ref object
    children: Table[int, ManagedProcess]
    closed, pumping: bool
  ManagedProcess* = ref object
    pid*: int
    exit*: Future[ProcessExit]
    manager: ProcessManager
    stdoutFd, stderrFd: cint
    stdoutLines, stderrLines: ProcessLines
    exited, stopping, escalated: bool
    status: ProcessExit
    stopAt: MonoTime
    graceMs: int
    signal: ProcessCancel
    onLine: proc(line: ProcessLine) {.closure.}
    onData: proc(stream, bytes: string) {.closure.}
    onNote: proc(line: string) {.closure.}
    stopFuture: Future[void]

proc newProcessCancel*(): ProcessCancel = ProcessCancel()
proc cancel*(signal: ProcessCancel) =
  if signal != nil: signal.cancelled = true
proc exitStatus*(status: ProcessExit): int =
  if status.code.isSome: status.code.get()
  elif status.signal.isSome: 128+status.signalNumber
  else: 1
proc newProcessManager*(): ProcessManager =
  discard getGlobalDispatcher()
  ProcessManager()

when defined(macosx) or defined(linux):
  import std/posix
  {.compile: "process_group.c".}
  when defined(macosx):
    import ./process_spawn_macos
    {.compile: "process_group_macos.c".}
  else:
    import ./process_spawn_linux
    {.compile: "process_group_linux.c".}
  const groupHeader = currentSourcePath().parentDir / "process_group.h"
  proc exitObserved(pid: cint): cint {.importc: "xplat_exit_observed", header: groupHeader.}
  proc groupDescendants(pid: cint): cint {.importc: "xplat_group_descendants", header: groupHeader.}
  var live: Table[int, ManagedProcess]
  var exitHooked = false
  var interrupted {.volatile.}: cint
  proc signalReceived(signal: cint) {.noconv, raises: [], stackTrace: off.} = interrupted = signal
  proc interruptedSignal*(): int = int(interrupted)
  proc installProcessSignalHandlers*() =
    ## Explicit opt-in by the runtime owner; the handler only records a flag.
    discard posix.signal(SIGINT,signalReceived)
    discard posix.signal(SIGTERM,signalReceived)
  proc closeFd(fd: var cint) =
    if fd >= 0: discard posix.close(fd); fd = -1
  proc signalGroup(child: ManagedProcess, signal: cint) =
    if child.pid <= 0: return
    if posix.kill(Pid(-child.pid),signal) < 0 and errno != ESRCH:
      if not child.exited: discard posix.kill(Pid(child.pid),signal)
  proc cleanupAtExit() {.noconv.} =
    for child in live.values: child.signalGroup(SIGKILL)
    for child in live.values:
      if not child.exited:
        var status: cint
        while waitpid(Pid(child.pid),status,0) < 0 and errno == EINTR: discard
      child.stdoutFd.closeFd()
      child.stderrFd.closeFd()
  proc spawnCheck(code: cint) =
    if code != 0: raiseOSError(OSErrorCode(code))
  proc byteText(value: string): string =
    if '\0' in value: raise newException(ValueError,"Child arguments and environment must not contain NUL")
    utf8ForWrite(value)
  proc makePipe(): array[2,cint] =
    result = [-1.cint,-1.cint]
    if posix.pipe(result) != 0: raiseOSError(osLastError())
    try:
      for index in 0..1:
        # Keep spawn-action sources away from stdin/stdout/stderr, even if
        # one of those descriptors was closed by the native caller.
        if result[index] <= 2:
          let moved = fcntl(result[index],F_DUPFD,3)
          if moved < 0: raiseOSError(osLastError())
          discard posix.close(result[index])
          result[index] = moved
        if fcntl(result[index],F_SETFD,FD_CLOEXEC) < 0: raiseOSError(osLastError())
      let flags = fcntl(result[0],F_GETFL)
      if flags < 0 or fcntl(result[0],F_SETFL,flags or O_NONBLOCK) < 0: raiseOSError(osLastError())
    except CatchableError:
      for fd in result.mitems: fd.closeFd()
      raise
  proc resolveCommand(command, cwd: string, env: StringTableRef): string =
    if '/' in command: return absolutePath(command,cwd)
    var denied = false
    for directory in env.getOrDefault("PATH","/usr/bin:/bin").split(':'):
      let candidate = absolutePath((if directory == "": "." else: directory) / command,cwd)
      if access(cstring(candidate),X_OK) == 0 and not dirExists(candidate): return candidate
      if errno == EACCES or dirExists(candidate): denied = true
    raiseOSError(OSErrorCode(if denied: EACCES else: ENOENT))
  proc launch(command: string, args: seq[string], cwd: string, env: StringTableRef): tuple[pid: int, output,error: cint] =
    let executable = resolveCommand(command,cwd,env)
    var output = makePipe()
    defer:
      for fd in output.mitems: fd.closeFd()
    var error = makePipe()
    defer:
      for fd in error.mitems: fd.closeFd()
    var actions: Tposix_spawn_file_actions
    spawnCheck posix_spawn_file_actions_init(actions)
    defer: discard posix_spawn_file_actions_destroy(actions)
    var attributes: Tposix_spawnattr
    spawnCheck posix_spawnattr_init(attributes)
    defer: discard posix_spawnattr_destroy(attributes)
    var defaults, mask: Sigset
    spawnCheck sigemptyset(mask)
    spawnCheck sigfillset(defaults)
    spawnCheck sigdelset(defaults,SIGKILL)
    spawnCheck sigdelset(defaults,SIGSTOP)
    spawnCheck posix_spawnattr_setsigmask(attributes,mask)
    spawnCheck posix_spawnattr_setsigdefault(attributes,defaults)
    spawnCheck posix_spawnattr_setflags(attributes,nativeSpawnFlags() or POSIX_SPAWN_SETSIGMASK or POSIX_SPAWN_SETSIGDEF)
    spawnCheck addWorkingDirectory(actions,cstring(cwd))
    spawnCheck posix_spawn_file_actions_addopen(actions,0,"/dev/null",O_RDONLY,Mode(0))
    spawnCheck posix_spawn_file_actions_adddup2(actions,output[1],1)
    spawnCheck posix_spawn_file_actions_adddup2(actions,error[1],2)
    for fd in [output[0],output[1],error[0],error[1]]:
      spawnCheck posix_spawn_file_actions_addclose(actions,fd)
    spawnCheck closeUnlistedDescriptors(actions)
    var argv = @[command] & args
    var envp: seq[string]
    for key,value in env: envp.add(key & "=" & value)
    let argvC = allocCStringArray(argv)
    defer: deallocCStringArray(argvC)
    let envC = allocCStringArray(envp)
    defer: deallocCStringArray(envC)
    var pid: Pid
    spawnCheck posix_spawn(pid,cstring(executable),actions,attributes,argvC,envC)
    result = (int(pid),output[0],error[0])
    output[0] = -1; error[0] = -1
  proc signalName(signal: cint): string =
    for (number,name) in [(SIGHUP,"SIGHUP"),(SIGINT,"SIGINT"),(SIGQUIT,"SIGQUIT"),(SIGILL,"SIGILL"),
      (SIGTRAP,"SIGTRAP"),(SIGABRT,"SIGABRT"),(SIGFPE,"SIGFPE"),(SIGKILL,"SIGKILL"),(SIGBUS,"SIGBUS"),
      (SIGSEGV,"SIGSEGV"),(SIGPIPE,"SIGPIPE"),(SIGALRM,"SIGALRM"),(SIGTERM,"SIGTERM"),(SIGUSR1,"SIGUSR1"),
      (SIGUSR2,"SIGUSR2"),(SIGXCPU,"SIGXCPU"),(SIGXFSZ,"SIGXFSZ"),(SIGSYS,"SIGSYS"),(SIGPROF,"SIGPROF"),
      (SIGVTALRM,"SIGVTALRM")]:
      if number == signal: return name
    "SIG" & $signal
  proc note(child: ManagedProcess, line: string) =
    if child.onNote != nil:
      try: child.onNote(line)
      except CatchableError as error:
        child.status.error = error.msg
        child.status.errorCode = "capture"
        child.onNote = nil
        child.graceMs = 0
        child.stopping = true
        child.stopAt = getMonoTime()
        child.signalGroup(SIGKILL)
  proc beginStop(child: ManagedProcess) =
    if child.stopping or child.exit.finished: return
    child.stopping = true
    child.stopAt = getMonoTime()+initDuration(milliseconds=child.graceMs)
    child.signalGroup(SIGTERM)
    child.note("stopping pid=" & $child.pid & " (SIGTERM, SIGKILL after " & $child.graceMs & "ms)")
  proc drain(child: ManagedProcess, fd: var cint, decoder: var ProcessLines, stream: string) =
    if fd < 0: return
    var buffer: array[8192,char]
    var total = 0
    while total < 65536:
      let count = posix.read(fd,addr buffer[0],buffer.len)
      if count < 0:
        if errno == EINTR: continue
        if errno == EAGAIN or errno == EWOULDBLOCK: return
        let code = osLastError()
        fd.closeFd()
        raiseOSError(code)
      var bytes = newString(max(0,count))
      if count > 0: copyMem(addr bytes[0],addr buffer[0],count)
      if count > 0 and child.onData != nil and child.status.error == "": child.onData(stream,bytes)
      let lines = decoder.feed(bytes,stream,eof=count == 0)
      if count == 0: fd.closeFd()
      for line in lines:
        if child.onLine != nil and child.status.error == "": child.onLine(line)
      if count == 0: return
      total += count
  proc pump(manager: ProcessManager) {.async.} =
    # Let spawnManaged return its handle before user callbacks can run.
    await sleepAsync(0)
    try:
      while manager.children.len > 0:
        var children: seq[ManagedProcess]
        for child in manager.children.values: children.add(child)
        for child in children:
          try:
            if interrupted != 0 or (child.signal != nil and child.signal.cancelled): child.beginStop()
            if child.stopping and not child.escalated and getMonoTime() >= child.stopAt:
              child.escalated = true
              child.signalGroup(SIGKILL)
              child.note("pid=" & $child.pid & " did not exit within " & $child.graceMs & "ms — SIGKILL")
            child.drain(child.stdoutFd,child.stdoutLines,"stdout")
            child.drain(child.stderrFd,child.stderrLines,"stderr")
          except CatchableError as error:
            child.status.error = error.msg
            child.status.errorCode = "capture"
            child.onLine = nil; child.onNote = nil; child.onData = nil
            child.graceMs = 0
            child.beginStop()
            child.signalGroup(SIGKILL)
          # Keep the leader unreaped while inherited pipes remain open. Its
          # reserved PID protects group identity during delayed escalation,
          # including when an escaped descendant still holds a pipe.
          if not child.exited and child.stdoutFd < 0 and child.stderrFd < 0:
            let observed = exitObserved(cint(child.pid))
            if observed == 0: continue
            if observed > 0:
              # Reserve the terminal leader's PID while releasing descendants.
              # kill(2) returning does not establish their exit or OS reaping.
              child.signalGroup(SIGKILL)
              let remaining = groupDescendants(cint(child.pid))
              if remaining != 0:
                if remaining < 0:
                  child.status.error = "Unable to observe owned process group: " & osErrorMsg(osLastError())
                  child.status.errorCode = "process_group"
                continue
            var status: cint
            let waited = waitpid(Pid(child.pid),status,WNOHANG)
            if waited > 0:
              child.exited = true
              if WIFEXITED(status): child.status.code = some(int(WEXITSTATUS(status)))
              elif WIFSIGNALED(status):
                child.status.signalNumber = int(WTERMSIG(status))
                child.status.signal = some(signalName(WTERMSIG(status)))
            elif waited < 0 and errno != EINTR:
              child.exited = true
              child.status.error = "Unable to reap owned child"
              child.status.errorCode = "waitpid"
          if child.exited and child.stdoutFd < 0 and child.stderrFd < 0:
            manager.children.del(child.pid)
            live.del(child.pid)
            try:
              child.note("process " & $child.pid & " exited (code=" & (if child.status.code.isSome: $child.status.code.get() else: "null") &
                (if child.status.signal.isSome: ", signal=" & child.status.signal.get() else: "") & ")")
            except CatchableError as error: child.status.error = error.msg
            child.exit.complete(child.status)
        if manager.children.len > 0: await sleepAsync(5)
    finally: manager.pumping = false
  proc stop*(child: ManagedProcess): Future[void] =
    if child.stopFuture == nil:
      child.stopFuture = newFuture[void]("Managed process stop")
      child.beginStop()
      child.exit.addCallback(proc() = child.stopFuture.complete())
    child.stopFuture
  proc spawnManaged*(manager: ProcessManager, command: string, args: seq[string] = @[], cwd = "",
      env: StringTableRef = nil, signal: ProcessCancel = nil, graceMs = 3000,
      onLine: proc(line: ProcessLine) {.closure.} = nil,
      onData: proc(stream, bytes: string) {.closure.} = nil,
      onNote: proc(line: string) {.closure.} = nil): ManagedProcess =
    if manager.closed: raise newException(ValueError,"Process manager is closed")
    if graceMs < 0: raise newException(ValueError,"Process grace must be nonnegative")
    let cmd = byteText(command)
    if cmd == "": raise newException(ValueError,"Child command must not be empty")
    var argv: seq[string]
    for arg in args: argv.add(byteText(arg))
    let base = byteText(if cwd == "": getCurrentDir() else: absolutePath(cwd))
    let environment = newStringTable(modeCaseSensitive)
    for key,value in envPairs(): environment[key] = value
    if env != nil:
      for key,value in env:
        if '=' in key or key == "": raise newException(ValueError,"Invalid child environment name")
        environment[byteText(key)] = byteText(value)
    result = ManagedProcess(manager: manager,exit: newFuture[ProcessExit]("Managed process exit"),
      stdoutFd: -1,stderrFd: -1,signal: signal,graceMs: graceMs,onLine: onLine,onData: onData,onNote: onNote)
    try:
      let launched = launch(cmd,argv,base,environment)
      result.pid = launched.pid; result.stdoutFd = launched.output; result.stderrFd = launched.error
    except OSError as error:
      result.exited = true
      var code = "spawn"
      for (number,name) in [(ENOENT,"ENOENT"),(EACCES,"EACCES"),(ENOTDIR,"ENOTDIR"),(ENOEXEC,"ENOEXEC"),
        (EMFILE,"EMFILE"),(ENFILE,"ENFILE"),(EAGAIN,"EAGAIN"),(E2BIG,"E2BIG"),(EINVAL,"EINVAL"),
        (ENAMETOOLONG,"ENAMETOOLONG"),(ELOOP,"ELOOP"),(ENOMEM,"ENOMEM"),(ETXTBSY,"ETXTBSY"),(EIO,"EIO")]:
        if int(number) == error.errorCode: code = name; break
      # Node emits only these errors asynchronously; other launch failures
      # throw before spawnManaged can return or register ownership.
      if code notin ["ENOENT","EACCES","EAGAIN","EMFILE","ENFILE"]:
        raise newException(OSError,"spawn " & code)
      result.status = ProcessExit(code: some(-1),error: "spawn " & cmd & " " & code,errorCode: code)
      result.note("spawn failed: " & result.status.error)
      result.exit.complete(result.status)
      return
    manager.children[result.pid] = result
    live[result.pid] = result
    if not exitHooked: addExitProc(cleanupAtExit); exitHooked = true
    result.note("spawned pid=" & $result.pid & ": " & command & (if args.len == 0: "" else: " " & args.join(" ")))
    if signal != nil and signal.cancelled: result.beginStop()
    if not manager.pumping:
      manager.pumping = true
      asyncCheck manager.pump()
  proc close*(manager: ProcessManager): Future[void] {.async.} =
    if manager == nil: return
    manager.closed = true
    var pending: seq[Future[void]]
    for child in manager.children.values: pending.add(child.stop())
    for task in pending: await task
else:
  proc interruptedSignal*(): int = 0
  proc installProcessSignalHandlers*() = raise newException(OSError,"Managed processes are not yet implemented on this host")
  proc stop*(child: ManagedProcess): Future[void] {.async.} = raise newException(OSError,"Managed processes are not yet implemented on this host")
  proc close*(manager: ProcessManager): Future[void] {.async.} = discard
  proc spawnManaged*(manager: ProcessManager, command: string, args: seq[string] = @[], cwd = "",
      env: StringTableRef = nil, signal: ProcessCancel = nil, graceMs = 3000,
      onLine: proc(line: ProcessLine) {.closure.} = nil,
      onData: proc(stream, bytes: string) {.closure.} = nil,
      onNote: proc(line: string) {.closure.} = nil): ManagedProcess =
    raise newException(OSError,"Managed processes are not yet implemented on this host")
