//go:build windows

package main

import "os"

func openSourceFile(root *os.Root, key string) (*os.File, error) { return root.Open(key) }
