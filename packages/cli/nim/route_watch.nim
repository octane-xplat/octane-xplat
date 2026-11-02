## Native route watch lifecycle: one owned build; discard invalidated results.
import std/[os, json, options, asyncdispatch, monotimes, times, strutils, sets, algorithm, tables]
import ./route_generation, ./route_operation, ./managed_process
import ./fs_events, ./jsonutil, ./js_text, ./digests, ./pathutil

type RouteWatcher* = ref object
  ready*: Future[Option[int]]
  loop: Future[void]
  project, directory, output: string
  chosenDirectory, chosenOutput: Option[string]
  sources, roots, generated: seq[string]
  events: FileEvents
  closed, queued: bool
  signal: ProcessCancel
  active: Future[RouteGeneration]
  due, scanAt: MonoTime
  observed, building: string
  onGenerated: proc(count: Option[int]) {.closure.}
  onError: proc(message: string) {.closure.}

proc within(root, file: string): bool =
  root == file or file.startsWith(root & $DirSep)
proc absolute(root, file: string): string =
  if '\0' in file: raise newException(ValueError,"Route watch path must not contain NUL")
  normalizedPath(absolutePath(utf8ForWrite(file),root))
proc existingParent(file: string): string =
  result = parentOrSelf(file)
  while not dirExists(result):
    let parent = parentOrSelf(result)
    if parent == result: raise newException(ValueError,"No existing parent for route watcher")
    result = parent
proc ignored(owner: RouteWatcher, file: string): bool =
  if owner.output.len > 0 and file.startsWith(owner.output & "."): return true
  for generated in owner.generated:
    if file == generated or file.startsWith(generated & ".tmp-"): return true
proc relevant(owner: RouteWatcher, file: string): bool =
  if owner.ignored(file): return false
  if file == owner.project / "xplat.routes.json": return true
  if owner.directory.len > 0 and (within(owner.directory,file) or within(file,owner.directory)): return true
  for source in owner.sources:
    if within(source,file) or within(file,source) or file.startsWith(source & "."): return true

