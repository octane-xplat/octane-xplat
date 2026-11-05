package main

import "testing"

func TestMobileCapabilitiesKeepDeviceQualificationBounded(t *testing.T) {
	workspace := &workspaceContext{Root: t.TempDir()}
	for _, value := range workspace.capabilityMatrix([]string{"android", "ios"}) {
		matrix := object(value)
		platform := matrix["platform"].(string)
		found := map[string]string{}
		for _, value := range matrix["capabilities"].([]any) {
			entry := object(value)
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
