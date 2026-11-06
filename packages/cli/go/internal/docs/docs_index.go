package docs

import (
	"context"
	"crypto/sha256"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/model"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"math"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"unicode/utf8"
)

type cachedEmbedding struct {
	Version  int       `json:"version"`
	Model    string    `json:"model"`
	Text     string    `json:"text"`
	Checksum string    `json:"checksum"`
	Values   []float64 `json:"values"`
}

const maxEmbeddingInputBytes = 64 << 10

func embeddingText(chunk DocChunk) string {
	text := chunk.Title + "\n" + chunk.Heading + "\n" + chunk.Content
	if len(text) <= maxEmbeddingInputBytes {
		return text
	}
	end := maxEmbeddingInputBytes
	for end > 0 && !utf8.RuneStart(text[end]) {
		end--
	}
	// Keep the complete section for lexical retrieval and page reads. A bounded
	// model preview avoids retaining a multi-MiB fenced block for a 512-token run.
	return strings.Clone(text[:end])
}
func truncatedEmbeddingInputs(chunks []DocChunk) int {
	count := 0
	for _, chunk := range chunks {
		if len(chunk.Title)+len(chunk.Heading)+len(chunk.Content)+2 > maxEmbeddingInputBytes {
			count++
		}
	}
	return count
}
func embeddingPath(model, text string) string {
	hash := osfs.DigestText(text)
	return "embeddings/" + osfs.DigestText(model) + "/" + hash[:2] + "/" + hash + ".json"
}
func vectorChecksum(values []float64) string {
	hash := sha256.New()
	var bytes [8]byte
	for _, value := range values {
		binary.LittleEndian.PutUint64(bytes[:], math.Float64bits(value))
		_, _ = hash.Write(bytes[:])
	}
	return fmt.Sprintf("%x", hash.Sum(nil))
}
func validEmbedding(values []float64) bool {
	if len(values) != 384 {
		return false
	}
	norm := 0.0
	for _, value := range values {
		if math.IsNaN(value) || math.IsInf(value, 0) {
			return false
		}
		norm += value * value
	}
	return math.Abs(norm-1) < 0.0001
}
func readEmbedding(cache, model, text string) ([]float64, string) {
	data, err := osfs.MetadataBytes(filepath.Join(cache, filepath.FromSlash(embeddingPath(model, text))), 64<<10)
	if os.IsNotExist(err) {
		return nil, "index-not-ready"
	}
	if err != nil {
		return nil, "index-invalid"
	}
	var entry cachedEmbedding
	if json.Unmarshal(data, &entry) != nil || entry.Version != 1 || entry.Model != model || entry.Text != osfs.DigestText(text) || !validEmbedding(entry.Values) || entry.Checksum != vectorChecksum(entry.Values) {
		return nil, "index-invalid"
	}
	return entry.Values, ""
}
func writeEmbedding(root *os.Root, cache, operation, modelID, text string, values []float64) error {
	if !validEmbedding(values) {
		return errors.New("native model returned an invalid normalized 384-dimensional vector")
	}
	data, err := json.Marshal(cachedEmbedding{1, modelID, osfs.DigestText(text), vectorChecksum(values), values})
	if err != nil {
		return err
	}
	staging := filepath.Join(operation, "embedding-"+osfs.Identity()+".json")
	if err = osfs.PrivateFile(staging, data); err != nil {
		return err
	}
	return model.PublishAsset(root, cache, staging, embeddingPath(modelID, text))
}

type docsEmbedder struct {
	cache, operation string
	tokenizer        *model.Tokenizer
	session          model.EmbeddingSession
	query            string
	queryVector      []float64
}

