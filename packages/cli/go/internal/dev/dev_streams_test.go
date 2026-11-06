package dev

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/routes"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestDevRoutesInitialBarrierAndAbsentSource(t *testing.T) {
	root := t.TempDir()
	if err := os.WriteFile(filepath.Join(root, "package.json"), []byte(`{"name":"no-routing"}`), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", "")
	called := false
	if err := routes.WatchDevRoutes(context.Background(), root, routes.RouteOptions{}, func(count *int) {
		called = true
		if count != nil {
			t.Fatal("absent source reported generation")
		}
	}); err != nil || !called {
		t.Fatalf("absent routes require no Node: %v", err)
	}
	if err := os.WriteFile(filepath.Join(root, "xplat.routes.json"), []byte("malformed"), 0600); err != nil {
		t.Fatal(err)
	}
	called = false
	if err := routes.WatchDevRoutes(context.Background(), root, routes.RouteOptions{}, func(*int) { called = true }); err == nil || called {
		t.Fatal("failed initial routing must not admit engines")
	}
}
func TestDevStreamsRetainTailAndLongTerminalLine(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	output, err := os.CreateTemp(t.TempDir(), "terminal")
	if err != nil {
		t.Fatal(err)
	}
	defer output.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	console := newDevConsole(ctx, output, cancel)
	// The terminal keeps a complete64KiB automation line; disk records retain
	// their separately bounded prefix, and a final unterminated tail survives.
	program := `process.stdout.write('π😀\n');process.stdout.write('x'.repeat(65536)+'\n');process.stderr.write('diagnostic\n');process.stdout.write('tail');`
	result, err := runLoggedDevProcess(ctx, "web", capture, console, func(ctx context.Context, out, diagnostics *os.File) (proc.Result, error) {
		return proc.RunProcessIO(ctx, []string{node, "-e", program}, store.Project, nil, out, diagnostics)
	})
	if err != nil || result.ExitCode != 0 {
		t.Fatalf("result=%+v error=%v", result, err)
	}
	if err = console.finish(ctx); err != nil {
		t.Fatal(err)
	}
	if _, err = output.Seek(0, 0); err != nil {
		t.Fatal(err)
	}
	bytes, err := io.ReadAll(output)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(bytes), "[web] "+strings.Repeat("x", 65536)+"\n") || !strings.Contains(string(bytes), "[web] tail\n") {
		t.Fatal("terminal line/tail lost")
	}
	logs, err := store.Logs(capture.Session.SessionID, "", nil, 500, "")
	if err != nil {
		t.Fatal(err)
	}
	var long, tail, diagnostic bool
	for _, r := range logs.Records {
		switch {
		case strings.HasPrefix(r.Line, "xxx"):
			long = len(r.Line) == 8192 && r.LineTruncated
		case r.Line == "tail":
			tail = true
		case r.Line == "diagnostic":
			diagnostic = r.Stream == "stderr"
		}
	}
	if !long || !tail || !diagnostic {
		data, _ := json.Marshal(logs)
		t.Fatalf("retained stream contract: %s", data)
	}
}
func TestDevStreamsCancellationDoesNotWaitForTerminalReader(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	store := testHistoryStore(t)
	capture := testHistoryCapture(t, store)
	reader, writer, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	defer reader.Close()
	defer writer.Close()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	console := newDevConsole(ctx, writer, cancel)
	defer console.close()
	// Fill the terminal independently. The managed child still reaches READY
	// and cancellation completes while no terminal consumer is reading.
	console.emit("web", strings.Repeat("blocked", 100000))
	armed := filepath.Join(store.Project, "armed")
	program := `require('node:fs').writeFileSync(process.argv[1],'ready');process.on('SIGTERM',()=>{});setInterval(()=>process.stdout.write('running\n'),10)`
	done := make(chan error, 1)
	go func() {
		_, err := runLoggedDevProcess(ctx, "web", capture, console, func(ctx context.Context, out, diagnostics *os.File) (proc.Result, error) {
			return proc.RunProcessIO(ctx, []string{node, "-e", program, armed}, store.Project, nil, out, diagnostics)
		})
		done <- err
	}()
	deadline := time.Now().Add(5 * time.Second)
	for !osfs.PathExists(armed) && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if !osfs.PathExists(armed) {
		cancel()
		t.Fatal("child never armed")
	}
	cancel()
	select {
	case err := <-done:
		if err != nil && !errors.Is(err, context.Canceled) {
			t.Fatal(err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("blocked terminal delayed process cleanup")
	}
	reader.Close()
	console.close()
	select {
	case <-console.done:
	case <-time.After(time.Second):
		t.Fatal("console did not release after its reader closed")
	}
}

func TestMacDevFrameIdentityAndFinalHistory(t *testing.T) {
	store := testHistoryStore(t)
	resources := filepath.Join(t.TempDir(), "resources")
	path := filepath.Join(t.TempDir(), "ready.json")
	id, appID := "worker-generation", "org.octane.fixture"
	good := history.MacDevFrame{Protocol: "octane-dev-worker", Version: 2, ID: id}
	ok := true
	good.OK = &ok
	good.Data.PID, good.Data.Executable, good.Data.ObservedAt = 42, filepath.Join(resources, "Fixture.app", "Contents", "MacOS", "Fixture"), time.Now().UTC().Format(time.RFC3339Nano)
	good.Data.DevNativeIdentity = history.DevNativeIdentity{AppID: appID, Processes: []history.DevNativeProcess{{PID: good.Data.PID, Executable: good.Data.Executable, ObservedAt: good.Data.ObservedAt}}}
	write := func(frame history.MacDevFrame) {
		t.Helper()
		b, _ := json.Marshal(frame)
		if err := os.WriteFile(path, b, 0600); err != nil {
			t.Fatal(err)
		}
	}
	write(good)
	frame, err := readMacDevFrame(path, id, resources, appID)
	if err != nil || frame == nil {
		t.Fatal(err)
	}
	capture, err := store.Capture(history.Session{AppID: "fixture", OwnerID: "owner", Platform: "macos", TargetID: "macos", Origin: "dev", Ownership: "owned"})
	if err != nil {
		t.Fatal(err)
	}
	defer capture.Finish("stopped", "Test owned resources released.", true)
	if err := capture.ObserveMacDev(*frame); err != nil {
		t.Fatal(err)
	}
	read, err := store.Read(capture.Session.SessionID)
	if err != nil || read.State != "starting" || read.NativeIdentity == nil {
		t.Fatalf("spawn incorrectly promoted to ready: %+v, %v", read, err)
	}
	for _, change := range []func(*history.MacDevFrame){
		func(f *history.MacDevFrame) { f.ID = "other" },
		func(f *history.MacDevFrame) { f.Data.AppID = "other" },
		func(f *history.MacDevFrame) { f.Data.Executable = filepath.Join(filepath.Dir(resources), "outside") },
		func(f *history.MacDevFrame) { f.Data.Processes[0].ObservedAt = "invalid" },
		func(f *history.MacDevFrame) { f.Data.PID = 43 },
	} {
		b, _ := json.Marshal(good)
		var bad history.MacDevFrame
		json.Unmarshal(b, &bad)
		change(&bad)
		write(bad)
		if _, err := readMacDevFrame(path, id, resources, appID); err == nil {
			t.Fatal("malformed launch evidence accepted")
		}
	}
}

func testHistoryStore(t *testing.T) *history.Store {
	t.Helper()
	store, err := history.OpenHistoryStore(t.TempDir(), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.Close() })
	return store
}
