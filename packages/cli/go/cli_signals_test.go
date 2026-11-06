package main

import (
	"bufio"
	"context"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"os"
	"os/exec"
	"runtime"
	"syscall"
	"testing"
	"time"
)

func TestLegacySignalFixture(t *testing.T) {
	if os.Getenv("XPLAT_GO_SIGNAL_FIXTURE") != "1" {
		t.Skip("subprocess helper")
	}
	ctx, stop := proc.CliSignalContext(context.Background())
	defer stop()
	command := cli.CommandDescriptor{Name: "signal-fixture"}
	cli.Metadata.Orchestration = append(cli.Metadata.Orchestration, command)
	NativeLegacyCommands[command.Name] = func(ctx context.Context, _ map[string]any) error {
		fmt.Println("ready")
		<-ctx.Done()
		return ctx.Err()
	}
	os.Exit(runLegacyCLI(ctx, command, nil))
}

func TestImmediateLegacyCancellationRetainsTheActualSignal(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("public Windows console control needs a real console fixture")
	}
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	for _, value := range []syscall.Signal{syscall.SIGTERM, syscall.SIGINT} {
		for attempt := 0; attempt < 25; attempt++ {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			cmd := exec.CommandContext(ctx, exe, "-test.run=^TestLegacySignalFixture$")
			cmd.Env = append(os.Environ(), "XPLAT_GO_SIGNAL_FIXTURE=1")
			output, err := cmd.StdoutPipe()
			if err != nil {
				cancel()
				t.Fatal(err)
			}
			if err = cmd.Start(); err != nil {
				cancel()
				t.Fatal(err)
			}
			ready, readErr := bufio.NewReader(output).ReadString('\n')
			if readErr != nil || ready != "ready\n" {
				cancel()
				_ = cmd.Wait()
				t.Fatalf("signal fixture did not arm: %q %v", ready, readErr)
			}
			if err = cmd.Process.Signal(value); err != nil {
				cancel()
				_ = cmd.Wait()
				t.Fatal(err)
			}
			err = cmd.Wait()
			cancel()
			if exit, ok := err.(*exec.ExitError); !ok || exit.ExitCode() != 128+int(value) {
				t.Fatalf("signal %d attempt %d returned %v instead of %d", value, attempt, err, 128+int(value))
			}
		}
	}
}
