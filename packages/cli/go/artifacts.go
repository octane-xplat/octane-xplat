package main

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const maxArtifactBytes = 16 << 20
const maxArtifactPlanBytes = 64 << 20

type encodedArtifact struct {
	Path    string
	Before  *string
	Content *string
	Mode    *uint32
}

type artifactScope struct {
	Allowed, Anchor string
	AnchorInfo      os.FileInfo
}
type artifactState struct {
	Path, Target, Hash string
	Exists             bool
	Alias              bool
	Info               os.FileInfo
}
type plannedArtifact struct {
	File, Source string
	Before       artifactState
	Mode         os.FileMode
}
type artifactPublicationError struct {
	Published []string
	Retained  []string
	Err       error
}

func (err *artifactPublicationError) Error() string {
	if len(err.Retained) > 0 {
		return fmt.Sprintf("artifact cleanup not confirmed for %s after publishing %d files: %v", strings.Join(err.Retained, ", "), len(err.Published), err.Err)
	}
	return fmt.Sprintf("artifact publication stopped after %d files: %v; rerun generation to reconcile the complete set", len(err.Published), err.Err)
}
func (err *artifactPublicationError) Unwrap() error { return err.Err }

// Resolve the existing prefix without creating directories. The projected suffix
// remains confined to the opened ancestor when publication creates it later.
func projectedDirectory(path string) (string, string, os.FileInfo, error) {
	path = filepath.Clean(path)
	current := path
	for {
		info, err := os.Stat(current)
		if err == nil {
			if !info.IsDir() {
				return "", "", nil, fmt.Errorf("output ancestor is not a directory: %s", current)
			}
			actual, err := canonical(current)
			if err != nil {
				return "", "", nil, err
			}
			tail, err := filepath.Rel(current, path)
			if err != nil {
				return "", "", nil, err
			}
			return filepath.Join(actual, tail), actual, info, nil
		}
		if !os.IsNotExist(err) {
			return "", "", nil, err
		}
		parent := filepath.Dir(current)
		if parent == current {
			return "", "", nil, err
		}
		current = parent
	}
}
func outputScope(project, parent string) (artifactScope, error) {
	actual, anchor, info, err := projectedDirectory(parent)
	if err != nil {
		return artifactScope{}, err
	}
	if inside(project, actual) {
		info, err = os.Stat(project)
		return artifactScope{project, project, info}, err
	}
	return artifactScope{actual, anchor, info}, nil
}
func (scope artifactScope) relative(target string) (string, error) {
	relative, err := filepath.Rel(scope.Anchor, target)
	if err != nil || !inside(scope.Allowed, target) || !filepath.IsLocal(relative) || strings.ContainsRune(relative, 0) {
		return "", fmt.Errorf("artifact target leaves its authorized output scope: %s", target)
	}
	return relative, nil
}
func artifactHash(ctx context.Context, path string) (string, os.FileInfo, error) {
	root, err := os.OpenRoot(filepath.Dir(path))
	if err != nil {
		return "", nil, err
	}
	defer root.Close()
	file, err := openSourceFile(root, filepath.Base(path))
	if err != nil {
		return "", nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return "", nil, err
	}
	if !info.Mode().IsRegular() || info.Size() > maxArtifactBytes {
		return "", nil, fmt.Errorf("artifact must be a regular file within 16 MiB: %s", path)
	}
	hash := sha256.New()
	buffer := make([]byte, 64<<10)
	var total int64
	for {
		if err = ctx.Err(); err != nil {
			return "", nil, err
		}
		n, readErr := file.Read(buffer)
		total += int64(n)
		if total > maxArtifactBytes {
			return "", nil, errors.New("artifact grew beyond 16 MiB")
		}
		_, _ = hash.Write(buffer[:n])
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return "", nil, readErr
		}
	}
	after, err := file.Stat()
	if err != nil || !sameArtifactInfo(info, after) {
		return "", nil, errors.New("artifact changed while being inspected")
	}
	return fmt.Sprintf("%x", hash.Sum(nil)), info, nil
}
func sameArtifactInfo(a, b os.FileInfo) bool {
	return a != nil && b != nil && os.SameFile(a, b) && a.Size() == b.Size() && a.Mode() == b.Mode() && a.ModTime().Equal(b.ModTime())
}
func snapshotArtifact(ctx context.Context, scope artifactScope, path string) (artifactState, error) {
	state := artifactState{Path: path}
	lexical, err := os.Lstat(path)
	if os.IsNotExist(err) {
		parent, _, _, err := projectedDirectory(filepath.Dir(path))
		if err != nil {
			return state, err
		}
		state.Target = filepath.Join(parent, filepath.Base(path))
	} else if err != nil {
		return state, err
	} else {
		state.Exists = true
		state.Alias = lexical.Mode()&os.ModeSymlink != 0
		state.Target, err = canonical(path)
		if err != nil {
			return state, err
		}
	}
	if _, err = scope.relative(state.Target); err != nil {
		return state, err
	}
	if state.Exists {
		state.Hash, state.Info, err = artifactHash(ctx, state.Target)
	}
	return state, err
}
func unchangedArtifact(ctx context.Context, scope artifactScope, before artifactState) error {
	after, err := snapshotArtifact(ctx, scope, before.Path)
	if err != nil {
		return err
	}
	if after.Exists != before.Exists || after.Alias != before.Alias || after.Target != before.Target || after.Hash != before.Hash || (before.Exists && !sameArtifactInfo(before.Info, after.Info)) {
		return fmt.Errorf("artifact changed during planning: %s; retry generation", before.Path)
	}
	return nil
}

