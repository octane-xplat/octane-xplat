## Node-style workspace enumeration: platform traversal plus the pinned pure Nim
## glob matcher. Never implicitly expand a literal directory into descendants.
import std/[os, strutils, tables, sets]
import glob as engine
import ./pathutil

proc bracePatterns(pattern: string): seq[string] =
  var start = -1
  var depth = 0
  var escaped = false
  for index, ch in pattern:
    if escaped: escaped = false; continue
    if ch == '\\': escaped = true; continue
    if ch == '{':
      if depth == 0: start = index
      inc depth
    elif ch == '}' and depth > 0:
      dec depth
      if depth != 0: continue
      let body = pattern[start+1..<index]
      var choices: seq[string]
      var nested = 0
      var since = 0
      for offset, inner in body:
        if inner == '{': inc nested
        elif inner == '}': dec nested
        elif inner == ',' and nested == 0:
          choices.add(body[since..<offset]); since = offset+1
      if choices.len > 0: choices.add(body[since..^1])
      else:
        let series = body.split("..")
        if series.len in [2,3]:
          var first, last, step: int
          var numeric = true
          try:
            first = parseInt(series[0]); last = parseInt(series[1])
            step = if series.len == 3: abs(parseInt(series[2])) else: 1
          except ValueError:
            numeric = false
            if series[0].len == 1 and series[1].len == 1:
              first = ord(series[0][0]); last = ord(series[1][0]); step = 1
            else: step = 0
          if step > 0:
            if first > last: step = -step
            var value = first
            while (step > 0 and value <= last) or (step < 0 and value >= last):
              if choices.len >= 10000: raise newException(ValueError, "Workspace brace expansion exceeds 10000 items")
              if numeric:
                let width = max(series[0].len,series[1].len)
                let padded = (series[0].len > 1 and series[0][0] == '0') or (series[1].len > 1 and series[1][0] == '0')
                choices.add(if padded: ($value).align(width,'0') else: $value)
              else: choices.add($char(value))
              value += step
      if choices.len == 0:
        # Non-expanding braces are literal in Node's glob grammar.
        return bracePatterns(pattern[0..<start] & "\\{" & body & "\\}" & pattern[index+1..^1])
      for choice in choices:
        for expanded in bracePatterns(pattern[0..<start] & choice & pattern[index+1..^1]): result.add(expanded)
      return
  result = @[pattern]

proc compatiblePattern(pattern: string): string =
  var at = 0
  while at < pattern.len:
    let ch = pattern[at]
    if ch == '\\' and at+1 < pattern.len:
      result.add(pattern[at..at+1]); at += 2; continue
    if ch == '[' and pattern.find(']',at+1) < 0: result.add("\\[")
    else: result.add(ch)
    inc at

proc workspaceGlob*(root: string, included, excluded: seq[string]): seq[string] =
  var compiled = initTable[string,engine.Glob]()
  var seen = initHashSet[string]()
  var found: seq[string]
  proc partMatches(input, pattern: string, checkPeriod = true): bool =
    if checkPeriod and input.startsWith(".") and not (pattern.startsWith(".") or pattern.startsWith("[.]")): return false
    # The upstream negated extglob converter excludes prefixes. Node excludes
    # the complete alternative, so match its variable span explicitly here.
    var depth = 0
    var neg = -1
    var closing = -1
    for at in 0..<pattern.len:
      if pattern[at] == '(':
        if depth == 0 and at > 0 and pattern[at-1] == '!': neg = at-1
        inc depth
      elif pattern[at] == ')':
        dec depth
        if neg >= 0 and depth == 0: closing = at; break
    if neg >= 0 and closing >= 0:
      let prefix = pattern[0..<neg]
      let banned = "@(" & pattern[neg+2..<closing] & ")"
      let suffix = pattern[closing+1..^1]
      for first in 0..input.len:
        if first < input.len and (ord(input[first]) and 0xc0) == 0x80: continue
        if not partMatches(input[0..<first],prefix,false): continue
        for last in first..input.len:
          if last < input.len and (ord(input[last]) and 0xc0) == 0x80: continue
          if not partMatches(input[first..<last],banned,false) and partMatches(input[last..^1],suffix,false): return true
      return false
    let adjusted = compatiblePattern(pattern)
    if not compiled.hasKey(adjusted): compiled[adjusted] = engine.glob(adjusted,isDos=false,ignoreCase=false)
    engine.matches(input,compiled[adjusted])
  proc pathMatches(input, pattern: string): bool =
    let actual = input.replace('\\','/').split('/')
    var adjusted = pattern
    while adjusted.startsWith("./"): adjusted = adjusted[2..^1]
    let expected = adjusted.split('/')
    proc visit(at, next: int): bool =
      if next == expected.len: return at == actual.len
      if expected[next] == "**":
        if visit(at,next+1): return true
        return at < actual.len and not actual[at].startsWith(".") and visit(at+1,next)
      at < actual.len and partMatches(actual[at],expected[next]) and visit(at+1,next+1)
    visit(0,0)
  var exclusions: seq[string]
  for pattern in excluded:
    for expanded in bracePatterns(pattern): exclusions.add(expanded)
  proc ignored(path: string): bool =
    let relative = relativePath(path,root).replace('\\','/')
    for segment in relative.split('/'):
      if segment in ["node_modules", ".git"]: return true
    for pattern in exclusions:
      if pathMatches(relative,pattern): return true
  proc collect(path: string) =
    let normalized = normalizedPath(absolutePath(path))
    if normalized notin seen and not ignored(normalized): seen.incl(normalized); found.add(normalized)
  for pattern in included:
    for expanded in bracePatterns(pattern):
      var parts = expanded.split('/')
      var base = root
      if expanded.isAbsolute():
        base = $DirSep
        while parts.len > 0 and parts[0] == "": parts.delete(0)
      proc visit(path: string, index: int) =
        if ignored(path): return
        if index == parts.len:
          if fileExists(path) or dirExists(path) or symlinkExists(path): collect(path)
          return
        let part = parts[index]
        if part == "" or part == ".": visit(path,index+1); return
        if part == "..": visit(parentOrSelf(path),index+1); return
        if part == "**":
          visit(path,index+1)
          try:
            for kind, child in walkDir(path):
              if lastPathPart(child).startsWith(".") or ignored(child): continue
              if index == parts.high: collect(child)
              if kind == pcDir: visit(child,index)
          except OSError: discard
          return
        if not engine.hasMagic(part):
          let literal = part.replace("\\", "")
          visit(path / literal,index+1)
          return
        try:
          for kind, child in walkDir(path):
            if partMatches(lastPathPart(child),part): visit(child,index+1)
        except OSError: discard
      visit(base,0)
  result = found
