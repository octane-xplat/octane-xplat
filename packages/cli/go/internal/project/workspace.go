package project

import (
	"encoding/json"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

type AppIdentity struct {
	ID           string   `json:"id"`
	Name         any      `json:"name"`
	Root         string   `json:"root"`
	RelativeRoot string   `json:"relativeRoot"`
	Kind         string   `json:"kind"`
	Platforms    []string `json:"platforms"`
}
type workspaceIdentity struct {
	Root string `json:"root"`
	Kind string `json:"kind"`
}
type workspaceDiscovery struct {
	Workspace workspaceIdentity `json:"workspace"`
	Apps      []AppIdentity     `json:"apps"`
}
type AppSelection struct {
	State      string        `json:"state"`
	App        *AppIdentity  `json:"app,omitempty"`
	Reason     string        `json:"reason,omitempty"`
	Candidates []AppIdentity `json:"candidates,omitempty"`
}

func (selection AppSelection) MarshalJSON() ([]byte, error) {
	value := map[string]any{"state": selection.State}
	switch selection.State {
	case "bound":
		value["app"] = selection.App
		value["reason"] = selection.Reason
	case "ambiguous":
		candidates := selection.Candidates
		if candidates == nil {
			candidates = []AppIdentity{}
		}
		value["candidates"] = candidates
	default:
		value["reason"] = selection.Reason
	}
	return json.Marshal(value)
}

type WorkspaceContext struct {
	Root, Client, Selector, Reason string
	Discovery                      workspaceDiscovery
	Bound                          *AppIdentity
}

func resolveFrom(base, path string) string {
	if filepath.IsAbs(path) {
		return filepath.Clean(path)
	}
	return filepath.Join(base, path)
}
func webProject(path string) bool {
	for _, suffix := range []string{"js", "mjs", "ts", "cjs", "mts", "cts"} {
		if osfs.PathExists(filepath.Join(path, "vite.config."+suffix)) {
			return true
		}
	}
	return false
}
func Dependencies(manifest map[string]any) map[string]any {
	result := map[string]any{}
	for _, key := range []string{"dependencies", "devDependencies"} {
		for name, value := range cli.Object(manifest[key]) {
			result[name] = value
		}
	}
	return result
}
func isAppDirectory(path string, manifest map[string]any) bool {
	if manifest == nil {
		return false
	}
	_, targetsPresent := cli.Object(manifest["xplat"])["targets"]
	if targetsPresent {
		return true
	}
	hasDependency := false
	for name := range Dependencies(manifest) {
		if strings.HasPrefix(name, "@octane-xplat/") || name == "octane" || name == "@nativescript-community/octane" {
			hasDependency = true
			break
		}
	}
	return hasDependency && (webProject(path) || osfs.PathExists(filepath.Join(path, "nativescript.config.ts")))
}
func DeclaredPlatforms(path string, manifest map[string]any) []string {
	platforms := []string{}
	if webProject(path) {
		platforms = append(platforms, "web")
	}
	if osfs.PathExists(filepath.Join(path, "nativescript.config.ts")) {
		deps := Dependencies(manifest)
		for _, platform := range []string{"ios", "android", "windows"} {
			if _, ok := deps["@nativescript/"+platform].(string); ok {
				platforms = append(platforms, platform)
			}
		}
	}
	if cli.ValueAt(manifest, "xplat", "targets", "macos", "runtime") == "appkit-node-api" {
		platforms = append(platforms, "macos")
	}
	if runtime := cli.ValueAt(manifest, "xplat", "targets", "linux", "runtime"); runtime == "webkitgtk" || runtime == "gtk" {
		platforms = append(platforms, "linux")
	}
	return platforms
}
func discoverWorkspace(root string) (workspaceDiscovery, error) {
	manifest := cli.JsonObject(filepath.Join(root, "package.json"))
	framework := manifest["name"] == "octane-xplat" || cli.JsonObject(filepath.Join(root, "packages/ui/package.json"))["name"] == "@octane-xplat/ui"
	kind := "consumer"
	if manifest == nil {
		kind = "empty"
	} else if framework {
		kind = "framework-repo"
	}
	result := workspaceDiscovery{Workspace: workspaceIdentity{root, kind}, Apps: []AppIdentity{}}
	skip := map[string]bool{"node_modules": true, ".git": true, "dist": true, "build": true, ".turbo": true, ".next": true, "coverage": true, "platforms": true, "research": true}
	visited := 0
	add := func(path string) {
		pkg := cli.JsonObject(filepath.Join(path, "package.json"))
		if !isAppDirectory(path, pkg) {
			return
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			return
		}
		name := pkg["name"]
		if name == nil {
			name = filepath.Base(path)
			if rel == "." {
				name = "."
			}
		}
		appKind := "consumer-app"
		if framework && strings.HasPrefix(rel, "packages"+string(filepath.Separator)) {
			appKind = "framework-package"
		}
		result.Apps = append(result.Apps, AppIdentity{rel, name, path, rel, appKind, DeclaredPlatforms(path, pkg)})
	}
	var scan func(string, int) error
	scan = func(directory string, depth int) error {
		if depth > 5 {
			return nil
		}
		entries, err := os.ReadDir(directory)
		if err != nil {
			return nil
		}
		for _, entry := range entries {
			if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") || skip[entry.Name()] {
				continue
			}
			visited++
			if visited > 20000 {
				return fmt.Errorf("workspace discovery exceeds 20000 directories")
			}
			child := filepath.Join(directory, entry.Name())
			if osfs.PathExists(filepath.Join(child, "package.json")) {
				add(child)
			}
			if err := scan(child, depth+1); err != nil {
				return err
			}
		}
		return nil
	}
	add(root)
	return result, scan(root, 0)
}

