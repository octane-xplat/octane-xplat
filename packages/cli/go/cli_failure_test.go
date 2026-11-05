package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"
)

func TestCancellationNeverHidesUnconfirmedCleanup(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	cleanup := &processCleanupError{Err: context.Canceled}
	wrapped := fmt.Errorf("owned operation retained: %w", cleanup)
	failure := contextualFailure(ctx, executionFailure(wrapped))
	if failure.Code != "execution_failure" || errorExit(failure) != 5 || !strings.Contains(failure.Message, "retained") {
		t.Fatalf("cleanup evidence was replaced by cancellation: %#v", failure)
	}
	var recovered *processCleanupError
	if !errors.As(failure, &recovered) || recovered != cleanup {
		t.Fatal("CLI boundary lost the cleanup failure cause")
	}
	encoded, err := json.Marshal(failure)
	if err != nil || strings.Contains(string(encoded), "cause") || strings.Contains(string(encoded), "Err") {
		t.Fatalf("internal error cause leaked into the wire contract: %s %v", encoded, err)
	}
	if got := contextualFailure(ctx, &cliError{Code: "execution_failure", Message: "interrupted"}); got.Code != "cancelled" || errorExit(got) != 8 {
		t.Fatalf("ordinary interruption lost the cancellation contract: %#v", got)
	}
}

func TestOperationAndOuterDeadlinesUseTheTimeoutExit(t *testing.T) {
	deadline := fmt.Errorf("native operation: %w", context.DeadlineExceeded)
	if failure := executionFailure(deadline); failure.Code != "timeout" || errorExit(failure) != 7 {
		t.Fatalf("operation timeout became a generic failure: %#v", failure)
	}
	ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(-time.Second))
	defer cancel()
	if failure := contextualFailure(ctx, nil); failure.Code != "timeout" || errorExit(failure) != 7 {
		t.Fatalf("outer timeout lost its exit contract: %#v", failure)
	}
}

func TestCancellationPreservesPartialPublicationAndRetainedStaging(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	for _, publication := range []*artifactPublicationError{
		{Published: []string{"contracts.ts"}, Err: context.Canceled},
		{Retained: []string{"contracts.ts.tmp-owned"}, Err: context.Canceled},
	} {
		failure := contextualFailure(ctx, executionFailure(publication))
		if failure.Code != "execution_failure" || !strings.Contains(failure.Message, "artifact") {
			t.Fatalf("publication evidence was erased by cancellation: %#v", failure)
		}
	}
}
