package model

import "context"

type EmbeddingSession interface {
	Embed(context.Context, [][]int64) ([][]float64, error)
	Engine() string
	Close()
}

func embedModel(ctx context.Context, input Request, sequences [][]int64) (any, error) {
	if len(sequences) == 0 {
		return [][]float64{}, nil
	}
	session, err := NewEmbeddingSession(input)
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
