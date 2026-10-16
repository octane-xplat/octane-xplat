import type { CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSData,
	NSDictionary,
	NSSecureCoding,
} from './Foundation'

import type { MTLDevice, MTLDrawable, MTLTexture } from './Metal'

import type { NSObjectProtocol } from './Runtime'

import type { SCNAnimation, SCNAnimationProtocol } from './SceneKit'

import type { interop } from './objc-runtime'

import { MTLPixelFormat } from './Metal'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const kCAMediaTimingFunctionEaseIn: string

export declare const kCAValueFunctionTranslateY: string

export declare const kCAValueFunctionTranslate: string

export declare const kCAValueFunctionScale: string

export declare const kCAValueFunctionRotateZ: string

export declare const kCAValueFunctionRotateX: string

export declare const kCATransactionDisableActions: string

export declare const kCATransactionAnimationDuration: string

export declare const kCAAlignmentCenter: string

export declare const kCAAlignmentRight: string

export declare const kCAAlignmentLeft: string

export declare const kCAAlignmentNatural: string

export declare const kCALineJoinRound: string

export declare const kCAFillRuleNonZero: string

export declare const kCAScrollHorizontally: string

export declare const kCARendererColorSpace: string

export declare const kCAGradientLayerRadial: string

export declare const kCAMediaTimingFunctionEaseInEaseOut: string

export declare const kCAMediaTimingFunctionEaseOut: string

export declare const kCAEmitterLayerBackToFront: string

export declare const kCAEmitterLayerOldestLast: string

export declare const kCAEmitterLayerOutline: string

export declare const kCAEmitterLayerCircle: string

export declare const kCAEmitterLayerCuboid: string

export declare const kCAEmitterLayerLine: string

export declare const kCATransitionFromTop: string

export declare const kCATransitionFromLeft: string

export declare const kCATransitionFromRight: string

export declare const kCATransitionMoveIn: string

export declare const kCATransitionFade: string

export declare const kCAAnimationCubicPaced: string

export declare const kCAScrollNone: string

export declare const kCACornerCurveCircular: string

export declare const kCAContentsFormatGray8Uint: string

export declare const kCAContentsFormatRGBA8Uint: string

export declare const kCAGravityResizeAspect: string

export declare const kCAGravityBottomRight: string

export declare const kCAGravityBottomLeft: string

export declare const kCAGravityRight: string

export declare const kCAGravityLeft: string

export declare const kCAGravityBottom: string

export declare const kCAGravityCenter: string

export declare const CATransform3DIdentity: CATransform3D

export declare const kCAFillModeRemoved: string

export declare const kCAFillModeBackwards: string

export declare const kCAEmitterLayerSphere: string

export declare const kCAGravityTop: string

export declare const kCAEmitterLayerAdditive: string

export declare const kCALineCapButt: string

export declare const kCATruncationStart: string

export declare const kCAEmitterLayerSurface: string

export declare const kCATransitionFromBottom: string

export declare const kCAValueFunctionTranslateX: string

export declare const kCAMediaTimingFunctionLinear: string

export declare const kCAGravityResize: string

export declare const kCAAnimationPaced: string

export declare const kCAMediaTimingFunctionDefault: string

export declare const kCAFillRuleEvenOdd: string

export declare const kCAGravityTopRight: string

export declare const kCALineCapSquare: string

export declare const kCAEmitterLayerRectangle: string

export declare const kCAScrollBoth: string

export declare const kCACornerCurveContinuous: string

export declare const kCATruncationNone: string

export declare const kCAAlignmentJustified: string

export declare const kCALineJoinMiter: string

export declare const kCAValueFunctionScaleZ: string

export declare const kCAValueFunctionScaleY: string

export declare const kCAEmitterLayerPoints: string

export declare const kCATransactionAnimationTimingFunction: string

export declare const kCATransition: string

export declare const kCALineCapRound: string

