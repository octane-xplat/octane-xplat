package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"sync"
	"time"
)

// This protocol is separate from the retained primitive host. Persistent clients
// bind a generation and token, never a stored PID. The public session services
// will share this transport; this alone does not register their command handlers.
type agentOwnerDescriptor struct {
	Protocol   string `json:"protocol"`
	Version    int    `json:"version"`
	Generation string `json:"generation"`
	Token      string `json:"token"`
	Project    string `json:"project"`
	Address    string `json:"address"`
	PID        int    `json:"pid"`
	State      string `json:"state"`
	Detail     string `json:"detail,omitempty"`
}
type agentOwnerRequest struct {
	Method string         `json:"method"`
	Params map[string]any `json:"params"`
}
type agentOwnerDispatch func(context.Context, *agentOwner, agentOwnerRequest) (any, *cliError)
type agentOwner struct {
	mu                   sync.Mutex
	ctx                  context.Context
	cancel               context.CancelFunc
	closing              bool
	active, requests     int
	touched              time.Time
	operations, handlers sync.WaitGroup
	cleanupErr           error
	descriptor           agentOwnerDescriptor
}

// Register ownership BEFORE starting an operation, and finish only after awaiting
// its process/observer/resource cleanup. Client disconnects do not cancel it.
func (owner *agentOwner) admit() (context.Context, func(error), error) {
	owner.mu.Lock()
	defer owner.mu.Unlock()
	if owner.closing || owner.ctx.Err() != nil {
		return nil, nil, errors.New("native owner is stopping")
	}
	owner.active++
	owner.operations.Add(1)
	owner.touched = time.Now()
	var once sync.Once
	return owner.ctx, func(cleanup error) {
		once.Do(func() {
			owner.mu.Lock()
			owner.active--
			owner.cleanupErr = errors.Join(owner.cleanupErr, cleanup)
			owner.touched = time.Now()
			owner.mu.Unlock()
			owner.operations.Done()
		})
	}, nil
}
func (owner *agentOwner) stop() {
	owner.mu.Lock()
	owner.closing = true
	owner.mu.Unlock()
	owner.cancel()
}
func (owner *agentOwner) enter() bool {
	owner.mu.Lock()
	defer owner.mu.Unlock()
	if owner.closing || owner.ctx.Err() != nil {
		return false
	}
	owner.requests++
	owner.touched = time.Now()
	owner.handlers.Add(1)
	return true
}
func (owner *agentOwner) leave() {
	owner.mu.Lock()
	owner.requests--
	owner.touched = time.Now()
	owner.mu.Unlock()
	owner.handlers.Done()
}
func (owner *agentOwner) retireIdle(idle time.Duration) bool {
	owner.mu.Lock()
	defer owner.mu.Unlock()
	if owner.closing || owner.active != 0 || owner.requests != 0 || time.Since(owner.touched) < idle {
		return false
	}
	owner.closing = true
	owner.cancel()
	return true
}
func writeAgentOwnerDescriptor(root *os.Root, descriptor agentOwnerDescriptor) error {
	data, err := json.Marshal(descriptor)
	if err != nil || len(data) > 64<<10 {
		return errors.New("invalid native owner descriptor size")
	}
	name := "owner-" + identity() + ".tmp"
	file, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer root.Remove(name)
	n, writeErr := file.Write(data)
	closeErr := file.Close()
	if writeErr != nil || closeErr != nil {
		return errors.Join(writeErr, closeErr)
	}
	if n != len(data) {
		return io.ErrShortWrite
	}
	return root.Rename(name, "owner.json")
}

