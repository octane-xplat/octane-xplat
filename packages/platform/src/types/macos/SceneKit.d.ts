import type { AVAudioEngine, AVAudioEnvironmentNode, AVAudioNode } from './AVFAudio'

import type {
	NSBezierPath,
	NSColor,
	NSFont,
	NSImage,
	NSOpenGLContext,
	NSOpenGLPixelFormat,
} from './AppKit'

import type { CGPoint, CGRect, CGSize } from './CoreFoundation'

import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSData,
	NSDictionary,
	NSError,
	NSSecureCoding,
	NSURL,
	_NSRange,
} from './Foundation'

import type { _GLKMatrix4 } from './GLKit'

import type { GKEntity, GKSceneRootNodeType } from './GameplayKit'

import type { JSContext } from './JavaScriptCore'

import type {
	MTLBuffer,
	MTLCommandBuffer,
	MTLCommandQueue,
	MTLDevice,
	MTLLibrary,
	MTLRenderCommandEncoder,
	MTLRenderPassDescriptor,
} from './Metal'

import type {
	MDLAsset,
	MDLCamera,
	MDLLight,
	MDLMaterial,
	MDLMesh,
	MDLObject,
	MDLSubmesh,
} from './ModelIO'

import type { CAAnimation, CAMediaTimingFunction, CATransform3D } from './QuartzCore'

import type { NSObjectProtocol, simd_float4x4, simd_quatf } from './Runtime'

import type { SKScene, SKTransition } from './SpriteKit'

import type { interop } from './objc-runtime'

import { NSView } from './AppKit'

import { MTLPixelFormat, MTLTessellationPartitionMode, MTLVertexFormat } from './Metal'

import { CAOpenGLLayer } from './QuartzCore'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const SCNPhysicsTestSearchModeKey: string

export declare const SCNSceneSourceConvertToYUpKey: string

export declare const SCNHitTestBackFaceCullingKey: string

export declare const SCNSceneSourceAssetAuthorKey: string

export declare const SCNModelTransform: string

export declare const SCNLightTypeArea: string

export declare const SCNLightShadowFarClippingKey: string

export declare const SCNLightShadowNearClippingKey: string

export declare const SCNLightAttenuationFalloffExponentKey: string

export declare const SCNLightAttenuationStartKey: string

export declare const SCNPhysicsTestSearchModeAny: string

export declare const SCNPhysicsTestBackfaceCullingKey: string

export declare const SCNPhysicsShapeOptionCollisionMargin: string

export declare const SCNPhysicsShapeScaleKey: string

export declare const SCNPhysicsShapeKeepAsCompoundKey: string

export declare const SCNParticlePropertyCharge: string

export declare const SCNParticlePropertyLife: string

export declare const SCNParticlePropertyPosition: string

export declare const SCNGeometrySourceSemanticBoneIndices: string

export declare const SCNGeometrySourceSemanticBoneWeights: string

export declare const SCNLightingModelShadowOnly: string

export declare const SCNLightingModelConstant: string

export declare const SCNLightTypeProbe: string

export declare const SCNLightTypeSpot: string

export declare const SCNLightTypeAmbient: string

export declare const SCNModelViewProjectionTransform: string

export declare const SCNModelViewTransform: string

export declare const SCNViewTransform: string

export declare const SCNSceneUpAxisAttributeKey: string

export declare const SCNSceneFrameRateAttributeKey: string

export declare const SCNSceneExportDestinationURL: string

export declare const SCNConsistencyMissingAttributeError: number

export declare const SCNConsistencyInvalidCountError: number

export declare const SCNConsistencyElementTypeErrorKey: string

export declare const SCNConsistencyElementIDErrorKey: string

export declare const SCNSceneSourceAnimationImportPolicyPlayUsingSceneTimeBase: string

export declare const SCNSceneSourceAnimationImportPolicyPlayRepeatedly: string

export declare const SCNSceneSourceAnimationImportPolicyKey: string

export declare const SCNSceneSourceConvertUnitsToMetersKey: string

export declare const SCNSceneSourceStrictConformanceKey: string

export declare const SCNSceneSourceCreateNormalsIfAbsentKey: string

export declare const SCNSceneSourceAssetUnitMeterKey: string

export declare const SCNSceneSourceAssetUnitNameKey: string

export declare const SCNSceneSourceAssetUnitKey: string

export declare const SCNSceneSourceAssetContributorsKey: string

export declare const SCNShaderModifierEntryPointGeometry: string

export declare const SCNHitTestSortResultsKey: string

export declare const SCNHitTestFirstFoundOnlyKey: string

export declare const SCNHitTestOptionIgnoreLightArea: string

export declare const SCNHitTestOptionSearchMode: string

export declare const SCNHitTestOptionCategoryBitMask: string

export declare const SCNHitTestIgnoreHiddenNodesKey: string

export declare const SCNHitTestRootNodeKey: string

export declare const SCNHitTestIgnoreChildNodesKey: string

export declare const SCNHitTestClipToZRangeKey: string

export declare const SCNErrorDomain: string

export declare const SCNMatrix4Identity: CATransform3D

export declare const SCNSceneSourceAnimationImportPolicyDoNotPlay: string

export declare const SCNSceneEndTimeAttributeKey: string

export declare const SCNSceneSourceAssetUpAxisKey: string

export declare const SCNDetailedErrorsKey: string

export declare const SCNPreferredDeviceKey: string

export declare const SCNShaderModifierEntryPointLightingModel: string

export declare const SCNPhysicsTestSearchModeAll: string

export declare const SCNParticlePropertyContactPoint: string

export declare const SCNProgramMappingChannelKey: string

export declare const SCNPhysicsShapeTypeConvexHull: string

export declare const SCNPreferLowPowerDeviceKey: string

export declare const SCNSceneSourceLoadingOptionPreserveOriginalTopology: string

export declare const SCNLightTypeDirectional: string

export declare const SCNGeometrySourceSemanticTexcoord: string

export declare const SCNParticlePropertyAngle: string

export declare const SCNGeometrySourceSemanticVertex: string

export declare const SCNLightAttenuationEndKey: string

export declare const SCNSceneSourceAssetDirectoryURLsKey: string

export declare const SCNConsistencyMissingElementError: number

export declare const SCNLightingModelLambert: string

export declare const SCNGeometrySourceSemanticNormal: string

export declare const SCNShaderModifierEntryPointSurface: string

export declare const SCNProjectionTransform: string

export declare const SCNSceneSourceAnimationImportPolicyPlay: string

export declare const SCNGeometrySourceSemanticTangent: string

export declare const SCNNormalTransform: string

export declare const SCNHitTestBoundingBoxOnlyKey: string

export declare const SCNLightSpotInnerAngleKey: string

export declare const SCNConsistencyInvalidArgumentError: number

export declare const SCNParticlePropertyVelocity: string

export declare const SCNSceneSourceAssetAuthoringToolKey: string

export declare const SCNParticlePropertyContactNormal: string

export declare const SCNParticlePropertyOpacity: string

export declare const SCNProgramCompilationError: number

export declare const SCNPhysicsTestCollisionBitMaskKey: string

export declare const SCNConsistencyInvalidURIError: number

export declare const SCNShaderModifierEntryPointFragment: string

export declare const SCNSceneSourceOverrideAssetURLsKey: string

export declare const SCNPhysicsShapeTypeBoundingBox: string

export declare const SCNVector4Zero: SCNVector4

export declare const SCNParticlePropertyRotationAxis: string

export declare const SCNLightingModelPhysicallyBased: string

export declare const SCNSceneSourceUseSafeModeKey: string

export declare const SCNPhysicsShapeTypeConcavePolyhedron: string

export declare const SCNSceneSourceCheckConsistencyKey: string

export declare const SCNParticlePropertyColor: string

export declare const SCNLightTypeIES: string

export declare const SCNParticlePropertySize: string

export declare const SCNParticlePropertyFriction: string

export declare const SCNGeometrySourceSemanticEdgeCrease: string

export declare const SCNLightingModelBlinn: string

export declare const SCNGeometrySourceSemanticVertexCrease: string

export declare const SCNLightTypeOmni: string

export declare const SCNConsistencyLineNumberErrorKey: string

export declare const SCNParticlePropertyFrame: string

export declare const SCNParticlePropertyFrameRate: string

export declare const SCNLightSpotOuterAngleKey: string

export declare const SCNSceneSourceAssetCreatedDateKey: string

export declare const SCNPhysicsTestSearchModeClosest: string

export declare const SCNVector3Zero: SCNVector3

export declare const SCNPhysicsShapeTypeKey: string

export declare const SCNSceneStartTimeAttributeKey: string

export declare const SCNConsistencyXMLSchemaValidationError: number

export declare const SCNLightingModelPhong: string

export declare const SCNParticlePropertyAngularVelocity: string

export declare const SCNParticlePropertyBounce: string

export declare const SCNGeometrySourceSemanticColor: string

export declare const SCNSceneSourceAssetModifiedDateKey: string

export declare const SCNPreferredRenderingAPIKey: string

export declare const SCNSceneSourceFlattenSceneKey: string

export declare const SCNParticleEvent: {
	Birth: 0
	Death: 1
	Collision: 2
}

export declare const SCNFillMode: {
	Fill: 0
	Lines: 1
}

export declare const SCNCullMode: {
	Back: 0
	Front: 1
}

export declare const SCNDebugOptions: {
	None: 0
	ShowPhysicsShapes: 1
	ShowBoundingBoxes: 2
	ShowLightInfluences: 4
	ShowLightExtents: 8
	ShowPhysicsFields: 16
	ShowWireframe: 32
	RenderAsWireframe: 64
	ShowSkeletons: 128
	ShowCreases: 256
	ShowConstraints: 512
	ShowCameras: 1024
}

export declare const SCNBufferFrequency: {
	Frame: 0
	Node: 1
	Shadable: 2
}

export declare const SCNInteractionMode: {
	Fly: 0
	OrbitTurntable: 1
	OrbitAngleMapping: 2
	OrbitCenteredArcball: 3
	OrbitArcball: 4
	Pan: 5
	Truck: 6
}

export declare const SCNReferenceLoadingPolicy: {
	Immediate: 0
	OnDemand: 1
}

export declare const SCNParticleBirthDirection: {
	Constant: 0
	SurfaceNormal: 1
	Random: 2
}

export declare const SCNParticleBlendMode: {
	Additive: 0
	Subtract: 1
	Multiply: 2
	Screen: 3
	Alpha: 4
	Replace: 5
}

export declare const SCNParticleSortingMode: {
	None: 0
	ProjectedDepth: 1
	Distance: 2
	OldestFirst: 3
	YoungestFirst: 4
}

export declare const SCNBillboardAxis: {
	X: 1
	Y: 2
	Z: 4
	All: 7
}

export declare const SCNGeometryPrimitiveType: {
	Triangles: 0
	TriangleStrip: 1
	Line: 2
	Point: 3
	Polygon: 4
}

export declare const SCNTransparencyMode: {
	AOne: 0
	RGBZero: 1
	SingleLayer: 2
	DualLayer: 3
	Default: 0
}

export declare const SCNLightAreaType: {
	Rectangle: 1
	Polygon: 4
}

