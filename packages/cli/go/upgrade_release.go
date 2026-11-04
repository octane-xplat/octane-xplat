package main

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type upgradeWorkerLease struct{ Entry, Directory string }
type releaseWorkerManifest struct {
	Version          int    `json:"version"`
	CLIVersion       string `json:"cliVersion"`
	FrameworkVersion string `json:"frameworkVersion"`
	Entry            string `json:"entry"`
	Files            map[string]struct {
		Bytes  int64  `json:"bytes"`
		SHA256 string `json:"sha256"`
	} `json:"files"`
}

func (lease upgradeWorkerLease) finish(result error) error {
	if lease.Directory == "" {
		return result
	}
	var unknown *processCleanupError
	if errors.As(result, &unknown) {
		return fmt.Errorf("%w; release worker retained at %s", result, lease.Directory)
	}
	if err := os.RemoveAll(lease.Directory); err != nil {
		return fmt.Errorf("release worker retained at %s; operation result: %v; staging cleanup failed: %w", lease.Directory, result, err)
	}
	return result
}

func stageReleaseWorker(packageRoot string) (lease upgradeWorkerLease, result error) {
	var manifest releaseWorkerManifest
	source := filepath.Join(packageRoot, "native-worker")
	if err := readJSON(filepath.Join(source, "manifest.json"), &manifest); err != nil {
		return lease, fmt.Errorf("reinstall the invoked CLI: release worker is unavailable: %w", err)
	}
	if manifest.Version != 1 || manifest.CLIVersion != metadata.Version || manifest.FrameworkVersion != metadata.FrameworkVersion || manifest.Entry != "dist/upgrade-worker.mjs" || len(manifest.Files) == 0 || len(manifest.Files) > 512 {
		return lease, errors.New("invoked CLI release worker identity is invalid; reinstall this CLI")
	}
	directory, err := os.OpenRoot(source)
	if err != nil {
		return lease, err
	}
	defer directory.Close()
	stage, err := privateDirectory(os.TempDir(), "xplat-go-release-worker-")
	if err != nil {
		return lease, err
	}
	lease = upgradeWorkerLease{Entry: filepath.Join(stage, filepath.FromSlash(manifest.Entry)), Directory: stage}
	defer func() {
		if result != nil {
			result = lease.finish(result)
			lease = upgradeWorkerLease{}
		}
	}()
	total := int64(0)
	for name, record := range manifest.Files {
		path := filepath.FromSlash(name)
		if (!filepath.IsLocal(path) || filepath.ToSlash(filepath.Clean(path)) != name) || record.Bytes < 0 || record.Bytes > 4<<20 {
			return lease, errors.New("invalid release worker file inventory")
		}
		total += record.Bytes
		if total > 8<<20 {
			return lease, errors.New("release worker exceeds 8 MiB")
		}
		info, err := directory.Lstat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() != record.Bytes {
			return lease, errors.New("release worker file must match an ordinary manifest entry")
		}
		file, err := directory.Open(path)
		if err != nil {
			return lease, err
		}
		bytes, readErr := io.ReadAll(io.LimitReader(file, record.Bytes+1))
		closeErr := file.Close()
		if readErr != nil || closeErr != nil || int64(len(bytes)) != record.Bytes {
			return lease, errors.New("release worker file changed during staging")
		}
		digest := sha256.Sum256(bytes)
		if hex.EncodeToString(digest[:]) != record.SHA256 {
			return lease, errors.New("release worker checksum mismatch; reinstall this CLI")
		}
		target := filepath.Join(stage, path)
		if err = os.MkdirAll(filepath.Dir(target), 0700); err != nil {
			return lease, err
		}
		if err = privateFile(target, bytes); err != nil {
			return lease, err
		}
	}
	if _, ok := manifest.Files[manifest.Entry]; !ok {
		return lease, errors.New("release worker entry omitted from manifest")
	}
	return lease, nil
}

func selectUpgradeWorker(project string) (upgradeWorkerLease, error) {
	executable, err := os.Executable()
	if err != nil {
		return upgradeWorkerLease{}, err
	}
	executable, err = canonical(executable)
	if err != nil {
		return upgradeWorkerLease{}, err
	}
	candidates := []string{filepath.Dir(executable)}
	if filepath.Base(filepath.Dir(executable)) == "bin" {
		candidates = append(candidates, filepath.Dir(filepath.Dir(executable)))
	}
	for _, root := range candidates {
		if !pathExists(filepath.Join(root, "package.json")) {
			continue
		}
		var pkg struct{ Name, Version string }
		if err = readJSON(filepath.Join(root, "package.json"), &pkg); err != nil {
			return upgradeWorkerLease{}, err
		}
		if pkg.Name != "@octane-xplat/cli" {
			continue
		}
		if pkg.Version != metadata.Version {
			return upgradeWorkerLease{}, errors.New("invoked CLI package/executable versions differ; reinstall this CLI")
		}
		return stageReleaseWorker(root)
	}
	entry, err := projectWorker(project)
	return upgradeWorkerLease{Entry: entry}, err
}
