package docs

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"io"
	"io/fs"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"slices"
	"strconv"
	"strings"
	"time"
)

type SnapshotRequest struct {
	Cache          string `json:"cache"`
	Repository     string `json:"repository"`
	Package        string `json:"package"`
	Version        string `json:"version"`
	AcceptMovedTag bool   `json:"acceptMovedTag,omitempty"`
}
type snapshotFile struct {
	Path   string `json:"path"`
	Size   int64  `json:"size"`
	SHA256 string `json:"sha256"`
}
type snapshotRecord struct {
	Schema     int            `json:"schema"`
	Repository string         `json:"repository"`
	Package    string         `json:"package"`
	Version    string         `json:"version"`
	Tag        string         `json:"tag"`
	Commit     string         `json:"commit"`
	Snapshot   string         `json:"snapshot"`
	Files      []snapshotFile `json:"files"`
}

var snapshotVersion = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`)
var gitObjectID = regexp.MustCompile(`^(?:[0-9a-f]{40}|[0-9a-f]{64})$`)

func SnapshotOperation(ctx context.Context, input SnapshotRequest) (json.RawMessage, error) {
	cache, err := filepath.Abs(filepath.Join(input.Cache, "go-v1"))
	if err != nil {
		return nil, err
	}
	input.Cache = cache
	return NativeCompute(ctx, cache, "docs-snapshot", input)
}

func snapshotProvenance(input SnapshotRequest, tag, match string) map[string]any {
	return map[string]any{"source": "release-docs", "scope": "release", "package": input.Package, "requestedVersion": input.Version,
		"servedVersion": nil, "repo": input.Repository, "tag": tag, "commit": nil, "match": match, "offline": false}
}
func snapshotUnavailable(input SnapshotRequest, tag, reason string) map[string]any {
	return map[string]any{"status": "unavailable", "reason": reason, "provenance": snapshotProvenance(input, tag, "unavailable")}
}
func snapshotConflict(input SnapshotRequest, tag, cached, remote string) map[string]any {
	nullable := func(value string) any {
		if value == "" {
			return nil
		}
		return value
	}
	prov := snapshotProvenance(input, tag, "tag-conflict")
	prov["commit"] = nullable(cached)
	return map[string]any{"status": "tag-conflict", "cached": map[string]any{"tag": tag, "commit": nullable(cached)},
		"remote": map[string]any{"tag": tag, "commit": nullable(remote)}, "provenance": prov}
}

// Git objects are data. Never check out a fetched tree: hooks, filters, LFS and
// submodules cannot execute while we read an allow-listed set of ordinary blobs.
type snapshotGit struct {
	Directory, Empty string
	Env              []string
}

func newSnapshotGit(directory string) snapshotGit {
	env := []string{}
	for _, entry := range os.Environ() {
		key, _, _ := strings.Cut(entry, "=")
		upper := strings.ToUpper(key)
		if strings.HasPrefix(upper, "GIT_") || strings.HasPrefix(upper, "GCM_") || upper == "SSH_ASKPASS" {
			continue
		}
		env = append(env, entry)
	}
	env = append(env, "GIT_CONFIG_NOSYSTEM=1", "GIT_CONFIG_GLOBAL="+os.DevNull, "GIT_TERMINAL_PROMPT=0", "GIT_ASKPASS=", "GCM_INTERACTIVE=never")
	return snapshotGit{Directory: filepath.Join(directory, "git"), Empty: filepath.Join(directory, "empty"), Env: env}
}
func (git snapshotGit) command(ctx context.Context, args ...string) *exec.Cmd {
	flags := []string{"-c", "core.hooksPath=" + git.Empty, "-c", "credential.helper=", "-c", "credential.interactive=false",
		"-c", "protocol.allow=never", "-c", "protocol.https.allow=always", "-c", "protocol.file.allow=always",
		"-c", "core.attributesFile=" + os.DevNull, "-c", "core.autocrlf=false", "-c", "submodule.recurse=false"}
	if runtime.GOOS == "windows" {
		// Owned staging can be short enough for Win32 directory creation while
		// Git's object filenames exceed MAX_PATH. Keep this process-local.
		flags = append(flags, "-c", "core.longpaths=true")
	}
	cmd := exec.CommandContext(ctx, "git", append(flags, args...)...)
	cmd.Dir, cmd.Env, cmd.WaitDelay = git.Directory, git.Env, 500*time.Millisecond
	return cmd
}
func (git snapshotGit) run(ctx context.Context, args ...string) (string, error) {
	cmd := git.command(ctx, args...)
	var stdout, stderr proc.LimitedCapture
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	err := cmd.Run()
	if ctx.Err() != nil {
		return "", ctx.Err()
	}
	if stdout.Truncated || stderr.Truncated {
		return "", errors.New("Git response exceeds its byte limit")
	}
	if err != nil {
		return "", fmt.Errorf("Git operation failed: %w", err)
	}
	return stdout.String(), nil
}
func (git snapshotGit) remoteCommit(ctx context.Context, repository, tag string) (string, error) {
	output, err := git.run(ctx, "ls-remote", "--", repository, "refs/tags/"+tag, "refs/tags/"+tag+"^{}")
	if err != nil {
		return "", err
	}
	commit := ""
	for _, line := range strings.Split(output, "\n") {
		fields := strings.Fields(line)
		if len(fields) != 2 || !gitObjectID.MatchString(fields[0]) {
			continue
		}
		if fields[1] == "refs/tags/"+tag+"^{}" {
			return fields[0], nil
		}
		if fields[1] == "refs/tags/"+tag {
			commit = fields[0]
		}
	}
	return commit, nil
}

func snapshotFileAllowed(path, manifest string) bool {
	return osfs.SafeSnapshotPath(path) && (path == manifest || docCorpus(path) != "")
}

type snapshotBlob struct {
	Path, Object string
	Size         int64
}

func (git snapshotGit) inventory(ctx context.Context, commit, manifest string) ([]snapshotBlob, error) {
	output, err := git.run(ctx, "ls-tree", "-r", "-z", "-l", "--full-tree", commit)
	if err != nil {
		return nil, err
	}
	files, total, seen := []snapshotBlob{}, int64(0), map[string]bool{}
	for _, line := range strings.Split(output, "\x00") {
		header, path, ok := strings.Cut(line, "\t")
		if !ok || !snapshotFileAllowed(path, manifest) {
			continue
		}
		fields := strings.Fields(header)
		// Ignore links, submodules and non-blob entries, including linked manifests.
		if len(fields) != 4 || (fields[0] != "100644" && fields[0] != "100755") || fields[1] != "blob" || !gitObjectID.MatchString(fields[2]) {
			continue
		}
		size, err := strconv.ParseInt(fields[3], 10, 64)
		if err != nil || size < 0 || size > maxDocBytes {
			return nil, errors.New("release document exceeds its byte limit")
		}
		folded := strings.ToLower(path)
		if seen[folded] {
			return nil, errors.New("release paths collide on a case-insensitive filesystem")
		}
		seen[folded] = true
		total += size
		if total > maxDocsBytes || len(files) >= 8000 {
			return nil, errors.New("release inventory exceeds 32 MiB or 8000 files")
		}
		files = append(files, snapshotBlob{path, fields[2], size})
	}
	return files, nil
}

func (git snapshotGit) extract(ctx context.Context, files []snapshotBlob, destination string) ([]snapshotFile, error) {
	if len(files) == 0 {
		return nil, errors.New("release has no eligible files")
	}
	requests := bytes.Buffer{}
	for _, file := range files {
		fmt.Fprintln(&requests, file.Object)
	}
	cmd := git.command(ctx, "cat-file", "--batch")
	cmd.Stdin = &requests
	var stderr proc.LimitedCapture
	cmd.Stderr = &stderr
	output, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err = cmd.Start(); err != nil {
		return nil, err
	}
	waited := false
	defer func() {
		if !waited {
			_ = cmd.Process.Kill()
			_ = cmd.Wait()
		}
	}()
	reader, result := bufio.NewReader(output), []snapshotFile{}
	for _, file := range files {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		header, err := reader.ReadString('\n')
		if err != nil || header != fmt.Sprintf("%s blob %d\n", file.Object, file.Size) {
			return nil, errors.New("unexpected Git blob header")
		}
		data := make([]byte, int(file.Size)+1)
		if _, err = io.ReadFull(reader, data); err != nil || data[len(data)-1] != '\n' {
			return nil, errors.New("incomplete Git blob")
		}
		data = data[:len(data)-1]
		path := filepath.Join(destination, filepath.FromSlash(file.Path))
		if err = os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			return nil, err
		}
		if err = osfs.PrivateFile(path, data); err != nil {
			return nil, err
		}
		hash := sha256.Sum256(data)
		result = append(result, snapshotFile{file.Path, file.Size, fmt.Sprintf("%x", hash)})
	}
	if _, err := reader.ReadByte(); err != io.EOF {
		return nil, errors.New("unexpected trailing Git blob data")
	}
	err = cmd.Wait()
	waited = true
	if err != nil || stderr.Truncated {
		return nil, errors.New("Git blob extraction failed")
	}
	return result, nil
}

func verifySnapshot(ctx context.Context, cache string, record snapshotRecord, manifest string) error {
	if !gitObjectID.MatchString(record.Commit) || !osfs.SafeSnapshotPath(record.Snapshot) || !strings.HasPrefix(record.Snapshot, "snapshots/") || len(record.Files) == 0 || len(record.Files) > 8000 {
		return errors.New("invalid snapshot metadata")
	}
	path := filepath.Join(cache, filepath.FromSlash(record.Snapshot))
	info, err := os.Lstat(path)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return errors.New("snapshot directory missing or replaced")
	}
	root, err := os.OpenRoot(path)
	if err != nil {
		return err
	}
	defer root.Close()
	expected, total := map[string]snapshotFile{}, int64(0)
	for _, file := range record.Files {
		if !snapshotFileAllowed(file.Path, manifest) || file.Size < 0 || file.Size > maxDocBytes || len(file.SHA256) != 64 {
			return errors.New("invalid snapshot file metadata")
		}
		if _, ok := expected[file.Path]; ok {
			return errors.New("duplicate snapshot file")
		}
		expected[file.Path] = file
		total += file.Size
	}
	if total > maxDocsBytes {
		return errors.New("snapshot inventory exceeds byte limit")
	}
	visited, count := 0, 0
	err = filepath.WalkDir(path, func(current string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if err := ctx.Err(); err != nil {
			return err
		}
		visited++
		if visited > 50000 {
			return errors.New("snapshot traversal exceeds entry limit")
		}
		if entry.Type()&os.ModeSymlink != 0 {
			return errors.New("snapshot contains a link")
		}
		if entry.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(path, current)
		rel = filepath.ToSlash(rel)
		file, ok := expected[rel]
		if !ok {
			return errors.New("snapshot contains an unverified file")
		}
		opened, err := osfs.OpenSourceFile(root, filepath.FromSlash(rel))
		if err != nil {
			return err
		}
		defer opened.Close()
		info, err := opened.Stat()
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() || info.Size() != file.Size {
			return errors.New("snapshot file replaced or resized")
		}
		hash := sha256.New()
		n, err := io.Copy(hash, io.LimitReader(opened, file.Size+1))
		if err != nil || n != file.Size || fmt.Sprintf("%x", hash.Sum(nil)) != file.SHA256 {
			return errors.New("snapshot raw-byte hash changed")
		}
		count++
		return nil
	})
	if err != nil {
		return err
	}
	if count != len(expected) {
		return errors.New("snapshot file missing")
	}
	pkg := cli.JsonObject(filepath.Join(path, filepath.FromSlash(manifest)))
	if pkg["name"] != record.Package || pkg["version"] != record.Version {
		return errors.New("snapshot package metadata mismatch")
	}
	return nil
}

func ensureDocSnapshot(ctx context.Context, operation string, input SnapshotRequest) (map[string]any, error) {
	if input.Repository == "" {
		input.Repository = releaseRepository
	}
	mapping := releaseMapping(input.Package, input.Version, input.Repository)
	if mapping == nil || !snapshotVersion.MatchString(input.Version) {
		return snapshotUnavailable(input, "", "no-release-mapping"), nil
	}
	tag, manifest := mapping["tag"], mapping["dir"]+"/package.json"
	repository, err := url.Parse(input.Repository)
	if !filepath.IsAbs(input.Repository) && (err != nil || repository.Scheme != "https" || repository.Host == "" || repository.User != nil) {
		return snapshotUnavailable(input, tag, "repository-unavailable"), nil
	}
	cache := filepath.Dir(operation)
	if filepath.Clean(input.Cache) != cache {
		return nil, errors.New("snapshot cache differs from its registered operation root")
	}
	if err = osfs.PreparePrivateCache(cache); err != nil {
		return nil, err
	}
	root, err := os.OpenRoot(cache)
	if err != nil {
		return nil, err
	}
	defer root.Close()
	if err = root.MkdirAll("bindings", 0700); err != nil {
		return nil, err
	}
	key := fmt.Sprintf("%x", sha256.Sum256([]byte(input.Repository+"\x00"+input.Package+"\x00"+input.Version)))
	unlock, err := osfs.LockCache(ctx, root, "bindings/"+key+".lock")
	if err != nil {
		return nil, err
	}
	defer unlock()
	metadata := "bindings/" + key + ".json"
	var cached snapshotRecord
	cacheErr := osfs.ReadJSON(filepath.Join(cache, metadata), &cached)
	haveCache := cacheErr == nil
	if cacheErr != nil && !os.IsNotExist(cacheErr) {
		return snapshotUnavailable(input, tag, "cache-invalid"), nil
	}
	if haveCache {
		if cached.Schema != 1 || cached.Repository != input.Repository || cached.Package != input.Package || cached.Version != input.Version || cached.Tag != tag || verifySnapshot(ctx, cache, cached, manifest) != nil {
			return snapshotUnavailable(input, tag, "cache-invalid"), nil
		}
	}
	bound := func(record snapshotRecord, offline bool) map[string]any {
		return map[string]any{"status": "bound", "dir": filepath.Join(cache, filepath.FromSlash(record.Snapshot)), "commit": record.Commit, "tag": tag, "offline": offline}
	}
	stage, err := osfs.PrivateDirectory(operation, "snapshot-")
	if err != nil {
		return nil, err
	}
	for _, name := range []string{"git", "content", "empty"} {
		if err = os.Mkdir(filepath.Join(stage, name), 0700); err != nil {
			return nil, err
		}
	}
	git := newSnapshotGit(stage)
	if _, err = exec.LookPath("git"); err != nil {
		if haveCache {
			return bound(cached, true), nil
		}
		return snapshotUnavailable(input, tag, "git-unavailable"), nil
	}
	outerContext := ctx
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	remote, err := git.remoteCommit(ctx, input.Repository, tag)
	if err != nil {
		if outerContext.Err() != nil {
			return nil, outerContext.Err()
		}
		if haveCache {
			return bound(cached, true), nil
		}
		return snapshotUnavailable(input, tag, "remote-unavailable"), nil
	}
	if remote == "" {
		if haveCache {
			return snapshotConflict(input, tag, cached.Commit, ""), nil
		}
		return snapshotUnavailable(input, tag, "tag-absent"), nil
	}
	if haveCache && remote != cached.Commit && !input.AcceptMovedTag {
		return snapshotConflict(input, tag, cached.Commit, remote), nil
	}
	if haveCache && remote == cached.Commit {
		return bound(cached, false), nil
	}
	if _, err = git.run(ctx, "init", "-q", "--bare", "--template="+git.Empty); err == nil {
		_, err = git.run(ctx, "fetch", "-q", "--no-tags", "--depth=1", "--", input.Repository, "refs/tags/"+tag)
	}
	if err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		if haveCache && remote == cached.Commit {
			return bound(cached, true), nil
		}
		return snapshotUnavailable(input, tag, "remote-unavailable"), nil
	}
	output, err := git.run(ctx, "rev-parse", "--verify", "FETCH_HEAD^{commit}")
	if err != nil {
		return snapshotUnavailable(input, tag, "metadata-mismatch"), nil
	}
	commit := strings.TrimSpace(output)
	if commit != remote {
		return snapshotConflict(input, tag, cached.Commit, remote), nil
	}
	files, err := git.inventory(ctx, commit, manifest)
	if err != nil {
		return snapshotUnavailable(input, tag, "snapshot-limit"), nil
	}
	if !slices.ContainsFunc(files, func(file snapshotBlob) bool { return file.Path == manifest }) {
		return snapshotUnavailable(input, tag, "metadata-mismatch"), nil
	}
	content := filepath.Join(stage, "content")
	stored, err := git.extract(ctx, files, content)
	if err != nil {
		return nil, err
	}
	pkg := cli.JsonObject(filepath.Join(content, filepath.FromSlash(manifest)))
	if pkg["name"] != input.Package || pkg["version"] != input.Version {
		return snapshotUnavailable(input, tag, "metadata-mismatch"), nil
	}
	destination := "snapshots/" + key + "-" + commit
	record := snapshotRecord{1, input.Repository, input.Package, input.Version, tag, commit, destination, stored}
	if err = root.MkdirAll("snapshots", 0700); err != nil {
		return nil, err
	}
	_, err = root.Lstat(destination)
	if os.IsNotExist(err) {
		relative, _ := filepath.Rel(cache, content)
		if err = root.Rename(relative, filepath.FromSlash(destination)); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	if err = verifySnapshot(ctx, cache, record, manifest); err != nil {
		return snapshotUnavailable(input, tag, "cache-invalid"), nil
	}
	data, err := json.Marshal(record)
	if err != nil {
		return nil, err
	}
	if err = osfs.PrivateFile(filepath.Join(stage, "binding.json"), data); err != nil {
		return nil, err
	}
	relative, _ := filepath.Rel(cache, filepath.Join(stage, "binding.json"))
	if err = root.Rename(relative, metadata); err != nil {
		return nil, err
	}
	return bound(record, false), nil
}