func (embedder *docsEmbedder) close() {
	if embedder.session != nil {
		embedder.session.Close()
		embedder.session = nil
	}
}
func (embedder *docsEmbedder) load(ctx context.Context, download bool) error {
	if embedder.session != nil {
		return nil
	}
	input, err := model.PrepareModelAssets(ctx, embedder.cache, embedder.operation, download)
	if err != nil {
		return err
	}
	tokens, err := model.NewTokenizer(input.Directory)
	if err != nil {
		return err
	}
	session, err := model.NewEmbeddingSession(input)
	if err != nil {
		return err
	}
	_, version, err := model.SelectedRuntime()
	if err != nil || !strings.HasPrefix(session.Engine(), "onnxruntime-"+version+":") {
		session.Close()
		return errors.New("loaded native runtime differs from its pinned version")
	}
	embedder.tokenizer, embedder.session = tokens, session
	return nil
}
func (embedder *docsEmbedder) embed(ctx context.Context, texts []string) ([][]float64, error) {
	if embedder.session == nil {
		return nil, errors.New("native model session is not prepared")
	}
	sequences := make([][]int64, len(texts))
	for i, text := range texts {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		sequences[i] = embedder.tokenizer.Encode(text)
	}
	return embedder.session.Embed(ctx, sequences)
}
func (embedder *docsEmbedder) queryEmbedding(ctx context.Context, query string) ([]float64, error) {
	if embedder.queryVector != nil && embedder.query == query {
		return embedder.queryVector, nil
	}
	if err := embedder.load(ctx, false); err != nil {
		return nil, err
	}
	vectors, err := embedder.embed(ctx, []string{query})
	if err != nil {
		return nil, err
	}
	if len(vectors) != 1 || !validEmbedding(vectors[0]) {
		return nil, errors.New("native query embedding is invalid")
	}
	embedder.query, embedder.queryVector = query, vectors[0]
	return embedder.queryVector, nil
}

