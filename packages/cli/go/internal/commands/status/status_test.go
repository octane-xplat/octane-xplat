package status

import (
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"testing"
)

func TestMobileCapabilitiesKeepDeviceQualificationBounded(t *testing.T) {
	workspace := &project.WorkspaceContext{Root: t.TempDir()}
	for _, value := range capabilityMatrix(workspace, []string{"android", "ios"}) {
		matrix := cli.Object(value)
		platform := matrix["platform"].(string)
		found := map[string]string{}
		for _, value := range matrix["capabilities"].([]any) {
			entry := cli.Object(value)
			found[entry["capability"].(string)] = entry["status"].(string)
		}
		for _, capability := range []string{"attach", "dev_actions"} {
			if found[capability] != "partial" {
				t.Fatalf("%s %s = %s; want partial", platform, capability, found[capability])
			}
		}
		for _, capability := range []string{"ui_inspection", "screenshot", "interaction"} {
			if found[capability] != "unavailable" {
				t.Fatalf("%s %s must remain unqualified, got %s", platform, capability, found[capability])
			}
		}
	}
}
