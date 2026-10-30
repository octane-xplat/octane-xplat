/** @jsxImportSource @octane-xplat/jsx/dom */
import { useImperativeHandle, useLayoutEffect, useRef, useState, useId } from 'octane'
import { normStyle } from '../layout/layout-child.web'
import type { TextAreaProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { cx } from '@octane-xplat/lib'
import { useFieldControl, useFieldControlProps } from './field-context'
import { FormField } from './FormField.web.tsrx'
import { STATUS_ICON_PATHS } from '../../theme/status-icons'
import type { JSX } from 'octane/jsx-runtime'

/** Multiline input — <textarea> inside the bordered box. `autoGrow` re-fits
 *  height to content after input and value updates via scrollHeight, capped by
 *  `maxRows` translated to a real max-height from the element's computed
 *  line-height; past the cap the field scrolls. `useLayoutEffect` so the
 *  measure lands pre-paint in the commit that wrote `value`. Deps are explicit
 *  — tsrx infers them from the closure's reads otherwise, and `props.value`
 *  (the thing that changes the height) isn't read inside. */
export function TextArea(inputProps: TextAreaProps): JSX.Element @{
	const { inField } = useFieldControl(inputProps)
	const generatedId = useId()
	const controlId = inputProps.id ?? generatedId
	const needsChrome =
		!inField &&
		(inputProps.label != null ||
			inputProps.description != null ||
			inputProps.status != null ||
			inputProps.isRequired ||
			inputProps.isOptional)

	// Same contract as TextInput: the label element carries the name via
	// `for`/`id`; description/status get explicit ids the textarea's
	// aria-describedby links to.
	const bareProps = needsChrome
		? {
				...inputProps,
				label: undefined,
				description: undefined,
				status: inputProps.status ? { type: inputProps.status.type } : undefined,
				web: {
					...inputProps.web,
					'aria-describedby':
						[
							inputProps.web?.['aria-describedby'],
							inputProps.description != null ? `${controlId}-description` : undefined,
							inputProps.status?.message != null ? `${controlId}-status` : undefined,
						]
							.filter(Boolean)
							.join(' ') || undefined,
				},
			}
		: inputProps

	const props = useFieldControlProps(bareProps)
	const el = useRef<HTMLTextAreaElement | null>(null)
	const [internal, setInternal] = useState(props.defaultValue ?? '')
	const value = props.value ?? internal
	const setValue = (next: string) => {
		if (props.value === undefined) {
			setInternal(next)
		}

		props.onChange?.(next)
	}

	const fit = () => {
		const t = el.current
		if (!t) {
			return
		}

		const cs = getComputedStyle(t)
		const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
		const bord = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)
		// scrollHeight is always content+padding; CSS height counts padding
		// +border only under border-box — convert between the two metrics.
		const adj = cs.boxSizing === 'border-box' ? bord : -pad
		const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
		const cap = props.maxRows
			? props.maxRows * line + (cs.boxSizing === 'border-box' ? pad + bord : 0)
			: parseFloat(cs.maxHeight) || Infinity

		if (props.maxRows) {
			t.style.maxHeight = Math.ceil(cap) + 'px'
		}

		if (props.autoGrow) {
			t.style.height = 'auto'
			// scrollHeight ≥ clientHeight at auto — the rows attr is the floor.
			const need = t.scrollHeight + adj
			t.style.height = Math.min(need, cap) + 'px'
			t.style.overflowY = need > cap ? 'auto' : 'hidden'
		}
	}

	useLayoutEffect(fit, [
		value,
		props.rows,
		props.autoGrow,
		props.maxRows,
		props.className,
		props.style,
	])

	useImperativeHandle(
		props.ref,
		() => ({
			focus: () => el.current?.focus(),
			blur: () => el.current?.blur(),
			native: el.current,
		}),
		[],
	)

	const shell = (
		<div
			className={cx(
				'vx-textarea-shell',
				props.status && `vx-textarea-shell--status-${props.status.type}`,
				props.isDisabled && 'vx-textarea-shell--disabled',
			)}
			onClick={(e: any) => {
				if (e.target === e.currentTarget && !props.isDisabled && !props.isReadOnly) {
					el.current?.focus()
				}
			}}
		>
			{props.startIcon != null ? (
				<span className="vx-textarea-icon" aria-hidden="true">
					{props.startIcon}
				</span>
			) : null}
			<textarea
				ref={(node: any) => {
					el.current = node
					if (!node) {
						return
					}

					applyEscapeProps(node, props)
				}}
				id={needsChrome ? controlId : props.id}
				data-testid={props.testID}
				className={cx(
					'vx-textarea',
					props.isDisabled && 'vx-textarea--disabled',
					props.isReadOnly && 'vx-textarea--readonly',
					props.isLoading && 'vx-textarea--loading',
					props.status && `vx-textarea--status-${props.status.type}`,
					props.status && 'vx-textarea--has-status',
					props.size && `vx-textarea--size-${props.size}`,
					props.autoGrow && 'vx-textarea--autogrow',
					props.className,
				)}
				style={{
					...normStyle(props.style),
					...(props.placeholderTextColor
						? { '--placeholder-color': props.placeholderTextColor }
						: {}),
				}}
				value={value}
				inputMode={
					props.keyboardType === 'number'
						? 'numeric'
						: props.keyboardType === 'phone'
							? 'tel'
							: props.keyboardType === 'default'
								? 'text'
								: props.keyboardType
				}
				enterKeyHint={props.returnKeyType}
				aria-label={props.ariaLabel}
				aria-labelledby={props.ariaLabelledBy}
				aria-describedby={props.ariaDescribedBy}
				aria-description={props.ariaDescription}
				aria-required={(props.isRequired && !props.isOptional) || undefined}
				aria-invalid={props.status?.type === 'error' || undefined}
				aria-busy={props.isLoading || undefined}
				disabled={props.isDisabled || undefined}
				readOnly={props.isReadOnly || undefined}
				placeholder={props.placeholder}
				maxLength={props.maxLength}
				rows={props.rows ?? (props.autoGrow ? 1 : 3)}
				onInput={(e: any) => {
					fit()
					setValue(e.target.value)
				}}
				onKeyDown={(e: any) => {
					if (
						e.key === 'Enter' &&
						(e.ctrlKey || e.metaKey) &&
						!e.isComposing &&
						e.keyCode !== 229
					) {
						props.onSubmit?.()
					}
				}}
				onFocus={props.onFocus}
				onBlur={props.onBlur}
			/>
			{props.status && (props.statusVariant ?? 'attached') === 'attached' ? (
				<span className="vx-textarea-status">
					<span className="vx-input-status-icon" aria-hidden="true">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							width="1em"
							height="1em"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d={STATUS_ICON_PATHS[props.status.type as keyof typeof STATUS_ICON_PATHS]}
							/>
						</svg>
					</span>
				</span>
			) : null}
			{props.maxLength != null ? (
				<span
					className="vx-textarea-counter"
					aria-hidden="true"
				>{`${value.length}/${props.maxLength}`}</span>
			) : null}
		</div>
	)

	if (!needsChrome) {
		return shell
	}

	return (
		<FormField
			inputID={controlId}
			descriptionID={`${controlId}-description`}
			statusID={`${controlId}-status`}
			label={inputProps.label}
			description={inputProps.description}
			status={inputProps.status}
			isRequired={inputProps.isRequired}
			isOptional={inputProps.isOptional}
			isLabelHidden={inputProps.isLabelHidden}
			isDisabled={inputProps.isDisabled}
			labelTooltip={inputProps.labelTooltip}
			disabledMessage={inputProps.disabledMessage}
			width={inputProps.width}
		>
			{shell}
		</FormField>
	)
}
