import type { ConnectivityImpl, ConnectivityState } from './types'

type Monitor = { start(listener: (state: string) => void): boolean; stop(): void }
declare const XplatConnectivity: { readState(): string; new: () => Monitor }

const unsupported = (): ConnectivityState => ({ supported: false, online: false, type: 'unknown' })
const available = () => typeof XplatConnectivity !== 'undefined'
const listeners = new Set<(state: ConnectivityState) => void>()
let monitor: Monitor | null = null

function decode(value: string): ConnectivityState {
	const state = JSON.parse(String(value)) as ConnectivityState
	if (
		typeof state.supported !== 'boolean' ||
		typeof state.online !== 'boolean' ||
		// Every ConnectionType the shared contract defines.
		!['none', 'wifi', 'mobile', 'ethernet', 'bluetooth', 'vpn', 'unknown'].includes(state.type)
	) {
		throw new Error('Invalid macOS connectivity sample')
	}

	return state
}

export const connectivity: ConnectivityImpl = {
	getState() {
		if (!available()) {
			return unsupported()
		}

		try {
			return decode(XplatConnectivity.readState())
		} catch {
			return unsupported()
		}
	},
	subscribe(listener) {
		// Each registration owns its removal, even when callbacks are identical.
		const notify = (state: ConnectivityState) => listener(state)
		listeners.add(notify)
		if (!monitor && available()) {
			let next: Monitor | null = null
			try {
				next = XplatConnectivity.new()
				monitor = next
				if (
					!next.start((value) => {
						if (monitor !== next) {
							return
						}

						let state: ConnectivityState
						try {
							state = decode(value)
						} catch {
							state = unsupported()
						}

						// Snapshot registrations so subscriptions added during delivery wait for the next update.
						// oxlint-disable-next-line unicorn/no-useless-spread
						for (const callback of [...listeners]) {
							if (listeners.has(callback)) {
								callback(state)
							}
						}
					})
				) {
					next?.stop()
					monitor = null
				}
			} catch {
				next?.stop()
				monitor = null
			}
		}

		try {
			notify(monitor ? connectivity.getState() : unsupported())
		} catch (error) {
			listeners.delete(notify)
			if (!listeners.size) {
				monitor?.stop()
				monitor = null
			}

			throw error
		}

		return () => {
			listeners.delete(notify)
			if (!listeners.size) {
				monitor?.stop()
				monitor = null
			}
		}
	},
}
