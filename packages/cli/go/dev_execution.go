package main

import (
	"context"
	"os/exec"
	"slices"
)

// Only this request's environment reaches project engines. It is transient and
// never part of a retained job, descriptor, dedupe key or diagnostic payload.
type runtimeExecutionKey struct{}
type runtimeExecution struct {
	Environment []string
	Node        string
	Observe     func(processResult)
	Tools       map[string]string
	Stream      func(historyRecord)
	Native      func(macDevFrame)
	OwnerID     string
}

var runtimeTools = []string{"xcrun", "adb", "bun", "npm", "pnpm", "git"}

func projectExecutable(ctx context.Context, name string) (string, error) {
	if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok {
		if path := execution.Tools[name]; path != "" {
			return path, nil
		}
		return "", exec.ErrNotFound
	}
	return exec.LookPath(name)
}

func projectExecutionEnvironment(ctx context.Context) []string {
	if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok {
		return slices.Clone(execution.Environment)
	}
	return projectToolEnvironment()
}

func projectNodeExecutable(ctx context.Context) (string, error) {
	if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok {
		return execution.Node, nil
	}
	return exec.LookPath("node")
}
