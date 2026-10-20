# Check the packed Android starter

Framework contributors can run the scaffolded suite against packed packages
on an already-booted Android test host. This qualification command requires
`adb` on PATH and ownership of the selected host; it does not boot or select
someone else's device. Android remains unverified until the device suite passes.

```sh
VERIFY_ANDROID_DEVICE=AUTHORIZED_DEVICE_SERIAL node scripts/verify-consumer.ts --test-android --keep
```

Replace `AUTHORIZED_DEVICE_SERIAL` with the explicitly authorized test host’s
serial. Run from the framework repository root after reserving the native build slot
and selected device. Package build, packing, install, lint, typecheck, and web
build must pass before device tests start. The command uses a disposable app
identity and verifies that its process stops. It preserves ordinary app data.
The starter includes native bridge, deliberate assertion failure, and repeated
cleanup checks in addition to its component cases.
