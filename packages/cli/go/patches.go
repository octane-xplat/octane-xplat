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

func init() {
	nativeLegacyCommands["patches check"] = func(ctx context.Context, values map[string]any) error { return patchesCommand(ctx, values, false) }
	nativeLegacyCommands["patches apply"] = func(ctx context.Context, values map[string]any) error { return patchesCommand(ctx, values, true) }
}

type patchRow struct{ Specifier, File, State, Detail, Reason string }
type patchReport struct {
	Copied, Kept, Skipped, Conflicts []patchRow
	Error                            string
}
type patchData struct {
	Version       int
	Root, Manager string
	Rows          []patchRow
	Report        *patchReport
}

// A package-management engine can perform several writes before failing. Keep
// that uncertainty visible even when root cancellation races its response.
type workspaceMutationError struct {
	Operation, Root string
	Err             error
}

func (e *workspaceMutationError) Error() string {
	return fmt.Sprintf("%s failed; workspace files may have changed in %s. Inspect changes and rerun patches check: %v", e.Operation, e.Root, e.Err)
}
func (e *workspaceMutationError) Unwrap() error { return e.Err }

func validatePatchRows(rows []patchRow, inspection bool) error {
	if rows == nil || len(rows) > 1024 {
		return errors.New("invalid patch worker row inventory")
	}
	for _, row := range rows {
		if row.Specifier == "" || len(row.Specifier) > 4096 {
			return errors.New("invalid patch worker specifier")
		}
		if row.File != "" && (len(row.File) > 512 || filepath.Base(row.File) != row.File || strings.ContainsAny(row.File, "/\\:\x00") || !strings.HasSuffix(row.File, ".patch")) {
			return errors.New("invalid patch asset filename")
		}
		if inspection {
			if row.File == "" || row.Detail == "" {
				return errors.New("incomplete patch inspection row")
			}
			switch row.State {
			case "not-declared", "not-applicable", "missing-config", "missing-file", "file-differs", "version-mismatch", "not-installed", "applied":
			default:
				return errors.New("unknown patch worker state")
			}
		}
	}
	return nil
}

func patchWorker(ctx context.Context, project, root, manager, entry, operation string, requested *string, force bool) (patchData, error) {
	var data patchData
	operationContext, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	payload := map[string]any{"workspaceRoot": root, "expectedManager": manager, "force": force, "packageManager": requested}
	result, err := runWorkerEntry(operationContext, project, entry, operation, payload, nil, nil)
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
	expected, err := projectLockIdentity(root)
	if err != nil {
		return data, err
	}
	actual, err := projectLockIdentity(data.Root)
	if err != nil || data.Version != 1 || data.Manager != manager || actual != expected {
		return data, errors.New("patch worker workspace/manager identity mismatch")
	}
	return data, nil
}

func preflightPatchWrites(root string, rows []patchRow) error {
	directory, err := os.OpenRoot(root)
	if err != nil {
		return err
	}
	defer directory.Close()
	for _, name := range []string{"package.json", "pnpm-workspace.yaml"} {
		info, err := directory.Lstat(name)
		if os.IsNotExist(err) && name != "package.json" {
			continue
		}
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("patch configuration must be an ordinary file: %s", name)
		}
	}
	patches, err := cleanDirectory(directory, "patches")
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	defer patches.Close()
	for _, row := range rows {
		info, err := patches.Lstat(row.File)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return err
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("patch destination must be an ordinary file: patches/%s", row.File)
		}
	}
	return nil
}

func patchesCommand(ctx context.Context, values map[string]any, apply bool) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	if selected := optionalString(values, "dir"); selected != nil {
		project = *selected
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	if !pathExists(filepath.Join(project, "package.json")) {
		return fmt.Errorf("no package.json in %s — pass --dir <app root>", project)
	}
	requested := optionalString(values, "packageManager")
	if requested != nil && *requested != "bun" && *requested != "pnpm" {
		return errors.New("--package-manager must be bun or pnpm")
	}
	root, err := projectManagerRoot(ctx, project)
	if err != nil {
		return err
	}
	root, err = canonical(root)
	if err != nil {
		return err
	}
	manager, err := projectPackageManager(ctx, project, requested)
	if err != nil {
		return err
	}
	entry, err := projectWorker(project)
	if err != nil {
		return err
	}
	if apply {
		release, err := lockProjectOutputs(root)
		if err != nil {
			return err
		}
		defer release()
		rootID, err := projectLockIdentity(root)
		if err != nil {
			return err
		}
		projectID, err := projectLockIdentity(project)
		if err != nil {
			return err
		}
		if rootID != projectID {
			release, err := lockProjectOutputs(project)
			if err != nil {
				return err
			}
			defer release()
		}
	}
	inspection, err := patchWorker(ctx, project, root, manager, entry, "patches-check", requested, false)
	if err != nil {
		return err
	}
	if err = validatePatchRows(inspection.Rows, true); err != nil {
		return err
	}
	if !apply {
		bad := 0
		for _, row := range inspection.Rows {
			if row.State == "not-declared" || row.State == "not-applicable" {
				continue
			}
			if row.State == "applied" {
				fmt.Printf("%s — applied\n", row.Specifier)
				continue
			}
			bad++
			hint := "run `xplat patches apply`"
			if row.State == "not-installed" {
				hint = fmt.Sprintf("run `%s install`", manager)
			}
			fmt.Printf("%s — %s (%s)\n", row.Specifier, row.Detail, hint)
		}
		if bad > 0 {
			fmt.Printf("%d patch(es) need attention\n", bad)
			return &projectToolExit{1}
		}
		fmt.Println("patch set applied")
		return nil
	}
	if err = preflightPatchWrites(root, inspection.Rows); err != nil {
		return err
	}
	force, _ := values["force"].(bool)
	updated, err := patchWorker(ctx, project, root, manager, entry, "patches-apply", requested, force)
	failure := func(err error) error {
		return &workspaceMutationError{Operation: "patches apply", Root: root, Err: err}
	}
	if err != nil {
		return failure(err)
	}
	report := updated.Report
	if report == nil {
		return failure(errors.New("missing patch application report"))
	}
	if report.Error != "" {
		return failure(errors.New(report.Error))
	}
	for _, rows := range [][]patchRow{report.Copied, report.Kept, report.Skipped, report.Conflicts} {
		if err = validatePatchRows(rows, false); err != nil {
			return failure(err)
		}
	}
	for _, row := range report.Copied {
		fmt.Printf("%s — wrote patches/%s\n", row.Specifier, row.File)
	}
	for _, row := range report.Kept {
		fmt.Printf("%s — already identical\n", row.Specifier)
	}
	for _, row := range report.Skipped {
		fmt.Printf("%s — skipped (%s)\n", row.Specifier, row.Reason)
	}
	for _, row := range report.Conflicts {
		fmt.Printf("%s — %s\n", row.Specifier, row.Reason)
	}
	if len(report.Conflicts) > 0 {
		fmt.Println("conflicts above — rerun with --force to take the framework copies")
		return &projectToolExit{1}
	}
	if len(report.Copied) > 0 {
		fmt.Printf("run `%s install` to apply\n", manager)
	} else {
		fmt.Println("patch set already applied")
	}
	return nil
}
