## Preserve Windows' hidden drive-current-directory entries from Nim's iterator.
import std/os

proc windowsDriveVariable*(key: string): bool =
  key.len == 3 and key[0] == '=' and key[1] in {'A'..'Z','a'..'z'} and key[2] == ':'

iterator windowsEnvironmentPairs*(): tuple[key, value: string] =
  for key,value in envPairs():
    # Nim 2.2.12 splits at the first '=', yielding ("", "C:=C:\\path")
    # for the valid hidden entry "=C:=C:\\path" from cmd/PowerShell.
    if key.len == 0:
      if value.len >= 3 and value[0] in {'A'..'Z','a'..'z'} and value[1..2] == ":=":
        yield ("=" & value[0..1],value[3..^1])
      elif value.len > 0:
        raise newException(ValueError,"Invalid inherited Windows environment entry")
    else: yield (key,value)
