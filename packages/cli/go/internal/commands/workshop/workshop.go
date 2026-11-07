package workshop

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/doctor"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"time"
)

func InspectionCommand(operation string) func(context.Context, map[string]any) error {
	return func(ctx context.Context, values map[string]any) error {
		return workshopInspection(ctx, operation, values)
	}
}

type workshopInspectionReport struct {
	Version   int             `json:"version"`
	Project   string          `json:"project"`
	Operation string          `json:"operation"`
	ExitCode  *int            `json:"exitCode"`
	Stdout    string          `json:"stdout"`
	Error     string          `json:"error"`
	Result    json.RawMessage `json:"result"`
}

func validateWorkshopInspection(report workshopInspectionReport, projectPath, operation, target string, jsonOutput bool) error {
	if err := doctor.ValidateDoctorRoot(projectPath, report.Project, report.Version); err != nil {
		return err
	}
	if report.Operation != "workshop-"+operation || report.ExitCode == nil || (*report.ExitCode != 0 && *report.ExitCode != 1) || len(report.Stdout) > 8<<20 || len(report.Error) > 1<<20 || (jsonOutput && report.Stdout != "") {
		return errors.New("invalid workshop inspection response")
	}
	if *report.ExitCode != 0 {
		if report.Error == "" {
			return errors.New("workshop failure omitted diagnostics")
		}
		return nil
	}
	if report.Error != "" || len(report.Result) > 32<<20 {
		return errors.New("invalid workshop inspection result")
	}
	if operation == "list" {
		var result struct {
			Target      string            `json:"target"`
			Entries     []json.RawMessage `json:"entries"`
			Diagnostics []json.RawMessage `json:"diagnostics"`
		}
		if json.Unmarshal(report.Result, &result) != nil || result.Target != target || result.Entries == nil || result.Diagnostics == nil {
			return errors.New("invalid workshop story inventory")
		}
	} else {
		var result struct {
			Root    string                     `json:"root"`
			Targets map[string]json.RawMessage `json:"targets"`
		}
		if json.Unmarshal(report.Result, &result) != nil || doctor.ValidateDoctorRoot(projectPath, result.Root, 1) != nil {
			return errors.New("invalid workshop doctor identity")
		}
		for _, name := range []string{"web", "ios", "android", "macos", "windows", "linux"} {
			var check struct{ Status, Backend string }
			if json.Unmarshal(result.Targets[name], &check) != nil || check.Status == "" || check.Backend == "" {
				return fmt.Errorf("workshop doctor omitted target %s", name)
			}
		}
	}
	return nil
}

func workshopInspection(ctx context.Context, operation string, values map[string]any) error {
	projectPath, err := os.Getwd()
	if err != nil {
		return err
	}
	projectPath, err = osfs.Canonical(projectPath)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(projectPath); err != nil {
		return fmt.Errorf("run workshop inside an app with package.json: %w", err)
	}
	worker, err := project.Worker(projectPath)
	if err != nil {
		return err
	}
	target := cli.StringValue(values["target"])
	if target == "" {
		target = "web"
	}
	jsonOutput, _ := values["json"].(bool)
	operationContext, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	result, err := project.RunWorkerEntry(operationContext, projectPath, worker, "workshop-"+operation, map[string]any{"json": jsonOutput, "target": target}, nil, nil)
	if writeErr := proc.WriteCommandText(operationContext, os.Stderr, result.Process.Stdout+result.Process.Stderr); writeErr != nil {
		return errors.Join(err, writeErr)
	}
	for _, warning := range result.Warnings {
		if writeErr := proc.WriteCommandText(operationContext, os.Stderr, warning+"\n"); writeErr != nil {
			return errors.Join(err, writeErr)
		}
	}
	if err != nil {
		return err
	}
	var report workshopInspectionReport
	if err = json.Unmarshal(result.Data, &report); err != nil {
		return err
	}
	if err = validateWorkshopInspection(report, projectPath, operation, target, jsonOutput); err != nil {
		return err
	}
	if err = proc.WriteCommandText(operationContext, os.Stdout, report.Stdout); err != nil {
		return err
	}
	if *report.ExitCode != 0 {
		return errors.New(report.Error)
	}
	if jsonOutput {
		var output any
		if err = json.Unmarshal(report.Result, &output); err != nil {
			return err
		}
		bytes, err := json.MarshalIndent(output, "", "  ")
		if err != nil {
			return err
		}
		return proc.WriteCommandText(operationContext, os.Stdout, string(bytes)+"\n")
	}
	return nil
}

type workshopInitPlan struct {
	Version int
	Project string
	Files   []artifact.EncodedArtifact
	Inputs  []struct {
		Path   string
		Before *string
		Mode   *uint32
	}
	Report *struct {
		Created, Skipped []string
		HasWorkshop      *bool
	}
}

func workshopInitPaths(projectPath string) []string {
	return []string{filepath.Join(projectPath, "package.json"), filepath.Join(projectPath, "workshop.config.ts"), filepath.Join(projectPath, "src", "workshop", "counter.stories.tsrx")}
}

