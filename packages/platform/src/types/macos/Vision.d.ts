import type { CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { CIBarcodeDescriptor, CIImage } from './CoreImage'

import type { MLFeatureProvider, MLFeatureValue, MLModel, MLMultiArray } from './CoreML'

import type { CMTime, CMTimeRange } from './CoreMedia'

import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSData,
	NSDictionary,
	NSError,
	NSIndexPath,
	NSIndexSet,
	NSNumber,
	NSSecureCoding,
	NSURL,
	NSUUID,
	_NSRange,
} from './Foundation'

import type { NSObjectProtocol, simd_float3x3 } from './Runtime'

import type { interop } from './objc-runtime'

import { CGImagePropertyOrientation } from './ImageIO'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const VNVisionVersionNumber: number

export declare const VNRecognizeTextRequestRevision2: number

export declare const VNRecognizeTextRequestRevision1: number

export declare const VNHumanBodyPoseObservationJointsGroupNameRightLeg: string

export declare const VNHumanBodyPoseObservationJointsGroupNameLeftArm: string

export declare const VNHumanBodyPoseObservationJointsGroupNameTorso: string

export declare const VNHumanBodyPoseObservationJointNameLeftAnkle: string

export declare const VNHumanBodyPoseObservationJointNameRoot: string

export declare const VNHumanBodyPoseObservationJointNameLeftWrist: string

export declare const VNHumanBodyPoseObservationJointNameLeftElbow: string

export declare const VNHumanBodyPoseObservationJointNameNeck: string

export declare const VNHumanBodyPoseObservationJointNameRightEar: string

export declare const VNHumanBodyPoseObservationJointNameLeftEar: string

export declare const VNBodyLandmarkRegionKeyLeftArm: string

export declare const VNBodyLandmarkKeyRightAnkle: string

export declare const VNBodyLandmarkKeyLeftAnkle: string

export declare const VNBodyLandmarkKeyLeftHip: string

export declare const VNBodyLandmarkKeyRightWrist: string

export declare const VNBodyLandmarkKeyNeck: string

export declare const VNBodyLandmarkKeyRightShoulder: string

export declare const VNBodyLandmarkKeyLeftShoulder: string

export declare const VNBodyLandmarkKeyLeftEar: string

export declare const VNBodyLandmarkKeyLeftEye: string

export declare const VNBodyLandmarkKeyNose: string

export declare const VNDetectHumanHandPoseRequestRevision1: number

export declare const VNHumanHandPoseObservationJointsGroupNameAll: string

export declare const VNHumanHandPoseObservationJointsGroupNameIndexFinger: string

export declare const VNHumanHandPoseObservationJointNameRingDIP: string

export declare const VNHumanHandPoseObservationJointNameMiddleDIP: string

export declare const VNHumanHandPoseObservationJointNameMiddleMCP: string

export declare const VNHumanHandPoseObservationJointNameThumbTip: string

export declare const VNHumanHandPoseObservationJointNameThumbIP: string

export declare const VNGenerateOpticalFlowRequestRevision1: number

export declare const VNDetectTrajectoriesRequestRevision1: number

export declare const VNRecognizeAnimalsRequestRevision1: number

export declare const VNTranslationalImageRegistrationRequestRevision1: number

export declare const VNImageOptionCIContext: string

export declare const VNCoreMLRequestRevision1: number

export declare const VNGenerateObjectnessBasedSaliencyImageRequestRevision1: number

export declare const VNDetectRectanglesRequestRevision1: number

export declare const VNDetectHorizonRequestRevision1: number

export declare const VNDetectFaceLandmarksRequestRevision2: number

export declare const VNDetectFaceRectanglesRequestRevision1: number

export declare const VNClassifyImageRequestRevision1: number

export declare const VNRecognizedPoint3DGroupKeyAll: string

export declare const VNNormalizedIdentityRect: CGRect

export declare const VNErrorDomain: string

export declare const VNVideoProcessingOptionTimeInterval: string

export declare const VNBarcodeSymbologyUPCE: string

export declare const VNBarcodeSymbologyQR: string

export declare const VNBarcodeSymbologyPDF417: string

export declare const VNBarcodeSymbologyI2of5Checksum: string

export declare const VNBarcodeSymbologyCode93i: string

export declare const VNBarcodeSymbologyCode93: string

export declare const VNBarcodeSymbologyAztec: string

export declare const VNImageOptionProperties: string

export declare const VNHumanBodyPoseObservationJointNameLeftKnee: string

export declare const VNHumanHandPoseObservationJointNameLittlePIP: string

export declare const VNHumanHandPoseObservationJointNameIndexDIP: string

export declare const VNHumanBodyPoseObservationJointNameRightShoulder: string

export declare const VNBodyLandmarkKeyRightEye: string

export declare const VNHumanHandPoseObservationJointsGroupNameRingFinger: string

