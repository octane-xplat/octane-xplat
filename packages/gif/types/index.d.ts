// Boundary types for @octane-xplat/gif — the mechanical wrapper over
// props.ts (tsrx-tsc can't emit .tsrx declarations; see ui/types/index.d.ts
// for the same pattern).
import type { UniversalComponent } from 'octane/universal'
import type { AnimatedImageProps } from './props'

export declare const AnimatedImage: UniversalComponent<AnimatedImageProps>
export type { AnimatedImageProps }
