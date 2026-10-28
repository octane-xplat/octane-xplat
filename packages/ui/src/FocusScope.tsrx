/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { FocusScopeCapabilities, FocusScopeProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState, nativeAccessibilityRole } from './escape-props'

/** Which `FocusScope` behavior flags this target honors — none on native;
 *  keyboard focus containment is a web convention, so the flags are inert
 *  and the leaf renders a plain accessible container. */
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
export function FocusScope(props: FocusScopeProps) @{
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