export declare const SCNLightProbeUpdateType: {
	Never: 0
	Realtime: 1
}

export declare const SCNMovabilityHint: {
	Fixed: 0
	Movable: 1
}

export declare const SCNSceneSourceStatus: {
	Error: -1
	Parsing: 4
	Validating: 8
	Processing: 12
	Complete: 16
}

export declare const SCNRenderingAPI: {
	Metal: 0
	OpenGLLegacy: 1
	OpenGLCore32: 2
	OpenGLCore41: 3
}

export declare const SCNAntialiasingMode: {
	None: 0
	Multisampling2X: 1
	Multisampling4X: 2
	Multisampling8X: 3
	Multisampling16X: 4
}

export declare const SCNHitTestSearchMode: {
	Closest: 0
	All: 1
	Any: 2
}

export declare const SCNColorMask: {
	None: 0
	Red: 8
	Green: 4
	Blue: 2
	Alpha: 1
	All: 15
}

export declare const SCNCameraProjectionDirection: {
	Vertical: 0
	Horizontal: 1
}

export declare const SCNBlendMode: {
	Alpha: 0
	Add: 1
	Subtract: 2
	Multiply: 3
	Screen: 4
	Replace: 5
	Max: 6
}

export declare const SCNNodeFocusBehavior: {
	None: 0
	Occluding: 1
	Focusable: 2
}

export declare const SCNParticleInputMode: {
	Life: 0
	Distance: 1
	OtherProperty: 2
}

export declare const SCNPhysicsFieldScope: {
	Inside: 0
	Outside: 1
}

export declare const SCNParticleModifierStage: {
	PreDynamics: 0
	PostDynamics: 1
	PreCollision: 2
	PostCollision: 3
}

export declare const SCNLightProbeType: {
	Irradiance: 0
	Radiance: 1
}

export declare const SCNFilterMode: {
	None: 0
	Nearest: 1
	Linear: 2
}

export declare const SCNParticleOrientationMode: {
	BillboardScreenAligned: 0
	BillboardViewAligned: 1
	Free: 2
	BillboardYAligned: 3
}

export declare const SCNActionTimingMode: {
	Linear: 0
	EaseIn: 1
	EaseOut: 2
	EaseInEaseOut: 3
}

export declare const SCNPhysicsCollisionCategory: {
	Default: 1
	Static: 2
	All: -1
}

export declare const SCNShadowMode: {
	Forward: 0
	Deferred: 1
	Modulated: 2
}

export declare const SCNWrapMode: {
	Clamp: 1
	Repeat: 2
	ClampToBorder: 3
	Mirror: 4
}

export declare const SCNParticleBirthLocation: {
	Surface: 0
	Volume: 1
	Vertex: 2
}

export declare const SCNMorpherCalculationMode: {
	Normalized: 0
	Additive: 1
}

export declare const SCNPhysicsBodyType: {
	Static: 0
	Dynamic: 1
	Kinematic: 2
}

export declare const SCNTessellationSmoothingMode: {
	None: 0
	PNTriangles: 1
	Phong: 2
}

export declare const SCNParticleImageSequenceAnimationMode: {
	Repeat: 0
	Clamp: 1
	AutoReverse: 2
}

export declare const SCNChamferMode: {
	Both: 0
	Front: 1
	Back: 2
}

export declare class SCNVector3 {
	constructor(init?: SCNVector3)
	x: number
	y: number
	z: number
}

export declare class SCNVector4 {
	constructor(init?: SCNVector4)
	x: number
	y: number
	z: number
	w: number
}

export declare function SCNVector3EqualToVector3(a: SCNVector3, b: SCNVector3): boolean

export declare function SCNVector4EqualToVector4(a: SCNVector4, b: SCNVector4): boolean

export declare function SCNMatrix4IsIdentity(m: CATransform3D): boolean

export declare function SCNMatrix4EqualToMatrix4(a: CATransform3D, b: CATransform3D): boolean

export declare function SCNMatrix4MakeRotation(
	angle: number,
	x: number,
	y: number,
	z: number,
): CATransform3D

export declare function SCNMatrix4Scale(
	m: CATransform3D,
	sx: number,
	sy: number,
	sz: number,
): CATransform3D

export declare function SCNMatrix4Rotate(
	m: CATransform3D,
	angle: number,
	x: number,
	y: number,
	z: number,
): CATransform3D

export declare function SCNMatrix4Invert(m: CATransform3D): CATransform3D

export declare function SCNMatrix4Mult(a: CATransform3D, b: CATransform3D): CATransform3D

export declare function SCNMatrix4ToGLKMatrix4(mat: CATransform3D): _GLKMatrix4

export declare function SCNMatrix4FromGLKMatrix4(mat: _GLKMatrix4): CATransform3D

export declare function SCNExportJavaScriptModule(context: JSContext): void

export declare interface SCNAnimationProtocol extends NSObjectProtocol {}

export declare class SCNAnimationProtocol extends NativeObject implements SCNAnimationProtocol {}

export declare interface SCNBoundingVolume extends NSObjectProtocol {
	getBoundingBoxMinMax(min: interop.PointerConvertible, max: interop.PointerConvertible): boolean

	setBoundingBoxMinMax(min: interop.PointerConvertible, max: interop.PointerConvertible): void

	getBoundingSphereCenterRadius(
		center: interop.PointerConvertible,
		radius: interop.PointerConvertible,
	): boolean
}

export declare class SCNBoundingVolume extends NativeObject implements SCNBoundingVolume {}

export declare interface SCNCameraControllerDelegate extends NSObjectProtocol {
	cameraInertiaWillStartForController?(cameraController: SCNCameraController): void

	cameraInertiaDidEndForController?(cameraController: SCNCameraController): void
}

export declare class SCNCameraControllerDelegate
	extends NativeObject
	implements SCNCameraControllerDelegate {}

export declare interface SCNCameraControlConfiguration extends NSObjectProtocol {
	autoSwitchToFreeCamera: boolean

	allowsTranslation: boolean

	flyModeVelocity: number

	panSensitivity: number

	truckSensitivity: number

	rotationSensitivity: number
}

export declare class SCNCameraControlConfiguration
	extends NativeObject
	implements SCNCameraControlConfiguration {}

export declare interface SCNProgramDelegate extends NSObjectProtocol {
	programBindValueForSymbolAtLocationProgramIDRenderer?(
		program: SCNProgram,
		symbol: string,
		location: number,
		programID: number,
		renderer: SCNRenderer,
	): boolean

	programUnbindValueForSymbolAtLocationProgramIDRenderer?(
		program: SCNProgram,
		symbol: string,
		location: number,
		programID: number,
		renderer: SCNRenderer,
	): void

	programHandleError?(program: SCNProgram, error: NSError): void

	programIsOpaque?(program: SCNProgram): boolean
}

export declare class SCNProgramDelegate extends NativeObject implements SCNProgramDelegate {}

export declare interface SCNTechniqueSupport extends NSObjectProtocol {
	technique: SCNTechnique
}

export declare class SCNTechniqueSupport extends NativeObject implements SCNTechniqueSupport {}

export declare interface SCNShadable extends NSObjectProtocol {
	program?: SCNProgram

