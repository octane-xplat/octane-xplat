package main

import (
	"context"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
)

type cliSignalKey struct{}
type cliSignalState struct{ number atomic.Int32 }

// Record the signal before waking cancellation consumers. Two independent
// Notify channels can race: an idle handler may finish after the context wakes
// but before a second channel receives SIGTERM, incorrectly reporting SIGINT.
func cliSignalContext(parent context.Context) (context.Context, context.CancelFunc) {
	state := &cliSignalState{}
	ctx, cancel := context.WithCancel(context.WithValue(parent, cliSignalKey{}, state))
	received := make(chan os.Signal, 1)
	signal.Notify(received, os.Interrupt, syscall.SIGTERM)
	go func() {
		select {
		case value := <-received:
			number := int32(2)
			if value == syscall.SIGTERM {
				number = 15
			}
			state.number.Store(number)
			cancel()
		case <-ctx.Done():
		}
	}()
	return ctx, func() {
		signal.Stop(received)
		cancel()
	}
}

func legacyCancellationExit(ctx context.Context) int {
	if state, ok := ctx.Value(cliSignalKey{}).(*cliSignalState); ok {
		if number := state.number.Load(); number != 0 {
			return 128 + int(number)
		}
	}
	return 130
}
