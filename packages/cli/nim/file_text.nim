when defined(posix):
  import ./file_text_posix
  export file_text_posix
else:
  import ./js_text
  proc readTextFile*(path: string): string = decodeUtf8(readFile(utf8ForWrite(path)))
