## Scoped SQLite connections and reusable statements for the docs index.
## Text bindings use UTF-8 byte lengths and SQLITE_TRANSIENT ownership.
import std/[json, dynlib, strutils]
import ./sqlite_library, ./js_text

type
  OpenDatabase = proc(path: cstring, db: ptr pointer, flags: cint, vfs: cstring): cint {.cdecl.}
  CloseDatabase = proc(db: pointer): cint {.cdecl.}
  ErrorMessage = proc(db: pointer): cstring {.cdecl.}
  Execute = proc(db: pointer, sql: cstring, callback, context: pointer, error: ptr cstring): cint {.cdecl.}
  FreeMemory = proc(memory: pointer) {.cdecl.}
  Prepare = proc(db: pointer, sql: cstring, length: cint, statement: ptr pointer, tail: pointer): cint {.cdecl.}
  StatementAction = proc(statement: pointer): cint {.cdecl.}
  BindText = proc(statement: pointer, index: cint, value: cstring, length: cint, destructor: pointer): cint {.cdecl.}
  BindDouble = proc(statement: pointer, index: cint, value: cdouble): cint {.cdecl.}
  BindNull = proc(statement: pointer, index: cint): cint {.cdecl.}
  ColumnCount = proc(statement: pointer): cint {.cdecl.}
  ColumnType = proc(statement: pointer, column: cint): cint {.cdecl.}
  ColumnText = proc(statement: pointer, column: cint): pointer {.cdecl.}
  ColumnName = proc(statement: pointer, column: cint): cstring {.cdecl.}
  ColumnInteger = proc(statement: pointer, column: cint): int64 {.cdecl.}
  ColumnDouble = proc(statement: pointer, column: cint): cdouble {.cdecl.}
  LibraryVersion = proc(): cstring {.cdecl.}
  SqliteApi = object
    open: OpenDatabase
    close: CloseDatabase
    error: ErrorMessage
    exec: Execute
    free: FreeMemory
    prepare: Prepare
    finalize, reset, clear, step: StatementAction
    bindText: BindText
    bindDouble: BindDouble
    bindNull: BindNull
    columns: ColumnCount
    columnType, columnBytes: ColumnType
    columnText: ColumnText
    columnName: ColumnName
    columnInteger: ColumnInteger
    columnDouble: ColumnDouble
    version: LibraryVersion
  SqliteDatabase* = ref object
    library: LibHandle
    handle: pointer
    api: SqliteApi
  SqliteStatement* = ref object
    database: SqliteDatabase
    handle: pointer
    row: bool

proc failure(database: SqliteDatabase) {.noreturn.} =
  raise newException(IOError,decodeUtf8($database.api.error(database.handle)))
proc requireOpen(database: SqliteDatabase) =
  if database == nil or database.handle == nil: raise newException(IOError,"Database is closed")
proc requireOpen(statement: SqliteStatement) =
  if statement == nil or statement.handle == nil: raise newException(IOError,"Statement is closed")
  statement.database.requireOpen()

proc close*(database: SqliteDatabase) =
  if database == nil or database.handle == nil: return
  # sqlite3_close keeps a connection open on SQLITE_BUSY. Do not unload its
  # code while a live prepared statement still owns the connection.
  if database.api.close(database.handle) != 0: database.failure()
  database.handle = nil
  unloadLib(database.library)
  database.library = nil
proc close*(statement: SqliteStatement) =
  if statement == nil or statement.handle == nil: return
  # A failed step's error was already surfaced before finalization.
  discard statement.database.api.finalize(statement.handle)
  statement.handle = nil
  statement.row = false

proc openSqlite*(path: string): SqliteDatabase =
  if '\0' in path: raise newException(ValueError,"Database path contains a null byte")
  let library = openSqliteLibrary()
  result = SqliteDatabase(library: library)
  try:
    proc symbol(name: string): pointer =
      result = symAddr(library,name)
      if result == nil: raise newException(OSError,"System SQLite symbol is unavailable: " & name)
    result.api = SqliteApi(
      open: cast[OpenDatabase](symbol("sqlite3_open_v2")),close: cast[CloseDatabase](symbol("sqlite3_close")),
      error: cast[ErrorMessage](symbol("sqlite3_errmsg")),exec: cast[Execute](symbol("sqlite3_exec")),
      free: cast[FreeMemory](symbol("sqlite3_free")),prepare: cast[Prepare](symbol("sqlite3_prepare_v2")),
      finalize: cast[StatementAction](symbol("sqlite3_finalize")),reset: cast[StatementAction](symbol("sqlite3_reset")),
      clear: cast[StatementAction](symbol("sqlite3_clear_bindings")),step: cast[StatementAction](symbol("sqlite3_step")),
      bindText: cast[BindText](symbol("sqlite3_bind_text")),
      bindDouble: cast[BindDouble](symbol("sqlite3_bind_double")),bindNull: cast[BindNull](symbol("sqlite3_bind_null")),
      columns: cast[ColumnCount](symbol("sqlite3_column_count")),columnType: cast[ColumnType](symbol("sqlite3_column_type")),
      columnBytes: cast[ColumnType](symbol("sqlite3_column_bytes")),columnText: cast[ColumnText](symbol("sqlite3_column_text")),
      columnName: cast[ColumnName](symbol("sqlite3_column_name")),columnInteger: cast[ColumnInteger](symbol("sqlite3_column_int64")),
      columnDouble: cast[ColumnDouble](symbol("sqlite3_column_double")),version: cast[LibraryVersion](symbol("sqlite3_libversion")))
    let encoded = utf8ForWrite(path)
    # SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX.
    let status = result.api.open(cstring(encoded),addr result.handle,2 or 4 or 0x10000,nil)
    if status != 0:
      let message = if result.handle == nil: "Unable to allocate SQLite connection" else: decodeUtf8($result.api.error(result.handle))
      if result.handle != nil: discard result.api.close(result.handle)
      result.handle = nil
      raise newException(IOError,message)
  except CatchableError:
    unloadLib(library)
    result.library = nil
    raise

