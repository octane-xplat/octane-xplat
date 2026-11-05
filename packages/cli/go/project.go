package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"go.yaml.in/yaml/v3"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/tailscale/hujson"
)

func inside(root, path string) bool {
	rel, err := filepath.Rel(root, path)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) && !filepath.IsAbs(rel)
}

func discover(project string) (any, error) {
	root, err := canonical(project)
	if err != nil {
		return nil, err
	}
	var manifest map[string]any
	if err = readJSON(filepath.Join(root, "package.json"), &manifest); err != nil {
		return nil, err
	}
	workspace := root
	for current := root; ; current = filepath.Dir(current) {
		var candidate map[string]any
		if readJSON(filepath.Join(current, "package.json"), &candidate) == nil && candidate["workspaces"] != nil {
			workspace = current
			break
		}
		if filepath.Dir(current) == current {
			break
		}
	}
	worker, workerErr := projectWorker(root)
	return map[string]any{"project": root, "workspace": workspace, "name": manifest["name"], "xplat": manifest["xplat"], "worker": worker, "workerAvailable": workerErr == nil}, nil
}

// Node-style ascending package lookup, but never skip a nearer broken install.
func projectWorker(project string) (string, error) {
	for current := project; ; current = filepath.Dir(current) {
		candidate := filepath.Join(current, "node_modules", "@octane-xplat", "cli")
		_, err := os.Lstat(candidate)
		if err == nil {
			root, err := canonical(candidate)
			if err != nil {
				return "", err
			}
			var manifest struct {
				Name    string                     `json:"name"`
				Exports map[string]json.RawMessage `json:"exports"`
			}
			if err = readJSON(filepath.Join(root, "package.json"), &manifest); err != nil {
				return "", fmt.Errorf("reinstall selected project's @octane-xplat/cli: %w", err)
			}
			var entry string
			if manifest.Name != "@octane-xplat/cli" || json.Unmarshal(manifest.Exports["./worker"], &entry) != nil || !strings.HasPrefix(entry, "./") {
				return "", errors.New("selected project's CLI lacks worker v1; update @octane-xplat/cli")
			}
			file, err := canonical(filepath.Join(root, entry))
			if err != nil || !inside(root, file) {
				return "", errors.New("project worker must remain inside its installed package")
			}
			info, err := os.Stat(file)
			if err != nil || !info.Mode().IsRegular() {
				return "", errors.New("project worker must be a regular file")
			}
			return file, nil
		}
		if !os.IsNotExist(err) {
			return "", err
		}
		if filepath.Dir(current) == current {
			break
		}
	}
	return "", errors.New("install @octane-xplat/cli in the selected project to provide worker v1")
}

// JSONC is accepted only for bun.lock. Standardize strips comments and
// trailing commas without altering quoted URLs/comment-like text.
func jsonc(data []byte) ([]byte, error) {
	return hujson.Standardize(data)
}

func lockReport(root string) (any, error) {
	versions := map[string][]string{}
	add := func(name, version string) {
		if name != "" && version != "" {
			for _, v := range versions[name] {
				if v == version {
					return
				}
			}
			versions[name] = append(versions[name], version)
		}
	}
	manager := ""
	if bytes, err := os.ReadFile(filepath.Join(root, "pnpm-lock.yaml")); err == nil {
		manager = "pnpm"
		var lock struct {
			Importers map[string]map[string]map[string]struct {
				Version string `yaml:"version"`
			}
		}
		if err = yaml.Unmarshal(bytes, &lock); err != nil {
			return nil, err
		}
		for _, importer := range lock.Importers {
			for _, section := range []string{"dependencies", "devDependencies", "optionalDependencies"} {
				for name, value := range importer[section] {
					add(name, strings.Split(value.Version, "(")[0])
				}
			}
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	} else if bytes, err = os.ReadFile(filepath.Join(root, "bun.lock")); err == nil {
		manager = "bun"
		bytes, err = jsonc(bytes)
		if err != nil {
			return nil, err
		}
		var lock struct{ Packages map[string][]json.RawMessage }
		if err = json.Unmarshal(bytes, &lock); err != nil {
			return nil, err
		}
		for _, pkg := range lock.Packages {
			if len(pkg) == 0 {
				continue
			}
			var spec string
			if json.Unmarshal(pkg[0], &spec) == nil {
				at := strings.LastIndex(spec, "@")
				if at > 0 {
					add(spec[:at], spec[at+1:])
				}
			}
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	warnings := []string{}
	for name, values := range versions {
		sort.Strings(values)
		if len(values) > 1 {
			warnings = append(warnings, fmt.Sprintf("%s has conflicting lockfile versions: %s", name, strings.Join(values, ", ")))
		}
	}
	sort.Strings(warnings)
	return map[string]any{"manager": manager, "versions": versions, "warnings": warnings, "scope": "lockfile inventory only; installed bindings and importer selection are not yet ported"}, nil
}
