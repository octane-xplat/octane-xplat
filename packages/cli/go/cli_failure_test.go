package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"strings"
	"testing"
	"time"
)

func TestCancellationNeverHidesUnconfirmedCleanup(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	cleanup := &proc.CleanupError{Err: context.Canceled}
	wrapped := fmt.Errorf("owned operation retained: %w", cleanup)
	failure := cli.ContextualFailure(ctx, cli.ExecutionFailure(wrapped))
	if failure.Code != "execution_failure" || cli.ErrorExit(failure) != 5 || !strings.Contains(failure.Message, "retained") {
		t.Fatalf("cleanup evidence was replaced by cancellation: %#v", failure)
	}
	var recovered *proc.CleanupError
	if !errors.As(failure, &recovered) || recovered != cleanup {
		t.Fatal("CLI boundary lost the cleanup failure cause")
	}
	encoded, err := json.Marshal(failure)
	if err != nil || strings.Contains(string(encoded), "cause") || strings.Contains(string(encoded), "Err") {
		t.Fatalf("internal error cause leaked into the wire contract: %s %v", encoded, err)
	}
	if got := cli.ContextualFailure(ctx, &cli.Error{Code: "execution_failure", Message: "interrupted"}); got.Code != "cancelled" || cli.ErrorExit(got) != 8 {
		t.Fatalf("ordinary interruption lost the cancellation contract: %#v", got)
	}
}

func TestOperationAndOuterDeadlinesUseTheTimeoutExit(t *testing.T) {
	deadline := fmt.Errorf("native operation: %w", context.DeadlineExceeded)
	if failure := cli.ExecutionFailure(deadline); failure.Code != "timeout" || cli.ErrorExit(failure) != 7 {
		t.Fatalf("operation timeout became a generic failure: %#v", failure)
	}
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(-time.Second))
	defer cancel()
	if failure := cli.ContextualFailure(ctx, nil); failure.Code != "timeout" || cli.ErrorExit(failure) != 7 {
		t.Fatalf("outer timeout lost its exit contract: %#v", failure)
	}
}

func TestCancellationPreservesPartialPublicationAndRetainedStaging(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	for _, publication := range []*artifact.PublicationError{
		{Published: []string{"contracts.ts"}, Err: context.Canceled},
		{Retained: []string{"contracts.ts.tmp-owned"}, Err: context.Canceled},
	} {
		failure := cli.ContextualFailure(ctx, cli.ExecutionFailure(publication))
		if failure.Code != "execution_failure" || !strings.Contains(failure.Message, "artifact") {
			t.Fatalf("publication evidence was erased by cancellation: %#v", failure)
		}
	}
}
