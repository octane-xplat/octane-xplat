package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"
)

type docsRequest struct {
	Workspace  string         `json:"workspace"`
	App        string         `json:"app"`
	Values     map[string]any `json:"values"`
	Repository string         `json:"repository,omitempty"` // explicit offline mirror/fixture override; empty selects the canonical repository
}
type docsBound struct {
	Root       string
	Provenance map[string]any
}

func init() {
	commandHandlers["docs read"] = docsCommand("docs-read")
	commandHandlers["docs search"] = docsCommand("docs-search")
	if nativeIndexSupported() {
		commandHandlers["docs index"] = docsCommand("docs-index")
	}
}
func docsCacheRoot() (string, error) {
	if value := os.Getenv("XPLAT_MCP_CACHE"); value != "" {
		return filepath.Abs(filepath.Join(value, "go-v1"))
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".cache/octane-xplat/mcp-docs/go-v1"), nil
}
func docsCommand(operation string) commandHandler {
	return func(ctx context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
		if operation == "docs-read" && stringValue(values["ref"]) == "" && (stringValue(values["package"]) == "" || stringValue(values["path"]) == "") {
			return nil, invalid("Pass --ref from docs search, or --package with --path.", "Run `xplat docs search` to get a versioned ref.")
		}
		app, failure := workspace.docsSelection()
		if failure != nil {
			return nil, failure
		}
		cache, err := docsCacheRoot()
		if err != nil {
			return nil, executionFailure(err)
		}
		timeout := 2 * time.Minute
		if operation == "docs-index" {
			timeout = 10 * time.Minute
		}
		ctx, cancel := context.WithTimeout(ctx, timeout)
		defer cancel()
		data, err := nativeCompute(ctx, cache, operation, docsRequest{Workspace: workspace.Root, App: app.Root, Values: values, Repository: os.Getenv("XPLAT_DOCS_REPO")})
		if err != nil {
			return nil, executionFailure(err)
		}
		return data, nil
	}
}

func docsFallback(result map[string]any, pkg docsPackage) map[string]any {
	if result["status"] != "unavailable" {
		return result
	}
	if pkg.InstallPath != nil {
		result["fallback"] = map[string]any{"kind": "installed-source", "path": *pkg.InstallPath}
	} else {
		result["fallback"] = map[string]any{"kind": "none", "detail": "package is not installed; lockfile entry is provisional"}
	}
	return result
}
func bindDocs(ctx context.Context, operation string, input docsRequest, pkg docsPackage, version string, explicit bool) (docsBound, map[string]any, error) {
	if version == "" {
		version = pkg.Version
	}
	outside := explicit || (version != pkg.Version && !(pkg.Kind == "linked" && version == "development"))
	if !outside && pkg.Kind == "linked" {
		root := ""
		if pkg.InstallPath != nil {
			root = developmentDocsRoot(*pkg.InstallPath)
		}
		prov := map[string]any{"source": "development-docs", "scope": "release", "package": pkg.Name, "requestedVersion": version, "servedVersion": "development",
			"repo": nil, "tag": nil, "commit": nil, "match": "exact", "offline": false}
		if root == "" {
			prov["match"] = "unavailable"
			prov["servedVersion"] = nil
			return docsBound{}, docsFallback(map[string]any{"status": "unavailable", "reason": "docs-absent", "provenance": prov}, pkg), nil
		}
		return docsBound{root, prov}, nil, nil
	}
	repository := input.Repository
	if repository == "" {
		repository = releaseRepository
	}
	request := snapshotRequest{Cache: filepath.Dir(operation), Repository: repository, Package: pkg.Name, Version: version}
	result, err := ensureDocSnapshot(ctx, operation, request)
	if err != nil {
		return docsBound{}, nil, err
	}
	if result["status"] != "bound" {
		return docsBound{}, docsFallback(result, pkg), nil
	}
	prov := snapshotProvenance(request, stringValue(result["tag"]), "exact")
	prov["servedVersion"], prov["commit"], prov["offline"] = version, result["commit"], result["offline"]
	if outside {
		prov["match"] = "outside-installed-binding"
	}
	return docsBound{stringValue(result["dir"]), prov}, nil, nil
}
func docForPackage(path, name string) bool {
	corpus := docCorpus(path)
	if corpus == "" {
		return false
	}
	if corpus == "readme" {
		mapping := releaseMapping(name, "", "")
		return mapping != nil && path == mapping["dir"]+"/README.md"
	}
	if corpus == "changelog" {
		return (name == "tsrx-typegen") == (path == "packages/tsrx-typegen/CHANGELOG.md")
	}
	return true
}