// Every plan and existing target is validated before staging. Renames publish
// complete individual files, not an all-files transaction. Report partial effects
// after an I/O failure or cancellation rather than attempting unsafe rollback.
func publishArtifacts(ctx context.Context, scope artifactScope, artifacts []plannedArtifact, revalidate func() error) (failure error) {
	root, err := os.OpenRoot(scope.Anchor)
	if err != nil {
		return err
	}
	defer root.Close()
	anchor, err := root.Stat(".")
	if err != nil || !os.SameFile(scope.AnchorInfo, anchor) {
		return errors.New("output root changed during planning")
	}
	type stagedArtifact struct{ Temporary, Target, Path string }
	staged := []stagedArtifact{}
	published := []string{}
	defer func() {
		retained := []string{}
		var cleanup error
		for _, artifact := range staged {
			err := root.Remove(artifact.Temporary)
			if err != nil && !os.IsNotExist(err) {
				// Existing output modes may make an unpublished Windows temp
				// read-only. This name is exclusively allocated and still owned.
				_ = root.Chmod(artifact.Temporary, 0600)
				err = root.Remove(artifact.Temporary)
			}
			if err != nil && !os.IsNotExist(err) {
				retained = append(retained, filepath.Join(scope.Anchor, artifact.Temporary))
				cleanup = errors.Join(cleanup, err)
			}
		}
		if cleanup != nil {
			failure = &artifactPublicationError{Published: published, Retained: retained, Err: errors.Join(failure, cleanup)}
		}
	}()
	for _, artifact := range artifacts {
		if err = ctx.Err(); err != nil {
			return err
		}
		if err = unchangedArtifact(ctx, scope, artifact.Before); err != nil {
			return err
		}
		if artifact.Before.Exists && artifact.Before.Hash == digestText(artifact.Source) {
			continue
		}
		target, err := scope.relative(artifact.Before.Target)
		if err != nil {
			return err
		}
		if err = root.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}
		temporary := target + ".tmp-xplat-" + identity()
		file, err := root.OpenFile(temporary, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0666)
		if err != nil {
			return err
		}
		info, statErr := file.Stat()
		if statErr != nil || !info.Mode().IsRegular() {
			_ = file.Close()
			return errors.New("artifact staging did not create a regular file")
		}
		staged = append(staged, stagedArtifact{temporary, target, artifact.File})
		_, writeErr := io.WriteString(file, artifact.Source)
		if writeErr == nil && artifact.Before.Exists {
			writeErr = file.Chmod(artifact.Before.Info.Mode().Perm())
		} else if writeErr == nil && artifact.Mode != 0 {
			writeErr = file.Chmod(artifact.Mode.Perm())
		}
		closeErr := file.Close()
		if writeErr != nil {
			return writeErr
		}
		if closeErr != nil {
			return closeErr
		}
	}
	if err = revalidate(); err != nil {
		return err
	}
	for _, artifact := range artifacts {
		if err = unchangedArtifact(ctx, scope, artifact.Before); err != nil {
			return err
		}
	}
	for _, artifact := range staged {
		err = ctx.Err()
		if err == nil {
			err = root.Rename(artifact.Temporary, artifact.Target)
		}
		if err != nil {
			return &artifactPublicationError{Published: published, Err: err}
		}
		published = append(published, artifact.Path)
	}
	return nil
}
