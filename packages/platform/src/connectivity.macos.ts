import type { ConnectivityImpl, ConnectivityState } from './types'

type Monitor = { start(listener: (state: string) => void): boolean; stop(): void }
type Bridge = { readState(): string; new: () => Monitor }
type Owner = { bridge: Bridge; native: Monitor; phase: 'starting' | 'ready' | 'retired'; state?: ConnectivityState }
declare const XplatConnectivity: Bridge

const unsupported = (): ConnectivityState => ({ supported: false, online: false, type: 'unknown' })
const bridge = (): Bridge | undefined =>
	typeof XplatConnectivity !== 'undefined' && XplatConnectivity != null &&
	typeof XplatConnectivity.readState === 'function' && typeof XplatConnectivity.new === 'function'
		? XplatConnectivity : undefined
const listeners = new Set<(state: ConnectivityState) => void>()
let monitor: Owner | undefined

function decode(value: string): ConnectivityState {
	const state = JSON.parse(String(value)) as ConnectivityState
	if (
		typeof state.supported !== 'boolean' || typeof state.online !== 'boolean' ||
		!['none', 'wifi', 'mobile', 'ethernet', 'bluetooth', 'vpn', 'unknown'].includes(state.type)
	) {throw new Error('Invalid macOS connectivity sample')}
	return { supported: state.supported, online: state.online, type: state.type }
}

function retire(owner: Owner | undefined): void {
	if (!owner || owner.phase === 'retired') {return}
	owner.phase = 'retired'
	if (monitor === owner) {monitor = undefined}
	try {
		owner.native.stop()
	} catch {
		// Queued callbacks are already retired, even if native stop fails.
	}
}

function currentBridge(): Bridge | undefined {
	let native = bridge()
	if (monitor && monitor.bridge !== native) {
		retire(monitor)
		native = bridge()
	}
	return native
}

function publish(owner: Owner, state: ConnectivityState, skip?: (state: ConnectivityState) => void): void {
	if (owner.phase !== 'ready') {return}
	for (const callback of [...listeners]) {
		if (monitor !== owner || bridge() !== owner.bridge) {break}
		if (callback === skip || !listeners.has(callback)) {continue}
		try { callback(state) } catch {
			// One consumer cannot block query retry or other readers.
		}
	}
}

export const connectivity: ConnectivityImpl = {
	getState() {
		const native = currentBridge()
		if (!native) {return unsupported()}
		const owner = monitor
		if (owner?.state) {return { ...owner.state }}
		try {
			const state = decode(native.readState())
			if (owner && monitor === owner && bridge() === native) {
				// A native update delivered during the read is newer than its result.
				owner.state ??= state
				return { ...owner.state }
			}
			return bridge() === native ? state : unsupported()
		} catch {
			const state = unsupported()
			if (owner && monitor === owner && bridge() === native) {
				owner.state ??= state
				return { ...owner.state }
			}
			return state
		}
	},
	subscribe(listener) {
		// Duplicate callbacks are separate registrations, each with its own removal.
		const notify = (state: ConnectivityState) => listener({ ...state })
		listeners.add(notify)
		const native = currentBridge()
		if (!monitor && native) {
			let owner: Owner | undefined
			try {
				owner = { bridge: native, native: native.new(), phase: 'starting' }
				monitor = owner
				const next = owner
				const started = next.native.start((value) => {
					if (monitor !== next) {return}
					if (bridge() !== native) { retire(next); return }
					let state: ConnectivityState
					try { state = decode(value) } catch { state = unsupported() }
					next.state = state
					publish(next, state)
				})
				if (!started) {retire(next)}
				else if (monitor === next) {
					next.phase = 'ready'
					// Synchronous start samples reach the new subscriber only once below.
					if (next.state) {publish(next, next.state, notify)}
				}
			} catch {
				retire(owner)
			}
		}
		try {
			notify(monitor ? connectivity.getState() : unsupported())
		} catch (error) {
			listeners.delete(notify)
			if (!listeners.size) {retire(monitor)}
			throw error
		}
		let active = true
		return () => {
			if (!active) {return}
			active = false
			listeners.delete(notify)
			if (!listeners.size) {retire(monitor)}
		}
	},
}
