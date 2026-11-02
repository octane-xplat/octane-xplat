## Async HTTP(S) control transport. Header readiness and body completion are
## distinct; callers must consume or cancel a response. No runtime subprocess.
import std/[asyncdispatch, dynlib, os, strutils, tables, options, monotimes, times, unicode, algorithm, json, sequtils]
import ./js_text, ./strictjson, ./http_url

type
  HttpFailureKind* = enum hfInvalid, hfTransport, hfAbort, hfTimeout, hfClosed, hfBodyLimit, hfSink
  HttpFailure* = object of CatchableError
    kind*: HttpFailureKind
    jsName*, detail*: string
  HttpCancel* = ref object
    cancelled*: bool
  HttpHeader* = tuple[name, value: string]
  HttpOptions* = ref object
    httpMethod*: string
    headers*: seq[HttpHeader]
    body*: Option[string]
    binaryBody*: bool
    timeoutMs*: int
    signal*: HttpCancel
    caFile*, proxy*: string
    maxBodyBytes*: int
    onChunk*: proc(bytes: string) {.closure.}
  HttpResponse* = ref object
    status*: int
    statusText*, url*: string
    headers*: seq[HttpHeader]
    redirected*: bool
    body: Future[string]
    cancelToken: HttpCancel
    used, nullBody, streamed: bool
  HttpClient* = ref object
    library: LibHandle
    api: pointer
    requests: Table[pointer, Transfer]
    closed, pumping: bool
    version*: string
    asyncDns*, threadSafeGlobals*: bool
  Transfer = ref object
    client: HttpClient
    handle: pointer
    ready: Future[HttpResponse]
    body: Future[string]
    cancelToken, signal: HttpCancel
    deadline: Option[MonoTime]
    httpMethod, url, requestBody: string
    status: int
    statusText: string
    headers: seq[HttpHeader]
    headerReady, responseReady: bool
    headerSize, bytesReceived, maxBytes: int
    chunks: seq[string]
    buffered: string
    sink: proc(bytes: string) {.closure.}
    failure: ref HttpFailure

proc problem(kind: HttpFailureKind, message: string, name = "TypeError", detail = ""): ref HttpFailure =
  result = newException(HttpFailure,message)
  result.kind = kind; result.jsName = name; result.detail = detail
proc newHttpOptions*(): HttpOptions =
  HttpOptions(httpMethod: "GET",timeoutMs: -1,maxBodyBytes: high(int))
proc newHttpCancel*(): HttpCancel = HttpCancel()
proc cancel*(token: HttpCancel) =
  if token != nil: token.cancelled = true

when defined(macosx):
  # Resolver threads can outlive curl_global_cleanup. Keep this one system
  # library mapping until process exit; per-client handles still close normally.
  var processCurlLibrary: LibHandle
  const shimHeader = currentSourcePath().parentDir / "curl_shim.h"
  {.compile: "curl_shim.c".}
  type Lookup = proc(library: pointer, name: cstring): pointer {.cdecl.}
  type Receive = proc(data: cstring, size, count: csize_t, user: pointer): csize_t {.cdecl.}
  proc apiOpen(library: pointer, lookup: Lookup, error: ptr cstring): pointer {.cdecl, importc: "xplat_curl_open", header: shimHeader.}
  proc apiClose(api: pointer) {.cdecl, importc: "xplat_curl_close", header: shimHeader.}
  proc apiVersion(api: pointer): cstring {.cdecl, importc: "xplat_curl_version", header: shimHeader.}
  proc apiAsyncDns(api: pointer): cint {.cdecl, importc: "xplat_curl_async_dns", header: shimHeader.}
  proc apiThreadSafe(api: pointer): cint {.cdecl, importc: "xplat_curl_threadsafe", header: shimHeader.}
  proc apiFree(memory: cstring) {.cdecl, importc: "xplat_curl_free", header: shimHeader.}
  proc apiRequest(api: pointer, url, httpMethod: cstring, headers: ptr cstring, headerCount: csize_t,
    body: cstring, bodyLength: csize_t, hasBody: cint, timeoutMs: clong, caFile, proxy: cstring,
    receiveBody, receiveHeader: Receive, user: pointer, error: ptr cstring): pointer {.cdecl, importc: "xplat_curl_request", header: shimHeader.}
  proc apiRemove(api, request: pointer) {.cdecl, importc: "xplat_curl_remove", header: shimHeader.}
  proc apiPerform(api: pointer): cint {.cdecl, importc: "xplat_curl_perform", header: shimHeader.}
  proc apiNext(api: pointer, code: ptr cint): pointer {.cdecl, importc: "xplat_curl_next", header: shimHeader.}
  proc apiError(request: pointer): cstring {.cdecl, importc: "xplat_curl_error", header: shimHeader.}
  proc apiTimeout(code: cint): cint {.cdecl, importc: "xplat_curl_is_timeout", header: shimHeader.}
  proc lookup(library: pointer, name: cstring): pointer {.cdecl.} = symAddr(cast[LibHandle](library),$name)
