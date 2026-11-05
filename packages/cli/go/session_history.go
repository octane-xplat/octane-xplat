package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"sync"
	"time"
)

const historySegmentBytes = 512 << 10
const historyRetainedRuns = 20

var historyID = regexp.MustCompile(`^sess_[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$`)

type historySession struct {
	Launch           *runtimeLaunch     `json:"launch,omitempty"`
	ProcessKind      *string            `json:"processKind,omitempty"`
	BuildIdentity    json.RawMessage    `json:"buildIdentity,omitempty"`
	NativeIdentity   *devNativeIdentity `json:"nativeIdentity,omitempty"`
	Version          int                `json:"version"`
	StoreVersion     int                `json:"storeVersion"`
	Implementation   string             `json:"implementation"`
	SessionID        string             `json:"sessionId"`
	AppRoot          string             `json:"appRoot"`
	AppID            string             `json:"appId"`
	OwnerID          string             `json:"ownerId"`
	PID              int                `json:"pid"`
	Platform         string             `json:"platform"`
	TargetID         string             `json:"targetId"`
	State            string             `json:"state"`
	Origin           string             `json:"origin"`
	Ownership        string             `json:"ownership"`
	CreatedAt        string             `json:"createdAt"`
	StartedAt        string             `json:"startedAt"`
	EndedAt          *string            `json:"endedAt"`
	CleanupConfirmed bool               `json:"cleanupConfirmed"`
	Detail           string             `json:"detail,omitempty"`
	RetentionError   string             `json:"retentionError,omitempty"`
}
type historyRecord struct {
	Seq           int64  `json:"seq"`
	TS            string `json:"ts"`
	Stream        string `json:"stream"`
	Source        string `json:"source"`
	Line          string `json:"line"`
	LineTruncated bool   `json:"lineTruncated,omitempty"`
}
type historyStore struct {
	root          *os.Root
	path, project string
}
type historyCapture struct {
	sync.Mutex
	store                  *historyStore
	root                   *os.Root
	session                historySession
	bytes                  int
	seq                    int64
	currentInfo            os.FileInfo
	closed, appendFailed   bool
	failure                error
	segmentLimit, runLimit int
}

func historyTime() string { return time.Now().UTC().Format("2006-01-02T15:04:05.000000000Z") }

// Keep durable evidence outside the dependency/output trees removed by clean.
// The parent is a caller-selected native cache, not an app-controlled directory.
// Resolve the existing ancestor before creating a namespace, including macOS
// /var aliases. A rejected in-project cache must not create even empty folders.
func prospectiveHistoryPath(path string) (string, error) {
	path, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}
	tail := []string{}
	for {
		_, err := os.Lstat(path)
		if err == nil {
			resolved, err := canonical(path)
			if err != nil {
				return "", err
			}
			for i := len(tail) - 1; i >= 0; i-- {
				resolved = filepath.Join(resolved, tail[i])
			}
			return resolved, nil
		}
		if !os.IsNotExist(err) {
			return "", err
		}
		parent := filepath.Dir(path)
		if parent == path {
			return "", err
		}
		tail = append(tail, filepath.Base(path))
		path = parent
	}
}

func openHistoryStore(parent, project string) (*historyStore, error) {
	if parent == "" {
		return nil, errors.New("session history requires an explicit native cache parent")
	}
	project, err := canonical(project)
	if err != nil {
		return nil, err
	}
	namespace, err := prospectiveHistoryPath(filepath.Join(parent, "history-go-v1"))
	if err != nil {
		return nil, err
	}
	if inside(project, namespace) {
		return nil, errors.New("session history must be outside the selected project")
	}
	if err = preparePrivateCache(namespace); err != nil {
		return nil, err
	}
	actual, err := canonical(namespace)
	if err != nil {
		return nil, err
	}
	if inside(project, actual) {
		return nil, errors.New("session history must be outside the selected project")
	}
	path := filepath.Join(namespace, fmt.Sprintf("%x", sha256.Sum256([]byte(filesystemKey(project)))))
	if err = preparePrivateCache(path); err != nil {
		return nil, err
	}
	root, err := os.OpenRoot(path)
	if err != nil {
		return nil, err
	}
	return &historyStore{root, path, project}, nil
}
func (store *historyStore) Close() error { return store.root.Close() }

func historyFile(root *os.Root, name string, limit int64) ([]byte, error) {
	info, err := root.Lstat(name)
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() || info.Size() > limit {
		return nil, errors.New("invalid retained history file type/size")
	}
	file, err := root.Open(name)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	actual, err := file.Stat()
	if err != nil || !os.SameFile(info, actual) {
		return nil, errHistoryChanged
	}
	data, err := io.ReadAll(io.LimitReader(file, limit+1))
	if err != nil {
		return nil, err
	}
	if int64(len(data)) > limit {
		return nil, errors.New("retained history exceeds bound")
	}
	return data, nil
}

