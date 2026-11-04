package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"
)

func init() {
	for _, operation := range []string{"list", "doctor"} {
		nativeLegacyCommands["workshop "+operation] = func(ctx context.Context, values map[string]any) error {
			return workshopInspection(ctx, operation, values)
		}
	}
}

type workshopInspectionReport struct {
	Version   int             `json:"version"`
	Project   string          `json:"project"`
	Operation string          `json:"operation"`
	ExitCode  *int            `json:"exitCode"`
	Stdout    string          `json:"stdout"`
	Error     string          `json:"error"`
	Result    json.RawMessage `json:"result"`
}

func validateWorkshopInspection(report workshopInspectionReport, project, operation, target string, jsonOutput bool) error {
	if err := validateDoctorRoot(project, report.Project, report.Version); err != nil {
		return err
	}
	if report.Operation != "workshop-"+operation || report.ExitCode == nil || (*report.ExitCode != 0 && *report.ExitCode != 1) || len(report.Stdout) > 8<<20 || len(report.Error) > 1<<20 || (jsonOutput && report.Stdout != "") {
		return errors.New("invalid workshop inspection response")
	}
	if *report.ExitCode != 0 {
		if report.Error == "" {
			return errors.New("workshop failure omitted diagnostics")
		}
		return nil
	}
	if report.Error != "" || len(report.Result) > 32<<20 {
		return errors.New("invalid workshop inspection result")
	}
	if operation == "list" {
		var result struct {
			Target      string            `json:"target"`
			Entries     []json.RawMessage `json:"entries"`
			Diagnostics []json.RawMessage `json:"diagnostics"`
		}
		if json.Unmarshal(report.Result, &result) != nil || result.Target != target || result.Entries == nil || result.Diagnostics == nil {
			return errors.New("invalid workshop story inventory")
		}
	} else {
		var result struct {
			Root    string                     `json:"root"`
			Targets map[string]json.RawMessage `json:"targets"`
		}
		if json.Unmarshal(report.Result, &result) != nil || validateDoctorRoot(project, result.Root, 1) != nil {
			return errors.New("invalid workshop doctor identity")
		}
		for _, name := range []string{"web", "ios", "android", "macos", "windows", "linux"} {
			var check struct{ Status, Backend string }
			if json.Unmarshal(result.Targets[name], &check) != nil || check.Status == "" || check.Backend == "" {
				return fmt.Errorf("workshop doctor omitted target %s", name)
			}
		}
	}
	return nil
}

func workshopInspection(ctx context.Context, operation string, values map[string]any) error {
	project, err := os.Getwd()
	if err != nil {
		return err
	}
	project, err = canonical(project)
	if err != nil {
		return err
	}
	if _, err = projectManifest(project); err != nil {
		return fmt.Errorf("run workshop inside an app with package.json: %w", err)
	}
	worker, err := projectWorker(project)
	if err != nil {
		return err
	}
	target := stringValue(values["target"])
	if target == "" {
		target = "web"
	}
	jsonOutput, _ := values["json"].(bool)
	operationContext, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	result, err := runWorkerEntry(operationContext, project, worker, "workshop-"+operation, map[string]any{"json": jsonOutput, "target": target}, nil, nil)
	if writeErr := writeCommandText(operationContext, os.Stderr, result.Process.Stdout+result.Process.Stderr); writeErr != nil {
		return errors.Join(err, writeErr)
	}
	for _, warning := range result.Warnings {
		if writeErr := writeCommandText(operationContext, os.Stderr, warning+"\n"); writeErr != nil {
			return errors.Join(err, writeErr)
		}
	}
	if err != nil {
		return err
	}
	var report workshopInspectionReport
	if err = json.Unmarshal(result.Data, &report); err != nil {
		return err
	}
	if err = validateWorkshopInspection(report, project, operation, target, jsonOutput); err != nil {
		return err
	}
	if err = writeCommandText(operationContext, os.Stdout, report.Stdout); err != nil {
		return err
	}
	if *report.ExitCode != 0 {
		return errors.New(report.Error)
	}
	if jsonOutput {
		var output any
		if err = json.Unmarshal(report.Result, &output); err != nil {
			return err
		}
		bytes, err := json.MarshalIndent(output, "", "  ")
		if err != nil {
			return err
		}
		return writeCommandText(operationContext, os.Stdout, string(bytes)+"\n")
	}
	return nil
}
