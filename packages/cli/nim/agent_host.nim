## Native persistent owner. Authentication/publication precede runtime composition.
import std/[asyncdispatch, asyncnet, nativesockets, os, json, strutils, monotimes, times]
import ./host_storage, ./host_bootstrap, ./unix_rpc, ./native_identity
import ./jobs, ./sessions, ./managed_process, ./contract_failure, ./jsonutil, ./json_wire
when defined(macosx): import std/posix

type
  NativeHost* = ref object
    jobs*: JobRegistry
    sessions*: SessionRegistry
    generation*: string
    closing: bool
    touched: MonoTime
    active: int
    cleanups: seq[proc(): Future[void] {.closure.}]
  NativeHostDispatch* = proc(host: NativeHost, request: JsonNode): Future[JsonNode] {.closure.}

proc addHostCleanup*(host: NativeHost, cleanup: proc(): Future[void] {.closure.}) =
  if host.closing: raise contractFailure("unavailable","The native host is shutting down.")
  host.cleanups.add(cleanup)

proc closeHostServices(host: NativeHost): Future[void] {.async.} =
  var failure: ref CatchableError
  for cleanup in host.cleanups:
    try: await cleanup()
    except CatchableError as error:
      if failure == nil: failure = error
  host.cleanups.setLen(0)
  if failure != nil: raise failure

proc sameToken(actual, expected: string): bool =
  if actual.len != expected.len: return false
  var difference = 0
  for index in 0..<expected.len: difference = difference or (ord(actual[index]) xor ord(expected[index]))
  difference == 0

proc hasLiveWork(host: NativeHost): bool =
  if host.active > 0: return true
  for job in host.jobs.listJobs():
    if text(job["state"]) in ["queued","running","cancelling"]: return true
  for session in host.sessions.listSessions():
    if text(session["state"]) notin ["stopped","failed"] or host.sessions.cleanupPending(text(session["sessionId"])): return true

proc removeStaleSocket(path: string): Future[void] {.async.} =
  when defined(macosx):
    var info: Stat
    if lstat(cstring(path),info) != 0:
      if errno == ENOENT: return
      raiseOSError(osLastError())
    if not S_ISSOCK(info.st_mode) or info.st_uid != geteuid():
      raise newException(OSError,"Preserving a foreign native host socket path")
    let owned = getFileInfo(path,followSymlink=false).id
    let socket = newAsyncSocket(nativesockets.AF_UNIX,nativesockets.SOCK_STREAM,nativesockets.IPPROTO_IP,buffered=false)
    try:
      let pending = socket.connectUnix(path)
      if not await withTimeout(pending,250):
        raise newException(OSError,"Existing native host listener could not be identified; preserving its socket")
      await pending
      raise newException(ValueError,"An existing listener owns the native host socket")
    except OSError as error:
      if error.errorCode notin [ECONNREFUSED,ENOENT]: raise
      removeHostFile(path,owned)
    finally:
      try: socket.close()
      except CatchableError: discard

proc dispatchBase(host: NativeHost, request, identity: JsonNode, paths: HostPaths,
    startedAt: string, extension: NativeHostDispatch): Future[JsonNode] {.async.} =
  let methodName = text(request["method"])
  let params = request["params"]
  case methodName
  of "host.ping": return %*{"identity": identity,"pid": getCurrentProcessId(),"startedAt": startedAt,"workspaceRoot": paths.workspace,"ownerId": host.generation}
  of "host.shutdown":
    host.closing = true
    return %*{"stopping": true}
  of "sessions.list": return %*{"sessions": host.sessions.listSessions()}
  of "sessions.get", "session.end":
    let id = field(params,"sessionId")
    if id == nil or id.kind != JString or id.getStr().len == 0: raise contractFailure("invalid_selection","A sessionId is required.")
    let session = host.sessions.getSession(id.getStr())
    if session.kind == JNull: raise contractFailure("not_found","No session \"" & id.getStr() & "\".")
    if methodName == "session.end":
      for job in host.jobs.listJobs():
        if field(job,"sessionId") == id:
          discard host.jobs.cancelJob(text(job["jobId"]))
          discard await host.jobs.waitJob(text(job["jobId"]))
      return %*{"result": await host.sessions.endSession(id.getStr())}
    return %*{"session": session}
  of "jobs.status", "jobs.cancel":
    let id = field(params,"jobId")
    if id == nil or id.kind != JString or id.getStr().len == 0: raise contractFailure("invalid_selection","A jobId is required.")
    let job = if methodName == "jobs.cancel": host.jobs.cancelJob(id.getStr()) else: host.jobs.jobStatus(id.getStr())
    if job.kind == JNull: raise contractFailure("not_found","No job \"" & id.getStr() & "\".")
    return %*{"job": job}
  else:
    if extension != nil: return await extension(host,request.copy())
    raise contractFailure("invalid_selection","Unknown host method \"" & methodName & "\".")

