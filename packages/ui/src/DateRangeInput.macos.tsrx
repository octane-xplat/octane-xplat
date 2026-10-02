/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useId, useRef, useState } from 'octane'
import type { DateRange, DateRangeInputProps } from './props'
import { cx } from './cx'
import { Icon } from './Icon.macos.tsrx'
import { Pressable } from './Pressable.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { FieldContext, useFieldControlProps } from './field-context'
import { Calendar } from './Calendar.macos.tsrx'
import { formatDateValue, resolveLocale } from './datetime'

const STATUS_TEXT = { error: '⚠', warning: '⚠', success: '✓' } as const

function RangeControl(inputProps: DateRangeInputProps) @{
	const props = useFieldControlProps(inputProps)
	const locale = resolveLocale()
	const generatedId = useId()
	const inputId = props.id ?? generatedId

	const [open, setOpen] = useState(false)
	const anchor = useRef<any>(null)
	const [busy, setBusy] = useState(false)
	const [draft, setDraft] = useState<DateRange | null | undefined>(undefined)

	const value = props.value
	const shown: DateRange | undefined = draft === undefined ? (value ?? undefined) : (draft ?? undefined)
	const isDisabled = !!props.isDisabled || !!props.isReadOnly
	const isBusy = !!props.isLoading || busy

	const fireChange = (next: DateRange | null) => {
		if (isDisabled) return
		setDraft(next)
		props.onChange?.(next)
		if (props.changeAction) {
			setBusy(true)
			Promise.resolve(props.changeAction(next)).finally(() => setBusy(false))
		}
	}

	const displayText = shown ? `${formatDateValue(shown.start, 'date_long', locale)} – ${formatDateValue(shown.end, 'date_long', locale)}` : ''
	const isSelectedPreset = (p: { getRange: () => DateRange }) => { const r = p.getRange(); return shown?.start === r.start && shown?.end === r.end }
	const statusText = props.status ? STATUS_TEXT[props.status.type] : null

	<>
		<flexboxlayout
			ref={(v: any) => { anchor.current = v }}
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
				ref={(v: any) => { if (!v) return; props.bind?.({ focus: () => {}, blur: () => {}, native: v }) }}
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
		<Popover anchor={anchor} open={open} onDismiss={() => setOpen(false)} placement="bottom" className="vx-daterangeinput-popover">
			<flexboxlayout flexDirection="column" className="vx-daterangeinput-dialog">
				{props.presets?.length ? (
					<scrollview className="vx-daterangeinput-presets" accessibilityLabel="Presets">
						<stacklayout>
							{props.presets.map((preset) => (
								<flexboxlayout
									key={preset.label}
									onTap={() => { fireChange(preset.getRange()); setOpen(false) }}
									className={cx('vx-daterangeinput-preset', isSelectedPreset(preset) && 'vx-daterangeinput-preset--selected')}
									accessibilityRole={"button" as any}
									accessibilityState={{ selected: isSelectedPreset(preset) } as any}
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
					onChange={(range: DateRange) => fireChange(range)}
					min={props.min}
					max={props.max}
					dateConstraints={props.dateConstraints}
					maxRangeSpan={props.maxRangeSpan}
					minRangeSpan={props.minRangeSpan}
					numberOfMonths={props.numberOfMonths}
					weekStartsOn={props.weekStartsOn}
				/>
			</flexboxlayout>
		</Popover>
	</>
}

/** Date-range entry — trigger + range Calendar with optional `presets`. On
  *  On macOS the picker surface is the anchored popover, matching Astryx's
 *  popover-only DateRangeInput anatomy. */
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
