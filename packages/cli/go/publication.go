package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Stage beside the destination, close before replacement, and remove only the
// temporary file allocated here. Later artifact publication adds stale checks.
func publishWorkspaceJSON(base, path string, value any) error {
	bytes, err := json.MarshalIndent(value, "", "\t")
	if err != nil {
		return err
	}
	bytes = append(bytes, '\n')
	root, err := os.OpenRoot(base)
	if err != nil {
		return err
	}
	defer root.Close()
	if err = root.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}
	var file *os.File
	var temporary string
	for attempt := 0; attempt < 8; attempt++ {
		temporary = filepath.Join(filepath.Dir(path), ".xplat-"+identity())
		file, err = root.OpenFile(temporary, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
		if !os.IsExist(err) {
			break
		}
	}
	if err != nil {
		return err
	}
	defer root.Remove(temporary)
	if _, err = file.Write(bytes); err != nil {
		file.Close()
		return err
	}
	if err = file.Close(); err != nil {
		return err
	}
	return root.Rename(temporary, path)
}
