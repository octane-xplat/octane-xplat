package main

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func init() { nativeLegacyCommands["clean"] = cleanCommand }

type cleanTarget struct {
	path, parentPath, name string
	parent                 *os.Root
	info, parentInfo       os.FileInfo
}
type cleanPlan struct {
	root     *os.Root
	manifest []byte
	targets  []cleanTarget
	parents  map[string]*os.Root
}

func (p *cleanPlan) close() {
	for _, parent := range p.parents {
		parent.Close()
	}
	p.root.Close()
}

// Open every ancestor independently and retain a directory handle. Removal then
// uses that handle, rather than resolving a mutable path back from the cwd.
func cleanDirectory(root *os.Root, path string) (*os.Root, error) {
	current, err := root.OpenRoot(".")
	if err != nil {
		return nil, err
	}
	if path == "." {
		return current, nil
	}
	for _, part := range strings.Split(filepath.ToSlash(path), "/") {
		info, err := current.Lstat(part)
		if err != nil {
			current.Close()
			return nil, err
		}
		if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
			current.Close()
			return nil, fmt.Errorf("clean refuses a linked or non-directory ancestor: %s", path)
		}
		next, err := current.OpenRoot(part)
		current.Close()
		if err != nil {
			return nil, err
		}
		opened, err := next.Stat(".")
		if err != nil || !os.SameFile(info, opened) {
			next.Close()
			return nil, fmt.Errorf("clean directory identity changed: %s", path)
		}
		current = next
	}
	return current, nil
}

func cleanManifest(root *os.Root) ([]byte, error) {
	file, err := root.Open("package.json")
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return nil, err
	}
	if !info.Mode().IsRegular() || info.Size() > 64<<20 {
		return nil, errors.New("clean package.json must be an ordinary file within 64 MiB")
	}
	data, err := io.ReadAll(io.LimitReader(file, (64<<20)+1))
	if len(data) > 64<<20 {
		return nil, errors.New("clean package.json exceeds 64 MiB")
	}
	return data, err
}

func planClean(project string) (_ *cleanPlan, failure error) {
	root, err := os.OpenRoot(project)
	if err != nil {
		return nil, err
	}
	plan := &cleanPlan{root: root, parents: map[string]*os.Root{}}
	defer func() {
		if failure != nil {
			plan.close()
		}
	}()
	plan.manifest, err = cleanManifest(root)
	if err != nil {
		return nil, err
	}
	manifest := map[string]any{}
	if plan.manifest != nil {
		if err = json.Unmarshal(plan.manifest, &manifest); err != nil {
			return nil, err
		}
		if manifest == nil {
			return nil, errors.New("clean package.json must contain an object")
		}
	}
	paths := []string{"dist", ".ns-vite-build", "node_modules/.vite", "node_modules/.cache/xplat"}
	plugin := object(manifest["nativescript"])["platforms"] != nil
	if !plugin {
		platforms, err := cleanDirectory(root, "platforms")
		if err == nil {
			file, openErr := platforms.Open(".")
			if openErr != nil {
				platforms.Close()
				return nil, openErr
			}
			entries, readErr := file.ReadDir(4097)
			file.Close()
			platforms.Close()
			if readErr != nil && readErr != io.EOF {
				return nil, readErr
			}
			if len(entries) > 4096 {
				return nil, errors.New("clean platforms inventory exceeds 4096 entries")
			}
			sort.Slice(entries, func(a, b int) bool { return entries[a].Name() < entries[b].Name() })
			// NativeScript's generated projects are siblings of authored macOS
			// source. Preserve that name under case-insensitive spelling too.
			for _, entry := range entries {
				if !strings.EqualFold(entry.Name(), "macos") {
					paths = append(paths, "platforms/"+entry.Name())
				}
			}
		} else if !os.IsNotExist(err) {
			return nil, err
		}
	}
	for _, path := range paths {
		parentPath, name := filepath.Dir(path), filepath.Base(path)
		parent := plan.parents[parentPath]
		if parent == nil {
			parent, err = cleanDirectory(root, parentPath)
			if os.IsNotExist(err) {
				continue
			}
			if err != nil {
				return nil, err
			}
			plan.parents[parentPath] = parent
		}
		info, err := parent.Lstat(name)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, err
		}
		parentInfo, err := parent.Stat(".")
		if err != nil {
			return nil, err
		}
		plan.targets = append(plan.targets, cleanTarget{path, parentPath, name, parent, info, parentInfo})
	}
	return plan, nil
}

