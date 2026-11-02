## Declarative route configuration. Never import or execute referenced sources.
import std/[os, json, strutils]
import ./strictjson, ./js_text, ./jsonutil

const routingFields = ["directory", "out", "manifests", "context", "transitions",
  "stacks", "base", "allowedOrigins", "allowedSchemes"]

proc exists(path: string): bool =
  if '\0' in path: return false
  let bytes = utf8ForWrite(path)
  fileExists(bytes) or dirExists(bytes)
proc fail(field, expected: string) {.noreturn.} =
  raise newException(ValueError,"xplat.routes.json " & field & ": expected " & expected)
proc word(ch: char): bool = ch in {'a'..'z','A'..'Z','0'..'9','_'}
proc identifier(value: string): bool =
  if value.len == 0 or value[0] notin {'a'..'z','A'..'Z','_','$'}: return false
  for ch in value:
    if not word(ch) and ch != '$': return false
  true

proc loadRoutingConfig*(cwd: string, allowMissingSources = false): JsonNode =
  let root = absolutePath(cwd)
  let path = root / "xplat.routes.json"
  if not exists(path): return nil
  let input = parseStrictJson(decodeUtf8(readFile(utf8ForWrite(path))))
  if input.kind != JObject: fail("config","an object")
  for key in jsObjectKeys(input):
    if key notin routingFields: fail(key,"one of " & routingFields.join(", "))
  for key in ["directory", "out"]:
    let value = field(input,key)
    if value != nil and (value.kind != JString or value.getStr().len == 0):
      fail(key,"a nonempty path")
  proc reference(value: JsonNode, key: string) =
    if value == nil or value.kind != JObject:
      fail(key,"{ module: \"./source\", export: \"exportName\" }")
    for property in jsObjectKeys(value):
      if property notin ["module", "export"]:
        fail(key,"{ module: \"./source\", export: \"exportName\" }")
    let module = field(value,"module")
    if module == nil or module.kind != JString or not module.getStr().startsWith("./"):
      fail(key & ".module","a source path starting with ./")
    let exported = field(value,"export")
    if exported == nil or exported.kind != JString or not identifier(exported.getStr()):
      fail(key & ".export","an exported identifier")
    if not allowMissingSources:
      let source = normalizedPath(absolutePath(module.getStr(),root))
      var present = false
      for ext in ["", ".ts", ".tsx", ".tsrx", ".mts", ".js", ".mjs"]:
        if exists(source & ext): present = true; break
      if not present:
        fail(key & ".module","an existing source module (" & module.getStr() & ")")
  let manifests = field(input,"manifests")
  if manifests != nil:
    if manifests.kind != JArray: fail("manifests","an array of source references")
    for i in 0..<manifests.len: reference(manifests[i],"manifests[" & $i & "]")
  for key in ["context", "transitions"]:
    let value = field(input,key)
    if value != nil: reference(value,key)
  let stacks = field(input,"stacks")
  if stacks != nil:
    if stacks.kind != JArray: fail("stacks","an array of URL-safe flow names")
    for value in stacks:
      if value.kind != JString or value.getStr().len == 0:
        fail("stacks","an array of URL-safe flow names")
      for ch in value.getStr():
        if not word(ch) and ch != '-': fail("stacks","an array of URL-safe flow names")
  let base = field(input,"base")
  if base != nil:
    if base.kind != JString or not base.getStr().startsWith("/") or
        base.getStr().startsWith("//") or base.getStr().contains({'?','#','\\'}):
      fail("base","an application path beginning with /")
  for key in ["allowedOrigins", "allowedSchemes"]:
    let values = field(input,key)
    if values == nil: continue
    if values.kind != JArray: fail(key,"an array of nonempty strings")
    for value in values:
      if value.kind != JString or value.getStr().len == 0:
        fail(key,"an array of nonempty strings")
  input
