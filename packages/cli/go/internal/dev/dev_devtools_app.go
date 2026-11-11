package dev

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
)

// The dev server also serves the devtools panel itself: `GET /devtools/app/`
// serves the bundled panel (dist/panel/) of the selected project's installed
// @octane-xplat/devtools package, and `GET /devtools/servers`
// enumerates every live dev-server discovery record so the panel picker can
// offer each running `xplat dev` server. Everything is loopback-only GET with
// no CORS headers; the records expose the panel credential the same way the
// user-readable record files do.

var devtoolsAppTypes = map[string]string{
	".html": "text/html; charset=utf-8",
	".js":   "text/javascript; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg":  "image/svg+xml",
	".png":  "image/png",
	".woff2": "font/woff2",
}

type devtoolsListedServer struct {
	Key           string `json:"key"`
	AppRoot       string `json:"appRoot"`
	Endpoint      string `json:"endpoint"`
	InstanceID    string `json:"instanceId"`
	DevtoolsToken string `json:"devtoolsToken"`
}

func (server *devServer) devtoolsApp(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet || r.URL.RawQuery != "" || r.URL.ForceQuery {
		http.Error(w, "invalid devtools request", http.StatusBadRequest)
		return
	}

	w.Header().Set("X-Content-Type-Options", "nosniff")

	switch {
	case r.URL.Path == "/devtools/app":
		http.Redirect(w, r, "/devtools/app/", http.StatusTemporaryRedirect)
	case r.URL.Path == "/devtools/servers":
		server.devtoolsServerList(w)
	case r.URL.Path == "/devtools/app/":
		server.serveDevtoolsFile(w, r, filepath.Join("dist", "panel"), "index.html")
	case strings.HasPrefix(r.URL.Path, "/devtools/app/"):
		server.serveDevtoolsFile(w, r, filepath.Join("dist", "panel"), strings.TrimPrefix(r.URL.Path, "/devtools/app/"))
	default:
		http.NotFound(w, r)
	}
}

// The panel is hosted by the selected project's installed package, never by
// files shipped in the CLI — the version a project develops against is the
// version its devtools panels run.
func (server *devServer) devtoolsPackageRoot() (string, error) {
	candidate := filepath.Join(server.record.AppRoot, "node_modules", "@octane-xplat", "devtools")

	root, err := osfs.Canonical(candidate)
	if err != nil {
		return "", errors.New("@octane-xplat/devtools is not installed in the selected project")
	}

	data, err := os.ReadFile(filepath.Join(root, "package.json"))
	if err != nil || len(data) > 64<<10 {
		return "", errors.New("@octane-xplat/devtools is not installed in the selected project")
	}

	var manifest struct {
		Name string `json:"name"`
	}
	if json.Unmarshal(data, &manifest) != nil || manifest.Name != "@octane-xplat/devtools" {
		return "", errors.New("invalid @octane-xplat/devtools installation in the selected project")
	}

	return root, nil
}

func (server *devServer) serveDevtoolsFile(w http.ResponseWriter, r *http.Request, section, rest string) {
	clean := filepath.Clean("/" + rest)
	rel := strings.TrimPrefix(clean, "/")

	if rel == "" || rel == "." || strings.HasPrefix(rel, "..") {
		http.NotFound(w, r)
		return
	}

	pkg, err := server.devtoolsPackageRoot()
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	root, err := os.OpenRoot(filepath.Join(pkg, section))
	if err != nil {
		http.Error(w, "@octane-xplat/devtools has no built panel assets", http.StatusNotFound)
		return
	}
	defer root.Close()

	info, err := root.Stat(rel)
	if err != nil || !info.Mode().IsRegular() || info.Size() > 8<<20 {
		http.NotFound(w, r)
		return
	}

	file, err := root.Open(rel)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()

	kind := devtoolsAppTypes[filepath.Ext(rel)]
	if kind == "" {
		kind = "application/octet-stream"
	}

	w.Header().Set("Content-Type", kind)
	w.Header().Set("Cache-Control", "no-store")
	_, _ = io.Copy(w, io.LimitReader(file, 8<<20))
}

// devtoolsServerList returns every discovery record whose app binding still
// verifies — the same visibility the records' user-readable files have.
func (server *devServer) devtoolsServerList(w http.ResponseWriter) {
	namespace := filepath.Dir(server.store.directory)

	servers := []devtoolsListedServer{}
	entries, err := os.ReadDir(namespace)

	if err == nil {
		for _, entry := range entries {
			if !entry.IsDir() {
				continue
			}
			if listed := listedDevServer(namespace, entry.Name()); listed != nil {
				servers = append(servers, *listed)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(map[string]any{"servers": servers})
}

func listedDevServer(namespace, key string) *devtoolsListedServer {
	root, err := os.OpenRoot(filepath.Join(namespace, key))
	if err != nil {
		return nil
	}
	defer root.Close()

	info, err := root.Lstat("server.json")
	if err != nil || !info.Mode().IsRegular() {
		return nil
	}

	data, err := history.File(root, "server.json", 16<<10)
	if err != nil {
		return nil
	}

	var record devServerRecord
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&record) != nil || decoder.Decode(new(any)) != io.EOF {
		return nil
	}

	// Each record must still bind to the app directory its key was minted for;
	// the RPC token is never disclosed to the panel.
	if record.Protocol != devServerProtocol || record.Version != 1 || !filepath.IsAbs(record.AppRoot) ||
		fmt.Sprintf("%x", sha256.Sum256([]byte(osfs.FilesystemKey(record.AppRoot)))) != key ||
		!devServerInstance.MatchString(record.InstanceID) || !devServerToken.MatchString(record.Token) ||
		!devServerToken.MatchString(record.DevtoolsToken) {
		return nil
	}

	return &devtoolsListedServer{
		Key:           key,
		AppRoot:       record.AppRoot,
		Endpoint:      record.Endpoint,
		InstanceID:    record.InstanceID,
		DevtoolsToken: record.DevtoolsToken,
	}
}
