package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"runtime"
	"strings"
	"time"
)

func init() { nativeLegacyCommands["doctor"] = doctorCommand }

type doctorCheck struct {
	Name   string `json:"name"`
	OK     *bool  `json:"ok"`
	Detail string `json:"detail,omitempty"`
	Hint   string `json:"hint,omitempty"`
}
type doctorMessage struct{ Level, Text string }
type doctorReport struct {
	Version                   int
	Root                      string
	Rows                      []doctorCheck
	Messages                  []doctorMessage
	Summary, DiagnosticStderr string
	ExitCode                  *int
}
type macOSDoctorReport struct {
	Version int           `json:"version"`
	Root    string        `json:"root"`
	Rows    []doctorCheck `json:"rows"`
}

func validateDoctorChecks(rows []doctorCheck) error {
	if rows == nil || len(rows) > 512 {
		return errors.New("invalid diagnostic check inventory")
	}
	for _, row := range rows {
		if row.Name == "" || len(row.Name) > 4096 || row.OK == nil || len(row.Detail) > 1<<20 || len(row.Hint) > 1<<20 {
			return errors.New("invalid or incomplete diagnostic check")
		}
	}
	return nil
}
func validateDoctorRoot(project, root string, version int) error {
	expected, err := projectLockIdentity(project)
	if err != nil {
		return err
	}
	actual, err := projectLockIdentity(root)
	if err != nil || version != 1 || expected != actual {
		return errors.New("diagnostic worker project/version identity mismatch")
	}
	return nil
}
func validateMacOSDoctor(report macOSDoctorReport, project string) error {
	if err := validateDoctorRoot(project, report.Root, report.Version); err != nil {
		return err
	}
	if err := validateDoctorChecks(report.Rows); err != nil {
		return err
	}
	required := []string{"macOS host", "macOS architecture", "macOS dev script", "macOS package config", "macOS NativeScript declarations", "macOS JavaScriptCore package host", "macOS native leaf toolchain"}
	if runtime.GOOS == "darwin" {
		required = append(required, "codesign", "hdiutil")
	}
	for _, name := range required {
		found := false
		for _, row := range report.Rows {
			found = found || row.Name == name
		}
		if !found {
			return fmt.Errorf("macOS diagnostic worker omitted required check %q; update selected project tooling", name)
		}
	}
	return nil
}
func validateDoctor(report doctorReport, project string) error {
	if err := validateDoctorRoot(project, report.Root, report.Version); err != nil {
		return err
	}
	if err := validateDoctorChecks(report.Rows); err != nil {
		return err
	}
	node, manager, compatibility := false, false, false
	for _, row := range report.Rows {
		node = node || row.Name == "node"
		manager = manager || row.Name == "bun" || row.Name == "pnpm"
		compatibility = compatibility || row.Name == "compatibility" || strings.HasPrefix(row.Name, "compatibility ")
	}
	if !node || !manager || !compatibility {
		return errors.New("diagnostic worker omitted required tool/compatibility checks; update selected project tooling")
	}
	if report.ExitCode == nil || (*report.ExitCode != 0 && *report.ExitCode != 1) || report.Summary == "" || len(report.Summary) > 1<<20 || len(report.DiagnosticStderr) > 32<<20 || report.Messages == nil || len(report.Messages) > 4096 {
		return errors.New("invalid diagnostic report summary/exit/messages")
	}
	for _, message := range report.Messages {
		if (message.Level != "warn" && message.Level != "info") || message.Text == "" || len(message.Text) > 1<<20 {
			return errors.New("invalid diagnostic message")
		}
	}
	// The engine owns severity policy. SDK warnings are intentionally not all
	// fatal; do not infer exit status from a count of failed observations.
	return nil
}
func doctorOperation(ctx context.Context, project, worker, operation string, payload map[string]any) (json.RawMessage, error) {
	operationContext, cancel := context.WithTimeout(ctx, 3*time.Minute)
	defer cancel()
	result, err := runWorkerEntry(operationContext, project, worker, operation, payload, nil, nil)
	var diagnostics strings.Builder
	for _, warning := range result.Warnings {
		fmt.Fprintln(&diagnostics, warning)
	}
	diagnostics.WriteString(result.Process.Stdout)
	diagnostics.WriteString(result.Process.Stderr)
	writeErr := writeCommandText(operationContext, os.Stderr, diagnostics.String())
	return result.Data, errors.Join(err, writeErr)
}
func doctorCommand(ctx context.Context, _ map[string]any) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	manifest, err := projectManifest(project)
	if err != nil {
		return err
	}
	worker, err := projectWorker(project)
	if err != nil {
		return err
	}
	target := object(object(object(manifest["xplat"])["targets"])["macos"])
	var platformWorker string
	if stringValue(target["runtime"]) == "appkit-node-api" {
		platformWorker, err = installedProjectEntry(project, "@octane-xplat/macos-build", "exports", "./doctor-worker")
		if err != nil {
			return fmt.Errorf("install or update the selected project's @octane-xplat/macos-build for macOS diagnostics: %w", err)
		}
	}
	// SDK inspection may materialize an executable/declaration cache. Coordinate
	// with native clean/build even though no configuration or app is published.
	release, err := lockProjectOutputs(project)
	if err != nil {
		return err
	}
	defer release()
	operationContext, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	if err = writeCommandText(operationContext, os.Stdout, "xplat doctor\n"); err != nil {
		return err
	}
	var macos *macOSDoctorReport
	if platformWorker != "" {
		data, err := doctorOperation(operationContext, project, platformWorker, "macos-doctor", nil)
		if err != nil {
			return err
		}
		macos = &macOSDoctorReport{}
		if err = json.Unmarshal(data, macos); err != nil {
			return err
		}
		if err = validateMacOSDoctor(*macos, project); err != nil {
			return err
		}
	}
	data, err := doctorOperation(operationContext, project, worker, "doctor", map[string]any{"macosReport": macos})
	if err != nil {
		return err
	}
	var report doctorReport
	if err = json.Unmarshal(data, &report); err != nil {
		return err
	}
	if err = validateDoctor(report, project); err != nil {
		return err
	}
	var output strings.Builder
	for _, message := range report.Messages {
		fmt.Fprintln(&output, message.Text)
	}
	for _, row := range report.Rows {
		detail := row.Detail
		if detail == "" {
			if *row.OK {
				detail = "ok"
			} else {
				detail = "missing"
			}
		}
		if !*row.OK && row.Hint != "" {
			detail += " (" + row.Hint + ")"
		}
		fmt.Fprintf(&output, "%s — %s\n", row.Name, detail)
	}
	fmt.Fprintln(&output, report.Summary)
	if err = writeCommandText(operationContext, os.Stdout, output.String()); err != nil {
		return err
	}
	if *report.ExitCode != 0 {
		if report.DiagnosticStderr != "" {
			if err = writeCommandText(operationContext, os.Stderr, report.DiagnosticStderr+"\n"); err != nil {
				return err
			}
		}
		return &projectToolExit{*report.ExitCode}
	}
	return nil
}
