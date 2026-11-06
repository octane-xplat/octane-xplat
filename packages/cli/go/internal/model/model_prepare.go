package model

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/assets"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"time"
)

// Pinned module dependencies folded into the model cache identity. The
// model-pins unit test asserts these match go.mod.
var nativeModulePins = []string{"golang.org/x/text@v0.43.0", "github.com/yalue/onnxruntime_go@v1.38.0"}

type runtimeAssetPin struct {
	URL           string `json:"url"`
	Bytes         int64  `json:"bytes"`
	SHA256        string `json:"sha256"`
	Directory     string `json:"directory"`
	Library       string `json:"library"`
	LibrarySHA256 string `json:"librarySha256"`
	LibraryBytes  int64  `json:"libraryBytes"`
}
type nativeAssetManifest struct {
	Version string                     `json:"version"`
	Targets map[string]runtimeAssetPin `json:"targets"`
}
type assetDownload struct {
	URL, SHA256 string
	Bytes       int64
}
type runtimeAssetRecord struct {
	Archive string            `json:"archive"`
	Files   map[string]string `json:"files"`
}

var modelSizes = map[string]int64{"config.json": 650, "tokenizer.json": 711661, "tokenizer_config.json": 366, "onnx/model_quantized.onnx": 22972370}

func SelectedRuntime() (runtimeAssetPin, string, error) {
	var manifest nativeAssetManifest
	if err := json.Unmarshal(assets.NativeAssets, &manifest); err != nil {
		return runtimeAssetPin{}, "", err
	}
	target := runtime.GOOS + "-" + runtime.GOARCH
	pin, ok := manifest.Targets[target]
	if !ok {
		return pin, "", fmt.Errorf("native inference has no pinned runtime for %s", target)
	}
	return pin, manifest.Version, nil
}
func NativeModelID() string {
	pin, version, err := SelectedRuntime()
	if err != nil {
		return "native-model-unavailable"
	}
	dependencies := []string{runtime.Version()}
	dependencies = append(dependencies, nativeModulePins...)
	slices.Sort(dependencies)
	return modelName + "@" + modelRevision + ":q8:mean:normalized:onnxruntime-" + version + ":cpu:basic:threads-1:sequence-512:embedding-prefix-65536:go-tokenizer-v1:" + pin.LibrarySHA256 + ":deps-" + osfs.DigestText(strings.Join(dependencies, "\n"))
}
func NativeIndexSupported() bool {
	if !nativeInferenceAvailable {
		return false
	}
	_, _, err := SelectedRuntime()
	return err == nil
}

// Stream bytes to private staging, checking the exact size and digest before
// any cache publication. Request cancellation closes the response body.
func downloadAsset(ctx context.Context, client *http.Client, pin assetDownload, path string) error {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, pin.URL, nil)
	if err != nil {
		return err
	}
	response, err := client.Do(request)
	if err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return errors.New("asset download failed; check access to the pinned asset hosts")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("asset download returned HTTP %d", response.StatusCode)
	}
	if pin.Bytes <= 0 || pin.Bytes > 256<<20 || (response.ContentLength >= 0 && response.ContentLength != pin.Bytes) {
		return errors.New("asset download size does not match its pin")
	}
	file, err := osfs.PrivateOutput(path)
	if err != nil {
		return err
	}
	hash := sha256.New()
	n, copyErr := io.Copy(io.MultiWriter(file, hash), io.LimitReader(response.Body, pin.Bytes+1))
	closeErr := file.Close()
	if copyErr != nil {
		return copyErr
	}
	if closeErr != nil {
		return closeErr
	}
	if n != pin.Bytes || fmt.Sprintf("%x", hash.Sum(nil)) != pin.SHA256 {
		return errors.New("asset download checksum/size mismatch")
	}
	return ctx.Err()
}
func PublishAsset(root *os.Root, cache, staging, destination string) error {
	if err := root.MkdirAll(filepath.Dir(destination), 0700); err != nil {
		return err
	}
	relative, err := filepath.Rel(cache, staging)
	if err != nil {
		return err
	}
	return root.Rename(relative, filepath.FromSlash(destination))
}
func runtimeAssetNames(pin runtimeAssetPin) []string {
	return []string{pin.Library, "LICENSE", "ThirdPartyNotices.txt"}
}

