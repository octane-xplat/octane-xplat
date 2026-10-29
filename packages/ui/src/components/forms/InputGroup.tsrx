/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useMemo, useId } from 'octane'
import { refList } from '../../internal/accessibility/ref-list'
import type { InputGroupProps, InputGroupTextProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from '../overlays/escape-props'
import { FormField } from './FormField'
import { useFieldControlProps } from './field-context'
import { TextSlot } from './text-slot'
import { InputGroupProvider } from './input-group-context'
import { SizeProvider, useSize } from '../layout/size-context'

/** InputGroup — a labeled, visually joined input surface: the `Field`
 *  carries label/description/status; members read `useInputGroup()` and
 *  drop their own borders into the shared skin. The role adapter preserves
 *  GTK's group role and maps to NativeScript's available role vocabulary.
 *  Member controls share label/help/state, without sharing a control ID. */
export function InputGroup(props: InputGroupProps): unknown @{
	const fieldProps = useFieldControlProps(props)
	const groupId = useId()
	const size = useSize(fieldProps.size, 'md')
	const group = { isDisabled: fieldProps.isDisabled, size }

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
		status={fieldProps.status}
		statusID={fieldProps.status?.message != null ? `${groupId}-status` : undefined}
		isDisabled={fieldProps.isDisabled}
		isRequired={fieldProps.isRequired}
		isOptional={fieldProps.isOptional}
		isReadOnly={fieldProps.isReadOnly}
		isLoading={fieldProps.isLoading}
		disabledMessage={fieldProps.disabledMessage}
		statusVariant={fieldProps.statusVariant}
		width={props.width}
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
						fieldProps.isDisabled && 'vx-inputgroup--disabled',
						fieldProps.status && `vx-inputgroup--status-${fieldProps.status.type}`,
						`vx-inputgroup--size-${size}`,
					)}
					isEnabled={!fieldProps.isDisabled}
					accessibilityRole={nativeAccessibilityRole('group')}
					accessibilityLabel={props.label}
					accessibilityHint={fieldProps.accessibilityHint}
					accessibilityState={nativeAccessibilityState({
						disabled: fieldProps.isDisabled,
						busy: fieldProps.isLoading,
						invalid: fieldProps.status?.type === 'error',
					})}
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
		<TextSlot>{props.children}</TextSlot>
	</masonview>
}
