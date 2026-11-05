package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
)

type routeOptions struct{ Directory, Output *string }
type routeLocation struct {
	Project, Directory, Base string
	ConfigHash               string
	Sources                  []string
}

var routeTargets = []string{"web", "ios", "android", "mobile", "macos", "windows", "linux"}

func filesystemKey(path string) string {
	path = filepath.Clean(path)
	if runtime.GOOS == "windows" {
		return strings.ToLower(path)
	}
	return path
}
func routeAbsolute(project, path string) (string, error) {
	if path == "" || strings.ContainsRune(path, 0) {
		return "", errors.New("route paths must be nonempty and contain no NUL")
	}
	if filepath.IsAbs(path) {
		return filepath.Clean(path), nil
	}
	return filepath.Join(project, path), nil
}
func locateRoutes(project string, options routeOptions, previousDirectory string) (routeLocation, error) {
	actual, err := canonical(project)
	if err != nil {
		return routeLocation{}, err
	}
	project = actual
	location := routeLocation{Project: project}
	configPath := filepath.Join(project, "xplat.routes.json")
	data, err := metadataBytes(configPath, 1<<20)
	configured := err == nil
	location.ConfigHash = "missing"
	if err != nil && !os.IsNotExist(err) {
		return location, err
	}
	config := map[string]json.RawMessage{}
	if configured {
		location.ConfigHash = digestText(string(data))
		if err = json.Unmarshal(data, &config); err != nil || config == nil {
			return location, errors.New("xplat.routes.json must be a valid JSON object")
		}
	}
	pathField := func(name string, chosen *string) (string, error) {
		value := ""
		if raw, ok := config[name]; ok {
			if json.Unmarshal(raw, &value) != nil || value == "" {
				return "", fmt.Errorf("xplat.routes.json %s: expected a nonempty path", name)
			}
		}
		if chosen != nil {
			value = *chosen
		}
		if value != "" {
			return routeAbsolute(project, value)
		}
		if chosen != nil {
			return "", fmt.Errorf("--%s requires a nonempty path", name)
		}
		return "", nil
	}
	location.Directory, err = pathField("directory", options.Directory)
	if err != nil {
		return location, err
	}
	if location.Directory == "" {
		for _, path := range []string{"app", "src/app"} {
			candidate := filepath.Join(project, filepath.FromSlash(path))
			if _, err := os.Stat(candidate); err == nil {
				location.Directory = candidate
				break
			} else if !os.IsNotExist(err) {
				return location, err
			}
		}
		if location.Directory == "" {
			for _, path := range []string{"app", "src/app"} {
				if candidate := filepath.Join(project, filepath.FromSlash(path)); candidate == previousDirectory {
					location.Directory = candidate
					break
				}
			}
		}
		if location.Directory == "" && configured {
			location.Directory = filepath.Join(project, "src", "app")
		}
	}
	if location.Directory == "" {
		return location, nil
	}
	location.Base, err = pathField("out", options.Output)
	if err != nil {
		return location, err
	}
	if location.Base == "" {
		location.Base = filepath.Join(location.Directory, "..", "routes.gen")
	}
	location.Base = strings.TrimSuffix(location.Base, ".ts")
	if location.Base == project || filepath.Base(location.Base) == "." || filepath.Base(location.Base) == string(filepath.Separator) {
		return location, errors.New("route output must name a module basename")
	}
	addReference := func(raw json.RawMessage) error {
		var reference map[string]json.RawMessage
		var source string
		if json.Unmarshal(raw, &reference) != nil || json.Unmarshal(reference["module"], &source) != nil || !strings.HasPrefix(source, "./") {
			return errors.New("xplat.routes.json source references require a module path starting with ./")
		}
		path, err := routeAbsolute(project, source)
		if err == nil {
			location.Sources = append(location.Sources, path)
		}
		return err
	}
	if raw, ok := config["manifests"]; ok {
		var references []json.RawMessage
		if json.Unmarshal(raw, &references) != nil || references == nil || len(references) > 256 {
			return location, errors.New("xplat.routes.json manifests: expected at most 256 source references")
		}
		for _, reference := range references {
			if err = addReference(reference); err != nil {
				return location, err
			}
		}
	}
	for _, name := range []string{"context", "transitions"} {
		if raw, ok := config[name]; ok {
			if err = addReference(raw); err != nil {
				return location, err
			}
		}
	}
	for _, name := range []string{"package.json", "tsconfig.json", "tsconfig.envs.json", "bun.lock", "pnpm-lock.yaml", "package-lock.json", "vite.config.ts", "vite.config.mts", "vite.config.js", "vite.config.mjs", "vite.config.cjs"} {
		location.Sources = append(location.Sources, filepath.Join(project, name))
	}
	return location, nil
}

