package main

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestForegroundInputHelper(t *testing.T) {
	mode, dir := os.Getenv("XPLAT_GO_INPUT_HELPER"), os.Getenv("XPLAT_GO_INPUT_DIRECTORY")
	if mode == "" {
		t.Skip("subprocess helper")
	}
	if mode == "hang" {
		signal.Ignore(syscall.SIGTERM)
		exe, err := os.Executable()
		if err != nil {
			t.Fatal(err)
		}
		leaf := exec.Command(exe, "-test.run=^TestInheritedIOHelper$")
		leaf.Env = append(os.Environ(), "XPLAT_GO_IO_HELPER=leaf", "XPLAT_GO_IO_DIRECTORY="+dir)
		if err = leaf.Start(); err != nil {
			t.Fatal(err)
		}
		deadline := time.Now().Add(5 * time.Second)
		for !pathExists(filepath.Join(dir, "leaf.ready")) && time.Now().Before(deadline) {
			time.Sleep(5 * time.Millisecond)
		}
		if !pathExists(filepath.Join(dir, "leaf.ready")) {
			_ = leaf.Process.Kill()
			_ = leaf.Wait()
			t.Fatal("leaf did not arm")
		}
	}
	if err := os.WriteFile(filepath.Join(dir, "input.ready"), nil, 0600); err != nil {
		t.Fatal(err)
	}
	line, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err == io.EOF && line == "" {
		fmt.Print("INPUT_EOF\n")
	} else if err != nil {
		t.Fatal(err)
	} else {
		fmt.Print("INPUT:" + line)
	}
}

func TestForegroundInputIsExplicitAndDoesNotWaitForPipeEOF(t *testing.T) {
	for _, grant := range []bool{false, true} {
		t.Run(fmt.Sprint("grant=", grant), func(t *testing.T) {
			dir := t.TempDir()
			input, writer, err := os.Pipe()
			if err != nil {
				t.Fatal(err)
			}
			defer input.Close()
			defer writer.Close()
			exe, err := os.Executable()
			if err != nil {
				t.Fatal(err)
			}
			ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
			defer cancel()
			if grant {
				ctx = foregroundCommandContext(ctx, input)
			}
			done := make(chan struct{})
			var result processResult
			var runErr error
			go func() {
				result, runErr = runForegroundProcessIO(ctx, []string{exe, "-test.run=^TestForegroundInputHelper$"}, dir, append(os.Environ(), "XPLAT_GO_INPUT_HELPER=echo", "XPLAT_GO_INPUT_DIRECTORY="+dir), nil, nil)
				close(done)
			}()
			if grant {
				deadline := time.Now().Add(5 * time.Second)
				for !pathExists(filepath.Join(dir, "input.ready")) && time.Now().Before(deadline) {
					time.Sleep(5 * time.Millisecond)
				}
				if !pathExists(filepath.Join(dir, "input.ready")) {
					cancel()
					<-done
					t.Fatal("reader did not arm")
				}
				if _, err = writer.WriteString("answer π😀\n"); err != nil {
					cancel()
					<-done
					t.Fatal(err)
				}
			}
			select {
			case <-done:
			case <-time.After(6 * time.Second):
				cancel()
				<-done
				t.Fatal("operation waited for parent input EOF")
			}
			want := "INPUT_EOF"
			if grant {
				want = "INPUT:answer π😀"
			}
			if runErr != nil || result.ExitCode != 0 || !strings.Contains(result.Stdout, want) {
				t.Fatalf("input grant failed: %+v %v", result, runErr)
			}
		})
	}
}

func TestForegroundInputCancellationCleansBlockedReadersAndDescendants(t *testing.T) {
	dir := t.TempDir()
	input, writer, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	defer writer.Close()
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(foregroundCommandContext(context.Background(), input), 10*time.Second)
	defer cancel()
	done := make(chan struct{})
	var result processResult
	var runErr error
	go func() {
		result, runErr = runForegroundProcessIO(ctx, []string{exe, "-test.run=^TestForegroundInputHelper$"}, dir, append(os.Environ(), "XPLAT_GO_INPUT_HELPER=hang", "XPLAT_GO_INPUT_DIRECTORY="+dir), nil, nil)
		close(done)
	}()
	deadline := time.Now().Add(6 * time.Second)
	for !pathExists(filepath.Join(dir, "input.ready")) && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if !pathExists(filepath.Join(dir, "input.ready")) {
		cancel()
		<-done
		t.Fatal("reader/descendant did not arm")
	}
	started := time.Now()
	cancel()
	<-done
	if runErr != nil || !result.Cancelled || time.Since(started) > 3*time.Second {
		t.Fatalf("blocked input cleanup failed: %+v %v", result, runErr)
	}
}
