package source

import (
	"crypto/sha1"
	"encoding/hex"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"io"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf16"
)

func ScopedText(rootPath, exclusionRoot, path string, byteLimit int64, accept func(string) bool) (Data, string) {
	if !osfs.Inside(rootPath, path) {
		return Data{}, "out-of-scope"
	}
	if exclusionRoot == "" {
		exclusionRoot = rootPath
	}
	rel, err := filepath.Rel(exclusionRoot, path)
	if err != nil {
		return Data{}, "out-of-scope"
	}
	if !accept(filepath.ToSlash(rel)) {
		return Data{}, "excluded"
	}
	real, err := osfs.Canonical(path)
	root, rootErr := osfs.Canonical(rootPath)
	exclusion, exclusionErr := osfs.Canonical(exclusionRoot)
	if err != nil || rootErr != nil || exclusionErr != nil {
		return Data{}, "unavailable"
	}
	if !osfs.Inside(root, real) {
		return Data{}, "out-of-scope"
	}
	rel, _ = filepath.Rel(exclusion, real)
	if !accept(filepath.ToSlash(rel)) {
		return Data{}, "excluded"
	}
	directory, err := os.OpenRoot(root)
	if err != nil {
		return Data{}, "unavailable"
	}
	defer directory.Close()
	key, _ := filepath.Rel(root, real)
	file, err := osfs.OpenSourceFile(directory, key)
	if err != nil {
		return Data{}, "unavailable"
	}
	defer file.Close()
	before, err := file.Stat()
	if err != nil || !before.Mode().IsRegular() || before.Size() > byteLimit {
		return Data{}, "unavailable"
	}
	data, err := io.ReadAll(io.LimitReader(file, byteLimit+1))
	if err != nil || int64(len(data)) > byteLimit || strings.ContainsRune(string(data), '\x00') {
		return Data{}, "unavailable"
	}
	after, err := file.Stat()
	if err != nil || before.Size() != after.Size() || !before.ModTime().Equal(after.ModTime()) {
		return Data{}, "unavailable"
	}
	// Revalidate the alias and target after reading as well. Never serve a read
	// whose requested name changed to a different target during the operation.
	current, err := osfs.Canonical(path)
	info, statErr := os.Stat(current)
	if err != nil || statErr != nil || current != real || !os.SameFile(after, info) {
		return Data{}, "unavailable"
	}
	return Data{strings.ToValidUTF8(string(data), "\ufffd"), float64(after.ModTime().Unix())*1000 + float64(after.ModTime().Nanosecond())/1e6}, ""
}
func Hash(content string) string {
	sum := sha1.Sum([]byte(content))
	return hex.EncodeToString(sum[:])[:12]
}
func StringFromUnits(units sourceText) string {
	// Excerpts are human-readable leads, while source-page content preserves
	// exact continuation units through sourceText's JSON encoder.
	return string(utf16.Decode(units))
}

type Data struct {
	Content string
	Mtime   float64
}
