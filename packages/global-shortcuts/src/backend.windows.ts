import { windowsKeyMapping } from './accelerator.js'
import type { BindOutcome, BindRequest, HotkeyBackend } from './backend.js'
import type { Accelerator, GlobalShortcutSupport } from './types.js'

// The NativeScript Windows runtime does not tick timers inside workers and
// worker->main postMessage is unreliable, so hotkeys are owned by a dedicated
// Worker thread that reports fixed-size records over a private named pipe;
// commands travel as thread messages (PostThreadMessageW) which the probe
// verified on the pinned runtime.
for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] as const) {
	const g = globalThis as Record<string, unknown>
	g[name] ??= g[`__ns__${name}`]
}

interface Win32Call {
	(dll: string, fn: string, ret: string, ...args: unknown[]): unknown
}
interface Win32Interop {
	pointerFromBuffer(buffer: ArrayBuffer | ArrayBufferView): unknown
	pointerKey(pointer: unknown): unknown
}
interface WindowsRuntime {
	win32?: { call: Win32Call }
	interop?: Win32Interop
}
interface WorkerLike {
	postMessage(message: unknown): void
	terminate?(): void
	onmessage?: unknown
	onerror?: unknown
}
interface WorkerCtor {
	new (path: string, options?: { eval?: boolean }): WorkerLike
}

const projection = () => globalThis as { NSWinRT?: WindowsRuntime; Worker?: WorkerCtor }

const WM_HOTKEY = 0x0312
const WM_APP = 0x8000
const CMD_BIND = WM_APP + 0x40
const CMD_UNBIND = WM_APP + 0x41
const CMD_QUIT = WM_APP + 0x42
const MOD_ALT = 0x1
const MOD_CONTROL = 0x2
const MOD_SHIFT = 0x4
const MOD_WIN = 0x8
const MOD_NOREPEAT = 0x4000
const ERROR_HOTKEY_REGISTERED = 1409

const REC_READY = 0
const REC_BOUND = 1
const REC_FAILED = 2
const REC_HOTKEY = 3
const REC_UNBOUND = 4
const REC_EXITED = 5

