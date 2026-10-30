### Build macOS native leaves on Intel Macs

Experimental AppKit apps with native leaves now build on Intel Macs as well as
Apple Silicon. The shipped `objc-metadata-generator` is a universal binary, and
the CLI no longer rejects x86_64 build hosts. Each build host needs Command
Line Tools whose `libclang` carries that host's architecture; Intel CLT
installations provide it natively.

```sh
pnpm xplat build --targets macos   # works on Intel and Apple Silicon Macs
```

See the [macOS native leaves guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/macos-native.md).
