## Test-only SQLite C boundary, kept out of the public CLI.
import std/[json, tables]
import ../../packages/cli/nim/[sqlite_store, jsonutil, strictjson, json_wire]
for line in stdin.lines:
  let request = parseStrictJson(line)
  try:
    let database = openSqlite(if field(request,"path") == nil: ":memory:" else: text(request["path"]))
    var statements: OrderedTable[string,SqliteStatement]
    var replies = newJArray()
    try:
      for action in request["actions"]:
        try:
          var value = newJNull()
          var parameters: seq[JsonNode]
          if field(action,"parameters") != nil:
            for item in action["parameters"]: parameters.add(item)
          case text(action["operation"])
          of "version": value = %database.sqliteVersion()
          of "exec": database.exec(text(action["sql"]))
          of "query": value = database.query(text(action["sql"]),parameters)
          of "prepare": statements[text(action["name"])] = database.prepare(text(action["sql"]))
          of "all": value = statements[text(action["name"])].all(parameters)
          of "first": value = statements[text(action["name"])].first(parameters)
          of "run": statements[text(action["name"])].run(parameters)
          of "finalize": statements[text(action["name"])].close()
          of "close": database.close()
          else: raise newException(ValueError,"Unknown SQLite action")
          replies.add(%*{"ok": true,"value": value})
        except CatchableError as error: replies.add(%*{"ok": false,"message": error.msg})
    finally:
      for _, statement in statements: statement.close()
      database.close()
    echo wireJson(%*{"ok": true,"value": replies})
  except CatchableError as error: echo wireJson(%*{"ok": false,"message": error.msg})
