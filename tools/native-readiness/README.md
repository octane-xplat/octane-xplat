# Packed native listening/settings check

This verification tool installs tarballs into an external consumer created by
the packed creator, then mounts a listening/settings fixture using that
consumer's UI, audio, incremental HTTP, hosted-session, and storage services.
It uses the normal probe runner and the scaffolded native resources. Artifacts
remain in the printed temporary directory for inspection.

Run on a build machine with dependencies installed and an owned, booted iOS simulator
or Android emulator. The local HTTP server uses their host-loopback addresses;
physical devices are not supported by this fixture.
Reserve the remote host, native build slot, and selected device for the command.
The task builds only the selected packages and their dependencies, with two
build tasks at a time.

```sh
export PATH="$PWD/apps/mobile/node_modules/.bin:$PATH"
bun run turbo run check:native-readiness --filter=// -- --target ios --device OWNED_UDID
bun run turbo run check:native-readiness --filter=// -- --target android --device OWNED_SERIAL
```

Assertions cover shared UI subscription updates, preserving playback, an
incremental first record, native secure credential restoration/deletion,
isolated preference writes, and queue advancement. The server owns synthetic
responses and silent WAV media. Hosted authentication overrides the browser
ceremony with a synthetic callback; it does not contact an external provider.

Handler dispatch does not establish OS hit-testing. This fixture does not
qualify audible output, physical background/interruptions/routes, real provider
callbacks, abrupt process termination, font appearance, or accessibility.
The [readiness record](../../.agents/docs/notes/still-native-readiness.md) keeps
those gates separate from successful package and runtime checks.
