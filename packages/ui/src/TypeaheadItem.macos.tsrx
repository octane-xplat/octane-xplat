/** @jsxImportSource @xplat/macos/renderer */
import type { SearchableItem, TypeaheadItemProps } from "./props";
import { cx } from "./cx";
import { Icon } from './Icon.macos.tsrx';

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

	<flexboxlayout
		id={props.id}
		className={cx('vx-typeahead-item', props.isDisabled && 'vx-typeahead-item--disabled', props.className)}
		style={props.style}
		flexDirection="row"
		alignItems="center"
		accessibilityState={{ disabled: props.isDisabled }}
	>
		{icon}
		<flexboxlayout className="vx-typeahead-item-content" flexDirection="column" flexGrow={1}>
			<label className="vx-typeahead-item-label" text={props.item.label} />
			{props.description ? <label className="vx-typeahead-item-description" text={props.description} style={{ color: '#666666' }} /> : null}
		</flexboxlayout>
	</flexboxlayout>
}
