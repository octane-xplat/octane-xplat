package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"strings"

	"go.yaml.in/yaml/v3"
)

func projectManifest(root string) (map[string]any, error) {
	var pkg map[string]any
	err := readJSON(filepath.Join(root, "package.json"), &pkg)
	if os.IsNotExist(err) {
		return map[string]any{}, nil
	}
	return pkg, err
}
func yamlObject(path string) (map[string]any, error) {
	data, err := metadataBytes(path, 64<<20)
	if err != nil {
		return nil, err
	}
	if len(data) > 64<<20 {
		return nil, errors.New("YAML metadata exceeds 64 MiB")
	}
	var value map[string]any
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	err = decoder.Decode(&value)
	if err != nil && err != io.EOF {
		return nil, err
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF {
		return nil, errors.New("YAML metadata must contain one document")
	}
	if value == nil {
		value = map[string]any{}
	}
	return value, nil
}
func projectWorkspace(root string, manager *string) (map[string]any, error) {
	pkg, err := projectManifest(root)
	if err != nil {
		return nil, err
	}
	selected := strings.Split(stringValue(pkg["packageManager"]), "@")[0]
	if manager != nil {
		selected = *manager
	}
	if yamlPath := filepath.Join(root, "pnpm-workspace.yaml"); selected != "bun" && pathExists(yamlPath) {
		return yamlObject(yamlPath)
	}
	workspace := object(pkg["workspaces"])
	patterns := pkg["workspaces"]
	if _, array := patterns.([]any); !array {
		patterns = workspace["packages"]
	}
	if patterns == nil {
		patterns = []any{}
	}
	first := func(name string) any {
		if pkg[name] != nil {
			return pkg[name]
		}
		if (name == "catalog" || name == "catalogs") && workspace[name] != nil {
			return workspace[name]
		}
		return map[string]any{}
	}
	return map[string]any{"packages": patterns, "catalog": first("catalog"), "catalogs": first("catalogs"), "overrides": first("overrides"), "patchedDependencies": first("patchedDependencies")}, nil
}
func workspaceContains(ctx context.Context, root, path string) (bool, error) {
	workspace, err := projectWorkspace(root, nil)
	if err != nil {
		return false, err
	}
	patterns, ok := workspace["packages"].([]any)
	if workspace["packages"] == nil {
		return false, nil
	}
	if !ok {
		return false, errors.New("workspace packages must be an array of glob strings")
	}
	rel, err := filepath.Rel(root, path)
	if err != nil || !inside(root, path) {
		return false, err
	}
	if !pathExists(path) {
		return false, nil
	}
	rel = filepath.ToSlash(rel)
	for _, part := range strings.Split(rel, "/") {
		if part == "node_modules" || part == ".git" {
			return false, nil
		}
	}
	included, excluded := false, false
	for _, entry := range patterns {
		pattern, ok := entry.(string)
		if !ok {
			return false, errors.New("workspace patterns must be strings")
		}
		if len(pattern) > 4096 {
			return false, errors.New("workspace glob exceeds 4096 bytes")
		}
		if strings.ContainsAny(pattern, "{[?()\\") || strings.Contains(pattern, "**") {
			return false, fmt.Errorf("unsupported workspace pattern %q: use literal paths, '*' within one directory segment, and leading '!' exclusions", pattern)
		}
	}
	for _, entry := range patterns {
		pattern := entry.(string)
		negated := strings.HasPrefix(pattern, "!")
		if negated {
			pattern = pattern[1:]
		}
		candidate := rel
		if filepath.IsAbs(pattern) {
			candidate = filepath.ToSlash(path)
		}
		pattern = filepath.Clean(filepath.FromSlash(pattern))
		candidate = filepath.FromSlash(candidate)
		matched, err := filepath.Match(pattern, candidate)
		if err != nil {
			return false, fmt.Errorf("invalid workspace glob %q: %w", pattern, err)
		}
		if matched {
			patternParts, candidateParts := strings.Split(filepath.ToSlash(pattern), "/"), strings.Split(filepath.ToSlash(candidate), "/")
			for index, part := range candidateParts {
				if strings.HasPrefix(part, ".") && !strings.HasPrefix(patternParts[index], ".") {
					matched = false
					break
				}
			}
		}
		if matched {
			if negated {
				excluded = true
			} else {
				included = true
			}
		}
	}
	return included && !excluded, nil
}
func projectManagerRoot(ctx context.Context, path string) (string, error) {
	start, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	for at := filepath.Dir(start); at != filepath.Dir(at); at = filepath.Dir(at) {
		if !pathExists(filepath.Join(at, "package.json")) && !pathExists(filepath.Join(at, "pnpm-workspace.yaml")) {
			continue
		}
		member, err := workspaceContains(ctx, at, start)
		if err != nil {
			return "", err
		}
		if member {
			return at, nil
		}
	}
	return start, nil
}
func projectPackageManager(ctx context.Context, path string, explicit *string) (string, error) {
	root, err := projectManagerRoot(ctx, path)
	if err != nil {
		return "", err
	}
	pkg, err := projectManifest(root)
	if err != nil {
		return "", err
	}
	declared := strings.Split(stringValue(pkg["packageManager"]), "@")[0]
	if explicit != nil {
		declared = *explicit
	}
	if declared != "" {
		if declared == "bun" || declared == "pnpm" {
			return declared, nil
		}
		return "", fmt.Errorf("Xplat supports Bun and pnpm projects; found packageManager %s.", declared)
	}
	bun := pathExists(filepath.Join(root, "bun.lock")) || pathExists(filepath.Join(root, "bun.lockb"))
	pnpm := pathExists(filepath.Join(root, "pnpm-lock.yaml"))
	if bun && pnpm {
		return "", errors.New("Both Bun and pnpm lockfiles exist. Set packageManager in package.json or pass --package-manager.")
	}
	if bun {
		return "bun", nil
	}
	if pnpm {
		return "pnpm", nil
	}
	if pkg["patchedDependencies"] != nil {
		return "bun", nil
	}
	if pathExists(filepath.Join(root, "pnpm-workspace.yaml")) {
		return "pnpm", nil
	}
	return "bun", nil
}
func bunLock(root string) (map[string]any, error) {
	path := filepath.Join(root, "bun.lock")
	data, err := metadataBytes(path, 64<<20)
	if os.IsNotExist(err) {
		if pathExists(filepath.Join(root, "bun.lockb")) {
			return nil, errors.New("xplat patches needs bun.lock. Run bun install --save-text-lockfile --lockfile-only to convert bun.lockb.")
		}
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if len(data) > 64<<20 {
		return nil, errors.New("Bun lockfile exceeds 64 MiB")
	}
	data, err = jsonc(data)
	if err != nil {
		return nil, fmt.Errorf("Cannot read %s: invalid Bun lockfile", path)
	}
	var value map[string]any
	if json.Unmarshal(data, &value) != nil || value == nil {
		return nil, fmt.Errorf("Cannot read %s: invalid Bun lockfile", path)
	}
	return value, nil
}

// Dependency ordering affects public arrays and the last discrepancy. Decode
// object keys in their declaration order rather than ranging over a Go map.
func objectKeys(data json.RawMessage) ([]string, error) {
	decoder := json.NewDecoder(bytes.NewReader(data))
	token, err := decoder.Token()
	if err != nil || token != json.Delim('{') {
		return nil, errors.New("expected metadata object")
	}
	keys := []string{}
	seen := map[string]bool{}
	for decoder.More() {
		key, err := decoder.Token()
		if err != nil {
			return nil, err
		}
		name := key.(string)
		if !seen[name] {
			keys = append(keys, name)
			seen[name] = true
		}
		var value json.RawMessage
		if err = decoder.Decode(&value); err != nil {
			return nil, err
		}
	}
	return keys, nil
}
func dependencyDeclarations(root string, optional bool) ([]string, map[string]any, error) {
	var pkg map[string]json.RawMessage
	if err := readJSON(filepath.Join(root, "package.json"), &pkg); os.IsNotExist(err) {
		return []string{}, map[string]any{}, nil
	} else if err != nil {
		return nil, nil, err
	}
	sections := []string{"dependencies", "devDependencies"}
	if optional {
		sections = append(sections, "optionalDependencies")
	}
	names := []string{}
	declared := map[string]any{}
	for _, section := range sections {
		if len(pkg[section]) == 0 || string(pkg[section]) == "null" {
			continue
		}
		keys, err := objectKeys(pkg[section])
		if err != nil {
			return nil, nil, err
		}
		var values map[string]any
		if err = json.Unmarshal(pkg[section], &values); err != nil {
			return nil, nil, err
		}
		for _, name := range keys {
			if _, present := declared[name]; !present {
				names = append(names, name)
			}
			declared[name] = values[name]
		}
	}
	return names, declared, nil
}

var lockedSemver = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+`)

func bunImporterVersions(ctx context.Context, path string) (map[string]any, bool, error) {
	root, err := projectManagerRoot(ctx, path)
	if err != nil {
		return nil, false, err
	}
	if !pathExists(filepath.Join(root, "bun.lock")) {
		return nil, false, nil
	}
	lock, err := bunLock(root)
	if err != nil {
		return nil, false, err
	}
	if lock == nil {
		return nil, false, nil
	}
	pkg, err := projectManifest(path)
	if err != nil {
		return nil, false, err
	}
	owner := stringValue(pkg["name"])
	for name, entry := range object(lock["workspaces"]) {
		resolved, err := filepath.Abs(filepath.Join(root, filepath.FromSlash(name)))
		if err == nil && resolved == path {
			if importerName := stringValue(object(entry)["name"]); importerName != "" {
				owner = importerName
			}
			break
		}
	}
	names, _, err := dependencyDeclarations(path, true)
	if err != nil {
		return nil, false, err
	}
	packages := object(lock["packages"])
	versions := map[string]any{}
	for _, name := range names {
		entry := packages[owner+"/"+name]
		if entry == nil {
			entry = packages[name]
		}
		array, ok := entry.([]any)
		if !ok || len(array) == 0 {
			continue
		}
		identity, ok := array[0].(string)
		if !ok || len(identity) == 0 {
			continue
		}
		at := strings.Index(identity[1:], "@")
		spec := identity
		if at >= 0 {
			spec = identity[at+2:]
		}
		if strings.HasPrefix(spec, "workspace:") {
			member := object(object(lock["workspaces"])[strings.TrimPrefix(spec, "workspace:")])
			if member["version"] != nil {
				versions[name] = member["version"]
			}
		} else if lockedSemver.MatchString(spec) {
			versions[name] = spec
		}
	}
	return versions, true, nil
}
func installedRoot(path, name string) string {
	if !validPackageName(name) {
		return ""
	}
	for at := path; ; at = filepath.Dir(at) {
		candidate := filepath.Join(at, "node_modules", filepath.FromSlash(name), "package.json")
		if pathExists(candidate) {
			root, err := canonical(filepath.Dir(candidate))
			if err == nil {
				return root
			}
			return ""
		}
		if at == filepath.Dir(at) {
			break
		}
	}
	return ""
}

type packageVersion struct {
	Name     string `json:"name"`
	Version  any    `json:"version"`
	Source   string `json:"source"`
	Declared any    `json:"declared,omitempty"`
}

func knownVersion(value any) bool {
	return value != nil && value != "" && value != false && value != float64(0) && value != int(0)
}

func (entry packageVersion) MarshalJSON() ([]byte, error) {
	value := map[string]any{"name": entry.Name, "version": entry.Version, "source": entry.Source}
	if entry.Source != "installed" {
		value["declared"] = entry.Declared
	}
	return json.Marshal(value)
}

type frameworkBinding struct {
	Packages    []packageVersion `json:"packages"`
	Status      string           `json:"status"`
	Discrepancy string           `json:"discrepancy,omitempty"`
}

func frameworkLockVersions(ctx context.Context, root, path string, names []string, declared map[string]any) ([]packageVersion, error) {
	packages := []packageVersion{}
	bun, present, err := bunImporterVersions(ctx, path)
	if err != nil {
		return nil, err
	}
	if present {
		for _, name := range names {
			packages = append(packages, packageVersion{name, bun[name], "lockfile", declared[name]})
		}
		return packages, nil
	}
	for at := path; ; at = filepath.Dir(at) {
		file := filepath.Join(at, "pnpm-lock.yaml")
		if pathExists(file) {
			lock, err := yamlObject(file)
			if err != nil {
				return packages, nil
			}
			rel, _ := filepath.Rel(at, path)
			rel = filepath.ToSlash(rel)
			importer := object(object(lock["importers"])[rel])
			if importer == nil {
				importer = object(object(lock["importers"])["."])
			}
			locked := dependencies(importer)
			for _, name := range names {
				entry := object(locked[name])
				version := entry["version"]
				if version == nil {
					version = entry["specifier"]
				}
				packages = append(packages, packageVersion{name, version, "lockfile", declared[name]})
			}
			return packages, nil
		}
		parent := filepath.Dir(at)
		if parent == at || !inside(root, parent) {
			return packages, nil
		}
	}
}
func resolveFrameworkBinding(ctx context.Context, root, path string) (frameworkBinding, error) {
	names, declared, err := dependencyDeclarations(path, false)
	if err != nil {
		return frameworkBinding{}, err
	}
	frameworkNames := []string{}
	for _, name := range names {
		if strings.HasPrefix(name, "@octane-xplat/") {
			frameworkNames = append(frameworkNames, name)
		}
	}
	installed := []packageVersion{}
	byName := map[string]packageVersion{}
	resolved := false
	for _, name := range frameworkNames {
		spec, ok := declared[name].(string)
		if !ok {
			return frameworkBinding{}, fmt.Errorf("dependency %s must declare a string version", name)
		}
		var manifest map[string]any
		if packageRoot := installedRoot(path, name); packageRoot != "" {
			manifest = jsonObject(filepath.Join(packageRoot, "package.json"))
		}
		version := manifest["version"]
		source := "installed"
		var definition any
		if !knownVersion(version) {
			version = nil
			definition = spec
			source = "unresolved"
			if spec == "workspace:*" || strings.HasPrefix(spec, "link:") || strings.HasPrefix(spec, "file:") {
				version = spec
				source = "workspace"
			}
		}
		entry := packageVersion{name, version, source, definition}
		installed = append(installed, entry)
		byName[name] = entry
		if source == "installed" || source == "workspace" {
			resolved = true
		}
	}
	locked, err := frameworkLockVersions(ctx, root, path, frameworkNames, declared)
	if err != nil {
		return frameworkBinding{}, err
	}
	result := frameworkBinding{Packages: []packageVersion{}, Status: "unresolved"}
	if len(installed) == 0 && len(locked) == 0 {
		return result, nil
	}
	result.Status = "provisional"
	result.Packages = locked
	if resolved {
		result.Status = "installed"
		result.Packages = installed
	}
	for _, entry := range locked {
		actual := byName[entry.Name]
		if knownVersion(entry.Version) && knownVersion(actual.Version) && !reflect.DeepEqual(entry.Version, actual.Version) {
			version := fmt.Sprint(entry.Version)
			if !strings.HasPrefix(version, "workspace:") && !strings.HasPrefix(version, "link:") && !strings.HasPrefix(version, "file:") {
				result.Discrepancy = fmt.Sprintf("Lockfile records %s@%v but the installation has %v; using the actual installation.", entry.Name, entry.Version, actual.Version)
			}
		}
	}
	return result, nil
}
