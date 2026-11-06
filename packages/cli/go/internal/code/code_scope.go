package code

import (
	"context"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/source"
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
	for _, pkg := range project.InstalledPackages(app) {
		source := pkg.Root
		if info, err := os.Stat(filepath.Join(pkg.Root, "src")); err == nil && info.IsDir() {
			source = filepath.Join(pkg.Root, "src")
		}
		result = append(result, codeCorpus{Corpus: "framework", Package: pkg.Name, Version: pkg.Version, Kind: pkg.Kind, Root: source, PackageRoot: pkg.Root})
	}
	return result
}

func codeCorpora(workspace *project.WorkspaceContext) []codeCorpus {
	result := []codeCorpus{}
	if selection := workspace.Selection(); selection.State == "bound" {
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
			name := cli.StringValue(cli.JsonObject(filepath.Join(root, "package.json"))["name"])
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
	walkRoot, err := osfs.Canonical(corpus.Root)
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

func scopedSource(corpus codeCorpus, path string) (source.Data, string) {
	return source.ScopedText(corpus.Root, corpus.PackageRoot, path, maxCodeBytes, func(rel string) bool { return codeExclusion(rel) == "" })
}

func Selection(workspace *project.WorkspaceContext) *cli.Error {
	selection := workspace.Selection()
	if selection.State == "ambiguous" {
		candidates := []string{}
		for _, app := range selection.Candidates {
			candidates = append(candidates, app.ID)
		}
		return &cli.Error{Code: "ambiguous_selection", Message: "Several apps are detected — code retrieval targets the bound app and its installed packages, never a guessed one.", Recovery: map[string]string{"action": "Bind an app first with `xplat app select`."}, Context: map[string]any{"candidates": candidates}}
	}
	if selection.State == "none" && workspace.Discovery.Workspace.Kind != "framework-repo" {
		return cli.Invalid("Code retrieval needs a bound app.", "Bind an app first with `xplat app select`.")
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
		if err != nil || !osfs.Inside(candidate.Root, path) {
			return codeFile{}, "out-of-scope"
		}
		return codeFile{Corpus: candidate, Relative: filepath.ToSlash(rel), Absolute: path}, ""
	}
	return codeFile{}, "unavailable"
}

func sourceFailure(reason, corpus, key string) *cli.Error {
	code := "invalid_selection"
	if reason == "unavailable" {
		code = "unavailable"
	}
	return &cli.Error{Code: code, Message: "Source is " + reason + ".", Context: map[string]any{"status": reason, "corpus": corpus, "path": key}}
}
