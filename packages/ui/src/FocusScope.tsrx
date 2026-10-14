/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { FocusScopeCapabilities, FocusScopeProps } from './props';
import { applyEscapeProps } from './escape-props';

/** Which `FocusScope` behavior flags this target honors — none on native;
 *  keyboard focus containment is a web convention, so the flags are inert
 *  and the leaf renders a plain accessible container. */
export function getFocusScopeCapabilities(): FocusScopeCapabilities {
	return { contain: false, autoFocus: false, restoreFocus: false };
}

/** FocusScope native leaf — keyboard focus containment is a web
 *  convention, so `contain`/`restoreFocus`/`autoFocus` are inert here and
 *  the leaf renders a plain accessible container. Same public props as the
 *  web leaf; the divergence is intrinsic to the platform. */
export function FocusScope(props: FocusScopeProps) @{
	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		className={props.className}
		style={props.style}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={props.accessibilityState as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		{props.children}
	</flexboxlayout>
}
