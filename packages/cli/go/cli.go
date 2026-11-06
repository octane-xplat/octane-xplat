package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/build"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/code"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/add"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/clean"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/doctor"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/fonts"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/format"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/lint"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/patches"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/status"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/typecheck"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/updates"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/upgrade"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/commands/workshop"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/dev"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/docs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/model"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/routes"
	"os"
	"slices"
	"strings"
)

type commandHandler func(context.Context, *project.WorkspaceContext, map[string]any) (any, *cli.Error)

var commandHandlers map[string]commandHandler
var NativeLegacyCommands map[string]legacyHandler

func init() {
	commandHandlers = map[string]commandHandler{
		"catalog": func(context.Context, *project.WorkspaceContext, map[string]any) (any, *cli.Error) {
			return nativeCatalog(), nil
		},
		"permissions": func(_ context.Context, _ *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
			return cli.PermissionsCommand(values), nil
		},
		"app select": func(_ context.Context, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
			return workspace.SelectApp(cli.StringValue(values["selector"]))
		},
		"code read":   code.ReadCodeCommand,
		"code search": code.SearchCodeCommand,
		"docs read":   docs.Command("docs-read"),
		"docs search": docs.Command("docs-search"),

		"guidance":     docs.GuidanceCommand,
		"diagnostics":  dev.DiagnosticsCommand,
		"status":       status.Command,
		"capabilities": status.CapabilitiesCommand,

		"interact":       dev.AppCommand("interact"),
		"inspect":        dev.AppCommand("inspect"),
		"targets":        dev.AppCommand("targets"),
		"session list":   dev.AppCommand("session list"),
		"session status": dev.AppCommand("session status"),
		"session attach": dev.AppCommand("session attach"),
		"actions list":   dev.AppCommand("actions list"),
		"actions invoke": dev.AppCommand("actions invoke"),
		"actions status": dev.AppCommand("actions status"),

		"evidence list":   dev.EvidenceCommand("evidence list"),
		"evidence retain": dev.EvidenceCommand("evidence retain"),
		"evidence delete": dev.EvidenceCommand("evidence delete"),
	}

	if model.NativeIndexSupported() {
		commandHandlers["docs index"] = docs.Command("docs-index")
	}

	NativeLegacyCommands = map[string]legacyHandler{
		"add":          add.Command,
		"clean":        clean.Command,
		"doctor":       doctor.Command,
		"fmt":          format.Command,
		"fonts add":    fonts.Command,
		"lint":         lint.Command,
		"typecheck":    typecheck.Command,
		"updates init": updates.Command,
		"upgrade":      upgrade.Command,
		"dev":          dev.Command,
		"build":        build.Command,
		"routes":       routes.Command,
		"patches check": func(ctx context.Context, values map[string]any) error {
			return patches.Command(ctx, values, false)
		},
		"patches apply": func(ctx context.Context, values map[string]any) error {
			return patches.Command(ctx, values, true)
		},
		"workshop init":   workshop.InitCommand,
		"workshop dev":    workshop.DevCommand,
		"workshop list":   workshop.InspectionCommand("list"),
		"workshop doctor": workshop.InspectionCommand("doctor"),
	}
}

