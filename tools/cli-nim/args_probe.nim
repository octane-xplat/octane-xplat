import ../../packages/cli/nim/args
import std/[json, strutils]
for line in stdin.lines:
  if line.len == 0: continue
  let request = parseJson(line)
  var argv: seq[string]
  for token in request["argv"]: argv.add(token.getStr())
  echo parseArgs(request["command"], argv)
