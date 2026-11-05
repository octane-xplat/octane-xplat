package main

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"slices"
	"testing"
)

func TestBuildSelectionValidatesWholeSetAndKeepsDeclarationOrder(t *testing.T) {
	available := []string{"web", "android", "macos"}
	text := "macos, web,web"
	chosen, err := buildSelection(available, &text)
	if err != nil || !slices.Equal(chosen, []string{"web", "macos"}) {
		t.Fatalf("%v %v", chosen, err)
	}
	for _, text := range []string{"", "web,", "web,unknown"} {
		if _, err := buildSelection(available, &text); err == nil {
			t.Fatalf("accepted %q", text)
		}
	}
}
func TestMacOSPairPublicationRestoresBothBackupsAndRetainsFailedRecovery(t *testing.T) {
	for _, failRecovery := range []bool{false, true} {
		t.Run(map[bool]string{false: "restored", true: "retained"}[failRecovery], func(t *testing.T) {
			release, err := canonical(t.TempDir())
			if err != nil {
				t.Fatal(err)
			}
			root, err := os.OpenRoot(release)
			if err != nil {
				t.Fatal(err)
			}
			defer root.Close()
			stage := ".xplat-macos-test"
			name := "Fixture"
			write := func(path, text string) {
				t.Helper()
				if err := os.MkdirAll(filepath.Dir(filepath.Join(release, path)), 0755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(filepath.Join(release, path), []byte(text), 0644); err != nil {
					t.Fatal(err)
				}
			}
			write(filepath.Join(stage, name+".app/Contents/MacOS", name), "new executable")
			write(filepath.Join(stage, name+".app/Contents/Info.plist"), "plist")
			write(filepath.Join(stage, name+"-macos-universal.dmg"), "new dmg")
			write(name+".app/Contents/MacOS/"+name, "old executable")
			write(name+"-macos-universal.dmg", "old dmg")
			plan, _ := json.Marshal(macOSPackagePlan{1, name, filepath.Join(release, stage, name+".app"), filepath.Join(release, stage, name+"-macos-universal.dmg")})
			moves := 0
			err = publishMacOSPackageUsing(context.Background(), root, release, stage, plan, func(from, to string) error {
				moves++
				if moves == 4 || (failRecovery && moves == 5) {
					return errors.New("injected rename failure")
				}
				return root.Rename(from, to)
			})
			if err == nil {
				t.Fatal("injected publication failure was hidden")
			}
			if failRecovery {
				var partial *artifactPublicationError
				if !errors.As(err, &partial) || len(partial.Retained) != 1 {
					t.Fatalf("missing recovery evidence: %v", err)
				}
				return
			}
			for path, want := range map[string]string{name + ".app/Contents/MacOS/" + name: "old executable", name + "-macos-universal.dmg": "old dmg"} {
				data, err := os.ReadFile(filepath.Join(release, path))
				if err != nil || string(data) != want {
					t.Fatalf("%s: %q %v", path, data, err)
				}
			}
		})
	}
}
