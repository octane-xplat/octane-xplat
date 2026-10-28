import type { Track } from './types'

/** Copy caller data and reject ambiguous identities before changing playback. */
export function copyQueue(tracks: readonly Track[]): Track[] {
	const ids = new Set<string>()
	return tracks.map((track) => {
		if (!track.id || !track.source || ids.has(track.id)) {
			throw new Error('Audio queue requires nonempty unique IDs and sources')
		}
		ids.add(track.id)
		return { ...track }
	})
}
