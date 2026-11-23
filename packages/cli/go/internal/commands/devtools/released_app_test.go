package devtools

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"testing"
)

func TestInstallReleasedAppVerifiesAndReusesCache(t *testing.T) {
	if runtime.GOOS != "darwin" {
		t.Skip("macOS archive extraction uses ditto")
	}
	var fixture bytes.Buffer
	archive := zip.NewWriter(&fixture)
	entry := &zip.FileHeader{Name: appExecutable}
	entry.SetMode(0755)
	file, err := archive.CreateHeader(entry)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := io.WriteString(file, "#!/bin/sh\nexit 0\n"); err != nil {
		t.Fatal(err)
	}
	if err := archive.Close(); err != nil {
		t.Fatal(err)
	}
	digest := fmt.Sprintf("%x", sha256.Sum256(fixture.Bytes()))
	var requests atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		if requests.Add(1) == 1 {
			_, _ = io.WriteString(w, "invalid archive")
			return
		}
		_, _ = w.Write(fixture.Bytes())
	}))
	t.Cleanup(server.Close)
	ctx, cache := context.Background(), t.TempDir()
	install := func() (string, error) {
		return installReleasedApp(ctx, cache, "1.2.3", digest, server.URL, server.Client(), io.Discard)
	}
	if _, err := install(); err == nil || !strings.Contains(err.Error(), "SHA-256") {
		t.Fatalf("expected archive verification failure, got %v", err)
	}
	if _, err := os.Stat(filepath.Join(cache, "1.2.3-"+digest)); !os.IsNotExist(err) {
		t.Fatalf("failed install published a cache entry: %v", err)
	}
	type result struct {
		path string
		err  error
	}
	results := make(chan result, 2)
	for range 2 {
		go func() {
			path, err := install()
			results <- result{path, err}
		}()
	}
	first, second := <-results, <-results
	if first.err != nil || second.err != nil || first.path == "" || second.path != first.path {
		t.Fatalf("concurrent installs did not converge: %+v / %+v", first, second)
	}
	server.Close()
	cached, err := install()
	if err != nil || cached != first.path || requests.Load() != 2 {
		t.Fatalf("expected offline cache hit: %s, %v (%d requests)", cached, err, requests.Load())
	}
}
