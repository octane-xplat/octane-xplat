package main

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode"
)

func init() { nativeLegacyCommands["updates init"] = updatesCommand }

func updatesDependencies(ctx context.Context, project string) error {
	entry, err := projectWorker(project)
	if err != nil {
		return err
	}
	child, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	result, err := runWorkerEntry(child, project, entry, "updates-check", nil, nil, nil)
	fmt.Fprint(os.Stderr, result.Process.Stdout, result.Process.Stderr)
	for _, warning := range result.Warnings {
		fmt.Fprintln(os.Stderr, warning)
	}
	if err != nil {
		return err
	}
	var data struct {
		Version  int
		Project  string
		Resolved []struct{ Specifier, Entry string }
	}
	if err = json.Unmarshal(result.Data, &data); err != nil {
		return err
	}
	if data.Version != 1 || data.Project == "" || len(data.Resolved) != 2 {
		return errors.New("invalid updates dependency response")
	}
	expected, err := projectLockIdentity(project)
	if err != nil {
		return err
	}
	actual, err := projectLockIdentity(data.Project)
	if err != nil || actual != expected {
		return errors.New("updates worker project identity mismatch")
	}
	for i, name := range []string{"@octane-xplat/updates/prepare", "@octane-xplat/fingerprint"} {
		item := data.Resolved[i]
		if item.Specifier != name || !filepath.IsAbs(item.Entry) {
			return errors.New("invalid updates dependency entry")
		}
		info, err := os.Stat(item.Entry)
		if err != nil || !info.Mode().IsRegular() {
			return fmt.Errorf("updates dependency entry is unavailable: %s", name)
		}
	}
	return nil
}

// Read source bytes through the selected app handle, preserving invalid UTF-8
// rather than normalizing user-owned ignore data during an append.
func updatesSource(scope artifactScope, before artifactState) ([]byte, error) {
	if !before.Exists {
		return nil, nil
	}
	directory, err := os.OpenRoot(scope.Anchor)
	if err != nil {
		return nil, err
	}
	defer directory.Close()
	key, err := scope.relative(before.Path)
	if err != nil {
		return nil, err
	}
	file, err := openSourceFile(directory, key)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() > maxArtifactBytes {
		return nil, errors.New("updates input must be an ordinary file within 16 MiB")
	}
	bytes, err := io.ReadAll(io.LimitReader(file, maxArtifactBytes+1))
	if err != nil {
		return nil, err
	}
	after, err := file.Stat()
	if err != nil || len(bytes) > maxArtifactBytes || !sameArtifactInfo(info, after) || fmt.Sprintf("%x", sha256.Sum256(bytes)) != before.Hash {
		return nil, errors.New("updates input changed while reading")
	}
	return bytes, nil
}

func updatesCommand(ctx context.Context, values map[string]any) error {
	project := stringValue(values["dir"])
	if project == "" {
		project = "."
	}
	project, err := filepath.Abs(project)
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	if _, err = projectManifest(project); err != nil {
		return fmt.Errorf("run updates init inside an app with package.json: %w", err)
	}
	if err = updatesDependencies(ctx, project); err != nil {
		return err
	}
	release, err := lockProjectOutputs(project)
	if err != nil {
		return err
	}
	defer release()
	if metadata.UpdatesHook == "" {
		return errors.New("native build is missing the canonical updates hook")
	}
	scope, err := outputScope(project, project)
	if err != nil {
		return err
	}
	hook := filepath.Join(project, "hooks", "after-prepare", "xplat-updates.cjs")
	paths := []string{hook, filepath.Join(project, ".gitignore")}
	artifacts := []plannedArtifact{}
	for i, path := range paths {
		before, err := snapshotArtifact(ctx, scope, path)
		if err != nil {
			return err
		}
		if before.Alias || before.Target != path {
			return fmt.Errorf("updates output contains aliases: %s", path)
		}
		bytes, err := updatesSource(scope, before)
		if err != nil {
			return err
		}
		source := string(bytes)
		if i == 0 {
			if source != "" && source != metadata.UpdatesHook {
				return errors.New("Existing OTA hook differs; reconcile it before running updates init")
			}
			source = metadata.UpdatesHook
		} else {
			ignored := false
			for _, line := range strings.Split(source, "\n") {
				line = strings.TrimFunc(line, func(r rune) bool { return unicode.IsSpace(r) || r == '\ufeff' })
				if line == ".xplat/" || line == "/.xplat/" {
					ignored = true
					break
				}
			}
			if !ignored {
				if source != "" && !strings.HasSuffix(source, "\n") {
					source += "\n"
				}
				source += ".xplat/\n"
			}
		}
		artifacts = append(artifacts, plannedArtifact{File: path, Source: source, Before: before})
	}
	if err = publishArtifacts(ctx, scope, artifacts, func() error {
		for _, file := range artifacts {
			if err := unchangedArtifact(ctx, scope, file.Before); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return &workspaceMutationError{Operation: "updates initialization", Root: project, Hint: "Inspect the hook and .gitignore before retrying", Err: err}
	}
	fmt.Printf("Created %s. Commit the hook and rebuild your iOS/Android binaries.\n", hook)
	return nil
}
