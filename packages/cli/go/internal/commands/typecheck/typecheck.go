package typecheck

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/routes"
	"github.com/tailscale/hujson"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"time"
)

var typecheckConfigNames = []string{"tsconfig.json", "tsconfig.native.json", "tsconfig.envs.json"}

type typecheckConfig struct{ Hash, Target string }

func typecheckInputs(ctx context.Context, projectRoot string) (map[string]typecheckConfig, error) {
	result := map[string]typecheckConfig{}
	for _, name := range typecheckConfigNames {
		path := filepath.Join(projectRoot, name)
		// Reject special files before opening one as metadata (notably FIFOs).
		info, err := os.Stat(path)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, err
		}
		if !info.Mode().IsRegular() {
			return nil, fmt.Errorf("typecheck configuration must be a regular file: %s", name)
		}
		target, err := osfs.Canonical(path)
		if err != nil {
			return nil, err
		}
		hash, opened, err := artifact.Hash(ctx, target)
		if err != nil {
			return nil, err
		}
		if opened.Size() > 1<<20 {
			return nil, fmt.Errorf("typecheck configuration exceeds 1 MiB: %s", name)
		}
		result[name] = typecheckConfig{hash, target}
	}
	return result, nil
}

func expectedTypecheckPrograms(projectRoot string, inputs map[string]typecheckConfig) []string {
	configs := []string{}
	if _, ok := inputs["tsconfig.json"]; ok {
		configs = append(configs, filepath.Join(projectRoot, "tsconfig.json"))
	}
	if _, ok := inputs["tsconfig.envs.json"]; ok {
		data, err := osfs.MetadataBytes(filepath.Join(projectRoot, "tsconfig.envs.json"), 1<<20)
		if err != nil {
			return nil
		}
		data, err = hujson.Standardize(data)
		if err != nil {
			return nil
		}
		var manifest struct{ Environments map[string]json.RawMessage }
		if json.Unmarshal(data, &manifest) != nil {
			return nil
		}
		names := map[string]bool{}
		for env := range manifest.Environments {
			switch env {
			case "native":
				names["ios"] = true
				names["android"] = true
			case "web", "ios", "android", "macos", "windows", "gtk":
				names[env] = true
			default:
				return nil
			}
		}
		for _, env := range []string{"web", "ios", "android", "macos", "windows", "gtk"} {
			if names[env] {
				configs = append(configs, filepath.Join(projectRoot, "xplat-typecheck", env+".json"))
			}
		}
	} else {
		if _, ok := inputs["tsconfig.native.json"]; ok {
			configs = append(configs, filepath.Join(projectRoot, "tsconfig.native.json"))
		}
	}
	return configs
}

func validateTypecheckPrograms(data json.RawMessage, projectRoot string, inputs map[string]typecheckConfig) ([]string, error) {
	var plan struct {
		Version int
		Configs []string
	}
	if json.Unmarshal(data, &plan) != nil || plan.Version != 1 || plan.Configs == nil || len(plan.Configs) == 0 || !slices.Equal(plan.Configs, expectedTypecheckPrograms(projectRoot, inputs)) {
		return nil, errors.New("invalid typecheck program plan; update the selected project's @octane-xplat/cli")
	}
	for _, path := range plan.Configs {
		info, err := os.Stat(path)
		if err != nil || !info.Mode().IsRegular() || info.Size() > 16<<20 {
			return nil, fmt.Errorf("typecheck program must be a bounded regular file: %s", path)
		}
	}
	return plan.Configs, nil
}

// Check the compiler's complete graph, not just authored root files. A triple
// slash reference in a dependency bypasses compilerOptions.types.
func validateAmbientFiles(env, listing string) error {
	for _, line := range strings.Split(listing, "\n") {
		file := strings.ReplaceAll(strings.TrimSpace(line), "\\", "/")
		lower := strings.ToLower(file)
		dom := strings.Contains(lower, "/lib.dom.") && strings.HasSuffix(lower, ".d.ts")
		ios := strings.Contains(file, "/@nativescript/types-ios/")
		android := strings.Contains(file, "/@nativescript/types-android/")
		if (env != "web" && dom) || (ios && env != "ios") || (android && env != "android") || strings.HasSuffix(file, "/@nativescript/types/index.d.ts") {
			return fmt.Errorf("typecheck[%s]: transitive ambient leakage from %s; select platform declarations or move the import into its platform leaf", env, line)
		}
	}
	return nil
}

func Command(ctx context.Context, _ map[string]any) error {
	projectRoot, err := os.Getwd()
	if err != nil {
		return err
	}
	projectRoot, err = osfs.Canonical(projectRoot)
	if err != nil {
		return err
	}
	location, err := routes.LocateRoutes(projectRoot, routes.RouteOptions{}, "")
	if err != nil {
		return err
	}
	prepared, err := routes.PrepareRoutes(ctx, location, false)
	routes.RouteDiagnostics(prepared.Worker)
	if err != nil {
		return err
	}
	if err = prepared.Publish(ctx); err != nil {
		return err
	}
	inputs, err := typecheckInputs(ctx, projectRoot)
	if err != nil {
		return err
	}
	if len(inputs) == 0 {
		fmt.Println("Typecheck clean")
		return nil
	}
	workerCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	result, err := project.RunWorker(workerCtx, projectRoot, "typecheck-config", nil)
	cancel()
	routes.RouteDiagnostics(result)
	if err != nil {
		return err
	}
	configs, err := validateTypecheckPrograms(result.Data, projectRoot, inputs)
	if err != nil {
		return err
	}
	current, err := typecheckInputs(ctx, projectRoot)
	if err != nil {
		return err
	}
	if !sameTypecheckInputs(inputs, current) {
		return errors.New("typecheck configuration changed during preparation; retry")
	}
	checker, err := project.InstalledTool(projectRoot, "typescript", "tsc")
	if err != nil {
		return err
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return errors.New("Node is required for the project's TypeScript compiler")
	}
	for _, config := range configs {
		if err = ctx.Err(); err != nil {
			return err
		}
		fmt.Printf("Typechecking %s\n", config)
		if filepath.Dir(config) == filepath.Join(projectRoot, "xplat-typecheck") {
			listing, err := proc.RunProcess(ctx, []string{node, checker, "--noEmit", "--runExternalCode", "--listFilesOnly", "-p", config}, projectRoot, project.ToolEnvironment())
			if err != nil {
				return err
			}
			if listing.Truncated {
				return errors.New("typecheck declaration graph exceeded capture limit")
			}
			if listing.ExitCode != 0 {
				return fmt.Errorf("typecheck declaration discovery failed: %s%s", listing.Stdout, listing.Stderr)
			}
			env := strings.TrimSuffix(filepath.Base(config), ".json")
			if err := validateAmbientFiles(env, listing.Stdout); err != nil {
				return err
			}
		}
		process, err := proc.RunForegroundProcessIO(ctx, []string{node, checker, "--noEmit", "--runExternalCode", "-p", config}, projectRoot, project.ToolEnvironment(), os.Stdout, os.Stderr)
		if err != nil {
			return err
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if process.ExitCode != 0 {
			return fmt.Errorf("Typecheck failed (compiler exit %d)", process.ExitCode)
		}
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	fmt.Println("Typecheck clean")
	return nil
}

func sameTypecheckInputs(a, b map[string]typecheckConfig) bool {
	if len(a) != len(b) {
		return false
	}
	for key, value := range a {
		if other, ok := b[key]; !ok || other != value {
			return false
		}
	}
	return true
}
