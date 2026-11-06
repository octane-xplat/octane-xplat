package dev

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc/proctest"
)

func TestMain(m *testing.M) { proctest.Main(m) }

func TestGateChild(t *testing.T) {
	if os.Getenv("XPLAT_GO_TEST_GATE") != "1" {
		t.Skip("subprocess helper")
	}
	_, _ = os.Stdout.WriteString("native-test-gate-child\n")
}

func TestNativeTestExecutableDispatchesGate(t *testing.T) {
	exe, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	result, err := proc.RunProcess(ctx, []string{exe, "-test.run=^TestGateChild$"}, t.TempDir(), append(os.Environ(), "XPLAT_GO_TEST_GATE=1"))
	if err != nil || result.ExitCode != 0 || !strings.Contains(result.Stdout, "native-test-gate-child") {
		t.Fatalf("native test gate did not dispatch its child: %v\n%+v", err, result)
	}
}
