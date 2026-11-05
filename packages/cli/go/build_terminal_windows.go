package main

import (
	"golang.org/x/sys/windows"
	"os"
)

func buildTerminal(file *os.File) bool {
	var mode uint32
	return windows.GetConsoleMode(windows.Handle(file.Fd()), &mode) == nil
}
