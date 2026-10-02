import { useImperativeHandle, useContext, useId, useMemo, useRef, useState } from 'octane'
import type { DateRange, DateRangeInputProps, ISODateString } from './props'
import { cx } from './cx'
import { runDateChangeAction } from './date-field-action'
import { Icon } from './Icon.web.tsrx'
import { FormField } from './FormField.web.tsrx'
import { Popover } from './Popover.web.tsrx'
import { Tooltip } from './Tooltip.web.tsrx'
import { ActivityIndicator } from './ActivityIndicator.web.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.web.tsrx'
import { formatDateValue, resolveLocale } from './datetime'
import { isDateRangeAllowed } from './calendar-core'

const STATUS_GLYPHS = { error: '⚠', warning: '⚠', success: '✓' } as const

function RangeControl(inputProps: DateRangeInputProps) @{
	const hostRef = useRef<any>(null);
	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale()
	const generatedId = useId()
	const inputId = props.id ?? generatedId
	const anchor = useRef<any>(null)

	const [open, setOpen] = useState(false)
	const [busy, setBusy] = useState(false)

	const value = props.value
	const shown = value ?? undefined
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy
	const canClear = (props.hasClear ?? true) && shown != null && !isDisabled && !isBusy
	const showsDisabledReason = isDisabled && !!props.disabledMessage

	const fireChange = (next: DateRange | null) => {
		if (isDisabled || isBusy || next !== null && !isDateRangeAllowed(next, props)) return
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			runDateChangeAction(() => props.changeAction!(next), () => setBusy(false))
		}
	}

	const selectRange = (range: DateRange) => {
		if (isDisabled || isBusy || !isDateRangeAllowed(range, props)) return
		fireChange(range)
		setOpen(false)
	}

	const isPresetDisabled = (preset: { getRange: () => DateRange }) =>
		isDisabled || isBusy || !isDateRangeAllowed(preset.getRange(), props)

	const displayText = shown ? `${formatDateValue(shown.start, 'date_long', locale)} – ${formatDateValue(shown.end, 'date_long', locale)}` : ''
	const isSelectedPreset = (p: { getRange: () => DateRange }) => { const r = p.getRange(); return shown?.start === r.start && shown?.end === r.end }

	const statusType = props.status?.type

	const shellNode = (
		<div
			ref={(el: any) => { anchor.current = el }}
			className={cx(
				'vx-daterangeinput',
				isDisabled && 'vx-daterangeinput--disabled',
				isBusy && 'vx-daterangeinput--loading',
				statusType && `vx-daterangeinput--status-${statusType}`,
				props.size && `vx-daterangeinput--size-${props.size}`,
				open && 'vx-daterangeinput--open',
				props.className,
			)}
			style={props.style}
		>
			<button
				ref={(el: any) => { hostRef.current = el; }}
				id={inputId}
				type="button"
				className={cx('vx-daterangeinput-trigger', !shown && 'vx-daterangeinput-trigger--placeholder')}
				disabled={isDisabled && !showsDisabledReason || undefined}
				aria-disabled={showsDisabledReason || undefined}
				aria-label={props.ariaLabel}
				aria-labelledby={props.ariaLabelledBy}
				aria-describedby={props.ariaDescribedBy}
				aria-required={props.isRequired && !props.isOptional || undefined}
				aria-invalid={statusType === 'error' || undefined}
				aria-busy={isBusy || undefined}
				aria-expanded={open}
				aria-haspopup="dialog"
				onClick={() => { if (!(showsDisabledReason) && !isBusy) setOpen(!open) }}
			>
				<Icon name="xplat-calendar" size={16} />
				<span className="vx-daterangeinput-text">{displayText || 'Select a date range'}</span>
			</button>
			{canClear ? <button type="button" className="vx-daterangeinput-clear" aria-label={`Clear ${props.fieldLabel ?? props.label ?? 'date range'}`} onClick={(e: any) => { e.stopPropagation(); fireChange(null) }}>{'×'}</button> : null}
			{isBusy ? <ActivityIndicator busy className="vx-daterangeinput-spinner" /> : null}
			{statusType ? (
				props.statusVariant === 'tooltip' && props.status?.message
					? <Tooltip trigger={<span className={cx('vx-field-icon', `vx-field-icon--${statusType}`)}>{STATUS_GLYPHS[statusType]}</span>} content={props.status.message} />
					: <span className={cx('vx-field-icon', `vx-field-icon--${statusType}`)}>{STATUS_GLYPHS[statusType]}</span>
			) : null}
		</div>
	)

	useImperativeHandle(props.ref, () => ({ focus: () => hostRef.current.focus(), blur: () => hostRef.current.blur(), native: hostRef.current }), undefined);

	<>
		{showsDisabledReason ? <Tooltip trigger={shellNode} content={props.disabledMessage!} /> : shellNode}
		<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom" className="vx-daterangeinput-popover">
			<div className="vx-daterangeinput-dialog">
				{props.presets?.length ? (
					<div className="vx-daterangeinput-presets" role="group" aria-label="Presets">
						{props.presets.map((preset, index) => (
							<button
								key={preset.label}
								id={`${inputId}-preset-${index}`}
								type="button"
								className={cx('vx-daterangeinput-preset', isSelectedPreset(preset) && 'vx-daterangeinput-preset--selected')}
								aria-pressed={isSelectedPreset(preset)}
								disabled={isPresetDisabled(preset)}
								onClick={() => { selectRange(preset.getRange()) }}
							>
								{preset.label}
							</button>
						))}
					</div>
				) : null}
				<Calendar
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
			</div>
		</Popover>
	</>
}

/** Date-range entry — trigger + popover with a range Calendar (and optional
 *  `presets` column). `value`/`onChange` use `DateRange`; emits `null`
 *  when cleared. */
export function DateRangeInput(props: DateRangeInputProps) @{
	const inField = useContext(FieldContext) != null
	const cid = useId()
	const control = <RangeControl {...props} />
	if (inField) return control
	return (
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
	)
}
