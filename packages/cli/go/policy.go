package main

import "strings"
import "os"

var permissionScopes = []string{"workspace", "runtime-actions", "visual-capture", "evidence-retain", "external-effects"}

func permissionGrants() []map[string]any {
	supplied := map[string]bool{}
	for _, scope := range strings.Split(os.Getenv("XPLAT_PERMISSIONS"), ",") {
		supplied[strings.TrimFunc(scope, contractWhitespace)] = true
	}
	grants := []map[string]any{}
	now := isoNow()
	for _, scope := range permissionScopes {
		grant := map[string]any{"scope": scope, "state": "required", "revocable": true}
		if supplied[scope] {
			grant["state"] = "granted"
			grant["source"] = "server-config"
		} else if scope == "workspace" || scope == "runtime-actions" {
			grant["state"] = "granted"
			grant["source"] = "task-authorization"
			grant["grantedAt"] = now
			grant["revocable"] = false
			grant["note"] = "Covered by the task authorization the developer already gave; not re-requested per tool call."
		}
		grants = append(grants, grant)
	}
	return grants
}
func permissionCheck(grant map[string]any) map[string]any {
	if grant["state"] == "granted" {
		return map[string]any{"granted": true}
	}
	scope := stringValue(grant["scope"])
	recovery := map[string]string{"action": "Ask the developer to grant this permission for the current task"}
	if scope == "visual-capture" {
		recovery["action"] = "Ask the developer to approve visual capture for this task"
		recovery["detail"] = "The developer can grant it through the agent client approval prompt, or by starting the server with the visual-capture scope (e.g. XPLAT_MCP_PERMISSIONS=visual-capture)."
	}
	return map[string]any{"granted": false, "error": &cliError{Code: "permission_denied", Message: "Permission \"" + scope + "\" has not been granted.", Recovery: recovery, Context: map[string]any{"scope": scope, "state": grant["state"]}}}
}
func permissionsCommand(values map[string]any) any {
	grants := permissionGrants()
	if scope := stringValue(values["scope"]); scope != "" {
		for _, grant := range grants {
			if grant["scope"] == scope {
				return map[string]any{"grant": grant, "check": permissionCheck(grant)}
			}
		}
	}
	return map[string]any{"grants": grants}
}
