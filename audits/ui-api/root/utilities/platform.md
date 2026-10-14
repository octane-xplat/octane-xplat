# isNative

Current exports: `isNative`.

**Design: Expose a platform identifier and capabilities instead of one broad native flag.**

isNative cannot distinguish mobile native, desktop native, and desktop web-host behavior. A generated branch can therefore select an unsupported OS API. Prefer a typed platform name for genuine OS choices and feature capabilities for behavior; keep implementation differences at file boundaries where possible.

Proposed shape (illustrative):

```ts
type ProposedPlatform = 'web' | 'ios' | 'android' | 'macos' | 'linux' | 'windows'
```

Evidence: [src/platform.ts:1](../../../../packages/ui/src/platform.ts#L1), [src/platform.web.ts:1](../../../../packages/ui/src/platform.web.ts#L1).

[Audit index](../../README.md)
