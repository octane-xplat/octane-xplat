package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"slices"
	"strings"
	"time"
)

func init() { nativeLegacyCommands["add"] = addCommand }

type addTarget struct {
	ID, Label, Note string
	Enabled         *bool
}
type addReport struct{ Enabled, Already, Copied, Skipped, ScriptsAdded, ScriptsSkipped, DepsAdded []string }
type addInput struct {
	Path, Kind, SHA256 string
	Mode               *uint32
}
type addFile struct {
	Path    string
	Before  *string
	Content *string
	Mode    *uint32
}
type addDirectory struct {
	Path string
	Mode *uint32
}
type addPlan struct {
	Version           int
	Root, AppRoot, ID string
	Files             []addFile
	Directories       []addDirectory
	Inputs            []addInput
	Report            *addReport
}
type addData struct {
	Version                         int
	Root, Project, FrameworkVersion string
	Targets                         []addTarget
	Plan                            *addPlan
	ExitCode                        *int
}
type addObservation struct {
	Path, Kind, Hash string
	Info             os.FileInfo
}

func addOperation(ctx context.Context, project, root, entry, operation, target string) (addData, error) {
	var data addData
	duration := 2 * time.Minute
	if operation == "add-install" {
		duration = 15 * time.Minute
	}
	child, cancel := context.WithTimeout(ctx, duration)
	defer cancel()
	var input, output, diagnostic *os.File
	if operation == "add-install" {
		input, output, diagnostic = foregroundInput(ctx), os.Stdout, os.Stderr
	}
	result, err := runWorkerEntryStdio(child, project, entry, operation, map[string]any{"workspaceRoot": root, "frameworkVersion": metadata.FrameworkVersion, "target": target}, input, output, diagnostic)
	for _, warning := range result.Warnings {
		fmt.Fprintln(os.Stderr, warning)
	}
	fmt.Fprint(os.Stderr, result.Process.Stdout, result.Process.Stderr)
	if err != nil {
		return data, err
	}
	if err = json.Unmarshal(result.Data, &data); err != nil {
		return data, err
	}
	if data.Version != 1 || data.Root == "" || data.Project == "" || data.FrameworkVersion != metadata.FrameworkVersion {
		return data, errors.New("invalid scaffold worker identity")
	}
	expected, e := projectLockIdentity(project)
	actual, a := projectLockIdentity(data.Project)
	owner, o := projectLockIdentity(root)
	returned, r := projectLockIdentity(data.Root)
	if e != nil || a != nil || o != nil || r != nil || expected != actual || owner != returned {
		return data, errors.New("scaffold worker workspace/project identity mismatch")
	}
	return data, nil
}
func addPathAllowed(project, root, path string, directory bool) bool {
	if !filepath.IsAbs(path) || filepath.Clean(path) != path || strings.ContainsRune(path, 0) {
		return false
	}
	if inside(project, path) {
		rel, _ := filepath.Rel(project, path)
		for _, part := range strings.Split(rel, string(filepath.Separator)) {
			if strings.EqualFold(part, "node_modules") || strings.EqualFold(part, ".git") {
				return false
			}
		}
		return path != project || directory
	}
	patches := filepath.Join(root, "patches")
	if directory {
		return path == patches || inside(path, project) && inside(root, path)
	}
	return path == filepath.Join(root, "package.json") || filepath.Dir(path) == patches && strings.HasSuffix(path, ".patch")
}
func observeAdd(ctx context.Context, path string) (addObservation, error) {
	state := addObservation{Path: path, Kind: "missing"}
	info, err := os.Lstat(path)
	if os.IsNotExist(err) {
		return state, nil
	}
	if err != nil {
		return state, err
	}
	actual, err := canonical(path)
	if err != nil {
		return state, err
	}
	if actual != path || info.Mode()&os.ModeSymlink != 0 {
		return state, fmt.Errorf("scaffold path contains aliases: %s", path)
	}
	state.Info = info
	if info.IsDir() {
		state.Kind = "directory"
		return state, nil
	}
	if !info.Mode().IsRegular() {
		return state, errors.New("scaffold input must be an ordinary file/directory")
	}
	state.Kind = "file"
	state.Hash, state.Info, err = artifactHash(ctx, path)
	return state, err
}
func validateAddPlan(ctx context.Context, project, root, id string, plan *addPlan) ([]formatArtifact, map[string]addObservation, error) {
	observations := map[string]addObservation{}
	fail := func(message string) ([]formatArtifact, map[string]addObservation, error) {
		return nil, nil, errors.New(message)
	}
	if plan == nil || plan.Version != 1 || plan.Root != root || plan.AppRoot != project || plan.ID != id || plan.Report == nil || plan.Files == nil || plan.Directories == nil || plan.Inputs == nil || len(plan.Files) > 8192 || len(plan.Directories) > 8192 || len(plan.Inputs) > 20000 {
		return fail("invalid scaffold plan frame/inventory")
	}
	report := plan.Report
	for _, items := range [][]string{report.Enabled, report.Already, report.Copied, report.Skipped, report.ScriptsAdded, report.ScriptsSkipped, report.DepsAdded} {
		if items == nil || len(items) > 20000 {
			return fail("incomplete scaffold report")
		}
		for _, value := range items {
			if len(value) > 8192 {
				return fail("oversized scaffold report value")
			}
		}
	}
	for _, input := range plan.Inputs {
		if _, ok := observations[input.Path]; ok {
			return fail("duplicate scaffold observation")
		}
		if !addPathAllowed(project, root, input.Path, input.Kind == "directory") && !(input.Kind == "missing" && addPathAllowed(project, root, input.Path, true)) {
			return fail("scaffold observation leaves authorized paths")
		}
		state, err := observeAdd(ctx, input.Path)
		if err != nil {
			return nil, nil, err
		}
		if state.Kind != input.Kind {
			return fail(fmt.Sprintf("scaffold input changed during planning: %s (kind %s, expected %s)", input.Path, state.Kind, input.Kind))
		}
		if state.Kind != "missing" {
			if input.Mode == nil {
				return fail("scaffold input omitted its permissions")
			}
			expectedMode := os.FileMode(*input.Mode)
			if runtime.GOOS == "windows" && state.Kind == "directory" {
				// libuv reports Windows directories as 0666/0444; Go adds
				// synthetic execute bits. Neither describes a Windows ACL.
				expectedMode |= 0111
			}
			if state.Info.Mode().Perm() != expectedMode {
				return fail(fmt.Sprintf("scaffold input changed during planning: %s (mode %o, expected %o)", input.Path, state.Info.Mode().Perm(), expectedMode))
			}
		}
		if state.Kind == "file" && state.Hash != input.SHA256 {
			return fail(fmt.Sprintf("scaffold input changed during planning: %s (content)", input.Path))
		}
		observations[input.Path] = state
	}
	for _, required := range []string{filepath.Join(project, "package.json"), filepath.Join(root, "package.json")} {
		if observations[required].Kind != "file" {
			return fail("scaffold plan omitted a required manifest observation")
		}
	}
	dirs := map[string]bool{}
	for _, entry := range plan.Directories {
		if !addPathAllowed(project, root, entry.Path, true) || entry.Path == project || entry.Path == root || entry.Mode == nil || *entry.Mode == 0 || *entry.Mode > 0777 || dirs[entry.Path] || observations[entry.Path].Kind != "missing" {
			return fail("invalid scaffold directory plan")
		}
		dirs[entry.Path] = true
	}
	parentComplete := func(path string) bool {
		parent := filepath.Dir(path)
		return parent == root || parent == project || dirs[parent] || observations[parent].Kind == "directory"
	}
	for _, entry := range plan.Directories {
		if !parentComplete(entry.Path) {
			return fail("scaffold directory plan omitted a parent")
		}
	}
	artifacts := []formatArtifact{}
	seen := map[string]bool{}
	total := 0
	for _, entry := range plan.Files {
		if !addPathAllowed(project, root, entry.Path, false) || entry.Mode == nil || *entry.Mode == 0 || *entry.Mode > 0777 || entry.Content == nil || seen[entry.Path] || dirs[entry.Path] || !parentComplete(entry.Path) {
			return fail("invalid scaffold output")
		}
		seen[entry.Path] = true
		observed, ok := observations[entry.Path]
		if !ok || observed.Kind == "directory" {
			return fail("scaffold output omitted its input state")
		}
		if (observed.Kind == "missing" && entry.Before != nil) || (observed.Kind == "file" && (entry.Before == nil || observed.Hash != *entry.Before)) {
			return fail("scaffold output before-image mismatch")
		}
		if observed.Kind == "file" && entry.Path != filepath.Join(project, "package.json") && entry.Path != filepath.Join(project, "tsconfig.json") && entry.Path != filepath.Join(root, "package.json") && filepath.Dir(entry.Path) != filepath.Join(root, "patches") {
			return fail("scaffold cannot overwrite existing source/assets")
		}
		bytes, err := base64.StdEncoding.Strict().DecodeString(*entry.Content)
		total += len(bytes)
		if err != nil || len(bytes) > maxArtifactBytes || total > 32<<20 {
			return fail("scaffold output exceeds byte/encoding limits")
		}
		scopeProject := project
		if !inside(project, entry.Path) {
			scopeProject = root
		}
		scope, err := outputScope(scopeProject, scopeProject)
		if err != nil {
			return nil, nil, err
		}
		before, err := snapshotArtifact(ctx, scope, entry.Path)
		if err != nil {
			return nil, nil, err
		}
		if before.Alias || before.Target != entry.Path || before.Exists != (observed.Kind == "file") || before.Hash != observed.Hash {
			return fail("scaffold target changed during validation")
		}
		artifacts = append(artifacts, formatArtifact{Scope: scope, Artifact: plannedArtifact{File: entry.Path, Source: string(bytes), Before: before, Mode: os.FileMode(*entry.Mode)}})
	}
	return artifacts, observations, nil
}
func checkAddInputs(ctx context.Context, observations map[string]addObservation) error {
	for _, before := range observations {
		after, err := observeAdd(ctx, before.Path)
		if err != nil {
			return err
		}
		if before.Kind != after.Kind || before.Hash != after.Hash || (before.Kind != "missing" && (!os.SameFile(before.Info, after.Info) || before.Info.Mode() != after.Info.Mode())) {
			return fmt.Errorf("scaffold input changed; retry: %s", before.Path)
		}
	}
	return nil
}
func publishAddPlan(ctx context.Context, project, root string, plan *addPlan, artifacts []formatArtifact, observations map[string]addObservation) error {
	if err := checkAddInputs(ctx, observations); err != nil {
		return err
	}
	for _, entry := range plan.Directories {
		if err := ctx.Err(); err != nil {
			return err
		}
		anchor := project
		if !inside(project, entry.Path) {
			anchor = root
		}
		directory, err := os.OpenRoot(anchor)
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(anchor, entry.Path)
		err = directory.Mkdir(rel, os.FileMode(*entry.Mode))
		if err == nil {
			err = directory.Chmod(rel, os.FileMode(*entry.Mode))
		}
		directory.Close()
		if err != nil {
			return err
		}
		state, err := observeAdd(ctx, entry.Path)
		if err != nil {
			return err
		}
		observations[entry.Path] = state
	}
	anchors := []string{root}
	if project != root {
		anchors = append(anchors, project)
	}
	for _, anchor := range anchors {
		group := []plannedArtifact{}
		var scope artifactScope
		for _, entry := range artifacts {
			if entry.Scope.Anchor == anchor {
				group = append(group, entry.Artifact)
				scope = entry.Scope
			}
		}
		if len(group) == 0 {
			continue
		}
		if err := publishArtifacts(ctx, scope, group, func() error { return checkAddInputs(ctx, observations) }); err != nil {
			return err
		}
		for _, file := range group {
			state, err := observeAdd(ctx, file.File)
			if err != nil {
				return err
			}
			observations[file.File] = state
		}
	}
	return nil
}
func readAddSelection(ctx context.Context) (string, error) {
	input := foregroundInput(ctx)
	if input == nil || !buildTerminal(input) || !buildTerminal(os.Stdout) {
		return "", errors.New("usage: xplat add <web|ios|android> [...]")
	}
	type answer struct {
		line string
		err  error
	}
	done := make(chan answer, 1)
	go func() {
		var line strings.Builder
		var one [1]byte
		for line.Len() <= 16384 {
			n, err := input.Read(one[:])
			if n > 0 {
				line.WriteByte(one[0])
			}
			if err != nil || one[0] == '\n' {
				done <- answer{line.String(), err}
				return
			}
		}
		done <- answer{err: errors.New("platform selection exceeds 16 KiB")}
	}()
	select {
	case <-ctx.Done():
		return "", ctx.Err()
	case result := <-done:
		return result.line, result.err
	}
}
func addCommand(ctx context.Context, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	if _, err = projectManifest(project); err != nil {
		if os.IsNotExist(err) {
			return errors.New("No package.json here — run xplat add inside an app")
		}
		return fmt.Errorf("cannot read app package.json: %w", err)
	}
	manager, err := projectPackageManager(ctx, project, nil)
	if err != nil {
		return err
	}
	if manager != "bun" {
		return errors.New("platform additions require a Bun project; xplat patches remains available for pnpm")
	}
	root, err := projectManagerRoot(ctx, project)
	if err != nil {
		return err
	}
	entry, err := projectWorker(project)
	if err != nil {
		return err
	}
	data, err := addOperation(ctx, project, root, entry, "add-targets", "")
	if err != nil {
		return err
	}
	if data.Targets == nil || len(data.Targets) == 0 || len(data.Targets) > 32 {
		return errors.New("invalid scaffold target catalog")
	}
	ids := []string{}
	notes := map[string]string{}
	remaining := []string{}
	for _, target := range data.Targets {
		if target.ID == "" || target.Enabled == nil || slices.Contains(ids, target.ID) || len(target.ID) > 64 || len(target.Label) > 512 || len(target.Note) > 8192 {
			return errors.New("invalid scaffold target metadata")
		}
		ids = append(ids, target.ID)
		notes[target.ID] = target.Note
		if !*target.Enabled {
			remaining = append(remaining, target.ID)
		}
	}
	selected, _ := values["platforms"].([]string)
	if len(selected) == 0 {
		if foregroundInput(ctx) == nil || !buildTerminal(foregroundInput(ctx)) || !buildTerminal(os.Stdout) {
			return fmt.Errorf("usage: xplat add <%s> [...]", strings.Join(ids, "|"))
		}
		if len(remaining) == 0 {
			fmt.Println("All platforms already enabled")
			return nil
		}
		fmt.Printf("Platforms to enable (%s; comma/space list; Enter cancels): ", strings.Join(remaining, ", "))
		line, e := readAddSelection(ctx)
		if errors.Is(e, io.EOF) {
			fmt.Println("Cancelled")
			return nil
		}
		if e != nil {
			return e
		}
		selected = strings.FieldsFunc(strings.TrimSpace(line), func(r rune) bool { return r == ',' || r == ' ' || r == '\t' })
		if len(selected) == 0 {
			fmt.Println("Cancelled")
			return nil
		}
	}
	for _, id := range selected {
		if !slices.Contains(ids, id) {
			return fmt.Errorf("unknown target %q — expected %s", id, strings.Join(ids, ", "))
		}
	}
	releases := []func(){}
	defer func() {
		for i := len(releases) - 1; i >= 0; i-- {
			releases[i]()
		}
	}()
	for _, path := range []string{root, project} {
		if len(releases) > 0 && root == project {
			break
		}
		release, e := lockProjectOutputs(path)
		if e != nil {
			return e
		}
		releases = append(releases, release)
	}
	noInstall, _ := values["noInstall"].(bool)
	if !noInstall {
		for _, path := range []string{root, project} {
			info, e := os.Lstat(filepath.Join(path, "node_modules"))
			if e != nil && !os.IsNotExist(e) {
				return e
			}
			if e == nil && (!info.IsDir() || info.Mode()&os.ModeSymlink != 0) {
				return errors.New("platform install requires ordinary node_modules directories; use --no-install for linked tool fixtures")
			}
		}
	}
	mutation := func(e error) error {
		return &workspaceMutationError{Operation: "platform addition", Root: root, Hint: "Inspect generated files and incomplete platform directories before retrying; existing sources are preserved", Err: e}
	}
	anyEnabled := false
	for _, id := range selected {
		planned, e := addOperation(ctx, project, root, entry, "add-plan", id)
		if e != nil {
			return e
		}
		artifacts, observations, e := validateAddPlan(ctx, project, root, id, planned.Plan)
		if e != nil {
			return e
		}
		if e = publishAddPlan(ctx, project, root, planned.Plan, artifacts, observations); e != nil {
			return mutation(e)
		}
		report := planned.Plan.Report
		if slices.Contains(report.Already, id) {
			fmt.Printf("%s is already enabled\n", id)
			continue
		}
		anyEnabled = true
		visible := []string{}
		hidden := false
		for _, enabled := range report.Enabled {
			if slices.Contains(ids, enabled) {
				visible = append(visible, enabled)
			} else {
				hidden = true
			}
		}
		fmt.Printf("enabled %s", strings.Join(visible, ", "))
		if hidden {
			fmt.Print(" (+ shared NativeScript setup)")
		}
		fmt.Println()
		for _, name := range report.ScriptsSkipped {
			fmt.Printf("script %q exists with a different command — keeping yours\n", name)
		}
		for _, path := range report.Skipped {
			fmt.Printf("%s already exists — skipped\n", path)
		}
		if notes[id] != "" {
			fmt.Println(notes[id])
		}
	}
	if !anyEnabled {
		return nil
	}
	if noInstall {
		fmt.Println("Skipped install — run bun install to fetch the new deps")
		return nil
	}
	installed, e := addOperation(ctx, project, root, entry, "add-install", "")
	if e != nil {
		return mutation(e)
	}
	if installed.ExitCode == nil || *installed.ExitCode != 0 {
		return mutation(errors.New("bun install failed; run it manually to finish enabling the target"))
	}
	fmt.Println("installed — use the new scripts in package.json")
	return nil
}
