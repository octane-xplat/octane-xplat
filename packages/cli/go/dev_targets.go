package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os/exec"
	"slices"
	"strings"
	"time"
)

// Device IDs stay opaque: selection must not turn them into shell fragments.
type devTarget struct {
	Kind   string `json:"kind"`
	ID     string `json:"id"`
	Name   string `json:"name"`
	Device string `json:"device,omitempty"`
	Booted *bool  `json:"booted,omitempty"`
}
type devSelection struct{ Target, Device, Targets *string }

func selectDevTargets(all []devTarget, choice devSelection) ([]devTarget, error) {
	if choice.Device != nil && strings.TrimSpace(*choice.Device) == "" {
		return nil, errors.New("--device requires an exact device target id")
	}
	single := choice.Target != nil && *choice.Target != "" || choice.Device != nil
	if single && choice.Targets != nil && *choice.Targets != "" {
		return nil, errors.New("pass either a single target/device or --targets, not both")
	}
	selected := []devTarget{}
	kinds := []string{}
	if choice.Targets != nil {
		for _, kind := range strings.Split(*choice.Targets, ",") {
			kinds = append(kinds, strings.TrimSpace(kind))
		}
	}
	for _, t := range all {
		if single {
			if choice.Target != nil && *choice.Target != "" && t.ID != *choice.Target && t.Kind != *choice.Target {
				continue
			}
			if choice.Device != nil && t.Device != *choice.Device {
				continue
			}
		} else if choice.Targets != nil && *choice.Targets != "" {
			if !slices.Contains(kinds, t.Kind) {
				continue
			}
		}
		selected = append(selected, t)
	}
	if len(selected) == 0 {
		return nil, fmt.Errorf("no development targets matched; available: %s", devTargetNames(all))
	}
	if single && len(selected) > 1 {
		booted := []devTarget{}
		for _, t := range selected {
			if t.Booted != nil && *t.Booted {
				booted = append(booted, t)
			}
		}
		if len(booted) == 1 {
			return booted, nil
		}
		return nil, fmt.Errorf("ambiguous development target; pass an exact target id or --targets for all: %s", devTargetNames(selected))
	}
	return selected, nil
}
func devTargetNames(targets []devTarget) string {
	names := []string{}
	for _, t := range targets {
		names = append(names, t.Kind+" ("+t.ID+")")
	}
	return strings.Join(names, ", ")
}

// Keep runtime groups in the order emitted by simctl. A Go map would silently
// randomize equal-priority devices and change multi-target startup order.
func iosDevTargets(data []byte) []devTarget {
	result := []devTarget{}
	var root struct{ Devices json.RawMessage }
	if json.Unmarshal(data, &root) != nil || len(root.Devices) == 0 {
		return result
	}
	decoder := json.NewDecoder(bytes.NewReader(root.Devices))
	token, err := decoder.Token()
	if err != nil || token != json.Delim('{') {
		return result
	}
	seen := map[string]bool{}
	for decoder.More() {
		token, err = decoder.Token()
		if err != nil {
			return []devTarget{}
		}
		key, ok := token.(string)
		if !ok || seen[key] {
			return []devTarget{}
		}
		seen[key] = true
		var devices []struct {
			UDID, Name, State string
			IsAvailable       bool
		}
		if decoder.Decode(&devices) != nil {
			return []devTarget{}
		}
		for _, d := range devices {
			if !d.IsAvailable || d.UDID == "" || d.Name == "" {
				continue
			}
			booted := d.State == "Booted"
			name := d.Name
			if booted {
				name += " (booted)"
			}
			result = append(result, devTarget{"ios", d.UDID, name, d.UDID, &booted})
		}
	}
	if _, err = decoder.Token(); err != nil {
		return []devTarget{}
	}
	slices.SortStableFunc(result, func(a, b devTarget) int {
		if *a.Booted == *b.Booted {
			return 0
		}
		if *a.Booted {
			return -1
		}
		return 1
	})
	return result
}
func androidDevTargets(data string) []devTarget {
	result := []devTarget{}
	lines := strings.Split(data, "\n")
	for _, line := range lines[1:] {
		line = strings.TrimSpace(line)
		if !strings.HasSuffix(line, "\tdevice") {
			continue
		}
		serial := strings.SplitN(line, "\t", 2)[0]
		if serial == "" {
			continue
		}
		label := " (device)"
		if strings.HasPrefix(serial, "emulator-") {
			label = " (emulator)"
		}
		result = append(result, devTarget{Kind: "android", ID: serial, Name: serial + label, Device: serial})
	}
	return result
}

func discoverDevTargets(ctx context.Context, project string) ([]devTarget, error) {
	manifest, err := projectManifest(project)
	if err != nil {
		return nil, err
	}
	declared := declaredPlatforms(project, manifest)
	result := []devTarget{}
	probe := func(tool string, args ...string) (string, error) {
		if ctx.Err() != nil {
			return "", ctx.Err()
		}
		executable, err := exec.LookPath(tool)
		if err != nil {
			return "", nil
		}
		child, cancel := context.WithTimeout(ctx, 15*time.Second)
		defer cancel()
		output, err := runProcess(child, append([]string{executable}, args...), project, nil)
		if err != nil && requiresFailureEvidence(err) {
			return "", err
		}
		if ctx.Err() != nil {
			return "", ctx.Err()
		}
		// Missing/unavailable SDKs produce no launchable devices. Failed cleanup is
		// never treated as an unavailable SDK, and parent cancellation stays visible.
		if err != nil || output.ExitCode != 0 || output.Truncated || output.Cancelled {
			return "", nil
		}
		return output.Stdout, nil
	}
	for _, kind := range []string{"web", "ios", "android", "windows", "macos", "linux"} {
		if !slices.Contains(declared, kind) {
			continue
		}
		switch kind {
		case "web":
			result = append(result, devTarget{Kind: kind, ID: kind, Name: "Web (vite :5200)"})
		case "ios":
			output, err := probe("xcrun", "simctl", "list", "devices", "available", "-j")
			if err != nil {
				return nil, err
			}
			result = append(result, iosDevTargets([]byte(output))...)
		case "android":
			output, err := probe("adb", "devices")
			if err != nil {
				return nil, err
			}
			result = append(result, androidDevTargets(output)...)
		case "windows":
			result = append(result, devTarget{Kind: kind, ID: kind, Name: "Windows (ns run windows)"})
		case "macos":
			result = append(result, devTarget{Kind: kind, ID: kind, Name: "macOS (experimental AppKit / WKWebView)"})
		case "linux":
			runtime := valueAt(manifest, "xplat", "targets", "linux", "runtime")
			label := "WebKitGTK webview"
			if runtime == "gtk" {
				label = "GTK4/GJS native"
			}
			result = append(result, devTarget{Kind: kind, ID: kind, Name: "Linux (experimental " + label + ")"})
		}
	}
	return result, ctx.Err()
}
