/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import { useMemo, useId } from 'octane'
import { refList } from './ref-list'
import type { InputGroupProps, InputGroupTextProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { FormField } from './FormField.macos.tsrx'
import { InputGroupProvider } from './input-group-context'
import { SizeProvider, useSize } from './size-context'

/** InputGroup — labeled joined input surface; members flatten their own
 *  chrome via `useInputGroup()`. */
export function InputGroup(props: InputGroupProps) @{
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
					accessibilityState={{ disabled: props.isDisabled }}
					style={mergeStyle({ flexDirection: 'row', alignItems: 'stretch' }, { display: 'flex' })}
				>
					{props.children}
				</masonview>
			</SizeProvider>
		</InputGroupProvider>
	</FormField>
}

export function InputGroupText(props: InputGroupTextProps) @{
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
		style={mergeStyle(
			{ justifyContent: 'center', alignItems: 'center' },
			mergeStyle({ display: 'flex' }, props.style),
		)}
	>
		{typeof props.children === 'string' ? <label text={props.children} /> : props.children}
	</masonview>
}
