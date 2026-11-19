package dev

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
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
		"package.json":                `{"name":"@octane-xplat/devtools","version":"0.0.0"}`,
		"dist/panel/index.html":       `<!doctype html><title>devtools</title><script type="module" src="./assets/panel.js"></script>`,
		"dist/panel/assets/panel.js":  `import { connectDevtools } from './client.js'`,
		"dist/panel/assets/client.js": `export const connectDevtools = true`,
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

func TestDevtoolsWebBuildPublishesIsolatedAssetsUntilHubStops(t *testing.T) {
	if _, err := exec.LookPath("node"); err != nil {
		t.Skip("Node project runtime unavailable")
	}
	server, cache, app := devServerFixture(t, nil)
	t.Setenv("XPLAT_DEV_CACHE", cache)
	worker := filepath.Join(app, "node_modules", "@octane-xplat", "cli")
	if err := os.MkdirAll(worker, 0700); err != nil {
		t.Fatal(err)
	}
	for name, body := range map[string]string{
		"package.json": `{"name":"@octane-xplat/cli","exports":{"./worker":"./worker.mjs"}}`,
		"worker.mjs": `import { readFileSync, writeFileSync } from "node:fs";
const req = JSON.parse(readFileSync(process.argv[2]));
if (req.operation !== "devtools-web" || req.project !== process.cwd()) process.exit(1);
writeFileSync(req.outDir + "/index.html", req.id);
writeFileSync(process.argv[3], JSON.stringify({ protocol: req.protocol, version: req.version,
  id: req.id, ok: true, data: { version: 1 }, warnings: [] }));
`,
	} {
		if err := os.WriteFile(filepath.Join(worker, name), []byte(body), 0600); err != nil {
			t.Fatal(err)
		}
	}
	first, err := BuildDevtoolsWeb(t.Context(), app)
	if err != nil {
		t.Fatal(err)
	}
	second, err := BuildDevtoolsWeb(t.Context(), app)
	if err != nil || first == second {
		t.Fatalf("browser builds did not get distinct URLs: %v", err)
	}
	status, firstBody, _ := devtoolsGet(t, first)
	if status != http.StatusOK || !devServerInstance.MatchString(firstBody) {
		t.Fatal("the earlier build was unavailable after rebuilding")
	}
	status, secondBody, _ := devtoolsGet(t, second)
	if status != http.StatusOK || !devServerInstance.MatchString(secondBody) || secondBody == firstBody {
		t.Fatal("the newer build served the earlier build's assets")
	}
	if status, _, _ := devtoolsGet(t, second+"../..%2Fserver.json"); status != http.StatusNotFound {
		t.Fatalf("browser assets escaped their root: %d", status)
	}
	directory := filepath.Join(server.store.directory, server.store.webAssets)
	if err := server.close(); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(directory); !os.IsNotExist(err) {
		t.Fatalf("hub shutdown left its browser builds behind: %v", err)
	}
	if _, err := BuildDevtoolsWeb(t.Context(), app); err == nil {
		t.Fatal("browser compilation started without a running hub")
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
