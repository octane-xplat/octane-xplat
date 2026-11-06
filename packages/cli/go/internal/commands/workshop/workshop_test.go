package workshop

import "testing"

func TestWorkshopManifestPublicationBoundary(t *testing.T) {
	tests := []struct {
		name, before, after string
		allowed             bool
	}{
		{"project owns script text", `{"name":"app","scripts":{"build":"vite build"},"extra":{"keep":[1,null,false]}}`, `{"name":"app","scripts":{"build":"vite build","workshop":"project-policy-preview"},"extra":{"keep":[1,null,false]}}`, true},
		{"missing scripts", `{"name":"app"}`, `{"name":"app","scripts":{"workshop":"preview"}}`, true},
		{"null scripts", `{"name":"app","scripts":null}`, `{"name":"app","scripts":{"workshop":"preview"}}`, true},
		{"custom script stays owned", `{"name":"app","scripts":{"workshop":"custom"}}`, `{"name":"app","scripts":{"workshop":"preview"}}`, false},
		{"other script preserved", `{"name":"app","scripts":{"build":"custom"}}`, `{"name":"app","scripts":{"workshop":"preview"}}`, false},
		{"other manifest data preserved", `{"name":"app","extra":{"keep":true}}`, `{"name":"app","extra":{"keep":false},"scripts":{"workshop":"preview"}}`, false},
		{"script must be a string", `{"name":"app"}`, `{"name":"app","scripts":{"workshop":42}}`, false},
		{"empty script rejected", `{"name":"app"}`, `{"name":"app","scripts":{"workshop":""}}`, false},
		{"arrays not manifests", `[]`, `{"scripts":{"workshop":"preview"}}`, false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if actual := workshopManifestPreserved([]byte(test.before), []byte(test.after)); actual != test.allowed {
				t.Fatalf("publication admission=%v, want %v", actual, test.allowed)
			}
		})
	}
}
