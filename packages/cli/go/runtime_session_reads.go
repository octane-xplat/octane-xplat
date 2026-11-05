package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// Unlike openHistoryStore, a reader must not create cache or metadata state.
func lookupRuntimeHistory(parent, project string) (*historyStore, error) {
	project, err := knownOwnerProjectPath(project)
	if err != nil {
		return nil, err
	}
	namespace, err := prospectiveHistoryPath(filepath.Join(parent, "history-go-v1"))
	if err != nil {
		return nil, err
	}
	if inside(project, namespace) {
		return nil, fmt.Errorf("session history must be outside the selected project")
	}
	path := filepath.Join(namespace, fmt.Sprintf("%x", sha256.Sum256([]byte(filesystemKey(project)))))
	for _, directory := range []string{namespace, path} {
		if err := validatePrivateCache(directory); os.IsNotExist(err) {
			return nil, nil
		} else if err != nil {
			return nil, err
		}
	}
	root, err := os.OpenRoot(path)
	if err != nil {
		return nil, err
	}
	return &historyStore{root: root, path: path, project: project}, nil
}

func runtimeHistoryParents() (parents []string, err error) {
	parent, err := agentOwnerCacheParent()
	if err != nil {
		return nil, err
	}
	parents = []string{parent}
	if cache, e := os.UserCacheDir(); e == nil {
		normal := filepath.Join(cache, "octane-xplat", "cli-go")
		if filesystemKey(parent) != filesystemKey(normal) {
			parents = append(parents, normal)
		}
	}
	return parents, nil
}

func runtimeSessionCommand(ctx context.Context, workspace *workspaceContext, method string, values map[string]any) (any, *cliError) {
	apps := workspace.Discovery.Apps
	if selection := workspace.selection(); selection.State == "bound" {
		apps = []appIdentity{*selection.App}
	}
	if len(apps) == 0 {
		selector := workspace.Selector
		if selector == "" {
			selector = "."
		}
		path := resolveFrom(workspace.Root, selector)
		if inside(workspace.Root, path) || filesystemKey(path) == filesystemKey(workspace.Root) {
			apps = []appIdentity{{ID: selector, Root: path}}
		}
	}
	parent, err := agentOwnerCacheParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	client, ownerFailure := lookupAgentOwner(ctx, parent, workspace.Root)
	var liveRecords []map[string]any
	if client != nil && ownerFailure == nil && method != "sessions.end" {
		data, failure := client.call(ctx, "sessions.overview", runtimeOwnedParams(workspace, "", false))
		if failure != nil {
			ownerFailure = failure
		} else {
			var result struct{ Sessions []map[string]any }
			if json.Unmarshal(data, &result) != nil {
				ownerFailure = ownerDisconnected("Invalid native session overview.")
			} else {
				liveRecords = result.Sessions
			}
		}
	}
	if method == "sessions.end" {
		if client != nil && ownerFailure == nil {
			data, failure := client.call(ctx, "sessions.endOwned", runtimeOwnedParams(workspace, stringValue(values["sessionId"]), true))
			if failure == nil || failure.Code != "not_found" {
				return data, failure
			}
		}
		if selection := workspace.selection(); selection.State == "bound" {
			apps = []appIdentity{*selection.App}
		}
	}
	parents, err := runtimeHistoryParents()
	if err != nil {
		return nil, executionFailure(err)
	}
	records := map[string]map[string]any{}
	warnings := []string{}
	if ownerFailure != nil {
		warnings = append(warnings, "Live owner unavailable: "+ownerFailure.Message)
	}
	id := stringValue(values["sessionId"])
	for _, app := range apps {
		physical, e := knownOwnerProjectPath(app.Root)
		if e != nil {
			warnings = append(warnings, e.Error())
			continue
		}
		app.Root = physical
		for _, parent := range parents {
			store, e := lookupRuntimeHistory(parent, app.Root)
			if e != nil {
				warnings = append(warnings, "Retained session history unavailable for "+app.ID+": "+e.Error())
				continue
			}
			if store == nil {
				continue
			}
			var sessions []historySession
			if id != "" {
				if historyID.MatchString(id) {
					record, e := store.Read(id)
					if e == nil {
						sessions = []historySession{record}
					} else if !os.IsNotExist(e) {
						warnings = append(warnings, e.Error())
					}
				}
			} else {
				sessions, e = store.List()
				if e != nil {
					warnings = append(warnings, e.Error())
				}
			}
			store.Close()
			for _, record := range sessions {
				records[record.SessionID] = observedHistorySession(record, "")
			}
		}
	}
	for _, record := range liveRecords {
		records[stringValue(record["sessionId"])] = record
	}
	if method != "sessions.list" {
		record := records[id]
		if record == nil {
			return nil, &cliError{Code: "not_found", Message: "No retained session with this id for the selected app."}
		}
		if method == "sessions.end" {
			if record["cleanupConfirmed"] == true {
				return map[string]any{"result": map[string]any{"sessionId": id, "ended": true, "released": []string{}, "historical": true}}, nil
			}
			return nil, ownerDisconnected("No authenticated live owner can end this session; retained PIDs do not authorize signals or prove cleanup.")
		}
		return map[string]any{"session": record, "warnings": warnings}, nil
	}
	result := []any{}
	for _, record := range records {
		result = append(result, record)
	}
	slices.SortFunc(result, func(a, b any) int {
		return -strings.Compare(stringValue(a.(map[string]any)["createdAt"]), stringValue(b.(map[string]any)["createdAt"]))
	})
	host := map[string]any{"state": "absent"}
	if client != nil && ownerFailure == nil {
		host = map[string]any{"state": "live", "pid": client.descriptor.PID}
	} else if ownerFailure != nil {
		host["state"] = "unavailable"
	}
	return map[string]any{"sessions": result, "host": host, "warnings": warnings}, nil
}
