package main

import (
	"context"
	"slices"
)

func init() {
	for _, command := range []string{"evidence list", "evidence retain", "evidence delete"} {
		commandHandlers[command] = func(ctx context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
			return devEvidenceCommand(ctx, workspace, command, values)
		}
	}
}
func devEvidenceCommand(ctx context.Context, workspace *workspaceContext, command string, values map[string]any) (any, *cliError) {
	app, failure := runtimeSelectedApp(workspace)
	if failure != nil {
		return nil, failure
	}
	args := map[string]any{}
	for name, value := range values {
		if !slices.Contains([]string{"project", "app", "client", "json", "schema"}, name) {
			args[name] = value
		}
	}
	if command == "evidence retain" {
		grants := []string{}
		for _, grant := range permissionGrants() {
			if grant["state"] == "granted" {
				grants = append(grants, stringValue(grant["scope"]))
			}
		}
		args["_grants"] = grants
		if failure := actionPermission(args, "evidence-retain"); failure != nil {
			return nil, failure
		}
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	client, failure := lookupDevServer(ctx, cache, app.Root)
	if failure == nil {
		return client.call(ctx, command, args)
	}
	if ctx.Err() != nil {
		return nil, executionFailure(ctx.Err())
	}
	parent, err := diagnosticsHistoryParent()
	if err != nil {
		return nil, executionFailure(err)
	}
	result, failure := evidenceDiskCommand(ctx, parent, app.Root, command, args, nil)
	if failure != nil {
		return nil, failure
	}
	if command == "evidence list" {
		return map[string]any{"evidence": result, "retention": "Offline retained records only; session evidence belongs to the running dev-server startup."}, nil
	}
	return result, nil
}
