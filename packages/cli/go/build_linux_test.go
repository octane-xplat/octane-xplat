package main

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestLinuxPlanRequiresExactPathsAndExecutableLauncher(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Linux package publication is POSIX-only")
	}
	release, err := canonical(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	root, err := os.OpenRoot(release)
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	stage := ".xplat-linux-unit"
	directory := filepath.Join(stage, "previous")
	archive := filepath.Join(stage, "previous-0.1.0.tar.gz")
	if err = root.MkdirAll(directory, 0755); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{filepath.Join(directory, "previous"), filepath.Join(directory, "app.json"), filepath.Join(directory, "README.txt"), archive} {
		if err = root.WriteFile(path, []byte("value"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	plan := linuxPackagePlan{1, "gtk", "previous", "0.1.0", filepath.Join(release, directory), filepath.Join(release, archive)}
	data, _ := json.Marshal(plan)
	if _, err = publishLinuxPackage(context.Background(), root, release, stage, data); err == nil {
		t.Fatal("nonexecutable launcher was accepted")
	}
	if err = root.Chmod(filepath.Join(directory, "previous"), 0755); err != nil {
		t.Fatal(err)
	}
	bad := plan
	bad.Archive = filepath.Join(release, "unselected.tar.gz")
	data, _ = json.Marshal(bad)
	if _, err = publishLinuxPackage(context.Background(), root, release, stage, data); err == nil {
		t.Fatal("escaping/mismatched archive accepted")
	}
	data, _ = json.Marshal(plan)
	paths, err := publishLinuxPackage(context.Background(), root, release, stage, data)
	if err != nil || len(paths) != 2 {
		t.Fatalf("valid plan: %v %v", paths, err)
	}
}
