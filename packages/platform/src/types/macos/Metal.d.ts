import type {
	NSArray,
	NSBundle,
	NSCoder,
	NSCopying,
	NSData,
	NSDictionary,
	NSError,
	NSFastEnumeration,
	NSNumber,
	NSSecureCoding,
	NSURL,
	_NSRange,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const MTLDynamicLibraryDomain: string

export declare const MTLCommonCounterSetTimestamp: string

export declare const MTLCommonCounterClipperInvocations: string

export declare const MTLBinaryArchiveDomain: string

export declare const MTLCommandBufferErrorDomain: string

export declare const MTLDeviceRemovalRequestedNotification: string

export declare const MTLDeviceWasAddedNotification: string

export declare const MTLCommonCounterSetStatistic: string

export declare const MTLCommonCounterRenderTargetWriteCycles: string

export declare const MTLCommonCounterFragmentCycles: string

export declare const MTLCommonCounterPostTessellationVertexCycles: string

export declare const MTLCommonCounterTessellationCycles: string

export declare const MTLCommonCounterVertexCycles: string

export declare const MTLCommonCounterTotalCycles: string

export declare const MTLCommonCounterComputeKernelInvocations: string

export declare const MTLCommonCounterFragmentsPassed: string

export declare const MTLCommonCounterFragmentInvocations: string

export declare const MTLCommonCounterClipperPrimitivesOut: string

export declare const MTLCommonCounterVertexInvocations: string

export declare const MTLDeviceWasRemovedNotification: string

export declare const MTLCommonCounterTessellationInputPatches: string

export declare const MTLCommonCounterSetStageUtilization: string

export declare const MTLCaptureErrorDomain: string

export declare const MTLCounterErrorDomain: string

export declare const MTLCommonCounterPostTessellationVertexInvocations: string

export declare const MTLCommonCounterTimestamp: string

export declare const MTLLibraryErrorDomain: string

export declare const MTLCommandBufferEncoderInfoErrorKey: string

export declare const MTLTextureUsage: {
	Unknown: 0
	ShaderRead: 1
	ShaderWrite: 2
	RenderTarget: 4
	PixelFormatView: 16
}

export declare const MTLLoadAction: {
	DontCare: 0
	Load: 1
	Clear: 2
}

export declare const MTLPatchType: {
	None: 0
	Triangle: 1
	Quad: 2
}

export declare const MTLFunctionOptions: {
	None: 0
	CompileToBinary: 1
}

export declare const MTLIOCompressionMethod: {
	Zlib: 0
	LZFSE: 1
	LZ4: 2
	LZMA: 3
	LZBitmap: 4
}

export declare const MTLMultisampleDepthResolveFilter: {
	Sample0: 0
	Min: 1
	Max: 2
}

export declare const MTLVertexStepFunction: {
	Constant: 0
	PerVertex: 1
	PerInstance: 2
	PerPatch: 3
	PerPatchControlPoint: 4
}

export declare const MTLStoreAction: {
	DontCare: 0
	Store: 1
	MultisampleResolve: 2
	StoreAndMultisampleResolve: 3
	Unknown: 4
	CustomSampleDepthStore: 5
}

export declare const MTLIndexType: {
	Int16: 0
	Int32: 1
}

export declare const MTLIntersectionFunctionSignature: {
	None: 0
	Instancing: 1
	TriangleData: 2
	WorldSpaceData: 4
}

export declare const MTLDynamicLibraryError: {
	None: 0
	InvalidFile: 1
	CompilationFailure: 2
	UnresolvedInstallName: 3
	DependencyLoadFailure: 4
	Unsupported: 5
}

export declare const MTLFunctionLogType: {
	MTLFunctionLogTypeValidation: 0
}

export declare const MTLHeapType: {
	Automatic: 0
	Placement: 1
	Sparse: 2
}

export declare const MTLAccelerationStructureUsage: {
	None: 0
	Refit: 1
	PreferFastBuild: 2
}

export declare const MTLTessellationFactorStepFunction: {
	Constant: 0
	PerPatch: 1
	PerInstance: 2
	PerPatchAndPerInstance: 3
}

export declare const MTLPrimitiveTopologyClass: {
	Unspecified: 0
	Point: 1
	Line: 2
	Triangle: 3
}

export declare const MTLColorWriteMask: {
	None: 0
	Red: 8
	Green: 4
	Blue: 2
	Alpha: 1
	All: 15
}

export declare const MTLRenderStages: {
	Vertex: 1
	Fragment: 2
}

export declare const MTLTriangleFillMode: {
	Fill: 0
	Lines: 1
}

export declare const MTLDepthClipMode: {
	Clip: 0
	Clamp: 1
}

export declare const MTLWinding: {
	MTLWindingClockwise: 0
	Counter: 1
}

export declare const MTLCullMode: {
	None: 0
	Front: 1
	Back: 2
}

export declare const MTLVisibilityResultMode: {
	Disabled: 0
	Boolean: 1
	Counting: 2
}

export declare const MTLPrimitiveType: {
	Point: 0
	Line: 1
	LineStrip: 2
	Triangle: 3
	TriangleStrip: 4
}

export declare const MTLVertexFormat: {
	Invalid: 0
	UChar2: 1
	UChar3: 2
	UChar4: 3
	Char2: 4
	Char3: 5
	Char4: 6
	UChar2Normalized: 7
	UChar3Normalized: 8
	UChar4Normalized: 9
	Char2Normalized: 10
	Char3Normalized: 11
	Char4Normalized: 12
	UShort2: 13
	UShort3: 14
	UShort4: 15
	Short2: 16
	Short3: 17
	Short4: 18
	UShort2Normalized: 19
	UShort3Normalized: 20
	UShort4Normalized: 21
	Short2Normalized: 22
	Short3Normalized: 23
	Short4Normalized: 24
	Half2: 25
	Half3: 26
	Half4: 27
	Float: 28
	Float2: 29
	Float3: 30
	Float4: 31
	Int: 32
	Int2: 33
	Int3: 34
	Int4: 35
	UInt: 36
	UInt2: 37
	UInt3: 38
	UInt4: 39
	Int1010102Normalized: 40
	UInt1010102Normalized: 41
	UChar4Normalized_BGRA: 42
	UChar: 45
	Char: 46
	UCharNormalized: 47
	CharNormalized: 48
	UShort: 49
	Short: 50
	UShortNormalized: 51
	ShortNormalized: 52
	Half: 53
}

export declare const MTLStencilOperation: {
	Keep: 0
	Zero: 1
	Replace: 2
	IncrementClamp: 3
	DecrementClamp: 4
	Invert: 5
	IncrementWrap: 6
	DecrementWrap: 7
}

export declare const MTLCompareFunction: {
	Never: 0
	Less: 1
	Equal: 2
	LessEqual: 3
	Greater: 4
	NotEqual: 5
	GreaterEqual: 6
	Always: 7
}

export declare const MTLDispatchType: {
	Serial: 0
	Concurrent: 1
}

export declare const MTLCommandBufferErrorOption: {
	None: 0
	EncoderExecutionStatus: 1
}

export declare const MTLCommandBufferError: {
	None: 0
	Internal: 1
	Timeout: 2
	PageFault: 3
	Blacklisted: 4
	AccessRevoked: 4
	NotPermitted: 7
	OutOfMemory: 8
	InvalidResource: 9
	Memoryless: 10
	DeviceRemoved: 11
}

export declare const MTLLibraryType: {
	Executable: 0
	Dynamic: 1
}

export declare const MTLCommandBufferStatus: {
	NotEnqueued: 0
	Enqueued: 1
	Committed: 2
	Scheduled: 3
	Completed: 4
	Error: 5
}

export declare const MTLBlitOption: {
	None: 0
	DepthFromDepthStencil: 1
	StencilFromDepthStencil: 2
	RowLinearPVRTC: 4
}

export declare const MTLSparseTextureMappingMode: {
	Map: 0
	Unmap: 1
}

export declare const MTLSparseTextureRegionAlignmentMode: {
	Outward: 0
	Inward: 1
}

export declare const MTLArgumentBuffersTier: {
	Tier1: 0
	Tier2: 1
}

export declare const MTLDeviceLocation: {
	BuiltIn: 0
	Slot: 1
	External: 2
	Unspecified: -1
}

export declare const MTLGPUFamily: {
	Apple1: 1001
	Apple2: 1002
	Apple3: 1003
	Apple4: 1004
	Apple5: 1005
	Apple6: 1006
	Apple7: 1007
	Apple8: 1008
	Apple9: 1009
	Apple10: 1010
	Apple11: 1011
	Mac1: 2001
	Mac2: 2002
	Common1: 3001
	Common2: 3002
	Common3: 3003
	MacCatalyst1: 4001
	MacCatalyst2: 4002
}

export declare const MTL4CompilerTaskStatus: {
	None: 0
	Scheduled: 1
	Compiling: 2
	Finished: 3
}

export declare const MTLLibraryError: {
	Unsupported: 1
	Internal: 2
	CompileFailure: 3
	CompileWarning: 4
	FunctionNotFound: 5
	FileNotFound: 6
}

export declare const MTLFloatingPointConversionRoundingMode: {
	ToNearestEven: 0
	TowardZero: 1
}

export declare const MTLMathFloatingPointFunctions: {
	Fast: 0
	Precise: 1
}

export declare const MTLBindingAccess: {
	BindingAccessReadOnly: 0
	BindingAccessReadWrite: 1
	BindingAccessWriteOnly: 2
	ArgumentAccessReadOnly: 0
	ArgumentAccessReadWrite: 1
	ArgumentAccessWriteOnly: 2
}

export declare const MTLArgumentType: {
	Buffer: 0
	ThreadgroupMemory: 1
	Texture: 2
	Sampler: 3
	ImageblockData: 16
	Imageblock: 17
	VisibleFunctionTable: 24
	PrimitiveAccelerationStructure: 25
	InstanceAccelerationStructure: 26
	IntersectionFunctionTable: 27
}

export declare const MTLBindingType: {
	Buffer: 0
	ThreadgroupMemory: 1
	Texture: 2
	Sampler: 3
	ImageblockData: 16
	Imageblock: 17
	VisibleFunctionTable: 24
	PrimitiveAccelerationStructure: 25
	InstanceAccelerationStructure: 26
	IntersectionFunctionTable: 27
	ObjectPayload: 34
}

export declare const MTLTessellationFactorFormat: {
	MTLTessellationFactorFormatHalf: 0
}

export declare const MTLTextureSwizzle: {
	Zero: 0
	One: 1
	Red: 2
	Green: 3
	Blue: 4
	Alpha: 5
}

export declare const MTLPixelFormat: {
	Invalid: 0
	A8Unorm: 1
	R8Unorm: 10
	R8Unorm_sRGB: 11
	R8Snorm: 12
	R8Uint: 13
	R8Sint: 14
	R16Unorm: 20
	R16Snorm: 22
	R16Uint: 23
	R16Sint: 24
	R16Float: 25
	RG8Unorm: 30
	RG8Unorm_sRGB: 31
	RG8Snorm: 32
	RG8Uint: 33
	RG8Sint: 34
	B5G6R5Unorm: 40
	A1BGR5Unorm: 41
	ABGR4Unorm: 42
	BGR5A1Unorm: 43
	R32Uint: 53
	R32Sint: 54
	R32Float: 55
	RG16Unorm: 60
	RG16Snorm: 62
	RG16Uint: 63
	RG16Sint: 64
	RG16Float: 65
	RGBA8Unorm: 70
	RGBA8Unorm_sRGB: 71
	RGBA8Snorm: 72
	RGBA8Uint: 73
	RGBA8Sint: 74
	BGRA8Unorm: 80
	BGRA8Unorm_sRGB: 81
	RGB10A2Unorm: 90
	RGB10A2Uint: 91
	RG11B10Float: 92
	RGB9E5Float: 93
	BGR10A2Unorm: 94
	BGR10_XR: 554
	BGR10_XR_sRGB: 555
	RG32Uint: 103
	RG32Sint: 104
	RG32Float: 105
	RGBA16Unorm: 110
	RGBA16Snorm: 112
	RGBA16Uint: 113
	RGBA16Sint: 114
	RGBA16Float: 115
	BGRA10_XR: 552
	BGRA10_XR_sRGB: 553
	RGBA32Uint: 123
	RGBA32Sint: 124
	RGBA32Float: 125
	BC1_RGBA: 130
	BC1_RGBA_sRGB: 131
	BC2_RGBA: 132
	BC2_RGBA_sRGB: 133
	BC3_RGBA: 134
	BC3_RGBA_sRGB: 135
	BC4_RUnorm: 140
	BC4_RSnorm: 141
	BC5_RGUnorm: 142
	BC5_RGSnorm: 143
	BC6H_RGBFloat: 150
	BC6H_RGBUfloat: 151
	BC7_RGBAUnorm: 152
	BC7_RGBAUnorm_sRGB: 153
	PVRTC_RGB_2BPP: 160
	PVRTC_RGB_2BPP_sRGB: 161
	PVRTC_RGB_4BPP: 162
	PVRTC_RGB_4BPP_sRGB: 163
	PVRTC_RGBA_2BPP: 164
	PVRTC_RGBA_2BPP_sRGB: 165
	PVRTC_RGBA_4BPP: 166
	PVRTC_RGBA_4BPP_sRGB: 167
	EAC_R11Unorm: 170
	EAC_R11Snorm: 172
	EAC_RG11Unorm: 174
	EAC_RG11Snorm: 176
	EAC_RGBA8: 178
	EAC_RGBA8_sRGB: 179
	ETC2_RGB8: 180
	ETC2_RGB8_sRGB: 181
	ETC2_RGB8A1: 182
	ETC2_RGB8A1_sRGB: 183
	ASTC_4x4_sRGB: 186
	ASTC_5x4_sRGB: 187
	ASTC_5x5_sRGB: 188
	ASTC_6x5_sRGB: 189
	ASTC_6x6_sRGB: 190
	ASTC_8x5_sRGB: 192
	ASTC_8x6_sRGB: 193
	ASTC_8x8_sRGB: 194
	ASTC_10x5_sRGB: 195
	ASTC_10x6_sRGB: 196
	ASTC_10x8_sRGB: 197
	ASTC_10x10_sRGB: 198
	ASTC_12x10_sRGB: 199
	ASTC_12x12_sRGB: 200
	ASTC_4x4_LDR: 204
	ASTC_5x4_LDR: 205
	ASTC_5x5_LDR: 206
	ASTC_6x5_LDR: 207
	ASTC_6x6_LDR: 208
	ASTC_8x5_LDR: 210
	ASTC_8x6_LDR: 211
	ASTC_8x8_LDR: 212
	ASTC_10x5_LDR: 213
	ASTC_10x6_LDR: 214
	ASTC_10x8_LDR: 215
	ASTC_10x10_LDR: 216
	ASTC_12x10_LDR: 217
	ASTC_12x12_LDR: 218
	ASTC_4x4_HDR: 222
	ASTC_5x4_HDR: 223
	ASTC_5x5_HDR: 224
	ASTC_6x5_HDR: 225
	ASTC_6x6_HDR: 226
	ASTC_8x5_HDR: 228
	ASTC_8x6_HDR: 229
	ASTC_8x8_HDR: 230
	ASTC_10x5_HDR: 231
	ASTC_10x6_HDR: 232
	ASTC_10x8_HDR: 233
	ASTC_10x10_HDR: 234
	ASTC_12x10_HDR: 235
	ASTC_12x12_HDR: 236
	GBGR422: 240
	BGRG422: 241
	Depth16Unorm: 250
	Depth32Float: 252
	Stencil8: 253
	Depth24Unorm_Stencil8: 255
	Depth32Float_Stencil8: 260
	X32_Stencil8: 261
	X24_Stencil8: 262
}

export declare const MTLTextureType: {
	Type1D: 0
	Type1DArray: 1
	Type2D: 2
	Type2DArray: 3
	Type2DMultisample: 4
	TypeCube: 5
	TypeCubeArray: 6
	Type3D: 7
	Type2DMultisampleArray: 8
	TypeTextureBuffer: 9
}

export declare const MTLDataType: {
	None: 0
	Struct: 1
	Array: 2
	Float: 3
	Float2: 4
	Float3: 5
	Float4: 6
	Float2x2: 7
	Float2x3: 8
	Float2x4: 9
	Float3x2: 10
	Float3x3: 11
	Float3x4: 12
	Float4x2: 13
	Float4x3: 14
	Float4x4: 15
	Half: 16
	Half2: 17
	Half3: 18
	Half4: 19
	Half2x2: 20
	Half2x3: 21
	Half2x4: 22
	Half3x2: 23
	Half3x3: 24
	Half3x4: 25
	Half4x2: 26
	Half4x3: 27
	Half4x4: 28
	Int: 29
	Int2: 30
	Int3: 31
	Int4: 32
	UInt: 33
	UInt2: 34
	UInt3: 35
	UInt4: 36
	Short: 37
	Short2: 38
	Short3: 39
	Short4: 40
	UShort: 41
	UShort2: 42
	UShort3: 43
	UShort4: 44
	Char: 45
	Char2: 46
	Char3: 47
	Char4: 48
	UChar: 49
	UChar2: 50
	UChar3: 51
	UChar4: 52
	Bool: 53
	Bool2: 54
	Bool3: 55
	Bool4: 56
	Texture: 58
	Sampler: 59
	Pointer: 60
	R8Unorm: 62
	R8Snorm: 63
	R16Unorm: 64
	R16Snorm: 65
	RG8Unorm: 66
	RG8Snorm: 67
	RG16Unorm: 68
	RG16Snorm: 69
	RGBA8Unorm: 70
	RGBA8Unorm_sRGB: 71
	RGBA8Snorm: 72
	RGBA16Unorm: 73
	RGBA16Snorm: 74
	RGB10A2Unorm: 75
	RG11B10Float: 76
	RGB9E5Float: 77
	RenderPipeline: 78
	ComputePipeline: 79
	IndirectCommandBuffer: 80
	VisibleFunctionTable: 115
	IntersectionFunctionTable: 116
	PrimitiveAccelerationStructure: 117
	InstanceAccelerationStructure: 118
}

export declare const MTLHazardTrackingMode: {
	Default: 0
	Untracked: 1
	Tracked: 2
}

export declare const MTLCPUCacheMode: {
	DefaultCache: 0
	WriteCombined: 1
}

export declare const MTLPurgeableState: {
	KeepCurrent: 1
	NonVolatile: 2
	Volatile: 3
	Empty: 4
}

export declare const MTLBarrierScope: {
	Buffers: 1
	Textures: 2
	RenderTargets: 4
}

export declare const MTLCaptureError: {
	NotSupported: 1
	AlreadyCapturing: 2
	InvalidDescriptor: 3
}

export declare const MTLCounterSamplingPoint: {
	Stage: 0
	Draw: 1
	Dispatch: 2
	TileDispatch: 3
	Blit: 4
}

export declare const MTLReadWriteTextureTier: {
	TierNone: 0
	Tier1: 1
	Tier2: 2
}

export declare const MTLLanguageVersion: {
	Version1_1: 65537
	Version1_2: 65538
	Version2_0: 131072
	Version2_1: 131073
	Version2_2: 131074
	Version2_3: 131075
}

export declare const MTLAttributeFormat: {
	Invalid: 0
	UChar2: 1
	UChar3: 2
	UChar4: 3
	Char2: 4
	Char3: 5
	Char4: 6
	UChar2Normalized: 7
	UChar3Normalized: 8
	UChar4Normalized: 9
	Char2Normalized: 10
	Char3Normalized: 11
	Char4Normalized: 12
	UShort2: 13
	UShort3: 14
	UShort4: 15
	Short2: 16
	Short3: 17
	Short4: 18
	UShort2Normalized: 19
	UShort3Normalized: 20
	UShort4Normalized: 21
	Short2Normalized: 22
	Short3Normalized: 23
	Short4Normalized: 24
	Half2: 25
	Half3: 26
	Half4: 27
	Float: 28
	Float2: 29
	Float3: 30
	Float4: 31
	Int: 32
	Int2: 33
	Int3: 34
	Int4: 35
	UInt: 36
	UInt2: 37
	UInt3: 38
	UInt4: 39
	Int1010102Normalized: 40
	UInt1010102Normalized: 41
	UChar4Normalized_BGRA: 42
	UChar: 45
	Char: 46
	UCharNormalized: 47
	CharNormalized: 48
	UShort: 49
	Short: 50
	UShortNormalized: 51
	ShortNormalized: 52
	Half: 53
}

export declare const MTLStoreActionOptions: {
	None: 0
	CustomSamplePositions: 1
}

export declare const MTLMutability: {
	Default: 0
	Mutable: 1
	Immutable: 2
}

export declare const MTLMathMode: {
	Safe: 0
	Relaxed: 1
	Fast: 2
}

export declare const MTLTessellationControlPointIndexType: {
	None: 0
	UInt16: 1
	UInt32: 2
}

export declare const MTLCounterSampleBufferError: {
	OutOfMemory: 0
	Invalid: 1
	Internal: 2
}

export declare const MTLCaptureDestination: {
	DeveloperTools: 1
	GPUTraceDocument: 2
}

export declare const MTLSamplerMipFilter: {
	NotMipmapped: 0
	Nearest: 1
	Linear: 2
}

export declare const MTLCommandEncoderErrorState: {
	Unknown: 0
	Completed: 1
	Affected: 2
	Pending: 3
	Faulted: 4
}

export declare const MTLTessellationPartitionMode: {
	Pow2: 0
	Integer: 1
	FractionalOdd: 2
	FractionalEven: 3
}

export declare const MTLResourceOptions: {
	CPUCacheModeDefaultCache: 0
	CPUCacheModeWriteCombined: 1
	StorageModeShared: 0
	StorageModeManaged: 16
	StorageModePrivate: 32
	StorageModeMemoryless: 48
	HazardTrackingModeDefault: 0
	HazardTrackingModeUntracked: 256
	HazardTrackingModeTracked: 512
	OptionCPUCacheModeDefault: 0
	OptionCPUCacheModeWriteCombined: 1
}

export declare const MTL4LogicalToPhysicalColorAttachmentMappingState: {
	Identity: 0
	Inherited: 1
}

export declare const MTLAccelerationStructureInstanceOptions: {
	None: 0
	DisableTriangleCulling: 1
	TriangleFrontFacingWindingCounterClockwise: 2
	Opaque: 4
	NonOpaque: 8
}

export declare const MTLSamplerMinMagFilter: {
	Nearest: 0
	Linear: 1
}

export declare const MTLFeatureSet: {
	Set_macOS_GPUFamily1_v1: 10000
	Set_OSX_GPUFamily1_v1: 10000
	Set_macOS_GPUFamily1_v2: 10001
	Set_OSX_GPUFamily1_v2: 10001
	Set_macOS_ReadWriteTextureTier2: 10002
	Set_OSX_ReadWriteTextureTier2: 10002
	Set_macOS_GPUFamily1_v3: 10003
	Set_macOS_GPUFamily1_v4: 10004
	Set_macOS_GPUFamily2_v1: 10005
}

export declare const MTLBlendOperation: {
	Add: 0
	Subtract: 1
	ReverseSubtract: 2
	Min: 3
	Max: 4
}

export declare const MTLMultisampleStencilResolveFilter: {
	Sample0: 0
	DepthResolvedSample: 1
}

export declare const MTLBinaryArchiveError: {
	None: 0
	InvalidFile: 1
	UnexpectedElement: 2
	CompilationFailure: 3
}

export declare const MTLSamplerBorderColor: {
	TransparentBlack: 0
	OpaqueBlack: 1
	OpaqueWhite: 2
}

export declare const MTLIndirectCommandType: {
	Draw: 1
	DrawIndexed: 2
	DrawPatches: 4
	DrawIndexedPatches: 8
	ConcurrentDispatch: 32
	ConcurrentDispatchThreads: 64
}

export declare const MTLStorageMode: {
	Shared: 0
	Managed: 1
	Private: 2
	Memoryless: 3
}

export declare const MTLPipelineOption: {
	None: 0
	ArgumentInfo: 1
	BindingInfo: 1
	BufferTypeInfo: 2
	FailOnBinaryArchiveMiss: 4
}

export declare const MTLBlendFactor: {
	Zero: 0
	One: 1
	SourceColor: 2
	OneMinusSourceColor: 3
	SourceAlpha: 4
	OneMinusSourceAlpha: 5
	DestinationColor: 6
	OneMinusDestinationColor: 7
	DestinationAlpha: 8
	OneMinusDestinationAlpha: 9
	SourceAlphaSaturated: 10
	BlendColor: 11
	OneMinusBlendColor: 12
	BlendAlpha: 13
	OneMinusBlendAlpha: 14
	Source1Color: 15
	OneMinusSource1Color: 16
	Source1Alpha: 17
	OneMinusSource1Alpha: 18
}

export declare const MTLResourceUsage: {
	Read: 1
	Write: 2
	Sample: 4
}

export declare const MTLFunctionType: {
	Vertex: 1
	Fragment: 2
	Kernel: 3
	Visible: 5
	Intersection: 6
}

export declare const MTLStepFunction: {
	Constant: 0
	PerVertex: 1
	PerInstance: 2
	PerPatch: 3
	PerPatchControlPoint: 4
	ThreadPositionInGridX: 5
	ThreadPositionInGridY: 6
	ThreadPositionInGridXIndexed: 7
	ThreadPositionInGridYIndexed: 8
}

export declare const MTLSamplerAddressMode: {
	ClampToEdge: 0
	MirrorClampToEdge: 1
	Repeat: 2
	MirrorRepeat: 3
	ClampToZero: 4
	ClampToBorderColor: 5
}

export declare class MTLTextureSwizzleChannels {
	constructor(init?: MTLTextureSwizzleChannels)
	red: interop.Enum<typeof MTLTextureSwizzle>
	green: interop.Enum<typeof MTLTextureSwizzle>
	blue: interop.Enum<typeof MTLTextureSwizzle>
	alpha: interop.Enum<typeof MTLTextureSwizzle>
}

export declare class MTLResourceID {
	constructor(init?: MTLResourceID)
	_impl: number
}

export declare class MTLIntersectionFunctionBufferArguments {
	constructor(init?: MTLIntersectionFunctionBufferArguments)
	intersectionFunctionBuffer: number
	intersectionFunctionBufferSize: number
	intersectionFunctionStride: number
}

export declare class MTLIndirectCommandBufferExecutionRange {
	constructor(init?: MTLIndirectCommandBufferExecutionRange)
	location: number
	length: number
}

export declare class MTL4UpdateSparseTextureMappingOperation {
	constructor(init?: MTL4UpdateSparseTextureMappingOperation)
	mode: interop.Enum<typeof MTLSparseTextureMappingMode>
	textureRegion: MTLRegion
	textureLevel: number
	textureSlice: number
	heapOffset: number
}

export declare class MTLAccelerationStructureInstanceDescriptor {
	constructor(init?: MTLAccelerationStructureInstanceDescriptor)
	transformationMatrix: _MTLPackedFloat4x3
	options: interop.Enum<typeof MTLAccelerationStructureInstanceOptions>
	mask: number
	intersectionFunctionTableOffset: number
	accelerationStructureIndex: number
}

export declare class MTLPackedFloatQuaternion {
	constructor(init?: MTLPackedFloatQuaternion)
	x: number
	y: number
	z: number
	w: number
}

export declare class unnamed_9929133997123268838 {
	constructor(init?: unnamed_9929133997123268838)
	x: number
	y: number
	z: number
}

export declare class _MTLPackedFloat3 {
	constructor(init?: _MTLPackedFloat3)
}

export declare class MTLTriangleTessellationFactorsHalf {
	constructor(init?: MTLTriangleTessellationFactorsHalf)
	edgeTessellationFactor: unknown /* const array */
	insideTessellationFactor: number
}

export declare class MTLDrawPatchIndirectArguments {
	constructor(init?: MTLDrawPatchIndirectArguments)
	patchCount: number
	instanceCount: number
	patchStart: number
	baseInstance: number
}

export declare class MTLVertexAmplificationViewMapping {
	constructor(init?: MTLVertexAmplificationViewMapping)
	viewportArrayIndexOffset: number
	renderTargetArrayIndexOffset: number
}

export declare class MTLDrawIndexedPrimitivesIndirectArguments {
	constructor(init?: MTLDrawIndexedPrimitivesIndirectArguments)
	indexCount: number
	instanceCount: number
	indexStart: number
	baseVertex: number
	baseInstance: number
}

export declare class MTLViewport {
	constructor(init?: MTLViewport)
	originX: number
	originY: number
	width: number
	height: number
	znear: number
	zfar: number
}

export declare class MTLStageInRegionIndirectArguments {
	constructor(init?: MTLStageInRegionIndirectArguments)
	stageInOrigin: unknown /* const array */
	stageInSize: unknown /* const array */
}

export declare class MTL4TimestampHeapEntry {
	constructor(init?: MTL4TimestampHeapEntry)
	timestamp: number
}

export declare class MTLCounterResultStageUtilization {
	constructor(init?: MTLCounterResultStageUtilization)
	totalCycles: number
	vertexCycles: number
	tessellationCycles: number
	postTessellationVertexCycles: number
	fragmentCycles: number
	renderTargetCycles: number
}

export declare class MTLRegion {
	constructor(init?: MTLRegion)
	origin: MTLOrigin
	size: MTLSize
}

export declare class MTLOrigin {
	constructor(init?: MTLOrigin)
	x: number
	y: number
	z: number
}

export declare class MTLDispatchThreadgroupsIndirectArguments {
	constructor(init?: MTLDispatchThreadgroupsIndirectArguments)
	threadgroupsPerGrid: unknown /* const array */
}

export declare class MTL4UpdateSparseBufferMappingOperation {
	constructor(init?: MTL4UpdateSparseBufferMappingOperation)
	mode: interop.Enum<typeof MTLSparseTextureMappingMode>
	bufferRange: _NSRange
	heapOffset: number
}

export declare class MTLScissorRect {
	constructor(init?: MTLScissorRect)
	x: number
	y: number
	width: number
	height: number
}

export declare class MTLCounterResultStatistic {
	constructor(init?: MTLCounterResultStatistic)
	tessellationInputPatches: number
	vertexInvocations: number
	postTessellationVertexInvocations: number
	clipperInvocations: number
	clipperPrimitivesOut: number
	fragmentInvocations: number
	fragmentsPassed: number
	computeKernelInvocations: number
}

export declare class _MTLAxisAlignedBoundingBox {
	constructor(init?: _MTLAxisAlignedBoundingBox)
	min: _MTLPackedFloat3
	max: _MTLPackedFloat3
}

export declare class MTLMapIndirectArguments {
	constructor(init?: MTLMapIndirectArguments)
	regionOriginX: number
	regionOriginY: number
	regionOriginZ: number
	regionSizeWidth: number
	regionSizeHeight: number
	regionSizeDepth: number
	mipMapLevel: number
	sliceId: number
}

export declare class MTLAccelerationStructureUserIDInstanceDescriptor {
	constructor(init?: MTLAccelerationStructureUserIDInstanceDescriptor)
	transformationMatrix: _MTLPackedFloat4x3
	options: interop.Enum<typeof MTLAccelerationStructureInstanceOptions>
	mask: number
	intersectionFunctionTableOffset: number
	accelerationStructureIndex: number
	userID: number
}

export declare class MTLIndirectAccelerationStructureMotionInstanceDescriptor {
	constructor(init?: MTLIndirectAccelerationStructureMotionInstanceDescriptor)
	options: interop.Enum<typeof MTLAccelerationStructureInstanceOptions>
	mask: number
	intersectionFunctionTableOffset: number
	userID: number
	accelerationStructureID: MTLResourceID
	motionTransformsStartIndex: number
	motionTransformsCount: number
	motionStartBorderMode: interop.Enum<typeof MTLMotionBorderMode>
	motionEndBorderMode: interop.Enum<typeof MTLMotionBorderMode>
	motionStartTime: number
	motionEndTime: number
}

export declare class MTLSize {
	constructor(init?: MTLSize)
	width: number
	height: number
	depth: number
}

export declare class MTLQuadTessellationFactorsHalf {
	constructor(init?: MTLQuadTessellationFactorsHalf)
	edgeTessellationFactor: unknown /* const array */
	insideTessellationFactor: unknown /* const array */
}

export declare class MTL4CopySparseBufferMappingOperation {
	constructor(init?: MTL4CopySparseBufferMappingOperation)
	sourceRange: _NSRange
	destinationOffset: number
}

export declare class MTLComponentTransform {
	constructor(init?: MTLComponentTransform)
	scale: _MTLPackedFloat3
	shear: _MTLPackedFloat3
	pivot: _MTLPackedFloat3
	rotation: MTLPackedFloatQuaternion
	translation: _MTLPackedFloat3
}

export declare class MTLSamplePosition {
	constructor(init?: MTLSamplePosition)
	x: number
	y: number
}

export declare class MTLAccelerationStructureSizes {
	constructor(init?: MTLAccelerationStructureSizes)
	accelerationStructureSize: number
	buildScratchBufferSize: number
	refitScratchBufferSize: number
}

export declare class MTLCounterResultTimestamp {
	constructor(init?: MTLCounterResultTimestamp)
	timestamp: number
}

export declare class MTLAccelerationStructureMotionInstanceDescriptor {
	constructor(init?: MTLAccelerationStructureMotionInstanceDescriptor)
	options: interop.Enum<typeof MTLAccelerationStructureInstanceOptions>
	mask: number
	intersectionFunctionTableOffset: number
	accelerationStructureIndex: number
	userID: number
	motionTransformsStartIndex: number
	motionTransformsCount: number
	motionStartBorderMode: interop.Enum<typeof MTLMotionBorderMode>
	motionEndBorderMode: interop.Enum<typeof MTLMotionBorderMode>
	motionStartTime: number
	motionEndTime: number
}

export declare class MTLIndirectAccelerationStructureInstanceDescriptor {
	constructor(init?: MTLIndirectAccelerationStructureInstanceDescriptor)
	transformationMatrix: _MTLPackedFloat4x3
	options: interop.Enum<typeof MTLAccelerationStructureInstanceOptions>
	mask: number
	intersectionFunctionTableOffset: number
	userID: number
	accelerationStructureID: MTLResourceID
}

export declare class MTL4BufferRange {
	constructor(init?: MTL4BufferRange)
	bufferAddress: number
	length: number
}

export declare class MTL4CopySparseTextureMappingOperation {
	constructor(init?: MTL4CopySparseTextureMappingOperation)
	sourceRegion: MTLRegion
	sourceLevel: number
	sourceSlice: number
	destinationOrigin: MTLOrigin
	destinationLevel: number
	destinationSlice: number
}

export declare class MTLClearColor {
	constructor(init?: MTLClearColor)
	red: number
	green: number
	blue: number
	alpha: number
}

export declare class MTLDispatchThreadsIndirectArguments {
	constructor(init?: MTLDispatchThreadsIndirectArguments)
	threadsPerGrid: unknown /* const array */
	threadsPerThreadgroup: unknown /* const array */
}

export declare class MTLDrawPrimitivesIndirectArguments {
	constructor(init?: MTLDrawPrimitivesIndirectArguments)
	vertexCount: number
	instanceCount: number
	vertexStart: number
	baseInstance: number
}

export declare class _MTLPackedFloat4x3 {
	constructor(init?: _MTLPackedFloat4x3)
	columns: unknown /* const array */
}

export declare class MTLSizeAndAlign {
	constructor(init?: MTLSizeAndAlign)
	size: number
	align: number
}

export type unnamed_13227377754740722842Descriptor = { elements: unknown /* const array */ }

export declare class unnamed_13227377754740722842 {
	constructor(init?: unnamed_13227377754740722842Descriptor)
	elements: unknown /* const array */
}

export declare function MTLCreateSystemDefaultDevice(): MTLDevice

export declare function MTLCopyAllDevices(): NSArray

export declare function MTLCopyAllDevicesWithObserver(
	observer: interop.PointerConvertible,
	handler: (p1: MTLDevice, p2: string) => void,
): NSArray

export declare function MTLRemoveDeviceObserver(observer: NSObject): void

export declare function MTLIOCompressionContextDefaultChunkSize(): number

export declare interface MTL4CommandQueue extends NSObjectProtocol {}

export declare class MTL4CommandQueue extends NativeObject implements MTL4CommandQueue {}

export declare interface MTLSharedEvent extends MTLEvent {
	notifyListenerAtValueBlock(
		listener: MTLSharedEventListener,
		value: number,
		block: (p1: MTLSharedEvent, p2: number) => void,
	): void

	newSharedEventHandle(): MTLSharedEventHandle

	signaledValue: number
}

export declare class MTLSharedEvent extends NativeObject implements MTLSharedEvent {}

export declare interface MTLCommandBuffer extends NSObjectProtocol {
	readonly device: MTLDevice

	readonly commandQueue: MTLCommandQueue

	readonly retainedReferences: boolean

	readonly errorOptions: interop.Enum<typeof MTLCommandBufferErrorOption>

	label: string

	readonly kernelStartTime: number

	readonly kernelEndTime: number

	readonly logs: MTLLogContainer

	readonly GPUStartTime: number

	readonly GPUEndTime: number

	enqueue(): void

	commit(): void

	addScheduledHandler(block: (p1: MTLCommandBuffer) => void): void

	presentDrawable(drawable: MTLDrawable): void

	presentDrawableAtTime(drawable: MTLDrawable, presentationTime: number): void

	presentDrawableAfterMinimumDuration(drawable: MTLDrawable, duration: number): void

	waitUntilScheduled(): void

	addCompletedHandler(block: (p1: MTLCommandBuffer) => void): void

	waitUntilCompleted(): void

	readonly status: interop.Enum<typeof MTLCommandBufferStatus>

	readonly error: NSError

	blitCommandEncoder(): MTLBlitCommandEncoder

	renderCommandEncoderWithDescriptor(
		renderPassDescriptor: MTLRenderPassDescriptor,
	): MTLRenderCommandEncoder

	computeCommandEncoderWithDescriptor(
		computePassDescriptor: MTLComputePassDescriptor,
	): MTLComputeCommandEncoder

	blitCommandEncoderWithDescriptor(blitPassDescriptor: MTLBlitPassDescriptor): MTLBlitCommandEncoder

	computeCommandEncoder(): MTLComputeCommandEncoder

	computeCommandEncoderWithDispatchType(
		dispatchType: interop.Enum<typeof MTLDispatchType>,
	): MTLComputeCommandEncoder

	encodeWaitForEventValue(event: MTLEvent, value: number): void

	encodeSignalEventValue(event: MTLEvent, value: number): void

	parallelRenderCommandEncoderWithDescriptor(
		renderPassDescriptor: MTLRenderPassDescriptor,
	): MTLParallelRenderCommandEncoder

	resourceStateCommandEncoder(): MTLResourceStateCommandEncoder

	resourceStateCommandEncoderWithDescriptor(
		resourceStatePassDescriptor: MTLResourceStatePassDescriptor,
	): MTLResourceStateCommandEncoder

	accelerationStructureCommandEncoder(): MTLAccelerationStructureCommandEncoder

	pushDebugGroup(string: string): void

	popDebugGroup(): void
}

export declare class MTLCommandBuffer extends NativeObject implements MTLCommandBuffer {}

export declare interface MTLAccelerationStructureCommandEncoder extends MTLCommandEncoder {
	buildAccelerationStructureDescriptorScratchBufferScratchBufferOffset(
		accelerationStructure: MTLAccelerationStructure,
		descriptor: MTLAccelerationStructureDescriptor,
		scratchBuffer: MTLBuffer,
		scratchBufferOffset: number,
	): void

	refitAccelerationStructureDescriptorDestinationScratchBufferScratchBufferOffset(
		sourceAccelerationStructure: MTLAccelerationStructure,
		descriptor: MTLAccelerationStructureDescriptor,
		destinationAccelerationStructure: MTLAccelerationStructure | null,
		scratchBuffer: MTLBuffer | null,
		scratchBufferOffset: number,
	): void

	copyAccelerationStructureToAccelerationStructure(
		sourceAccelerationStructure: MTLAccelerationStructure,
		destinationAccelerationStructure: MTLAccelerationStructure,
	): void

	writeCompactedAccelerationStructureSizeToBufferOffset(
		accelerationStructure: MTLAccelerationStructure,
		buffer: MTLBuffer,
		offset: number,
	): void

	copyAndCompactAccelerationStructureToAccelerationStructure(
		sourceAccelerationStructure: MTLAccelerationStructure,
		destinationAccelerationStructure: MTLAccelerationStructure,
	): void

	updateFence(fence: MTLFence): void

	waitForFence(fence: MTLFence): void

	useResourceUsage(resource: MTLResource, usage: interop.Enum<typeof MTLResourceUsage>): void

	useResourcesCountUsage(
		resources: interop.PointerConvertible,
		count: number,
		usage: interop.Enum<typeof MTLResourceUsage>,
	): void

	useHeap(heap: MTLHeap): void

	useHeapsCount(heaps: interop.PointerConvertible, count: number): void

	sampleCountersInBufferAtSampleIndexWithBarrier(
		sampleBuffer: MTLCounterSampleBuffer,
		sampleIndex: number,
		barrier: boolean,
	): void
}

export declare class MTLAccelerationStructureCommandEncoder
	extends NativeObject
	implements MTLAccelerationStructureCommandEncoder {}

export declare interface MTLLibrary extends NSObjectProtocol {
	label: string

	readonly device: MTLDevice

	newFunctionWithName(functionName: string): MTLFunction

	newFunctionWithNameConstantValuesError(
		name: string,
		constantValues: MTLFunctionConstantValues,
		error: interop.PointerConvertible,
	): MTLFunction

	newFunctionWithNameConstantValuesCompletionHandler(
		name: string,
		constantValues: MTLFunctionConstantValues,
		completionHandler: (p1: MTLFunction, p2: NSError) => void | null,
	): void

	newFunctionWithDescriptorCompletionHandler(
		descriptor: MTLFunctionDescriptor,
		completionHandler: (p1: MTLFunction, p2: NSError) => void | null,
	): void

	newFunctionWithDescriptorError(
		descriptor: MTLFunctionDescriptor,
		error: interop.PointerConvertible,
	): MTLFunction

	newIntersectionFunctionWithDescriptorCompletionHandler(
		descriptor: MTLIntersectionFunctionDescriptor,
		completionHandler: (p1: MTLFunction, p2: NSError) => void | null,
	): void

	newIntersectionFunctionWithDescriptorError(
		descriptor: MTLIntersectionFunctionDescriptor,
		error: interop.PointerConvertible,
	): MTLFunction

	readonly functionNames: NSArray

	readonly type: interop.Enum<typeof MTLLibraryType>

	readonly installName: string
}

export declare class MTLLibrary extends NativeObject implements MTLLibrary {}

export declare interface MTLFunctionLog extends NSObjectProtocol {
	readonly type: interop.Enum<typeof MTLFunctionLogType>

	readonly encoderLabel: string

	readonly function$: MTLFunction

	readonly debugLocation: MTLFunctionLogDebugLocation

	function(): MTLFunction | null
}

export declare class MTLFunctionLog extends NativeObject implements MTLFunctionLog {}

export declare interface MTLCommandBufferEncoderInfo extends NSObjectProtocol {
	readonly label: string

	readonly debugSignposts: NSArray

	readonly errorState: interop.Enum<typeof MTLCommandEncoderErrorState>
}

export declare class MTLCommandBufferEncoderInfo
	extends NativeObject
	implements MTLCommandBufferEncoderInfo {}

export declare interface MTLResourceStateCommandEncoder extends MTLCommandEncoder {
	updateTextureMappingsModeRegionsMipLevelsSlicesNumRegions?(
		texture: MTLTexture,
		mode: interop.Enum<typeof MTLSparseTextureMappingMode>,
		regions: interop.PointerConvertible,
		mipLevels: interop.PointerConvertible,
		slices: interop.PointerConvertible,
		numRegions: number,
	): void

	updateTextureMappingModeRegionMipLevelSlice?(
		texture: MTLTexture,
		mode: interop.Enum<typeof MTLSparseTextureMappingMode>,
		region: MTLRegion,
		mipLevel: number,
		slice: number,
	): void

	updateTextureMappingModeIndirectBufferIndirectBufferOffset?(
		texture: MTLTexture,
		mode: interop.Enum<typeof MTLSparseTextureMappingMode>,
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	updateFence?(fence: MTLFence): void

	waitForFence?(fence: MTLFence): void
}

export declare class MTLResourceStateCommandEncoder
	extends NativeObject
	implements MTLResourceStateCommandEncoder {}

export declare interface MTLAllocation extends NSObjectProtocol {}

export declare class MTLAllocation extends NativeObject implements MTLAllocation {}

export declare interface MTLIntersectionFunctionTable extends MTLResource {
	setBufferOffsetAtIndex(buffer: MTLBuffer | null, offset: number, index: number): void

	setBuffersOffsetsWithRange(
		buffers: interop.PointerConvertible,
		offsets: interop.PointerConvertible,
		range: _NSRange,
	): void

	setFunctionAtIndex(function$: MTLFunctionHandle | null, index: number): void

	setFunctionsWithRange(functions: interop.PointerConvertible, range: _NSRange): void

	setOpaqueTriangleIntersectionFunctionWithSignatureAtIndex(
		signature: interop.Enum<typeof MTLIntersectionFunctionSignature>,
		index: number,
	): void

	setOpaqueTriangleIntersectionFunctionWithSignatureWithRange(
		signature: interop.Enum<typeof MTLIntersectionFunctionSignature>,
		range: _NSRange,
	): void

	setOpaqueCurveIntersectionFunctionWithSignatureAtIndex(
		signature: interop.Enum<typeof MTLIntersectionFunctionSignature>,
		index: number,
	): void

	setOpaqueCurveIntersectionFunctionWithSignatureWithRange(
		signature: interop.Enum<typeof MTLIntersectionFunctionSignature>,
		range: _NSRange,
	): void

	setVisibleFunctionTableAtBufferIndex(
		functionTable: MTLVisibleFunctionTable | null,
		bufferIndex: number,
	): void

	setVisibleFunctionTablesWithBufferRange(
		functionTables: interop.PointerConvertible,
		bufferRange: _NSRange,
	): void
}

export declare class MTLIntersectionFunctionTable
	extends NativeObject
	implements MTLIntersectionFunctionTable {}

export declare interface MTLComputeCommandEncoder extends MTLCommandEncoder {
	readonly dispatchType: interop.Enum<typeof MTLDispatchType>

	setComputePipelineState(state: MTLComputePipelineState): void

	setBytesLengthAtIndex(bytes: interop.PointerConvertible, length: number, index: number): void

	setBufferOffsetAtIndex(buffer: MTLBuffer | null, offset: number, index: number): void

	setBufferOffsetAtIndex(offset: number, index: number): void

	setBuffersOffsetsWithRange(
		buffers: interop.PointerConvertible,
		offsets: interop.PointerConvertible,
		range: _NSRange,
	): void

	setVisibleFunctionTableAtBufferIndex(
		visibleFunctionTable: MTLVisibleFunctionTable | null,
		bufferIndex: number,
	): void

	setVisibleFunctionTablesWithBufferRange(
		visibleFunctionTables: interop.PointerConvertible,
		range: _NSRange,
	): void

	setIntersectionFunctionTableAtBufferIndex(
		intersectionFunctionTable: MTLIntersectionFunctionTable | null,
		bufferIndex: number,
	): void

	setIntersectionFunctionTablesWithBufferRange(
		intersectionFunctionTables: interop.PointerConvertible,
		range: _NSRange,
	): void

	setAccelerationStructureAtBufferIndex(
		accelerationStructure: MTLAccelerationStructure | null,
		bufferIndex: number,
	): void

	setTextureAtIndex(texture: MTLTexture | null, index: number): void

	setTexturesWithRange(textures: interop.PointerConvertible, range: _NSRange): void

	setSamplerStateAtIndex(sampler: MTLSamplerState | null, index: number): void

	setSamplerStatesWithRange(samplers: interop.PointerConvertible, range: _NSRange): void

	setSamplerStateLodMinClampLodMaxClampAtIndex(
		sampler: MTLSamplerState | null,
		lodMinClamp: number,
		lodMaxClamp: number,
		index: number,
	): void

	setSamplerStatesLodMinClampsLodMaxClampsWithRange(
		samplers: interop.PointerConvertible,
		lodMinClamps: interop.PointerConvertible,
		lodMaxClamps: interop.PointerConvertible,
		range: _NSRange,
	): void

	setThreadgroupMemoryLengthAtIndex(length: number, index: number): void

	setImageblockWidthHeight(width: number, height: number): void

	setStageInRegion(region: MTLRegion): void

	setStageInRegionWithIndirectBufferIndirectBufferOffset(
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	dispatchThreadgroupsThreadsPerThreadgroup(
		threadgroupsPerGrid: MTLSize,
		threadsPerThreadgroup: MTLSize,
	): void

	dispatchThreadgroupsWithIndirectBufferIndirectBufferOffsetThreadsPerThreadgroup(
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
		threadsPerThreadgroup: MTLSize,
	): void

	dispatchThreadsThreadsPerThreadgroup(
		threadsPerGrid: MTLSize,
		threadsPerThreadgroup: MTLSize,
	): void

	updateFence(fence: MTLFence): void

	waitForFence(fence: MTLFence): void

	useResourceUsage(resource: MTLResource, usage: interop.Enum<typeof MTLResourceUsage>): void

	useResourcesCountUsage(
		resources: interop.PointerConvertible,
		count: number,
		usage: interop.Enum<typeof MTLResourceUsage>,
	): void

	useHeap(heap: MTLHeap): void

	useHeapsCount(heaps: interop.PointerConvertible, count: number): void

	executeCommandsInBufferWithRange(
		indirectCommandBuffer: MTLIndirectCommandBuffer,
		executionRange: _NSRange,
	): void

	executeCommandsInBufferIndirectBufferIndirectBufferOffset(
		indirectCommandbuffer: MTLIndirectCommandBuffer,
		indirectRangeBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	memoryBarrierWithScope(scope: interop.Enum<typeof MTLBarrierScope>): void

	memoryBarrierWithResourcesCount(resources: interop.PointerConvertible, count: number): void

	sampleCountersInBufferAtSampleIndexWithBarrier(
		sampleBuffer: MTLCounterSampleBuffer,
		sampleIndex: number,
		barrier: boolean,
	): void
}

export declare class MTLComputeCommandEncoder
	extends NativeObject
	implements MTLComputeCommandEncoder {}

export declare interface MTLBinaryArchive extends NSObjectProtocol {
	label: string

	readonly device: MTLDevice

	addComputePipelineFunctionsWithDescriptorError(
		descriptor: MTLComputePipelineDescriptor,
		error: interop.PointerConvertible,
	): boolean

	addRenderPipelineFunctionsWithDescriptorError(
		descriptor: MTLRenderPipelineDescriptor,
		error: interop.PointerConvertible,
	): boolean

	addTileRenderPipelineFunctionsWithDescriptorError(
		descriptor: MTLTileRenderPipelineDescriptor,
		error: interop.PointerConvertible,
	): boolean

	serializeToURLError(url: NSURL, error: interop.PointerConvertible): boolean
}

export declare class MTLBinaryArchive extends NativeObject implements MTLBinaryArchive {}

export declare interface MTLDynamicLibrary extends NSObjectProtocol {
	label: string

	readonly device: MTLDevice

	readonly installName: string

	serializeToURLError(url: NSURL, error: interop.PointerConvertible): boolean
}

export declare class MTLDynamicLibrary extends NativeObject implements MTLDynamicLibrary {}

export declare interface MTLCommandQueue extends NSObjectProtocol {
	label: string

	readonly device: MTLDevice

	commandBuffer(): MTLCommandBuffer

	commandBufferWithDescriptor(descriptor: MTLCommandBufferDescriptor): MTLCommandBuffer

	commandBufferWithUnretainedReferences(): MTLCommandBuffer

	insertDebugCaptureBoundary(): void
}

export declare class MTLCommandQueue extends NativeObject implements MTLCommandQueue {}

export declare interface MTLIndirectCommandBuffer extends MTLResource {
	readonly size: number

	resetWithRange(range: _NSRange): void

	indirectRenderCommandAtIndex(commandIndex: number): MTLIndirectRenderCommand

	indirectComputeCommandAtIndex(commandIndex: number): MTLIndirectComputeCommand
}

export declare class MTLIndirectCommandBuffer
	extends NativeObject
	implements MTLIndirectCommandBuffer {}

export declare interface MTLIndirectRenderCommand extends NSObjectProtocol {
	setRenderPipelineState(pipelineState: MTLRenderPipelineState): void

	setVertexBufferOffsetAtIndex(buffer: MTLBuffer, offset: number, index: number): void

	setFragmentBufferOffsetAtIndex(buffer: MTLBuffer, offset: number, index: number): void

	drawPatchesPatchStartPatchCountPatchIndexBufferPatchIndexBufferOffsetInstanceCountBaseInstanceTessellationFactorBufferTessellationFactorBufferOffsetTessellationFactorBufferInstanceStride(
		numberOfPatchControlPoints: number,
		patchStart: number,
		patchCount: number,
		patchIndexBuffer: MTLBuffer | null,
		patchIndexBufferOffset: number,
		instanceCount: number,
		baseInstance: number,
		buffer: MTLBuffer,
		offset: number,
		instanceStride: number,
	): void

	drawIndexedPatchesPatchStartPatchCountPatchIndexBufferPatchIndexBufferOffsetControlPointIndexBufferControlPointIndexBufferOffsetInstanceCountBaseInstanceTessellationFactorBufferTessellationFactorBufferOffsetTessellationFactorBufferInstanceStride(
		numberOfPatchControlPoints: number,
		patchStart: number,
		patchCount: number,
		patchIndexBuffer: MTLBuffer | null,
		patchIndexBufferOffset: number,
		controlPointIndexBuffer: MTLBuffer,
		controlPointIndexBufferOffset: number,
		instanceCount: number,
		baseInstance: number,
		buffer: MTLBuffer,
		offset: number,
		instanceStride: number,
	): void

	drawPrimitivesVertexStartVertexCountInstanceCountBaseInstance(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		vertexStart: number,
		vertexCount: number,
		instanceCount: number,
		baseInstance: number,
	): void

	drawIndexedPrimitivesIndexCountIndexTypeIndexBufferIndexBufferOffsetInstanceCountBaseVertexBaseInstance(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		indexCount: number,
		indexType: interop.Enum<typeof MTLIndexType>,
		indexBuffer: MTLBuffer,
		indexBufferOffset: number,
		instanceCount: number,
		baseVertex: number,
		baseInstance: number,
	): void

	reset(): void
}

export declare class MTLIndirectRenderCommand
	extends NativeObject
	implements MTLIndirectRenderCommand {}

export declare interface MTLArgumentEncoder extends NSObjectProtocol {
	readonly device: MTLDevice

	label: string

	readonly encodedLength: number

	readonly alignment: number

	setArgumentBufferOffset(argumentBuffer: MTLBuffer | null, offset: number): void

	setArgumentBufferStartOffsetArrayElement(
		argumentBuffer: MTLBuffer | null,
		startOffset: number,
		arrayElement: number,
	): void

	setBufferOffsetAtIndex(buffer: MTLBuffer | null, offset: number, index: number): void

	setBuffersOffsetsWithRange(
		buffers: interop.PointerConvertible,
		offsets: interop.PointerConvertible,
		range: _NSRange,
	): void

	setTextureAtIndex(texture: MTLTexture | null, index: number): void

	setTexturesWithRange(textures: interop.PointerConvertible, range: _NSRange): void

	setSamplerStateAtIndex(sampler: MTLSamplerState | null, index: number): void

	setSamplerStatesWithRange(samplers: interop.PointerConvertible, range: _NSRange): void

	constantDataAtIndex(index: number): interop.Pointer

	setRenderPipelineStateAtIndex(pipeline: MTLRenderPipelineState | null, index: number): void

	setRenderPipelineStatesWithRange(pipelines: interop.PointerConvertible, range: _NSRange): void

	setComputePipelineStateAtIndex(pipeline: MTLComputePipelineState | null, index: number): void

	setComputePipelineStatesWithRange(pipelines: interop.PointerConvertible, range: _NSRange): void

	setIndirectCommandBufferAtIndex(
		indirectCommandBuffer: MTLIndirectCommandBuffer | null,
		index: number,
	): void

	setIndirectCommandBuffersWithRange(buffers: interop.PointerConvertible, range: _NSRange): void

	setAccelerationStructureAtIndex(
		accelerationStructure: MTLAccelerationStructure | null,
		index: number,
	): void

	newArgumentEncoderForBufferAtIndex(index: number): MTLArgumentEncoder

	setVisibleFunctionTableAtIndex(
		visibleFunctionTable: MTLVisibleFunctionTable | null,
		index: number,
	): void

	setVisibleFunctionTablesWithRange(
		visibleFunctionTables: interop.PointerConvertible,
		range: _NSRange,
	): void

	setIntersectionFunctionTableAtIndex(
		intersectionFunctionTable: MTLIntersectionFunctionTable | null,
		index: number,
	): void

	setIntersectionFunctionTablesWithRange(
		intersectionFunctionTables: interop.PointerConvertible,
		range: _NSRange,
	): void
}

export declare class MTLArgumentEncoder extends NativeObject implements MTLArgumentEncoder {}

export declare interface MTLHeap extends MTLAllocation {
	label: string

	readonly device: MTLDevice

	readonly storageMode: interop.Enum<typeof MTLStorageMode>

	readonly cpuCacheMode: interop.Enum<typeof MTLCPUCacheMode>

	readonly hazardTrackingMode: interop.Enum<typeof MTLHazardTrackingMode>

	readonly resourceOptions: interop.Enum<typeof MTLResourceOptions>

	readonly size: number

	readonly usedSize: number

	readonly currentAllocatedSize: number

	maxAvailableSizeWithAlignment(alignment: number): number

	newBufferWithLengthOptions(
		length: number,
		options: interop.Enum<typeof MTLResourceOptions>,
	): MTLBuffer

	newTextureWithDescriptor(descriptor: MTLTextureDescriptor): MTLTexture

	setPurgeableState(
		state: interop.Enum<typeof MTLPurgeableState>,
	): interop.Enum<typeof MTLPurgeableState>

	readonly type: interop.Enum<typeof MTLHeapType>

	newBufferWithLengthOptionsOffset(
		length: number,
		options: interop.Enum<typeof MTLResourceOptions>,
		offset: number,
	): MTLBuffer

	newTextureWithDescriptorOffset(descriptor: MTLTextureDescriptor, offset: number): MTLTexture
}

export declare class MTLHeap extends NativeObject implements MTLHeap {}

export declare interface MTLSamplerState extends NSObjectProtocol {
	readonly label: string

	readonly device: MTLDevice
}

export declare class MTLSamplerState extends NativeObject implements MTLSamplerState {}

export declare interface MTLParallelRenderCommandEncoder extends MTLCommandEncoder {
	renderCommandEncoder(): MTLRenderCommandEncoder

	setColorStoreActionAtIndex(
		storeAction: interop.Enum<typeof MTLStoreAction>,
		colorAttachmentIndex: number,
	): void

	setDepthStoreAction(storeAction: interop.Enum<typeof MTLStoreAction>): void

	setStencilStoreAction(storeAction: interop.Enum<typeof MTLStoreAction>): void

	setColorStoreActionOptionsAtIndex(
		storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>,
		colorAttachmentIndex: number,
	): void

	setDepthStoreActionOptions(storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>): void

	setStencilStoreActionOptions(storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>): void
}

export declare class MTLParallelRenderCommandEncoder
	extends NativeObject
	implements MTLParallelRenderCommandEncoder {}

export declare interface MTLRenderPipelineState extends MTLAllocation, NSObjectProtocol {
	readonly label: string

	readonly device: MTLDevice

	readonly maxTotalThreadsPerThreadgroup: number

	readonly threadgroupSizeMatchesTileSize: boolean

	readonly imageblockSampleLength: number

	imageblockMemoryLengthForDimensions(imageblockDimensions: MTLSize): number

	readonly supportIndirectCommandBuffers: boolean
}

export declare class MTLRenderPipelineState
	extends NativeObject
	implements MTLRenderPipelineState {}

export declare interface MTLRenderCommandEncoder extends MTLCommandEncoder {
	setRenderPipelineState(pipelineState: MTLRenderPipelineState): void

	setVertexBytesLengthAtIndex(
		bytes: interop.PointerConvertible,
		length: number,
		index: number,
	): void

	setVertexBufferOffsetAtIndex(buffer: MTLBuffer | null, offset: number, index: number): void

	setVertexBufferOffsetAtIndex(offset: number, index: number): void

	setVertexBuffersOffsetsWithRange(
		buffers: interop.PointerConvertible,
		offsets: interop.PointerConvertible,
		range: _NSRange,
	): void

	setVertexTextureAtIndex(texture: MTLTexture | null, index: number): void

	setVertexTexturesWithRange(textures: interop.PointerConvertible, range: _NSRange): void

	setVertexSamplerStateAtIndex(sampler: MTLSamplerState | null, index: number): void

	setVertexSamplerStatesWithRange(samplers: interop.PointerConvertible, range: _NSRange): void

	setVertexSamplerStateLodMinClampLodMaxClampAtIndex(
		sampler: MTLSamplerState | null,
		lodMinClamp: number,
		lodMaxClamp: number,
		index: number,
	): void

	setVertexSamplerStatesLodMinClampsLodMaxClampsWithRange(
		samplers: interop.PointerConvertible,
		lodMinClamps: interop.PointerConvertible,
		lodMaxClamps: interop.PointerConvertible,
		range: _NSRange,
	): void

	setViewport(viewport: MTLViewport): void

	setViewportsCount(viewports: interop.PointerConvertible, count: number): void

	setFrontFacingWinding(frontFacingWinding: interop.Enum<typeof MTLWinding>): void

	setVertexAmplificationCountViewMappings(
		count: number,
		viewMappings: interop.PointerConvertible,
	): void

	setCullMode(cullMode: interop.Enum<typeof MTLCullMode>): void

	setDepthClipMode(depthClipMode: interop.Enum<typeof MTLDepthClipMode>): void

	setDepthBiasSlopeScaleClamp(depthBias: number, slopeScale: number, clamp: number): void

	setScissorRect(rect: MTLScissorRect): void

	setScissorRectsCount(scissorRects: interop.PointerConvertible, count: number): void

	setTriangleFillMode(fillMode: interop.Enum<typeof MTLTriangleFillMode>): void

	setFragmentBytesLengthAtIndex(
		bytes: interop.PointerConvertible,
		length: number,
		index: number,
	): void

	setFragmentBufferOffsetAtIndex(buffer: MTLBuffer | null, offset: number, index: number): void

	setFragmentBufferOffsetAtIndex(offset: number, index: number): void

	setFragmentBuffersOffsetsWithRange(
		buffers: interop.PointerConvertible,
		offsets: interop.PointerConvertible,
		range: _NSRange,
	): void

	setFragmentTextureAtIndex(texture: MTLTexture | null, index: number): void

	setFragmentTexturesWithRange(textures: interop.PointerConvertible, range: _NSRange): void

	setFragmentSamplerStateAtIndex(sampler: MTLSamplerState | null, index: number): void

	setFragmentSamplerStatesWithRange(samplers: interop.PointerConvertible, range: _NSRange): void

	setFragmentSamplerStateLodMinClampLodMaxClampAtIndex(
		sampler: MTLSamplerState | null,
		lodMinClamp: number,
		lodMaxClamp: number,
		index: number,
	): void

	setFragmentSamplerStatesLodMinClampsLodMaxClampsWithRange(
		samplers: interop.PointerConvertible,
		lodMinClamps: interop.PointerConvertible,
		lodMaxClamps: interop.PointerConvertible,
		range: _NSRange,
	): void

	setBlendColorRedGreenBlueAlpha(red: number, green: number, blue: number, alpha: number): void

	setDepthStencilState(depthStencilState: MTLDepthStencilState | null): void

	setStencilReferenceValue(referenceValue: number): void

	setStencilFrontReferenceValueBackReferenceValue(
		frontReferenceValue: number,
		backReferenceValue: number,
	): void

	setVisibilityResultModeOffset(
		mode: interop.Enum<typeof MTLVisibilityResultMode>,
		offset: number,
	): void

	setColorStoreActionAtIndex(
		storeAction: interop.Enum<typeof MTLStoreAction>,
		colorAttachmentIndex: number,
	): void

	setDepthStoreAction(storeAction: interop.Enum<typeof MTLStoreAction>): void

	setStencilStoreAction(storeAction: interop.Enum<typeof MTLStoreAction>): void

	setColorStoreActionOptionsAtIndex(
		storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>,
		colorAttachmentIndex: number,
	): void

	setDepthStoreActionOptions(storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>): void

	setStencilStoreActionOptions(storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>): void

	drawPrimitivesVertexStartVertexCountInstanceCount(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		vertexStart: number,
		vertexCount: number,
		instanceCount: number,
	): void

	drawPrimitivesVertexStartVertexCount(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		vertexStart: number,
		vertexCount: number,
	): void

	drawIndexedPrimitivesIndexCountIndexTypeIndexBufferIndexBufferOffsetInstanceCount(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		indexCount: number,
		indexType: interop.Enum<typeof MTLIndexType>,
		indexBuffer: MTLBuffer,
		indexBufferOffset: number,
		instanceCount: number,
	): void

	drawIndexedPrimitivesIndexCountIndexTypeIndexBufferIndexBufferOffset(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		indexCount: number,
		indexType: interop.Enum<typeof MTLIndexType>,
		indexBuffer: MTLBuffer,
		indexBufferOffset: number,
	): void

	drawPrimitivesVertexStartVertexCountInstanceCountBaseInstance(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		vertexStart: number,
		vertexCount: number,
		instanceCount: number,
		baseInstance: number,
	): void

	drawIndexedPrimitivesIndexCountIndexTypeIndexBufferIndexBufferOffsetInstanceCountBaseVertexBaseInstance(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		indexCount: number,
		indexType: interop.Enum<typeof MTLIndexType>,
		indexBuffer: MTLBuffer,
		indexBufferOffset: number,
		instanceCount: number,
		baseVertex: number,
		baseInstance: number,
	): void

	drawPrimitivesIndirectBufferIndirectBufferOffset(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	drawIndexedPrimitivesIndexTypeIndexBufferIndexBufferOffsetIndirectBufferIndirectBufferOffset(
		primitiveType: interop.Enum<typeof MTLPrimitiveType>,
		indexType: interop.Enum<typeof MTLIndexType>,
		indexBuffer: MTLBuffer,
		indexBufferOffset: number,
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	textureBarrier(): void

	updateFenceAfterStages(fence: MTLFence, stages: interop.Enum<typeof MTLRenderStages>): void

	waitForFenceBeforeStages(fence: MTLFence, stages: interop.Enum<typeof MTLRenderStages>): void

	setTessellationFactorBufferOffsetInstanceStride(
		buffer: MTLBuffer | null,
		offset: number,
		instanceStride: number,
	): void

	setTessellationFactorScale(scale: number): void

	drawPatchesPatchStartPatchCountPatchIndexBufferPatchIndexBufferOffsetInstanceCountBaseInstance(
		numberOfPatchControlPoints: number,
		patchStart: number,
		patchCount: number,
		patchIndexBuffer: MTLBuffer | null,
		patchIndexBufferOffset: number,
		instanceCount: number,
		baseInstance: number,
	): void

	drawPatchesPatchIndexBufferPatchIndexBufferOffsetIndirectBufferIndirectBufferOffset(
		numberOfPatchControlPoints: number,
		patchIndexBuffer: MTLBuffer | null,
		patchIndexBufferOffset: number,
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	drawIndexedPatchesPatchStartPatchCountPatchIndexBufferPatchIndexBufferOffsetControlPointIndexBufferControlPointIndexBufferOffsetInstanceCountBaseInstance(
		numberOfPatchControlPoints: number,
		patchStart: number,
		patchCount: number,
		patchIndexBuffer: MTLBuffer | null,
		patchIndexBufferOffset: number,
		controlPointIndexBuffer: MTLBuffer,
		controlPointIndexBufferOffset: number,
		instanceCount: number,
		baseInstance: number,
	): void

	drawIndexedPatchesPatchIndexBufferPatchIndexBufferOffsetControlPointIndexBufferControlPointIndexBufferOffsetIndirectBufferIndirectBufferOffset(
		numberOfPatchControlPoints: number,
		patchIndexBuffer: MTLBuffer | null,
		patchIndexBufferOffset: number,
		controlPointIndexBuffer: MTLBuffer,
		controlPointIndexBufferOffset: number,
		indirectBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	readonly tileWidth: number

	readonly tileHeight: number

	setTileBytesLengthAtIndex(bytes: interop.PointerConvertible, length: number, index: number): void

	setTileBufferOffsetAtIndex(buffer: MTLBuffer | null, offset: number, index: number): void

	setTileBufferOffsetAtIndex(offset: number, index: number): void

	setTileBuffersOffsetsWithRange(
		buffers: interop.PointerConvertible,
		offsets: interop.PointerConvertible,
		range: _NSRange,
	): void

	setTileTextureAtIndex(texture: MTLTexture | null, index: number): void

	setTileTexturesWithRange(textures: interop.PointerConvertible, range: _NSRange): void

	setTileSamplerStateAtIndex(sampler: MTLSamplerState | null, index: number): void

	setTileSamplerStatesWithRange(samplers: interop.PointerConvertible, range: _NSRange): void

	setTileSamplerStateLodMinClampLodMaxClampAtIndex(
		sampler: MTLSamplerState | null,
		lodMinClamp: number,
		lodMaxClamp: number,
		index: number,
	): void

	setTileSamplerStatesLodMinClampsLodMaxClampsWithRange(
		samplers: interop.PointerConvertible,
		lodMinClamps: interop.PointerConvertible,
		lodMaxClamps: interop.PointerConvertible,
		range: _NSRange,
	): void

	dispatchThreadsPerTile(threadsPerTile: MTLSize): void

	setThreadgroupMemoryLengthOffsetAtIndex(length: number, offset: number, index: number): void

	useResourceUsage(resource: MTLResource, usage: interop.Enum<typeof MTLResourceUsage>): void

	useResourcesCountUsage(
		resources: interop.PointerConvertible,
		count: number,
		usage: interop.Enum<typeof MTLResourceUsage>,
	): void

	useResourceUsageStages(
		resource: MTLResource,
		usage: interop.Enum<typeof MTLResourceUsage>,
		stages: interop.Enum<typeof MTLRenderStages>,
	): void

	useResourcesCountUsageStages(
		resources: interop.PointerConvertible,
		count: number,
		usage: interop.Enum<typeof MTLResourceUsage>,
		stages: interop.Enum<typeof MTLRenderStages>,
	): void

	useHeap(heap: MTLHeap): void

	useHeapsCount(heaps: interop.PointerConvertible, count: number): void

	useHeapStages(heap: MTLHeap, stages: interop.Enum<typeof MTLRenderStages>): void

	useHeapsCountStages(
		heaps: interop.PointerConvertible,
		count: number,
		stages: interop.Enum<typeof MTLRenderStages>,
	): void

	executeCommandsInBufferWithRange(
		indirectCommandBuffer: MTLIndirectCommandBuffer,
		executionRange: _NSRange,
	): void

	executeCommandsInBufferIndirectBufferIndirectBufferOffset(
		indirectCommandbuffer: MTLIndirectCommandBuffer,
		indirectRangeBuffer: MTLBuffer,
		indirectBufferOffset: number,
	): void

	memoryBarrierWithScopeAfterStagesBeforeStages(
		scope: interop.Enum<typeof MTLBarrierScope>,
		after: interop.Enum<typeof MTLRenderStages>,
		before: interop.Enum<typeof MTLRenderStages>,
	): void

	memoryBarrierWithResourcesCountAfterStagesBeforeStages(
		resources: interop.PointerConvertible,
		count: number,
		after: interop.Enum<typeof MTLRenderStages>,
		before: interop.Enum<typeof MTLRenderStages>,
	): void

	sampleCountersInBufferAtSampleIndexWithBarrier(
		sampleBuffer: MTLCounterSampleBuffer,
		sampleIndex: number,
		barrier: boolean,
	): void
}

export declare class MTLRenderCommandEncoder
	extends NativeObject
	implements MTLRenderCommandEncoder {}

export declare interface MTLBlitCommandEncoder extends MTLCommandEncoder {
	synchronizeResource(resource: MTLResource): void

	synchronizeTextureSliceLevel(texture: MTLTexture, slice: number, level: number): void

	copyFromTextureSourceSliceSourceLevelSourceOriginSourceSizeToTextureDestinationSliceDestinationLevelDestinationOrigin(
		sourceTexture: MTLTexture,
		sourceSlice: number,
		sourceLevel: number,
		sourceOrigin: MTLOrigin,
		sourceSize: MTLSize,
		destinationTexture: MTLTexture,
		destinationSlice: number,
		destinationLevel: number,
		destinationOrigin: MTLOrigin,
	): void

	copyFromBufferSourceOffsetSourceBytesPerRowSourceBytesPerImageSourceSizeToTextureDestinationSliceDestinationLevelDestinationOrigin(
		sourceBuffer: MTLBuffer,
		sourceOffset: number,
		sourceBytesPerRow: number,
		sourceBytesPerImage: number,
		sourceSize: MTLSize,
		destinationTexture: MTLTexture,
		destinationSlice: number,
		destinationLevel: number,
		destinationOrigin: MTLOrigin,
	): void

	copyFromBufferSourceOffsetSourceBytesPerRowSourceBytesPerImageSourceSizeToTextureDestinationSliceDestinationLevelDestinationOriginOptions(
		sourceBuffer: MTLBuffer,
		sourceOffset: number,
		sourceBytesPerRow: number,
		sourceBytesPerImage: number,
		sourceSize: MTLSize,
		destinationTexture: MTLTexture,
		destinationSlice: number,
		destinationLevel: number,
		destinationOrigin: MTLOrigin,
		options: interop.Enum<typeof MTLBlitOption>,
	): void

	copyFromTextureSourceSliceSourceLevelSourceOriginSourceSizeToBufferDestinationOffsetDestinationBytesPerRowDestinationBytesPerImage(
		sourceTexture: MTLTexture,
		sourceSlice: number,
		sourceLevel: number,
		sourceOrigin: MTLOrigin,
		sourceSize: MTLSize,
		destinationBuffer: MTLBuffer,
		destinationOffset: number,
		destinationBytesPerRow: number,
		destinationBytesPerImage: number,
	): void

	copyFromTextureSourceSliceSourceLevelSourceOriginSourceSizeToBufferDestinationOffsetDestinationBytesPerRowDestinationBytesPerImageOptions(
		sourceTexture: MTLTexture,
		sourceSlice: number,
		sourceLevel: number,
		sourceOrigin: MTLOrigin,
		sourceSize: MTLSize,
		destinationBuffer: MTLBuffer,
		destinationOffset: number,
		destinationBytesPerRow: number,
		destinationBytesPerImage: number,
		options: interop.Enum<typeof MTLBlitOption>,
	): void

	generateMipmapsForTexture(texture: MTLTexture): void

	fillBufferRangeValue(buffer: MTLBuffer, range: _NSRange, value: number): void

	copyFromTextureSourceSliceSourceLevelToTextureDestinationSliceDestinationLevelSliceCountLevelCount(
		sourceTexture: MTLTexture,
		sourceSlice: number,
		sourceLevel: number,
		destinationTexture: MTLTexture,
		destinationSlice: number,
		destinationLevel: number,
		sliceCount: number,
		levelCount: number,
	): void

	copyFromTextureToTexture(sourceTexture: MTLTexture, destinationTexture: MTLTexture): void

	copyFromBufferSourceOffsetToBufferDestinationOffsetSize(
		sourceBuffer: MTLBuffer,
		sourceOffset: number,
		destinationBuffer: MTLBuffer,
		destinationOffset: number,
		size: number,
	): void

	updateFence(fence: MTLFence): void

	waitForFence(fence: MTLFence): void

	getTextureAccessCountersRegionMipLevelSliceResetCountersCountersBufferCountersBufferOffset?(
		texture: MTLTexture,
		region: MTLRegion,
		mipLevel: number,
		slice: number,
		resetCounters: boolean,
		countersBuffer: MTLBuffer,
		countersBufferOffset: number,
	): void

	resetTextureAccessCountersRegionMipLevelSlice?(
		texture: MTLTexture,
		region: MTLRegion,
		mipLevel: number,
		slice: number,
	): void

	optimizeContentsForGPUAccess(texture: MTLTexture): void

	optimizeContentsForGPUAccessSliceLevel(texture: MTLTexture, slice: number, level: number): void

	optimizeContentsForCPUAccess(texture: MTLTexture): void

	optimizeContentsForCPUAccessSliceLevel(texture: MTLTexture, slice: number, level: number): void

	resetCommandsInBufferWithRange(buffer: MTLIndirectCommandBuffer, range: _NSRange): void

	copyIndirectCommandBufferSourceRangeDestinationDestinationIndex(
		source: MTLIndirectCommandBuffer,
		sourceRange: _NSRange,
		destination: MTLIndirectCommandBuffer,
		destinationIndex: number,
	): void

	optimizeIndirectCommandBufferWithRange(
		indirectCommandBuffer: MTLIndirectCommandBuffer,
		range: _NSRange,
	): void

	sampleCountersInBufferAtSampleIndexWithBarrier(
		sampleBuffer: MTLCounterSampleBuffer,
		sampleIndex: number,
		barrier: boolean,
	): void

	resolveCountersInRangeDestinationBufferDestinationOffset(
		sampleBuffer: MTLCounterSampleBuffer,
		range: _NSRange,
		destinationBuffer: MTLBuffer,
		destinationOffset: number,
	): void
}

export declare class MTLBlitCommandEncoder extends NativeObject implements MTLBlitCommandEncoder {}

export declare interface MTLCounterSet extends NSObjectProtocol {
	readonly name: string

	readonly counters: NSArray
}

export declare class MTLCounterSet extends NativeObject implements MTLCounterSet {}

export declare interface MTLCounter extends NSObjectProtocol {
	readonly name: string
}

export declare class MTLCounter extends NativeObject implements MTLCounter {}

export declare interface MTLFunction extends NSObjectProtocol {
	label: string

	readonly device: MTLDevice

	readonly functionType: interop.Enum<typeof MTLFunctionType>

	readonly patchType: interop.Enum<typeof MTLPatchType>

	readonly patchControlPointCount: number

	readonly vertexAttributes: NSArray

	readonly stageInputAttributes: NSArray

	readonly name: string

	readonly functionConstantsDictionary: NSDictionary

	newArgumentEncoderWithBufferIndex(bufferIndex: number): MTLArgumentEncoder

	newArgumentEncoderWithBufferIndexReflection(
		bufferIndex: number,
		reflection: interop.PointerConvertible,
	): MTLArgumentEncoder

	readonly options: interop.Enum<typeof MTLFunctionOptions>
}

export declare class MTLFunction extends NativeObject implements MTLFunction {}

export declare interface MTLDevice extends NSObjectProtocol {
	readonly name: string

	readonly registryID: number

	readonly maxThreadsPerThreadgroup: MTLSize

	readonly lowPower: boolean

	readonly headless: boolean

	readonly removable: boolean

	readonly hasUnifiedMemory: boolean

	readonly recommendedMaxWorkingSetSize: number

	readonly location: interop.Enum<typeof MTLDeviceLocation>

	readonly locationNumber: number

	readonly maxTransferRate: number

	readonly depth24Stencil8PixelFormatSupported: boolean

	readonly readWriteTextureSupport: interop.Enum<typeof MTLReadWriteTextureTier>

	readonly argumentBuffersSupport: interop.Enum<typeof MTLArgumentBuffersTier>

	readonly rasterOrderGroupsSupported: boolean

	readonly supports32BitFloatFiltering: boolean

	readonly supports32BitMSAA: boolean

	readonly supportsQueryTextureLOD: boolean

	readonly supportsBCTextureCompression: boolean

	readonly supportsPullModelInterpolation: boolean

	readonly barycentricCoordsSupported: boolean

	readonly supportsShaderBarycentricCoordinates: boolean

	readonly currentAllocatedSize: number

	newCommandQueue(): MTLCommandQueue

	newCommandQueueWithMaxCommandBufferCount(maxCommandBufferCount: number): MTLCommandQueue

	heapTextureSizeAndAlignWithDescriptor(desc: MTLTextureDescriptor): MTLSizeAndAlign

	heapBufferSizeAndAlignWithLengthOptions(
		length: number,
		options: interop.Enum<typeof MTLResourceOptions>,
	): MTLSizeAndAlign

	newHeapWithDescriptor(descriptor: MTLHeapDescriptor): MTLHeap

	newBufferWithLengthOptions(
		length: number,
		options: interop.Enum<typeof MTLResourceOptions>,
	): MTLBuffer

	newBufferWithBytesLengthOptions(
		pointer: interop.PointerConvertible,
		length: number,
		options: interop.Enum<typeof MTLResourceOptions>,
	): MTLBuffer

	newBufferWithBytesNoCopyLengthOptionsDeallocator(
		pointer: interop.PointerConvertible,
		length: number,
		options: interop.Enum<typeof MTLResourceOptions>,
		deallocator: (p1: interop.PointerConvertible, p2: number) => void | null,
	): MTLBuffer

	newDepthStencilStateWithDescriptor(descriptor: MTLDepthStencilDescriptor): MTLDepthStencilState

	newTextureWithDescriptor(descriptor: MTLTextureDescriptor): MTLTexture

	newTextureWithDescriptorIosurfacePlane(
		descriptor: MTLTextureDescriptor,
		iosurface: interop.Object,
		plane: number,
	): MTLTexture

	newSharedTextureWithDescriptor(descriptor: MTLTextureDescriptor): MTLTexture

	newSharedTextureWithHandle(sharedHandle: MTLSharedTextureHandle): MTLTexture

	newSamplerStateWithDescriptor(descriptor: MTLSamplerDescriptor): MTLSamplerState

	newDefaultLibrary(): MTLLibrary

	newDefaultLibraryWithBundleError(bundle: NSBundle, error: interop.PointerConvertible): MTLLibrary

	newLibraryWithFileError(filepath: string, error: interop.PointerConvertible): MTLLibrary

	newLibraryWithURLError(url: NSURL, error: interop.PointerConvertible): MTLLibrary

	newLibraryWithDataError(data: NSObject, error: interop.PointerConvertible): MTLLibrary

	newLibraryWithSourceOptionsError(
		source: string,
		options: MTLCompileOptions | null,
		error: interop.PointerConvertible,
	): MTLLibrary

	newLibraryWithSourceOptionsCompletionHandler(
		source: string,
		options: MTLCompileOptions | null,
		completionHandler: (p1: MTLLibrary, p2: NSError) => void,
	): void

	newRenderPipelineStateWithDescriptorError(
		descriptor: MTLRenderPipelineDescriptor,
		error: interop.PointerConvertible,
	): MTLRenderPipelineState

	newRenderPipelineStateWithDescriptorOptionsReflectionError(
		descriptor: MTLRenderPipelineDescriptor,
		options: interop.Enum<typeof MTLPipelineOption>,
		reflection: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): MTLRenderPipelineState

	newRenderPipelineStateWithDescriptorCompletionHandler(
		descriptor: MTLRenderPipelineDescriptor,
		completionHandler: (p1: MTLRenderPipelineState, p2: NSError) => void,
	): void

	newRenderPipelineStateWithDescriptorOptionsCompletionHandler(
		descriptor: MTLRenderPipelineDescriptor,
		options: interop.Enum<typeof MTLPipelineOption>,
		completionHandler: (
			p1: MTLRenderPipelineState,
			p2: MTLRenderPipelineReflection,
			p3: NSError,
		) => void,
	): void

	newComputePipelineStateWithFunctionError(
		computeFunction: MTLFunction,
		error: interop.PointerConvertible,
	): MTLComputePipelineState

	newComputePipelineStateWithFunctionOptionsReflectionError(
		computeFunction: MTLFunction,
		options: interop.Enum<typeof MTLPipelineOption>,
		reflection: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): MTLComputePipelineState

	newComputePipelineStateWithFunctionCompletionHandler(
		computeFunction: MTLFunction,
		completionHandler: (p1: MTLComputePipelineState, p2: NSError) => void,
	): void

	newComputePipelineStateWithFunctionOptionsCompletionHandler(
		computeFunction: MTLFunction,
		options: interop.Enum<typeof MTLPipelineOption>,
		completionHandler: (
			p1: MTLComputePipelineState,
			p2: MTLComputePipelineReflection,
			p3: NSError,
		) => void,
	): void

	newComputePipelineStateWithDescriptorOptionsReflectionError(
		descriptor: MTLComputePipelineDescriptor,
		options: interop.Enum<typeof MTLPipelineOption>,
		reflection: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): MTLComputePipelineState

	newComputePipelineStateWithDescriptorOptionsCompletionHandler(
		descriptor: MTLComputePipelineDescriptor,
		options: interop.Enum<typeof MTLPipelineOption>,
		completionHandler: (
			p1: MTLComputePipelineState,
			p2: MTLComputePipelineReflection,
			p3: NSError,
		) => void,
	): void

	newFence(): MTLFence

	supportsFeatureSet(featureSet: interop.Enum<typeof MTLFeatureSet>): boolean

	supportsFamily(gpuFamily: interop.Enum<typeof MTLGPUFamily>): boolean

	supportsTextureSampleCount(sampleCount: number): boolean

	minimumLinearTextureAlignmentForPixelFormat(format: interop.Enum<typeof MTLPixelFormat>): number

	minimumTextureBufferAlignmentForPixelFormat(format: interop.Enum<typeof MTLPixelFormat>): number

	newRenderPipelineStateWithTileDescriptorOptionsReflectionError(
		descriptor: MTLTileRenderPipelineDescriptor,
		options: interop.Enum<typeof MTLPipelineOption>,
		reflection: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): MTLRenderPipelineState

	newRenderPipelineStateWithTileDescriptorOptionsCompletionHandler(
		descriptor: MTLTileRenderPipelineDescriptor,
		options: interop.Enum<typeof MTLPipelineOption>,
		completionHandler: (
			p1: MTLRenderPipelineState,
			p2: MTLRenderPipelineReflection,
			p3: NSError,
		) => void,
	): void

	readonly maxThreadgroupMemoryLength: number

	readonly maxArgumentBufferSamplerCount: number

	readonly programmableSamplePositionsSupported: boolean

	getDefaultSamplePositionsCount(positions: interop.PointerConvertible, count: number): void

	newArgumentEncoderWithArguments(
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
	): MTLArgumentEncoder

	supportsRasterizationRateMapWithLayerCount(layerCount: number): boolean

	newRasterizationRateMapWithDescriptor(
		descriptor: MTLRasterizationRateMapDescriptor,
	): MTLRasterizationRateMap

	newIndirectCommandBufferWithDescriptorMaxCommandCountOptions(
		descriptor: MTLIndirectCommandBufferDescriptor,
		maxCount: number,
		options: interop.Enum<typeof MTLResourceOptions>,
	): MTLIndirectCommandBuffer

	newEvent(): MTLEvent

	newSharedEvent(): MTLSharedEvent

	newSharedEventWithHandle(sharedEventHandle: MTLSharedEventHandle): MTLSharedEvent

	readonly peerGroupID: number

	readonly peerIndex: number

	readonly peerCount: number

	sparseTileSizeWithTextureTypePixelFormatSampleCount(
		textureType: interop.Enum<typeof MTLTextureType>,
		pixelFormat: interop.Enum<typeof MTLPixelFormat>,
		sampleCount: number,
	): MTLSize

	readonly sparseTileSizeInBytes: number

	convertSparsePixelRegionsToTileRegionsWithTileSizeAlignmentModeNumRegions?(
		pixelRegions: interop.PointerConvertible,
		tileRegions: interop.PointerConvertible,
		tileSize: MTLSize,
		mode: interop.Enum<typeof MTLSparseTextureRegionAlignmentMode>,
		numRegions: number,
	): void

	convertSparseTileRegionsToPixelRegionsWithTileSizeNumRegions?(
		tileRegions: interop.PointerConvertible,
		pixelRegions: interop.PointerConvertible,
		tileSize: MTLSize,
		numRegions: number,
	): void

	readonly maxBufferLength: number

	readonly counterSets: NSArray

	newCounterSampleBufferWithDescriptorError(
		descriptor: MTLCounterSampleBufferDescriptor,
		error: interop.PointerConvertible,
	): MTLCounterSampleBuffer

	sampleTimestampsGpuTimestamp(
		cpuTimestamp: interop.PointerConvertible,
		gpuTimestamp: interop.PointerConvertible,
	): void

	supportsCounterSampling(samplingPoint: interop.Enum<typeof MTLCounterSamplingPoint>): boolean

	supportsVertexAmplificationCount(count: number): boolean

	readonly supportsDynamicLibraries: boolean

	newDynamicLibraryError(library: MTLLibrary, error: interop.PointerConvertible): MTLDynamicLibrary

	newDynamicLibraryWithURLError(url: NSURL, error: interop.PointerConvertible): MTLDynamicLibrary

	newBinaryArchiveWithDescriptorError(
		descriptor: MTLBinaryArchiveDescriptor,
		error: interop.PointerConvertible,
	): MTLBinaryArchive

	readonly supportsRaytracing: boolean

	accelerationStructureSizesWithDescriptor(
		descriptor: MTLAccelerationStructureDescriptor,
	): MTLAccelerationStructureSizes

	newAccelerationStructureWithSize(size: number): MTLAccelerationStructure

	newAccelerationStructureWithDescriptor(
		descriptor: MTLAccelerationStructureDescriptor,
	): MTLAccelerationStructure

	readonly supportsFunctionPointers: boolean

	readonly supportsPrimitiveMotionBlur: boolean

	isLowPower(): boolean

	isHeadless(): boolean

	isRemovable(): boolean

	isDepth24Stencil8PixelFormatSupported(): boolean

	areRasterOrderGroupsSupported(): boolean

	areBarycentricCoordsSupported(): boolean

	areProgrammableSamplePositionsSupported(): boolean
}

export declare class MTLDevice extends NativeObject implements MTLDevice {}

export declare interface MTLBuffer extends MTLResource {
	readonly length: number

	contents(): interop.Pointer

	didModifyRange(range: _NSRange): void

	newTextureWithDescriptorOffsetBytesPerRow(
		descriptor: MTLTextureDescriptor,
		offset: number,
		bytesPerRow: number,
	): MTLTexture

	addDebugMarkerRange(marker: string, range: _NSRange): void

	removeAllDebugMarkers(): void

	readonly remoteStorageBuffer: MTLBuffer

	newRemoteBufferViewForDevice(device: MTLDevice): MTLBuffer
}

export declare class MTLBuffer extends NativeObject implements MTLBuffer {}

export declare interface MTLCommandEncoder extends NSObjectProtocol {
	readonly device: MTLDevice

	label: string

	endEncoding(): void

	insertDebugSignpost(string: string): void

	pushDebugGroup(string: string): void

	popDebugGroup(): void
}

export declare class MTLCommandEncoder extends NativeObject implements MTLCommandEncoder {}

export declare interface MTLIndirectComputeCommand extends NSObjectProtocol {
	setComputePipelineState(pipelineState: MTLComputePipelineState): void

	setKernelBufferOffsetAtIndex(buffer: MTLBuffer, offset: number, index: number): void

	concurrentDispatchThreadgroupsThreadsPerThreadgroup(
		threadgroupsPerGrid: MTLSize,
		threadsPerThreadgroup: MTLSize,
	): void

	concurrentDispatchThreadsThreadsPerThreadgroup(
		threadsPerGrid: MTLSize,
		threadsPerThreadgroup: MTLSize,
	): void

	setBarrier(): void

	clearBarrier(): void

	setImageblockWidthHeight(width: number, height: number): void

	reset(): void

	setThreadgroupMemoryLengthAtIndex(length: number, index: number): void

	setStageInRegion(region: MTLRegion): void
}

export declare class MTLIndirectComputeCommand
	extends NativeObject
	implements MTLIndirectComputeCommand {}

export declare interface MTLDrawable extends NSObjectProtocol {
	present(): void

	presentAtTime(presentationTime: number): void

	presentAfterMinimumDuration(duration: number): void

	addPresentedHandler(block: (p1: MTLDrawable) => void): void

	readonly presentedTime: number

	readonly drawableID: number
}

export declare class MTLDrawable extends NativeObject implements MTLDrawable {}

export declare interface MTLAccelerationStructure extends MTLResource {
	readonly size: number
}

export declare class MTLAccelerationStructure
	extends NativeObject
	implements MTLAccelerationStructure {}

export declare interface MTLLogContainer extends NSObjectProtocol, NSFastEnumeration {}

export declare class MTLLogContainer extends NativeObject implements MTLLogContainer {}

export declare interface MTLFence extends NSObjectProtocol {
	readonly device: MTLDevice

	label: string
}

export declare class MTLFence extends NativeObject implements MTLFence {}

export declare interface MTLDepthStencilState extends NSObjectProtocol {
	readonly label: string

	readonly device: MTLDevice
}

export declare class MTLDepthStencilState extends NativeObject implements MTLDepthStencilState {}

export declare interface MTLResource extends MTLAllocation {
	label: string

	readonly device: MTLDevice

	readonly cpuCacheMode: interop.Enum<typeof MTLCPUCacheMode>

	readonly storageMode: interop.Enum<typeof MTLStorageMode>

	readonly hazardTrackingMode: interop.Enum<typeof MTLHazardTrackingMode>

	readonly resourceOptions: interop.Enum<typeof MTLResourceOptions>

	setPurgeableState(
		state: interop.Enum<typeof MTLPurgeableState>,
	): interop.Enum<typeof MTLPurgeableState>

	readonly heap: MTLHeap

	readonly heapOffset: number

	readonly allocatedSize: number

	makeAliasable(): void

	isAliasable(): boolean
}

export declare class MTLResource extends NativeObject implements MTLResource {}

export declare interface MTLTexture extends MTLResource {
	readonly rootResource: MTLResource

	readonly parentTexture: MTLTexture

	readonly parentRelativeLevel: number

	readonly parentRelativeSlice: number

	readonly buffer: MTLBuffer

	readonly bufferOffset: number

	readonly bufferBytesPerRow: number

	readonly iosurface: interop.Object

	readonly iosurfacePlane: number

	readonly textureType: interop.Enum<typeof MTLTextureType>

	readonly pixelFormat: interop.Enum<typeof MTLPixelFormat>

	readonly width: number

	readonly height: number

	readonly depth: number

	readonly mipmapLevelCount: number

	readonly sampleCount: number

	readonly arrayLength: number

	readonly usage: interop.Enum<typeof MTLTextureUsage>

	readonly shareable: boolean

	readonly framebufferOnly: boolean

	readonly firstMipmapInTail?: number

	readonly tailSizeInBytes?: number

	readonly isSparse?: boolean

	readonly allowGPUOptimizedContents: boolean

	getBytesBytesPerRowBytesPerImageFromRegionMipmapLevelSlice(
		pixelBytes: interop.PointerConvertible,
		bytesPerRow: number,
		bytesPerImage: number,
		region: MTLRegion,
		level: number,
		slice: number,
	): void

	replaceRegionMipmapLevelSliceWithBytesBytesPerRowBytesPerImage(
		region: MTLRegion,
		level: number,
		slice: number,
		pixelBytes: interop.PointerConvertible,
		bytesPerRow: number,
		bytesPerImage: number,
	): void

	getBytesBytesPerRowFromRegionMipmapLevel(
		pixelBytes: interop.PointerConvertible,
		bytesPerRow: number,
		region: MTLRegion,
		level: number,
	): void

	replaceRegionMipmapLevelWithBytesBytesPerRow(
		region: MTLRegion,
		level: number,
		pixelBytes: interop.PointerConvertible,
		bytesPerRow: number,
	): void

	newTextureViewWithPixelFormat(pixelFormat: interop.Enum<typeof MTLPixelFormat>): MTLTexture

	newTextureViewWithPixelFormatTextureTypeLevelsSlices(
		pixelFormat: interop.Enum<typeof MTLPixelFormat>,
		textureType: interop.Enum<typeof MTLTextureType>,
		levelRange: _NSRange,
		sliceRange: _NSRange,
	): MTLTexture

	newSharedTextureHandle(): MTLSharedTextureHandle

	readonly remoteStorageTexture: MTLTexture

	newRemoteTextureViewForDevice(device: MTLDevice): MTLTexture

	readonly swizzle: MTLTextureSwizzleChannels

	newTextureViewWithPixelFormatTextureTypeLevelsSlicesSwizzle(
		pixelFormat: interop.Enum<typeof MTLPixelFormat>,
		textureType: interop.Enum<typeof MTLTextureType>,
		levelRange: _NSRange,
		sliceRange: _NSRange,
		swizzle: MTLTextureSwizzleChannels,
	): MTLTexture

	isShareable(): boolean

	isFramebufferOnly(): boolean
}

export declare class MTLTexture extends NativeObject implements MTLTexture {}

export declare interface MTLEvent extends NSObjectProtocol {
	readonly device: MTLDevice

	label: string
}

export declare class MTLEvent extends NativeObject implements MTLEvent {}

export declare interface MTLVisibleFunctionTable extends MTLResource {
	setFunctionAtIndex(function$: MTLFunctionHandle | null, index: number): void

	setFunctionsWithRange(functions: interop.PointerConvertible, range: _NSRange): void
}

export declare class MTLVisibleFunctionTable
	extends NativeObject
	implements MTLVisibleFunctionTable {}

export declare interface MTLFunctionLogDebugLocation extends NSObjectProtocol {
	readonly functionName: string

	readonly URL: NSURL

	readonly line: number

	readonly column: number
}

export declare class MTLFunctionLogDebugLocation
	extends NativeObject
	implements MTLFunctionLogDebugLocation {}

export declare interface MTLCaptureScope extends NSObjectProtocol {
	beginScope(): void

	endScope(): void

	label: string

	readonly device: MTLDevice

	readonly commandQueue: MTLCommandQueue

	readonly mtl4CommandQueue: MTL4CommandQueue
}

export declare class MTLCaptureScope extends NativeObject implements MTLCaptureScope {}

export declare interface MTLComputePipelineState extends MTLAllocation, NSObjectProtocol {
	readonly label: string

	readonly device: MTLDevice

	readonly maxTotalThreadsPerThreadgroup: number

	readonly threadExecutionWidth: number

	readonly staticThreadgroupMemoryLength: number

	imageblockMemoryLengthForDimensions(imageblockDimensions: MTLSize): number

	readonly supportIndirectCommandBuffers: boolean

	functionHandleWithFunction(function$: MTLFunction): MTLFunctionHandle

	newComputePipelineStateWithAdditionalBinaryFunctionsError(
		functions: NSArray<interop.Object> | Array<interop.Object>,
		error: interop.PointerConvertible,
	): MTLComputePipelineState

	newVisibleFunctionTableWithDescriptor(
		descriptor: MTLVisibleFunctionTableDescriptor,
	): MTLVisibleFunctionTable

	newIntersectionFunctionTableWithDescriptor(
		descriptor: MTLIntersectionFunctionTableDescriptor,
	): MTLIntersectionFunctionTable
}

export declare class MTLComputePipelineState
	extends NativeObject
	implements MTLComputePipelineState {}

export declare interface MTLFunctionHandle extends NSObjectProtocol {
	readonly functionType: interop.Enum<typeof MTLFunctionType>

	readonly name: string

	readonly device: MTLDevice
}

export declare class MTLFunctionHandle extends NativeObject implements MTLFunctionHandle {}

export declare interface MTLRasterizationRateMap extends NSObjectProtocol {
	readonly device: MTLDevice

	readonly label: string

	readonly screenSize: MTLSize

	readonly physicalGranularity: MTLSize

	readonly layerCount: number

	readonly parameterBufferSizeAndAlign: MTLSizeAndAlign

	copyParameterDataToBufferOffset(buffer: MTLBuffer, offset: number): void

	physicalSizeForLayer(layerIndex: number): MTLSize

	mapScreenToPhysicalCoordinatesForLayer(
		screenCoordinates: MTLSamplePosition,
		layerIndex: number,
	): MTLSamplePosition

	mapPhysicalToScreenCoordinatesForLayer(
		physicalCoordinates: MTLSamplePosition,
		layerIndex: number,
	): MTLSamplePosition
}

export declare class MTLRasterizationRateMap
	extends NativeObject
	implements MTLRasterizationRateMap {}

export declare interface MTLCounterSampleBuffer extends NSObjectProtocol {
	readonly device: MTLDevice

	readonly label: string

	readonly sampleCount: number

	resolveCounterRange(range: _NSRange): NSData
}

export declare class MTLCounterSampleBuffer
	extends NativeObject
	implements MTLCounterSampleBuffer {}

export declare class MTLStageInputOutputDescriptor extends NSObject implements NSCopying {
	static stageInputOutputDescriptor(): MTLStageInputOutputDescriptor

	readonly layouts: MTLBufferLayoutDescriptorArray

	readonly attributes: MTLAttributeDescriptorArray

	indexType: interop.Enum<typeof MTLIndexType>

	indexBufferIndex: number

	reset(): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVisibleFunctionTableDescriptor extends NSObject implements NSCopying {
	static visibleFunctionTableDescriptor(): MTLVisibleFunctionTableDescriptor

	functionCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRenderPipelineReflection extends NSObject {
	readonly vertexArguments: NSArray

	readonly fragmentArguments: NSArray

	readonly tileArguments: NSArray
}

export declare class MTLBufferLayoutDescriptorArray extends NSObject {
	objectAtIndexedSubscript(index: number): MTLBufferLayoutDescriptor

	setObjectAtIndexedSubscript(bufferDesc: MTLBufferLayoutDescriptor | null, index: number): void
}

export declare class MTLAttributeDescriptor extends NSObject implements NSCopying {
	format: interop.Enum<typeof MTLAttributeFormat>

	offset: number

	bufferIndex: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLIntersectionFunctionTableDescriptor extends NSObject implements NSCopying {
	static intersectionFunctionTableDescriptor(): MTLIntersectionFunctionTableDescriptor

	functionCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRenderPassAttachmentDescriptor extends NSObject implements NSCopying {
	texture: MTLTexture

	level: number

	slice: number

	depthPlane: number

	resolveTexture: MTLTexture

	resolveLevel: number

	resolveSlice: number

	resolveDepthPlane: number

	loadAction: interop.Enum<typeof MTLLoadAction>

	storeAction: interop.Enum<typeof MTLStoreAction>

	storeActionOptions: interop.Enum<typeof MTLStoreActionOptions>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRasterizationRateMapDescriptor extends NSObject implements NSCopying {
	static rasterizationRateMapDescriptorWithScreenSize(
		screenSize: MTLSize,
	): MTLRasterizationRateMapDescriptor

	static rasterizationRateMapDescriptorWithScreenSizeLayer(
		screenSize: MTLSize,
		layer: MTLRasterizationRateLayerDescriptor,
	): MTLRasterizationRateMapDescriptor

	static rasterizationRateMapDescriptorWithScreenSizeLayerCountLayers(
		screenSize: MTLSize,
		layerCount: number,
		layers: interop.PointerConvertible,
	): MTLRasterizationRateMapDescriptor

	layerAtIndex(layerIndex: number): MTLRasterizationRateLayerDescriptor | null

	setLayerAtIndex(layer: MTLRasterizationRateLayerDescriptor | null, layerIndex: number): void

	readonly layers: MTLRasterizationRateLayerArray

	screenSize: MTLSize

	label: string

	readonly layerCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLCounterSampleBufferDescriptor extends NSObject implements NSCopying {
	counterSet: MTLCounterSet

	label: string

	storageMode: interop.Enum<typeof MTLStorageMode>

	sampleCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLComputePipelineDescriptor extends NSObject implements NSCopying {
	label: string

	computeFunction: MTLFunction

	threadGroupSizeIsMultipleOfThreadExecutionWidth: boolean

	maxTotalThreadsPerThreadgroup: number

	stageInputDescriptor: MTLStageInputOutputDescriptor

	readonly buffers: MTLPipelineBufferDescriptorArray

	supportIndirectCommandBuffers: boolean

	get insertLibraries(): NSArray
	set insertLibraries(value: NSArray<interop.Object> | Array<interop.Object>)

	get binaryArchives(): NSArray
	set binaryArchives(value: NSArray<interop.Object> | Array<interop.Object>)

	reset(): void

	linkedFunctions: MTLLinkedFunctions

	supportAddingBinaryFunctions: boolean

	maxCallStackDepth: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLBlitPassSampleBufferAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(attachmentIndex: number): MTLBlitPassSampleBufferAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLBlitPassSampleBufferAttachmentDescriptor | null,
		attachmentIndex: number,
	): void
}

export declare class MTLComputePassDescriptor extends NSObject implements NSCopying {
	static computePassDescriptor(): MTLComputePassDescriptor

	dispatchType: interop.Enum<typeof MTLDispatchType>

	readonly sampleBufferAttachments: MTLComputePassSampleBufferAttachmentDescriptorArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLAttributeDescriptorArray extends NSObject {
	objectAtIndexedSubscript(index: number): MTLAttributeDescriptor

	setObjectAtIndexedSubscript(attributeDesc: MTLAttributeDescriptor | null, index: number): void
}

export declare class MTLBinaryArchiveDescriptor extends NSObject implements NSCopying {
	url: NSURL

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRasterizationRateSampleArray extends NSObject {
	objectAtIndexedSubscript(index: number): NSNumber

	setObjectAtIndexedSubscript(value: NSNumber, index: number): void
}

export declare class MTLIndirectCommandBufferDescriptor extends NSObject implements NSCopying {
	commandTypes: interop.Enum<typeof MTLIndirectCommandType>

	inheritPipelineState: boolean

	inheritBuffers: boolean

	maxVertexBufferBindCount: number

	maxFragmentBufferBindCount: number

	maxKernelBufferBindCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLSharedEventListener extends NSObject {
	init(): this

	initWithDispatchQueue(dispatchQueue: NSObject): this

	readonly dispatchQueue: NSObject
}

export declare class MTLHeapDescriptor extends NSObject implements NSCopying {
	size: number

	storageMode: interop.Enum<typeof MTLStorageMode>

	cpuCacheMode: interop.Enum<typeof MTLCPUCacheMode>

	hazardTrackingMode: interop.Enum<typeof MTLHazardTrackingMode>

	resourceOptions: interop.Enum<typeof MTLResourceOptions>

	type: interop.Enum<typeof MTLHeapType>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLPrimitiveAccelerationStructureDescriptor extends MTLAccelerationStructureDescriptor {
	get geometryDescriptors(): NSArray
	set geometryDescriptors(value: NSArray<interop.Object> | Array<interop.Object>)

	static descriptor<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class MTLTileRenderPipelineColorAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(attachmentIndex: number): MTLTileRenderPipelineColorAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLTileRenderPipelineColorAttachmentDescriptor,
		attachmentIndex: number,
	): void
}

export declare class MTLPipelineBufferDescriptorArray extends NSObject {
	objectAtIndexedSubscript(bufferIndex: number): MTLPipelineBufferDescriptor

	setObjectAtIndexedSubscript(buffer: MTLPipelineBufferDescriptor | null, bufferIndex: number): void
}

export declare class MTLSharedTextureHandle extends NSObject implements NSSecureCoding {
	readonly device: MTLDevice

	readonly label: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MTLBufferLayoutDescriptor extends NSObject implements NSCopying {
	stride: number

	stepFunction: interop.Enum<typeof MTLStepFunction>

	stepRate: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVertexDescriptor extends NSObject implements NSCopying {
	static vertexDescriptor(): MTLVertexDescriptor

	readonly layouts: MTLVertexBufferLayoutDescriptorArray

	readonly attributes: MTLVertexAttributeDescriptorArray

	reset(): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVertexAttributeDescriptor extends NSObject implements NSCopying {
	format: interop.Enum<typeof MTLVertexFormat>

	offset: number

	bufferIndex: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVertexBufferLayoutDescriptor extends NSObject implements NSCopying {
	stride: number

	stepFunction: interop.Enum<typeof MTLVertexStepFunction>

	stepRate: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLStencilDescriptor extends NSObject implements NSCopying {
	stencilCompareFunction: interop.Enum<typeof MTLCompareFunction>

	stencilFailureOperation: interop.Enum<typeof MTLStencilOperation>

	depthFailureOperation: interop.Enum<typeof MTLStencilOperation>

	depthStencilPassOperation: interop.Enum<typeof MTLStencilOperation>

	readMask: number

	writeMask: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLComputePassSampleBufferAttachmentDescriptor
	extends NSObject
	implements NSCopying
{
	sampleBuffer: MTLCounterSampleBuffer

	startOfEncoderSampleIndex: number

	endOfEncoderSampleIndex: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLCommandBufferDescriptor extends NSObject implements NSCopying {
	retainedReferences: boolean

	errorOptions: interop.Enum<typeof MTLCommandBufferErrorOption>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRenderPassSampleBufferAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(attachmentIndex: number): MTLRenderPassSampleBufferAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLRenderPassSampleBufferAttachmentDescriptor | null,
		attachmentIndex: number,
	): void
}

export declare class MTLResourceStatePassSampleBufferAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(
		attachmentIndex: number,
	): MTLResourceStatePassSampleBufferAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLResourceStatePassSampleBufferAttachmentDescriptor | null,
		attachmentIndex: number,
	): void
}

export declare class MTLResourceStatePassSampleBufferAttachmentDescriptor
	extends NSObject
	implements NSCopying
{
	sampleBuffer: MTLCounterSampleBuffer

	startOfEncoderSampleIndex: number

	endOfEncoderSampleIndex: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLArgumentDescriptor extends NSObject implements NSCopying {
	static argumentDescriptor(): MTLArgumentDescriptor

	dataType: interop.Enum<typeof MTLDataType>

	index: number

	arrayLength: number

	access: interop.Enum<typeof MTLBindingAccess>

	textureType: interop.Enum<typeof MTLTextureType>

	constantBlockAlignment: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLCompileOptions extends NSObject implements NSCopying {
	get preprocessorMacros(): NSDictionary
	set preprocessorMacros(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	fastMathEnabled: boolean

	languageVersion: interop.Enum<typeof MTLLanguageVersion>

	libraryType: interop.Enum<typeof MTLLibraryType>

	installName: string

	get libraries(): NSArray
	set libraries(value: NSArray<interop.Object> | Array<interop.Object>)

	preserveInvariance: boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVertexAttribute extends NSObject {
	readonly name: string

	readonly attributeIndex: number

	readonly attributeType: interop.Enum<typeof MTLDataType>

	readonly active: boolean

	readonly patchData: boolean

	readonly patchControlPointData: boolean

	isActive(): boolean

	isPatchData(): boolean

	isPatchControlPointData(): boolean
}

export declare class MTLIntersectionFunctionDescriptor
	extends MTLFunctionDescriptor
	implements NSCopying
{
	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLStructMember extends NSObject {
	readonly name: string

	readonly offset: number

	readonly dataType: interop.Enum<typeof MTLDataType>

	structType(): MTLStructType

	arrayType(): MTLArrayType

	textureReferenceType(): MTLTextureReferenceType

	pointerType(): MTLPointerType

	readonly argumentIndex: number
}

export declare class MTLType extends NSObject {
	readonly dataType: interop.Enum<typeof MTLDataType>
}

export declare class MTLRenderPassColorAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(attachmentIndex: number): MTLRenderPassColorAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLRenderPassColorAttachmentDescriptor | null,
		attachmentIndex: number,
	): void
}

export declare class MTLTextureDescriptor extends NSObject implements NSCopying {
	static texture2DDescriptorWithPixelFormatWidthHeightMipmapped(
		pixelFormat: interop.Enum<typeof MTLPixelFormat>,
		width: number,
		height: number,
		mipmapped: boolean,
	): MTLTextureDescriptor

	static textureCubeDescriptorWithPixelFormatSizeMipmapped(
		pixelFormat: interop.Enum<typeof MTLPixelFormat>,
		size: number,
		mipmapped: boolean,
	): MTLTextureDescriptor

	static textureBufferDescriptorWithPixelFormatWidthResourceOptionsUsage(
		pixelFormat: interop.Enum<typeof MTLPixelFormat>,
		width: number,
		resourceOptions: interop.Enum<typeof MTLResourceOptions>,
		usage: interop.Enum<typeof MTLTextureUsage>,
	): MTLTextureDescriptor

	textureType: interop.Enum<typeof MTLTextureType>

	pixelFormat: interop.Enum<typeof MTLPixelFormat>

	width: number

	height: number

	depth: number

	mipmapLevelCount: number

	sampleCount: number

	arrayLength: number

	resourceOptions: interop.Enum<typeof MTLResourceOptions>

	cpuCacheMode: interop.Enum<typeof MTLCPUCacheMode>

	storageMode: interop.Enum<typeof MTLStorageMode>

	hazardTrackingMode: interop.Enum<typeof MTLHazardTrackingMode>

	usage: interop.Enum<typeof MTLTextureUsage>

	allowGPUOptimizedContents: boolean

	swizzle: MTLTextureSwizzleChannels

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLTextureReferenceType extends MTLType {
	readonly textureDataType: interop.Enum<typeof MTLDataType>

	readonly textureType: interop.Enum<typeof MTLTextureType>

	readonly access: interop.Enum<typeof MTLBindingAccess>

	readonly isDepthTexture: boolean
}

export declare class MTLRenderPassDepthAttachmentDescriptor extends MTLRenderPassAttachmentDescriptor {
	clearDepth: number

	depthResolveFilter: interop.Enum<typeof MTLMultisampleDepthResolveFilter>
}

export declare class MTLStructType extends MTLType {
	readonly members: NSArray

	memberByName(name: string): MTLStructMember
}

export declare class MTLPipelineBufferDescriptor extends NSObject implements NSCopying {
	mutability: interop.Enum<typeof MTLMutability>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRenderPipelineDescriptor extends NSObject implements NSCopying {
	label: string

	vertexFunction: MTLFunction

	fragmentFunction: MTLFunction

	vertexDescriptor: MTLVertexDescriptor

	sampleCount: number

	rasterSampleCount: number

	alphaToCoverageEnabled: boolean

	alphaToOneEnabled: boolean

	rasterizationEnabled: boolean

	maxVertexAmplificationCount: number

	readonly colorAttachments: MTLRenderPipelineColorAttachmentDescriptorArray

	depthAttachmentPixelFormat: interop.Enum<typeof MTLPixelFormat>

	stencilAttachmentPixelFormat: interop.Enum<typeof MTLPixelFormat>

	inputPrimitiveTopology: interop.Enum<typeof MTLPrimitiveTopologyClass>

	tessellationPartitionMode: interop.Enum<typeof MTLTessellationPartitionMode>

	maxTessellationFactor: number

	tessellationFactorScaleEnabled: boolean

	tessellationFactorFormat: interop.Enum<typeof MTLTessellationFactorFormat>

	tessellationControlPointIndexType: interop.Enum<typeof MTLTessellationControlPointIndexType>

	tessellationFactorStepFunction: interop.Enum<typeof MTLTessellationFactorStepFunction>

	tessellationOutputWindingOrder: interop.Enum<typeof MTLWinding>

	readonly vertexBuffers: MTLPipelineBufferDescriptorArray

	readonly fragmentBuffers: MTLPipelineBufferDescriptorArray

	supportIndirectCommandBuffers: boolean

	get binaryArchives(): NSArray
	set binaryArchives(value: NSArray<interop.Object> | Array<interop.Object>)

	reset(): void

	isAlphaToCoverageEnabled(): boolean

	isAlphaToOneEnabled(): boolean

	isRasterizationEnabled(): boolean

	isTessellationFactorScaleEnabled(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLPointerType extends MTLType {
	readonly elementType: interop.Enum<typeof MTLDataType>

	readonly access: interop.Enum<typeof MTLBindingAccess>

	readonly alignment: number

	readonly dataSize: number

	readonly elementIsArgumentBuffer: boolean

	elementStructType(): MTLStructType

	elementArrayType(): MTLArrayType
}

export declare class MTLRenderPipelineColorAttachmentDescriptor
	extends NSObject
	implements NSCopying
{
	pixelFormat: interop.Enum<typeof MTLPixelFormat>

	blendingEnabled: boolean

	sourceRGBBlendFactor: interop.Enum<typeof MTLBlendFactor>

	destinationRGBBlendFactor: interop.Enum<typeof MTLBlendFactor>

	rgbBlendOperation: interop.Enum<typeof MTLBlendOperation>

	sourceAlphaBlendFactor: interop.Enum<typeof MTLBlendFactor>

	destinationAlphaBlendFactor: interop.Enum<typeof MTLBlendFactor>

	alphaBlendOperation: interop.Enum<typeof MTLBlendOperation>

	writeMask: interop.Enum<typeof MTLColorWriteMask>

	isBlendingEnabled(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLArrayType extends MTLType {
	readonly elementType: interop.Enum<typeof MTLDataType>

	readonly arrayLength: number

	readonly stride: number

	readonly argumentIndexStride: number

	elementStructType(): MTLStructType

	elementArrayType(): MTLArrayType

	elementTextureReferenceType(): MTLTextureReferenceType

	elementPointerType(): MTLPointerType
}

export declare class MTLRenderPassSampleBufferAttachmentDescriptor
	extends NSObject
	implements NSCopying
{
	sampleBuffer: MTLCounterSampleBuffer

	startOfVertexSampleIndex: number

	endOfVertexSampleIndex: number

	startOfFragmentSampleIndex: number

	endOfFragmentSampleIndex: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLInstanceAccelerationStructureDescriptor extends MTLAccelerationStructureDescriptor {
	instanceDescriptorBuffer: MTLBuffer

	instanceDescriptorBufferOffset: number

	instanceDescriptorStride: number

	instanceCount: number

	get instancedAccelerationStructures(): NSArray
	set instancedAccelerationStructures(value: NSArray<interop.Object> | Array<interop.Object>)

	static descriptor<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class MTLTileRenderPipelineDescriptor extends NSObject implements NSCopying {
	label: string

	tileFunction: MTLFunction

	rasterSampleCount: number

	readonly colorAttachments: MTLTileRenderPipelineColorAttachmentDescriptorArray

	threadgroupSizeMatchesTileSize: boolean

	readonly tileBuffers: MTLPipelineBufferDescriptorArray

	maxTotalThreadsPerThreadgroup: number

	get binaryArchives(): NSArray
	set binaryArchives(value: NSArray<interop.Object> | Array<interop.Object>)

	reset(): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLComputePipelineReflection extends NSObject {
	readonly arguments$: NSArray

	arguments(): NSArray
}

export declare class MTLAccelerationStructureTriangleGeometryDescriptor extends MTLAccelerationStructureGeometryDescriptor {
	vertexBuffer: MTLBuffer

	vertexBufferOffset: number

	vertexStride: number

	indexBuffer: MTLBuffer

	indexBufferOffset: number

	indexType: interop.Enum<typeof MTLIndexType>

	triangleCount: number

	static descriptor<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class MTLRenderPassDescriptor extends NSObject implements NSCopying {
	static renderPassDescriptor(): MTLRenderPassDescriptor

	readonly colorAttachments: MTLRenderPassColorAttachmentDescriptorArray

	depthAttachment: MTLRenderPassDepthAttachmentDescriptor

	stencilAttachment: MTLRenderPassStencilAttachmentDescriptor

	visibilityResultBuffer: MTLBuffer

	renderTargetArrayLength: number

	imageblockSampleLength: number

	threadgroupMemoryLength: number

	tileWidth: number

	tileHeight: number

	defaultRasterSampleCount: number

	renderTargetWidth: number

	renderTargetHeight: number

	setSamplePositionsCount(positions: interop.PointerConvertible, count: number): void

	getSamplePositionsCount(positions: interop.PointerConvertible, count: number): number

	rasterizationRateMap: MTLRasterizationRateMap

	readonly sampleBufferAttachments: MTLRenderPassSampleBufferAttachmentDescriptorArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLSharedEventHandle extends NSObject implements NSSecureCoding {
	readonly label: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MTLRenderPassStencilAttachmentDescriptor extends MTLRenderPassAttachmentDescriptor {
	clearStencil: number

	stencilResolveFilter: interop.Enum<typeof MTLMultisampleStencilResolveFilter>
}

export declare class MTLComputePassSampleBufferAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(attachmentIndex: number): MTLComputePassSampleBufferAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLComputePassSampleBufferAttachmentDescriptor | null,
		attachmentIndex: number,
	): void
}

export declare class MTLBlitPassDescriptor extends NSObject implements NSCopying {
	static blitPassDescriptor(): MTLBlitPassDescriptor

	readonly sampleBufferAttachments: MTLBlitPassSampleBufferAttachmentDescriptorArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRenderPassColorAttachmentDescriptor extends MTLRenderPassAttachmentDescriptor {
	clearColor: MTLClearColor
}

export declare class MTLResourceStatePassDescriptor extends NSObject implements NSCopying {
	static resourceStatePassDescriptor(): MTLResourceStatePassDescriptor

	readonly sampleBufferAttachments: MTLResourceStatePassSampleBufferAttachmentDescriptorArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVertexBufferLayoutDescriptorArray extends NSObject {
	objectAtIndexedSubscript(index: number): MTLVertexBufferLayoutDescriptor

	setObjectAtIndexedSubscript(
		bufferDesc: MTLVertexBufferLayoutDescriptor | null,
		index: number,
	): void
}

export declare class MTLSamplerDescriptor extends NSObject implements NSCopying {
	minFilter: interop.Enum<typeof MTLSamplerMinMagFilter>

	magFilter: interop.Enum<typeof MTLSamplerMinMagFilter>

	mipFilter: interop.Enum<typeof MTLSamplerMipFilter>

	maxAnisotropy: number

	sAddressMode: interop.Enum<typeof MTLSamplerAddressMode>

	tAddressMode: interop.Enum<typeof MTLSamplerAddressMode>

	rAddressMode: interop.Enum<typeof MTLSamplerAddressMode>

	borderColor: interop.Enum<typeof MTLSamplerBorderColor>

	normalizedCoordinates: boolean

	lodMinClamp: number

	lodMaxClamp: number

	lodAverage: boolean

	compareFunction: interop.Enum<typeof MTLCompareFunction>

	supportArgumentBuffers: boolean

	label: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLArgument extends NSObject {
	readonly name: string

	readonly type: interop.Enum<typeof MTLArgumentType>

	readonly access: interop.Enum<typeof MTLBindingAccess>

	readonly index: number

	readonly active: boolean

	readonly bufferAlignment: number

	readonly bufferDataSize: number

	readonly bufferDataType: interop.Enum<typeof MTLDataType>

	readonly bufferStructType: MTLStructType

	readonly bufferPointerType: MTLPointerType

	readonly threadgroupMemoryAlignment: number

	readonly threadgroupMemoryDataSize: number

	readonly textureType: interop.Enum<typeof MTLTextureType>

	readonly textureDataType: interop.Enum<typeof MTLDataType>

	readonly isDepthTexture: boolean

	readonly arrayLength: number

	isActive(): boolean
}

export declare class MTLDepthStencilDescriptor extends NSObject implements NSCopying {
	depthCompareFunction: interop.Enum<typeof MTLCompareFunction>

	depthWriteEnabled: boolean

	frontFaceStencil: MTLStencilDescriptor

	backFaceStencil: MTLStencilDescriptor

	label: string

	isDepthWriteEnabled(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLLinkedFunctions extends NSObject implements NSCopying {
	static linkedFunctions(): MTLLinkedFunctions

	get functions(): NSArray
	set functions(value: NSArray<interop.Object> | Array<interop.Object>)

	get binaryFunctions(): NSArray
	set binaryFunctions(value: NSArray<interop.Object> | Array<interop.Object>)

	get groups(): NSDictionary
	set groups(
		value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	)

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLAttribute extends NSObject {
	readonly name: string

	readonly attributeIndex: number

	readonly attributeType: interop.Enum<typeof MTLDataType>

	readonly active: boolean

	readonly patchData: boolean

	readonly patchControlPointData: boolean

	isActive(): boolean

	isPatchData(): boolean

	isPatchControlPointData(): boolean
}

export declare class MTLAccelerationStructureGeometryDescriptor
	extends NSObject
	implements NSCopying
{
	intersectionFunctionTableOffset: number

	opaque: boolean

	allowDuplicateIntersectionFunctionInvocation: boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLBlitPassSampleBufferAttachmentDescriptor
	extends NSObject
	implements NSCopying
{
	sampleBuffer: MTLCounterSampleBuffer

	startOfEncoderSampleIndex: number

	endOfEncoderSampleIndex: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLVertexAttributeDescriptorArray extends NSObject {
	objectAtIndexedSubscript(index: number): MTLVertexAttributeDescriptor

	setObjectAtIndexedSubscript(
		attributeDesc: MTLVertexAttributeDescriptor | null,
		index: number,
	): void
}

export declare class MTLFunctionConstant extends NSObject {
	readonly name: string

	readonly type: interop.Enum<typeof MTLDataType>

	readonly index: number

	readonly required: boolean
}

export declare class MTLFunctionConstantValues extends NSObject implements NSCopying {
	setConstantValueTypeAtIndex(
		value: interop.PointerConvertible,
		type: interop.Enum<typeof MTLDataType>,
		index: number,
	): void

	setConstantValuesTypeWithRange(
		values: interop.PointerConvertible,
		type: interop.Enum<typeof MTLDataType>,
		range: _NSRange,
	): void

	setConstantValueTypeWithName(
		value: interop.PointerConvertible,
		type: interop.Enum<typeof MTLDataType>,
		name: string,
	): void

	reset(): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLTileRenderPipelineColorAttachmentDescriptor
	extends NSObject
	implements NSCopying
{
	pixelFormat: interop.Enum<typeof MTLPixelFormat>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLAccelerationStructureDescriptor extends NSObject implements NSCopying {
	usage: interop.Enum<typeof MTLAccelerationStructureUsage>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLCaptureManager extends NSObject {
	static sharedCaptureManager(): MTLCaptureManager

	newCaptureScopeWithDevice(device: MTLDevice): MTLCaptureScope

	newCaptureScopeWithCommandQueue(commandQueue: MTLCommandQueue): MTLCaptureScope

	newCaptureScopeWithMTL4CommandQueue(commandQueue: MTL4CommandQueue): MTLCaptureScope

	supportsDestination(destination: interop.Enum<typeof MTLCaptureDestination>): boolean

	startCaptureWithDescriptorError(
		descriptor: MTLCaptureDescriptor,
		error: interop.PointerConvertible,
	): boolean

	startCaptureWithDevice(device: MTLDevice): void

	startCaptureWithCommandQueue(commandQueue: MTLCommandQueue): void

	startCaptureWithScope(captureScope: MTLCaptureScope): void

	stopCapture(): void

	defaultCaptureScope: MTLCaptureScope

	readonly isCapturing: boolean
}

export declare class MTLRasterizationRateLayerArray extends NSObject {
	objectAtIndexedSubscript(layerIndex: number): MTLRasterizationRateLayerDescriptor | null

	setObjectAtIndexedSubscript(
		layer: MTLRasterizationRateLayerDescriptor | null,
		layerIndex: number,
	): void
}

export declare class MTLRasterizationRateLayerDescriptor extends NSObject implements NSCopying {
	initWithSampleCount(sampleCount: MTLSize): this

	initWithSampleCountHorizontalVertical(
		sampleCount: MTLSize,
		horizontal: interop.PointerConvertible,
		vertical: interop.PointerConvertible,
	): this

	readonly sampleCount: MTLSize

	readonly horizontalSampleStorage: interop.Pointer

	readonly verticalSampleStorage: interop.Pointer

	readonly horizontal: MTLRasterizationRateSampleArray

	readonly vertical: MTLRasterizationRateSampleArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLFunctionDescriptor extends NSObject implements NSCopying {
	static functionDescriptor(): MTLFunctionDescriptor

	name: string

	specializedName: string

	constantValues: MTLFunctionConstantValues

	options: interop.Enum<typeof MTLFunctionOptions>

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLAccelerationStructureBoundingBoxGeometryDescriptor extends MTLAccelerationStructureGeometryDescriptor {
	boundingBoxBuffer: MTLBuffer

	boundingBoxBufferOffset: number

	boundingBoxStride: number

	boundingBoxCount: number

	static descriptor<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>
}

export declare class MTLCaptureDescriptor extends NSObject implements NSCopying {
	captureObject: interop.Object

	destination: interop.Enum<typeof MTLCaptureDestination>

	outputURL: NSURL

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class MTLRenderPipelineColorAttachmentDescriptorArray extends NSObject {
	objectAtIndexedSubscript(attachmentIndex: number): MTLRenderPipelineColorAttachmentDescriptor

	setObjectAtIndexedSubscript(
		attachment: MTLRenderPipelineColorAttachmentDescriptor | null,
		attachmentIndex: number,
	): void
}
