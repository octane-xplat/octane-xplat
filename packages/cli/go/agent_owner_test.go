package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

type agentOwnerFixture struct {
	descriptor         agentOwnerDescriptor
	directory, project string
	done               chan error
}

func startAgentOwnerFixture(t *testing.T, idle time.Duration, dispatch agentOwnerDispatch) *agentOwnerFixture {
	t.Helper()
	directory, err := privateDirectory(t.TempDir(), "owner-")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	f := &agentOwnerFixture{directory: directory, project: t.TempDir(), done: make(chan error, 1)}
	exited := make(chan struct{})
	go func() { defer close(exited); f.done <- serveAgentOwner(ctx, directory, f.project, idle, dispatch) }()
	t.Cleanup(func() {
		cancel()
		select {
		case <-exited:
		case <-time.After(8 * time.Second):
			t.Error("fixture owner did not join")
		}
	})
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		if readJSON(filepath.Join(directory, "owner.json"), &f.descriptor) == nil {
			return f
		}
		select {
		case err := <-f.done:
			t.Fatalf("owner exited before readiness: %v", err)
		default:
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("native owner readiness timed out")
	return nil
}
func agentOwnerRPC(t *testing.T, d agentOwnerDescriptor, body string, headers map[string]string) (int, map[string]any) {
	t.Helper()
	request, err := http.NewRequest("POST", d.Address, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Authorization", "Bearer "+d.Token)
	request.Header.Set("X-Octane-Owner", d.Generation)
	for k, v := range headers {
		request.Header.Set(k, v)
	}
	transport := &http.Transport{Proxy: nil}
	defer transport.CloseIdleConnections()
	response, err := (&http.Client{Transport: transport, Timeout: 2 * time.Second}).Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	bytes, err := io.ReadAll(io.LimitReader(response.Body, 16<<20))
	if err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	if response.StatusCode == 200 && json.Unmarshal(bytes, &value) != nil {
		t.Fatal("invalid native owner JSON reply")
	}
	return response.StatusCode, value
}
func awaitAgentOwner(t *testing.T, f *agentOwnerFixture) error {
	t.Helper()
	select {
	case err := <-f.done:
		return err
	case <-time.After(8 * time.Second):
		t.Fatal("native owner cleanup did not finish")
	}
	return nil
}
func TestAgentOwnerAuthenticationAndRetirement(t *testing.T) {
	f := startAgentOwnerFixture(t, 500*time.Millisecond, nil)
	for _, headers := range []map[string]string{{"Authorization": "Bearer wrong"}, {"X-Octane-Owner": "wrong"}, {"Origin": "http://localhost"}} {
		if code, _ := agentOwnerRPC(t, f.descriptor, `{"method":"host.ping"}`, headers); code != 403 {
			t.Fatalf("unauthenticated RPC accepted: %d", code)
		}
	}
	for _, body := range []string{`{"method":"host.ping"} {}`, `{"method":"host.ping","unknown":true}`, `{"method":"host.ping","params":{"large":"` + strings.Repeat("x", (1<<20)+1) + `"}}`} {
		if code, _ := agentOwnerRPC(t, f.descriptor, body, nil); code != 400 {
			t.Fatalf("invalid request admitted: %d", code)
		}
	}
	code, value := agentOwnerRPC(t, f.descriptor, `{"method":"host.ping"}`, nil)
	if code != 200 || value["ok"] != true || value["generation"] != f.descriptor.Generation {
		t.Fatal("authenticated native generation not echoed")
	}
	if err := awaitAgentOwner(t, f); err != nil {
		t.Fatal(err)
	}
	if pathExists(filepath.Join(f.directory, "owner.json")) {
		t.Fatal("retired owner still advertises readiness")
	}
	if !pathExists(filepath.Join(f.directory, "owner.lock")) {
		t.Fatal("stable lifetime lock identity was removed")
	}
}
func TestAgentOwnerLifetimeLeaseAndUnknownCleanup(t *testing.T) {
	finishes := make(chan func(error), 1)
	f := startAgentOwnerFixture(t, time.Second, func(ctx context.Context, owner *agentOwner, request agentOwnerRequest) (any, *cliError) {
		_, done, err := owner.admit()
		if err != nil {
			return nil, executionFailure(err)
		}
		finishes <- done
		return map[string]bool{"admitted": true}, nil
	})
	agentOwnerRPC(t, f.descriptor, `{"method":"claim"}`, nil)
	finish := <-finishes
	t.Cleanup(func() { finish(nil) })
	ctx, cancel := context.WithTimeout(context.Background(), 70*time.Millisecond)
	defer cancel()
	if err := serveAgentOwner(ctx, f.directory, f.project, time.Second, nil); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("second owner bypassed lifetime lease: %v", err)
	}
	agentOwnerRPC(t, f.descriptor, `{"method":"host.shutdown"}`, nil)
	// Repeated completion cannot underflow the registry or release another claim.
	failure := errors.New("fixture resource cleanup could not be confirmed")
	finish(failure)
	finish(nil)
	if err := awaitAgentOwner(t, f); !errors.Is(err, failure) {
		t.Fatalf("unknown cleanup was hidden: %v", err)
	}
	var descriptor agentOwnerDescriptor
	if err := readJSON(filepath.Join(f.directory, "owner.json"), &descriptor); err != nil || descriptor.State != "cleanup-unknown" {
		t.Fatal("uncertain ownership evidence removed", err)
	}
	if err := serveAgentOwner(context.Background(), f.directory, f.project, time.Second, nil); err == nil || !strings.Contains(err.Error(), "cleanup is unknown") {
		t.Fatal("replaced unresolved prior ownership", err)
	}
}
func TestAgentOwnerActiveOperationSurvivesIdleAndJoinsChildCleanup(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	result := make(chan processResult, 1)
	processError := make(chan error, 1)
	armed := filepath.Join(t.TempDir(), "armed.json")
	program := `const fs=require('node:fs');const child=require('node:child_process').spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('armed');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});process.on('SIGTERM',()=>{});child.stdout.once('data',()=>fs.writeFileSync(process.argv[1],JSON.stringify([process.pid,child.pid])));child.stdout.resume();setInterval(()=>{},1000);`
	f := startAgentOwnerFixture(t, 300*time.Millisecond, func(ctx context.Context, owner *agentOwner, request agentOwnerRequest) (any, *cliError) {
		operation, finish, err := owner.admit()
		if err != nil {
			return nil, executionFailure(err)
		}
		go func() {
			value, err := runProcess(operation, []string{node, "-e", program, armed}, owner.descriptor.Project, nil)
			processError <- err
			result <- value
			// This is teardown evidence, not the engine's user-facing failure state.
			finish(err)
		}()
		return map[string]bool{"admitted": true}, nil
	})
	agentOwnerRPC(t, f.descriptor, `{"method":"work.start"}`, nil)
	deadline := time.Now().Add(4 * time.Second)
	for !pathExists(armed) && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if !pathExists(armed) {
		t.Fatal("owned resistant descendant never armed")
	}
	time.Sleep(900 * time.Millisecond) // More than two idle intervals, without pings.
	if code, _ := agentOwnerRPC(t, f.descriptor, `{"method":"host.ping"}`, nil); code != 200 {
		t.Fatal("active operation retired by idle timeout")
	}
	agentOwnerRPC(t, f.descriptor, `{"method":"host.shutdown"}`, nil)
	if err := awaitAgentOwner(t, f); err != nil {
		t.Fatal(err)
	}
	if err := <-processError; err != nil {
		t.Fatal(err)
	}
	if value := <-result; !value.Cancelled {
		t.Fatal("owner shutdown did not await managed cancellation")
	}
	bytes, err := os.ReadFile(armed)
	if err != nil {
		t.Fatal(err)
	}
	var pids []int
	if json.Unmarshal(bytes, &pids) != nil || len(pids) != 2 {
		t.Fatal("missing owned PID evidence")
	}
	check := `let alive=JSON.parse(process.argv[1]).map(pid=>{try{process.kill(pid,0);return true}catch(e){return e.code==='EPERM'}});process.stdout.write(JSON.stringify(alive));`
	output, err := runProcess(context.Background(), []string{node, "-e", check, string(bytes)}, f.project, nil)
	if err != nil || output.ExitCode != 0 || output.Stdout != "[false,false]" {
		t.Fatalf("owned descendants survived cleanup: %s, %v", output.Stdout, err)
	}
}
func TestAgentOwnerRejectsProjectCacheBeforeWriting(t *testing.T) {
	project := t.TempDir()
	cache := filepath.Join(project, "not-created")
	if err := serveAgentOwner(context.Background(), cache, project, time.Second, nil); err == nil {
		t.Fatal("accepted in-project owner cache")
	}
	if pathExists(cache) {
		t.Fatal("rejected cache left project side effects")
	}
}

func TestAgentOwnerClosesAdmissionBeforeShutdown(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	owner := &agentOwner{ctx: ctx, cancel: cancel, touched: time.Now()}
	var clients sync.WaitGroup
	start := make(chan struct{})
	for i := 0; i < 64; i++ {
		clients.Add(1)
		go func() {
			defer clients.Done()
			<-start
			if _, finish, err := owner.admit(); err == nil {
				defer finish(nil)
				time.Sleep(time.Millisecond)
			}
		}()
	}
	close(start)
	owner.stop()
	owner.operations.Wait()
	clients.Wait()
	if _, _, err := owner.admit(); err == nil {
		t.Fatal("new operation admitted after shutdown barrier")
	}
	owner.mu.Lock()
	defer owner.mu.Unlock()
	if owner.active != 0 {
		t.Fatal("completed admissions retained ownership")
	}
}

func TestAgentOwnerDoesNotReplaceUnconfirmedCrashEvidence(t *testing.T) {
	directory, err := privateDirectory(t.TempDir(), "stale-owner-")
	if err != nil {
		t.Fatal(err)
	}
	project, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		t.Fatal(err)
	}
	descriptor := agentOwnerDescriptor{Protocol: "octane-agent-owner", Version: 1, Generation: identity(), Token: identity() + identity(), Project: project, Address: "http://127.0.0.1:1/rpc", PID: int(os.Getpid()), State: "running"}
	if err = writeAgentOwnerDescriptor(root, descriptor); err != nil {
		t.Fatal(err)
	}
	root.Close()
	before, err := os.ReadFile(filepath.Join(directory, "owner.json"))
	if err != nil {
		t.Fatal(err)
	}
	if err = serveAgentOwner(context.Background(), directory, project, time.Second, nil); err == nil || !strings.Contains(err.Error(), "without confirmed cleanup") {
		t.Fatal("dead lease used as cleanup authority", err)
	}
	after, err := os.ReadFile(filepath.Join(directory, "owner.json"))
	if err != nil || string(before) != string(after) {
		t.Fatal("crash evidence was replaced", err)
	}
}
