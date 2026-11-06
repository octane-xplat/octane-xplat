package code

import (
	"context"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/source"
	"math"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode"
)

func IndexStatus(workspace *project.WorkspaceContext, ctx context.Context) any {
	coverage, count := []any{}, 0
	for _, corpus := range codeCorpora(workspace) {
		files, truncated, err := corpusFiles(ctx, corpus, "")
		if err != nil {
			return map[string]any{"state": "unavailable", "detail": err.Error()}
		}
		entry := map[string]any{"corpus": corpus.Corpus, "root": corpus.Root, "files": len(files)}
		if corpus.Label != "" {
			entry["root"] = corpus.Label
		}
		if corpus.Package != "" {
			entry["package"] = corpus.Package
		}
		if truncated {
			entry["truncated"] = true
		}
		coverage = append(coverage, entry)
		count += len(files)
	}
	return map[string]any{"state": "ready", "detail": "Exact search reads current source; local intent search builds a bounded index on demand.", "files": count, "corpora": coverage, "freshness": sourceTreeMarker(ctx, workspace), "semantic": map[string]any{"state": "not-built"}}
}

func sourceProvenance(corpus codeCorpus) map[string]any {
	value := map[string]any{"source": "app-source", "scope": "project", "package": nil, "requestedVersion": nil, "servedVersion": nil, "repo": nil, "tag": nil, "commit": nil, "match": "exact", "offline": false}
	if corpus.Corpus == "framework" {
		value["source"], value["package"] = "framework-source", corpus.Package
		if corpus.Version != "" {
			value["requestedVersion"] = corpus.Version
		}
		value["servedVersion"] = "development"
		if corpus.Kind == "registry" {
			value["scope"], value["servedVersion"] = "release", corpus.Version
		}
	}
	return value
}
func codeReference(file codeFile) string {
	key := file.Corpus.Package + "/" + file.Relative
	if file.Corpus.Corpus == "app" {
		key, _ = filepath.Rel(file.Corpus.Base, file.Absolute)
		key = filepath.ToSlash(key)
	}
	return "xplat-code://" + file.Corpus.Corpus + "/" + key
}
func codeFreshness(data source.Data) map[string]any {
	return map[string]any{"state": "current", "contentHash": source.Hash(data.Content), "mtimeMs": data.Mtime}
}
func sourceTreeMarker(ctx context.Context, workspace *project.WorkspaceContext) string {
	probe, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	result, err := proc.RunProcess(probe, []string{"git", "-C", workspace.Root, "rev-parse", "HEAD"}, workspace.Root, project.DiagnosticEnvironment())
	if err != nil || result.ExitCode != 0 || result.Cancelled {
		return "not a git checkout — freshness is per-read mtimes"
	}
	head := strings.TrimSpace(result.Stdout)
	if len(head) < 12 {
		return "not a git checkout — freshness is per-read mtimes"
	}
	result, err = proc.RunProcess(probe, []string{"git", "-C", workspace.Root, "status", "--porcelain", "-uno"}, workspace.Root, project.DiagnosticEnvironment())
	if err != nil || result.ExitCode != 0 || result.Cancelled {
		return "not a git checkout — freshness is per-read mtimes"
	}
	dirty := len(strings.FieldsFunc(result.Stdout, func(r rune) bool { return r == '\n' }))
	if dirty > 0 {
		return fmt.Sprintf("HEAD %s, %d uncommitted", head[:12], dirty)
	}
	return "HEAD " + head[:12] + ", clean"
}

