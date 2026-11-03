import { createCameraHost, type CameraHost } from './camera-host.macos.ts'

// TypeScript port of the removed Swift XplatPhotoCaptureSheet, registered under
// the same ObjC name so the media package's declare-const lookup still binds.
// App-owned still-photo UI: no microphone input, movie output or Photos writes.
declare const objc: { import(framework: string): void }
declare const NSObject: any
declare const NativeClass: (cls: unknown) => void
declare const interop: any

declare const NSApplication: any
declare const NSWindow: any
declare const NSView: any
declare const NSButton: any
declare const NSTextField: any
declare const NSColor: any
declare const NSImage: any
declare const NSBitmapImageRep: any
declare const NSWindowDelegate: any
declare const NSNotificationCenter: any
declare const NSOperationQueue: any
declare const NSFileManager: any
declare const NSUUID: any
declare const NSData: any
declare const NSNumber: any
declare const NSMutableDictionary: any

declare const NSWindowWillCloseNotification: string
declare const NSImageCompressionFactor: string

let importsDone = false
const ensureImports = () => {
	if (!importsDone) {
		importsDone = true
		objc.import('AppKit')
		objc.import('AVFoundation')
	}
}

import { createPhotoCaptureLifecycle, type PhotoCaptureLifecycle } from './photo-lifecycle.macos.ts'

const typed = (object: any, cls: any): any =>
	object == null ? object : Object.setPrototypeOf(object, cls.prototype)

// The class definition must stay import-safe where the bridge globals are
// absent (sandboxed loaders, non-AppKit bundles): fall back to inert bases.
// Constructing a sheet still requires the real host, which refuses lazily.
const g = globalThis as Record<string, any>
const SheetBase: any = g.NSObject ?? class {}
class XplatPhotoCaptureSheet extends SheetBase {
	static ObjCProtocols: any[] = g.NSWindowDelegate ? [g.NSWindowDelegate] : []
	static ObjCExposedMethods: Record<string, unknown> = {
		permissionStatus: { params: [] as any[], returns: g.interop?.types?.id },
		'present:reply:': {
			params: [g.interop?.types?.id, g.interop?.types?.id],
			returns: g.interop?.types?.void,
		},
		'discard:': { params: [g.interop?.types?.id], returns: g.interop?.types?.void },
		dispose: { params: [] as any[], returns: g.interop?.types?.void },
		'windowShouldClose:': { params: [g.interop?.types?.id], returns: g.interop?.types?.bool },
		// NSButton target/action selectors. Without entries the click never
		// reaches JS — AppKit dispatch needs the registered selector.
		capturePhoto: { params: [] as any[], returns: g.interop?.types?.void },
		cancelPhoto: { params: [] as any[], returns: g.interop?.types?.void },
	}
	static {
		if (typeof g.NativeClass === 'function') {
			// The JSC host's native method enumeration sees enumerable keys only:
			// class methods are non-enumerable, so mark the exposed methods
			// before registering or AppKit dispatch cannot reach them.
			for (const name of Object.keys(this.ObjCExposedMethods)) {
				const descriptor = Object.getOwnPropertyDescriptor(this.prototype, name)
				if (descriptor && typeof descriptor.value === 'function' && !descriptor.enumerable) {
					Object.defineProperty(this.prototype, name, { ...descriptor, enumerable: true })
				}
			}

			g.NativeClass(this)
		}
	}

	// alloc().init() bypasses JS field initializers; create lazily so both
	// construction paths land on a live host and lifecycle.
	private _host: CameraHost | undefined
	private _life: PhotoCaptureLifecycle | undefined
	private get host(): CameraHost {
		return (this._host ??= (ensureImports(), createCameraHost()))
	}
	private get life(): PhotoCaptureLifecycle {
		return (this._life ??= createPhotoCaptureLifecycle())
	}
	private sheet: any
	private parent: any
	private reply: ((result: string | null) => void) | undefined
	private timeout: ReturnType<typeof setTimeout> | undefined
	private closeObserver: any
	private preview: any
	private captureButton: any
	private statusLabel: any
	private options: Record<string, unknown> = {}
	private disposed = false
	private _operationTimeout: number | undefined
	// alloc().init() bypasses JS field initializers, so the deadline must not
	// read a bare field: an uninitialized timeout would fire immediately.
	private get operationTimeout(): number {
		return (this._operationTimeout ??= 15_000)
	}

	permissionStatus(): string {
		return this.host.permissionStatus('camera')
	}

	// ObjC callers bind present:reply:; JS callers use the camel alias.
	presentReply(options: any, reply: (result: string | null) => void): void {
		this['present:reply:'](options, reply)
	}

	['present:reply:'](options: any, reply: (result: string | null) => void): void {
		const app = NSApplication.sharedApplication
		const parent = app.keyWindow ?? app.mainWindow
		if (parent == null) {
			reply(null)
			return
		}
		this.presentOnWindow(parent, options ?? {}, reply)
	}

