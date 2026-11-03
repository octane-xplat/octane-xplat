## Literal Windows CRT argv quoting, shared by engine and owner launches.
import std/strutils

proc windowsQuoted*(value: string): string =
  # The CRT/CommandLineToArgvW convention: backslashes before quotes/end double.
  result = "\""
  var slashes = 0
  for ch in value:
    if ch == '\\': inc slashes
    else:
      result.add(repeat('\\',slashes*(if ch == '"': 2 else: 1)))
      if ch == '"': result.add('\\')
      result.add(ch)
      slashes = 0
  result.add(repeat('\\',slashes*2))
  result.add('"')
