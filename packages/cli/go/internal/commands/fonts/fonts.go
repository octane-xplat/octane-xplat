package fonts

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"math"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"time"
)

type fontReport struct {
	Copied, Edited, Warnings, Installed []string
	Faces                               []struct {
		File, Weight       string
		Variable, Imported bool
	}
	Names struct {
		Family       string
		IOS, Android []string
	}
}
type fontPlan struct {
	Version                         int
	Project, SourceDirectory, Error string
	Files                           []artifact.EncodedArtifact
	Inputs                          []struct {
		Path   string
		Before *string
	}
	Report *fontReport
}

func fontPath(project, source, path string) bool {
	if !filepath.IsAbs(path) || filepath.Clean(path) != path || strings.ContainsRune(path, 0) {
		return false
	}
	if path == filepath.Join(project, "package.json") || path == filepath.Join(project, "nativescript.config.ts") {
		return true
	}
	if !osfs.Inside(source, path) {
		return false
	}
	rel, _ := filepath.Rel(source, path)
	if slices.Contains([]string{"fonts.css", "style.css", "main.web.tsrx", "main.web.tsx", "main.web.ts", "main.web.js", "fonts/fonts.json"}, filepath.ToSlash(rel)) {
		return true
	}
	return filepath.Dir(path) == filepath.Join(source, "fonts") && strings.EqualFold(filepath.Ext(path), ".ttf")
}
func validateFontPlan(ctx context.Context, projectRoot string, plan *fontPlan) (artifact.Scope, []artifact.PlannedArtifact, []artifact.State, error) {
	scope, err := artifact.OutputScope(projectRoot, projectRoot)
	fail := func(message string) (artifact.Scope, []artifact.PlannedArtifact, []artifact.State, error) {
		return scope, nil, nil, errors.New(message)
	}
	if err != nil {
		return scope, nil, nil, err
	}
	if plan == nil {
		return fail("font worker omitted its plan")
	}
	if plan.Error != "" {
		return fail(plan.Error)
	}
	if plan.Version != 1 || plan.Project != projectRoot || plan.SourceDirectory == "" || plan.Files == nil || len(plan.Files) < 1 || len(plan.Files) > 512 || plan.Inputs == nil || len(plan.Inputs) > 2048 || plan.Report == nil {
		return fail("invalid font plan frame/inventory")
	}
	source := plan.SourceDirectory
	actual, err := osfs.Canonical(source)
	if err != nil || actual != source || !osfs.Inside(projectRoot, source) {
		return fail("font source directory leaves the selected app or contains aliases")
	}
	rel, _ := filepath.Rel(projectRoot, source)
	for _, part := range strings.Split(rel, string(filepath.Separator)) {
		if strings.EqualFold(part, "node_modules") || strings.EqualFold(part, ".git") {
			return fail("font source directory is private/generated")
		}
	}
	info, err := os.Stat(source)
	if err != nil || !info.IsDir() {
		return fail("font source directory is unavailable")
	}
	states := map[string]artifact.State{}
	observations := []artifact.State{}
	for _, input := range plan.Inputs {
		if _, found := states[input.Path]; found || !fontPath(projectRoot, source, input.Path) {
			return fail("invalid or duplicate font input path")
		}
		state, e := artifact.SnapshotArtifact(ctx, scope, input.Path)
		if e != nil {
			return scope, nil, nil, e
		}
		if state.Alias || state.Target != input.Path || state.Exists != (input.Before != nil) || (state.Exists && state.Hash != *input.Before) {
			return fail("font input changed during planning or contains aliases")
		}
		states[input.Path] = state
		observations = append(observations, state)
	}
	for _, path := range []string{filepath.Join(projectRoot, "package.json"), filepath.Join(projectRoot, "nativescript.config.ts"), filepath.Join(source, "fonts", "fonts.json"), filepath.Join(source, "fonts.css")} {
		if _, ok := states[path]; !ok {
			return fail("font plan omitted a required input observation")
		}
	}
	ownedFonts := map[string]bool{}
	manifestState := states[filepath.Join(source, "fonts", "fonts.json")]
	if manifestState.Exists {
		bytes, e := artifact.ReadArtifactBytes(scope, manifestState)
		if e != nil {
			return scope, nil, nil, e
		}
		var saved struct {
			Tokens map[string]struct{ Faces []struct{ File string } }
		}
		if json.Unmarshal(bytes, &saved) != nil {
			return fail("existing font manifest is invalid")
		}
		for _, token := range saved.Tokens {
			for _, face := range token.Faces {
				ownedFonts[face.File] = true
			}
		}
	}
	seen := map[string]bool{}
	artifacts := []artifact.PlannedArtifact{}
	total := 0
	for _, file := range plan.Files {
		if !fontPath(projectRoot, source, file.Path) || file.Path == filepath.Join(projectRoot, "package.json") || file.Path == filepath.Join(projectRoot, "nativescript.config.ts") || seen[file.Path] || file.Mode == nil || *file.Mode == 0 || *file.Mode > 0777 || file.Content == nil {
			return fail("invalid font output")
		}
		before, found := states[file.Path]
		if !found || before.Exists != (file.Before != nil) || (before.Exists && before.Hash != *file.Before) {
			return fail("font output omitted or mismatched its before-image")
		}
		if strings.EqualFold(filepath.Ext(file.Path), ".ttf") && before.Exists && !ownedFonts[filepath.Base(file.Path)] {
			return fail("font plan cannot overwrite an unregistered existing font")
		}
		bytes, e := base64.StdEncoding.Strict().DecodeString(*file.Content)
		total += len(bytes)
		if e != nil || len(bytes) > artifact.MaxArtifactBytes || total > 32<<20 {
			return fail("font output exceeds encoding/byte limits")
		}
		artifacts = append(artifacts, artifact.PlannedArtifact{File: file.Path, Source: string(bytes), Before: before, Mode: os.FileMode(*file.Mode)})
		seen[file.Path] = true
	}
	report := plan.Report
	for _, items := range [][]string{report.Copied, report.Edited, report.Warnings, report.Installed, report.Names.IOS, report.Names.Android} {
		if items == nil || len(items) > 2048 {
			return fail("incomplete font report")
		}
		for _, s := range items {
			if len(s) > 8192 {
				return fail("oversized font report")
			}
		}
	}
	if report.Faces == nil || len(report.Faces) > 512 || len(report.Names.Family) > 8192 {
		return fail("invalid font faces/names")
	}
	for _, face := range report.Faces {
		if len(face.File) > 8192 || len(face.Weight) > 128 {
			return fail("oversized font face")
		}
	}
	return scope, artifacts, observations, nil
}
func Command(ctx context.Context, values map[string]any) error {
	inputs, _ := values["inputs"].([]string)
	if len(inputs) == 0 || len(inputs) > 128 {
		return errors.New("usage: xplat fonts add <font-file|@fontsource/package> [...]")
	}
	for i, input := range inputs {
		if !strings.HasPrefix(input, "@") {
			path, err := filepath.Abs(input)
			if err != nil {
				return err
			}
			inputs[i] = path
		}
	}
	projectRoot := cli.StringValue(values["dir"])
	if projectRoot == "" {
		projectRoot = "."
	}
	projectRoot, err := filepath.Abs(projectRoot)
	if err != nil {
		return err
	}
	projectRoot, err = osfs.Canonical(projectRoot)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(projectRoot); err != nil {
		return fmt.Errorf("run fonts add inside an app with package.json: %w", err)
	}
	options := map[string]any{}
	for _, key := range []string{"name", "token", "subset"} {
		if value, ok := values[key].(string); ok {
			options[key] = value
		}
	}
	if value, ok := values["weights"].(string); ok {
		weights := []float64{}
		for _, part := range strings.Split(value, ",") {
			number, e := strconv.ParseFloat(strings.TrimSpace(part), 64)
			if e != nil || math.IsNaN(number) || math.IsInf(number, 0) {
				return errors.New("font weights must be a comma-separated list of numbers")
			}
			weights = append(weights, number)
		}
		options["weights"] = weights
	}
	install, _ := values["install"].(bool)
	options["install"] = install
	root := projectRoot
	if install {
		root, err = project.ManagerRoot(ctx, projectRoot)
		if err != nil {
			return err
		}
	}
	releases := []func(){}
	defer func() {
		for i := len(releases) - 1; i >= 0; i-- {
			releases[i]()
		}
	}()
	for _, path := range []string{root, projectRoot} {
		if len(releases) > 0 && root == projectRoot {
			break
		}
		release, e := project.LockProjectOutputs(path)
		if e != nil {
			return e
		}
		releases = append(releases, release)
	}
	if install {
		for _, path := range []string{root, projectRoot} {
			info, e := os.Lstat(filepath.Join(path, "node_modules"))
			if e != nil && !os.IsNotExist(e) {
				return e
			}
			if e == nil && (!info.IsDir() || info.Mode()&os.ModeSymlink != 0) {
				return errors.New("font installation requires ordinary node_modules directories")
			}
		}
	}
	entry, err := project.Worker(projectRoot)
	if err != nil {
		return err
	}
	duration := 2 * time.Minute
	if install {
		duration = 15 * time.Minute
	}
	child, cancel := context.WithTimeout(ctx, duration)
	defer cancel()
	var input, output, diagnostic *os.File
	if install {
		input, output, diagnostic = proc.ForegroundInput(ctx), os.Stdout, os.Stderr
	}
	result, err := project.RunWorkerEntryStdio(child, projectRoot, entry, "fonts-plan", map[string]any{"inputs": inputs, "options": options}, input, output, diagnostic)
	fmt.Fprint(os.Stderr, result.Process.Stdout, result.Process.Stderr)
	for _, warning := range result.Warnings {
		fmt.Fprintln(os.Stderr, warning)
	}
	mutation := func(e error) error {
		if !install {
			return e
		}
		return &project.WorkspaceMutationError{Operation: "font installation/registration", Root: root, Hint: "Inspect dependencies and generated font files before retrying", Err: e}
	}
	if err != nil {
		return mutation(err)
	}
	var data struct {
		Version int
		Project string
		Plan    *fontPlan
	}
	if err = json.Unmarshal(result.Data, &data); err != nil {
		return mutation(err)
	}
	if data.Version != 1 || data.Project == "" || data.Project != projectRoot {
		return mutation(errors.New("font worker project identity mismatch"))
	}
	scope, artifacts, observations, err := validateFontPlan(ctx, projectRoot, data.Plan)
	if err != nil {
		return mutation(err)
	}
	if err = artifact.PublishArtifacts(ctx, scope, artifacts, func() error {
		for _, state := range observations {
			if e := artifact.UnchangedArtifact(ctx, scope, state); e != nil {
				return e
			}
		}
		return nil
	}); err != nil {
		return &project.WorkspaceMutationError{Operation: "font publication", Root: projectRoot, Hint: "Inspect generated font/CSS files before retrying", Err: err}
	}
	report := data.Plan.Report
	for _, spec := range report.Installed {
		fmt.Printf("installed %s\n", spec)
	}
	for _, file := range report.Copied {
		fmt.Printf("fonts/%s — iOS/Android pick this up automatically\n", file)
	}
	for _, file := range report.Edited {
		fmt.Printf("%s — updated\n", file)
	}
	for _, warning := range report.Warnings {
		fmt.Fprintln(os.Stderr, warning)
	}
	fmt.Printf("registered family names: web %q; iOS %s; Android %s\n", report.Names.Family, strings.Join(report.Names.IOS, ", "), strings.Join(report.Names.Android, ", "))
	return nil
}
