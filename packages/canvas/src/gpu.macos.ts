/** AppKit has no Canvas WebGPU backend. Returns null before device acquisition.
 *  Typed `any` to match the other platforms' getGPU signature. */
export function getGPU(): any {
	return null
}
