//go:build !onnx

package main

import (
	"context"
	"errors"
)

func embedModel(context.Context, modelRequest, [][]int64) (any, error) {
	return nil, errors.New("this probe was built without native ONNX support; use the explicit onnx build (no Node fallback)")
}
