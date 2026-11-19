package build

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"path/filepath"
	"regexp"
)

var linuxExecutableName = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_-]*$`)
var linuxPackageVersion = regexp.MustCompile(`^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$`)

type linuxPackagePlan struct {
	Version                                                  int
	Runtime, ExecutableName, PackageVersion, AppDir, Archive string
	GtkRuntimeArchitecture                                   string
}

func runLinuxPackage(ctx context.Context, project, worker string) error {
	return runStagedPackage(ctx, project, worker, "Linux", "dist/linux", ".xplat-linux-", "linux-package", publishLinuxPackage)
}
func publishLinuxPackage(ctx context.Context, root *os.Root, release, stage string, data json.RawMessage) ([]string, error) {
	var plan linuxPackagePlan
	if json.Unmarshal(data, &plan) != nil || plan.Version != 1 || !linuxExecutableName.MatchString(plan.ExecutableName) || !linuxPackageVersion.MatchString(plan.PackageVersion) || plan.Runtime != "gtk" {
		return nil, errors.New("invalid Linux package plan")
	}
	name := plan.ExecutableName
	directory := filepath.Join(stage, name)
	archiveName := name + "-" + plan.PackageVersion + ".tar.gz"
	archive := filepath.Join(stage, archiveName)
	if plan.AppDir != filepath.Join(release, directory) || plan.Archive != filepath.Join(release, archive) {
		return nil, errors.New("Linux artifact paths do not match native-owned staging")
	}
	info, err := root.Lstat(directory)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil, errors.New("Linux app must be a staged ordinary directory")
	}
	critical := []string{filepath.Join(directory, name), filepath.Join(directory, "app.json"), filepath.Join(directory, "README.txt"), archive}
	var runtimeExecutables []string
	if plan.GtkRuntimeArchitecture != "" {
		architectures := []string{plan.GtkRuntimeArchitecture}
		if plan.GtkRuntimeArchitecture == "universal" {
			architectures = []string{"x86_64", "aarch64"}
		}
		if plan.Runtime != "gtk" {
			return nil, errors.New("invalid GTK runtime architecture in Linux package plan")
		}
		for _, architecture := range architectures {
			if architecture != "x86_64" && architecture != "aarch64" {
				return nil, errors.New("invalid GTK runtime architecture in Linux package plan")
			}
			runtime := filepath.Join(directory, "runtime")
			if plan.GtkRuntimeArchitecture == "universal" {
				runtime = filepath.Join(runtime, architecture)
			}
			for _, name := range []string{
				"ns-linux", "manifest.json", "gi.json", "metadata-" + architecture + ".bin",
				"metadata/mason.bin", "metadata/xplatmason.bin", "metadata/webkit.bin",
				"icu/icudt77l.dat", "lib/libmason_c.so", "lib/libxplatmason-gtk.so",
			} {
				critical = append(critical, filepath.Join(runtime, name))
			}
			runtimeExecutables = append(runtimeExecutables, filepath.Join(runtime, "ns-linux"))
		}
		critical = append(critical, filepath.Join(directory, "package.json"))
	}
	for _, path := range critical {
		info, err = root.Lstat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() == 0 {
			return nil, errors.New("incomplete Linux package: critical entries must be nonempty regular files")
		}
		actual, err := osfs.Canonical(filepath.Join(release, path))
		if err != nil || actual != filepath.Join(release, path) {
			return nil, errors.New("Linux package entry must not alias another target")
		}
	}
	info, err = root.Stat(filepath.Join(directory, name))
	if err != nil || info.Mode().Perm()&0111 == 0 {
		return nil, errors.New("Linux launcher must retain executable permission")
	}
	for _, runtime := range runtimeExecutables {
		info, err = root.Stat(runtime)
		if err != nil || info.Mode().Perm()&0111 == 0 {
			return nil, errors.New("GTK runtime must retain executable permission")
		}
	}
	if err = publishPackagePair(ctx, root, release, stage, directory, archive, name, archiveName, root.Rename); err != nil {
		return nil, err
	}
	paths := []string{filepath.Join(release, name), filepath.Join(release, archiveName)}
	fmt.Printf("Published Linux app: %s\nPublished Linux archive: %s\n", paths[0], paths[1])
	return paths, nil
}