// Retry a transient Windows delete-pending/sharing window without concealing a
// persistent access failure or returning an empty successful page.
func historyLogFile(root *os.Root, name string) ([]byte, error) {
	for attempt := 0; ; attempt++ {
		data, err := historyFile(root, name, historySegmentBytes)
		if !historyReadMayBeRotating(err) || attempt == 5 {
			return data, err
		}
		time.Sleep(2 * time.Millisecond)
	}
}

func historyMetadata(root *os.Root, session historySession) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}
	if len(data) > 64<<10 {
		return errors.New("retained metadata exceeds 64 KiB")
	}
	name := "metadata-" + identity() + ".tmp"
	file, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer root.Remove(name)
	n, writeErr := file.Write(data)
	closeErr := file.Close()
	if writeErr != nil {
		return writeErr
	}
	if closeErr != nil {
		return closeErr
	}
	if n != len(data) {
		return io.ErrShortWrite
	}
	// Rename replaces a complete snapshot; readers never see a partial metadata file.
	return root.Rename(name, "session.json")
}
func validHistorySession(session historySession, project, id string) bool {
	if session.Version != 2 || session.StoreVersion != 1 || session.Implementation != "go" || session.SessionID != id || !historyID.MatchString(id) || session.AppRoot != project || session.AppID == "" || session.OwnerID == "" || session.PID <= 0 || session.TargetID == "" {
		return false
	}
	if !slices.Contains([]string{"web", "ios", "android", "macos", "linux", "windows"}, session.Platform) || !slices.Contains([]string{"starting", "ready", "failed", "stopped", "disconnected"}, session.State) || !slices.Contains([]string{"dev", "agent"}, session.Origin) || !slices.Contains([]string{"owned", "attached"}, session.Ownership) {
		return false
	}
	if _, err := time.Parse(time.RFC3339Nano, session.StartedAt); err != nil {
		return false
	}
	if _, err := time.Parse(time.RFC3339Nano, session.CreatedAt); err != nil {
		return false
	}
	if session.EndedAt != nil {
		if _, err := time.Parse(time.RFC3339Nano, *session.EndedAt); err != nil {
			return false
		}
	}
	if native := session.NativeIdentity; native != nil {
		if session.Platform != "macos" || native.AppID == "" || len(native.Processes) == 0 || len(native.Processes) > 64 || native.DroppedProcesses < 0 {
			return false
		}
		for _, process := range native.Processes {
			if process.PID < 1 || process.PID > 1<<32-1 || !filepath.IsAbs(process.Executable) {
				return false
			}
			if _, err := time.Parse(time.RFC3339Nano, process.ObservedAt); err != nil {
				return false
			}
		}
	}
	return session.CleanupConfirmed == (session.EndedAt != nil)
}
func (store *historyStore) sessionRoot(id string) (*os.Root, error) {
	if !historyID.MatchString(id) {
		return nil, errors.New("invalid session id")
	}
	info, err := store.root.Lstat(id)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("retained session must be an ordinary directory")
	}
	root, err := store.root.OpenRoot(id)
	if err != nil {
		return nil, err
	}
	actual, err := root.Stat(".")
	if err != nil || !os.SameFile(info, actual) {
		root.Close()
		return nil, errHistoryChanged
	}
	return root, nil
}
func (store *historyStore) Read(id string) (historySession, error) {
	var result historySession
	dir, err := store.sessionRoot(id)
	if err != nil {
		return result, err
	}
	defer dir.Close()
	data, err := historyFile(dir, "session.json", 64<<10)
	if err != nil {
		return result, err
	}
	if json.Unmarshal(data, &result) != nil || !validHistorySession(result, store.project, id) {
		return result, errors.New("invalid native retained session metadata")
	}
	return result, nil
}

