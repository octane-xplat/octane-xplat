package build

import (
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestAndroidStoreArgsForwardSigningAndArtifactOptions(t *testing.T) {
	t.Setenv("FIXTURE_STORE_PW", "store-secret π")
	t.Setenv("FIXTURE_KEY_PW", "key-secret π")
	values := map[string]any{
		"aab":                          true,
		"key-store-path":               "keys/upload.jks",
		"key-store-alias":              "upload",
		"key-store-password-env":       "FIXTURE_STORE_PW",
		"key-store-alias-password-env": "FIXTURE_KEY_PW",
		"copy-to":                      "dist/app-release.aab",
	}
	plan, err := resolveArtifactOptions(values, nil, []string{"android"}, true)
	if err != nil {
		t.Fatal(err)
	}
	args, secrets := plan.nativeScriptArgs("android", true)
	want := []string{"android", "--release", "--aab", "--key-store-path", "keys/upload.jks", "--key-store-password", "store-secret π", "--key-store-alias", "upload", "--key-store-alias-password", "key-secret π", "--copy-to", "dist/app-release.aab"}
	if !slices.Equal(args, want) {
		t.Fatalf("args %v", args)
	}
	rendered := strings.Join(redactedArgs(args, secrets), " ")
	if strings.Contains(rendered, "store-secret π") || strings.Contains(rendered, "key-secret π") {
		t.Fatalf("secret leaked into rendering: %s", rendered)
	}
	if strings.Count(rendered, "[redacted]") != 2 {
		t.Fatalf("redaction markers missing: %s", rendered)
	}
}

func TestIosDistributionArgsForward(t *testing.T) {
	values := map[string]any{
		"for-device": true,
		"provision":  "Packing App Store",
		"team-id":    "TEAM123456",
		"copy-to":    "dist/packing.ipa",
	}
	plan, err := resolveArtifactOptions(values, nil, []string{"ios"}, true)
	if err != nil {
		t.Fatal(err)
	}
	args, secrets := plan.nativeScriptArgs("ios", true)
	want := []string{"ios", "--release", "--for-device", "--provision", "Packing App Store", "--team-id", "TEAM123456", "--copy-to", "dist/packing.ipa"}
	if !slices.Equal(args, want) {
		t.Fatalf("args %v", args)
	}
	if len(secrets) != 0 {
		t.Fatalf("ios arguments have no secrets: %v", secrets)
	}
}

func TestArtifactOptionTargetValidation(t *testing.T) {
	cases := []struct {
		name     string
		values   map[string]any
		manifest map[string]any
		selected []string
		release  bool
		want     string
	}{
		{"aab without android", map[string]any{"aab": true}, nil, []string{"ios"}, true, "android"},
		{"signing without android", map[string]any{"key-store-alias": "upload"}, nil, []string{"web"}, true, "android"},
		{"for-device without ios", map[string]any{"for-device": true}, nil, []string{"android"}, true, "ios"},
		{"provision without ios", map[string]any{"provision": "P"}, nil, []string{"android"}, true, "ios"},
		{"team-id without ios", map[string]any{"team-id": "T"}, nil, []string{"web"}, true, "ios"},
		{"copy-to needs one target", map[string]any{"copy-to": "dist/a"}, nil, []string{"ios", "android"}, true, "single"},
		{"copy-to rejects web", map[string]any{"copy-to": "dist/a"}, nil, []string{"web"}, true, "single"},
		{"copy-to rejects macos", map[string]any{"copy-to": "dist/a"}, nil, []string{"macos"}, true, "single"},
		{
			"partial signing",
			map[string]any{"key-store-path": "k", "key-store-alias": "a"},
			nil, []string{"android"}, true, "missing",
		},
		{
			"signing needs release",
			map[string]any{"key-store-path": "k", "key-store-alias": "a", "key-store-password-env": "E1", "key-store-alias-password-env": "E2"},
			nil, []string{"android"}, false, "--release",
		},
		{
			"invalid env name",
			map[string]any{"key-store-path": "k", "key-store-alias": "a", "key-store-password-env": "1 BAD", "key-store-alias-password-env": "E2"},
			nil, []string{"android"}, true, "environment variable name",
		},
		{
			"unset env var",
			map[string]any{"key-store-path": "k", "key-store-alias": "a", "key-store-password-env": "FIXTURE_UNSET_SECRET", "key-store-alias-password-env": "E2"},
			nil, []string{"android"}, true, "FIXTURE_UNSET_SECRET",
		},
		{
			"persisted secret refused",
			nil,
			map[string]any{"xplat": map[string]any{"targets": map[string]any{"android": map[string]any{"signing": map[string]any{"keyStorePassword": "hunter2"}}}}},
			[]string{"android"}, true, "persisted configuration",
		},
		{
			"unknown signing key",
			nil,
			map[string]any{"xplat": map[string]any{"targets": map[string]any{"android": map[string]any{"signing": map[string]any{"keystore": "x"}}}}},
			[]string{"android"}, true, "unknown",
		},
		{
			"non-string signing value",
			nil,
			map[string]any{"xplat": map[string]any{"targets": map[string]any{"android": map[string]any{"signing": map[string]any{"keyStorePath": 7.0}}}}},
			[]string{"android"}, true, "must be a string",
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			_, err := resolveArtifactOptions(c.values, c.manifest, c.selected, c.release)
			if err == nil || !strings.Contains(err.Error(), c.want) {
				t.Fatalf("error %v — want substring %q", err, c.want)
			}
		})
	}
}

