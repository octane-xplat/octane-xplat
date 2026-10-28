/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from './style-merge'
import { useMemo, useEffect, useRef } from 'octane'
import { refList } from './ref-list'
import type { ProgressBarProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps, nativeAccessibilityRole } from './escape-props'
import { useColorScheme } from './theme/colorScheme'
import { mutedColor, progressFillColor } from './scheme-colors'
import { nativeColor } from './native-color'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const INDETERMINATE_MS = 1200

/** ProgressBar — linear determinate/indeterminate progress. The label stays
 *  the bar's accessible name; `isLabelHidden` drops only the visual text.
 *  Marks are positioned by star-column split (left of the mark is `pct*`).
 *  Indeterminate mode loops a 40%-wide fill via `view.animate` (the NS CSS
 *  engine has no keyframes), measured from the track's laid-out width. */
export function ProgressBar(props: ProgressBarProps) @{
	const scheme = useColorScheme()
	const max = Math.max(props.max ?? 100, 1e-9)
	const isIndeterminate = props.isIndeterminate ?? false
	const value = clamp(props.value ?? 0, 0, max)
	const pct = (value / max) * 100
	const formatValueLabel =
		props.formatValueLabel ?? ((v: number, m: number) => `${Math.round((v / m) * 100)}%`)

	const valueText = formatValueLabel(value, max)
	const isDisabled = props.isDisabled ?? false
	const isLabelHidden = props.isLabelHidden ?? false
	const hasValueLabel = props.hasValueLabel ?? false
	const variant = props.variant ?? 'accent'
	const marks = isIndeterminate ? [] : (props.marks ?? [])
	const showHead = !isLabelHidden || (!isIndeterminate && hasValueLabel)

	const track = useRef<any>(null)
	const fill = useRef<any>(null)

	useEffect(() => {
		if (!isIndeterminate) {
			return
		}

		const trackView = track.current
		const fillView = fill.current
		if (!trackView || !fillView) {
			return
		}

		let cancelled = false
		let timer: ReturnType<typeof setTimeout> | undefined

		const run = () => {
			if (cancelled || !fill.current) {
				return
			}

			const width = trackView.getActualSize?.().width ?? 0
			const fillWidth = width * 0.4
			fillView.translateX = -fillWidth
			const done = () => {
				timer = setTimeout(run, 0)
			}

			const anim = fillView.animate?.({
				translate: { x: width + fillWidth, y: 0 },
				duration: INDETERMINATE_MS,
				curve: 'linear',
			})

			if (anim?.then) {
				anim.then(done, done)
			} else {
				done()
			}
		}

		if ((trackView.getActualSize?.().width ?? 0) > 0) {
			run()
		} else {
			const onLayout = () => {
				trackView.off?.('layoutChanged', onLayout)
				run()
			}

			trackView.on?.('layoutChanged', onLayout)
		}

		return () => {
			cancelled = true
			if (timer !== undefined) {
				clearTimeout(timer)
			}
		}
	}, [isIndeterminate])

	const forwardedRef = useMemo(
		() => refList((v: any) => applyEscapeProps(v, props), props.ref),
		[props.ref, props.ios, props.android, props.web],
	)

	<masonview
		ref={forwardedRef}
		id={props.id}
		className={cx('vx-progressbar', `vx-progressbar--${variant}`, props.className)}
		style={mergeStyle(
			{ display: 'flex' },
			{ ...(isDisabled ? { opacity: 0.38 } : {}), ...styleRecord(props.style) },
		)}
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
					style={isLabelHidden ? { visibility: 'hidden', height: 0 } : undefined}
				>
					{isLabelHidden ? ' ' : props.label}
				</label>
				{!isIndeterminate && hasValueLabel ? (
					<label
						className="vx-progressbar-value"
						whiteSpace="nowrap"
						style={{ color: nativeColor(mutedColor(scheme)) }}
					>
						{valueText}
					</label>
				) : null}
			</masonview>
		) : null}
		<masonview
			ref={(v: any) => {
				track.current = v
			}}
			className="vx-progressbar-track"
			height={8}
			accessible={props.accessible}
			accessibilityRole={nativeAccessibilityRole('progressbar')}
			accessibilityLabel={props.accessibilityLabel ?? props.label}
			accessibilityValue={isIndeterminate ? undefined : valueText}
			accessibilityHint={props.accessibilityHint}
			style={mergeStyle({ display: 'grid' }, { borderRadius: 4 })}
		>
			<masonview
				style={mergeStyle({ display: 'flex' }, [
					{
						borderRadius: 4,
						backgroundColor: nativeColor(progressFillColor(variant, scheme)),
					},
					{ justifySelf: 'start' },
				])}
				ref={(v: any) => {
					fill.current = v
				}}
				className={cx('vx-progressbar-fill', `vx-progressbar-fill--${variant}`)}
				width={isIndeterminate ? '40%' : `${pct}%`}
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
								{ backgroundColor: nativeColor(mutedColor(scheme)), gridColumn: '2' },
							)}
							className="vx-progressbar-mark"
							width={2}
							height={8}
							accessibilityLabel={mark.label}
							accessibilityRole={nativeAccessibilityRole('none')}
						/>
					</masonview>
				)
			})}
		</masonview>
	</masonview>
}
