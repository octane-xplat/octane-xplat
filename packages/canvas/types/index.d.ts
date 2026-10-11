// Boundary types for @octane-xplat/canvas — the mechanical wrapper over
// props.ts (tsrx-tsc can't emit .tsrx declarations; see ui/types/index.d.ts
// for the same pattern).
import type { UniversalComponent } from 'octane/universal'
import type { CanvasProps } from './props.js'

export declare const Canvas: UniversalComponent<CanvasProps>

/** Returns the WebGPU entry point — `navigator.gpu` on web, the plugin's
 *  GPU shim on iOS/Android — or null where WebGPU is unavailable.
 *  Native AppKit always returns null. */
export declare function getGPU(): any

export type { CanvasProps, CanvasContextKind, CanvasReady } from './props.js'