export declare const kCATransitionReveal: string

export declare const kCATransactionCompletionBlock: string

export declare const kCAScrollVertically: string

export declare const kCAEmitterLayerUnordered: string

export declare const kCALineJoinBevel: string

export declare const kCATruncationEnd: string

export declare const kCAGradientLayerConic: string

export declare const kCAAnimationDiscrete: string

export declare const kCAValueFunctionRotateY: string

export declare const kCAFilterLinear: string

export declare const kCATruncationMiddle: string

export declare const kCAFillModeForwards: string

export declare const kCAEmitterLayerVolume: string

export declare const kCAAnimationLinear: string

export declare const kCAGradientLayerAxial: string

export declare const kCAContentsFormatRGBA16Float: string

export declare const kCAFilterTrilinear: string

export declare const kCARendererMetalCommandQueue: string

export declare const kCAEmitterLayerPoint: string

export declare const kCAAnimationRotateAuto: string

export declare const kCAAnimationCubic: string

export declare const kCATransitionPush: string

export declare const kCAGravityTopLeft: string

export declare const kCAFilterNearest: string

export declare const kCAEmitterLayerOldestFirst: string

export declare const kCAValueFunctionScaleX: string

export declare const kCAOnOrderOut: string

export declare const kCAContentsFormatAutomatic: string

export declare const kCAFillModeBoth: string

export declare const kCAValueFunctionTranslateZ: string

export declare const kCAOnOrderIn: string

export declare const kCAGravityResizeAspectFill: string

export declare const kCAAnimationRotateAutoReverse: string

export declare const CAConstraintAttribute: {
	MinX: 0
	MidX: 1
	MaxX: 2
	Width: 3
	MinY: 4
	MidY: 5
	MaxY: 6
	Height: 7
}

export declare const CACornerMask: {
	MinXMin: 1
	MaxXMin: 2
	MinXMax: 4
	MaxXMax: 8
}

export declare const CAAutoresizingMask: {
	NotSizable: 0
	MinXMargin: 1
	WidthSizable: 2
	MaxXMargin: 4
	MinYMargin: 8
	HeightSizable: 16
	MaxYMargin: 32
}

export declare const CAEdgeAntialiasingMask: {
	Left: 1
	Right: 2
	Bottom: 4
	Top: 8
}

export declare class CATransform3D {
	constructor(init?: CATransform3D)
	m11: number
	m12: number
	m13: number
	m14: number
	m21: number
	m22: number
	m23: number
	m24: number
	m31: number
	m32: number
	m33: number
	m34: number
	m41: number
	m42: number
	m43: number
	m44: number
}

export declare function CACurrentMediaTime(): number

export declare function CATransform3DIsIdentity(t: CATransform3D): boolean

export declare function CATransform3DEqualToTransform(a: CATransform3D, b: CATransform3D): boolean

export declare function CATransform3DMakeTranslation(
	tx: number,
	ty: number,
	tz: number,
): CATransform3D

export declare function CATransform3DMakeScale(sx: number, sy: number, sz: number): CATransform3D

export declare function CATransform3DMakeRotation(
	angle: number,
	x: number,
	y: number,
	z: number,
): CATransform3D

export declare function CATransform3DTranslate(
	t: CATransform3D,
	tx: number,
	ty: number,
	tz: number,
): CATransform3D

export declare function CATransform3DScale(
	t: CATransform3D,
	sx: number,
	sy: number,
	sz: number,
): CATransform3D

export declare function CATransform3DRotate(
	t: CATransform3D,
	angle: number,
	x: number,
	y: number,
	z: number,
): CATransform3D

export declare function CATransform3DConcat(a: CATransform3D, b: CATransform3D): CATransform3D

export declare function CATransform3DInvert(t: CATransform3D): CATransform3D

export declare function CATransform3DMakeAffineTransform(m: CGAffineTransform): CATransform3D

