package dev

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// Test double for the dev server admission contract: jobs register before
// starting and release their claim only after awaited cleanup.
type testJobOwner struct {
	mu         sync.Mutex
	ctx        context.Context
	cancel     context.CancelFunc
	closing    bool
	active     int
	cleanupErr error
	operations sync.WaitGroup
}

func newTestJobOwner() *testJobOwner {
	ctx, cancel := context.WithCancel(context.Background())
	return &testJobOwner{ctx: ctx, cancel: cancel}
}

func (owner *testJobOwner) admit() (context.Context, func(error), error) {
	owner.mu.Lock()
	defer owner.mu.Unlock()
	if owner.closing || owner.ctx.Err() != nil {
		return nil, nil, errors.New("dev server is stopping")
	}
	owner.active++
	owner.operations.Add(1)
	var once sync.Once
	return owner.ctx, func(cleanup error) {
		once.Do(func() {
			owner.mu.Lock()
			owner.active--
			owner.cleanupErr = errors.Join(owner.cleanupErr, cleanup)
			owner.mu.Unlock()
			owner.operations.Done()
		})
	}, nil
}

func (owner *testJobOwner) stop() {
	owner.mu.Lock()
	owner.closing = true
	owner.mu.Unlock()
	owner.cancel()
}

func runtimeJobsFixture(t *testing.T) (*testJobOwner, *runtimeJobs) {
	t.Helper()
	owner := newTestJobOwner()
	t.Cleanup(func() { owner.stop(); owner.operations.Wait() })
	return owner, newRuntimeJobs(owner)
}

func awaitRuntimeJob(t *testing.T, registry *runtimeJobs, input runtimeJobInput, id string) runtimeJob {
	t.Helper()
	registry.mu.Lock()
	entry := registry.jobs[id]
	registry.mu.Unlock()
	if entry == nil {
		t.Fatal("job was trimmed before awaiting")
	}
	select {
	case <-entry.done:
	case <-time.After(5 * time.Second):
		t.Fatal("job cleanup did not finish")
	}
	job, failure := registry.status(input.AppID, input.AppRoot, id)
	if failure != nil {
		t.Fatal(failure)
	}
	return job
}

func jobTestInput() runtimeJobInput {
	return runtimeJobInput{AppID: "apps/a", AppRoot: "/selected/app", Platform: "web", Kind: "build", RequestKey: "same"}
}

func TestDevJobsAtomicDedupeAndAppPlatformIsolation(t *testing.T) {
	owner, registry := runtimeJobsFixture(t)
	input := jobTestInput()
	gate := make(chan struct{})
	defer close(gate)
	run := func(ctx context.Context, _ func(map[string]any) error) (any, error) {
		select {
		case <-gate:
		case <-ctx.Done():
		}
		return "complete", nil
	}
	var callers sync.WaitGroup
	ids := make(chan string, 64)
	var created atomic.Int32
	for range 64 {
		callers.Go(func() {
			job, deduped, err := registry.start(input, run)
			if err != nil {
				t.Error(err)
				return
			}
			if !deduped {
				created.Add(1)
			}
			ids <- job.JobID
		})
	}
	callers.Wait()
	close(ids)
	id := ""
	for next := range ids {
		if id != "" && next != id {
			t.Fatal("concurrent duplicate created another job")
		}
		id = next
	}
	if created.Load() != 1 || id == "" {
		t.Fatal("creation was not atomic")
	}
	for _, change := range []func(*runtimeJobInput){func(i *runtimeJobInput) { i.AppID = "apps/b"; i.AppRoot = "/other/app" }, func(i *runtimeJobInput) { i.Platform = "android" }} {
		other := input
		change(&other)
		job, deduped, err := registry.start(other, run)
		if err != nil || deduped || job.JobID == id {
			t.Fatal("request key crossed app/platform binding")
		}
	}
	if _, err := registry.status("other", input.AppRoot, id); err == nil || err.Code != "not_found" {
		t.Fatal("foreign app read leaked a job")
	}
	if _, err := registry.status(input.AppID, "/other/root", id); err == nil || err.Code != "not_found" {
		t.Fatal("foreign app root read leaked a job")
	}
	owner.mu.Lock()
	active := owner.active
	owner.mu.Unlock()
	if active != 3 {
		t.Fatal("jobs did not retain server admission")
	}
}