	handleBindingOfSymbolUsingBlock?(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	handleUnbindingOfSymbolUsingBlock?(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	get shaderModifiers(): NSDictionary | undefined
	set shaderModifiers(
		value:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| undefined,
	)
}

export declare class SCNShadable extends NativeObject implements SCNShadable {}

export declare interface SCNBufferStream extends NSObjectProtocol {
	writeBytesLength(bytes: interop.PointerConvertible, length: number): void
}

export declare class SCNBufferStream extends NativeObject implements SCNBufferStream {}

export declare interface SCNSceneRenderer extends NSObjectProtocol {
	scene: SCNScene

	presentSceneWithTransitionIncomingPointOfViewCompletionHandler(
		scene: SCNScene,
		transition: SKTransition,
		pointOfView: SCNNode | null,
		completionHandler: () => void | null,
	): void

	sceneTime: number

	delegate: SCNSceneRendererDelegate

	hitTestOptions(
		point: CGPoint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	isNodeInsideFrustumWithPointOfView(node: SCNNode, pointOfView: SCNNode): boolean

	nodesInsideFrustumWithPointOfView(pointOfView: SCNNode): NSArray

	projectPoint(point: SCNVector3): SCNVector3

	unprojectPoint(point: SCNVector3): SCNVector3

	playing: boolean

	loops: boolean

	pointOfView: SCNNode

	autoenablesDefaultLighting: boolean

	jitteringEnabled: boolean

	temporalAntialiasingEnabled: boolean

	prepareObjectShouldAbortBlock(object: interop.Object, block: () => boolean | null): boolean

	prepareObjectsWithCompletionHandler(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: boolean) => void | null,
	): void

	showsStatistics: boolean

	debugOptions: interop.Enum<typeof SCNDebugOptions>

	overlaySKScene: SKScene

	readonly renderingAPI: interop.Enum<typeof SCNRenderingAPI>

	readonly context: interop.Pointer

	readonly currentRenderCommandEncoder: MTLRenderCommandEncoder

	readonly currentRenderPassDescriptor: MTLRenderPassDescriptor

	readonly device: MTLDevice

	readonly colorPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly depthPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly stencilPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly commandQueue: MTLCommandQueue

	readonly audioEngine: AVAudioEngine

	readonly audioEnvironmentNode: AVAudioEnvironmentNode

	audioListener: SCNNode

	readonly currentViewport: CGRect

	currentTime: number

	usesReverseZ: boolean

	isPlaying(): boolean

	isJitteringEnabled(): boolean

	isTemporalAntialiasingEnabled(): boolean
}

export declare class SCNSceneRenderer extends NativeObject implements SCNSceneRenderer {}

export declare interface SCNPhysicsContactDelegate extends NSObjectProtocol {
	physicsWorldDidBeginContact?(world: SCNPhysicsWorld, contact: SCNPhysicsContact): void

	physicsWorldDidUpdateContact?(world: SCNPhysicsWorld, contact: SCNPhysicsContact): void

	physicsWorldDidEndContact?(world: SCNPhysicsWorld, contact: SCNPhysicsContact): void
}

export declare class SCNPhysicsContactDelegate
	extends NativeObject
	implements SCNPhysicsContactDelegate {}

export declare interface SCNSceneExportDelegate extends NSObjectProtocol {
	writeImageWithSceneDocumentURLOriginalImageURL?(
		image: NSImage,
		documentURL: NSURL,
		originalImageURL: NSURL | null,
	): NSURL
}

export declare class SCNSceneExportDelegate
	extends NativeObject
	implements SCNSceneExportDelegate {}

export declare interface SCNActionable extends NSObjectProtocol {
	runAction(action: SCNAction): void

	runActionCompletionHandler(action: SCNAction, block: () => void | null): void

	runActionForKey(action: SCNAction, key: string | null): void

	runActionForKeyCompletionHandler(
		action: SCNAction,
		key: string | null,
		block: () => void | null,
	): void

	readonly hasActions: boolean

	actionForKey(key: string): SCNAction

	removeActionForKey(key: string): void

	removeAllActions(): void

	readonly actionKeys: NSArray
}

export declare class SCNActionable extends NativeObject implements SCNActionable {}

export declare interface SCNAvoidOccluderConstraintDelegate extends NSObjectProtocol {
	avoidOccluderConstraintShouldAvoidOccluderForNode?(
		constraint: SCNAvoidOccluderConstraint,
		occluder: SCNNode,
		node: SCNNode,
	): boolean

	avoidOccluderConstraintDidAvoidOccluderForNode?(
		constraint: SCNAvoidOccluderConstraint,
		occluder: SCNNode,
		node: SCNNode,
	): void
}

export declare class SCNAvoidOccluderConstraintDelegate
	extends NativeObject
	implements SCNAvoidOccluderConstraintDelegate {}

export declare interface SCNSceneRendererDelegate extends NSObjectProtocol {
	rendererUpdateAtTime?(renderer: SCNSceneRenderer, time: number): void

	rendererDidApplyAnimationsAtTime?(renderer: SCNSceneRenderer, time: number): void

	rendererDidSimulatePhysicsAtTime?(renderer: SCNSceneRenderer, time: number): void

	rendererDidApplyConstraintsAtTime?(renderer: SCNSceneRenderer, time: number): void

	rendererWillRenderSceneAtTime?(renderer: SCNSceneRenderer, scene: SCNScene, time: number): void

	rendererDidRenderSceneAtTime?(renderer: SCNSceneRenderer, scene: SCNScene, time: number): void
}

export declare class SCNSceneRendererDelegate
	extends NativeObject
	implements SCNSceneRendererDelegate {}

export declare interface SCNNodeRendererDelegate extends NSObjectProtocol {
	renderNodeRendererArguments?(
		node: SCNNode,
		renderer: SCNRenderer,
		arguments$:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void
}

export declare class SCNNodeRendererDelegate
	extends NativeObject
	implements SCNNodeRendererDelegate {}

export declare interface SCNAnimatable extends NSObjectProtocol {
	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean
}

export declare class SCNAnimatable extends NativeObject implements SCNAnimatable {}

export declare class SCNMaterial
	extends NSObject
	implements SCNAnimatable, SCNShadable, NSCopying, NSSecureCoding
{
	static material<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	name: string

	readonly diffuse: SCNMaterialProperty

	readonly ambient: SCNMaterialProperty

	readonly specular: SCNMaterialProperty

	readonly emission: SCNMaterialProperty

	readonly transparent: SCNMaterialProperty

	readonly reflective: SCNMaterialProperty

	readonly multiply: SCNMaterialProperty

	readonly normal: SCNMaterialProperty

	readonly displacement: SCNMaterialProperty

	readonly ambientOcclusion: SCNMaterialProperty

	readonly selfIllumination: SCNMaterialProperty

	readonly metalness: SCNMaterialProperty

	readonly roughness: SCNMaterialProperty

	readonly clearCoat: SCNMaterialProperty

	readonly clearCoatRoughness: SCNMaterialProperty

	readonly clearCoatNormal: SCNMaterialProperty

	shininess: number

	transparency: number

	lightingModelName: string

	litPerPixel: boolean

	doubleSided: boolean

	fillMode: interop.Enum<typeof SCNFillMode>

	cullMode: interop.Enum<typeof SCNCullMode>

	transparencyMode: interop.Enum<typeof SCNTransparencyMode>

	locksAmbientWithDiffuse: boolean

	writesToDepthBuffer: boolean

	colorBufferWriteMask: interop.Enum<typeof SCNColorMask>

	readsFromDepthBuffer: boolean

	fresnelExponent: number

	blendMode: interop.Enum<typeof SCNBlendMode>

	isLitPerPixel(): boolean

	isDoubleSided(): boolean

	static materialWithMDLMaterial<This extends abstract new (...args: any) => any>(
		this: This,
		mdlMaterial: MDLMaterial,
	): InstanceType<This>

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	program: SCNProgram

	handleBindingOfSymbolUsingBlock(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	handleUnbindingOfSymbolUsingBlock(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	get shaderModifiers(): NSDictionary
	set shaderModifiers(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNPhysicsField extends NSObject implements NSCopying, NSSecureCoding {
	strength: number

	falloffExponent: number

	minimumDistance: number

	active: boolean

	exclusive: boolean

	halfExtent: SCNVector3

	usesEllipsoidalExtent: boolean

	scope: interop.Enum<typeof SCNPhysicsFieldScope>

	offset: SCNVector3

	direction: SCNVector3

	categoryBitMask: number

	static dragField(): SCNPhysicsField

	static vortexField(): SCNPhysicsField

	static radialGravityField(): SCNPhysicsField

	static linearGravityField(): SCNPhysicsField

	static noiseFieldWithSmoothnessAnimationSpeed(smoothness: number, speed: number): SCNPhysicsField

	static turbulenceFieldWithSmoothnessAnimationSpeed(
		smoothness: number,
		speed: number,
	): SCNPhysicsField

	static springField(): SCNPhysicsField

	static electricField(): SCNPhysicsField

	static magneticField(): SCNPhysicsField

	static customFieldWithEvaluationBlock(
		block: (p1: SCNVector3, p2: SCNVector3, p3: number, p4: number, p5: number) => SCNVector3,
	): SCNPhysicsField

	isActive(): boolean

	isExclusive(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNCone extends SCNGeometry {
	static coneWithTopRadiusBottomRadiusHeight<This extends abstract new (...args: any) => any>(
		this: This,
		topRadius: number,
		bottomRadius: number,
		height: number,
	): InstanceType<This>

	topRadius: number

	bottomRadius: number

	height: number

	radialSegmentCount: number

	heightSegmentCount: number
}

export declare class SCNPhysicsBehavior extends NSObject implements NSSecureCoding {
	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNCameraController extends NSObject {
	delegate: SCNCameraControllerDelegate

	pointOfView: SCNNode

	interactionMode: interop.Enum<typeof SCNInteractionMode>

	target: SCNVector3

	automaticTarget: boolean

	worldUp: SCNVector3

	inertiaEnabled: boolean

	inertiaFriction: number

	readonly inertiaRunning: boolean

	minimumVerticalAngle: number

	maximumVerticalAngle: number

	minimumHorizontalAngle: number

	maximumHorizontalAngle: number

	translateInCameraSpaceByXYZ(deltaX: number, deltaY: number, deltaZ: number): void

	frameNodes(nodes: NSArray<interop.Object> | Array<interop.Object>): void

	rotateByXY(deltaX: number, deltaY: number): void

	rollByAroundScreenPointViewport(delta: number, point: CGPoint, viewport: CGSize): void

	dollyByOnScreenPointViewport(delta: number, point: CGPoint, viewport: CGSize): void

	rollAroundTarget(delta: number): void

	dollyToTarget(delta: number): void

	clearRoll(): void

	stopInertia(): void

	beginInteractionWithViewport(location: CGPoint, viewport: CGSize): void

	continueInteractionWithViewportSensitivity(
		location: CGPoint,
		viewport: CGSize,
		sensitivity: number,
	): void

	endInteractionWithViewportVelocity(location: CGPoint, viewport: CGSize, velocity: CGPoint): void

	isInertiaRunning(): boolean
}

export declare class SCNAudioPlayer extends NSObject {
	initWithSource(source: SCNAudioSource): this

	initWithAVAudioNode(audioNode: AVAudioNode): this

	static audioPlayerWithSource<This extends abstract new (...args: any) => any>(
		this: This,
		source: SCNAudioSource,
	): InstanceType<This>

	static audioPlayerWithAVAudioNode<This extends abstract new (...args: any) => any>(
		this: This,
		audioNode: AVAudioNode,
	): InstanceType<This>

	willStartPlayback: () => void

	didFinishPlayback: () => void

	readonly audioNode: AVAudioNode

	readonly audioSource: SCNAudioSource
}

export declare class SCNReferenceNode extends SCNNode {
	initWithURL(referenceURL: NSURL): this

	initWithCoder(coder: NSCoder): this
	initWithCoder(aDecoder: NSCoder): this

	static referenceNodeWithURL<This extends abstract new (...args: any) => any>(
		this: This,
		referenceURL: NSURL,
	): InstanceType<This>

	referenceURL: NSURL

	loadingPolicy: interop.Enum<typeof SCNReferenceLoadingPolicy>

	load(): void

	unload(): void

	readonly loaded: boolean

	isLoaded(): boolean
}

export declare class SCNPhysicsVehicle extends SCNPhysicsBehavior {
	static vehicleWithChassisBodyWheels<This extends abstract new (...args: any) => any>(
		this: This,
		chassisBody: SCNPhysicsBody,
		wheels: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	readonly speedInKilometersPerHour: number

	readonly wheels: NSArray

	readonly chassisBody: SCNPhysicsBody

	applyEngineForceForWheelAtIndex(value: number, index: number): void

	setSteeringAngleForWheelAtIndex(value: number, index: number): void

	applyBrakingForceForWheelAtIndex(value: number, index: number): void
}

export declare class SCNPhysicsBallSocketJoint extends SCNPhysicsBehavior {
	static jointWithBodyAAnchorABodyBAnchorB<This extends abstract new (...args: any) => any>(
		this: This,
		bodyA: SCNPhysicsBody,
		anchorA: SCNVector3,
		bodyB: SCNPhysicsBody,
		anchorB: SCNVector3,
	): InstanceType<This>

	static jointWithBodyAnchor<This extends abstract new (...args: any) => any>(
		this: This,
		body: SCNPhysicsBody,
		anchor: SCNVector3,
	): InstanceType<This>

	readonly bodyA: SCNPhysicsBody

	anchorA: SCNVector3

	readonly bodyB: SCNPhysicsBody

	anchorB: SCNVector3
}

export declare class SCNPhysicsHingeJoint extends SCNPhysicsBehavior {
	static jointWithBodyAAxisAAnchorABodyBAxisBAnchorB<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		bodyA: SCNPhysicsBody,
		axisA: SCNVector3,
		anchorA: SCNVector3,
		bodyB: SCNPhysicsBody,
		axisB: SCNVector3,
		anchorB: SCNVector3,
	): InstanceType<This>

	static jointWithBodyAxisAnchor<This extends abstract new (...args: any) => any>(
		this: This,
		body: SCNPhysicsBody,
		axis: SCNVector3,
		anchor: SCNVector3,
	): InstanceType<This>

	readonly bodyA: SCNPhysicsBody

	axisA: SCNVector3

	anchorA: SCNVector3

	readonly bodyB: SCNPhysicsBody

	axisB: SCNVector3

	anchorB: SCNVector3
}

export declare class SCNPhysicsWorld extends NSObject implements NSSecureCoding {
	gravity: SCNVector3

	speed: number

	timeStep: number

	contactDelegate: SCNPhysicsContactDelegate

	addBehavior(behavior: SCNPhysicsBehavior): void

	removeBehavior(behavior: SCNPhysicsBehavior): void

	removeAllBehaviors(): void

	readonly allBehaviors: NSArray

	rayTestWithSegmentFromPointToPointOptions(
		origin: SCNVector3,
		dest: SCNVector3,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	contactTestBetweenBodyAndBodyOptions(
		bodyA: SCNPhysicsBody,
		bodyB: SCNPhysicsBody,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	contactTestWithBodyOptions(
		body: SCNPhysicsBody,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	convexSweepTestWithShapeFromTransformToTransformOptions(
		shape: SCNPhysicsShape,
		from: CATransform3D,
		to: CATransform3D,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	updateCollisionPairs(): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNPhysicsShape extends NSObject implements NSCopying, NSSecureCoding {
	static shapeWithGeometryOptions<This extends abstract new (...args: any) => any>(
		this: This,
		geometry: SCNGeometry,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	static shapeWithNodeOptions<This extends abstract new (...args: any) => any>(
		this: This,
		node: SCNNode,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	static shapeWithShapesTransforms<This extends abstract new (...args: any) => any>(
		this: This,
		shapes: NSArray<interop.Object> | Array<interop.Object>,
		transforms: NSArray<interop.Object> | Array<interop.Object> | null,
	): InstanceType<This>

	readonly options: NSDictionary

	readonly sourceObject: interop.Object

	readonly transforms: NSArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNParticleSystem
	extends NSObject
	implements NSCopying, NSSecureCoding, SCNAnimatable
{
	static particleSystem<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static particleSystemNamedInDirectory<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
		directory: string | null,
	): InstanceType<This>

	emissionDuration: number

	emissionDurationVariation: number

	idleDuration: number

	idleDurationVariation: number

	loops: boolean

	birthRate: number

	birthRateVariation: number

	warmupDuration: number

	emitterShape: SCNGeometry

	birthLocation: interop.Enum<typeof SCNParticleBirthLocation>

	birthDirection: interop.Enum<typeof SCNParticleBirthDirection>

	spreadingAngle: number

	emittingDirection: SCNVector3

	orientationDirection: SCNVector3

	acceleration: SCNVector3

	local: boolean

	particleAngle: number

	particleAngleVariation: number

	particleVelocity: number

	particleVelocityVariation: number

	particleAngularVelocity: number

	particleAngularVelocityVariation: number

	particleLifeSpan: number

	particleLifeSpanVariation: number

	systemSpawnedOnDying: SCNParticleSystem

	systemSpawnedOnCollision: SCNParticleSystem

	systemSpawnedOnLiving: SCNParticleSystem

	particleImage: interop.Object

	imageSequenceColumnCount: number

	imageSequenceRowCount: number

	imageSequenceInitialFrame: number

	imageSequenceInitialFrameVariation: number

	imageSequenceFrameRate: number

	imageSequenceFrameRateVariation: number

	imageSequenceAnimationMode: interop.Enum<typeof SCNParticleImageSequenceAnimationMode>

	particleColor: NSColor

	particleColorVariation: SCNVector4

	particleSize: number

	particleSizeVariation: number

	particleIntensity: number

	particleIntensityVariation: number

	blendMode: interop.Enum<typeof SCNParticleBlendMode>

	blackPassEnabled: boolean

	orientationMode: interop.Enum<typeof SCNParticleOrientationMode>

	sortingMode: interop.Enum<typeof SCNParticleSortingMode>

	lightingEnabled: boolean

	affectedByGravity: boolean

	affectedByPhysicsFields: boolean

	particleDiesOnCollision: boolean

	get colliderNodes(): NSArray
	set colliderNodes(value: NSArray<interop.Object> | Array<interop.Object>)

	particleMass: number

	particleMassVariation: number

	particleBounce: number

	particleBounceVariation: number

	particleFriction: number

	particleFrictionVariation: number

	particleCharge: number

	particleChargeVariation: number

	dampingFactor: number

	speedFactor: number

	stretchFactor: number

	fresnelExponent: number

	get propertyControllers(): NSDictionary
	set propertyControllers(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	reset(): void

	handleEventForPropertiesWithBlock(
		event: interop.Enum<typeof SCNParticleEvent>,
		properties: NSArray<interop.Object> | Array<interop.Object>,
		block: (
			p1: interop.PointerConvertible,
			p2: interop.PointerConvertible,
			p3: interop.PointerConvertible,
			p4: number,
		) => void,
	): void

	addModifierForPropertiesAtStageWithBlock(
		properties: NSArray<interop.Object> | Array<interop.Object>,
		stage: interop.Enum<typeof SCNParticleModifierStage>,
		block: (
			p1: interop.PointerConvertible,
			p2: interop.PointerConvertible,
			p3: number,
			p4: number,
			p5: number,
		) => void,
	): void

	removeModifiersOfStage(stage: interop.Enum<typeof SCNParticleModifierStage>): void

	removeAllModifiers(): void

	isLocal(): boolean

	isBlackPassEnabled(): boolean

	isLightingEnabled(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

export declare class SCNParticlePropertyController
	extends NSObject
	implements NSSecureCoding, NSCopying
{
	static controllerWithAnimation<This extends abstract new (...args: any) => any>(
		this: This,
		animation: CAAnimation,
	): InstanceType<This>

	animation: CAAnimation

	inputMode: interop.Enum<typeof SCNParticleInputMode>

	inputScale: number

	inputBias: number

	inputOrigin: SCNNode

	inputProperty: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class SCNLevelOfDetail extends NSObject implements NSCopying, NSSecureCoding {
	static levelOfDetailWithGeometryScreenSpaceRadius<
		This extends abstract new (...args: any) => any,
	>(this: This, geometry: SCNGeometry | null, radius: number): InstanceType<This>

	static levelOfDetailWithGeometryWorldSpaceDistance<
		This extends abstract new (...args: any) => any,
	>(this: This, geometry: SCNGeometry | null, distance: number): InstanceType<This>

	readonly geometry: SCNGeometry

	readonly screenSpaceRadius: number

	readonly worldSpaceDistance: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNConstraint
	extends NSObject
	implements NSCopying, NSSecureCoding, SCNAnimatable
{
	enabled: boolean

	influenceFactor: number

	incremental: boolean

	isEnabled(): boolean

	isIncremental(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

export declare class SCNSkinner extends NSObject implements NSSecureCoding {
	skeleton: SCNNode

	static skinnerWithBaseGeometryBonesBoneInverseBindTransformsBoneWeightsBoneIndices<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		baseGeometry: SCNGeometry | null,
		bones: NSArray<interop.Object> | Array<interop.Object>,
		boneInverseBindTransforms: NSArray<interop.Object> | Array<interop.Object> | null,
		boneWeights: SCNGeometrySource,
		boneIndices: SCNGeometrySource,
	): InstanceType<This>

	baseGeometry: SCNGeometry

	baseGeometryBindTransform: CATransform3D

	readonly boneInverseBindTransforms: NSArray

	readonly bones: NSArray

	readonly boneWeights: SCNGeometrySource

	readonly boneIndices: SCNGeometrySource

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNShape extends SCNGeometry {
	static shapeWithPathExtrusionDepth<This extends abstract new (...args: any) => any>(
		this: This,
		path: NSBezierPath | null,
		extrusionDepth: number,
	): InstanceType<This>

	path: NSBezierPath

	extrusionDepth: number

	chamferMode: interop.Enum<typeof SCNChamferMode>

	chamferRadius: number

	chamferProfile: NSBezierPath
}

export declare class SCNText extends SCNGeometry {
	static textWithStringExtrusionDepth<This extends abstract new (...args: any) => any>(
		this: This,
		string: interop.Object | null,
		extrusionDepth: number,
	): InstanceType<This>

	extrusionDepth: number

	string: interop.Object

	font: NSFont

	wrapped: boolean

	containerFrame: CGRect

	readonly textSize: CGSize

	truncationMode: string

	alignmentMode: string

	chamferRadius: number

	chamferSegmentCount: number

	chamferProfile: NSBezierPath

	flatness: number

	isWrapped(): boolean
}

export declare class SCNTube extends SCNGeometry {
	static tubeWithInnerRadiusOuterRadiusHeight<This extends abstract new (...args: any) => any>(
		this: This,
		innerRadius: number,
		outerRadius: number,
		height: number,
	): InstanceType<This>

	innerRadius: number

	outerRadius: number

	height: number

	radialSegmentCount: number

	heightSegmentCount: number
}

export declare class SCNSphere extends SCNGeometry {
	static sphereWithRadius<This extends abstract new (...args: any) => any>(
		this: This,
		radius: number,
	): InstanceType<This>

	radius: number

	geodesic: boolean

	segmentCount: number

	isGeodesic(): boolean
}

export declare class SCNBox extends SCNGeometry {
	static boxWithWidthHeightLengthChamferRadius<This extends abstract new (...args: any) => any>(
		this: This,
		width: number,
		height: number,
		length: number,
		chamferRadius: number,
	): InstanceType<This>

	width: number

	height: number

	length: number

	chamferRadius: number

	widthSegmentCount: number

	heightSegmentCount: number

	lengthSegmentCount: number

	chamferSegmentCount: number
}

export declare class SCNPlane extends SCNGeometry {
	static planeWithWidthHeight<This extends abstract new (...args: any) => any>(
		this: This,
		width: number,
		height: number,
	): InstanceType<This>

	width: number

	height: number

	widthSegmentCount: number

	heightSegmentCount: number

	cornerRadius: number

	cornerSegmentCount: number
}

export declare class SCNPhysicsBody extends NSObject implements NSCopying, NSSecureCoding {
	static staticBody<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static dynamicBody<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static kinematicBody<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static bodyWithTypeShape<This extends abstract new (...args: any) => any>(
		this: This,
		type: interop.Enum<typeof SCNPhysicsBodyType>,
		shape: SCNPhysicsShape | null,
	): InstanceType<This>

	type: interop.Enum<typeof SCNPhysicsBodyType>

	mass: number

	momentOfInertia: SCNVector3

	usesDefaultMomentOfInertia: boolean

	charge: number

	friction: number

	restitution: number

	rollingFriction: number

	physicsShape: SCNPhysicsShape

	readonly isResting: boolean

	allowsResting: boolean

	velocity: SCNVector3

	angularVelocity: SCNVector4

	damping: number

	angularDamping: number

	velocityFactor: SCNVector3

	angularVelocityFactor: SCNVector3

	categoryBitMask: number

	collisionBitMask: number

	contactTestBitMask: number

	affectedByGravity: boolean

	applyForceImpulse(direction: SCNVector3, impulse: boolean): void

	applyForceAtPositionImpulse(direction: SCNVector3, position: SCNVector3, impulse: boolean): void

	applyTorqueImpulse(torque: SCNVector4, impulse: boolean): void

	clearAllForces(): void

	resetTransform(): void

	setResting(resting: boolean): void

	continuousCollisionDetectionThreshold: number

	centerOfMassOffset: SCNVector3

	linearRestingThreshold: number

	angularRestingThreshold: number

	isAffectedByGravity(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNGeometryElement extends NSObject implements NSSecureCoding {
	static geometryElementWithDataPrimitiveTypePrimitiveCountBytesPerIndex<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		data: NSData | null,
		primitiveType: interop.Enum<typeof SCNGeometryPrimitiveType>,
		primitiveCount: number,
		bytesPerIndex: number,
	): InstanceType<This>

	static geometryElementWithBufferPrimitiveTypePrimitiveCountBytesPerIndex<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		buffer: MTLBuffer,
		primitiveType: interop.Enum<typeof SCNGeometryPrimitiveType>,
		primitiveCount: number,
		bytesPerIndex: number,
	): InstanceType<This>

	readonly data: NSData

	readonly primitiveType: interop.Enum<typeof SCNGeometryPrimitiveType>

	readonly primitiveCount: number

	readonly bytesPerIndex: number

	primitiveRange: _NSRange

	pointSize: number

	minimumPointScreenSpaceRadius: number

	maximumPointScreenSpaceRadius: number

	static geometryElementWithMDLSubmesh<This extends abstract new (...args: any) => any>(
		this: This,
		mdlSubMesh: MDLSubmesh,
	): InstanceType<This>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNGeometrySource extends NSObject implements NSSecureCoding {
	static geometrySourceWithDataSemanticVectorCountFloatComponentsComponentsPerVectorBytesPerComponentDataOffsetDataStride<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		data: NSData,
		semantic: string,
		vectorCount: number,
		floatComponents: boolean,
		componentsPerVector: number,
		bytesPerComponent: number,
		offset: number,
		stride: number,
	): InstanceType<This>

	static geometrySourceWithVerticesCount<This extends abstract new (...args: any) => any>(
		this: This,
		vertices: interop.PointerConvertible,
		count: number,
	): InstanceType<This>

	static geometrySourceWithNormalsCount<This extends abstract new (...args: any) => any>(
		this: This,
		normals: interop.PointerConvertible,
		count: number,
	): InstanceType<This>

	static geometrySourceWithTextureCoordinatesCount<This extends abstract new (...args: any) => any>(
		this: This,
		texcoord: interop.PointerConvertible,
		count: number,
	): InstanceType<This>

	static geometrySourceWithBufferVertexFormatSemanticVertexCountDataOffsetDataStride<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		buffer: MTLBuffer,
		vertexFormat: interop.Enum<typeof MTLVertexFormat>,
		semantic: string,
		vertexCount: number,
		offset: number,
		stride: number,
	): InstanceType<This>

	readonly data: NSData

	readonly semantic: string

	readonly vectorCount: number

	readonly floatComponents: boolean

	readonly componentsPerVector: number

	readonly bytesPerComponent: number

	readonly dataOffset: number

	readonly dataStride: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNNode
	extends NSObject
	implements NSCopying, NSSecureCoding, SCNAnimatable, SCNActionable, SCNBoundingVolume
{
	static node<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static nodeWithGeometry(geometry: SCNGeometry | null): SCNNode

	clone(): this

	flattenedClone(): this

	name: string

	light: SCNLight

	camera: SCNCamera

	geometry: SCNGeometry

	skinner: SCNSkinner

	morpher: SCNMorpher

	transform: CATransform3D

	readonly worldTransform: CATransform3D

	position: SCNVector3

	worldPosition: SCNVector3

	rotation: SCNVector4

	orientation: SCNVector4

	worldOrientation: SCNVector4

	eulerAngles: SCNVector3

	scale: SCNVector3

	pivot: CATransform3D

	hidden: boolean

	opacity: number

	renderingOrder: number

	castsShadow: boolean

	movabilityHint: interop.Enum<typeof SCNMovabilityHint>

	readonly parentNode: SCNNode

	readonly childNodes: NSArray

	addChildNode(child: SCNNode): void

	insertChildNodeAtIndex(child: SCNNode, index: number): void

	removeFromParentNode(): void

	replaceChildNodeWith(oldChild: SCNNode, newChild: SCNNode): void

	childNodeWithNameRecursively(name: string, recursively: boolean): SCNNode

	childNodesPassingTest(
		predicate: (p1: SCNNode, p2: interop.PointerConvertible) => boolean,
	): NSArray

	enumerateChildNodesUsingBlock(block: (p1: SCNNode, p2: interop.PointerConvertible) => void): void

	enumerateHierarchyUsingBlock(block: (p1: SCNNode, p2: interop.PointerConvertible) => void): void

	convertPositionToNode(position: SCNVector3, node: SCNNode | null): SCNVector3

	convertPositionFromNode(position: SCNVector3, node: SCNNode | null): SCNVector3

	convertVectorToNode(vector: SCNVector3, node: SCNNode | null): SCNVector3

	convertVectorFromNode(vector: SCNVector3, node: SCNNode | null): SCNVector3

	convertTransformToNode(transform: CATransform3D, node: SCNNode | null): CATransform3D

	convertTransformFromNode(transform: CATransform3D, node: SCNNode | null): CATransform3D

	physicsBody: SCNPhysicsBody

	physicsField: SCNPhysicsField

	get constraints(): NSArray
	set constraints(value: NSArray<interop.Object> | Array<interop.Object>)

	get filters(): NSArray
	set filters(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly presentationNode: SCNNode

	paused: boolean

	rendererDelegate: SCNNodeRendererDelegate

	hitTestWithSegmentFromPointToPointOptions(
		pointA: SCNVector3,
		pointB: SCNVector3,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	categoryBitMask: number

	isHidden(): boolean

	isPaused(): boolean

	static readonly localUp: SCNVector3

	static readonly localRight: SCNVector3

	static readonly localFront: SCNVector3

	readonly worldUp: SCNVector3

	readonly worldRight: SCNVector3

	readonly worldFront: SCNVector3

	lookAt(worldTarget: SCNVector3): void

	lookAtUpLocalFront(worldTarget: SCNVector3, worldUp: SCNVector3, localFront: SCNVector3): void

	localTranslateBy(translation: SCNVector3): void

	localRotateBy(rotation: SCNVector4): void

	rotateByAroundTarget(worldRotation: SCNVector4, worldTarget: SCNVector3): void

	simdTransform: simd_float4x4

	simdPosition: unknown /* ext vector */

	simdRotation: unknown /* ext vector */

	simdOrientation: simd_quatf

	simdEulerAngles: unknown /* ext vector */

	simdScale: unknown /* ext vector */

	simdPivot: simd_float4x4

	simdWorldPosition: unknown /* ext vector */

	simdWorldOrientation: simd_quatf

	simdWorldTransform: simd_float4x4

	simdConvertPositionToNode(
		position: unknown /* ext vector */,
		node: SCNNode | null,
	): unknown /* ext vector */

	simdConvertPositionFromNode(
		position: unknown /* ext vector */,
		node: SCNNode | null,
	): unknown /* ext vector */

	simdConvertVectorToNode(
		vector: unknown /* ext vector */,
		node: SCNNode | null,
	): unknown /* ext vector */

	simdConvertVectorFromNode(
		vector: unknown /* ext vector */,
		node: SCNNode | null,
	): unknown /* ext vector */

	simdConvertTransformToNode(transform: simd_float4x4, node: SCNNode | null): simd_float4x4

	simdConvertTransformFromNode(transform: simd_float4x4, node: SCNNode | null): simd_float4x4

	static readonly simdLocalUp: unknown /* ext vector */

	static readonly simdLocalRight: unknown /* ext vector */

	static readonly simdLocalFront: unknown /* ext vector */

	readonly simdWorldUp: unknown /* ext vector */

	readonly simdWorldRight: unknown /* ext vector */

	readonly simdWorldFront: unknown /* ext vector */

	simdLookAt(worldTarget: unknown /* ext vector */): void

	simdLookAtUpLocalFront(
		worldTarget: unknown /* ext vector */,
		worldUp: unknown /* ext vector */,
		localFront: unknown /* ext vector */,
	): void

	simdLocalTranslateBy(translation: unknown /* ext vector */): void

	simdLocalRotateBy(rotation: simd_quatf): void

	simdRotateByAroundTarget(worldRotation: simd_quatf, worldTarget: unknown /* ext vector */): void

	focusBehavior: interop.Enum<typeof SCNNodeFocusBehavior>

	addParticleSystem(system: SCNParticleSystem): void

	removeAllParticleSystems(): void

	removeParticleSystem(system: SCNParticleSystem): void

	readonly particleSystems: NSArray

	addAudioPlayer(player: SCNAudioPlayer): void

	removeAllAudioPlayers(): void

	removeAudioPlayer(player: SCNAudioPlayer): void

	readonly audioPlayers: NSArray

	entity: GKEntity

	static nodeWithMDLObject<This extends abstract new (...args: any) => any>(
		this: This,
		mdlObject: MDLObject,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	runAction(action: SCNAction): void

	runActionCompletionHandler(action: SCNAction, block: () => void | null): void

	runActionForKey(action: SCNAction, key: string | null): void

	runActionForKeyCompletionHandler(
		action: SCNAction,
		key: string | null,
		block: () => void | null,
	): void

	readonly hasActions: boolean

	actionForKey(key: string): SCNAction

	removeActionForKey(key: string): void

	removeAllActions(): void

	readonly actionKeys: NSArray

	getBoundingBoxMinMax(min: interop.PointerConvertible, max: interop.PointerConvertible): boolean

	setBoundingBoxMinMax(min: interop.PointerConvertible, max: interop.PointerConvertible): void

	getBoundingSphereCenterRadius(
		center: interop.PointerConvertible,
		radius: interop.PointerConvertible,
	): boolean
}

export declare class SCNAction extends NSObject implements NSCopying, NSSecureCoding {
	duration: number

	timingMode: interop.Enum<typeof SCNActionTimingMode>

	timingFunction: (p1: number) => number

	speed: number

	reversedAction(): SCNAction

	static moveByXYZDuration(
		deltaX: number,
		deltaY: number,
		deltaZ: number,
		duration: number,
	): SCNAction

	static moveByDuration(delta: SCNVector3, duration: number): SCNAction

	static moveToDuration(location: SCNVector3, duration: number): SCNAction

	static rotateByXYZDuration(
		xAngle: number,
		yAngle: number,
		zAngle: number,
		duration: number,
	): SCNAction

	static rotateToXYZDuration(
		xAngle: number,
		yAngle: number,
		zAngle: number,
		duration: number,
	): SCNAction

	static rotateToXYZDurationShortestUnitArc(
		xAngle: number,
		yAngle: number,
		zAngle: number,
		duration: number,
		shortestUnitArc: boolean,
	): SCNAction

	static rotateByAngleAroundAxisDuration(
		angle: number,
		axis: SCNVector3,
		duration: number,
	): SCNAction

	static rotateToAxisAngleDuration(axisAngle: SCNVector4, duration: number): SCNAction

	static scaleByDuration(scale: number, sec: number): SCNAction

	static scaleToDuration(scale: number, sec: number): SCNAction

	static sequence(actions: NSArray<interop.Object> | Array<interop.Object>): SCNAction

	static group(actions: NSArray<interop.Object> | Array<interop.Object>): SCNAction

	static repeatActionCount(action: SCNAction, count: number): SCNAction

	static repeatActionForever(action: SCNAction): SCNAction

	static fadeInWithDuration(sec: number): SCNAction

	static fadeOutWithDuration(sec: number): SCNAction

	static fadeOpacityByDuration(factor: number, sec: number): SCNAction

	static fadeOpacityToDuration(opacity: number, sec: number): SCNAction

	static hide(): SCNAction

	static unhide(): SCNAction

	static waitForDuration(sec: number): SCNAction

	static waitForDurationWithRange(sec: number, durationRange: number): SCNAction

	static removeFromParentNode(): SCNAction

	static runBlock(block: (p1: SCNNode) => void): SCNAction

	static runBlockQueue(block: (p1: SCNNode) => void, queue: NSObject): SCNAction

	static javaScriptActionWithScriptDuration(script: string, seconds: number): SCNAction

	static customActionWithDurationActionBlock(
		seconds: number,
		block: (p1: SCNNode, p2: number) => void,
	): SCNAction

	static playAudioSourceWaitForCompletion(source: SCNAudioSource, wait: boolean): SCNAction

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNScene extends NSObject implements NSSecureCoding, GKSceneRootNodeType {
	static scene<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	readonly rootNode: SCNNode

	readonly physicsWorld: SCNPhysicsWorld

	attributeForKey(key: string): interop.Object

	setAttributeForKey(attribute: interop.Object | null, key: string): void

	readonly background: SCNMaterialProperty

	readonly lightingEnvironment: SCNMaterialProperty

	static sceneNamed<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
	): InstanceType<This>

	static sceneNamedInDirectoryOptions<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
		directory: string | null,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	static sceneWithURLOptionsError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	writeToURLOptionsDelegateProgressHandler(
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		delegate: SCNSceneExportDelegate | null,
		progressHandler: (p1: number, p2: NSError, p3: interop.PointerConvertible) => void | null,
	): boolean

	fogStartDistance: number

	fogEndDistance: number

	fogDensityExponent: number

	fogColor: interop.Object

	wantsScreenSpaceReflection: boolean

	screenSpaceReflectionSampleCount: number

	screenSpaceReflectionMaximumDistance: number

	screenSpaceReflectionStride: number

	paused: boolean

	isPaused(): boolean

	addParticleSystemWithTransform(system: SCNParticleSystem, transform: CATransform3D): void

	removeAllParticleSystems(): void

	removeParticleSystem(system: SCNParticleSystem): void

	readonly particleSystems: NSArray

	static sceneWithMDLAsset<This extends abstract new (...args: any) => any>(
		this: This,
		mdlAsset: MDLAsset,
	): InstanceType<This>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

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

export declare class SCNView extends NSView implements SCNSceneRenderer, SCNTechniqueSupport {
	initWithFrameOptions(
		frame: CGRect,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	scene: SCNScene

	rendersContinuously: boolean

	backgroundColor: NSColor

	allowsCameraControl: boolean

	readonly cameraControlConfiguration: SCNCameraControlConfiguration

	readonly defaultCameraController: SCNCameraController

	snapshot(): NSImage

	play(sender: interop.Object | null): void

	pause(sender: interop.Object | null): void

	stop(sender: interop.Object | null): void

	preferredFramesPerSecond: number

	drawableResizesAsynchronously: boolean

	openGLContext: NSOpenGLContext

	antialiasingMode: interop.Enum<typeof SCNAntialiasingMode>

	pixelFormat: NSOpenGLPixelFormat

	presentSceneWithTransitionIncomingPointOfViewCompletionHandler(
		scene: SCNScene,
		transition: SKTransition,
		pointOfView: SCNNode | null,
		completionHandler: () => void | null,
	): void

	sceneTime: number

	delegate: SCNSceneRendererDelegate

	hitTestOptions(
		point: CGPoint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	isNodeInsideFrustumWithPointOfView(node: SCNNode, pointOfView: SCNNode): boolean

	nodesInsideFrustumWithPointOfView(pointOfView: SCNNode): NSArray

	projectPoint(point: SCNVector3): SCNVector3

	unprojectPoint(point: SCNVector3): SCNVector3

	playing: boolean

	loops: boolean

	pointOfView: SCNNode

	autoenablesDefaultLighting: boolean

	jitteringEnabled: boolean

	temporalAntialiasingEnabled: boolean

	prepareObjectShouldAbortBlock(object: interop.Object, block: () => boolean | null): boolean

	prepareObjectsWithCompletionHandler(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: boolean) => void | null,
	): void

	showsStatistics: boolean

	debugOptions: interop.Enum<typeof SCNDebugOptions>

	overlaySKScene: SKScene

	readonly renderingAPI: interop.Enum<typeof SCNRenderingAPI>

	readonly context: interop.Pointer

	readonly currentRenderCommandEncoder: MTLRenderCommandEncoder

	readonly currentRenderPassDescriptor: MTLRenderPassDescriptor

	readonly device: MTLDevice

	readonly colorPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly depthPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly stencilPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly commandQueue: MTLCommandQueue

	readonly audioEngine: AVAudioEngine

	readonly audioEnvironmentNode: AVAudioEnvironmentNode

	audioListener: SCNNode

	readonly currentViewport: CGRect

	currentTime: number

	usesReverseZ: boolean

	isPlaying(): boolean

	isJitteringEnabled(): boolean

	isTemporalAntialiasingEnabled(): boolean

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

	technique: SCNTechnique
}

export declare class SCNAnimationPlayer
	extends NSObject
	implements SCNAnimatable, NSCopying, NSSecureCoding
{
	static animationPlayerWithAnimation(animation: SCNAnimation): SCNAnimationPlayer

	readonly animation: SCNAnimation

	speed: number

	blendFactor: number

	paused: boolean

	play(): void

	stop(): void

	stopWithBlendOutDuration(duration: number): void

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNAnimation
	extends NSObject
	implements SCNAnimationProtocol, NSCopying, NSSecureCoding
{
	static animationWithContentsOfURL(animationUrl: NSURL): SCNAnimation

	static animationNamed(animationName: string): SCNAnimation

	static animationWithCAAnimation(caAnimation: CAAnimation): SCNAnimation

	duration: number

	keyPath: string

	timingFunction: SCNTimingFunction

	blendInDuration: number

	blendOutDuration: number

	removedOnCompletion: boolean

	appliedOnCompletion: boolean

	repeatCount: number

	autoreverses: boolean

	startDelay: number

	timeOffset: number

	fillsForward: boolean

	fillsBackward: boolean

	usesSceneTimeBase: boolean

	animationDidStart: (p1: SCNAnimation, p2: SCNAnimatable) => void

	animationDidStop: (p1: SCNAnimation, p2: SCNAnimatable, p3: boolean) => void

	get animationEvents(): NSArray
	set animationEvents(value: NSArray<interop.Object> | Array<interop.Object>)

	additive: boolean

	cumulative: boolean

	isRemovedOnCompletion(): boolean

	isAppliedOnCompletion(): boolean

	isAdditive(): boolean

	isCumulative(): boolean

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

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNTimingFunction extends NSObject implements NSSecureCoding {
	static functionWithTimingMode(
		timingMode: interop.Enum<typeof SCNActionTimingMode>,
	): SCNTimingFunction

	static functionWithCAMediaTimingFunction(
		caTimingFunction: CAMediaTimingFunction,
	): SCNTimingFunction

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNFloor extends SCNGeometry {
	static floor<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	reflectivity: number

	reflectionFalloffStart: number

	reflectionFalloffEnd: number

	reflectionCategoryBitMask: number

	width: number

	length: number

	reflectionResolutionScaleFactor: number
}

export declare class SCNPhysicsConeTwistJoint extends SCNPhysicsBehavior {
	static jointWithBodyAFrameABodyBFrameB<This extends abstract new (...args: any) => any>(
		this: This,
		bodyA: SCNPhysicsBody,
		frameA: CATransform3D,
		bodyB: SCNPhysicsBody,
		frameB: CATransform3D,
	): InstanceType<This>

	static jointWithBodyFrame<This extends abstract new (...args: any) => any>(
		this: This,
		body: SCNPhysicsBody,
		frame: CATransform3D,
	): InstanceType<This>

	readonly bodyA: SCNPhysicsBody

	frameA: CATransform3D

	readonly bodyB: SCNPhysicsBody

	frameB: CATransform3D

	maximumAngularLimit1: number

	maximumAngularLimit2: number

	maximumTwistAngle: number
}

export declare class SCNSliderConstraint extends SCNConstraint {
	static sliderConstraint<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	collisionCategoryBitMask: number

	radius: number

	offset: SCNVector3
}

export declare class SCNAvoidOccluderConstraint extends SCNConstraint {
	static avoidOccluderConstraintWithTarget<This extends abstract new (...args: any) => any>(
		this: This,
		target: SCNNode | null,
	): InstanceType<This>

	delegate: SCNAvoidOccluderConstraintDelegate

	target: SCNNode

	occluderCategoryBitMask: number

	bias: number
}

export declare class SCNBillboardConstraint extends SCNConstraint {
	static billboardConstraint<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	freeAxes: interop.Enum<typeof SCNBillboardAxis>
}

export declare class SCNAccelerationConstraint extends SCNConstraint {
	static accelerationConstraint<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	maximumLinearAcceleration: number

	maximumLinearVelocity: number

	decelerationDistance: number

	damping: number
}

export declare class SCNLookAtConstraint extends SCNConstraint {
	static lookAtConstraintWithTarget<This extends abstract new (...args: any) => any>(
		this: This,
		target: SCNNode | null,
	): InstanceType<This>

	target: SCNNode

	targetOffset: SCNVector3

	localFront: SCNVector3

	worldUp: SCNVector3

	gimbalLockEnabled: boolean
}

export declare class SCNAnimationEvent extends NSObject {
	static animationEventWithKeyTimeBlock<This extends abstract new (...args: any) => any>(
		this: This,
		time: number,
		eventBlock: (p1: SCNAnimation, p2: interop.Object, p3: boolean) => void,
	): InstanceType<This>
}

export declare class SCNTechnique
	extends NSObject
	implements SCNAnimatable, NSCopying, NSSecureCoding
{
	static techniqueWithDictionary(
		dictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): SCNTechnique

	static techniqueBySequencingTechniques(
		techniques: NSArray<interop.Object> | Array<interop.Object>,
	): SCNTechnique

	handleBindingOfSymbolUsingBlock(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	readonly dictionaryRepresentation: NSDictionary

	objectForKeyedSubscript(key: interop.Object): interop.Object

	setObjectForKeyedSubscript(obj: interop.Object | null, key: NSCopying): void

	library: MTLLibrary

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNCamera
	extends NSObject
	implements SCNAnimatable, SCNTechniqueSupport, NSCopying, NSSecureCoding
{
	static camera<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	name: string

	fieldOfView: number

	projectionDirection: interop.Enum<typeof SCNCameraProjectionDirection>

	focalLength: number

	sensorHeight: number

	zNear: number

	zFar: number

	automaticallyAdjustsZRange: boolean

	usesOrthographicProjection: boolean

	orthographicScale: number

	projectionTransform: CATransform3D

	projectionTransformWithViewportSize(viewportSize: CGSize): CATransform3D

	wantsDepthOfField: boolean

	focusDistance: number

	focalBlurSampleCount: number

	fStop: number

	apertureBladeCount: number

	motionBlurIntensity: number

	screenSpaceAmbientOcclusionIntensity: number

	screenSpaceAmbientOcclusionRadius: number

	screenSpaceAmbientOcclusionBias: number

	screenSpaceAmbientOcclusionDepthThreshold: number

	screenSpaceAmbientOcclusionNormalThreshold: number

	wantsHDR: boolean

	exposureOffset: number

	averageGray: number

	whitePoint: number

	wantsExposureAdaptation: boolean

	exposureAdaptationBrighteningSpeedFactor: number

	exposureAdaptationDarkeningSpeedFactor: number

	minimumExposure: number

	maximumExposure: number

	bloomThreshold: number

	bloomIterationCount: number

	bloomIterationSpread: number

	bloomIntensity: number

	bloomBlurRadius: number

	vignettingPower: number

	vignettingIntensity: number

	colorFringeStrength: number

	colorFringeIntensity: number

	saturation: number

	contrast: number

	grainIntensity: number

	grainScale: number

	grainIsColored: boolean

	whiteBalanceTemperature: number

	whiteBalanceTint: number

	readonly colorGrading: SCNMaterialProperty

	categoryBitMask: number

	focalBlurRadius: number

	xFov: number

	yFov: number

	aperture: number

	focalSize: number

	focalDistance: number

	static cameraWithMDLCamera<This extends abstract new (...args: any) => any>(
		this: This,
		mdlCamera: MDLCamera,
	): InstanceType<This>

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	technique: SCNTechnique

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNAudioSource extends NSObject implements NSCopying, NSSecureCoding {
	initWithFileNamed(name: string): this

	initWithURL(url: NSURL): this

	static audioSourceNamed<This extends abstract new (...args: any) => any>(
		this: This,
		fileName: string,
	): InstanceType<This>

	positional: boolean

	volume: number

	rate: number

	reverbBlend: number

	loops: boolean

	shouldStream: boolean

	load(): void

	isPositional(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNMaterialProperty extends NSObject implements SCNAnimatable, NSSecureCoding {
	static materialPropertyWithContents<This extends abstract new (...args: any) => any>(
		this: This,
		contents: interop.Object,
	): InstanceType<This>

	contents: interop.Object

	intensity: number

	minificationFilter: interop.Enum<typeof SCNFilterMode>

	magnificationFilter: interop.Enum<typeof SCNFilterMode>

	mipFilter: interop.Enum<typeof SCNFilterMode>

	contentsTransform: CATransform3D

	wrapS: interop.Enum<typeof SCNWrapMode>

	wrapT: interop.Enum<typeof SCNWrapMode>

	mappingChannel: number

	textureComponents: interop.Enum<typeof SCNColorMask>

	maxAnisotropy: number

	borderColor: interop.Object

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNGeometry
	extends NSObject
	implements SCNAnimatable, SCNBoundingVolume, SCNShadable, NSCopying, NSSecureCoding
{
	static geometry<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	name: string

	get materials(): NSArray
	set materials(value: NSArray<interop.Object> | Array<interop.Object>)

	firstMaterial: SCNMaterial

	insertMaterialAtIndex(material: SCNMaterial, index: number): void

	removeMaterialAtIndex(index: number): void

	replaceMaterialAtIndexWithMaterial(index: number, material: SCNMaterial): void

	materialWithName(name: string): SCNMaterial

	static geometryWithSourcesElements<This extends abstract new (...args: any) => any>(
		this: This,
		sources: NSArray<interop.Object> | Array<interop.Object>,
		elements: NSArray<interop.Object> | Array<interop.Object> | null,
	): InstanceType<This>

	readonly geometrySources: NSArray

	geometrySourcesForSemantic(semantic: string): NSArray

	readonly geometryElements: NSArray

	readonly geometryElementCount: number

	geometryElementAtIndex(elementIndex: number): SCNGeometryElement

	get levelsOfDetail(): NSArray
	set levelsOfDetail(value: NSArray<interop.Object> | Array<interop.Object>)

	tessellator: SCNGeometryTessellator

	subdivisionLevel: number

	wantsAdaptiveSubdivision: boolean

	edgeCreasesElement: SCNGeometryElement

	edgeCreasesSource: SCNGeometrySource

	static geometryWithMDLMesh<This extends abstract new (...args: any) => any>(
		this: This,
		mdlMesh: MDLMesh,
	): InstanceType<This>

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	getBoundingBoxMinMax(min: interop.PointerConvertible, max: interop.PointerConvertible): boolean

	setBoundingBoxMinMax(min: interop.PointerConvertible, max: interop.PointerConvertible): void

	getBoundingSphereCenterRadius(
		center: interop.PointerConvertible,
		radius: interop.PointerConvertible,
	): boolean

	program: SCNProgram

	handleBindingOfSymbolUsingBlock(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	handleUnbindingOfSymbolUsingBlock(
		symbol: string,
		block: (p1: number, p2: number, p3: SCNNode, p4: SCNRenderer) => void | null,
	): void

	get shaderModifiers(): NSDictionary
	set shaderModifiers(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNTorus extends SCNGeometry {
	static torusWithRingRadiusPipeRadius<This extends abstract new (...args: any) => any>(
		this: This,
		ringRadius: number,
		pipeRadius: number,
	): InstanceType<This>

	ringRadius: number

	pipeRadius: number

	ringSegmentCount: number

	pipeSegmentCount: number
}

export declare class SCNPhysicsSliderJoint extends SCNPhysicsBehavior {
	static jointWithBodyAAxisAAnchorABodyBAxisBAnchorB<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		bodyA: SCNPhysicsBody,
		axisA: SCNVector3,
		anchorA: SCNVector3,
		bodyB: SCNPhysicsBody,
		axisB: SCNVector3,
		anchorB: SCNVector3,
	): InstanceType<This>

	static jointWithBodyAxisAnchor<This extends abstract new (...args: any) => any>(
		this: This,
		body: SCNPhysicsBody,
		axis: SCNVector3,
		anchor: SCNVector3,
	): InstanceType<This>

	readonly bodyA: SCNPhysicsBody

	axisA: SCNVector3

	anchorA: SCNVector3

	readonly bodyB: SCNPhysicsBody

	axisB: SCNVector3

	anchorB: SCNVector3

	minimumLinearLimit: number

	maximumLinearLimit: number

	minimumAngularLimit: number

	maximumAngularLimit: number

	motorTargetLinearVelocity: number

	motorMaximumForce: number

	motorTargetAngularVelocity: number

	motorMaximumTorque: number
}

export declare class SCNLight
	extends NSObject
	implements SCNAnimatable, NSCopying, NSSecureCoding, SCNTechniqueSupport
{
	static light<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	type: string

	color: interop.Object

	temperature: number

	intensity: number

	name: string

	castsShadow: boolean

	shadowColor: interop.Object

	shadowRadius: number

	shadowMapSize: CGSize

	shadowSampleCount: number

	shadowMode: interop.Enum<typeof SCNShadowMode>

	shadowBias: number

	automaticallyAdjustsShadowProjection: boolean

	maximumShadowDistance: number

	forcesBackFaceCasters: boolean

	sampleDistributedShadowMaps: boolean

	shadowCascadeCount: number

	shadowCascadeSplittingFactor: number

	orthographicScale: number

	zNear: number

	zFar: number

	attenuationStartDistance: number

	attenuationEndDistance: number

	attenuationFalloffExponent: number

	spotInnerAngle: number

	spotOuterAngle: number

	IESProfileURL: NSURL

	readonly sphericalHarmonicsCoefficients: NSData

	probeType: interop.Enum<typeof SCNLightProbeType>

	probeUpdateType: interop.Enum<typeof SCNLightProbeUpdateType>

	probeExtents: unknown /* ext vector */

	probeOffset: unknown /* ext vector */

	parallaxCorrectionEnabled: boolean

	parallaxExtentsFactor: unknown /* ext vector */

	parallaxCenterOffset: unknown /* ext vector */

	readonly probeEnvironment: SCNMaterialProperty

	areaType: interop.Enum<typeof SCNLightAreaType>

	areaExtents: unknown /* ext vector */

	get areaPolygonVertices(): NSArray
	set areaPolygonVertices(value: NSArray<interop.Object> | Array<interop.Object>)

	drawsArea: boolean

	doubleSided: boolean

	readonly gobo: SCNMaterialProperty

	categoryBitMask: number

	attributeForKey(key: string): interop.Object

	setAttributeForKey(attribute: interop.Object | null, key: string): void

	static lightWithMDLLight<This extends abstract new (...args: any) => any>(
		this: This,
		mdlLight: MDLLight,
	): InstanceType<This>

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	technique: SCNTechnique
}

export declare class SCNRenderer extends NSObject implements SCNSceneRenderer, SCNTechniqueSupport {
	static rendererWithContextOptions<This extends abstract new (...args: any) => any>(
		this: This,
		context: interop.PointerConvertible,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	static rendererWithDeviceOptions<This extends abstract new (...args: any) => any>(
		this: This,
		device: MTLDevice | null,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	scene: SCNScene

	renderAtTimeViewportCommandBufferPassDescriptor(
		time: number,
		viewport: CGRect,
		commandBuffer: MTLCommandBuffer,
		renderPassDescriptor: MTLRenderPassDescriptor,
	): void

	renderAtTime(time: number): void

	updateAtTime(time: number): void

	renderWithViewportCommandBufferPassDescriptor(
		viewport: CGRect,
		commandBuffer: MTLCommandBuffer,
		renderPassDescriptor: MTLRenderPassDescriptor,
	): void

	readonly nextFrameTime: number

	snapshotAtTimeWithSizeAntialiasingMode(
		time: number,
		size: CGSize,
		antialiasingMode: interop.Enum<typeof SCNAntialiasingMode>,
	): NSImage

	updateProbesAtTime(
		lightProbes: NSArray<interop.Object> | Array<interop.Object>,
		time: number,
	): void

	render(): void

	presentSceneWithTransitionIncomingPointOfViewCompletionHandler(
		scene: SCNScene,
		transition: SKTransition,
		pointOfView: SCNNode | null,
		completionHandler: () => void | null,
	): void

	sceneTime: number

	delegate: SCNSceneRendererDelegate

	hitTestOptions(
		point: CGPoint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	isNodeInsideFrustumWithPointOfView(node: SCNNode, pointOfView: SCNNode): boolean

	nodesInsideFrustumWithPointOfView(pointOfView: SCNNode): NSArray

	projectPoint(point: SCNVector3): SCNVector3

	unprojectPoint(point: SCNVector3): SCNVector3

	playing: boolean

	loops: boolean

	pointOfView: SCNNode

	autoenablesDefaultLighting: boolean

	jitteringEnabled: boolean

	temporalAntialiasingEnabled: boolean

	prepareObjectShouldAbortBlock(object: interop.Object, block: () => boolean | null): boolean

	prepareObjectsWithCompletionHandler(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: boolean) => void | null,
	): void

	showsStatistics: boolean

	debugOptions: interop.Enum<typeof SCNDebugOptions>

	overlaySKScene: SKScene

	readonly renderingAPI: interop.Enum<typeof SCNRenderingAPI>

	readonly context: interop.Pointer

	readonly currentRenderCommandEncoder: MTLRenderCommandEncoder

	readonly currentRenderPassDescriptor: MTLRenderPassDescriptor

	readonly device: MTLDevice

	readonly colorPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly depthPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly stencilPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly commandQueue: MTLCommandQueue

	readonly audioEngine: AVAudioEngine

	readonly audioEnvironmentNode: AVAudioEnvironmentNode

	audioListener: SCNNode

	readonly currentViewport: CGRect

	currentTime: number

	usesReverseZ: boolean

	isPlaying(): boolean

	isJitteringEnabled(): boolean

	isTemporalAntialiasingEnabled(): boolean

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

	technique: SCNTechnique
}

export declare class SCNHitTestResult extends NSObject {
	readonly node: SCNNode

	readonly geometryIndex: number

	readonly faceIndex: number

	readonly localCoordinates: SCNVector3

	readonly worldCoordinates: SCNVector3

	readonly localNormal: SCNVector3

	readonly worldNormal: SCNVector3

	readonly modelTransform: CATransform3D

	readonly boneNode: SCNNode

	textureCoordinatesWithMappingChannel(channel: number): CGPoint

	readonly simdLocalCoordinates: unknown /* ext vector */

	readonly simdWorldCoordinates: unknown /* ext vector */

	readonly simdLocalNormal: unknown /* ext vector */

	readonly simdWorldNormal: unknown /* ext vector */

	readonly simdModelTransform: simd_float4x4
}

export declare class SCNCylinder extends SCNGeometry {
	static cylinderWithRadiusHeight<This extends abstract new (...args: any) => any>(
		this: This,
		radius: number,
		height: number,
	): InstanceType<This>

	radius: number

	height: number

	radialSegmentCount: number

	heightSegmentCount: number
}

export declare class SCNDistanceConstraint extends SCNConstraint {
	static distanceConstraintWithTarget<This extends abstract new (...args: any) => any>(
		this: This,
		target: SCNNode | null,
	): InstanceType<This>

	target: SCNNode

	minimumDistance: number

	maximumDistance: number
}

export declare class SCNPyramid extends SCNGeometry {
	static pyramidWithWidthHeightLength<This extends abstract new (...args: any) => any>(
		this: This,
		width: number,
		height: number,
		length: number,
	): InstanceType<This>

	width: number

	height: number

	length: number

	widthSegmentCount: number

	heightSegmentCount: number

	lengthSegmentCount: number
}

export declare class SCNPhysicsVehicleWheel extends NSObject implements NSCopying, NSSecureCoding {
	static wheelWithNode<This extends abstract new (...args: any) => any>(
		this: This,
		node: SCNNode,
	): InstanceType<This>

	readonly node: SCNNode

	suspensionStiffness: number

	suspensionCompression: number

	suspensionDamping: number

	maximumSuspensionTravel: number

	frictionSlip: number

	maximumSuspensionForce: number

	connectionPosition: SCNVector3

	steeringAxis: SCNVector3

	axle: SCNVector3

	radius: number

	suspensionRestLength: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNTransformConstraint extends SCNConstraint {
	static transformConstraintInWorldSpaceWithBlock<This extends abstract new (...args: any) => any>(
		this: This,
		world: boolean,
		block: (p1: SCNNode, p2: CATransform3D) => CATransform3D,
	): InstanceType<This>

	static positionConstraintInWorldSpaceWithBlock<This extends abstract new (...args: any) => any>(
		this: This,
		world: boolean,
		block: (p1: SCNNode, p2: SCNVector3) => SCNVector3,
	): InstanceType<This>

	static orientationConstraintInWorldSpaceWithBlock<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		world: boolean,
		block: (p1: SCNNode, p2: SCNVector4) => SCNVector4,
	): InstanceType<This>
}

export declare class SCNTransaction extends NSObject {
	static begin(): void

	static commit(): void

	static flush(): void

	static lock(): void

	static unlock(): void

	static animationDuration: number

	static animationTimingFunction: CAMediaTimingFunction

	static disableActions: boolean

	static completionBlock: () => void

	static valueForKey(key: string): interop.Object

	static setValueForKey(value: interop.Object | null, key: string): void
}

export declare class SCNProgram extends NSObject implements NSCopying, NSSecureCoding {
	static program<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	vertexShader: string

	fragmentShader: string

	tessellationControlShader: string

	tessellationEvaluationShader: string

	geometryShader: string

	vertexFunctionName: string

	fragmentFunctionName: string

	handleBindingOfBufferNamedFrequencyUsingBlock(
		name: string,
		frequency: interop.Enum<typeof SCNBufferFrequency>,
		block: (p1: SCNBufferStream, p2: SCNNode, p3: SCNShadable, p4: SCNRenderer) => void,
	): void

	opaque: boolean

	setSemanticForSymbolOptions(
		semantic: string | null,
		symbol: string,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	semanticForSymbol(symbol: string): string

	delegate: SCNProgramDelegate

	library: MTLLibrary

	isOpaque(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNGeometryTessellator extends NSObject implements NSCopying, NSSecureCoding {
	tessellationFactorScale: number

	tessellationPartitionMode: interop.Enum<typeof MTLTessellationPartitionMode>

	adaptive: boolean

	screenSpace: boolean

	edgeTessellationFactor: number

	insideTessellationFactor: number

	maximumEdgeLength: number

	smoothingMode: interop.Enum<typeof SCNTessellationSmoothingMode>

	isAdaptive(): boolean

	isScreenSpace(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNLayer
	extends CAOpenGLLayer
	implements SCNSceneRenderer, SCNTechniqueSupport
{
	scene: SCNScene

	presentSceneWithTransitionIncomingPointOfViewCompletionHandler(
		scene: SCNScene,
		transition: SKTransition,
		pointOfView: SCNNode | null,
		completionHandler: () => void | null,
	): void

	sceneTime: number

	// @ts-ignore MemberDecl.tsIgnore
	delegate: SCNSceneRendererDelegate

	hitTestOptions(
		point: CGPoint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): NSArray

	isNodeInsideFrustumWithPointOfView(node: SCNNode, pointOfView: SCNNode): boolean

	nodesInsideFrustumWithPointOfView(pointOfView: SCNNode): NSArray

	projectPoint(point: SCNVector3): SCNVector3

	unprojectPoint(point: SCNVector3): SCNVector3

	playing: boolean

	loops: boolean

	pointOfView: SCNNode

	autoenablesDefaultLighting: boolean

	jitteringEnabled: boolean

	temporalAntialiasingEnabled: boolean

	prepareObjectShouldAbortBlock(object: interop.Object, block: () => boolean | null): boolean

	prepareObjectsWithCompletionHandler(
		objects: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: boolean) => void | null,
	): void

	showsStatistics: boolean

	debugOptions: interop.Enum<typeof SCNDebugOptions>

	overlaySKScene: SKScene

	readonly renderingAPI: interop.Enum<typeof SCNRenderingAPI>

	readonly context: interop.Pointer

	readonly currentRenderCommandEncoder: MTLRenderCommandEncoder

	readonly currentRenderPassDescriptor: MTLRenderPassDescriptor

	readonly device: MTLDevice

	readonly colorPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly depthPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly stencilPixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly commandQueue: MTLCommandQueue

	readonly audioEngine: AVAudioEngine

	readonly audioEnvironmentNode: AVAudioEnvironmentNode

	audioListener: SCNNode

	readonly currentViewport: CGRect

	currentTime: number

	usesReverseZ: boolean

	isPlaying(): boolean

	isJitteringEnabled(): boolean

	isTemporalAntialiasingEnabled(): boolean

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

	technique: SCNTechnique
}

export declare class SCNIKConstraint extends SCNConstraint {
	initWithChainRootNode(chainRootNode: SCNNode): this

	static inverseKinematicsConstraintWithChainRootNode<
		This extends abstract new (...args: any) => any,
	>(this: This, chainRootNode: SCNNode): InstanceType<This>

	readonly chainRootNode: SCNNode

	targetPosition: SCNVector3

	setMaxAllowedRotationAngleForJoint(angle: number, node: SCNNode): void

	maxAllowedRotationAngleForJoint(node: SCNNode): number
}

export declare class SCNSceneSource extends NSObject {
	static sceneSourceWithURLOptions<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	static sceneSourceWithDataOptions<This extends abstract new (...args: any) => any>(
		this: This,
		data: NSData,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): InstanceType<This>

	initWithURLOptions(
		url: NSURL,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	initWithDataOptions(
		data: NSData,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): this

	readonly url: NSURL

	readonly data: NSData

	sceneWithOptionsStatusHandler(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		statusHandler: (
			p1: number,
			p2: interop.Enum<typeof SCNSceneSourceStatus>,
			p3: NSError,
			p4: interop.PointerConvertible,
		) => void | null,
	): SCNScene

	sceneWithOptionsError(
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): SCNScene

	propertyForKey(key: string): interop.Object

	entryWithIdentifierWithClass(uid: string, entryClass: interop.PointerConvertible): interop.Object

	identifiersOfEntriesWithClass(entryClass: interop.PointerConvertible): NSArray

	entriesPassingTest(
		predicate: (p1: interop.Object, p2: string, p3: interop.PointerConvertible) => boolean,
	): NSArray
}

export declare class SCNReplicatorConstraint extends SCNConstraint {
	static replicatorConstraintWithTarget<This extends abstract new (...args: any) => any>(
		this: This,
		target: SCNNode | null,
	): InstanceType<This>

	target: SCNNode

	replicatesOrientation: boolean

	replicatesPosition: boolean

	replicatesScale: boolean

	orientationOffset: SCNVector4

	positionOffset: SCNVector3

	scaleOffset: SCNVector3
}

export declare class SCNMorpher extends NSObject implements SCNAnimatable, NSSecureCoding {
	get targets(): NSArray
	set targets(value: NSArray<interop.Object> | Array<interop.Object>)

	get weights(): NSArray
	set weights(value: NSArray<interop.Object> | Array<interop.Object>)

	setWeightForTargetAtIndex(weight: number, targetIndex: number): void

	weightForTargetAtIndex(targetIndex: number): number

	setWeightForTargetNamed(weight: number, targetName: string): void

	weightForTargetNamed(targetName: string): number

	calculationMode: interop.Enum<typeof SCNMorpherCalculationMode>

	unifiesNormals: boolean

	addAnimationForKey(animation: SCNAnimation, key: string | null): void

	addAnimationPlayerForKey(player: SCNAnimationPlayer, key: string | null): void

	removeAllAnimations(): void

	removeAnimationForKey(key: string): void

	removeAnimationForKeyBlendOutDuration(key: string, duration: number): void

	readonly animationKeys: NSArray

	animationPlayerForKey(key: string): SCNAnimationPlayer

	removeAnimationForKeyFadeOutDuration(key: string, duration: number): void

	animationForKey(key: string): CAAnimation

	pauseAnimationForKey(key: string): void

	resumeAnimationForKey(key: string): void

	setSpeedForAnimationKey(speed: number, key: string): void

	isAnimationForKeyPaused(key: string): boolean

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

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class SCNPhysicsContact extends NSObject {
	readonly nodeA: SCNNode

	readonly nodeB: SCNNode

	readonly contactPoint: SCNVector3

	readonly contactNormal: SCNVector3

	readonly collisionImpulse: number

	readonly penetrationDistance: number

	readonly sweepTestFraction: number
}

export declare class SCNCapsule extends SCNGeometry {
	static capsuleWithCapRadiusHeight<This extends abstract new (...args: any) => any>(
		this: This,
		capRadius: number,
		height: number,
	): InstanceType<This>

	capRadius: number

	height: number

	radialSegmentCount: number

	heightSegmentCount: number

	capSegmentCount: number
}
