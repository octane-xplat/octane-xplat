package artifact

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const MaxArtifactBytes = 16 << 20
const MaxArtifactPlanBytes = 64 << 20

type EncodedArtifact struct {
	Path    string
	Before  *string
	Content *string
	Mode    *uint32
}

type Scope struct {
	Allowed, Anchor string
	AnchorInfo      os.FileInfo
}
type State struct {
	Path, Target, Hash string
	Exists             bool
	Alias              bool
	Info               os.FileInfo
}
type PlannedArtifact struct {
	File, Source string
	Before       State
	Mode         os.FileMode
}
type PublicationError struct {
	Published []string
	Retained  []string
	Err       error
}

func (err *PublicationError) RequiresFailureEvidence() bool {
	return len(err.Published) > 0 || len(err.Retained) > 0
}

func (err *PublicationError) Error() string {
	if len(err.Retained) > 0 {
		return fmt.Sprintf("artifact cleanup not confirmed for %s after publishing %d files: %v", strings.Join(err.Retained, ", "), len(err.Published), err.Err)
	}
	return fmt.Sprintf("artifact publication stopped after %d files: %v; rerun generation to reconcile the complete set", len(err.Published), err.Err)
}
func (err *PublicationError) Unwrap() error { return err.Err }

// Resolve the existing prefix without creating directories. The projected suffix
// remains confined to the opened ancestor when publication creates it later.
func ProjectedDirectory(path string) (string, string, os.FileInfo, error) {
	path = filepath.Clean(path)
	current := path
	for {
		info, err := os.Stat(current)
		if err == nil {
			if !info.IsDir() {
				return "", "", nil, fmt.Errorf("output ancestor is not a directory: %s", current)
			}
			actual, err := osfs.Canonical(current)
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
func OutputScope(project, parent string) (Scope, error) {
	actual, anchor, info, err := ProjectedDirectory(parent)
	if err != nil {
		return Scope{}, err
	}
	if osfs.Inside(project, actual) {
		info, err = os.Stat(project)
		return Scope{project, project, info}, err
	}
	return Scope{actual, anchor, info}, nil
}
func (scope Scope) relative(target string) (string, error) {
	relative, err := filepath.Rel(scope.Anchor, target)
	if err != nil || !osfs.Inside(scope.Allowed, target) || !filepath.IsLocal(relative) || strings.ContainsRune(relative, 0) {
		return "", fmt.Errorf("artifact target leaves its authorized output scope: %s", target)
	}
	return relative, nil
}
func Hash(ctx context.Context, path string) (string, os.FileInfo, error) {
	root, err := os.OpenRoot(filepath.Dir(path))
	if err != nil {
		return "", nil, err
	}
	defer root.Close()
	file, err := osfs.OpenSourceFile(root, filepath.Base(path))
	if err != nil {
		return "", nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return "", nil, err
	}
	if !info.Mode().IsRegular() || info.Size() > MaxArtifactBytes {
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
		if total > MaxArtifactBytes {
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
	if err != nil || !SameArtifactInfo(info, after) {
		return "", nil, errors.New("artifact changed while being inspected")
	}
	return fmt.Sprintf("%x", hash.Sum(nil)), info, nil
}
func SameArtifactInfo(a, b os.FileInfo) bool {
	return a != nil && b != nil && os.SameFile(a, b) && a.Size() == b.Size() && a.Mode() == b.Mode() && a.ModTime().Equal(b.ModTime())
}
func SnapshotArtifact(ctx context.Context, scope Scope, path string) (State, error) {
	state := State{Path: path}
	lexical, err := os.Lstat(path)
	if os.IsNotExist(err) {
		parent, _, _, err := ProjectedDirectory(filepath.Dir(path))
		if err != nil {
			return state, err
		}
		state.Target = filepath.Join(parent, filepath.Base(path))
	} else if err != nil {
		return state, err
	} else {
		state.Exists = true
		state.Alias = lexical.Mode()&os.ModeSymlink != 0
		state.Target, err = osfs.Canonical(path)
		if err != nil {
			return state, err
		}
	}
	if _, err = scope.relative(state.Target); err != nil {
		return state, err
	}
	if state.Exists {
		state.Hash, state.Info, err = Hash(ctx, state.Target)
	}
	return state, err
}
func UnchangedArtifact(ctx context.Context, scope Scope, before State) error {
	after, err := SnapshotArtifact(ctx, scope, before.Path)
	if err != nil {
		return err
	}
	if after.Exists != before.Exists || after.Alias != before.Alias || after.Target != before.Target || after.Hash != before.Hash || (before.Exists && !SameArtifactInfo(before.Info, after.Info)) {
		return fmt.Errorf("artifact changed during planning: %s; retry generation", before.Path)
	}
	return nil
}

// Every plan and existing target is validated before staging. Renames publish
// complete individual files, not an all-files transaction. Report partial effects
// after an I/O failure or cancellation rather than attempting unsafe rollback.
func PublishArtifacts(ctx context.Context, scope Scope, artifacts []PlannedArtifact, revalidate func() error) (failure error) {
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
			failure = &PublicationError{Published: published, Retained: retained, Err: errors.Join(failure, cleanup)}
		}
	}()
	for _, artifact := range artifacts {
		if err = ctx.Err(); err != nil {
			return err
		}
		if err = UnchangedArtifact(ctx, scope, artifact.Before); err != nil {
			return err
		}
		if artifact.Before.Exists && artifact.Before.Hash == osfs.DigestText(artifact.Source) {
			continue
		}
		target, err := scope.relative(artifact.Before.Target)
		if err != nil {
			return err
		}
		if err = root.MkdirAll(filepath.Dir(target), 0755); err != nil {
			return err
		}
		temporary := target + ".tmp-xplat-" + osfs.Identity()
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
		if err = UnchangedArtifact(ctx, scope, artifact.Before); err != nil {
			return err
		}
	}
	for _, artifact := range staged {
		err = ctx.Err()
		if err == nil {
			err = root.Rename(artifact.Temporary, artifact.Target)
		}
		if err != nil {
			return &PublicationError{Published: published, Err: err}
		}
		published = append(published, artifact.Path)
	}
	return nil
}

// Read source bytes through the selected app handle, preserving invalid UTF-8
// rather than normalizing user-owned ignore data during an append.
func ReadArtifactBytes(scope Scope, before State) ([]byte, error) {
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
	file, err := osfs.OpenSourceFile(directory, key)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() || info.Size() > MaxArtifactBytes {
		return nil, errors.New("artifact input must be an ordinary file within 16 MiB")
	}
	bytes, err := io.ReadAll(io.LimitReader(file, MaxArtifactBytes+1))
	if err != nil {
		return nil, err
	}
	after, err := file.Stat()
	if err != nil || len(bytes) > MaxArtifactBytes || !SameArtifactInfo(info, after) || fmt.Sprintf("%x", sha256.Sum256(bytes)) != before.Hash {
		return nil, errors.New("artifact input changed while reading")
	}
	return bytes, nil
}
