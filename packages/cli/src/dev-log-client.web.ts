// Serialized into development HTML only. Keep the function self-contained:
// it executes in the browser, without importing any Node/CLI modules.
function installBrowserLogs(token: string, endpoint: string) {
	const browser = globalThis as any
	if (browser.__XPLAT_LOGS_INSTALLED__) {
		return
	}
	browser.__XPLAT_LOGS_INSTALLED__ = true
	let queue: Array<{ level: string; line: string }> = []
	let dropped = 0
	let sending = false
	const format = (value: unknown) => {
		try {
			if (value instanceof Error) {
				return String(value.stack ?? value.message)
			}

			if (
				value === null ||
				['string', 'number', 'boolean', 'undefined', 'bigint'].includes(typeof value)
			) {
				return String(value)
			}

			return '[object omitted]'
		} catch {
			return '[unprintable]'
		}
	}
	const flush = async () => {
		if (sending || (!queue.length && !dropped)) {
			return
		}
		sending = true
		const records = queue.splice(0, 10)
		const lost = dropped
		dropped = 0
		try {
			const response = await browser.fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-xplat-dev-token': token },
				body: JSON.stringify({ records, dropped: lost }),
				keepalive: true,
			})

			if (!response.ok) {
				throw new Error('log delivery failed')
			}
		} catch {
			dropped += records.length + lost
		} finally {
			sending = false
			if (queue.length || dropped) {
				browser.setTimeout(flush, 1000)
			}
		}
	}
	const record = (level: string, values: unknown[]) => {
		if (queue.length === 100) {
			queue.shift()
			dropped++
		}
		const text = values
			.slice(0, 10)
			.map((value) => format(value).slice(0, 2049))
			.join(' ')
		const line =
			text.length > 2048 || values.length > 10 ? text.slice(0, 2035) + ' [truncated]' : text
		queue.push({ level, line })
		void flush()
	}
	for (const level of ['warn', 'error']) {
		const original = browser.console[level]
		browser.console[level] = function (...values: unknown[]) {
			original.apply(this, values)
			record(level, values)
		}
	}
	browser.addEventListener(
		'error',
		(event: any) => {
			// Resource failures don't carry an ErrorEvent message; name the
			// failure without forwarding resource URLs or their query values.
			record('error', [event.error ?? event.message ?? 'Resource failed to load'])
		},
		true,
	)
	browser.addEventListener('unhandledrejection', (event: any) => record('error', [event.reason]))
}

/** Development HTML script; no browser hooks are installed in release builds. */
export function browserLogScript(token: string, endpoint: string) {
	return `(${installBrowserLogs.toString()})(${JSON.stringify(token)}, ${JSON.stringify(endpoint)});`
}
