## Exact documentation retrieval over a caller-bound snapshot or development root.
import std/[json, os, strutils, algorithm, unicode]
import ./jsonutil, ./js_text, ./markdown_chunks, ./locale_sort, ./file_text
from ./args import jsTrim

const corpora = [(".agents/design","design-note"),(".agents/docs/notes","implementation-note"),
  (".agents/docs/recipes","recipe"),("docs","guide"),("docs/notes","design-note"),("recipes","recipe")]
const platforms = ["web","ios","android","macos","linux","windows"]
proc exists(path: string): bool = fileExists(path) or dirExists(path)
proc posix(path: string): string = path.replace(DirSep,'/')
proc names(directory: string): seq[string] =
  for kind, path in walkDir(directory,checkDir=true): result.add(lastPathPart(path))
  result.sort()

proc listDocs*(root: string): JsonNode =
  var documents: seq[JsonNode]
  proc walk(directory, corpusRoot, corpus: string) =
    var entries: seq[string]
    try: entries = names(directory)
    except OSError: return
    for name in entries:
      if name.startsWith('.') or name == "node_modules": continue
      let path = directory / name
      if not exists(path): continue
      if dirExists(path): walk(path,corpusRoot,corpus)
      elif name.endsWith(".md"):
        let relative = posix(relativePath(path,root))
        if corpus != "guide" or not relative.startsWith("docs/notes/"):
          documents.add(%*{"path": relative,"corpus": corpus,"root": corpusRoot,"file": path})
  for (directory, corpus) in corpora:
    let path = root / directory
    if exists(path): walk(path,path,corpus)
  for path in ["CHANGELOG.md","FIXLOG.md","packages/tsrx-typegen/CHANGELOG.md"]:
    if exists(root / path): documents.add(%*{"path": path,"corpus": "changelog","root": root,"file": root / path})
  if exists(root / "packages"):
    for name in names(root / "packages"):
      let path = "packages/" & name & "/README.md"
      if exists(root / path): documents.add(%*{"path": path,"corpus": "readme","root": root,"file": root / path})
  var sorter = newLocaleSorter()
  defer: sorter.close()
  documents.sort(proc(a,b: JsonNode): int = sorter.compare(text(a["path"]),text(b["path"])))
  result = newJArray()
  for document in documents: result.add(document)

proc asciiWord(ch: char): bool = ch in {'a'..'z','A'..'Z','0'..'9','_'}
proc wordMatch(value, word: string): bool =
  var start = 0
  while start <= value.len-word.len:
    let at = value.find(word,start)
    if at < 0: return false
    let stop = at+word.len
    if (at == 0 or not asciiWord(value[at-1])) and (stop == value.len or not asciiWord(value[stop])): return true
    start = at+1
  false
proc platformsOf*(path, content: string): JsonNode =
  let hay = jsLower(path & "\n" & utf16Slice(content,0,2000))
  result = newJArray()
  for platform in platforms:
    if wordMatch(hay,platform): result.add(%platform)

proc excerpt(content, needle: string): JsonNode =
  let index = if needle == "": 0 else: utf16Find(jsLower(content),jsLower(needle))
  let at = max(0,index)
  let units = utf16Units(content)
  var first = 0
  if units.len >= 2:
    for position in 0..min(at,units.len-2):
      if units[position] == 10 and units[position+1] == 10: first = position
  let last = min(units.len,at+480)
  %*{"excerpt": jsTrim(utf16Slice(content,first,last)),"line": utf16Slice(content,0,at).split('\n').len}

proc whitespaceTokens(value: string): seq[string] =
  var token = ""
  for rune in value.runes:
    if jsTrim(rune.toUTF8()) == "":
      if token != "": result.add(token); token = ""
    else: token.add(rune.toUTF8())
  if token != "": result.add(token)