// Liveness is supplied by the authenticated live owner, never by PID existence.
func observedHistorySession(session historySession, owner string) map[string]any {
	data, _ := json.Marshal(session)
	var result map[string]any
	_ = json.Unmarshal(data, &result)
	historical := session.EndedAt != nil || owner == "" || owner != session.OwnerID
	result["historical"] = historical
	if session.EndedAt == nil && historical {
		result["state"] = "disconnected"
		result["detail"] = "The recorded owner is unavailable; retained data does not confirm live process cleanup."
	}
	return result
}
func (store *historyStore) List() ([]historySession, error) {
	directory, err := store.root.Open(".")
	if err != nil {
		return nil, err
	}
	defer directory.Close()
	entries, err := directory.ReadDir(10001)
	if err != nil && err != io.EOF {
		return nil, err
	}
	if len(entries) > 10000 {
		return nil, errors.New("retained session inventory exceeds 10000 entries")
	}
	result := []historySession{}
	for _, entry := range entries {
		if !historyID.MatchString(entry.Name()) {
			continue
		}
		session, err := store.Read(entry.Name())
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, err
		}
		result = append(result, session)
	}
	slices.SortFunc(result, func(a, b historySession) int {
		aTime, _ := time.Parse(time.RFC3339Nano, a.StartedAt)
		bTime, _ := time.Parse(time.RFC3339Nano, b.StartedAt)
		if n := bTime.Compare(aTime); n != 0 {
			return n
		}
		return strings.Compare(a.SessionID, b.SessionID)
	})
	return result, nil
}
func (store *historyStore) Prune(keep int) error {
	if keep < 0 || keep > 1000 {
		return errors.New("invalid session retention count")
	}
	runs, err := store.List()
	if err != nil {
		return err
	}
	completed := []historySession{}
	for _, run := range runs {
		if run.CleanupConfirmed && run.EndedAt != nil {
			completed = append(completed, run)
		}
	}
	slices.SortFunc(completed, func(a, b historySession) int {
		aTime, _ := time.Parse(time.RFC3339Nano, *a.EndedAt)
		bTime, _ := time.Parse(time.RFC3339Nano, *b.EndedAt)
		if n := bTime.Compare(aTime); n != 0 {
			return n
		}
		return strings.Compare(a.SessionID, b.SessionID)
	})
	for i := keep; i < len(completed); i++ {
		id := completed[i].SessionID
		// Re-read the exact candidate. Never delete an active or malformed record,
		// and never derive process ownership from retained metadata.
		current, err := store.Read(id)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if current.CleanupConfirmed && current.EndedAt != nil && current.OwnerID == completed[i].OwnerID {
			if err = store.root.RemoveAll(id); err != nil {
				return err
			}
		}
	}
	return nil
}
func (store *historyStore) Capture(session historySession) (*historyCapture, error) {
	now := historyTime()
	session.Version = 2
	session.StoreVersion = 1
	session.Implementation = "go"
	session.SessionID = "sess_" + strings.TrimPrefix(requestUUID(), "req-")
	session.AppRoot = store.project
	session.PID = os.Getpid()
	session.CreatedAt = now
	session.StartedAt = now
	session.State = "starting"
	session.EndedAt = nil
	session.CleanupConfirmed = false
	if !validHistorySession(session, store.project, session.SessionID) {
		return nil, errors.New("invalid native capture identity")
	}
	if _, err := store.root.Lstat(session.SessionID); !os.IsNotExist(err) {
		return nil, errors.New("native capture identity already exists or cannot be checked")
	}
	if err := privateDirectoryAt(filepath.Join(store.path, session.SessionID)); err != nil {
		return nil, err
	}
	info, err := store.root.Lstat(session.SessionID)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("native capture directory identity changed")
	}
	root, err := store.sessionRoot(session.SessionID)
	if err != nil {
		return nil, err
	}
	capture := &historyCapture{store: store, root: root, session: session, segmentLimit: historySegmentBytes, runLimit: historyRetainedRuns}
	if err = historyMetadata(root, session); err != nil {
		root.Close()
		return nil, err
	}
	if err = store.Prune(capture.runLimit); err != nil {
		capture.failure = err
		capture.session.RetentionError = err.Error()
	}
	return capture, nil
}
func (capture *historyCapture) append(record historyRecord) error {
	if capture.closed {
		return errors.New("capture is closed")
	}
	if capture.appendFailed {
		return capture.failure
	}
	if capture.seq >= 9007199254740991 {
		return errors.New("log sequence exhausted safe JSON integer range")
	}
	capture.seq++
	record.Seq = capture.seq
	record.TS = historyTime()
	if record.Stream != "stdout" && record.Stream != "stderr" && record.Stream != "lifecycle" {
		return errors.New("invalid log stream")
	}
	if record.Source == "" {
		record.Source = capture.session.Platform
	}
	units := 0
	for offset, r := range record.Line {
		width := 1
		if r > 0xffff {
			width = 2
		}
		if units+width > 8192 {
			record.Line = record.Line[:offset]
			record.LineTruncated = true
			break
		}
		units += width
	}
	if strings.HasPrefix(record.Line, "[browser:warn]") || strings.HasPrefix(record.Line, "[browser:error]") {
		record.Source = "browser"
	}
	data, err := json.Marshal(record)
	if err == nil {
		data = append(data, '\n')
		if len(data) > capture.segmentLimit {
			err = errors.New("development log record exceeds segment bound")
		}
	}
	if err == nil && capture.bytes > 0 && capture.bytes+len(data) > capture.segmentLimit {
		if _, e := capture.root.Lstat("previous.jsonl"); e == nil {
			err = capture.root.Remove("previous.jsonl")
		} else if !os.IsNotExist(e) {
			err = e
		}
		if err == nil {
			err = capture.root.Rename("current.jsonl", "previous.jsonl")
		}
		if err == nil {
			capture.bytes = 0
			capture.currentInfo = nil
		}
	}
	if err == nil && capture.currentInfo != nil {
		info, e := capture.root.Lstat("current.jsonl")
		if e != nil {
			err = e
		} else if !info.Mode().IsRegular() || !os.SameFile(capture.currentInfo, info) || info.Size() != int64(capture.bytes) {
			err = errors.New("owned log output identity or size changed")
		}
	}
	if err == nil {
		flags := os.O_WRONLY | os.O_APPEND
		if capture.currentInfo == nil {
			flags |= os.O_CREATE | os.O_EXCL
		}
		file, e := capture.root.OpenFile("current.jsonl", flags, 0600)
		err = e
		if err == nil {
			info, e := file.Stat()
			err = e
			if err == nil && (!info.Mode().IsRegular() || capture.currentInfo != nil && !os.SameFile(capture.currentInfo, info)) {
				err = errors.New("owned log output changed while opening")
			}
			if err == nil {
				capture.currentInfo = info
				n, e := file.Write(data)
				err = e
				if err == nil && n != len(data) {
					err = io.ErrShortWrite
				}
				if err == nil {
					capture.bytes += n
				}
			}
			err = errors.Join(err, file.Close())
		}
	}
	if err != nil {
		capture.appendFailed = true
		capture.failure = errors.Join(capture.failure, err)
		capture.session.RetentionError = capture.failure.Error()
		capture.failure = errors.Join(capture.failure, historyMetadata(capture.root, capture.session))
	}
	return err
}
func (capture *historyCapture) Append(record historyRecord) error {
	capture.Lock()
	defer capture.Unlock()
	return capture.append(record)
}
func (capture *historyCapture) Update(state, detail string) error {
	capture.Lock()
	defer capture.Unlock()
	if capture.closed {
		return errors.New("capture is closed")
	}
	if !slices.Contains([]string{"starting", "ready", "failed", "stopped", "disconnected"}, state) {
		return errors.New("invalid capture state")
	}
	capture.session.State = state
	capture.session.Detail = detail
	err := historyMetadata(capture.root, capture.session)
	if err != nil {
		capture.failure = errors.Join(capture.failure, err)
		capture.session.RetentionError = capture.failure.Error()
	}
	return err
}

