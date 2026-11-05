// SPDX-License-Identifier: Apache-2.0
// Adapted from the restricted Nim BERT/WordPiece port and tokenizers.js 0.2.0.
// See NOTICE.txt and licenses/tokenizers-js.txt. This is not a general tokenizer.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
	"golang.org/x/text/unicode/norm"
	"path/filepath"
	"strings"
	"unicode"
)

type modelRequest struct {
	Directory     string   `json:"directory"`
	Library       string   `json:"library"`
	LibrarySHA256 string   `json:"librarySha256"`
	Texts         []string `json:"texts"`
}
type tokenizer struct{ vocab map[string]int64 }

var specials = []string{"[PAD]", "[UNK]", "[CLS]", "[SEP]", "[MASK]"}

func newTokenizer(directory string) (*tokenizer, error) {
	bytes, err := metadataBytes(filepath.Join(directory, "tokenizer.json"), 4<<20)
	if err != nil {
		return nil, err
	}
	var data struct {
		Model struct{ Vocab map[string]int64 }
	}
	if err = json.Unmarshal(bytes, &data); err != nil {
		return nil, err
	}
	if data.Model.Vocab["[CLS]"] != 101 || data.Model.Vocab["[SEP]"] != 102 {
		return nil, errors.New("unsupported tokenizer vocabulary")
	}
	return &tokenizer{data.Model.Vocab}, nil
}
func (t *tokenizer) words(text string) []string {
	var clean strings.Builder
	for _, r := range text {
		if r == 0 || r == unicode.ReplacementChar {
			continue
		}
		if r != '\t' && r != '\n' && r != '\r' && (unicode.IsControl(r) || unicode.In(r, unicode.Cf, unicode.Co)) {
			continue
		}
		if unicode.IsSpace(r) || r == '\ufeff' {
			clean.WriteByte(' ')
		} else if r >= 0x4e00 && r <= 0x9fff || r >= 0x3400 && r <= 0x4dbf || r >= 0xf900 && r <= 0xfaff {
			clean.WriteByte(' ')
			clean.WriteRune(r)
			clean.WriteByte(' ')
		} else {
			clean.WriteRune(r)
		}
	}
	text = norm.NFD.String(cases.Lower(language.Und).String(clean.String()))
	words := []string{}
	var word strings.Builder
	flush := func() {
		if word.Len() > 0 {
			words = append(words, word.String())
			word.Reset()
		}
	}
	for _, r := range text {
		if unicode.Is(unicode.Mn, r) {
			continue
		}
		punct := unicode.IsPunct(r) || r >= 33 && r <= 47 || r >= 58 && r <= 64 || r >= 91 && r <= 96 || r >= 123 && r <= 126
		if unicode.IsSpace(r) {
			flush()
		} else if punct {
			flush()
			words = append(words, string(r))
		} else {
			word.WriteRune(r)
		}
	}
	flush()
	return words
}
func (t *tokenizer) piece(word string) []int64 {
	runes := []rune(word)
	if len(runes) > 100 {
		return []int64{t.vocab["[UNK]"]}
	}
	ids := []int64{}
	for start := 0; start < len(runes); {
		found := false
		for end := len(runes); end > start; end-- {
			part := string(runes[start:end])
			if start > 0 {
				part = "##" + part
			}
			if id, ok := t.vocab[part]; ok {
				ids = append(ids, id)
				start = end
				found = true
				break
			}
		}
		if !found {
			return []int64{t.vocab["[UNK]"]}
		}
	}
	return ids
}
func (t *tokenizer) encode(text string) []int64 {
	ids := []int64{101}
	for len(text) > 0 {
		next := len(text)
		special := ""
		for _, token := range specials {
			if at := strings.Index(text, token); at >= 0 && at < next {
				next = at
				special = token
			}
		}
		for _, word := range t.words(text[:next]) {
			ids = append(ids, t.piece(word)...)
		}
		if special == "" {
			break
		}
		ids = append(ids, t.vocab[special])
		text = text[next+len(special):]
	}
	ids = append(ids, 102)
	if len(ids) > 512 {
		ids = ids[:512]
		ids[511] = 102
	}
	return ids
}
func modelOperation(ctx context.Context, operation string, input modelRequest) (any, error) {
	if err := verifyModelAssets(input.Directory); err != nil {
		return nil, err
	}
	t, err := newTokenizer(input.Directory)
	if err != nil {
		return nil, err
	}
	ids := [][]int64{}
	for _, text := range input.Texts {
		ids = append(ids, t.encode(text))
	}
	if operation == "tokenize" {
		return ids, nil
	}
	return embedModel(ctx, input, ids)
}