func TestDevJobsCancellationWaitsForCleanupAndPreservesFailure(t *testing.T) {
	for _, unsafe := range []bool{false, true} {
		t.Run(map[bool]string{false: "confirmed", true: "unknown"}[unsafe], func(t *testing.T) {
			owner, registry := runtimeJobsFixture(t)
			input := jobTestInput()
			started, cancelled, cleanup := make(chan struct{}), make(chan struct{}), make(chan struct{})
			var once sync.Once
			defer once.Do(func() { close(cleanup) })
			job, _, err := registry.start(input, func(ctx context.Context, report func(map[string]any) error) (any, error) {
				if err := report(map[string]any{"phase": "running"}); err != nil {
					return nil, err
				}
				close(started)
				<-ctx.Done()
				close(cancelled)
				<-cleanup
				if unsafe {
					return nil, &devServerCleanupError{Err: errors.New("injected unconfirmed resource cleanup")}
				}
				return map[string]bool{"cleanupComplete": true}, nil
			})
			if err != nil {
				t.Fatal(err)
			}
			<-started
			owner.cancel()
			<-cancelled
			owner.mu.Lock()
			active := owner.active
			owner.mu.Unlock()
			if active != 1 {
				t.Fatal("cancellation released the operation before cleanup")
			}
			once.Do(func() { close(cleanup) })
			value := awaitRuntimeJob(t, registry, input, job.JobID)
			want := "cancelled"
			if unsafe {
				want = "failed"
			}
			if value.State != want || value.FinishedAt == "" {
				t.Fatalf("terminal state %s; want %s", value.State, want)
			}
			if !unsafe && !strings.Contains(string(value.Result), "cleanupComplete") {
				t.Fatal("cancellation erased successfully returned runner facts")
			}
			owner.mu.Lock()
			retained := owner.cleanupErr
			owner.mu.Unlock()
			if (retained != nil) != unsafe {
				t.Fatal("cleanup failure was hidden or cancellation poisoned the server")
			}
		})
	}
}

func TestDevJobsSnapshotsBoundsHistoryAndRetry(t *testing.T) {
	_, registry := runtimeJobsFixture(t)
	registry.historyLimit = 2
	input := jobTestInput()
	var first string
	for index := range 3 {
		job, deduped, err := registry.start(input, func(ctx context.Context, report func(map[string]any) error) (any, error) {
			if err := report(map[string]any{"phase": "started", "keep": true}); err != nil {
				return nil, err
			}
			if err := report(map[string]any{"phase": "complete"}); err != nil {
				return nil, err
			}
			if err := report(map[string]any{"tooLarge": strings.Repeat("x", 17<<10)}); err == nil {
				return nil, errors.New("accepted unbounded progress")
			}
			return map[string]any{"value": index}, nil
		})
		if err != nil || deduped {
			t.Fatal("finished request key prevented a retry")
		}
		value := awaitRuntimeJob(t, registry, input, job.JobID)
		if value.State != "succeeded" {
			t.Fatalf("successful result lost: %+v", value)
		}
		var progress map[string]any
		if json.Unmarshal(value.Progress, &progress) != nil || progress["keep"] != true || progress["phase"] != "complete" {
			t.Fatal("progress merge changed")
		}
		value.Progress[0] = '!'
		value.Result[0] = '!'
		fresh, _ := registry.status(input.AppID, input.AppRoot, job.JobID)
		if !json.Valid(fresh.Progress) || !json.Valid(fresh.Result) {
			t.Fatal("returned snapshot mutated live state")
		}
		if index == 0 {
			first = job.JobID
		}
	}
	if _, err := registry.status(input.AppID, input.AppRoot, first); err == nil {
		t.Fatal("completed history was not bounded")
	}
	job, _, _ := registry.start(input, func(context.Context, func(map[string]any) error) (any, error) {
		return strings.Repeat("x", 257<<10), nil
	})
	if value := awaitRuntimeJob(t, registry, input, job.JobID); value.State != "failed" || len(value.Result) != 0 {
		t.Fatal("oversized result retained")
	}
}

