## Read existing macOS .ips evidence; never sample, signal or extract system traces.
import std/[os, json, strutils, options, times, algorithm, asyncdispatch, unicode, monotimes]
import ./jsonutil, ./strictjson, ./js_text, ./json_wire, ./digests, ./contract_failure
import ./report_time, ./host_storage, ./host_bootstrap

const maxReportBytes* = 4*1024*1024
const maxReportTotal* = 16*1024*1024
const maxReports* = 10
const appleCoverage = "Local Apple .ips crash reports only; reports can arrive after process exit. Other report directories and hang reports are not scanned. Scan limits: 4096 directory entries, 100 recent files, 4 MiB each and 64 MiB total; a five-second budget is checked between entries/files."

proc validReportId*(id: string): bool =
  if id.len != 71 or not id.startsWith("report_"): return false
  for ch in id[7..^1]:
    if ch notin {'a'..'f','0'..'9'}: return false
  true

proc coverage(status, detail: string): JsonNode = %*{"status": status,"detail": detail}

proc orderReports(a,b: JsonNode): int =
  let time = cmp(text(b["timestamp"]),text(a["timestamp"]))
  if time == 0: cmp(text(a["id"]),text(b["id"])) else: time

when defined(macosx):
  import std/posix
  var noFollow {.importc: "O_NOFOLLOW", header: "<fcntl.h>".}: cint
  var closeExec {.importc: "O_CLOEXEC", header: "<fcntl.h>".}: cint
  proc readSource(path: string, maximum: int): string =
    if '\0' in path: raise newException(ValueError,"Invalid report source path")
    let fd = posix.open(cstring(utf8ForWrite(path)),O_RDONLY or O_NONBLOCK or noFollow or closeExec)
    if fd < 0: raiseOSError(osLastError())
    defer: discard posix.close(fd)
    var info: Stat
    if fstat(fd,info) != 0: raiseOSError(osLastError())
    if not S_ISREG(info.st_mode) or info.st_size < 0 or info.st_size > maximum:
      raise newException(IOError,"Report source exceeds its size/type limit")
    var buffer: array[16384,char]
    while true:
      let count = posix.read(fd,addr buffer[0],buffer.len)
      if count < 0:
        if errno == EINTR: continue
        raiseOSError(osLastError())
      if count == 0: break
      if count > maximum-result.len: raise newException(IOError,"Report source exceeds its byte limit")
      let at = result.len
      result.setLen(at+count)
      copyMem(addr result[at],addr buffer[0],count)
    if validateUtf8(result) >= 0: raise newException(ValueError,"Report is not UTF-8")
else:
  proc readSource(path: string, maximum: int): string = raise newException(OSError,"Apple report reads require macOS")

proc descriptions(directory: string): seq[JsonNode] =
  if not existingPrivateHostDirectory(directory): return
  var total = 0
  for kind,path in walkDir(directory,checkDir=true):
    let name = extractFilename(path)
    if not name.endsWith(".json") or not validReportId(name[0..^6]): continue
    let bytes = readHostFile(path,16384)
    if bytes.isNone: continue
    let value = parseStrictJson(decodeUtf8(bytes.get()))
    let id = name[0..^6]
    if field(value,"id") != %id or field(value,"kind") != %"native-crash" or
        field(value,"source") != %"apple-ips" or field(value,"association") notin [%"confirmed",%"candidate"]:
      raise newException(ValueError,"Invalid retained native report metadata")
    for key in ["timestamp","summary","associationReason"]:
      if field(value,key) == nil or value[key].kind != JString:
        raise newException(ValueError,"Invalid retained report description")
    let length = field(value,"bytes")
    if length == nil or length.kind != JInt or length.getInt() < 0 or length.getInt() > maxReportBytes:
      raise newException(ValueError,"Invalid retained report length")
    result.add(value)
    total += length.getInt()
    if total > maxReportTotal: raise newException(ValueError,"Retained native report bytes exceed their limit")
    if result.len > maxReports: raise newException(ValueError,"Retained native report count exceeds its limit")
  result.sort(orderReports)

