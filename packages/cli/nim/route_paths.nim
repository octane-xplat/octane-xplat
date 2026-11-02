## File-router path vocabulary, matching the CLI and shared route-pattern engine.
import std/[json, strutils, options, os]

proc normalizeRouteSegment*(segment: string): string =
  if not segment.startsWith("[") or not segment.endsWith("]"): return segment
  let inner = segment[1..^2]
  if inner.startsWith("[") and inner.endsWith("]"):
    let optional = inner[1..^2]
    return if optional.startsWith("..."): "*" & optional[3..^1] else: ":" & optional & "?"
  if inner.startsWith("..."): "*" & inner[3..^1] else: ":" & inner

proc routeParamName*(segment: string): Option[string] =
  if segment.startsWith(":"):
    return some(if segment.endsWith("?"): segment[1..^2] else: segment[1..^1])
  if segment.startsWith("*"):
    let name = segment[1..^1]
    return some(if name.len == 0: "*" else: name)
  none(string)

proc stripExtension(path: string, markdown: bool): string =
  let extensions = if markdown: @["md"] else: @["tsrx", "tsx", "ts", "mts", "cts", "js", "mjs", "cjs", "jsx"]
  for ext in extensions:
    if path.endsWith("." & ext): return path[0..<path.len-ext.len-1]
  path

proc routeFor*(relative: string, markdown = false): JsonNode =
  var path = relative
  when DirSep != '/': path = path.replace(DirSep,'/')
  let parts = stripExtension(path,markdown).split('/')
  var base = parts[^1]
  for platform in ["web", "mobile", "ios", "android", "macos", "windows", "linux"]:
    if base.endsWith("." & platform): base = base[0..<base.len-platform.len-1]; break
  var presentation, transition: string
  for kind in ["modal", "fade", "push"]:
    if base.endsWith("+" & kind):
      presentation = if kind == "fade": "push" else: kind
      if kind == "fade": transition = "fade"
      base = base[0..<base.len-kind.len-1]
      break
  if base == "_layout": return nil
  var segments: seq[string]
  for i in 0..<parts.len-1: segments.add(parts[i])
  segments.add(base)
  if segments[^1] == "index": segments.setLen(segments.len-1)
  var params: seq[string]
  for segment in segments.mitems:
    segment = normalizeRouteSegment(segment)
    let name = routeParamName(segment)
    if name.isSome: params.add(name.get())
  let name = segments.join("/")
  result = %*{"name": (if name.len == 0: "index" else: name),"segments": segments,"params": params}
  if presentation.len > 0: result["presentation"] = %presentation
  if transition.len > 0: result["transition"] = %transition
