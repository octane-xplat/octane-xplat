//go:build windows

package proc

import "context"

func DevPipeContext(parent context.Context) (context.Context, context.CancelFunc) {
	return context.WithCancel(parent)
}

func DevOutputFailed(context.Context, error) {}