var safeClient = regexp.MustCompile(`^[a-zA-Z0-9_-]{1,64}$`)

func preferencePath(root, client string) string {
	return filepath.Join(root, "node_modules/.cache/xplat/agent", client+".json")
}
func NewWorkspaceContext(values map[string]any) (*WorkspaceContext, error) {
	root := cli.StringValue(values["project"])
	root, err := WorkspaceStartDirectory(root)
	if err != nil {
		return nil, err
	}
	client := cli.StringValue(values["client"])
	if _, present := values["client"]; !present {
		client = os.Getenv("XPLAT_AGENT_CLIENT")
		if client == "" {
			client = "default"
		}
	}
	ctx := &WorkspaceContext{Root: root, Client: client}
	ctx.Discovery, err = discoverWorkspace(root)
	if err != nil {
		return nil, err
	}
	if explicit, present := values["app"]; present {
		ctx.Selector = cli.StringValue(explicit)
		if ctx.Selector != "" {
			ctx.Reason = "explicit"
		}
	} else if safeClient.MatchString(client) {
		if saved := cli.JsonObject(preferencePath(root, client)); saved != nil {
			ctx.Selector = cli.StringValue(saved["appId"])
			if ctx.Selector != "" {
				ctx.Reason = "preference"
			}
		}
	}
	if ctx.Selector != "" {
		matches := ctx.matches(ctx.Selector)
		if len(matches) == 1 {
			ctx.Bound = &matches[0]
		}
	}
	return ctx, nil
}
func (ctx *WorkspaceContext) matches(selector string) []AppIdentity {
	result := []AppIdentity{}
	for _, app := range ctx.Discovery.Apps {
		if app.ID == selector || app.RelativeRoot == selector || app.Name == selector ||
			filepath.Clean(app.RelativeRoot) == filepath.Clean(filepath.FromSlash(selector)) {
			result = append(result, app)
		}
	}
	return result
}
func (ctx *WorkspaceContext) Selection() AppSelection {
	if ctx.Bound != nil {
		return AppSelection{State: "bound", App: ctx.Bound, Reason: ctx.Reason}
	}
	apps := ctx.Discovery.Apps
	if ctx.Selector != "" {
		return AppSelection{State: "ambiguous", Candidates: apps}
	}
	if len(apps) == 0 {
		return AppSelection{State: "none", Reason: "no-apps"}
	}
	if len(apps) == 1 {
		return AppSelection{State: "bound", App: &apps[0], Reason: "sole-app"}
	}
	return AppSelection{State: "ambiguous", Candidates: apps}
}
func (ctx *WorkspaceContext) EnvelopeContext(command string, values map[string]any) map[string]any {
	result := map[string]any{"command": command, "projectId": nil}
	if platform := cli.StringValue(values["platform"]); platform != "" {
		result["platform"] = platform
	}
	if ctx.Bound != nil {
		result["projectId"] = ctx.Bound.ID
		result["selection"] = map[string]any{"state": "bound", "appId": ctx.Bound.ID, "reason": ctx.Reason}
	}
	return result
}

func (ctx *WorkspaceContext) SelectApp(selector string) (any, *cli.Error) {
	matches := ctx.matches(selector)
	if len(matches) == 0 {
		err := cli.Invalid(fmt.Sprintf("No app matches \"%s\".", selector), "Pick an id from candidates, or check the workspace root.")
		err.Context = map[string]any{"candidates": ctx.Discovery.Apps}
		return nil, err
	}
	if len(matches) > 1 {
		return nil, &cli.Error{Code: "ambiguous_selection", Message: fmt.Sprintf("\"%s\" matches several apps.", selector), Recovery: map[string]string{"action": "Pass an exact app id from the candidates."}, Context: map[string]any{"candidates": matches}}
	}
	ctx.Bound = &matches[0]
	ctx.Reason = "explicit"
	if !safeClient.MatchString(ctx.Client) {
		return nil, cli.Invalid("Client must contain 1–64 ASCII letters, digits, underscores or hyphens.")
	}
	path := preferencePath(ctx.Root, ctx.Client)
	relative, _ := filepath.Rel(ctx.Root, path)
	data := map[string]any{"client": ctx.Client, "appId": ctx.Bound.ID, "appName": ctx.Bound.Name, "selectedAt": cli.IsoNow()}
	if err := osfs.PublishWorkspaceJSON(ctx.Root, relative, data); err != nil {
		return nil, &cli.Error{Code: "execution_failure", Message: err.Error()}
	}
	return map[string]any{"bound": ctx.Bound, "reason": "explicit", "preference": map[string]string{"client": ctx.Client, "path": path}}, nil
}
