import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSDictionary,
	NSError,
	NSFastEnumeration,
	NSNumber,
	NSProgress,
	NSSecureCoding,
	NSSet,
	NSURL,
	_NSRange,
} from './Foundation'

import type { MTLCommandBuffer, MTLDevice } from './Metal'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { CGImagePropertyOrientation } from './ImageIO'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const MLModelErrorDomain: string

export declare const MLModelAuthorKey: string

export declare const MLModelVersionStringKey: string

export declare const MLModelDescriptionKey: string

export declare const MLFeatureValueImageOptionCropAndScale: string

export declare const MLFeatureValueImageOptionCropRect: string

export declare const MLModelLicenseKey: string

export declare const MLModelCreatorDefinedKey: string

export declare const MLModelCollectionDidChangeNotification: string

export declare const MLUpdateProgressEvent: {
	TrainingBegin: 1
	EpochEnd: 2
	MiniBatchEnd: 4
}

export declare const MLMultiArrayDataType: {
	Double: 65600
	Float64: 65600
	Float32: 65568
	Float: 65568
	Int32: 131104
}

export declare const MLFeatureType: {
	Invalid: 0
	Int64: 1
	Double: 2
	String: 3
	Image: 4
	MultiArray: 5
	Dictionary: 6
	Sequence: 7
}

export declare const MLModelError: {
	Generic: 0
	FeatureType: 1
	IO: 3
	CustomLayer: 4
	CustomModel: 5
	Update: 6
	Parameters: 7
	ModelDecryptionKeyFetch: 8
	ModelDecryption: 9
	ModelCollection: 10
}

export declare const MLComputeUnits: {
	CPUOnly: 0
	CPUAndGPU: 1
	All: 2
}

export declare const MLTaskState: {
	Suspended: 1
	Running: 2
	Cancelling: 3
	Completed: 4
	Failed: 5
}

export declare const MLMultiArrayShapeConstraintType: {
	Unspecified: 1
	Enumerated: 2
	Range: 3
}

export declare const MLImageSizeConstraintType: {
	Unspecified: 0
	Enumerated: 2
	Range: 3
}

export declare interface MLWritable extends NSObjectProtocol {
	writeToURLError(url: NSURL, error: interop.PointerConvertible): boolean
}

export declare class MLWritable extends NativeObject implements MLWritable {}

export declare interface MLCustomModel {
	initWithModelDescriptionParameterDictionaryError(
		modelDescription: MLModelDescription,
		parameters:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): this

	predictionFromFeaturesOptionsError(
		input: MLFeatureProvider,
		options: MLPredictionOptions,
		error: interop.PointerConvertible,
	): MLFeatureProvider

	predictionsFromBatchOptionsError?(
		inputBatch: MLBatchProvider,
		options: MLPredictionOptions,
		error: interop.PointerConvertible,
	): MLBatchProvider
}

export declare class MLCustomModel extends NativeObject implements MLCustomModel {}

export declare interface MLCustomLayer {
	initWithParameterDictionaryError(
		parameters:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): this

