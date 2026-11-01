import ../../packages/cli/nim/args
import ../../packages/cli/nim/[strictjson, json_wire]
import std/[json, strutils]
for line in stdin.lines:
  if line.len == 0: continue
  let request = parseStrictJson(line)
  var argv: seq[string]
  for token in request["argv"]: argv.add(token.getStr())
  echo wireJson(parseArgs(request["command"], argv))
