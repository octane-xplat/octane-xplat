package dev

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func devtoolsBase(server *devServer) string {
	return strings.TrimSuffix(server.record.Endpoint, "/rpc")
}

func installDevtoolsPackage(t *testing.T, app string) {
	t.Helper()
	pkg := filepath.Join(app, "node_modules", "@octane-xplat", "devtools")
	for _, dir := range []string{filepath.Join("dist", "panel", "assets")} {
		if err := os.MkdirAll(filepath.Join(pkg, dir), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	files := map[string]string{
		"package.json":                  `{"name":"@octane-xplat/devtools","version":"0.0.0"}`,
		"dist/panel/index.html":         `<!doctype html><title>devtools</title><script type="module" src="./assets/panel.js"></script>`,
		"dist/panel/assets/panel.js":    `import { connectDevtools } from './client.js'`,
		"dist/panel/assets/client.js":   `export const connectDevtools = true`,
	}
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(pkg, name), []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
}

func devtoolsGet(t *testing.T, url string) (int, string, http.Header) {
	t.Helper()
	response, err := http.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatal(err)
	}
	return response.StatusCode, string(body), response.Header
}

func TestDevtoolsAppServesInstalledPackage(t *testing.T) {
	server, _, app := devServerFixture(t, nil)
	installDevtoolsPackage(t, app)
	base := devtoolsBase(server)

	status, body, _ := devtoolsGet(t, base+"/devtools/app/")
	if status != http.StatusOK || !strings.Contains(body, "devtools") {
		t.Fatalf("panel index missing: %d %q", status, body)
	}

	status, body, header := devtoolsGet(t, base+"/devtools/app/assets/panel.js")
	if status != http.StatusOK || !strings.Contains(body, "connectDevtools") ||
		header.Get("X-Content-Type-Options") != "nosniff" {
		t.Fatalf("panel script missing: %d %v", status, header)
	}

	// Traversal stays inside the package's dist/panel root — a cleaned path
	// outside the section is a containment 404, never a leak.
	if status, _, _ := devtoolsGet(t, base+"/devtools/app/../client.js"); status != http.StatusNotFound {
		t.Fatalf("cross-section read escaped the panel root: %d", status)
	}

	if status, _, _ := devtoolsGet(t, base+"/devtools/app/../../secret"); status != http.StatusNotFound {
		t.Fatalf("traversal escaped the package: %d", status)
	}
}

func TestDevtoolsAppMissingPackageReportsInstallHint(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	base := devtoolsBase(server)

	status, body, _ := devtoolsGet(t, base+"/devtools/app/")
	if status != http.StatusNotFound || !strings.Contains(body, "@octane-xplat/devtools") {
		t.Fatalf("missing package did not name the install: %d %q", status, body)
	}
}

func TestDevtoolsServersListsLiveRecordsWithoutRpcToken(t *testing.T) {
	server, _, _ := devServerFixture(t, nil)
	base := devtoolsBase(server)

	status, body, _ := devtoolsGet(t, base+"/devtools/servers")
	if status != http.StatusOK {
		t.Fatalf("servers list failed: %d", status)
	}

	var reply struct {
		Servers []devtoolsListedServer `json:"servers"`
	}
	if json.Unmarshal([]byte(body), &reply) != nil {
		t.Fatalf("invalid servers payload: %q", body)
	}

	if strings.Contains(body, server.record.Token) {
		t.Fatal("servers list disclosed the RPC token")
	}

	var found *devtoolsListedServer
	for i := range reply.Servers {
		if reply.Servers[i].InstanceID == server.record.InstanceID {
			found = &reply.Servers[i]
		}
	}
	if found == nil {
		t.Fatalf("live server record missing from list: %q", body)
	}
	if found.AppRoot != server.record.AppRoot || found.Endpoint != server.record.Endpoint ||
		found.DevtoolsToken != server.record.DevtoolsToken {
		t.Fatalf("listed record lost its identity: %+v", found)
	}
}
