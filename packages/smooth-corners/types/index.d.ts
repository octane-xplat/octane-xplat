// Boundary types for @octane-xplat/smooth-corners — the mechanical wrapper
// over props.ts (tsrx-tsc can't emit .tsrx declarations; see
// ui/types/index.d.ts for the same pattern).
import type { UniversalComponent } from 'octane/universal'
import type { SmoothCornersProps } from './props.js'

export declare const SmoothCorners: UniversalComponent<SmoothCornersProps>

export type {
	CornerConfig,
	CornerCurve,
	CornerOptions,
	PerCornerConfig,
	SmoothBorderConfig,
	SmoothCornersProps,
	SmoothShadowConfig,
} from './props.js'
