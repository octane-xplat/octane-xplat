package project

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"os"
	"path/filepath"
	"strings"
)

type WorkerResult struct {
	Data     json.RawMessage `json:"data"`
	Warnings []string        `json:"warnings"`
	Process  proc.Result     `json:"process"`
}

func ToolEnvironment() []string {
	env := []string{}
	for _, entry := range os.Environ() {
		key, _, _ := strings.Cut(entry, "=")
		if !strings.EqualFold(key, "NODE_PATH") && !strings.EqualFold(key, "NODE_OPTIONS") {
			env = append(env, entry)
		}
	}
	return append(env, "NODE_PATH=", "NODE_OPTIONS=")
}

func RunWorker(ctx context.Context, project, operation string, payload map[string]any) (WorkerResult, error) {
	worker, err := Worker(project)
	if err != nil {
		return WorkerResult{}, err
	}
	return RunWorkerEntry(ctx, project, worker, operation, payload, nil, nil)
}

func RunWorkerEntry(ctx context.Context, project, worker, operation string, payload map[string]any, outputStream, diagnosticStream *os.File) (WorkerResult, error) {
	return RunWorkerEntryStdio(ctx, project, worker, operation, payload, nil, outputStream, diagnosticStream)
}
func RunWorkerEntryStdio(ctx context.Context, project, worker, operation string, payload map[string]any, inputStream, outputStream, diagnosticStream *os.File) (WorkerResult, error) {
	return RunPreparedWorker(ctx, project, worker, operation, payload, inputStream, outputStream, diagnosticStream, nil)
}

// Preparation owns its observer until after process cleanup and before private data removal.
type workerPreparation func(string, string, map[string]any) (func(), error)

type WorkerExitError struct{ Code int }

func (err *WorkerExitError) Error() string { return "worker failed after writing its response" }

func RunPreparedWorker(ctx context.Context, project, worker, operation string, payload map[string]any, inputStream, outputStream, diagnosticStream *os.File, prepare workerPreparation) (WorkerResult, error) {
	node, err := NodeExecutable(ctx)
	if err != nil {
		return WorkerResult{}, errors.New("Node is required for this project worker; install the Node version required by the selected project and put it on PATH")
	}
	directory, err := osfs.PrivateDirectory(os.TempDir(), "xplat-go-worker-")
	if err != nil {
		return WorkerResult{}, err
	}
	cleanupSafe := true
	defer func() {
		if cleanupSafe {
			_ = os.RemoveAll(directory)
		}
	}()
	id := osfs.Identity()
	request := map[string]any{}
	for key, value := range payload {
		request[key] = value
	}
	request["protocol"] = "octane-build-worker"
	request["version"] = 1
	request["id"] = id
	request["operation"] = operation
	request["project"] = project
	if prepare != nil {
		stop, err := prepare(directory, id, request)
		if err != nil {
			return WorkerResult{}, err
		}
		defer stop()
	}
	bytes, err := json.Marshal(request)
	if err != nil {
		return WorkerResult{}, err
	}
	if len(bytes) > 64<<20 {
		return WorkerResult{}, errors.New("worker request exceeds 64 MiB")
	}
	input, output := filepath.Join(directory, "request.json"), filepath.Join(directory, "result.json")
	if err = osfs.PrivateFile(input, bytes); err != nil {
		return WorkerResult{}, err
	}
	if err = osfs.PrivateFile(output, nil); err != nil {
		return WorkerResult{}, err
	}
	process, err := proc.RunProcessStdio(ctx, []string{node, worker, input, output}, project, ExecutionEnvironment(ctx), inputStream, outputStream, diagnosticStream)
	result := WorkerResult{Process: process}
	if process.Truncated {
		result.Warnings = append(result.Warnings, fmt.Sprintf("Project worker diagnostics exceeded the %d MiB capture limit per stream; output is truncated.", proc.CaptureLimit>>20))
	}
	if err != nil {
		var cleanup *proc.CleanupError
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
	if err = osfs.ReadJSON(output, &response); err != nil {
		return result, err
	}
	if response.Protocol != "octane-build-worker" || response.Version != 1 || response.ID != id || response.OK == nil {
		return result, errors.New("mismatched worker protocol/version/request identity")
	}
	result.Warnings = append(result.Warnings, response.Warnings...)
	if !*response.OK {
		return result, fmt.Errorf("project worker: %s", response.Error.Message)
	}
	if process.ExitCode != 0 {
		return result, &WorkerExitError{Code: process.ExitCode}
	}
	if len(response.Data) == 0 {
		return result, errors.New("worker omitted result data")
	}
	result.Data = response.Data
	return result, nil
}
