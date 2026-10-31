/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const MPSGraphResizeMode: {
	Nearest: 0
	Bilinear: 1
}

declare const MPSGraphLossReductionType: {
	Axis: 0
	Sum: 1
}

declare const MPSGraphOptions: {
	None: 0
	SynchronizeResults: 1
	Verbose: 2
	Default: 1
}

declare const MPSGraphPaddingMode: {
	Constant: 0
	Reflect: 1
	Symmetric: 2
}

declare const MPSGraphPaddingStyle: {
	Explicit: 0
	TF_VALID: 1
	TF_SAME: 2
}

declare const MPSGraphTensorNamedDataLayout: {
	NCHW: 0
	NHWC: 1
	OIHW: 2
	HWIO: 3
	CHW: 4
	HWC: 5
	HW: 6
}

declare const MPSGraphDeviceType: {
	MPSGraphDeviceTypeMetal: 0
}

declare const MPSGraphPoolingReturnIndicesMode: {
	None: 0
	GlobalFlatten1D: 1
	GlobalFlatten2D: 2
	GlobalFlatten3D: 3
	GlobalFlatten4D: 4
	LocalFlatten1D: 5
	LocalFlatten2D: 6
	LocalFlatten3D: 7
	LocalFlatten4D: 8
}

declare const MPSGraphScatterMode: {
	Add: 0
	Sub: 1
	Mul: 2
	Div: 3
	Min: 4
	Max: 5
	Set: 6
}

declare class MPSGraphDepthwiseConvolution2DOpDescriptor extends NSObject implements NSCopying {
	strideInX: number

	strideInY: number

	dilationRateInX: number

	dilationRateInY: number

	paddingLeft: number

	paddingRight: number

	paddingTop: number

	paddingBottom: number

	paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>

	dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>

	weightsLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>

