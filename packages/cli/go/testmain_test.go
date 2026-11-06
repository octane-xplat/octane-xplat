package main

import (
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Every package with tests must dispatch the Windows job gate: containedCommand
// re-execs the test binary itself, and without the dispatch the gated child runs
// the suite instead of the requested command.
func TestEveryTestPackageDispatchesGate(t *testing.T) {
	fset := token.NewFileSet()
	dirs := map[string]bool{}
	mains := map[string]bool{}
	var source []byte
	err := filepath.WalkDir(".", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(path, "_test.go") {
			return err
		}
		dir := filepath.Dir(path)
		dirs[dir] = true
		raw, _ := os.ReadFile(path)
		source = raw
		f, err := parser.ParseFile(fset, path, raw, 0)
		if err != nil {
			return err
		}
		for _, decl := range f.Decls {
			fn, ok := decl.(*ast.FuncDecl)
			if !ok || fn.Name.Name != "TestMain" || fn.Body == nil {
				continue
			}
			end := fset.PositionFor(decl.End(), false).Offset
			body := string(source[fset.PositionFor(decl.Pos(), false).Offset:end])
			if strings.Contains(body, "proctest.Main") || strings.Contains(body, `"_gate"`) {
				mains[dir] = true
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	for dir := range dirs {
		if !mains[dir] {
			t.Errorf("%s: test-bearing directory without a TestMain gate dispatch", dir)
		}
	}
}
