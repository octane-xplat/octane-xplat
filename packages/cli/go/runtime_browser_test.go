package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/coder/websocket"
)

func TestRuntimeBrowserCloseUsesBoundedLocalProtocol(t *testing.T) {
	t.Setenv("HTTP_PROXY", "http://127.0.0.1:1")
	received := make(chan string, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		connection, err := websocket.Accept(w, r, nil)
		if err != nil {
			return
		}
		defer connection.CloseNow()
		connection.SetReadLimit(4096)
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		_, data, err := connection.Read(ctx)
		if err != nil {
			return
		}
		received <- string(data)
		_ = connection.Write(ctx, websocket.MessageText, []byte(`{"id":1,"result":{}}`))
	}))
	defer server.Close()
	endpoint := strings.Replace(server.URL, "http:", "ws:", 1) + "/devtools/browser/owned"
	if err := requestRuntimeBrowserClose(endpoint); err != nil {
		t.Fatal(err)
	}
	select {
	case data := <-received:
		if data != `{"id":1,"method":"Browser.close"}` {
			t.Fatal("unexpected browser operation", data)
		}
	case <-time.After(time.Second):
		t.Fatal("owned endpoint received no close request")
	}
}

func TestRuntimeBrowserCloseRejectsForeignEndpointsAndRedirects(t *testing.T) {
	for _, endpoint := range []string{"ws://example.com:80/devtools/browser/id", "ws://localhost:80/devtools/browser/id", "ws://127.0.0.1/devtools/browser/id", "ws://127.0.0.1:1/devtools/browser/id?other", "ws://user@127.0.0.1:1/devtools/browser/id", "ws://127.0.0.1:1/other"} {
		if err := requestRuntimeBrowserClose(endpoint); err == nil {
			t.Fatal("untrusted browser endpoint accepted", endpoint)
		}
	}
	var reached atomic.Bool
	foreign := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { reached.Store(true) }))
	defer foreign.Close()
	redirect := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, foreign.URL, http.StatusTemporaryRedirect)
	}))
	defer redirect.Close()
	endpoint := strings.Replace(redirect.URL, "http:", "ws:", 1) + "/devtools/browser/owned"
	if err := requestRuntimeBrowserClose(endpoint); err == nil || reached.Load() {
		t.Fatal("owned browser request followed a redirect", err)
	}
}

func TestRuntimeBrowserCloseDoesNotAcceptRejectedCommand(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		connection, err := websocket.Accept(w, r, nil)
		if err != nil {
			return
		}
		defer connection.CloseNow()
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		defer cancel()
		if _, _, err = connection.Read(ctx); err == nil {
			_ = connection.Write(ctx, websocket.MessageText, []byte(`{"id":1,"error":{"code":-32601}}`))
		}
	}))
	defer server.Close()
	endpoint := strings.Replace(server.URL, "http:", "ws:", 1) + "/devtools/browser/owned"
	if err := requestRuntimeBrowserClose(endpoint); err == nil {
		t.Fatal("a rejected Browser.close was treated as a successful request")
	}
}
