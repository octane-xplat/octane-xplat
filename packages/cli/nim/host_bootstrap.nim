## macOS lifetime lock and explicit detached daemon launch.
## A published daemon is not a disposable child of the invoking CLI process.
import std/[asyncdispatch, os, options, strtabs]
import ./js_text

type
  HostLock* = ref object
    fd: cint
    owned: bool
  DetachedLaunch* = ref object
    processId: int
    owned, finished: bool
    code: Option[int]

proc pid*(launch: DetachedLaunch): int =
  if launch == nil: 0 else: launch.processId
proc exitCode*(launch: DetachedLaunch): Option[int] =
  if launch == nil: none(int) else: launch.code

when defined(macosx):
  import std/posix
  var openNoFollow {.importc: "O_NOFOLLOW", header: "<fcntl.h>".}: cint
  var openCloseExec {.importc: "O_CLOEXEC", header: "<fcntl.h>".}: cint
  var duplicateCloseExec {.importc: "F_DUPFD_CLOEXEC", header: "<fcntl.h>".}: cint
  var lockExclusive {.importc: "LOCK_EX", header: "<sys/file.h>".}: cint
  var lockNonblocking {.importc: "LOCK_NB", header: "<sys/file.h>".}: cint
  var spawnCloseDefault {.importc: "POSIX_SPAWN_CLOEXEC_DEFAULT", header: "<spawn.h>".}: cint
  var spawnSession {.importc: "POSIX_SPAWN_SETSID", header: "<spawn.h>".}: cint
  proc fileLock(fd, operation: cint): cint {.importc: "flock", header: "<sys/file.h>".}
  proc addChdir(actions: var Tposix_spawn_file_actions, path: cstring): cint {.
    importc: "posix_spawn_file_actions_addchdir_np", header: "<spawn.h>".}

  proc osBytes(value: string): string =
    if '\0' in value: raise newException(ValueError,"Host bootstrap path or argument contains NUL")
    utf8ForWrite(value)
  proc privateFile(path: string, flags: cint): cint =
    result = posix.open(cstring(osBytes(path)),flags or openNoFollow or openCloseExec,Mode(0o600))
    if result < 0: raiseOSError(osLastError())
    var info: Stat
    if fstat(result,info) != 0:
      let error = osLastError()
      discard posix.close(result)
      raiseOSError(error)
    if not S_ISREG(info.st_mode) or info.st_uid != geteuid() or (info.st_mode and Mode(0o077)) != Mode(0):
      discard posix.close(result)
      raise newException(OSError,"Native host files must be private regular files owned by the current user")

  proc tryHostLock*(path: string): HostLock =
    let fd = privateFile(path,O_RDWR or O_CREAT)
    if fileLock(fd,lockExclusive or lockNonblocking) == 0: return HostLock(fd: fd,owned: true)
    let error = osLastError()
    discard posix.close(fd)
    if error == OSErrorCode(EWOULDBLOCK) or error == OSErrorCode(EAGAIN): return nil
    raiseOSError(error)
  proc closeHostLock*(lock: HostLock) =
    if lock != nil and lock.owned:
      lock.owned = false
      discard posix.close(lock.fd) # Keep the lockfile inode; future owners reuse it.

  proc check(code: cint) =
    if code != 0: raiseOSError(OSErrorCode(code))
  proc launchDetached*(executable: string, args: seq[string], cwd, logPath: string,
      environment: StringTableRef): DetachedLaunch =
    if not isAbsolute(executable) or not isAbsolute(cwd):
      raise newException(ValueError,"Detached host executable and cwd must be absolute")
    if environment == nil: raise newException(ValueError,"Detached host environment must be explicit")
    var argv = @[osBytes(executable)]
    for arg in args: argv.add(osBytes(arg))
    var env: seq[string]
    for key,value in environment:
      if '=' in key: raise newException(ValueError,"Environment names cannot contain equals")
      env.add(osBytes(key) & "=" & osBytes(value))
    let childCwd = osBytes(cwd)
    var log = privateFile(logPath,O_WRONLY or O_CREAT or O_APPEND)
    if log <= 2:
      let moved = fcntl(log,duplicateCloseExec,cint(3))
      let error = osLastError()
      discard posix.close(log)
      if moved < 0: raiseOSError(error)
      log = moved
    defer: discard posix.close(log)
    var actions: Tposix_spawn_file_actions
    check posix_spawn_file_actions_init(actions)
    defer: discard posix_spawn_file_actions_destroy(actions)
    var attributes: Tposix_spawnattr
    check posix_spawnattr_init(attributes)
    defer: discard posix_spawnattr_destroy(attributes)
    var defaults, mask: Sigset
    check sigemptyset(mask)
    check sigfillset(defaults)
    check sigdelset(defaults,SIGKILL)
    check sigdelset(defaults,SIGSTOP)
    check posix_spawnattr_setsigmask(attributes,mask)
    check posix_spawnattr_setsigdefault(attributes,defaults)
    check posix_spawnattr_setflags(attributes,spawnSession or spawnCloseDefault or POSIX_SPAWN_SETSIGMASK or POSIX_SPAWN_SETSIGDEF)
    check addChdir(actions,cstring(childCwd))
    check posix_spawn_file_actions_addopen(actions,0,"/dev/null",O_RDONLY,Mode(0))
    check posix_spawn_file_actions_adddup2(actions,log,1)
    check posix_spawn_file_actions_adddup2(actions,log,2)
    if log > 2: check posix_spawn_file_actions_addclose(actions,log)
    let argvC = allocCStringArray(argv)
    defer: deallocCStringArray(argvC)
    let envC = allocCStringArray(env)
    defer: deallocCStringArray(envC)
    var pid: Pid
    check posix_spawn(pid,cstring(osBytes(executable)),actions,attributes,argvC,envC)
    DetachedLaunch(processId: int(pid),owned: true,code: none(int))

  proc pollLaunch*(launch: DetachedLaunch): bool =
    if launch == nil or not launch.owned or launch.processId <= 0 or launch.finished: return true
    var status: cint
    while true:
      let waited = waitpid(Pid(launch.pid),status,WNOHANG)
      if waited == 0: return false
      if waited == Pid(launch.pid):
        launch.finished = true
        launch.code = some(if WIFEXITED(status): int(WEXITSTATUS(status)) else: 128+int(WTERMSIG(status)))
        return true
      let error = osLastError()
      if error == OSErrorCode(EINTR): continue
      # A PID no longer owned as our child must never be signalled from a descriptor.
      if error == OSErrorCode(ECHILD): launch.finished = true; return true
      raiseOSError(error)
  proc signalLaunch(launch: DetachedLaunch, signal: cint) =
    if launch.pollLaunch(): return
    if posix.kill(Pid(-launch.pid),signal) < 0 and errno != ESRCH: raiseOSError(osLastError())
  proc stopUnpublishedLaunch*(launch: DetachedLaunch, graceMs = 500): Future[void] {.async.} =
    if launch.pollLaunch(): return
    launch.signalLaunch(SIGTERM)
    var waited = 0
    while not launch.pollLaunch() and waited < graceMs:
      await sleepAsync(5)
      waited += 5
    if not launch.pollLaunch(): launch.signalLaunch(SIGKILL)
    while not launch.pollLaunch(): await sleepAsync(5)
else:
  proc tryHostLock*(path: string): HostLock = raise newException(OSError,"Native host bootstrap is not implemented on this host")
  proc closeHostLock*(lock: HostLock) = discard
  proc launchDetached*(executable: string, args: seq[string], cwd, logPath: string, environment: StringTableRef): DetachedLaunch =
    raise newException(OSError,"Native host bootstrap is not implemented on this host")
  proc pollLaunch*(launch: DetachedLaunch): bool = true
  proc stopUnpublishedLaunch*(launch: DetachedLaunch, graceMs = 500): Future[void] {.async.} = discard
