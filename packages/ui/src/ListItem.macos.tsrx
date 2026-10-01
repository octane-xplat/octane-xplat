/** @jsxImportSource @xplat/macos/renderer */
import type { ListItemProps } from './props'
import { cx } from './cx'
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
			const target = props.delegateRef.current
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

	<flexboxlayout
		id={props.id}
		ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
		flexDirection="row"
		alignItems="center"
		className={cx(
			'vx-listitem',
			`vx-listitem--density-${ctx.density}`,
			interactive && 'vx-listitem--interactive',
			props.isDisabled && 'vx-listitem--disabled',
			props.isSelected && 'vx-listitem--selected',
			props.className,
		)}
		style={props.style}
		onTap={interactive && !props.isDisabled ? activate : undefined}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={props.accessibilityRole ?? (props.href != null ? 'link' : props.onPress != null ? 'button' : 'text')}
		accessibilityState={{ disabled: props.isDisabled, selected: props.isSelected }}
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
