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
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type hostDescriptor struct {
	Version    int    `json:"version"`
	PID        int    `json:"pid"`
	Generation string `json:"generation"`
	Address    string `json:"address"`
	Token      string `json:"token"`
	Project    string `json:"project"`
}
type hostJob struct {
	ID     string        `json:"id"`
	State  string        `json:"state"`
	Result *workerResult `json:"result,omitempty"`
	Error  string        `json:"error,omitempty"`
	cancel context.CancelFunc
	done   chan struct{}
}
type rpcRequest struct {
	Method string
	Params map[string]any
}

func startHost(ctx context.Context, parent, project string) (any, error) {
	if parent == "" {
		return nil, errors.New("host-start requires an existing task-owned --directory parent")
	}
	directory, err := privateDirectory(parent, "xplat-go-host-")
	if err != nil {
		return nil, err
	}
	exe, err := os.Executable()
	if err != nil {
		return nil, err
	}
	cmd := ownerCommand(exe, []string{"host", "--directory", directory, "--project", project, "--timeout", "10m"})
	if err = cmd.Start(); err != nil {
		_ = os.RemoveAll(directory)
		return nil, err
	}
	// Reap an unexpectedly early owner exit while the client is still alive.
	exited := make(chan error, 1)
	go func() { exited <- cmd.Wait() }()
	ticker := time.NewTicker(20 * time.Millisecond)
	defer ticker.Stop()
	for {
		var descriptor hostDescriptor
		if readJSON(filepath.Join(directory, "host.json"), &descriptor) == nil {
			if descriptor.PID != cmd.Process.Pid || descriptor.Project != project {
				return nil, errors.New("owner readiness identity mismatch")
			}
			ping, err := callHost(ctx, directory, "host.ping", nil)
			if err == nil {
				return map[string]any{"directory": directory, "owner": ping}, nil
			}
		}
		select {
		case <-ctx.Done():
			_ = cmd.Process.Kill()
			<-exited
			_ = os.RemoveAll(directory)
			return nil, ctx.Err()
		case err = <-exited:
			_ = os.RemoveAll(directory)
			return nil, fmt.Errorf("owner exited before readiness: %v", err)
		case <-ticker.C:
		}
	}
}

func serveHost(parent context.Context, directory, project string) error {
	ctx, cancel := context.WithCancel(parent)
	defer cancel()
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		return err
	}
	descriptor := hostDescriptor{1, os.Getpid(), identity(), "http://" + listener.Addr().String(), identity() + identity(), project}
	var mutex sync.Mutex
	jobs := map[string]*hostJob{}
	server := &http.Server{ReadHeaderTimeout: 2 * time.Second, ReadTimeout: 5 * time.Second, WriteTimeout: 10 * time.Second, IdleTimeout: 5 * time.Second}
	server.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != "POST" || r.Header.Get("Origin") != "" || subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+descriptor.Token)) != 1 {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var request rpcRequest
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&request); err != nil {
			http.Error(w, "invalid request", 400)
			return
		}
		var value any
		var operationErr error
		switch request.Method {
		case "host.ping":
			value = map[string]any{"pid": descriptor.PID, "generation": descriptor.Generation, "project": project}
		case "host.shutdown":
			value = map[string]bool{"stopping": true}
			defer cancel()
		case "worker.start":
			operation, _ := request.Params["operation"].(string)
			payload, _ := request.Params["payload"].(map[string]any)
			if operation == "" {
				operationErr = errors.New("worker operation is required")
				break
			}
			jobCtx, jobCancel := context.WithTimeout(ctx, 2*time.Minute)
			job := &hostJob{ID: identity(), State: "running", cancel: jobCancel, done: make(chan struct{})}
			mutex.Lock()
			if len(jobs) >= 64 {
				mutex.Unlock()
				jobCancel()
				operationErr = errors.New("prototype job limit reached")
				break
			}
			jobs[job.ID] = job
			mutex.Unlock()
			value = map[string]string{"id": job.ID}
			go func() {
				defer close(job.done)
				defer jobCancel()
				result, err := runWorker(jobCtx, project, operation, payload)
				mutex.Lock()
				defer mutex.Unlock()
				job.Result = &result
				job.State = "succeeded"
				if err != nil {
					job.State = "failed"
					job.Error = err.Error()
				}
				var cleanup *processCleanupError
				if jobCtx.Err() != nil && !errors.As(err, &cleanup) {
					job.State = "cancelled"
				}
			}()
		case "job.status", "job.cancel":
			id, _ := request.Params["id"].(string)
			mutex.Lock()
			job := jobs[id]
			if job == nil {
				operationErr = errors.New("unknown owned job")
			} else {
				if request.Method == "job.cancel" {
					job.cancel()
				}
				snapshot := *job
				value = snapshot
			}
			mutex.Unlock()
		default:
			operationErr = errors.New("unknown RPC method")
		}
		if operationErr != nil {
			_ = json.NewEncoder(w).Encode(map[string]any{"ok": false, "error": operationErr.Error()})
		} else {
			_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "data": value})
		}
	})
	bytes, _ := json.Marshal(descriptor)
	if err = privateFile(filepath.Join(directory, "host.json"), bytes); err != nil {
		listener.Close()
		return err
	}
	defer os.RemoveAll(directory)
	finished := make(chan error, 1)
	go func() { finished <- server.Serve(listener) }()
	select {
	case <-ctx.Done():
	case err = <-finished:
		if !errors.Is(err, http.ErrServerClosed) {
			cancel()
		}
	}
	cancel()
	mutex.Lock()
	pending := []*hostJob{}
	for _, job := range jobs {
		job.cancel()
		pending = append(pending, job)
	}
	mutex.Unlock()
	for _, job := range pending {
		<-job.done
	}
	shutdown, done := context.WithTimeout(context.Background(), 3*time.Second)
	defer done()
	return server.Shutdown(shutdown)
}

func callHost(ctx context.Context, directory, method string, params map[string]any) (any, error) {
	var descriptor hostDescriptor
	if err := readJSON(filepath.Join(directory, "host.json"), &descriptor); err != nil {
		return nil, err
	}
	if descriptor.Version != 1 || !strings.HasPrefix(descriptor.Address, "http://127.0.0.1:") {
		return nil, errors.New("invalid prototype owner descriptor")
	}
	body, err := json.Marshal(rpcRequest{method, params})
	if err != nil {
		return nil, err
	}
	request, err := http.NewRequestWithContext(ctx, "POST", descriptor.Address, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+descriptor.Token)
	transport := &http.Transport{Proxy: nil}
	defer transport.CloseIdleConnections()
	response, err := (&http.Client{Transport: transport}).Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		return nil, errors.New("owner rejected RPC request")
	}
	var envelope struct {
		OK    bool
		Data  json.RawMessage
		Error string
	}
	if err = json.NewDecoder(io.LimitReader(response.Body, 16<<20)).Decode(&envelope); err != nil {
		return nil, err
	}
	if !envelope.OK {
		return nil, errors.New(envelope.Error)
	}
	return envelope.Data, nil
}
