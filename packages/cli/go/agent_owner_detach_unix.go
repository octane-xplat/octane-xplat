//go:build darwin || linux

package main

import "os/exec"

func agentOwnerCommand(executable string, args []string) *exec.Cmd {
	return ownerCommand(executable, args)
}
