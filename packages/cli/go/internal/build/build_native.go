package build

import (
	"errors"
	"fmt"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/cli"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/routes"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
)

type nativeArtifactPlan struct {
	aab                      bool
	keyStorePath             string
	keyStoreAlias            string
	keyStorePasswordEnv      string
	keyStoreAliasPasswordEnv string
	keyStorePassword         string
	keyStoreAliasPassword    string
	forDevice                bool
	provision                string
	teamID                   string
	copyTo                   string
}

var environmentName = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

// Android signing fields come from xplat.targets.android.signing and matching
// flags; passwords are always environment variable references — a persisted or
// argv secret is rejected instead of being forwarded.
func androidSigningConfig(manifest map[string]any, present *bool) (map[string]string, error) {
	values := map[string]string{}
	configured, exists := cli.ValueAt(manifest, "xplat", "targets", "android", "signing").(map[string]any)
	*present = exists
	if !exists {
		return values, nil
	}
	for name := range configured {
		switch name {
		case "keyStorePath", "keyStoreAlias", "keyStorePasswordEnv", "keyStoreAliasPasswordEnv":
		case "keyStorePassword", "keyStoreAliasPassword":
			return nil, fmt.Errorf("xplat.targets.android.signing.%s keeps the password in persisted configuration — use %sEnv to name an environment variable instead", name, name)
		default:
			return nil, fmt.Errorf("unknown xplat.targets.android.signing key %q — expected keyStorePath, keyStoreAlias, keyStorePasswordEnv or keyStoreAliasPasswordEnv", name)
		}
	}
	for name, value := range configured {
		text, ok := value.(string)
		if !ok {
			return nil, fmt.Errorf("xplat.targets.android.signing.%s must be a string", name)
		}
		values[name] = text
	}
	return values, nil
}

func configuredOrFlag(flag *string, configured map[string]string, name string) string {
	if flag != nil && *flag != "" {
		return *flag
	}
	return configured[name]
}

func resolveEnvironmentSecret(reference, source string) (string, error) {
	if !environmentName.MatchString(reference) {
		return "", fmt.Errorf("%s expects an environment variable name, got %q — pass the variable name, never the password", source, reference)
	}
	secret, exists := os.LookupEnv(reference)
	if !exists || secret == "" {
		return "", fmt.Errorf("environment variable %s (from %s) is not set or empty", reference, source)
	}
	return secret, nil
}

func isNativeScriptTarget(platform string) bool {
	return platform == "ios" || platform == "android" || platform == "windows"
}

// resolveArtifactOptions merges flags over xplat.targets.android.signing,
// validates the selection/option combinations NativeScript would reject or
// silently ignore, and resolves signing secrets from their environment
// references. The returned plan holds resolved secrets in memory only.
func resolveArtifactOptions(values map[string]any, manifest map[string]any, selected []string, release bool) (plan nativeArtifactPlan, err error) {
	plan.aab, _ = values["aab"].(bool)
	plan.forDevice, _ = values["for-device"].(bool)
	plan.provision = routeArg(values, "provision")
	plan.teamID = routeArg(values, "team-id")
	plan.copyTo = routeArg(values, "copy-to")

	var configured map[string]string
	var configuredPresent bool
	configured, err = androidSigningConfig(manifest, &configuredPresent)
	if err != nil {
		return plan, err
	}
	plan.keyStorePath = configuredOrFlag(routes.OptionalString(values, "key-store-path"), configured, "keyStorePath")
	plan.keyStoreAlias = configuredOrFlag(routes.OptionalString(values, "key-store-alias"), configured, "keyStoreAlias")
	plan.keyStorePasswordEnv = configuredOrFlag(routes.OptionalString(values, "key-store-password-env"), configured, "keyStorePasswordEnv")
	plan.keyStoreAliasPasswordEnv = configuredOrFlag(routes.OptionalString(values, "key-store-alias-password-env"), configured, "keyStoreAliasPasswordEnv")

	signingFields := []string{plan.keyStorePath, plan.keyStoreAlias, plan.keyStorePasswordEnv, plan.keyStoreAliasPasswordEnv}
	signingCount := 0
	for _, field := range signingFields {
		if field != "" {
			signingCount++
		}
	}

	if !slices.Contains(selected, "android") {
		if plan.aab || signingCount > 0 {
			return plan, errors.New("--aab and Android signing options require the android build target")
		}
	}
	if !slices.Contains(selected, "ios") {
		if plan.forDevice || plan.provision != "" || plan.teamID != "" {
			return plan, errors.New("--for-device, --provision and --team-id require the ios build target")
		}
	}
	if plan.copyTo != "" && (len(selected) != 1 || !isNativeScriptTarget(selected[0])) {
		return plan, errors.New("--copy-to requires a single iOS, Android or Windows build target")
	}
	if signingCount == 0 {
		return plan, nil
	}
	if signingCount != 4 {
		missing := []string{}
		for _, field := range []struct{ flag, key, value string }{
			{"key-store-path", "keyStorePath", plan.keyStorePath},
			{"key-store-alias", "keyStoreAlias", plan.keyStoreAlias},
			{"key-store-password-env", "keyStorePasswordEnv", plan.keyStorePasswordEnv},
			{"key-store-alias-password-env", "keyStoreAliasPasswordEnv", plan.keyStoreAliasPasswordEnv},
		} {
			if field.value == "" {
				missing = append(missing, "--"+field.flag+" or signing."+field.key)
			}
		}
		return plan, fmt.Errorf("Android signing needs the complete keystore set; missing %s", strings.Join(missing, ", "))
	}
	if !release {
		return plan, errors.New("Android signing applies to release builds — add --release")
	}
	if plan.keyStorePassword, err = resolveEnvironmentSecret(plan.keyStorePasswordEnv, secretSource(values, configured, "key-store-password-env", "keyStorePasswordEnv")); err != nil {
		return plan, err
	}
	if plan.keyStoreAliasPassword, err = resolveEnvironmentSecret(plan.keyStoreAliasPasswordEnv, secretSource(values, configured, "key-store-alias-password-env", "keyStoreAliasPasswordEnv")); err != nil {
		return plan, err
	}
	return plan, nil
}

