import { contractError } from '../contracts/errors.mjs'

/** Bounded CDP channel. The server chooses the owned page; callers never supply endpoints or expressions. */
export async function connectPage(endpoint, { timeoutMs = 5000 } = {}) {
	const response = await fetch(`${endpoint.browser.devtoolsUrl}/json/list`, {
		signal: AbortSignal.timeout(timeoutMs),
	})

	const targets = await response.json()
	const pages = targets.filter((target) => target.type === 'page' && target.url === endpoint.url)
	if (pages.length !== 1) {
		throw contractError(
			pages.length ? 'ambiguous_selection' : 'stale_identity',
			'The owned app page is missing, has navigated, or is ambiguous. Relaunch the session.',
		)
	}

	const socket = new WebSocket(pages[0].webSocketDebuggerUrl)
	let sequence = 0
	const pending = new Map()
	const failPending = () => {
		for (const call of pending.values()) {
			call.reject(contractError('disconnected_runtime', 'Chromium observation channel closed.'))
		}

		pending.clear()
	}

	socket.addEventListener('close', failPending)
	socket.addEventListener('error', failPending)
	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data)
		const call = pending.get(message.id)
		if (!call) {
			return
		}

		pending.delete(message.id)
		if (message.error) {
			call.reject(contractError('execution_failure', message.error.message))
		} else {
			call.resolve(message.result)
		}
	})

	await new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			socket.close()
			reject(contractError('timeout', 'Chromium connection timed out.'))
		}, timeoutMs)

		socket.addEventListener(
			'open',
			() => {
				clearTimeout(timer)
				resolve()
			},
			{ once: true },
		)

		socket.addEventListener(
			'error',
			() => {
				clearTimeout(timer)
				reject(contractError('disconnected_runtime', 'Cannot connect to Chromium.'))
			},
			{ once: true },
		)
	})

	return {
		async send(method, params = {}) {
			if (socket.readyState !== WebSocket.OPEN) {
				throw contractError('disconnected_runtime', 'Chromium is disconnected.')
			}

			const id = ++sequence
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					pending.delete(id)
					reject(contractError('timeout', `Chromium ${method} timed out.`))
				}, timeoutMs)

				pending.set(id, {
					resolve: (value) => {
						clearTimeout(timer)
						resolve(value)
					},
					reject: (error) => {
						clearTimeout(timer)
						reject(error)
					},
				})

				socket.send(JSON.stringify({ id, method, params }))
			})
		},
		close() {
			socket.close()
			failPending()
		},
	}
}
