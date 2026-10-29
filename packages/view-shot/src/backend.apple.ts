import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { CaptureBackend } from './backend-types'
import type { NormalizedCaptureOptions } from './types'

interface Engine {
	validate(view: object): string | null
	captureView(json: string, view: object): string
	remove(uri: string): boolean
}
export function createAppleBackend(policy: {
	resolve(target: object): object
	screen?: () => object
	renderInContext: boolean
}): CaptureBackend {
	let instance: Engine | undefined
	function engine() {
		const Type = (globalThis as unknown as { XplatViewShotEngine?: { 'new'(): Engine } })
			.XplatViewShotEngine
		return (instance ??= Type?.new())
	}
	function required() {
		const value = engine()
		if (!value) {
			throw new UnavailabilityError(
				'Native view-capture bridge; rebuild the app after installation',
			)
		}
		return value
	}
	function validate(target: object): object {
		const native = policy.resolve(target)
		const failure = required().validate(native)
		if (failure) {
			throw new Error(failure)
		}
		return native
	}
	async function capture(target: object, options: NormalizedCaptureOptions): Promise<string> {
		if (
			options.format === 'webp' ||
			options.snapshotContentContainer ||
			options.handleGLSurfaceViewOnAndroid ||
			options.fileName !== undefined ||
			(options.useRenderInContext && !policy.renderInContext)
		) {
			throw new UnavailabilityError('Requested format/strategy in this Apple capture subset')
		}
		const native = validate(target)
		const value: unknown = JSON.parse(required().captureView(JSON.stringify(options), native))
		if (!value || typeof value !== 'object') {
			throw new Error('Malformed native capture reply')
		}
		const reply = value as { error?: unknown; uri?: unknown }
		if (typeof reply.error === 'string') {
			throw new Error(reply.error)
		}
		if (typeof reply.uri !== 'string' || !reply.uri) {
			throw new Error('Native capture did not return a result')
		}
		return reply.uri
	}
	return {
		capabilities: () => ({
			view: Boolean(engine()),
			screen: Boolean(engine() && policy.screen),
			formats: engine() ? ['png', 'jpg'] : [],
			scrollContent: false,
		}),
		validate(target) {
			validate(target)
		},
		capture,
		async captureScreen(options) {
			if (!policy.screen) {
				throw new UnavailabilityError('App-screen capture on this host; use captureRef')
			}
			return capture(policy.screen(), options)
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
					validate(target)
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
}
