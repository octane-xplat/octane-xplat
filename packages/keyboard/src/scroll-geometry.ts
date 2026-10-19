import type { KeyboardRect } from '@octane-xplat/platform/keyboard-geometry'
import type { FocusedInputSnapshot } from './focus-types'
import type { KeyboardSnapshot } from './types'

export interface FocusScrollOperation {
	id: object
	from: number
	to: number
}

/** Plan nearest-first minimal scrolling; SDK writes live in platform leaves. */
export function focusScrollPlan(
	focus: FocusedInputSnapshot,
	keyboard: KeyboardSnapshot,
	root: object,
	clearance: number,
): FocusScrollOperation[] {
	const end = focus.scrollOwners.findIndex((owner) => owner.id === root)
	if (end < 0 || !focus.inputRect || !focus.windowRect) {
		return []
	}
	const owners = focus.scrollOwners.slice(0, end + 1)
	let target: KeyboardRect = { ...focus.inputRect }
	let windowBottom = focus.windowRect.y + focus.windowRect.height
	const frame = keyboard.currentFrame ?? keyboard.targetFrame
	if (
		frame &&
		frame.y + frame.height >= windowBottom - 1 &&
		frame.height > 0 &&
		frame.x < target.x + target.width &&
		frame.x + frame.width > target.x
	) {
		windowBottom = Math.min(windowBottom, frame.y)
	}
	const available =
		Math.min(
			...owners.map(
				(owner) =>
					Math.min(owner.rect.y + owner.rect.height, windowBottom) -
					Math.max(owner.rect.y, focus.windowRect!.y),
			),
		) -
		clearance * 2
	if (target.height > available && focus.caretRect) {
		target = { ...focus.caretRect }
	}
	const result: FocusScrollOperation[] = []
	for (const owner of owners) {
		const top = Math.max(owner.rect.y, focus.windowRect.y) + clearance
		const bottom = Math.min(owner.rect.y + owner.rect.height, windowBottom) - clearance
		if (bottom <= top) {
			continue
		}

		const delta =
			target.height > bottom - top
				? target.y - top
				: target.y < top
					? target.y - top
					: target.y + target.height > bottom
						? target.y + target.height - bottom
						: 0

		const to = Math.max(owner.minOffsetY, Math.min(owner.maxOffsetY, owner.offsetY + delta))
		const moved = to - owner.offsetY
		if (Math.abs(moved) > 0.5) {
			result.push({ id: owner.id, from: owner.offsetY, to })
			target = { ...target, y: target.y - moved }
		}
	}
	return result
}