func extractRuntimeArchive(ctx context.Context, archive, destination string, pin runtimeAssetPin) (runtimeAssetRecord, error) {
	record := runtimeAssetRecord{Archive: pin.SHA256, Files: map[string]string{}}
	selected := runtimeAssetNames(pin)
	copyEntry := func(name string, size int64, regular bool, reader io.Reader) error {
		if !strings.HasPrefix(name, pin.Directory+"/") {
			return nil
		}
		relative := strings.TrimPrefix(name, pin.Directory+"/")
		if !slices.Contains(selected, relative) {
			return nil
		}
		if !osfs.SafeSnapshotPath(relative) || !regular || size <= 0 || size > 64<<20 {
			return errors.New("invalid native runtime archive member")
		}
		if relative == pin.Library && size != pin.LibraryBytes {
			return errors.New("native runtime library size mismatch")
		}
		if relative != pin.Library && size > 8<<20 {
			return errors.New("native runtime notice exceeds 8 MiB")
		}
		if _, ok := record.Files[relative]; ok {
			return errors.New("duplicate native runtime archive member")
		}
		path := filepath.Join(destination, filepath.FromSlash(relative))
		if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
			return err
		}
		file, err := osfs.PrivateOutput(path)
		if err != nil {
			return err
		}
		hash := sha256.New()
		n, copyErr := io.Copy(io.MultiWriter(file, hash), io.LimitReader(reader, size+1))
		closeErr := file.Close()
		if copyErr != nil {
			return copyErr
		}
		if closeErr != nil {
			return closeErr
		}
		if n != size {
			return errors.New("incomplete runtime archive member")
		}
		digest := fmt.Sprintf("%x", hash.Sum(nil))
		if relative == pin.Library && digest != pin.LibrarySHA256 {
			return errors.New("native runtime library checksum mismatch")
		}
		record.Files[relative] = digest
		return ctx.Err()
	}
	if strings.HasSuffix(pin.URL, ".zip") {
		reader, err := zip.OpenReader(archive)
		if err != nil {
			return record, err
		}
		defer reader.Close()
		if len(reader.File) > 20000 {
			return record, errors.New("runtime archive exceeds entry limit")
		}
		for _, file := range reader.File {
			if err := ctx.Err(); err != nil {
				return record, err
			}
			if !slices.Contains(selected, strings.TrimPrefix(file.Name, pin.Directory+"/")) {
				continue
			}
			if file.UncompressedSize64 > 256<<20 {
				return record, errors.New("runtime archive member exceeds limit")
			}
			body, err := file.Open()
			if err != nil {
				return record, err
			}
			err = copyEntry(file.Name, int64(file.UncompressedSize64), file.Mode().IsRegular(), body)
			closeErr := body.Close()
			if err != nil {
				return record, err
			}
			if closeErr != nil {
				return record, closeErr
			}
		}
	} else {
		file, err := os.Open(archive)
		if err != nil {
			return record, err
		}
		defer file.Close()
		compressed, err := gzip.NewReader(file)
		if err != nil {
			return record, err
		}
		defer compressed.Close()
		reader := tar.NewReader(io.LimitReader(compressed, 256<<20))
		for count := 0; ; count++ {
			if err := ctx.Err(); err != nil {
				return record, err
			}
			entry, err := reader.Next()
			if err == io.EOF {
				break
			}
			if err != nil {
				return record, err
			}
			if count >= 20000 {
				return record, errors.New("runtime archive exceeds entry limit")
			}
			if err = copyEntry(entry.Name, entry.Size, entry.Typeflag == tar.TypeReg, reader); err != nil {
				return record, err
			}
		}
	}
	for _, name := range selected {
		if record.Files[name] == "" {
			return record, fmt.Errorf("native runtime archive omitted %s", name)
		}
	}
	return record, nil
}

