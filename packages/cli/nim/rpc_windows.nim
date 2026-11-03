## Bounded local named-pipe NDJSON. SDK I/O/buffers remain owned until completion.
import std/[asyncdispatch, json, os, strutils, tables, monotimes, times]
import ./windows_security, ./strictjson, ./json_wire, ./js_text, ./jsonutil, ./contract_failure
{.compile: "pipe_windows.c".}
const header = currentSourcePath().parentDir / "pipe_windows.h"
proc validName(path: cstring): cint {.importc: "xplat_pipe_name", header: header.}
proc nativeListen(path: cstring, error: ptr uint32): pointer {.importc: "xplat_pipe_listen", header: header.}
proc nativeAccept(server: pointer, pipe: ptr pointer, error: ptr uint32): cint {.importc: "xplat_pipe_accept", header: header.}
proc nativeServerClose(server: pointer): cint {.importc: "xplat_pipe_server_close", header: header.}
proc nativeConnect(path: cstring, error: ptr uint32): pointer {.importc: "xplat_pipe_connect", header: header.}
proc nativeHandle(pipe: pointer): pointer {.importc: "xplat_pipe_handle", header: header.}
proc nativeRead(pipe, buffer: pointer, capacity: uint32, count, error: ptr uint32): cint {.importc: "xplat_pipe_read", header: header.}
proc nativeWrite(pipe, buffer: pointer, length: csize_t, count, error: ptr uint32): cint {.importc: "xplat_pipe_write", header: header.}
proc nativeClose(pipe: pointer): cint {.importc: "xplat_pipe_close", header: header.}

type
  RpcHandler* = proc(request: JsonNode): Future[JsonNode] {.closure.}
  Pipe = ref object
    native: pointer
    closing: bool
    released: Future[void]
  RpcPeer = ref object
    pipe: Pipe
    work: Future[void]
  RpcServer* = ref object
    native: pointer
    handler: RpcHandler
    peers: Table[int,RpcPeer]
    sequence, maxPeers, maxRequestBytes, maxResponseBytes, ioMs: int
    closing: bool
    loop: Future[void]
    failure*: string

proc peerCount*(server: RpcServer): int =
  if server == nil: 0 else: server.peers.len
proc timeout(message: string): ref ContractFailure =
  contractFailure("timeout",message,%*{"retryable": true})
proc closePipe(pipe: Pipe): Future[void] {.async.} =
  if pipe == nil: return
  if pipe.closing:
    if pipe.released != nil: await pipe.released
    return
  pipe.closing = true
  pipe.released = newFuture[void]("named pipe release")
  while pipe.native != nil:
    if nativeClose(pipe.native) == 1: pipe.native = nil
    else: await sleepAsync(5)
  pipe.released.complete()
proc readFrame(pipe: Pipe, maximum, timeoutMs: int): Future[JsonNode] {.async.} =
  let deadline = getMonoTime()+initDuration(milliseconds=timeoutMs)
  var bytes: string
  var buffer: array[8192,char]
  while not pipe.closing:
    if getMonoTime() >= deadline:
      await pipe.closePipe()
      raise timeout("The agent runtime host did not respond in time.")
    var count, error: uint32
    let status = nativeRead(pipe.native,addr buffer[0],uint32(buffer.len),addr count,addr error)
    if status < 0: raiseOSError(OSErrorCode(error))
    if status == 2: raise contractFailure("disconnected_runtime","The agent runtime host did not answer.",%*{"retryable": true})
    if status == 0:
      await sleepAsync(5)
      continue
    var chunk = newString(int(count))
    if count > 0: copyMem(addr chunk[0],addr buffer[0],int(count))
    let endOfLine = chunk.find('\n')
    let length = if endOfLine < 0: chunk.len else: endOfLine
    if length > maximum-bytes.len: raise contractFailure("invalid_selection","RPC frame exceeds the byte limit.")
    bytes.add(chunk[0..<length])
    if endOfLine >= 0:
      try: return parseStrictJson(decodeUtf8(bytes))
      except CatchableError: raise contractFailure("invalid_selection","Malformed RPC frame.")
  raise contractFailure("disconnected_runtime","Native pipe closed.")
