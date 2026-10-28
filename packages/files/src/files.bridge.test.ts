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
	textWriteError: null as Error | null,
	textWrites: [] as { path: string; text: string }[],
	removedPaths: [] as string[],
	channelWrites: [] as any[],
	presented: [] as any[],
	dataCalls: [] as { view: any; length: number }[],
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
			// NativeScript's synchronous text API reports I/O failures only to
			// its optional callback. The async variant rejects the same failure.
			writeTextSync: (text: string, onError?: (error: Error) => void) => {
				if (bridge.textWriteError) {
					onError?.(bridge.textWriteError)
					return
				}

				bridge.textWrites.push({ path: p, text })
			},
			writeText: async (text: string) => {
				if (bridge.textWriteError) {
					throw bridge.textWriteError
				}

				bridge.textWrites.push({ path: p, text })
			},
		}),
	},
	knownFolders: {
		documents: () => ({ path: '/docs' }),
		temp: () => ({
			path: '/tmp',
			getFolder: (name: string) => ({ path: `/tmp/${name}` }),
		}),
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
import { openFilePicker } from '@nativescript-community/ui-document-picker'
import { files } from './files.ts'
import { files as macosFiles } from './files.macos'

// NS runtime builtins the byte path uses: Array.create produces a Java
// byte[]; ArrayBuffer.from materializes one back into JS memory.
function stubByteRuntime() {
	;(Array as any).create = (_type: string, length: number) => Array.from({ length })

	;(ArrayBuffer as any).from = (bytes: any) => new Uint8Array(bytes).buffer
}

function streamOf(bytes: number[]) {
	let offset = 0
	return {
		read: vi.fn((chunk: number[]) => {
			const remaining = bytes.length - offset
			if (remaining <= 0) {
				return -1
			}

			const count = Math.min(chunk.length, remaining)
			for (let i = 0; i < count; i++) {
				chunk[i] = bytes[offset++]
			}

			return count
		}),
		close: vi.fn(),
	}
}

function stubAndroid() {
	stubByteRuntime()
	bridge.resolver = {
		openOutputStream: vi.fn(() => ({ close: vi.fn() })),
		openInputStream: vi.fn(),
		query: vi.fn(() => null),
	}

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
	bridge.dataCalls = []
	bridge.keyWindow = true
	bridge.writeAtomic = true
	bridge.textWriteError = null
	bridge.textWrites = []
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
				toString() {
					return new TextDecoder().decode(new Uint8Array(this.data))
				}
			},
		},
		nio: {
			ByteBuffer: { wrap: (bytes: any) => bytes },
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
		dataWithBytesLength: (view: any, length: number) => {
			bridge.dataCalls.push({ view, length })
			return {
				view,
				length,
				writeToFileAtomically: vi.fn(() => bridge.writeAtomic),
			}
		},
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
	delete (Array as any).create
	delete (ArrayBuffer as any).from
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

for (const platform of ['ios', 'android']) {
	describe(`files.writeText (${platform} bridge)`, () => {
		beforeEach(() => {
			if (platform === 'android') {
				stubAndroid()
			}
		})

		it('returns a sandbox reference after writing the text', async () => {
			await expect(files.writeText('note.txt', 'Saved note')).resolves.toEqual({
				name: 'note.txt',
				uri: '/docs/note.txt',
			})
			expect(bridge.textWrites).toEqual([{ path: '/docs/note.txt', text: 'Saved note' }])
		})

		it('rejects a storage error instead of returning an unsaved reference', async () => {
			bridge.textWriteError = new Error('storage is full')
			await expect(files.writeText('note.txt', 'Unsaved note')).rejects.toThrow('storage is full')
		})
	})
}

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

	it('marshals only the view’s byte range for offset views', async () => {
		const backing = new Uint8Array([9, 1, 2, 3, 8])
		await files.writeBytes('a.bin', backing.subarray(1, 4))
		const call = bridge.dataCalls.at(-1)!
		expect(call.length).toBe(3)
		expect([...new Uint8Array(call.view)]).toEqual([1, 2, 3])
	})
})

describe('files.pick (android bridge)', () => {
	beforeEach(stubAndroid)

	it('names the picked ref from the provider _display_name column', async () => {
		vi.mocked(openFilePicker).mockResolvedValueOnce({
			files: ['content://docs/1234'],
			android: { doc: true },
		} as any)

		bridge.resolver.query.mockReturnValue({
			moveToFirst: () => true,
			getColumnIndex: (column: string) => (column === '_display_name' ? 0 : -1),
			getString: () => 'Quarterly Report.pdf',
			close: vi.fn(),
		})

		const ref = await files.pick()
		expect(ref?.name).toBe('Quarterly Report.pdf')
		expect(bridge.resolver.query).toHaveBeenCalled()
	})

	it('falls back to the decoded URI segment when the column is absent', async () => {
		vi.mocked(openFilePicker).mockResolvedValueOnce({
			files: ['content://docs/report%20final.txt'],
		} as any)

		const ref = await files.pick()
		expect(ref?.name).toBe('report final.txt')
	})
})

describe('files.readText (android bridge)', () => {
	beforeEach(stubAndroid)

	it('decodes content:// bytes without rewriting line endings', async () => {
		const bytes = [...new TextEncoder().encode('a\r\nb\n')]
		bridge.resolver.openInputStream.mockReturnValue(streamOf(bytes))

		await expect(files.readText({ name: 'doc', uri: 'content://x/doc' })).resolves.toBe('a\r\nb\n')

		expect(bridge.resolver.openInputStream).toHaveBeenCalledTimes(1)
	})

	it('routes file:// refs through the resolver like readBytes', async () => {
		bridge.resolver.openInputStream.mockReturnValue(streamOf([104, 105]))
		await expect(files.readText({ name: 'doc', uri: 'file:///data/doc.txt' })).resolves.toBe('hi')

		expect(bridge.resolver.openInputStream).toHaveBeenCalledTimes(1)
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
		expect(bridge.removedPaths).toEqual(['/tmp/xplat-export/out.bin'])
		expect(lastPicker.delegate).toBeNull()
	})

	it('resolves cancelled on dismissal and removes the temp copy', async () => {
		const pending = files.export('out.bin', new Uint8Array([9]))
		lastPicker.delegate.documentPickerWasCancelled(lastPicker)
		expect(await pending).toBe('cancelled')
		expect(bridge.removedPaths).toEqual(['/tmp/xplat-export/out.bin'])
	})

	it('rejects when the temp write fails instead of hanging', async () => {
		bridge.writeAtomic = false
		await expect(files.export('out.bin', new Uint8Array([1]))).rejects.toThrow(
			/Failed to stage export file/,
		)

		expect(bridge.presented).toHaveLength(0)
	})

	it('stages inside a dedicated folder so app temp files cannot be clobbered', async () => {
		const pending = files.export('settings.json', new Uint8Array([1]))
		expect(lastPicker.urls[0].path).toBe('/tmp/xplat-export/settings.json')

		lastPicker.delegate.documentPickerWasCancelled(lastPicker)
		expect(await pending).toBe('cancelled')
		expect(bridge.removedPaths).toEqual(['/tmp/xplat-export/settings.json'])
	})

	it('rejects when no view controller can present instead of hanging', async () => {
		bridge.keyWindow = false
		await expect(files.export('out.bin', new Uint8Array([1]))).rejects.toThrow(
			/No visible view controller/,
		)

		expect(bridge.removedPaths).toEqual(['/tmp/xplat-export/out.bin'])
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
