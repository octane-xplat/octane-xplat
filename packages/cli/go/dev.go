package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"
)

func init() { nativeLegacyCommands["dev"] = devCommand }

type devEngine struct {
	Target    devTarget
	Args      []string
	MacWorker string
	Directory string
}

func prepareDevEngines(ctx context.Context, project string, targets []devTarget) ([]devEngine, error) {
	node, err := projectNodeExecutable(ctx)
	if err != nil {
		return nil, errors.New("Node is required for project development engines")
	}
	manifest, err := projectManifest(project)
	if err != nil {
		return nil, err
	}
	engines := []devEngine{}
	for _, target := range targets {
		engine := devEngine{Target: target, Directory: project}
		switch target.Kind {
		case "web":
			entry, err := installedProjectEntry(project, "vite", "bin", "vite")
			if err != nil {
				return nil, err
			}
			engine.Args = []string{node, entry}
		case "ios", "android", "windows":
			if target.Kind == "ios" && runtime.GOOS != "darwin" {
				return nil, errors.New("iOS development requires a Mac")
			}
			if target.Kind == "windows" && runtime.GOOS != "windows" {
				return nil, errors.New("Windows NativeScript development requires Windows")
			}
			entry, err := installedProjectEntry(project, "nativescript", "bin", "ns")
			if err != nil {
				return nil, err
			}
			engine.Args = []string{node, entry, "run", target.Kind}
			if target.Kind != "windows" {
				engine.Args = append(engine.Args, "--device", target.Device)
			}
		case "macos":
			if runtime.GOOS != "darwin" {
				return nil, errors.New("macOS development requires a Mac")
			}
			if valueAt(manifest, "xplat", "targets", "macos", "dev") != nil {
				entry, err := installedProjectEntry(project, "@octane-xplat/macos-build", "exports", "./dev-worker")
				if err != nil {
					return nil, err
				}
				if _, err = installedProjectEntry(project, "vite", "bin", "vite"); err != nil {
					return nil, err
				}
				engine.MacWorker = entry
				break
			}
			entry, err := installedProjectEntry(project, "@octane-xplat/macos-build", "exports", "./doctor-worker")
			if err != nil {
				return nil, err
			}
			child, cancel := context.WithTimeout(ctx, 2*time.Minute)
			result, err := runWorkerEntry(child, project, entry, "macos-dev-preflight", map[string]any{}, nil, nil)
			cancel()
			routeDiagnostics(result)
			if err != nil {
				return nil, err
			}
			var data struct {
				Version         int
				Root            string
				HasNativeLeaves *bool
			}
			if json.Unmarshal(result.Data, &data) != nil || data.Version != 1 || data.Root != project || data.HasNativeLeaves == nil {
				return nil, errors.New("invalid selected-project macOS preflight")
			}
			if *data.HasNativeLeaves {
				return nil, errors.New("native macOS leaves require xplat.targets.macos.dev configuration")
			}
			fallthrough
		case "linux":
			if runtime.GOOS != "darwin" && runtime.GOOS != "linux" {
				return nil, errors.New("Linux development requires a POSIX host")
			}
			script := stringValue(object(manifest["scripts"])["dev"])
			if strings.TrimSpace(script) == "" {
				return nil, errors.New("the selected desktop target requires a project dev script")
			}
			if strings.Contains(script, "xplat dev") {
				return nil, errors.New("project dev script recursively calls xplat dev; declare a platform engine or a direct project tool script")
			}
			manager, err := projectPackageManager(ctx, project, nil)
			if err != nil {
				return nil, err
			}
			executable, err := projectExecutable(ctx, manager)
			if err != nil {
				return nil, fmt.Errorf("install the project's %s package manager: %w", manager, err)
			}
			engine.Args = []string{executable, "run", "dev"}
		default:
			return nil, fmt.Errorf("unsupported development target %s", target.Kind)
		}
		engines = append(engines, engine)
	}
	return engines, nil
}
func prepareDevSimulator(ctx context.Context, project string, target devTarget) error {
	if target.Kind != "ios" || target.Booted == nil {
		return nil
	}
	commands := [][]string{}
	if !*target.Booted {
		commands = append(commands, []string{"xcrun", "simctl", "boot", target.Device})
	}
	commands = append(commands, []string{"xcrun", "simctl", "bootstatus", target.Device, "-b"})
	for _, argv := range commands {
		tool, err := projectExecutable(ctx, argv[0])
		if err != nil {
			return err
		}
		argv[0] = tool
		child, cancel := context.WithTimeout(ctx, 2*time.Minute)
		result, err := runProcess(child, argv, project, projectExecutionEnvironment(ctx))
		cancel()
		if err != nil {
			return err
		}
		if result.Cancelled {
			return context.DeadlineExceeded
		}
		if result.ExitCode != 0 {
			return fmt.Errorf("iOS simulator preparation failed: %s", result.Stderr)
		}
	}
	return ctx.Err()
}
func promptDevTargets(ctx context.Context, all []devTarget, input *os.File) ([]devTarget, error) {
	fmt.Printf("Dev targets: %s\nChoose exact ids (comma list; Enter selects all): ", devTargetNames(all))
	type answer struct {
		line string
		err  error
	}
	received := make(chan answer, 1)
	go func() {
		var line strings.Builder
		var one [1]byte
		var err error
		for line.Len() <= 16384 {
			var n int
			n, err = input.Read(one[:])
			if n > 0 {
				line.WriteByte(one[0])
			}
			if err != nil || n > 0 && one[0] == '\n' {
				break
			}
		}
		if line.Len() > 16384 {
			err = errors.New("development selection exceeds 16 KiB")
		}
		received <- answer{line.String(), err}
	}()
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case value := <-received:
		if value.err == io.EOF && value.line == "" {
			return nil, &projectToolExit{Code: 0}
		}
		if value.err != nil && value.err != io.EOF {
			return nil, value.err
		}
		line := strings.TrimSpace(value.line)
		if line == "" {
			return all, nil
		}
		selected := []devTarget{}
		seen := map[string]bool{}
		for _, id := range strings.Split(line, ",") {
			id = strings.TrimSpace(id)
			found := false
			for _, target := range all {
				if target.ID == id {
					found = true
					if !seen[id] {
						selected = append(selected, target)
						seen[id] = true
					}
					break
				}
			}
			if !found {
				return nil, fmt.Errorf("unknown development target id %q", id)
			}
		}
		return selected, nil
	}
}