func docsChunks(ctx context.Context, documents []DocFile, name, corpus, platform string) ([]DocChunk, error) {
	chunks := []DocChunk{}
	totalChunks, totalBytes := 0, 0
	for _, doc := range documents {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		if !docForPackage(doc.Path, name) || (corpus != "" && doc.Corpus != corpus) {
			continue
		}
		items, err := MarkdownChunks(doc)
		if err != nil {
			return nil, err
		}
		totalChunks += len(items)
		if totalChunks > maxDocChunks {
			return nil, errors.New("documentation exceeds 20000 chunks")
		}
		for _, chunk := range items {
			size := len(chunk.Title) + len(chunk.Heading) + len(chunk.Content) + 2
			totalBytes += size
			if totalBytes > maxDocsBytes {
				return nil, errors.New("documentation embedding text exceeds 32 MiB")
			}
			if platform == "" || slices.Contains(docPlatforms(chunk.Path, chunk.Content), platform) {
				chunks = append(chunks, chunk)
			}
		}
	}
	return chunks, nil
}
func docsSnapshot(bound Bound, chunks []DocChunk) string {
	binding := bound.Root
	if commit := cli.StringValue(bound.Provenance["commit"]); commit != "" {
		binding = cli.StringValue(bound.Provenance["repo"]) + ":" + commit
	}
	hash := sha256.New()
	_, _ = fmt.Fprintln(hash, "sections-go-v1", binding)
	for _, chunk := range chunks {
		_, _ = fmt.Fprintln(hash, chunk.Key, chunk.Corpus, osfs.DigestText(embeddingText(chunk)))
	}
	return fmt.Sprintf("%x", hash.Sum(nil))
}
func prepareDocsIndex(ctx context.Context, embedder *docsEmbedder, bound Bound, chunks []DocChunk) (map[string]any, error) {
	modelID := model.NativeModelID()
	result := map[string]any{"status": "ready", "snapshot": docsSnapshot(bound, chunks), "model": modelID, "chunks": len(chunks), "embedded": 0, "provenance": bound.Provenance}
	if count := truncatedEmbeddingInputs(chunks); count > 0 {
		result["truncatedInputs"] = count
	}
	if len(chunks) == 0 {
		return result, nil
	}
	if err := embedder.load(ctx, true); err != nil {
		return nil, err
	}
	root, err := os.OpenRoot(embedder.cache)
	if err != nil {
		return nil, err
	}
	defer root.Close()
	if err = root.MkdirAll("embeddings", 0700); err != nil {
		return nil, err
	}
	unlock, err := osfs.LockCache(ctx, root, "embeddings/mutation.lock")
	if err != nil {
		return nil, err
	}
	defer unlock()
	missing := []string{}
	seen := map[string]bool{}
	for _, chunk := range chunks {
		text := embeddingText(chunk)
		key := osfs.DigestText(text)
		if seen[key] {
			continue
		}
		seen[key] = true
		if _, reason := readEmbedding(embedder.cache, modelID, text); reason != "" {
			missing = append(missing, text)
		}
	}
	embedded := 0
	for offset := 0; offset < len(missing); offset += 32 {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		batch := missing[offset:min(offset+32, len(missing))]
		vectors, err := embedder.embed(ctx, batch)
		if err != nil {
			return nil, err
		}
		if len(vectors) != len(batch) {
			return nil, errors.New("native embedding count mismatch")
		}
		for _, vector := range vectors {
			if !validEmbedding(vector) {
				return nil, errors.New("native model returned an invalid vector")
			}
		}
		for i, text := range batch {
			if err := ctx.Err(); err != nil {
				return nil, err
			}
			if err := writeEmbedding(root, embedder.cache, embedder.operation, modelID, text, vectors[i]); err != nil {
				return nil, err
			}
			embedded++
		}
	}
	result["embedded"] = embedded
	return result, nil
}
func indexBoundDocs(ctx context.Context, operation string, input Request, install Installation) (any, error) {
	embedder := &docsEmbedder{cache: filepath.Dir(operation), operation: operation}
	defer embedder.close()
	targets, explicit := docsTargets(input, install)
	results, unavailable := []any{}, []any{}
	lastRoot := ""
	var documents []DocFile
	for _, pkg := range targets {
		bound, failure, err := bindDocs(ctx, operation, input, pkg, cli.StringValue(input.Values["version"]), explicit)
		if err != nil {
			return nil, err
		}
		if failure != nil {
			unavailable = append(unavailable, failure)
			continue
		}
		if bound.Root != lastRoot {
			documents, err = ListDocuments(ctx, bound.Root)
			if err != nil {
				return nil, err
			}
			lastRoot = bound.Root
		}
		chunks, err := docsChunks(ctx, documents, pkg.Name, "", "")
		var result map[string]any
		if err == nil {
			result, err = prepareDocsIndex(ctx, embedder, bound, chunks)
		}
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		if err != nil {
			result = map[string]any{"status": "unavailable", "reason": "index-preparation-failed", "detail": err.Error(), "recovery": "Check pinned asset download access and cache permissions, then run docs index again. Completed embeddings are reusable.", "provenance": bound.Provenance}
		}
		results = append(results, result)
	}
	return map[string]any{"results": results, "unavailable": unavailable}, nil
}

type rankedChunk struct {
	index int
	score float64
}