func executeDocs(ctx context.Context, operation, method string, input docsRequest) (any, error) {
	install, err := resolveDocsInstallation(ctx, input.Workspace, input.App)
	if err != nil {
		return nil, err
	}
	if len(install.Packages) > 256 {
		return nil, errors.New("documentation binding exceeds 256 packages")
	}
	if method == "docs-read" {
		return readBoundDoc(ctx, operation, input, install)
	}
	if method == "docs-index" {
		return indexBoundDocs(ctx, operation, input, install)
	}
	return searchBoundDocs(ctx, operation, input, install)
}
func docsTargets(input docsRequest, install docsInstallation) ([]docsPackage, bool) {
	name, version := stringValue(input.Values["package"]), stringValue(input.Values["version"])
	targets := []docsPackage{}
	for _, pkg := range install.Packages {
		if name == "" || name == pkg.Name {
			targets = append(targets, pkg)
		}
	}
	if len(targets) == 0 && name != "" && version != "" {
		return []docsPackage{{Name: name, Version: version, Kind: "registry", Source: "explicit-request"}}, true
	}
	return targets, false
}
func readBoundDoc(ctx context.Context, operation string, input docsRequest, install docsInstallation) (any, error) {
	name, path, version := stringValue(input.Values["package"]), stringValue(input.Values["path"]), stringValue(input.Values["version"])
	if ref := stringValue(input.Values["ref"]); ref != "" {
		var valid bool
		var refVersion string
		name, refVersion, path, valid = parseDocReference(ref)
		if !valid {
			return map[string]any{"status": "invalid-ref", "ref": ref}, nil
		}
		if version == "" {
			version = refVersion
		}
	}
	var pkg docsPackage
	found := false
	for _, installed := range install.Packages {
		if installed.Name == name {
			pkg, found = installed, true
			break
		}
	}
	if !found {
		if version == "" {
			return map[string]any{"status": "unavailable", "reason": "package-not-installed", "package": name}, nil
		}
		pkg = docsPackage{Name: name, Version: version, Kind: "registry", Source: "explicit-request"}
	}
	bound, failure, err := bindDocs(ctx, operation, input, pkg, version, !found)
	if err != nil || failure != nil {
		return failure, err
	}
	page, reason := docPage(bound.Root, path, input.Values)
	if reason != "" || !docForPackage(path, pkg.Name) {
		prov := copyFields(bound.Provenance)
		prov["match"], prov["servedVersion"] = "unavailable", nil
		return docsFallback(map[string]any{"status": "unavailable", "reason": "docs-absent", "provenance": prov}, pkg), nil
	}
	result := page.(map[string]any)
	result["ref"], result["provenance"], result["bindingRevision"] = docReference(pkg.Name, stringValue(bound.Provenance["servedVersion"]), path), bound.Provenance, 1
	return result, nil
}
func copyFields(value map[string]any) map[string]any {
	out := map[string]any{}
	for key, item := range value {
		out[key] = item
	}
	return out
}

type docsHit struct {
	Data  map[string]any
	Score float64
	Key   string
}

