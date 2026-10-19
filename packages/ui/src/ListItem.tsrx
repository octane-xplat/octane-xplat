/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import { Utils } from '@nativescript/core';
import type { ListItemProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { useListContext } from './list-context';
import { pushDeepLink } from './route';

/** ListItem — a `List` row: marker (from context) + startContent +
 *  label/description + endContent. `onPress`/`href` make the row
 *  interactive; `delegateRef` forwards a surface tap to a nested control
 *  (tap event → click → focus, whichever the bound node supports).
 *  `href` navigates through the deep-link table first, then opens the URL
 *  externally. */
export function ListItem(props: ListItemProps) @{
	const ctx = useListContext();
	const interactive = props.onPress != null || props.href != null;
	const density = ctx.density;

	const activate = () => {
		if (props.isDisabled) { return; }
		if (props.onPress != null) {
			props.onPress();
			return;
		}

		if (props.delegateRef?.current != null) {
			const target = props.delegateRef.current as any;
			target.notify?.({ eventName: 'tap', object: target });
			target.click?.();
			target.focus?.();
			return;
		}

		if (props.href != null && !pushDeepLink(props.href)) {
			Utils.openUrl(props.href);
		}
	};

	const labelNode = typeof props.label === 'string'
		? <label className="vx-listitem-label" text={props.label} />
		: props.label;

	const descriptionNode = props.description == null ? null
		: typeof props.description === 'string'
			? <label className="vx-listitem-desc" text={props.description} />
			: props.description;

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<masonview id={props.id} ref={forwardedRef} className={cx(
			'vx-listitem',
			`vx-listitem--density-${density}`,
			interactive && 'vx-listitem--interactive',
			props.isDisabled && 'vx-listitem--disabled',
			props.isSelected && 'vx-listitem--selected',
			props.className,
		)} style={mergeStyle({flexDirection: "row", alignItems: "center"}, mergeStyle({display: "flex"}, props.style as any))} onTap={interactive && !props.isDisabled ? activate : undefined} accessible={props.accessible ?? (interactive ? true : undefined)} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole ?? (props.href != null ? 'link' : props.onPress != null ? 'button' : 'text')) as any} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled, selected: props.isSelected }) as any} accessibilityLiveRegion={props.accessibilityLiveRegion as any}>
		{props.startContent != null ? <masonview className="vx-listitem-start" style={{display: "flex"}}>{props.startContent}</masonview> : null}
		<masonview className="vx-listitem-body" style={mergeStyle({flexDirection: "column", flexGrow: 1}, mergeStyle({display: "flex"}, { minWidth: 0 }))}>
			{labelNode}
			{descriptionNode}
			{props.children}
		</masonview>
		{props.endContent != null ? <masonview className="vx-listitem-end" style={{display: "flex"}}>{props.endContent}</masonview> : null}
	</masonview>
}
