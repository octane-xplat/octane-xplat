//go:build darwin || linux

package proc

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"syscall"
)

// Go otherwise exits immediately on a broken stdout pipe. A foreground dev
// owner must cancel and reap its children before returning the conventional141.
func DevPipeContext(parent context.Context) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(parent)
	events := make(chan os.Signal, 1)
	signal.Notify(events, syscall.SIGPIPE)
	go func() {
		select {
		case <-events:
			if state, ok := parent.Value(cliSignalKey{}).(*cliSignalState); ok {
				state.number.CompareAndSwap(0, 13)
			}
			cancel()
		case <-ctx.Done():
		}
	}()
	return ctx, func() { signal.Stop(events); cancel() }
}

func DevOutputFailed(ctx context.Context, err error) {
	if errors.Is(err, syscall.EPIPE) {
		if state, ok := ctx.Value(cliSignalKey{}).(*cliSignalState); ok {
			state.number.CompareAndSwap(0, 13)
		}
	}
}
