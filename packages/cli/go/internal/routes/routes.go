package routes

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type preparedRoutes struct {
	Location    RouteLocation
	Scope       artifact.Scope
	Before      map[string]artifact.State
	Artifacts   []artifact.PlannedArtifact
	Count       *int
	Fingerprint string
	Worker      project.WorkerResult
}

func OptionalString(values map[string]any, name string) *string {
	value, ok := values[name].(string)
	if !ok {
		return nil
	}
	return &value
}
func RouteDiagnostics(result project.WorkerResult) {
	for _, text := range []string{result.Process.Stdout, result.Process.Stderr} {
		if text != "" {
			fmt.Fprint(os.Stderr, text)
			if !strings.HasSuffix(text, "\n") {
				fmt.Fprintln(os.Stderr)
			}
		}
	}
	if result.Process.Truncated {
		fmt.Fprintln(os.Stderr, "Project worker diagnostics were truncated.")
	}
	for _, warning := range result.Warnings {
		fmt.Fprintln(os.Stderr, "Warning:", warning)
	}
}

func protectedRouteSources(location RouteLocation) (map[string]bool, []string, error) {
	files, directories := map[string]bool{}, []string{}
	parents := map[string][]os.DirEntry{}
	for _, source := range append([]string{filepath.Join(location.Project, "xplat.routes.json")}, location.Sources...) {
		candidates := []string{source}
		parent := filepath.Dir(source)
		entries, ok := parents[parent]
		if !ok {
			var err error
			entries, err = routeDirectoryEntries(parent)
			if err != nil && !os.IsNotExist(err) {
				return nil, nil, err
			}
			parents[parent] = entries
		}
		for _, entry := range entries {
			path := filepath.Join(parent, entry.Name())
			if strings.HasPrefix(path, source+".") {
				candidates = append(candidates, path)
			}
		}
		for _, path := range candidates {
			actual, err := osfs.Canonical(path)
			if os.IsNotExist(err) {
				continue
			}
			if err != nil {
				return nil, nil, err
			}
			info, err := os.Stat(actual)
			if err != nil {
				return nil, nil, err
			}
			if info.IsDir() {
				directories = append(directories, actual)
			} else {
				files[osfs.FilesystemKey(actual)] = true
			}
		}
	}
	return files, directories, nil
}

