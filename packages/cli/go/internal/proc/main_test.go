package proc

import (
	"os"
	"testing"
)

// The Windows job gate re-execs this binary; proc can't import proctest (cycle),
// so the dispatch is inlined here.
func TestMain(m *testing.M) {
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		ChildGate(os.Args[2:])
		os.Exit(0)
	}
	os.Exit(m.Run())
}
