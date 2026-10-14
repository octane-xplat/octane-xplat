# CameraView on the macOS root

Current exports: `CameraView`.

**Fix: Remove the macOS-only placeholder from the shared root API.**

CameraView is exported by the macOS root from a hosted-unsupported module, but not by the shared web/mobile barrel. Keep camera behavior in its feature package with an honest capability contract; a harness placeholder should not create a public component that agents can import only on an unsupported target.

Proposed shape (illustrative):

```ts
type ProposedCameraCapability = { supported: true } | { supported: false; reason: string }
```

Evidence: [src/index.macos.ts:249](../../../../packages/ui/src/index.macos.ts#L249), [src/hosted-unsupported.macos.tsrx:1](../../../../packages/ui/src/hosted-unsupported.macos.tsrx#L1).

[Audit index](../../README.md)
