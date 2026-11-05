package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"os"
	"slices"
)

// Lookup may recover an existing authenticated owner after the directory was
// removed. Creation still requires canonical(existing) in ensureAgentOwner.
func knownOwnerProjectPath(project string) (string, error) {
	path, err := canonical(project)
	if os.IsNotExist(err) {
		return prospectiveHistoryPath(project)
	}
	return path, err
}

// Cleanup/read authority comes from the authenticated owner and its registered
// binding. A removed/edited project manifest must not trap a known owned process.
type runtimeOwnedRequest struct {
	Version   int      `json:"version"`
	Selector  string   `json:"selector,omitempty"`
	SessionID string   `json:"sessionId,omitempty"`
	JobID     string   `json:"jobId,omitempty"`
	Grants    []string `json:"grants"`
}

func runtimeOwnedParams(workspace *workspaceContext, id string, cleanup bool) map[string]any {
	selector := workspace.Selector
	if selected := workspace.selection(); selected.State == "bound" {
		selector = selected.App.ID
	}
	scopes := []string{"workspace"}
	if cleanup {
		scopes = append(scopes, "runtime-actions")
	}
	data, _ := json.Marshal(runtimeOwnedRequest{Version: 1, Selector: selector, SessionID: id, JobID: id, Grants: scopes})
	var value map[string]any
	_ = json.Unmarshal(data, &value)
	return value
}

func ownedSelector(app appIdentity, selector string) bool {
	return selector == "" || selector == app.ID || selector == app.RelativeRoot || selector == app.Name
}

func dispatchOwnedRuntime(ctx context.Context, owner *agentOwner, call agentOwnerRequest) (any, *cliError) {
	data, err := json.Marshal(call.Params)
	if err != nil || len(data) > 64<<10 {
		return nil, invalid("Invalid owned-operation request size.")
	}
	var request runtimeOwnedRequest
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil || decoder.Decode(new(any)) != io.EOF || request.Version != 1 {
		return nil, invalid("Invalid owned-operation request.")
	}
	scope := "workspace"
	if call.Method != "sessions.overview" && call.Method != "jobs.statusOwned" {
		scope = "runtime-actions"
	}
	if !slices.Contains(request.Grants, scope) {
		return nil, &cliError{Code: "permission_denied", Message: "Permission has not been granted for this owned operation."}
	}
	switch call.Method {
	case "sessions.overview":
		owner.sessions.mu.Lock()
		defer owner.sessions.mu.Unlock()
		result := []any{}
		for _, entry := range owner.sessions.entries {
			if ownedSelector(entry.app, request.Selector) {
				result = append(result, owner.sessions.snapshot(entry))
			}
		}
		return map[string]any{"sessions": result}, nil
	case "sessions.endOwned":
		owner.sessions.mu.Lock()
		entry := owner.sessions.entries[request.SessionID]
		if entry == nil || !ownedSelector(entry.app, request.Selector) {
			owner.sessions.mu.Unlock()
			return nil, &cliError{Code: "not_found", Message: "No owned session with this id for the selected app."}
		}
		app := entry.app
		owner.sessions.mu.Unlock()
		return owner.sessions.end(ctx, app, request.SessionID)
	case "jobs.cancelOwned", "jobs.statusOwned":
		owner.jobs.mu.Lock()
		entry := owner.jobs.jobs[request.JobID]
		if entry == nil || (request.Selector != "" && request.Selector != entry.input.AppID) {
			owner.jobs.mu.Unlock()
			return nil, &cliError{Code: "not_found", Message: "No owned job with this id for the selected app."}
		}
		input := entry.input
		owner.jobs.mu.Unlock()
		var job runtimeJob
		var failure *cliError
		if call.Method == "jobs.cancelOwned" {
			job, failure = owner.jobs.cancel(input.AppID, input.AppRoot, request.JobID)
		} else {
			job, failure = owner.jobs.status(input.AppID, input.AppRoot, request.JobID)
		}
		return map[string]any{"job": job}, failure
	}
	return nil, invalid("Unknown owned runtime operation.")
}
