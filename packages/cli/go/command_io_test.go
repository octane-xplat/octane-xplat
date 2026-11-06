package main

import (
	"context"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"io"
	"os"
	"strings"
	"testing"
	"time"
)

func TestOneShotOutputCanCancelAnUnreadPipe(t *testing.T) {
	read, write, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer write.Close()
	defer read.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	if err = proc.WriteCommandText(ctx, write, strings.Repeat("large diagnostic", 1<<20)); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatal(err)
	}
}

func TestCancelledFailureEvidenceDoesNotWaitForeverForStderr(t *testing.T) {
	found := false
	for _, entry := range cli.Metadata.Orchestration {
		found = found || entry.Name == "doctor"
	}
	if !found {
		t.Fatal("doctor descriptor missing from the generated contract")
	}
	read, write, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer write.Close()
	defer read.Close()
	go func() { _, _ = write.Write([]byte(strings.Repeat("blocked diagnostics", 1<<20))) }()
	buffer := make([]byte, 4096)
	if _, err = io.ReadFull(read, buffer); err != nil {
		t.Fatal(err)
	}
	previousOutput := os.Stderr
	os.Stderr = write
	defer func() { os.Stderr = previousOutput }()
	previousHandler := NativeLegacyCommands["doctor"]
	NativeLegacyCommands["doctor"] = func(context.Context, map[string]any) error { return &proc.CleanupError{Err: context.Canceled} }
	defer func() { NativeLegacyCommands["doctor"] = previousHandler }()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	done := make(chan int, 1)
	go func() { done <- runLegacyCLI(ctx, cli.CommandDescriptor{Name: "doctor"}, nil) }()
	select {
	case code := <-done:
		if code != 1 {
			t.Fatalf("cleanup uncertainty must stay a failure, got %d", code)
		}
	case <-time.After(2 * time.Second):
		read.Close()
		write.Close()
		<-done
		t.Fatal("cancelled error reporting waited for an unread stderr pipe")
	}
}
