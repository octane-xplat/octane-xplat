package dev

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/history"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"time"
	"unicode/utf8"
)

const retainedEvidenceBytes = 256 << 10
const retainedEvidenceTotal = 1 << 20
const retainedEvidenceCount = 16

var evidenceAbsent = errors.New("no evidence store or record")
var evidenceIdentity = regexp.MustCompile(`^ev_[a-f0-9]{32}$`)

type retainedEvidenceEnvelope struct {
	Version int             `json:"version"`
	AppRoot string          `json:"appRoot"`
	SHA256  string          `json:"sha256"`
	Record  json.RawMessage `json:"record"`
}
type evidenceRecordHeader struct {
	ID           string          `json:"id"`
	Kind         string          `json:"kind"`
	CreatedAt    string          `json:"createdAt"`
	ArtifactPath json.RawMessage `json:"artifactPath"`
	Provenance   struct {
		AppRoot string `json:"appRoot"`
	} `json:"provenance"`
	Retention struct {
		Scope     string  `json:"scope"`
		ExpiresAt *string `json:"expiresAt"`
	} `json:"retention"`
}
type retainedEvidenceItem struct {
	header evidenceRecordHeader
	raw    json.RawMessage
	bytes  int
}

// All paths come from the native user cache and canonical selected app, never
// from an artifactPath supplied by the app. Pure reads create nothing.
func withRetainedEvidence(ctx context.Context, parent, app string, create bool, operation func(*os.Root, []retainedEvidenceItem) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	namespace, err := history.ProspectiveHistoryPath(filepath.Join(parent, "evidence-go-v1"))
	if err != nil {
		return err
	}
	if osfs.Inside(app, namespace) {
		return errors.New("evidence cache must be outside the selected app")
	}
	path := filepath.Join(namespace, fmt.Sprintf("%x", sha256.Sum256([]byte(osfs.FilesystemKey(app)))))
	if create {
		if err = osfs.PreparePrivateCache(namespace); err != nil {
			return err
		}
		if err = osfs.PreparePrivateCache(path); err != nil {
			return err
		}
	} else {
		if err = osfs.ValidatePrivateCache(namespace); err != nil {
			if os.IsNotExist(err) {
				return evidenceAbsent
			}
			return err
		}
		if err = osfs.ValidatePrivateCache(path); err != nil {
			if os.IsNotExist(err) {
				return evidenceAbsent
			}
			return err
		}
	}
	actual, err := osfs.Canonical(path)
	if err != nil {
		return err
	}
	if osfs.Inside(app, actual) {
		return errors.New("evidence cache resolves inside the selected app")
	}
	root, err := os.OpenRoot(path)
	if err != nil {
		return err
	}
	defer root.Close()
	lockCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	release, err := lockEvidenceStore(lockCtx, root, create)
	if err != nil {
		return err
	}
	defer release()
	items, err := scanRetainedEvidence(root, app)
	if err != nil {
		return err
	}
	return operation(root, items)
}
func lockEvidenceStore(ctx context.Context, root *os.Root, create bool) (func(), error) {
	flags := os.O_RDWR
	if create {
		flags |= os.O_CREATE | os.O_EXCL
	}
	file, err := root.OpenFile("store.lock", flags, 0600)
	if create && os.IsExist(err) {
		file, err = root.OpenFile("store.lock", os.O_RDWR, 0)
	}
	if err != nil {
		return nil, err
	}
	fail := func(err error) (func(), error) { file.Close(); return nil, err }
	info, err := file.Stat()
	if err != nil {
		return fail(err)
	}
	for {
		current, err := root.Lstat("store.lock")
		if err != nil {
			return fail(err)
		}
		if !info.Mode().IsRegular() || !current.Mode().IsRegular() || !os.SameFile(info, current) {
			return fail(errors.New("evidence lock identity changed"))
		}
		if err = ctx.Err(); err != nil {
			return fail(err)
		}
		locked, err := osfs.TryCacheLock(file)
		if err != nil {
			return fail(err)
		}
		if locked {
			return func() { osfs.ReleaseCacheLock(file); file.Close() }, nil
		}
		select {
		case <-ctx.Done():
			return fail(ctx.Err())
		case <-time.After(25 * time.Millisecond):
		}
	}
}
func evidenceHeader(raw json.RawMessage, app string) (evidenceRecordHeader, error) {
	var header evidenceRecordHeader
	if json.Unmarshal(raw, &header) != nil || !evidenceIdentity.MatchString(header.ID) || !slices.Contains([]string{"inspection", "interaction"}, header.Kind) || osfs.FilesystemKey(header.Provenance.AppRoot) != osfs.FilesystemKey(app) || len(header.ArtifactPath) != 0 {
		return header, errors.New("invalid text evidence identity, kind or app binding")
	}
	if _, err := time.Parse(time.RFC3339Nano, header.CreatedAt); err != nil {
		return header, errors.New("invalid evidence creation timestamp")
	}
	return header, nil
}
func scanRetainedEvidence(root *os.Root, app string) ([]retainedEvidenceItem, error) {
	directory, err := root.Open(".")
	if err != nil {
		return nil, err
	}
	defer directory.Close()
	entries, err := directory.ReadDir(65)
	if err != nil && err != io.EOF {
		return nil, err
	}
	if len(entries) > 64 {
		return nil, errors.New("evidence directory exceeds inventory bound")
	}
	result := []retainedEvidenceItem{}
	total := 0
	for _, entry := range entries {
		name := entry.Name()
		if filepath.Ext(name) != ".json" {
			continue
		}
		id := name[:len(name)-5]
		if !evidenceIdentity.MatchString(id) {
			continue
		}
		data, err := history.File(root, name, retainedEvidenceBytes)
		if err != nil {
			return nil, err
		}
		var envelope retainedEvidenceEnvelope
		if !utf8.Valid(data) || json.Unmarshal(data, &envelope) != nil || envelope.Version != 1 || osfs.FilesystemKey(envelope.AppRoot) != osfs.FilesystemKey(app) || fmt.Sprintf("%x", sha256.Sum256(envelope.Record)) != envelope.SHA256 {
			return nil, errors.New("retained evidence envelope failed integrity validation")
		}
		header, err := evidenceHeader(envelope.Record, app)
		if err != nil {
			return nil, err
		}
		if header.ID != id || header.Retention.Scope != "retained" {
			return nil, errors.New("retained evidence record identity/scope mismatch")
		}
		if header.Retention.ExpiresAt != nil {
			if _, err := time.Parse(time.RFC3339Nano, *header.Retention.ExpiresAt); err != nil {
				return nil, errors.New("retained evidence expiration is invalid")
			}
		}
		result = append(result, retainedEvidenceItem{header: header, raw: envelope.Record, bytes: len(data)})
		total += len(data)
		if len(result) > retainedEvidenceCount || total > retainedEvidenceTotal {
			return nil, errors.New("retained evidence budget exceeded")
		}
	}
	slices.SortFunc(result, func(a, b retainedEvidenceItem) int {
		if a.header.ID < b.header.ID {
			return -1
		}
		if a.header.ID > b.header.ID {
			return 1
		}
		return 0
	})
	return result, nil
}
func evidenceExpired(header evidenceRecordHeader, now time.Time) bool {
	if header.Retention.ExpiresAt == nil {
		return false
	}
	expiration, _ := time.Parse(time.RFC3339Nano, *header.Retention.ExpiresAt)
	return !expiration.After(now)
}
func publishEvidence(root *os.Root, app string, raw json.RawMessage) error {
	header, err := evidenceHeader(raw, app)
	if err != nil {
		return err
	}
	data, err := json.Marshal(retainedEvidenceEnvelope{Version: 1, AppRoot: app, SHA256: fmt.Sprintf("%x", sha256.Sum256(raw)), Record: raw})
	if err != nil {
		return err
	}
	if len(data) > retainedEvidenceBytes {
		return errors.New("evidence record exceeds256KiB")
	}
	name := "publish-" + osfs.Identity() + ".tmp"
	file, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer root.Remove(name)
	n, writeErr := file.Write(data)
	if writeErr == nil && n != len(data) {
		writeErr = io.ErrShortWrite
	}
	if writeErr == nil {
		writeErr = file.Sync()
	}
	closeErr := file.Close()
	if writeErr != nil {
		return writeErr
	}
	if closeErr != nil {
		return closeErr
	}
	return root.Rename(name, header.ID+".json")
}

