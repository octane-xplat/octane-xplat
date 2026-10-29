/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { SearchableItem, TypeaheadItemProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { Icon } from '../media/Icon'

/** Default option content for typeahead dropdowns — label with an optional
 *  leading icon and supporting description. `item.element` wins when set. */
export function TypeaheadItem<T extends SearchableItem>(props: TypeaheadItemProps<T>) @{
	if (props.item.element != null) {
		return <>{props.item.element}</>
	}

	const icon =
		props.icon == null ? null : typeof props.icon === 'string' ? (
			<Icon name={props.icon} size={16} />
		) : (
			props.icon
		)

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		ref={forwardedRef}
		id={props.id}
		className={cx(
			'vx-typeahead-item',
			props.isDisabled && 'vx-typeahead-item--disabled',
			props.className,
		)}
		style={mergeStyle({ display: 'flex' }, props.style)}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
	>
		{icon}
		<masonview
			className="vx-typeahead-item-content"
			style={mergeStyle({ flexDirection: 'column', flexGrow: 1 }, { display: 'flex' })}
		>
			<label className="vx-typeahead-item-label" text={props.item.label} />
			{props.description ? (
				<label className="vx-typeahead-item-description" text={props.description} />
			) : null}
		</masonview>
	</masonview>
}
