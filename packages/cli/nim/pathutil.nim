## Absolute ancestor walks must terminate at the filesystem root. std/os's
## parentDir(root) is empty; joining that with a filename would use the cwd.
import std/os

proc parentOrSelf*(absolute: string): string =
  let parent = parentDir(absolute)
  if parent.len == 0: absolute else: parent
