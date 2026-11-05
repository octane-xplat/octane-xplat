package main

import "context"

type embeddingSession interface {
	Embed(context.Context, [][]int64) ([][]float64, error)
	Engine() string
	Close()
}

func embedModel(ctx context.Context, input modelRequest, sequences [][]int64) (any, error) {
	if len(sequences) == 0 {
		return [][]float64{}, nil
	}
	session, err := newEmbeddingSession(input)
	if err != nil {
		return nil, err
	}
	defer session.Close()
	vectors, err := session.Embed(ctx, sequences)
	if err != nil {
		return nil, err
	}
	return map[string]any{"engine": session.Engine(), "vectors": vectors}, nil
}
