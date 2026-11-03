## Fresh discovery report using native providers and bounded owned tool queries.
import std/[asyncdispatch, json, os, options, strutils]
import ./core, ./code_service, ./docs_service, ./prerequisites, ./capabilities, ./docs_snapshots
import ./action_service, ./jobs
import ./command_probe, ./managed_process, ./package_manager
import ./js_text
from ./args import jsTrim

proc guidanceSources(root: string): JsonNode =
  result = newJArray()
  for candidate in [("AGENTS.md","agents-md"),("CLAUDE.md","claude-md"),(".devin","devin"),("docs","framework")]:
    if fileExists(root / candidate[0]) or dirExists(root / candidate[0]):
      result.add(%*{"kind": candidate[1],"path": (if candidate[0] == "docs": "docs/" else: candidate[0])})

proc projectGuidance(root: string, discovery, app: JsonNode): JsonNode =
  let sources = guidanceSources(root)
  proc addApp(app: JsonNode) =
    for source in guidanceSources(text(app["root"])):
      source["path"] = %(text(app["id"]) & "/" & text(source["path"]))
      sources.add(source)
  if app != nil:
    if text(app["relativeRoot"]) != ".": addApp(app)
  else:
    for candidate in discovery["apps"]: addApp(candidate)
  sources

proc codeFreshness(root: string, signal: ProcessCancel): Future[string] {.async.} =
  let head = await probeCommand("git",@["-C",root,"rev-parse","HEAD"],cwd=root,timeoutMs=5000,signal=signal)
  if head.isSome:
    let status = await probeCommand("git",@["-C",root,"status","--porcelain","-uno"],cwd=root,timeoutMs=5000,signal=signal)
    if status.isSome:
      var dirty = 0
      for line in status.get().split('\n'):
        if line != "": inc dirty
      return "HEAD " & utf16Slice(jsTrim(head.get()),0,12) & (if dirty > 0: ", " & $dirty & " uncommitted" else: ", clean")
  return "not a git checkout — freshness is per-read mtimes"

proc statusNextSteps(report: JsonNode): JsonNode =
  result = newJArray()
  let selected = report["identity"]["selection"]
  case text(selected["state"])
  of "none":
    result.add(%"No Octane Xplat app was detected in this workspace. Restart the server with --workspace pointing at a directory containing an Octane Xplat app.")
  of "ambiguous":
    var candidates: seq[string]
    for app in selected["candidates"]: candidates.add(scalarString(app["id"]) & " (" & scalarString(app["name"]) & ")")
    result.add(%("Multiple apps detected: " & candidates.join(", ") & ". Ask the developer which one to use, then select it — xplat_select_app (MCP) or `xplat app select` (CLI). The server never picks silently."))
  else:
    var missing: seq[string]
    for prerequisite in report["prerequisites"]:
      if text(prerequisite["status"]) == "missing":
        missing.add(text(prerequisite["name"]) & " — " & text(prerequisite["remedy"]))
    if missing.len > 0: result.add(%("Missing prerequisites: " & missing.join("; ") & "."))
    result.add(%"Run `xplat capabilities` for current native support before promising a runtime check.")
    result.add(%"Runtime sessions are pending in this Nim CLI build; tool presence does not establish runtime readiness.")

proc buildNativeStatus*(root: string, discovery, selected, server, grants,
    capabilityIds, boundaries: JsonNode, signal: ProcessCancel = nil): Future[JsonNode] {.async.} =
  let app = if text(selected["state"]) == "bound": selected["app"] else: nil
  var declared = newJArray()
  if app != nil: declared = app["platforms"]
  else:
    for candidate in discovery["apps"]:
      for platform in candidate["platforms"]:
        var present = false
        for found in declared:
          if found == platform: present = true
        if not present: declared.add(platform)
  let directory = if app == nil: root else: text(app["root"])
  let manager = packageManagerFor(directory)
  var gitVersion = none(string)
  let query: ToolProbe = proc(command: string, args: seq[string]): Future[Option[string]] {.async.} =
    let observed = await probeCommand(command,args,cwd=directory,signal=signal)
    if command == "git": gitVersion = observed
    return observed
  var platformNames: seq[string]
  for platform in declared: platformNames.add(text(platform))
  let prerequisites = await checkPrerequisites(platformNames,query,manager)
  var docs = %*{"state": "unavailable","detail": "Select an app before retrieving installed-version documentation."}
  if app != nil:
    let service = newDocsService(directory,nativeDocsCacheDir())
    discard service.docsRefresh()
    let binding = service.docsStatus(some(gitVersion.isSome))
    docs = %*{"state": (if binding["identity"]["packages"].len > 0: "ready" else: "unavailable"),
      "detail": "Provider ready; snapshot availability is checked on retrieval. No latest-version fallback.","binding": binding}
  let freshness = await codeFreshness(root,signal)
  let code = newCodeService(root)
  var actions: JsonNode
  when defined(macosx):
    if app != nil:
      let service = newActionService(newJobRegistry())
      try: actions = await service.listActions(app,signal)
      finally: service.closeActionService()
  result = %*{"server": server,"identity": {"workspace": discovery["workspace"],"apps": discovery["apps"],
      "selection": selected,"framework": (if app == nil: newJNull() else: binding(root,directory))},
    "guidance": {"sources": projectGuidance(root,discovery,app)},"docs": docs,
    "codeIndex": code.codeStatus(app,discovery["workspace"]["kind"],some(freshness)),
    "prerequisites": prerequisites,"capabilities": nativeCapabilityMatrix(app,declared,capabilityIds,actions),
    "permissions": grants,"boundaries": boundaries}
  result["nextSteps"] = statusNextSteps(result)
  result["codeIndex"]["detail"] = %"Exact search reads current source; public native semantic inference integration is pending."
  if (signal != nil and signal.cancelled) or interruptedSignal() != 0:
    raise newException(ProbeCancelledError,"Project status cancelled")
