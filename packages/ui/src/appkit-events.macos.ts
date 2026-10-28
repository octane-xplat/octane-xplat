import type { HostHandler, NativeEvent, ValueChangeEvent } from '@octane-xplat/jsx/intrinsics'

/**
 * Driver-payload adapters for AppKit call sites. The facade's host events are
 * the shared `NativeEvent`-shaped payloads; some AppKit driver dispatches pass
 * different payloads that were precise before the facade migration. Each
 * adapter keeps the real AppKit type on the handler side and holds the single
 * documented cast at the boundary.
 */

/** The AppKit driver passes the control's string to `onTextChange`
 * (macos-renderer/src/index.ts ~4946, `setControlAction` with a string getter);
 * NativeScript passes a `ValueChangeEvent` (`TextInput.tsrx` reads `.value`). */
export function appKitTextChange(
	handler: (text: string) => void,
): HostHandler<ValueChangeEvent<object, string>> {
	return (event) => handler(event as unknown as string)
}

/** The AppKit scroll payload is `{ verticalOffset, viewportHeight,
 * contentHeight }`, not `ScrollEvent` — see `onScroll` in VirtualList.macos. */
export function appKitScroll<E>(handler: (event: E) => void): HostHandler<NativeEvent<object>> {
	return (event) => handler(event as unknown as E)
}

/** The AppKit layout payload is `{ object, width, height }` (from
 * `NSViewFrameDidChangeNotification`), not `NativeEvent` — see
 * `AppKitLayoutEvent` in VirtualList.macos. */
export function appKitLayout<E>(handler: (event: E) => void): HostHandler<NativeEvent<object>> {
	return (event) => handler(event as unknown as E)
}
