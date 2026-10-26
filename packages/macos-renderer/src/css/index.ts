// Stylesheet engine subpath — the GTK renderer consumes this cascade over
// its own node adapter; keep this module and its imports AppKit-free.
export {
	computeCascade,
	INHERITED_CSS_PROPERTIES,
	type CascadeOptions,
	type CssHostNode,
	type ComputedCascade,
	type PropBag,
} from './cascade.ts'
export {
	registerStylesheet,
	unregisterStylesheet,
	stylesheetScope,
	stylesheetKeyframes,
	stylesheetPseudoClasses,
	refreshMediaQueries,
	onStylesheetsChanged,
	setStyleEnvironment,
	type CssEnvironment,
} from './stylesheets.ts'
export {
	sampleKeyframeAnimation,
	type SampledValues,
} from './animations.ts'
export {
	keyframeAnimationsFromCSSDeclarations,
	keyframesArrayFromCSS,
	parseKeyframeDeclarations,
	evaluateCurve,
	type KeyframeAnimationInfo,
	type KeyframeDecl,
	type ParsedKeyframe,
	type TimingCurve,
} from './keyframes.ts'
export {
	transformConverter,
	transformToParts,
	composeTransform,
	resolveTranslate,
	isPercentTranslate,
	IDENTITY_TRANSFORM,
	type TransformParts,
	type TranslateAxis,
} from './transforms.ts'
export { resolveClipPath, type ClipPath } from './clip-path.ts'