else:
  proc apiClose(api: pointer) = discard
  proc apiRemove(api, request: pointer) = discard

proc header*(headers: seq[HttpHeader], name: string): string =
  let key = name.toLowerAscii()
  var values: seq[string]
  for entry in headers:
    if entry.name == key: values.add(entry.value)
  values.join(if key == "cookie": "; " else: ", ")
proc header*(response: HttpResponse, name: string): string = response.headers.header(name)
proc hasHeader(headers: seq[HttpHeader], name: string): bool =
  for entry in headers:
    if entry.name == name: return true
proc ok*(response: HttpResponse): bool = response.status in 200..299
proc bodyUsed*(response: HttpResponse): bool = response.used
proc cancel*(response: HttpResponse) =
  if not response.nullBody:
    response.used = true
    response.cancelToken.cancel()
proc finishStream*(response: HttpResponse): Future[void] {.async.} =
  if not response.streamed: raise problem(hfInvalid,"Response has no streaming sink")
  if response.nullBody: return
  discard await response.body
proc readBytes*(response: HttpResponse): Future[string] {.async.} =
  if response.nullBody: return ""
  if response.used: raise problem(hfInvalid,"Body is unusable: Body has already been read")
  response.used = true
  return await response.body
proc readText*(response: HttpResponse): Future[string] {.async.} =
  let bytes = await response.readBytes()
  return decodeUtf8(if bytes.startsWith("\xef\xbb\xbf"): bytes[3..^1] else: bytes)
proc readJson*(response: HttpResponse): Future[JsonNode] {.async.} =
  return parseStrictJson(await response.readText())

proc finish(transfer: Transfer, error: ref HttpFailure = nil) =
  let client = transfer.client
  if transfer.handle == nil: return
  client.requests.del(transfer.handle)
  apiRemove(client.api,transfer.handle)
  transfer.handle = nil
  if error != nil:
    if not transfer.ready.finished: transfer.ready.fail(error)
    if not transfer.body.finished: transfer.body.fail(error)
  elif not transfer.body.finished: transfer.body.complete(transfer.buffered)
  transfer.chunks.setLen(0)
  transfer.buffered = ""
proc close*(client: HttpClient) =
  if client == nil or client.closed: return
  client.closed = true
  var transfers: seq[Transfer]
  for transfer in client.requests.values: transfers.add(transfer)
  for transfer in transfers: transfer.finish(problem(hfClosed,"HTTP client is closed"))
  if client.api != nil: apiClose(client.api)
  client.api = nil
  client.library = nil

proc newHttpClient*(): HttpClient =
  discard getGlobalDispatcher()
  when defined(macosx):
    if processCurlLibrary == nil: processCurlLibrary = loadLib("/usr/lib/libcurl.4.dylib")
    result = HttpClient(library: processCurlLibrary)
    if result.library == nil: raise problem(hfTransport,"System HTTP transport is unavailable")
    try:
      var error: cstring
      result.api = apiOpen(cast[pointer](result.library),lookup,addr error)
      if result.api == nil:
        let detail = if error == nil: "" else: $error
        apiFree(error)
        raise problem(hfTransport,"System HTTP transport is unavailable",detail=detail)
      result.version = $apiVersion(result.api)
      result.asyncDns = apiAsyncDns(result.api) != 0
      result.threadSafeGlobals = apiThreadSafe(result.api) != 0
      if not result.threadSafeGlobals: raise problem(hfTransport,"System HTTP transport lacks thread-safe global initialization")
    except CatchableError:
      result.close()
      raise
  else:
    raise problem(hfTransport,"Native HTTP/TLS is not yet implemented on this host")

proc latin1(bytes: string): string =
  for byte in bytes: result.add(Rune(ord(byte)).toUTF8())
proc headerBytes(value: string): string =
  for rune in value.runes:
    if int(rune) > 255: raise problem(hfInvalid,"HTTP headers must contain only ByteString characters")
    result.add(char(int(rune)))
