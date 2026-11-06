package dev

import (
	"context"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
)

// Stream and native-host sinks feed the foreground dev server's live views.
type devSinksKey struct{}
type devSinks struct {
	Stream func(history.Record)
	Native func(history.MacDevFrame)
}

func withDevSinks(ctx context.Context, sinks devSinks) context.Context {
	return context.WithValue(ctx, devSinksKey{}, sinks)
}

func devSinksFromContext(ctx context.Context) (devSinks, bool) {
	sinks, ok := ctx.Value(devSinksKey{}).(devSinks)
	return sinks, ok
}