func ReadCodeCommand(ctx context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
	if failure := Selection(workspace); failure != nil {
		return nil, failure
	}
	corpus, key := cli.StringValue(values["corpus"]), cli.StringValue(values["path"])
	if corpus == "" {
		corpus = "app"
	}
	if ref := cli.StringValue(values["ref"]); ref != "" {
		rest, valid := strings.CutPrefix(ref, "xplat-code://")
		var slash bool
		corpus, key, slash = strings.Cut(rest, "/")
		if !valid || !slash || key == "" || (corpus != "app" && corpus != "framework") {
			return nil, cli.Invalid("Invalid code reference.")
		}
	}
	if key == "" {
		return nil, cli.Invalid("Pass --ref or --path to read current source.")
	}
	if pkg := cli.StringValue(values["package"]); corpus == "framework" && pkg != "" && !strings.HasPrefix(key, pkg+"/") {
		key = pkg + "/" + key
	}
	file, reason := resolveCodeFile(codeCorpora(workspace), corpus, key)
	if reason != "" {
		return nil, sourceFailure(reason, corpus, key)
	}
	data, reason := scopedSource(file.Corpus, file.Absolute)
	if reason != "" {
		return nil, sourceFailure(reason, corpus, key)
	}
	page := source.Page(data.Content, values)
	page["ref"], page["corpus"], page["path"] = codeReference(file), corpus, file.Relative
	if file.Corpus.Package != "" {
		page["package"] = file.Corpus.Package
	}
	page["freshness"], page["provenance"], page["tree"] = codeFreshness(data), sourceProvenance(file.Corpus), sourceTreeMarker(ctx, workspace)
	return page, nil
}

type codeHit struct {
	File          codeFile
	Hash          string
	Mtime         float64
	Score         float64
	Line, EndLine int
	Excerpt       string
	Semantic      bool
}

func exactCodeTokens(text string) []string {
	return strings.FieldsFunc(strings.ToLower(text), func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsNumber(r) && r != '_' && r != '$' })
}

var codeIdentifier = regexp.MustCompile(`^[A-Za-z_$][A-Za-z0-9_$]*$`)

func exactCodeHit(file codeFile, data source.Data, query string) *codeHit {
	needle, score := strings.ToLower(strings.TrimSpace(query)), float64(0)
	tokens := exactCodeTokens(needle)
	hay := strings.ToLower(file.Relative + "\n" + data.Content)
	for _, token := range tokens {
		if strings.Contains(hay, token) {
			score++
		}
	}
	if score == 0 {
		return nil
	}
	if strings.Contains(hay, needle) {
		score += 100
	}
	if codeIdentifier.MatchString(strings.TrimSpace(query)) {
		if boundary, err := regexp.Compile(`\b` + regexp.QuoteMeta(strings.TrimSpace(query)) + `\b`); err == nil && boundary.MatchString(data.Content) {
			score += 25
		}
	}
	if strings.Contains(strings.ToLower(file.Relative), needle) {
		score += 10
	}
	lower := strings.ToLower(data.Content)
	at := strings.Index(lower, needle)
	if at < 0 {
		for _, token := range tokens {
			if at = strings.Index(lower, token); at >= 0 {
				break
			}
		}
	}
	if at < 0 {
		at = 0
	}
	// Lowercasing can change byte length; count the lower text's line boundaries.
	line := strings.Count(lower[:at], "\n")
	lines := strings.Split(data.Content, "\n")
	start, end := max(0, line-2), min(len(lines), line+8)
	excerpt := strings.Join(lines[start:end], "\n")
	if units := source.TextUnits(excerpt); len(units) > 900 {
		excerpt = source.StringFromUnits(units[:900])
	}
	return &codeHit{File: file, Hash: source.Hash(data.Content), Mtime: data.Mtime, Score: score, Line: start + 1, EndLine: end, Excerpt: strings.TrimSpace(excerpt)}
}

// Retain only the best requested exact hits. A broad query must not hold every
// matching source file in memory while scanning an installed framework tree.
func keepCodeHit(hits []codeHit, hit codeHit, limit int) []codeHit {
	at := 0
	for at < len(hits) && hits[at].Score >= hit.Score {
		at++
	}
	if at >= limit {
		return hits
	}
	hits = slices.Insert(hits, at, hit)
	return hits[:min(len(hits), limit)]
}