export declare function CATransform3DIsAffine(t: CATransform3D): boolean

export declare function CATransform3DGetAffineTransform(t: CATransform3D): CGAffineTransform

export declare interface CAMetalDrawable extends MTLDrawable {
	readonly texture: MTLTexture

	readonly layer: CAMetalLayer
}

export declare class CAMetalDrawable extends NativeObject implements CAMetalDrawable {}

export declare interface CAAnimationDelegate extends NSObjectProtocol {
	animationDidStart?(anim: CAAnimation): void

	animationDidStopFinished?(anim: CAAnimation, flag: boolean): void
}

export declare class CAAnimationDelegate extends NativeObject implements CAAnimationDelegate {}

export declare interface CALayerDelegate extends NSObjectProtocol {
	displayLayer?(layer: CALayer): void

	drawLayerInContext?(layer: CALayer, ctx: interop.Object): void

	layerWillDraw?(layer: CALayer): void

	layoutSublayersOfLayer?(layer: CALayer): void

	actionForLayerForKey?(layer: CALayer, event: string): CAAction
}

export declare class CALayerDelegate extends NativeObject implements CALayerDelegate {}

export declare interface CAAction {
	runActionForKeyObjectArguments(
		event: string,
		anObject: interop.Object,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void
}

export declare class CAAction extends NativeObject implements CAAction {}

export declare interface CALayoutManager extends NSObjectProtocol {
	preferredSizeOfLayer?(layer: CALayer): CGSize

	invalidateLayoutOfLayer?(layer: CALayer): void

	layoutSublayersOfLayer?(layer: CALayer): void
}

export declare class CALayoutManager extends NativeObject implements CALayoutManager {}

export declare interface CAMediaTiming {
	beginTime: number

	duration: number

	speed: number

	timeOffset: number

	repeatCount: number

	repeatDuration: number

	autoreverses: boolean

	fillMode: string
}

export declare class CAMediaTiming extends NativeObject implements CAMediaTiming {}

export declare class CAReplicatorLayer extends CALayer {
	instanceCount: number

	preservesDepth: boolean

	instanceDelay: number

	instanceTransform: CATransform3D

	instanceColor: interop.Object

	instanceRedOffset: number

	instanceGreenOffset: number

	instanceBlueOffset: number

	instanceAlphaOffset: number
}

export declare class CARemoteLayerClient extends NSObject {
	initWithServerPort(port: number): this

	invalidate(): void

	readonly clientId: number

	layer: CALayer
}

export declare class CAKeyframeAnimation extends CAPropertyAnimation {
	get values(): NSArray
	set values(value: NSArray<interop.Object> | Array<interop.Object>)

	path: interop.Object

	get keyTimes(): NSArray
	set keyTimes(value: NSArray<interop.Object> | Array<interop.Object>)

	get timingFunctions(): NSArray
	set timingFunctions(value: NSArray<interop.Object> | Array<interop.Object>)

	calculationMode: string

	get tensionValues(): NSArray
	set tensionValues(value: NSArray<interop.Object> | Array<interop.Object>)

	get continuityValues(): NSArray
	set continuityValues(value: NSArray<interop.Object> | Array<interop.Object>)

	get biasValues(): NSArray
	set biasValues(value: NSArray<interop.Object> | Array<interop.Object>)

	rotationMode: string
}

export declare class CATransformLayer extends CALayer {}

export declare class CATiledLayer extends CALayer {
	static fadeDuration(): number

	levelsOfDetail: number

	levelsOfDetailBias: number

	tileSize: CGSize
}

export declare class CAShapeLayer extends CALayer {
	path: interop.Object

	fillColor: interop.Object

	fillRule: string

	strokeColor: interop.Object

	strokeStart: number

	strokeEnd: number

	lineWidth: number

	miterLimit: number

	lineCap: string

	lineJoin: string

	lineDashPhase: number

