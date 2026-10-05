// Native-leaf bridge tests. The @nativescript/* module imports and the
// iOS/Android global APIs are replaced with faithful mock shapes (same call
// surfaces the runtime marshals) so the leaf's failure, concurrency, and
// cleanup paths are exercised in node — not a substitute for native smoke.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bridge = vi.hoisted(() => ({
	application: { android: undefined as any },
	listeners: new Map<string, Set<(arg: any) => void>>(),
	resolver: null as any,
	activity: null as any,
	visibleVC: null as any,
	keyWindow: true,
	writeAtomic: true,
	removedPaths: [] as string[],
	channelWrites: [] as any[],
	presented: [] as any[],
}))

vi.mock('@nativescript-community/ui-document-picker', () => ({
	openFilePicker: vi.fn(async () => ({ files: [] })),
}))

vi.mock('@nativescript/core', () => ({
	Application: bridge.application,
	File: {
		fromPath: (p: string) => ({
			removeSync: () => {
				bridge.removedPaths.push(p)
			},
			readText: async () => '',
		}),
	},
	knownFolders: {
		documents: () => ({ path: '/docs' }),
		temp: () => ({ path: '/tmp' }),
	},
	path: {
		join: (...parts: string[]) => parts.join('/'),
	},
	Utils: {
		ios: {
			getVisibleViewController: (root: any) => (root ? bridge.visibleVC : null),
		},
	},
}))

// Explicit .ts specifier: the web resolve chain would otherwise pick
// files.web.ts; this suite covers the shared iOS/Android leaf.
import { files } from './files.ts'
import { files as macosFiles } from './files.macos'

function stubAndroid() {
	bridge.resolver = { openOutputStream: vi.fn(() => ({ close: vi.fn() })) }
	bridge.activity = {
		getContentResolver: () => bridge.resolver,
		startActivityForResult: vi.fn(),
	}

	bridge.application.android = {
		activityResultEvent: 'activityResult',
		foregroundActivity: bridge.activity,
		startActivity: bridge.activity,
		on(event: string, cb: (arg: any) => void) {
			if (!bridge.listeners.has(event)) {
				bridge.listeners.set(event, new Set())
			}

			bridge.listeners.get(event)!.add(cb)
		},
		off(event: string, cb: (arg: any) => void) {
			bridge.listeners.get(event)?.delete(cb)
		},
	}
}

function emitResult(arg: any) {
	for (const cb of Array.from(bridge.listeners.get('activityResult') ?? [])) {
		cb(arg)
	}
}

function okResult(uri = 'content://dest/doc.bin') {
	return {
		requestCode: 1241,
		resultCode: -1,
		intent: { getData: () => ({ toString: () => uri }) },
	}
}

let lastPicker: any

beforeEach(() => {
	bridge.listeners.clear()
	bridge.removedPaths = []
	bridge.channelWrites = []
	bridge.presented = []
	bridge.keyWindow = true
	bridge.writeAtomic = true
	bridge.resolver = null
	bridge.activity = null
	lastPicker = null

	bridge.visibleVC = {
		presentViewControllerAnimatedCompletion: vi.fn((controller: any) => {
			bridge.presented.push(controller)
		}),
	}

	vi.stubGlobal('android', {
		content: {
			Intent: class {
				static ACTION_CREATE_DOCUMENT = 'android.intent.action.CREATE_DOCUMENT'
				static CATEGORY_OPENABLE = 'android.intent.category.OPENABLE'
				static EXTRA_TITLE = 'android.intent.extra.TITLE'
				static FLAG_GRANT_READ_URI_PERMISSION = 1
				static FLAG_GRANT_WRITE_URI_PERMISSION = 2
				action: any
				extras = new Map()
				constructor(action: any) {
					this.action = action
				}
				addCategory() {}
				setType() {}
				putExtra(key: any, value: any) {
					this.extras.set(key, value)
				}
				addFlags() {}
			},
		},
		app: { Activity: { RESULT_OK: -1 } },
		net: { Uri: { parse: (s: string) => ({ toString: () => s }) } },
	})

	vi.stubGlobal('java', {
		io: {
			FileOutputStream: class {},
			FileInputStream: class {},
			ByteArrayOutputStream: class {
				data: number[] = []
				write(chunk: any, _off: number, count: number) {
					for (let i = 0; i < count; i++) {
						this.data.push(chunk[i])
					}
				}
				size() {
					return this.data.length
				}
				toByteArray() {
					return this.data
				}
			},
			BufferedReader: class {},
			InputStreamReader: class {},
		},
		nio: {
			channels: {
				Channels: {
					newChannel: (out: any) => ({
						write: (buf: ArrayBuffer) => {
							bridge.channelWrites.push({ out, buf })
							return buf.byteLength
						},
					}),
				},
			},
		},
	})

	vi.stubGlobal('NSData', {
		dataWithBytesLength: (view: Uint8Array, length: number) => ({
			view,
			length,
			writeToFileAtomically: vi.fn(() => bridge.writeAtomic),
		}),
	})

	vi.stubGlobal('NSURL', { fileURLWithPath: (p: string) => ({ path: p }) })
	vi.stubGlobal('UIApplication', {
		sharedApplication: {
			get keyWindow() {
				return bridge.keyWindow ? { rootViewController: {} } : null
			},
			windows: { count: 0 },
		},
	})

	vi.stubGlobal('UIDocumentPickerViewController', {
		alloc: () => ({
			initForExportingURLsAsCopy: (urls: any, asCopy: boolean) => {
				lastPicker = { urls, asCopy, delegate: null, shouldShowFileExtensions: false }
				return lastPicker
			},
		}),
	})

	vi.stubGlobal('UIDocumentPickerDelegate', {})
	vi.stubGlobal(
		'NSObject',
		class {
			static new(this: any) {
				return new this()
			}
		},
	)
})

