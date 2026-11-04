package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

var errFormatDifferences = errors.New("format differences")
var errFormatDiagnostics = errors.New("format diagnostics")

func init() { nativeLegacyCommands["fmt"] = formatCommand }

type formatInput struct {
	Path      string
	Directory bool
}
type formatFile struct {
	File         *string
	SourceSHA256 *string
	Mode         *uint32
	Code         *string
	Changed      *bool
}
type formatPlan struct {
	Version     int
	Kind        string
	Diagnostics []string
	Files       []formatFile
	Code        *string
	Changed     *bool
}
type formatArtifact struct {
	Scope    artifactScope
	Artifact plannedArtifact
}

// Explicit input paths authorize their physical file/directory; the planner
// owns inventory/ignore semantics. A plan cannot broaden those write scopes.
func formatInputs(project string, inputs []string) ([]formatInput, error) {
	if len(inputs) == 0 {
		return []formatInput{{project, true}}, nil
	}
	result := []formatInput{}
	for _, input := range inputs {
		path := input
		if !filepath.IsAbs(path) {
			path = filepath.Join(project, path)
		}
		info, err := os.Lstat(path)
		if err != nil {
			return nil, err
		}
		if info.Mode()&os.ModeSymlink != 0 {
			return nil, fmt.Errorf("not following symlink: %s", input)
		}
		if !info.IsDir() && !info.Mode().IsRegular() {
			return nil, fmt.Errorf("format input must be a file or directory: %s", input)
		}
		target, err := canonical(path)
		if err != nil {
			return nil, err
		}
		result = append(result, formatInput{target, info.IsDir()})
	}
	return result, nil
}

func validateFormatPlan(ctx context.Context, project string, inputs []formatInput, stdin bool, data json.RawMessage) (formatPlan, []formatArtifact, error) {
	var plan formatPlan
	fail := func(message string) (formatPlan, []formatArtifact, error) { return plan, nil, errors.New(message) }
	if json.Unmarshal(data, &plan) != nil || plan.Version != 1 || plan.Diagnostics == nil || plan.Files == nil {
		return fail("invalid format plan; update the project's @octane-xplat/cli")
	}
	if len(plan.Files) > 10000 {
		return fail("format plan exceeds 10000 files")
	}
	expected := "files"
	if stdin {
		expected = "stdin"
	}
	if plan.Kind != expected {
		return fail("format plan kind does not match the request")
	}
	if len(plan.Diagnostics) > 0 {
		if len(plan.Files) > 0 || plan.Code != nil || plan.Changed != nil {
			return fail("format errors cannot include successful output")
		}
		return plan, nil, nil
	}
	if stdin {
		if len(plan.Files) != 0 || plan.Code == nil || plan.Changed == nil || len(*plan.Code) > maxArtifactBytes {
			return fail("invalid formatted stdin response")
		}
		return plan, nil, nil
	}
	if plan.Code != nil || plan.Changed != nil {
		return fail("file format plan cannot include stdin output")
	}
	artifacts := []formatArtifact{}
	seen := map[string]bool{}
	total := 0
	for _, entry := range plan.Files {
		if entry.File == nil || entry.Code == nil || entry.Mode == nil || entry.Changed == nil || entry.SourceSHA256 == nil {
			return fail("format entry is missing required fields")
		}
		file := *entry.File
		if !filepath.IsAbs(file) || filepath.Clean(file) != file || strings.ContainsRune(file, 0) {
			return fail("format target must be a clean absolute path")
		}
		info, err := os.Lstat(file)
		if err != nil {
			return plan, nil, err
		}
		if !info.Mode().IsRegular() {
			return fail("format target must be a regular file, not a symlink")
		}
		target, err := canonical(file)
		if err != nil {
			return plan, nil, err
		}
		authorized := false
		for _, input := range inputs {
			if input.Directory && inside(input.Path, target) || !input.Directory && input.Path == target {
				authorized = true
				break
			}
		}
		if !authorized {
			return fail("format target is outside the selected inputs")
		}
		if seen[target] {
			return fail("duplicate format target")
		}
		seen[target] = true
		scope, err := outputScope(project, filepath.Dir(target))
		if err != nil {
			return plan, nil, err
		}
		before, err := snapshotArtifact(ctx, scope, file)
		if err != nil {
			return plan, nil, err
		}
		if before.Hash != *entry.SourceSHA256 || uint32(before.Info.Mode().Perm()) != *entry.Mode&0777 {
			return fail("format source changed since it was read; left untouched")
		}
		total += len(*entry.Code)
		if len(*entry.Code) > maxArtifactBytes || total > maxArtifactPlanBytes {
			return fail("formatted output exceeds bounded plan size")
		}
		// Even unchanged files are retained in the complete stale-input check.
		artifacts = append(artifacts, formatArtifact{scope, plannedArtifact{file, *entry.Code, before}})
	}
	return plan, artifacts, nil
}