func writeEnvelope(command string, context map[string]any, data any, failure *cli.Error) int {
	if context == nil {
		context = map[string]any{"command": command, "projectId": nil}
	}
	envelope := map[string]any{"contractVersion": 1, "requestId": cli.RequestUUID(), "context": context, "ok": failure == nil}
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
		return cli.ErrorExit(failure)
	}
	return 0
}
func finishCLI(command string, context map[string]any, data any, failure *cli.Error, jsonOutput bool) int {
	if jsonOutput {
		return writeEnvelope(command, context, data, failure)
	}
	if failure != nil {
		fmt.Fprintf(os.Stderr, "xplat %s: %s: %s\n", command, failure.Code, failure.Message)
		switch recovery := failure.Recovery.(type) {
		case map[string]string:
			fmt.Fprintln(os.Stderr, recovery["action"])
		case map[string]any:
			fmt.Fprintln(os.Stderr, cli.StringValue(recovery["action"]))
		}
		return cli.ErrorExit(failure)
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
	_ = json.Unmarshal(cli.Metadata.Schemas[command], &schema)
	schema["status"] = "pending"
	if commandHandlers[command] != nil {
		schema["status"] = "implemented"
	}
	return schema
}
func nativeCatalog() map[string]any {
	var catalog map[string]any
	_ = json.Unmarshal(cli.Metadata.Catalog, &catalog)
	cli.Object(catalog["cli"])["version"] = cli.Metadata.Version
	for _, entry := range catalog["commands"].([]any) {
		command := cli.Object(entry)
		command["status"] = "pending"
		if commandHandlers[cli.StringValue(command["command"])] != nil {
			command["status"] = "implemented"
		}
	}
	for _, entry := range catalog["orchestration"].([]any) {
		command := cli.Object(entry)
		command["status"] = "pending"
		if legacyImplemented(cli.StringValue(command["name"])) {
			command["status"] = "implemented"
		}
		if cli.StringValue(command["name"]) == "build" {
			command["engines"] = build.EngineContracts()
		}
	}
	return catalog
}
func commandHelp(command cli.CommandDescriptor) string {
	var out strings.Builder
	fmt.Fprintf(&out, "xplat %s — %s\n\nUsage: xplat %s", command.Name, command.Summary, command.Name)
	for _, pos := range command.Positionals {
		if pos.Variadic {
			pos.Name += "..."
		}
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
	if command.Name == "build" {
		out.WriteString("\nEngines: project Vite, NativeScript, and selected macOS/Linux packaging workers.\nLinux packaging requires a POSIX build host. Node must be installed.\n")
	}
	return out.String()
}
func runCLI(argv []string) int {
	ctx, stop := proc.CliSignalContext(context.Background())
	defer stop()
	if len(argv) == 0 || slices.Equal(argv, []string{"--help"}) || slices.Equal(argv, []string{"-h"}) {
		fmt.Printf("xplat — parallel Go CLI %s\n\n", cli.Metadata.Version)
		for _, command := range cli.Metadata.Descriptors {
			status := "pending"
			if commandHandlers[command.Name] != nil {
				status = "implemented"
			}
			fmt.Printf("  %-20s %s [%s]\n", command.Name, command.Summary, status)
		}
		fmt.Println("\nProject commands:")
		for _, command := range legacyCommands() {
			status := "pending"
			if legacyImplemented(command.Name) {
				status = "implemented"
			}
			fmt.Printf("  %-20s %s [%s]\n", command.Name, command.Summary, status)
		}
		fmt.Println("\nUse `xplat catalog --json` for contracts and migration coverage.")
		return 0
	}
	if slices.Equal(argv, []string{"--version"}) {
		fmt.Println(cli.Metadata.Version)
		return 0
	}
	jsonOutput := slices.Contains(argv, "--json")
	head := argv[0]
	for _, command := range legacyCommands() {
		if command.Name == head {
			return runLegacyCLI(proc.ForegroundCommandContext(ctx, os.Stdin), command, argv[1:])
		}
	}
	members := []cli.CommandDescriptor{}
	for _, command := range cli.Metadata.Descriptors {
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
				return finishCLI(head, nil, nil, cli.Invalid("`xplat "+head+"` needs a subcommand.", "Commands: "+strings.Join(names, ", ")+"."), true)
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
	var descriptor *cli.CommandDescriptor
	for at := range cli.Metadata.Descriptors {
		if cli.Metadata.Descriptors[at].Name == name {
			descriptor = &cli.Metadata.Descriptors[at]
			break
		}
	}
	if descriptor == nil {
		return finishCLI(name, nil, nil, cli.Invalid("Unknown command `xplat "+name+"`.", "Run `xplat catalog --json` for the machine-readable command list, or `xplat "+head+" --help`."), jsonOutput)
	}
	args := argv[count:]
	if slices.Contains(args, "--schema") {
		return writeEnvelope(name, nil, nativeSchema(name), nil)
	}
	parsed := cli.ParseCommand(*descriptor, args)
	if len(parsed.Errors) > 0 {
		return finishCLI(name, nil, nil, parsed.Errors[0], jsonOutput)
	}
	if parsed.Help {
		fmt.Print(commandHelp(*descriptor))
		return 0
	}
	var workspace *project.WorkspaceContext
	var err error
	if descriptor.Context != "none" {
		workspace, err = project.NewWorkspaceContext(parsed.Values)
		if err != nil {
			return finishCLI(name, nil, nil, &cli.Error{Code: "execution_failure", Message: "Workspace discovery failed: " + err.Error()}, jsonOutput)
		}
	}
	var data any
	var failure *cli.Error
	if handler := commandHandlers[name]; handler != nil {
		data, failure = handler(ctx, workspace, parsed.Values)
	} else {
		data, failure = executeCommand(ctx, name, workspace, parsed.Values)
	}
	var envelopeContext map[string]any
	if workspace != nil {
		envelopeContext = workspace.EnvelopeContext(name, parsed.Values)
	}
	failure = cli.ContextualFailure(ctx, failure)
	return finishCLI(name, envelopeContext, data, failure, jsonOutput)
}
func executeCommand(ctx context.Context, name string, workspace *project.WorkspaceContext, values map[string]any) (any, *cli.Error) {
	return nil, &cli.Error{Code: "unavailable", Message: "The Go implementation of " + name + " is pending; the retained Nim/TypeScript implementations remain available separately."}
}
