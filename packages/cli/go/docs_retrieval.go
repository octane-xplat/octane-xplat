package main

import (
	"context"
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
)

const maxDocBytes = 4 << 20
const maxDocsBytes = 32 << 20
const maxDocChunks = 20000

type docFile struct{ Path, Corpus, Content string }
type docChunk struct {
	Key            string `json:"key"`
	Path           string `json:"path"`
	Corpus         string `json:"corpus"`
	Title          string `json:"title"`
	Heading        string `json:"heading"`
	Content        string `json:"content"`
	Line           int    `json:"line"`
	EndLine        int    `json:"endLine"`
	ReleaseVersion string `json:"releaseVersion,omitempty"`
	ReleaseDate    string `json:"releaseDate,omitempty"`
}

var docRoots = []struct{ Path, Corpus string }{
	{".agents/design", "design-note"}, {".agents/docs/notes", "implementation-note"}, {".agents/docs/recipes", "recipe"},
	{"docs", "guide"}, {"docs/notes", "design-note"}, {"recipes", "recipe"},
}

func docCorpus(path string) string {
	if !strings.HasSuffix(path, ".md") || strings.ContainsAny(path, "\\\x00:") || filepath.IsAbs(path) || slices.Contains(strings.Split(path, "/"), "..") {
		return ""
	}
	parts := strings.Split(path, "/")
	for index, part := range parts[:len(parts)-1] {
		if part == "node_modules" || part == ".git" || part == "private" || part == "secrets" || part == ".secrets" || (strings.HasPrefix(part, ".") && !(index == 0 && part == ".agents")) {
			return ""
		}
	}
	if strings.HasPrefix(parts[len(parts)-1], ".") {
		return ""
	}
	for _, root := range docRoots {
		if strings.HasPrefix(path, root.Path+"/") {
			if root.Corpus == "guide" && strings.HasPrefix(path, "docs/notes/") {
				return "design-note"
			}
			return root.Corpus
		}
	}
	if path == "CHANGELOG.md" || path == "FIXLOG.md" || path == "packages/tsrx-typegen/CHANGELOG.md" {
		return "changelog"
	}
	if len(parts) == 3 && parts[0] == "packages" && parts[2] == "README.md" {
		return "readme"
	}
	return ""
}

func readDoc(root, path string) (docFile, string) {
	corpus := docCorpus(path)
	if corpus == "" {
		return docFile{}, "out-of-scope"
	}
	data, reason := scopedText(root, root, filepath.Join(root, filepath.FromSlash(path)), maxDocBytes, func(rel string) bool { return docCorpus(rel) == corpus })
	if reason != "" {
		return docFile{}, reason
	}
	return docFile{path, corpus, data.Content}, ""
}

func listDocuments(ctx context.Context, root string) ([]docFile, error) {
	canonicalRoot, err := canonical(root)
	if err != nil {
		return nil, err
	}
	files, total, visited := []docFile{}, 0, 0
	seen := map[string]bool{}
	var visit func(string, int, string) error
	visit = func(path string, depth int, corpus string) error {
		if err := ctx.Err(); err != nil {
			return err
		}
		visited++
		if depth > 32 || visited > 50000 {
			return fmt.Errorf("documentation traversal exceeds depth/entry limit")
		}
		real, err := canonical(path)
		if err != nil || !inside(canonicalRoot, real) {
			return nil
		}
		info, err := os.Stat(real)
		if err != nil {
			return nil
		}
		if info.IsDir() {
			lexical, _ := filepath.Rel(root, path)
			target, _ := filepath.Rel(canonicalRoot, real)
			if docCorpus(filepath.ToSlash(lexical)+"/scope.md") != corpus || docCorpus(filepath.ToSlash(target)+"/scope.md") != corpus {
				return nil
			}
			if seen[real] {
				return nil
			}
			seen[real] = true
			entries, err := os.ReadDir(path)
			if err != nil {
				return err
			}
			for _, entry := range entries {
				if strings.HasPrefix(entry.Name(), ".") || entry.Name() == "node_modules" || entry.Name() == "private" || entry.Name() == "secrets" {
					continue
				}
				if err := visit(filepath.Join(path, entry.Name()), depth+1, corpus); err != nil {
					return err
				}
			}
			return nil
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return nil
		}
		rel = filepath.ToSlash(rel)
		if docCorpus(rel) != corpus {
			return nil
		}
		if info.Size() > maxDocBytes {
			return fmt.Errorf("documentation page exceeds 4 MiB: %s", rel)
		}
		doc, reason := readDoc(root, rel)
		if reason != "" {
			return nil
		}
		if total+len(doc.Content) > maxDocsBytes || len(files) >= 8000 {
			return fmt.Errorf("documentation inventory exceeds 32 MiB or 8000 files")
		}
		total += len(doc.Content)
		files = append(files, doc)
		return nil
	}
	for _, entry := range docRoots {
		if err := visit(filepath.Join(root, entry.Path), 0, entry.Corpus); err != nil {
			return nil, err
		}
	}
	for _, path := range []string{"CHANGELOG.md", "FIXLOG.md", "packages/tsrx-typegen/CHANGELOG.md"} {
		if err := visit(filepath.Join(root, path), 0, "changelog"); err != nil {
			return nil, err
		}
	}
	entries, _ := os.ReadDir(filepath.Join(root, "packages"))
	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		if err := visit(filepath.Join(root, "packages", entry.Name(), "README.md"), 0, "readme"); err != nil {
			return nil, err
		}
	}
	slices.SortFunc(files, func(a, b docFile) int { return strings.Compare(a.Path, b.Path) })
	return files, nil
}

