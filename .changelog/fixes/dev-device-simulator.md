### Select development devices and boot iOS simulators reliably

`xplat dev` accepts `--device` to select an exact device, optionally alongside
`ios` or `android`. iOS development and owned session launches boot simulators
through `simctl`, including when the selected Xcode has no Simulator.app.

```sh
pnpm exec xplat dev ios --device DEVICE_UDID
```

Replace `DEVICE_UDID` with an identifier from `pnpm exec xplat targets --json`.
See the [development setup guide](https://octane-xplat.goddardai.org/start/toolchain).