proc searchDocs*(root, query: string, corpus = "", platform = "", limit = 10, packageDir = ""): JsonNode =
  let needle = jsLower(jsTrim(query))
  let tokens = whitespaceTokens(needle)
  var scored: seq[tuple[doc: JsonNode,content: string,chunk: JsonNode,score: int]]
  for doc in listDocs(root):
    let path = text(doc["path"])
    let category = text(doc["corpus"])
    if category == "changelog" and packageDir != "":
      if (packageDir == "packages/tsrx-typegen") != (path == "packages/tsrx-typegen/CHANGELOG.md"): continue
    if packageDir != "" and category == "readme" and path != packageDir & "/README.md": continue
    if corpus != "" and category != corpus: continue
    let content = readTextFile(text(doc["file"]))
    if category == "changelog":
      for chunk in chunkMarkdown(%*{"path": path,"corpus": category,"content": content}):
        let region = text(chunk["content"])
        if platform != "" and %platform notin platformsOf(path,region): continue
        let hay = jsLower(text(chunk["heading"]) & "\n" & region)
        var hits = 0
        for token in tokens:
          if utf16Contains(hay,token): inc hits
        if hits > 0: scored.add((doc,region,chunk,hits+(if utf16Contains(hay,needle): 100 else: 0)))
      continue
    if platform != "" and %platform notin platformsOf(path,content): continue
    let hay = jsLower(path & "\n" & titleOf(content,path) & "\n" & content)
    var hits = 0
    for token in tokens:
      if utf16Contains(hay,token): inc hits
    if hits == 0: continue
    let score = hits+(if utf16Contains(hay,needle): 100 else: 0)+(if utf16Contains(jsLower(path),needle): 10 else: 0)
    scored.add((doc,content,nil,score))
  scored.sort(proc(a,b: typeof(scored[0])): int = cmp(b.score,a.score))
  let stop = if limit < 0: max(0,scored.len+limit) else: min(scored.len,limit)
  result = newJArray()
  for at in 0..<stop:
    let entry = scored[at]
    let path = text(entry.doc["path"])
    let preview = excerpt(entry.content,needle)
    let hit = %*{"path": path,"corpus": entry.doc["corpus"],"title": titleOf(entry.content,path),
      "platforms": platformsOf(path,entry.content),"excerpt": preview["excerpt"],"line": preview["line"]}
    if entry.chunk != nil:
      for key in ["line","endLine","heading","releaseVersion","releaseDate"]:
        let value = field(entry.chunk,key)
        if value != nil: hit[key] = value
    result.add(hit)

proc readPage*(root, path: string, offset = 0.0, limit = 24000.0): JsonNode =
  if not path.endsWith(".md") or path.startsWith('/') or ".." in path.split('/'): return nil
  let file = normalizedPath(root / path)
  if not exists(utf8ForWrite(file)): return nil
  let content = readTextFile(file)
  var corpus = "guide"
  for doc in listDocs(root):
    if text(doc["path"]) == path: corpus = text(doc["corpus"]); break
  let length = utf16Length(content)
  %*{"path": path,"corpus": corpus,"title": titleOf(content,path),"platforms": platformsOf(path,content),
    "content": utf16SliceNumber(content,offset,offset+limit),"offset": offset,
    "nextOffset": (if offset+limit < float(length): %(offset+limit) else: newJNull()),"totalLength": length}

proc docRef*(package, version, path: string): string = "xplat-doc://" & package & "@" & version & "/" & path
proc parseDocRef*(reference: string): JsonNode =
  let prefix = "xplat-doc://"
  if not reference.startsWith(prefix): return nil
  let body = reference[prefix.len..^1]
  # Dot groups reject JS line terminators; the version's negated class accepts
  # them. Search @ from the right to preserve the package group's greediness.
  let value = body
  proc lineTerminator(value: string): bool =
    value.contains({'\r','\n'}) or value.contains("\u2028") or value.contains("\u2029")
  for at in countdown(value.len-1,1):
    if value[at] != '@': continue
    let slash = value.find('/',at+1)
    if slash > at+1 and slash+1 < value.len:
      let package = value[0..<at]
      let path = value[slash+1..^1]
      if not lineTerminator(package) and not lineTerminator(path):
        return %*{"package": package,"version": value[at+1..<slash],"path": path}
  nil
