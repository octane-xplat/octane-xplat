package model

import (
	"crypto/sha256"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"io"
	"os"
	"path/filepath"
)

var modelHashes = map[string]string{
	"config.json":               "7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7",
	"tokenizer.json":            "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
	"tokenizer_config.json":     "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3",
	"onnx/model_quantized.onnx": "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1",
}

const modelName = "Xenova/all-MiniLM-L6-v2"
const modelRevision = "751bff37182d3f1213fa05d7196b954e230abad9"

func fileHash(path string) (string, error) {
	root, err := os.OpenRoot(filepath.Dir(path))
	if err != nil {
		return "", err
	}
	defer root.Close()
	file, err := osfs.OpenSourceFile(root, filepath.Base(path))
	if err != nil {
		return "", err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return "", err
	}
	const limit = 256 << 20
	if !info.Mode().IsRegular() || info.Size() > limit {
		return "", fmt.Errorf("asset must be a regular file within 256 MiB")
	}
	hash := sha256.New()
	n, err := io.Copy(hash, io.LimitReader(file, limit+1))
	if err != nil {
		return "", err
	}
	if n > limit {
		return "", fmt.Errorf("asset grew beyond 256 MiB")
	}
	return fmt.Sprintf("%x", hash.Sum(nil)), nil
}
func verifyModelAssets(directory string) error {
	for file, expected := range modelHashes {
		actual, err := fileHash(filepath.Join(directory, file))
		if err != nil || actual != expected {
			return fmt.Errorf("pinned model asset mismatch: %s", file)
		}
	}
	return nil
}