proc runNativeHost*(workspace: string, identity: JsonNode, extension: NativeHostDispatch = nil,
    idleMs = 120000): Future[void] {.async.} =
  if idleMs < 250: raise newException(ValueError,"Native host idle interval must be at least 250ms")
  let paths = hostPaths(workspace)
  prepareHostPaths(paths)
  let lock = tryHostLock(paths.lock)
  if lock == nil: return # A concurrent startup already owns this workspace.
  defer: lock.closeHostLock()
  # Only replace recognized descriptors in our own namespace, under the lifetime lock.
  discard readHostDescriptor(paths)
  await removeStaleSocket(paths.socket)
  installProcessSignalHandlers()
  let token = freshId("").replace("-","") & freshId("").replace("-","")
  let startedAt = utcTimestamp()
  let host = NativeHost(jobs: newJobRegistry(),sessions: newSessionRegistry(),generation: freshId("owner_"),touched: getMonoTime())
  let handler: RpcHandler = proc(request: JsonNode): Future[JsonNode] {.async.} =
    if not sameToken(text(field(request,"token")),token):
      raise contractFailure("permission_denied","The request did not carry this host's token.")
    if host.closing: raise contractFailure("unavailable","The native host is shutting down.")
    let methodName = field(request,"method")
    if methodName == nil or methodName.kind != JString: raise contractFailure("invalid_selection","A host method is required.")
    let params = field(request,"params")
    if params != nil and params.kind != JObject: raise contractFailure("invalid_selection","Host params must be an object.")
    var input = request.copy()
    input.delete("token") # Authentication credentials never enter engine dispatch.
    if params == nil: input["params"] = newJObject()
    inc host.active
    host.touched = getMonoTime()
    try:
      return %*{"ok": true,"result": await dispatchBase(host,input,identity,paths,startedAt,extension)}
    finally:
      dec host.active
      host.touched = getMonoTime()
  let server = listenRpc(paths.socket,handler)
  var published = false
  var descriptorStamp: FileStamp
  try:
    setFilePermissions(paths.socket,{fpUserRead,fpUserWrite})
    descriptorStamp = publishHostFile(paths.descriptor,wireJson(%*{"version": 1,"implementation": "nim",
      "workspaceRoot": paths.workspace,"socketPath": paths.socket,"pid": getCurrentProcessId(),
      "identity": identity,"token": token,"startedAt": startedAt}))
    published = true
    while not host.closing and interruptedSignal() == 0 and server.failure.len == 0:
      if host.hasLiveWork(): host.touched = getMonoTime()
      elif (getMonoTime()-host.touched).inMilliseconds >= idleMs: break
      await sleepAsync(20)
  finally:
    host.closing = true
    try: await host.jobs.closeJobs()
    finally:
      try:
        try: await host.closeHostServices()
        finally: discard await host.sessions.shutdownSessions()
      finally:
        # Allow already-computed replies (including shutdown acknowledgement)
        # to flush. Incomplete peers cannot hold shutdown open indefinitely.
        let drainAt = getMonoTime()
        while server.peerCount() > 0 and (getMonoTime()-drainAt).inMilliseconds < 1000:
          await sleepAsync(5)
        await server.closeRpc()
        if published: removeHostFile(paths.descriptor,descriptorStamp)
  if server.failure.len > 0: raise newException(OSError,server.failure)
