package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
)

// Blocking native services run in an owned same-executable child. Git and other
// descendants inside it inherit that group/job; do not nest runProcess there.
type computeMessage struct {
	Version   int             `json:"version"`
	ID        string          `json:"id"`
	Operation string          `json:"operation,omitempty"`
	Data      json.RawMessage `json:"data,omitempty"`
	Error     string          `json:"error,omitempty"`
}

func nativeCompute(ctx context.Context, cache, operation string, payload any) (json.RawMessage, error) {
	if err := preparePrivateCache(cache); err != nil {
		return nil, err
	}
	directory, err := privateDirectory(cache, "operation-")
	if err != nil {
		return nil, err
	}
	cleanupSafe := true
	defer func() {
		if cleanupSafe {
			_ = os.RemoveAll(directory)
		}
	}()
	// The registered root contains every snapshot stage on its destination
	// filesystem. Its lifetime covers all inherited children in this request.
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	request := computeMessage{Version: 1, ID: identity(), Operation: operation, Data: data}
	data, err = json.Marshal(request)
	if err != nil || len(data) > 1<<20 {
		return nil, errors.New("native compute request exceeds 1 MiB")
	}
	input, output := filepath.Join(directory, "request.json"), filepath.Join(directory, "result.json")
	if err = privateFile(input, data); err != nil {
		return nil, err
	}
	if err = privateFile(output, nil); err != nil {
		return nil, err
	}
	executable, err := os.Executable()
	if err != nil {
		return nil, err
	}
	result, err := runProcess(ctx, []string{executable, "_compute", input, output}, directory, os.Environ())
	if err != nil {
		var cleanup *processCleanupError
		if errors.As(err, &cleanup) {
			cleanupSafe = false
			return nil, fmt.Errorf("%w; native operation retained at %s", err, directory)
		}
		return nil, err
	}
	if result.Cancelled {
		return nil, ctx.Err()
	}
	if result.ExitCode != 0 || result.Truncated {
		return nil, fmt.Errorf("native compute failed (exit %d)", result.ExitCode)
	}
	bytes, err := metadataBytes(output, 48<<20)
	if err != nil {
		return nil, err
	}
	var response computeMessage
	if err = json.Unmarshal(bytes, &response); err != nil {
		return nil, err
	}
	if response.Version != 1 || response.ID != request.ID {
		return nil, errors.New("mismatched native compute response identity")
	}
	if response.Error != "" {
		return nil, errors.New(response.Error)
	}
	if len(response.Data) == 0 {
		return nil, errors.New("native compute omitted its result")
	}
	return response.Data, nil
}

func computeChild(argv []string) int {
	if len(argv) != 2 || filepath.Dir(argv[0]) != filepath.Dir(argv[1]) {
		return 125
	}
	directory := filepath.Dir(argv[0])
	bytes, err := metadataBytes(argv[0], 1<<20)
	if err != nil {
		return 125
	}
	var request computeMessage
	if err = json.Unmarshal(bytes, &request); err != nil || request.Version != 1 || len(request.ID) != 32 {
		return 125
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	var data any
	switch request.Operation {
	case "docs-read", "docs-search", "docs-index":
		var input docsRequest
		if err = json.Unmarshal(request.Data, &input); err == nil {
			data, err = executeDocs(ctx, directory, request.Operation, input)
		}
	case "docs-snapshot":
		var input snapshotRequest
		if err = json.Unmarshal(request.Data, &input); err == nil {
			data, err = ensureDocSnapshot(ctx, directory, input)
		}
	default:
		err = errors.New("unknown native compute operation")
	}
	response := computeMessage{Version: 1, ID: request.ID}
	if err != nil {
		response.Error = err.Error()
	} else {
		response.Data, err = json.Marshal(data)
	}
	if err != nil && response.Error == "" {
		return 125
	}
	bytes, err = json.Marshal(response)
	if err != nil || len(bytes) > 48<<20 {
		return 125
	}
	if err = os.WriteFile(argv[1], bytes, 0600); err != nil {
		return 125
	}
	return 0
}
