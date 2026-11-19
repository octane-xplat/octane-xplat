### Share native runtime registries when linking a framework checkout

When an app links a local framework checkout, its native build now uses the app’s installed Octane and NativeScript renderer. Linked `mountXplat` helpers share the app’s test host without extra deduplication settings.

[On-device testing](https://octane-xplat.goddardai.org/testing#test-components-on-a-device)
