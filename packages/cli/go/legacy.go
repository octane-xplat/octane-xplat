package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/artifact"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/build"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/clean"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/format"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/lint"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"strings"
	"time"
)

type legacyHandler func(context.Context, map[string]any) error

func legacyCommands() []cli.CommandDescriptor {
	var catalog struct{ Orchestration []cli.CommandDescriptor }
	_ = json.Unmarshal(cli.Metadata.Catalog, &catalog)
	return catalog.Orchestration
}

func runLegacyCLI(ctx context.Context, command cli.CommandDescriptor, argv []string) int {
	if members := legacyGroupMembers(command.Name); len(members) > 0 {
		return runLegacyGroup(ctx, command, members, argv)
	}
	var descriptor *cli.CommandDescriptor
	for i := range cli.Metadata.Orchestration {
		if cli.Metadata.Orchestration[i].Name == command.Name {
			descriptor = &cli.Metadata.Orchestration[i]
			break
		}
	}
	handler := NativeLegacyCommands[command.Name]
	if descriptor == nil || handler == nil {
		fmt.Fprintf(os.Stderr, "xplat %s: the parallel Go implementation is pending.\n", command.Name)
		return 1
	}
	if legacySchemaRequested(argv) {
		return writeEnvelope(command.Name, nil, legacySchema(*descriptor), nil)
	}
	failureExit := 1
	if command.Name == "fmt" || command.Name == "lint" {
		failureExit = 2
	}
	parsed := cli.ParseCommand(*descriptor, argv)
	if command.Name == "lint" {
		parsed = cli.ParsedCommand{Values: map[string]any{"argv": argv}, Help: lint.HelpRequested(argv)}
	}
	if len(parsed.Errors) > 0 {
		fmt.Fprintln(os.Stderr, parsed.Errors[0].Message)
		fmt.Fprintf(os.Stderr, "Run xplat %s --help for usage.\n", command.Name)
		return failureExit
	}
	if parsed.Help {
		fmt.Print(commandHelp(*descriptor))
		return 0
	}
	err := handler(ctx, parsed.Values)
	if err == nil {
		err = ctx.Err()
	}
	if err == nil {
		return 0
	}
	var toolExit *project.ToolExit
	if errors.As(err, &toolExit) {
		return toolExit.Code
	}
	if errors.Is(err, format.ErrFormatDifferences) {
		return 1
	}
	if errors.Is(err, format.ErrFormatDiagnostics) {
		return 2
	}
	var cleanup *proc.CleanupError
	var publication *artifact.PublicationError
	var clean *clean.Failure
	var mutation *project.WorkspaceMutationError
	if !errors.Is(err, context.Canceled) || errors.As(err, &cleanup) || errors.As(err, &publication) || errors.As(err, &clean) || errors.As(err, &mutation) {
		outputContext := ctx
		if ctx.Err() != nil || errors.Is(err, context.DeadlineExceeded) {
			var cancel context.CancelFunc
			outputContext, cancel = context.WithTimeout(context.WithoutCancel(ctx), 250*time.Millisecond)
			defer cancel()
		}
		_ = proc.WriteCommandText(outputContext, os.Stderr, fmt.Sprintf("xplat %s: %v\n", command.Name, err))
	}
	if cli.RequiresFailureEvidence(err) {
		return failureExit
	}
	if errors.Is(err, context.Canceled) {
		return proc.LegacyCancellationExit(ctx)
	}
	return failureExit
}

func legacyGroupMembers(name string) []cli.CommandDescriptor {
	members := []cli.CommandDescriptor{}
	for _, descriptor := range cli.Metadata.Orchestration {
		if len(descriptor.Path) == 2 && descriptor.Path[0] == name {
			members = append(members, descriptor)
		}
	}
	return members
}

func legacyImplemented(name string) bool {
	if NativeLegacyCommands[name] != nil {
		return true
	}
	members := legacyGroupMembers(name)
	for _, member := range members {
		if NativeLegacyCommands[member.Name] == nil {
			return false
		}
	}
	return len(members) > 0
}

func legacySchema(command cli.CommandDescriptor) map[string]any {
	status := "pending"
	if legacyImplemented(command.Name) {
		status = "implemented"
	}
	schema := map[string]any{
		"contractVersion": 1, "command": command.Name, "summary": command.Summary,
		"status": status, "output": "human",
		"input": map[string]any{"flags": command.Flags, "positionals": command.Positionals},
	}
	if command.Name == "workshop dev" {
		schema["startup"] = map[string]any{"deadlineSeconds": 300, "evidence": map[string]string{"web": "HTTP listener", "macos": "native host spawn", "linux": "native host spawn", "ios": "NativeScript tool spawn", "android": "NativeScript tool spawn", "windows": "launch blocked by project preflight"}, "appReadiness": "not inferred from engine startup"}
	}
	if command.Name == "build" {
		schema["engines"] = build.EngineContracts()
	}
	return schema
}

func runLegacyGroup(ctx context.Context, command cli.CommandDescriptor, members []cli.CommandDescriptor, argv []string) int {
	if len(argv) == 1 && argv[0] == "--schema" {
		schemas := []any{}
		for _, member := range members {
			schemas = append(schemas, legacySchema(member))
		}
		return writeEnvelope(command.Name, nil, map[string]any{"commands": schemas}, nil)
	}
	if len(argv) == 0 || (len(argv) == 1 && (argv[0] == "--help" || argv[0] == "-h")) {
		fmt.Printf("xplat %s — %s\n\nCommands:\n", command.Name, command.Summary)
		for _, member := range members {
			fmt.Printf("  %-16s %s\n", member.Path[1], member.Summary)
		}
		if len(argv) == 0 {
			return 1
		}
		return 0
	}
	for _, member := range members {
		if argv[0] == member.Path[1] {
			return runLegacyCLI(ctx, member, argv[1:])
		}
	}
	names := []string{}
	for _, member := range members {
		names = append(names, member.Path[1])
	}
	fmt.Fprintf(os.Stderr, "Unknown xplat %s subcommand %q. Choose %s.\n", command.Name, argv[0], strings.Join(names, ", "))
	return 1
}

func legacySchemaRequested(argv []string) bool {
	for _, arg := range argv {
		if arg == "--" {
			return false
		}
		if arg == "--schema" {
			return true
		}
	}
	return false
}
