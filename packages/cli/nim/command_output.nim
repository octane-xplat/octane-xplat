## Bounded argv-only capture for short control probes such as git freshness.
## Long-lived tools, process-tree ownership and Windows capture are separate
## process-runtime work; callers must handle an unavailable probe honestly.
import std/[os, osproc, streams, monotimes, times, strtabs, strutils]
when defined(posix): import std/posix

type CommandOutput* = object
  output*, error*: string
  exitCode*: int
  timedOut*: bool

proc captureCommand*(command: string, args: seq[string], cwd = "", timeoutMs = 5000,
    maxBytes = 1024*1024, environment: StringTableRef = nil): CommandOutput =
  when defined(posix):
    var executable = command
    var options = {poUsePath}
    if environment != nil and environment.hasKey("PATH"):
      # posix_spawnp can search the parent's PATH even when envp supplies a
      # different one. Resolve against the supplied PATH and child cwd first.
      options = {}
      if '/' notin command:
        executable = ""
        let base = if cwd == "": getCurrentDir() else: absolutePath(cwd)
        for directory in environment["PATH"].split(PathSep):
          let candidate = absolutePath((if directory == "": "." else: directory) / command,base)
          if access(cstring(candidate),X_OK) == 0 and not dirExists(candidate):
            executable = candidate
            break
        if executable == "": raise newException(OSError,"Command is not available on the supplied PATH")
    let child = startProcess(executable,workingDir=cwd,args=args,env=environment,options=options)
    defer:
      if child.running():
        child.kill()
        discard child.waitForExit()
      child.close()
    child.inputStream().close()
    let outputFd = cint(child.outputHandle())
    let errorFd = cint(child.errorHandle())
    for fd in [outputFd,errorFd]:
      let flags = fcntl(fd,F_GETFL)
      if flags < 0 or fcntl(fd,F_SETFL,flags or O_NONBLOCK) < 0: raiseOSError(osLastError())
    var outputOpen = true
    var errorOpen = true
    let started = getMonoTime()
    proc drain(fd: cint, target: var string, opened: var bool) =
      var buffer: array[8192,char]
      while opened:
        let count = posix.read(fd,addr buffer[0],buffer.len)
        if count > 0:
          if target.len+count > maxBytes: raise newException(IOError,"Command output exceeds limit")
          let previous = target.len
          target.setLen(previous+count)
          copyMem(addr target[previous],addr buffer[0],count)
        elif count == 0: opened = false
        elif errno == EINTR: continue
        elif errno in [EAGAIN,EWOULDBLOCK]: break
        else: raiseOSError(osLastError())
    while true:
      drain(outputFd,result.output,outputOpen)
      drain(errorFd,result.error,errorOpen)
      result.exitCode = child.peekExitCode()
      if result.exitCode >= 0 and not outputOpen and not errorOpen: break
      let elapsed = (getMonoTime()-started).inMilliseconds()
      if elapsed >= timeoutMs:
        result.timedOut = true
        if child.running(): child.kill()
        result.exitCode = child.waitForExit()
        break
      var fds = [TPollfd(fd: (if outputOpen: outputFd else: -1),events: POLLIN),
        TPollfd(fd: (if errorOpen: errorFd else: -1),events: POLLIN)]
      let status = posix.poll(addr fds[0],Tnfds(fds.len),cint(min(25,timeoutMs-int(elapsed))))
      if status < 0 and errno != EINTR: raiseOSError(osLastError())
  else:
    raise newException(OSError,"Bounded control-probe capture is not yet available on this host")
