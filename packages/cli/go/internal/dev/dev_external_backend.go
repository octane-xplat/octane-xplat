package dev

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
)

// RunExternalBackend gives a project-owned Node backend a DevTools grant and
// makes its hub discoverable for the lifetime of the backend.
func RunExternalBackend(ctx context.Context, root, entry string) (failure error) {
	node, err := project.NodeExecutable(ctx)
	if err != nil {
		return err
	}
	cache, err := devServerCacheParent()
	if err != nil {
		return err
	}
	server, err := startDevServer(ctx, cache, root, nil)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			return nil
		}
		return err
	}
	defer func() {
		var cleanup *proc.CleanupError
		if errors.As(failure, &cleanup) {
			server.mu.Lock()
			server.operationError = failure
			server.mu.Unlock()
		}
		failure = errors.Join(failure, server.close())
	}()

	grant, err := json.Marshal(server.backendGrant(devTarget{ID: "external"}))
	if err != nil {
		return err
	}
	inherited := os.Environ()
	env := make([]string, 0, len(inherited)+1)
	for _, entry := range inherited {
		key, _, _ := strings.Cut(entry, "=")
		if !strings.EqualFold(key, "XPLAT_DEV_BACKEND") && !strings.EqualFold(key, "XPLAT_DEV_APP_BRIDGE") {
			env = append(env, entry)
		}
	}
	env = append(env, "XPLAT_DEV_BACKEND="+string(grant))
	result, err := proc.RunProcessIO(server.ctx, []string{node, entry}, server.record.AppRoot, env, os.Stdout, os.Stderr)
	if err != nil {
		if errors.Is(err, context.Canceled) && !cli.RequiresFailureEvidence(err) {
			return nil
		}
		return err
	}
	if !result.Cancelled && result.ExitCode != 0 {
		if result.Signal != 0 {
			return fmt.Errorf("DevTools backend terminated by signal %d", result.Signal)
		}
		return &project.ToolExit{Code: result.ExitCode}
	}
	return nil
}
