package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

const devTerminalLineLimit = 1 << 20
const devConsoleBudget = 4 << 20

type devConsole struct {
	queue     chan string
	done      chan struct{}
	bytes     atomic.Int64
	dropped   atomic.Int64
	closeOnce sync.Once
}

// Only foreground clients construct a console. History readers never wait on
// terminal backpressure; a persistent owner uses nil and owns no console writer.
func newDevConsole(ctx context.Context, output *os.File, cancel context.CancelFunc) *devConsole {
	console := &devConsole{queue: make(chan string, 64), done: make(chan struct{})}
	go func() {
		defer close(console.done)
		for text := range console.queue {
			if ctx.Err() == nil {
				if _, err := io.WriteString(output, text); err != nil {
					devOutputFailed(ctx, err)
					cancel()
				}
			} else {
				console.dropped.Add(1)
			}
			console.bytes.Add(-int64(len(text)))
		}
	}()
	return console
}
func (console *devConsole) emit(tag, line string) {
	if console == nil || strings.TrimSpace(line) == "" {
		return
	}
	text := "[" + tag + "] " + line + "\n"
	size := int64(len(text))
	for {
		current := console.bytes.Load()
		if current+size > devConsoleBudget {
			console.dropped.Add(1)
			return
		}
		if console.bytes.CompareAndSwap(current, current+size) {
			break
		}
	}
	select {
	case console.queue <- text:
	default:
		console.bytes.Add(-size)
		console.dropped.Add(1)
	}
}
func (console *devConsole) close() {
	if console != nil {
		console.closeOnce.Do(func() { close(console.queue) })
	}
}

type devProcessRunner func(context.Context, *os.File, *os.File) (processResult, error)

// OS pipe writers go directly to the managed process. A closed or slow terminal
// cannot leave exec's forwarding goroutines blocking process cleanup. Each reader
// retains bounded records independently, and closes after a bounded final drain.
func runLoggedDevProcess(ctx context.Context, tag string, capture *historyCapture, console *devConsole, run devProcessRunner) (processResult, error) {
	outRead, outWrite, err := os.Pipe()
	if err != nil {
		return processResult{}, err
	}
	defer outRead.Close()
	errRead, errWrite, err := os.Pipe()
	if err != nil {
		outWrite.Close()
		return processResult{}, err
	}
	defer errRead.Close()
	var readers sync.WaitGroup
	failures := make(chan error, 2)
	consume := func(file *os.File, stream string) {
		defer readers.Done()
		reader := bufio.NewReaderSize(file, 64<<10)
		pending := make([]byte, 0, 64<<10)
		discard := false
		emit := func(truncated bool) {
			line := strings.TrimSuffix(strings.TrimSuffix(string(pending), "\n"), "\r")
			if capture != nil {
				_ = capture.Append(historyRecord{Stream: stream, Source: tag, Line: line, LineTruncated: truncated})
			}
			if execution, ok := ctx.Value(runtimeExecutionKey{}).(runtimeExecution); ok && execution.Stream != nil {
				execution.Stream(historyRecord{Stream: stream, Source: tag, Line: line, LineTruncated: truncated})
			}
			human := line
			if truncated {
				human = strings.ToValidUTF8(human, "�") + " [xplat: terminal line truncated after 1 MiB]"
			}
			console.emit(tag, human)
			pending = pending[:0]
		}
		for {
			chunk, e := reader.ReadSlice('\n')
			if !discard {
				remaining := devTerminalLineLimit - len(pending)
				if len(chunk) > remaining {
					pending = append(pending, chunk[:remaining]...)
					emit(true)
					discard = true
				} else {
					pending = append(pending, chunk...)
				}
			}
			if len(chunk) > 0 && chunk[len(chunk)-1] == '\n' {
				if !discard {
					emit(false)
				}
				discard = false
			}
			if e == bufio.ErrBufferFull {
				continue
			}
			if e != nil {
				if len(pending) > 0 {
					emit(false)
				}
				if e != io.EOF && !errors.Is(e, os.ErrClosed) {
					failures <- fmt.Errorf("%s stream: %w", stream, e)
				}
				return
			}
		}
	}
	readers.Add(2)
	go consume(outRead, "stdout")
	go consume(errRead, "stderr")
	result, runErr := run(ctx, outWrite, errWrite)
	closeErr := errors.Join(outWrite.Close(), errWrite.Close())
	done := make(chan struct{})
	go func() { readers.Wait(); close(done) }()
	var drainErr error
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		drainErr = errors.New("inherited output remained open after managed process cleanup; final capture is incomplete")
		outRead.Close()
		errRead.Close()
		<-done
	}
	close(failures)
	for e := range failures {
		drainErr = errors.Join(drainErr, e)
	}
	if drainErr != nil && capture != nil {
		capture.recordRetentionError(drainErr)
	}
	return result, errors.Join(runErr, closeErr, drainErr)
}

func (console *devConsole) finish(ctx context.Context) error {
	if console == nil {
		return nil
	}
	console.close()
	select {
	case <-console.done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(time.Second):
		return errors.New("terminal forwarding did not drain; retained output is separate")
	}
}
