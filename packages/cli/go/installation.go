package main

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
)

func directoryExists(path string) bool { info, err := os.Stat(path); return err == nil && info.IsDir() }

func mappedPackage(name string) bool {
	if name == "tsrx-typegen" || name == "create-octane-xplat" {
		return true
	}
	return strings.HasPrefix(name, "@octane-xplat/") && validPackageName(name)
}
func validPackageName(name string) bool {
	if strings.ContainsAny(name, "\\\x00:") {
		return false
	}
	parts := strings.Split(name, "/")
	if len(parts) != 1 && (len(parts) != 2 || !strings.HasPrefix(parts[0], "@")) {
		return false
	}
	for _, part := range parts {
		if part == "" || part == "." || part == ".." {
			return false
		}
	}
	return true
}

// Installed sources include hoisted packages, not only direct declarations.
// Follow pnpm links, but label actual checkout content as development source.
type installedPackage struct{ Name, Version, Kind, Root string }

func installedPackages(app string) []installedPackage {
	candidates := map[string]bool{"tsrx-typegen": true, "create-octane-xplat": true}
	pkg := jsonObject(filepath.Join(app, "package.json"))
	specs := dependencies(pkg)
	for name, value := range object(pkg["peerDependencies"]) {
		specs[name] = value
	}
	for name := range specs {
		if mappedPackage(name) {
			candidates[name] = true
		}
	}
	for at := app; ; at = filepath.Dir(at) {
		entries, _ := os.ReadDir(filepath.Join(at, "node_modules/@octane-xplat"))
		for _, entry := range entries {
			if !strings.HasPrefix(entry.Name(), ".") {
				candidates["@octane-xplat/"+entry.Name()] = true
			}
		}
		if at == filepath.Dir(at) {
			break
		}
	}
	names := []string{}
	for name := range candidates {
		names = append(names, name)
	}
	slices.Sort(names)
	result := []installedPackage{}
	for _, name := range names {
		if !mappedPackage(name) {
			continue
		}
		root := installedRoot(app, name)
		if root == "" {
			continue
		}
		manifest := jsonObject(filepath.Join(root, "package.json"))
		version := stringValue(manifest["version"])
		if version == "" || manifest["name"] != name {
			continue
		}
		kind := "registry"
		parts := strings.Split(filepath.ToSlash(root), "/")
		if !slices.Contains(parts, "node_modules") || linkedPackageSpec(app, stringValue(specs[name])) {
			kind = "linked"
		}

		result = append(result, installedPackage{Name: name, Version: version, Kind: kind, Root: root})
	}
	return result
}

func linkedPackageSpec(root, spec string) bool {
	if strings.HasPrefix(spec, "workspace:") || strings.HasPrefix(spec, "link:") || strings.HasPrefix(spec, "portal:") {
		return true
	}
	if file, ok := strings.CutPrefix(spec, "file:"); ok {
		if pathExists(resolveFrom(root, file)) {
			return directoryExists(resolveFrom(root, file))
		}
		file = strings.ToLower(file)
		return !strings.HasSuffix(file, ".tgz") && !strings.HasSuffix(file, ".tar.gz") && !strings.HasSuffix(file, ".tar")
	}
	return false
}
