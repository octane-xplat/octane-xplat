/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { FocusScopeCapabilities, FocusScopeProps } from '../../props'
import { cx } from '@octane-xplat/lib'

/** GTK has no `accessibilityViewIsModal`/`accessibilityElementsHidden` — the
 *  focus-scope's containment is carried by the overlay host's modal input
 *  suppression instead. The capability contract reports it truthfully. */
export function getFocusScopeCapabilities(): FocusScopeCapabilities {
	return {
		contain: false,
		restoreFocus: false,
		autoFocus: false,
		nestedScopes: false,
	}
}

/** Focus scope (Astryx `FocusScope`), GTK leaf — a styled container that
 *  delegates containment to the overlay host's modal suppression; the
 *  nativescript `escape-props` accessibility props don't apply. */
export function FocusScope(props: FocusScopeProps): unknown @{
	const refs = useMemo(() => refList(props.ref), [props.ref])
	<masonview
		className={cx('vx-focus-scope', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		ref={refs}
	>
		{props.children}
	</masonview>
}
