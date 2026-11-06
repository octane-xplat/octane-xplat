package proc

import (
	"context"
	"io"
	"os"
)

// A blocked write ends at the one-shot CLI's process exit. Do not use this
// goroutine pattern in the persistent host, whose clients have separate lives.
func WriteCommandText(ctx context.Context, output *os.File, text string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	done := make(chan error, 1)
	go func() { _, err := io.WriteString(output, text); done <- err }()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-done:
		return err
	}
}
