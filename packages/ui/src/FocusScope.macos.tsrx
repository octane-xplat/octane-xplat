/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { FocusScopeCapabilities, FocusScopeProps } from './props'
import { applyEscapeProps } from './escape-props'

/** Which `FocusScope` behavior flags this target honors — none on macOS;
 *  keyboard focus containment is a web convention and the leaf renders a
 *  plain accessible container. */
export function getFocusScopeCapabilities(): FocusScopeCapabilities {
	return { contain: false, autoFocus: false, restoreFocus: false, nestedScopes: false };
}

// Report inert flags once per flag — the leaf can't honor them, so a caller
// passing one should learn about it rather than assume containment.
const warnedFocusScopeFlags = new Set<string>();
function warnInertFocusScopeFlag(flag: 'contain' | 'autoFocus' | 'restoreFocus') {
	if (warnedFocusScopeFlags.has(flag)) return;
	warnedFocusScopeFlags.add(flag);
	console.warn(`[octane-xplat] FocusScope: '${flag}' has no effect on this platform — getFocusScopeCapabilities() reports the supported flags`);
}

/** FocusScope macOS leaf — keyboard focus containment is a web convention;
 *  `contain`/`restoreFocus`/`autoFocus` are inert and the leaf renders a
 *  plain accessible container. Same public props as the web leaf. */
export function FocusScope(props: FocusScopeProps) @{
	if (props.contain) warnInertFocusScopeFlag('contain');
	if (props.autoFocus) warnInertFocusScopeFlag('autoFocus');
	if (props.restoreFocus) warnInertFocusScopeFlag('restoreFocus');
	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={props.className}
		style={props.style}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole}
		accessibilityHint={props.accessibilityHint}
	>
		{props.children}
	</flexboxlayout>
}