// Finish follows confirmed process/resource cleanup. Failed cleanup is retained
// with no end time, rather than converting a stopped state into ownership proof.
func (capture *historyCapture) Finish(state, detail string, cleanup bool) error {
	capture.Lock()
	defer capture.Unlock()
	if capture.closed {
		return capture.failure
	}
	if !slices.Contains([]string{"failed", "stopped", "disconnected"}, state) {
		return errors.New("invalid final capture state")
	}
	_ = capture.append(historyRecord{Stream: "lifecycle", Source: capture.session.Platform, Line: detail})
	capture.session.State = state
	capture.session.Detail = detail
	capture.session.CleanupConfirmed = cleanup
	if cleanup {
		now := historyTime()
		capture.session.EndedAt = &now
	}
	if capture.failure != nil {
		capture.session.RetentionError = capture.failure.Error()
	}
	err := historyMetadata(capture.root, capture.session)
	capture.closed = true
	err = errors.Join(capture.failure, err, capture.root.Close())
	if cleanup {
		err = errors.Join(err, capture.store.Prune(capture.runLimit))
	}
	if err != nil {
		capture.session.RetentionError = err.Error()
		// Retention can fail after successful final metadata publication. Annotate
		// only this still-present identity; unrelated corruption must not hide its
		// confirmed process cleanup or prevent direct reads of its logs.
		current, readErr := capture.store.Read(capture.session.SessionID)
		if readErr == nil && current.OwnerID == capture.session.OwnerID && current.CreatedAt == capture.session.CreatedAt {
			current.RetentionError = err.Error()
			if root, openErr := capture.store.sessionRoot(current.SessionID); openErr == nil {
				err = errors.Join(err, historyMetadata(root, current), root.Close())
			}
		}
	}
	capture.failure = err
	return err
}

