package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
)

var runtimeLocalURL = regexp.MustCompile(`https?://(?:localhost|127\.0\.0\.1|\[::1\]):[0-9]+/[^\s\x1b]*`)
var runtimeReadyLine = regexp.MustCompile(`(?i)(successfully (synced|started)|host started|\bready\b)`)
var runtimeANSI = regexp.MustCompile(`\x1b\[[0-?]*[ -/]*[@-~]`)

func runRuntimeSession(ctx context.Context, registry *runtimeSessions, entry *runtimeSessionEntry, target devTarget, browserMode string, report func(runtimeLaunch, string)) error {
	engines, err := prepareDevEngines(ctx, entry.app.Root, []devTarget{target})
	if err != nil {
		return runtimePrerequisite(err.Error())
	}
	if err := prepareDevSimulator(ctx, entry.app.Root, target); err != nil {
		return err
	}
	if target.Kind == "macos" {
		location, err := locateRoutes(entry.app.Root, routeOptions{}, "")
		if err != nil {
			return err
		}
		prepared, err := prepareRoutes(ctx, location, true)
		if err != nil {
			return err
		}
		if err = prepared.publish(ctx); err != nil {
			return err
		}
	}
	revision, err := runtimeBuildRevision(ctx, entry.app.Root)
	if err != nil {
		return err
	}
	registry.mu.Lock()
	entry.record.BuildIdentity, _ = json.Marshal(map[string]any{"revision": revision, "label": target.Kind + " dev"})
	registry.publish(entry)
	registry.mu.Unlock()
	child, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)
	events := make(chan runtimeLaunch, 1)
	execution := ctx.Value(runtimeExecutionKey{}).(runtimeExecution)
	execution.Stream = func(record historyRecord) {
		if target.Kind == "macos" && engines[0].MacWorker != "" {
			return
		} // Require the validated native sidecar, not generic engine output.
		// Engines may color individual URL components even with piped stdout.
		// Normalize only the readiness view; retained output keeps original bytes.
		line := runtimeANSI.ReplaceAllString(record.Line, "")
		launch := runtimeLaunch{Phase: "ready", Readiness: "engine-reported", Message: line}
		if address := runtimeLocalURL.FindString(line); address != "" {
			launch.Readiness = "http-pending"
			launch.Message = address
		} else if !runtimeReadyLine.MatchString(line) {
			return
		}
		if target.Kind == "web" && launch.Readiness != "http-pending" {
			return
		}
		if len(launch.Message) > 2048 {
			launch.Message = strings.ToValidUTF8(launch.Message[:2048], "�")
		}
		select {
		case events <- launch:
		default:
		}
	}
	execution.Native = func(frame macDevFrame) {
		entry.capture.Lock()
		var identity *devNativeIdentity
		if current := entry.capture.session.NativeIdentity; current != nil {
			copy := *current
			copy.Processes = append([]devNativeProcess(nil), current.Processes...)
			identity = &copy
		}
		entry.capture.Unlock()
		registry.mu.Lock()
		entry.record.NativeIdentity = identity
		registry.mu.Unlock()
		select {
		case events <- runtimeLaunch{Phase: "ready", Readiness: "host-spawned", Message: "macOS host spawned; application initialization is not inferred."}:
		default:
		}
	}
	child = context.WithValue(child, runtimeExecutionKey{}, execution)
	watchDone := make(chan struct{})
	joinBrowser := func() error { return nil }
	go func() {
		defer close(watchDone)
		budget := 5 * time.Minute
		if target.Kind == "web" {
			budget = time.Minute
		}
		timer := time.NewTimer(budget)
		defer timer.Stop()
		select {
		case <-child.Done():
			return
		case <-timer.C:
			cancel(fmt.Errorf("%w: development startup did not report readiness", context.DeadlineExceeded))
			return
		case launch := <-events:
			if launch.Readiness == "http-pending" {
				report(runtimeLaunch{Phase: "waiting for HTTP readiness", Message: launch.Message}, "")
				if err := waitRuntimeHTTP(child, launch.Message); err != nil {
					cancel(err)
					return
				}
				launch.Readiness = "http-confirmed"
			}
			if target.Kind == "web" {
				report(runtimeLaunch{Phase: "starting browser", Message: launch.Message}, "")
				browser, join, err := launchRuntimeBrowser(child, registry.owner.cacheParent, launch.Message, browserMode, cancel)
				joinBrowser = join
				if err != nil {
					cancel(err)
					return
				}
				launch.Browser = browser
				if browser == nil {
					launch.Message += " (no Chromium found; browser-side inspection is unavailable)"
				}
			}
			report(launch, "Development engine ready: "+launch.Message)
		}
	}()
	engine := engines[0]
	if target.Kind == "web" {
		engine.Args = append(engine.Args, "--host", "127.0.0.1")
	}
	result, err := runLoggedDevProcess(child, target.Kind, entry.capture, nil, func(ctx context.Context, out, diagnostic *os.File) (processResult, error) {
		if engine.MacWorker != "" {
			return runMacDevWorker(ctx, entry.app.Root, engine.MacWorker, nil, out, diagnostic, entry.capture)
		}
		return runProcessStdio(ctx, engine.Args, engine.Directory, execution.Environment, nil, out, diagnostic)
	})
	cancel(nil)
	<-watchDone
	if browserErr := joinBrowser(); browserErr != nil {
		err = errors.Join(err, browserErr)
	}
	if requiresFailureEvidence(err) {
		return err
	}
	if cause := context.Cause(child); cause != nil && ctx.Err() == nil && !errors.Is(cause, context.Canceled) {
		return cause
	}
	if err != nil {
		return err
	}
	if !result.Cancelled && result.ExitCode != 0 {
		return fmt.Errorf("%s development engine exited %d", target.Kind, result.ExitCode)
	}
	return nil
}

func waitRuntimeHTTP(ctx context.Context, address string) error {
	parsed, err := url.Parse(address)
	if err != nil || parsed.User != nil || (parsed.Hostname() != "localhost" && parsed.Hostname() != "127.0.0.1" && parsed.Hostname() != "::1") || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return errors.New("development readiness URL must be local HTTP(S)")
	}
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	transport := &http.Transport{Proxy: nil}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 2 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	for {
		request, err := http.NewRequestWithContext(ctx, "GET", address, nil)
		if err != nil {
			return err
		}
		response, err := client.Do(request)
		if err == nil {
			response.Body.Close()
			if response.StatusCode >= 200 && response.StatusCode < 500 {
				return nil
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(50 * time.Millisecond):
		}
	}
}
