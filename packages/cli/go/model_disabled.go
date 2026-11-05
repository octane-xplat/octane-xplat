//go:build !onnx

package main

import "errors"

const nativeInferenceAvailable = false

func newEmbeddingSession(modelRequest) (embeddingSession, error) {
	return nil, errors.New("this executable was built without native ONNX support; use the native ONNX build")
}