func docExcerpt(content, query string) (string, int) {
	needle := strings.ToLower(query)
	at := strings.Index(strings.ToLower(content), needle)
	if at < 0 {
		at = 0
	}
	start := strings.LastIndex(content[:at], "\n\n")
	if start < 0 {
		start = 0
	}
	end := at + 480
	if end > len(content) {
		end = len(content)
	}
	return strings.Clone(strings.TrimSpace(strings.ToValidUTF8(content[start:end], "\ufffd"))), strings.Count(content[:at], "\n") + 1
}
func scoreDocs(ctx context.Context, documents []docFile, query, mode, platform, corpus, name string, limit int) ([]docsHit, error) {
	needle, tokens := strings.ToLower(strings.TrimSpace(query)), strings.Fields(strings.ToLower(query))
	hits := []docsHit{}
	chunkCount := 0
	for _, doc := range documents {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		if (corpus != "" && doc.Corpus != corpus) || !docForPackage(doc.Path, name) {
			continue
		}
		if mode == "exact" && doc.Corpus != "changelog" {
			if platform != "" && !slices.Contains(docPlatforms(doc.Path, doc.Content), platform) {
				continue
			}
			hay := strings.ToLower(doc.Path + "\n" + docTitle(doc.Content, doc.Path) + "\n" + doc.Content)
			score := 0.0
			for _, token := range tokens {
				if strings.Contains(hay, token) {
					score++
				}
			}
			if score == 0 {
				continue
			}
			if strings.Contains(hay, needle) {
				score += 100
			}
			if strings.Contains(strings.ToLower(doc.Path), needle) {
				score += 10
			}
			excerpt, line := docExcerpt(doc.Content, needle)
			hits = append(hits, docsHit{map[string]any{"path": doc.Path, "corpus": doc.Corpus, "title": docTitle(doc.Content, doc.Path), "platforms": docPlatforms(doc.Path, doc.Content), "excerpt": excerpt, "line": line}, score, fmt.Sprintf("%s:%d", doc.Path, line)})
			continue
		}
		chunks, err := markdownChunks(doc)
		if err != nil {
			return nil, err
		}
		chunkCount += len(chunks)
		if chunkCount > maxDocChunks {
			return nil, errors.New("documentation exceeds 20000 chunks")
		}
		for _, chunk := range chunks {
			if platform != "" && !slices.Contains(docPlatforms(doc.Path, chunk.Content), platform) {
				continue
			}
			hay := strings.ToLower(chunk.Path + "\n" + chunk.Title + "\n" + chunk.Heading + "\n" + chunk.Content)
			score := 0.0
			for _, token := range tokens {
				if strings.Contains(hay, token) {
					score++
				}
			}
			if score == 0 {
				continue
			}
			if strings.Contains(hay, needle) {
				score += 100
			}
			excerpt, _ := docExcerpt(chunk.Content, needle)
			data := map[string]any{"path": chunk.Path, "corpus": chunk.Corpus, "title": chunk.Title, "platforms": docPlatforms(doc.Path, chunk.Content), "excerpt": excerpt, "line": chunk.Line, "endLine": chunk.EndLine, "heading": chunk.Heading}
			if chunk.ReleaseVersion != "" {
				data["releaseVersion"] = chunk.ReleaseVersion
			}
			if chunk.ReleaseDate != "" {
				data["releaseDate"] = chunk.ReleaseDate
			}
			hits = append(hits, docsHit{data, score, chunk.Key})
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
	if len(hits) > limit {
		hits = hits[:limit]
	}
	return hits, nil
}

func searchBoundDocs(ctx context.Context, operation string, input docsRequest, install docsInstallation) (any, error) {
	embedder := &docsEmbedder{cache: filepath.Dir(operation), operation: operation}
	defer embedder.close()
	values := input.Values
	query, mode := stringValue(values["query"]), stringValue(values["mode"])
	if mode == "" {
		mode = "hybrid"
	}
	limit := int(numberOption(values, "limit", 10))
	if limit < 1 || limit > 50 {
		return nil, errors.New("documentation limit must be within 1..50")
	}
	targets, explicit := docsTargets(input, install)
	results, unavailable, conflicts, retrieval := []any{}, []any{}, []any{}, []any{}
	var lastDocuments []docFile
	lastRoot := ""
	groups, packageGroup := map[string][]string{}, map[string]string{}
	for _, pkg := range targets {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		bound, failure, err := bindDocs(ctx, operation, input, pkg, stringValue(values["version"]), explicit)
		if err != nil {
			return nil, err
		}
		if failure != nil {
			if failure["status"] == "tag-conflict" {
				conflicts = append(conflicts, failure)
			} else {
				unavailable = append(unavailable, failure)
			}
			continue
		}
		if lastRoot != bound.Root {
			lastDocuments, err = listDocuments(ctx, bound.Root)
			if err != nil {
				return nil, err
			}
			lastRoot = bound.Root
		}
		group := bound.Root
		if commit := stringValue(bound.Provenance["commit"]); commit != "" {
			group = stringValue(bound.Provenance["repo"]) + "\x00" + commit
		}
		groups[group], packageGroup[pkg.Name] = append(groups[group], pkg.Name), group
		entry := map[string]any{"package": pkg.Name, "requested": mode, "used": "exact"}
		var hits []docsHit
		if mode == "exact" {
			hits, err = scoreDocs(ctx, lastDocuments, query, mode, stringValue(values["platform"]), stringValue(values["corpus"]), pkg.Name, limit)
		} else {
			hits, entry, err = indexedDocsHits(ctx, embedder, bound, lastDocuments, pkg, values, limit)
		}
		retrieval = append(retrieval, entry)
		if err != nil {
			return nil, err
		}
		if len(hits) == 0 && !directoryExists(filepath.Join(bound.Root, "docs")) {
			prov := copyFields(bound.Provenance)
			prov["match"], prov["servedVersion"] = "unavailable", nil
			unavailable = append(unavailable, docsFallback(map[string]any{"status": "unavailable", "reason": "docs-absent", "provenance": prov}, pkg))
		}
		for _, hit := range hits {
			hit.Data["ref"], hit.Data["provenance"] = docReference(pkg.Name, stringValue(bound.Provenance["servedVersion"]), stringValue(hit.Data["path"])), copyFields(bound.Provenance)
			if pkg.Source == "lockfile-provisional" {
				hit.Data["provisional"] = true
			}
			results = append(results, hit.Data)
		}
	}
	for _, result := range results {
		prov := object(object(result)["provenance"])
		if set := groups[packageGroup[stringValue(prov["package"])]]; len(set) > 1 {
			prov["verifiedCompatibleSet"] = set
		}
	}
	guidance, err := projectDocsGuidance(ctx, input.App, query)
	if err != nil {
		return nil, err
	}
	current, err := resolveDocsInstallation(ctx, input.Workspace, input.App)
	changed := err != nil || current.Fingerprint != install.Fingerprint
	return map[string]any{"bindingRevision": 1, "bindingChangedDuring": changed, "results": results, "unavailable": unavailable, "conflicts": conflicts, "retrieval": retrieval, "projectGuidance": guidance}, nil
}
