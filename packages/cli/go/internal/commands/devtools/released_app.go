package devtools

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
)

// Release CI embeds the SHA-256 of the universal archive in the CLI executable.
var releaseArchiveSHA256 string

const archiveName = "xplat-devtools-macos-universal.zip"
const appExecutable = "XplatDevTools.app/Contents/MacOS/XplatDevTools"
const archiveLimit = 128 << 20

var releaseVersion = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z]+([.-][0-9A-Za-z]+)*)?$`)
var archiveDigest = regexp.MustCompile(`^[a-f0-9]{64}$`)

var launchReleasedApp = func(ctx context.Context, project string) error {
	version := cli.Metadata.Version
	if !releaseVersion.MatchString(version) || !archiveDigest.MatchString(releaseArchiveSHA256) {
		return errors.New("this CLI has no pinned DevTools release asset; use a published CLI or run xplat devtools --build-panels with the macOS toolchain")
	}

	cache, err := os.UserCacheDir()
	if err != nil {
		return err
	}
	cache = filepath.Join(cache, "octane-xplat", "devtools")
	tag := "v" + version
	if strings.Contains(version, "-nightly.") {
		tag = "devtools-v" + version
	}
	url := "https://github.com/octane-xplat/octane-xplat/releases/download/" + tag + "/" + archiveName
	client := &http.Client{
		CheckRedirect: func(request *http.Request, previous []*http.Request) error {
			if request.URL.Scheme != "https" || len(previous) >= 10 {
				return errors.New("DevTools download requires HTTPS redirects")
			}
			return nil
		},
	}
	installCtx, cancel := context.WithTimeout(ctx, 3*time.Minute)
	executable, err := installReleasedApp(installCtx, cache, version, releaseArchiveSHA256, url, client, os.Stderr)
	cancel()
	if err != nil {
		return fmt.Errorf("install DevTools %s: %w", version, err)
	}

	environment := append(os.Environ(), "XPLAT_DEVTOOLS_PREFERRED_ROOT="+project)
	result, err := proc.RunForegroundProcessIO(ctx, []string{executable}, project, environment, os.Stdout, os.Stderr)
	if err != nil {
		return err
	}
	if result.ExitCode != 0 {
		return fmt.Errorf("DevTools exited with status %d", result.ExitCode)
	}
	return nil
}

func installReleasedApp(ctx context.Context, cache, version, digest, url string, client *http.Client, diagnostics io.Writer) (string, error) {
	if err := os.MkdirAll(cache, 0700); err != nil {
		return "", err
	}
	root, err := os.OpenRoot(cache)
	if err != nil {
		return "", err
	}
	defer root.Close()

	key := version + "-" + digest
	unlock, err := osfs.LockCache(ctx, root, key+".lock")
	if err != nil {
		return "", err
	}
	defer unlock()

	executable := filepath.Join(cache, key, appExecutable)
	if _, err := root.Lstat(key); err == nil {
		if err := checkAppExecutable(root, filepath.Join(key, appExecutable)); err != nil {
			return "", fmt.Errorf("invalid cached DevTools app at %s: %w", filepath.Join(cache, key), err)
		}
		return executable, nil
	} else if !os.IsNotExist(err) {
		return "", err
	}

	fmt.Fprintf(diagnostics, "Downloading DevTools %s from GitHub Releases…\n", version)
	stage, err := os.MkdirTemp(cache, ".install-")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(stage)

	archive := filepath.Join(stage, archiveName)
	if err := downloadArchive(ctx, client, url, digest, archive); err != nil {
		return "", err
	}
	payload := filepath.Join(stage, "payload")
	if output, err := exec.CommandContext(ctx, "/usr/bin/ditto", "-x", "-k", archive, payload).CombinedOutput(); err != nil {
		return "", fmt.Errorf("extract verified DevTools archive: %w: %s", err, output)
	}
	if err := checkAppExecutable(root, filepath.Join(filepath.Base(stage), "payload", appExecutable)); err != nil {
		return "", err
	}
	if err := ctx.Err(); err != nil {
		return "", err
	}
	if err := root.Rename(filepath.Join(filepath.Base(stage), "payload"), key); err != nil {
		return "", err
	}
	return executable, nil
}

func checkAppExecutable(root *os.Root, path string) error {
	info, err := root.Lstat(path)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() || info.Mode().Perm()&0100 == 0 || info.Size() == 0 {
		return errors.New("archive does not contain a usable DevTools executable")
	}
	return nil
}

func downloadArchive(ctx context.Context, client *http.Client, url, expectedDigest, destination string) (returnErr error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("GitHub returned %s for %s", response.Status, url)
	}
	file, err := os.OpenFile(destination, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer func() { returnErr = errors.Join(returnErr, file.Close()) }()

	hash := sha256.New()
	size, err := io.Copy(io.MultiWriter(file, hash), io.LimitReader(response.Body, archiveLimit+1))
	if err != nil {
		return err
	}
	if size > archiveLimit {
		return errors.New("DevTools archive exceeds its download limit")
	}
	if hex.EncodeToString(hash.Sum(nil)) != expectedDigest {
		return errors.New("DevTools archive SHA-256 does not match the installed CLI")
	}
	return nil
}
