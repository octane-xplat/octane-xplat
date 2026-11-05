package main

import (
	"bytes"
	"context"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"
)

func TestJSONCBoundaries(t *testing.T) {
	for _, text := range []string{`{"a":"https://host/*not comment*/",//comment
"b":[1,2,],}`, `{"quote":"\\\"//", /*yes*/"array":[{},],}`} {
		bytes, err := jsonc([]byte(text))
		if err != nil || !json.Valid(bytes) {
			t.Fatalf("invalid JSONC conversion: %s %v", bytes, err)
		}
	}
	if _, err := jsonc([]byte(`{/*broken`)); err == nil {
		t.Fatal("accepted unterminated comment")
	}
	if json.Valid([]byte(`{"a":1,}`)) {
		t.Fatal("ordinary JSON must stay strict")
	}
}

func TestJSONInputCannotHideAnOversizedTail(t *testing.T) {
	path := filepath.Join(t.TempDir(), "request.json")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = f.WriteString("{}"); err != nil {
		t.Fatal(err)
	}
	// A limited decoder alone would see a complete object followed by valid
	// whitespace and EOF, hiding the second value beyond its byte budget.
	padding := bytes.Repeat([]byte{' '}, 1<<20)
	for remaining := (64 << 20) - 2; remaining > 0; {
		n := min(remaining, len(padding))
		if _, err = f.Write(padding[:n]); err != nil {
			t.Fatal(err)
		}
		remaining -= n
	}
	if _, err = f.WriteString("false"); err != nil {
		t.Fatal(err)
	}
	if err = f.Close(); err != nil {
		t.Fatal(err)
	}
	var value map[string]any
	if err = readJSON(path, &value); err == nil {
		t.Fatal("accepted a valid prefix with an oversized trailing region")
	}
}
func TestLockVersionsAndConflicts(t *testing.T) {
	root := t.TempDir()
	bytes := []byte("lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      '@octane-xplat/ui':\n        version: 0.19.0(peer@1)\n  app:\n    devDependencies:\n      '@octane-xplat/ui':\n        version: 0.18.0\n")
	if err := os.WriteFile(filepath.Join(root, "pnpm-lock.yaml"), bytes, 0600); err != nil {
		t.Fatal(err)
	}
	value, err := lockReport(root)
	if err != nil {
		t.Fatal(err)
	}
	report := value.(map[string]any)
	if !reflect.DeepEqual(report["versions"].(map[string][]string)["@octane-xplat/ui"], []string{"0.18.0", "0.19.0"}) || len(report["warnings"].([]string)) != 1 {
		t.Fatalf("silent version/conflict omission: %#v", value)
	}
	os.Remove(filepath.Join(root, "pnpm-lock.yaml"))
	os.WriteFile(filepath.Join(root, "bun.lock"), []byte(`{"packages":{"a":["@octane-xplat/ui@0.19.0",],"b":["@octane-xplat/ui@0.18.0"]},}`), 0600)
	value, err = lockReport(root)
	if err != nil || len(value.(map[string]any)["warnings"].([]string)) != 1 {
		t.Fatalf("Bun versions missing: %#v %v", value, err)
	}
}
func TestNearestBrokenWorkerDoesNotFallThrough(t *testing.T) {
	root := t.TempDir()
	project := filepath.Join(root, "app")
	os.MkdirAll(filepath.Join(project, "node_modules/@octane-xplat/cli"), 0700)
	pkg := filepath.Join(root, "node_modules/@octane-xplat/cli")
	os.MkdirAll(pkg, 0700)
	os.WriteFile(filepath.Join(pkg, "package.json"), []byte(`{"name":"@octane-xplat/cli","exports":{"./worker":"./worker.mjs"}}`), 0600)
	os.WriteFile(filepath.Join(pkg, "worker.mjs"), nil, 0600)
	if _, err := projectWorker(project); err == nil {
		t.Fatal("a broken selected install must shadow ancestors")
	}
	os.RemoveAll(filepath.Join(project, "node_modules"))
	if _, err := projectWorker(project); err != nil {
		t.Fatal(err)
	}
	os.WriteFile(filepath.Join(pkg, "package.json"), []byte(`{"name":"@octane-xplat/cli","exports":{"./worker":"./../../escape.mjs"}}`), 0600)
	if _, err := projectWorker(project); err == nil {
		t.Fatal("accepted escaping worker")
	}
}
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
