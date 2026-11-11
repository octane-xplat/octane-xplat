package devtools

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestDevtoolsCommandRejectsNonDarwinHost(t *testing.T) {
	previous := hostGOOS
	hostGOOS = "linux"
	defer func() { hostGOOS = previous }()
	var failure *cli.Error
	if err := Command(context.Background(), map[string]any{}); !errors.As(err, &failure) || failure.Code != "unsupported_capability" || !strings.Contains(failure.Message, "macOS") {
		t.Fatalf("expected unsupported_capability naming macOS: %v", err)
	}
}

func TestDevtoolsCommandRequiresBoundApp(t *testing.T) {
	if hostGOOS != "darwin" {
		t.Skip("workspace selection is exercised only on the macOS host")
	}
	root := t.TempDir()
	for _, name := range []string{"one", "two"} {
		app := filepath.Join(root, "apps", name)
		if err := os.MkdirAll(app, 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(app, "package.json"), []byte(`{"name":"`+name+`","xplat":{"targets":{"web":{}}}}`), 0600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(root, "package.json"), []byte(`{"name":"workspace","workspaces":["apps/*"]}`), 0600); err != nil {
		t.Fatal(err)
	}
	if err := Command(context.Background(), map[string]any{"project": root}); err == nil || !strings.Contains(err.Error(), "selected app") {
		t.Fatalf("ambiguous workspace must refuse without --app: %v", err)
	}
}

func TestDevtoolsCommandWorkerRequestShape(t *testing.T) {
	if hostGOOS != "darwin" {
		t.Skip("the service worker path is exercised only on the macOS host")
	}
	if _, err := exec.LookPath("node"); err != nil {
		t.Skip("Node project runtime unavailable")
	}
	project, err := osfs.Canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(filepath.Join(project, "package.json"), []byte(`{"name":"devtools-consumer","xplat":{"targets":{"macos":{}}}}`), 0600); err != nil {
		t.Fatal(err)
	}
	cliRoot := filepath.Join(project, "node_modules", "@octane-xplat", "cli")
	if err = os.MkdirAll(cliRoot, 0700); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(filepath.Join(cliRoot, "package.json"), []byte(`{"name":"@octane-xplat/cli","exports":{"./worker":"./worker.js"}}`), 0600); err != nil {
		t.Fatal(err)
	}
	worker := `import{readFileSync,writeFileSync,renameSync}from'node:fs';
const req=JSON.parse(readFileSync(process.argv[2]));
writeFileSync('captured-request.json',JSON.stringify(req));
const data={version:1,project:req.project,operation:req.operation,target:req.target,state:'accepted'};
writeFileSync(process.argv[3],JSON.stringify({protocol:req.protocol,version:req.version,id:req.id,ok:true,data,warnings:[]}));
writeFileSync(req.serviceStateFile+'.next',JSON.stringify({protocol:'octane-project-service',version:1,id:req.id,project:req.project,operation:req.operation,target:req.target,kind:'native-host-spawned',pid:42}));
renameSync(req.serviceStateFile+'.next',req.serviceStateFile);`
	if err = os.WriteFile(filepath.Join(cliRoot, "worker.js"), []byte(worker), 0600); err != nil {
		t.Fatal(err)
	}
	if err = Command(context.Background(), map[string]any{"project": project}); err != nil {
		t.Fatalf("devtools command with stubbed engine: %v", err)
	}
	captured, err := os.ReadFile(filepath.Join(project, "captured-request.json"))
	if err != nil {
		t.Fatal(err)
	}
	var request struct {
		Protocol         string `json:"protocol"`
		Version          int    `json:"version"`
		Operation        string `json:"operation"`
		Project          string `json:"project"`
		Target           string `json:"target"`
		ServiceStateFile string `json:"serviceStateFile"`
		ResourceRoot     string `json:"resourceRoot"`
		ProfileRoot      string `json:"profileRoot"`
	}
	if err = json.Unmarshal(captured, &request); err != nil {
		t.Fatal(err)
	}
	if request.Protocol != "octane-build-worker" || request.Version != 1 || request.Operation != "devtools-desktop" || request.Project != project || request.Target != "macos" {
		t.Fatalf("invalid devtools worker request: %+v", request)
	}
	if filepath.Base(request.ServiceStateFile) != "service.json" || filepath.Base(request.ResourceRoot) != "resources" || filepath.Dir(request.ResourceRoot) != filepath.Dir(request.ServiceStateFile) {
		t.Fatalf("invalid native-owned service paths: %+v", request)
	}
	if !strings.HasPrefix(request.ProfileRoot, project+string(filepath.Separator)) || !strings.HasPrefix(filepath.Base(request.ProfileRoot), ".xplat-go-profile-") {
		t.Fatalf("macOS devtools must receive an owned compiler profile: %q", request.ProfileRoot)
	}
}

func TestDevtoolsCommandDoesNotRequireProjectOutputsLock(t *testing.T) {
	if hostGOOS != "darwin" {
		t.Skip("the service worker path is exercised only on the macOS host")
	}
	root, err := osfs.Canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(filepath.Join(root, "package.json"), []byte(`{"name":"devtools-consumer","xplat":{"targets":{"macos":{}}}}`), 0600); err != nil {
		t.Fatal(err)
	}
	cliRoot := filepath.Join(root, "node_modules", "@octane-xplat", "cli")
	if err = os.MkdirAll(cliRoot, 0700); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(filepath.Join(cliRoot, "package.json"), []byte(`{"name":"@octane-xplat/cli","exports":{"./worker":"./worker.js"}}`), 0600); err != nil {
		t.Fatal(err)
	}
	if err = os.WriteFile(filepath.Join(cliRoot, "worker.js"), []byte(`// unused; runWorker is stubbed`), 0600); err != nil {
		t.Fatal(err)
	}
	previous := runWorker
	called := false
	runWorker = func(_ context.Context, _, _, _, _ string, _ map[string]any, _ time.Duration, _, _, _ *os.File) (project.WorkerResult, error) {
		called = true
		return project.WorkerResult{}, nil
	}
	defer func() { runWorker = previous }()
	// A live `xplat dev` in the same app holds this lock for its lifetime;
	// devtools must still run — it never writes project outputs.
	release, err := project.LockProjectOutputs(root)
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	if err = Command(context.Background(), map[string]any{"project": root}); err != nil {
		t.Fatalf("devtools must run while project outputs are locked: %v", err)
	}
	if !called {
		t.Fatal("devtools command did not reach the service worker")
	}
}
