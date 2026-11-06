package build

import (
	"context"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/routes"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"time"
)

type projectBuildEngine struct{ Platform, Entry string }

func buildSelection(available []string, requested *string) ([]string, error) {
	if requested == nil {
		if len(available) == 0 {
			return nil, errors.New("nothing to build: no web, NativeScript, macOS or Linux target is declared")
		}
		return slices.Clone(available), nil
	}
	wanted := []string{}
	invalid := []string{}
	for _, part := range strings.Split(*requested, ",") {
		kind := strings.TrimSpace(part)
		wanted = append(wanted, kind)
		if !slices.Contains(available, kind) {
			label := kind
			if label == "" {
				label = "<empty>"
			}
			if !slices.Contains(invalid, label) {
				invalid = append(invalid, label)
			}
		}
	}
	if len(invalid) > 0 {
		options := strings.Join(available, ", ")
		if options == "" {
			options = "(none)"
		}
		return nil, fmt.Errorf("Unavailable build target(s): %s. Available: %s", strings.Join(invalid, ", "), options)
	}
	selected := []string{}
	for _, kind := range available {
		if slices.Contains(wanted, kind) {
			selected = append(selected, kind)
		}
	}
	return selected, nil
}

func projectManifest(projectRoot string) (map[string]any, error) {
	manifest := map[string]any{}
	if _, err := os.Lstat(filepath.Join(projectRoot, "package.json")); err == nil {
		if err = osfs.ReadJSON(filepath.Join(projectRoot, "package.json"), &manifest); err != nil {
			return nil, err
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	return manifest, nil
}

func availableBuildTargets(ctx context.Context, projectRoot string) ([]string, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	manifest, err := projectManifest(projectRoot)
	if err != nil {
		return nil, err
	}
	available := project.DeclaredPlatforms(projectRoot, manifest)
	if slices.Contains(available, "ios") {
		found := false
		if tool, err := exec.LookPath("xcrun"); err == nil {
			probe, cancel := context.WithTimeout(ctx, 10*time.Second)
			result, err := proc.RunProcess(probe, []string{tool, "--version"}, projectRoot, nil)
			cancel()
			if err != nil && cli.RequiresFailureEvidence(err) {
				return nil, err
			}
			found = err == nil && result.ExitCode == 0
		}
		if !found {
			available = slices.DeleteFunc(available, func(kind string) bool { return kind == "ios" })
		}
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	return available, nil
}

func PrepareBuildEngines(ctx context.Context, projectRoot string, selected []string) ([]projectBuildEngine, error) {
	engines := []projectBuildEngine{}
	if _, err := project.NodeExecutable(ctx); err != nil {
		return nil, errors.New("Node is required for the project's build engines")
	}
	for _, kind := range selected {
		var entry string
		var err error
		switch kind {
		case "web":
			entry, err = project.InstalledProjectEntry(projectRoot, "vite", "bin", "vite")
		case "ios", "android", "windows":
			if kind == "ios" && runtime.GOOS != "darwin" {
				return nil, errors.New("iOS builds require a Mac")
			}
			if kind == "windows" && runtime.GOOS != "windows" {
				return nil, errors.New("Windows NativeScript builds require Windows")
			}
			entry, err = project.InstalledProjectEntry(projectRoot, "nativescript", "bin", "ns")
		case "macos":
			if runtime.GOOS != "darwin" {
				return nil, errors.New("macOS builds require a Mac")
			}
			entry, err = project.InstalledProjectEntry(projectRoot, "@octane-xplat/macos-build", "exports", "./worker")
			if err == nil {
				_, err = project.InstalledProjectEntry(projectRoot, "vite", "bin", "vite")
			}
		case "linux":
			if runtime.GOOS != "darwin" && runtime.GOOS != "linux" {
				return nil, errors.New("Linux packaging requires a POSIX build host (macOS or Linux)")
			}
			entry, err = project.Worker(projectRoot)
			if err == nil {
				_, err = project.InstalledProjectEntry(projectRoot, "vite", "bin", "vite")
			}
		default:
			return nil, fmt.Errorf("unknown build target %s", kind)
		}
		if err != nil {
			return nil, err
		}
		engines = append(engines, projectBuildEngine{kind, entry})
	}
	return engines, nil
}

func Command(ctx context.Context, values map[string]any) error {
	projectRoot, err := os.Getwd()
	if err != nil {
		return err
	}
	projectRoot, err = osfs.Canonical(projectRoot)
	if err != nil {
		return err
	}
	available, err := availableBuildTargets(ctx, projectRoot)
	if err != nil {
		return err
	}
	requested := routes.OptionalString(values, "targets")
	if requested == nil && len(available) > 0 && proc.ForegroundInput(ctx) != nil && proc.BuildTerminal(proc.ForegroundInput(ctx)) && proc.BuildTerminal(os.Stdout) {
		fmt.Printf("Build targets (comma list; Enter selects %s): ", strings.Join(available, ","))
		type answer struct {
			line string
			err  error
		}
		done := make(chan answer, 1)
		go func() {
			var line strings.Builder
			var byte [1]byte
			var err error
			for line.Len() <= 16384 {
				var n int
				n, err = proc.ForegroundInput(ctx).Read(byte[:])
				if n > 0 {
					line.WriteByte(byte[0])
				}
				if err != nil || byte[0] == '\n' {
					break
				}
			}
			done <- answer{line.String(), err}
		}()
		select {
		case <-ctx.Done():
			return ctx.Err()
		case response := <-done:
			if response.err == io.EOF && response.line == "" {
				return &project.ToolExit{Code: 0}
			}
			if response.err != nil && response.err != io.EOF {
				return response.err
			}
			if len(response.line) > 16384 {
				return errors.New("build selection exceeds 16 KiB")
			}
			line := strings.TrimSpace(response.line)
			if line != "" {
				requested = &line
			}
		}
	}
	selected, err := buildSelection(available, requested)
	if err != nil {
		return err
	}
	release, _ := values["release"].(bool)
	manifest, err := projectManifest(projectRoot)
	if err != nil {
		return err
	}
	artifacts, err := resolveArtifactOptions(values, manifest, selected, release)
	if err != nil {
		return err
	}
	engines, err := PrepareBuildEngines(ctx, projectRoot, selected)
	if err != nil {
		return err
	}
	releaseOutputs, err := project.LockProjectOutputs(projectRoot)
	if err != nil {
		return err
	}
	defer releaseOutputs()
	// Reject unavailable engines before route baking or compiler side effects.
	location, err := routes.LocateRoutes(projectRoot, routes.RouteOptions{}, "")
	if err != nil {
		return err
	}
	prepared, err := routes.PrepareRoutes(ctx, location, true)
	routes.RouteDiagnostics(prepared.Worker)
	if err != nil {
		return err
	}
	if err = prepared.Publish(ctx); err != nil {
		return err
	}
	for _, engine := range engines {
		if err = ctx.Err(); err != nil {
			return err
		}
		fmt.Printf("Building %s\n", engine.Platform)
		if engine.Platform == "macos" {
			if err = runMacOSPackage(ctx, projectRoot, engine.Entry); err != nil {
				return err
			}
			continue
		}
		if engine.Platform == "linux" {
			if err = runLinuxPackage(ctx, projectRoot, engine.Entry); err != nil {
				return err
			}
			continue
		}
		args := []string{"node", engine.Entry, "build"}
		if engine.Platform != "web" {
			native, secrets := artifacts.nativeScriptArgs(engine.Platform, release)
			args = append(args, native...)
			if len(args) > 3 {
				fmt.Println("ns build " + strings.Join(redactedArgs(native, secrets), " "))
			}
		}
		result, err := proc.RunForegroundProcessIO(ctx, args, projectRoot, project.ToolEnvironment(), os.Stdout, os.Stderr)
		if err != nil {
			return err
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if result.ExitCode != 0 {
			return fmt.Errorf("%s build exited %d", engine.Platform, result.ExitCode)
		}
		if engine.Platform == "ios" || engine.Platform == "android" {
			if path, kind := nativeArtifact(projectRoot, engine.Platform, artifacts); path != "" {
				fmt.Printf("Artifact: %s (%s)\n", path, kind)
			} else if kind != "" {
				fmt.Printf("Artifact: %s output not located under platforms/%s — see the NativeScript output above\n", kind, engine.Platform)
			}
		}
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	fmt.Println("Build complete")
	return nil
}

func EngineContracts() map[string]string {
	return map[string]string{
		"web": "project-vite", "ios": "project-nativescript", "android": "project-nativescript", "windows": "project-nativescript", "macos": "project-packaging-worker", "linux": "project-packaging-worker",
	}
}