proc token(value: string): bool =
  if value == "": return false
  for ch in value:
    if ch notin {'a'..'z','A'..'Z','0'..'9','!','#','$','%','&','\'','*','+','-','.','^','_','`','|','~'}: return false
  true
proc normalizedHeaders(headers: seq[HttpHeader]): seq[HttpHeader] =
  var grouped: OrderedTable[string,string]
  for entry in headers:
    let name = entry.name.toLowerAscii()
    if not token(name): raise problem(hfInvalid,"Invalid HTTP header name")
    let value = entry.value.strip(chars={' ','\t','\r','\n'})
    let bytes = headerBytes(value)
    if '\0' in bytes or '\r' in bytes or '\n' in bytes: raise problem(hfInvalid,"Invalid HTTP header value")
    if grouped.hasKey(name): grouped[name] &= (if name == "cookie": "; " else: ", ") & value
    else: grouped[name] = value
  for name, value in grouped: result.add((name,value))
  result.sort(proc(a,b: HttpHeader): int = cmp(a.name,b.name))

when defined(macosx):
  proc received(data: cstring, size, count: csize_t): string =
    if size != 0 and count > csize_t(high(int)) div size: raise problem(hfTransport,"HTTP receive size overflow")
    result = newString(int(size*count))
    if result.len > 0: copyMem(addr result[0],data,result.len)
  proc receiveBody(data: cstring, size, count: csize_t, user: pointer): csize_t {.cdecl.} =
    let transfer = cast[Transfer](user)
    try:
      if transfer.httpMethod == "HEAD" or transfer.status in [204,205,304] or
          (transfer.status in [301,302,303,307,308] and transfer.headers.header("location") != ""):
        return size*count
      let bytes = received(data,size,count)
      if bytes.len > transfer.maxBytes-transfer.bytesReceived:
        transfer.failure = problem(hfBodyLimit,"HTTP response exceeds the configured byte limit")
        return 0
      transfer.bytesReceived += bytes.len
      transfer.chunks.add(bytes)
      return size*count
    except CatchableError:
      transfer.failure = problem(hfTransport,"fetch failed",detail="HTTP body callback failed")
      return 0
  proc receiveHeader(data: cstring, size, count: csize_t, user: pointer): csize_t {.cdecl.} =
    let transfer = cast[Transfer](user)
    try:
      let bytes = received(data,size,count)
      # libcurl delivers complete header lines. Trailers do not mutate the
      # already-delivered Fetch headers.
      if transfer.headerReady: return size*count
      let line = bytes.strip(chars={'\r','\n'})
      if line.startsWith("HTTP/"):
        let parts = line.split(' ',maxsplit=2)
        if parts.len < 2: raise problem(hfTransport,"fetch failed")
        transfer.status = parseInt(parts[1])
        transfer.statusText = if parts.len > 2: latin1(parts[2]) else: ""
        transfer.headers.setLen(0)
        transfer.headerSize = 0
      elif line == "":
        if transfer.status in [100,101]: raise problem(hfTransport,"fetch failed",detail="Unexpected HTTP upgrade or continue response")
        if transfer.status >= 200: transfer.headerReady = true
      else:
        let colon = line.find(':')
        if colon <= 0 or '\0' in line: raise problem(hfTransport,"fetch failed")
        let name = line[0..<colon].toLowerAscii()
        let value = line[colon+1..^1].strip(leading=true,trailing=false,chars={' ','\t'})
        if not token(name): raise problem(hfTransport,"fetch failed")
        for byte in value:
          if (ord(byte) < 32 and byte != '\t') or ord(byte) == 127: raise problem(hfTransport,"fetch failed")
        # Undici counts field/value bytes, excluding delimiters/status lines.
        transfer.headerSize += name.len+value.len
        if transfer.headerSize >= 16*1024: raise problem(hfTransport,"fetch failed",detail="HTTP response headers are too large")
        transfer.headers.add((name,latin1(value.strip(chars={' ','\t'}))))
      return size*count
    except CatchableError as error:
      transfer.failure = if error of HttpFailure: cast[ref HttpFailure](error) else: problem(hfTransport,"fetch failed",detail="Invalid HTTP response headers")
      return 0

  proc announce(transfer: Transfer) =
    if not transfer.headerReady or transfer.responseReady: return
    transfer.responseReady = true
    let response = HttpResponse(status: transfer.status,statusText: transfer.statusText,url: transfer.url,
      headers: transfer.headers,body: transfer.body,cancelToken: transfer.cancelToken,
      nullBody: transfer.httpMethod == "HEAD" or transfer.status in [204,205,304],
      streamed: transfer.sink != nil,used: transfer.sink != nil and transfer.httpMethod != "HEAD" and transfer.status notin [204,205,304])
    transfer.ready.complete(response)
  proc abortFailure(transfer: Transfer, timeout: bool): ref HttpFailure =
    if timeout: problem(hfTimeout,"The operation was aborted due to timeout","TimeoutError")
    else: problem(hfAbort,"This operation was aborted","AbortError")
  proc pump(client: HttpClient) {.async.} =
    try:
      while not client.closed and client.requests.len > 0:
        var transfers: seq[Transfer]
        for transfer in client.requests.values: transfers.add(transfer)
        for transfer in transfers:
          if transfer.cancelToken.cancelled or (transfer.signal != nil and transfer.signal.cancelled):
            transfer.finish(transfer.abortFailure(false))
          elif transfer.deadline.isSome and getMonoTime() >= transfer.deadline.get():
            transfer.finish(transfer.abortFailure(true))
        if client.requests.len == 0: break
        if apiPerform(client.api) != 0: raise problem(hfTransport,"HTTP multi transport failed")
        # Drain C-owned messages before completing futures or calling a user
        # sink. Either may close the client and release every easy handle.
        var completions: seq[tuple[transfer: Transfer, code: cint, detail: string]]
        while true:
          var code: cint
          let request = apiNext(client.api,addr code)
          if request == nil: break
          if client.requests.hasKey(request): completions.add((client.requests[request],code,$apiError(request)))
        transfers.setLen(0)
        for transfer in client.requests.values: transfers.add(transfer)
        for transfer in transfers:
          transfer.announce()
          let chunks = transfer.chunks
          transfer.chunks = @[]
          for bytes in chunks:
            if transfer.handle == nil: break
            if transfer.sink == nil: transfer.buffered.add(bytes)
            else:
              try: transfer.sink(bytes)
              except CatchableError as error:
                transfer.finish(problem(hfSink,error.msg))
                break
        for completion in completions:
          let transfer = completion.transfer
          if transfer.handle == nil: continue
          if transfer.failure != nil: transfer.finish(transfer.failure)
          elif completion.code != 0:
            let error = if apiTimeout(completion.code) != 0: transfer.abortFailure(true)
              else: problem(hfTransport,if transfer.responseReady: "terminated" else: "fetch failed",detail=completion.detail)
            transfer.finish(error)
          elif not transfer.responseReady: transfer.finish(problem(hfTransport,"fetch failed",detail="Missing final HTTP headers"))
          else: transfer.finish()
        if not client.closed and client.requests.len > 0: await sleepAsync(5)
    except CatchableError:
      client.close()
    finally: client.pumping = false

  proc resolveUrl(client: HttpClient, value, base = ""): tuple[url,origin: string] =
    var normalized: tuple[url,origin,port: string]
    try: normalized = normalizeHttpUrl(value,base)
    except ValueError as error: raise problem(hfInvalid,error.msg)
    # Fetch's blocked-port policy is distinct from URL syntax. This is the
    # standard bad-port list also used by the executed Undici 8.11.2 reference.
    if normalized.port in ["1","7","9","11","13","15","17","19","20","21","22","23","25","37","42","43","53","69","77","79",
      "87","95","101","102","103","104","109","110","111","113","115","117","119","123","135","137","139","143","161","179",
      "389","427","465","512","513","514","515","526","530","531","532","540","548","554","556","563","587","601","636",
      "989","990","993","995","1719","1720","1723","2049","3659","4045","4190","5060","5061","6000","6566","6665","6666","6667",
      "6668","6669","6679","6697","10080"]: raise problem(hfTransport,"fetch failed",detail="bad port")
    (normalized.url,normalized.origin)
  proc start(client: HttpClient, url, httpMethod: string, headers: seq[HttpHeader], body: Option[string],
    settings: HttpOptions, deadline: Option[MonoTime]): Future[HttpResponse] =
    if client.closed: raise problem(hfClosed,"HTTP client is closed")
    let transfer = Transfer(client: client,ready: newFuture[HttpResponse]("HTTP headers"),body: newFuture[string]("HTTP body"),
      cancelToken: newHttpCancel(),signal: settings.signal,deadline: deadline,url: url,httpMethod: httpMethod,
      maxBytes: settings.maxBodyBytes,sink: settings.onChunk,requestBody: body.get(""))
    result = transfer.ready
    var lines: seq[string]
    for entry in headers:
      # A trailing semicolon means an explicit empty header in libcurl; a
      # bare 'name:' suppresses its built-in header instead of sending one.
      lines.add(entry.name & (if entry.value == "": ";" else: ": " & headerBytes(entry.value)))
    for name in ["accept","accept-language","sec-fetch-mode","user-agent"]:
      if not headers.hasHeader(name): lines.add(name & ": " & (case name
        of "accept": "*/*"
        of "accept-language": "*"
        of "sec-fetch-mode": "cors"
        else: "node"))
    if not headers.hasHeader("content-type"): lines.add("Content-Type:")
    lines.add("Expect:")
    var pointers: seq[cstring]
    for line in lines: pointers.add(cstring(line))
    var error: cstring
    let timeout = if deadline.isSome: max(1,(deadline.get()-getMonoTime()).inMilliseconds) else: 0'i64
    transfer.handle = apiRequest(client.api,cstring(url),cstring(httpMethod),
      (if pointers.len == 0: nil else: addr pointers[0]),csize_t(pointers.len),cstring(transfer.requestBody),
      csize_t(transfer.requestBody.len),cint(body.isSome),clong(timeout),cstring(settings.caFile),cstring(settings.proxy),
      receiveBody,receiveHeader,cast[pointer](transfer),addr error)
    if transfer.handle == nil:
      let detail = if error == nil: "" else: $error
      apiFree(error)
      raise problem(hfTransport,"fetch failed",detail=detail)
    client.requests[transfer.handle] = transfer
    if not client.pumping:
      client.pumping = true
      asyncCheck client.pump()

