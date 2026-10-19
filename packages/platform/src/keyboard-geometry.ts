/** @internal Device-independent coordinates in the owning window. */
export interface KeyboardRect {
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

/** @internal Invalid or unavailable native geometry is not a hidden keyboard. */
export function isKeyboardRect(rect: KeyboardRect | null | undefined): rect is KeyboardRect {
	return (
		!!rect &&
		[rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) &&
		rect.width >= 0 &&
		rect.height >= 0
	)
}

/** A scalar bottom inset only describes a full-width, bottom-docked occlusion.
 * Floating rectangles remain available for focused-input intersection checks.
 * @internal */
export function keyboardBottomOverlap(
	host: KeyboardRect | null,
	frame: KeyboardRect | null,
): number {
	const displacement = keyboardBottomDisplacement(host, frame)
	return displacement > 0 ? Math.min(host!.height, displacement) : 0
}

/** Distance needed to place a bottom-anchored control above a docked keyboard.
 * Unlike viewport overlap, this can exceed the control's own height. @internal */
export function keyboardBottomDisplacement(
	host: KeyboardRect | null,
	frame: KeyboardRect | null,
): number {
	if (!isKeyboardRect(host) || !isKeyboardRect(frame) || !host.width || !frame.height) {
		return 0
	}

	const bottom = host.y + host.height
	const tolerance = 1
	if (
		frame.x > host.x + tolerance ||
		frame.x + frame.width < host.x + host.width - tolerance ||
		frame.y + frame.height < bottom - tolerance
	) {
		return 0
	}

	return Math.max(0, bottom - frame.y)
}

/** Account for both physical host resizing and space already provided upstream.
 * The budget is capped by actual overlap, rather than subtracting native resize
 * a second time. Offset keeps its compatibility meaning: extra space while open.
 * @internal */
export function keyboardAvoidancePadding(options: {
	windowInset: number
	hostOverlap: number
	consumedSafeArea?: number
	ancestorAvoidance?: number
	offset?: number
}): number {
	const {
		windowInset,
		hostOverlap,
		consumedSafeArea = 0,
		ancestorAvoidance = 0,
		offset = 0,
	} = options
	if (!(windowInset > 0)) {
		return 0
	}

	const budget = Math.max(
		0,
		windowInset - Math.max(0, consumedSafeArea) - Math.max(0, ancestorAvoidance),
	)
	return Math.max(0, Math.min(Math.max(0, hostOverlap), budget) + offset)
}