// Publishing and deletion are serialized with readers across independent CLI
// processes. Reads filter expiry; only explicit mutations collect expired files.
func evidenceDiskCommand(ctx context.Context, parent, app, command string, values map[string]any, source json.RawMessage) (any, *cli.Error) {
	id := cli.StringValue(values["id"])
	if command != "evidence list" && !evidenceIdentity.MatchString(id) {
		return nil, cli.Invalid("Invalid evidence id.")
	}
	if command == "evidence retain" && source != nil {
		header, err := evidenceHeader(source, app)
		if err != nil || header.ID != id {
			return nil, cli.Invalid("Source evidence does not match the selected app and id.")
		}
	}
	var expiration *string
	if command == "evidence retain" && values["expiresAt"] != nil {
		text, ok := values["expiresAt"].(string)
		parsed, err := time.Parse(time.RFC3339Nano, text)
		if !ok || err != nil || !parsed.After(time.Now()) {
			return nil, cli.Invalid("--expires-at must be a future ISO timestamp; omit it for manual deletion.")
		}
		normalized := parsed.UTC().Format(time.RFC3339Nano)
		expiration = &normalized
	}
	var result any
	err := withRetainedEvidence(ctx, parent, app, command == "evidence retain" && source != nil, func(root *os.Root, items []retainedEvidenceItem) error {
		now := time.Now()
		active := []retainedEvidenceItem{}
		for _, item := range items {
			if evidenceExpired(item.header, now) {
				if command != "evidence list" {
					if err := root.Remove(item.header.ID + ".json"); err != nil {
						return err
					}
				}
				continue
			}
			active = append(active, item)
		}
		if command == "evidence list" {
			records := []json.RawMessage{}
			for _, item := range active {
				if kind := cli.StringValue(values["kind"]); kind == "" || kind == item.header.Kind {
					records = append(records, slices.Clone(item.raw))
				}
			}
			result = records
			return nil
		}
		var existing *retainedEvidenceItem
		for i := range active {
			if active[i].header.ID == id {
				existing = &active[i]
				break
			}
		}
		if command == "evidence delete" {
			if existing == nil {
				return evidenceAbsent
			}
			if err := root.Remove(id + ".json"); err != nil {
				return err
			}
			result = map[string]any{"deleted": true, "id": id, "note": "Deleting a server record cannot erase client transcripts or delivery receipts."}
			return nil
		}
		if existing != nil {
			source = existing.raw
		}
		if source == nil {
			return evidenceAbsent
		}
		header, err := evidenceHeader(source, app)
		if err != nil {
			return err
		}
		if header.ID != id {
			return errors.New("source evidence does not match retention id")
		}
		var record map[string]json.RawMessage
		if json.Unmarshal(source, &record) != nil {
			return errors.New("invalid evidence record")
		}
		record["retention"], _ = json.Marshal(map[string]any{"scope": "retained", "expiresAt": expiration})
		raw, err := json.Marshal(record)
		if err != nil {
			return err
		}
		envelope, _ := json.Marshal(retainedEvidenceEnvelope{Version: 1, AppRoot: app, SHA256: fmt.Sprintf("%x", sha256.Sum256(raw)), Record: raw})
		total, count := len(envelope), 1
		for _, item := range active {
			if item.header.ID != id {
				total += item.bytes
				count++
			}
		}
		if total > retainedEvidenceTotal || count > retainedEvidenceCount {
			return errors.New("retained evidence capacity reached; delete existing retained records explicitly")
		}
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := publishEvidence(root, app, raw); err != nil {
			return err
		}
		result = map[string]any{"record": json.RawMessage(raw), "transcriptNote": "Retention and deletion affect server evidence only; external client transcripts remain outside server control."}
		return nil
	})
	if errors.Is(err, evidenceAbsent) {
		if command == "evidence list" {
			return []json.RawMessage{}, nil
		}
		return nil, &cli.Error{Code: "not_found", Message: "No retained evidence with this id for the selected app."}
	}
	if err != nil {
		return nil, cli.ExecutionFailure(err)
	}
	return result, nil
}