proc snapshot(owner: RouteWatcher): string =
  var records: seq[string]
  var ancestors = initHashSet[string]()
  proc visit(file: string) =
    if owner.ignored(file): return
    try:
      if dirExists(file):
        let canonical = expandFilename(file)
        if canonical in ancestors: raise newException(ValueError,"Route watch directory contains a symlink cycle")
        ancestors.incl(canonical)
        try:
          records.add("D" & file)
          var children: seq[string]
          for kind, child in walkDir(file): children.add(child)
          children.sort(jsStringCompare)
          for child in children: visit(child)
        finally: ancestors.excl(canonical)
      elif fileExists(file):
        let info = getFileInfo(file)
        let ext = splitFile(file).ext
        # Only inspect relevant text. Non-text assets contribute stat metadata.
        let content = if ext in [".ts", ".tsx", ".tsrx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".md", ".json", ".jsonc"]:
          sha256Hex(readFile(file)) else: $info.size & ":" & $info.lastWriteTime.toUnix() & ":" & $info.lastWriteTime.nanosecond
        records.add("F" & file & "\0" & content)
      else: records.add("M" & file)
    except OSError, IOError:
      # An atomic save may remove a path during enumeration. Strict generation
      # owns diagnostics; this marker invalidates any old attempt meanwhile.
      records.add("X" & file)
  visit(owner.project / "xplat.routes.json")
  if owner.directory.len > 0: visit(owner.directory)
  for source in owner.sources:
    visit(source)
    let parent = parentDir(source)
    if dirExists(parent):
      var siblings: seq[string]
      for kind, file in walkDir(parent):
        if file.startsWith(source & "."): siblings.add(file)
      siblings.sort(jsStringCompare)
      for file in siblings: visit(file)
  sha256Hex(records.join("\0"))

proc refresh(owner: RouteWatcher) =
  let location = routeLocation(owner.project,owner.chosenDirectory,owner.chosenOutput,
    allowMissingSources=true,previousDirectory=owner.directory)
  let directory = if location.dir.len > 0: absolute(owner.project,location.dir) else: ""
  var output: string
  if directory.len > 0:
    let chosen = if owner.chosenOutput.isSome: owner.chosenOutput.get()
      elif field(location.config,"out") != nil: location.config["out"].getStr()
      else: directory / ".." / "routes.gen"
    output = absolute(owner.project,chosen)
    if output.endsWith(".ts"): output = output[0..^4]
  if owner.directory.len > 0 and directory.len == 0:
    raise newException(ValueError,"route/watch-no-source: restore the routing configuration or stop watching before changing its source ownership")
  if owner.output.len > 0 and output.len > 0 and owner.output != output:
    raise newException(ValueError,"route/watch-output-changed: keep the existing out path while watching; to move generated files, stop watching, regenerate, update client/type imports and remove obsolete generated entries")
  var sources: seq[string]
  let manifests = field(location.config,"manifests")
  if manifests != nil:
    for entry in manifests: sources.add(absolute(owner.project,text(entry["module"])))
  for key in ["context", "transitions"]:
    let entry = field(location.config,key)
    if entry != nil: sources.add(absolute(owner.project,text(entry["module"])))
  var roots = @[owner.project]
  proc addRoot(path: string) =
    for root in roots:
      if within(root,path): return
    var retained: seq[string]
    for root in roots:
      if not within(path,root): retained.add(root)
    roots = retained & @[path]
  if directory.len > 0: addRoot(existingParent(directory))
  for source in sources: addRoot(existingParent(source))
  roots.sort(jsStringCompare)
  if roots != owner.roots:
    let replacement = openFileEvents(roots)
    owner.events.close()
    owner.events = replacement
    owner.roots = roots
  owner.directory = directory
  owner.output = output
  owner.sources = sources

proc schedule(owner: RouteWatcher) =
  if owner.signal != nil: owner.signal.cancel()
  owner.queued = true
  owner.due = getMonoTime()+initDuration(milliseconds=50)

proc pump(owner: RouteWatcher) {.async.} =
  await sleepAsync(0) # Give callers ownership before callbacks or readiness settle.
  try:
    while true:
      if interruptedSignal() != 0: owner.closed = true
      if owner.closed and owner.signal != nil: owner.signal.cancel()
      if not owner.closed:
        let events = owner.events.drain()
        var changed = events.mustScan or getMonoTime() >= owner.scanAt
        for path in events.paths:
          if owner.relevant(path): changed = true
        if changed:
          owner.scanAt = getMonoTime()+initDuration(seconds=1)
          let current = owner.snapshot()
          if current != owner.observed:
            owner.observed = current
            owner.schedule()
      if owner.active != nil and owner.active.finished:
        try:
          let planned = owner.active.read()
          if not owner.closed and not owner.signal.cancelled:
            # Check actual inputs before committing; an OS event can arrive late.
            let current = owner.snapshot()
            if current != owner.building:
              owner.observed = current
              owner.schedule()
            else:
              owner.generated.setLen(0)
              for file in planned.outputs.keys: owner.generated.add(file)
              planned.publishRoutes()
              if owner.onGenerated != nil: owner.onGenerated(planned.count)
              if not owner.ready.finished: owner.ready.complete(planned.count)
        except CatchableError as error:
          if not owner.closed and not owner.signal.cancelled and owner.onError != nil: owner.onError(error.msg)
        owner.active = nil
        owner.signal = nil
      if owner.closed:
        if owner.active == nil: break
      elif owner.active == nil and owner.queued and getMonoTime() >= owner.due:
        owner.queued = false
        try:
          owner.refresh()
          owner.observed = owner.snapshot()
          owner.building = owner.observed
          owner.signal = newProcessCancel()
          owner.active = prepareRoutes(owner.project,
            (if owner.directory.len > 0: some(relativePath(owner.directory,owner.project)) else: none(string)),
            (if owner.output.len > 0: some(relativePath(owner.output,owner.project)) else: none(string)),
            signal=owner.signal,onWarn=proc(message: string) = stderr.writeLine(utf8ForWrite(message)))
        except CatchableError as error:
          if owner.onError != nil: owner.onError(error.msg)
      await sleepAsync(10)
  finally:
    if owner.signal != nil: owner.signal.cancel()
    if owner.active != nil:
      try: discard await owner.active
      except CatchableError: discard
    owner.events.close()
    if not owner.ready.finished: owner.ready.fail(newException(ValueError,"Route watching stopped"))

proc startRouteWatcher*(project: string, directory = none(string), output = none(string),
    onGenerated: proc(count: Option[int]) {.closure.} = nil,
    onError: proc(message: string) {.closure.} = nil): RouteWatcher =
  let root = absolutePath(project)
  result = RouteWatcher(project:root,chosenDirectory:directory,chosenOutput:output,
    ready:newFuture[Option[int]]("Native route watcher ready"),onGenerated:onGenerated,onError:onError,
    queued:true,due:getMonoTime()+initDuration(milliseconds=50),scanAt:getMonoTime()+initDuration(seconds=1),
    roots: @[root],events:openFileEvents(@[root]))
  try:
    result.observed = result.snapshot()
    result.loop = result.pump()
  except CatchableError:
    result.events.close()
    raise

proc close*(owner: RouteWatcher): Future[void] {.async.} =
  if owner == nil: return
  owner.closed = true
  if owner.signal != nil: owner.signal.cancel()
  await owner.loop

proc finished*(owner: RouteWatcher): bool = owner.loop.finished
