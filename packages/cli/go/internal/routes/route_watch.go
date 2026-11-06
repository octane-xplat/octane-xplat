package routes

import (
	"context"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"os"
	"time"
)

type routeAttemptResult struct {
	Prepared preparedRoutes
	Err      error
}
type routeAttempt struct {
	Context     context.Context
	Cancel      context.CancelFunc
	Fingerprint string
	Done        chan routeAttemptResult
}

// A bounded polling backend keeps watch portable without platform SDKs or a
// second JS watcher. Recheck actual bytes before publication; polling latency
// cannot make an invalidated worker's old result safe to publish.
func WatchRoutes(ctx context.Context, project string, options RouteOptions) error {
	return WatchDevRoutes(ctx, project, options, nil)
}

// A development caller waits for the first successful publication before starting
// engines. No routing source is a successful no-op for dev, but remains an error
// for the explicit routes --watch command.
func WatchDevRoutes(ctx context.Context, project string, options RouteOptions, ready func(*int)) (failure error) {
	var active *routeAttempt
	defer func() {
		if active != nil {
			active.Cancel()
			result := <-active.Done
			if cli.RequiresFailureEvidence(result.Err) {
				failure = result.Err
			}
		}
	}()
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	previousDirectory, pinnedOutput, observed := "", "", ""
	var desired RouteLocation
	valid, pending, announced := false, false, false
	lastReported := ""
	var scanError error
	report := func(err error) {
		if err != nil && err.Error() != lastReported {
			fmt.Fprintln(os.Stderr, "xplat routes:", err)
			lastReported = err.Error()
		}
	}
	scan := func() {
		location, err := LocateRoutes(project, options, previousDirectory)
		scanError = nil
		if err == nil && pinnedOutput != "" && location.Base != pinnedOutput {
			err = errors.New("route/watch-output-changed: keep the existing out path while watching; stop watching before moving generated files")
		}
		if err == nil && previousDirectory != "" && location.Directory == "" {
			err = errors.New("route/watch-no-source: restore routing configuration or stop watching before changing source ownership")
		}
		var fingerprint string
		if err == nil {
			fingerprint, err = RouteFingerprint(ctx, location)
		}
		if err != nil {
			scanError = err
			valid, pending = false, false
			if active != nil {
				active.Cancel()
			}
			if ctx.Err() == nil {
				report(err)
			}
			return
		}
		valid = true
		desired = location
		if pinnedOutput == "" {
			pinnedOutput = location.Base
		}
		previousDirectory = location.Directory
		if fingerprint != observed {
			observed, pending = fingerprint, true
			lastReported = ""
			if active != nil {
				active.Cancel()
			}
		}
	}
	start := func() {
		if active != nil || !valid || !pending {
			return
		}
		pending = false
		attemptCtx, cancel := context.WithCancel(ctx)
		attempt := &routeAttempt{attemptCtx, cancel, observed, make(chan routeAttemptResult, 1)}
		active = attempt
		location := desired
		go func() {
			prepared, err := PrepareRoutes(attemptCtx, location, true)
			attempt.Done <- routeAttemptResult{prepared, err}
		}()
	}
	scan()
	if ready != nil && scanError != nil {
		return scanError
	}
	for {
		start()
		var completed <-chan routeAttemptResult
		if active != nil {
			completed = active.Done
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
			scan()
		case result := <-completed:
			attempt := active
			active = nil
			invalidated := attempt.Context.Err() != nil
			attempt.Cancel()
			if cli.RequiresFailureEvidence(result.Err) {
				RouteDiagnostics(result.Prepared.Worker)
				return result.Err
			}
			// A late filesystem observation must still invalidate an old result.
			scan()
			if ctx.Err() != nil {
				return ctx.Err()
			}
			if invalidated || !valid || observed != attempt.Fingerprint {
				pending = valid
				continue
			}
			RouteDiagnostics(result.Prepared.Worker)
			if result.Err != nil {
				if ready != nil && !announced {
					return result.Err
				}
				if !errors.Is(result.Err, context.Canceled) {
					report(result.Err)
				}
				continue
			}
			if result.Prepared.Count == nil {
				if ready != nil {
					ready(nil)
					return nil
				}
				return errors.New("No route dir found — configure xplat.routes.json or pass --dir")
			}
			if err := result.Prepared.Publish(ctx); err != nil {
				if cli.RequiresFailureEvidence(err) {
					return err
				}
				if ready != nil && !announced {
					return err
				}
				report(err)
				continue
			}
			routeGenerated(*result.Prepared.Count)
			if !announced {
				fmt.Println("Watching route sources and xplat.routes.json — Ctrl+C stops watching")
				announced = true
				if ready != nil {
					ready(result.Prepared.Count)
				}
			}
		}
	}
}