proc writeFrame(pipe: Pipe, value: JsonNode, maximum, timeoutMs: int): Future[void] {.async.} =
  let bytes = wireJson(value) & "\n"
  if bytes.len-1 > maximum: raise contractFailure("execution_failure","RPC response exceeds the byte limit.")
  let deadline = getMonoTime()+initDuration(milliseconds=timeoutMs)
  var offset = 0
  while offset < bytes.len:
    if pipe.closing: raise contractFailure("disconnected_runtime","Native pipe closed.")
    if getMonoTime() >= deadline:
      await pipe.closePipe()
      raise timeout("RPC write did not complete in time.")
    var count, error: uint32
    let status = nativeWrite(pipe.native,unsafeAddr bytes[offset],csize_t(bytes.len-offset),addr count,addr error)
    if status < 0: raiseOSError(OSErrorCode(error))
    if status == 1: offset += int(count)
    else: await sleepAsync(5)
proc drainReply(pipe: Pipe, timeoutMs: int): Future[void] {.async.} =
  # A completed write may still be buffered in the kernel. Let a normal client
  # consume its complete response and disconnect, without blocking in FlushFileBuffers.
  let deadline = getMonoTime()+initDuration(milliseconds=timeoutMs)
  var buffer: array[8192,char]
  while not pipe.closing and getMonoTime() < deadline:
    var count, error: uint32
    let status = nativeRead(pipe.native,addr buffer[0],uint32(buffer.len),addr count,addr error)
    if status < 0 or status == 2: return
    await sleepAsync(5)

proc sendRpc*(path: string, request: JsonNode, connectMs = 1500, readMs = 60000,
    maxRequestBytes = 1024*1024, maxResponseBytes = 8*1024*1024,
    ownerOnly = false): Future[JsonNode] {.async.} =
  if connectMs <= 0 or readMs <= 0 or maxRequestBytes < 1 or maxResponseBytes < 1:
    raise newException(ValueError,"RPC deadlines and byte limits must be positive")
  if '\0' in path or validName(cstring(path)) == 0:
    return %*{"ok": false,"error": {"code": "invalid_selection","message": "RPC requires a local named-pipe path."}}
  if request == nil or request.kind != JObject:
    return %*{"ok": false,"error": {"code": "invalid_selection","message": "RPC requests must be objects."}}
  let payload = request.copy()
  if wireJson(payload).len > maxRequestBytes:
    return %*{"ok": false,"error": {"code": "invalid_selection","message": "RPC request exceeds the byte limit."}}
  let pipe = Pipe()
  try:
    let deadline = getMonoTime()+initDuration(milliseconds=connectMs)
    while pipe.native == nil:
      var error: uint32
      pipe.native = nativeConnect(cstring(path),addr error)
      if pipe.native == nil:
        if error != 231'u32: raiseOSError(OSErrorCode(error)) # ERROR_PIPE_BUSY alone is retryable.
        if getMonoTime() >= deadline: raise timeout("The agent runtime host did not connect in time.")
        await sleepAsync(5)
    if ownerOnly:
      try: verifyWindowsPrivateOwner(nativeHandle(pipe.native))
      except OSError: raise contractFailure("permission_denied","The connected native endpoint is not privately owned by this user.")
    await writeFrame(pipe,payload,maxRequestBytes,connectMs)
    var response: JsonNode
    try: response = await readFrame(pipe,maxResponseBytes,readMs)
    except ContractFailure as error:
      if text(error.detail["code"]) == "invalid_selection":
        raise contractFailure("execution_failure","The agent runtime host sent a malformed or oversized reply.")
      raise
    if response.kind != JObject or field(response,"ok") == nil or response["ok"].kind != JBool:
      raise contractFailure("execution_failure","The agent runtime host sent a malformed reply.")
    return response
  except ContractFailure as error: return %*{"ok": false,"error": failureData(error)}
  except CatchableError:
    return %*{"ok": false,"error": {"code": "disconnected_runtime","message": "The agent runtime host did not answer.","retryable": true}}
  finally: await pipe.closePipe()