	static descriptorWithStrideInXStrideInYDilationRateInXDilationRateInYPaddingLeftPaddingRightPaddingTopPaddingBottomPaddingStyleDataLayoutWeightsLayout<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		strideInX: number,
		strideInY: number,
		dilationRateInX: number,
		dilationRateInY: number,
		paddingLeft: number,
		paddingRight: number,
		paddingTop: number,
		paddingBottom: number,
		paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>,
		dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
		weightsLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
	): InstanceType<This>

	static descriptorWithDataLayoutWeightsLayout<This extends abstract new (...args: any) => any>(
		this: This,
		dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
		weightsLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
	): InstanceType<This>

	setExplicitPaddingWithPaddingLeftPaddingRightPaddingTopPaddingBottom(
		paddingLeft: number,
		paddingRight: number,
		paddingTop: number,
		paddingBottom: number,
	): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class MPSGraphConvolution2DOpDescriptor extends NSObject implements NSCopying {
	strideInX: number

	strideInY: number

	dilationRateInX: number

	dilationRateInY: number

	paddingLeft: number

	paddingRight: number

	paddingTop: number

	paddingBottom: number

	paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>

	dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>

	weightsLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>

	groups: number

	static descriptorWithStrideInXStrideInYDilationRateInXDilationRateInYGroupsPaddingLeftPaddingRightPaddingTopPaddingBottomPaddingStyleDataLayoutWeightsLayout<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		strideInX: number,
		strideInY: number,
		dilationRateInX: number,
		dilationRateInY: number,
		groups: number,
		paddingLeft: number,
		paddingRight: number,
		paddingTop: number,
		paddingBottom: number,
		paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>,
		dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
		weightsLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
	): InstanceType<This>

	static descriptorWithStrideInXStrideInYDilationRateInXDilationRateInYGroupsPaddingStyleDataLayoutWeightsLayout<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		strideInX: number,
		strideInY: number,
		dilationRateInX: number,
		dilationRateInY: number,
		groups: number,
		paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>,
		dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
		weightsLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
	): InstanceType<This>

	setExplicitPaddingWithPaddingLeftPaddingRightPaddingTopPaddingBottom(
		paddingLeft: number,
		paddingRight: number,
		paddingTop: number,
		paddingBottom: number,
	): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class MPSGraph extends NSObject {
	options: interop.Enum<typeof MPSGraphOptions>

	static new<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	init(): this

	readonly placeholderTensors: NSArray

	runWithFeedsTargetTensorsTargetOperations(
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetTensors: NSArray<interop.Object> | Array<interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSDictionary

	runWithMTLCommandQueueFeedsTargetTensorsTargetOperations(
		commandQueue: MTLCommandQueue,
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetTensors: NSArray<interop.Object> | Array<interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
	): NSDictionary

	runWithMTLCommandQueueFeedsTargetOperationsResultsDictionary(
		commandQueue: MTLCommandQueue,
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
		resultsDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	runAsyncWithFeedsTargetTensorsTargetOperationsExecutionDescriptor(
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetTensors: NSArray<interop.Object> | Array<interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
		executionDescriptor: MPSGraphExecutionDescriptor | null,
	): NSDictionary

	runAsyncWithMTLCommandQueueFeedsTargetTensorsTargetOperationsExecutionDescriptor(
		commandQueue: MTLCommandQueue,
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetTensors: NSArray<interop.Object> | Array<interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
		executionDescriptor: MPSGraphExecutionDescriptor | null,
	): NSDictionary

	runAsyncWithMTLCommandQueueFeedsTargetOperationsResultsDictionaryExecutionDescriptor(
		commandQueue: MTLCommandQueue,
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
		resultsDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		executionDescriptor: MPSGraphExecutionDescriptor | null,
	): void

	encodeToCommandBufferFeedsTargetTensorsTargetOperationsExecutionDescriptor(
		commandBuffer: MPSCommandBuffer,
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetTensors: NSArray<interop.Object> | Array<interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
		executionDescriptor: MPSGraphExecutionDescriptor | null,
	): NSDictionary

	encodeToCommandBufferFeedsTargetOperationsResultsDictionaryExecutionDescriptor(
		commandBuffer: MPSCommandBuffer,
		feeds: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		targetOperations: NSArray<interop.Object> | Array<interop.Object> | null,
		resultsDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		executionDescriptor: MPSGraphExecutionDescriptor | null,
	): void

	gradientForPrimaryTensorWithTensorsName(
		primaryTensor: MPSGraphTensor,
		tensors: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): NSDictionary

	reLUWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	reLUGradientWithIncomingGradientSourceTensorName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	sigmoidWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	sigmoidGradientWithIncomingGradientSourceTensorName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	softMaxWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	softMaxGradientWithIncomingGradientSourceTensorAxisName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	identityWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	exponentWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	exponentBase2WithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	exponentBase10WithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	logarithmWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	logarithmBase2WithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	logarithmBase10WithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	squareWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	squareRootWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	reverseSquareRootWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	reciprocalWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	absoluteWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	negativeWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	signWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	signbitWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	ceilWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	floorWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	roundWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	rintWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	sinWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	cosWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	tanWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	sinhWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	coshWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	tanhWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	asinWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	acosWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	atanWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	asinhWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	acoshWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	atanhWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	notWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	isInfiniteWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	isFiniteWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	isNaNWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	erfWithTensorName(tensor: MPSGraphTensor, name: string | null): MPSGraphTensor

	additionWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	subtractionWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	multiplicationWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	divisionWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	moduloWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	powerWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	minimumWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	maximumWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	equalWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	notEqualWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	lessThanWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	lessThanOrEqualToWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	greaterThanWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	greaterThanOrEqualToWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	logicalANDWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	logicalORWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	logicalNANDWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	logicalNORWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	logicalXORWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	logicalXNORWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	atan2WithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	selectWithPredicateTensorTruePredicateTensorFalsePredicateTensorName(
		predicateTensor: MPSGraphTensor,
		truePredicateTensor: MPSGraphTensor,
		falseSelectTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	clampWithTensorMinValueTensorMaxValueTensorName(
		tensor: MPSGraphTensor,
		minValueTensor: MPSGraphTensor,
		maxValueTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	divisionNoNaNWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	floorModuloWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	convolution2DWithSourceTensorWeightsTensorDescriptorName(
		source: MPSGraphTensor,
		weights: MPSGraphTensor,
		descriptor: MPSGraphConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	convolution2DDataGradientWithIncomingGradientTensorWeightsTensorOutputShapeForwardConvolutionDescriptorName(
		incomingGradient: MPSGraphTensor,
		weights: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		forwardConvolutionDescriptor: MPSGraphConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	convolution2DWeightsGradientWithIncomingGradientTensorSourceTensorOutputShapeForwardConvolutionDescriptorName(
		incomingGradient: MPSGraphTensor,
		source: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		forwardConvolutionDescriptor: MPSGraphConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	convolutionTranspose2DWithSourceTensorWeightsTensorOutputShapeDescriptorName(
		source: MPSGraphTensor,
		weights: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	convolutionTranspose2DDataGradientWithIncomingGradientTensorWeightsTensorOutputShapeForwardConvolutionDescriptorName(
		incomingGradient: MPSGraphTensor,
		weights: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		forwardConvolutionDescriptor: MPSGraphConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	convolutionTranspose2DWeightsGradientWithIncomingGradientTensorSourceTensorOutputShapeForwardConvolutionDescriptorName(
		incomingGradientTensor: MPSGraphTensor,
		source: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		forwardConvolutionDescriptor: MPSGraphConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	depthwiseConvolution2DWithSourceTensorWeightsTensorDescriptorName(
		source: MPSGraphTensor,
		weights: MPSGraphTensor,
		descriptor: MPSGraphDepthwiseConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	depthwiseConvolution2DDataGradientWithIncomingGradientTensorWeightsTensorOutputShapeDescriptorName(
		incomingGradient: MPSGraphTensor,
		weights: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphDepthwiseConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	depthwiseConvolution2DWeightsGradientWithIncomingGradientTensorSourceTensorOutputShapeDescriptorName(
		incomingGradient: MPSGraphTensor,
		source: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphDepthwiseConvolution2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	depthwiseConvolution3DWeightsGradientWithIncomingGradientTensorSourceTensorOutputShapeDescriptorName(
		incomingGradient: MPSGraphTensor,
		source: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphDepthwiseConvolution3DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	gatherNDWithUpdatesTensorIndicesTensorBatchDimensionsName(
		updatesTensor: MPSGraphTensor,
		indicesTensor: MPSGraphTensor,
		batchDimensions: number,
		name: string | null,
	): MPSGraphTensor

	gatherWithUpdatesTensorIndicesTensorAxisBatchDimensionsName(
		updatesTensor: MPSGraphTensor,
		indicesTensor: MPSGraphTensor,
		axis: number,
		batchDimensions: number,
		name: string | null,
	): MPSGraphTensor

	imToColWithSourceTensorDescriptorName(
		source: MPSGraphTensor,
		descriptor: MPSGraphImToColOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	colToImWithSourceTensorOutputShapeDescriptorName(
		source: MPSGraphTensor,
		outputShape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphImToColOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	softMaxCrossEntropyWithSourceTensorLabelsTensorAxisReductionTypeName(
		sourceTensor: MPSGraphTensor,
		labelsTensor: MPSGraphTensor,
		axis: number,
		reductionType: interop.Enum<typeof MPSGraphLossReductionType>,
		name: string | null,
	): MPSGraphTensor

	softMaxCrossEntropyGradientWithIncomingGradientTensorSourceTensorLabelsTensorAxisReductionTypeName(
		gradientTensor: MPSGraphTensor,
		sourceTensor: MPSGraphTensor,
		labelsTensor: MPSGraphTensor,
		axis: number,
		reductionType: interop.Enum<typeof MPSGraphLossReductionType>,
		name: string | null,
	): MPSGraphTensor

	matrixMultiplicationWithPrimaryTensorSecondaryTensorName(
		primaryTensor: MPSGraphTensor,
		secondaryTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	placeholderWithShapeDataTypeName(
		shape: NSArray<interop.Object> | Array<interop.Object> | null,
		dataType: interop.Enum<typeof MPSDataType>,
		name: string | null,
	): MPSGraphTensor

	placeholderWithShapeName(
		shape: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	constantWithDataShapeDataType(
		data: NSData,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MPSDataType>,
	): MPSGraphTensor

	constantWithScalarDataType(
		scalar: number,
		dataType: interop.Enum<typeof MPSDataType>,
	): MPSGraphTensor

	constantWithScalarShapeDataType(
		scalar: number,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MPSDataType>,
	): MPSGraphTensor

	variableWithDataShapeDataTypeName(
		data: NSData,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MPSDataType>,
		name: string | null,
	): MPSGraphTensor

	readVariableName(variable: MPSGraphTensor, name: string | null): MPSGraphTensor

	assignVariableWithValueOfTensorName(
		variable: MPSGraphTensor,
		tensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphOperation

	meanOfTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	varianceOfTensorMeanTensorAxesName(
		tensor: MPSGraphTensor,
		meanTensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	varianceOfTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	normalizationWithTensorMeanTensorVarianceTensorGammaTensorBetaTensorEpsilonName(
		tensor: MPSGraphTensor,
		mean: MPSGraphTensor,
		variance: MPSGraphTensor,
		gamma: MPSGraphTensor | null,
		beta: MPSGraphTensor | null,
		epsilon: number,
		name: string | null,
	): MPSGraphTensor

	normalizationGammaGradientWithIncomingGradientTensorSourceTensorMeanTensorVarianceTensorReductionAxesEpsilonName(
		incomingGradientTensor: MPSGraphTensor,
		sourceTensor: MPSGraphTensor,
		meanTensor: MPSGraphTensor,
		varianceTensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object>,
		epsilon: number,
		name: string | null,
	): MPSGraphTensor

	normalizationBetaGradientWithIncomingGradientTensorSourceTensorReductionAxesName(
		incomingGradientTensor: MPSGraphTensor,
		sourceTensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	normalizationGradientWithIncomingGradientTensorSourceTensorMeanTensorVarianceTensorGammaTensorGammaGradientTensorBetaGradientTensorReductionAxesEpsilonName(
		incomingGradientTensor: MPSGraphTensor,
		sourceTensor: MPSGraphTensor,
		meanTensor: MPSGraphTensor,
		varianceTensor: MPSGraphTensor,
		gamma: MPSGraphTensor | null,
		gammaGradient: MPSGraphTensor | null,
		betaGradient: MPSGraphTensor | null,
		axes: NSArray<interop.Object> | Array<interop.Object>,
		epsilon: number,
		name: string | null,
	): MPSGraphTensor

	oneHotWithIndicesTensorDepthAxisDataTypeOnValueOffValueName(
		indicesTensor: MPSGraphTensor,
		depth: number,
		axis: number,
		dataType: interop.Enum<typeof MPSDataType>,
		onValue: number,
		offValue: number,
		name: string | null,
	): MPSGraphTensor

	oneHotWithIndicesTensorDepthDataTypeOnValueOffValueName(
		indicesTensor: MPSGraphTensor,
		depth: number,
		dataType: interop.Enum<typeof MPSDataType>,
		onValue: number,
		offValue: number,
		name: string | null,
	): MPSGraphTensor

	oneHotWithIndicesTensorDepthAxisDataTypeName(
		indicesTensor: MPSGraphTensor,
		depth: number,
		axis: number,
		dataType: interop.Enum<typeof MPSDataType>,
		name: string | null,
	): MPSGraphTensor

	oneHotWithIndicesTensorDepthAxisName(
		indicesTensor: MPSGraphTensor,
		depth: number,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	oneHotWithIndicesTensorDepthDataTypeName(
		indicesTensor: MPSGraphTensor,
		depth: number,
		dataType: interop.Enum<typeof MPSDataType>,
		name: string | null,
	): MPSGraphTensor

	oneHotWithIndicesTensorDepthName(
		indicesTensor: MPSGraphTensor,
		depth: number,
		name: string | null,
	): MPSGraphTensor

	stochasticGradientDescentWithLearningRateTensorValuesTensorGradientTensorName(
		learningRateTensor: MPSGraphTensor,
		valuesTensor: MPSGraphTensor,
		gradientTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	applyStochasticGradientDescentWithLearningRateTensorVariableGradientTensorName(
		learningRateTensor: MPSGraphTensor,
		variable: MPSGraphVariableOp,
		gradientTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphOperation

	adamWithLearningRateTensorBeta1TensorBeta2TensorEpsilonTensorBeta1PowerTensorBeta2PowerTensorValuesTensorMomentumTensorVelocityTensorMaximumVelocityTensorGradientTensorName(
		learningRateTensor: MPSGraphTensor,
		beta1Tensor: MPSGraphTensor,
		beta2Tensor: MPSGraphTensor,
		epsilonTensor: MPSGraphTensor,
		beta1PowerTensor: MPSGraphTensor,
		beta2PowerTensor: MPSGraphTensor,
		valuesTensor: MPSGraphTensor,
		momentumTensor: MPSGraphTensor,
		velocityTensor: MPSGraphTensor,
		maximumVelocityTensor: MPSGraphTensor | null,
		gradientTensor: MPSGraphTensor,
		name: string | null,
	): NSArray

	adamWithCurrentLearningRateTensorBeta1TensorBeta2TensorEpsilonTensorValuesTensorMomentumTensorVelocityTensorMaximumVelocityTensorGradientTensorName(
		currentLearningRateTensor: MPSGraphTensor,
		beta1Tensor: MPSGraphTensor,
		beta2Tensor: MPSGraphTensor,
		epsilonTensor: MPSGraphTensor,
		valuesTensor: MPSGraphTensor,
		momentumTensor: MPSGraphTensor,
		velocityTensor: MPSGraphTensor,
		maximumVelocityTensor: MPSGraphTensor | null,
		gradientTensor: MPSGraphTensor,
		name: string | null,
	): NSArray

	maxPooling2DWithSourceTensorDescriptorName(
		source: MPSGraphTensor,
		descriptor: MPSGraphPooling2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	maxPooling2DGradientWithGradientTensorSourceTensorDescriptorName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		descriptor: MPSGraphPooling2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	avgPooling2DWithSourceTensorDescriptorName(
		source: MPSGraphTensor,
		descriptor: MPSGraphPooling2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	avgPooling2DGradientWithGradientTensorSourceTensorDescriptorName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		descriptor: MPSGraphPooling2DOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	randomPhiloxStateTensorWithSeedName(seed: number, name: string | null): MPSGraphTensor

	randomPhiloxStateTensorWithCounterLowCounterHighKeyName(
		counterLow: number,
		counterHigh: number,
		key: number,
		name: string | null,
	): MPSGraphTensor

	randomTensorWithShapeDescriptorName(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphRandomOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	randomTensorWithShapeTensorDescriptorName(
		shapeTensor: MPSGraphTensor,
		descriptor: MPSGraphRandomOpDescriptor,
		name: string | null,
	): MPSGraphTensor

	randomTensorWithShapeDescriptorSeedName(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphRandomOpDescriptor,
		seed: number,
		name: string | null,
	): MPSGraphTensor

	randomTensorWithShapeTensorDescriptorSeedName(
		shapeTensor: MPSGraphTensor,
		descriptor: MPSGraphRandomOpDescriptor,
		seed: number,
		name: string | null,
	): MPSGraphTensor

	randomTensorWithShapeDescriptorStateTensorName(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		descriptor: MPSGraphRandomOpDescriptor,
		state: MPSGraphTensor,
		name: string | null,
	): NSArray

	randomTensorWithShapeTensorDescriptorStateTensorName(
		shapeTensor: MPSGraphTensor,
		descriptor: MPSGraphRandomOpDescriptor,
		state: MPSGraphTensor,
		name: string | null,
	): NSArray

	randomUniformTensorWithShapeName(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	randomUniformTensorWithShapeTensorName(
		shapeTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	randomUniformTensorWithShapeSeedName(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		seed: number,
		name: string | null,
	): MPSGraphTensor

	randomUniformTensorWithShapeTensorSeedName(
		shapeTensor: MPSGraphTensor,
		seed: number,
		name: string | null,
	): MPSGraphTensor

	randomUniformTensorWithShapeStateTensorName(
		shape: NSArray<interop.Object> | Array<interop.Object>,
		state: MPSGraphTensor,
		name: string | null,
	): NSArray

	randomUniformTensorWithShapeTensorStateTensorName(
		shapeTensor: MPSGraphTensor,
		state: MPSGraphTensor,
		name: string | null,
	): NSArray

	dropoutTensorRateName(tensor: MPSGraphTensor, rate: number, name: string | null): MPSGraphTensor

	dropoutTensorRateTensorName(
		tensor: MPSGraphTensor,
		rate: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor

	reductionSumWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	reductionSumWithTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	reductionMaximumWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	reductionMaximumWithTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	reductionMinimumWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	reductionMinimumWithTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	reductionMaximumPropagateNaNWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	reductionMaximumPropagateNaNWithTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	reductionMinimumPropagateNaNWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	reductionMinimumPropagateNaNWithTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	reductionProductWithTensorAxisName(
		tensor: MPSGraphTensor,
		axis: number,
		name: string | null,
	): MPSGraphTensor

	reductionProductWithTensorAxesName(
		tensor: MPSGraphTensor,
		axes: NSArray<interop.Object> | Array<interop.Object> | null,
		name: string | null,
	): MPSGraphTensor

	resizeTensorSizeModeCenterResultAlignCornersLayoutName(
		imagesTensor: MPSGraphTensor,
		size: NSArray<interop.Object> | Array<interop.Object>,
		mode: interop.Enum<typeof MPSGraphResizeMode>,
		centerResult: boolean,
		alignCorners: boolean,
		layout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
		name: string | null,
	): MPSGraphTensor

	resizeWithGradientTensorInputModeCenterResultAlignCornersLayoutName(
		gradient: MPSGraphTensor,
		input: MPSGraphTensor,
		mode: interop.Enum<typeof MPSGraphResizeMode>,
		centerResult: boolean,
		alignCorners: boolean,
		layout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
		name: string | null,
	): MPSGraphTensor

	scatterNDWithUpdatesTensorIndicesTensorShapeBatchDimensionsModeName(
		updatesTensor: MPSGraphTensor,
		indicesTensor: MPSGraphTensor,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		batchDimensions: number,
		mode: interop.Enum<typeof MPSGraphScatterMode>,
		name: string | null,
	): MPSGraphTensor

	scatterNDWithUpdatesTensorIndicesTensorShapeBatchDimensionsName(
		updatesTensor: MPSGraphTensor,
		indicesTensor: MPSGraphTensor,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		batchDimensions: number,
		name: string | null,
	): MPSGraphTensor

	reshapeTensorWithShapeName(
		tensor: MPSGraphTensor,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	transposeTensorDimensionWithDimensionName(
		tensor: MPSGraphTensor,
		dimensionIndex: number,
		dimensionIndex2: number,
		name: string | null,
	): MPSGraphTensor

	sliceTensorDimensionStartLengthName(
		tensor: MPSGraphTensor,
		dimensionIndex: number,
		start: number,
		length: number,
		name: string | null,
	): MPSGraphTensor

	sliceTensorStartsEndsStridesName(
		tensor: MPSGraphTensor,
		starts: NSArray<interop.Object> | Array<interop.Object>,
		ends: NSArray<interop.Object> | Array<interop.Object>,
		strides: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	sliceTensorStartsEndsStridesStartMaskEndMaskSqueezeMaskName(
		tensor: MPSGraphTensor,
		starts: NSArray<interop.Object> | Array<interop.Object>,
		ends: NSArray<interop.Object> | Array<interop.Object>,
		strides: NSArray<interop.Object> | Array<interop.Object>,
		startMask: number,
		endMask: number,
		squeezeMask: number,
		name: string | null,
	): MPSGraphTensor

	sliceGradientTensorFwdInShapeTensorStartsEndsStridesName(
		inputGradientTensor: MPSGraphTensor,
		fwdInShapeTensor: MPSGraphTensor,
		starts: NSArray<interop.Object> | Array<interop.Object>,
		ends: NSArray<interop.Object> | Array<interop.Object>,
		strides: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	sliceGradientTensorFwdInShapeTensorStartsEndsStridesStartMaskEndMaskSqueezeMaskName(
		inputGradientTensor: MPSGraphTensor,
		fwdInShapeTensor: MPSGraphTensor,
		starts: NSArray<interop.Object> | Array<interop.Object>,
		ends: NSArray<interop.Object> | Array<interop.Object>,
		strides: NSArray<interop.Object> | Array<interop.Object>,
		startMask: number,
		endMask: number,
		squeezeMask: number,
		name: string | null,
	): MPSGraphTensor

	concatTensorWithTensorDimensionName(
		tensor: MPSGraphTensor,
		tensor2: MPSGraphTensor,
		dimensionIndex: number,
		name: string | null,
	): MPSGraphTensor

	concatTensorsDimensionName(
		tensors: NSArray<interop.Object> | Array<interop.Object>,
		dimensionIndex: number,
		name: string | null,
	): MPSGraphTensor

	concatTensorsDimensionInterleaveName(
		tensors: NSArray<interop.Object> | Array<interop.Object>,
		dimensionIndex: number,
		interleave: boolean,
		name: string | null,
	): MPSGraphTensor

	tileTensorWithMultiplierName(
		tensor: MPSGraphTensor,
		multiplier: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	tileGradientWithIncomingGradientTensorSourceTensorWithMultiplierName(
		incomingGradientTensor: MPSGraphTensor,
		sourceTensor: MPSGraphTensor,
		multiplier: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	padTensorWithPaddingModeLeftPaddingRightPaddingConstantValueName(
		tensor: MPSGraphTensor,
		paddingMode: interop.Enum<typeof MPSGraphPaddingMode>,
		leftPadding: NSArray<interop.Object> | Array<interop.Object>,
		rightPadding: NSArray<interop.Object> | Array<interop.Object>,
		constantValue: number,
		name: string | null,
	): MPSGraphTensor

	padGradientWithIncomingGradientTensorSourceTensorPaddingModeLeftPaddingRightPaddingName(
		incomingGradientTensor: MPSGraphTensor,
		sourceTensor: MPSGraphTensor,
		paddingMode: interop.Enum<typeof MPSGraphPaddingMode>,
		leftPadding: NSArray<interop.Object> | Array<interop.Object>,
		rightPadding: NSArray<interop.Object> | Array<interop.Object>,
		name: string | null,
	): MPSGraphTensor

	topKWithGradientTensorSourceKName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		k: number,
		name: string | null,
	): MPSGraphTensor

	topKWithGradientTensorSourceKTensorName(
		gradient: MPSGraphTensor,
		source: MPSGraphTensor,
		kTensor: MPSGraphTensor,
		name: string | null,
	): MPSGraphTensor
}

declare class MPSGraphExecutionDescriptor extends NSObject {
	scheduledHandler: (
		p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		p2: NSError,
	) => void

	completionHandler: (
		p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		p2: NSError,
	) => void

	waitUntilCompleted: boolean
}

declare class MPSGraphOperation extends NSObject implements NSCopying {
	readonly inputTensors: NSArray

	readonly outputTensors: NSArray

	readonly controlDependencies: NSArray

	readonly graph: MPSGraph

	readonly name: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class MPSGraphTensor extends NSObject implements NSCopying {
	readonly shape: NSArray

	readonly dataType: interop.Enum<typeof MPSDataType>

	readonly operation: MPSGraphOperation

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class MPSGraphShapedType extends NSObject {
	get shape(): NSArray
	set shape(value: NSArray<interop.Object> | Array<interop.Object>)

	dataType: interop.Enum<typeof MPSDataType>

	initWithShapeDataType(
		shape: NSArray<interop.Object> | Array<interop.Object> | null,
		dataType: interop.Enum<typeof MPSDataType>,
	): this

	isEqualTo(object: interop.Object | null): boolean
	isEqualTo(object: MPSGraphShapedType | null): boolean
}

declare class MPSGraphRandomOpDescriptor extends NSObject implements NSCopying {
	distribution: interop.Enum<typeof MPSGraphRandomDistribution>

	dataType: interop.Enum<typeof MPSDataType>

	min: number

	max: number

	minInteger: number

	maxInteger: number

	mean: number

	standardDeviation: number

	samplingMethod: interop.Enum<typeof MPSGraphRandomNormalSamplingMethod>

	static descriptorWithDistributionDataType<This extends abstract new (...args: any) => any>(
		this: This,
		distribution: interop.Enum<typeof MPSGraphRandomDistribution>,
		dataType: interop.Enum<typeof MPSDataType>,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class MPSGraphDevice extends NSObject {
	readonly type: interop.Enum<typeof MPSGraphDeviceType>

	readonly metalDevice: MTLDevice

	static deviceWithMTLDevice<This extends abstract new (...args: any) => any>(
		this: This,
		metalDevice: MTLDevice,
	): InstanceType<This>
}

declare class MPSGraphTensorData extends NSObject {
	readonly shape: NSArray

	readonly dataType: interop.Enum<typeof MPSDataType>

	readonly device: MPSGraphDevice

	initWithDeviceDataShapeDataType(
		device: MPSGraphDevice,
		data: NSData,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MPSDataType>,
	): this

	initWithMTLBufferShapeDataType(
		buffer: MTLBuffer,
		shape: NSArray<interop.Object> | Array<interop.Object>,
		dataType: interop.Enum<typeof MPSDataType>,
	): this

	initWithMPSMatrix(matrix: MPSMatrix): this

	initWithMPSMatrixRank(matrix: MPSMatrix, rank: number): this

	initWithMPSVector(vector: MPSVector): this

	initWithMPSVectorRank(vector: MPSVector, rank: number): this

	initWithMPSNDArray(ndarray: MPSNDArray): this

	initWithMPSImageBatch(imageBatch: NSArray<interop.Object> | Array<interop.Object>): this

	mpsndarray(): MPSNDArray
}

declare class MPSGraphPooling2DOpDescriptor extends NSObject implements NSCopying {
	kernelWidth: number

	kernelHeight: number

	strideInX: number

	strideInY: number

	dilationRateInX: number

	dilationRateInY: number

	paddingLeft: number

	paddingRight: number

	paddingTop: number

	paddingBottom: number

	paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>

	dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>

	static descriptorWithKernelWidthKernelHeightStrideInXStrideInYDilationRateInXDilationRateInYPaddingLeftPaddingRightPaddingTopPaddingBottomPaddingStyleDataLayout<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		kernelWidth: number,
		kernelHeight: number,
		strideInX: number,
		strideInY: number,
		dilationRateInX: number,
		dilationRateInY: number,
		paddingLeft: number,
		paddingRight: number,
		paddingTop: number,
		paddingBottom: number,
		paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>,
		dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
	): InstanceType<This>

	static descriptorWithKernelWidthKernelHeightStrideInXStrideInYPaddingStyleDataLayout<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		kernelWidth: number,
		kernelHeight: number,
		strideInX: number,
		strideInY: number,
		paddingStyle: interop.Enum<typeof MPSGraphPaddingStyle>,
		dataLayout: interop.Enum<typeof MPSGraphTensorNamedDataLayout>,
	): InstanceType<This>

	setExplicitPaddingWithPaddingLeftPaddingRightPaddingTopPaddingBottom(
		paddingLeft: number,
		paddingRight: number,
		paddingTop: number,
		paddingBottom: number,
	): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class MPSGraphVariableOp extends MPSGraphOperation {
	readonly shape: NSArray

	readonly dataType: interop.Enum<typeof MPSDataType>
}
