import type { SearchableItem, TypeaheadItemProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** Default option content for typeahead dropdowns — label with an optional
 *  leading icon and supporting description. `item.element` wins when set.
 *  Exported for use in custom `renderItem` implementations. */
export function TypeaheadItem<T extends SearchableItem,>(props: TypeaheadItemProps<T>) @{
	if (props.item.element != null) {
		return <>{props.item.element}</>
	}

	const icon = props.icon == null
		? null
		: typeof props.icon === 'string'
			? <Icon name={props.icon} size={16} />
			: props.icon;

	<div
		ref={(el: any) => { if (el) { applyEscapeProps(el, props); props.bind?.(el); } }}
		id={props.id}
		className={['vx-typeahead-item', props.isDisabled ? 'vx-typeahead-item--disabled' : undefined, props.className]}
		style={props.style}
		aria-disabled={props.isDisabled || undefined}
	>
		{icon}
		<div className="vx-typeahead-item-content">
			<span className="vx-typeahead-item-label">{props.item.label}</span>
			{props.description ? <span className="vx-typeahead-item-description">{props.description}</span> : null}
		</div>
	</div>
}
