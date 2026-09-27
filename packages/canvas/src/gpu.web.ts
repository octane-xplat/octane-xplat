/** getGPU — returns the WebGPU entry point (`navigator.gpu`) or null when
 *  WebGPU is unavailable (insecure context, unsupported browser). The
 *  returned object is spec-shaped: `requestAdapter()` +
 *  `getPreferredCanvasFormat()`. */
export function getGPU(): any {
	return (globalThis.navigator as any)?.gpu ?? null;
}
