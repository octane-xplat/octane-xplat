## Report the providers actually wired into this native build.
## Tool presence and reference-runtime support cannot establish native support.
import std/[json, strutils]
import ./jsonutil

proc nativeCapabilityMatrix*(app, platforms, capabilityIds: JsonNode): JsonNode =
  result = newJArray()
  for platform in platforms:
    var entries = newJArray()
    for id in capabilityIds:
      let capability = text(id)
      var entry = %*{"capability": id,"status": "unavailable",
        "detail": "Native " & capability.replace('_',' ') & " execution is pending in this CLI build."}
      if capability == "project_status":
        entry = %*{"capability": id,"status": "supported"}
      elif app != nil and app.kind != JNull:
        case capability
        of "guidance": entry = %*{"capability": id,"status": "supported"}
        of "docs":
          entry = %*{"capability": id,"status": "partial",
            "detail": "Installed-version document reads are available; public semantic search and model delivery are pending. No latest-version fallback."}
        of "code_search":
          entry = %*{"capability": id,"status": "partial",
            "detail": "Exact search reads current app and installed framework source; public native semantic inference integration is pending."}
        of "build", "logs", "job_control":
          when defined(macosx):
            if platform in [%"web",%"macos"]:
              entry = %*{"capability": id,"status": "partial","detail":
                (if capability == "build": "Web and macOS builds invoke project-installed tools; other build engines are pending. Install the app's dependencies first."
                elif capability == "logs": "macOS session logs remain readable after host exit. Build-job captures last while the host lives; native reports are pending."
                else: "Web and macOS build jobs support status and cancellation; other application job creators are pending.")}
        of "target_discovery", "launch", "attach", "session_end":
          when defined(macosx):
            if platform == %"macos":
              entry = %*{"capability": id,"status": "partial","detail":
                (if capability == "target_discovery": "The macOS host target includes native session ownership and busy state; other target composition is pending."
                elif capability == "launch": "macOS development invokes the project's installed engine with native readiness, logs and cleanup. Other launch engines are pending."
                elif capability == "attach": "macOS attachment observes compatible same-user processes in the app's working directory. Identity is inferred; only lifecycle events are captured. Other platforms are pending."
                else: "Owned macOS sessions release their engine, app processes and private resources. Attached end releases only the native observer/capture and leaves external processes user-owned. Lost owners leave historical evidence with cleanup unconfirmed.")}
        else: discard
      elif capability in ["guidance","docs","code_search"]:
        entry["detail"] = %"Select an app before retrieving its guidance, installed-version documents or source."
      if capability == "screenshot":
        entry["requiresPermission"] = %"visual-capture"
        entry["detail"] = %(text(entry["detail"]) & " Capture requires explicit per-task developer approval when supported.")
      entries.add(entry)
    var declared = false
    if app != nil and app.kind != JNull:
      for candidate in app["platforms"]:
        if candidate == platform: declared = true
    result.add(%*{"platform": platform,"declared": declared,"capabilities": entries})
