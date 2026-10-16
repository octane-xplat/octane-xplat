// share.file leaf tests. Native module imports are mocked and the iOS/Android
// global APIs are replaced with faithful stub shapes (same call surfaces the
// runtime marshals) so validation, provider wiring, and outcome mapping are
// exercised in node — not a substitute for native smoke.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'

const mock = vi.hoisted(() => ({
	visibleVC: null as any,
	keyWindow: true,
	existingPaths: new Set<string>(),
	activity: null as any,
	context: null as any,
	getUriForFile: vi.fn(),
	uriParse: vi.fn(),
	intents: [] as any[],
	chooserTitle: undefined as any,
	presented: [] as any[],
	fileManager: { fileExistsAtPath: (p: string) => mock.existingPaths.has(p) },
}))

vi.mock('@nativescript/core', () => ({
	Utils: {
		ios: {
			getVisibleViewController: (root: any) => (root ? mock.visibleVC : null),
		},
		android: {
			getApplicationContext: () => mock.context,
		},
	},
	Application: {
		android: {
			get foregroundActivity() {
				return mock.activity
			},
			startActivity: null,
		},
	},
	isIOS: false,
}))

// Explicit suffixed specifiers — the shared leaf module names resolve per
// platform under consumer builds; these tests pin each leaf directly.
import { fileProviderAuthority, mimeTypeFromName, normalizeFilePath } from '../src/share-paths.ts'

import { shareFile as shareFileIos } from '../src/share-file.ios.ts'
import { shareFile as shareFileAndroid } from '../src/share-file.android.ts'

function stubIosRuntime() {
	;(globalThis as any).UIApplication = {
		sharedApplication: {
			keyWindow: mock.keyWindow ? { rootViewController: {} } : null,
			windows: { count: 1, 0: {} },
		},
	}

	;(globalThis as any).NSFileManager = { defaultManager: mock.fileManager }

	;(globalThis as any).NSURL = { fileURLWithPath: (p: string) => `file://${p}` }

	;(globalThis as any).CGRectMake = (x: number, y: number, w: number, h: number) => ({
		origin: { x, y },
		size: { width: w, height: h },
	})

	;(globalThis as any).UIActivityViewController = {
		alloc: () => ({
			initWithActivityItemsApplicationActivities(items: any[]) {
				const sheet = {
					items,
					popoverPresentationController: { sourceView: null, sourceRect: null },
				}

				mock.presented.push(sheet)
				return sheet
			},
		}),
	}
}

function stubAndroidRuntime() {
	const pm = {
		queryIntentActivities: vi.fn(() => ({
			size: () => 2,
			get: (i: number) => ({ activityInfo: { packageName: `com.target.${i}` } }),
		})),
	}

	mock.context = {
		getPackageName: () => 'com.example.app',
		getPackageManager: () => pm,
		grantUriPermission: vi.fn(),
		startActivity: vi.fn(),
	}

	mock.activity = { startActivity: vi.fn() }
	mock.getUriForFile
		.mockReset()
		.mockReturnValue('content://com.example.app.xplatshare/cache/clip.mov')

	mock.uriParse.mockReset().mockImplementation((u: string) => ({ uri: u }))
	mock.intents.length = 0

	;(globalThis as any).java = {
		io: {
			File: class {
				constructor(public p: string) {}
				exists() {
					return mock.existingPaths.has(this.p)
				}
			},
		},
	}

	;(globalThis as any).android = {
		net: { Uri: { parse: mock.uriParse } },
		content: {
			Intent: class {
				static ACTION_SEND = 'android.intent.action.SEND'
				static EXTRA_STREAM = 'android.intent.extra.STREAM'
				static FLAG_GRANT_READ_URI_PERMISSION = 1
				static createChooser = (intent: any, title: any) => {
					mock.chooserTitle = title
					return { chooserOf: intent }
				}
				extras = new Map<string, any>()
				flags = 0
				type: string | null = null
				constructor(public action: string) {
					mock.intents.push(this)
				}
				setType(t: string) {
					this.type = t
				}
				putExtra(k: string, v: any) {
					this.extras.set(k, v)
				}
				addFlags(f: number) {
					this.flags |= f
				}
			},
		},
	}

	;(globalThis as any).androidx = {
		core: { content: { FileProvider: { getUriForFile: mock.getUriForFile } } },
	}
}

