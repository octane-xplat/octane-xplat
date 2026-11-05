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
			want := "unavailable"
			if platform == "android" {
				want = "partial"
			}
			if found[capability] != want {
				t.Fatalf("%s %s = %s; want %s", platform, capability, found[capability], want)
			}
		}
		for _, capability := range []string{"ui_inspection", "screenshot", "interaction"} {
			if found[capability] != "unavailable" {
				t.Fatalf("%s %s must remain unqualified, got %s", platform, capability, found[capability])
			}
		}
	}
}
