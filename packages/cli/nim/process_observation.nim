## Read-only SDK process observations. They never confer signal ownership.
import std/[os, strutils, tables, algorithm, json, asyncdispatch, options, monotimes, times]
import ./jsonutil, ./js_text, ./command_probe, ./contract_failure

type ObservedProcess* = object
  pid*, parent*: int
  birth*: uint64
  executable*, cwd*: string
  command*: string

when defined(macosx):
  const snapshotHeader = currentSourcePath().parentDir / "process_snapshot.h"
  {.compile: "process_snapshot.c".}
  {.passL: "-lproc".}
  type CObserved {.importc: "XplatObservedProcess", header: snapshotHeader, bycopy.} = object
    pid, parent: cint
    started_us: uint64
    executable, cwd: cstring
  proc observe(root: cstring, rows: ptr ptr UncheckedArray[CObserved], count: ptr csize_t): cint {.
    importc: "xplat_observe_processes", header: snapshotHeader.}
  proc release(rows: ptr UncheckedArray[CObserved], count: csize_t) {.importc: "xplat_free_observations", header: snapshotHeader.}
  proc same(pid: cint, birth: uint64): cint {.importc: "xplat_same_observed_process", header: snapshotHeader.}

proc sameObservedProcess*(process: ObservedProcess): bool =
  when defined(macosx):
    let status = same(cint(process.pid),process.birth)
    if status < 0: raiseOSError(osLastError())
    status == 1
  else: raise newException(OSError,"Process observation is not implemented on this host")

proc observeProjectProcesses*(root: string): seq[ObservedProcess] =
  when defined(macosx):
    let directory = expandFilename(root)
    var rows: ptr UncheckedArray[CObserved]
    var count: csize_t
    if observe(cstring(utf8ForWrite(directory)),addr rows,addr count) != 0: raiseOSError(osLastError())
    defer: release(rows,count)
    for at in 0..<int(count):
      let row = rows[at]
      var item = ObservedProcess(pid: int(row.pid),parent: int(row.parent),birth: row.started_us,
        executable: decodeUtf8($row.executable),cwd: decodeUtf8($row.cwd))
      result.add(item)
    result.sort(proc(a,b: ObservedProcess): int = cmp(a.pid,b.pid))
  else: raise newException(OSError,"Process observation is not implemented on this host")

proc commandContains(command, value: string): bool =
  var start = 0
  while start < command.len:
    let at = command.find(value,start)
    if at < 0: return false
    let finish = at+value.len
    if (at == 0 or command[at-1] in {' ', '\t'}) and
        (finish == command.len or command[finish] in {' ', '\t'}): return true
    start = at+1

proc macEngine(process: ObservedProcess, app: JsonNode): bool =
  let root = expandFilename(text(app["root"]))
  if process.cwd != root: return false
  let command = process.command
  if extractFilename(process.executable) in ["node","bun"]:
    if " -e " in command or " --eval " in command or " --eval=" in command: return false
    for suffix in ["/macos/dev-worker.js","/macos/dev-entry.ts","/macos/dev-entry.js","/macos/dev-entry.mjs"]:
      let at = command.find(suffix)
      if at >= 0:
        let finish = at+suffix.len
        if finish == command.len or command[finish] in {' ', '\t'}: return true
  if "/NativeScript.framework/Versions/A/NativeScript " notin command: return false
  let target = field(field(field(readJson(root / "package.json"),"xplat"),"targets"),"macos")
  let dev = field(target,"dev")
  for key in ["bundleFile","shellBundleFile","hostBundleFile"]:
    let path = text(field(dev,key))
    if path.len == 0 or '\0' in path: continue
    let expected = normalizedPath(root / path)
    if expected.startsWith(root & "/") and fileExists(expected) and
        (command.commandContains(expected) or command.commandContains(expandFilename(expected))): return true

proc macAttachGroups*(app: JsonNode, processes: seq[ObservedProcess]): seq[seq[ObservedProcess]] =
  var parents = initTable[int,int]()
  var candidates = initTable[int,ObservedProcess]()
  for process in processes:
    parents[process.pid] = process.parent
    if process.macEngine(app): candidates[process.pid] = process
  var groups = initTable[int,seq[ObservedProcess]]()
  for process in candidates.values:
    var root = process.pid
    var parent = process.parent
    var visited: seq[int]
    while parents.hasKey(parent) and parent notin visited:
      visited.add(parent)
      if candidates.hasKey(parent): root = parent
      parent = parents[parent]
    groups.mgetOrPut(root,@[]).add(process)
  var leaders: seq[int]
  for leader in groups.keys: leaders.add(leader)
  leaders.sort()
  for at in 0..<leaders.len:
    let leader = leaders[at]
    var members = groups[leader]
    members.sort(proc(a,b: ObservedProcess): int =
      if a.pid == b.pid: 0 elif a.pid == leader: -1 elif b.pid == leader: 1 else: cmp(a.pid,b.pid))
    result.add(members)

proc attachCandidate*(group: seq[ObservedProcess], app: JsonNode, multiple: bool): JsonNode =
  var pids = newJArray()
  for process in group: pids.add(%process.pid)
  %*{"targetId": (if multiple: "macos:" & $group[0].pid else: "macos"),
    "name": "macOS dev processes referencing " & text(app["id"]),"processKind": "warm","pids": pids,
    "detail": $group.len & " compatible process(es) share the selected app's working directory; identity inferred from command arguments"}

proc discoverMacAttachGroups*(app: JsonNode): Future[seq[seq[ObservedProcess]]] {.async.} =
  var processes = observeProjectProcesses(text(app["root"]))
  if processes.len > 64: raise contractFailure("unavailable","Too many app-local process observations; narrow the running development tools before attaching.")
  let started = getMonoTime()
  for at in 0..<processes.len:
    let remaining = 5000-int((getMonoTime()-started).inMilliseconds)
    if remaining <= 0: raise contractFailure("timeout","Development-process discovery exceeded its deadline.")
    let command = await probeCommand("/bin/ps",@["-ww","-p",$processes[at].pid,"-o","command="],
      cwd=text(app["root"]),timeoutMs=min(2000,remaining),maxStdoutBytes=16384)
    if command.isSome: processes[at].command = command.get().strip()
  return macAttachGroups(app,processes)