// The worker is fully self-orchestrating: the pipe name derives from the
// shared process id, so no postMessage payload ever needs to arrive.
const WORKER_SOURCE = `(function () {
	var host = globalThis
	var api = host.NSWinRT
	var w32 = (api && api.win32) || null
	var interop = (api && api.interop) || null
	if (!w32 || typeof w32.call !== 'function' || !interop) return
	var call = function (dll, fn, ret, args) { return w32.call(dll, fn, ret, ...args) }
	var u32 = function (v) { return { type: 'u32', value: v } }
	var i32 = function (v) { return { type: 'i32', value: v } }
	var ptr = function (v) { return { type: 'pointer', value: v } }
	var raw = function (dll, fn, ret) { return call(dll, fn, ret, Array.prototype.slice.call(arguments, 3)) }
	var addr = function (buf) {
		var p = interop.pointerFromBuffer(buf)
		if (typeof p === 'number') return p
		if (typeof interop.pointerKey === 'function') return Number(interop.pointerKey(p))
		if (p && p.__native_ptr !== undefined) return Number(p.__native_ptr)
		return 0
	}
	var utf16 = function (s) {
		var b = new Uint16Array(s.length + 1)
		for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i)
		return addr(b)
	}
	var tid = Number(raw('kernel32.dll', 'GetCurrentThreadId', 'u32'))
	var pid = Number(raw('kernel32.dll', 'GetCurrentProcessId', 'u32'))
	var pipeName = '\\\\\\\\.\\\\pipe\\\\xplat-ghk-' + pid
	var pipe = 0
	var msgBuf = new ArrayBuffer(48)
	var msgView = new DataView(msgBuf)
	var msgAddr = addr(msgBuf)
	var recBuf = new ArrayBuffer(12)
	var recView = new DataView(recBuf)
	var recAddr = addr(recBuf)
	var wrBuf = new ArrayBuffer(8)
	var wrView = new DataView(wrBuf)
	var wrAddr = addr(wrBuf)
	var registered = {}
	var record = function (kind, key, value) {
		if (!pipe) return
		recView.setUint32(0, kind >>> 0, true)
		recView.setUint32(4, key >>> 0, true)
		recView.setUint32(8, value >>> 0, true)
		wrView.setUint32(0, 0, true)
		try {
			raw('kernel32.dll', 'WriteFile', 'bool', ptr(pipe), ptr(recAddr), u32(12), ptr(wrAddr), ptr(0))
		} catch (e) {}
	}
	var openPipe = function () {
		for (var n = 0; n < 400 && !pipe; n++) {
			try {
				pipe = Number(raw('kernel32.dll', 'CreateFileW', 'pointer', ptr(utf16(pipeName)), u32(0x40000000), u32(0), ptr(0), u32(3), u32(0), ptr(0)))
				if (pipe <= 0) pipe = 0
			} catch (e) { pipe = 0 }
			if (!pipe) raw('kernel32.dll', 'Sleep', 'void', u32(25))
		}
	}
	openPipe()
	if (!pipe) return
	record(0, 0, tid)
	var running = true
	while (running) {
		var hot = !!raw('user32.dll', 'PeekMessageW', 'bool', ptr(msgAddr), ptr(0), u32(0x0312), u32(0x0312), u32(1))
		if (hot) {
			var hid = msgView.getUint32(16, true)
			record(3, hid, (msgView.getUint32(24, true) & 0xffff) | ((msgView.getUint32(28, true) & 0xffff) << 16))
			continue
		}
		var cmd = !!raw('user32.dll', 'PeekMessageW', 'bool', ptr(msgAddr), ptr(0), u32(0x8040), u32(0x8042), u32(1))
		if (cmd) {
			var msg = msgView.getUint32(8, true)
			var wp = msgView.getUint32(16, true)
			var lp = msgView.getUint32(24, true)
			if (msg === 0x8040) {
				var ok = !!raw('user32.dll', 'RegisterHotKey', 'bool', ptr(0), i32(wp), u32((lp >>> 16) & 0xffff), u32(lp & 0xffff))
				var err = ok ? 0 : Number(raw('kernel32.dll', 'GetLastError', 'u32'))
				if (ok) registered[wp] = true
				record(ok ? 1 : 2, wp, err)
			} else if (msg === 0x8041) {
				var ok2 = !!raw('user32.dll', 'UnregisterHotKey', 'bool', ptr(0), i32(wp))
				delete registered[wp]
				record(4, wp, ok2 ? 0 : Number(raw('kernel32.dll', 'GetLastError', 'u32')))
			} else if (msg === 0x8042) {
				for (var k in registered) raw('user32.dll', 'UnregisterHotKey', 'bool', ptr(0), i32(Number(k)))
				record(5, 0, 0)
				running = false
			}
			continue
		}
		raw('kernel32.dll', 'Sleep', 'void', u32(5))
	}
	try { raw('kernel32.dll', 'CloseHandle', 'bool', ptr(pipe)) } catch (e) {}
})()`

const u32 = (v: number) => ({ type: 'u32', value: v })
const i32 = (v: number) => ({ type: 'i32', value: v })
const ptr = (v: number) => ({ type: 'pointer', value: v })

interface PendingReply {
	resolve(value: number): void
	timer: ReturnType<typeof setTimeout>
}

let win32: { call: Win32Call } | null = null
let win32Interop: Win32Interop | null = null
let initFailed = false
let pipe = 0
let worker: WorkerLike | null = null
let workerTid = 0
let workerReady = false
let bootPromise: Promise<boolean> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let leftovers = new Uint8Array(0)
const dispatch = new Map<number, () => void>()
const pendingBind = new Map<number, PendingReply>()
const pendingUnbind = new Map<number, PendingReply>()
let pipePath = ''

