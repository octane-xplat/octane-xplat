package dev

import (
	"context"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"slices"
)

func EvidenceCommand(command string) func(context.Context, *project.WorkspaceContext, map[string]any) (any, *cli.Error) {
	return func(ctx context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
		return devEvidenceCommand(ctx, workspace, command, values)
	}
}
func devEvidenceCommand(ctx context.Context, workspace *project.WorkspaceContext, command string, values map[string]any) (any, *cli.Error) {
	app, failure := devSelectedApp(workspace)
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
		for _, grant := range cli.PermissionGrants() {
			if grant["state"] == "granted" {
				grants = append(grants, cli.StringValue(grant["scope"]))
			}
		}
		args["_grants"] = grants
		if failure := actionPermission(args, "evidence-retain"); failure != nil {
			return nil, failure
		}
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	client, failure := lookupDevServer(ctx, cache, app.Root)
	if failure == nil {
		return client.call(ctx, command, args)
	}
	if ctx.Err() != nil {
		return nil, cli.ExecutionFailure(ctx.Err())
	}
	parent, err := history.DiagnosticsHistoryParent()
	if err != nil {
		return nil, cli.ExecutionFailure(err)
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
