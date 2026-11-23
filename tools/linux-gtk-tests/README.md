# Linux GTK integration tests

The opt-in suite runs the maintained renderer fixtures against the NativeScript runtime on the `octane-linux` VM on `andromeda.local`. It also covers the Core view lifecycle and component replacement, native projection, mount and unmount ownership, real X11 input, and launch of an app archive built by the Linux CLI. The packaged app verifies TypeScript SDK declarations, a direct GTK call, and locale data from bundled ICU.

## Light checks

```sh
bun run turbo run test --filter=@xplat/linux-gtk-tests
```

This runs in PR CI and checks the WebKit metadata producer with synthetic headers and a stub generator. It requires Python 3.

## Run on Andromeda

Use a staged x86_64 runtime from the [release tooling](../linux-runtime-release/README.md). Make its files available in the VM. The executable, Mason, and ICU paths below are VM paths. The GI schema and logs are local paths. The VM needs GTK4, WebKitGTK, Python 3, D-Bus, Xvfb, XTest, and xdotool.

```sh
goddard-agent resource run --json '{"resources":{"exclusive":["linux:andromeda-octane-linux"],"resident_devices":1},"purpose":"GTK integration tests"}' -- \
  env LINUX_RUNTIME_EVAL_EXECUTABLE=/path/in/vm/ns-linux \
    LINUX_RUNTIME_EVAL_MASON_DIR=/path/in/vm/lib \
    LINUX_RUNTIME_EVAL_ICU_DATA=/path/in/vm/icu \
    LINUX_RUNTIME_EVAL_GI_SCHEMA=/local/path/gi.json \
    LINUX_RUNTIME_EVAL_LOG_DIR=/local/path/gtk-test-logs \
    bun run turbo run test:gtk --filter=@xplat/linux-gtk-tests
```

Add `-- core projection lifetime packaged-app shared-gestures` to run only the Core, runtime contract, and gesture cases. Use `-- gjs ui-theme` to compare a renderer fixture with GJS on the same VM. The contract tests run only on NativeScript. The runner saves a log for each remote fixture, including failures.
