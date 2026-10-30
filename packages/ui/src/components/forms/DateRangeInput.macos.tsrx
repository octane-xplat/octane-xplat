/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { createAppKitDateFieldHandle } from './date-field-handle.macos'
import {
	useImperativeHandle,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	useCallback,
} from 'octane'

import type { DateRange, DateRangeInputProps } from '../../props'
import type { NSView } from '@octane-xplat/platform/macos'
import { cx } from '@octane-xplat/lib'
import { runDateChangeAction } from './date-field-action'
import { Icon } from '../media/Icon.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { Popover } from '../overlays/Popover.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.macos.tsrx'
import { formatDateValue, resolveLocale } from './datetime'
import { isDateRangeAllowed } from './calendar-core'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function RangeControl(inputProps: DateRangeInputProps) @{
	const hostRef = useRef<NSView | null>(null)
	const bindHost = useCallback((view: NSView | null) => {
		hostRef.current = view
	}, [])

	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale(props.locale)
	const generatedId = useId()
	const inputId = props.id ?? generatedId

	const anchor = useRef<NSView | null>(null)
	const [open, setOpenState] = useState(false)
	const openRef = useRef(open)
	openRef.current = open
	const writing = useRef(false),
		actionPending = useRef(false)

	const setOpen = (next: boolean) => {
		openRef.current = next
		if (anchor.current) {
			setOpenState(next)
		}
	}

	const bindAnchor = useCallback((view: NSView | null) => {
		anchor.current = view
		if (!view) {
			openRef.current = false
		}
	}, [])

	const [busy, setBusy] = useState(false)

	const value = props.value
	const shown = value ?? undefined
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const blocked = useRef(isDisabled || isBusy)
	blocked.current = isDisabled || isBusy

	const current = useRef(props)
	current.current = props
	useEffect(() => {
		if (blocked.current && openRef.current) {
			setOpen(false)
		}
	}, [isDisabled, isBusy])

	const fireChange = (next: DateRange | null): boolean => {
		const live = current.current
		if (!anchor.current || blocked.current || writing.current || actionPending.current) {
			return false
		}

		writing.current = true
		try {
			if (next !== null && !isDateRangeAllowed(next, live)) {
				return false
			}

			live.onChange?.(next)
			if (live.changeAction) {
				actionPending.current = true
				if (anchor.current) {
					setBusy(true)
				}

				runDateChangeAction(
					() => live.changeAction!(next),
					() => {
						actionPending.current = false
						if (anchor.current) {
							setBusy(false)
						}
					},
				)
			}

			return true
		} finally {
			writing.current = false
		}
	}

	const selectRange = (range: DateRange) => {
		if (openRef.current && fireChange(range) && anchor.current) {
			setOpen(false)
		}
	}

	const isPresetDisabled = (preset: { getRange: () => DateRange }) =>
		isDisabled || isBusy || !isDateRangeAllowed(preset.getRange(), props)

	const displayText = shown
		? `${formatDateValue(shown.start, 'date_long', locale)} – ${formatDateValue(shown.end, 'date_long', locale)}`
		: ''

	const isSelectedPreset = (p: { getRange: () => DateRange }) => {
		const r = p.getRange()
		return shown?.start === r.start && shown?.end === r.end
	}

	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	useImperativeHandle(
		props.ref,
		() =>
			createAppKitDateFieldHandle({
				primary: () => hostRef.current,
				blocked: () => blocked.current || actionPending.current,
			}),
		[],
	)

	<>
		<masonview
			ref={bindAnchor}
			className={cx(
				'vx-daterangeinput',
				isDisabled && 'vx-daterangeinput--disabled',
				isBusy && 'vx-daterangeinput--loading',
				props.status && `vx-daterangeinput--status-${props.status.type}`,
				props.size && `vx-daterangeinput--size-${props.size}`,
				open && 'vx-daterangeinput--open',
				props.className,
			)}
			style={mergeStyle(
				{ flexDirection: 'row', alignItems: 'center' },
				mergeStyle({ display: 'flex' }, props.style),
			)}
		>
			<Pressable
				id={inputId}
				className={cx(
					'vx-daterangeinput-trigger',
					!shown && 'vx-daterangeinput-trigger--placeholder',
				)}
				disabled={isDisabled || isBusy}
				accessibilityLabel={
					props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
				}
				accessibilityHint={props.accessibilityHint}
				accessibilityState={{ disabled: isDisabled, busy: isBusy }}
				ref={bindHost}
				onPress={() => {
					if (anchor.current && !blocked.current && !writing.current && !actionPending.current) {
						setOpen(!openRef.current)
					}
				}}
			>
				<masonview
					style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
				>
					<Icon name="xplat-calendar" size={16} />
					<label className="vx-daterangeinput-text" text={displayText || 'Select a date range'} />
				</masonview>
			</Pressable>
			{(props.hasClear ?? true) && shown != null && !isDisabled && !isBusy ? (
				<Pressable
					className="vx-daterangeinput-clear"
					accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date range'}`}
					onPress={() => fireChange(null)}
				>
					<label text="×" />
				</Pressable>
			) : null}
			{statusText != null ? (
				<label
					className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)}
					text={statusText}
					accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined}
				/>
			) : null}
		</masonview>
		<Popover
			anchor={anchor}
			open={open && !isDisabled && !isBusy}
			onDismiss={() => setOpen(false)}
			placement="bottom"
			className="vx-daterangeinput-popover"
		>
			<masonview
				className="vx-daterangeinput-dialog"
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{props.presets?.length ? (
					<scrollview className="vx-daterangeinput-presets" accessibilityLabel="Presets">
						<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
							{props.presets.map((preset, index) => (
								<masonview
									key={preset.label}
									id={`${inputId}-preset-${index}`}
									onTap={() => {
										if (
											!anchor.current ||
											!openRef.current ||
											blocked.current ||
											writing.current ||
											actionPending.current
										) {
											return
										}

										const live = current.current.presets?.find(
											(item) => item.label === preset.label,
										)

										if (live) {
											selectRange(live.getRange())
										}
									}}
									className={cx(
										'vx-daterangeinput-preset',
										isSelectedPreset(preset) && 'vx-daterangeinput-preset--selected',
									)}
									accessibilityRole="button"
									isEnabled={!isPresetDisabled(preset)}
									accessibilityState={{
										selected: isSelectedPreset(preset),
										disabled: isPresetDisabled(preset),
									}}
									style={{ display: 'flex' }}
								>
									<label text={preset.label} />
								</masonview>
							))}
						</masonview>
					</scrollview>
				) : null}
				<Calendar
					locale={props.locale}
					direction={props.direction}
					messages={props.messages}
					mode="range"
					value={shown}
					onChange={selectRange}
					min={props.min}
					max={props.max}
					dateConstraints={props.dateConstraints}
					maxRangeSpan={props.maxRangeSpan}
					minRangeSpan={props.minRangeSpan}
					numberOfMonths={props.numberOfMonths}
					weekStartsOn={props.weekStartsOn}
				/>
			</masonview>
		</Popover>
	</>
}

/** Date-range entry — trigger + range Calendar with optional `presets`. On
 *  On macOS the picker surface is the anchored popover, matching Astryx's
 *  popover-only DateRangeInput anatomy. */
export function DateRangeInput(props: DateRangeInputProps): unknown @{
	const inField = useContext(FieldContext) != null
	const cid = useId()
	const control = <RangeControl {...props} />

	<>
		{inField ? (
			control
		) : (
			<FormField
				inputID={props.id ?? cid}
				label={props.label}
				isLabelHidden={props.isLabelHidden}
				description={props.description}
				isDisabled={props.isDisabled}
				disabledMessage={props.disabledMessage}
				isReadOnly={props.isReadOnly}
				isLoading={props.isLoading}
				isRequired={props.isRequired}
				isOptional={props.isOptional}
				size={props.size}
				status={props.status}
				statusVariant={props.statusVariant}
				labelTooltip={props.labelTooltip}
				width={props.width}
			>
				{control}
			</FormField>
		)}
	</>
}
