package proc

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestInheritedIOHelper(t *testing.T) {
	mode, directory := os.Getenv("XPLAT_GO_IO_HELPER"), os.Getenv("XPLAT_GO_IO_DIRECTORY")
	if mode == "" || directory == "" {
		t.Skip("subprocess helper")
	}
	signal.Ignore(syscall.SIGTERM)
	if mode == "leaf" {
		if err := os.WriteFile(filepath.Join(directory, "leaf.ready"), nil, 0600); err != nil {
			t.Fatal(err)
		}
		time.Sleep(20 * time.Second)
		return
	}
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	leaf := exec.Command(exe, "-test.run=^TestInheritedIOHelper$")
	leaf.Env = append(os.Environ(), "XPLAT_GO_IO_HELPER=leaf")
	if err = leaf.Start(); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(5 * time.Second)
	for !osfs.PathExists(filepath.Join(directory, "leaf.ready")) && time.Now().Before(deadline) {
		time.Sleep(5 * time.Millisecond)
	}
	if !osfs.PathExists(filepath.Join(directory, "leaf.ready")) {
		_ = leaf.Process.Kill()
		_ = leaf.Wait()
		t.Fatal("resistant descendant did not arm")
	}
	data, _ := json.Marshal(map[string]int{"worker": os.Getpid(), "leaf": leaf.Process.Pid})
	if err = os.WriteFile(filepath.Join(directory, "armed.json"), data, 0600); err != nil {
		_ = leaf.Process.Kill()
		_ = leaf.Wait()
		t.Fatal(err)
	}
	fmt.Fprintln(os.Stderr, "live stderr β")
	if os.Getenv("XPLAT_GO_IO_BLOCK") == "1" {
		_, _ = os.Stdout.WriteString(strings.Repeat("x", 8<<20))
	} else {
		fmt.Fprintln(os.Stdout, "live stdout π😀")
	}
	time.Sleep(20 * time.Second)
}

func TestInheritedStreamsAreLiveAndCancellationDoesNotWaitForOutputReaders(t *testing.T) {
	for _, blocked := range []bool{false, true} {
		t.Run(fmt.Sprint("blocked=", blocked), func(t *testing.T) {
			directory := t.TempDir()
			output, err := os.Create(filepath.Join(directory, "stdout"))
			if err != nil {
				t.Fatal(err)
			}
			defer output.Close()
			diagnostic, err := os.Create(filepath.Join(directory, "stderr"))
			if err != nil {
				t.Fatal(err)
			}
			defer diagnostic.Close()
			if blocked {
				_ = output.Close()
				var reader *os.File
				reader, output, err = os.Pipe()
				if err != nil {
					t.Fatal(err)
				}
				defer reader.Close()
				defer output.Close()
			}
			exe, err := os.Executable()
			if err != nil {
				t.Fatal(err)
			}
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			type completed struct {
				result Result
				err    error
			}
			done := make(chan completed, 1)
			env := append(os.Environ(), "XPLAT_GO_IO_HELPER=child", "XPLAT_GO_IO_DIRECTORY="+directory, "XPLAT_GO_IO_BLOCK="+map[bool]string{true: "1", false: "0"}[blocked])
			go func() {
				result, err := RunProcessIO(ctx, []string{exe, "-test.run=^TestInheritedIOHelper$"}, directory, env, output, diagnostic)
				done <- completed{result, err}
			}()
			deadline := time.Now().Add(7 * time.Second)
			for time.Now().Before(deadline) {
				out, _ := os.ReadFile(filepath.Join(directory, "stdout"))
				errout, _ := os.ReadFile(filepath.Join(directory, "stderr"))
				if osfs.PathExists(filepath.Join(directory, "armed.json")) && strings.Contains(string(errout), "live stderr β") && (blocked || strings.Contains(string(out), "live stdout π😀")) {
					break
				}
				time.Sleep(10 * time.Millisecond)
			}
			cancel()
			finished := <-done
			if finished.err != nil || !finished.result.Cancelled {
				t.Fatalf("inherited stream cancellation failed: %+v %v", finished.result, finished.err)
			}
			if !osfs.PathExists(filepath.Join(directory, "armed.json")) {
				t.Fatal("compiler did not start before cancellation")
			}
			if !blocked {
				out, _ := os.ReadFile(filepath.Join(directory, "stdout"))
				errout, _ := os.ReadFile(filepath.Join(directory, "stderr"))
				if !strings.Contains(string(out), "live stdout π😀") || !strings.Contains(string(errout), "live stderr β") {
					t.Fatal("stdout/stderr was not streamed independently before exit")
				}
			}
		})
	}
}