	setWeightDataError(
		weights: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	outputShapesForInputShapesError(
		inputShapes: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): NSArray

	evaluateOnCPUWithInputsOutputsError(
		inputs: NSArray<interop.Object> | Array<interop.Object>,
		outputs: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean

	encodeToCommandBufferInputsOutputsError?(
		commandBuffer: MTLCommandBuffer,
		inputs: NSArray<interop.Object> | Array<interop.Object>,
		outputs: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): boolean
}

export declare class MLCustomLayer extends NativeObject implements MLCustomLayer {}

export declare interface MLFeatureProvider {
	readonly featureNames: NSSet

	featureValueForName(featureName: string): MLFeatureValue
}

export declare class MLFeatureProvider extends NativeObject implements MLFeatureProvider {}

export declare interface MLBatchProvider {
	readonly count: number

	featuresAtIndex(index: number): MLFeatureProvider
}

export declare class MLBatchProvider extends NativeObject implements MLBatchProvider {}

export declare class MLModelCollectionEntry extends NSObject {
	readonly modelIdentifier: string

	readonly modelURL: NSURL

	isEqualToModelCollectionEntry(entry: MLModelCollectionEntry): boolean
}

export declare class MLParameterDescription extends NSObject implements NSSecureCoding {
	readonly key: MLParameterKey

	readonly defaultValue: interop.Object

	readonly numericConstraint: MLNumericConstraint

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLNumericConstraint extends NSObject implements NSSecureCoding {
	readonly minNumber: NSNumber

	readonly maxNumber: NSNumber

	readonly enumeratedNumbers: NSSet

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLUpdateContext extends NSObject {
	readonly task: MLUpdateTask

	readonly model: MLModel

	readonly event: interop.Enum<typeof MLUpdateProgressEvent>

	readonly metrics: NSDictionary

	readonly parameters: NSDictionary
}

export declare class MLTask extends NSObject {
	readonly taskIdentifier: string

	readonly state: interop.Enum<typeof MLTaskState>

	readonly error: NSError

	resume(): void

	cancel(): void
}

export declare class MLKey extends NSObject implements NSCopying, NSSecureCoding {
	readonly name: string

	readonly scope: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLModel extends NSObject {
	readonly modelDescription: MLModelDescription

	readonly configuration: MLModelConfiguration

	static modelWithContentsOfURLError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static modelWithContentsOfURLConfigurationError<This extends abstract new (...args: any) => any>(
		this: This,
		url: NSURL,
		configuration: MLModelConfiguration,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static loadContentsOfURLConfigurationCompletionHandler(
		url: NSURL,
		configuration: MLModelConfiguration,
		handler: (p1: MLModel, p2: NSError) => void | null,
	): void

	predictionFromFeaturesError(
		input: MLFeatureProvider,
		error: interop.PointerConvertible,
	): MLFeatureProvider

	predictionFromFeaturesOptionsError(
		input: MLFeatureProvider,
		options: MLPredictionOptions,
		error: interop.PointerConvertible,
	): MLFeatureProvider

	predictionsFromBatchError(
		inputBatch: MLBatchProvider,
		error: interop.PointerConvertible,
	): MLBatchProvider

	predictionsFromBatchOptionsError(
		inputBatch: MLBatchProvider,
		options: MLPredictionOptions,
		error: interop.PointerConvertible,
	): MLBatchProvider

	parameterValueForKeyError(key: MLParameterKey, error: interop.PointerConvertible): interop.Object

	static compileModelAtURLError(modelURL: NSURL, error: interop.PointerConvertible): NSURL
}

export declare class MLModelConfiguration extends NSObject implements NSCopying, NSSecureCoding {
	computeUnits: interop.Enum<typeof MLComputeUnits>

	allowLowPrecisionAccumulationOnGPU: boolean

	preferredMetalDevice: MTLDevice

	get parameters(): NSDictionary
	set parameters(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLArrayBatchProvider extends NSObject implements MLBatchProvider {
	readonly array: NSArray

	initWithFeatureProviderArray(array: NSArray<interop.Object> | Array<interop.Object>): this

	initWithDictionaryError(
		dictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): this

	readonly count: number

	featuresAtIndex(index: number): MLFeatureProvider
}

export declare class MLDictionaryFeatureProvider
	extends NSObject
	implements MLFeatureProvider, NSFastEnumeration, NSSecureCoding
{
	readonly dictionary: NSDictionary

	initWithDictionaryError(
		dictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): this

	objectForKeyedSubscript(featureName: string): MLFeatureValue

	readonly featureNames: NSSet

	featureValueForName(featureName: string): MLFeatureValue

	countByEnumeratingWithStateObjectsCount(
		state: interop.PointerConvertible,
		buffer: interop.PointerConvertible,
		len: number,
	): number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly [Symbol.iterator]: () => Iterator<any>
}

export declare class MLMultiArrayShapeConstraint extends NSObject implements NSSecureCoding {
	readonly type: interop.Enum<typeof MLMultiArrayShapeConstraintType>

	readonly sizeRangeForDimension: NSArray

	readonly enumeratedShapes: NSArray

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLMultiArrayConstraint extends NSObject implements NSSecureCoding {
	readonly shape: NSArray

	readonly dataType: interop.Enum<typeof MLMultiArrayDataType>

	readonly shapeConstraint: MLMultiArrayShapeConstraint

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLDictionaryConstraint extends NSObject implements NSSecureCoding {
	readonly keyType: interop.Enum<typeof MLFeatureType>

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLImageSizeConstraint extends NSObject implements NSSecureCoding {
	readonly type: interop.Enum<typeof MLImageSizeConstraintType>

	readonly pixelsWideRange: _NSRange

	readonly pixelsHighRange: _NSRange

	readonly enumeratedImageSizes: NSArray

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLFeatureValue extends NSObject implements NSCopying, NSSecureCoding {
	readonly type: interop.Enum<typeof MLFeatureType>

	readonly undefined: boolean

	readonly int64Value: number

	readonly doubleValue: number

	readonly stringValue: string

	readonly multiArrayValue: MLMultiArray

	readonly dictionaryValue: NSDictionary

	readonly imageBufferValue: interop.Object

	readonly sequenceValue: MLSequence

	static featureValueWithInt64<This extends abstract new (...args: any) => any>(
		this: This,
		value: number,
	): InstanceType<This>

	static featureValueWithDouble<This extends abstract new (...args: any) => any>(
		this: This,
		value: number,
	): InstanceType<This>

	static featureValueWithString<This extends abstract new (...args: any) => any>(
		this: This,
		value: string,
	): InstanceType<This>

	static featureValueWithMultiArray<This extends abstract new (...args: any) => any>(
		this: This,
		value: MLMultiArray,
	): InstanceType<This>

	static featureValueWithPixelBuffer<This extends abstract new (...args: any) => any>(
		this: This,
		value: interop.Object,
	): InstanceType<This>

	static featureValueWithSequence<This extends abstract new (...args: any) => any>(
		this: This,
		sequence: MLSequence,
	): InstanceType<This>

	static undefinedFeatureValueWithType<This extends abstract new (...args: any) => any>(
		this: This,
		type: interop.Enum<typeof MLFeatureType>,
	): InstanceType<This>

	static featureValueWithDictionaryError<This extends abstract new (...args: any) => any>(
		this: This,
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		error: interop.PointerConvertible,
	): InstanceType<This>

	isEqualToFeatureValue(value: MLFeatureValue): boolean

	isUndefined(): boolean

	static featureValueWithImageAtURLPixelsWidePixelsHighPixelFormatTypeOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		url: NSURL,
		pixelsWide: number,
		pixelsHigh: number,
		pixelFormatType: number,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithImageAtURLConstraintOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		url: NSURL,
		constraint: MLImageConstraint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithCGImagePixelsWidePixelsHighPixelFormatTypeOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		cgImage: interop.Object,
		pixelsWide: number,
		pixelsHigh: number,
		pixelFormatType: number,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithCGImageConstraintOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		cgImage: interop.Object,
		constraint: MLImageConstraint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithImageAtURLOrientationPixelsWidePixelsHighPixelFormatTypeOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		url: NSURL,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		pixelsWide: number,
		pixelsHigh: number,
		pixelFormatType: number,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithImageAtURLOrientationConstraintOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		url: NSURL,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		constraint: MLImageConstraint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithCGImageOrientationPixelsWidePixelsHighPixelFormatTypeOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		cgImage: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		pixelsWide: number,
		pixelsHigh: number,
		pixelFormatType: number,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static featureValueWithCGImageOrientationConstraintOptionsError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		cgImage: interop.Object,
		orientation: interop.Enum<typeof CGImagePropertyOrientation>,
		constraint: MLImageConstraint,
		options:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		error: interop.PointerConvertible,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLMultiArray extends NSObject implements NSSecureCoding {
	readonly dataPointer: interop.Pointer

	readonly dataType: interop.Enum<typeof MLMultiArrayDataType>

	readonly shape: NSArray

	readonly strides: NSArray

	readonly count: number

	initWithShapeDataTypeError(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MLMultiArrayDataType>,
		error: interop.PointerConvertible,
	): this

	initWithDataPointerShapeDataTypeStridesDeallocatorError(
		dataPointer: interop.PointerConvertible,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MLMultiArrayDataType>,
		strides: NSArray<interop.Object> | Array<interop.Object>,
		deallocator: (p1: interop.PointerConvertible) => void | null,
		error: interop.PointerConvertible,
	): this

	static multiArrayByConcatenatingMultiArraysAlongAxisDataType<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		multiArrays: NSArray<interop.Object> | Array<interop.Object>,
		axis: number,
		dataType: interop.Enum<typeof MLMultiArrayDataType>,
	): InstanceType<This>

	objectAtIndexedSubscript(idx: number): NSNumber

	objectForKeyedSubscript(key: NSArray<interop.Object> | Array<interop.Object>): NSNumber

	setObjectAtIndexedSubscript(obj: NSNumber, idx: number): void

	setObjectForKeyedSubscript(
		obj: NSNumber,
		key: NSArray<interop.Object> | Array<interop.Object>,
	): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLMetricKey extends MLKey {
	static readonly lossValue: MLMetricKey

	static readonly epochIndex: MLMetricKey

	static readonly miniBatchIndex: MLMetricKey
}

export declare class MLSequenceConstraint extends NSObject implements NSSecureCoding {
	readonly valueDescription: MLFeatureDescription

	readonly countRange: _NSRange

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLImageSize extends NSObject implements NSSecureCoding {
	readonly pixelsWide: number

	readonly pixelsHigh: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLUpdateProgressHandlers extends NSObject {
	initForEventsProgressHandlerCompletionHandler(
		interestedEvents: interop.Enum<typeof MLUpdateProgressEvent>,
		progressHandler: (p1: MLUpdateContext) => void | null,
		completionHandler: (p1: MLUpdateContext) => void,
	): this
}

export declare class MLUpdateTask extends MLTask {
	static updateTaskForModelAtURLTrainingDataConfigurationCompletionHandlerError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		modelURL: NSURL,
		trainingData: MLBatchProvider,
		configuration: MLModelConfiguration | null,
		completionHandler: (p1: MLUpdateContext) => void,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static updateTaskForModelAtURLTrainingDataCompletionHandlerError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		modelURL: NSURL,
		trainingData: MLBatchProvider,
		completionHandler: (p1: MLUpdateContext) => void,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static updateTaskForModelAtURLTrainingDataConfigurationProgressHandlersError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		modelURL: NSURL,
		trainingData: MLBatchProvider,
		configuration: MLModelConfiguration | null,
		progressHandlers: MLUpdateProgressHandlers,
		error: interop.PointerConvertible,
	): InstanceType<This>

	static updateTaskForModelAtURLTrainingDataProgressHandlersError<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		modelURL: NSURL,
		trainingData: MLBatchProvider,
		progressHandlers: MLUpdateProgressHandlers,
		error: interop.PointerConvertible,
	): InstanceType<This>

	resumeWithParameters(
		updateParameters:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void
}

export declare class MLPredictionOptions extends NSObject {
	usesCPUOnly: boolean

	get outputBackings(): NSDictionary
	set outputBackings(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)
}

export declare class MLModelCollection extends NSObject {
	readonly identifier: string

	readonly entries: NSDictionary

	readonly deploymentID: string

	static beginAccessingModelCollectionWithIdentifierCompletionHandler(
		identifier: string,
		completionHandler: (p1: MLModelCollection, p2: NSError) => void | null,
	): NSProgress

	static endAccessingModelCollectionWithIdentifierCompletionHandler(
		identifier: string,
		completionHandler: (p1: boolean, p2: NSError) => void | null,
	): void
}

export declare class MLImageConstraint extends NSObject implements NSSecureCoding {
	readonly pixelsHigh: number

	readonly pixelsWide: number

	readonly pixelFormatType: number

	readonly sizeConstraint: MLImageSizeConstraint

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLModelDescription extends NSObject implements NSSecureCoding {
	readonly inputDescriptionsByName: NSDictionary

	readonly outputDescriptionsByName: NSDictionary

	readonly predictedFeatureName: string

	readonly predictedProbabilitiesName: string

	readonly metadata: NSDictionary

	readonly classLabels: NSArray

	readonly isUpdatable: boolean

	readonly trainingInputDescriptionsByName: NSDictionary

	readonly parameterDescriptionsByKey: NSDictionary

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLFeatureDescription extends NSObject implements NSCopying, NSSecureCoding {
	readonly name: string

	readonly type: interop.Enum<typeof MLFeatureType>

	readonly optional: boolean

	isAllowedValue(value: MLFeatureValue): boolean

	isOptional(): boolean

	readonly multiArrayConstraint: MLMultiArrayConstraint

	readonly imageConstraint: MLImageConstraint

	readonly dictionaryConstraint: MLDictionaryConstraint

	readonly sequenceConstraint: MLSequenceConstraint

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MLParameterKey extends MLKey {
	static readonly learningRate: MLParameterKey

	static readonly momentum: MLParameterKey

	static readonly miniBatchSize: MLParameterKey

	static readonly beta1: MLParameterKey

	static readonly beta2: MLParameterKey

	static readonly eps: MLParameterKey

	static readonly epochs: MLParameterKey

	static readonly shuffle: MLParameterKey

	static readonly seed: MLParameterKey

	static readonly numberOfNeighbors: MLParameterKey

	static readonly linkedModelFileName: MLParameterKey

	static readonly linkedModelSearchPath: MLParameterKey

	static readonly weights: MLParameterKey

	static readonly biases: MLParameterKey

	scopedTo(scope: string): MLParameterKey
}

export declare class MLSequence extends NSObject implements NSSecureCoding {
	readonly type: interop.Enum<typeof MLFeatureType>

	static emptySequenceWithType<This extends abstract new (...args: any) => any>(
		this: This,
		type: interop.Enum<typeof MLFeatureType>,
	): InstanceType<This>

	static sequenceWithStringArray<This extends abstract new (...args: any) => any>(
		this: This,
		stringValues: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	readonly stringValues: NSArray

	static sequenceWithInt64Array<This extends abstract new (...args: any) => any>(
		this: This,
		int64Values: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	readonly int64Values: NSArray

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
