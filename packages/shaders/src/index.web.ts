// Web entry — same exports as index.ts and index.macos.ts.
export * from './types'
export {
	createShader,
	createSharedDevice,
	getWebGPUSupport,
	isWebGPUSupported,
	prefersReducedMotion,
} from './host.web'