export declare const VNDetectFaceLandmarksRequestRevision3: number

export declare const VNVideoProcessingOptionFrameCadence: string

export declare const VNTrackObjectRequestRevision2: number

export declare const VNHumanHandPoseObservationJointNameLittleMCP: string

export declare const VNBodyLandmarkKeyRightKnee: string

export declare const VNBarcodeSymbologyEAN8: string

export declare const VNImageOptionCameraIntrinsics: string

export declare const VNHumanHandPoseObservationJointsGroupNameThumb: string

export declare const VNBodyLandmarkKeyLeftKnee: string

export declare const VNBodyLandmarkKeyRightHip: string

export declare const VNHumanHandPoseObservationJointsGroupNameMiddleFinger: string

export declare const VNBarcodeSymbologyCode39FullASCII: string

export declare const VNDetectContourRequestRevision1: number

export declare const VNBodyLandmarkKeyLeftWrist: string

export declare const VNHumanHandPoseObservationJointNameIndexTip: string

export declare const VNHumanBodyPoseObservationJointNameRightEye: string

export declare const VNHomographicImageRegistrationRequestRevision1: number

export declare const VNHumanHandPoseObservationJointNameIndexPIP: string

export declare const VNRequestRevisionUnspecified: number

export declare const VNHumanBodyPoseObservationJointNameLeftHip: string

export declare const VNBarcodeSymbologyCode39: string

export declare const VNHumanHandPoseObservationJointNameWrist: string

export declare const VNHumanHandPoseObservationJointNameRingMCP: string

export declare const VNBodyLandmarkKeyRoot: string

export declare const VNHumanHandPoseObservationJointNameIndexMCP: string

export declare const VNHumanHandPoseObservationJointNameThumbMP: string

export declare const VNHumanBodyPoseObservationJointNameLeftShoulder: string

export declare const VNHumanBodyPoseObservationJointNameRightKnee: string

export declare const VNBarcodeSymbologyDataMatrix: string

export declare const VNHumanBodyPoseObservationJointsGroupNameFace: string

export declare const VNBodyLandmarkRegionKeyTorso: string

export declare const VNHumanBodyPoseObservationJointsGroupNameRightArm: string

export declare const VNBodyLandmarkRegionKeyLeftLeg: string

export declare const VNHumanBodyPoseObservationJointNameRightAnkle: string

export declare const VNHumanHandPoseObservationJointsGroupNameLittleFinger: string

export declare const VNBarcodeSymbologyCode39Checksum: string

export declare const VNDetectFaceCaptureQualityRequestRevision2: number

export declare const VNDetectFaceRectanglesRequestRevision2: number

export declare const VNHumanBodyPoseObservationJointsGroupNameAll: string

export declare const VNDetectHumanBodyPoseRequestRevision1: number

export declare const VNHumanHandPoseObservationJointNameMiddleTip: string

export declare const VNHumanHandPoseObservationJointNameRingPIP: string

export declare const VNHumanBodyPoseObservationJointNameRightElbow: string

export declare const VNHumanHandPoseObservationJointNameLittleDIP: string

export declare const VNHumanHandPoseObservationJointNameMiddlePIP: string

export declare const VNBarcodeSymbologyEAN13: string

export declare const VNBarcodeSymbologyCode39FullASCIIChecksum: string

export declare const VNHumanBodyPoseObservationJointsGroupNameLeftLeg: string

export declare const VNHumanHandPoseObservationJointNameLittleTip: string

export declare const VNBodyLandmarkKeyLeftElbow: string

export declare const VNHumanBodyPoseObservationJointNameNose: string

export declare const VNGenerateImageFeaturePrintRequestRevision1: number

export declare const VNTrackRectangleRequestRevision1: number

export declare const VNHumanHandPoseObservationJointNameRingTip: string

export declare const VNBodyLandmarkKeyRightElbow: string

export declare const VNAnimalIdentifierDog: string

export declare const VNDetectTextRectanglesRequestRevision1: number

export declare const VNAnimalIdentifierCat: string

export declare const VNRecognizedPointGroupKeyAll: string

export declare const VNGenerateAttentionBasedSaliencyImageRequestRevision1: number

export declare const VNTrackObjectRequestRevision1: number

export declare const VNBarcodeSymbologyITF14: string

export declare const VNHumanHandPoseObservationJointNameThumbCMC: string

export declare const VNHumanBodyPoseObservationJointNameRightHip: string

export declare const VNBarcodeSymbologyI2of5: string

export declare const VNDetectFaceCaptureQualityRequestRevision1: number

export declare const VNHumanBodyPoseObservationJointNameRightWrist: string

export declare const VNDetectFaceLandmarksRequestRevision1: number

export declare const VNBodyLandmarkRegionKeyRightLeg: string

export declare const VNDetectBarcodesRequestRevision1: number

