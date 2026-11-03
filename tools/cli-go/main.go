// A bounded feasibility executable; it is not the production CLI.
package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"
)

func identity() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

func readJSON(path string, target any) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() || info.Size() > 64<<20 {
		return errors.New("JSON input must be a regular file within 64 MiB")
	}
	d := json.NewDecoder(io.LimitReader(f, 64<<20))
	if err = d.Decode(target); err != nil {
		return err
	}
	var extra any
	if err = d.Decode(&extra); err != io.EOF {
		return errors.New("expected one JSON value within 64 MiB")
	}
	return nil
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		childGate(os.Args[2:])
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
	project := f.String("project", ".", "selected project")
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
	root, err := filepath.Abs(*project)
	if err != nil {
		return nil, err
	}
	switch command {
	case "catalog":
		return metadata.Catalog, nil
	case "schema":
		if len(f.Args()) != 1 {
			return nil, errors.New("schema requires a command name")
		}
		value, ok := metadata.Schemas[f.Args()[0]]
		if !ok {
			return nil, errors.New("unknown command")
		}
		return value, nil
	case "discover":
		return discover(root)
	case "locks":
		return lockReport(root)
	case "http":
		var input httpRequest
		if err = readJSON(*request, &input); err != nil {
			return nil, err
		}
		return fetchHTTP(ctx, input)
	case "exec":
		if len(f.Args()) == 0 {
			return nil, errors.New("exec requires explicit argv after --")
		}
		return runProcess(ctx, f.Args(), root, os.Environ())
	case "worker":
		payload := map[string]any{}
		if *request != "" {
			if err = readJSON(*request, &payload); err != nil {
				return nil, err
			}
		}
		return runWorker(ctx, root, *operation, payload)
	case "host-start":
		return startHost(ctx, *directory, root)
	case "host":
		return nil, serveHost(ctx, *directory, root)
	case "rpc":
		params := map[string]any{}
		if *request != "" {
			if err = readJSON(*request, &params); err != nil {
				return nil, err
			}
		}
		return callHost(ctx, *directory, *method, params)
	case "tokenize", "embed":
		var input modelRequest
		if err = readJSON(*request, &input); err != nil {
			return nil, err
		}
		return modelOperation(ctx, command, input)
	default:
		return nil, fmt.Errorf("unsupported prototype command: %s", command)
	}
}