func verifyRuntimeAssets(directory string, pin runtimeAssetPin) error {
	data, err := osfs.MetadataBytes(filepath.Join(directory, "runtime.json"), 1<<20)
	if err != nil {
		return err
	}
	var record runtimeAssetRecord
	if err = json.Unmarshal(data, &record); err != nil {
		return err
	}
	if record.Archive != pin.SHA256 || record.Files[pin.Library] != pin.LibrarySHA256 || len(record.Files) != 3 {
		return errors.New("native runtime record mismatch")
	}
	for _, name := range runtimeAssetNames(pin) {
		hash, err := fileHash(filepath.Join(directory, filepath.FromSlash(name)))
		if err != nil || hash != record.Files[name] {
			return errors.New("native runtime asset mismatch")
		}
	}
	return nil
}

func PrepareModelAssets(ctx context.Context, cache, operation string, download bool) (Request, error) {
	if !nativeInferenceAvailable {
		return Request{}, errors.New("native inference is unavailable in this build")
	}
	pin, version, err := SelectedRuntime()
	if err != nil {
		return Request{}, err
	}
	modelRelative := "assets/models/" + modelName + "/" + modelRevision
	runtimeRelative := "assets/runtime/" + version + "/" + runtime.GOOS + "-" + runtime.GOARCH + "/" + pin.SHA256
	modelDirectory, runtimeDirectory := filepath.Join(cache, filepath.FromSlash(modelRelative)), filepath.Join(cache, filepath.FromSlash(runtimeRelative))
	input := Request{Directory: modelDirectory, Library: filepath.Join(runtimeDirectory, filepath.FromSlash(pin.Library)), LibrarySHA256: pin.LibrarySHA256}
	if !download {
		if err = verifyModelAssets(modelDirectory); err != nil {
			return input, err
		}
		return input, verifyRuntimeAssets(runtimeDirectory, pin)
	}
	root, err := os.OpenRoot(cache)
	if err != nil {
		return input, err
	}
	defer root.Close()
	unlock, err := osfs.LockCache(ctx, root, "assets.lock")
	if err != nil {
		return input, err
	}
	defer unlock()
	stage, err := osfs.PrivateDirectory(operation, "assets-")
	if err != nil {
		return input, err
	}
	client := &http.Client{Timeout: 2 * time.Minute, CheckRedirect: func(request *http.Request, via []*http.Request) error {
		if request.URL.Scheme != "https" || len(via) >= 10 {
			return errors.New("asset redirect must remain HTTPS within ten hops")
		}
		return nil
	}}
	names := []string{}
	for name := range modelHashes {
		names = append(names, name)
	}
	slices.Sort(names)
	for _, name := range names {
		current, err := fileHash(filepath.Join(modelDirectory, filepath.FromSlash(name)))
		if err == nil && current == modelHashes[name] {
			continue
		}
		staging := filepath.Join(stage, osfs.Identity())
		pin := assetDownload{"https://huggingface.co/" + modelName + "/resolve/" + modelRevision + "/" + name, modelHashes[name], modelSizes[name]}
		if err = downloadAsset(ctx, client, pin, staging); err != nil {
			return input, err
		}
		if err = PublishAsset(root, cache, staging, modelRelative+"/"+name); err != nil {
			return input, err
		}
	}
	if verifyRuntimeAssets(runtimeDirectory, pin) != nil {
		archive := filepath.Join(stage, "runtime.archive")
		if err = downloadAsset(ctx, client, assetDownload{pin.URL, pin.SHA256, pin.Bytes}, archive); err != nil {
			return input, err
		}
		extracted := filepath.Join(stage, "runtime")
		if err = os.Mkdir(extracted, 0700); err != nil {
			return input, err
		}
		record, err := extractRuntimeArchive(ctx, archive, extracted, pin)
		if err != nil {
			return input, err
		}
		for _, name := range runtimeAssetNames(pin) {
			if err = PublishAsset(root, cache, filepath.Join(extracted, filepath.FromSlash(name)), runtimeRelative+"/"+name); err != nil {
				return input, err
			}
		}
		data, err := json.Marshal(record)
		if err != nil {
			return input, err
		}
		staging := filepath.Join(stage, "runtime.json")
		if err = osfs.PrivateFile(staging, data); err != nil {
			return input, err
		}
		if err = PublishAsset(root, cache, staging, runtimeRelative+"/runtime.json"); err != nil {
			return input, err
		}
	}
	if err = verifyModelAssets(modelDirectory); err != nil {
		return input, err
	}
	return input, verifyRuntimeAssets(runtimeDirectory, pin)
}
