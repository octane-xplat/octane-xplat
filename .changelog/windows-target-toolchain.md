### Use an isolated Windows toolchain

Keep an experimental Windows NativeScript project separate from your app's mobile dependencies while selecting Windows on the same app.

```json
{
  "xplat": {
    "targets": {
      "windows": { "toolchain": "../../tools/windows-host" }
    }
  }
}
```

See the [CLI guide](https://octane-xplat.goddardai.org/package-cli) and [Windows support status](https://octane-xplat.goddardai.org/windows-setup). Windows remains experimental, and downstream setup is not yet documented.
