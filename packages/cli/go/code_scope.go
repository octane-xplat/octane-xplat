package main

import (
	"context"
	"crypto/sha1"
	"encoding/hex"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
)

const maxCodeBytes = 256 << 10
const maxCodeFiles = 8000

var codeSkipDirectories = stringSet("node_modules .git .hg .svn dist build out coverage platforms .turbo .next .output .nuxt .svelte-kit research generated .agents .devin .claude .idea .vscode .ssh .gnupg secrets .secrets private")
var codeExtensions = stringSet("ts tsx tsrx js jsx mjs cjs mts cts css scss swift kt kts java m mm h c cc cpp cs")
var codeSecretFiles = stringSet(".npmrc .netrc .pypirc .git-credentials credentials.json service-account.json id_rsa id_dsa id_ecdsa id_ed25519")
var codeSecretName = regexp.MustCompile(`(?i)^\.env(\.|$)|\.(pem|key|p12|pfx|keystore|jks|mobileprovision|provisionprofile|asc|gpg|secret)$`)
var codeGeneratedName = regexp.MustCompile(`\.(gen|generated|min)\.(js|ts|tsx|css|mjs|cjs)$|\.map$|^[^/]*(pnpm-lock|package-lock|yarn\.lock|bun\.lock)[^/]*$`)
var codePlatformSuffix = regexp.MustCompile(`\.([a-z]+)\.[^.]+$`)
var codePlatformTiers = map[string][]string{
	"web": {"web"}, "mobile": {"ios", "android"}, "native": {"ios", "android", "macos", "windows", "linux"},
	"ios": {"ios"}, "android": {"android"}, "macos": {"macos"}, "windows": {"windows"}, "linux": {"linux"},
}

func stringSet(words string) map[string]bool {
	result := map[string]bool{}
	for _, word := range strings.Fields(words) {
		result[word] = true
	}
	return result
}
func codeExclusion(path string) string {
	parts := strings.Split(filepath.ToSlash(path), "/")
	for _, part := range parts[:len(parts)-1] {
		if codeSkipDirectories[part] || strings.HasPrefix(part, ".") {
			return "excluded-directory"
		}
	}
	name := parts[len(parts)-1]
	if strings.HasPrefix(name, ".") {
		return "dotfile"
	}
	if codeSecretFiles[name] || codeSecretName.MatchString(name) {
		return "secret-or-private-config"
	}
	if codeGeneratedName.MatchString(name) {
		return "generated-output"
	}
	if !codeExtensions[strings.TrimPrefix(filepath.Ext(name), ".")] {
		return "not-code"
	}
	return ""
}
func codeApplies(path, platform string) bool {
	if platform == "" {
		return true
	}
	parts := strings.Split(filepath.ToSlash(path), "/")
	marks := []string{}
	for _, part := range parts[:len(parts)-1] {
		marks = append(marks, codePlatformTiers[part]...)
	}
	if suffix := codePlatformSuffix.FindStringSubmatch(parts[len(parts)-1]); len(suffix) > 0 {
		marks = append(marks, codePlatformTiers[suffix[1]]...)
	}
	return len(marks) == 0 || slices.Contains(marks, platform)
}

type codeCorpus struct {
	Corpus, Package, Version, Kind string
	Root, PackageRoot, Base, Label string
}
type codeFile struct {
	Corpus             codeCorpus
	Relative, Absolute string
	Size               int64
}

func installedCodeCorpora(app string) []codeCorpus {
	result := []codeCorpus{}
	for _, pkg := range installedPackages(app) {
		source := pkg.Root
		if info, err := os.Stat(filepath.Join(pkg.Root, "src")); err == nil && info.IsDir() {
			source = filepath.Join(pkg.Root, "src")
		}
		result = append(result, codeCorpus{Corpus: "framework", Package: pkg.Name, Version: pkg.Version, Kind: pkg.Kind, Root: source, PackageRoot: pkg.Root})
	}
	return result
}

