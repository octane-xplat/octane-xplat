package dev

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
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
	// Physical distinguishes a devicectl hardware target from a simulator.
	Physical bool `json:"physical,omitempty"`
	// Unavailable marks a discovered target that cannot launch right now and
	// records why; it stays visible for selection errors and prompts.
	Unavailable string `json:"unavailable,omitempty"`
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
	matched := []devTarget{}
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
		matched = append(matched, t)
	}
	selected := []devTarget{}
	blocked := []string{}
	for _, t := range matched {
		if t.Unavailable != "" {
			blocked = append(blocked, t.Name+" ("+t.ID+"): "+t.Unavailable)
		} else {
			selected = append(selected, t)
		}
	}
	if len(selected) == 0 {
		if len(blocked) != 0 {
			return nil, fmt.Errorf("matched development targets are not usable: %s", strings.Join(blocked, "; "))
		}
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
		name := t.Kind + " (" + t.ID + ")"
		if t.Unavailable != "" {
			name += ": " + t.Unavailable
		}
		names = append(names, name)
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
			result = append(result, devTarget{Kind: "ios", ID: d.UDID, Name: name, Device: d.UDID, Booted: &booted})
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

// A devicectl `list devices --json-output` entry. devicectl still emits the
// deprecated hardware/device/connection groups unless
// --omit-deprecated-fields-in-json is passed; the CLI never passes it.
type devicectlDevice struct {
	Identifier string `json:"identifier"`
	Hardware   struct {
		Reality       string `json:"reality"`
		Platform      string `json:"platform"`
		DeviceType    string `json:"deviceType"`
		UDID          string `json:"udid"`
		MarketingName string `json:"marketingName"`
	} `json:"hardwareProperties"`
	Device struct {
		Name                string `json:"name"`
		BootState           string `json:"bootState"`
		DeveloperModeStatus string `json:"developerModeStatus"`
	} `json:"deviceProperties"`
	Connection struct {
		PairingState  string `json:"pairingState"`
		TransportType string `json:"transportType"`
	} `json:"connectionProperties"`
}

// A lock-state read answers two questions at once: devicectl only runs it
// against a device it can reach now, and passcodeRequired reports the lock.
type iosLockProbe func(identifier string) (reachable, locked bool, err error)

// Physical iOS hardware from `devicectl list devices`. devicectl also knows
// simulators, Macs and non-iOS devices; those are not iOS targets at all and
// are skipped, while paired-but-unusable iOS hardware stays visible with a
// reason so an explicit --device selection can say what is wrong. A missing
// tool or empty list means no physical targets, but garbage output from a
// tool that did run is reported rather than hiding a real phone.
func iosPhysicalDevTargets(data []byte, lock iosLockProbe) ([]devTarget, error) {
	result := []devTarget{}
	if len(bytes.TrimSpace(data)) == 0 {
		return result, nil
	}
	var root struct {
		Result struct {
			Devices []devicectlDevice `json:"devices"`
		} `json:"result"`
	}
	if err := json.Unmarshal(data, &root); err != nil {
		return nil, fmt.Errorf("malformed devicectl device list: %w", err)
	}
	// devicectl can list one phone per transport; collapse duplicate hardware
	// ids or an exact --device pick becomes ambiguous for no reason. Prefer an
	// entry that passes the static checks over a blocked duplicate.
	type candidate struct {
		target    devTarget
		unblocked bool
	}
	candidates := map[string]int{}
	ordered := []candidate{}
	for _, d := range root.Result.Devices {
		if d.Hardware.Reality == "simulated" || d.Connection.TransportType == "sameMachine" {
			continue
		}
		if d.Hardware.Platform != "" && d.Hardware.Platform != "iOS" && d.Hardware.Platform != "iPadOS" {
			continue
		}
		if d.Hardware.DeviceType != "" && d.Hardware.DeviceType != "iPhone" && d.Hardware.DeviceType != "iPad" {
			continue
		}
		id := d.Hardware.UDID
		if id == "" {
			id = d.Identifier
		}
		if id == "" {
			return nil, errors.New("malformed devicectl device list: a physical iOS device has no identifier")
		}
		name := d.Device.Name
		if name == "" {
			name = d.Hardware.MarketingName
		}
		if name == "" {
			name = "iPhone"
		}
		entry := candidate{target: devTarget{Kind: "ios", ID: id, Name: name + " (device)", Device: id, Physical: true}}
		switch {
		case d.Connection.PairingState != "paired":
			entry.target.Unavailable = "not paired; trust this computer on the device"
		case d.Device.BootState != "" && d.Device.BootState != "booted":
			entry.target.Unavailable = "device is " + d.Device.BootState
		case d.Device.DeveloperModeStatus == "disabled":
			entry.target.Unavailable = "Developer Mode is disabled"
		default:
			entry.unblocked = true
		}
		if at, seen := candidates[id]; seen {
			if !ordered[at].unblocked && entry.unblocked {
				ordered[at] = entry
			}
			continue
		}
		candidates[id] = len(ordered)
		ordered = append(ordered, entry)
	}
	for _, entry := range ordered {
		if entry.unblocked {
			reachable, locked, err := lock(entry.target.ID)
			if err != nil {
				return nil, err
			}
			switch {
			case !reachable:
				entry.target.Unavailable = "unavailable; the device cannot be reached"
			case locked:
				entry.target.Unavailable = "locked; unlock the device"
			}
		}
		result = append(result, entry.target)
	}
	return result, nil
}

// `devicectl device info lockState --json-output -` exits nonzero when the
// device cannot be reached; that is an unavailable device, not malformed data.
func iosDeviceLockState(data string) (reachable, locked bool, err error) {
	if strings.TrimSpace(data) == "" {
		return false, false, nil
	}
	var root struct {
		Result struct {
			PasscodeRequired *bool `json:"passcodeRequired"`
		} `json:"result"`
	}
	if err := json.Unmarshal([]byte(data), &root); err != nil {
		return false, false, fmt.Errorf("malformed devicectl lock state: %w", err)
	}
	if root.Result.PasscodeRequired == nil {
		return false, false, errors.New("malformed devicectl lock state: missing passcodeRequired")
	}
	return true, *root.Result.PasscodeRequired, nil
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

func discoverDevTargets(ctx context.Context, projectPath string) ([]devTarget, error) {
	manifest, err := project.Manifest(projectPath)
	if err != nil {
		return nil, err
	}
	declared := project.DeclaredPlatforms(projectPath, manifest)
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
		output, err := proc.RunProcess(child, append([]string{executable}, args...), projectPath, nil)
		if err != nil && cli.RequiresFailureEvidence(err) {
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
			physical, err := probe("xcrun", "devicectl", "list", "devices", "--json-output", "-")
			if err != nil {
				return nil, err
			}
			devices, err := iosPhysicalDevTargets([]byte(physical), func(id string) (bool, bool, error) {
				state, err := probe("xcrun", "devicectl", "device", "info", "lockState", "--device", id, "--json-output", "-")
				if err != nil {
					return false, false, err
				}
				return iosDeviceLockState(state)
			})
			if err != nil {
				return nil, err
			}
			result = append(result, devices...)
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
			runtime := cli.ValueAt(manifest, "xplat", "targets", "linux", "runtime")
			label := "WebKitGTK webview"
			if runtime == "gtk" {
				label = "GTK4/GJS native"
			}
			result = append(result, devTarget{Kind: kind, ID: kind, Name: "Linux (experimental " + label + ")"})
		}
	}
	return result, ctx.Err()
}
