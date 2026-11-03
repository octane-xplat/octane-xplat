## Test-only retained-history adapter. Production command entry points stay separate.
import std/[json, tables, os, asyncdispatch]
import ../../packages/cli/nim/[session_history, jsonutil, contract_failure]
import ../../packages/cli/nim/[host_storage, json_wire]

proc historyScenario*(request: JsonNode): JsonNode =
  var captures = initTable[string,HistoryCapture]()
  let workspace = text(request["dir"])
  let app = request["app"]
  let owner = text(field(request,"owner"))
  result = newJArray()
  for step in request["steps"]:
    try:
      let id = text(field(step,"id"))
      var value = newJNull()
      case text(step["op"])
      of "create":
        captures[id] = newHistoryCapture(workspace,app,step["session"],owner,
          (if field(request,"segmentLimit") == nil: segmentBytes else: request["segmentLimit"].getInt()),
          (if field(request,"runLimit") == nil: retainedRuns else: request["runLimit"].getInt()))
      of "append": captures[id].appendHistory(step["record"])
      of "update": captures[id].updateHistory(step["session"])
      of "finish": captures[id].finishHistory(step["session"])
      of "error": value = %captures[id].error
      of "pause": sleep(step["ms"].getInt())
      of "publish": discard publishHostFile(historyRoot(workspace,app) / id / "session.json",wireJson(step["value"]))
      of "root": value = %historyRoot(workspace,app)
      of "list": value = listHistorySessions(workspace,app,owner,text(field(step,"platform")))
      of "session": value = readHistorySession(workspace,app,id,owner)
      of "read":
        var params = if field(step,"params") == nil: newJObject() else: step["params"].copy()
        params["sessionId"] = %id
        value = waitFor historyDiagnostics(workspace,app,params,owner)
      else: raise newException(ValueError,"Unknown history operation")
      result.add(%*{"ok": true,"value": value})
    except CatchableError as error: result.add(%*{"ok": false,"error": failureData(error)})
