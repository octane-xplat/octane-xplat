package docs

import (
	"context"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/project"
	"strings"
)

func GuidanceCommand(ctx context.Context, workspace *project.WorkspaceContext, _ map[string]any) (any, *cli.Error) {
	app, failure := Selection(workspace)
	if failure != nil {
		return nil, failure
	}
	install, err := ResolveDocsInstallation(ctx, workspace.Root, app.Root)
	if err != nil {
		return nil, &cli.Error{Code: "execution_failure", Message: err.Error()}
	}
	versions, linked := []string{}, []string{}
	for _, pkg := range install.Packages {
		label := pkg.Name + "@" + pkg.Version
		versions = append(versions, label)
		if pkg.Kind == "linked" {
			linked = append(linked, label)
		}
	}
	versionLabel := strings.Join(versions, ", ")
	if versionLabel == "" {
		versionLabel = "unresolved"
	}
	entries := []any{}
	add := func(id, title, body string) {
		entries = append(entries, map[string]any{"id": id, "title": title, "body": body, "provenance": map[string]any{"source": "project-guidance", "scope": "project", "package": nil, "requestedVersion": nil, "servedVersion": nil, "repo": nil, "tag": nil, "commit": nil, "match": "exact", "offline": false}})
	}
	add("capabilities", "Discover capabilities before acting", "Run `xplat status --json` and `xplat capabilities --json` first. They report installed versions ("+versionLabel+"), provider availability and missing prerequisites. Pending commands and detected platforms do not establish runtime readiness.")
	add("target", "Select an explicit app and target", "Choose the app and platform explicitly with `xplat app select` and the command's target option. Reuse only a session bound to that app and target; do not silently choose among several apps.")
	add("inspect", "Ground answers in current source and version-matched docs", "Search results are leads: open current installed source before changing code, and use version-bound docs when that provider is available. Linked checkout docs are development content; never substitute latest release docs for an unresolved installation.")
	add("iterate", "Run and iterate through the app toolchain", "Use the selected project's installed compiler and plugins. A successful build does not prove launch, readiness or a passing runtime check; consult the capability matrix for this Go build.")
	add("claims", "Qualify every verification claim", "Report the actual platform, target, session/build identity and interaction mechanism. Handler dispatch and DOM events do not prove OS input or hit testing. Visual capture and retention require explicit task permissions.")
	if len(linked) > 0 {
		add("linked", "Linked framework checkouts are development content", strings.Join(linked, ", ")+" resolve to checkout source. Describe that content as development, not as a verified release snapshot.")
	}
	for _, discrepancy := range install.Discrepancies {
		add("discrepancy", "Resolve the install/lockfile discrepancy", discrepancy+". Guidance follows the actual installation; reinstall or update the lockfile to reconcile them.")
	}
	return map[string]any{"bindingRevision": 1, "entries": entries}, nil
}
