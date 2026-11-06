package main

import (
	"context"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestNativeHTTPTrustLimitsAndCancellation(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/slow" {
			select {
			case <-r.Context().Done():
			case <-time.After(time.Second):
			}
			return
		}
		w.Write([]byte("hello"))
	}))
	defer server.Close()
	if _, err := fetchHTTP(context.Background(), httpRequest{URL: server.URL}); err == nil {
		t.Fatal("accepted untrusted TLS")
	}
	ca := filepath.Join(t.TempDir(), "ca.pem")
	os.WriteFile(ca, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: server.Certificate().Raw}), 0600)
	if _, err := fetchHTTP(context.Background(), httpRequest{URL: server.URL, CA: ca}); err != nil {
		t.Fatal(err)
	}
	if _, err := fetchHTTP(context.Background(), httpRequest{URL: server.URL, CA: ca, MaxBytes: 3}); err == nil {
		t.Fatal("accepted oversized response")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	if _, err := fetchHTTP(ctx, httpRequest{URL: server.URL + "/slow", CA: ca}); err == nil {
		t.Fatal("cancelled HTTP completed successfully")
	}
}