export declare const VNDetectHumanRectanglesRequestRevision1: number

export declare const VNBodyLandmarkKeyRightEar: string

export declare const VNHumanBodyPoseObservationJointNameLeftEye: string

export declare const VNBodyLandmarkRegionKeyFace: string

export declare const VNBarcodeSymbologyCode128: string

export declare const VNBodyLandmarkRegionKeyRightArm: string

export declare const VNRequestTextRecognitionLevel: {
	Accurate: 0
	Fast: 1
}

export declare const VNGenerateOpticalFlowRequestComputationAccuracy: {
	Low: 0
	Medium: 1
	High: 2
	VeryHigh: 3
}

export declare const VNRequestTrackingLevel: {
	Accurate: 0
	Fast: 1
}

export declare const VNPointsClassification: {
	Disconnected: 0
	OpenPath: 1
	ClosedPath: 2
}

export declare const VNElementType: {
	Unknown: 0
	Float: 1
	Double: 2
}

export declare const VNChirality: {
	Unknown: 0
	Left: -1
	Right: 1
}

export declare const VNGeneratePersonSegmentationRequestQualityLevel: {
	Accurate: 0
	Balanced: 1
	Fast: 2
}

export declare const VNTrackOpticalFlowRequestComputationAccuracy: {
	Low: 0
	Medium: 1
	High: 2
	VeryHigh: 3
}

export declare const VNRequestFaceLandmarksConstellation: {
	ConstellationNotDefined: 0
	Constellation65Points: 1
	Constellation76Points: 2
}

export declare const VNHumanBodyPose3DObservationHeightEstimation: {
	Reference: 0
	Measured: 1
}

export declare const VNErrorCode: {
	TuriCoreErrorCode: -1
	OK: 0
	RequestCancelled: 1
	InvalidFormat: 2
	OperationFailed: 3
	OutOfBoundsError: 4
	InvalidOption: 5
	IOError: 6
	MissingOption: 7
	NotImplemented: 8
	InternalError: 9
	OutOfMemory: 10
	UnknownError: 11
	InvalidOperation: 12
	InvalidImage: 13
	InvalidArgument: 14
	InvalidModel: 15
	UnsupportedRevision: 16
	DataUnavailable: 17
	TimeStampNotFound: 18
}

export declare const VNImageCropAndScaleOption: {
	CenterCrop: 0
	ScaleFit: 1
	ScaleFill: 2
	ScaleFitRotate90CCW: 257
	ScaleFillRotate90CCW: 258
}

export declare const VNBarcodeCompositeType: {
	None: 0
	Linked: 1
	GS1TypeA: 2
	GS1TypeB: 3
	GS1TypeC: 4
}

export declare function VNNormalizedRectIsIdentityRect(normalizedRect: CGRect): boolean

export declare function VNImagePointForNormalizedPoint(
	normalizedPoint: CGPoint,
	imageWidth: number,
	imageHeight: number,
): CGPoint

export declare function VNNormalizedPointForImagePoint(
	imagePoint: CGPoint,
	imageWidth: number,
	imageHeight: number,
): CGPoint

export declare function VNImageRectForNormalizedRect(
	normalizedRect: CGRect,
	imageWidth: number,
	imageHeight: number,
): CGRect

export declare function VNNormalizedRectForImageRect(
	imageRect: CGRect,
	imageWidth: number,
	imageHeight: number,
): CGRect

export declare function VNNormalizedFaceBoundingBoxPointForLandmarkPoint(
	faceLandmarkPoint: unknown /* ext vector */,
	faceBoundingBox: CGRect,
	imageWidth: number,
	imageHeight: number,
): CGPoint

export declare function VNImagePointForFaceLandmarkPoint(
	faceLandmarkPoint: unknown /* ext vector */,
	faceBoundingBox: CGRect,
	imageWidth: number,
	imageHeight: number,
): CGPoint

export declare function VNElementTypeSize(elementType: interop.Enum<typeof VNElementType>): number

