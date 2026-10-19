/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { ListItemProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { useListContext } from './list-context'
import { pushDeepLink } from './route'

/** ListItem — a `List` row: marker + startContent + label/description +
 *  endContent. `onPress`/`href` interactive; `href` resolves through the
 *  deep-link table (external open has no AppKit analog here). */
export function ListItem(props: ListItemProps) @{
	const ctx = useListContext()
	const interactive = props.onPress != null || props.href != null

	const activate = () => {
		if (props.isDisabled) { return }
		if (props.onPress != null) { props.onPress(); return }
		if (props.delegateRef?.current != null) {
			const target = props.delegateRef.current as any
			target.notify?.({ eventName: 'tap', object: target })
			target.click?.()
			target.focus?.()
			return
		}

		if (props.href != null) { pushDeepLink(props.href) }
	}

	const labelNode = typeof props.label === 'string'
		? <label className="vx-listitem-label" text={props.label} />
		: props.label

	const descriptionNode = props.description == null ? null
		: typeof props.description === 'string'
			? <label className="vx-listitem-desc" text={props.description} />
			: props.description

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<masonview id={props.id} ref={forwardedRef} className={cx(
			'vx-listitem',
			`vx-listitem--density-${ctx.density}`,
			interactive && 'vx-listitem--interactive',
			props.isDisabled && 'vx-listitem--disabled',
			props.isSelected && 'vx-listitem--selected',
			props.className,
		)} style={mergeStyle({flexDirection: "row", alignItems: "center"}, mergeStyle({display: "flex"}, props.style))} onTap={interactive && !props.isDisabled ? activate : undefined} accessibilityLabel={props.accessibilityLabel} accessibilityRole={props.accessibilityRole ?? (props.href != null ? 'link' : props.onPress != null ? 'button' : 'text')} accessibilityState={{ disabled: props.isDisabled, selected: props.isSelected }}>
		{props.startContent != null ? <masonview className="vx-listitem-start" style={{display: "flex"}}>{props.startContent}</masonview> : null}
		<masonview className="vx-listitem-body" style={mergeStyle({flexDirection: "column", flexGrow: 1}, mergeStyle({display: "flex"}, { minWidth: 0 }))}>
			{labelNode}
			{descriptionNode}
			{props.children}
		</masonview>
		{props.endContent != null ? <masonview className="vx-listitem-end" style={{display: "flex"}}>{props.endContent}</masonview> : null}
	</masonview>
}
