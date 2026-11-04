package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"
)

func init() { nativeLegacyCommands["upgrade"] = upgradeCommand }

type upgradeFile struct {
	Path   string  `json:"path"`
	Before *string `json:"before"`
	After  *string `json:"after"`
}
type upgradePlan struct {
	Root, Version                        string
	Packages, Projects, Updates, Skipped []string
	Files                                []upgradeFile
}
type upgradeData struct {
	Version                                 int
	Root, Manager, FrameworkVersion, Digest string
	Plan                                    *upgradePlan
	Written, ExitCode                       *int
	Issues                                  []string
}

func upgradeOperation(ctx context.Context, project, root, manager, entry, operation, digest string) (upgradeData, error) {
	var data upgradeData
	timeout := 2 * time.Minute
	if operation == "upgrade-install" {
		timeout = 15 * time.Minute
	}
	operationContext, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	payload := map[string]any{"workspaceRoot": root, "expectedManager": manager, "frameworkVersion": metadata.FrameworkVersion, "digest": digest}
	var output, diagnostic *os.File
	if operation == "upgrade-install" {
		output, diagnostic = os.Stdout, os.Stderr
	}
	result, err := runWorkerEntry(operationContext, project, entry, operation, payload, output, diagnostic)
	if output == nil {
		var text strings.Builder
		text.WriteString(result.Process.Stdout)
		text.WriteString(result.Process.Stderr)
		for _, warning := range result.Warnings {
			fmt.Fprintln(&text, warning)
		}
		if sinkErr := writeCommandText(ctx, os.Stderr, text.String()); err == nil {
			err = sinkErr
		}
	}
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
	if err != nil || data.Root == "" || actual != expected || data.Version != 1 || data.Manager != manager || data.FrameworkVersion != metadata.FrameworkVersion {
		return data, errors.New("upgrade worker workspace/manager/release identity mismatch")
	}
	return data, nil
}

// Validate the complete canonical plan before starting the mutating worker.
// Policy, comment preservation and rollback remain in the shared JS engine.
func preflightUpgrade(ctx context.Context, root string, data upgradeData) ([]string, error) {
	plan := data.Plan
	digest, err := hex.DecodeString(data.Digest)
	if err != nil || len(digest) != 32 || plan == nil || plan.Version != metadata.FrameworkVersion || plan.Root != data.Root || len(plan.Packages) == 0 || len(plan.Packages) > 20000 || plan.Files == nil || len(plan.Files) > 8192 || plan.Projects == nil || plan.Updates == nil || plan.Skipped == nil {
		return nil, errors.New("invalid or incomplete compatibility upgrade plan")
	}
	directory, err := os.OpenRoot(root)
	if err != nil {
		return nil, err
	}
	defer directory.Close()
	packages := map[string]bool{}
	for _, path := range plan.Packages {
		if err = ctx.Err(); err != nil {
			return nil, err
		}
		rel, e := filepath.Rel(root, path)
		if e != nil || !filepath.IsAbs(path) || !inside(root, path) || filepath.Clean(path) != path {
			return nil, errors.New("upgrade package outside the workspace")
		}
		child, e := cleanDirectory(directory, rel)
		if e != nil {
			return nil, fmt.Errorf("upgrade package must be an ordinary workspace directory: %w", e)
		}
		info, e := child.Lstat("package.json")
		child.Close()
		if e != nil || !info.Mode().IsRegular() {
			return nil, errors.New("upgrade package manifest must be an ordinary file")
		}
		packages[path] = true
	}
	if !packages[root] {
		return nil, errors.New("upgrade package inventory omitted the workspace root")
	}
	for _, path := range plan.Projects {
		if !packages[path] {
			return nil, errors.New("upgrade verification project absent from package inventory")
		}
	}
	seen := map[string]bool{}
	total := 0
	for _, file := range plan.Files {
		if err = ctx.Err(); err != nil {
			return nil, err
		}
		if !filepath.IsAbs(file.Path) || !inside(root, file.Path) || filepath.Clean(file.Path) != file.Path || seen[file.Path] || file.After == nil {
			return nil, errors.New("invalid, duplicate or escaping upgrade destination")
		}
		seen[file.Path] = true
		total += len(*file.After)
		if file.Before != nil {
			total += len(*file.Before)
		}
		if total > 32<<20 {
			return nil, errors.New("upgrade plan exceeds 32 MiB")
		}
		rel, _ := filepath.Rel(root, file.Path)
		owner := filepath.Dir(file.Path)
		name := filepath.Base(file.Path)
		allowed := name == "package.json" && packages[owner] || file.Path == filepath.Join(root, "pnpm-workspace.yaml") || owner == filepath.Join(root, "patches") && strings.HasSuffix(name, ".patch")
		if !allowed {
			return nil, errors.New("upgrade destination is not compatibility metadata or a patch")
		}
		parent, e := cleanDirectory(directory, filepath.Dir(rel))
		if e != nil {
			if os.IsNotExist(e) && owner == filepath.Join(root, "patches") && file.Before == nil {
				continue
			}
			return nil, e
		}
		info, e := parent.Lstat(name)
		if os.IsNotExist(e) && file.Before == nil {
			parent.Close()
			continue
		}
		if e != nil || !info.Mode().IsRegular() || info.Size() > 16<<20 || file.Before == nil {
			parent.Close()
			return nil, errors.New("upgrade destination must match an ordinary preflight file")
		}
		before, e := parent.ReadFile(name)
		parent.Close()
		if e != nil {
			return nil, e
		}
		if string(before) != *file.Before {
			return nil, errors.New("workspace changed during upgrade; retry")
		}
	}
	paths := make([]string, 0, len(packages))
	for path := range packages {
		paths = append(paths, path)
	}
	slices.Sort(paths)
	return paths, nil
}

