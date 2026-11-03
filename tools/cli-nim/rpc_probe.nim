## Test-only local RPC transport adapter. No project tools or runtime fallback.
import std/[asyncdispatch, json, strutils, os]
import ../../packages/cli/nim/[local_rpc, strictjson, json_wire, jsonutil, contract_failure, managed_process]

proc run(): Future[void] {.async.} =
  let request = parseStrictJson(stdin.readLine())
  if text(request["operation"]) == "client":
    var response: JsonNode
    when defined(windows):
      response = await sendRpc(text(request["path"]),request["payload"],
        connectMs=(if field(request,"connectMs") == nil: 1500 else: request["connectMs"].getInt()),
        readMs=(if field(request,"timeoutMs") == nil: 5000 else: request["timeoutMs"].getInt()),
        maxRequestBytes=(if field(request,"requestLimit") == nil: 1024*1024 else: request["requestLimit"].getInt()),
        maxResponseBytes=(if field(request,"responseLimit") == nil: 8*1024*1024 else: request["responseLimit"].getInt()),
        ownerOnly=field(request,"ownerOnly") == %true)
    else:
      response = await sendRpc(text(request["path"]),request["payload"],
        connectMs=(if field(request,"connectMs") == nil: 1500 else: request["connectMs"].getInt()),
        readMs=(if field(request,"timeoutMs") == nil: 5000 else: request["timeoutMs"].getInt()),
        maxRequestBytes=(if field(request,"requestLimit") == nil: 1024*1024 else: request["requestLimit"].getInt()),
        maxResponseBytes=(if field(request,"responseLimit") == nil: 8*1024*1024 else: request["responseLimit"].getInt()))
    echo wireJson(response)
  else:
    installProcessSignalHandlers()
    let handler: RpcHandler = proc(value: JsonNode): Future[JsonNode] {.async.} =
      if field(value,"delayMs") != nil: await sleepAsync(value["delayMs"].getInt())
      if field(value,"fail") == %true: raise contractFailure("prerequisite_missing","Fixture unavailable",%*{"recovery": {"action": "Install fixture"}})
      if field(value,"replyBytes") != nil:
        let count = value["replyBytes"].getInt()
        if count < 0 or count > 4*1024*1024: raise newException(ValueError,"Fixture reply bound exceeded")
        return %*{"ok": true,"result": {"text": repeat('x',count)}}
      return %*{"ok": true,"result": value}
    let server = listenRpc(text(request["path"]),handler,
      ioMs=(if field(request,"timeoutMs") == nil: 1000 else: request["timeoutMs"].getInt()),
      maxPeers=(if field(request,"peerLimit") == nil: 8 else: request["peerLimit"].getInt()),
        maxRequestBytes=(if field(request,"requestLimit") == nil: 1024*1024 else: request["requestLimit"].getInt()),
        maxResponseBytes=(if field(request,"responseLimit") == nil: 8*1024*1024 else: request["responseLimit"].getInt()))
    echo "ready"
    stdout.flushFile()
    try:
      let stopFile = text(field(request,"stopFile"))
      while interruptedSignal() == 0 and server.failure.len == 0 and
          (stopFile.len == 0 or not fileExists(stopFile)): await sleepAsync(5)
    finally: await server.closeRpc()
    if server.failure.len > 0: raise newException(ValueError,server.failure)

try: waitFor run()
except CatchableError as error:
  stderr.writeLine(error.msg)
  quit(1)