proc sqliteVersion*(database: SqliteDatabase): string =
  database.requireOpen()
  $database.api.version()
proc exec*(database: SqliteDatabase, sql: string) =
  database.requireOpen()
  if '\0' in sql: raise newException(ValueError,"SQL contains a null byte")
  let encoded = utf8ForWrite(sql)
  var message: cstring
  let status = database.api.exec(database.handle,cstring(encoded),nil,nil,addr message)
  if status != 0:
    let text = if message == nil: decodeUtf8($database.api.error(database.handle)) else: decodeUtf8($message)
    if message != nil: database.api.free(cast[pointer](message))
    raise newException(IOError,text)
  if message != nil: database.api.free(cast[pointer](message))
proc prepare*(database: SqliteDatabase, sql: string): SqliteStatement =
  database.requireOpen()
  if '\0' in sql: raise newException(ValueError,"SQL contains a null byte")
  let encoded = utf8ForWrite(sql)
  var handle: pointer
  if database.api.prepare(database.handle,cstring(encoded),cint(encoded.len),addr handle,nil) != 0: database.failure()
  if handle == nil: raise newException(ValueError,"SQL statement is empty")
  SqliteStatement(database: database,handle: handle)

proc parameters*(statement: SqliteStatement, values: openArray[JsonNode]) =
  statement.requireOpen()
  let database = statement.database
  # Reset can report the previous step's already-observed error. Clear bindings
  # separately so reusing a statement never carries a previous parameter value.
  discard database.api.reset(statement.handle)
  statement.row = false
  if database.api.clear(statement.handle) != 0: database.failure()
  for at, value in values:
    let index = cint(at+1)
    var status: cint
    if value == nil or value.kind == JNull: status = database.api.bindNull(statement.handle,index)
    else:
      case value.kind
      of JString:
        let encoded = utf8ForWrite(value.getStr())
        status = database.api.bindText(statement.handle,index,cstring(encoded),cint(encoded.len),cast[pointer](-1))
      # node:sqlite binds JS Numbers as doubles, including integer values.
      of JInt, JFloat: status = database.api.bindDouble(statement.handle,index,value.getFloat())
      else: raise newException(ValueError,"SQLite parameters must be strings, numbers or null")
    if status != 0: database.failure()
proc step*(statement: SqliteStatement): bool =
  statement.requireOpen()
  let code = statement.database.api.step(statement.handle)
  statement.row = code == 100 # SQLITE_ROW
  if code notin [100.cint,101.cint]: statement.database.failure() # SQLITE_DONE
  statement.row
proc readRow(statement: SqliteStatement): JsonNode =
  statement.requireOpen()
  if not statement.row: raise newException(IOError,"Statement has no current row")
  let database = statement.database
  result = newJObject()
  for at in 0..<int(database.api.columns(statement.handle)):
    let column = cint(at)
    let name = decodeUtf8($database.api.columnName(statement.handle,column))
    var value: JsonNode
    case database.api.columnType(statement.handle,column)
    of 1:
      let integer = database.api.columnInteger(statement.handle,column)
      if integer > 9007199254740991'i64 or integer < -9007199254740991'i64:
        raise newException(ValueError,"Value is too large to be represented as a JavaScript number: " & $integer)
      value = %integer
    of 2: value = newJFloat(database.api.columnDouble(statement.handle,column))
    of 3:
      let data = database.api.columnText(statement.handle,column)
      let size = int(database.api.columnBytes(statement.handle,column))
      var bytes = newString(size)
      if size > 0: copyMem(addr bytes[0],data,size)
      value = %decodeUtf8(bytes)
    of 5: value = newJNull()
    else: raise newException(ValueError,"SQLite BLOB rows need an explicit byte decoder")
    result[name] = value
proc all*(statement: SqliteStatement, values: openArray[JsonNode] = []): JsonNode =
  statement.parameters(values)
  defer:
    discard statement.database.api.reset(statement.handle)
    statement.row = false
  result = newJArray()
  while statement.step(): result.add(statement.readRow())
proc first*(statement: SqliteStatement, values: openArray[JsonNode] = []): JsonNode =
  statement.parameters(values)
  defer:
    discard statement.database.api.reset(statement.handle)
    statement.row = false
  if statement.step(): statement.readRow() else: nil
proc run*(statement: SqliteStatement, values: openArray[JsonNode] = []) =
  statement.parameters(values)
  defer:
    discard statement.database.api.reset(statement.handle)
    statement.row = false
  while statement.step(): discard

proc query*(database: SqliteDatabase, sql: string, values: openArray[JsonNode] = []): JsonNode =
  let statement = database.prepare(sql)
  defer: statement.close()
  statement.all(values)
