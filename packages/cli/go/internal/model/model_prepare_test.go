package model

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestAssetDownloadBinaryIntegrityAndCancellation(t *testing.T) {
	payload := bytes.Repeat([]byte{0, 255, 32, 128}, 1024)
	digest := fmt.Sprintf("%x", sha256.Sum256(payload))
	ready := make(chan struct{}, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/wait" {
			_, _ = w.Write(payload[:4])
			w.(http.Flusher).Flush()
			ready <- struct{}{}
			<-r.Context().Done()
			return
		}
		_, _ = w.Write(payload)
	}))
	defer server.Close()
	for _, fixture := range []struct {
		name  string
		size  int64
		hash  string
		valid bool
	}{{"valid", int64(len(payload)), digest, true}, {"hash", int64(len(payload)), "bad", false}, {"short", 4, digest, false}} {
		t.Run(fixture.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "staged.bin")
			err := downloadAsset(context.Background(), server.Client(), assetDownload{server.URL, fixture.hash, fixture.size}, path)
			if (err == nil) != fixture.valid {
				t.Fatalf("unexpected download result: %v", err)
			}
			if fixture.valid {
				actual, err := os.ReadFile(path)
				if err != nil || !bytes.Equal(actual, payload) {
					t.Fatalf("binary bytes changed: %v", err)
				}
			}
		})
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	result := make(chan error, 1)
	path := filepath.Join(t.TempDir(), "cancel.bin")
	go func() {
		result <- downloadAsset(ctx, server.Client(), assetDownload{server.URL + "/wait", digest, int64(len(payload))}, path)
	}()
	select {
	case <-ready:
	case <-time.After(5 * time.Second):
		t.Fatal("download did not reach observed body phase")
	}
	cancel()
	select {
	case err := <-result:
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("cancellation lost: %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("cancelled download did not return")
	}
}

func TestRuntimeArchiveExtractsOnlyPinnedRegularMembers(t *testing.T) {
	for _, format := range []string{"tar", "zip"} {
		for _, failure := range []string{"", "duplicate", "wrong-bytes", "link"} {
			t.Run(format+"-"+failure, func(t *testing.T) {
				base := t.TempDir()
				library := []byte("pinned native library")
				pin := runtimeAssetPin{URL: "fixture.tgz", Directory: "runtime", Library: "lib/runtime.bin", LibraryBytes: int64(len(library)), LibrarySHA256: fmt.Sprintf("%x", sha256.Sum256(library))}
				archive := filepath.Join(base, "archive")
				f, err := os.Create(archive)
				if err != nil {
					t.Fatal(err)
				}
				type entry struct {
					name string
					data []byte
					link bool
				}
				entries := []entry{{"runtime/../outside", []byte("private"), false}, {"runtime/LICENSE", []byte("license"), false}, {"runtime/ThirdPartyNotices.txt", []byte("notices"), false}, {"runtime/lib/runtime.bin", library, failure == "link"}}
				if failure == "wrong-bytes" {
					entries[3].data = bytes.Repeat([]byte("x"), len(library))
				}
				if failure == "duplicate" {
					entries = append(entries, entries[3])
				}
				if format == "tar" {
					compressed := gzip.NewWriter(f)
					writer := tar.NewWriter(compressed)
					for _, entry := range entries {
						h := &tar.Header{Name: entry.name, Mode: 0600, Size: int64(len(entry.data)), Typeflag: tar.TypeReg}
						if entry.link {
							h.Typeflag = tar.TypeSymlink
							h.Linkname = "../outside"
							h.Size = 0
						}
						if err := writer.WriteHeader(h); err != nil {
							t.Fatal(err)
						}
						if !entry.link {
							if _, err := writer.Write(entry.data); err != nil {
								t.Fatal(err)
							}
						}
					}
					if err := writer.Close(); err != nil {
						t.Fatal(err)
					}
					if err := compressed.Close(); err != nil {
						t.Fatal(err)
					}
				} else {
					pin.URL = "fixture.zip"
					writer := zip.NewWriter(f)
					for _, entry := range entries {
						h := &zip.FileHeader{Name: entry.name, Method: zip.Deflate}
						h.SetMode(0600)
						if entry.link {
							h.SetMode(os.ModeSymlink | 0600)
						}
						out, err := writer.CreateHeader(h)
						if err != nil {
							t.Fatal(err)
						}
						if _, err = out.Write(entry.data); err != nil {
							t.Fatal(err)
						}
					}
					if err := writer.Close(); err != nil {
						t.Fatal(err)
					}
				}
				if err := f.Close(); err != nil {
					t.Fatal(err)
				}
				destination := filepath.Join(base, "output")
				if err := os.Mkdir(destination, 0700); err != nil {
					t.Fatal(err)
				}
				record, err := extractRuntimeArchive(context.Background(), archive, destination, pin)
				if (err == nil) != (failure == "") {
					t.Fatalf("unexpected archive result: %v", err)
				}
				if failure == "" && len(record.Files) != 3 {
					t.Fatal("expected pinned library and notices")
				}
				if _, err := os.Stat(filepath.Join(base, "outside")); !os.IsNotExist(err) {
					t.Fatal("unselected traversal was extracted")
				}
			})
		}
	}
}
