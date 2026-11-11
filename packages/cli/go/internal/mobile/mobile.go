// Package mobile translates CLI requests to the reusable NativeScript library.
package mobile

import (
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	ns "github.com/octane-xplat/nativescript-cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
)

// UseLibrary keeps the unqualified signing/physical paths explicitly selectable.
func UseLibrary(ctx context.Context) (bool, error) {
	switch environment(ctx)["XPLAT_NATIVE_ENGINE"] {
	case "", "go":
		return true, nil
	case "upstream":
		return false, nil
	default:
		return false, errors.New("XPLAT_NATIVE_ENGINE must be go or upstream")
	}
}

func Preflight(ctx context.Context, root string) error {
	if _, err := project.NodeExecutable(ctx); err != nil {
		return err
	}
	if _, err := project.InstalledProjectEntry(root, "vite", "bin", "vite"); err != nil {
		return err
	}
	if project.InstalledRoot(root, "@nativescript/vite") == "" {
		return errors.New("install the selected project's official @nativescript/vite package")
	}
	return nil
}

func environment(ctx context.Context) map[string]string {
	result := map[string]string{}
	for _, entry := range project.ExecutionEnvironment(ctx) {
		if key, value, ok := strings.Cut(entry, "="); ok {
			result[key] = value
		}
	}
	return result
}

func New(ctx context.Context, diagnostic io.Writer) (*ns.Client, error) {
	var mu sync.Mutex
	return ns.New(ns.Options{Environment: environment(ctx), Sink: func(ctx context.Context, e ns.Event) error {
		mu.Lock()
		defer mu.Unlock()
		if e.Kind == ns.Diagnostic {
			_, err := fmt.Fprintln(diagnostic, e.Message)
			return err
		}
		_, err := fmt.Fprintf(diagnostic, "%s: %s %s\n", e.Operation, e.Stage, e.Kind)
		return err
	}})
}

func Request(root, platform string, release bool) ns.BuildRequest {
	config := ns.Debug
	if release {
		config = ns.Release
	}
	arch := "arm64"
	if runtime.GOARCH == "amd64" {
		arch = "x86_64"
	}
	if platform == "android" {
		arch = "arm64-v8a"
	}
	return ns.BuildRequest{ProjectDir: root, OutputDir: filepath.Join(root, ".xplat-ns"), Target: ns.Target{Platform: ns.Platform(platform), Configuration: config, Destination: ns.Destination{Kind: ns.Simulator, ID: "generic", Architecture: arch}}}
}

// Error retains library categories and exposes authored, bounded remediation.
func Error(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, ns.ErrCleanup) {
		return &proc.CleanupError{Err: err}
	}
	var op *ns.OperationError
	if errors.As(err, &op) && op.Advice != "" {
		return fmt.Errorf("%s: %w", op.Advice, err)
	}
	return err
}

func Run(ctx context.Context, root, platform, device string, restart bool, out, diagnostic io.Writer) (proc.Result, error) {
	work, cancel := context.WithCancel(ctx)
	defer cancel()
	client, err := New(work, diagnostic)
	if err != nil {
		return proc.Result{}, err
	}
	devices, err := client.Devices(work, ns.DeviceQuery{Platform: ns.Platform(platform)})
	if err != nil {
		return proc.Result{}, Error(err)
	}
	request := Request(root, platform, false)
	found := false
	for _, d := range devices {
		if d.ID == device {
			request.Target.Destination = ns.Destination{Kind: d.Kind, ID: d.ID, Architecture: d.Architecture}
			found = true
			break
		}
	}
	if !found {
		return proc.Result{}, fmt.Errorf("selected device %s is unavailable", device)
	}
	mode := ns.HotReload
	if restart {
		mode = ns.Restart
	}
	var logErr error
	var mu sync.Mutex
	session, err := client.Run(work, ns.RunRequest{Build: request, DeviceID: device, Development: &ns.DevelopmentOptions{Mode: mode}, Launched: func(l ns.Launch) error {
		// Translate the library's authoritative identity to the existing
		// retained-history line contract; app startup remains a separate proof.
		_, err := fmt.Fprintf(out, "Successfully synced application %s on device %s.\n", l.ApplicationID, l.DeviceID)
		return err
	}, Log: func(l ns.SessionLog) {
		mu.Lock()
		defer mu.Unlock()
		if logErr != nil {
			return
		}
		_, logErr = io.WriteString(out, l.Text)
		if logErr != nil {
			cancel()
		}
	}})
	if err == nil {
		err = session.Wait()
	}
	mu.Lock()
	err = errors.Join(err, logErr)
	mu.Unlock()
	result := proc.Result{Cancelled: ctx.Err() != nil}
	if err != nil && !result.Cancelled {
		result.ExitCode = 1
	}
	return result, Error(err)
}
