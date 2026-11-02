## Authenticated bridge calls, matching mcp/actions/bridge.ts request envelopes.
## Waiting aborts the HTTP wait; action cancellation is a separate POST.
import std/[asyncdispatch, json, options, monotimes, times, math]
import ./native_http, ./jsonutil, ./json_wire
from ./args import jsNumber

type BridgeEndpoint* = object
  url*, token*: string
type BridgeFetch* = proc(url: string, settings: HttpOptions): Future[HttpResponse] {.closure.}

proc transport(client: HttpClient): BridgeFetch =
  result = proc(url: string, settings: HttpOptions): Future[HttpResponse] = client.fetch(url,settings)

proc watch(signal, caller, stop: HttpCancel, timeoutMs: int) {.async.} =
  let deadline = getMonoTime()+initDuration(milliseconds=timeoutMs)
  while not stop.cancelled:
    if (caller != nil and caller.cancelled) or getMonoTime() >= deadline:
      signal.cancel()
      return
    await sleepAsync(5)

proc request(fetch: BridgeFetch, endpoint: BridgeEndpoint, httpMethod, path: string,
    body: JsonNode = nil, timeoutMs = 4000, caller: HttpCancel = nil): Future[JsonNode] {.async.} =
  if caller != nil and caller.cancelled:
    return %*{"ok": false,"status": 0,"error": {"code": "aborted","message": "request aborted"}}
  let signal = newHttpCancel()
  let stop = newHttpCancel()
  let timer = watch(signal,caller,stop,timeoutMs)
  try:
    let settings = newHttpOptions()
    settings.httpMethod = httpMethod
    settings.headers = @[("x-xplat-dev-token",endpoint.token)]
    settings.signal = signal
    if body != nil:
      settings.headers.add(("content-type","application/json"))
      settings.body = some(wireJson(body))
    let response = await fetch(endpoint.url & "/__xplat_dev__" & path,settings)
    var payload: JsonNode
    try: payload = await response.readJson()
    except CatchableError: payload = newJNull()
    if not response.ok():
      var error = field(payload,"error")
      if error == nil or error.kind == JNull: error = %*{"code": "http","message": "HTTP " & $response.status}
      return %*{"ok": false,"status": response.status,"error": error}
    return %*{"ok": true,"data": payload}
  except CatchableError as error:
    return %*{"ok": false,"status": 0,"error": {"code": "unreachable","message": error.msg}}
  finally:
    stop.cancel()
    if not timer.finished: await timer

proc fetchBridgeRegistry*(fetch: BridgeFetch, endpoint: BridgeEndpoint): Future[JsonNode] =
  request(fetch,endpoint,"GET","/registry")
proc submitInvocation*(fetch: BridgeFetch, endpoint: BridgeEndpoint, invocation: JsonNode): Future[JsonNode] =
  request(fetch,endpoint,"POST","/invoke",invocation)
proc awaitInvocation*(fetch: BridgeFetch, endpoint: BridgeEndpoint, requestId: string,
    waitMs = 25000.0, signal: HttpCancel = nil): Future[JsonNode] =
  let wait = min(max(waitMs,1000.0),30000.0)
  request(fetch,endpoint,"GET","/invoke/" & requestId & "?wait=" & jsNumber(wait),timeoutMs=int(wait)+5000,caller=signal)
proc cancelInvocation*(fetch: BridgeFetch, endpoint: BridgeEndpoint, requestId: string): Future[JsonNode] =
  request(fetch,endpoint,"POST","/invoke/cancel",%*{"requestId": requestId})

proc fetchBridgeRegistry*(client: HttpClient, endpoint: BridgeEndpoint): Future[JsonNode] =
  fetchBridgeRegistry(transport(client),endpoint)
proc submitInvocation*(client: HttpClient, endpoint: BridgeEndpoint, invocation: JsonNode): Future[JsonNode] =
  submitInvocation(transport(client),endpoint,invocation)
proc awaitInvocation*(client: HttpClient, endpoint: BridgeEndpoint, requestId: string,
    waitMs = 25000.0, signal: HttpCancel = nil): Future[JsonNode] =
  awaitInvocation(transport(client),endpoint,requestId,waitMs,signal)
proc cancelInvocation*(client: HttpClient, endpoint: BridgeEndpoint, requestId: string): Future[JsonNode] =
  cancelInvocation(transport(client),endpoint,requestId)
