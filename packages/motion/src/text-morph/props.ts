import type { TextProps } from '@octane-xplat/ui'

export interface TextMorphRun {
	runId: number
	from: string
	to: string
}

export interface TextMorphCancel extends TextMorphRun {
	reason:
		| 'superseded'
		| 'motion-disabled'
		| 'reduced-motion'
		| 'unsupported-input'
		| 'layout-invalidated'
}

/** Whole-word motion for complete plain text. Presentation uses ordinary Text
 * props/styles. Semantic text and selection must always expose exactly value;
 * platform escape hatches cannot override it with a different accessible name.
 * No children, alternate accessible value, truncation, or multiline contract.
 */
export interface TextMorphProps extends Omit<
	TextProps,
	'children' | 'accessibilityLabel' | 'accessibilityValue' | 'numberOfLines' | 'ellipsize'
> {
	/** Exact latest text, including whitespace and normalization form. Empty is
	 * valid. Animate only reliable single-line LTR input, <=80 graphemes and
	 * <=32 words on both sides, within 10,000 matching/scoring operations.
	 * Unsupported input and missing geometry settle to exact static text. */
	value: string
	/** Defaults to true. System reduced motion always wins. Disabling cancels
	 * active motion once, even for unchanged value, and discards pending work.
	 * Re-enabling leaves this value static and animates the next change. */
	enabled?: boolean
	/** Requests one announcement per changed complete value, including static
	 * fallback; no-op, layout and completion request none. Default none.
	 * Semantic text always exposes the latest complete value immediately. */
	accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
	/** Linear duration in milliseconds; default 400. Zero disables motion.
	 * Negative/non-finite values use the default. A positive change only affects
	 * the next run; the active run retains its accepted duration. */
	duration?: number
	/** Notifications only for runs whose first animated presentation was applied.
	 * Increasing instance-local IDs; logical from/to, not sampled positions.
	 * Exactly one completion or cancellation after state is coherent, using the
	 * current handler. Mount, no-op, static updates, discarded measurement, and
	 * unmount emit neither notification. Reentrant value changes are supported.
	 */
	onComplete?: (run: TextMorphRun) => void
	/** Superseded begun runs cancel once (unsupported-input for unsupported
	 * replacement). Disabled/zero-duration, reduced motion, and invalid geometry
	 * cancel with their corresponding reason and settle to latest exact text. */
	onCancel?: (run: TextMorphCancel) => void
}

export function resolveTextMorphDuration(duration: number | undefined): number {
	return duration === undefined || !Number.isFinite(duration) || duration < 0 ? 400 : duration
}
