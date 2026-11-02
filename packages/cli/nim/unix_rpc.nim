## Bounded one-request/one-response NDJSON over an owned Unix socket.
## macOS execution is qualified separately from other host transports.
import std/[asyncdispatch, asyncnet, nativesockets, json, os, strutils, tables]
import ./strictjson, ./json_wire, ./js_text, ./jsonutil, ./contract_failure

type
  RpcHandler* = proc(request: JsonNode): Future[JsonNode] {.closure.}
  RpcPeer = ref object
    socket: AsyncSocket
    work: Future[void]
  RpcServer* = ref object
    listener: AsyncSocket
    path: string
    inode: tuple[device: DeviceId, file: FileId]
    handler: RpcHandler
    peers: Table[int,RpcPeer]
    sequence, maxPeers, maxRequestBytes, maxResponseBytes, ioMs: int
    closing: bool
    loop: Future[void]
    failure*: string

proc closeSocket(socket: AsyncSocket) =
  if socket != nil and not socket.isClosed():
    # POSIX close unregisters and unblocks pending callbacks before returning.
    # A callback can report the already-closed FD; ownership is still released.
    try: socket.close()
    except CatchableError: discard

proc frame(socket: AsyncSocket, maximum: int): Future[JsonNode] {.async.} =
  var bytes: string
  while true:
    let chunk = await socket.recv(8192)
    if chunk.len == 0: raise contractFailure("disconnected_runtime","The agent runtime host did not answer.",%*{"retryable": true})
    let endOfLine = chunk.find('\n')
    let count = if endOfLine < 0: chunk.len else: endOfLine
    if count > maximum-bytes.len: raise contractFailure("invalid_selection","RPC frame exceeds the byte limit.")
    bytes.add(chunk[0..<count])
    if endOfLine >= 0:
      try: return parseStrictJson(decodeUtf8(bytes))
      except CatchableError: raise contractFailure("invalid_selection","Malformed RPC frame.")

proc readFrame(socket: AsyncSocket, maximum, timeoutMs: int): Future[JsonNode] {.async.} =
  let pending = frame(socket,maximum)
  if not await withTimeout(pending,timeoutMs):
    socket.closeSocket()
    raise contractFailure("timeout","The agent runtime host did not respond in time.",%*{"retryable": true})
  return await pending

proc writeFrame(socket: AsyncSocket, value: JsonNode, maximum, timeoutMs: int): Future[void] {.async.} =
  let bytes = wireJson(value) & "\n"
  if bytes.len-1 > maximum: raise contractFailure("execution_failure","RPC response exceeds the byte limit.")
  let pending = socket.send(bytes)
  if not await withTimeout(pending,timeoutMs):
    socket.closeSocket()
    raise contractFailure("timeout","RPC write did not complete in time.",%*{"retryable": true})
  await pending

proc sendRpc*(path: string, request: JsonNode, connectMs = 1500, readMs = 60000,
    maxRequestBytes = 1024*1024, maxResponseBytes = 8*1024*1024): Future[JsonNode] {.async.} =
  if connectMs <= 0 or readMs <= 0 or maxRequestBytes < 1 or maxResponseBytes < 1:
    raise newException(ValueError,"RPC deadlines and byte limits must be positive")
  when defined(macosx):
    if '\0' in path: return %*{"ok": false,"error": {"code": "invalid_selection","message": "RPC socket path contains NUL."}}
    if request == nil or request.kind != JObject:
      return %*{"ok": false,"error": {"code": "invalid_selection","message": "RPC requests must be objects."}}
    let payload = request.copy()
    if wireJson(payload).len > maxRequestBytes:
      return %*{"ok": false,"error": {"code": "invalid_selection","message": "RPC request exceeds the byte limit."}}
    let socket = newAsyncSocket(AF_UNIX,SOCK_STREAM,IPPROTO_IP,buffered=false)
    try:
      let connected = socket.connectUnix(utf8ForWrite(path))
      if not await withTimeout(connected,connectMs):
        raise contractFailure("timeout","The agent runtime host did not connect in time.",%*{"retryable": true})
      await connected
      await writeFrame(socket,payload,maxRequestBytes,connectMs)
      var response: JsonNode
      try: response = await readFrame(socket,maxResponseBytes,readMs)
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
    finally: socket.closeSocket()
  else:
    return %*{"ok": false,"error": {"code": "unavailable","message": "Native host IPC is not implemented on this host."}}