func TestDevJobsPanicAndShutdownAdmission(t *testing.T) {
	owner, registry := runtimeJobsFixture(t)
	input := jobTestInput()
	job, _, err := registry.start(input, func(context.Context, func(map[string]any) error) (any, error) { panic("injected provider panic") })
	if err != nil {
		t.Fatal(err)
	}
	if result := awaitRuntimeJob(t, registry, input, job.JobID); result.State != "failed" {
		t.Fatal("panic escaped registry")
	}
	owner.mu.Lock()
	cleanup := owner.cleanupErr
	owner.mu.Unlock()
	if cleanup == nil {
		t.Fatal("panic falsely confirmed resource cleanup")
	}
	owner.stop()
	if _, _, err := registry.start(input, func(context.Context, func(map[string]any) error) (any, error) {
		t.Error("started after shutdown")
		return nil, nil
	}); err == nil {
		t.Fatal("shutdown admitted a new job")
	}
}

func TestDevJobsPartialPublicationIsFailureWithoutLiveResourceLeak(t *testing.T) {
	owner, registry := runtimeJobsFixture(t)
	input := jobTestInput()
	started := make(chan struct{})
	job, _, err := registry.start(input, func(ctx context.Context, report func(map[string]any) error) (any, error) {
		close(started)
		<-ctx.Done()
		return nil, &artifact.PublicationError{Published: []string{"generated/file"}, Err: context.Canceled}
	})
	if err != nil {
		t.Fatal(err)
	}
	<-started
	owner.cancel()
	value := awaitRuntimeJob(t, registry, input, job.JobID)
	if value.State != "failed" || !strings.Contains(string(value.Error), "execution_failure") {
		t.Fatal("partial publication became a successful cancellation")
	}
	owner.mu.Lock()
	cleanup := owner.cleanupErr
	owner.mu.Unlock()
	if cleanup != nil {
		t.Fatal("partial file effects incorrectly imply a live resource leak")
	}
}

func TestDevJobsPreserveStructuredErrorAndEnforceLiveLimit(t *testing.T) {
	_, registry := runtimeJobsFixture(t)
	registry.liveLimit = 1
	input := jobTestInput()
	gate := make(chan struct{})
	var release sync.Once
	defer release.Do(func() { close(gate) })
	job, _, failure := registry.start(input, func(ctx context.Context, report func(map[string]any) error) (any, error) {
		select {
		case <-gate:
		case <-ctx.Done():
		}
		retryable := true
		return nil, &cli.Error{Code: "prerequisite_missing", Message: "Install the project engine", Retryable: &retryable, Context: map[string]any{"engine": "vite"}}
	})
	if failure != nil {
		t.Fatal(failure)
	}
	if _, deduped, err := registry.start(input, func(context.Context, func(map[string]any) error) (any, error) {
		t.Error("duplicate ran")
		return nil, nil
	}); err != nil || !deduped {
		t.Fatal("dedupe failed at capacity")
	}
	other := input
	other.RequestKey = "another"
	if _, _, err := registry.start(other, func(context.Context, func(map[string]any) error) (any, error) {
		t.Error("overcapacity job ran")
		return nil, nil
	}); err == nil || err.Code != "unavailable" {
		t.Fatal("live limit not enforced")
	}
	release.Do(func() { close(gate) })
	value := awaitRuntimeJob(t, registry, input, job.JobID)
	var contract cli.Error
	if json.Unmarshal(value.Error, &contract) != nil || contract.Code != "prerequisite_missing" || contract.Retryable == nil || !*contract.Retryable || contract.Context == nil {
		t.Fatal("structured provider failure lost its contract")
	}
}
