package dev

import (
	"context"
	"encoding/json"
	"github.com/octane-xplat/octane-xplat/packages/cli/go/internal/proc"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestDevTargetSelection(t *testing.T) {
	yes, no := true, false
	all := []devTarget{{Kind: "web", ID: "web"}, {Kind: "ios", ID: "sim-2", Device: "sim-2", Booted: &no}, {Kind: "ios", ID: "sim-1", Device: "sim-1", Booted: &yes}, {Kind: "android", ID: "physical", Device: "physical"}, {Kind: "ios", ID: "phone-ok", Name: "Phone OK (device)", Device: "phone-ok", Physical: true}, {Kind: "ios", ID: "phone-locked", Name: "Phone Locked (device)", Device: "phone-locked", Physical: true, Unavailable: "locked; unlock the device"}}
	ptr := func(s string) *string { return &s }
	for _, test := range []struct {
		name   string
		choice devSelection
		ids    []string
		bad    bool
		msg    string
	}{
		{"noninteractive all", devSelection{}, []string{"web", "sim-2", "sim-1", "physical", "phone-ok"}, false, ""},
		{"single kind prefers one booted", devSelection{Target: ptr("ios")}, []string{"sim-1"}, false, ""},
		{"multi kind includes every usable device", devSelection{Targets: ptr("ios")}, []string{"sim-2", "sim-1", "phone-ok"}, false, ""},
		{"exact device", devSelection{Device: ptr("sim-2")}, []string{"sim-2"}, false, ""},
		{"exact physical device", devSelection{Device: ptr("phone-ok")}, []string{"phone-ok"}, false, ""},
		{"exact unusable device", devSelection{Device: ptr("phone-locked")}, nil, true, "locked; unlock the device"},
		{"unusable id selector", devSelection{Target: ptr("phone-locked")}, nil, true, "locked; unlock the device"},
		{"kind and device", devSelection{Target: ptr("ios"), Device: ptr("sim-2")}, []string{"sim-2"}, false, ""},
		{"conflicting kind", devSelection{Target: ptr("android"), Device: ptr("sim-2")}, nil, true, ""},
		{"empty device", devSelection{Device: ptr("  ")}, nil, true, ""},
		{"mixed selectors", devSelection{Target: ptr("web"), Targets: ptr("ios")}, nil, true, ""},
		{"none detected for kind", devSelection{Targets: ptr("linux")}, nil, true, ""},
		{"unavailable multi kind does not hide a detected kind", devSelection{Targets: ptr(" web,linux ")}, []string{"web"}, false, ""},
	} {
		t.Run(test.name, func(t *testing.T) {
			selected, err := selectDevTargets(all, test.choice)
			if (err != nil) != test.bad {
				t.Fatalf("%v", err)
			}
			if test.bad {
				if test.msg != "" && !strings.Contains(err.Error(), test.msg) {
					t.Fatalf("expected %q in %v", test.msg, err)
				}
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
	source, err := filepath.Abs("../../../src/targets.ts")
	if err != nil {
		t.Fatal(err)
	}
	ios := `{"devices":{"runtime-2":[{"udid":"cold-a","name":"Phone A","state":"Shutdown","isAvailable":true},{"udid":"unavailable","name":"Phone","state":"Booted","isAvailable":false}],"runtime-1":[{"udid":"booted","name":"Phone B π","state":"Booted","isAvailable":true},{"udid":"cold-b","name":"Phone C","state":"Shutdown","isAvailable":true}]}}`
	android := "List of devices attached\r\nemulator-5554\tdevice\r\nphysical-π\tdevice\r\noffline-id\toffline\r\nunauthorized-id\tunauthorized\r\n\r\n"
	devicectl := `{"result":{"devices":[` +
		`{"identifier":"core-uuid-ok","hardwareProperties":{"reality":"physical","platform":"iOS","deviceType":"iPhone","udid":"udid-ok","marketingName":"iPhone 16"},"deviceProperties":{"name":"Good Phone","bootState":"booted","developerModeStatus":"enabled"},"connectionProperties":{"pairingState":"paired","transportType":"wired"}},` +
		`{"identifier":"core-uuid-locked","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-locked"},"deviceProperties":{"name":"Locked Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired","transportType":"wired"}},` +
		`{"identifier":"core-uuid-away","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-away"},"deviceProperties":{"name":"Away Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}},` +
		`{"identifier":"core-uuid-unpaired","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-unpaired"},"deviceProperties":{"name":"Untrusted Phone","bootState":"booted"},"connectionProperties":{"pairingState":"unpaired"}},` +
		`{"identifier":"core-uuid-dup-net","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-dup"},"deviceProperties":{"name":"Dup Phone","bootState":"booted"},"connectionProperties":{"pairingState":"unpaired","transportType":"localNetwork"}},` +
		`{"identifier":"core-uuid-dup-usb","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-dup"},"deviceProperties":{"name":"Dup Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired","transportType":"wired"}},` +
		`{"identifier":"core-uuid-sim","hardwareProperties":{"reality":"simulated","platform":"iOS"},"deviceProperties":{"name":"Sim Listed"},"connectionProperties":{"pairingState":"paired","transportType":"sameMachine"}},` +
		`{"identifier":"core-uuid-watch","hardwareProperties":{"reality":"physical","platform":"watchOS","deviceType":"appleWatch"},"deviceProperties":{"name":"Watch"},"connectionProperties":{"pairingState":"paired"}}` +
		`]}}`
	lock := `{"udid-ok":"{\"result\":{\"passcodeRequired\":false,\"unlockedSinceBoot\":true}}","udid-locked":"{\"result\":{\"passcodeRequired\":true,\"unlockedSinceBoot\":true}}","udid-dup":"{\"result\":{\"passcodeRequired\":false}}"}`
	for _, data := range []struct{ ios, android, devicectl, lock string }{{ios, android, devicectl, lock}, {`not JSON`, "", `{"result":{"devices":[]}}`, ""}, {`{"devices":{}}`, "List of devices attached\n", `{"result":{"devices":[]}}`, ""}} {
		request, _ := json.Marshal(map[string]string{"ios": data.ios, "android": data.android, "devicectl": data.devicectl, "lock": data.lock})
		command := exec.Command(node, "--input-type=module", "-e", `import cp from 'node:child_process';import{syncBuiltinESMExports}from'node:module';import{pathToFileURL}from'node:url';const input=JSON.parse(process.env.XPLAT_DEV_TARGET_FIXTURE);const locks=JSON.parse(input.lock||'{}');cp.execFileSync=(cmd,args)=>{if(cmd==='adb')return input.android;if(cmd==='xcrun'&&args&&args[0]==='devicectl'){if(args[1]==='list')return input.devicectl??'';if(args[1]==='device')return locks[args[args.indexOf('--device')+1]]??'';return ''}return cmd==='xcrun'?input.ios:''};syncBuiltinESMExports();const api=await import(pathToFileURL(process.argv[1]).href);console.log(JSON.stringify({ios:api.iosTargets(),android:api.androidTargets()}));`, source)
		command.Env = append(os.Environ(), "NODE_OPTIONS=", "NODE_PATH=", "XPLAT_DEV_TARGET_FIXTURE="+string(request))
		output := testNodeOutput(t, context.Background(), command)
		var expected struct{ IOS, Android []devTarget }
		if err = json.Unmarshal(output, &expected); err != nil {
			t.Fatal(err)
		}
		locks := map[string]string{}
		if data.lock != "" {
			if err := json.Unmarshal([]byte(data.lock), &locks); err != nil {
				t.Fatal(err)
			}
		}
		physical, err := iosPhysicalDevTargets([]byte(data.devicectl), func(id string) (bool, bool, error) {
			return iosDeviceLockState(locks[id])
		})
		if err != nil {
			t.Fatal(err)
		}
		actualIOS, actualAndroid := append(iosDevTargets([]byte(data.ios)), physical...), androidDevTargets(data.android)
		if !reflect.DeepEqual(actualIOS, expected.IOS) || !reflect.DeepEqual(actualAndroid, expected.Android) {
			t.Fatalf("native=%+v/%+v reference=%+v/%+v", actualIOS, actualAndroid, expected.IOS, expected.Android)
		}
	}
}

// A stub xcrun keeps devicectl answers deterministic and keeps discovery off
// real hardware; every other tool is delegated so simulator/adb coverage
// stays honest. Physical phones are never enumerated by tests.
func writeXcrunStub(t *testing.T, list, locked, away string) string {
	t.Helper()
	dir := t.TempDir()
	stub := `#!/bin/sh
if [ "$1" = "devicectl" ] && [ "$2" = "list" ]; then
  printf '%s' "$XPLAT_DEVICECTL_LIST"
  exit 0
fi
if [ "$1" = "devicectl" ] && [ "$2" = "device" ]; then
  case " $* " in
    *" ` + locked + ` "*) printf '%s' '{"result":{"deviceIdentifier":"` + locked + `","passcodeRequired":true,"unlockedSinceBoot":true}}' ;;
    *" ` + away + ` "*) exit 1 ;;
    *) printf '%s' '{"result":{"passcodeRequired":false,"unlockedSinceBoot":true}}' ;;
  esac
  exit 0
fi
if [ -x /usr/bin/xcrun ]; then
  exec /usr/bin/xcrun "$@"
fi
exit 0
`
	if err := os.WriteFile(filepath.Join(dir, "xcrun"), []byte(stub), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("XPLAT_DEVICECTL_LIST", list)
	t.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
	return dir
}

func TestDevDiscoveryAgainstActualHostReference(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("Node unavailable")
	}
	source, _ := filepath.Abs("../../../src/targets.ts")
	writeXcrunStub(t, `{"result":{"devices":[{"identifier":"core-uuid-host","hardwareProperties":{"reality":"physical","platform":"iOS","deviceType":"iPhone","udid":"udid-host","marketingName":"iPhone"},"deviceProperties":{"name":"Host Phone","bootState":"booted","developerModeStatus":"enabled"},"connectionProperties":{"pairingState":"paired","transportType":"wired"}},{"identifier":"core-uuid-locked","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-locked"},"deviceProperties":{"name":"Locked Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}},{"identifier":"core-uuid-away","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-away"},"deviceProperties":{"name":"Away Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}},{"identifier":"core-uuid-watch","hardwareProperties":{"reality":"physical","platform":"watchOS","deviceType":"appleWatch"},"deviceProperties":{"name":"Watch"},"connectionProperties":{"pairingState":"paired"}}]}}`, "udid-locked", "udid-away")
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
	output := testNodeOutput(t, ctx, command)
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

// Recorded stub answers prove the real probe argv and the full
// enumerate→select mapping for physical iPhones without hardware.
func TestDevDiscoveryPhysicalCommands(t *testing.T) {
	dir := t.TempDir()
	log := filepath.Join(dir, "xcrun.log")
	list := `{"result":{"devices":[` +
		`{"identifier":"core-uuid-ok","hardwareProperties":{"reality":"physical","platform":"iOS","deviceType":"iPhone","udid":"udid-ok","marketingName":"iPhone"},"deviceProperties":{"name":"Good Phone","bootState":"booted","developerModeStatus":"enabled"},"connectionProperties":{"pairingState":"paired","transportType":"wired"}},` +
		`{"identifier":"core-uuid-locked","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-locked"},"deviceProperties":{"name":"Locked Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}},` +
		`{"identifier":"core-uuid-unpaired","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-unpaired"},"deviceProperties":{"name":"Untrusted Phone","bootState":"booted"},"connectionProperties":{"pairingState":"unpaired"}},` +
		`{"identifier":"core-uuid-devmode","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-devmode"},"deviceProperties":{"name":"DevMode Phone","bootState":"booted","developerModeStatus":"disabled"},"connectionProperties":{"pairingState":"paired"}},` +
		`{"identifier":"core-uuid-sim","hardwareProperties":{"reality":"simulated","platform":"iOS"},"deviceProperties":{"name":"Listed Sim"},"connectionProperties":{"pairingState":"paired","transportType":"sameMachine"}}` +
		`]}}`
	stub := `#!/bin/sh
printf '%s\n' "$*" >> "` + log + `"
if [ "$1" = "simctl" ]; then
  printf '%s' '{"devices":{"runtime":[{"udid":"sim-1","name":"Sim One","state":"Booted","isAvailable":true}]}}'
  exit 0
fi
if [ "$1" = "devicectl" ] && [ "$2" = "list" ]; then
  printf '%s' "$XPLAT_DEVICECTL_LIST"
  exit 0
fi
if [ "$1" = "devicectl" ] && [ "$2" = "device" ]; then
  case " $* " in
    *" udid-locked "*) printf '%s' '{"result":{"passcodeRequired":true,"unlockedSinceBoot":true}}' ;;
    *) printf '%s' '{"result":{"passcodeRequired":false,"unlockedSinceBoot":true}}' ;;
  esac
  exit 0
fi
exit 0
`
	if err := os.WriteFile(filepath.Join(dir, "xcrun"), []byte(stub), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("XPLAT_DEVICECTL_LIST", list)
	t.Setenv("PATH", dir+string(os.PathListSeparator)+os.Getenv("PATH"))
	root := t.TempDir()
	for file, data := range map[string]string{"package.json": `{"name":"physical-discovery","dependencies":{"@nativescript/ios":"1"}}`, "nativescript.config.ts": "throw Error('never execute')"} {
		if err := os.WriteFile(filepath.Join(root, file), []byte(data), 0600); err != nil {
			t.Fatal(err)
		}
	}
	targets, err := discoverDevTargets(context.Background(), root)
	if err != nil {
		t.Fatal(err)
	}
	commands, err := os.ReadFile(log)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{
		"simctl list devices available -j",
		"devicectl list devices --json-output -",
		"devicectl device info lockState --device udid-ok --json-output -",
		"devicectl device info lockState --device udid-locked --json-output -",
	}
	if strings.TrimSpace(string(commands)) != strings.Join(want, "\n") {
		t.Fatalf("probe argv: %q", commands)
	}
	booted := true
	expected := []devTarget{
		{Kind: "ios", ID: "sim-1", Name: "Sim One (booted)", Device: "sim-1", Booted: &booted},
		{Kind: "ios", ID: "udid-ok", Name: "Good Phone (device)", Device: "udid-ok", Physical: true},
		{Kind: "ios", ID: "udid-locked", Name: "Locked Phone (device)", Device: "udid-locked", Physical: true, Unavailable: "locked; unlock the device"},
		{Kind: "ios", ID: "udid-unpaired", Name: "Untrusted Phone (device)", Device: "udid-unpaired", Physical: true, Unavailable: "not paired; trust this computer on the device"},
		{Kind: "ios", ID: "udid-devmode", Name: "DevMode Phone (device)", Device: "udid-devmode", Physical: true, Unavailable: "Developer Mode is disabled"},
	}
	if !reflect.DeepEqual(targets, expected) {
		t.Fatalf("%+v", targets)
	}
	for _, test := range []struct {
		device, reason string
		usable         bool
	}{
		{"udid-ok", "", true},
		{"udid-locked", "locked; unlock the device", false},
		{"udid-unpaired", "not paired", false},
		{"udid-devmode", "Developer Mode", false},
	} {
		selected, err := selectDevTargets(targets, devSelection{Device: &test.device})
		if (err == nil) != test.usable {
			t.Fatalf("%s: %v", test.device, err)
		}
		if !test.usable && !strings.Contains(err.Error(), test.reason) {
			t.Fatalf("%s: %v", test.device, err)
		}
		if test.usable && !reflect.DeepEqual(selected, []devTarget{expected[1]}) {
			t.Fatalf("%s: %+v", test.device, selected)
		}
	}
}

func TestDevPhysicalDeviceResults(t *testing.T) {
	unreachable := func(string) (bool, bool, error) { return false, false, nil }
	unlocked := func(string) (bool, bool, error) { return true, false, nil }
	usable := `{"result":{"devices":[{"identifier":"uuid-1","hardwareProperties":{"reality":"physical","platform":"iOS","udid":"udid-1"},"deviceProperties":{"name":"Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}}]}}`
	for _, test := range []struct {
		name    string
		list    string
		lock    iosLockProbe
		targets int
		reason  string
	}{
		{"empty output", "", unreachable, 0, ""},
		{"empty list", `{"result":{"devices":[]}}`, unreachable, 0, ""},
		{"malformed list", `not JSON`, unreachable, 0, "malformed devicectl device list"},
		{"missing identity", `{"result":{"devices":[{"deviceProperties":{"name":"Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}}]}}`, unreachable, 0, "no identifier"},
		{"unreachable probe", usable, unreachable, 1, "unavailable"},
		{"identifier fallback", `{"result":{"devices":[{"identifier":"uuid-fallback","deviceProperties":{"name":"Phone","bootState":"booted"},"connectionProperties":{"pairingState":"paired"}}]}}`, unlocked, 1, ""},
	} {
		t.Run(test.name, func(t *testing.T) {
			targets, err := iosPhysicalDevTargets([]byte(test.list), test.lock)
			if test.reason == "malformed devicectl device list" || test.reason == "no identifier" {
				if err == nil {
					t.Fatal("expected explicit error")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if len(targets) != test.targets {
				t.Fatalf("%+v", targets)
			}
			if test.reason != "" && !strings.Contains(targets[0].Unavailable, test.reason) {
				t.Fatalf("%+v", targets[0])
			}
			if test.name == "identifier fallback" && targets[0].ID != "uuid-fallback" {
				t.Fatalf("%+v", targets[0])
			}
		})
	}
	for _, test := range []struct {
		name      string
		output    string
		reachable bool
		locked    bool
		bad       bool
	}{
		{"unreachable", "", false, false, false},
		{"unlocked", `{"result":{"passcodeRequired":false,"unlockedSinceBoot":true}}`, true, false, false},
		{"locked", `{"result":{"passcodeRequired":true,"unlockedSinceBoot":false}}`, true, true, false},
		{"malformed", `not JSON`, false, false, true},
		{"missing passcode", `{"result":{"unlockedSinceBoot":true}}`, false, false, true},
	} {
		t.Run("lock/"+test.name, func(t *testing.T) {
			reachable, locked, err := iosDeviceLockState(test.output)
			if (err != nil) != test.bad {
				t.Fatalf("%v", err)
			}
			if reachable != test.reachable || locked != test.locked {
				t.Fatalf("reachable=%v locked=%v", reachable, locked)
			}
		})
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

// Reference code can start SDK descendants. Give it the same owned kernel
// boundary as production tools rather than waiting only for its Node leader.
func testNodeOutput(t *testing.T, ctx context.Context, command *exec.Cmd) []byte {
	t.Helper()
	ctx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()
	cwd := command.Dir
	if cwd == "" {
		var err error
		cwd, err = os.Getwd()
		if err != nil {
			t.Fatal(err)
		}
	}
	env := command.Env
	if env == nil {
		env = os.Environ()
	}
	env = append(env, "NODE_OPTIONS=", "NODE_PATH=")
	result, err := proc.RunProcess(ctx, command.Args, cwd, env)
	if err != nil || result.ExitCode != 0 || result.Cancelled || result.Truncated {
		t.Fatalf("owned reference: %v, exit=%d, cancelled=%v, truncated=%v: %s", err, result.ExitCode, result.Cancelled, result.Truncated, result.Stderr)
	}
	return []byte(result.Stdout)
}