	// Explicit host window mirrors the Swift test seam.
	presentOnWindow(
		parent: any,
		options: Record<string, unknown>,
		reply: (result: string | null) => void,
	): void {
		// saveToGallery is not refused here: the media leaf owns the Photos
		// write after the shot file is delivered.
		if (this.disposed || this.sheet != null || parent.attachedSheet != null) {
			reply(null)
			return
		}
		this.options = options
		this.reply = reply
		this.parent = parent
		const frame = (w: number, h: number) => ({
			origin: { x: 0, y: 0 },
			size: { width: w, height: h },
		})
		const sheet = typed(
			NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(frame(640, 480), 3, 2, false),
			NSWindow,
		)
		sheet.title = 'Take a photo'
		sheet.delegate = this
		const content = NSView.alloc().initWithFrame(frame(640, 480))
		const preview = NSView.alloc().initWithFrame({
			origin: { x: 16, y: 80 },
			size: { width: 608, height: 384 },
		})
		preview.wantsLayer = true
		preview.layer.backgroundColor = NSColor.blackColor.CGColor
		content.addSubview(preview)
		const status = NSTextField.labelWithString('Choose Capture to start the camera.')
		status.frame = { origin: { x: 16, y: 48 }, size: { width: 440, height: 22 } }
		content.addSubview(status)
		const cancel = NSButton.buttonWithTitleTargetAction('Cancel', this, 'cancelPhoto')
		cancel.keyEquivalent = ''
		cancel.frame = { origin: { x: 432, y: 12 }, size: { width: 92, height: 32 } }
		content.addSubview(cancel)
		const capture = NSButton.buttonWithTitleTargetAction('Capture', this, 'capturePhoto')
		capture.keyEquivalent = '\r'
		capture.frame = { origin: { x: 528, y: 12 }, size: { width: 96, height: 32 } }
		content.addSubview(capture)
		sheet.contentView = content
		this.sheet = sheet
		this.preview = preview
		this.statusLabel = status
		this.captureButton = capture
		this.closeObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSWindowWillCloseNotification,
			parent,
			NSOperationQueue.mainQueue,
			() => this.complete(null),
		)
		parent.beginSheetCompletionHandler(sheet, () => this.complete(null))
	}

	private deadline(token: number): void {
		if (this.timeout !== undefined) {
			clearTimeout(this.timeout)
		}
		this.timeout = setTimeout(() => {
			if (!this.disposed && this.life.accepts(token)) {
				this.complete(null)
			}
		}, this.operationTimeout)
	}

	['capturePhoto'](): void {
		const prepared = this.life.prepare()
		if (prepared != null) {
			const token = prepared
			if (this.captureButton != null) {
				this.captureButton.isEnabled = false
			}

			if (this.statusLabel != null) {
				this.statusLabel.stringValue = 'Starting camera…'
			}

			this.deadline(token)
			// Authorization happens only after the user presses Capture.
			this.host.requestPermissionReply('camera', (status: string) => {
				if (this.disposed || !this.life.accepts(token)) {
					return
				}
				if (status !== 'granted') {
					this.complete(null)
					return
				}
				const failure = this.host.configure({ photo: true, audio: false })
				if (this.disposed || !this.life.accepts(token)) {
					return
				}
				if (failure != null || this.preview == null) {
					this.complete(null)
					return
				}
				this.host.installObserver((message: string) => {
					let event: any
					try {
						event = JSON.parse(message)
					} catch {
						return
					}
					if (!this.life.accepts(token)) {
						return
					}
					if (event.type === 'previewReady' && event.ready === true && this.life.ready(token)) {
						if (this.timeout !== undefined) {
							clearTimeout(this.timeout)
							this.timeout = undefined
						}

						this.captureButton.isEnabled = true
						if (this.statusLabel != null) {
							this.statusLabel.stringValue = 'Frame your photo, then choose Capture.'
						}
					} else if (
						event.type === 'interrupted' ||
						(event.type === 'availability' && event.available === false)
					) {
						this.complete(null)
					}
				})
				if (this.host.attachPreview(this.preview) != null) {
					this.complete(null)
				}
			})

			return
		}
		const token = this.life.capture()
		if (token == null) {
			return
		}
		if (this.captureButton != null) {
			this.captureButton.isEnabled = false
		}
		if (this.statusLabel != null) {
			this.statusLabel.stringValue = 'Taking photo…'
		}
		this.deadline(token)
		const failure = this.host.capturePhoto((data: any) => {
			if (this.disposed || !this.life.accepts(token)) {
				return
			}
			const result = data != null ? this.persist(data) : null
			this.complete(result)
		})
		if (failure != null) {
			this.complete(null)
		}
	}

	private persist(data: any): string | null {
		const source = typed(NSBitmapImageRep.alloc().initWithData(data), NSBitmapImageRep)
		if (source == null) {
			return null
		}
		// Option semantics match the Swift NSNumber cast: a non-number falls
		// back to the source size, while an out-of-range number fails below.
		const width =
			typeof this.options.width === 'number' ? this.options.width : Number(source.pixelsWide)
		const height =
			typeof this.options.height === 'number' ? this.options.height : Number(source.pixelsHigh)
		if (
			!Number.isFinite(width) ||
			!Number.isFinite(height) ||
			width < 1 ||
			height < 1 ||
			width > 16384 ||
			height > 16384 ||
			width * height > 64_000_000
		) {
			return null
		}
		const keepAspectRatio = this.options.keepAspectRatio !== false
		const scale = Math.min(width / source.pixelsWide, height / source.pixelsHigh, 1)
		const size = {
			width: keepAspectRatio ? source.pixelsWide * scale : width,
			height: keepAspectRatio ? source.pixelsHigh * scale : height,
		}
		// The long NSBitmapImageRep designated initializer is absent from the
		// bridge metadata; resize through NSImage + TIFFRepresentation instead.
		const image = typed(NSImage.alloc().init(), NSImage)
		if (image == null) {
			return null
		}
		try {
			image.addRepresentation(source)
			image.size = { width: Math.floor(size.width), height: Math.floor(size.height) }
			const tiff =
				typeof image.TIFFRepresentation === 'function'
					? image.TIFFRepresentation()
					: image.TIFFRepresentation

			const scaled =
				tiff != null ? typed(NSBitmapImageRep.imageRepWithData(tiff), NSBitmapImageRep) : null

			if (scaled == null) {
				return null
			}

			const props = NSMutableDictionary.dictionary()
			props.setObjectForKey(0.9, NSImageCompressionFactor)
			const jpeg = scaled.representationUsingTypeProperties(g.NSBitmapImageFileTypeJPEG ?? 3, props)
			if (jpeg == null) {
				return null
			}

			return this.persistWrite(jpeg)
		} catch {
			return null
		}
	}

	private persistWrite(jpeg: any): string | null {
		const name = `octane-capture-${NSUUID.UUID().UUIDString}.jpg`
		const url = NSFileManager.defaultManager.temporaryDirectory.URLByAppendingPathComponent(name)
		try {
			const payload = {
				name,
				uri: String(url.path),
				dataUrl: `data:image/jpeg;base64,${jpeg.base64EncodedStringWithOptions(0)}`,
			}

			const message = JSON.stringify(payload)
			if (!jpeg.writeToURLAtomically(url, true)) {
				return null
			}

			return message
		} catch {
			try {
				NSFileManager.defaultManager.removeItemAtURLError(url, null)
			} catch {
				// Temporary leftovers are reclaimed by the OS.
			}

			return null
		}
	}

	['cancelPhoto'](): void {
		this.complete(null)
	}

	['windowShouldClose:'](_sender: any): boolean {
		this.complete(null)
		return false
	}

	private complete(result: string | null): void {
		if (!this.life.finish()) {
			return
		}
		const callback = this.reply
		this.reply = undefined
		this.dispose()
		callback?.(result)
	}

	discard(path: any): void {
		this['discard:'](path)
	}

	['discard:'](path: any): void {
		const value = String(path)
		const manager = NSFileManager.defaultManager
		const tempDir = String(manager.temporaryDirectory.path ?? '')
		const name = value.slice(value.lastIndexOf('/') + 1)
		if (
			tempDir === '' ||
			!name.startsWith('octane-capture-') ||
			value !== `${tempDir.replace(/\/+$/, '')}/${name}`
		) {
			return
		}
		manager.removeItemAtPathError(value, null)
	}

	dispose(): void {
		if (this.disposed) {
			return
		}
		this.disposed = true
		if (this.timeout !== undefined) {
			clearTimeout(this.timeout)
			this.timeout = undefined
		}
		if (this.closeObserver != null) {
			NSNotificationCenter.defaultCenter.removeObserver(this.closeObserver)
			this.closeObserver = undefined
		}
		this._host?.dispose()
		if (this.sheet != null) {
			this.parent?.endSheet(this.sheet)
			this.sheet.orderOut(null)
		}
		this.sheet = undefined
		this.preview = undefined
		this.captureButton = undefined
		this.statusLabel = undefined
		// Disposal is also a cancellation, including an external owner teardown.
		if (this.life.finish()) {
			const callback = this.reply
			this.reply = undefined
			callback?.(null)
		}
	}
}

// Publish under the ObjC name the media package binds dynamically.
;(globalThis as Record<string, unknown>).XplatPhotoCaptureSheet = XplatPhotoCaptureSheet

export { XplatPhotoCaptureSheet }