func encodeCodeHit(hit codeHit) map[string]any {
	matchType := "exact"
	if hit.Semantic {
		matchType = "semantic"
	}
	result := map[string]any{"ref": codeReference(hit.File), "corpus": hit.File.Corpus.Corpus, "path": hit.File.Relative, "line": hit.Line, "endLine": hit.EndLine, "excerpt": hit.Excerpt, "matchType": matchType, "score": hit.Score, "freshness": map[string]any{"state": "current", "contentHash": hit.Hash, "mtimeMs": hit.Mtime}, "provenance": sourceProvenance(hit.File.Corpus)}
	if hit.File.Corpus.Package != "" {
		result["package"] = hit.File.Corpus.Package
	}
	if hit.Semantic {
		result["indexRevision"] = 1
	}
	return result
}

func SearchCodeCommand(ctx context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
	if failure := Selection(workspace); failure != nil {
		return nil, failure
	}
	query := strings.TrimSpace(cli.StringValue(values["query"]))
	if query == "" {
		return nil, cli.Invalid("query is required")
	}
	mode, selected := cli.StringValue(values["mode"]), cli.StringValue(values["corpus"])
	limit := int(source.NumberOption(values, "limit", 10))
	files, coverage := []codeFile{}, []any{}
	for _, corpus := range codeCorpora(workspace) {
		if selected != "" && selected != "all" && corpus.Corpus != selected {
			continue
		}
		if pkg := cli.StringValue(values["package"]); pkg != "" && corpus.Package != pkg {
			continue
		}
		found, truncated, err := corpusFiles(ctx, corpus, cli.StringValue(values["platform"]))
		if err != nil {
			return nil, &cli.Error{Code: "execution_failure", Message: err.Error()}
		}
		entry := map[string]any{"corpus": corpus.Corpus, "root": corpus.Root, "files": len(found)}
		if corpus.Label != "" {
			entry["root"] = corpus.Label
		}
		if corpus.Package != "" {
			entry["package"] = corpus.Package
		}
		if truncated {
			entry["truncated"] = true
		}
		coverage = append(coverage, entry)
		files = append(files, found...)
	}
	hits, documents := []codeHit{}, []codeDocument{}
	indexBytes, indexTruncated := 0, false
	for _, file := range files {
		if ctx.Err() != nil {
			return nil, &cli.Error{Code: "cancelled", Message: ctx.Err().Error()}
		}
		data, reason := scopedSource(file.Corpus, file.Absolute)
		if reason != "" {
			continue
		}
		if mode != "semantic" {
			if hit := exactCodeHit(file, data, query); hit != nil {
				hits = keepCodeHit(hits, *hit, limit)
			}
		}
		if mode != "exact" {
			if len(documents) >= 4000 || indexBytes+len(data.Content) > 8<<20 {
				indexTruncated = true
				continue
			}
			indexBytes += len(data.Content)
			documents = append(documents, codeDocument{file, data})
		}
	}
	slices.SortStableFunc(hits, func(a, b codeHit) int {
		if a.Score > b.Score {
			return -1
		}
		if a.Score < b.Score {
			return 1
		}
		return 0
	})
	semantic := map[string]any{"state": "not-requested"}
	if mode != "exact" {
		semanticHits, truncated := semanticCodeHits(ctx, documents, query)
		semantic = map[string]any{"state": "ready", "revision": 1, "files": len(documents), "truncated": indexTruncated || truncated, "detail": "Local intent index built from the current bounded source snapshot; no remote service or persistent stale entries."}
		seen := map[string]bool{}
		for _, hit := range hits {
			seen[codeReference(hit.File)+fmt.Sprint(":", hit.Line)] = true
		}
		for _, hit := range semanticHits {
			if !seen[codeReference(hit.File)+fmt.Sprint(":", hit.Line)] {
				hits = append(hits, hit)
			}
		}
	}
	result := []any{}
	dropped := 0
	for _, hit := range hits {
		if len(result) >= limit {
			break
		}
		current, reason := scopedSource(hit.File.Corpus, hit.File.Absolute)
		if reason != "" || source.Hash(current.Content) != hit.Hash {
			dropped++
			continue
		}
		hit.Mtime = current.Mtime
		result = append(result, encodeCodeHit(hit))
	}
	if dropped > 0 {
		semantic["droppedStale"] = dropped
	}
	return map[string]any{"mode": mode, "results": result, "semantic": semantic, "coverage": coverage, "tree": sourceTreeMarker(ctx, workspace)}, nil
}

