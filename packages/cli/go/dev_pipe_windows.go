//go:build windows

package main

import "context"

func devPipeContext(parent context.Context) (context.Context, context.CancelFunc) {
	return context.WithCancel(parent)
}

func devOutputFailed(context.Context, error) {}
