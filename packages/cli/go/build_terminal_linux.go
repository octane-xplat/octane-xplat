package main

import (
	"golang.org/x/sys/unix"
	"os"
)

func buildTerminal(file *os.File) bool {
	_, err := unix.IoctlGetTermios(int(file.Fd()), unix.TCGETS)
	return err == nil
}

func terminalState(file *os.File) (*unix.Termios, error) {
	return unix.IoctlGetTermios(int(file.Fd()), unix.TCGETS)
}
func restoreTerminalState(file *os.File, state *unix.Termios) error {
	return unix.IoctlSetTermios(int(file.Fd()), unix.TCSETS, state)
}
