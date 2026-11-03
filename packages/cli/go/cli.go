package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/signal"
	"slices"
	"strings"
	"syscall"
)

type commandHandler func(context.Context, *workspaceContext, map[string]any) (any, *cliError)

var commandHandlers = map[string]commandHandler{}
var nativeLegacyCommands = map[string]bool{}

func init() {
	commandHandlers["catalog"] = func(context.Context, *workspaceContext, map[string]any) (any, *cliError) { return nativeCatalog(), nil }
	commandHandlers["permissions"] = func(_ context.Context, _ *workspaceContext, values map[string]any) (any, *cliError) {
		return permissionsCommand(values), nil
	}
	commandHandlers["app select"] = func(_ context.Context, workspace *workspaceContext, values map[string]any) (any, *cliError) {
		return workspace.selectApp(stringValue(values["selector"]))
	}
}

func requestUUID() string {
	raw := identity()
	return "req-" + raw[:8] + "-" + raw[8:12] + "-4" + raw[13:16] + "-a" + raw[17:20] + "-" + raw[20:]
}
func writeEnvelope(command string, context map[string]any, data any, failure *cliError) int {
	if context == nil {
		context = map[string]any{"command": command, "projectId": nil}
	}
	envelope := map[string]any{"contractVersion": 1, "requestId": requestUUID(), "context": context, "ok": failure == nil}
	if failure == nil {
		envelope["data"] = data
	} else {
		envelope["error"] = failure
	}
	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(envelope); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 5
	}
	if failure != nil {
		return errorExit(failure)
	}
	return 0
}
func finishCLI(command string, context map[string]any, data any, failure *cliError, jsonOutput bool) int {
	if jsonOutput {
		return writeEnvelope(command, context, data, failure)
	}
	if failure != nil {
		fmt.Fprintf(os.Stderr, "xplat %s: %s: %s\n", command, failure.Code, failure.Message)
		switch recovery := failure.Recovery.(type) {
		case map[string]string:
			fmt.Fprintln(os.Stderr, recovery["action"])
		case map[string]any:
			fmt.Fprintln(os.Stderr, stringValue(recovery["action"]))
		}
		return errorExit(failure)
	}
	// Structured human rendering grows with each service; the JSON contract is
	// always separately available and never shares stdout with diagnostics.
	bytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 5
	}
	fmt.Println(string(bytes))
	return 0
}
func nativeSchema(command string) map[string]any {
	var schema map[string]any
	_ = json.Unmarshal(metadata.Schemas[command], &schema)
	schema["status"] = "pending"
	if commandHandlers[command] != nil {
		schema["status"] = "implemented"
	}
	return schema
}
func nativeCatalog() map[string]any {
	var catalog map[string]any
	_ = json.Unmarshal(metadata.Catalog, &catalog)
	object(catalog["cli"])["version"] = metadata.Version
	for _, entry := range catalog["commands"].([]any) {
		command := object(entry)
		command["status"] = "pending"
		if commandHandlers[stringValue(command["command"])] != nil {
			command["status"] = "implemented"
		}
	}
	for _, entry := range catalog["orchestration"].([]any) {
		command := object(entry)
		command["status"] = "pending"
		if nativeLegacyCommands[stringValue(command["name"])] {
			command["status"] = "implemented"
		}
	}
	return catalog
}
func commandHelp(command commandDescriptor) string {
	var out strings.Builder
	fmt.Fprintf(&out, "xplat %s — %s\n\nUsage: xplat %s", command.Name, command.Summary, command.Name)
	for _, pos := range command.Positionals {
		if pos.Required {
			fmt.Fprintf(&out, " <%s>", pos.Name)
		} else {
			fmt.Fprintf(&out, " [%s]", pos.Name)
		}
	}
	out.WriteString(" [options]\n\nOptions:\n")
	for _, flag := range command.Flags {
		suffix := " <value>"
		if flag.Type == "boolean" {
			suffix = ""
		} else if flag.Type == "integer" {
			suffix = " <int>"
		} else if flag.Type == "enum" {
			suffix = " <" + strings.Join(flag.Values, "|") + ">"
		}
		fmt.Fprintf(&out, "  --%s%s  %s\n", flag.Flag, suffix, flag.Desc)
	}
	out.WriteString("  --help  Show this help\n")
	if len(command.Examples) > 0 {
		out.WriteString("\nExamples:\n")
		for _, example := range command.Examples {
			fmt.Fprintln(&out, "  "+example)
		}
	}
	fmt.Fprintf(&out, "\nRun `xplat %s --schema` for the machine-readable contract without executing the command.\n", command.Name)
	return out.String()
}
func runCLI(argv []string) int {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if len(argv) == 0 || slices.Equal(argv, []string{"--help"}) || slices.Equal(argv, []string{"-h"}) {
		fmt.Printf("xplat — parallel Go CLI %s\n\n", metadata.Version)
		for _, command := range metadata.Descriptors {
			status := "pending"
			if commandHandlers[command.Name] != nil {
				status = "implemented"
			}
			fmt.Printf("  %-20s %s [%s]\n", command.Name, command.Summary, status)
		}
		fmt.Println("\nUse `xplat catalog --json` for contracts and migration coverage.")
		return 0
	}
	if slices.Equal(argv, []string{"--version"}) {
		fmt.Println(metadata.Version)
		return 0
	}
	jsonOutput := slices.Contains(argv, "--json")
	head := argv[0]
	members := []commandDescriptor{}
	for _, command := range metadata.Descriptors {
		if len(command.Path) > 1 && command.Path[0] == head {
			members = append(members, command)
		}
	}
	name, count := head, 1
	if len(members) > 0 {
		if len(argv) == 1 || argv[1] == "--help" || argv[1] == "-h" {
			if jsonOutput {
				names := []string{}
				for _, member := range members {
					names = append(names, member.Name)
				}
				return finishCLI(head, nil, nil, invalid("`xplat "+head+"` needs a subcommand.", "Commands: "+strings.Join(names, ", ")+"."), true)
			}
			fmt.Printf("xplat %s — command group\n\nCommands:\n", head)
			for _, member := range members {
				fmt.Printf("  %-16s %s\n", member.Name, member.Summary)
			}
			return 0
		}
		if argv[1] == "--schema" {
			schemas := []any{}
			for _, member := range members {
				schemas = append(schemas, nativeSchema(member.Name))
			}
			return writeEnvelope(head, nil, map[string]any{"commands": schemas}, nil)
		}
		name = head + " " + argv[1]
		count = 2
	}
	var descriptor *commandDescriptor
	for at := range metadata.Descriptors {
		if metadata.Descriptors[at].Name == name {
			descriptor = &metadata.Descriptors[at]
			break
		}
	}
	if descriptor == nil {
		return finishCLI(name, nil, nil, invalid("Unknown command `xplat "+name+"`.", "Run `xplat catalog --json` for the machine-readable command list, or `xplat "+head+" --help`."), jsonOutput)
	}
	args := argv[count:]
	if slices.Contains(args, "--schema") {
		return writeEnvelope(name, nil, nativeSchema(name), nil)
	}
	parsed := parseCommand(*descriptor, args)
	if len(parsed.Errors) > 0 {
		return finishCLI(name, nil, nil, parsed.Errors[0], jsonOutput)
	}
	if parsed.Help {
		fmt.Print(commandHelp(*descriptor))
		return 0
	}
	var workspace *workspaceContext
	var err error
	if descriptor.Context != "none" {
		workspace, err = newWorkspaceContext(parsed.Values)
		if err != nil {
			return finishCLI(name, nil, nil, &cliError{Code: "execution_failure", Message: "Workspace discovery failed: " + err.Error()}, jsonOutput)
		}
	}
	var data any
	var failure *cliError
	if handler := commandHandlers[name]; handler != nil {
		data, failure = handler(ctx, workspace, parsed.Values)
	} else {
		data, failure = executeCommand(ctx, name, workspace, parsed.Values)
	}
	var envelopeContext map[string]any
	if workspace != nil {
		envelopeContext = workspace.envelopeContext(name, parsed.Values)
	}
	if ctx.Err() != nil {
		code := "cancelled"
		if errors.Is(ctx.Err(), context.DeadlineExceeded) {
			code = "timeout"
		}
		failure = &cliError{Code: code, Message: ctx.Err().Error()}
	}
	return finishCLI(name, envelopeContext, data, failure, jsonOutput)
}
func executeCommand(ctx context.Context, name string, workspace *workspaceContext, values map[string]any) (any, *cliError) {
	return nil, &cliError{Code: "unavailable", Message: "The Go implementation of " + name + " is pending; the retained Nim/TypeScript implementations remain available separately."}
}
