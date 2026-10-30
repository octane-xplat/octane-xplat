/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo, useId } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { InputGroupProps, InputGroupTextProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityState } from '../overlays/escape-props'
import { FormField } from './FormField'
import { InputGroupProvider } from './input-group-context'
import { SizeProvider, useSize } from '../layout/size-context'

/** InputGroup — a labeled, visually joined input surface: the `Field`
 *  carries label/description/status; members read `useInputGroup()` and
 *  drop their own borders into the shared skin. NS has no group role —
 *  the row is a plain flexbox; label/description/status ids still flow to
 *  members through the FieldContext. */
export function InputGroup(props: InputGroupProps): unknown @{
	const groupId = useId()
	const size = useSize(props.size, 'md')
	const group = { isDisabled: props.isDisabled, size }

	const forwardedRef = useMemo(
		() =>
			refList((v: any) => {
				if (v) {
					applyEscapeProps(v, props)
				}
			}, props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<FormField
		label={props.label}
		isLabelHidden={props.isLabelHidden}
		isGroupLabel={true}
		labelID={`${groupId}-label`}
		description={props.description}
		descriptionID={props.description != null ? `${groupId}-description` : undefined}
		status={props.status}
		statusID={props.status?.message != null ? `${groupId}-status` : undefined}
		isDisabled={props.isDisabled}
		isRequired={props.isRequired}
		isOptional={props.isOptional}
		size={size}
		labelTooltip={props.labelTooltip}
		id={props.id}
		className={props.className}
		style={props.style}
	>
		<InputGroupProvider value={group}>
			<SizeProvider value={size}>
				<masonview
					ref={forwardedRef}
					className={cx(
						'vx-inputgroup',
						props.isDisabled && 'vx-inputgroup--disabled',
						props.status && `vx-inputgroup--status-${props.status.type}`,
						`vx-inputgroup--size-${size}`,
					)}
					accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
					style={mergeStyle({ flexDirection: 'row', alignItems: 'stretch' }, { display: 'flex' })}
				>
					{props.children}
				</masonview>
			</SizeProvider>
		</InputGroupProvider>
	</FormField>
}

/** InputGroupText — a prefix/suffix segment inside an InputGroup. String
 *  children render as a label; components render as-is. */
export function InputGroupText(props: InputGroupTextProps): unknown @{
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
		id={props.id}
		ref={forwardedRef}
		className={cx('vx-inputgroup-text', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{typeof props.children === 'string' ? <label text={props.children} /> : props.children}
	</masonview>
}