proc fetch*(client: HttpClient, url: string, options: HttpOptions = nil): Future[HttpResponse] {.async.} =
  if client == nil or client.closed: raise problem(hfClosed,"HTTP client is closed")
  let settings = if options == nil: newHttpOptions() else: options
  if settings.signal != nil and settings.signal.cancelled: raise problem(hfAbort,"This operation was aborted","AbortError")
  if settings.timeoutMs < -1 or settings.maxBodyBytes < 0: raise problem(hfInvalid,"Invalid HTTP transfer limit")
  var httpMethod = if settings.httpMethod == "": "GET" else: settings.httpMethod
  if not token(httpMethod): raise problem(hfInvalid,"Invalid HTTP method")
  if httpMethod.toUpperAscii() in ["CONNECT","TRACE","TRACK"]: raise problem(hfInvalid,"Unsupported HTTP method")
  if httpMethod.toUpperAscii() in ["DELETE","GET","HEAD","OPTIONS","POST","PUT"]: httpMethod = httpMethod.toUpperAscii()
  var headers = normalizedHeaders(settings.headers)
  var body = settings.body
  if body.isSome and httpMethod in ["GET","HEAD"]: raise problem(hfInvalid,"Request with GET/HEAD method cannot have body.")
  if body.isSome and not settings.binaryBody:
    body = some(utf8ForWrite(body.get()))
    if not headers.hasHeader("content-type"): headers.add(("content-type","text/plain;charset=UTF-8"))
  let deadline = if settings.timeoutMs < 0: none(MonoTime) else: some(getMonoTime()+initDuration(milliseconds=settings.timeoutMs))
  when defined(macosx):
    var current = client.resolveUrl(url)
    for redirects in 0..20:
      if deadline.isSome and getMonoTime() >= deadline.get(): raise problem(hfTimeout,"The operation was aborted due to timeout","TimeoutError")
      let response = await client.start(current.url,httpMethod,headers,body,settings,deadline)
      let location = response.header("location")
      if response.status notin [301,302,303,307,308] or location == "":
        response.redirected = redirects > 0
        return response
      response.cancel()
      if redirects == 20: raise problem(hfTransport,"fetch failed",detail="Redirect count exceeded")
      let next = client.resolveUrl(location,current.url)
      if (response.status in [301,302] and httpMethod == "POST") or (response.status == 303 and httpMethod notin ["GET","HEAD"]):
        httpMethod = "GET"; body = none(string)
        headers.keepItIf(it.name notin ["content-type","content-length","content-encoding","content-language","content-location"])
      if next.origin != current.origin:
        headers.keepItIf(it.name notin ["authorization","proxy-authorization","cookie","host"])
      current = next
  else:
    raise problem(hfTransport,"Native HTTP/TLS is not yet implemented on this host")
