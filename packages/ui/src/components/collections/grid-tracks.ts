import type { GridTrackList } from '../../props'

const warned = new Set<string>()

/** Normalize one token to its canonical spelling — 'auto', a non-negative
 *  dip length, or a positive star weight ('2*'). 'px'/'fr' spellings fold
 *  onto the same semantics; anything else is outside the bounded grammar. */
function normalizeTrack(token: string): string | null {
	if (token === 'auto') {
		return 'auto'
	}

	const fixed = /^(\d+(?:\.\d+)?|\.\d+)(?:px)?$/.exec(token)
	if (fixed) {
		return String(Number(fixed[1]))
	}

	const star = /^(\d+(?:\.\d+)?|\.\d+)?(?:\*|fr)$/.exec(token)
	if (star) {
		const weight = Number(star[1] || 1)
		// A zero share is a zero-length track — keep it fixed so boundary
		// values (a mark at 0%/100%) stay silent and zero-sized.
		return weight > 0 ? `${weight}*` : '0'
	}

	return null
}

function warnInvalid(axis: 'rows' | 'columns', token: string): void {
	const key = axis + ':' + token
	if (warned.has(key)) {
		return
	}

	warned.add(key)
	console.warn(
		`[Grid] ${axis} track ${JSON.stringify(token)} is outside the bounded ` +
			`grammar — expected 'auto', a non-negative dip length, or a star ` +
			`weight like '2*'. Treating it as 'auto'.`,
	)
}

/** Parse a `rows`/`columns` spec into canonical grammar tokens. String
 *  lists split on commas and whitespace; out-of-grammar tokens warn once
 *  and degrade to 'auto' so layout still lands. */
export function parseGridTrackList(
	spec: GridTrackList | undefined,
	axis: 'rows' | 'columns',
): string[] {
	const raw = typeof spec === 'string' ? spec.split(/[\s,]+/) : (spec ?? [])
	const tracks: string[] = []
	for (const entry of raw) {
		const token = String(entry).trim()
		if (!token) {
			continue
		}

		const normalized = normalizeTrack(token)
		if (normalized == null) {
			warnInvalid(axis, token)
			tracks.push('auto')
		} else {
			tracks.push(normalized)
		}
	}

	return tracks
}

/** CSS grid-template value for the bounded grammar, or undefined when the
 *  spec declares no tracks. */
export function gridTrackListToCss(
	spec: GridTrackList | undefined,
	axis: 'rows' | 'columns',
): string | undefined {
	const tracks = parseGridTrackList(spec, axis)
	if (!tracks.length) {
		return undefined
	}

	return tracks
		.map((track) =>
			track === 'auto' ? 'auto' : track.endsWith('*') ? `${track.slice(0, -1)}fr` : `${track}px`,
		)
		.join(' ')
}