proc servePeer(server: RpcServer, peer: RpcPeer, id: int, admitted: bool): Future[void] {.async.} =
  try:
    var response: JsonNode
    if not admitted:
      response = %*{"ok": false,"error": {"code": "unavailable","message": "The native host connection limit was reached.","retryable": true}}
    else:
      try:
        let request = await readFrame(peer.pipe,server.maxRequestBytes,server.ioMs)
        if request.kind != JObject: raise contractFailure("invalid_selection","RPC requests must be objects.")
        let pending = server.handler(request)
        if pending == nil: raise contractFailure("execution_failure","RPC handler did not return a future.")
        response = await pending
        if response == nil or response.kind != JObject or field(response,"ok") == nil or response["ok"].kind != JBool:
          raise contractFailure("execution_failure","RPC handler returned a malformed response.")
      except CatchableError as error: response = %*{"ok": false,"error": failureData(error)}
    if not server.closing and not peer.pipe.closing:
      try: await writeFrame(peer.pipe,response,server.maxResponseBytes,server.ioMs)
      except ContractFailure as error:
        if not peer.pipe.closing:
          await writeFrame(peer.pipe,%*{"ok": false,"error": failureData(error)},server.maxResponseBytes,server.ioMs)
      await drainReply(peer.pipe,server.ioMs)
  except CatchableError: discard
  finally:
    await peer.pipe.closePipe()
    server.peers.del(id)
proc acceptPeers(server: RpcServer): Future[void] {.async.} =
  try:
    while not server.closing:
      var pipe: pointer
      var error: uint32
      let status = nativeAccept(server.native,addr pipe,addr error)
      if status < 0: raiseOSError(OSErrorCode(error))
      if status == 1:
        let channel = Pipe(native: pipe)
        if server.peers.len >= server.maxPeers+4:
          await channel.closePipe() # Bound rejection work as well as admitted peers.
        else:
          inc server.sequence
          let id = server.sequence
          let peer = RpcPeer(pipe: channel)
          let admitted = server.peers.len < server.maxPeers
          server.peers[id] = peer
          peer.work = servePeer(server,peer,id,admitted)
      await sleepAsync(if status == 0: 5 else: 0)
  except CatchableError as error:
    if not server.closing: server.failure = error.msg
proc listenRpc*(path: string, handler: RpcHandler, maxPeers = 32, maxRequestBytes = 1024*1024,
    maxResponseBytes = 8*1024*1024, ioMs = 5000): RpcServer =
  if handler == nil or maxPeers < 1 or maxPeers > 128 or maxRequestBytes < 1 or maxResponseBytes < 512 or ioMs < 1:
    raise newException(ValueError,"Invalid native RPC limits or handler")
  if '\0' in path or validName(cstring(path)) == 0: raise newException(ValueError,"RPC requires a local named-pipe path")
  discard getGlobalDispatcher()
  var error: uint32
  let native = nativeListen(cstring(path),addr error)
  if native == nil: raiseOSError(OSErrorCode(error))
  result = RpcServer(native: native,handler: handler,maxPeers: maxPeers,maxRequestBytes: maxRequestBytes,
    maxResponseBytes: maxResponseBytes,ioMs: ioMs)
  result.loop = acceptPeers(result)
proc closeRpc*(server: RpcServer): Future[void] {.async.} =
  if server == nil: return
  server.closing = true
  while server.native != nil:
    if nativeServerClose(server.native) == 1: server.native = nil
    else: await sleepAsync(5)
  var peers: seq[RpcPeer]
  for peer in server.peers.values: peers.add(peer)
  for peer in peers: await peer.pipe.closePipe()
  if server.loop != nil: await server.loop
  for peer in peers:
    if peer.work != nil: await peer.work
