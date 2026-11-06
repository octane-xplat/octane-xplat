// Package proctest gives every test executable the Windows job-gate dispatch.
// containedCommand re-execs the current binary as `_gate <fd> 0 argv...`; without
// a TestMain that hands those args to proc.ChildGate the gated child would rerun
// the test suite instead of the requested command.
package proctest

import (
	"os"
	"testing"

	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
)

func Main(m *testing.M) {
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		proc.ChildGate(os.Args[2:])
		os.Exit(0)
	}
	os.Exit(m.Run())
}