func TestSigningConfigMergesAndFlagsOverride(t *testing.T) {
	t.Setenv("CFG_STORE_PW", "cfg-secret")
	t.Setenv("CFG_KEY_PW", "cfg-key-secret")
	manifest := map[string]any{"xplat": map[string]any{"targets": map[string]any{"android": map[string]any{"signing": map[string]any{
		"keyStorePath":             "keys/from-config.jks",
		"keyStoreAlias":            "cfg-alias",
		"keyStorePasswordEnv":      "CFG_STORE_PW",
		"keyStoreAliasPasswordEnv": "CFG_KEY_PW",
	}}}}}
	plan, err := resolveArtifactOptions(map[string]any{"key-store-path": "keys/flag.jks"}, manifest, []string{"android"}, true)
	if err != nil {
		t.Fatal(err)
	}
	args, _ := plan.nativeScriptArgs("android", true)
	want := []string{"android", "--release", "--key-store-path", "keys/flag.jks", "--key-store-password", "cfg-secret", "--key-store-alias", "cfg-alias", "--key-store-alias-password", "cfg-key-secret"}
	if !slices.Equal(args, want) {
		t.Fatalf("args %v", args)
	}
}

func TestConfigEnvSourceIsNamed(t *testing.T) {
	manifest := map[string]any{"xplat": map[string]any{"targets": map[string]any{"android": map[string]any{"signing": map[string]any{
		"keyStorePath":             "k",
		"keyStoreAlias":            "a",
		"keyStorePasswordEnv":      "FIXTURE_MISSING_A",
		"keyStoreAliasPasswordEnv": "FIXTURE_MISSING_B",
	}}}}}
	_, err := resolveArtifactOptions(nil, manifest, []string{"android"}, true)
	if err == nil || !strings.Contains(err.Error(), "signing.keyStorePasswordEnv") {
		t.Fatalf("error %v names the config source", err)
	}
}

func TestCopyToAloneIsAccepted(t *testing.T) {
	plan, err := resolveArtifactOptions(map[string]any{"copy-to": "out/app.ipa"}, nil, []string{"ios"}, false)
	if err != nil {
		t.Fatal(err)
	}
	args, _ := plan.nativeScriptArgs("ios", false)
	if !slices.Equal(args, []string{"ios", "--copy-to", "out/app.ipa"}) {
		t.Fatalf("args %v", args)
	}
}

func writeArtifact(t *testing.T, path string, dir bool) {
	t.Helper()
	if dir {
		if err := os.MkdirAll(path, 0755); err != nil {
			t.Fatal(err)
		}
		return
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte("artifact"), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestNativeArtifactLocatesAndroidOutputs(t *testing.T) {
	root := t.TempDir()
	aab := filepath.Join(root, "platforms", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab")
	writeArtifact(t, aab, false)
	writeArtifact(t, filepath.Join(root, "platforms", "android", "app", "build", "outputs", "apk", "release", "app-release.apk"), false)
	path, kind := nativeArtifact(root, "android", nativeArtifactPlan{aab: true})
	if path != aab || kind != "Android App Bundle" {
		t.Fatalf("%q %q", path, kind)
	}
	path, kind = nativeArtifact(root, "android", nativeArtifactPlan{})
	if !strings.HasSuffix(path, ".apk") || kind != "Android APK" {
		t.Fatalf("%q %q", path, kind)
	}
}

func TestNativeArtifactLocatesIosOutputs(t *testing.T) {
	root := t.TempDir()
	ipa := filepath.Join(root, "platforms", "ios", "build", "Release-iphoneos", "Packing.ipa")
	writeArtifact(t, ipa, false)
	writeArtifact(t, filepath.Join(root, "platforms", "ios", "build", "Debug-iphonesimulator", "Packing.app"), true)
	path, kind := nativeArtifact(root, "ios", nativeArtifactPlan{forDevice: true})
	if path != ipa || kind != "iOS device package" {
		t.Fatalf("%q %q", path, kind)
	}
	path, kind = nativeArtifact(root, "ios", nativeArtifactPlan{})
	if !strings.HasSuffix(path, ".app") || kind != "iOS simulator app" {
		t.Fatalf("%q %q", path, kind)
	}
}

func TestNativeArtifactPrefersCopyToDestination(t *testing.T) {
	root := t.TempDir()
	target := filepath.Join(root, "dist", "packing.aab")
	writeArtifact(t, target, false)
	path, kind := nativeArtifact(root, "android", nativeArtifactPlan{aab: true, copyTo: "dist/packing.aab"})
	if path != target || kind != "Android App Bundle" {
		t.Fatalf("%q %q", path, kind)
	}
	dir := filepath.Join(root, "dist")
	writeArtifact(t, filepath.Join(dir, "app-release.apk"), false)
	path, _ = nativeArtifact(root, "android", nativeArtifactPlan{copyTo: "dist"})
	if !strings.HasSuffix(path, "app-release.apk") {
		t.Fatalf("%q", path)
	}
}