const rt = () => projection().NSWinRT

function bufferAddress(buf: ArrayBuffer | ArrayBufferView): number {
	const interop = win32Interop
	if (!interop) return 0
	const p = interop.pointerFromBuffer(buf)
	if (typeof p === 'number') return p
	if (typeof interop.pointerKey === 'function') return Number(interop.pointerKey(p))
	if (p !== null && typeof p === 'object' && '__native_ptr' in p) {
		return Number((p as { __native_ptr: unknown }).__native_ptr)
	}
	return 0
}

function raw(dll: string, fn: string, ret: string, ...args: { type: string; value: number }[]): unknown {
	return win32!.call(dll, fn, ret, ...args)
}

function utf16(text: string): number {
	const buf = new Uint16Array(text.length + 1)
	for (let i = 0; i < text.length; i++) buf[i] = text.charCodeAt(i)
	return bufferAddress(buf)
}

function ensureRuntime(): boolean {
	if (win32 !== null) return true
	if (initFailed) return false
	const api = rt()
	if (api?.win32?.call && api.interop?.pointerFromBuffer && typeof projection().Worker === 'function') {
		win32 = api.win32
		win32Interop = api.interop
		return true
	}
	initFailed = true
	return false
}

const readBuf = new ArrayBuffer(4096)
const readView = new DataView(readBuf)
const availBuf = new ArrayBuffer(8)
const availView = new DataView(availBuf)

function handleRecord(kind: number, key: number, value: number): void {
	if (kind === REC_READY) {
		workerTid = value
		workerReady = true
		return
	}
	if (kind === REC_HOTKEY) {
		dispatch.get(key)?.()
		return
	}
	const table = kind === REC_BOUND || kind === REC_FAILED ? pendingBind : pendingUnbind
	const pending = table.get(key)
	if (pending) {
		table.delete(key)
		clearTimeout(pending.timer)
		pending.resolve(kind === REC_FAILED ? -Math.abs(value) : value)
	}
}

function pollPipe(): void {
	if (!pipe || win32 === null) return
	availView.setUint32(0, 0, true)
	const peeked = raw('kernel32.dll', 'PeekNamedPipe', 'bool', ptr(pipe), ptr(0), u32(0), ptr(0), ptr(bufferAddress(availBuf)), ptr(0))
	if (!peeked) return
	const avail = availView.getUint32(0, true)
	if (avail === 0) return
	const take = Math.min(avail, 4096)
	availView.setUint32(0, 0, true)
	const ok = raw('kernel32.dll', 'ReadFile', 'bool', ptr(pipe), ptr(bufferAddress(readBuf)), u32(take), ptr(bufferAddress(availBuf)), ptr(0))
	if (!ok) return
	const count = availView.getUint32(0, true)
	const bytes = new Uint8Array(leftovers.length + count)
	bytes.set(leftovers, 0)
	bytes.set(new Uint8Array(readBuf, 0, count), leftovers.length)
	const view = new DataView(bytes.buffer)
	let offset = 0
	while (offset + 12 <= bytes.length) {
		handleRecord(view.getUint32(offset, true), view.getUint32(offset + 4, true), view.getUint32(offset + 8, true))
		offset += 12
	}
	leftovers = bytes.slice(offset)
}

function startPolling(): void {
	if (pollTimer !== null || typeof setInterval !== 'function') return
	pollTimer = setInterval(pollPipe, 40)
}

function createPipe(): boolean {
	const api = rt()
	if (!api?.win32) return false
	const pid = Number(raw('kernel32.dll', 'GetCurrentProcessId', 'u32'))
	pipePath = `\\\\.\\pipe\\xplat-ghk-${pid}`
	const handle = Number(
		raw(
			'kernel32.dll',
			'CreateNamedPipeW',
			'pointer',
			ptr(utf16(pipePath)),
			u32(1), // PIPE_ACCESS_INBOUND
			u32(0), // PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT
			u32(1),
			u32(4096),
			u32(4096),
			u32(0),
			ptr(0),
		),
	)
	if (!handle || handle === 0xffffffff || handle === 0xffffffffffffffff) {
		pipe = 0
		return false
	}
	pipe = handle
	return true
}