	get lineDashPattern(): NSArray
	set lineDashPattern(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class CARenderer extends NSObject {
	static rendererWithCGLContextOptions(
		ctx: interop.PointerConvertible,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): CARenderer

	static rendererWithMTLTextureOptions(
		tex: MTLTexture,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): CARenderer

	layer: CALayer

	bounds: CGRect

	beginFrameAtTimeTimeStamp(t: number, ts: interop.PointerConvertible): void

	updateBounds(): CGRect

	addUpdateRect(r: CGRect): void

	render(): void

	nextFrameTime(): number

	endFrame(): void

	setDestination(tex: MTLTexture): void
}

export declare class CAGradientLayer extends CALayer {
	get colors(): NSArray
	set colors(value: NSArray<interop.Object> | Array<interop.Object>)

	get locations(): NSArray
	set locations(value: NSArray<interop.Object> | Array<interop.Object>)

	startPoint: CGPoint

	endPoint: CGPoint

	type: string
}

export declare class CAMetalLayer extends CALayer {
	device: MTLDevice

	readonly preferredDevice: MTLDevice

	pixelFormat: interop.Enum<typeof MTLPixelFormat>

	framebufferOnly: boolean

	drawableSize: CGSize

	nextDrawable(): CAMetalDrawable

	maximumDrawableCount: number

	presentsWithTransaction: boolean

	colorspace: interop.Object

	wantsExtendedDynamicRangeContent: boolean

	EDRMetadata: CAEDRMetadata

	displaySyncEnabled: boolean

	allowsNextDrawableTimeout: boolean
}

export declare class CATransition extends CAAnimation {
	type: string

	subtype: string

	startProgress: number

	endProgress: number

	filter: interop.Object
}

export declare class CABasicAnimation extends CAPropertyAnimation {
	fromValue: interop.Object

	toValue: interop.Object

	byValue: interop.Object
}

export declare class CAScrollLayer extends CALayer {
	scrollToPoint(p: CGPoint): void

	scrollToRect(r: CGRect): void

	scrollMode: string
}

export declare class CAConstraint extends NSObject implements NSSecureCoding {
	static constraintWithAttributeRelativeToAttributeScaleOffset<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		attr: interop.Enum<typeof CAConstraintAttribute>,
		srcId: string,
		srcAttr: interop.Enum<typeof CAConstraintAttribute>,
		m: number,
		c: number,
	): InstanceType<This>

	static constraintWithAttributeRelativeToAttributeOffset<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		attr: interop.Enum<typeof CAConstraintAttribute>,
		srcId: string,
		srcAttr: interop.Enum<typeof CAConstraintAttribute>,
		c: number,
	): InstanceType<This>

	static constraintWithAttributeRelativeToAttribute<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		attr: interop.Enum<typeof CAConstraintAttribute>,
		srcId: string,
		srcAttr: interop.Enum<typeof CAConstraintAttribute>,
	): InstanceType<This>

	initWithAttributeRelativeToAttributeScaleOffset(
		attr: interop.Enum<typeof CAConstraintAttribute>,
		srcId: string,
		srcAttr: interop.Enum<typeof CAConstraintAttribute>,
		m: number,
		c: number,
	): this

	readonly attribute: interop.Enum<typeof CAConstraintAttribute>

	readonly sourceName: string

	readonly sourceAttribute: interop.Enum<typeof CAConstraintAttribute>

	readonly scale: number

	readonly offset: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CAMediaTimingFunction extends NSObject implements NSSecureCoding {
	static functionWithName<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
	): InstanceType<This>

	static functionWithControlPoints<This extends abstract new (...args: any) => any>(
		this: This,
		c1x: number,
		c1y: number,
		c2x: number,
		c2y: number,
	): InstanceType<This>

	initWithControlPoints(c1x: number, c1y: number, c2x: number, c2y: number): this

