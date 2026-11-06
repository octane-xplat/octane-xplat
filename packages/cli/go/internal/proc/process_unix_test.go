//go:build darwin || linux

package proc

import (
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"golang.org/x/sys/unix"
)

func TestReservedLeaderHelper(t *testing.T) {
	mode := os.Getenv("XPLAT_GO_PROCESS_HELPER")
	if mode == "" {
		t.Skip("subprocess helper")
	}
	if mode == "hold" {
		signal.Ignore(syscall.SIGTERM)
		if err := os.WriteFile(os.Getenv("XPLAT_GO_PROCESS_READY"), []byte("ready"), 0600); err != nil {
			os.Exit(9)
		}
		for {
			time.Sleep(time.Second)
		}
	}
	if mode == "tree" {
		executable, _ := os.Executable()
		child := exec.Command(executable, "-test.run=^TestReservedLeaderHelper$")
		child.Env = append(os.Environ(), "XPLAT_GO_PROCESS_HELPER=hold")
		if child.Start() != nil {
			os.Exit(9)
		}
		deadline := time.Now().Add(3 * time.Second)
		for !osfs.PathExists(os.Getenv("XPLAT_GO_PROCESS_READY")) {
			if time.Now().After(deadline) {
				os.Exit(9)
			}
			time.Sleep(time.Millisecond)
		}
	}
	os.Exit(7)
}

func TestLeaderIdentityRemainsReservedThroughDescendantCleanup(t *testing.T) {
	for _, mode := range []string{"exit", "tree"} {
		t.Run(mode, func(t *testing.T) {
			executable, err := os.Executable()
			if err != nil {
				t.Fatal(err)
			}
			command, containment, err := containedCommand([]string{executable, "-test.run=^TestReservedLeaderHelper$"}, nil, "")
			if err != nil {
				t.Fatal(err)
			}
			defer containment.close()
			command.Env = append(os.Environ(), "XPLAT_GO_PROCESS_HELPER="+mode, "XPLAT_GO_PROCESS_READY="+filepath.Join(t.TempDir(), "ready"))
			if err = command.Start(); err != nil {
				t.Fatal(err)
			}
			if err = containment.attach(command); err != nil {
				_ = command.Process.Kill()
				_ = command.Wait()
				t.Fatal(err)
			}
			reaped := false
			defer func() {
				if !reaped {
					containment.kill()
					_ = containment.wait()
					_ = containment.reap(command)
				}
			}()
			done := make(chan error, 1)
			go func() { done <- containment.observeExit(command) }()
			select {
			case err = <-done:
				if err != nil {
					t.Fatal(err)
				}
			case <-time.After(5 * time.Second):
				t.Fatal("child exit was not observed")
			}
			if command.ProcessState != nil {
				t.Fatal("leader was reaped before cleanup")
			}
			if err = unix.Kill(command.Process.Pid, 0); err != nil {
				t.Fatalf("leader PID reservation disappeared: %v", err)
			}
			others, err := groupHasOthers(command.Process.Pid)
			if err != nil {
				t.Fatal(err)
			}
			if others != (mode == "tree") {
				t.Fatalf("unexpected descendant membership: %v", others)
			}
			containment.terminate()
			if mode == "tree" {
				time.Sleep(25 * time.Millisecond)
				others, err = groupHasOthers(command.Process.Pid)
				if err != nil || !others {
					t.Fatalf("resistant descendant should remain before force cleanup: %v %v", others, err)
				}
			}
			containment.kill()
			if err = containment.wait(); err != nil {
				t.Fatal(err)
			}
			if err = unix.Kill(command.Process.Pid, 0); err != nil {
				t.Fatalf("cleanup released leader identity early: %v", err)
			}
			err = containment.reap(command)
			reaped = true
			var exit *exec.ExitError
			if !errors.As(err, &exit) || exit.ExitCode() != 7 {
				t.Fatalf("lost actual child exit: %v", err)
			}
		})
	}
}
