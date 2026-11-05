package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strconv"
)

const devServerProtocol = "octane-dev-server"

// This is a private discovery credential, never an API response or process
// ownership claim. Each explicit dev start gets a fresh instance and token.
type devServerRecord struct {
	Protocol   string `json:"protocol"`
	Version    int    `json:"version"`
	AppRoot    string `json:"appRoot"`
	Endpoint   string `json:"endpoint"`
	InstanceID string `json:"instanceId"`
	Token      string `json:"token"`
}

var devServerInstance = regexp.MustCompile(`^[a-f0-9]{32}$`)
var devServerToken = regexp.MustCompile(`^[a-f0-9]{64}$`)

func devServerCacheParent() (string, error) {
	if configured := os.Getenv("XPLAT_DEV_CACHE"); configured != "" {
		return filepath.Abs(configured)
	}
	parent, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(parent, "octane-xplat", "cli-go"), nil
}

func devServerDirectory(parent, appRoot string) (string, string, error) {
	if parent == "" {
		return "", "", errors.New("dev server requires a private cache parent")
	}
	app, err := canonical(appRoot)
	if err != nil {
		return "", "", err
	}
	info, err := os.Stat(app)
	if err != nil || !info.IsDir() {
		return "", "", errors.New("dev server identity requires an existing app directory")
	}
	namespace, err := prospectiveHistoryPath(filepath.Join(parent, "dev-servers-v1"))
	if err != nil {
		return "", "", err
	}
	if inside(app, namespace) {
		return "", "", errors.New("dev server discovery must stay outside the app directory")
	}
	key := fmt.Sprintf("%x", sha256.Sum256([]byte(filesystemKey(app))))
	return filepath.Join(namespace, key), app, nil
}

func validateDevServerRecord(record devServerRecord, app string) error {
	if record.Protocol != devServerProtocol || record.Version != 1 || !filepath.IsAbs(record.AppRoot) || filesystemKey(record.AppRoot) != filesystemKey(app) || !devServerInstance.MatchString(record.InstanceID) || !devServerToken.MatchString(record.Token) {
		return errors.New("dev server discovery identity does not match the selected app")
	}
	endpoint, err := url.Parse(record.Endpoint)
	if err != nil {
		return errors.New("invalid dev server endpoint")
	}
	port, err := strconv.Atoi(endpoint.Port())
	if err != nil || port < 1 || port > 65535 || endpoint.Scheme != "http" || endpoint.Host != fmt.Sprintf("127.0.0.1:%d", port) || endpoint.Path != "/rpc" || endpoint.RawPath != "" || endpoint.User != nil || endpoint.RawQuery != "" || endpoint.ForceQuery || endpoint.Fragment != "" || endpoint.Opaque != "" {
		return errors.New("dev server endpoint must be an exact loopback HTTP RPC address")
	}
	return nil
}

func readDevServerRecord(root *os.Root, app string) (devServerRecord, error) {
	var record devServerRecord
	info, err := root.Lstat("server.json")
	if err != nil {
		return record, err
	}
	if !info.Mode().IsRegular() || runtime.GOOS != "windows" && info.Mode().Perm()&0077 != 0 {
		return record, errors.New("dev server credential must be a private regular file")
	}
	data, err := historyFile(root, "server.json", 16<<10)
	if err != nil {
		return record, err
	}
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&record) != nil || decoder.Decode(new(any)) != io.EOF {
		return record, errors.New("invalid dev server discovery record")
	}
	return record, validateDevServerRecord(record, app)
}

func devServerUnavailable(message string) *cliError {
	return &cliError{Code: "disconnected_runtime", Message: message, Recovery: map[string]string{"action": "Connect after xplat dev has been explicitly started for this app."}}
}

// Lookup is read-only, including when the namespace, app or record is absent.
// Neither a stale record nor an HTTP failure authorizes starting an engine.
func lookupDevServerRecord(parent, appRoot string) (*devServerRecord, *cliError) {
	directory, app, err := devServerDirectory(parent, appRoot)
	if err != nil {
		return nil, devServerUnavailable("No running dev server for the selected app.")
	}
	for _, path := range []string{filepath.Dir(directory), directory} {
		if err := validatePrivateCache(path); err != nil {
			return nil, devServerUnavailable("No usable private dev server discovery record for this app.")
		}
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		return nil, devServerUnavailable("No running dev server for the selected app.")
	}
	defer root.Close()
	record, err := readDevServerRecord(root, app)
	if err != nil {
		return nil, devServerUnavailable("No matching dev server discovery record for this app; it may be missing or stale.")
	}
	return &record, nil
}

type devServerStore struct {
	root      *os.Root
	lease     *os.File
	app       string
	published *devServerRecord
}

// Only the explicit foreground dev entry opens a store or takes this claim.
// The stable lock file must survive shutdown so two starts cannot split it.
func openDevServerStore(parent, appRoot string) (*devServerStore, error) {
	directory, app, err := devServerDirectory(parent, appRoot)
	if err != nil {
		return nil, err
	}
	for _, path := range []string{filepath.Dir(directory), directory} {
		if err := preparePrivateCache(path); err != nil {
			return nil, fmt.Errorf("prepare private dev server cache: %w", err)
		}
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		return nil, err
	}
	file, err := root.OpenFile("server.lock", os.O_RDWR|os.O_CREATE|os.O_EXCL, 0600)
	if os.IsExist(err) {
		info, inspectErr := root.Lstat("server.lock")
		if inspectErr != nil || !info.Mode().IsRegular() {
			root.Close()
			return nil, errors.New("dev server claim must be a regular file")
		}
		file, err = root.OpenFile("server.lock", os.O_RDWR, 0)
	}
	if err != nil {
		root.Close()
		return nil, err
	}
	locked, err := tryCacheLock(file)
	if err != nil || !locked {
		file.Close()
		root.Close()
		if err != nil {
			return nil, err
		}
		return nil, errors.New("a dev server is already running or starting for this app")
	}
	return &devServerStore{root: root, lease: file, app: app}, nil
}

func (store *devServerStore) publish(record devServerRecord) error {
	if err := validateDevServerRecord(record, store.app); err != nil {
		return err
	}
	data, err := json.Marshal(record)
	if err != nil {
		return err
	}
	name := "publish-" + identity() + ".tmp"
	file, err := store.root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	defer store.root.Remove(name)
	n, writeErr := file.Write(data)
	closeErr := file.Close()
	if err := errors.Join(writeErr, closeErr); err != nil {
		return err
	}
	if n != len(data) {
		return io.ErrShortWrite
	}
	if err := store.root.Rename(name, "server.json"); err != nil {
		return err
	}
	store.published = &record
	return nil
}

func (store *devServerStore) close() error {
	var failure error
	if store.published != nil {
		current, err := readDevServerRecord(store.root, store.app)
		if err == nil && current == *store.published {
			failure = store.root.Remove("server.json")
		} else if !os.IsNotExist(err) {
			failure = errors.New("dev server discovery changed; its record was preserved")
		}
	}
	releaseCacheLock(store.lease)
	return errors.Join(failure, store.lease.Close(), store.root.Close())
}