afterEach(() => {
	mock.visibleVC = null
	mock.keyWindow = true
	mock.existingPaths.clear()
	mock.activity = null
	mock.context = null
	mock.presented.length = 0
	for (const key of [
		'UIApplication',
		'UIActivityViewController',
		'NSFileManager',
		'NSURL',
		'CGRectMake',
		'java',
		'android',
		'androidx',
	]) {
		delete (globalThis as any)[key]
	}
})

describe('normalizeFilePath', () => {
	it('accepts absolute paths', () => {
		expect(normalizeFilePath('/var/mobile/clip.mov')).toEqual({
			kind: 'file',
			path: '/var/mobile/clip.mov',
		})
	})

	it('normalizes file:// URLs and decodes escapes', () => {
		expect(normalizeFilePath('file:///data/user/0/x/files/My%20Clip.mov')).toEqual({
			kind: 'file',
			path: '/data/user/0/x/files/My Clip.mov',
		})
	})

	it('passes content:// URIs through untouched', () => {
		const uri = 'content://com.app.provider/docs/a.pdf'
		expect(normalizeFilePath(uri)).toEqual({ kind: 'content', uri })
	})

	it.each([undefined, null, '', 42, {}, 'relative/dir/file.mov'])(
		'rejects invalid input %j',
		(input) => {
			expect(() => normalizeFilePath(input)).toThrow()
		},
	)

	it.each(['https://example.com/a.pdf', 'res://icon', 'data:text/plain;base64,x'])(
		'rejects non-file scheme %s',
		(input) => {
			expect(() => normalizeFilePath(input)).toThrow()
		},
	)

	it('rejects malformed file:// escapes', () => {
		expect(() => normalizeFilePath('file:///bad/%ZZ')).toThrow()
	})
})

describe('provider configuration', () => {
	it('derives the authority from the package name with a distinct suffix', () => {
		expect(fileProviderAuthority('com.example.app')).toBe('com.example.app.xplatshare')
		expect(fileProviderAuthority('com.example.app')).not.toBe('com.example.app.provider')
	})

	it('declares the matching provider + roots in the shipped manifest', () => {
		const manifest = readFileSync(
			new URL('../platforms/android/AndroidManifest.xml', import.meta.url),
			'utf8',
		)

		expect(manifest).toContain('${applicationId}.xplatshare')
		expect(manifest).toContain('androidx.core.content.FileProvider')
		expect(manifest).toContain('@xml/xplat_share_paths')

		const paths = readFileSync(
			new URL('../platforms/android/res/xml/xplat_share_paths.xml', import.meta.url),
			'utf8',
		)

		for (const root of ['files-path', 'cache-path', 'external-path', 'external-files-path']) {
			expect(paths).toContain(root)
		}

		expect(paths).not.toContain('<root-path')
	})
})

describe('mimeTypeFromName', () => {
	it.each([
		['clip.mov', 'video/quicktime'],
		['PHOTO.JPG', 'image/jpeg'],
		['doc.pdf', 'application/pdf'],
		['no-extension', null],
		['trailing.', null],
		['odd.xyz', null],
	])('%s → %s', (name, expected) => {
		expect(mimeTypeFromName(name)).toBe(expected)
	})
})