	getControlPointAtIndexValues(idx: number, ptr: interop.PointerConvertible): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CAPropertyAnimation extends CAAnimation {
	static animationWithKeyPath<This extends abstract new (...args: any) => any>(
		this: This,
		path: string | null,
	): InstanceType<This>

	keyPath: string

	additive: boolean

	cumulative: boolean

	valueFunction: CAValueFunction

	isAdditive(): boolean

	isCumulative(): boolean
}

export declare class CAOpenGLLayer extends CALayer {
	asynchronous: boolean

	canDrawInCGLContextPixelFormatForLayerTimeDisplayTime(
		ctx: interop.PointerConvertible,
		pf: interop.PointerConvertible,
		t: number,
		ts: interop.PointerConvertible,
	): boolean

	drawInCGLContextPixelFormatForLayerTimeDisplayTime(
		ctx: interop.PointerConvertible,
		pf: interop.PointerConvertible,
		t: number,
		ts: interop.PointerConvertible,
	): void

	copyCGLPixelFormatForDisplayMask(mask: number): interop.Pointer

	releaseCGLPixelFormat(pf: interop.PointerConvertible): void

	copyCGLContextForPixelFormat(pf: interop.PointerConvertible): interop.Pointer

	releaseCGLContext(ctx: interop.PointerConvertible): void

	colorspace: interop.Object

	wantsExtendedDynamicRangeContent: boolean

	isAsynchronous(): boolean
}

export declare class CALayer extends NSObject implements NSSecureCoding, CAMediaTiming {
	static layer<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	init(): this

	initWithLayer(layer: interop.Object): this

	presentationLayer(): this

	modelLayer(): this

	static defaultValueForKey(key: string): interop.Object

	static needsDisplayForKey(key: string): boolean

	shouldArchiveValueForKey(key: string): boolean

	bounds: CGRect

	position: CGPoint

	zPosition: number

	anchorPoint: CGPoint

	anchorPointZ: number

	transform: CATransform3D

	affineTransform(): CGAffineTransform

	setAffineTransform(m: CGAffineTransform): void

	frame: CGRect

	hidden: boolean

	doubleSided: boolean

	geometryFlipped: boolean

	contentsAreFlipped(): boolean

	readonly superlayer: CALayer

	removeFromSuperlayer(): void

	get sublayers(): NSArray
	set sublayers(value: NSArray<interop.Object> | Array<interop.Object>)

	addSublayer(layer: CALayer): void

	insertSublayerAtIndex(layer: CALayer, idx: number): void

	insertSublayerBelow(layer: CALayer, sibling: CALayer | null): void

	insertSublayerAbove(layer: CALayer, sibling: CALayer | null): void

	replaceSublayerWith(oldLayer: CALayer, newLayer: CALayer): void

	sublayerTransform: CATransform3D

	mask: CALayer

	masksToBounds: boolean

	convertPointFromLayer(p: CGPoint, l: CALayer | null): CGPoint

	convertPointToLayer(p: CGPoint, l: CALayer | null): CGPoint

	convertRectFromLayer(r: CGRect, l: CALayer | null): CGRect

	convertRectToLayer(r: CGRect, l: CALayer | null): CGRect

	convertTimeFromLayer(t: number, l: CALayer | null): number

	convertTimeToLayer(t: number, l: CALayer | null): number

	hitTest(p: CGPoint): CALayer

	containsPoint(p: CGPoint): boolean

	contents: interop.Object

	contentsRect: CGRect

	contentsGravity: string

	contentsScale: number

	contentsCenter: CGRect

	contentsFormat: string

	minificationFilter: string

	magnificationFilter: string

	minificationFilterBias: number

	opaque: boolean

	display(): void

	setNeedsDisplay(): void

	setNeedsDisplayInRect(r: CGRect): void

	needsDisplay(): boolean

	displayIfNeeded(): void

	needsDisplayOnBoundsChange: boolean

	drawsAsynchronously: boolean

	drawInContext(ctx: interop.Object): void