func rankChunks(items []rankedChunk, chunks []DocChunk, limit int) []rankedChunk {
	slices.SortStableFunc(items, func(a, b rankedChunk) int {
		if a.score > b.score {
			return -1
		}
		if a.score < b.score {
			return 1
		}
		return strings.Compare(chunks[a.index].Key, chunks[b.index].Key)
	})
	if len(items) > limit {
		items = items[:limit]
	}
	return items
}
func chunkHit(chunk DocChunk, score float64, query string) docsHit {
	excerpt, _ := docExcerpt(chunk.Content, query)
	data := map[string]any{"path": chunk.Path, "corpus": chunk.Corpus, "title": chunk.Title, "platforms": docPlatforms(chunk.Path, chunk.Content), "excerpt": excerpt, "line": chunk.Line, "endLine": chunk.EndLine, "heading": chunk.Heading}
	if chunk.ReleaseVersion != "" {
		data["releaseVersion"] = chunk.ReleaseVersion
	}
	if chunk.ReleaseDate != "" {
		data["releaseDate"] = chunk.ReleaseDate
	}
	return docsHit{data, score, chunk.Key}
}
func indexedDocsHits(ctx context.Context, embedder *docsEmbedder, bound Bound, documents []DocFile, pkg docsPackage, values map[string]any, limit int) ([]docsHit, map[string]any, error) {
	query, mode := cli.StringValue(values["query"]), cli.StringValue(values["mode"])
	if mode == "" {
		mode = "hybrid"
	}
	chunks, err := docsChunks(ctx, documents, pkg.Name, cli.StringValue(values["corpus"]), cli.StringValue(values["platform"]))
	if err != nil {
		return nil, nil, err
	}
	modelID := model.NativeModelID()
	entry := map[string]any{"package": pkg.Name, "requested": mode, "used": "lexical", "snapshot": docsSnapshot(bound, chunks), "model": modelID}
	if count := truncatedEmbeddingInputs(chunks); count > 0 {
		entry["truncatedInputs"] = count
	}
	if mode == "hybrid" {
		entry["reason"] = "index-not-ready"
	}
	needle, tokens := strings.ToLower(strings.TrimSpace(query)), strings.Fields(strings.ToLower(query))
	lexical := []rankedChunk{}
	phrase := map[int]bool{}
	for i, chunk := range chunks {
		hay := strings.ToLower(chunk.Path + "\n" + chunk.Title + "\n" + chunk.Heading + "\n" + chunk.Content)
		score := 0.0
		for _, token := range tokens {
			if strings.Contains(hay, token) {
				score++
			}
		}
		if needle != "" && strings.Contains(hay, needle) {
			score += 100
			phrase[i] = true
		}
		if score > 0 {
			lexical = append(lexical, rankedChunk{i, score})
		}
	}
	candidates := max(50, limit*5)
	lexical = rankChunks(lexical, chunks, candidates)
	ranks := map[int]float64{}
	for rank, item := range lexical {
		ranks[item.index] = 1 / float64(61+rank)
	}
	if mode == "hybrid" && len(chunks) > 0 {
		vectors := make([][]float64, len(chunks))
		reason := ""
		for i, chunk := range chunks {
			if err := ctx.Err(); err != nil {
				return nil, nil, err
			}
			vectors[i], reason = readEmbedding(embedder.cache, modelID, embeddingText(chunk))
			if reason != "" {
				break
			}
		}
		if reason != "" {
			entry["reason"] = reason
		} else {
			q, err := embedder.queryEmbedding(ctx, query)
			if ctx.Err() != nil {
				return nil, nil, ctx.Err()
			}
			if err != nil {
				entry["reason"] = "model-unavailable"
			} else {
				semantic := []rankedChunk{}
				for i, vector := range vectors {
					score := 0.0
					for j, value := range vector {
						score += value * q[j]
					}
					if score >= 0.2 {
						semantic = append(semantic, rankedChunk{i, score})
					}
				}
				semantic = rankChunks(semantic, chunks, candidates)
				for rank, item := range semantic {
					ranks[item.index] += 1 / float64(61+rank)
				}
				entry["used"] = "hybrid"
				delete(entry, "reason")
			}
		}
	}
	for index := range phrase {
		ranks[index] += 1
	}
	ranked := []rankedChunk{}
	for index, score := range ranks {
		ranked = append(ranked, rankedChunk{index, score})
	}
	ranked = rankChunks(ranked, chunks, limit)
	hits := make([]docsHit, 0, len(ranked))
	for _, item := range ranked {
		hits = append(hits, chunkHit(chunks[item.index], item.score, query))
	}
	return hits, entry, nil
}
