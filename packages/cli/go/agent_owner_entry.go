package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// The internal entry uses a private stdin pipe only for bootstrap handoff.
// It never inherits caller input for project workers. A committed adoption marker
// precedes resource admission, and a staged image pins later containment helpers.
func agentOwnerChild(args []string) int {
	if len(args) != 2 || !ownerHex(args[1], 32) {
		fmt.Fprintln(os.Stderr, "invalid native owner entry")
		return 1
	}
	directory, err := canonical(args[0])
	if err != nil {
		return 1
	}
	if err = validatePrivateCache(filepath.Dir(directory)); err != nil {
		return 1
	}
	if err = validatePrivateCache(directory); err != nil {
		return 1
	}
	stagePath := filepath.Join(directory, "launch-"+args[1])
	if err = validatePrivateCache(stagePath); err != nil {
		return 1
	}
	stage, err := os.OpenRoot(stagePath)
	if err != nil {
		return 1
	}
	defer stage.Close()
	fail := func(err error) int {
		message := err.Error()
		if len(message) > 8192 {
			message = strings.ToValidUTF8(message[:8192], "�") + " [truncated]"
		}
		data, _ := json.Marshal(map[string]any{"launchId": args[1], "message": message})
		_ = privateFile(filepath.Join(stagePath, "failure.json"), data)
		return 1
	}
	data, err := historyFile(stage, "launch.json", 64<<10)
	if err != nil {
		return fail(err)
	}
	var input struct{ Project string }
	if json.Unmarshal(data, &input) != nil {
		return fail(errors.New("invalid native owner project"))
	}
	project, err := canonical(input.Project)
	if err != nil {
		return fail(err)
	}
	request, err := readOwnerLaunch(stage, project, args[1])
	if err != nil {
		return fail(err)
	}
	expected, err := agentOwnerDirectory(filepath.Dir(filepath.Dir(directory)), project)
	if err != nil || filesystemKey(expected) != filesystemKey(directory) || request.CLIVersion != metadata.Version || request.CleanupConfirmed || !request.ImageReady {
		return fail(errors.New("native owner launch namespace or release mismatch"))
	}
	executable, err := os.Executable()
	if err != nil {
		return fail(err)
	}
	if filesystemKey(executable) != filesystemKey(filepath.Join(stagePath, request.Helper)) {
		return fail(errors.New("native owner must execute its private staged image"))
	}
	actual, err := nativeExecutableSHA(executable)
	if err != nil || actual != request.BinarySHA256 {
		return fail(errors.New("native owner staged image checksum mismatch"))
	}
	pipe, err := os.Stdin.Stat()
	if err != nil || pipe.Mode()&os.ModeNamedPipe == 0 {
		return fail(errors.New("native owner requires a private bootstrap pipe"))
	}
	claim, err := stage.OpenFile("started", os.O_RDWR|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return fail(errors.New("native owner launch was already consumed"))
	}
	locked, err := tryCacheLock(claim)
	if err != nil || !locked {
		claim.Close()
		return fail(errors.New("native owner launch claim is unavailable"))
	}
	defer func() { releaseCacheLock(claim); claim.Close() }()
	if _, err = io.WriteString(claim, args[1]); err != nil {
		return fail(err)
	}
	signalCtx, stop := cliSignalContext(context.Background())
	defer stop()
	ctx, cancel := context.WithCancel(signalCtx)
	defer cancel()
	adopted := make(chan struct{})
	go func() {
		defer os.Stdin.Close()
		var one [1]byte
		n, err := os.Stdin.Read(one[:])
		if err != nil || n != 1 || one[0] != 1 {
			cancel()
			return
		}
		marker, err := stage.OpenFile("adopted", os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
		if err != nil {
			cancel()
			return
		}
		_, writeErr := io.WriteString(marker, args[1])
		closeErr := marker.Close()
		if writeErr != nil || closeErr != nil {
			cancel()
			return
		}
		close(adopted)
	}()
	ctx = context.WithValue(ctx, agentOwnerLaunchKey{}, agentOwnerLaunchState{Request: request, Adopted: adopted})
	ctx = context.WithValue(ctx, processHelperKey{}, executable)
	err = serveAgentOwner(ctx, directory, project, time.Duration(request.IdleMillis)*time.Millisecond, dispatchRuntime)
	if err != nil {
		return fail(err)
	}
	request.CleanupConfirmed = true
	if err = writeOwnerLaunch(stage, request); err != nil {
		return fail(err)
	}
	return 0
}
