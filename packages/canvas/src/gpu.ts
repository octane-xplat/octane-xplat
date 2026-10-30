import { GPU } from '@nativescript/canvas'

/** getGPU — returns the plugin's GPU shim (wgpu over Metal/Vulkan). Same
 *  spec-shaped surface as web's `navigator.gpu`: `requestAdapter()` +
 *  `getPreferredCanvasFormat()`. Typed `any` deliberately — the shim and the
 *  real navigator.gpu differ structurally beyond that shared surface. */
export function getGPU(): any {
	return new GPU()
}
