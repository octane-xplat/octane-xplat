## Report the providers actually wired into this native build.
## Tool presence and reference-runtime support cannot establish native support.
import std/[json, strutils]
import ./jsonutil

proc nativeCapabilityMatrix*(app, platforms, capabilityIds: JsonNode, actions: JsonNode = nil): JsonNode =
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
            "detail": "Native documentation retrieval is qualified on macOS arm64; other hosts remain pending."}
          when defined(macosx) and defined(arm64):
            entry = %*{"capability": id,"status": "supported",
              "detail": "Installed-version reads and exact/lexical/hybrid search are available. Explicit docs index prepares optional local model/runtime assets; search reports fallback without downloading them. No latest-version fallback."}
        of "code_search":
          entry = %*{"capability": id,"status": "partial",
            "detail": "Exact search reads current app and installed framework source; public native semantic inference integration is pending."}
        of "dev_actions":
          if actions != nil:
            var count = 0
            for instance in actions["instances"]:
              if instance["platform"] == platform: inc count
            if count > 0:
              entry = %*{"capability": id,"status": "supported","detail": $count & " live app instance(s) announcing a registry. Invocation validation uses the selected project's @octane-xplat/cli worker and Node; discovery/status remain native."}
            elif field(actions,"state") in [%"live",%"no-instance"]:
              entry = %*{"capability": id,"status": "partial","detail": "A development bridge is reachable, but no instance on this platform has announced a registry."}
            else:
              entry["detail"] = if field(actions,"detail") == nil: %"No development bridge is running for this app." else: actions["detail"]
        of "build", "logs", "job_control":
          when defined(macosx):
            if platform in [%"web",%"macos"]:
              entry = %*{"capability": id,"status": "partial","detail":
                (if capability == "build": "Web and macOS builds invoke project-installed tools; other build engines are pending. Install the app's dependencies first."
                elif capability == "logs": "macOS session logs and retained native crash reports remain readable after host exit. Report availability/association are disclosed per run; other platforms are pending. Build-job captures last while the host lives."
                else: "Web and macOS build jobs support status and cancellation; other application job creators are pending.")}
          elif defined(linux):
            if platform == %"web":
              entry = %*{"capability": id,"status": "partial","detail":
                (if capability == "build": "Web builds invoke project-installed tools; other build engines are pending. Install the app's dependencies first."
                elif capability == "logs": "Web build-job captures last while the native host lives; app sessions and native report lookup are pending."
                else: "Web build jobs support status and cancellation; other application job creators are pending.")}
        of "target_discovery", "launch", "attach", "session_end":
          when defined(macosx):
            if platform == %"macos":
              entry = %*{"capability": id,"status": "partial","detail":
                (if capability == "target_discovery": "The macOS host target includes native session ownership and busy state; other target composition is pending."
                elif capability == "launch": "macOS development invokes the project's installed engine with native readiness, logs and cleanup. Other launch engines are pending."
                elif capability == "attach": "macOS attachment observes compatible same-user processes in the app's working directory. Identity is inferred; only lifecycle events are captured. Other platforms are pending."
                else: "Owned macOS sessions release their engine, app processes and private resources. Attached end releases only the native observer/capture and leaves external processes user-owned. Lost owners leave historical evidence with cleanup unconfirmed.")}
        else: discard
      elif capability in ["guidance","docs","code_search","dev_actions"]:
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
