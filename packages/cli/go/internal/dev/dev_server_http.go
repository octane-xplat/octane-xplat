package dev

import (
	"bytes"
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type devServerRequest struct {
	Version int            `json:"version"`
	AppRoot string         `json:"appRoot"`
	Command string         `json:"command"`
	Values  map[string]any `json:"values,omitempty"`
}

type devServerReply struct {
	Protocol   string          `json:"protocol"`
	Version    int             `json:"version"`
	AppRoot    string          `json:"appRoot"`
	InstanceID string          `json:"instanceId"`
	Data       json.RawMessage `json:"data,omitempty"`
	Error      *cli.Error      `json:"error,omitempty"`
}

type devServerDispatch func(context.Context, string, map[string]any) (any, *cli.Error)

type devServerCleanupError struct{ Err error }

func (e *devServerCleanupError) RequiresFailureEvidence() bool { return true }

func (failure *devServerCleanupError) Error() string {
	return "dev server cleanup not confirmed: " + failure.Err.Error()
}
func (failure *devServerCleanupError) Unwrap() error { return failure.Err }

// These are app observation/control requests, not process ownership commands.
// Build/typecheck retain their ordinary explicit foreground entry points.
var devServerCommands = map[string]bool{
	"targets": true, "session attach": true,
	"session list": true, "session status": true, "diagnostics": true,
	"inspect": true, "interact": true,
	"evidence list": true, "evidence retain": true, "evidence delete": true,
	"actions list": true, "actions invoke": true, "actions status": true,
}

type devServer struct {
	ctx            context.Context
	cancel         context.CancelFunc
	record         devServerRecord
	store          *devServerStore
	http           *http.Server
	dispatch       devServerDispatch
	apps           *devAppHub
	actions        *devActions
	inspection     *devInspection
	operationError error
	mu             sync.Mutex
	closing        bool
	handlers       sync.WaitGroup
	stopOnce       sync.Once
	closeOnce      sync.Once
	served         chan struct{}
	finalized      chan struct{}
	serveError     error
	closeError     error
}

// Starting this service is an explicit foreground-dev operation. No client
// lookup or command request calls this constructor or starts an engine.
func startDevServer(parent context.Context, cache, appRoot string, dispatch devServerDispatch) (*devServer, error) {
	if err := parent.Err(); err != nil {
		return nil, err
	}
	store, err := openDevServerStore(cache, appRoot)
	if err != nil {
		return nil, err
	}
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		store.close()
		return nil, err
	}
	ctx, cancel := context.WithCancel(parent)
	server := &devServer{
		ctx: ctx, cancel: cancel, store: store, dispatch: dispatch, apps: newDevAppHub(),
		served: make(chan struct{}), finalized: make(chan struct{}),
		record: devServerRecord{
			Protocol: devServerProtocol, Version: 1, AppRoot: store.app,
			Endpoint:   "http://" + listener.Addr().String() + "/rpc",
			InstanceID: osfs.Identity(), Token: osfs.Identity() + osfs.Identity(), DevtoolsToken: osfs.Identity() + osfs.Identity(),
		},
	}
	server.actions = newDevActions(server)
	server.inspection = newDevInspection(server)
	server.http = &http.Server{
		Handler:           http.HandlerFunc(server.request),
		ReadHeaderTimeout: 2 * time.Second, ReadTimeout: 5 * time.Second,
		WriteTimeout: 20 * time.Second, IdleTimeout: 5 * time.Second,
		MaxHeaderBytes: 16 << 10,
		BaseContext:    func(net.Listener) context.Context { return ctx },
	}
	go func() {
		err := server.http.Serve(listener)
		if !errors.Is(err, http.ErrServerClosed) {
			server.serveError = err
		}
		close(server.served)
		server.stop()
	}()
	if err := ctx.Err(); err != nil {
		server.close()
		return nil, err
	}
	if err := store.publish(server.record); err != nil {
		server.close()
		return nil, err
	}
	if err := ctx.Err(); err != nil {
		server.close()
		return nil, err
	}
	go func() { <-ctx.Done(); server.stop() }()
	return server, nil
}

