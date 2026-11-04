package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"time"
)

func init() { nativeLegacyCommands["build"] = buildCommand }

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

func availableBuildTargets(ctx context.Context, project string) ([]string, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	manifest := map[string]any{}
	if _, err := os.Lstat(filepath.Join(project, "package.json")); err == nil {
		if err = readJSON(filepath.Join(project, "package.json"), &manifest); err != nil {
			return nil, err
		}
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	available := declaredPlatforms(project, manifest)
	if slices.Contains(available, "ios") {
		found := false
		if tool, err := exec.LookPath("xcrun"); err == nil {
			probe, cancel := context.WithTimeout(ctx, 10*time.Second)
			result, err := runProcess(probe, []string{tool, "--version"}, project, nil)
			cancel()
			if err != nil && requiresFailureEvidence(err) {
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

func prepareBuildEngines(project string, selected []string) ([]projectBuildEngine, error) {
	engines := []projectBuildEngine{}
	if _, err := exec.LookPath("node"); err != nil {
		return nil, errors.New("Node is required for the project's build engines")
	}
	for _, kind := range selected {
		var entry string
		var err error
		switch kind {
		case "web":
			entry, err = installedProjectEntry(project, "vite", "bin", "vite")
		case "ios", "android", "windows":
			if kind == "ios" && runtime.GOOS != "darwin" {
				return nil, errors.New("iOS builds require a Mac")
			}
			if kind == "windows" && runtime.GOOS != "windows" {
				return nil, errors.New("Windows NativeScript builds require Windows")
			}
			entry, err = installedProjectEntry(project, "nativescript", "bin", "ns")
		case "macos":
			if runtime.GOOS != "darwin" {
				return nil, errors.New("macOS builds require a Mac")
			}
			entry, err = installedProjectEntry(project, "@octane-xplat/macos-build", "exports", "./worker")
			if err == nil {
				_, err = installedProjectEntry(project, "vite", "bin", "vite")
			}
		case "linux":
			if runtime.GOOS != "darwin" && runtime.GOOS != "linux" {
				return nil, errors.New("Linux packaging requires a POSIX build host (macOS or Linux)")
			}
			entry, err = projectWorker(project)
			if err == nil {
				_, err = installedProjectEntry(project, "vite", "bin", "vite")
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

func buildCommand(ctx context.Context, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	available, err := availableBuildTargets(ctx, project)
	if err != nil {
		return err
	}
	requested := optionalString(values, "targets")
	if requested == nil && len(available) > 0 && buildTerminal(os.Stdout) {
		fmt.Printf("Build targets (comma list; Enter selects %s): ", strings.Join(available, ","))
		type answer struct {
			line string
			err  error
		}
		done := make(chan answer, 1)
		go func() {
			line, err := bufio.NewReader(io.LimitReader(os.Stdin, 16385)).ReadString('\n')
			done <- answer{line, err}
		}()
		select {
		case <-ctx.Done():
			return ctx.Err()
		case response := <-done:
			if response.err == io.EOF && response.line == "" {
				return &projectToolExit{0}
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
	engines, err := prepareBuildEngines(project, selected)
	if err != nil {
		return err
	}
	// Reject unavailable engines before route baking or compiler side effects.
	location, err := locateRoutes(project, routeOptions{}, "")
	if err != nil {
		return err
	}
	prepared, err := prepareRoutes(ctx, location, true)
	routeDiagnostics(prepared.Worker)
	if err != nil {
		return err
	}
	if err = prepared.publish(ctx); err != nil {
		return err
	}
	release, _ := values["release"].(bool)
	for _, engine := range engines {
		if err = ctx.Err(); err != nil {
			return err
		}
		fmt.Printf("Building %s\n", engine.Platform)
		if engine.Platform == "macos" {
			if err = runMacOSPackage(ctx, project, engine.Entry); err != nil {
				return err
			}
			continue
		}
		if engine.Platform == "linux" {
			if err = runLinuxPackage(ctx, project, engine.Entry); err != nil {
				return err
			}
			continue
		}
		args := []string{"node", engine.Entry, "build"}
		if engine.Platform != "web" {
			args = append(args, engine.Platform)
			if release {
				args = append(args, "--release")
			}
		}
		result, err := runProcessIO(ctx, args, project, projectToolEnvironment(), os.Stdout, os.Stderr)
		if err != nil {
			return err
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if result.ExitCode != 0 {
			return fmt.Errorf("%s build exited %d", engine.Platform, result.ExitCode)
		}
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	fmt.Println("Build complete")
	return nil
}

func buildEngineContracts() map[string]string {
	return map[string]string{
		"web": "project-vite", "ios": "project-nativescript", "android": "project-nativescript", "windows": "project-nativescript", "macos": "project-packaging-worker", "linux": "project-packaging-worker",
	}
}
