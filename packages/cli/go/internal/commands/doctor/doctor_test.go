package doctor

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestDoctorChecksRetainRepeatedDependencyLabels(t *testing.T) {
	ok := false
	// A singleton installed at multiple physical locations intentionally emits
	// repeated names with different paths/versions. Do not discard that evidence.
	rows := []doctorCheck{{Name: "compatibility installed @octane-xplat/ui", OK: &ok, Detail: "one copy"}, {Name: "compatibility installed @octane-xplat/ui", OK: &ok, Detail: "another copy"}}
	if err := validateDoctorChecks(rows); err != nil {
		t.Fatal(err)
	}
	for _, data := range []string{`[{"name":"node"}]`, `[{"name":"node","ok":null}]`} {
		var rows []doctorCheck
		if err := json.Unmarshal([]byte(data), &rows); err != nil {
			t.Fatal(err)
		}
		if validateDoctorChecks(rows) == nil {
			t.Fatal("missing observation state was accepted")
		}
	}
}
func TestMacOSChecksKeepLowerCaseContractAcrossWorkerHandoff(t *testing.T) {
	ok := false
	encoded, err := json.Marshal(macOSDoctorReport{Version: 1, Root: "project", Rows: []doctorCheck{{Name: "macOS host", OK: &ok}}})
	if err != nil {
		t.Fatal(err)
	}
	text := string(encoded)
	if !strings.Contains(text, `"name":"macOS host"`) || !strings.Contains(text, `"ok":false`) {
		t.Fatal(text)
	}
}
