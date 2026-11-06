//go:build onnx

package model

import (
	"context"
	"errors"
	"fmt"
	ort "github.com/yalue/onnxruntime_go"
	"math"
)

const nativeInferenceAvailable = true

type ortEmbeddingSession struct {
	session *ort.DynamicAdvancedSession
	engine  string
}

func NewEmbeddingSession(input Request) (_ EmbeddingSession, failure error) {
	if len(input.LibrarySHA256) != 64 {
		return nil, errors.New("an explicit pinned native runtime SHA256 is required")
	}
	actual, err := fileHash(input.Library)
	if err != nil || actual != input.LibrarySHA256 {
		return nil, errors.New("native ONNX runtime checksum mismatch")
	}
	ort.SetSharedLibraryPath(input.Library)
	if err = ort.InitializeEnvironment(); err != nil {
		return nil, err
	}
	defer func() {
		if failure != nil {
			_ = ort.DestroyEnvironment()
		}
	}()
	options, err := ort.NewSessionOptions()
	if err != nil {
		return nil, err
	}
	defer options.Destroy()
	if err = options.SetIntraOpNumThreads(1); err != nil {
		return nil, err
	}
	if err = options.SetInterOpNumThreads(1); err != nil {
		return nil, err
	}
	if err = options.SetGraphOptimizationLevel(ort.GraphOptimizationLevelEnableBasic); err != nil {
		return nil, err
	}
	session, err := ort.NewDynamicAdvancedSession(input.Directory+"/onnx/model_quantized.onnx", []string{"input_ids", "attention_mask", "token_type_ids"}, []string{"last_hidden_state"}, options)
	if err != nil {
		return nil, err
	}
	return &ortEmbeddingSession{session, fmt.Sprintf("onnxruntime-%s:cpu:basic:threads-1:single-sequence:go", ort.GetVersion())}, nil
}
func (session *ortEmbeddingSession) Engine() string { return session.engine }
func (session *ortEmbeddingSession) Close() {
	_ = session.session.Destroy()
	_ = ort.DestroyEnvironment()
}
func (session *ortEmbeddingSession) Embed(ctx context.Context, sequences [][]int64) ([][]float64, error) {
	vectors := [][]float64{}
	for _, ids := range sequences {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		vector, err := inferSequence(ctx, session.session, ids)
		if err != nil {
			return nil, err
		}
		vectors = append(vectors, vector)
	}
	return vectors, nil
}
func inferSequence(ctx context.Context, session *ort.DynamicAdvancedSession, ids []int64) ([]float64, error) {
	mask, types := make([]int64, len(ids)), make([]int64, len(ids))
	for at := range mask {
		mask[at] = 1
	}
	shape := ort.NewShape(1, int64(len(ids)))
	a, err := ort.NewTensor(shape, ids)
	if err != nil {
		return nil, err
	}
	defer a.Destroy()
	b, err := ort.NewTensor(shape, mask)
	if err != nil {
		return nil, err
	}
	defer b.Destroy()
	c, err := ort.NewTensor(shape, types)
	if err != nil {
		return nil, err
	}
	defer c.Destroy()
	outputs := []ort.Value{nil}
	defer func() {
		if outputs[0] != nil {
			outputs[0].Destroy()
		}
	}()
	options, err := ort.NewRunOptions()
	if err != nil {
		return nil, err
	}
	defer options.Destroy()
	finished := make(chan struct{})
	watcherDone := make(chan struct{})
	go func() {
		defer close(watcherDone)
		select {
		case <-ctx.Done():
			_ = options.Terminate()
		case <-finished:
		}
	}()
	err = session.RunWithOptions([]ort.Value{a, b, c}, outputs, options)
	close(finished)
	<-watcherDone
	if ctx.Err() != nil {
		return nil, ctx.Err()
	}
	if err != nil {
		return nil, err
	}
	tensor, ok := outputs[0].(*ort.Tensor[float32])
	if !ok {
		return nil, errors.New("unexpected model output type")
	}
	data := tensor.GetData()
	if len(data) != len(ids)*384 {
		return nil, errors.New("unexpected model output shape")
	}
	vector := make([]float64, 384)
	for token := range ids {
		for at := range vector {
			vector[at] += float64(data[token*384+at]) / float64(len(ids))
		}
	}
	norm := 0.0
	for _, v := range vector {
		norm += v * v
	}
	norm = math.Sqrt(norm)
	if norm == 0 || math.IsNaN(norm) || math.IsInf(norm, 0) {
		return nil, errors.New("invalid model vector")
	}
	for at := range vector {
		vector[at] /= norm
	}
	return vector, nil
}
