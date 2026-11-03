## Test-only owner instrumentation; the shipped CLI owns the same compute child.
import std/[os, json, asyncdispatch]
import ../../packages/cli/nim/[docs_compute, managed_process, strictjson, jsonutil, json_wire, contract_failure, inference_assets, host_storage, native_identity]

let args = commandLineParams()
if args.len == 2 and args[0] == "--internal-docs-compute":
  try: waitFor nativeDocsComputeChild(args[1]); quit(0)
  except CatchableError: quit(1)

proc scenario(request: JsonNode): Future[JsonNode] {.async.} =
  let signal = newProcessCancel()
  if field(request,"cancelAfterMs") != nil:
    let timer = sleepAsync(request["cancelAfterMs"].getInt())
    timer.addCallback(proc() = signal.cancel())
  var running = true
  var ticks, pid: int
  proc beat(): Future[void] {.async.} =
    while running:
      await sleepAsync(5)
      if running: inc ticks
  let heartbeat = beat()
  var reply = %*{"ok": false}
  try:
    if field(request,"assetUrl") != nil:
      let root = text(request["request"]["assetRoot"])
      let operation = root / "operations" / freshId("fixture_")
      privateHostDirectory(root)
      privateHostDirectory(root / "operations")
      privateHostDirectory(operation)
      try:
        let base = text(request["assetUrl"])
        let resolver: AssetUrlResolver = proc(key, official: string): string = base & "/" & key
        let locations = await prepareNativeAssets(root,operation,
          field(request,"download") == %true,signal,resolver)
        reply["value"] = %*{"modelDirectory": locations.modelDirectory,"libraryPath": locations.libraryPath}
      finally:
        if dirExists(operation): removeDir(operation)
    else:
      reply["value"] = await runNativeDocsCompute(request["request"],signal,
        (if field(request,"timeoutMs") == nil: 120000 else: request["timeoutMs"].getInt()),
        proc(observed: int) = pid = observed)
    reply["ok"] = %true
  except CatchableError as error: reply["error"] = failureData(error)
  finally:
    running = false
    await heartbeat
  reply["ticks"] = %ticks
  reply["pid"] = %pid
  return reply

for line in stdin.lines:
  try: echo wireJson(waitFor scenario(parseStrictJson(line)))
  except CatchableError as error: echo wireJson(%*{"ok": false,"error": failureData(error)})