type historyLogs struct {
	Session        map[string]any  `json:"session"`
	Records        []historyRecord `json:"records"`
	NextCursor     int64           `json:"nextCursor"`
	OldestSeq      int64           `json:"oldestSeq"`
	NewestSeq      int64           `json:"newestSeq"`
	Dropped        int64           `json:"dropped"`
	IncompleteTail bool            `json:"incompleteTail"`
	Truncated      bool            `json:"truncated"`
	Historical     bool            `json:"historical"`
	CapturedFrom   string          `json:"capturedFrom"`
	Coverage       string          `json:"coverage"`
}

var errHistoryCursorAhead = errors.New("cursor is ahead of this session; use a cursor returned for the same session id")
var errHistoryChanged = errors.New("retained history changed during the read; retry")
var errHistoryRotated = errors.New("log files rotated during the read; retry")

func (store *historyStore) Logs(id, owner string, cursor *int64, limit int, stream string) (historyLogs, error) {
	result := historyLogs{Records: []historyRecord{}, OldestSeq: 1, Coverage: "Forwarded tool/host output. This stream excludes output before capture and OS report files; native reports are separate."}
	if cursor != nil && *cursor < 0 || limit < 1 || limit > 5000 || !slices.Contains([]string{"", "stdout", "stderr", "lifecycle"}, stream) {
		return result, errors.New("invalid log pagination or stream")
	}
	session, err := store.Read(id)
	if err != nil {
		return result, err
	}
	result.Session = observedHistorySession(session, owner)
	result.Historical = result.Session["historical"].(bool)
	result.CapturedFrom = session.StartedAt
	root, err := store.sessionRoot(id)
	if err != nil {
		return result, err
	}
	defer root.Close()
	records := map[int64]historyRecord{}
	// Rotation may happen between reads. Re-read previous and deduplicate stable
	// sequence identities, preserving a readable prefix of an incomplete final line.
	for _, name := range []string{"previous.jsonl", "current.jsonl", "previous.jsonl"} {
		data, err := historyLogFile(root, name)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return result, err
		}
		lines := bytes.Split(data, []byte{'\n'})
		if len(lines[len(lines)-1]) > 0 {
			result.IncompleteTail = true
		}
		lines = lines[:len(lines)-1]
		for _, line := range lines {
			if len(line) == 0 {
				continue
			}
			var record historyRecord
			if json.Unmarshal(line, &record) != nil || record.Seq < 1 || record.Seq > 9007199254740991 || record.TS == "" || !slices.Contains([]string{"stdout", "stderr", "lifecycle"}, record.Stream) {
				return result, errors.New("invalid complete retained log record")
			}
			if old, ok := records[record.Seq]; ok && old != record {
				return result, errors.New("conflicting retained sequence identity")
			}
			records[record.Seq] = record
		}
	}
	seqs := []int64{}
	for seq := range records {
		seqs = append(seqs, seq)
	}
	slices.Sort(seqs)
	if len(seqs) > 0 {
		result.OldestSeq = seqs[0]
		result.NewestSeq = seqs[len(seqs)-1]
	}
	for i := 1; i < len(seqs); i++ {
		if seqs[i] != seqs[i-1]+1 {
			return result, errHistoryRotated
		}
	}
	if cursor != nil && *cursor > result.NewestSeq {
		return result, errHistoryCursorAhead
	}
	after := int64(0)
	if cursor != nil {
		after = *cursor
	}
	result.Dropped = result.OldestSeq - 1
	result.Truncated = after < result.Dropped
	matching := []historyRecord{}
	for _, seq := range seqs {
		record := records[seq]
		if seq > after && (stream == "" || record.Stream == stream) {
			matching = append(matching, record)
		}
	}
	result.Records = matching
	if len(matching) > limit {
		if cursor == nil {
			result.Records = matching[len(matching)-limit:]
		} else {
			result.Records = matching[:limit]
		}
	}
	result.NextCursor = result.NewestSeq
	if len(matching) > len(result.Records) {
		result.NextCursor = result.Records[len(result.Records)-1].Seq
	}
	return result, nil
}

// Controllers report observer/transport retention failures without promoting
// them into process-cleanup evidence or waiting until a long-lived run ends.
func (capture *historyCapture) recordRetentionError(err error) {
	if err == nil {
		return
	}
	capture.Lock()
	defer capture.Unlock()
	capture.failure = errors.Join(capture.failure, err)
	capture.session.RetentionError = capture.failure.Error()
	if !capture.closed {
		capture.failure = errors.Join(capture.failure, historyMetadata(capture.root, capture.session))
	}
}