type codeDocument struct {
	File codeFile
	Data source.Data
}
type codeChunk struct {
	Hit    codeHit
	Counts map[string]float64
}

func identifierTokens(text string) []string {
	result := []string{}
	for _, word := range strings.FieldsFunc(text, func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsNumber(r) && r != '_' && r != '$' }) {
		runes, start := []rune(word), 0
		for index := 0; index <= len(runes); index++ {
			boundary := index == len(runes) || runes[index] == '_'
			if index > start && index < len(runes) {
				boundary = boundary || ((unicode.IsLower(runes[index-1]) || unicode.IsDigit(runes[index-1])) && unicode.IsUpper(runes[index])) || (unicode.IsUpper(runes[index-1]) && unicode.IsUpper(runes[index]) && index+1 < len(runes) && unicode.IsLower(runes[index+1]))
			}
			if boundary {
				if index-start >= 2 {
					result = append(result, strings.ToLower(string(runes[start:index])))
				}
				start = index
				if index < len(runes) && runes[index] == '_' {
					start++
				}
			}
		}
		if len(runes) >= 2 && codeIdentifier.MatchString(word) {
			result = append(result, strings.ToLower(word))
		}
	}
	return result
}

func semanticCodeHits(ctx context.Context, documents []codeDocument, query string) ([]codeHit, bool) {
	chunks, frequencies := []codeChunk{}, map[string]float64{}
	truncated := false
	for _, document := range documents {
		if ctx.Err() != nil {
			return nil, true
		}
		lines := strings.Split(document.Data.Content, "\n")
		hash := source.Hash(document.Data.Content)
		for start := 0; start < len(lines); start += 40 {
			if ctx.Err() != nil {
				return nil, true
			}
			if len(chunks) >= 15000 {
				truncated = true
				break
			}
			end := min(start+48, len(lines))
			text := strings.Join(lines[start:end], "\n")
			counts := map[string]float64{}
			for _, token := range identifierTokens(document.File.Relative + "\n" + text) {
				counts[token]++
			}
			for token := range counts {
				frequencies[token]++
			}
			excerpt := text
			if units := source.TextUnits(excerpt); len(units) > 900 {
				excerpt = source.StringFromUnits(units[:900])
			}
			chunks = append(chunks, codeChunk{codeHit{File: document.File, Hash: hash, Mtime: document.Data.Mtime, Line: start + 1, EndLine: end, Excerpt: strings.TrimSpace(excerpt), Semantic: true}, counts})
			if end == len(lines) {
				break
			}
		}
		if truncated {
			break
		}
	}
	idf := func(token string) float64 { return math.Log(1 + float64(len(chunks))/(1+frequencies[token])) }
	queryCounts := map[string]float64{}
	for _, token := range identifierTokens(query) {
		queryCounts[token]++
	}
	queryNorm := float64(0)
	for token, count := range queryCounts {
		queryNorm += math.Pow(count*idf(token), 2)
	}
	queryNorm = math.Sqrt(queryNorm)
	hits := []codeHit{}
	for _, chunk := range chunks {
		if ctx.Err() != nil {
			return nil, true
		}
		dot, norm := float64(0), float64(0)
		for token, count := range chunk.Counts {
			weight := count * idf(token)
			norm += weight * weight
			dot += weight * queryCounts[token] * idf(token)
		}
		if dot <= 0 || norm == 0 || queryNorm == 0 {
			continue
		}
		chunk.Hit.Score = math.Round(dot/(math.Sqrt(norm)*queryNorm)*1000) / 1000
		hits = append(hits, chunk.Hit)
	}
	slices.SortStableFunc(hits, func(a, b codeHit) int {
		if a.Score > b.Score {
			return -1
		}
		if a.Score < b.Score {
			return 1
		}
		return 0
	})
	return hits, truncated
}
