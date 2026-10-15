// Readiness probes. Build finished, process launched, and app ready are
// distinct states — an adapter only reports `ready` when its platform probe
// actually passed; everything else is an honest timeout/failure.

const aborted = (signal) =>
	signal?.aborted ? Object.assign(new Error('cancelled'), { name: 'AbortError' }) : null

export function sleep(ms, signal) {
	return new Promise((resolve, reject) => {
		const err = aborted(signal)
		if (err) {
			reject(err)
			return
		}

		const timer = setTimeout(done, ms)
		const onAbort = () => {
			clearTimeout(timer)
			reject(aborted(signal))
		}

		function done() {
			signal?.removeEventListener('abort', onAbort)
			resolve()
		}

		signal?.addEventListener('abort', onAbort, { once: true })
	})
}

/** Poll an HTTP endpoint until it answers 2xx–4xx (server is up). */
export async function waitForHttp(url, { timeoutMs = 30000, intervalMs = 250, signal, fetchImpl } = {}) {
	const doFetch = fetchImpl ?? fetch
	const deadline = Date.now() + timeoutMs
	let lastError
	while (Date.now() < deadline) {
		const err = aborted(signal)
		if (err) {
			throw err
		}

		try {
			const res = await doFetch(url, { signal: AbortSignal.timeout(3000) })
			if (res.status < 500) {
				return { url, status: res.status }
			}

			lastError = new Error(`HTTP ${res.status}`)
		} catch (error) {
			lastError = error
		}

		await sleep(intervalMs, signal)
	}

	const timeout = new Error(`No HTTP response from ${url} within ${timeoutMs}ms`)
	timeout.cause = lastError
	throw timeout
}

/** Resolve when a log record matches any pattern; rejects on timeout/abort. */
export function waitForLogMatch(logBuffer, patterns, { timeoutMs, signal, fromSeq = 0 } = {}) {
	const list = Array.isArray(patterns) ? patterns : [patterns]
	return new Promise((resolve, reject) => {
		const deadline = timeoutMs == null ? null : Date.now() + timeoutMs
		let timer = null
		let done = false

		const finish = (fn, value) => {
			if (done) {
				return
			}

			done = true
			unwatch()
			if (timer) {
				clearTimeout(timer)
			}

			signal?.removeEventListener('abort', onAbort)
			fn(value)
		}

		const test = (record) => {
			const match = list.find((pattern) => pattern.test(record.line))
			if (match) {
				finish(resolve, { record, pattern: match })
			}
		}

		const unwatch = logBuffer.watch(test)
		// Existing records count too — the marker may predate the wait.
		for (const record of logBuffer.read({ cursor: fromSeq, limit: 5000 }).records) {
			test(record)
			if (done) {
				return
			}
		}

		const onAbort = () => finish(reject, aborted(signal))
		signal?.addEventListener('abort', onAbort, { once: true })

		if (deadline) {
			timer = setTimeout(
				() => finish(reject, new Error(`Readiness marker not observed within ${timeoutMs}ms`)),
				Math.max(0, deadline - Date.now()),
			)
		}
	})
}

/** First URL printed by a dev server ("➜  Local: http://localhost:5173/"). */
export function urlFromLogs(logBuffer) {
	for (const record of logBuffer.read({ limit: 5000 }).records) {
		const match = record.line.match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?\/?/)
		if (match) {
			return match[0]
		}
	}

	return null
}
