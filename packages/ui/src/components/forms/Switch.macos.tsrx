/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { useCallback, useId, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { SwitchProps } from '../../props'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useFieldControl } from './field-context'
import { FormField } from './FormField.macos.tsrx'
import { useThemeScheme } from '../../theme/theme-scheme.macos'
import { controlColors } from '../../internal/platform/control-colors.macos'
import { ActivityIndicator } from '../feedback/ActivityIndicator.macos.tsrx'
import { AppKitLabelPress } from '../actions/label-press.macos.tsrx'

export function Switch(inputProps: SwitchProps) @{
	const { props, inField } = useFieldControl(inputProps)
	const generatedID = useId()
	const controlID = props.id ?? generatedID
	const ownChrome = !inField
	const size = props.size === 'sm' ? 'sm' : 'md'
	const hasText =
		ownChrome && !props.isLabelHidden && (props.label != null || props.description != null)

	const [internal, setInternal] = useState(props.defaultValue ?? false)
	const checked = props.value ?? internal
	const localValue = useRef(internal)
	const [pending, setPending] = useState(false)
	const active = useRef<symbol | null>(null)
	const attached = useRef(true)
	const control = useRef<NSView | null>(null)
	// Ref teardown also covers unmount before passive effects would run.
	const bind = useCallback((view: NSView | null) => {
		control.current = view
		attached.current = Boolean(view)
		if (!view) {
			active.current = null
		}
	}, [])

	const loading = Boolean(props.isLoading || pending)
	const isBlocked = props.isDisabled || props.isReadOnly || pending
	const latest = useRef(props)
	latest.current = props
	const colors = controlColors(useThemeScheme() === 'dark')
	const toggle = () => {
		const props = latest.current
		if (!attached.current || props.isDisabled || props.isReadOnly || active.current) {
			return
		}

		const previous = props.value ?? localValue.current,
			next = !previous

		const uncontrolled = props.value === undefined
		const token = Symbol('switch-action')
		active.current = token // Claim before application callbacks can reenter.
		try {
			if (uncontrolled) {
				localValue.current = next
				setInternal(next)
			}

			props.onChange?.(next)
		} catch (error) {
			if (active.current === token) {
				active.current = null
			}

			throw error
		}

		if (!props.changeAction) {
			if (active.current === token) {
				active.current = null
			}

			return
		}

		// Preserve the event's save even when onChange detaches its UI owner.
		if (attached.current && active.current === token) {
			setPending(true)
		}

		const settle = (failed: boolean) => {
			if (!attached.current || active.current !== token) {
				return
			}

			try {
				if (failed) {
					if (uncontrolled) {
						localValue.current = previous
						setInternal(previous)
					}

					props.onChange?.(previous)
				}
			} catch (error) {
				console.error('[macos-switch] rollback failed', error)
			} finally {
				if (attached.current && active.current === token) {
					active.current = null
					setPending(false)
				}
			}
		}

		try {
			Promise.resolve(props.changeAction(next)).then(
				() => settle(false),
				() => settle(true),
			)
		} catch {
			settle(true)
		}
	}

	<masonview
		className={cx('vx-switch-field--appkit', props.className)}
		style={mergeStyle(props.width != null ? { width: props.width } : {}, props.style)}
	>
		<masonview
			className={cx(
				'vx-switch-container--appkit',
				hasText && props.labelPosition === 'start' && 'vx-switch-container--label-start',
				props.labelSpacing === 'spread' && 'vx-switch-container--spread',
			)}
		>
			<masonview
				id={controlID}
				ref={bind}
				testID={props.testID}
				className={cx(
					'vx-switch',
					'vx-switch--appkit',
					`vx-switch--size-${size}`,
					checked && 'vx-switch--on',
					props.isDisabled && 'vx-switch--disabled',
					props.isReadOnly && 'vx-switch--readonly',
					loading && 'vx-switch--loading',
					props.status && `vx-switch--status-${props.status.type}`,
				)}
				style={{ backgroundColor: checked ? colors.primary : colors.border }}
				accessibilityRole="switch"
				accessibilityLabel={
					props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
				}
				accessibilityHint={props.accessibilityHint}
				accessibilityState={{
					checked,
					disabled: props.isDisabled,
					readonly: props.isReadOnly,
					busy: loading,
					required: props.isRequired && !props.isOptional,
					invalid: props.status?.type === 'error',
				}}
				onTap={isBlocked ? undefined : toggle}
			>
				<masonview className="vx-switch-thumb" style={{ backgroundColor: colors.surface }}>
					{loading ? <ActivityIndicator size="xsm" accessibilityLabel="Loading" /> : null}
				</masonview>
			</masonview>
			{hasText ? (
				<AppKitLabelPress
					blocked={Boolean(isBlocked)}
					control={() => control.current}
					press={toggle}
				>
					<FormField
						className={cx('vx-switch-text', size === 'sm' && 'vx-switch-text--sm')}
						inputID={controlID}
						label={props.label}
						description={props.description}
						labelTooltip={props.labelTooltip}
						isRequired={props.isRequired}
						isOptional={props.isOptional}
						isDisabled={props.isDisabled}
						isReadOnly={props.isReadOnly}
						isLoading={loading}
						size={size}
					/>
				</AppKitLabelPress>
			) : null}
		</masonview>
		{ownChrome && props.status?.message != null ? (
			<label
				id={`${controlID}-status`}
				className={cx(
					'vx-field-status',
					`vx-field-status--${props.status.type}`,
					'vx-field-status--detached',
				)}
				text={props.status.message}
			/>
		) : null}
	</masonview>
}
