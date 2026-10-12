/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { FocusScopeProps } from './props'
import { applyEscapeProps } from './escape-props'

/** FocusScope macOS leaf — keyboard focus containment is a web convention;
 *  `contain`/`restoreFocus`/`autoFocus` are inert and the leaf renders a
 *  plain accessible container. Same public props as the web leaf. */
export function FocusScope(props: FocusScopeProps) @{
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
