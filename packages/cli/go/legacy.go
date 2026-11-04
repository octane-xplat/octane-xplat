package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
)

type legacyHandler func(context.Context, map[string]any) error

func legacyCommands() []commandDescriptor {
	var catalog struct{ Orchestration []commandDescriptor }
	_ = json.Unmarshal(metadata.Catalog, &catalog)
	return catalog.Orchestration
}

func runLegacyCLI(ctx context.Context, command commandDescriptor, argv []string) int {
	var descriptor *commandDescriptor
	for i := range metadata.Orchestration {
		if metadata.Orchestration[i].Name == command.Name {
			descriptor = &metadata.Orchestration[i]
			break
		}
	}
	handler := nativeLegacyCommands[command.Name]
	if descriptor == nil || handler == nil {
		fmt.Fprintf(os.Stderr, "xplat %s: the parallel Go implementation is pending.\n", command.Name)
		return 1
	}
	if legacySchemaRequested(argv) {
		schema := map[string]any{
			"contractVersion": 1, "command": command.Name, "summary": command.Summary,
			"status": "implemented", "output": "human",
			"input": map[string]any{"flags": descriptor.Flags, "positionals": descriptor.Positionals},
		}
		if command.Name == "build" {
			schema["engines"] = buildEngineContracts()
		}
		return writeEnvelope(command.Name, nil, schema, nil)
	}
	failureExit := 1
	if command.Name == "fmt" || command.Name == "lint" {
		failureExit = 2
	}
	parsed := parseCommand(*descriptor, argv)
	if command.Name == "lint" {
		parsed = parsedCommand{Values: map[string]any{"argv": argv}, Help: lintHelpRequested(argv)}
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
	var toolExit *projectToolExit
	if errors.As(err, &toolExit) {
		return toolExit.Code
	}
	if errors.Is(err, errFormatDifferences) {
		return 1
	}
	if errors.Is(err, errFormatDiagnostics) {
		return 2
	}
	var cleanup *processCleanupError
	var publication *artifactPublicationError
	var clean *cleanFailure
	if !errors.Is(err, context.Canceled) || errors.As(err, &cleanup) || errors.As(err, &publication) || errors.As(err, &clean) {
		fmt.Fprintf(os.Stderr, "xplat %s: %v\n", command.Name, err)
	}
	if requiresFailureEvidence(err) {
		return failureExit
	}
	if errors.Is(err, context.Canceled) {
		return legacyCancellationExit(ctx)
	}
	return failureExit
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
