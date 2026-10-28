// Stylesheet engine shared by the AppKit and GTK renderers — each renderer
// supplies its own node adapter. Keep this module and its imports
// platform-free (no AppKit, no GI).
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
	stylesheetsHaveMediaRules,
	refreshMediaQueries,
	onStylesheetsChanged,
	setStyleEnvironment,
	type CssEnvironment,
} from './stylesheets.ts'

export { sampleKeyframeAnimation, type SampledValues } from './animations.ts'
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