afterEach(() => {
	bridge.application.android = undefined
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('files.writeBytes (ios bridge)', () => {
	it('rejects when the atomic write reports failure instead of returning a dead ref', async () => {
		bridge.writeAtomic = false
		await expect(files.writeBytes('a.bin', new Uint8Array([1]))).rejects.toThrow(
			/Failed to write file/,
		)
	})

	it('returns a sandbox ref after a confirmed write', async () => {
		const ref = await files.writeBytes('a.bin', new Uint8Array([1, 2]))
		expect(ref).toEqual({ name: 'a.bin', uri: '/docs/a.bin' })
	})
})

describe('files.export (android bridge)', () => {
	beforeEach(stubAndroid)

	it('flushes bytes to the picked URI and resolves saved', async () => {
		const pending = files.export('out.bin', new Uint8Array([7, 8]))
		expect(bridge.activity.startActivityForResult).toHaveBeenCalledTimes(1)
		emitResult(okResult())
		expect(await pending).toBe('saved')
		expect(bridge.resolver.openOutputStream).toHaveBeenCalledTimes(1)
		expect(bridge.channelWrites).toHaveLength(1)
		expect(bridge.listeners.get('activityResult')?.size ?? 0).toBe(0)
	})

	it('resolves cancelled on a non-OK result and drops the listener', async () => {
		const pending = files.export('out.bin', new Uint8Array([1]))
		emitResult({ requestCode: 1241, resultCode: 0, intent: null })
		expect(await pending).toBe('cancelled')
		expect(bridge.resolver.openOutputStream).not.toHaveBeenCalled()
		expect(bridge.listeners.get('activityResult')?.size ?? 0).toBe(0)
	})

	it('rejects a concurrent export with ExportBusyError and recovers after settle', async () => {
		const first = files.export('a.bin', new Uint8Array([1]))
		await expect(files.export('b.bin', new Uint8Array([2]))).rejects.toThrowError(
			expect.objectContaining({ name: 'ExportBusyError' }),
		)

		expect(bridge.activity.startActivityForResult).toHaveBeenCalledTimes(1)

		emitResult(okResult())
		expect(await first).toBe('saved')

		const third = files.export('c.bin', new Uint8Array([3]))
		emitResult(okResult())
		expect(await third).toBe('saved')
	})

	it('rejects when the destination stream cannot open and cleans up', async () => {
		bridge.resolver.openOutputStream.mockReturnValue(null)
		const pending = files.export('out.bin', new Uint8Array([1]))
		emitResult(okResult())
		await expect(pending).rejects.toThrow(/Unable to open destination/)
		expect(bridge.listeners.get('activityResult')?.size ?? 0).toBe(0)

		// Guard released — a follow-up export is not stuck busy.
		bridge.resolver.openOutputStream.mockReturnValue({ close: vi.fn() })
		const next = files.export('next.bin', new Uint8Array([1]))
		emitResult(okResult())
		expect(await next).toBe('saved')
	})

	it('rejects when the activity cannot be started and removes the listener', async () => {
		bridge.activity.startActivityForResult.mockImplementation(() => {
			throw new Error('no activity to handle intent')
		})

		await expect(files.export('out.bin', new Uint8Array([1]))).rejects.toThrow(/no activity/)
		expect(bridge.listeners.get('activityResult')?.size ?? 0).toBe(0)
	})
})

describe('files.export (ios bridge)', () => {
	it('stages a temp copy, presents export-as-copy, and resolves saved with cleanup', async () => {
		const pending = files.export('out.bin', new Uint8Array([9]))
		expect(bridge.presented).toHaveLength(1)
		expect(lastPicker.asCopy).toBe(true)
		expect(lastPicker.delegate).toBeTruthy()

		lastPicker.delegate.documentPickerDidPickDocumentAtURL(lastPicker, { path: '/dest' })
		expect(await pending).toBe('saved')
		expect(bridge.removedPaths).toEqual(['/tmp/out.bin'])
		expect(lastPicker.delegate).toBeNull()
	})

	it('resolves cancelled on dismissal and removes the temp copy', async () => {
		const pending = files.export('out.bin', new Uint8Array([9]))
		lastPicker.delegate.documentPickerWasCancelled(lastPicker)
		expect(await pending).toBe('cancelled')
		expect(bridge.removedPaths).toEqual(['/tmp/out.bin'])
	})

	it('rejects when the temp write fails instead of hanging', async () => {
		bridge.writeAtomic = false
		await expect(files.export('out.bin', new Uint8Array([1]))).rejects.toThrow(
			/Failed to stage export file/,
		)

		expect(bridge.presented).toHaveLength(0)
	})

	it('rejects when no view controller can present instead of hanging', async () => {
		bridge.keyWindow = false
		await expect(files.export('out.bin', new Uint8Array([1]))).rejects.toThrow(
			/No visible view controller/,
		)

		expect(bridge.removedPaths).toEqual(['/tmp/out.bin'])
	})

	it('rejects a concurrent export with ExportBusyError', async () => {
		const first = files.export('a.bin', new Uint8Array([1]))
		await expect(files.export('b.bin', new Uint8Array([2]))).rejects.toThrowError(
			expect.objectContaining({ name: 'ExportBusyError' }),
		)

		lastPicker.delegate.documentPickerDidPickDocumentsAtURLs(lastPicker, { count: 1 })
		expect(await first).toBe('saved')
	})
})

describe('files.export (macos leaf)', () => {
	it('reports unavailable instead of throwing', async () => {
		expect(await macosFiles.export('a.bin', new Uint8Array([1]))).toBe('unavailable')
	})
})
