/** Astryx spacing steps are 4px/dip units (`--spacing-N` = N×4). Shared by
 *  components whose props take a step number (ScrollableArea padding,
 *  Dialog padding, Carousel gap). */
export function spacingStep(step: number | undefined): number | undefined {
	return step == null ? undefined : step * 4
}
