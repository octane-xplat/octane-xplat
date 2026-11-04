package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"testing"
	"time"
)

func TestDevTargetSelection(t *testing.T) {
	yes, no := true, false
	all := []devTarget{{Kind: "web", ID: "web"}, {Kind: "ios", ID: "sim-2", Device: "sim-2", Booted: &no}, {Kind: "ios", ID: "sim-1", Device: "sim-1", Booted: &yes}, {Kind: "android", ID: "physical", Device: "physical"}}
	ptr := func(s string) *string { return &s }
	for _, test := range []struct {
		name   string
		choice devSelection
		ids    []string
		bad    bool
	}{
		{"noninteractive all", devSelection{}, []string{"web", "sim-2", "sim-1", "physical"}, false},
		{"single kind prefers one booted", devSelection{Target: ptr("ios")}, []string{"sim-1"}, false},
		{"multi kind includes every device", devSelection{Targets: ptr("ios")}, []string{"sim-2", "sim-1"}, false},
		{"exact device", devSelection{Device: ptr("sim-2")}, []string{"sim-2"}, false},
		{"kind and device", devSelection{Target: ptr("ios"), Device: ptr("sim-2")}, []string{"sim-2"}, false},
		{"conflicting kind", devSelection{Target: ptr("android"), Device: ptr("sim-2")}, nil, true},
		{"empty device", devSelection{Device: ptr("  ")}, nil, true},
		{"mixed selectors", devSelection{Target: ptr("web"), Targets: ptr("ios")}, nil, true},
		{"none detected for kind", devSelection{Targets: ptr("linux")}, nil, true},
		{"unavailable multi kind does not hide a detected kind", devSelection{Targets: ptr(" web,linux ")}, []string{"web"}, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			selected, err := selectDevTargets(all, test.choice)
			if (err != nil) != test.bad {
				t.Fatalf("%v", err)
			}
			if test.bad {
				return
			}
			ids := []string{}
			for _, v := range selected {
				ids = append(ids, v.ID)
			}
			if !reflect.DeepEqual(ids, test.ids) {
				t.Fatalf("%v != %v", ids, test.ids)
			}
		})
	}
	all[1].Booted = &yes
	if _, err := selectDevTargets(all, devSelection{Target: ptr("ios")}); err == nil {
		t.Fatal("multiple booted simulators must remain ambiguous")
	}
}

// Exercise the actual Node target parsers with recorded tool-shaped data. Only
// the external SDK query is replaced; no copy of the reference parser is used.
func TestDevTargetParsersAgainstNode(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	source, err := filepath.Abs("../src/targets.ts")
	if err != nil {
		t.Fatal(err)
	}
	ios := `{"devices":{"runtime-2":[{"udid":"cold-a","name":"Phone A","state":"Shutdown","isAvailable":true},{"udid":"unavailable","name":"Phone","state":"Booted","isAvailable":false}],"runtime-1":[{"udid":"booted","name":"Phone B π","state":"Booted","isAvailable":true},{"udid":"cold-b","name":"Phone C","state":"Shutdown","isAvailable":true}]}}`
	android := "List of devices attached\r\nemulator-5554\tdevice\r\nphysical-π\tdevice\r\noffline-id\toffline\r\nunauthorized-id\tunauthorized\r\n\r\n"
	for _, data := range []struct{ ios, android string }{{ios, android}, {`not JSON`, ""}, {`{"devices":{}}`, "List of devices attached\n"}} {
		request, _ := json.Marshal(map[string]string{"ios": data.ios, "android": data.android})
		command := exec.Command(node, "--input-type=module", "-e", `import cp from 'node:child_process';import{syncBuiltinESMExports}from'node:module';import{pathToFileURL}from'node:url';const input=JSON.parse(process.env.XPLAT_DEV_TARGET_FIXTURE);cp.execFileSync=(cmd)=>cmd==='xcrun'?input.ios:input.android;syncBuiltinESMExports();const api=await import(pathToFileURL(process.argv[1]).href);console.log(JSON.stringify({ios:api.iosTargets(),android:api.androidTargets()}));`, source)
		command.Env = append(os.Environ(), "NODE_OPTIONS=", "NODE_PATH=", "XPLAT_DEV_TARGET_FIXTURE="+string(request))
		output, err := command.CombinedOutput()
		if err != nil {
			t.Fatalf("%v: %s", err, output)
		}
		var expected struct{ IOS, Android []devTarget }
		if err = json.Unmarshal(output, &expected); err != nil {
			t.Fatal(err)
		}
		actualIOS, actualAndroid := iosDevTargets([]byte(data.ios)), androidDevTargets(data.android)
		if !reflect.DeepEqual(actualIOS, expected.IOS) || !reflect.DeepEqual(actualAndroid, expected.Android) {
			t.Fatalf("native=%+v/%+v reference=%+v/%+v", actualIOS, actualAndroid, expected.IOS, expected.Android)
		}
	}
}

func TestDevDiscoveryAgainstActualHostReference(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	source, _ := filepath.Abs("../src/targets.ts")
	root := t.TempDir()
	manifest := `{"name":"dev-discovery","dependencies":{"@nativescript/ios":"1","@nativescript/android":"1","@nativescript/windows":"1"},"xplat":{"targets":{"macos":{"runtime":"appkit-node-api"},"linux":{"runtime":"gtk"}}}}`
	for file, data := range map[string]string{"package.json": manifest, "vite.config.mts": "throw Error('discovery must not execute configuration')", "nativescript.config.ts": "throw Error('discovery must not execute configuration')"} {
		if err := os.WriteFile(filepath.Join(root, file), []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	actual, err := discoverDevTargets(ctx, root)
	if err != nil {
		t.Fatal(err)
	}
	command := exec.CommandContext(ctx, node, "--input-type=module", "-e", `import{pathToFileURL}from'node:url';const api=await import(pathToFileURL(process.argv[1]).href);console.log(JSON.stringify(api.discoverTargets(process.argv[2])));`, source, root)
	output, err := command.CombinedOutput()
	if err != nil {
		t.Fatalf("%v: %s", err, output)
	}
	var expected []devTarget
	if err = json.Unmarshal(output, &expected); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(actual, expected) {
		a, _ := json.Marshal(actual)
		b, _ := json.Marshal(expected)
		t.Fatalf("native=%s reference=%s", a, b)
	}
	cancel()
	if _, err := discoverDevTargets(ctx, root); err == nil {
		t.Fatal("cancelled discovery succeeded")
	}
}

func TestDevDiscoveryWithoutProjectRuntime(t *testing.T) {
	root := t.TempDir()
	for file, data := range map[string]string{"package.json": `{"name":"native-discovery","dependencies":{"@nativescript/ios":"1","@nativescript/android":"1","@nativescript/windows":"1"}}`, "vite.config.cts": "throw Error('never execute')", "nativescript.config.ts": "throw Error('never execute')"} {
		if err := os.WriteFile(filepath.Join(root, file), []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("PATH", "")
	targets, err := discoverDevTargets(context.Background(), root)
	if err != nil {
		t.Fatal(err)
	}
	kinds := []string{}
	for _, target := range targets {
		kinds = append(kinds, target.Kind)
	}
	if !reflect.DeepEqual(kinds, []string{"web", "windows"}) {
		t.Fatalf("discovery without SDKs/Node: %v", kinds)
	}
	if err := os.WriteFile(filepath.Join(root, "package.json"), []byte("malformed"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := discoverDevTargets(context.Background(), root); err == nil {
		t.Fatal("malformed manifest must be actionable")
	}
}
