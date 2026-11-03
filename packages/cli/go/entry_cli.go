//go:build !probe

package main

import "os"

func main() {
	if len(os.Args) > 1 && os.Args[1] == "_gate" {
		childGate(os.Args[2:])
		return
	}
	os.Exit(runCLI(os.Args[1:]))
}