func workshopInitStates(ctx context.Context, scope artifact.Scope, projectPath string) (map[string]artifact.State, error) {
	states := map[string]artifact.State{}
	for _, path := range workshopInitPaths(projectPath) {
		state, err := artifact.SnapshotArtifact(ctx, scope, path)
		if err != nil {
			return nil, err
		}
		if state.Alias || state.Target != path || (state.Exists && state.Info.Size() > 1<<20) {
			return nil, fmt.Errorf("workshop init requires an ordinary unaliased file under 1 MiB: %s", path)
		}
		states[path] = state
	}
	return states, nil
}

func workshopManifestPreserved(before, after []byte) bool {
	var original, result map[string]any
	if json.Unmarshal(before, &original) != nil || json.Unmarshal(after, &result) != nil || original == nil || result == nil {
		return false
	}
	// Only the missing/falsy workshop script may change. All other manifest data
	// must survive; templates and formatting remain owned by the Node engine.
	scripts, ok := original["scripts"].(map[string]any)
	if !ok {
		if original["scripts"] != nil {
			return false
		}
		scripts = map[string]any{}
		original["scripts"] = scripts
	}
	if existing := scripts["workshop"]; existing != nil && existing != "" && existing != false && existing != float64(0) {
		return false
	}
	candidateScripts, ok := result["scripts"].(map[string]any)
	if !ok {
		return false
	}
	script, ok := candidateScripts["workshop"].(string)
	if !ok || script == "" {
		return false
	}
	// The selected project engine owns the script text, just like the templates.
	scripts["workshop"] = script
	return reflect.DeepEqual(original, result)
}

func validateWorkshopInit(ctx context.Context, scope artifact.Scope, projectPath string, scripts bool, states map[string]artifact.State, plan workshopInitPlan) ([]artifact.PlannedArtifact, error) {
	if plan.Version != 1 || plan.Project != projectPath || plan.Files == nil || len(plan.Files) > 3 || len(plan.Inputs) != 3 || plan.Report == nil || plan.Report.Created == nil || plan.Report.Skipped == nil || plan.Report.HasWorkshop == nil || len(plan.Report.Created) != len(plan.Files) || len(plan.Report.Skipped) > 3 {
		return nil, errors.New("invalid workshop initialization plan")
	}
	for _, values := range [][]string{plan.Report.Created, plan.Report.Skipped} {
		for _, value := range values {
			if len(value) > 8192 {
				return nil, errors.New("oversized workshop initialization report")
			}
		}
	}
	seen := map[string]bool{}
	for _, input := range plan.Inputs {
		before, ok := states[input.Path]
		if !ok || seen[input.Path] || before.Exists != (input.Before != nil) || before.Exists != (input.Mode != nil) || (before.Exists && (before.Hash != *input.Before || uint32(before.Info.Mode().Perm()) != *input.Mode)) {
			return nil, errors.New("workshop initialization input changed or identity is invalid")
		}
		seen[input.Path] = true
	}
	seen = map[string]bool{}
	artifacts := []artifact.PlannedArtifact{}
	for _, file := range plan.Files {
		before, ok := states[file.Path]
		if !ok || seen[file.Path] || file.Content == nil || file.Mode == nil || *file.Mode == 0 || *file.Mode > 0777 || before.Exists != (file.Before != nil) || (before.Exists && before.Hash != *file.Before) {
			return nil, errors.New("invalid workshop initialization output")
		}
		isManifest := file.Path == filepath.Join(projectPath, "package.json")
		if (!isManifest && before.Exists) || (isManifest && !scripts) {
			return nil, errors.New("workshop initialization must preserve existing files and disabled scripts")
		}
		bytes, err := base64.StdEncoding.Strict().DecodeString(*file.Content)
		if err != nil || len(bytes) > 1<<20 {
			return nil, errors.New("invalid workshop initialization output encoding/size")
		}
		if before.Exists {
			if uint32(before.Info.Mode().Perm()) != *file.Mode {
				return nil, errors.New("workshop initialization changed existing file permissions")
			}
			original, err := artifact.ReadArtifactBytes(scope, before)
			if err != nil {
				return nil, err
			}
			if !workshopManifestPreserved(original, bytes) {
				return nil, errors.New("workshop initialization changed unrelated manifest data or an existing script")
			}
		} else if *file.Mode != 0644 {
			return nil, errors.New("invalid workshop template permissions")
		}
		artifacts = append(artifacts, artifact.PlannedArtifact{File: file.Path, Source: string(bytes), Before: before, Mode: os.FileMode(*file.Mode)})
		seen[file.Path] = true
	}
	return artifacts, nil
}