func (server *devServer) request(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path == "/app" {
		server.appSocket(w, r)
		return
	}
	if r.URL.Path == "/backend" {
		server.backendSocket(w, r)
		return
	}
	if r.URL.Path == "/devtools" {
		server.devtoolsSocket(w, r)
		return
	}
	if r.URL.Path == "/devtools/app" || r.URL.Path == "/devtools/servers" || strings.HasPrefix(r.URL.Path, "/devtools/app/") || strings.HasPrefix(r.URL.Path, "/devtools/dist/") {
		server.devtoolsApp(w, r)
		return
	}
	if r.Method != "POST" || r.URL.Path != "/rpc" || r.URL.RawPath != "" || r.URL.RawQuery != "" || r.URL.ForceQuery ||
		len(r.Header.Values("Origin")) != 0 || len(r.Header.Values("Authorization")) != 1 || len(r.Header.Values("X-Octane-Dev-Instance")) != 1 ||
		subtle.ConstantTimeCompare([]byte(r.Header.Get("Authorization")), []byte("Bearer "+server.record.Token)) != 1 ||
		subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Octane-Dev-Instance")), []byte(server.record.InstanceID)) != 1 {
		http.Error(w, "dev server authentication rejected", http.StatusForbidden)
		return
	}
	server.mu.Lock()
	if server.closing {
		server.mu.Unlock()
		http.Error(w, "dev server is stopping", http.StatusServiceUnavailable)
		return
	}
	server.handlers.Add(1)
	server.mu.Unlock()
	defer server.handlers.Done()
	var request devServerRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&request) != nil || decoder.Decode(new(any)) != io.EOF || request.Version != 1 || osfs.FilesystemKey(request.AppRoot) != osfs.FilesystemKey(server.record.AppRoot) {
		http.Error(w, "dev server request does not match this app", http.StatusBadRequest)
		return
	}
	var data any
	var failure *cli.Error
	switch {
	case request.Command == "server.ping":
		data = map[string]any{"implementation": "go", "ownership": "foreground-dev"}
	case !devServerCommands[request.Command]:
		failure = &cli.Error{Code: "unsupported_capability", Message: "This is not an app observation/control command."}
	case server.dispatch == nil:
		failure = &cli.Error{Code: "unavailable", Message: "The dev server has no handler for this app request."}
	default:
		data, failure = server.dispatch(r.Context(), request.Command, request.Values)
	}
	payload, err := json.Marshal(data)
	if err != nil {
		failure = &cli.Error{Code: "execution_failure", Message: "The app response could not be encoded."}
		payload = nil
	}
	reply, err := json.Marshal(devServerReply{Protocol: devServerProtocol, Version: 1, AppRoot: server.record.AppRoot, InstanceID: server.record.InstanceID, Data: payload, Error: failure})
	if err != nil || len(reply) > 4<<20 {
		http.Error(w, "app response exceeds the ordinary request bound", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = w.Write(reply)
}

// Context cancellation stops admission/connections, not the foreground lifetime
// claim. The dev caller finalizes that claim only after its engines are joined.
func (server *devServer) stop() {
	server.stopOnce.Do(func() {
		server.mu.Lock()
		server.closing = true
		server.mu.Unlock()
		server.cancel()
		_ = server.http.Close()
	})
}

func (server *devServer) close() error {
	server.closeOnce.Do(func() {
		server.stop()
		go func() {
			<-server.served
			server.handlers.Wait()
			server.mu.Lock()
			operationError := server.operationError
			server.mu.Unlock()
			if operationError != nil {
				server.closeError = &devServerCleanupError{operationError}
			} else {
				server.closeError = errors.Join(server.serveError, server.store.close())
			}
			close(server.finalized)
		}()
	})
	select {
	case <-server.finalized:
		return server.closeError
	case <-time.After(10 * time.Second):
		return &devServerCleanupError{errors.New("requests are still stopping; the lifetime claim is retained")}
	}
}

func (server *devServer) admit() (context.Context, func(error), error) {
	server.mu.Lock()
	defer server.mu.Unlock()
	if server.closing || server.ctx.Err() != nil || server.operationError != nil {
		return nil, nil, errors.New("dev server is stopping")
	}
	server.handlers.Add(1)
	var once sync.Once
	return server.ctx, func(failure error) {
		once.Do(func() {
			server.mu.Lock()
			server.operationError = errors.Join(server.operationError, failure)
			server.mu.Unlock()
			server.handlers.Done()
		})
	}, nil
}

type devServerClient struct{ record devServerRecord }

func lookupDevServer(ctx context.Context, cache, appRoot string) (*devServerClient, *cli.Error) {
	if err := ctx.Err(); err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	record, failure := lookupDevServerRecord(cache, appRoot)
	if failure != nil {
		return nil, failure
	}
	client := &devServerClient{record: *record}
	if _, failure := client.call(ctx, "server.ping", nil); failure != nil {
		return nil, failure
	}
	return client, nil
}

func (client *devServerClient) call(parent context.Context, command string, values map[string]any) (json.RawMessage, *cli.Error) {
	if err := validateDevServerRecord(client.record, client.record.AppRoot); err != nil {
		return nil, devServerUnavailable("No matching running dev server for this app.")
	}
	body, err := json.Marshal(devServerRequest{Version: 1, AppRoot: client.record.AppRoot, Command: command, Values: values})
	if err != nil || len(body) > 1<<20 {
		return nil, cli.Invalid("Dev server request exceeds its JSON bound.")
	}
	deadline, headers := 10*time.Second, 5*time.Second
	if command == "actions invoke" || command == "diagnostics" {
		deadline, headers = 20*time.Second, 15*time.Second
	}
	ctx, cancel := context.WithTimeout(parent, deadline)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, "POST", client.record.Endpoint, bytes.NewReader(body))
	if err != nil {
		return nil, devServerUnavailable("No usable dev server endpoint for this app.")
	}
	request.Header.Set("Authorization", "Bearer "+client.record.Token)
	request.Header.Set("X-Octane-Dev-Instance", client.record.InstanceID)
	request.Header.Set("Content-Type", "application/json")
	transport := &http.Transport{Proxy: nil, ResponseHeaderTimeout: headers}
	defer transport.CloseIdleConnections()
	httpClient := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	response, err := httpClient.Do(request)
	if err != nil {
		if parent.Err() != nil {
			return nil, cli.ExecutionFailure(parent.Err())
		}
		return nil, devServerUnavailable("No responding dev server for this app; its discovery record may be stale.")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, devServerUnavailable("No matching authenticated dev server for this app.")
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, (4<<20)+1))
	if err != nil || len(data) > 4<<20 {
		if parent.Err() != nil {
			return nil, cli.ExecutionFailure(parent.Err())
		}
		return nil, devServerUnavailable("The dev server returned an invalid response.")
	}
	var reply devServerReply
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&reply) != nil || decoder.Decode(new(any)) != io.EOF || reply.Protocol != devServerProtocol || reply.Version != 1 || reply.InstanceID != client.record.InstanceID || osfs.FilesystemKey(reply.AppRoot) != osfs.FilesystemKey(client.record.AppRoot) {
		return nil, devServerUnavailable("The dev server app or startup instance changed; reconnect before retrying.")
	}
	return reply.Data, reply.Error
}
