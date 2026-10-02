/** @jsxImportSource @nativescript-community/octane */
import { useRef, useImperativeHandle, useContext, useId, useState } from 'octane'
import type { DateRange, DateRangeInputProps } from './props'
import { cx } from './cx'
import { runDateChangeAction } from './date-field-action'
import { Icon } from './Icon'
import { Pressable } from './Pressable'
import { FormField } from './FormField'
import { BottomSheet } from './BottomSheet'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar'
import { formatDateValue, resolveLocale } from './datetime'
import { isDateRangeAllowed } from './calendar-core'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function RangeControl(inputProps: DateRangeInputProps) @{
	const hostRef = useRef<any>(null);
	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale()
	const generatedId = useId()
	const inputId = props.id ?? generatedId

	const [open, setOpen] = useState(false)
	const [busy, setBusy] = useState(false)

	const value = props.value
	const shown = value ?? undefined
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy

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
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	useImperativeHandle(props.ref, () => ({ focus: () => {}, blur: () => {}, native: hostRef.current }), undefined);

	<>
		<flexboxlayout
			flexDirection="row"
			alignItems="center"
			className={cx(
				'vx-daterangeinput',
				isDisabled && 'vx-daterangeinput--disabled',
				isBusy && 'vx-daterangeinput--loading',
				props.status && `vx-daterangeinput--status-${props.status.type}`,
				props.size && `vx-daterangeinput--size-${props.size}`,
				open && 'vx-daterangeinput--open',
				props.className,
			)}
			style={props.style}
		>
			<Pressable
				id={inputId}
				className={cx('vx-daterangeinput-trigger', !shown && 'vx-daterangeinput-trigger--placeholder')}
				disabled={isDisabled || isBusy}
				accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
				accessibilityHint={props.accessibilityHint}
				accessibilityState={{ disabled: isDisabled, busy: isBusy } as any}
				ref={(v: any) => { hostRef.current = v; }}
				onPress={() => { if (!isDisabled && !isBusy) setOpen(!open) }}
			>
				<flexboxlayout flexDirection="row" alignItems="center">
					<Icon name="xplat-calendar" size={16} />
					<label className="vx-daterangeinput-text" text={displayText || 'Select a date range'} />
				</flexboxlayout>
			</Pressable>
			{(props.hasClear ?? true) && shown != null && !isDisabled && !isBusy
				? <Pressable className="vx-daterangeinput-clear" accessibilityLabel={`Clear ${props.fieldLabel ?? props.label ?? 'date range'}`} onPress={() => fireChange(null)}><label text="×" /></Pressable>
				: null}
			{statusText != null
				? <label className={cx('vx-field-icon', `vx-field-icon--${props.status!.type}`)} text={statusText} accessibilityLabel={props.statusVariant === 'tooltip' ? props.status?.message : undefined} />
				: null}
		</flexboxlayout>
		<BottomSheet isOpen={open} onOpenChange={(isOpen) => setOpen(isOpen)} label={props.label ?? props.accessibilityLabel ?? 'Choose a date range'} height="hug" className="vx-daterangeinput-sheet">
			<flexboxlayout flexDirection="column" className="vx-daterangeinput-dialog">
				{props.presets?.length ? (
					<scrollview className="vx-daterangeinput-presets" accessibilityLabel="Presets">
						<stacklayout>
							{props.presets.map((preset, index) => (
								<flexboxlayout
									key={preset.label}
									id={`${inputId}-preset-${index}`}
									onTap={() => { if (!isPresetDisabled(preset)) selectRange(preset.getRange()) }}
									className={cx('vx-daterangeinput-preset', isSelectedPreset(preset) && 'vx-daterangeinput-preset--selected')}
									accessibilityRole={"button" as any}
									isEnabled={!isPresetDisabled(preset)}
									accessibilityState={{ selected: isSelectedPreset(preset), disabled: isPresetDisabled(preset) } as any}
								>
									<label text={preset.label} />
								</flexboxlayout>
							))}
						</stacklayout>
					</scrollview>
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
			</flexboxlayout>
		</BottomSheet>
	</>
}

/** Date-range entry — trigger + range Calendar with optional `presets`. On
 *  iOS/Android the picker surface is a bottom sheet (Astryx's popover has
 *  no touch story for a two-month range grid); `Popover` is the desktop
 *  surface. */
export function DateRangeInput(props: DateRangeInputProps) @{
	const inField = useContext(FieldContext) != null
	const cid = useId()
	const control = <RangeControl {...props} />

	<>
		{inField ? control : (
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
