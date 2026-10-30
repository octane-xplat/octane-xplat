/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { FocusScopeCapabilities, FocusScopeProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState, nativeAccessibilityRole } from './escape-props'

/** Which `FocusScope` behavior flags this default mobile leaf honors — none.
 * Desktop AppKit has a dedicated native focus implementation. */
export function getFocusScopeCapabilities(): FocusScopeCapabilities {
	return { contain: false, autoFocus: false, restoreFocus: false, nestedScopes: false }
}

// Report inert flags once per flag — the leaf can't honor them, so a caller
// passing one should learn about it rather than assume containment.
const warnedFocusScopeFlags = new Set<string>()
function warnInertFocusScopeFlag(flag: 'contain' | 'autoFocus' | 'restoreFocus') {
	if (warnedFocusScopeFlags.has(flag)) {
		return
	}

	warnedFocusScopeFlags.add(flag)
	console.warn(
		`[octane-xplat] FocusScope: '${flag}' has no effect on this platform — getFocusScopeCapabilities() reports the supported flags`,
	)
}

/** FocusScope native leaf — keyboard focus containment is a web
 *  convention, so `contain`/`restoreFocus`/`autoFocus` are inert here and
 *  the leaf renders a plain accessible container. Same public props as the
 *  web leaf; the divergence is intrinsic to the platform. */
export function FocusScope(props: FocusScopeProps): unknown @{
	if (props.contain) {
		warnInertFocusScopeFlag('contain')
	}

	if (props.autoFocus) {
		warnInertFocusScopeFlag('autoFocus')
	}

	if (props.restoreFocus) {
		warnInertFocusScopeFlag('restoreFocus')
	}

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={cx(props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState)}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
	>
		{props.children}
	</masonview>
}