// The lifetime lock spans descriptor publication, all operations and teardown.
// Idle retirement is distinct from an operation deadline. Keep the stable cache
// directory/lock identity after exit; never unlink a lock another client can open.
func serveAgentOwner(parent context.Context, directory, project string, idle time.Duration, dispatch agentOwnerDispatch) (failure error) {
	if idle <= 0 {
		return errors.New("native owner idle interval must be positive")
	}
	project, err := canonical(project)
	if err != nil {
		return err
	}
	directory, err = prospectiveHistoryPath(directory)
	if err != nil {
		return err
	}
	if inside(project, directory) {
		return errors.New("native owner cache must be outside the project")
	}
	if err = preparePrivateCache(directory); err != nil {
		return err
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		return err
	}
	defer root.Close()
	release, err := lockCache(parent, root, "owner.lock")
	if err != nil {
		return err
	}
	defer release()
	if data, readErr := historyFile(root, "owner.json", 64<<10); readErr == nil {
		var previous agentOwnerDescriptor
		if json.Unmarshal(data, &previous) != nil || previous.Protocol != "octane-agent-owner" || previous.Version != 1 || previous.Project != project {
			return errors.New("native owner cache contains an invalid or mismatched descriptor")
		}
		if previous.State == "cleanup-unknown" {
			return errors.New("previous native owner cleanup is unknown; inspect retained resources before replacing it")
		}
		// A released lease after a crash proves only that its holder exited. The
		// holder may have left live POSIX groups or attached-resource observers.
		return errors.New("previous native owner stopped without confirmed cleanup; inspect retained resources before replacing it")
	} else if !os.IsNotExist(readErr) {
		return readErr
	}
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		return err
	}
	defer listener.Close()
	ctx, cancel := context.WithCancel(parent)
	defer cancel()
	owner := &agentOwner{ctx: ctx, cancel: cancel, touched: time.Now(), descriptor: agentOwnerDescriptor{
		Protocol: "octane-agent-owner", Version: 1, Generation: identity(), Token: identity() + identity(),
		Project: project, Address: "http://" + listener.Addr().String() + "/rpc", PID: os.Getpid(), State: "running",
	}}
	server := &http.Server{ReadHeaderTimeout: 2 * time.Second, ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 5 * time.Second}
	server.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// No browser-origin RPC, redirects or public unauthenticated health endpoint.
		if r.Method != "POST" || r.URL.Path != "/rpc" || r.URL.RawQuery != "" || r.Header.Get("Origin") != "" ||
			subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+owner.descriptor.Token)) != 1 ||
			subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Octane-Owner")), []byte(owner.descriptor.Generation)) != 1 {
			http.Error(w, "native owner authentication rejected", http.StatusForbidden)
			return
		}
		if !owner.enter() {
			http.Error(w, "native owner is stopping", http.StatusServiceUnavailable)
			return
		}
		defer owner.leave()
		decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
		decoder.DisallowUnknownFields()
		var request agentOwnerRequest
		if err := decoder.Decode(&request); err != nil {
			http.Error(w, "invalid native owner request", 400)
			return
		}
		var trailing any
		if decoder.Decode(&trailing) != io.EOF {
			http.Error(w, "native owner accepts one request", 400)
			return
		}
		var value any
		var failure *cliError
		stop := false
		switch request.Method {
		case "host.ping":
			value = map[string]any{"generation": owner.descriptor.Generation, "project": project, "implementation": "go", "protocolVersion": 1}
		case "host.shutdown":
			value = map[string]bool{"stopping": true}
			stop = true
		default:
			if dispatch == nil {
				failure = invalid("Unknown native owner operation.")
			} else {
				value, failure = dispatch(owner.ctx, owner, request)
			}
		}
		response := map[string]any{"ok": failure == nil, "generation": owner.descriptor.Generation}
		if failure != nil {
			response["error"] = failure
		} else {
			response["data"] = value
		}
		bytes, err := json.Marshal(response)
		if err != nil || len(bytes) > 16<<20 {
			http.Error(w, "native owner response exceeds bound", 500)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(bytes)
		if stop {
			owner.stop()
		}
	})
	if err = writeAgentOwnerDescriptor(root, owner.descriptor); err != nil {
		return err
	}
	defer func() {
		if owner.cleanupErr != nil {
			owner.descriptor.State = "cleanup-unknown"
			owner.descriptor.Detail = "Native operation cleanup could not be confirmed; inspect retained resources before replacing this owner."
			failure = errors.Join(failure, owner.cleanupErr, writeAgentOwnerDescriptor(root, owner.descriptor))
		} else {
			failure = errors.Join(failure, root.Remove("owner.json"))
		}
	}()
	finished := make(chan error, 1)
	go func() { finished <- server.Serve(listener) }()
	interval := min(idle/4, 250*time.Millisecond)
	if interval < time.Millisecond {
		interval = time.Millisecond
	}
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	running := true
	for running {
		select {
		case <-ctx.Done():
			running = false
		case err = <-finished:
			if !errors.Is(err, http.ErrServerClosed) {
				failure = err
			}
			running = false
		case <-ticker.C:
			if owner.retireIdle(idle) {
				running = false
			}
		}
	}
	owner.stop() // Closes admission before any WaitGroup wait, under the same lock.
	shutdown, done := context.WithTimeout(context.Background(), 3*time.Second)
	err = server.Shutdown(shutdown)
	done()
	if err != nil {
		server.Close()
		failure = errors.Join(failure, fmt.Errorf("native owner HTTP shutdown: %w", err))
	}
	owner.handlers.Wait()
	owner.operations.Wait()
	return failure
}
