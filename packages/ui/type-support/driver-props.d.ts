import type { HostHandler, NativeEvent } from '@octane-xplat/jsx/intrinsics'

/**
 * Driver-scoped props that the shared facade contract deliberately does not
 * carry: each is consumed by exactly one driver.
 *
 * NativeScript-only (the AppKit renderer does not handle these prop names):
 * `isUserInteractionEnabled` and `textAlignment` are real NativeScript View /
 * TextBase properties; `iosEstimatedRowHeight` and `onLoadMoreItems` are NS
 * ListView members; `iosIgnoreSafeArea` on masonview is consumed by the NS
 * masonry view; `onLinkTap` is the NS FormattedString span event.
 *
 * AppKit-only (consumed by macos-renderer, not by the NativeScript drivers):
 * scrollview `horizontal` (index.ts ~4882/5164 — NS uses `orientation`);
 * webview `scrollEnabled`/`matchContents`/`onLayoutContent`
 * (macos-renderer/src/webview.ts ~179/214/271); textfield/textview `value` and
 * `placeholder` (index.ts ~4925–5039 — NS uses `text`/`hint`).
 */
declare module '@octane-xplat/jsx/intrinsics' {
	// ---- NativeScript-only ----
	interface CommonAttributes {
		isUserInteractionEnabled?: boolean
	}

	interface TextBaseProps {
		textAlignment?: string
	}

	interface ListViewProps<TElement> {
		iosEstimatedRowHeight?: number
		onLoadMoreItems?: HostHandler<NativeEvent<TElement>>
	}

	interface MasonViewProps {
		iosIgnoreSafeArea?: boolean
	}

	interface TextViewProps<TElement> {
		returnKeyType?: string
		keyboardType?: string
		onReturnPress?: HostHandler<NativeEvent<TElement>>
	}

	interface SpanProps {
		onLinkTap?: HostHandler<NativeEvent<object>>
	}

	// ---- AppKit-only ----
	interface CommonAttributes {
		disabled?: boolean
		accessibilityMinValue?: number
		accessibilityMaxValue?: number
		accessibilityValueDescription?: string
		onAccessibilityIncrement?: HostHandler<NativeEvent<object>>
		onAccessibilityDecrement?: HostHandler<NativeEvent<object>>
	}

	interface WebViewProps<TElement> {
		scrollEnabled?: boolean
		matchContents?: boolean
		onLayoutContent?: (size: { width: number; height: number }) => void
		html?: string
		onLoad?: HostHandler<NativeEvent<TElement> & { url?: string; error?: string }>
		onError?: HostHandler<NativeEvent<TElement> & { url?: string; error?: string }>
	}

	interface TextFieldProps<TElement> {
		value?: string
		placeholder?: string
	}

	interface TextViewProps<TElement> {
		value?: string
		placeholder?: string
		rows?: number
	}

	interface ScrollViewProps<TElement> {
		horizontal?: boolean
	}

	interface ImageProps {
		placeholder?: string
	}
}
