## The macOS system SQLite is loaded only when a database is requested.
import std/dynlib
proc openSqliteLibrary*(): LibHandle =
  result = loadLib("/usr/lib/libsqlite3.dylib")
  if result == nil: raise newException(OSError,"System SQLite is unavailable")
