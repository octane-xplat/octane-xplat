package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/docs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/model"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"
)

func probeMain() {
	if len(os.Args) > 1 && os.Args[1] == "_compute" {
		os.Exit(docs.ComputeChild(os.Args[2:]))
	}
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		proc.ChildGate(os.Args[2:])
		return
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	value, err := dispatch(ctx, os.Args[1:])
	status := 0
	if err != nil {
		value = map[string]any{"ok": false, "error": err.Error()}
		status = 1
	}
	if value != nil {
		if e := json.NewEncoder(os.Stdout).Encode(value); e != nil {
			status = 1
		}
	}
	os.Exit(status)
}

func dispatch(ctx context.Context, argv []string) (any, error) {
	if len(argv) == 0 || argv[0] == "--help" {
		return map[string]any{"experimental": "Go CLI feasibility probe", "commands": []string{"catalog", "schema", "discover", "locks", "http", "exec", "worker", "host-start", "host", "rpc", "tokenize", "embed"}}, nil
	}
	command := argv[0]
	f := flag.NewFlagSet(command, flag.ContinueOnError)
	projectRoot := f.String("project", ".", "selected project")
	directory := f.String("directory", "", "owned private owner directory")
	request := f.String("request", "", "JSON input path")
	operation := f.String("operation", "route-plan", "project worker operation")
	method := f.String("method", "host.ping", "owner RPC method")
	timeout := f.Duration("timeout", 30*time.Second, "operation deadline")
	if err := f.Parse(argv[1:]); err != nil {
		return nil, err
	}
	if *timeout <= 0 || *timeout > 10*time.Minute {
		return nil, errors.New("timeout must be positive and at most ten minutes")
	}
	ctx, cancel := context.WithTimeout(ctx, *timeout)
	defer cancel()
	root, err := filepath.Abs(*projectRoot)
	if err != nil {
		return nil, err
	}
	switch command {
	case "doc-snapshot":
		var input docs.SnapshotRequest
		if err = osfs.ReadJSON(*request, &input); err != nil {
			return nil, err
		}
		return docs.SnapshotOperation(ctx, input)
	case "doc-data":
		var input struct {
			Operation, Root, App, Path, Content, Corpus, Ref string
			Values                                           map[string]any
		}
		if err = osfs.ReadJSON(*request, &input); err != nil {
			return nil, err
		}
		switch input.Operation {
		case "identity":
			if input.App == "" {
				input.App = input.Root
			}
			return docs.ResolveDocsInstallation(ctx, input.Root, input.App)
		case "list":
			documents, err := docs.ListDocuments(ctx, input.Root)
			if err != nil {
				return nil, err
			}
			result := []any{}
			for _, doc := range documents {
				result = append(result, map[string]any{"path": doc.Path, "corpus": doc.Corpus})
			}
			return result, nil
		case "page":
			page, reason := docs.DocPage(input.Root, input.Path, input.Values)
			if reason != "" {
				return map[string]any{"error": reason}, nil
			}
			return page, nil
		case "chunks":
			return docs.MarkdownChunks(docs.DocFile{Path: input.Path, Corpus: input.Corpus, Content: input.Content})
		case "ref":
			name, version, path, valid := docs.ParseDocReference(input.Ref)
			if !valid {
				return json.RawMessage("null"), nil
			}
			return map[string]string{"package": name, "version": version, "path": path}, nil
		}
		return nil, errors.New("unknown document-data probe operation")
	case "package-manager":
		var input struct {
			Operation string  `json:"operation"`
			Directory string  `json:"directory"`
			Root      string  `json:"root"`
			Manager   *string `json:"manager"`
			Name      string  `json:"name"`
		}
		if err = osfs.ReadJSON(*request, &input); err != nil {
			return nil, err
		}
		switch input.Operation {
		case "workspace":
			return project.Workspace(input.Directory, input.Manager)
		case "root":
			return project.ManagerRoot(ctx, input.Directory)
		case "manager":
			return project.PackageManager(ctx, input.Directory, input.Manager)
		case "bun":
			return project.BunLock(input.Directory)
		case "versions":
			versions, _, err := project.BunImporterVersions(ctx, input.Directory)
			return versions, err
		case "installed":
			value := project.InstalledRoot(input.Directory, input.Name)
			if value == "" {
				return nil, nil
			}
			return value, nil
		case "binding":
			return project.ResolveFrameworkBinding(ctx, input.Root, input.Directory)
		default:
			return nil, errors.New("unknown package-manager probe operation")
		}
	case "parse":
		var requests []struct {
			Command cli.CommandDescriptor `json:"command"`
			Argv    []string              `json:"argv"`
		}
		if err = osfs.ReadJSON(*request, &requests); err != nil {
			return nil, err
		}
		replies := []any{}
		for _, input := range requests {
			parsed := cli.ParseCommand(input.Command, input.Argv)
			if len(parsed.Errors) > 0 {
				replies = append(replies, map[string]any{"errors": parsed.Errors})
			} else {
				replies = append(replies, map[string]any{"values": parsed.Values, "help": parsed.Help})
			}
		}
		return replies, nil
	case "workspace-context":
		values := map[string]any{}
		if err = osfs.ReadJSON(*request, &values); err != nil {
			return nil, err
		}
		workspace, err := project.NewWorkspaceContext(values)
		if err != nil {
			return nil, err
		}
		return map[string]any{"discovery": workspace.Discovery, "selection": workspace.Selection(), "context": workspace.EnvelopeContext("status", values)}, nil
	case "catalog":
		return cli.Metadata.Catalog, nil
	case "schema":
		if len(f.Args()) != 1 {
			return nil, errors.New("schema requires a command name")
		}
		value, ok := cli.Metadata.Schemas[f.Args()[0]]
		if !ok {
			return nil, errors.New("unknown command")
		}
		return value, nil
	case "discover":
		return project.Discover(root)
	case "locks":
		return project.LockReport(root)
	case "http":
		var input httpRequest
		if err = osfs.ReadJSON(*request, &input); err != nil {
			return nil, err
		}
		return fetchHTTP(ctx, input)
	case "exec":
		if len(f.Args()) == 0 {
			return nil, errors.New("exec requires explicit argv after --")
		}
		return proc.RunProcess(ctx, f.Args(), root, os.Environ())
	case "worker":
		payload := map[string]any{}
		if *request != "" {
			if err = osfs.ReadJSON(*request, &payload); err != nil {
				return nil, err
			}
		}
		return project.RunWorker(ctx, root, *operation, payload)
	case "host-start":
		return startHost(ctx, *directory, root)
	case "host":
		return nil, serveHost(ctx, *directory, root)
	case "rpc":
		params := map[string]any{}
		if *request != "" {
			if err = osfs.ReadJSON(*request, &params); err != nil {
				return nil, err
			}
		}
		return callHost(ctx, *directory, *method, params)
	case "tokenize", "embed":
		var input model.Request
		if err = osfs.ReadJSON(*request, &input); err != nil {
			return nil, err
		}
		return model.Operation(ctx, command, input)
	default:
		return nil, fmt.Errorf("unsupported prototype command: %s", command)
	}
}