func CaptureRouteOutputs(ctx context.Context, location RouteLocation) (artifact.Scope, map[string]artifact.State, error) {
	scope, err := artifact.OutputScope(location.Project, filepath.Dir(location.Base))
	if err != nil {
		return scope, nil, err
	}
	protected, protectedDirectories, err := protectedRouteSources(location)
	if err != nil {
		return scope, nil, err
	}
	routeRoot, _, _, err := artifact.ProjectedDirectory(location.Directory)
	if err != nil {
		return scope, nil, err
	}
	before := map[string]artifact.State{}
	targets := map[string]bool{}
	for _, path := range location.OutputPaths() {
		state, err := artifact.SnapshotArtifact(ctx, scope, path)
		if err != nil {
			return scope, nil, err
		}
		key := osfs.FilesystemKey(state.Target)
		if targets[key] {
			return scope, nil, errors.New("route output aliases collide with another generated artifact")
		}
		targets[key] = true
		if state.Alias {
			if osfs.Inside(routeRoot, state.Target) {
				return scope, nil, errors.New("a generated output alias must not overwrite route source files")
			}
			if protected[key] {
				return scope, nil, errors.New("a generated output alias must not overwrite configuration or a source reference")
			}
			for _, source := range protectedDirectories {
				if osfs.Inside(source, state.Target) {
					return scope, nil, errors.New("a generated output alias must not overwrite a configured source reference")
				}
			}
		}
		before[path] = state
	}
	return scope, before, nil
}
func ValidateRouteArtifacts(data json.RawMessage, location RouteLocation, before map[string]artifact.State, bake bool) ([]artifact.PlannedArtifact, *int, error) {
	var plan struct {
		Version int
		Count   json.RawMessage
		Outputs []struct{ File, Source *string }
	}
	if err := json.Unmarshal(data, &plan); err != nil || plan.Version != 1 || plan.Outputs == nil {
		return nil, nil, errors.New("unsupported route artifact plan")
	}
	var count *int
	if string(plan.Count) != "false" {
		var value *int
		if err := json.Unmarshal(plan.Count, &value); err != nil || value == nil || *value < 0 || *value > 50000 {
			return nil, nil, errors.New("invalid route count")
		}
		count = value
	}
	if (count != nil) != (location.Directory != "") {
		return nil, nil, errors.New("route plan source selection mismatch")
	}
	outputs, seen, bytes := []artifact.PlannedArtifact{}, map[string]bool{}, 0
	for _, item := range plan.Outputs {
		if item.File == nil || item.Source == nil {
			return nil, nil, errors.New("route artifacts require file and source strings")
		}
		path, source := *item.File, *item.Source
		state, allowed := before[path]
		if !allowed || seen[path] {
			return nil, nil, errors.New("unexpected or duplicate route artifact destination")
		}
		seen[path] = true
		bytes += len(source)
		if len(source) > artifact.MaxArtifactBytes || bytes > artifact.MaxArtifactPlanBytes {
			return nil, nil, errors.New("route artifacts exceed 16 MiB per file or 64 MiB total")
		}
		outputs = append(outputs, artifact.PlannedArtifact{File: path, Source: source, Before: state})
	}
	for path, state := range before {
		required := bake || path != location.Base+".data.ts" || !state.Exists
		if required && !seen[path] {
			return nil, nil, errors.New("incomplete route artifact plan")
		}
	}
	return outputs, count, nil
}
func PrepareRoutes(ctx context.Context, location RouteLocation, bake bool) (preparedRoutes, error) {
	prepared := preparedRoutes{Location: location}
	var err error
	if location.Directory != "" {
		prepared.Scope, prepared.Before, err = CaptureRouteOutputs(ctx, location)
		if err != nil {
			return prepared, err
		}
	}
	prepared.Fingerprint, err = RouteFingerprint(ctx, location)
	if err != nil {
		return prepared, err
	}
	if location.Directory == "" {
		// A standalone missing-source diagnosis must not require a Node runtime.
		return prepared, nil
	}
	directory, err := filepath.Rel(location.Project, location.Directory)
	if err != nil {
		return prepared, err
	}
	output, err := filepath.Rel(location.Project, location.Base)
	if err != nil {
		return prepared, err
	}
	ctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	prepared.Worker, err = project.RunWorker(ctx, location.Project, "route-plan", map[string]any{
		"directory": directory, "output": output, "bake": bake,
	})
	if err != nil {
		return prepared, err
	}
	prepared.Artifacts, prepared.Count, err = ValidateRouteArtifacts(prepared.Worker.Data, location, prepared.Before, bake)
	if err != nil {
		return prepared, err
	}
	return prepared, prepared.revalidate(ctx)
}
func (prepared preparedRoutes) revalidate(ctx context.Context) error {
	fingerprint, err := RouteFingerprint(ctx, prepared.Location)
	if err != nil {
		return err
	}
	if fingerprint != prepared.Fingerprint {
		return errors.New("route inputs changed during planning; retry generation")
	}
	for _, state := range prepared.Before {
		if err := artifact.UnchangedArtifact(ctx, prepared.Scope, state); err != nil {
			return err
		}
	}
	return nil
}
func (prepared preparedRoutes) Publish(ctx context.Context) error {
	if prepared.Count == nil {
		return nil
	}
	return artifact.PublishArtifacts(ctx, prepared.Scope, prepared.Artifacts, func() error { return prepared.revalidate(ctx) })
}
func routeGenerated(count int) {
	plural := "s"
	if count == 1 {
		plural = ""
	}
	fmt.Printf("Generated route contracts and platform catalogs — %d route%s\n", count, plural)
}
func Command(ctx context.Context, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = osfs.Canonical(project)
	if err != nil {
		return err
	}
	options := RouteOptions{OptionalString(values, "dir"), OptionalString(values, "out")}
	if values["watch"] == true {
		return WatchRoutes(ctx, project, options)
	}
	location, err := LocateRoutes(project, options, "")
	if err != nil {
		return err
	}
	prepared, err := PrepareRoutes(ctx, location, true)
	RouteDiagnostics(prepared.Worker)
	if err != nil {
		return err
	}
	if prepared.Count == nil {
		return errors.New("No route dir found — expected ./app, ./src/app, or xplat.routes.json (or pass --dir)")
	}
	if err = prepared.Publish(ctx); err != nil {
		return err
	}
	routeGenerated(*prepared.Count)
	return nil
}