proc servePeer(server: RpcServer, peer: RpcPeer, id: int): Future[void] {.async.} =
  try:
    var response: JsonNode
    try:
      let request = await readFrame(peer.socket,server.maxRequestBytes,server.ioMs)
      if request.kind != JObject: raise contractFailure("invalid_selection","RPC requests must be objects.")
      let pending = server.handler(request)
      if pending == nil: raise contractFailure("execution_failure","RPC handler did not return a future.")
      response = await pending
      if response == nil or response.kind != JObject or field(response,"ok") == nil or response["ok"].kind != JBool:
        raise contractFailure("execution_failure","RPC handler returned a malformed response.")
    except CatchableError as error: response = %*{"ok": false,"error": failureData(error)}
    if not server.closing and not peer.socket.isClosed():
      try: await writeFrame(peer.socket,response,server.maxResponseBytes,server.ioMs)
      except ContractFailure as error:
        if not peer.socket.isClosed():
          await writeFrame(peer.socket,%*{"ok": false,"error": failureData(error)},server.maxResponseBytes,server.ioMs)
  except CatchableError: discard # A disconnected peer cannot transfer process ownership.
  finally:
    peer.socket.closeSocket()
    server.peers.del(id)

proc acceptPeers(server: RpcServer): Future[void] {.async.} =
  try:
    while not server.closing:
      let socket = await server.listener.accept()
      if server.closing:
        socket.closeSocket()
        break
      if server.peers.len >= server.maxPeers:
        try:
          await writeFrame(socket,%*{"ok": false,"error": {"code": "unavailable","message": "The native host connection limit was reached.","retryable": true}},server.maxResponseBytes,server.ioMs)
        except CatchableError: discard
        finally: socket.closeSocket()
        continue
      inc server.sequence
      let id = server.sequence
      let peer = RpcPeer(socket: socket)
      server.peers[id] = peer
      peer.work = servePeer(server,peer,id)
  except CatchableError as error:
    if not server.closing: server.failure = error.msg

proc listenRpc*(path: string, handler: RpcHandler, maxPeers = 32, maxRequestBytes = 1024*1024,
    maxResponseBytes = 8*1024*1024, ioMs = 5000): RpcServer =
  when defined(macosx):
    if handler == nil or maxPeers < 1 or maxRequestBytes < 1 or maxResponseBytes < 512 or ioMs < 1:
      raise newException(ValueError,"Invalid native RPC limits or handler")
    if '\0' in path: raise newException(ValueError,"RPC socket path contains NUL")
    discard getGlobalDispatcher()
    let socket = newAsyncSocket(AF_UNIX,SOCK_STREAM,IPPROTO_IP,buffered=false)
    try:
      socket.bindUnix(utf8ForWrite(path)) # Never unlink an existing listener's path.
      let inode = getFileInfo(utf8ForWrite(path),followSymlink=false).id
      socket.listen()
      result = RpcServer(listener: socket,path: path,inode: inode,handler: handler,maxPeers: maxPeers,
        maxRequestBytes: maxRequestBytes,maxResponseBytes: maxResponseBytes,ioMs: ioMs)
      result.loop = acceptPeers(result)
    except CatchableError:
      socket.closeSocket()
      raise
  else: raise newException(OSError,"Native host IPC is not implemented on this host")

proc closeRpc*(server: RpcServer): Future[void] {.async.} =
  if server == nil: return
  server.closing = true
  server.listener.closeSocket()
  var peers: seq[RpcPeer]
  for peer in server.peers.values: peers.add(peer)
  for peer in peers: peer.socket.closeSocket()
  if server.loop != nil: await server.loop
  for peer in peers:
    if peer.work != nil: await peer.work
  when defined(macosx):
    try:
      if getFileInfo(utf8ForWrite(server.path),followSymlink=false).id == server.inode:
        removeFile(utf8ForWrite(server.path))
    except OSError: discard
