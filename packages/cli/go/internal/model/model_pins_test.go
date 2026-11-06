package model

import (
	"os"
	"strings"
	"testing"
)

func TestNativeModulePinsMatchGoMod(t *testing.T) {
	data, err := os.ReadFile("../../go.mod")
	if err != nil {
		t.Fatal(err)
	}
	text := string(data)
	for _, pin := range nativeModulePins {
		module, version, _ := strings.Cut(pin, "@")
		if !strings.Contains(text, module+" "+version) {
			t.Fatalf("go.mod missing %s %s", module, version)
		}
	}
}
