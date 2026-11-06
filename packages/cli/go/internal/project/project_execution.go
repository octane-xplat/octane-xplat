package project

import (
	"context"
	"os/exec"
	"slices"
)

// Only this request's environment reaches project engines. It is transient and
// never part of a retained job, descriptor, dedupe key or diagnostic payload.
type executionKey struct{}
type Execution struct {
	Environment []string
	Node        string
	Tools       map[string]string
	OwnerID     string
}

var RuntimeTools = []string{"xcrun", "adb", "bun", "npm", "pnpm", "git"}

func WithExecution(ctx context.Context, e Execution) context.Context {
	return context.WithValue(ctx, executionKey{}, e)
}

func ExecutionFromContext(ctx context.Context) (Execution, bool) {
	e, ok := ctx.Value(executionKey{}).(Execution)
	return e, ok
}

func Executable(ctx context.Context, name string) (string, error) {
	if Execution, ok := ExecutionFromContext(ctx); ok {
		if path := Execution.Tools[name]; path != "" {
			return path, nil
		}
		return "", exec.ErrNotFound
	}
	return exec.LookPath(name)
}

func ExecutionEnvironment(ctx context.Context) []string {
	if Execution, ok := ExecutionFromContext(ctx); ok {
		return slices.Clone(Execution.Environment)
	}
	return ToolEnvironment()
}

func NodeExecutable(ctx context.Context) (string, error) {
	if Execution, ok := ExecutionFromContext(ctx); ok {
		return Execution.Node, nil
	}
	return exec.LookPath("node")
}
