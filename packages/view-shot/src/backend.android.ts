import { Application, View } from '@nativescript/core'
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CaptureBackend } from './backend-types'
import type { NormalizedCaptureOptions } from './types'
interface Engine {
	validate(view: android.view.View): string | null
	capture(view: android.view.View, json: string): string
	remove(uri: string): boolean
}
function engine(): Engine | undefined {
	return (
		globalThis as unknown as { com?: { octanexplat?: { viewshot?: { ViewShotBridge?: Engine } } } }
	).com?.octanexplat?.viewshot?.ViewShotBridge
}
function required() {
	const value = engine()
	if (!value) {
		throw new UnavailabilityError(
			'Native Android view-capture bridge; rebuild the app after installation',
		)
	}
	return value
}
function nativeView(target: object): android.view.View {
	const value = target instanceof View ? target.nativeViewProtected : target
	if (!(value instanceof android.view.View)) {
		throw new TypeError('Capture requires a mounted NativeScript or Android View')
	}
	const failure = required().validate(value)
	if (failure) {
		throw new Error(failure)
	}
	return value
}
async function capture(target: object, options: NormalizedCaptureOptions): Promise<string> {
	if (
		options.snapshotContentContainer ||
		options.useRenderInContext ||
		options.handleGLSurfaceViewOnAndroid
	) {
		throw new UnavailabilityError('Requested Android capture strategy')
	}
	const reply: { error?: unknown; uri?: unknown } = JSON.parse(
		required().capture(nativeView(target), JSON.stringify(options)),
	)
	if (typeof reply?.error === 'string') {
		throw new Error(reply.error)
	}
	if (typeof reply?.uri !== 'string' || !reply.uri) {
		throw new Error('Malformed Android capture reply')
	}
	return reply.uri
}
export const backend: CaptureBackend = {
	capabilities: () => ({
		view: Boolean(engine()),
		screen: Boolean(engine()),
		formats: engine() ? ['png', 'jpg', 'webp'] : [],
		scrollContent: false,
	}),
	validate(target) {
		nativeView(target)
	},
	capture,
	async captureScreen(options) {
		const view = Application.primaryWindow?.android?.activity?.getWindow()?.getDecorView()
		if (!view) {
			throw new Error('A primary Android app window is required')
		}
		return capture(view, options)
	},
	release(uri) {
		if (!uri.startsWith('file:')) {
			return
		}
		if (engine() && !required().remove(uri)) {
			throw new Error('Could not release the temporary capture')
		}
	},
	async waitForLayout(target, cancelled) {
		required()
		const start = Date.now()
		while (!cancelled()) {
			try {
				nativeView(target)
				return
			} catch (error) {
				if (Date.now() - start >= 1500) {
					throw error
				}
			}
			await new Promise<void>((resolve) => setTimeout(resolve, 16))
		}
		throw new Error('ViewShot unmounted while waiting for layout')
	},
}
