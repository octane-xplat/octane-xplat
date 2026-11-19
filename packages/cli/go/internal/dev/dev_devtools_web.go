package dev

import (
	"context"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
)

const devtoolsProjectMount = "/devtools/project/"

func devtoolsWebDirectory(instance string) string { return "web-" + instance }

// BuildDevtoolsWeb attaches to the selected app's existing hub. An immutable
// URL per build keeps open tabs working when another build is published.
func BuildDevtoolsWeb(ctx context.Context, app string) (string, error) {
	cache, err := devServerCacheParent()
	if err != nil {
		return "", err
	}
	client, unavailable := lookupDevServer(ctx, cache, app)
	if unavailable != nil {
		return "", unavailable
	}
	record := client.record
	directory, _, err := devServerDirectory(cache, app)
	if err != nil {
		return "", err
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		return "", err
	}
	defer root.Close()
	web := devtoolsWebDirectory(record.InstanceID)
	id := osfs.Identity()
	staging := filepath.Join(web, "staging-"+id)
	if err := root.Mkdir(staging, 0700); err != nil {
		return "", err
	}
	defer root.RemoveAll(staging)

	worker, err := project.Worker(record.AppRoot)
	if err != nil {
		return "", err
	}
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	if _, err := project.RunWorkerEntry(ctx, record.AppRoot, worker, "devtools-web", map[string]any{
		"outDir": filepath.Join(directory, staging),
	}, os.Stderr, os.Stderr); err != nil {
		return "", err
	}
	index, err := root.Lstat(filepath.Join(staging, "index.html"))
	if err != nil || !index.Mode().IsRegular() || index.Size() == 0 || index.Size() > devtoolsAssetLimit {
		return "", errors.New("DevTools browser build did not produce a usable index.html")
	}
	if current, err := readDevServerRecord(root, record.AppRoot); err != nil || current != record {
		return "", devServerUnavailable("The selected DevTools hub stopped or changed during compilation.")
	}
	if _, unavailable := client.call(ctx, "server.ping", nil); unavailable != nil {
		return "", unavailable
	}
	if err := root.Rename(staging, filepath.Join(web, id)); err != nil {
		return "", err
	}
	return strings.TrimSuffix(record.Endpoint, "/rpc") + devtoolsProjectMount + id + "/", nil
}

func (server *devServer) devtoolsProjectFile(w http.ResponseWriter, r *http.Request) {
	id, asset, ok := strings.Cut(strings.TrimPrefix(r.URL.Path, devtoolsProjectMount), "/")
	if !ok || !devServerInstance.MatchString(id) {
		http.NotFound(w, r)
		return
	}
	root, err := server.store.root.OpenRoot(filepath.Join(devtoolsWebDirectory(server.record.InstanceID), id))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer root.Close()
	if asset == "" {
		asset = "index.html"
	}
	serveDevtoolsAsset(w, r, root, asset)
}
