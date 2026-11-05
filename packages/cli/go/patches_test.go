package main

import (
	"context"
	"errors"
	"testing"
)

func TestPatchWorkerRowsRejectUnsafeOrUnknownData(t *testing.T) {
	for _, row := range []patchRow{
		{Specifier: "css@3", File: "../escape.patch", State: "applied", Detail: "applied"},
		{Specifier: "css@3", File: "C:escape.patch", State: "applied", Detail: "applied"},
		{Specifier: "css@3", File: "css.patch", State: "invented", Detail: "unknown"},
	} {
		if validatePatchRows([]patchRow{row}, true) == nil {
			t.Fatal("accepted unsafe or unknown inspection", row)
		}
	}
	if validatePatchRows([]patchRow{}, true) != nil {
		t.Fatal("empty inventory must be valid")
	}
	if validatePatchRows([]patchRow{{Specifier: "patchedDependencies", Reason: "not a mapping"}}, false) != nil {
		t.Fatal("file-less configuration conflicts must be representable")
	}
}

func TestPatchMutationCancellationKeepsFailureEvidence(t *testing.T) {
	err := &workspaceMutationError{Operation: "patches apply", Root: "workspace", Err: context.Canceled}
	if !errors.Is(err, context.Canceled) || !requiresFailureEvidence(err) {
		t.Fatal("cancellation must not hide possible partial writes")
	}
}
