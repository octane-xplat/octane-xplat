package project

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"path/filepath"
	"strings"
)

// A package bin is data, not a PATH/global fallback or permission to download.
// Stop at a nearer broken install just as worker lookup does.
func InstalledTool(project, name, bin string) (string, error) {
	entry, err := InstalledProjectEntry(project, name, "bin", bin)
	if err != nil {
		return "", fmt.Errorf("install or reinstall the project's %s tool (bun add --dev %s): %w", name, name, err)
	}
	return entry, nil
}

func InstalledProjectEntry(project, name, field, key string) (string, error) {
	if !validPackageName(name) || key == "" {
		return "", errors.New("invalid project tool selection")
	}
	root, err := installedPackageRoot(project, name)
	if err != nil {
		return "", err
	}
	umbrella, err := umbrellaPackageRoot(project, name)
	if err != nil {
		return "", err
	}
	// NativeScript may hoist its own older compiler into the app. Only an
	// authored app dependency overrides the toolchain's declared compiler.
	_, declared := Dependencies(cli.JsonObject(filepath.Join(project, "package.json")))[name]
	if root == "" || (umbrella != "" && !declared) {
		root = umbrella
	}
	if root == "" {
		return "", fmt.Errorf("install the selected project tool (bun add --dev %s); missing %s", name, name)
	}
	return installedPackageEntry(root, name, field, key)
}

// Node-style ascending package lookup returning the canonical package
// directory, or "" when no ancestor node_modules links it.
func installedPackageRoot(project, name string) (string, error) {
	for at := project; ; at = filepath.Dir(at) {
		candidate := filepath.Join(at, "node_modules", filepath.FromSlash(name))
		if _, err := os.Lstat(candidate); err == nil {
			return osfs.Canonical(candidate)
		} else if !os.IsNotExist(err) {
			return "", err
		}
		if at == filepath.Dir(at) {
			break
		}
	}
	return "", nil
}

// Resolve a tool the project does not link directly through the installed
// octane-xplat umbrella's declared dependency, mirroring
// installedToolPackageRoot in packages/cli/src/package-root.ts.
func umbrellaPackageRoot(project, name string) (string, error) {
	umbrella, err := installedPackageRoot(project, "octane-xplat")
	if err != nil || umbrella == "" {
		return "", err
	}
	data, err := osfs.MetadataBytes(filepath.Join(umbrella, "package.json"), 1<<20)
	if err != nil {
		return "", err
	}
	var manifest struct {
		Dependencies map[string]string `json:"dependencies"`
	}
	if err := json.Unmarshal(data, &manifest); err != nil || manifest.Dependencies[name] == "" {
		return "", err
	}
	return installedPackageRoot(umbrella, name)
}

// Validate an installed package root and resolve its bin/exports entry,
// keeping the canonical-path and inside-package checks.
func installedPackageEntry(root, name, field, key string) (string, error) {
	manifestPath := filepath.Join(root, "package.json")
	info, err := os.Stat(manifestPath)
	if err != nil || !info.Mode().IsRegular() {
		return "", fmt.Errorf("reinstall the selected project's %s: tool manifest must be a regular file", name)
	}
	data, err := osfs.MetadataBytes(manifestPath, 1<<20)
	if err != nil {
		return "", fmt.Errorf("reinstall the selected project's %s: %w", name, err)
	}
	var manifest struct {
		Name    string
		Bin     map[string]string
		Exports map[string]json.RawMessage
	}
	if json.Unmarshal(data, &manifest) != nil || manifest.Name != name {
		return "", fmt.Errorf("invalid selected-project %s tool manifest", name)
	}
	entry := manifest.Bin[key]
	if field == "exports" {
		entry = ""
		if json.Unmarshal(manifest.Exports[key], &entry) != nil {
			return "", fmt.Errorf("%s must declare a string %s export", name, key)
		}
	}
	if !filepath.IsLocal(filepath.FromSlash(entry)) || strings.ContainsRune(entry, 0) || (field == "exports" && !strings.HasPrefix(entry, "./")) {
		return "", fmt.Errorf("%s must declare a relative %s executable", name, key)
	}
	file, err := osfs.Canonical(filepath.Join(root, filepath.FromSlash(entry)))
	if err != nil || !osfs.Inside(root, file) {
		return "", fmt.Errorf("%s executable must remain inside its installed package", key)
	}
	info, err = os.Stat(file)
	if err != nil || !info.Mode().IsRegular() {
		return "", fmt.Errorf("%s executable must be a regular file", key)
	}
	return file, nil
}