export declare interface VNFaceObservationAccepting extends NSObjectProtocol {
	get inputFaceObservations(): NSArray
	set inputFaceObservations(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class VNFaceObservationAccepting
	extends NativeObject
	implements VNFaceObservationAccepting {}

export declare interface VNRequestProgressProviding extends NSObjectProtocol {
	progressHandler: (p1: VNRequest, p2: number, p3: NSError) => void

	readonly indeterminate: boolean
}

export declare class VNRequestProgressProviding
	extends NativeObject
	implements VNRequestProgressProviding {}

export declare interface VNRequestRevisionProviding {
	readonly requestRevision: number
}

export declare class VNRequestRevisionProviding
	extends NativeObject
	implements VNRequestRevisionProviding {}

export declare class VNHumanHandPoseObservation extends VNRecognizedPointsObservation {
	readonly availableJointNames: NSArray

	readonly availableJointsGroupNames: NSArray

	recognizedPointForJointNameError(
		jointName: string,
		error: interop.PointerConvertible,
	): VNRecognizedPoint

	recognizedPointsForJointsGroupNameError(
		jointsGroupName: string,
		error: interop.PointerConvertible,
	): NSDictionary
}

export declare class VNVideoProcessorRequestProcessingOptions
	extends NSObject
	implements NSCopying
{
	cadence: VNVideoProcessorCadence

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class VNDetectContoursRequest extends VNImageBasedRequest {
	contrastAdjustment: number

	detectsDarkOnLight: boolean

	detectDarkOnLight: boolean

	maximumImageDimension: number

	readonly results: NSArray
}

export declare class VNTrackRectangleRequest extends VNTrackingRequest {
	initWithRectangleObservation(observation: VNRectangleObservation): this

	initWithRectangleObservationCompletionHandler(
		observation: VNRectangleObservation,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this
}

export declare class VNTrackingRequest extends VNImageBasedRequest {
	inputObservation: VNDetectedObjectObservation

	trackingLevel: interop.Enum<typeof VNRequestTrackingLevel>

	lastFrame: boolean

	isLastFrame(): boolean
}

export declare class VNTranslationalImageRegistrationRequest extends VNImageRegistrationRequest {
	readonly results: NSArray
}

export declare class VNImageRegistrationRequest extends VNTargetedImageRequest {}

export declare class VNSequenceRequestHandler extends NSObject {
	init(): this

	performRequestsOnCVPixelBufferError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		pixelBuffer: interop.Object,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCVPixelBufferOrientationError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		pixelBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCGImageError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		image: interop.Object,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCGImageOrientationError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		image: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCIImageError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		image: CIImage,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCIImageOrientationError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		image: CIImage,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnImageURLError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		imageURL: NSURL,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnImageURLOrientationError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		imageURL: NSURL,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnImageDataError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		imageData: NSData,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnImageDataOrientationError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		imageData: NSData,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCMSampleBufferError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		sampleBuffer: interop.Object,
		error: interop.PointerConvertible,
	): boolean

	performRequestsOnCMSampleBufferOrientationError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		sampleBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		error: interop.PointerConvertible,
	): boolean
}

export declare class VNImageRequestHandler extends NSObject {
	initWithCVPixelBufferOptions(
		pixelBuffer: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCVPixelBufferOrientationOptions(
		pixelBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCGImageOptions(
		image: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCGImageOrientationOptions(
		image: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCIImageOptions(
		image: CIImage,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCIImageOrientationOptions(
		image: CIImage,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithURLOptions(
		imageURL: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithURLOrientationOptions(
		imageURL: NSURL,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithDataOptions(
		imageData: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithDataOrientationOptions(
		imageData: NSData,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCMSampleBufferOptions(
		sampleBuffer: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithCMSampleBufferOrientationOptions(
		sampleBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	performRequestsError(
		requests: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean
}

export declare class VNGenerateObjectnessBasedSaliencyImageRequest extends VNImageBasedRequest {
	readonly results: NSArray
}

export declare class VNDetectHorizonRequest extends VNImageBasedRequest {
	readonly results: NSArray
}

export declare class VNRecognizedPoints3DObservation extends VNObservation {
	readonly availableKeys: NSArray

	readonly availableGroupKeys: NSArray

	recognizedPointForKeyError(
		pointKey: string,
		error: interop.PointerConvertible,
	): VNRecognizedPoint3D

	recognizedPointsForGroupKeyError(
		groupKey: string,
		error: interop.PointerConvertible,
	): NSDictionary
}

export declare class VNRecognizedPointsObservation extends VNObservation {
	readonly availableKeys: NSArray

	readonly availableGroupKeys: NSArray

	recognizedPointForKeyError(pointKey: string, error: interop.PointerConvertible): VNRecognizedPoint

	recognizedPointsForGroupKeyError(
		groupKey: string,
		error: interop.PointerConvertible,
	): NSDictionary

	keypointsMultiArrayAndReturnError(error: interop.PointerConvertible): MLMultiArray
}

export declare class VNFeaturePrintObservation extends VNObservation {
	readonly elementType: interop.Enum<typeof VNElementType>

	readonly elementCount: number

	readonly data: NSData

	computeDistanceToFeaturePrintObservationError(
		outDistance: interop.PointerConvertible,
		featurePrint: VNFeaturePrintObservation,
		error: interop.PointerConvertible,
	): boolean
}

export declare class VNSaliencyImageObservation extends VNPixelBufferObservation {
	readonly salientObjects: NSArray
}

export declare class VNImageTranslationAlignmentObservation extends VNImageAlignmentObservation {
	readonly alignmentTransform: CGAffineTransform
}

export declare class VNHorizonObservation extends VNObservation {
	readonly transform: CGAffineTransform

	readonly angle: number
}

export declare class VNRecognizedText
	extends NSObject
	implements NSCopying, NSSecureCoding, VNRequestRevisionProviding
{
	readonly string: string

	readonly confidence: number

	boundingBoxForRangeError(
		range: _NSRange,
		error: interop.PointerConvertible,
	): VNRectangleObservation

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly requestRevision: number
}

export declare class VNTrajectoryObservation extends VNObservation {
	readonly detectedPoints: NSArray

	readonly projectedPoints: NSArray

	readonly equationCoefficients: unknown /* ext vector */
}

export declare class VNRectangleObservation extends VNDetectedObjectObservation {
	static rectangleObservationWithRequestRevisionTopLeftBottomLeftBottomRightTopRight<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		requestRevision: number,
		topLeft: CGPoint,
		bottomLeft: CGPoint,
		bottomRight: CGPoint,
		topRight: CGPoint,
	): InstanceType<This>

	readonly topLeft: CGPoint

	readonly topRight: CGPoint

	readonly bottomLeft: CGPoint

	readonly bottomRight: CGPoint
}

export declare class VNCoreMLFeatureValueObservation extends VNObservation {
	readonly featureValue: MLFeatureValue

	readonly featureName: string
}

export declare class VNRecognizedObjectObservation extends VNDetectedObjectObservation {
	readonly labels: NSArray
}

export declare class VNFaceObservation extends VNDetectedObjectObservation {
	static faceObservationWithRequestRevisionBoundingBoxRollYaw<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		requestRevision: number,
		boundingBox: CGRect,
		roll: NSNumber | null,
		yaw: NSNumber | null,
	): InstanceType<This>

	readonly landmarks: VNFaceLandmarks2D

	readonly faceCaptureQuality: NSNumber

	readonly roll: NSNumber

	readonly yaw: NSNumber
}

export declare class VNDetectedObjectObservation extends VNObservation {
	static observationWithBoundingBox<This extends abstract new (...args: any) => any>(
		this: This,
		boundingBox: CGRect,
	): InstanceType<This>

	static observationWithRequestRevisionBoundingBox<This extends abstract new (...args: any) => any>(
		this: This,
		requestRevision: number,
		boundingBox: CGRect,
	): InstanceType<This>

	readonly boundingBox: CGRect
}

export declare class VNObservation
	extends NSObject
	implements NSCopying, NSSecureCoding, VNRequestRevisionProviding
{
	readonly uuid: NSUUID

	readonly confidence: number

	readonly timeRange: CMTimeRange

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly requestRevision: number
}

export declare class VNDetectedPoint extends VNPoint {
	readonly confidence: number
}

export declare class VNPoint extends NSObject implements NSCopying, NSSecureCoding {
	static readonly zeroPoint: VNPoint

	static pointByApplyingVectorToPoint(vector: VNVector, point: VNPoint): VNPoint

	static distanceBetweenPointPoint(point1: VNPoint, point2: VNPoint): number

	distanceToPoint(point: VNPoint): number

	initWithXY(x: number, y: number): this

	initWithLocation(location: CGPoint): this

	readonly location: CGPoint

	readonly x: number

	readonly y: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class VNFaceLandmarkRegion
	extends NSObject
	implements NSCopying, NSSecureCoding, VNRequestRevisionProviding
{
	readonly pointCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly requestRevision: number
}

export declare class VNImageAlignmentObservation extends VNObservation {}

export declare class VNContour extends NSObject implements NSCopying, VNRequestRevisionProviding {
	readonly indexPath: NSIndexPath

	readonly childContourCount: number

	readonly childContours: NSArray

	childContourAtIndexError(childContourIndex: number, error: interop.PointerConvertible): VNContour

	readonly pointCount: number

	readonly normalizedPoints: interop.Pointer

	readonly normalizedPath: interop.Object

	readonly aspectRatio: number

	polygonApproximationWithEpsilonError(
		epsilon: number,
		error: interop.PointerConvertible,
	): VNContour

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	readonly requestRevision: number
}

export declare class VNDetectHumanRectanglesRequest extends VNImageBasedRequest {
	readonly results: NSArray
}

export declare class VNDetectRectanglesRequest extends VNImageBasedRequest {
	minimumAspectRatio: number

	maximumAspectRatio: number

	quadratureTolerance: number

	minimumSize: number

	minimumConfidence: number

	maximumObservations: number

	readonly results: NSArray
}

export declare class VNDetectFaceLandmarksRequest
	extends VNImageBasedRequest
	implements VNFaceObservationAccepting
{
	static revisionSupportsConstellation(
		requestRevision: number,
		constellation: interop.Enum<typeof VNRequestFaceLandmarksConstellation>,
	): boolean

	constellation: interop.Enum<typeof VNRequestFaceLandmarksConstellation>

	readonly results: NSArray

	get inputFaceObservations(): NSArray
	set inputFaceObservations(value: NSArray<interop.Object> | Array<interop.Object>)

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

export declare class VNVideoProcessorCadence extends NSObject implements NSCopying {
	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class VNCoreMLModel extends NSObject {
	static modelForMLModelError<This extends abstract new (...args: any) => any>(
		this: This,
		model: MLModel,
		error: interop.PointerConvertible,
	): InstanceType<This>

	inputImageFeatureName: string

	featureProvider: MLFeatureProvider
}

export declare class VNHumanBodyPoseObservation extends VNRecognizedPointsObservation {
	readonly availableJointNames: NSArray

	readonly availableJointsGroupNames: NSArray

	recognizedPointForJointNameError(
		jointName: string,
		error: interop.PointerConvertible,
	): VNRecognizedPoint

	recognizedPointsForJointsGroupNameError(
		jointsGroupName: string,
		error: interop.PointerConvertible,
	): NSDictionary
}

export declare class VNClassifyImageRequest extends VNImageBasedRequest {
	static knownClassificationsForRevisionError(
		requestRevision: number,
		error: interop.PointerConvertible,
	): NSArray

	readonly results: NSArray
}

export declare class VNDetectTrajectoriesRequest extends VNStatefulRequest {
	initWithFrameAnalysisSpacingTrajectoryLengthCompletionHandler(
		frameAnalysisSpacing: CMTime,
		trajectoryLength: number,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	readonly trajectoryLength: number

	objectMinimumNormalizedRadius: number

	minimumObjectSize: number

	objectMaximumNormalizedRadius: number

	maximumObjectSize: number

	readonly results: NSArray
}

export declare class VNImageBasedRequest extends VNRequest {
	regionOfInterest: CGRect
}

export declare class VNVector extends NSObject implements NSCopying, NSSecureCoding {
	static readonly zeroVector: VNVector

	static unitVectorForVector(vector: VNVector): VNVector

	static vectorByMultiplyingVectorByScalar(vector: VNVector, scalar: number): VNVector

	static vectorByAddingVectorToVector(v1: VNVector, v2: VNVector): VNVector

	static vectorBySubtractingVectorFromVector(v1: VNVector, v2: VNVector): VNVector

	static dotProductOfVectorVector(v1: VNVector, v2: VNVector): number

	initWithXComponentYComponent(x: number, y: number): this

	initWithRTheta(r: number, theta: number): this

	initWithVectorHeadTail(head: VNPoint, tail: VNPoint): this

	readonly x: number

	readonly y: number

	readonly r: number

	readonly theta: number

	readonly length: number

	readonly squaredLength: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class VNVideoProcessorFrameRateCadence extends VNVideoProcessorCadence {
	initWithFrameRate(frameRate: number): this

	readonly frameRate: number
}

export declare class VNDetectFaceCaptureQualityRequest
	extends VNImageBasedRequest
	implements VNFaceObservationAccepting
{
	readonly results: NSArray

	get inputFaceObservations(): NSArray
	set inputFaceObservations(value: NSArray<interop.Object> | Array<interop.Object>)

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

export declare class VNTargetedImageRequest extends VNImageBasedRequest {
	initWithTargetedCVPixelBufferOptions(
		pixelBuffer: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCVPixelBufferOptionsCompletionHandler(
		pixelBuffer: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCVPixelBufferOrientationOptions(
		pixelBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCVPixelBufferOrientationOptionsCompletionHandler(
		pixelBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCGImageOptions(
		cgImage: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCGImageOptionsCompletionHandler(
		cgImage: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCGImageOrientationOptions(
		cgImage: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCGImageOrientationOptionsCompletionHandler(
		cgImage: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCIImageOptions(
		ciImage: CIImage,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCIImageOptionsCompletionHandler(
		ciImage: CIImage,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCIImageOrientationOptions(
		ciImage: CIImage,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCIImageOrientationOptionsCompletionHandler(
		ciImage: CIImage,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedImageURLOptions(
		imageURL: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedImageURLOptionsCompletionHandler(
		imageURL: NSURL,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedImageURLOrientationOptions(
		imageURL: NSURL,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedImageURLOrientationOptionsCompletionHandler(
		imageURL: NSURL,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedImageDataOptions(
		imageData: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedImageDataOptionsCompletionHandler(
		imageData: NSData,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedImageDataOrientationOptions(
		imageData: NSData,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedImageDataOrientationOptionsCompletionHandler(
		imageData: NSData,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCMSampleBufferOptions(
		sampleBuffer: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCMSampleBufferOptionsCompletionHandler(
		sampleBuffer: interop.Object,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	initWithTargetedCMSampleBufferOrientationOptions(
		sampleBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): this

	initWithTargetedCMSampleBufferOrientationOptionsCompletionHandler(
		sampleBuffer: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this
}

export declare class VNContoursObservation extends VNObservation {
	readonly contourCount: number

	contourAtIndexError(contourIndex: number, error: interop.PointerConvertible): VNContour

	readonly topLevelContourCount: number

	readonly topLevelContours: NSArray

	contourAtIndexPathError(indexPath: NSIndexPath, error: interop.PointerConvertible): VNContour

	readonly normalizedPath: interop.Object
}

export declare class VNClassificationObservation extends VNObservation {
	readonly identifier: string

	readonly hasPrecisionRecallCurve: boolean

	hasMinimumRecallForPrecision(minimumRecall: number, precision: number): boolean

	hasMinimumPrecisionForRecall(minimumPrecision: number, recall: number): boolean
}

export declare class VNRecognizeAnimalsRequest extends VNImageBasedRequest {
	static knownAnimalIdentifiersForRevisionError(
		requestRevision: number,
		error: interop.PointerConvertible,
	): NSArray

	readonly results: NSArray
}

export declare class VNRecognizedTextObservation extends VNRectangleObservation {
	topCandidates(maxCandidateCount: number): NSArray
}

export declare class VNTextObservation extends VNRectangleObservation {
	readonly characterBoxes: NSArray
}

export declare class VNCircle extends NSObject implements NSCopying, NSSecureCoding {
	static readonly zeroCircle: VNCircle

	initWithCenterRadius(center: VNPoint, radius: number): this

	initWithCenterDiameter(center: VNPoint, diameter: number): this

	containsPoint(point: VNPoint): boolean

	containsPointInCircumferentialRingOfWidth(point: VNPoint, ringWidth: number): boolean

	readonly center: VNPoint

	readonly radius: number

	readonly diameter: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class VNGenerateOpticalFlowRequest extends VNTargetedImageRequest {
	computationAccuracy: interop.Enum<typeof VNGenerateOpticalFlowRequestComputationAccuracy>

	outputPixelFormat: number

	readonly results: NSArray
}

export declare class VNDetectHumanHandPoseRequest extends VNImageBasedRequest {
	static supportedJointNamesForRevisionError(
		revision: number,
		error: interop.PointerConvertible,
	): NSArray

	static supportedJointsGroupNamesForRevisionError(
		revision: number,
		error: interop.PointerConvertible,
	): NSArray

	maximumHandCount: number

	readonly results: NSArray
}

export declare class VNImageHomographicAlignmentObservation extends VNImageAlignmentObservation {
	readonly warpTransform: simd_float3x3
}

export declare class VNRecognizedPoint extends VNDetectedPoint {
	readonly identifier: string
}

export declare class VNHomographicImageRegistrationRequest extends VNImageRegistrationRequest {
	readonly results: NSArray
}

export declare class VNCoreMLRequest extends VNImageBasedRequest {
	readonly model: VNCoreMLModel

	imageCropAndScaleOption: interop.Enum<typeof VNImageCropAndScaleOption>

	initWithModel(model: VNCoreMLModel): this

	initWithModelCompletionHandler(
		model: VNCoreMLModel,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this
}

export declare class VNDetectBarcodesRequest extends VNImageBasedRequest {
	static readonly supportedSymbologies: NSArray

	get symbologies(): NSArray
	set symbologies(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly results: NSArray
}

export declare class VNFaceLandmarks
	extends NSObject
	implements NSCopying, NSSecureCoding, VNRequestRevisionProviding
{
	readonly confidence: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly requestRevision: number
}

export declare class VNFaceLandmarks2D extends VNFaceLandmarks {
	readonly allPoints: VNFaceLandmarkRegion2D

	readonly faceContour: VNFaceLandmarkRegion2D

	readonly leftEye: VNFaceLandmarkRegion2D

	readonly rightEye: VNFaceLandmarkRegion2D

	readonly leftEyebrow: VNFaceLandmarkRegion2D

	readonly rightEyebrow: VNFaceLandmarkRegion2D

	readonly nose: VNFaceLandmarkRegion2D

	readonly noseCrest: VNFaceLandmarkRegion2D

	readonly medianLine: VNFaceLandmarkRegion2D

	readonly outerLips: VNFaceLandmarkRegion2D

	readonly innerLips: VNFaceLandmarkRegion2D

	readonly leftPupil: VNFaceLandmarkRegion2D

	readonly rightPupil: VNFaceLandmarkRegion2D
}

export declare class VNVideoProcessorTimeIntervalCadence extends VNVideoProcessorCadence {
	initWithTimeInterval(timeInterval: number): this

	readonly timeInterval: number
}

export declare class VNDetectFaceRectanglesRequest extends VNImageBasedRequest {
	readonly results: NSArray
}

export declare class VNDetectTextRectanglesRequest extends VNImageBasedRequest {
	reportCharacterBoxes: boolean

	readonly results: NSArray
}

export declare class VNGenerateAttentionBasedSaliencyImageRequest extends VNImageBasedRequest {
	readonly results: NSArray
}

export declare class VNBarcodeObservation extends VNRectangleObservation {
	readonly symbology: string

	readonly barcodeDescriptor: CIBarcodeDescriptor

	readonly payloadStringValue: string
}

export declare class VNPixelBufferObservation extends VNObservation {
	readonly pixelBuffer: interop.Object

	readonly featureName: string
}

export declare class VNFaceLandmarkRegion2D extends VNFaceLandmarkRegion {
	readonly normalizedPoints: interop.Pointer

	pointsInImageOfSize(imageSize: CGSize): interop.Pointer

	readonly precisionEstimatesPerPoint: NSArray
}

export declare class VNGeometryUtils extends NSObject {
	static boundingCircleForContourError(
		contour: VNContour,
		error: interop.PointerConvertible,
	): VNCircle

	static boundingCircleForPointsError(
		points: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): VNCircle

	static boundingCircleForSIMDPointsPointCountError(
		points: interop.PointerConvertible,
		pointCount: number,
		error: interop.PointerConvertible,
	): VNCircle

	static calculateAreaForContourOrientedAreaError(
		area: interop.PointerConvertible,
		contour: VNContour,
		orientedArea: boolean,
		error: interop.PointerConvertible,
	): boolean

	static calculatePerimeterForContourError(
		perimeter: interop.PointerConvertible,
		contour: VNContour,
		error: interop.PointerConvertible,
	): boolean
}

export declare class VNStatefulRequest extends VNImageBasedRequest {
	initWithFrameAnalysisSpacingCompletionHandler(
		frameAnalysisSpacing: CMTime,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this

	readonly minimumLatencyFrameCount: number

	readonly frameAnalysisSpacing: CMTime
}

export declare class VNRecognizeTextRequest
	extends VNImageBasedRequest
	implements VNRequestProgressProviding
{
	static supportedRecognitionLanguagesForTextRecognitionLevelRevisionError(
		recognitionLevel: interop.Enum<typeof VNRequestTextRecognitionLevel>,
		requestRevision: number,
		error: interop.PointerConvertible,
	): NSArray

	get recognitionLanguages(): NSArray
	set recognitionLanguages(value: NSArray<interop.Object> | Array<interop.Object>)

	get customWords(): NSArray
	set customWords(value: NSArray<interop.Object> | Array<interop.Object>)

	recognitionLevel: interop.Enum<typeof VNRequestTextRecognitionLevel>

	usesLanguageCorrection: boolean

	minimumTextHeight: number

	readonly results: NSArray

	progressHandler: (p1: VNRequest, p2: number, p3: NSError) => void

	readonly indeterminate: boolean

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

export declare class VNRequest extends NSObject implements NSCopying {
	init(): this

	initWithCompletionHandler(completionHandler: (p1: VNRequest, p2: NSError) => void | null): this

	preferBackgroundProcessing: boolean

	usesCPUOnly: boolean

	readonly results: NSArray

	readonly completionHandler: (p1: VNRequest, p2: NSError) => void

	revision: number

	static readonly supportedRevisions: NSIndexSet

	static readonly defaultRevision: number

	static readonly currentRevision: number

	cancel(): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class VNTrackObjectRequest extends VNTrackingRequest {
	initWithDetectedObjectObservation(observation: VNDetectedObjectObservation): this

	initWithDetectedObjectObservationCompletionHandler(
		observation: VNDetectedObjectObservation,
		completionHandler: (p1: VNRequest, p2: NSError) => void | null,
	): this
}

export declare class VNGenerateImageFeaturePrintRequest extends VNImageBasedRequest {
	imageCropAndScaleOption: interop.Enum<typeof VNImageCropAndScaleOption>

	readonly results: NSArray
}

export declare class VNDetectHumanBodyPoseRequest extends VNImageBasedRequest {
	static supportedJointNamesForRevisionError(
		revision: number,
		error: interop.PointerConvertible,
	): NSArray

	static supportedJointsGroupNamesForRevisionError(
		revision: number,
		error: interop.PointerConvertible,
	): NSArray

	readonly results: NSArray
}

export declare class VNVideoProcessor extends NSObject {
	initWithURL(videoURL: NSURL): this

	addRequestProcessingOptionsError(
		request: VNRequest,
		processingOptions: VNVideoProcessorRequestProcessingOptions,
		error: interop.PointerConvertible,
	): boolean

	addRequestWithProcessingOptionsError(
		request: VNRequest,
		processingOptions:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	removeRequestError(request: VNRequest, error: interop.PointerConvertible): boolean

	analyzeTimeRangeError(timeRange: CMTimeRange, error: interop.PointerConvertible): boolean

	analyzeWithTimeRangeError(timeRange: CMTimeRange, error: interop.PointerConvertible): boolean

	cancel(): void
}
