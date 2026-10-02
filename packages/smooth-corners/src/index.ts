// Platform barrel — extensionless specifier resolves the per-OS leaf
// (.ios.tsrx/.android.tsrx under native, .macos.tsrx under macos,
// .web.tsrx under web); same convention as @octane-xplat/ui index.shared.
export { SmoothCorners } from './SmoothCorners';
export type {
	CornerConfig,
	CornerCurve,
	CornerOptions,
	PerCornerConfig,
	SmoothBorderConfig,
	SmoothCornersProps,
	SmoothShadowConfig,
} from './props';
