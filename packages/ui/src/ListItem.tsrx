/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import { refList } from './ref-list'
import { Utils } from '@nativescript/core';
import type { ListItemProps } from './props';
import { cx } from './cx';
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
			const target = props.delegateRef.current;
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

	<flexboxlayout
		id={props.id}
		ref={forwardedRef}
		flexDirection="row"
		alignItems="center"
		className={cx(
			'vx-listitem',
			`vx-listitem--density-${density}`,
			interactive && 'vx-listitem--interactive',
			props.isDisabled && 'vx-listitem--disabled',
			props.isSelected && 'vx-listitem--selected',
			props.className,
		)}
		style={props.style}
		onTap={interactive && !props.isDisabled ? activate : undefined}
		accessible={props.accessible ?? (interactive ? true : undefined)}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole ?? (props.href != null ? 'link' : props.onPress != null ? 'button' : 'text')) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled, selected: props.isSelected }) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		{props.startContent != null ? <flexboxlayout className="vx-listitem-start">{props.startContent}</flexboxlayout> : null}
		<flexboxlayout flexDirection="column" flexGrow={1} className="vx-listitem-body" style={{ minWidth: 0 }}>
			{labelNode}
			{descriptionNode}
			{props.children}
		</flexboxlayout>
		{props.endContent != null ? <flexboxlayout className="vx-listitem-end">{props.endContent}</flexboxlayout> : null}
	</flexboxlayout>
}
