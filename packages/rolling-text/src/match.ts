/** Survivor matching adapted from Scritto's bounded diff
 *  (packages/core/src/helpers.ts @ 5be617b — provenance in UPSTREAM.md, MIT
 *  license in LICENSE.scritto). Not a general LCS: a common prefix, then the
 *  longest run the two strings share near the length delta — '9 seconds' →
 *  '10 seconds' keeps ' seconds' instead of rerolling the label. Inputs are
 *  string arrays here instead of Scritto's HTMLElement[].textContent, so the
 *  calculation has no renderer dependency. */

/** Alignments searched either side of the flush suffix, for an end that grew
 *  or shrank. */
const RUN_BAND = 2

/** One unit shared by two unrelated strings is noise, not a run. */
const MIN_FLOAT_RUN = 2

/** A run buys its travel with its own length plus a separator's width. */
const GROUP_WIDTH = 2

const earnsTravel = (run: number, travel: number) => Math.abs(travel) <= run + GROUP_WIDTH

/**
 * Map of new index → surviving old index, or -1 for units with no retained
 * counterpart. The mapping is monotone (prefix plus one contiguous run), so
 * survivor order is identical on both sides.
 */
export function matchUnits(prev: string[], next: string[], anchor = 0): Int32Array {
	const lenOld = prev.length
	const lenNew = next.length
	const map = new Int32Array(lenNew).fill(-1)

	let start = 0
	while (start < lenOld && start < lenNew && prev[start] === next[start]) {
		start++
	}

	for (let i = 0; i < start; i++) {
		map[i] = i
	}

	let best = 0
	const maxSuffix = Math.min(lenOld - start, lenNew - start)
	while (best < maxSuffix && prev[lenOld - 1 - best] === next[lenNew - 1 - best]) {
		best++
	}

	let oldStart = lenOld - best
	let newStart = lenNew - best

	// `shift` aligns old index to new (new = old + shift), walking out from
	// the flush suffix, nearer side first, so ties travel least.
	const near = lenNew < lenOld ? 1 : -1
	for (let step = 0; step <= RUN_BAND * 2; step++) {
		const shift = lenNew - lenOld + ((step + 1) >> 1) * (step & 1 ? near : -near)
		const lo = shift < 0 ? start - shift : start // never reach back into the prefix
		let run = 0
		for (let i = Math.min(lenOld, lenNew - shift) - 1; i >= lo; i--) {
			if (prev[i] === next[i + shift]) {
				run++
				if (
					run > best &&
					run >= MIN_FLOAT_RUN &&
					earnsTravel(run, shift - anchor * (lenNew - lenOld))
				) {
					best = run
					oldStart = i
					newStart = i + shift
				}
			} else {
				run = 0
			}

			if (run + i - lo <= best) {
				break // cannot beat the run in hand
			}
		}
	}

	// The retained run is exactly [oldStart, oldStart+best) →
	// [newStart, newStart+best): for the flush suffix that is the shared tail;
	// for a floating run only the run itself survives, not the whole tail.
	for (let k = 0; k < best; k++) {
		map[newStart + k] = oldStart + k
	}

	return map
}