func (workspace *workspaceContext) codeCorpora() []codeCorpus {
	result := []codeCorpus{}
	if selection := workspace.selection(); selection.State == "bound" {
		app := selection.App
		result = append(result, codeCorpus{Corpus: "app", Root: app.Root, Base: workspace.Root, Label: app.RelativeRoot})
		result = append(result, installedCodeCorpora(app.Root)...)
	}
	if workspace.Discovery.Workspace.Kind == "framework-repo" {
		entries, _ := os.ReadDir(filepath.Join(workspace.Root, "packages"))
		for _, entry := range entries {
			if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
				continue
			}
			root := filepath.Join(workspace.Root, "packages", entry.Name())
			source := filepath.Join(root, "src")
			if info, err := os.Stat(source); err != nil || !info.IsDir() {
				continue
			}
			name := stringValue(jsonObject(filepath.Join(root, "package.json"))["name"])
			if name == "" {
				name = entry.Name()
			}
			result = append(result, codeCorpus{Corpus: "framework", Package: name, Kind: "workspace", Root: source, PackageRoot: root})
		}
	}
	seen := map[string]bool{}
	return slices.DeleteFunc(result, func(corpus codeCorpus) bool {
		key := corpus.Corpus + ":" + corpus.Package + ":" + corpus.Root
		if seen[key] {
			return true
		}
		seen[key] = true
		return false
	})
}

