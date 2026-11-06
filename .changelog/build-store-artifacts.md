### Build store artifacts with `xplat build`

`xplat build` now exposes NativeScript's artifact, signing and output options
for phone targets. Android accepts `--aab` to produce an App Bundle instead of
an APK, plus the keystore path and alias; iOS accepts `--for-device` for a
device-signed `.ipa` along with `--provision` and `--team-id` for
distribution signing. `--copy-to` copies the produced artifact to a file or
directory, and each build prints `Artifact: <path> (<type>)`.

Signing passwords are supplied as environment-variable references — never as
option values or persisted configuration:

```sh
xplat build --targets android --release --aab \
  --key-store-path "$ANDROID_UPLOAD_KEYSTORE" --key-store-alias upload \
  --key-store-password-env ANDROID_KEYSTORE_PASSWORD \
  --key-store-alias-password-env ANDROID_KEY_PASSWORD \
  --copy-to dist/app-release.aab
xplat build --targets ios --release --for-device --copy-to dist/app.ipa
```

The same keystore fields can live in `package.json` under
`xplat.targets.android.signing` using `…Env` references; a raw password value
there is refused. Route generation still runs before NativeScript.

See [Release an iOS or Android app](https://octane-xplat.goddardai.org/native-release).
