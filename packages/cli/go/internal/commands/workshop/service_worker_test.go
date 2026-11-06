package workshop

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestServiceStartupEvidence(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "service.json")
	base := serviceStart{Protocol: "octane-project-service", Version: 1, ID: "request", Project: root, Operation: "workshop-dev", Target: "web", Kind: "web-listening", URL: "http://localhost:5173/"}
	for _, test := range []struct {
		name   string
		change func(*serviceStart)
		valid  bool
	}{
		{"actual local listener", func(*serviceStart) {}, true},
		{"wrong identity", func(f *serviceStart) { f.ID = "other" }, false},
		{"no project default", func(f *serviceStart) { f.Project = "" }, false},
		{"foreign listener", func(f *serviceStart) { f.URL = "http://example.com:5173/" }, false},
		{"wrong scope", func(f *serviceStart) { f.Kind = "native-host-spawned"; f.PID = 42 }, false},
		{"no implicit port", func(f *serviceStart) { f.URL = "http://localhost/" }, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			frame := base
			test.change(&frame)
			bytes, _ := json.Marshal(frame)
			if err := os.WriteFile(path, bytes, 0600); err != nil {
				t.Fatal(err)
			}
			ok, err := readServiceStart(path, "request", root, "workshop-dev", "web")
			if (err == nil && ok) != test.valid {
				t.Fatalf("admission=%v err=%v", ok, err)
			}
		})
	}
	for _, target := range []string{"macos", "linux", "ios", "android"} {
		frame := base
		frame.Target = target
		frame.PID = 42
		frame.URL = ""
		frame.Kind = "native-host-spawned"
		if target == "ios" || target == "android" {
			frame.Kind = "mobile-tool-spawned"
		}
		bytes, _ := json.Marshal(frame)
		_ = os.WriteFile(path, bytes, 0600)
		if ok, err := readServiceStart(path, "request", root, "workshop-dev", target); !ok || err != nil {
			t.Fatalf("%s: %v", target, err)
		}
	}
}

func TestServiceObserverDeadlineAndFinalRead(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "service.json")
	ctx, cancel := context.WithCancelCause(context.Background())
	defer cancel(nil)
	var started atomic.Bool
	stop := serviceObserver(ctx, path, "request", root, "workshop-dev", "web", 30*time.Millisecond, &started, cancel)
	select {
	case <-ctx.Done():
	case <-time.After(time.Second):
		t.Fatal("startup deadline failed")
	}
	stop()
	if !errors.Is(context.Cause(ctx), context.DeadlineExceeded) || started.Load() {
		t.Fatalf("bad deadline %v", context.Cause(ctx))
	}
	ctx2, cancel2 := context.WithCancelCause(context.Background())
	defer cancel2(nil)
	var final atomic.Bool
	finish := serviceObserver(ctx2, path, "request", root, "workshop-dev", "web", time.Second, &final, cancel2)
	frame := serviceStart{Protocol: "octane-project-service", Version: 1, ID: "request", Project: root, Operation: "workshop-dev", Target: "web", Kind: "web-listening", URL: "http://localhost:5173/"}
	bytes, _ := json.Marshal(frame)
	if err := os.WriteFile(path, bytes, 0600); err != nil {
		t.Fatal(err)
	}
	finish()
	if !final.Load() || context.Cause(ctx2) != nil {
		t.Fatalf("final receipt lost: %v", context.Cause(ctx2))
	}
}

func TestServiceWorkerLifetimeAndStartupCancellation(t *testing.T) {
	if _, err := exec.LookPath("node"); err != nil {
		t.Skip("Node project runtime unavailable")
	}
	for _, mode := range []string{"started", "timeout", "bad-identity"} {
		t.Run(mode, func(t *testing.T) {
			project, err := osfs.Canonical(t.TempDir())
			if err != nil {
				t.Fatal(err)
			}
			if err = os.WriteFile(filepath.Join(project, "package.json"), []byte(`{"name":"service-unit","type":"module"}`), 0600); err != nil {
				t.Fatal(err)
			}
			worker := filepath.Join(project, "worker.js")
			program := `import{readFileSync,writeFileSync,renameSync}from'node:fs';import{spawn}from'node:child_process';
const req=JSON.parse(readFileSync(process.argv[2]));
const data={version:1,project:req.project,operation:req.operation,target:req.target,state:'accepted'};
writeFileSync(process.argv[3],JSON.stringify({protocol:req.protocol,version:req.version,id:req.id,ok:true,data,warnings:[]}));
const mode=` + strconv.Quote(mode) + `;
if(mode!=='timeout') {writeFileSync(req.serviceStateFile+'.next',JSON.stringify({protocol:'octane-project-service',version:1,id:mode==='bad-identity'?'wrong':req.id,project:req.project,operation:req.operation,target:req.target,kind:'web-listening',url:'http://localhost:12345/'}));renameSync(req.serviceStateFile+'.next',req.serviceStateFile)}
if(mode==='started'){console.log('service stdout');console.error('service stderr')}else{const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});writeFileSync('owned-child',String(child.pid));process.on('SIGTERM',()=>{});setInterval(()=>{},1000)};`
			if err = os.WriteFile(worker, []byte(program), 0600); err != nil {
				t.Fatal(err)
			}
			// Allow a real Node process to start on a busy host. The observer's
			// short deadline is covered independently without process startup.
			ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			defer cancel()
			result, err := runServiceWorker(ctx, project, worker, "workshop-dev", "web", map[string]any{"target": "web"}, 5*time.Second, nil, nil, nil)
			switch mode {
			case "started":
				if err != nil || result.Process.Cancelled || !strings.Contains(result.Process.Stdout, "service stdout") || !strings.Contains(result.Process.Stderr, "service stderr") {
					t.Fatalf("result=%+v err=%v", result, err)
				}
			case "timeout":
				if !errors.Is(err, context.DeadlineExceeded) || !result.Process.Cancelled {
					t.Fatalf("result=%+v err=%v", result, err)
				}
				if _, err := os.Stat(filepath.Join(project, "owned-child")); err != nil {
					t.Fatal("child did not arm before startup cancellation", err)
				}
			case "bad-identity":
				if err == nil || !strings.Contains(err.Error(), "identity mismatch") {
					t.Fatalf("expected startup identity failure: %v", err)
				}
			}
		})
	}
}
