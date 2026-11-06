package project

import (
	"encoding/json"
	"testing"
)

func TestJSONCStandardize(t *testing.T) {
	cases := []struct {
		name  string
		input string
		want  map[string]any
	}{
		{"line comment", "{\n// a comment\n\"a\": 1\n}", map[string]any{"a": float64(1)}},
		{"block comment", "{\n/* a\ncomment */\n\"a\": 1\n}", map[string]any{"a": float64(1)}},
		{"slash in string", `{"u": "https://e/x", "c": "a/*b*/c"}`, map[string]any{"u": "https://e/x", "c": "a/*b*/c"}},
		{"escaped quote", `{"a": "q\"// tail"}`, map[string]any{"a": `q"// tail`}},
		{"trailing object comma", `{"a": 1,}`, map[string]any{"a": float64(1)}},
		{"trailing array comma", `{"a": [1, 2,]}`, map[string]any{"a": []any{float64(1), float64(2)}}},
	}
	for _, tc := range cases {
		out, err := Jsonc([]byte(tc.input))
		if err != nil {
			t.Fatalf("%s: jsonc: %v", tc.name, err)
		}
		var got map[string]any
		if err := json.Unmarshal(out, &got); err != nil {
			t.Fatalf("%s: unmarshal: %v", tc.name, err)
		}
		want, _ := json.Marshal(tc.want)
		gotB, _ := json.Marshal(got)
		if string(gotB) != string(want) {
			t.Fatalf("%s: got %s want %s", tc.name, gotB, want)
		}
	}
	if _, err := Jsonc([]byte(`{"a": /* unterminated`)); err == nil {
		t.Fatal("unterminated block comment must fail")
	}
}
