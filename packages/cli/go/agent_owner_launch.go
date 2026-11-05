package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Native creators serialize startup and transfer ownership over a private pipe.
// Before a handoff byte is accepted, cancellation joins the retained Cmd. After
// handoff, ordinary client exit cannot terminate the adopted owner generation.
type agentOwnerLaunchKey struct{}

type agentOwnerLaunchState struct {
	Request ownerLaunch
	Adopted <-chan struct{}
}

type ownerStartupHooks struct{ BeforeHandoff, AfterHandoff func(*agentOwnerClient) }

func ownerIdleMillis() (int64, error) {
	value := os.Getenv("XPLAT_AGENT_HOST_IDLE_MS")
	if value == "" {
		return 120000, nil
	}
	milliseconds, err := strconv.ParseInt(value, 10, 64)
	if err != nil || milliseconds < 250 || milliseconds > 86400000 {
		return 0, errors.New("XPLAT_AGENT_HOST_IDLE_MS must be an integer from 250 to 86400000")
	}
	return milliseconds, nil
}

func ownerChildEnvironment() []string {
	env := []string{}
	for _, entry := range os.Environ() {
		key, _, _ := strings.Cut(entry, "=")
		omit := false
		for _, reserved := range []string{"NODE_PATH", "NODE_OPTIONS", "XPLAT_PERMISSIONS", "XPLAT_AGENT_CLIENT", "XPLAT_AGENT_APP"} {
			if strings.EqualFold(key, reserved) {
				omit = true
				break
			}
		}
		if !omit {
			env = append(env, entry)
		}
	}
	return append(env, "NODE_PATH=", "NODE_OPTIONS=", "XPLAT_PERMISSIONS=", "XPLAT_AGENT_CLIENT=", "XPLAT_AGENT_APP=")
}

func ensureAgentOwner(parent context.Context, cache, project, invoked string, hooks ownerStartupHooks) (answer *agentOwnerClient, outcome *cliError) {
	ctx, cancel := context.WithTimeout(parent, 10*time.Second)
	defer cancel()
	project, err := canonical(project)
	if err != nil {
		return nil, executionFailure(err)
	}
	digest, err := nativeExecutableSHA(invoked)
	if err != nil {
		return nil, executionFailure(err)
	}
	idle, err := ownerIdleMillis()
	if err != nil {
		return nil, invalid(err.Error())
	}
	compatible := func(client *agentOwnerClient) (*agentOwnerClient, *cliError) {
		if client.descriptor.BinarySHA256 != digest {
			return nil, ownerDisconnected("A different native CLI build owns this workspace; end its work with the matching CLI before starting new work.")
		}
		return client, nil
	}
	existing, failure := lookupAgentOwner(ctx, cache, project)
	if failure != nil {
		return nil, failure
	}
	if existing != nil && existing.adopted {
		return compatible(existing)
	}
	directory, err := agentOwnerDirectory(cache, project)
	if err != nil {
		return nil, executionFailure(err)
	}
	if err = preparePrivateCache(filepath.Dir(directory)); err != nil {
		return nil, executionFailure(err)
	}
	if err = preparePrivateCache(directory); err != nil {
		return nil, executionFailure(err)
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		return nil, executionFailure(err)
	}
	defer root.Close()
	release, err := lockCache(ctx, root, "bootstrap.lock")
	if err != nil {
		return nil, executionFailure(err)
	}
	defer release()
	existing, failure = lookupAgentOwner(ctx, cache, project)
	if failure != nil {
		return nil, failure
	}
	if existing != nil {
		if !existing.adopted {
			return nil, ownerDisconnected("Native owner startup handoff is incomplete; retry after its creator finishes.")
		}
		return compatible(existing)
	}
	if err = pruneOwnerStages(ctx, root, directory, project); err != nil {
		return nil, executionFailure(err)
	}
	id := identity()
	run := filepath.Join(directory, "launch-"+id)
	if err = privateDirectoryAt(run); err != nil {
		return nil, executionFailure(err)
	}
	stage, err := os.OpenRoot(run)
	if err != nil {
		return nil, executionFailure(err)
	}
	defer stage.Close()
	request := ownerLaunch{Version: 1, Project: project, LaunchID: id, CLIVersion: metadata.Version, Helper: "native-helper-" + id + ".exe", BinarySHA256: digest, IdleMillis: idle}
	if err = writeOwnerLaunch(stage, request); err != nil {
		return nil, removeUnstartedOwnerStage(stage, run, err)
	}
	helper, actual, err := stageNativeExecutable(invoked, run, request.Helper)
	if err != nil {
		return nil, removeUnstartedOwnerStage(stage, run, err)
	}
	if actual != digest {
		return nil, removeUnstartedOwnerStage(stage, run, errors.New("invoked native CLI changed before staging"))
	}
	request.ImageReady = true
	if err = writeOwnerLaunch(stage, request); err != nil {
		return nil, removeUnstartedOwnerStage(stage, run, err)
	}
	read, write, err := os.Pipe()
	if err != nil {
		return nil, removeUnstartedOwnerStage(stage, run, err)
	}
	defer write.Close()
	cmd := agentOwnerCommand(helper, []string{"_owner", directory, id})
	cmd.Dir = project
	cmd.Env = ownerChildEnvironment()
	cmd.Stdin = read
	if err = cmd.Start(); err != nil {
		read.Close()
		return nil, removeUnstartedOwnerStage(stage, run, fmt.Errorf("cannot detach the native owner from this host process: %w", err))
	}
	read.Close()
	exited := make(chan error, 1)
	go func() { exited <- cmd.Wait() }()
	handedOff := false
	defer func() {
		if handedOff {
			return
		}
		write.Close() // EOF cancels the unadopted child; this is not the user's stdin.
		select {
		case <-exited:
		case <-time.After(4 * time.Second):
			cmd.Process.Kill()
			<-exited
		}
		if err := retireUnadoptedOwnerStage(root, stage, run, request, cmd); err != nil {
			var original error
			if outcome != nil {
				original = outcome
			}
			outcome = executionFailure(&ownerStartupCleanupError{Err: errors.Join(original, err)})
		}
	}()
	for {
		client, problem := lookupAgentOwner(ctx, cache, project)
		if client != nil && problem == nil {
			if client.descriptor.LaunchID != id || client.descriptor.BinarySHA256 != digest || client.descriptor.PID != cmd.Process.Pid {
				return nil, ownerDisconnected("The native owner readiness belongs to another launch.")
			}
			if hooks.BeforeHandoff != nil {
				hooks.BeforeHandoff(client)
			}
			if err = ctx.Err(); err != nil {
				return nil, executionFailure(err)
			}
			n, writeErr := write.Write([]byte{1})
			if n == 1 {
				handedOff = true
			}
			if writeErr != nil {
				return nil, executionFailure(writeErr)
			}
			if n != 1 {
				return nil, executionFailure(io.ErrShortWrite)
			}
			// A successful control write transfers ownership. Never kill that generation
			// if this client subsequently cancels or disappears while reading the reply.
			write.Close()
			if hooks.AfterHandoff != nil {
				hooks.AfterHandoff(client)
			}
			for {
				data, failed := client.call(ctx, "host.ping", nil)
				if failed != nil {
					return nil, failed
				}
				var ready struct{ Adopted bool }
				if json.Unmarshal(data, &ready) == nil && ready.Adopted {
					client.adopted = true
					return client, nil
				}
				select {
				case <-ctx.Done():
					return nil, executionFailure(ctx.Err())
				case <-time.After(10 * time.Millisecond):
				}
			}
		}
		if problem != nil && problem.Code != "disconnected_runtime" {
			return nil, problem
		}
		select {
		case err := <-exited:
			// Put the terminal result back for the shared cleanup join above.
			exited <- err
			if bytes, readErr := historyFile(stage, "failure.json", 64<<10); readErr == nil {
				var detail struct{ LaunchID, Message string }
				if json.Unmarshal(bytes, &detail) == nil && detail.LaunchID == id && detail.Message != "" {
					return nil, executionFailure(errors.New(detail.Message))
				}
			}
			return nil, executionFailure(fmt.Errorf("native owner exited before handoff: %v", err))
		case <-ctx.Done():
			return nil, executionFailure(ctx.Err())
		case <-time.After(20 * time.Millisecond):
		}
	}
}