function spawnWorker(): WorkerLike | null {
	const Ctor = projection().Worker
	if (typeof Ctor !== 'function') return null
	try {
		return new Ctor(WORKER_SOURCE, { eval: true })
	} catch {
		// Fall back to a temp file: some builds require a resolvable path.
	}
	try {
		const pid = Number(raw('kernel32.dll', 'GetCurrentProcessId', 'u32'))
		const pathBuf = new Uint16Array(520)
		const pathAddr = bufferAddress(pathBuf)
		raw('kernel32.dll', 'GetTempPathW', 'u32', u32(260), ptr(pathAddr))
		let dir = ''
		for (let i = 0; i < 260 && pathBuf[i] !== 0; i++) dir += String.fromCharCode(pathBuf[i])
		const file = `${dir}xplat-ghk-${pid}.js`
		const fh = Number(raw('kernel32.dll', 'CreateFileW', 'pointer', ptr(utf16(file)), u32(0x40000000), u32(0), ptr(0), u32(2), u32(0), ptr(0)))
		if (!fh) return null
		const bytes = new TextEncoder().encode(WORKER_SOURCE)
		const written = new DataView(new ArrayBuffer(8))
		raw('kernel32.dll', 'WriteFile', 'bool', ptr(fh), ptr(bufferAddress(bytes)), u32(bytes.length), ptr(bufferAddress(written.buffer)), ptr(0))
		raw('kernel32.dll', 'CloseHandle', 'bool', ptr(fh))
		return new Ctor(file)
	} catch {
		return null
	}
}

function ensureWorker(): Promise<boolean> {
	if (workerReady) return Promise.resolve(true)
	if (bootPromise !== null) return bootPromise
	bootPromise = new Promise((resolve) => {
		if (!ensureRuntime() || typeof setInterval !== 'function') {
			resolve(false)
			return
		}
		if (!createPipe()) {
			resolve(false)
			return
		}
		worker = spawnWorker()
		if (worker === null) {
			resolve(false)
			return
		}
		startPolling()
		// The runtime only starts the worker body after a main->worker message;
		// pings are content-free kicks, so delivery order does not matter.
		let pings = 0
		const kick = setInterval(() => {
			if (workerReady) {
				clearInterval(kick)
				resolve(true)
				return
			}
			pings += 1
			if (pings > 25) {
				clearInterval(kick)
				resolve(false)
				return
			}
			try {
				worker?.postMessage('ghk')
			} catch {
				// best-effort kick
			}
		}, 300)
	})
	const done = bootPromise
	void done.then((ok) => {
		if (!ok) {
			bootPromise = null
			try {
				worker?.terminate?.()
			} catch {
				// best-effort
			}
			worker = null
		}
	})
	return done
}

const REPLY_TIMEOUT = -0x40000000

function awaitReply(table: Map<number, PendingReply>, key: number, timeoutMs: number): Promise<number> {
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			table.delete(key)
			resolve(REPLY_TIMEOUT)
		}, timeoutMs)
		table.set(key, { resolve, timer })
	})
}

function postCommand(message: number, wParam: number, lParam: number): boolean {
	if (!workerReady || workerTid === 0) return false
	try {
		return !!raw('user32.dll', 'PostThreadMessageW', 'bool', u32(workerTid), u32(message), ptr(wParam), ptr(lParam))
	} catch {
		return false
	}
}

function winModifiers(accelerator: Accelerator): number {
	let mods = MOD_NOREPEAT
	if (accelerator.alt) mods |= MOD_ALT
	if (accelerator.ctrl) mods |= MOD_CONTROL
	if (accelerator.shift) mods |= MOD_SHIFT
	if (accelerator.meta) mods |= MOD_WIN
	return mods
}

