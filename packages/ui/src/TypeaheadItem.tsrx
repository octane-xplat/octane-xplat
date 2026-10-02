/** @jsxImportSource @nativescript-community/octane */
import { useMemo } from 'octane'
import type { SearchableItem, TypeaheadItemProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityState } from "./escape-props";
import { Icon } from './Icon.tsrx';

/** Default option content for typeahead dropdowns — label with an optional
 *  leading icon and supporting description. `item.element` wins when set. */
export function TypeaheadItem<T extends SearchableItem,>(props: TypeaheadItemProps<T>) @{
	if (props.item.element != null) {
		return <>{props.item.element}</>
	}

	const icon = props.icon == null
		? null
		: typeof props.icon === 'string'
			? <Icon name={props.icon} size={16} />
			: props.icon;

	const forwardedRef = useMemo(() => [(v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref], [props.ref, props.ios, props.android, props.web]);

	<flexboxlayout
		ref={forwardedRef}
		id={props.id}
		className={cx('vx-typeahead-item', props.isDisabled && 'vx-typeahead-item--disabled', props.className)}
		style={props.style}
		flexDirection="row"
		alignItems="center"
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
	>
		{icon}
		<flexboxlayout className="vx-typeahead-item-content" flexDirection="column" flexGrow={1}>
			<label className="vx-typeahead-item-label" text={props.item.label} />
			{props.description ? <label className="vx-typeahead-item-description" text={props.description} /> : null}
		</flexboxlayout>
	</flexboxlayout>
}
