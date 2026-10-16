// Bounded ordered log store — one buffer per session or build job. Cursors
// are opaque sequence ids; reads past the retained window report truncation
// instead of silently presenting partial output as complete (design: logs
// may be rotated or lost — cursor results reveal gaps).

export function createLogBuffer({ limit = 2000 } = {}) {
	const records = []
	const watchers = new Set()
	let seq = 0
	let dropped = 0
	let resetMarker = null

	const base = () => (records.length ? records[0].seq : seq + 1)

	return {
		append({ stream = 'stdout', line, source, level }) {
			const record = {
				seq: ++seq,
				ts: new Date().toISOString(),
				stream,
				line,
				...(source ? { source } : {}),
				...(level ? { level } : {}),
			}

			records.push(record)
			while (records.length > limit) {
				records.shift()
				dropped += 1
			}

			for (const watch of watchers) {
				watch(record)
			}

			return record
		},

		/** Post-attach/post-restart note — makes capture coverage explicit. */
		note(line, extra = {}) {
			return this.append({ stream: 'lifecycle', line, ...extra })
		},

		/**
		 * Ordered bounded read.
		 *  - no cursor → the newest `readLimit` records (tail)
		 *  - cursor → records after that seq; `truncated`/`dropped` reveal gaps
		 */
		read({ cursor, limit: readLimit = 500, stream } = {}) {
			const from = cursor == null ? base() + Math.max(0, records.length - readLimit) - 1 : cursor
			let slice = records.filter((r) => r.seq > from)
			if (stream) {
				slice = slice.filter((r) => r.stream === stream)
			}

			const truncated = cursor != null && cursor < base() - 1
			const page = slice.slice(0, readLimit)
			return {
				records: page,
				nextCursor: page.length ? page[page.length - 1].seq : (cursor ?? base() - 1),
				oldestSeq: base(),
				newestSeq: seq,
				truncated,
				dropped: truncated ? dropped : 0,
				reset: resetMarker,
			}
		},

		/** Push subscription for readiness/watch helpers. Returns unsubscribe. */
		watch(fn) {
			watchers.add(fn)
			return () => watchers.delete(fn)
		},

		/** Fresh capture context (e.g. a log tap restarted) — later reads report the reset. */
		reset(reason) {
			records.length = 0
			dropped = 0
			resetMarker = { at: new Date().toISOString(), reason }
			this.note(`log capture reset: ${reason}`)
		},

		get size() {
			return records.length
		},
	}
}
