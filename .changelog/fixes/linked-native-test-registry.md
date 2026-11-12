### Share native runtime registries when linking a framework checkout

Native builds now resolve Octane and its NativeScript renderer from the app installation. On-device tests also share the app's test-host registry, so linked `mountXplat` helpers can find the host without an extra dedupe setting. See [on-device testing](https://octane-xplat.goddardai.org/testing/testing).
