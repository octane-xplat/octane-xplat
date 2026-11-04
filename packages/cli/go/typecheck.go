package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"time"
)

func init() { nativeLegacyCommands["typecheck"] = typecheckCommand }

var typecheckConfigNames = []string{"tsconfig.json", "tsconfig.native.json", "tsconfig.envs.json"}

type typecheckConfig struct{ Hash, Target string }

func typecheckInputs(ctx context.Context, project string) (map[string]typecheckConfig, error) {
	result := map[string]typecheckConfig{}
	for _, name := range typecheckConfigNames {
		path := filepath.Join(project, name)
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
		target, err := canonical(path)
		if err != nil {
			return nil, err
		}
		hash, opened, err := artifactHash(ctx, target)
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

func expectedTypecheckPrograms(project string, inputs map[string]typecheckConfig) []string {
	configs := []string{}
	if _, ok := inputs["tsconfig.json"]; ok {
		configs = append(configs, filepath.Join(project, "tsconfig.json"))
	}
	if _, ok := inputs["tsconfig.envs.json"]; ok {
		configs = append(configs, filepath.Join(project, "node_modules", ".cache", "xplat-typecheck", "all.json"))
	} else if _, ok := inputs["tsconfig.native.json"]; ok {
		configs = append(configs, filepath.Join(project, "tsconfig.native.json"))
	}
	return configs
}

func validateTypecheckPrograms(data json.RawMessage, project string, inputs map[string]typecheckConfig) ([]string, error) {
	var plan struct {
		Version int
		Configs []string
	}
	if json.Unmarshal(data, &plan) != nil || plan.Version != 1 || plan.Configs == nil || !slices.Equal(plan.Configs, expectedTypecheckPrograms(project, inputs)) {
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

func typecheckCommand(ctx context.Context, _ map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	location, err := locateRoutes(project, routeOptions{}, "")
	if err != nil {
		return err
	}
	prepared, err := prepareRoutes(ctx, location, false)
	routeDiagnostics(prepared.Worker)
	if err != nil {
		return err
	}
	if err = prepared.publish(ctx); err != nil {
		return err
	}
	inputs, err := typecheckInputs(ctx, project)
	if err != nil {
		return err
	}
	if len(inputs) == 0 {
		fmt.Println("Typecheck clean")
		return nil
	}
	workerCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	result, err := runWorker(workerCtx, project, "typecheck-config", nil)
	cancel()
	routeDiagnostics(result)
	if err != nil {
		return err
	}
	configs, err := validateTypecheckPrograms(result.Data, project, inputs)
	if err != nil {
		return err
	}
	current, err := typecheckInputs(ctx, project)
	if err != nil {
		return err
	}
	if !sameTypecheckInputs(inputs, current) {
		return errors.New("typecheck configuration changed during preparation; retry")
	}
	checker, err := installedTool(project, "@tsrx/typescript-plugin", "tsrx-tsc")
	if err != nil {
		return err
	}
	node, err := exec.LookPath("node")
	if err != nil {
		return errors.New("Node is required for the project's TSRX checker")
	}
	for _, config := range configs {
		if err = ctx.Err(); err != nil {
			return err
		}
		fmt.Printf("Typechecking %s\n", config)
		process, err := runProcessIO(ctx, []string{node, checker, "--noEmit", "-p", config}, project, projectToolEnvironment(), os.Stdout, os.Stderr)
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
