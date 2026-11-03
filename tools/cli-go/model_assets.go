package main

import (
	"crypto/sha256"
	"fmt"
	"os"
	"path/filepath"
)

var modelHashes = map[string]string{
	"config.json":               "7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7",
	"tokenizer.json":            "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
	"tokenizer_config.json":     "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3",
	"onnx/model_quantized.onnx": "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1",
}

func fileHash(path string) (string, error) {
	bytes, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", sha256.Sum256(bytes)), nil
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