function virtualKey(request: BindRequest): number | null {
	const mapping = windowsKeyMapping(request.accelerator.code)
	if (mapping === null) return null
	if (mapping.vk !== undefined) return mapping.vk
	if (mapping.scan === undefined) return null
	try {
		const layout = Number(raw('user32.dll', 'GetKeyboardLayout', 'pointer', u32(0)))
		const vk = Number(raw('user32.dll', 'MapVirtualKeyExW', 'u32', u32(mapping.scan), u32(1), ptr(layout)))
		return vk > 0 && vk <= 0xff ? vk : null
	} catch {
		return null
	}
}

const SUPPORT: GlobalShortcutSupport = {
	supported: true,
	platform: 'windows',
	mechanism: 'win32',
	assignment: 'exact',
}
const UNSUPPORTED: GlobalShortcutSupport = {
	supported: false,
	platform: 'windows',
	mechanism: 'none',
	assignment: 'none',
	reason:
		'The Win32 projection (NSWinRT.win32.call) or threaded Worker is unavailable in this host.',
}

export const backend: HotkeyBackend = {
	platform: 'windows',

	support() {
		return Promise.resolve(ensureRuntime() ? { ...SUPPORT } : { ...UNSUPPORTED })
	},

	async bind(request: BindRequest, onPress: () => void): Promise<BindOutcome> {
		if (!ensureRuntime()) {
			return { ok: false, error: { code: 'unsupported', message: UNSUPPORTED.reason ?? 'unsupported' } }
		}
		const vk = virtualKey(request)
		if (vk === null) {
			return {
				ok: false,
				error: {
					code: 'invalid-accelerator',
					message: `The key ${request.accelerator.code} cannot be used for a global shortcut on Windows.`,
				},
			}
		}
		const ready = await ensureWorker()
		if (!ready) {
			return {
				ok: false,
				error: {
					code: 'unavailable',
					message: 'The global-shortcut worker thread could not be started.',
				},
			}
		}
		const reply = awaitReply(pendingBind, request.key, 6000)
		const packed = (winModifiers(request.accelerator) << 16) | vk
		if (!postCommand(CMD_BIND, request.key, packed)) {
			pendingBind.delete(request.key)
			return {
				ok: false,
				error: { code: 'unavailable', message: 'The global-shortcut worker is not responding.' },
			}
		}
		const status = await reply
		if (status < 0 && status !== -ERROR_HOTKEY_REGISTERED) {
			// On timeout the worker may still register late; release it.
			if (status === REPLY_TIMEOUT) postCommand(CMD_UNBIND, request.key, 0)
		}
		if (status === -ERROR_HOTKEY_REGISTERED) {
			return {
				ok: false,
				error: {
					code: 'conflict',
					message: `The accelerator ${request.accelerator.text} is already held by another app.`,
				},
			}
		}
		if (status < 0) {
			const code = -status
			return {
				ok: false,
				error: {
					code: 'unavailable',
					message:
						code === 0x40000000
							? 'The global-shortcut worker did not answer the registration.'
							: `Windows refused the accelerator ${request.accelerator.text} with error ${code}.`,
				},
			}
		}
		dispatch.set(request.key, onPress)
		return {
			ok: true,
			trigger: request.accelerator.text,
			release: async () => {
				dispatch.delete(request.key)
				if (!postCommand(CMD_UNBIND, request.key, 0)) return
				const waiter = awaitReply(pendingUnbind, request.key, 3000)
				await waiter
			},
		}
	},

	onExit(_listener: () => void): () => void {
		// The WinUI host exposes no reliable JS shutdown hook; the worker and
		// its RegisterHotKey leases die with the process, and the package
		// unregisters on explicit dispose.
		return () => {}
	},
}