func InitCommand(ctx context.Context, values map[string]any) error {
	projectPath, err := os.Getwd()
	if err != nil {
		return err
	}
	projectPath, err = osfs.Canonical(projectPath)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(projectPath); err != nil {
		return err
	}
	release, err := project.LockProjectOutputs(projectPath)
	if err != nil {
		return err
	}
	defer release()
	scope, err := artifact.OutputScope(projectPath, projectPath)
	if err != nil {
		return err
	}
	states, err := workshopInitStates(ctx, scope, projectPath)
	if err != nil {
		return err
	}
	noScripts, _ := values["noScripts"].(bool)
	child, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	result, err := project.RunWorker(child, projectPath, "workshop-init-plan", map[string]any{"scripts": !noScripts})
	if writeErr := proc.WriteCommandText(child, os.Stderr, result.Process.Stdout+result.Process.Stderr); writeErr != nil {
		return errors.Join(err, writeErr)
	}
	for _, warning := range result.Warnings {
		if writeErr := proc.WriteCommandText(child, os.Stderr, warning+"\n"); writeErr != nil {
			return errors.Join(err, writeErr)
		}
	}
	if err != nil {
		return err
	}
	var plan workshopInitPlan
	if err = json.Unmarshal(result.Data, &plan); err != nil {
		return err
	}
	artifacts, err := validateWorkshopInit(child, scope, projectPath, !noScripts, states, plan)
	if err != nil {
		return err
	}
	unchanged := func() error {
		for _, before := range states {
			if e := artifact.UnchangedArtifact(child, scope, before); e != nil {
				return e
			}
		}
		return nil
	}
	if err = unchanged(); err != nil {
		return err
	}
	if err = artifact.PublishArtifacts(child, scope, artifacts, unchanged); err != nil {
		return &project.WorkspaceMutationError{Operation: "workshop initialization", Root: projectPath, Hint: "Inspect generated files and the workshop script before retrying", Err: err}
	}
	var output strings.Builder
	for _, item := range plan.Report.Created {
		fmt.Fprintf(&output, "  created %s\n", item)
	}
	for _, item := range plan.Report.Skipped {
		fmt.Fprintf(&output, "  skipped %s\n", item)
	}
	if !*plan.Report.HasWorkshop {
		fmt.Fprintln(&output, "  next: bun add -D @octane-xplat/workshop")
	}
	fmt.Fprintln(&output, "  run: bun run xplat workshop dev --target web")
	return proc.WriteCommandText(child, os.Stdout, output.String())
}

func DevCommand(ctx context.Context, values map[string]any) error {
	projectPath, err := os.Getwd()
	if err != nil {
		return err
	}
	projectPath, err = osfs.Canonical(projectPath)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(projectPath); err != nil {
		return err
	}
	worker, err := project.Worker(projectPath)
	if err != nil {
		return err
	}
	target := cli.StringValue(values["target"])
	if target == "" {
		target = "web"
	}
	payload := map[string]any{"target": target}
	for _, key := range []string{"story", "device"} {
		if value, ok := values[key].(string); ok {
			payload[key] = value
		}
	}
	if value, ok := values["port"].(string); ok {
		port, e := strconv.Atoi(value)
		if e != nil || port < 0 || port > 65535 {
			return errors.New("--port expects a decimal integer from 0 to 65535")
		}
		payload["port"] = port
	}
	release, err := project.LockProjectOutputs(projectPath)
	if err != nil {
		return err
	}
	defer release()
	_, err = runServiceWorker(ctx, projectPath, worker, "workshop-dev", target, payload, 5*time.Minute, proc.ForegroundInput(ctx), os.Stdout, os.Stderr)
	return err
}

// BuildCommand owns the finite selected-project build worker lifetime.
func BuildCommand(ctx context.Context, values map[string]any) error {
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	root, err = osfs.Canonical(root)
	if err != nil {
		return err
	}
	if _, err = project.Manifest(root); err != nil {
		return err
	}
	worker, err := project.Worker(root)
	if err != nil {
		return err
	}
	target := cli.StringValue(values["target"])
	if target == "" {
		target = "web"
	}
	if target != "web" {
		return errors.New("Workshop static build supports only web")
	}
	output := cli.StringValue(values["outDir"])
	if output == "" {
		output = "dist/workshop"
	}
	base := cli.StringValue(values["base"])
	if base == "" {
		base = "/"
	}
	result, err := project.RunWorkerEntry(ctx, root, worker, "workshop-build", map[string]any{"target": target, "outDir": output, "base": base}, nil, nil)
	if writeErr := proc.WriteCommandText(ctx, os.Stderr, result.Process.Stdout+result.Process.Stderr); writeErr != nil {
		return errors.Join(err, writeErr)
	}
	if err != nil {
		return err
	}
	var receipt struct {
		Version                    int
		Project, Operation, OutDir string
		Components, Stories        int
	}
	if json.Unmarshal(result.Data, &receipt) != nil || receipt.Version != 1 || receipt.Project != root || receipt.Operation != "workshop-build" || !filepath.IsAbs(receipt.OutDir) || receipt.Components < 0 || receipt.Stories < receipt.Components {
		return errors.New("invalid Workshop build receipt")
	}
	return proc.WriteCommandText(ctx, os.Stdout, fmt.Sprintf("Workshop: %d components, %d stories → %s\n", receipt.Components, receipt.Stories, receipt.OutDir))
}