func formatCommand(ctx context.Context, values map[string]any) error {
	inputs, _ := values["paths"].([]string)
	check, _ := values["check"].(bool)
	stdinPath := optionalString(values, "stdinFilepath")
	if stdinPath != nil && len(inputs) > 0 {
		return errors.New("--stdin-filepath cannot be combined with paths")
	}
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	var scopes []formatInput
	var stdin any
	if stdinPath != nil {
		// This is a one-shot human CLI, never a persistent service reader.
		// Cancellation returns through the root signal exit, which closes stdin.
		bytes, readErr := readFormatStdin(ctx, os.Stdin)
		if readErr != nil {
			return readErr
		}
		stdin = map[string]string{"path": *stdinPath, "source": string(bytes)}
	} else {
		scopes, err = formatInputs(project, inputs)
		if err != nil {
			return err
		}
	}
	if inputs == nil {
		inputs = []string{}
	}
	result, err := runWorker(ctx, project, "fmt-plan", map[string]any{"inputs": inputs, "stdin": stdin})
	routeDiagnostics(result)
	if err != nil {
		return err
	}
	plan, artifacts, err := validateFormatPlan(ctx, project, scopes, stdinPath != nil, result.Data)
	if err != nil {
		return err
	}
	for _, diagnostic := range plan.Diagnostics {
		fmt.Fprintln(os.Stderr, diagnostic)
	}
	if len(plan.Diagnostics) > 0 {
		return errFormatDiagnostics
	}
	if stdinPath != nil {
		if check {
			if *plan.Changed {
				return errFormatDifferences
			}
			return nil
		}
		if err = ctx.Err(); err != nil {
			return err
		}
		return writeFormatStdout(ctx, os.Stdout, *plan.Code)
	}
	changed := 0
	for _, file := range plan.Files {
		if *file.Changed {
			changed++
			if check {
				relative, _ := filepath.Rel(project, *file.File)
				fmt.Fprintf(os.Stderr, "%s: would reformat\n", relative)
			}
		}
	}
	if check {
		if changed > 0 {
			return errFormatDifferences
		}
		return nil
	}
	revalidate := func() error {
		for _, entry := range artifacts {
			if err := unchangedArtifact(ctx, entry.Scope, entry.Artifact.Before); err != nil {
				return err
			}
		}
		return nil
	}
	if err = revalidate(); err != nil {
		return err
	}
	published := []string{}
	for i, entry := range artifacts {
		if !*plan.Files[i].Changed {
			continue
		}
		// All plans/sources are validated before the first write. Individual
		// adjacent rename is atomic; writes across directories are not a transaction.
		err = publishArtifacts(ctx, entry.Scope, []plannedArtifact{entry.Artifact}, func() error { return nil })
		if err != nil {
			var partial *artifactPublicationError
			if errors.As(err, &partial) {
				return &artifactPublicationError{Published: append(published, partial.Published...), Retained: partial.Retained, Err: partial.Err}
			}
			if len(published) > 0 {
				return &artifactPublicationError{Published: published, Err: err}
			}
			return err
		}
		published = append(published, entry.Artifact.File)
	}
	if len(published) > 0 {
		fmt.Fprintf(os.Stderr, "fmt: wrote %d file(s)\n", len(published))
	}
	return nil
}

// Only the one-shot fmt entry consumes process stdin. A blocked terminal read
// cannot hold root cancellation open; the CLI exits immediately after returning.
func readFormatStdin(ctx context.Context, input *os.File) ([]byte, error) {
	type result struct {
		bytes []byte
		err   error
	}
	done := make(chan result, 1)
	go func() { data, err := io.ReadAll(io.LimitReader(input, maxArtifactBytes+1)); done <- result{data, err} }()
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case value := <-done:
		if len(value.bytes) > maxArtifactBytes {
			return nil, errors.New("format stdin exceeds 16 MiB")
		}
		return value.bytes, value.err
	}
}

// As with stdin, the lifetime of a blocked OS write ends at the one-shot CLI's
// process exit. Never use this helper inside the persistent host.
func writeFormatStdout(ctx context.Context, output *os.File, code string) error {
	done := make(chan error, 1)
	go func() { _, err := io.WriteString(output, code); done <- err }()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-done:
		return err
	}
}