proc readNativeReport*(directory, id: string): JsonNode =
  if not validReportId(id): raise contractFailure("invalid_selection","Invalid native report id.")
  for report in descriptions(directory):
    if report["id"] != %id: continue
    let bytes = readHostFile(directory / (id & ".txt"),maxReportBytes)
    if bytes.isNone or "report_" & sha256Hex(bytes.get()) != id or bytes.get().len != report["bytes"].getInt():
      raise contractFailure("execution_failure","Retained report content failed its integrity check.")
    result = report.copy()
    result["content"] = %decodeUtf8(bytes.get())
    return
  raise contractFailure("not_found","No retained report with this id for the selected run.")

proc inWindow(run: JsonNode, stamp: Option[int64]): bool =
  if stamp.isNone: return false
  let first = reportTime(text(field(run,"startedAt")))
  let last = if truthy(field(run,"endedAt")): reportTime(text(run["endedAt"])) else: some(int64(epochTime()*1000))
  first.isSome and last.isSome and stamp.get() >= first.get()-5000 and stamp.get() <= last.get()+5000

proc appleReport*(run: JsonNode, content: string): JsonNode =
  let split = content.find('\n')
  if split < 0: raise newException(ValueError,"Missing Apple report body")
  let header = parseStrictJson(content[0..<split])
  if scalarString(field(header,"bug_type")) != "309": return nil
  let body = parseStrictJson(content[split+1..^1])
  if header.kind != JObject or body.kind != JObject: raise newException(ValueError,"Invalid Apple report objects")
  let platform = if field(body,"platform") == nil or body["platform"].kind == JNull: field(header,"platform") else: body["platform"]
  if not jsStrictEqual(platform,%1) and platform != %"1": return nil
  let time = field(body,"captureTime")
  let stamp = reportTime(text(if time == nil or time.kind == JNull: field(header,"timestamp") else: time))
  if not inWindow(run,stamp): return nil
  let identity = field(run,"nativeIdentity")
  var bundle = field(header,"bundleID")
  if bundle == nil or bundle.kind == JNull: bundle = field(field(body,"bundleInfo"),"CFBundleIdentifier")
  if truthy(bundle) and bundle != field(identity,"appId"): return nil
  let launch = reportTime(text(field(body,"procLaunch")))
  var confirmed = false
  let processes = field(identity,"processes")
  if processes != nil and processes.kind == JArray and inWindow(run,launch):
    for process in processes:
      let observed = reportTime(text(field(process,"observedAt")))
      if jsStrictEqual(field(process,"pid"),field(body,"pid")) and observed.isSome and abs(observed.get()-launch.get()) <= 5000:
        confirmed = true
        break
  if not confirmed and bundle != field(identity,"appId"): return nil
  let exception = field(body,"exception")
  let termination = field(body,"termination")
  let exceptionType = field(exception,"type")
  var summary = if exceptionType == nil or exceptionType.kind == JNull: "Native crash" else: scalarString(exceptionType)
  if truthy(field(exception,"signal")): summary.add(" (" & scalarString(exception["signal"]) & ")")
  if truthy(field(termination,"namespace")): summary.add("; " & scalarString(termination["namespace"]) & ": " & scalarString(field(termination,"code")))
  %*{"kind": "native-crash","source": "apple-ips","timestamp": reportTimestamp(stamp.get()),
    "summary": utf16Slice(summary,0,512),"association": (if confirmed: "confirmed" else: "candidate"),
    "associationReason": (if confirmed: "Observed host PID, launch time and report time match this run; bundle id also matches when present."
      else: "Bundle id and report time match; exact process ownership is not established."),"content": content}

