## Read-only discovery never starts a host; creation launches the same executable.
import std/[asyncdispatch, json, os, strtabs, monotimes, times]
import ./host_storage, ./host_bootstrap, ./unix_rpc, ./jsonutil, ./contract_failure
when defined(macosx) or defined(linux): import std/posix

type HostConnection* = ref object
  descriptor: JsonNode
  identity*: JsonNode
  pid*: int

proc processAlive(pid: int): bool =
  when defined(macosx) or defined(linux):
    posix.kill(Pid(pid),0) == 0 or errno == EPERM
  else: false

proc connectNativeHost*(workspace: string): Future[HostConnection] {.async.} =
  let paths = hostPaths(workspace)
  let descriptor = readHostDescriptor(paths)
  if descriptor == nil or not processAlive(descriptor["pid"].getInt()): return nil
  let response = await sendRpc(paths.socket,%*{"token": descriptor["token"],"method": "host.ping","params": {}},readMs=1500)
  if field(response,"ok") != %true:
    raise contractFailure("disconnected_runtime","The native host descriptor exists but its owner did not answer.",%*{"retryable": true})
  let ping = field(response,"result")
  if ping == nil or ping.kind != JObject or field(ping,"pid") != descriptor["pid"] or
      field(ping,"workspaceRoot") != %paths.workspace or field(ping,"startedAt") != descriptor["startedAt"] or
      field(ping,"identity") != field(descriptor,"identity"):
    raise contractFailure("disconnected_runtime","The native host identity did not match its descriptor.")
  return HostConnection(descriptor: descriptor.copy(),identity: ping.copy(),pid: descriptor["pid"].getInt())

proc callNativeHost*(host: HostConnection, methodName: string, params: JsonNode,
    appId: JsonNode = nil, grants: JsonNode = nil): Future[JsonNode] {.async.} =
  if host == nil: raise newException(ValueError,"A native host connection is required")
  let request = %*{"token": host.descriptor["token"],"method": methodName,"params": params}
  if appId != nil: request["appId"] = appId.copy()
  if grants != nil: request["grants"] = grants.copy()
  return await sendRpc(host.descriptor["socketPath"].getStr(),request)

proc ensureNativeHost*(workspace: string, executable = "", timeoutMs = 8000): Future[HostConnection] {.async.} =
  if timeoutMs <= 0: raise newException(ValueError,"Native host startup timeout must be positive")
  let live = await connectNativeHost(workspace)
  if live != nil: return live
  let paths = hostPaths(workspace)
  prepareHostPaths(paths)
  let environment = newStringTable(modeCaseSensitive)
  for key,value in envPairs(): environment[key] = value
  let launch = launchDetached((if executable.len == 0: getAppFilename() else: executable),
    @["--internal-agent-host",paths.workspace],paths.workspace,paths.log,environment)
  let started = getMonoTime()
  var published = false
  try:
    while (getMonoTime()-started).inMilliseconds < timeoutMs:
      let descriptor = readHostDescriptor(paths)
      if descriptor != nil and descriptor["pid"] == %launch.pid: published = true
      let connected = await connectNativeHost(paths.workspace)
      if connected != nil: return connected
      discard launch.pollLaunch() # Reap a losing concurrent starter; the winner may still publish.
      await sleepAsync(40)
    raise contractFailure("execution_failure","The native host did not start; inspect its private host.log.",
      %*{"retryable": true,"context": {"log": paths.log}})
  finally:
    # Descriptor publication transfers ownership even if this caller's ping fails.
    if not published:
      # Hold the publication lock across the final check and signal. A plain
      # descriptor check races a child publishing immediately before termination.
      let publication = tryHostLock(paths.lock)
      if publication != nil:
        try:
          let descriptor = readHostDescriptor(paths)
          if descriptor == nil or descriptor["pid"] != %launch.pid: await launch.stopUnpublishedLaunch()
        finally: publication.closeHostLock()
