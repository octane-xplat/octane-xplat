package osfs

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"
)

func TestCacheLockChild(t *testing.T) {
	path := os.Getenv("XPLAT_GO_LOCK_HELPER")
	if path == "" {
		t.Skip("subprocess helper")
	}
	if err := PreparePrivateCache(path); err != nil {
		t.Fatal(err)
	}
	root, err := os.OpenRoot(path)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	release, err := LockCache(context.Background(), root, "mutation.lock")
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	fmt.Println("locked")
	_, _ = io.Copy(io.Discard, os.Stdin)
}

func TestCacheKernelReleaseAndCancellation(t *testing.T) {
	path := filepath.Join(t.TempDir(), "go-v1")
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	command := exec.Command(executable, "-test.run=^TestCacheLockChild$")
	command.Env = append(os.Environ(), "XPLAT_GO_LOCK_HELPER="+path)
	input, err := command.StdinPipe()
	if err != nil {
		t.Fatal(err)
	}
	defer input.Close()
	output, err := command.StdoutPipe()
	if err != nil {
		t.Fatal(err)
	}
	command.Stderr = os.Stderr
	if err = command.Start(); err != nil {
		t.Fatal(err)
	}
	waited := false
	defer func() {
		if !waited {
			_ = command.Process.Kill()
			_ = command.Wait()
		}
	}()
	ready := make(chan error, 1)
	go func() {
		line, err := bufio.NewReader(output).ReadString('\n')
		if err == nil && line != "locked\n" && line != "locked\r\n" {
			err = fmt.Errorf("unexpected lock helper output: %q", line)
		}
		ready <- err
	}()
	select {
	case err = <-ready:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("lock helper did not become ready")
	}
	root, err := os.OpenRoot(path)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	release, err := LockCache(ctx, root, "mutation.lock")
	if release != nil {
		release()
	}
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("contended lock must honor cancellation: %v", err)
	}
	if err = command.Process.Kill(); err != nil {
		t.Fatal(err)
	}
	_ = command.Wait()
	waited = true
	ctx, cancel = context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	release, err = LockCache(ctx, root, "mutation.lock")
	if err != nil {
		t.Fatalf("kernel did not release dead process lock: %v", err)
	}
	release()
}
