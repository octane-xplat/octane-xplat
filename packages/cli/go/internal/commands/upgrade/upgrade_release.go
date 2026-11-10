package upgrade

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"io"
	"os"
	"path/filepath"
)

type upgradeWorkerLease struct{ Entry, Directory, Helper string }
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
	var unknown *proc.CleanupError
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
	if err := osfs.ReadJSON(filepath.Join(source, "manifest.json"), &manifest); err != nil {
		return lease, fmt.Errorf("reinstall the invoked CLI: release worker is unavailable: %w", err)
	}
	if manifest.Version != 1 || manifest.CLIVersion != cli.Metadata.Version || manifest.FrameworkVersion != cli.Metadata.FrameworkVersion || manifest.Entry != "dist/upgrade-worker.mjs" || len(manifest.Files) == 0 || len(manifest.Files) > 512 {
		return lease, errors.New("invoked CLI release worker identity is invalid; reinstall this CLI")
	}
	directory, err := os.OpenRoot(source)
	if err != nil {
		return lease, err
	}
	defer directory.Close()
	stage, err := osfs.PrivateDirectory(os.TempDir(), "xplat-go-release-worker-")
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
		if err = osfs.PrivateFile(target, bytes); err != nil {
			return lease, err
		}
	}
	if _, ok := manifest.Files[manifest.Entry]; !ok {
		return lease, errors.New("release worker entry omitted from manifest")
	}
	return lease, nil
}

func selectUpgradeWorker(projectRoot string) (upgradeWorkerLease, error) {
	executable, err := os.Executable()
	if err != nil {
		return upgradeWorkerLease{}, err
	}
	executable, err = osfs.Canonical(executable)
	if err != nil {
		return upgradeWorkerLease{}, err
	}
	candidates := []string{filepath.Dir(executable)}
	if filepath.Base(filepath.Dir(executable)) == "bin" {
		candidates = append(candidates, filepath.Dir(filepath.Dir(executable)))
	}
	for _, root := range candidates {
		if !osfs.PathExists(filepath.Join(root, "package.json")) {
			continue
		}
		var pkg struct{ Name, Version string }
		if err = osfs.ReadJSON(filepath.Join(root, "package.json"), &pkg); err != nil {
			return upgradeWorkerLease{}, err
		}
		if pkg.Name == "octane-xplat" {
			// The umbrella owns a direct copy of the executable. Resolve its
			// release worker from its own CLI dependency, never the target app.
			if pkg.Version != cli.Metadata.Version {
				return upgradeWorkerLease{}, errors.New("invoked umbrella package/executable versions differ; reinstall this CLI")
			}
			root = project.InstalledRoot(root, "@octane-xplat/cli")
			if root == "" {
				return upgradeWorkerLease{}, errors.New("invoked umbrella is missing its CLI dependency; reinstall this CLI")
			}
			if err = osfs.ReadJSON(filepath.Join(root, "package.json"), &pkg); err != nil {
				return upgradeWorkerLease{}, err
			}
			if pkg.Name != "@octane-xplat/cli" {
				return upgradeWorkerLease{}, errors.New("invoked umbrella has an invalid CLI dependency; reinstall this CLI")
			}
		}
		if pkg.Name != "@octane-xplat/cli" {
			continue
		}
		if pkg.Version != cli.Metadata.Version {
			return upgradeWorkerLease{}, errors.New("invoked CLI package/executable versions differ; reinstall this CLI")
		}
		return stageReleaseWorker(root)
	}
	entry, err := project.Worker(projectRoot)
	return upgradeWorkerLease{Entry: entry}, err
}

// Installation may replace the executable path used by native containment gates.
// Hold an immutable private helper from the invoked release across that mutation.
func stageUpgradeHelper(lease *upgradeWorkerLease) error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	helper, _, err := osfs.StageNativeExecutable(exe, lease.Directory, "native-helper-"+osfs.Identity()+".exe")
	if err == nil {
		lease.Helper = helper
	}
	return err
}