describe('shareFile (iOS leaf)', () => {
	beforeEach(stubIosRuntime)

	it('resolves unavailable when the file does not exist', async () => {
		mock.visibleVC = { view: { bounds: { size: { width: 100, height: 200 } } } }
		expect(await shareFileIos('/missing/clip.mov')).toBe('unavailable')
		expect(mock.presented).toHaveLength(0)
	})

	it('resolves unavailable without a presenter', async () => {
		mock.existingPaths.add('/docs/clip.mov')
		mock.keyWindow = false

		;(globalThis as any).UIApplication.sharedApplication.windows = { count: 0 }
		expect(await shareFileIos('/docs/clip.mov')).toBe('unavailable')
	})

	it('resolves shared/cancelled from the sheet completion', async () => {
		mock.existingPaths.add('/docs/clip.mov')
		mock.visibleVC = {
			view: { bounds: { size: { width: 100, height: 200 } } },
			presentViewControllerAnimatedCompletion: vi.fn(),
		}

		const pending = shareFileIos('/docs/clip.mov')
		const sheet = mock.presented[0]
		expect(sheet.items).toEqual(['file:///docs/clip.mov'])
		sheet.completionWithItemsHandler(null, true)
		expect(await pending).toBe('shared')

		const again = shareFileIos('/docs/clip.mov')
		mock.presented[1].completionWithItemsHandler(null, false)
		expect(await again).toBe('cancelled')
	})

	it('anchors the popover presentation for iPad', async () => {
		mock.existingPaths.add('/docs/clip.mov')
		const view = { bounds: { size: { width: 100, height: 200 } } }
		mock.visibleVC = { view, presentViewControllerAnimatedCompletion: vi.fn() }
		const pending = shareFileIos('/docs/clip.mov')
		expect(mock.presented[0].popoverPresentationController.sourceView).toBe(view)
		expect(mock.presented[0].popoverPresentationController.sourceRect).toEqual({
			origin: { x: 50, y: 199 },
			size: { width: 1, height: 1 },
		})

		mock.presented[0].completionWithItemsHandler(null, true)
		await pending
	})

	it('rejects content:// URIs and invalid paths', async () => {
		await expect(shareFileIos('content://x/y')).rejects.toThrow(/Android-only/)
		await expect(shareFileIos('')).rejects.toThrow()
	})
})

describe('shareFile (Android leaf)', () => {
	it('resolves unavailable without a context or activity', async () => {
		stubAndroidRuntime()
		mock.context = null
		expect(await shareFileAndroid('/x/clip.mov')).toBe('unavailable')
	})

	it('resolves unavailable when the file does not exist', async () => {
		stubAndroidRuntime()
		expect(await shareFileAndroid('/x/missing.mov')).toBe('unavailable')
		expect(mock.getUriForFile).not.toHaveBeenCalled()
	})

	it('shares a file path through the package FileProvider', async () => {
		stubAndroidRuntime()
		mock.existingPaths.add('/data/user/0/com.example.app/files/clip.mov')
		expect(await shareFileAndroid('/data/user/0/com.example.app/files/clip.mov')).toBe('shared')

		expect(mock.getUriForFile).toHaveBeenCalledWith(
			mock.context,
			'com.example.app.xplatshare',
			expect.objectContaining({ p: '/data/user/0/com.example.app/files/clip.mov' }),
		)

		const intent = mock.intents[0]
		expect(intent.action).toBe('android.intent.action.SEND')
		expect(intent.type).toBe('video/quicktime')
		expect(intent.extras.get('android.intent.extra.STREAM')).toBe(
			'content://com.example.app.xplatshare/cache/clip.mov',
		)

		expect(intent.flags & 1).toBe(1)
		expect(mock.context.grantUriPermission).toHaveBeenCalledWith(
			'com.target.0',
			expect.anything(),
			1,
		)

		expect(mock.context.grantUriPermission).toHaveBeenCalledWith(
			'com.target.1',
			expect.anything(),
			1,
		)

		expect(mock.activity.startActivity).toHaveBeenCalledWith({ chooserOf: intent })
	})

	it('passes content:// URIs straight through without the provider', async () => {
		stubAndroidRuntime()
		expect(await shareFileAndroid('content://other.app/doc.pdf')).toBe('shared')
		expect(mock.uriParse).toHaveBeenCalledWith('content://other.app/doc.pdf')
		expect(mock.getUriForFile).not.toHaveBeenCalled()
	})

	it('honors mimeType and subject options', async () => {
		stubAndroidRuntime()
		mock.existingPaths.add('/cache/blob')
		await shareFileAndroid('/cache/blob', { mimeType: 'application/pdf', subject: 'Send clip' })
		expect(mock.intents[0].type).toBe('application/pdf')
		expect(mock.chooserTitle).toBe('Send clip')
	})

	it('falls back to octet-stream for unknown extensions', async () => {
		stubAndroidRuntime()
		mock.existingPaths.add('/cache/blob.xyz')
		await shareFileAndroid('/cache/blob.xyz')
		expect(mock.intents[0].type).toBe('application/octet-stream')
	})

	it('rejects when the provider cannot resolve the file', async () => {
		stubAndroidRuntime()
		mock.existingPaths.add('/proc/secret')
		mock.getUriForFile.mockImplementation(() => {
			throw new Error('Failed to find configured root')
		})

		await expect(shareFileAndroid('/proc/secret')).rejects.toThrow(/xplatshare/)
	})
})
