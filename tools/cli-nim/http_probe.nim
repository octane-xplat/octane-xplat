## Native HTTP differential entry, never part of the public CLI.
import std/[asyncdispatch, json, options, algorithm, base64, os, times]
import ../../packages/cli/nim/[native_http, strictjson, json_wire, jsonutil]
import ../../packages/cli/nim/actions_bridge
import ../../packages/cli/nim/http_url

proc later(token: HttpCancel, delay: int, stop: HttpCancel) {.async.} =
  var remaining = delay
  while remaining > 0 and not stop.cancelled:
    let slice = min(5,remaining)
    await sleepAsync(slice)
    remaining -= slice
  if not stop.cancelled: token.cancel()
proc canonical(headers: seq[HttpHeader]): JsonNode =
  var keys: seq[string]
  for entry in headers:
    if entry.name notin keys: keys.add(entry.name)
  keys.sort()
  result = newJArray()
  for key in keys:
    if key == "set-cookie":
      for entry in headers:
        if entry.name == key: result.add(%* [key,entry.value])
    else: result.add(%* [key,headers.header(key)])
proc execute(client: HttpClient, request: JsonNode): Future[JsonNode] {.async.} =
  let settings = newHttpOptions()
  if field(request,"method") != nil: settings.httpMethod = text(request["method"])
  if field(request,"headers") != nil:
    for entry in request["headers"]: settings.headers.add((text(entry[0]),text(entry[1])))
  if field(request,"body") != nil: settings.body = some(text(request["body"]))
  if field(request,"bodyBase64") != nil: settings.body = some(decode(text(request["bodyBase64"]))); settings.binaryBody = true
  if field(request,"timeoutMs") != nil: settings.timeoutMs = request["timeoutMs"].getInt()
  if field(request,"maxBytes") != nil: settings.maxBodyBytes = request["maxBytes"].getInt()
  settings.caFile = text(field(request,"caFile"))
  settings.proxy = text(field(request,"proxy"))
  settings.signal = newHttpCancel()
  if field(request,"preabort") == %true: settings.signal.cancel()
  var cancellation: Future[void]
  let stopTimer = newHttpCancel()
  if field(request,"abortMs") != nil: cancellation = later(settings.signal,request["abortMs"].getInt(),stopTimer)
  var streamed = ""
  var chunks = 0
  if field(request,"stream") == %true:
    settings.onChunk = proc(bytes: string) =
      streamed.add(bytes)
      inc chunks
      if field(request,"sinkError") == %true: raise newException(IOError,"fixture sink failure")
      if field(request,"sinkClose") == %true: client.close()
  var phase = "headers"
  proc bridgeFetch(url: string, options: HttpOptions): Future[HttpResponse] {.async.} =
    let response = await client.fetch(url,options)
    if field(request,"abortAfterHeadersMs") != nil:
      cancellation = later(settings.signal,request["abortAfterHeadersMs"].getInt(),stopTimer)
    return response
  try:
    if text(field(request,"operation")) == "bridge":
      let endpoint = BridgeEndpoint(url: text(request["url"]),token: text(field(request,"token")))
      case text(request["call"])
      of "registry": return await client.fetchBridgeRegistry(endpoint)
      of "submit": return await client.submitInvocation(endpoint,field(request,"invocation"))
      of "cancel": return await client.cancelInvocation(endpoint,text(request["requestId"]))
      of "await":
        let wait = if field(request,"waitMs") == nil or request["waitMs"].kind == JNull: 25000.0 else: request["waitMs"].getFloat()
        if field(request,"abortAfterHeadersMs") != nil:
          return await awaitInvocation(BridgeFetch(bridgeFetch),endpoint,text(request["requestId"]),wait,settings.signal)
        return await client.awaitInvocation(endpoint,text(request["requestId"]),wait,settings.signal)
      else: raise newException(ValueError,"Unknown bridge operation")
    let response = await client.fetch(text(request["url"]),settings)
    var value = %*{"status": response.status,"statusText": response.statusText,"url": response.url,
      "redirected": response.redirected,"ok": response.ok(),"headers": canonical(response.headers)}
    phase = "body"
    if field(request,"abortAfterHeadersMs") != nil:
      cancellation = later(settings.signal,request["abortAfterHeadersMs"].getInt(),stopTimer)
    if field(request,"stream") == %true:
      await response.finishStream()
      value["bodyBase64"] = %encode(streamed)
    else:
      case text(field(request,"consume"))
      of "none": response.cancel()
      of "json": value["body"] = await response.readJson()
      of "bytes": value["bodyBase64"] = %encode(await response.readBytes())
      else: value["body"] = %(await response.readText())
    if field(request,"doubleRead") == %true:
      try:
        discard await response.readBytes()
        value["secondRead"] = %true
      except HttpFailure as error: value["secondRead"] = %error.msg
    value["bodyUsed"] = %response.bodyUsed()
    return %*{"success": true,"value": value}
  except HttpFailure as error:
    return %*{"success": false,"phase": phase,"name": error.jsName,"message": error.msg,
      "kind": $error.kind,"detail": error.detail}
  except CatchableError as error:
    return %*{"success": false,"phase": phase,"message": error.msg}
  finally:
    stopTimer.cancel()
    if cancellation != nil and not cancellation.finished: await cancellation

let client = newHttpClient()
try:
  for line in stdin.lines:
    let request = parseStrictJson(line)
    if text(field(request,"operation")) == "version": echo wireJson(%*{"version": client.version,"asyncDns": client.asyncDns,"threadSafeGlobals": client.threadSafeGlobals,"urlParser": httpUrlVersion()})
    elif text(field(request,"operation")) == "normalize":
      try:
        let normalized = normalizeHttpUrl(text(request["url"]),text(field(request,"base")))
        echo wireJson(%*{"valid": true,"url": normalized.url,"origin": normalized.origin})
      except ValueError: echo wireJson(%*{"valid": false})
    elif text(field(request,"operation")) == "parallel":
      var pending: seq[Future[JsonNode]]
      for item in request["requests"]: pending.add(execute(client,item))
      var values = newJArray()
      for task in pending: values.add(waitFor task)
      echo wireJson(values)
    else: echo wireJson(waitFor execute(client,request))
finally: client.close()