	renderInContext(ctx: interop.Object): void

	edgeAntialiasingMask: interop.Enum<typeof CAEdgeAntialiasingMask>

	allowsEdgeAntialiasing: boolean

	backgroundColor: interop.Object

	cornerRadius: number

	maskedCorners: interop.Enum<typeof CACornerMask>

	cornerCurve: string

	static cornerCurveExpansionFactor(curve: string): number

	borderWidth: number

	borderColor: interop.Object

	opacity: number

	allowsGroupOpacity: boolean

	compositingFilter: interop.Object

	get filters(): NSArray
	set filters(value: NSArray<interop.Object> | Array<interop.Object>)

	get backgroundFilters(): NSArray
	set backgroundFilters(value: NSArray<interop.Object> | Array<interop.Object>)

	shouldRasterize: boolean

	rasterizationScale: number

	shadowColor: interop.Object

	shadowOpacity: number

	shadowOffset: CGSize

	shadowRadius: number

	shadowPath: interop.Object

	autoresizingMask: interop.Enum<typeof CAAutoresizingMask>

	layoutManager: CALayoutManager

	preferredFrameSize(): CGSize

	setNeedsLayout(): void

	needsLayout(): boolean

	layoutIfNeeded(): void

	layoutSublayers(): void

	resizeSublayersWithOldSize(size: CGSize): void

	resizeWithOldSuperlayerSize(size: CGSize): void

	static defaultActionForKey(event: string): CAAction

	actionForKey(event: string): CAAction