var docTitlePattern = regexp.MustCompile(`(?m)^#\s+(.+)$`)
var docHeadingPattern = regexp.MustCompile(`^(#{1,6})\s+(.+)$`)
var docFencePattern = regexp.MustCompile("^ {0,3}(`{3,}|~{3,})")
var docReleasePattern = regexp.MustCompile(`(?:Octane Xplat\s+|\[v?|^v?)([0-9]+\.[0-9]+\.[0-9]+(?:-[\w.-]+)?)`)
var docDatePattern = regexp.MustCompile(`\b[0-9]{4}-[0-9]{2}-[0-9]{2}\b`)

func docTitle(content, path string) string {
	if title := docTitlePattern.FindStringSubmatch(content); len(title) > 0 {
		return strings.TrimSpace(title[1])
	}
	return strings.TrimSuffix(filepath.Base(path), ".md")
}
func docPlatforms(path, content string) []string {
	units := textUnits(content)
	if len(units) > 2000 {
		content = stringFromUnits(units[:2000])
	}
	hay := strings.ToLower(path + "\n" + content)
	result := []string{}
	for _, platform := range []string{"web", "ios", "android", "macos", "linux", "windows"} {
		if regexp.MustCompile(`\b` + platform + `\b`).MatchString(hay) {
			result = append(result, platform)
		}
	}
	return result
}
func markdownChunks(doc docFile) ([]docChunk, error) {
	lines := strings.Split(doc.Content, "\n")
	chunks := []docChunk{}
	title, heading, fence, version, date := doc.Path, "", "", "", ""
	start, size := 0, 0
	emit := func(end int) error {
		content := strings.TrimSpace(strings.Join(lines[start:end], "\n"))
		if content != "" {
			if len(chunks) >= maxDocChunks {
				return fmt.Errorf("documentation exceeds 20000 chunks")
			}
			hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%d:%s", doc.Path, start, content)))
			chunks = append(chunks, docChunk{fmt.Sprintf("%x", hash), doc.Path, doc.Corpus, title, heading, content, start + 1, end, version, date})
		}
		start = end
		size = 0
		return nil
	}
	for index, line := range lines {
		if marker := docFencePattern.FindStringSubmatch(line); len(marker) > 0 {
			if fence == "" {
				fence = marker[1]
			} else if marker[1][0] == fence[0] && len(marker[1]) >= len(fence) {
				fence = ""
			}
		} else if fence == "" {
			if h := docHeadingPattern.FindStringSubmatch(line); len(h) > 0 {
				if err := emit(index); err != nil {
					return nil, err
				}
				heading = h[2]
				if len(h[1]) == 1 {
					title = heading
				}
				if doc.Corpus == "changelog" && len(h[1]) <= 2 {
					version, date = "", docDatePattern.FindString(heading)
					if release := docReleasePattern.FindStringSubmatch(heading); len(release) > 0 {
						version = release[1]
					}
				}
			} else if size >= 900 && strings.TrimSpace(line) == "" {
				if err := emit(index + 1); err != nil {
					return nil, err
				}
			}
		}
		size += len(textUnits(line)) + 1
	}
	if err := emit(len(lines)); err != nil {
		return nil, err
	}
	return chunks, nil
}

func docReference(name, version, path string) string {
	return "xplat-doc://" + name + "@" + version + "/" + path
}
func parseDocReference(ref string) (string, string, string, bool) {
	rest, valid := strings.CutPrefix(ref, "xplat-doc://")
	if !valid {
		return "", "", "", false
	}
	start := 0
	if strings.HasPrefix(rest, "@") {
		start = 1
	}
	at := strings.Index(rest[start:], "@")
	if at >= 0 {
		at += start
	}
	if at <= 0 {
		return "", "", "", false
	}
	name := rest[:at]
	version, path, slash := strings.Cut(rest[at+1:], "/")
	return name, version, path, slash && version != "" && path != "" && mappedPackage(name)
}

func docPage(root, path string, values map[string]any) (any, string) {
	doc, reason := readDoc(root, path)
	if reason != "" {
		return nil, reason
	}
	page := sourcePage(doc.Content, values)
	delete(page, "line")
	delete(page, "endLine")
	delete(page, "contentHash")
	page["path"], page["corpus"], page["title"], page["platforms"] = path, doc.Corpus, docTitle(doc.Content, path), docPlatforms(path, doc.Content)
	return page, ""
}