func upgradeCommand(ctx context.Context, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	root, err := projectManagerRoot(ctx, project)
	if err != nil {
		return err
	}
	root, err = canonical(root)
	if err != nil {
		return err
	}
	manager, err := projectPackageManager(ctx, project, nil)
	if err != nil {
		return err
	}
	entry, err := projectWorker(project)
	if err != nil {
		return err
	}
	check, _ := values["check"].(bool)
	noInstall, _ := values["noInstall"].(bool)
	releases := []func(){}
	defer func() {
		for i := len(releases) - 1; i >= 0; i-- {
			releases[i]()
		}
	}()
	if !check {
		release, e := lockProjectOutputs(root)
		if e != nil {
			return e
		}
		releases = append(releases, release)
	}
	data, err := upgradeOperation(ctx, project, root, manager, entry, "upgrade-plan", "")
	if err != nil {
		return err
	}
	packages, err := preflightUpgrade(ctx, root, data)
	if err != nil {
		return err
	}
	if !check {
		for _, path := range packages {
			if path == root {
				continue
			}
			release, e := lockProjectOutputs(path)
			if e != nil {
				return e
			}
			releases = append(releases, release)
		}
	}
	plan := data.Plan
	var text strings.Builder
	fmt.Fprintf(&text, "Xplat %s compatibility set — workspace %s\n", plan.Version, root)
	for _, rows := range [][]string{plan.Updates, plan.Skipped} {
		for _, row := range rows {
			fmt.Fprintf(&text, "  %s\n", row)
		}
	}
	for _, file := range plan.Files {
		rel, _ := filepath.Rel(root, file.Path)
		fmt.Fprintf(&text, "  update %s\n", rel)
	}
	if check {
		if len(plan.Files) > 0 {
			text.WriteString("Alignment needed; no files changed.\n")
		} else {
			text.WriteString("Managed pins and patches are aligned. Installed packages are checked by xplat doctor.\n")
		}
	}
	if err = writeCommandText(ctx, os.Stdout, text.String()); err != nil {
		return err
	}
	if check {
		if len(plan.Files) > 0 {
			return &projectToolExit{1}
		}
		return nil
	}
	// Installation must not write through a workspace-wide node_modules alias.
	if !noInstall {
		info, e := os.Lstat(filepath.Join(root, "node_modules"))
		if e != nil && !os.IsNotExist(e) {
			return e
		}
		if e == nil && (!info.IsDir() || info.Mode()&os.ModeSymlink != 0) {
			return errors.New("upgrade install requires an ordinary workspace node_modules directory")
		}
	}
	mutation := func(err error) error {
		return &workspaceMutationError{Operation: "upgrade", Root: root, Err: err, Hint: "Inspect compatibility files and rerun xplat upgrade or the package manager install before xplat doctor"}
	}
	finish := func(text string) error {
		if err := writeCommandText(ctx, os.Stdout, text); err != nil {
			return mutation(err)
		}
		return nil
	}
	applied, err := upgradeOperation(ctx, project, root, manager, entry, "upgrade-apply", data.Digest)
	if err != nil {
		return mutation(err)
	}
	if applied.Digest != data.Digest || applied.Written == nil || *applied.Written != len(plan.Files) {
		return mutation(errors.New("incomplete upgrade application report"))
	}
	if noInstall {
		return finish(fmt.Sprintf("Compatibility files updated. Run %s install --no-frozen-lockfile, then xplat doctor.\n", manager))
	}
	installed, err := upgradeOperation(ctx, project, root, manager, entry, "upgrade-install", "")
	if err != nil {
		return mutation(err)
	}
	if installed.ExitCode == nil || *installed.ExitCode != 0 {
		return mutation(fmt.Errorf("compatibility files updated, but %s install failed; rerun %s install --no-frozen-lockfile", manager, manager))
	}
	// Installation can replace the CLI package; resolve its current worker again.
	entry, err = projectWorker(project)
	if err != nil {
		return mutation(err)
	}
	verified, err := upgradeOperation(ctx, project, root, manager, entry, "upgrade-verify", "")
	if err != nil {
		return mutation(err)
	}
	if verified.Issues == nil || len(verified.Issues) > 20000 {
		return mutation(errors.New("invalid upgrade verification report"))
	}
	if len(verified.Issues) > 0 {
		return mutation(fmt.Errorf("install completed with compatibility issues:\n%s", strings.Join(verified.Issues, "\n")))
	}
	return finish("Installed and checked the compatibility set. Run your app tests before shipping.\n")
}
