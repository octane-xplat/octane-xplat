package main

import (
	"os"
	"os/exec"
	"strings"
	"testing"
)

func TestCaptureOutputHelper(t *testing.T) {
	if os.Getenv("XPLAT_GO_LIMITED_CAPTURE_HELPER") != "1" {
		return
	}
	_, err := os.Stdout.Write([]byte(strings.Repeat("X", 2*captureLimit)))
	if err != nil {
		os.Exit(1)
	}
	os.Exit(0)
}
func TestSubprocessCaptureEnforcesItsByteLimit(t *testing.T) {
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	command := exec.Command(executable, "-test.run=^TestCaptureOutputHelper$")
	command.Env = append(os.Environ(), "XPLAT_GO_LIMITED_CAPTURE_HELPER=1")
	var stdout, stderr limitedCapture
	command.Stdout = &stdout
	command.Stderr = &stderr
	if err = command.Run(); err != nil {
		t.Fatalf("capture helper failed: %v", err)
	}
	if len(stdout.String()) != captureLimit || !stdout.Truncated {
		t.Fatalf("subprocess capture bypassed its cap: bytes=%d truncated=%v", len(stdout.String()), stdout.Truncated)
	}
}