func secretSource(values map[string]any, configured map[string]string, flagName, key string) string {
	if flag := routes.OptionalString(values, flagName); flag != nil && *flag != "" {
		return "--" + flagName
	}
	return "xplat.targets.android.signing." + key
}

func routeArg(values map[string]any, name string) string {
	if value := routes.OptionalString(values, name); value != nil {
		return *value
	}
	return ""
}

// nativeScriptArgs builds the `ns build` arguments for one selected platform.
// Every secret argument index is recorded so renderings can redact them.
func (p nativeArtifactPlan) nativeScriptArgs(platform string, release bool) (args []string, secrets map[int]bool) {
	args = []string{platform}
	secrets = map[int]bool{}
	if release {
		args = append(args, "--release")
	}
	switch platform {
	case "android":
		if p.aab {
			args = append(args, "--aab")
		}
		if p.keyStorePath != "" {
			args = append(args, "--key-store-path", p.keyStorePath, "--key-store-password")
			secrets[len(args)] = true
			args = append(args, p.keyStorePassword, "--key-store-alias", p.keyStoreAlias, "--key-store-alias-password")
			secrets[len(args)] = true
			args = append(args, p.keyStoreAliasPassword)
		}
	case "ios":
		if p.forDevice {
			args = append(args, "--for-device")
		}
		if p.provision != "" {
			args = append(args, "--provision", p.provision)
		}
		if p.teamID != "" {
			args = append(args, "--team-id", p.teamID)
		}
	}
	if p.copyTo != "" {
		args = append(args, "--copy-to", p.copyTo)
	}
	return args, secrets
}

func redactedArgs(args []string, secrets map[int]bool) []string {
	shown := slices.Clone(args)
	for index := range secrets {
		shown[index] = "[redacted]"
	}
	return shown
}

func artifactKind(platform string, plan nativeArtifactPlan) (label, extension string) {
	switch platform {
	case "android":
		if plan.aab {
			return "Android App Bundle", ".aab"
		}
		return "Android APK", ".apk"
	case "ios":
		if plan.forDevice {
			return "iOS device package", ".ipa"
		}
		return "iOS simulator app", ".app"
	}
	return "", ""
}

// newestUnder returns the most recently modified entry matching want beneath
// dir. Directories match only when wanted (for .app bundles).
func newestUnder(dir string, want func(name string, dir bool) bool) string {
	best := ""
	bestTime := int64(-1)
	_ = filepath.WalkDir(dir, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if path == dir || !want(entry.Name(), entry.IsDir()) {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return nil
		}
		if stamp := info.ModTime().UnixNano(); stamp > bestTime {
			best, bestTime = path, stamp
		}
		return nil
	})
	return best
}

// nativeArtifact locates the produced store artifact. A --copy-to destination
// is preferred; otherwise the platform's NativeScript output directory is
// scanned for the newest matching artifact.
func nativeArtifact(projectRoot, platform string, plan nativeArtifactPlan) (string, string) {
	label, extension := artifactKind(platform, plan)
	if label == "" {
		return "", ""
	}
	matches := func(name string, dir bool) bool {
		if extension == ".app" {
			return dir && strings.HasSuffix(name, extension)
		}
		return !dir && strings.HasSuffix(name, extension)
	}
	if plan.copyTo != "" {
		target := plan.copyTo
		if !filepath.IsAbs(target) {
			target = filepath.Join(projectRoot, target)
		}
		if info, err := os.Stat(target); err == nil {
			if !info.IsDir() {
				return target, label
			}
			if found := newestUnder(target, matches); found != "" {
				return found, label
			}
		}
	}
	var searchRoot string
	switch platform {
	case "android":
		searchRoot = filepath.Join(projectRoot, "platforms", "android")
	case "ios":
		searchRoot = filepath.Join(projectRoot, "platforms", "ios", "build")
	}
	if searchRoot == "" {
		return "", label
	}
	if found := newestUnder(searchRoot, matches); found != "" {
		return found, label
	}
	return "", label
}
