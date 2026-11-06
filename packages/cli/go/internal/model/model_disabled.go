//go:build !onnx

package model

import "errors"

const nativeInferenceAvailable = false

func NewEmbeddingSession(Request) (EmbeddingSession, error) {
	return nil, errors.New("this executable was built without native ONNX support; use the native ONNX build")
}
