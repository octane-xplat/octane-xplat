//go:build !probe

package main

import "github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"

import "github.com/octane-xplat/octane-xplat/packages/cli/go/internal/docs"

import "os"

func main() {
	if len(os.Args) > 1 && os.Args[1] == "_compute" {
		os.Exit(docs.ComputeChild(os.Args[2:]))
	}
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		proc.ChildGate(os.Args[2:])
		return
	}
	os.Exit(runCLI(os.Args[1:]))
}
