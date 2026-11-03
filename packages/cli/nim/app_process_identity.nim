## App-process evidence is separate from engine ownership and signal authority.
import std/[json, os, strutils, options, tables]
import ./jsonutil, ./js_text, ./digests, ./report_time, ./process_observation

const maxAppProcesses* = 64

proc macDevAppId*(root: string): string =
  let manifest = readJson(root / "package.json")
  let configured = field(field(field(field(manifest,"xplat"),"targets"),"macos"),"package")
  let id = field(configured,"bundleIdentifier")
  if id != nil and id.kind != JNull:
    if id.kind != JString or id.getStr().len == 0 or id.getStr().len > 256 or '\0' in id.getStr():
      raise newException(ValueError,"Invalid macOS development bundle identifier")
    return id.getStr()
  "org.octane.dev." & sha256Hex(utf8ForWrite(root))[0..<16]

proc newAppIdentity*(root: string): JsonNode =
  %*{"appId": macDevAppId(root),"processes": [],"droppedProcesses": 0}

proc recordAppProcess*(identity: JsonNode, pid: int, observedAt, source: string) =
  if pid <= 0 or pid > high(int32) or reportTime(observedAt).isNone:
    raise newException(ValueError,"Invalid application process observation")
  let records = identity["processes"]
  for record in records:
    if record["pid"] == %pid and record["observedAt"] == %observedAt: return
  if records.len >= maxAppProcesses:
    records.elems.delete(0)
    identity["droppedProcesses"] = %(identity["droppedProcesses"].getInt()+1)
  records.add(%*{"pid": pid,"observedAt": observedAt,"source": source})

proc workerAppIdentity*(appId, resource: string, data: JsonNode): JsonNode =
  if field(data,"appId") != %appId: raise newException(ValueError,"Development readiness changed its app identity")
  result = %*{"appId": appId,"processes": [],"droppedProcesses": 0}
  let records = field(data,"processes")
  let dropped = field(data,"droppedProcesses")
  if records == nil or records.kind != JArray or records.len == 0 or records.len > maxAppProcesses or
      dropped == nil or dropped.kind != JInt or dropped.getInt() < 0:
    raise newException(ValueError,"Incomplete development app-process metadata; install a compatible macOS worker")
  for record in records:
    let pid = field(record,"pid")
    let executable = text(field(record,"executable"))
    if pid == nil or pid.kind != JInt or pid.getInt() <= 0 or pid.getInt() > high(int32) or
        '\0' in executable or not isAbsolute(executable) or
        not normalizedPath(executable).startsWith(expandFilename(resource) & "/bundle/"):
      raise newException(ValueError,"Invalid development app-process identity")
    # An exited worker can remove its temporary executable before the owner
    # reads final metadata. Evidence of a launch outlives that file.
    if fileExists(executable):
      try:
        if not expandFilename(executable).startsWith(expandFilename(resource) & "/bundle/"):
          raise newException(ValueError,"Development executable escapes its owned bundle")
      except OSError:
        if fileExists(executable): raise
    result.recordAppProcess(pid.getInt(),text(field(record,"observedAt")),"project-worker-launch")
  if records[^1]["pid"] != field(data,"pid") or records[^1]["executable"] != field(data,"executable"):
    raise newException(ValueError,"Development readiness does not match its latest process observation")
  result["droppedProcesses"] = dropped.copy()

proc observeAttachedApps*(identity: JsonNode, root: string, anchor: ObservedProcess) =
  let processes = observeProjectProcesses(root)
  var parents = initTable[int,int]()
  for process in processes: parents[process.pid] = process.parent
  for process in processes:
    if ".app/Contents/MacOS/" notin process.executable: continue
    var parent = process.parent
    var visited: seq[int]
    while parent > 0 and parent != anchor.pid and parents.hasKey(parent) and parent notin visited:
      visited.add(parent)
      parent = parents[parent]
    if process.pid == anchor.pid or parent == anchor.pid:
      identity.recordAppProcess(process.pid,reportTimestamp(int64(process.birth div 1000)),"macos-sdk-observation")
