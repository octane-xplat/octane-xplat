package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type workerResult struct {
	Data     json.RawMessage `json:"data"`
	Warnings []string        `json:"warnings"`
	Process  processResult   `json:"process"`
}

func runWorker(ctx context.Context, project, operation string, payload map[string]any) (workerResult, error) {
	worker, err := projectWorker(project)
	if err != nil {
		return workerResult{}, err
	}
	if _, err = exec.LookPath("node"); err != nil {
		return workerResult{}, errors.New("Node is required for this project worker; install the Node version required by the selected project and put it on PATH")
	}
	directory, err := privateDirectory(os.TempDir(), "xplat-go-worker-")
	if err != nil {
		return workerResult{}, err
	}
	cleanupSafe := true
	defer func() {
		if cleanupSafe {
			_ = os.RemoveAll(directory)
		}
	}()
	id := identity()
	request := map[string]any{}
	for key, value := range payload {
		request[key] = value
	}
	request["protocol"] = "octane-build-worker"
	request["version"] = 1
	request["id"] = id
	request["operation"] = operation
	request["project"] = project
	bytes, err := json.Marshal(request)
	if err != nil {
		return workerResult{}, err
	}
	if len(bytes) > 64<<20 {
		return workerResult{}, errors.New("worker request exceeds 64 MiB")
	}
	input, output := filepath.Join(directory, "request.json"), filepath.Join(directory, "result.json")
	if err = privateFile(input, bytes); err != nil {
		return workerResult{}, err
	}
	if err = privateFile(output, nil); err != nil {
		return workerResult{}, err
	}
	env := []string{}
	for _, entry := range os.Environ() {
		key, _, _ := strings.Cut(entry, "=")
		if !strings.EqualFold(key, "NODE_PATH") && !strings.EqualFold(key, "NODE_OPTIONS") {
			env = append(env, entry)
		}
	}
	env = append(env, "NODE_PATH=", "NODE_OPTIONS=")
	process, err := runProcess(ctx, []string{"node", worker, input, output}, project, env)
	result := workerResult{Process: process}
	if err != nil {
		var cleanup *processCleanupError
		if errors.As(err, &cleanup) {
			cleanupSafe = false
			return result, fmt.Errorf("%w; private worker data retained at %s", err, directory)
		}
		return result, err
	}
	if process.Cancelled {
		return result, ctx.Err()
	}
	info, err := os.Lstat(output)
	if err != nil || !info.Mode().IsRegular() || info.Size() > 64<<20 {
		return result, errors.New("worker result must be a bounded regular file")
	}
	if info.Size() == 0 {
		return result, fmt.Errorf("project worker exited without a result (exit %d); run bun install in the selected project and ensure its CLI build dependencies are declared", process.ExitCode)
	}
	var response struct {
		Protocol string
		Version  int
		ID       string
		OK       *bool
		Data     json.RawMessage
		Warnings []string
		Error    struct{ Message string }
	}
	if err = readJSON(output, &response); err != nil {
		return result, err
	}
	if response.Protocol != "octane-build-worker" || response.Version != 1 || response.ID != id || response.OK == nil {
		return result, errors.New("mismatched worker protocol/version/request identity")
	}
	result.Warnings = response.Warnings
	if !*response.OK {
		return result, fmt.Errorf("project worker: %s", response.Error.Message)
	}
	if process.ExitCode != 0 {
		return result, errors.New("worker failed after writing its response")
	}
	if len(response.Data) == 0 {
		return result, errors.New("worker omitted result data")
	}
	result.Data = response.Data
	return result, nil
}
