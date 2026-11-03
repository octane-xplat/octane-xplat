package main

import (
	"context"
	"crypto/sha256"
	"fmt"
	"path/filepath"
	"slices"
	"strings"
)

const releaseRepository = "https://github.com/octane-xplat/octane-xplat"

type docsPackage struct {
	Name        string  `json:"name"`
	Version     string  `json:"version"`
	Kind        string  `json:"kind"`
	InstallPath *string `json:"installPath"`
	Source      string  `json:"source"`
}
type docsInstallation struct {
	Packages      []docsPackage `json:"packages"`
	Discrepancies []string      `json:"discrepancies"`
	Fingerprint   string        `json:"fingerprint"`
}

func releaseMapping(name, version, repository string) map[string]string {
	if !mappedPackage(name) {
		return nil
	}
	if repository == "" {
		repository = releaseRepository
	}
	directory, tag := "packages/"+strings.TrimPrefix(name, "@octane-xplat/"), "v"+version
	if name == "create-octane-xplat" {
		directory = "packages/create"
	}
	if name == "tsrx-typegen" {
		directory = "packages/tsrx-typegen"
		tag = "tsrx-typegen-v" + version
	}
	return map[string]string{"repo": repository, "dir": directory, "tag": tag}
}

func resolveDocsInstallation(ctx context.Context, workspace, app string) (docsInstallation, error) {
	result := docsInstallation{Packages: []docsPackage{}, Discrepancies: []string{}}
	manifest, err := projectManifest(app)
	if err != nil {
		return result, err
	}
	specs := dependencies(manifest)
	for name, value := range object(manifest["peerDependencies"]) {
		specs[name] = value
	}
	actual := map[string]installedPackage{}
	names := []string{}
	for _, entry := range installedPackages(app) {
		actual[entry.Name] = entry
		names = append(names, entry.Name)
	}
	for name := range specs {
		if mappedPackage(name) && !slices.Contains(names, name) {
			names = append(names, name)
		}
	}
	slices.Sort(names)
	locked, err := frameworkLockVersions(ctx, workspace, app, names, specs)
	if err != nil {
		return result, err
	}
	versions := map[string]string{}
	for _, entry := range locked {
		if version, ok := entry.Version.(string); ok && version != "" {
			if at := strings.IndexAny(version, "(@"); at >= 0 {
				version = version[:at]
			}
			versions[entry.Name] = version
		}
	}
	lines := []string{}
	for _, name := range names {
		entry, installed := actual[name]
		pkg := docsPackage{Name: name, Version: versions[name], Kind: "registry", Source: "lockfile-provisional"}
		if linkedPackageSpec(app, stringValue(specs[name])) {
			pkg.Kind = "linked"
		}
		if installed {
			path := entry.Root
			pkg.Version, pkg.Kind, pkg.InstallPath, pkg.Source = entry.Version, entry.Kind, &path, "installed"
			if versions[name] != "" && versions[name] != entry.Version {
				result.Discrepancies = append(result.Discrepancies, fmt.Sprintf("%s: lockfile records %s but %s is installed; using the installation", name, versions[name], entry.Version))
			}
		}
		if pkg.Version == "" {
			continue
		}
		result.Packages = append(result.Packages, pkg)
		lines = append(lines, pkg.Name+"@"+pkg.Version+":"+pkg.Kind)
	}
	hash := sha256.Sum256([]byte(strings.Join(lines, "\n")))
	result.Fingerprint = fmt.Sprintf("%x", hash)
	return result, nil
}

func developmentDocsRoot(path string) string {
	root, err := canonical(path)
	if err != nil {
		return ""
	}
	for count := 0; count < 8; count++ {
		if pathExists(filepath.Join(root, "bun.lock")) || pathExists(filepath.Join(root, "pnpm-workspace.yaml")) || pathExists(filepath.Join(root, ".git")) {
			if directoryExists(filepath.Join(root, "docs")) {
				return root
			}
			return ""
		}
		parent := filepath.Dir(root)
		if parent == root {
			break
		}
		root = parent
	}
	return ""
}

func (workspace *workspaceContext) docsSelection() (*appIdentity, *cliError) {
	selection := workspace.selection()
	if selection.State != "bound" {
		code := "invalid_selection"
		if selection.State == "ambiguous" {
			code = "ambiguous_selection"
		}
		return nil, &cliError{Code: code, Message: "Bind an app before retrieving docs.", Recovery: map[string]string{"action": "Bind an app first with `xplat app select`."}}
	}
	return selection.App, nil
}
