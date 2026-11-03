## Same-user development bridge files. Reachability alone never grants authority.
import std/[os, json, times, strutils, algorithm]
import ./strictjson, ./jsonutil, ./js_text, ./http_url
import ./contract_failure
when defined(posix):
  import std/posix
  var noFollow {.importc: "O_NOFOLLOW",header: "<fcntl.h>".}: cint
  var closeExec {.importc: "O_CLOEXEC",header: "<fcntl.h>".}: cint

proc sameActionRoot*(left, right: string): bool =
  if '\0' in left or '\0' in right: return false
  try: expandFilename(left) == expandFilename(right)
  except OSError: false

proc localBridgeUrl(value: string): string =
  if value.len > 4096 or '\0' in value: raise newException(ValueError,"Invalid bridge URL")
  let url = normalizeHttpUrl(value)
  let address = url.origin[url.origin.find("://")+3..^1]
  let local = address == "[::1]" or address.startsWith("[::1]:") or address.split(':')[0] in ["127.0.0.1","localhost"]
  if not local or url.url != url.origin & "/": raise newException(ValueError,"Bridge URL must be a loopback HTTP(S) origin")
  url.origin

proc readEndpoint(path: string): JsonNode =
  when defined(posix):
    let fd = posix.open(cstring(utf8ForWrite(path)),O_RDONLY or noFollow or O_NONBLOCK or closeExec)
    if fd < 0: return nil
    defer: discard posix.close(fd)
    var info: Stat
    if fstat(fd,info) != 0 or not S_ISREG(info.st_mode) or info.st_uid != geteuid() or
        (info.st_mode and Mode(0o022)) != Mode(0) or info.st_size > 65536: return nil
    var bytes: string
    var buffer: array[4096,char]
    while true:
      let count = posix.read(fd,addr buffer[0],buffer.len)
      if count == 0: break
      if count < 0:
        if errno == EINTR: continue
        return nil
      if count > 65536-bytes.len: return nil
      let offset = bytes.len
      bytes.setLen(offset+count)
      copyMem(addr bytes[offset],addr buffer[0],count)
    parseStrictJson(decodeUtf8(bytes))
  else: nil

proc pidAlive(value: JsonNode): bool =
  if value == nil or value.kind notin [JInt,JFloat]: return false
  let number = value.getFloat()
  if number <= 0 or number > float(high(int32)) or number != float(int(number)): return false
  when defined(posix): posix.kill(Pid(int(number)),0) == 0
  else: false

proc scanActionEndpoints*(appRoot: string): seq[JsonNode] =
  if '\0' in appRoot: return
  let directory = appRoot / "node_modules/.cache/xplat/dev-bridge"
  var names: seq[string]
  try:
    for kind,path in walkDir(directory):
      if names.len >= 256: raise contractFailure("unavailable","Development bridge inventory exceeds 256 entries; no instance was selected.")
      names.add(path)
  except OSError: return
  names.sort()
  for path in names:
    if result.len >= 64: raise contractFailure("unavailable","Development bridge inventory exceeds 64 endpoints; no instance was selected.")
    if not path.endsWith(".json"): continue
    try:
      let file = readEndpoint(path)
      if file == nil or file.kind != JObject: continue
      let server = field(file,"serverId")
      let token = field(file,"token")
      let url = field(file,"url")
      if server == nil or server.kind != JString or text(server).len notin 1..256 or
          token == nil or token.kind != JString or text(token).len notin 1..1024 or
          url == nil or url.kind != JString: continue
      if text(token).contains({'\r','\n','\0'}) or text(server).contains({'/','\0'}): continue
      let claimed = field(file,"appRoot")
      let root = if claimed == nil or claimed.kind == JNull: appRoot else: text(claimed)
      if not sameActionRoot(root,appRoot): continue
      if not pidAlive(field(file,"pid")) and (getTime()-getLastModificationTime(path)).inMilliseconds > 60000: continue
      # Neither the token nor the observed PID enters public instance metadata.
      result.add(%*{"serverId": server,"token": token,"url": localBridgeUrl(text(url)),"appRoot": root})
    except CatchableError: discard