func routeDirectoryEntries(path string) ([]os.DirEntry, error) {
	root, err := os.OpenRoot(path)
	if err != nil {
		return nil, err
	}
	defer root.Close()
	file, err := root.Open(".")
	if err != nil {
		return nil, err
	}
	defer file.Close()
	entries := []os.DirEntry{}
	for {
		batch, err := file.ReadDir(512)
		entries = append(entries, batch...)
		if len(entries) > 50000 {
			return nil, errors.New("route directory exceeds 50000 entries")
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}
	slices.SortFunc(entries, func(a, b os.DirEntry) int { return strings.Compare(a.Name(), b.Name()) })
	return entries, nil
}
func (location routeLocation) outputPaths() []string {
	if location.Directory == "" {
		return nil
	}
	paths := []string{}
	for _, suffix := range []string{".contracts.ts", ".types.ts", ".data.ts", ".manifest.json"} {
		paths = append(paths, location.Base+suffix)
	}
	for _, target := range routeTargets {
		paths = append(paths, location.Base+"."+target+".ts", location.Base+".catalog."+target+".ts")
	}
	return paths
}
func routeFingerprint(ctx context.Context, location routeLocation) (string, error) {
	hash := sha256.New()
	fmt.Fprintln(hash, location.Project, location.Directory, location.Base)
	excluded := map[string]bool{}
	for _, output := range location.outputPaths() {
		if actual, err := canonical(output); err == nil {
			excluded[filesystemKey(actual)] = true
		}
	}
	ancestors := map[string]bool{}
	visited, totalBytes := 0, int64(0)
	var visit func(string, int) error
	visit = func(path string, depth int) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		visited++
		if visited > 50000 || depth > 64 {
			return errors.New("route inputs exceed 50000 entries or 64 directory levels")
		}
		key := filesystemKey(path)
		if location.Base != "" && strings.HasPrefix(key, filesystemKey(location.Base)+".") {
			return nil
		}
		for target := range excluded {
			if key == target || strings.HasPrefix(key, target+".tmp-xplat-") {
				return nil
			}
		}
		info, err := os.Stat(path)
		if os.IsNotExist(err) {
			if path == filepath.Join(location.Project, "xplat.routes.json") && location.ConfigHash != "missing" {
				return errors.New("routing configuration changed during planning")
			}
			fmt.Fprintln(hash, "M", path)
			return nil
		}
		if err != nil {
			return err
		}
		actual, err := canonical(path)
		if err != nil {
			return err
		}
		if excluded[filesystemKey(actual)] {
			return nil
		}
		if info.IsDir() {
			key := filesystemKey(actual)
			if ancestors[key] {
				return fmt.Errorf("route directory contains a link cycle: %s", path)
			}
			ancestors[key] = true
			defer delete(ancestors, key)
			entries, err := routeDirectoryEntries(path)
			if err != nil {
				return err
			}
			// Empty/generated-only directories have no routing meaning. Do not
			// fingerprint directory mtimes changed by our own staged outputs.
			for _, entry := range entries {
				if err = visit(filepath.Join(path, entry.Name()), depth+1); err != nil {
					return err
				}
			}
			return nil
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("route input is not a regular file: %s", path)
		}
		fmt.Fprintln(hash, "F", path, actual, info.Mode())
		if !slices.Contains([]string{".ts", ".tsx", ".tsrx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".md", ".json", ".jsonc"}, strings.ToLower(filepath.Ext(path))) {
			fmt.Fprintln(hash, info.Size(), info.ModTime().UnixNano())
			return nil
		}
		if info.Size() > 8<<20 {
			return fmt.Errorf("route input exceeds 8 MiB: %s", path)
		}
		totalBytes += info.Size()
		if totalBytes > 128<<20 {
			return errors.New("route text inputs exceed 128 MiB")
		}
		root, err := os.OpenRoot(filepath.Dir(actual))
		if err != nil {
			return err
		}
		defer root.Close()
		file, err := openSourceFile(root, filepath.Base(actual))
		if err != nil {
			return err
		}
		defer file.Close()
		opened, err := file.Stat()
		if err != nil || !sameArtifactInfo(info, opened) {
			return errors.New("route input changed while being opened")
		}
		reader := io.LimitReader(file, (8<<20)+1)
		digest := sha256.New()
		count, err := io.Copy(digest, reader)
		after, statErr := file.Stat()
		if err != nil {
			return err
		}
		if count > 8<<20 || statErr != nil || !sameArtifactInfo(opened, after) {
			return errors.New("route input changed while being read")
		}
		if path == filepath.Join(location.Project, "xplat.routes.json") && fmt.Sprintf("%x", digest.Sum(nil)) != location.ConfigHash {
			return errors.New("routing configuration changed during planning")
		}
		fmt.Fprintf(hash, "%x\n", digest.Sum(nil))
		return nil
	}
	if err := visit(filepath.Join(location.Project, "xplat.routes.json"), 0); err != nil {
		return "", err
	}
	if location.Directory != "" {
		if err := visit(location.Directory, 0); err != nil {
			return "", err
		}
	}
	for _, source := range location.Sources {
		if err := visit(source, 0); err != nil {
			return "", err
		}
		entries, err := routeDirectoryEntries(filepath.Dir(source))
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return "", err
		}
		for _, entry := range entries {
			path := filepath.Join(filepath.Dir(source), entry.Name())
			if strings.HasPrefix(path, source+".") {
				if err = visit(path, 0); err != nil {
					return "", err
				}
			}
		}
	}
	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}
