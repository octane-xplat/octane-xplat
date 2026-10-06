// Native entry (iOS/Android via @nativescript/canvas) — same exports as
// index.web.ts and index.macos.ts.
export * from './types'
export {
	createShader,
	createSharedDevice,
	getWebGPUSupport,
	isWebGPUSupported,
	prefersReducedMotion,
} from './host'
