package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type preparedRoutes struct {
	Location    routeLocation
	Scope       artifactScope
	Before      map[string]artifactState
	Artifacts   []plannedArtifact
	Count       *int
	Fingerprint string
	Worker      workerResult
}

func init() { nativeLegacyCommands["routes"] = routesCommand }

func optionalString(values map[string]any, name string) *string {
	value, ok := values[name].(string)
	if !ok {
		return nil
	}
	return &value
}
func routeDiagnostics(result workerResult) {
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

func protectedRouteSources(location routeLocation) (map[string]bool, []string, error) {
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
			actual, err := canonical(path)
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
				files[filesystemKey(actual)] = true
			}
		}
	}
	return files, directories, nil
}

func captureRouteOutputs(ctx context.Context, location routeLocation) (artifactScope, map[string]artifactState, error) {
	scope, err := outputScope(location.Project, filepath.Dir(location.Base))
	if err != nil {
		return scope, nil, err
	}
	protected, protectedDirectories, err := protectedRouteSources(location)
	if err != nil {
		return scope, nil, err
	}
	routeRoot, _, _, err := projectedDirectory(location.Directory)
	if err != nil {
		return scope, nil, err
	}
	before := map[string]artifactState{}
	targets := map[string]bool{}
	for _, path := range location.outputPaths() {
		state, err := snapshotArtifact(ctx, scope, path)
		if err != nil {
			return scope, nil, err
		}
		key := filesystemKey(state.Target)
		if targets[key] {
			return scope, nil, errors.New("route output aliases collide with another generated artifact")
		}
		targets[key] = true
		if state.Alias {
			if inside(routeRoot, state.Target) {
				return scope, nil, errors.New("a generated output alias must not overwrite route source files")
			}
			if protected[key] {
				return scope, nil, errors.New("a generated output alias must not overwrite configuration or a source reference")
			}
			for _, source := range protectedDirectories {
				if inside(source, state.Target) {
					return scope, nil, errors.New("a generated output alias must not overwrite a configured source reference")
				}
			}
		}
		before[path] = state
	}
	return scope, before, nil
}
func validateRouteArtifacts(data json.RawMessage, location routeLocation, before map[string]artifactState, bake bool) ([]plannedArtifact, *int, error) {
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
	outputs, seen, bytes := []plannedArtifact{}, map[string]bool{}, 0
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
		if len(source) > maxArtifactBytes || bytes > maxArtifactPlanBytes {
			return nil, nil, errors.New("route artifacts exceed 16 MiB per file or 64 MiB total")
		}
		outputs = append(outputs, plannedArtifact{File: path, Source: source, Before: state})
	}
	for path, state := range before {
		required := bake || path != location.Base+".data.ts" || !state.Exists
		if required && !seen[path] {
			return nil, nil, errors.New("incomplete route artifact plan")
		}
	}
	return outputs, count, nil
}
func prepareRoutes(ctx context.Context, location routeLocation, bake bool) (preparedRoutes, error) {
	prepared := preparedRoutes{Location: location}
	var err error
	if location.Directory != "" {
		prepared.Scope, prepared.Before, err = captureRouteOutputs(ctx, location)
		if err != nil {
			return prepared, err
		}
	}
	prepared.Fingerprint, err = routeFingerprint(ctx, location)
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
	prepared.Worker, err = runWorker(ctx, location.Project, "route-plan", map[string]any{
		"directory": directory, "output": output, "bake": bake,
	})
	if err != nil {
		return prepared, err
	}
	prepared.Artifacts, prepared.Count, err = validateRouteArtifacts(prepared.Worker.Data, location, prepared.Before, bake)
	if err != nil {
		return prepared, err
	}
	return prepared, prepared.revalidate(ctx)
}
func (prepared preparedRoutes) revalidate(ctx context.Context) error {
	fingerprint, err := routeFingerprint(ctx, prepared.Location)
	if err != nil {
		return err
	}
	if fingerprint != prepared.Fingerprint {
		return errors.New("route inputs changed during planning; retry generation")
	}
	for _, state := range prepared.Before {
		if err := unchangedArtifact(ctx, prepared.Scope, state); err != nil {
			return err
		}
	}
	return nil
}
func (prepared preparedRoutes) publish(ctx context.Context) error {
	if prepared.Count == nil {
		return nil
	}
	return publishArtifacts(ctx, prepared.Scope, prepared.Artifacts, func() error { return prepared.revalidate(ctx) })
}
func routeGenerated(count int) {
	plural := "s"
	if count == 1 {
		plural = ""
	}
	fmt.Printf("Generated route contracts and platform catalogs — %d route%s\n", count, plural)
}
func routesCommand(ctx context.Context, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	options := routeOptions{optionalString(values, "dir"), optionalString(values, "out")}
	if values["watch"] == true {
		return watchRoutes(ctx, project, options)
	}
	location, err := locateRoutes(project, options, "")
	if err != nil {
		return err
	}
	prepared, err := prepareRoutes(ctx, location, true)
	routeDiagnostics(prepared.Worker)
	if err != nil {
		return err
	}
	if prepared.Count == nil {
		return errors.New("No route dir found — expected ./app, ./src/app, or xplat.routes.json (or pass --dir)")
	}
	if err = prepared.publish(ctx); err != nil {
		return err
	}
	routeGenerated(*prepared.Count)
	return nil
}