proc discoverNativeReports*(directory: string, run: JsonNode, home = getHomeDir()): Future[JsonNode] {.async.} =
  var reports = descriptions(directory)
  var status: JsonNode
  var found: seq[JsonNode]
  var limited = false
  let identity = field(run,"nativeIdentity")
  if field(run,"platform") != %"macos":
    status = coverage("unsupported","Native report discovery currently supports macOS only in this CLI build.")
  elif text(field(identity,"appId")).len == 0:
    status = coverage("unavailable","This run has no recorded native app identity. Start a new native development run and wait for app-process observations.")
  else:
    when not defined(macosx): status = coverage("unavailable","Apple report discovery requires the Mac that ran the app.")
    else:
      let source = home / "Library/Logs/DiagnosticReports"
      var partial = false
      var candidates: seq[tuple[path: string,mtime: times.Time]]
      let started = getMonoTime()
      try:
        if not dirExists(source) or symlinkExists(source): raise newException(OSError,"Apple report directory is unavailable")
        let first = reportTime(text(field(run,"startedAt")))
        if first.isNone: raise newException(ValueError,"Invalid run time")
        var visited = 0
        for kind,path in walkDir(source,checkDir=true):
          inc visited
          if visited > 4096 or (getMonoTime()-started).inMilliseconds > 5000:
            partial = true
            break
          if visited mod 32 == 0: await sleepAsync(0)
          if not path.endsWith(".ips"): continue
          try:
            let modified = getLastModificationTime(path)
            if int64(modified.toUnixFloat()*1000) >= first.get()-5000: candidates.add((path,modified))
          except CatchableError: partial = true
        candidates.sort(proc(a,b: tuple[path: string,mtime: times.Time]): int = cmp(b.mtime,a.mtime))
        if candidates.len > 100: partial = true
        var scanned = 0
        for at in 0..<min(100,candidates.len):
          if (getMonoTime()-started).inMilliseconds > 5000:
            partial = true
            break
          try:
            let content = readSource(candidates[at].path,min(maxReportBytes,64*1024*1024-scanned))
            scanned += content.len
            let report = appleReport(run,content)
            if report != nil: found.add(report)
          except CatchableError: partial = true
          await sleepAsync(0)
        status = coverage((if partial: "partial" elif found.len > 0: "available" else: "none-found"),appleCoverage)
      except CatchableError:
        status = coverage("unavailable","Apple report directory cannot be read or the run time is invalid.")
  if found.len > 0:
    privateHostDirectory(directory)
    let lock = tryHostLock(directory / "write.lock")
    if lock == nil:
      reports = descriptions(directory)
      status = coverage("partial","Another reader is retaining reports. Retry to refresh this snapshot.")
    else:
      defer: closeHostLock(lock)
      reports = descriptions(directory)
      var total = 0
      for report in reports: total += report["bytes"].getInt()
      found.sort(proc(a,b: JsonNode): int = cmp(text(b["timestamp"]),text(a["timestamp"])))
      for item in found:
        let content = text(item["content"])
        let id = "report_" & sha256Hex(content)
        var duplicate = false
        for report in reports:
          if report["id"] == %id: duplicate = true
        if duplicate: continue
        if reports.len >= maxReports or content.len > maxReportBytes or total+content.len > maxReportTotal:
          limited = true
          continue
        let report = item.copy()
        report.delete("content")
        report["id"] = %id
        report["bytes"] = %content.len
        # Publish original first, metadata last; incomplete pairs are not listed.
        discard publishHostFile(directory / (id & ".txt"),content)
        discard publishHostFile(directory / (id & ".json"),wireJson(report))
        reports.add(report)
        total += content.len
  if limited:
    status = coverage("partial",text(status["detail"]) & " Retention limit reached: 10 reports, 4 MiB each, 16 MiB total; oversized reports are omitted intact.")
  if field(identity,"droppedProcesses") != nil and identity["droppedProcesses"].getInt() > 0:
    status = coverage("partial",text(status["detail"]) & " Older app-process observations were dropped; unmatched reports can only be candidates.")
  if reports.len > 0 and status["status"] == %"none-found": status["status"] = %"available"
  reports.sort(orderReports)
  result = %*{"reports": reports,"coverage": status}
