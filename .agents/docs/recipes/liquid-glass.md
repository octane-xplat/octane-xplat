# Put an iOS material behind interactive content

ID: liquid-glass
Targets: ios
Related APIs: LiquidGlass, LiquidGlassContainer, interactive, @octane-xplat/ui/ios

## Starting point

An iOS screen in a working Xplat app. Other targets use their own screen leaves;
this recipe does not claim shared glass parity.

## Requirements

- Add material without app-side native-view mutation or loaded listeners.
- Keep child controls usable and understand the explicit interactive limit.
- Verify fallback, native recreation, and real touch delivery separately.

## Acceptance criteria

- AC1: On iOS 13–25, the surface shows material behind its children without app-side fallback code, including after reopening the screen.
- AC2: On iOS 26+, default glass preserves child press delivery through real OS input after mount and remount.
- AC3: On iOS 26+, explicit interactive glass also preserves child press delivery through real OS input. Until qualified, documentation identifies that gap and the supported default.
- AC4: The reader can use the iOS-only import and distinguish older-iOS blur from native glass and container merging.

## Documentation

- AC1: [Material and fallback](../../../docs/app/liquid-glass.md) and [acceptance](../../../docs/app/liquid-glass.md#acceptance-on-a-device).
- AC2: [Default interaction and device acceptance](../../../docs/app/liquid-glass.md) and [Glass demo](../../../packages/demos/src/GlassDemo.ios.tsrx).
- AC3: [Explicit interaction limit and device acceptance](../../../docs/app/liquid-glass.md) and [Glass demo](../../../packages/demos/src/GlassDemo.ios.tsrx). Real OS touch delivery requires separate target qualification.
- AC4: [iOS imports and container fallback](../../../docs/app/liquid-glass.md).