func removeUnstartedOwnerStage(stage *os.Root, path string, cause error) *cliError {
	stage.Close()
	if err := os.RemoveAll(path); err != nil {
		return executionFailure(&ownerStartupCleanupError{Err: errors.Join(cause, fmt.Errorf("owner stage retained at %s: %w", path, err))})
	}
	return executionFailure(cause)
}

type ownerStartupCleanupError struct{ Err error }

func (e *ownerStartupCleanupError) Error() string {
	return "native owner startup cleanup could not be confirmed: " + e.Err.Error()
}

func (e *ownerStartupCleanupError) Unwrap() error { return e.Err }

func retireUnadoptedOwnerStage(root, stage *os.Root, path string, request ownerLaunch, cmd *exec.Cmd) error {
	if cmd.ProcessState == nil {
		return errors.New("native owner startup exit was not observed; stage retained")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	release, err := lockCache(ctx, root, "owner.lock")
	if err != nil {
		return err
	}
	defer release()
	if data, readErr := historyFile(root, "owner.json", 64<<10); readErr == nil {
		var descriptor agentOwnerDescriptor
		if json.Unmarshal(data, &descriptor) != nil || descriptor.State != "running" || descriptor.LaunchID != request.LaunchID || descriptor.BinarySHA256 != request.BinarySHA256 || descriptor.Project != request.Project || descriptor.PID != cmd.Process.Pid {
			return errors.New("native owner startup evidence cannot be retired safely")
		}
		if err = root.Remove("owner.json"); err != nil {
			return err
		}
	} else if !os.IsNotExist(readErr) {
		return readErr
	}
	request.CleanupConfirmed = true
	if err = writeOwnerLaunch(stage, request); err != nil {
		return err
	}
	if err = pruneOwnerStage(ctx, stage, path, request.Project, request.LaunchID); err != nil {
		return err
	}
	stage.Close()
	return root.Remove("launch-" + request.LaunchID)
}
