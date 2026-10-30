/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import type { ScreenProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'

// The GTK RootLayout equivalent is the renderer-owned Gtk.Overlay inside
// each root's content host — imperative overlay/dialog/sheet services mount
// there through view.createOverlayLayer or the __octaneGtkHost bridge, not
// through a per-screen registry, so no loaded/unloaded bookkeeping is needed
// (the nativescript root-layout registry stays behind on mobile). The
// `rootlayout` element is a viewless node on this renderer; the screen shell
// is a real widget so props, escape bags, and layout land somewhere honest.
// Children go in a single inner column — the shared leaf's document-order
// stacking contract (one bounds slot per root child) holds here too.
/**
 * Route-level container providing the screen's safe-area/status context. Import from `@octane-xplat/ui`.
 *
 * @see ScreenProps, SafeAreaProps.
 */
export function Screen(props: ScreenProps) @{
	<masonview
		className="vx-screen-shell"
		id={props.id}
		ref={(v: any) => applyEscapeProps(v, props)}
		style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
	>
		<masonview
			className={cx('vx-screen-content', props.className)}
			style={mergeStyle({ display: 'flex', flexDirection: 'column', flexGrow: 1 }, props.style)}
		>
			{props.children}
		</masonview>
	</masonview>
}