	get actions(): NSDictionary
	set actions(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	addAnimationForKey(anim: CAAnimation, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	animationKeys(): NSArray

	animationForKey(key: string): CAAnimation

	name: string

	delegate: CALayerDelegate

	get style(): NSDictionary
	set style(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	isHidden(): boolean

	isDoubleSided(): boolean

	isGeometryFlipped(): boolean

	isOpaque(): boolean

	get constraints(): NSArray
	set constraints(value: NSArray<interop.Object> | Array<interop.Object>)

	addConstraint(c: CAConstraint): void

	static layerWithRemoteClientId(client_id: number): CALayer

	scrollPoint(p: CGPoint): void

	scrollRectToVisible(r: CGRect): void

	readonly visibleRect: CGRect

	createRemoteLayerBoundTo(serverPort: number): NSObject

	hostRemoteLayer(layerID: number): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	beginTime: number

	duration: number

	speed: number

	timeOffset: number

	repeatCount: number

	repeatDuration: number

	autoreverses: boolean

	fillMode: string
}

export declare class CAEmitterLayer extends CALayer {
	get emitterCells(): NSArray
	set emitterCells(value: NSArray<interop.Object> | Array<interop.Object>)

	birthRate: number

	lifetime: number

	emitterPosition: CGPoint

	emitterZPosition: number

	emitterSize: CGSize

	emitterDepth: number

	emitterShape: string

	emitterMode: string

	renderMode: string

	preservesDepth: boolean

	velocity: number

	scale: number

	spin: number

	seed: number
}

export declare class CATransaction extends NSObject {
	static begin(): void

	static commit(): void

	static flush(): void

	static lock(): void

	static unlock(): void

	static animationDuration(): number

	static setAnimationDuration(dur: number): void

	static animationTimingFunction(): CAMediaTimingFunction

	static setAnimationTimingFunction(function$: CAMediaTimingFunction | null): void

	static disableActions(): boolean

	static setDisableActions(flag: boolean): void

	static completionBlock(): () => void

	static setCompletionBlock(block: () => void | null): void

	static valueForKey(key: string): interop.Object

	static setValueForKey(anObject: interop.Object | null, key: string): void
}

export declare class CARemoteLayerServer extends NSObject {
	static sharedServer(): CARemoteLayerServer

	readonly serverPort: number
}

export declare class CASpringAnimation extends CABasicAnimation {
	mass: number

	stiffness: number

	damping: number

	initialVelocity: number

	readonly settlingDuration: number
}

export declare class CATextLayer extends CALayer {
	string: interop.Object

	font: interop.Object

	fontSize: number

	foregroundColor: interop.Object

	wrapped: boolean

	truncationMode: string

	alignmentMode: string

	allowsFontSubpixelQuantization: boolean

	isWrapped(): boolean
}

export declare class CAEDRMetadata extends NSObject implements NSCopying, NSSecureCoding {
	static HDR10MetadataWithDisplayInfoContentInfoOpticalOutputScale(
		displayData: NSData | null,
		contentData: NSData | null,
		scale: number,
	): CAEDRMetadata

	static HDR10MetadataWithMinLuminanceMaxLuminanceOpticalOutputScale(
		minNits: number,
		maxNits: number,
		scale: number,
	): CAEDRMetadata

	static readonly HLGMetadata: CAEDRMetadata

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CAValueFunction extends NSObject implements NSSecureCoding {
	static functionWithName<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
	): InstanceType<This>

	readonly name: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CAEmitterCell extends NSObject implements NSSecureCoding, CAMediaTiming {
	static emitterCell<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static defaultValueForKey(key: string): interop.Object

	shouldArchiveValueForKey(key: string): boolean

	name: string

	enabled: boolean

	birthRate: number

	lifetime: number

	lifetimeRange: number

	emissionLatitude: number

	emissionLongitude: number

	emissionRange: number

	velocity: number

	velocityRange: number

	xAcceleration: number

	yAcceleration: number

	zAcceleration: number

	scale: number

	scaleRange: number

	scaleSpeed: number

	spin: number

	spinRange: number

	color: interop.Object

	redRange: number

	greenRange: number

	blueRange: number

	alphaRange: number

	redSpeed: number

	greenSpeed: number

	blueSpeed: number

	alphaSpeed: number

	contents: interop.Object

	contentsRect: CGRect

	contentsScale: number

	minificationFilter: string

	magnificationFilter: string

	minificationFilterBias: number

	get emitterCells(): NSArray
	set emitterCells(value: NSArray<interop.Object> | Array<interop.Object>)

	get style(): NSDictionary
	set style(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	isEnabled(): boolean

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	beginTime: number

	duration: number

	speed: number

	timeOffset: number

	repeatCount: number

	repeatDuration: number

	autoreverses: boolean

	fillMode: string
}

export declare class CAAnimation
	extends NSObject
	implements NSSecureCoding, NSCopying, CAMediaTiming, CAAction, SCNAnimationProtocol
{
	static animation<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static defaultValueForKey(key: string): interop.Object

	shouldArchiveValueForKey(key: string): boolean

	timingFunction: CAMediaTimingFunction

	delegate: CAAnimationDelegate

	removedOnCompletion: boolean

	isRemovedOnCompletion(): boolean

	static animationWithSCNAnimation(animation: SCNAnimation): CAAnimation

	usesSceneTimeBase: boolean

	fadeInDuration: number

	fadeOutDuration: number

	get animationEvents(): NSArray
	set animationEvents(value: NSArray<interop.Object> | Array<interop.Object>)

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	beginTime: number

	duration: number

	speed: number

	timeOffset: number

	repeatCount: number

	repeatDuration: number

	autoreverses: boolean

	fillMode: string

	runActionForKeyObjectArguments(
		event: string,
		anObject: interop.Object,
		dict:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class CAConstraintLayoutManager extends NSObject implements CALayoutManager {
	static layoutManager<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	preferredSizeOfLayer(layer: CALayer): CGSize

	invalidateLayoutOfLayer(layer: CALayer): void

	layoutSublayersOfLayer(layer: CALayer): void

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class CAAnimationGroup extends CAAnimation {
	get animations(): NSArray
	set animations(value: NSArray<interop.Object> | Array<interop.Object>)
}
