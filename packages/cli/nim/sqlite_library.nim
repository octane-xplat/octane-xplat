when defined(macosx):
  import ./sqlite_library_macos
  export sqlite_library_macos
else:
  import std/dynlib
  proc openSqliteLibrary*(): LibHandle =
    raise newException(OSError,"Native SQLite delivery is not yet implemented on this host")
