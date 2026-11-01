## Markdown sections with the TypeScript chunker's fence and release ownership.
import std/[json, strutils, unicode]
import regex
import ./jsonutil, ./js_text, ./digests
from ./args import jsTrim

const jsSpace* = "[\\x09-\\x0d\\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]"
const lineBreak = "[\r\n\u2028\u2029]"
const noLineBreak = "[^\r\n\u2028\u2029]"
let fencePattern = re2("^" & jsSpace & "{0,3}(`{3,}|~{3,})")
let headingPattern = re2("^(#{1,6})" & jsSpace & "+(" & noLineBreak & "+)$")
let titlePattern = re2("(?:^|" & lineBreak & ")#" & jsSpace & "+(" & noLineBreak & "+)(?:$|" & lineBreak & ")")
let releasePattern = re2("(?:Octane Xplat" & jsSpace & "+|\\[v?|^v?)([0-9]+\\.[0-9]+\\.[0-9]+(?:-[A-Za-z0-9_.-]+)?)")
let datePattern = re2("(?:^|[^A-Za-z0-9_])([0-9]{4}-[0-9]{2}-[0-9]{2})(?:$|[^A-Za-z0-9_])")

proc regexText(value: string): string =
  # The regex engine requires valid UTF-8. A lone unit has the same category
  # as a private-use placeholder for these patterns, with the same byte width.
  for rune in value.runes:
    result.add(if int(rune) in 0xd800..0xdfff: "\uE000" else: rune.toUTF8())

proc titleOf*(content, path: string): string =
  var matched: RegexMatch2
  if regexText(content).find(titlePattern,matched): return jsTrim(content[matched.group(0)])
  let name = path.split('/')[^1]
  if name.endsWith(".md"): name[0..<name.len-3] else: name

proc chunkMarkdown*(document: JsonNode): JsonNode =
  let path = text(document["path"])
  let corpus = text(document["corpus"])
  let lines = text(document["content"]).split('\n')
  let chunks = newJArray()
  var title = path
  var heading, releaseVersion, releaseDate, fence: string
  var start, size: int
  proc emit(stop: int) =
    let content = jsTrim(lines[start..<stop].join("\n"))
    if content != "":
      let chunk = %*{"key": sha256Hex(utf8ForWrite(path & ":" & $start & ":" & content)),
        "path": path,"corpus": corpus,"title": title,"heading": heading,
        "line": start+1,"endLine": stop,"content": content}
      if releaseVersion != "": chunk["releaseVersion"] = %releaseVersion
      if releaseDate != "": chunk["releaseDate"] = %releaseDate
      chunks.add(chunk)
    start = stop
    size = 0
  for at, line in lines:
    var matched: RegexMatch2
    let safe = regexText(line)
    if safe.find(fencePattern,matched):
      let marker = line[matched.group(0)]
      if fence == "": fence = marker
      elif marker[0] == fence[0] and marker.len >= fence.len: fence = ""
    elif fence == "":
      if safe.find(headingPattern,matched) and matched.boundaries.b == safe.high:
        emit(at)
        heading = line[matched.group(1)]
        if line[matched.group(0)].len == 1: title = heading
        if corpus == "changelog" and line[matched.group(0)].len <= 2:
          var release: RegexMatch2
          releaseVersion = if regexText(heading).find(releasePattern,release): heading[release.group(0)] else: ""
          releaseDate = if regexText(heading).find(datePattern,release): heading[release.group(0)] else: ""
      elif size >= 900 and jsTrim(line) == "": emit(at+1)
    size += utf16Length(line)+1
  emit(lines.len)
  chunks
