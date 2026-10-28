/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useMemo, useRef } from 'octane'
import { mergeStyle } from './style-merge'
import { refList } from './ref-list'
import type { FocusScopeCapabilities, FocusScopeProps } from './props'
import { applyEscapeProps } from './escape-props'
import { createAppKitFocusScopeManager } from './focus-scope-state.macos'

const scopes = createAppKitFocusScopeManager()
const hot = (import.meta as ImportMeta & { hot?: { dispose(callback: () => void): void } }).hot
hot?.dispose(() => scopes.dispose())

/** Report native bridge capability, separately from OS input qualification. */
export function getFocusScopeCapabilities(): FocusScopeCapabilities {
	return scopes.capabilities()
}

const warnedFlags = new Set<string>()
function warnUnavailableFlags(props: FocusScopeProps) {
	const capabilities = scopes.capabilities()
	for (const flag of ['contain', 'autoFocus', 'restoreFocus'] as const) {
		if (props[flag] && !capabilities[flag] && !warnedFlags.has(flag)) {
			warnedFlags.add(flag)
			console.warn(`[octane-xplat] FocusScope: '${flag}' is unavailable in this AppKit host; check getFocusScopeCapabilities()`)
		}
	}
}

/** AppKit focus containment/autofocus/restoration for native descendants.
 * Nested scopes choose the innermost containing owner within each window. */
export function FocusScope(props: FocusScopeProps) @{
	const root = useRef<NSView | null>(null)
	const live = useRef(props)
	live.current = props
	const forwardedRef = useMemo(() => refList<object>(root, props.ref), [props.ref])
	useEffect(() => {
		const view = root.current
		if (!view) return
		applyEscapeProps(view, live.current)
		const release = scopes.bind(view, () => live.current)
		warnUnavailableFlags(live.current)
		return release
	}, [])

	<masonview
		id={props.id}
		ref={forwardedRef}
		className={props.className}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState}
		accessibilityLiveRegion={props.accessibilityLiveRegion}
	>
		{props.children}
	</masonview>
}
