//go:build windows

package main

import (
	"golang.org/x/sys/windows"
	"os/exec"
)

func agentOwnerCommand(executable string, args []string) *exec.Cmd {
	cmd := ownerCommand(executable, args)
	// A persistent owner cannot remain in the one-shot caller's kill-on-close Job.
	// Refuse launch if the host disallows breakaway; inheriting that Job silently
	// would acknowledge a lifetime that the operating system cannot provide.
	cmd.SysProcAttr.CreationFlags |= windows.CREATE_BREAKAWAY_FROM_JOB
	return cmd
}
