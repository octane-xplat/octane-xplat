/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { ProgressBarProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { useThemeScheme } from '../../theme/theme-scheme.macos'
import { mutedColor, progressFillColor, textColor } from '../../theme/scheme-colors'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** AppKit progress uses the renderer keyframe path for unknown progress;
 * reduced-motion rules retain a steady fill. Native playback is unqualified. */
export function ProgressBar(props: ProgressBarProps) @{
	const scheme = useThemeScheme()
	const max = Math.max(props.max ?? 100, 1e-9)
	const isIndeterminate = props.isIndeterminate ?? false
	const value = clamp(props.value ?? 0, 0, max)
	const pct = (value / max) * 100
	const formatValueLabel =
		props.formatValueLabel ?? ((v: number, m: number) => `${Math.round((v / m) * 100)}%`)

	const valueText = isIndeterminate ? '' : formatValueLabel(value, max)
	const isDisabled = props.isDisabled ?? false
	const isLabelHidden = props.isLabelHidden ?? false
	const hasValueLabel = props.hasValueLabel ?? false
	const variant = props.variant ?? 'accent'
	const marks = isIndeterminate ? [] : (props.marks ?? [])
	const showHead = !isLabelHidden || (!isIndeterminate && hasValueLabel)

	<masonview
		ref={props.ref}
		id={props.id}
		className={cx('vx-progressbar', `vx-progressbar--${variant}`, props.className)}
		style={mergeStyle(
			{ display: 'flex', flexDirection: 'column', ...(isDisabled ? { opacity: 0.38 } : {}) },
			props.style,
		)}
		accessible={props.accessible}
		accessibilityRole="progressbar"
		accessibilityLabel={props.accessibilityLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={{ disabled: isDisabled, busy: isIndeterminate }}
		accessibilityValue={isIndeterminate ? undefined : (props.accessibilityValue ?? String(value))}
		accessibilityMinValue={isIndeterminate ? undefined : 0}
		accessibilityMaxValue={isIndeterminate ? undefined : max}
		accessibilityValueDescription={isIndeterminate ? 'In progress' : valueText}
	>
		{showHead ? (
			<masonview
				className="vx-progressbar-head"
				style={mergeStyle(
					{ flexDirection: 'row', justifyContent: 'space-between' },
					{ display: 'flex' },
				)}
			>
				<label
					className="vx-progressbar-label"
					whiteSpace="nowrap"
					style={{ color: textColor(scheme), fontSize: 13 }}
				>
					{isLabelHidden ? ' ' : props.label}
				</label>
				{!isIndeterminate && hasValueLabel ? (
					<label
						className="vx-progressbar-value"
						whiteSpace="nowrap"
						style={{ color: mutedColor(scheme), fontSize: 13 }}
					>
						{valueText}
					</label>
				) : null}
			</masonview>
		) : null}
		<masonview
			className="vx-progressbar-track"
			style={mergeStyle(
				{ display: 'grid' },
				{
					overflow: 'hidden',
					borderRadius: 4,
					backgroundColor: scheme === 'dark' ? '#2e2e2e' : '#eaeaea',
					height: 8,
				},
			)}
		>
			<masonview
				style={mergeStyle(
					{ display: 'flex' },
					{
						borderRadius: 4,
						backgroundColor: progressFillColor(variant, scheme),
						justifySelf: 'start',
						width: isIndeterminate ? '40%' : `${pct}%`,
					},
				)}
				className={cx(
					'vx-progressbar-fill',
					'vx-progressbar-fill--appkit',
					`vx-progressbar-fill--${variant}`,
					isIndeterminate && 'vx-progressbar-fill--indeterminate',
				)}
			/>
			{marks.map((mark) => {
				const markPct = clamp(mark.value, 0, max) / max
				return (
					<masonview
						key={mark.value}
						style={{ display: 'grid', gridTemplateColumns: `${markPct}fr auto ${1 - markPct}fr` }}
					>
						<masonview
							style={mergeStyle(
								{ display: 'flex' },
								{ backgroundColor: mutedColor(scheme), gridColumn: '2' },
							)}
							className="vx-progressbar-mark"
							accessibilityLabel={mark.label}
						/>
					</masonview>
				)
			})}
		</masonview>
	</masonview>
}
