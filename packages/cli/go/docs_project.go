package main

import (
	"context"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

func projectDocAllowed(path string) bool {
	path = filepath.ToSlash(path)
	if !safeSnapshotPath(path) || !strings.HasSuffix(path, ".md") {
		return false
	}
	parts := strings.Split(path, "/")
	for index, part := range parts {
		if part == "private" || part == "secrets" || part == "node_modules" || (strings.HasPrefix(part, ".") && !(index == 0 && part == ".agents")) {
			return false
		}
	}
	if len(parts) == 1 {
		return strings.HasPrefix(path, "AGENTS") || strings.HasPrefix(path, "README") || strings.HasPrefix(path, "CLAUDE")
	}
	return strings.HasPrefix(path, "docs/") || strings.HasPrefix(path, ".agents/docs/")
}

// Project instructions are a distinct corpus, never release-doc search hits.
func projectDocsGuidance(ctx context.Context, app, query string) ([]any, error) {
	hits, visited, total := []docsHit{}, 0, 0
	needle, tokens := strings.ToLower(strings.TrimSpace(query)), strings.Fields(strings.ToLower(query))
	read := func(path string) error {
		rel, err := filepath.Rel(app, path)
		if err != nil {
			return err
		}
		rel = filepath.ToSlash(rel)
		if !projectDocAllowed(rel) {
			return nil
		}
		data, reason := scopedText(app, app, path, maxDocBytes, projectDocAllowed)
		if reason != "" {
			return nil
		}
		total += len(data.Content)
		if total > maxDocsBytes {
			return fmt.Errorf("project guidance exceeds 32 MiB")
		}
		hay := strings.ToLower(rel + "\n" + data.Content)
		score := 0.0
		for _, token := range tokens {
			if strings.Contains(hay, token) {
				score++
			}
		}
		if needle != "" && score == 0 {
			return nil
		}
		if strings.Contains(hay, needle) {
			score += 100
		}
		excerpt, _ := docExcerpt(data.Content, needle)
		hits = append(hits, docsHit{map[string]any{"title": docTitle(data.Content, rel), "path": rel, "excerpt": excerpt,
			"provenance": map[string]any{"source": "project-guidance", "scope": "project", "package": nil, "requestedVersion": nil, "servedVersion": nil, "repo": nil, "tag": nil, "commit": nil, "match": "exact", "offline": false}}, score, rel})
		if len(hits) > 8000 {
			return fmt.Errorf("project guidance exceeds 8000 files")
		}
		return nil
	}
	entries, err := os.ReadDir(app)
	if err != nil {
		return nil, err
	}
	if len(entries) > 50000 {
		return nil, fmt.Errorf("project guidance exceeds directory entry limit")
	}
	for _, entry := range entries {
		if !entry.IsDir() {
			if err := read(filepath.Join(app, entry.Name())); err != nil {
				return nil, err
			}
		}
	}
	for _, name := range []string{"docs", ".agents/docs"} {
		root := filepath.Join(app, filepath.FromSlash(name))
		if !directoryExists(root) {
			continue
		}
		err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if err := ctx.Err(); err != nil {
				return err
			}
			visited++
			rel, _ := filepath.Rel(app, path)
			if visited > 50000 || len(strings.Split(filepath.ToSlash(rel), "/")) > 32 {
				return fmt.Errorf("project guidance exceeds traversal limit")
			}
			if entry.IsDir() {
				if path != root && (strings.HasPrefix(entry.Name(), ".") || entry.Name() == "private" || entry.Name() == "secrets" || entry.Name() == "node_modules") {
					return filepath.SkipDir
				}
				return nil
			}
			return read(path)
		})
		if err != nil {
			return nil, err
		}
	}
	slices.SortStableFunc(hits, func(a, b docsHit) int {
		if a.Score > b.Score {
			return -1
		}
		if a.Score < b.Score {
			return 1
		}
		return strings.Compare(a.Key, b.Key)
	})
	if len(hits) > 5 {
		hits = hits[:5]
	}
	result := []any{}
	for _, hit := range hits {
		result = append(result, hit.Data)
	}
	return result, nil
}