func corpusFiles(ctx context.Context, corpus codeCorpus, platform string) ([]codeFile, bool, error) {
	files, truncated, visited := []codeFile{}, false, 0
	walkRoot, err := canonical(corpus.Root)
	if err != nil {
		return files, false, nil
	}
	err = filepath.WalkDir(walkRoot, func(path string, entry fs.DirEntry, err error) error {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err != nil {
			if entry != nil && entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if path == walkRoot {
			return nil
		}
		visited++
		if len(files) >= maxCodeFiles || visited > 100000 {
			truncated = true
			return filepath.SkipAll
		}
		if entry.IsDir() {
			if codeSkipDirectories[entry.Name()] || strings.HasPrefix(entry.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if !entry.Type().IsRegular() {
			return nil
		}
		rel, err := filepath.Rel(walkRoot, path)
		if err != nil {
			return nil
		}
		rel = filepath.ToSlash(rel)
		if codeExclusion(rel) != "" || !codeApplies(rel, platform) {
			return nil
		}
		info, err := entry.Info()
		if err != nil || !info.Mode().IsRegular() || info.Size() <= 0 || info.Size() > maxCodeBytes {
			return nil
		}
		files = append(files, codeFile{corpus, rel, filepath.Join(corpus.Root, filepath.FromSlash(rel)), info.Size()})
		return nil
	})
	return files, truncated, err
}

func sourceHash(content string) string {
	sum := sha1.Sum([]byte(content))
	return hex.EncodeToString(sum[:])[:12]
}

type sourceData struct {
	Content string
	Mtime   float64
}

func scopedSource(corpus codeCorpus, path string) (sourceData, string) {
	return scopedText(corpus.Root, corpus.PackageRoot, path, maxCodeBytes, func(rel string) bool { return codeExclusion(rel) == "" })
}
func scopedText(rootPath, exclusionRoot, path string, byteLimit int64, accept func(string) bool) (sourceData, string) {
	if !inside(rootPath, path) {
		return sourceData{}, "out-of-scope"
	}
	if exclusionRoot == "" {
		exclusionRoot = rootPath
	}
	rel, err := filepath.Rel(exclusionRoot, path)
	if err != nil {
		return sourceData{}, "out-of-scope"
	}
	if !accept(filepath.ToSlash(rel)) {
		return sourceData{}, "excluded"
	}
	real, err := canonical(path)
	root, rootErr := canonical(rootPath)
	exclusion, exclusionErr := canonical(exclusionRoot)
	if err != nil || rootErr != nil || exclusionErr != nil {
		return sourceData{}, "unavailable"
	}
	if !inside(root, real) {
		return sourceData{}, "out-of-scope"
	}
	rel, _ = filepath.Rel(exclusion, real)
	if !accept(filepath.ToSlash(rel)) {
		return sourceData{}, "excluded"
	}
	directory, err := os.OpenRoot(root)
	if err != nil {
		return sourceData{}, "unavailable"
	}
	defer directory.Close()
	key, _ := filepath.Rel(root, real)
	file, err := openSourceFile(directory, key)
	if err != nil {
		return sourceData{}, "unavailable"
	}
	defer file.Close()
	before, err := file.Stat()
	if err != nil || !before.Mode().IsRegular() || before.Size() > byteLimit {
		return sourceData{}, "unavailable"
	}
	data, err := io.ReadAll(io.LimitReader(file, byteLimit+1))
	if err != nil || int64(len(data)) > byteLimit || strings.ContainsRune(string(data), '\x00') {
		return sourceData{}, "unavailable"
	}
	after, err := file.Stat()
	if err != nil || before.Size() != after.Size() || !before.ModTime().Equal(after.ModTime()) {
		return sourceData{}, "unavailable"
	}
	// Revalidate the alias and target after reading as well. Never serve a read
	// whose requested name changed to a different target during the operation.
	current, err := canonical(path)
	info, statErr := os.Stat(current)
	if err != nil || statErr != nil || current != real || !os.SameFile(after, info) {
		return sourceData{}, "unavailable"
	}
	return sourceData{strings.ToValidUTF8(string(data), "\ufffd"), float64(after.ModTime().Unix())*1000 + float64(after.ModTime().Nanosecond())/1e6}, ""
}

func (workspace *workspaceContext) codeSelection() *cliError {
	selection := workspace.selection()
	if selection.State == "ambiguous" {
		candidates := []string{}
		for _, app := range selection.Candidates {
			candidates = append(candidates, app.ID)
		}
		return &cliError{Code: "ambiguous_selection", Message: "Several apps are detected — code retrieval targets the bound app and its installed packages, never a guessed one.", Recovery: map[string]string{"action": "Bind an app first with `xplat app select`."}, Context: map[string]any{"candidates": candidates}}
	}
	if selection.State == "none" && workspace.Discovery.Workspace.Kind != "framework-repo" {
		return invalid("Code retrieval needs a bound app.", "Bind an app first with `xplat app select`.")
	}
	return nil
}

func resolveCodeFile(corpora []codeCorpus, corpus, key string) (codeFile, string) {
	if key == "" || strings.ContainsAny(key, "\\\x00") || filepath.IsAbs(key) || strings.Contains(key, ":") || slices.Contains(strings.Split(key, "/"), "..") {
		return codeFile{}, "out-of-scope"
	}
	for _, candidate := range corpora {
		if candidate.Corpus != corpus {
			continue
		}
		if corpus == "framework" {
			if !strings.HasPrefix(key, candidate.Package+"/") {
				continue
			}
			key = strings.TrimPrefix(key, candidate.Package+"/")
		}
		base := candidate.Base
		if base == "" {
			base = candidate.Root
		}
		if corpus == "framework" {
			base = candidate.Root
		}
		path := filepath.Join(base, filepath.FromSlash(key))
		rel, err := filepath.Rel(candidate.Root, path)
		if err != nil || !inside(candidate.Root, path) {
			return codeFile{}, "out-of-scope"
		}
		return codeFile{Corpus: candidate, Relative: filepath.ToSlash(rel), Absolute: path}, ""
	}
	return codeFile{}, "unavailable"
}

func sourceFailure(reason, corpus, key string) *cliError {
	code := "invalid_selection"
	if reason == "unavailable" {
		code = "unavailable"
	}
	return &cliError{Code: code, Message: "Source is " + reason + ".", Context: map[string]any{"status": reason, "corpus": corpus, "path": key}}
}
