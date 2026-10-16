/// <reference types="@nativescript/objc-node-api" />

declare interface MTLFXSpatialScalerBase extends NSObjectProtocol {
	readonly colorTextureUsage: interop.Enum<typeof MTLTextureUsage>

	readonly outputTextureUsage: interop.Enum<typeof MTLTextureUsage>

	inputContentWidth: number

	inputContentHeight: number

	colorTexture: MTLTexture

	outputTexture: MTLTexture

	readonly colorTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly outputTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly inputWidth: number

	readonly inputHeight: number

	readonly outputWidth: number

	readonly outputHeight: number

	readonly colorProcessingMode: interop.Enum<typeof MTLFXSpatialScalerColorProcessingMode>

	fence: MTLFence
}

declare class MTLFXSpatialScalerBase extends NativeObject implements MTLFXSpatialScalerBase {}

declare interface MTLFXTemporalScalerBase extends MTLFXFrameInterpolatableScaler {
	readonly colorTextureUsage: interop.Enum<typeof MTLTextureUsage>

	readonly depthTextureUsage: interop.Enum<typeof MTLTextureUsage>

	readonly motionTextureUsage: interop.Enum<typeof MTLTextureUsage>

	readonly outputTextureUsage: interop.Enum<typeof MTLTextureUsage>

	inputContentWidth: number

	inputContentHeight: number

	colorTexture: MTLTexture

	depthTexture: MTLTexture

	motionTexture: MTLTexture

	outputTexture: MTLTexture

	exposureTexture: MTLTexture

	reactiveMaskTexture: MTLTexture

	preExposure: number

	jitterOffsetX: number

	jitterOffsetY: number

	motionVectorScaleX: number

	motionVectorScaleY: number

	reset: boolean

	depthReversed: boolean

	readonly colorTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly depthTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly motionTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly reactiveMaskTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly outputTextureFormat: interop.Enum<typeof MTLPixelFormat>

	readonly inputWidth: number

	readonly inputHeight: number

	readonly outputWidth: number

	readonly outputHeight: number

	readonly inputContentMinScale: number

	readonly inputContentMaxScale: number

	fence: MTLFence

	isDepthReversed(): boolean
}

declare class MTLFXTemporalScalerBase extends NativeObject implements MTLFXTemporalScalerBase {}

declare interface MTLFXFrameInterpolatableScaler extends NSObjectProtocol {}

declare class MTLFXFrameInterpolatableScaler
	extends NativeObject
	implements MTLFXFrameInterpolatableScaler {}