func (p *cleanPlan) validateManifest() error {
	manifest, err := cleanManifest(p.root)
	if err != nil || (manifest == nil) != (p.manifest == nil) || !bytes.Equal(manifest, p.manifest) {
		return fmt.Errorf("clean project metadata changed; retry after reviewing package.json: %w", errors.Join(err, errors.New("stale clean plan")))
	}
	return nil
}

func (p *cleanPlan) validateTarget(target cleanTarget) error {
	parent, err := cleanDirectory(p.root, target.parentPath)
	if err != nil {
		return err
	}
	info, err := parent.Stat(".")
	parent.Close()
	if err != nil || !os.SameFile(target.parentInfo, info) {
		return fmt.Errorf("clean output parent changed: %s", target.path)
	}
	info, err = target.parent.Lstat(target.name)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil || !os.SameFile(target.info, info) {
		return fmt.Errorf("clean output identity changed: %s", target.path)
	}
	return nil
}

func (p *cleanPlan) validate() error {
	if err := p.validateManifest(); err != nil {
		return err
	}
	for _, target := range p.targets {
		if err := p.validateTarget(target); err != nil {
			return err
		}
	}
	return nil
}

type cleanFailure struct {
	Removed, Attempted []string
	Err                error
}

func (e *cleanFailure) Error() string {
	return fmt.Sprintf("cleanup incomplete; removed %v, attempted %v: %v", e.Removed, e.Attempted, e.Err)
}
func (e *cleanFailure) Unwrap() error { return e.Err }

func (p *cleanPlan) remove(ctx context.Context, remove func(*os.Root, string) error) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if err := p.validate(); err != nil {
		return err
	}
	removed := []string{}
	for _, target := range p.targets {
		if err := ctx.Err(); err != nil {
			return &cleanFailure{Removed: removed, Err: err}
		}
		if err := p.validateManifest(); err != nil {
			return &cleanFailure{Removed: removed, Err: err}
		}
		if err := p.validateTarget(target); err != nil {
			return &cleanFailure{Removed: removed, Err: err}
		}
		if err := remove(target.parent, target.name); err != nil {
			return &cleanFailure{Removed: removed, Attempted: []string{target.path}, Err: err}
		}
		removed = append(removed, target.path)
	}
	if err := ctx.Err(); err != nil {
		return &cleanFailure{Removed: removed, Err: err}
	}
	return nil
}

func cleanCommand(ctx context.Context, _ map[string]any) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	plan, err := planClean(project)
	if err != nil {
		return err
	}
	defer plan.close()
	if len(plan.targets) == 0 {
		fmt.Println("Nothing to clean")
		return nil
	}
	paths := []string{}
	for _, target := range plan.targets {
		paths = append(paths, target.path)
	}
	if buildTerminal(os.Stdout) {
		fmt.Printf("Remove %s? [Y/n] ", strings.Join(paths, ", "))
		type answer struct {
			line string
			err  error
		}
		done := make(chan answer, 1)
		go func() {
			line, err := bufio.NewReader(io.LimitReader(os.Stdin, 1025)).ReadString('\n')
			done <- answer{line, err}
		}()
		select {
		case <-ctx.Done():
			return ctx.Err()
		case response := <-done:
			if response.err == io.EOF && response.line == "" {
				fmt.Println("Cancelled")
				return nil
			}
			if response.err != nil && response.err != io.EOF {
				return response.err
			}
			line := strings.ToLower(strings.TrimSpace(response.line))
			if len(response.line) > 1024 || (line != "" && line != "y" && line != "yes") {
				fmt.Println("Cancelled")
				return nil
			}
		}
	}
	release, err := lockProjectOutputs(project)
	if err != nil {
		return err
	}
	defer release()
	if err = plan.remove(ctx, func(root *os.Root, name string) error { return root.RemoveAll(name) }); err != nil {
		return err
	}
	fmt.Printf("Cleaned %s\n", strings.Join(paths, ", "))
	return nil
}