func devCommand(parent context.Context, values map[string]any) (failure error) {
	ctx, stopPipes := devPipeContext(parent)
	defer stopPipes()
	ctx = context.WithValue(ctx, processGraceKey{}, 3*time.Second)
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	choice := devSelection{Target: optionalString(values, "target"), Device: optionalString(values, "device"), Targets: optionalString(values, "targets")}
	if choice.Device != nil && strings.TrimSpace(*choice.Device) == "" {
		return errors.New("--device requires an exact device target id")
	}
	if (choice.Target != nil || choice.Device != nil) && choice.Targets != nil {
		return errors.New("pass either a single target/device or --targets, not both")
	}
	app, err := selectedDevApp(values)
	if err != nil {
		return err
	}
	project := app.Root
	execution, err := foregroundDevExecution()
	if err != nil {
		return err
	}
	ctx = context.WithValue(ctx, runtimeExecutionKey{}, execution)
	all, err := discoverDevTargets(ctx, project)
	if err != nil {
		return err
	}
	var chosen []devTarget
	if choice.Target == nil && choice.Device == nil && choice.Targets == nil && foregroundInput(ctx) != nil && buildTerminal(foregroundInput(ctx)) && buildTerminal(os.Stdout) {
		chosen, err = promptDevTargets(ctx, all, foregroundInput(ctx))
	} else {
		chosen, err = selectDevTargets(all, choice)
	}
	if err != nil {
		return err
	}
	if len(chosen) == 0 {
		return errors.New("no development targets found")
	}
	engines, err := prepareDevEngines(ctx, project, chosen)
	if err != nil {
		return err
	}
	// Interactive framework type declarations are a real project-installed engine.
	typegen, err := devTypegenEngine(project, foregroundInput(ctx))
	if err != nil {
		return err
	}
	release, err := lockProjectOutputs(project)
	if err != nil {
		return err
	}
	defer release()
	cacheParent, err := devServerCacheParent()
	if err != nil {
		return err
	}
	view := newDevTargetView(project, chosen)
	server, err := startDevServer(ctx, cacheParent, project, view.dispatch)
	if err != nil {
		return err
	}
	defer func() { failure = errors.Join(failure, server.close()) }()
	view.mu.Lock()
	view.apps = server.apps
	view.server = server
	view.mu.Unlock()
	grants := map[string]string{}
	for _, target := range chosen {
		data, err := json.Marshal(server.appGrant(target))
		if err != nil {
			return err
		}
		grants[target.ID] = string(data)
	}
	execution.OwnerID = server.record.InstanceID
	ctx = context.WithValue(ctx, runtimeExecutionKey{}, execution)
	routeCtx, cancelRoutes := context.WithCancel(ctx)
	defer cancelRoutes()
	ready := make(chan struct{}, 1)
	routeDone := make(chan error, 1)
	go func() {
		routeDone <- watchDevRoutes(routeCtx, project, routeOptions{}, func(*int) { ready <- struct{}{} })
	}()
	routesFinished := false
	defer func() {
		cancel()
		if !routesFinished {
			e := <-routeDone
			if requiresFailureEvidence(e) {
				failure = e
			}
		}
	}()
	select {
	case <-ready:
	case e := <-routeDone:
		routesFinished = true
		if e != nil {
			return e
		}
	case <-ctx.Done():
		return ctx.Err()
	case <-server.ctx.Done():
		return errors.New("dev server stopped before initial route publication")
	}
	console := newDevConsole(ctx, os.Stdout, cancel)
	console.emit("xplat", "Dev server ready. Other xplat commands can connect to this app.")
	defer func() {
		console.close()
		if dropped := console.dropped.Load(); dropped > 0 {
			fmt.Fprintf(os.Stderr, "Development terminal omitted %d lines due to backpressure or shutdown; retained logs are separate.\n", dropped)
		}
	}()
	cache, err := diagnosticsHistoryParent()
	var store *historyStore
	if err == nil {
		store, err = openHistoryStore(cache, project)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "Development log capture unavailable:", err)
	} else {
		defer store.Close()
	}
	manifest, _ := projectManifest(project)
	appID := stringValue(manifest["name"])
	if appID == "" {
		appID = filepath.Base(project)
	}
	owner := server.record.InstanceID
	type completion struct {
		err error
		aux bool
	}
	done := make(chan completion, len(engines)+1)
	auxCtx, cancelAux := context.WithCancel(ctx)
	defer cancelAux()
	run := func(runCtx context.Context, engine devEngine, retain bool) {
		observation := execution
		if bridge := grants[engine.Target.ID]; retain && bridge != "" {
			observation.Environment = append(append([]string{}, execution.Environment...), "XPLAT_DEV_APP_BRIDGE="+bridge)
		}
		observation.Stream = func(record historyRecord) {
			view.observe(engine.Target.ID, engine.Target.Kind, engine.MacWorker != "", record)
		}
		observation.Native = func(macDevFrame) {
			view.update(engine.Target.ID, "ready", "native-host-spawned", "The native host spawned; app debug attachment is separate.")
		}
		runCtx = context.WithValue(runCtx, runtimeExecutionKey{}, observation)
		var capture *historyCapture
		if retain && store != nil {
			var e error
			capture, e = store.Capture(historySession{AppID: appID, OwnerID: owner, Platform: engine.Target.Kind, TargetID: engine.Target.ID, Origin: "dev", Ownership: "owned"})
			if e != nil {
				console.emit("xplat", "Development log capture unavailable: "+e.Error())
			} else {
				console.emit(engine.Target.Kind, "session "+capture.session.SessionID)
			}
		}
		var result processResult
		e := prepareDevSimulator(runCtx, project, engine.Target)
		if e == nil {
			result, e = runLoggedDevProcess(runCtx, engine.Target.Kind, capture, console, func(ctx context.Context, out, diagnostics *os.File) (processResult, error) {
				input := foregroundInput(ctx)
				if input != nil && buildTerminal(input) {
					input = nil
				}
				if engine.MacWorker != "" {
					return runMacDevWorker(ctx, project, engine.MacWorker, input, out, diagnostics, capture)
				}
				return runProcessStdio(ctx, engine.Args, engine.Directory, projectExecutionEnvironment(ctx), input, out, diagnostics)
			})
		}
		if capture != nil {
			state := "stopped"
			if requiresFailureEvidence(e) || e != nil && !errors.Is(e, context.Canceled) || !result.Cancelled && result.ExitCode != 0 {
				state = "failed"
			}
			var cleanup *processCleanupError
			confirmed := !errors.As(e, &cleanup)
			detail := fmt.Sprintf("Development tool ended (code=%d, cancelled=%v).", result.ExitCode, result.Cancelled)
			if e != nil {
				detail = e.Error()
			}
			if failure := capture.Finish(state, detail, confirmed); failure != nil {
				console.emit("xplat", "Retained output is incomplete: "+failure.Error())
			}
		}
		if e == nil && result.ExitCode != 0 && !result.Cancelled {
			code := result.ExitCode
			if code < 0 {
				code = 1
				if result.Signal > 0 {
					code = 128 + result.Signal
				}
			}
			e = &projectToolExit{Code: code}
		}
		state, detail := "stopped", "Development engine stopped."
		if requiresFailureEvidence(e) || e != nil && !errors.Is(e, context.Canceled) {
			state, detail = "failed", e.Error()
		}
		view.update(engine.Target.ID, state, "", detail)
		done <- completion{e, !retain}
	}
	for _, engine := range engines {
		go run(ctx, engine, true)
	}
	targetsRunning := len(engines)
	running := len(engines)
	if typegen != nil {
		running++
		go run(auxCtx, *typegen, false)
	}
	console.emit("xplat", fmt.Sprintf("Starting %d target worker(s) — Ctrl+C stops all", len(engines)))
	var first error
	var serverFailure error
	serverDone := server.ctx.Done()
	for running > 0 {
		var routes <-chan error
		if !routesFinished {
			routes = routeDone
		}
		select {
		case completed := <-done:
			e := completed.err
			running--
			if !completed.aux {
				targetsRunning--
				if targetsRunning == 0 {
					cancelAux()
				}
			}
			if e != nil && first == nil {
				first = e
			}
			if requiresFailureEvidence(e) {
				cancel()
			}
		case e := <-routes:
			routesFinished = true
			if e != nil && !errors.Is(e, context.Canceled) {
				if first == nil {
					first = e
				}
				cancel()
			}
		case <-serverDone:
			serverDone = nil
			if ctx.Err() == nil {
				serverFailure = errors.New("dev server stopped while development engines were running")
				cancel()
			}
		}
	}
	wasCancelled := ctx.Err() != nil
	cancelRoutes()
	if !routesFinished {
		e := <-routeDone
		routesFinished = true
		if requiresFailureEvidence(e) {
			first = errors.Join(first, e)
		}
	}
	// A stopped target's first failure survives later successes. Explicit owner
	// cancellation wins unless cleanup evidence itself is unavailable.
	if requiresFailureEvidence(first) {
		return first
	}
	if serverFailure != nil {
		return errors.Join(serverFailure, first)
	}
	if wasCancelled {
		return ctx.Err()
	}
	drain, stop := context.WithTimeout(context.WithoutCancel(ctx), time.Second)
	defer stop()
	if err := console.finish(drain); err != nil && first == nil {
		first = err
	}
	return first
}
func devTypegenEngine(project string, input *os.File) (*devEngine, error) {
	if input == nil || !buildTerminal(input) || !buildTerminal(os.Stdout) {
		return nil, nil
	}
	for at := project; ; at = filepath.Dir(at) {
		if data, err := os.ReadFile(filepath.Join(at, "turbo.json")); err == nil && regexp.MustCompile(`"typegen"\s*:`).Match(data) {
			entry, err := installedProjectEntry(at, "turbo", "bin", "turbo")
			if err != nil {
				return nil, err
			}
			return &devEngine{Target: devTarget{Kind: "types", ID: "types"}, Directory: at, Args: []string{"node", entry, "watch", "typegen", "--continue", "always"}}, nil
		}
		if at == filepath.Dir(at) {
			break
		}
	}
	return nil, nil
}
