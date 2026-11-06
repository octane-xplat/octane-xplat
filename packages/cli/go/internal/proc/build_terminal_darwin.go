package proc

import (
	"golang.org/x/sys/unix"
	"os"
)

func BuildTerminal(file *os.File) bool {
	_, err := unix.IoctlGetTermios(int(file.Fd()), unix.TIOCGETA)
	return err == nil
}

func terminalState(file *os.File) (*unix.Termios, error) {
	return unix.IoctlGetTermios(int(file.Fd()), unix.TIOCGETA)
}
func restoreTerminalState(file *os.File, state *unix.Termios) error {
	return unix.IoctlSetTermios(int(file.Fd()), unix.TIOCSETA, state)
}
