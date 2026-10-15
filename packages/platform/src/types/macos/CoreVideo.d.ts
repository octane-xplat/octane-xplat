import type { CGRect, CGSize } from './CoreFoundation'

import type { MTLDevice, MTLTexture } from './Metal'

import type { interop } from './objc-runtime'

import { MTLPixelFormat } from './Metal'



export declare const kCVImageBufferPixelAspectRatioKey: interop.Object;

export declare const kCVPixelFormatType_16VersatileBayer: number;

export declare const kCVBufferPropagatedAttachmentsKey: interop.Object;

export declare const kCVPixelFormatType_96VersatileBayerPacked12: number;

export declare const kCVPixelBufferProResRAWKey_ColorMatrix: interop.Object;

export declare const kCVPixelFormatType_40ARGBLEWideGamutPremultiplied: number;

export declare const kCVImageBufferTransferFunction_Linear: interop.Object;

export declare const kCVPixelFormatType_32RGBA: number;

export declare const kCVPixelFormatContainsRGB: interop.Object;

export declare const kCVImageBufferColorPrimaries_SMPTE_C: interop.Object;

export declare const kCVPixelFormatType_16LE565: number;

export declare const kCVMetalTextureUsage: interop.Object;

export declare const kCVOpenGLTextureCacheChromaSamplingModeAutomatic: interop.Object;

export declare const kCVPixelFormatConstant: interop.Object;

export declare const kCVImageBufferTransferFunction_SMPTE_C: interop.Object;

export declare const kCVPixelFormatFillExtendedPixelsCallback: interop.Object;

export declare const kCVPixelBufferPoolFreeBufferNotification: interop.Object;

export declare const kCVPixelFormatType_422YpCbCr8FullRange: number;

export declare const kCVPixelFormatType_444YpCbCr10: number;

export declare const kCVReturnInvalidPoolAttributes: number;

export declare const kCVImageBufferChromaLocation_BottomLeft: interop.Object;

export declare const kCVPixelBufferExtendedPixelsBottomKey: interop.Object;

export declare const kCVMetalTextureCacheMaximumTextureAgeKey: interop.Object;

export declare const kCVMetalTextureStorageMode: interop.Object;

export declare const kCVPixelFormatOpenGLCompatibility: interop.Object;

export declare const kCVPixelFormatOpenGLInternalFormat: interop.Object;

export declare const kCVPixelFormatHorizontalSubsampling: interop.Object;

export declare const kCVPixelFormatBlackBlock: interop.Object;

export declare const kCVPixelFormatBlockHeight: interop.Object;

export declare const kCVPixelFormatComponentRange_WideRange: interop.Object;

export declare const kCVPixelFormatComponentRange_FullRange: interop.Object;

export declare const kCVPixelFormatComponentRange_VideoRange: interop.Object;

export declare const kCVPixelFormatContainsYCbCr: interop.Object;

export declare const kCVPixelFormatContainsAlpha: interop.Object;

export declare const kCVOpenGLTextureCacheChromaSamplingModeBestPerformance: interop.Object;

export declare const kCVOpenGLTextureCacheChromaSamplingModeHighestQuality: interop.Object;

export declare const kCVOpenGLTextureCacheChromaSamplingModeKey: interop.Object;

export declare const kCVOpenGLBufferMaximumMipmapLevel: interop.Object;

export declare const kCVOpenGLBufferInternalFormat: interop.Object;

export declare const kCVOpenGLBufferTarget: interop.Object;

export declare const kCVOpenGLBufferHeight: interop.Object;

export declare const kCVOpenGLBufferWidth: interop.Object;

export declare const kCVPixelBufferPoolAllocationThresholdKey: interop.Object;

export declare const kCVPixelBufferPoolMaximumBufferAgeKey: interop.Object;

export declare const kCVPixelBufferIOSurfaceOpenGLTextureCompatibilityKey: interop.Object;

export declare const kCVPixelBufferProResRAWKey_GainFactor: interop.Object;

export declare const kCVPixelBufferProResRAWKey_WhiteBalanceCCT: interop.Object;

export declare const kCVPixelBufferProResRAWKey_WhiteLevel: interop.Object;

export declare const kCVVersatileBayer_BayerPattern_GBRG: number;

export declare const kCVVersatileBayer_BayerPattern_RGGB: number;

export declare const kCVPixelBufferVersatileBayerKey_BayerPattern: interop.Object;

export declare const kCVPixelBufferOpenGLTextureCacheCompatibilityKey: interop.Object;

export declare const kCVPixelBufferIOSurfacePropertiesKey: interop.Object;

export declare const kCVPixelBufferOpenGLCompatibilityKey: interop.Object;

export declare const kCVPixelBufferBytesPerRowAlignmentKey: interop.Object;

export declare const kCVPixelBufferExtendedPixelsRightKey: interop.Object;

export declare const kCVPixelBufferHeightKey: interop.Object;

export declare const kCVPixelBufferWidthKey: interop.Object;

export declare const kCVPixelBufferMemoryAllocatorKey: interop.Object;

export declare const kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarFullRange: number;

export declare const kCVPixelFormatType_Lossy_32BGRA: number;

export declare const kCVPixelFormatType_Lossless_420YpCbCr10PackedBiPlanarFullRange: number;

export declare const kCVPixelFormatType_Lossless_420YpCbCr10PackedBiPlanarVideoRange: number;

export declare const kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarFullRange: number;

export declare const kCVPixelFormatType_Lossless_420YpCbCr8BiPlanarVideoRange: number;

export declare const kCVPixelFormatType_Lossless_64RGBAHalf: number;

export declare const kCVPixelFormatType_30RGBLE_8A_BiPlanar: number;

export declare const kCVPixelFormatType_444YpCbCr16VideoRange_16A_TriPlanar: number;

export declare const kCVPixelFormatType_64RGBA_DownscaledProResRAW: number;

export declare const kCVPixelFormatType_444YpCbCr10BiPlanarFullRange: number;

export declare const kCVPixelFormatType_444YpCbCr10BiPlanarVideoRange: number;

export declare const kCVPixelFormatType_DepthFloat32: number;

export declare const kCVPixelFormatType_DepthFloat16: number;

export declare const kCVPixelFormatType_DisparityFloat16: number;

export declare const kCVPixelFormatType_14Bayer_GBRG: number;

export declare const kCVPixelFormatType_14Bayer_BGGR: number;

export declare const kCVPixelFormatType_14Bayer_RGGB: number;

export declare const kCVPixelFormatType_14Bayer_GRBG: number;

export declare const kCVPixelFormatType_64RGBAHalf: number;

export declare const kCVPixelFormatType_TwoComponent16: number;

export declare const kCVPixelFormatType_OneComponent12: number;

export declare const kCVPixelFormatType_30RGBLEPackedWideGamut: number;

export declare const kCVPixelFormatType_444YpCbCr8BiPlanarFullRange: number;

export declare const kCVPixelFormatType_444YpCbCr8BiPlanarVideoRange: number;

export declare const kCVPixelFormatType_422YpCbCr8BiPlanarVideoRange: number;

export declare const kCVPixelFormatType_422YpCbCr_4A_8BiPlanar: number;

export declare const kCVPixelFormatType_420YpCbCr8PlanarFullRange: number;

export declare const kCVPixelFormatType_422YpCbCr10: number;

export declare const kCVPixelFormatType_422YpCbCr16: number;

export declare const kCVPixelFormatType_444YpCbCr8: number;

export declare const kCVPixelFormatType_4444AYpCbCr16: number;

export declare const kCVPixelFormatType_4444YpCbCrA8R: number;

export declare const kCVPixelFormatType_4444YpCbCrA8: number;

export declare const kCVPixelFormatType_30RGB_r210: number;

export declare const kCVPixelFormatType_30RGB: number;

export declare const kCVPixelFormatType_32AlphaGray: number;

export declare const kCVPixelFormatType_32ABGR: number;

export declare const kCVPixelFormatType_32BGRA: number;

export declare const kCVPixelFormatType_32ARGB: number;

export declare const kCVPixelFormatType_24RGB: number;

export declare const kCVPixelFormatType_16BE565: number;

export declare const kCVPixelFormatType_16LE5551: number;

export declare const kCVPixelFormatType_16BE555: number;

export declare const kCVPixelFormatType_8IndexedGray_WhiteIsZero: number;

export declare const kCVPixelFormatType_2IndexedGray_WhiteIsZero: number;

export declare const kCVPixelFormatType_1IndexedGray_WhiteIsZero: number;

export declare const kCVPixelFormatType_8Indexed: number;

export declare const kCVPixelFormatType_2Indexed: number;

export declare const kCVPixelFormatType_1Monochrome: number;

export declare const kCVImageBufferContentLightLevelInfoKey: interop.Object;

export declare const kCVImageBufferMasteringDisplayColorVolumeKey: interop.Object;

export declare const kCVImageBufferAlphaChannelMode_PremultipliedAlpha: interop.Object;

export declare const kCVImageBufferChromaSubsampling_420: interop.Object;

export declare const kCVImageBufferChromaSubsamplingKey: interop.Object;

export declare const kCVImageBufferChromaLocation_DV420: interop.Object;

export declare const kCVImageBufferChromaLocation_TopLeft: interop.Object;

export declare const kCVImageBufferChromaLocationBottomFieldKey: interop.Object;

export declare const kCVImageBufferTransferFunction_SMPTE_ST_2084_PQ: interop.Object;

export declare const kCVImageBufferTransferFunction_EBU_3213: interop.Object;

export declare const kCVImageBufferColorPrimaries_ITU_R_2020: interop.Object;

export declare const kCVImageBufferColorPrimaries_DCI_P3: interop.Object;

export declare const kCVImageBufferColorPrimaries_P22: interop.Object;

export declare const kCVImageBufferColorPrimariesKey: interop.Object;

export declare const kCVImageBufferYCbCrMatrix_ITU_R_2020: interop.Object;

export declare const kCVImageBufferYCbCrMatrix_P3_D65: interop.Object;

export declare const kCVImageBufferYCbCrMatrix_DCI_P3: interop.Object;

export declare const kCVImageBufferDisplayWidthKey: interop.Object;

export declare const kCVImageBufferFieldDetailSpatialFirstLineLate: interop.Object;

export declare const kCVImageBufferFieldDetailSpatialFirstLineEarly: interop.Object;

export declare const kCVImageBufferFieldDetailTemporalBottomFirst: interop.Object;

export declare const kCVImageBufferFieldDetailKey: interop.Object;

export declare const kCVImageBufferFieldCountKey: interop.Object;

export declare const kCVImageBufferCleanApertureHorizontalOffsetKey: interop.Object;

export declare const kCVBufferTimeScaleKey: interop.Object;

export declare const kCVBufferMovieTimeKey: interop.Object;

export declare const kCVBufferNonPropagatedAttachmentsKey: interop.Object;

export declare const kCVReturnLast: number;

export declare const kCVReturnRetry: number;

export declare const kCVReturnPoolAllocationFailed: number;

export declare const kCVReturnPixelBufferNotMetalCompatible: number;

export declare const kCVReturnPixelBufferNotOpenGLCompatible: number;

export declare const kCVReturnInvalidPixelBufferAttributes: number;

export declare const kCVReturnInvalidSize: number;

export declare const kCVReturnInvalidPixelFormat: number;

export declare const kCVReturnDisplayLinkNotRunning: number;

export declare const kCVReturnInvalidDisplay: number;

export declare const kCVReturnUnsupported: number;

export declare const kCVReturnAllocationFailed: number;

export declare const kCVReturnInvalidArgument: number;

export declare const kCVReturnError: number;

export declare const kCVIndefiniteTime: CVTime;

export declare const kCVImageBufferChromaLocationTopFieldKey: interop.Object;

export declare const kCVPixelFormatType_4IndexedGray_WhiteIsZero: number;

export declare const kCVReturnFirst: number;

export declare const kCVPixelFormatCGImageCompatibility: interop.Object;

export declare const kCVImageBufferColorPrimaries_EBU_3213: interop.Object;

export declare const kCVImageBufferCleanApertureWidthKey: interop.Object;

export declare const kCVVersatileBayer_BayerPattern_GRBG: number;

export declare const kCVImageBufferColorPrimaries_ITU_R_709_2: interop.Object;

export declare const kCVPixelFormatType_420YpCbCr8Planar: number;

export declare const kCVImageBufferChromaLocation_Bottom: interop.Object;

export declare const kCVPixelFormatType_420YpCbCr8VideoRange_8A_TriPlanar: number;

export declare const kCVPixelFormatType_TwoComponent32Float: number;

export declare const kCVPixelFormatBlockHorizontalAlignment: interop.Object;

export declare const kCVPixelFormatType_Lossless_30RGBLEPackedWideGamut: number;

export declare const kCVPixelFormatType_OneComponent32Float: number;

export declare const kCVOpenGLBufferPoolMaximumBufferAgeKey: interop.Object;

export declare const kCVPixelFormatType_ARGB2101010LEPacked: number;

export declare const kCVPixelFormatType_4444AYpCbCr8: number;

export declare const kCVPixelFormatType_16LE555: number;

export declare const kCVImageBufferICCProfileKey: interop.Object;

export declare const kCVPixelFormatCodecType: interop.Object;

export declare const kCVPixelFormatType_OneComponent16Half: number;

export declare const kCVImageBufferTransferFunction_ITU_R_2020: interop.Object;

export declare const kCVPixelBufferProResRAWKey_BlackLevel: interop.Object;

export declare const kCVPixelFormatType_420YpCbCr8BiPlanarFullRange: number;

export declare const kCVPixelFormatContainsGrayscale: interop.Object;

export declare const kCVReturnDisplayLinkAlreadyRunning: number;

export declare const kCVPixelFormatBitsPerBlock: interop.Object;

export declare const kCVPixelFormatType_24BGR: number;

export declare const kCVImageBufferAlphaChannelModeKey: interop.Object;

export declare const kCVImageBufferPixelAspectRatioVerticalSpacingKey: interop.Object;

export declare const kCVPixelFormatType_OneComponent8: number;

export declare const kCVPixelFormatType_OneComponent10: number;

export declare const kCVImageBufferPreferredCleanApertureKey: interop.Object;

export declare const kCVPixelFormatType_Lossy_420YpCbCr10PackedBiPlanarVideoRange: number;

export declare const kCVPixelFormatType_420YpCbCr10BiPlanarFullRange: number;

export declare const kCVImageBufferAlphaChannelIsOpaque: interop.Object;

export declare const kCVPixelBufferProResRAWKey_WhiteBalanceRedFactor: interop.Object;

export declare const kCVPixelFormatCGBitmapInfo: interop.Object;

export declare const kCVPixelBufferProResRAWKey_WhiteBalanceBlueFactor: interop.Object;

export declare const kCVImageBufferCleanApertureHeightKey: interop.Object;

export declare const kCVImageBufferCleanApertureKey: interop.Object;

export declare const kCVPixelFormatVerticalSubsampling: interop.Object;

export declare const kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange: number;

export declare const kCVPixelBufferProResRAWKey_RecommendedCrop: interop.Object;

export declare const kCVPixelFormatType_422YpCbCr10BiPlanarVideoRange: number;

export declare const kCVImageBufferFieldDetailTemporalTopFirst: interop.Object;

export declare const kCVPixelBufferProResRAWKey_SenselSitingOffsets: interop.Object;

export declare const kCVImageBufferGammaLevelKey: interop.Object;

export declare const kCVPixelFormatType_444YpCbCr16BiPlanarVideoRange: number;

export declare const kCVImageBufferChromaLocation_Center: interop.Object;

export declare const kCVPixelFormatType_Lossless_422YpCbCr10PackedBiPlanarVideoRange: number;

export declare const kCVPixelBufferIOSurfaceOpenGLFBOCompatibilityKey: interop.Object;

export declare const kCVPixelFormatType_64RGBALE: number;

export declare const kCVPixelFormatType_4444AYpCbCrFloat: number;

export declare const kCVImageBufferTransferFunction_SMPTE_ST_428_1: interop.Object;

export declare const kCVImageBufferTransferFunction_SMPTE_240M_1995: interop.Object;

export declare const kCVImageBufferTransferFunction_UseGamma: interop.Object;

export declare const kCVPixelBufferIOSurfaceCoreAnimationCompatibilityKey: interop.Object;

export declare const kCVImageBufferDisplayHeightKey: interop.Object;

export declare const kCVPixelBufferCGBitmapContextCompatibilityKey: interop.Object;

export declare const kCVPixelFormatOpenGLFormat: interop.Object;

export declare const kCVPixelBufferPlaneAlignmentKey: interop.Object;

export declare const kCVPixelFormatType_40ARGBLEWideGamut: number;

export declare const kCVPixelFormatType_48RGB: number;

export declare const kCVPixelBufferCGImageCompatibilityKey: interop.Object;

export declare const kCVPixelFormatType_422YpCbCr8_yuvs: number;

export declare const kCVPixelFormatType_Lossy_420YpCbCr8BiPlanarVideoRange: number;

export declare const kCVImageBufferChromaLocation_Left: interop.Object;

export declare const kCVImageBufferChromaLocation_Top: interop.Object;

export declare const kCVPixelFormatBlockWidth: interop.Object;

export declare const kCVImageBufferTransferFunctionKey: interop.Object;

export declare const kCVImageBufferCGColorSpaceKey: interop.Object;

export declare const kCVPixelBufferPoolMinimumBufferCountKey: interop.Object;

export declare const kCVPixelFormatType_420YpCbCr10BiPlanarVideoRange: number;

export declare const kCVReturnSuccess: number;

export declare const kCVReturnDisplayLinkCallbacksNotSet: number;

export declare const kCVPixelFormatPlanes: interop.Object;

export declare const kCVPixelFormatType_64ARGB: number;

export declare const kCVOpenGLBufferPoolMinimumBufferCountKey: interop.Object;

export declare const kCVPixelFormatType_128RGBAFloat: number;

export declare const kCVPixelBufferPixelFormatTypeKey: interop.Object;

export declare const kCVPixelFormatType_OneComponent16: number;

export declare const kCVPixelFormatType_422YpCbCr10BiPlanarFullRange: number;

export declare const kCVImageBufferAlphaChannelMode_StraightAlpha: interop.Object;

export declare const kCVPixelFormatBlockVerticalAlignment: interop.Object;

export declare const kCVImageBufferChromaSubsampling_422: interop.Object;

export declare const kCVPixelFormatType_422YpCbCr8: number;

export declare const kCVPixelFormatType_TwoComponent8: number;

export declare const kCVImageBufferTransferFunction_sRGB: interop.Object;

export declare const kCVPixelFormatName: interop.Object;

export declare const kCVImageBufferCleanApertureVerticalOffsetKey: interop.Object;

export declare const kCVImageBufferDisplayDimensionsKey: interop.Object;

export declare const kCVPixelFormatQDCompatibility: interop.Object;

export declare const kCVPixelBufferExtendedPixelsLeftKey: interop.Object;

export declare const kCVImageBufferYCbCrMatrix_SMPTE_240M_1995: interop.Object;

export declare const kCVVersatileBayer_BayerPattern_BGGR: number;

export declare const kCVPixelFormatComponentRange: interop.Object;

export declare const kCVPixelFormatType_Lossless_30RGBLE_8A_BiPlanar: number;

export declare const kCVPixelFormatType_TwoComponent16Half: number;

export declare const kCVPixelFormatType_Lossless_32BGRA: number;

export declare const kCVImageBufferPixelAspectRatioHorizontalSpacingKey: interop.Object;

export declare const kCVImageBufferTransferFunction_ITU_R_2100_HLG: interop.Object;

export declare const kCVImageBufferYCbCrMatrix_ITU_R_709_2: interop.Object;

export declare const kCVPixelFormatOpenGLType: interop.Object;

export declare const kCVPixelFormatType_DisparityFloat32: number;

export declare const kCVPixelFormatType_4Indexed: number;

export declare const kCVPixelFormatType_422YpCbCr16BiPlanarVideoRange: number;

export declare const kCVPixelFormatType_16Gray: number;

export declare const kCVPixelFormatType_Lossy_422YpCbCr10PackedBiPlanarVideoRange: number;

export declare const kCVImageBufferYCbCrMatrix_ITU_R_601_4: interop.Object;

export declare const kCVImageBufferColorPrimaries_P3_D65: interop.Object;

export declare const kCVPixelFormatCGBitmapContextCompatibility: interop.Object;

export declare const kCVPixelBufferExtendedPixelsTopKey: interop.Object;

export declare const kCVReturnWouldExceedAllocationThreshold: number;

export declare const kCVZeroTime: CVTime;

export declare const kCVImageBufferChromaSubsampling_411: interop.Object;

export declare const kCVImageBufferYCbCrMatrixKey: interop.Object;

export declare const kCVBufferTimeValueKey: interop.Object;

export declare const kCVImageBufferTransferFunction_ITU_R_709_2: interop.Object;

export declare const kCVPixelBufferMetalCompatibilityKey: interop.Object;

export declare const kCVPixelFormatType_422YpCbCr8BiPlanarFullRange: number;

export declare const kCVPixelFormatFourCC: interop.Object;

export declare const CVAttachmentMode: {
  Not: 0,
  kCVAttachmentMode_ShouldPropagate: 1,
};

export declare const CVSMPTETimeType: {
  Type24: 0,
  Type25: 1,
  Type30Drop: 2,
  Type30: 3,
  Type2997: 4,
  Type2997Drop: 5,
  Type60: 6,
  Type5994: 7,
};

export declare const CVPixelBufferPoolFlushFlags: {
  kCVPixelBufferPoolFlushExcessBuffers: 1,
};

export declare const CVTimeStampFlags: {
  VideoTimeValid: 1,
  HostTimeValid: 2,
  SMPTETimeValid: 4,
  VideoRefreshPeriodValid: 8,
  RateScalarValid: 16,
  TopField: 65536,
  BottomField: 131072,
  VideoHostTimeValid: 3,
  IsInterlaced: 196608,
};

export declare const CVTimeFlags: {
  kCVTimeIsIndefinite: 1,
};

export declare const CVSMPTETimeFlags: {
  Valid: 1,
  Running: 2,
};

export declare const CVPixelBufferLockFlags: {
  kCVPixelBufferLock_ReadOnly: 1,
};

export declare class __CVDisplayLink {
  constructor(init?: __CVDisplayLink);
}

export declare class CVTimeStamp {
  constructor(init?: CVTimeStamp);
  version: number;
  videoTimeScale: number;
  videoTime: number;
  hostTime: number;
  rateScalar: number;
  videoRefreshPeriod: number;
  smpteTime: CVSMPTETime;
  flags: number;
  reserved: number;
}

export declare class CVPlanarPixelBufferInfo_YCbCrBiPlanar {
  constructor(init?: CVPlanarPixelBufferInfo_YCbCrBiPlanar);
  componentInfoY: CVPlanarComponentInfo;
  componentInfoCbCr: CVPlanarComponentInfo;
}

export declare class __CVMetalBufferCache {
  constructor(init?: __CVMetalBufferCache);
}

export declare class __CVMetalTextureCache {
  constructor(init?: __CVMetalTextureCache);
}

export declare class __CVOpenGLTextureCache {
  constructor(init?: __CVOpenGLTextureCache);
}

export declare class __CVPixelBufferPool {
  constructor(init?: __CVPixelBufferPool);
}

export declare class CVPlanarPixelBufferInfo_YCbCrPlanar {
  constructor(init?: CVPlanarPixelBufferInfo_YCbCrPlanar);
  componentInfoY: CVPlanarComponentInfo;
  componentInfoCb: CVPlanarComponentInfo;
  componentInfoCr: CVPlanarComponentInfo;
}

export declare class __CVBuffer {
  constructor(init?: __CVBuffer);
}

export declare class CVTime {
  constructor(init?: CVTime);
  timeValue: number;
  timeScale: number;
  flags: number;
}

export declare class CVSMPTETime {
  constructor(init?: CVSMPTETime);
  subframes: number;
  subframeDivisor: number;
  counter: number;
  type: number;
  flags: number;
  hours: number;
  minutes: number;
  seconds: number;
  frames: number;
}

export declare class CVPlanarPixelBufferInfo {
  constructor(init?: CVPlanarPixelBufferInfo);
  componentInfo: unknown /* const array */;
}

export declare class CVPlanarComponentInfo {
  constructor(init?: CVPlanarComponentInfo);
  offset: number;
  rowBytes: number;
}

export declare class __CVOpenGLBufferPool {
  constructor(init?: __CVOpenGLBufferPool);
}

export declare class CVFillExtendedPixelsCallBackData {
  constructor(init?: CVFillExtendedPixelsCallBackData);
  version: number;
  fillCallBack: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  refCon: interop.Pointer;
}

export declare function CVGetCurrentHostTime(): number;

export declare function CVGetHostClockFrequency(): number;

export declare function CVGetHostClockMinimumTimeDelta(): number;

export declare function CVDisplayLinkGetTypeID(): number;

export declare function CVDisplayLinkCreateWithCGDisplays(displayArray: interop.PointerConvertible, count: number, displayLinkOut: interop.PointerConvertible): number;

export declare function CVDisplayLinkCreateWithOpenGLDisplayMask(mask: number, displayLinkOut: interop.PointerConvertible): number;

export declare function CVDisplayLinkCreateWithCGDisplay(displayID: number, displayLinkOut: interop.PointerConvertible): number;

export declare function CVDisplayLinkCreateWithActiveCGDisplays(displayLinkOut: interop.PointerConvertible): number;

export declare function CVDisplayLinkSetCurrentCGDisplay(displayLink: interop.Object, displayID: number): number;

export declare function CVDisplayLinkSetCurrentCGDisplayFromOpenGLContext(displayLink: interop.Object, cglContext: interop.PointerConvertible, cglPixelFormat: interop.PointerConvertible): number;

export declare function CVDisplayLinkGetCurrentCGDisplay(displayLink: interop.Object): number;

export declare function CVDisplayLinkSetOutputCallback(displayLink: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => number, userInfo: interop.PointerConvertible): number;

export declare function CVDisplayLinkSetOutputHandler(displayLink: interop.Object, handler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number): number;

export declare function CVDisplayLinkStart(displayLink: interop.Object): number;

export declare function CVDisplayLinkStop(displayLink: interop.Object): number;

export declare function CVDisplayLinkGetNominalOutputVideoRefreshPeriod(displayLink: interop.Object): CVTime;

export declare function CVDisplayLinkGetOutputVideoLatency(displayLink: interop.Object): CVTime;

export declare function CVDisplayLinkGetActualOutputVideoRefreshPeriod(displayLink: interop.Object): number;

export declare function CVDisplayLinkIsRunning(displayLink: interop.Object): number;

export declare function CVDisplayLinkGetCurrentTime(displayLink: interop.Object, outTime: interop.PointerConvertible): number;

export declare function CVDisplayLinkTranslateTime(displayLink: interop.Object, inTime: interop.PointerConvertible, outTime: interop.PointerConvertible): number;

export declare function CVDisplayLinkRetain(displayLink: interop.Object): interop.Object;

export declare function CVDisplayLinkRelease(displayLink: interop.Object): void;

export declare function CVBufferRetain(buffer: interop.Object): interop.Object;

export declare function CVBufferRelease(buffer: interop.Object): void;

export declare function CVBufferSetAttachment(buffer: interop.Object, key: interop.Object, value: interop.Object, attachmentMode: interop.Enum<typeof CVAttachmentMode>): void;

export declare function CVBufferGetAttachment(buffer: interop.Object, key: interop.Object, attachmentMode: interop.PointerConvertible): interop.Object;

export declare function CVBufferRemoveAttachment(buffer: interop.Object, key: interop.Object): void;

export declare function CVBufferRemoveAllAttachments(buffer: interop.Object): void;

export declare function CVBufferGetAttachments(buffer: interop.Object, attachmentMode: interop.Enum<typeof CVAttachmentMode>): interop.Object;

export declare function CVBufferSetAttachments(buffer: interop.Object, theAttachments: interop.Object, attachmentMode: interop.Enum<typeof CVAttachmentMode>): void;

export declare function CVBufferPropagateAttachments(sourceBuffer: interop.Object, destinationBuffer: interop.Object): void;

export declare function CVYCbCrMatrixGetIntegerCodePointForString(yCbCrMatrixString: interop.Object): number;

export declare function CVColorPrimariesGetIntegerCodePointForString(colorPrimariesString: interop.Object): number;

export declare function CVTransferFunctionGetIntegerCodePointForString(transferFunctionString: interop.Object): number;

export declare function CVYCbCrMatrixGetStringForIntegerCodePoint(yCbCrMatrixCodePoint: number): interop.Object;

export declare function CVColorPrimariesGetStringForIntegerCodePoint(colorPrimariesCodePoint: number): interop.Object;

export declare function CVTransferFunctionGetStringForIntegerCodePoint(transferFunctionCodePoint: number): interop.Object;

export declare function CVImageBufferGetEncodedSize(imageBuffer: interop.Object): CGSize;

export declare function CVImageBufferGetDisplaySize(imageBuffer: interop.Object): CGSize;

export declare function CVImageBufferGetCleanRect(imageBuffer: interop.Object): CGRect;

export declare function CVImageBufferIsFlipped(imageBuffer: interop.Object): number;

export declare function CVImageBufferGetColorSpace(imageBuffer: interop.Object): interop.Object;

export declare function CVImageBufferCreateColorSpaceFromAttachments(attachments: interop.Object): interop.Object;

export declare function CVPixelBufferGetTypeID(): number;

export declare function CVPixelBufferRetain(texture: interop.Object): interop.Object;

export declare function CVPixelBufferRelease(texture: interop.Object): void;

export declare function CVPixelBufferCreateResolvedAttributesDictionary(allocator: interop.Object, attributes: interop.Object, resolvedDictionaryOut: interop.PointerConvertible): number;

export declare function CVPixelBufferCreate(allocator: interop.Object, width: number, height: number, pixelFormatType: number, pixelBufferAttributes: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function CVPixelBufferCreateWithBytes(allocator: interop.Object, width: number, height: number, pixelFormatType: number, baseAddress: interop.PointerConvertible, bytesPerRow: number, releaseCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void, releaseRefCon: interop.PointerConvertible, pixelBufferAttributes: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function CVPixelBufferCreateWithPlanarBytes(allocator: interop.Object, width: number, height: number, pixelFormatType: number, dataPtr: interop.PointerConvertible, dataSize: number, numberOfPlanes: number, planeBaseAddress: interop.PointerConvertible, planeWidth: interop.PointerConvertible, planeHeight: interop.PointerConvertible, planeBytesPerRow: interop.PointerConvertible, releaseCallback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible) => void, releaseRefCon: interop.PointerConvertible, pixelBufferAttributes: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function CVPixelBufferLockBaseAddress(pixelBuffer: interop.Object, lockFlags: interop.Enum<typeof CVPixelBufferLockFlags>): number;

export declare function CVPixelBufferUnlockBaseAddress(pixelBuffer: interop.Object, unlockFlags: interop.Enum<typeof CVPixelBufferLockFlags>): number;

export declare function CVPixelBufferGetWidth(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferGetHeight(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferGetPixelFormatType(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferGetBaseAddress(pixelBuffer: interop.Object): interop.Pointer;

export declare function CVPixelBufferGetBytesPerRow(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferGetDataSize(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferIsPlanar(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferGetPlaneCount(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferGetWidthOfPlane(pixelBuffer: interop.Object, planeIndex: number): number;

export declare function CVPixelBufferGetHeightOfPlane(pixelBuffer: interop.Object, planeIndex: number): number;

export declare function CVPixelBufferGetBaseAddressOfPlane(pixelBuffer: interop.Object, planeIndex: number): interop.Pointer;

export declare function CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer: interop.Object, planeIndex: number): number;

export declare function CVPixelBufferGetExtendedPixels(pixelBuffer: interop.Object, extraColumnsOnLeft: interop.PointerConvertible, extraColumnsOnRight: interop.PointerConvertible, extraRowsOnTop: interop.PointerConvertible, extraRowsOnBottom: interop.PointerConvertible): void;

export declare function CVPixelBufferFillExtendedPixels(pixelBuffer: interop.Object): number;

export declare function CVPixelBufferIsCompatibleWithAttributes(pixelBuffer: interop.Object, attributes: interop.Object): number;

export declare function CVPixelBufferGetIOSurface(pixelBuffer: interop.Object): interop.Object;

export declare function CVPixelBufferCreateWithIOSurface(allocator: interop.Object, surface: interop.Object, pixelBufferAttributes: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function CVPixelBufferPoolGetTypeID(): number;

export declare function CVPixelBufferPoolRetain(pixelBufferPool: interop.Object): interop.Object;

export declare function CVPixelBufferPoolRelease(pixelBufferPool: interop.Object): void;

export declare function CVPixelBufferPoolCreate(allocator: interop.Object, poolAttributes: interop.Object, pixelBufferAttributes: interop.Object, poolOut: interop.PointerConvertible): number;

export declare function CVPixelBufferPoolGetAttributes(pool: interop.Object): interop.Object;

export declare function CVPixelBufferPoolGetPixelBufferAttributes(pool: interop.Object): interop.Object;

export declare function CVPixelBufferPoolCreatePixelBuffer(allocator: interop.Object, pixelBufferPool: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function CVPixelBufferPoolCreatePixelBufferWithAuxAttributes(allocator: interop.Object, pixelBufferPool: interop.Object, auxAttributes: interop.Object, pixelBufferOut: interop.PointerConvertible): number;

export declare function CVPixelBufferPoolFlush(pool: interop.Object, options: interop.Enum<typeof CVPixelBufferPoolFlushFlags>): void;

export declare function CVOpenGLBufferGetTypeID(): number;

export declare function CVOpenGLBufferRetain(buffer: interop.Object): interop.Object;

export declare function CVOpenGLBufferRelease(buffer: interop.Object): void;

export declare function CVOpenGLBufferCreate(allocator: interop.Object, width: number, height: number, attributes: interop.Object, bufferOut: interop.PointerConvertible): number;

export declare function CVOpenGLBufferGetAttributes(openGLBuffer: interop.Object): interop.Object;

export declare function CVOpenGLBufferAttach(openGLBuffer: interop.Object, cglContext: interop.PointerConvertible, face: number, level: number, screen: number): number;

export declare function CVOpenGLBufferPoolGetTypeID(): number;

export declare function CVOpenGLBufferPoolRetain(openGLBufferPool: interop.Object): interop.Object;

export declare function CVOpenGLBufferPoolRelease(openGLBufferPool: interop.Object): void;

export declare function CVOpenGLBufferPoolCreate(allocator: interop.Object, poolAttributes: interop.Object, openGLBufferAttributes: interop.Object, poolOut: interop.PointerConvertible): number;

export declare function CVOpenGLBufferPoolGetAttributes(pool: interop.Object): interop.Object;

export declare function CVOpenGLBufferPoolGetOpenGLBufferAttributes(pool: interop.Object): interop.Object;

export declare function CVOpenGLBufferPoolCreateOpenGLBuffer(allocator: interop.Object, openGLBufferPool: interop.Object, openGLBufferOut: interop.PointerConvertible): number;

export declare function CVOpenGLTextureGetTypeID(): number;

export declare function CVOpenGLTextureRetain(texture: interop.Object): interop.Object;

export declare function CVOpenGLTextureRelease(texture: interop.Object): void;

export declare function CVOpenGLTextureGetTarget(image: interop.Object): number;

export declare function CVOpenGLTextureGetName(image: interop.Object): number;

export declare function CVOpenGLTextureIsFlipped(image: interop.Object): number;

export declare function CVOpenGLTextureGetCleanTexCoords(image: interop.Object, lowerLeft: interop.PointerConvertible, lowerRight: interop.PointerConvertible, upperRight: interop.PointerConvertible, upperLeft: interop.PointerConvertible): void;

export declare function CVOpenGLTextureCacheGetTypeID(): number;

export declare function CVOpenGLTextureCacheRetain(textureCache: interop.Object): interop.Object;

export declare function CVOpenGLTextureCacheRelease(textureCache: interop.Object): void;

export declare function CVOpenGLTextureCacheCreate(allocator: interop.Object, cacheAttributes: interop.Object, cglContext: interop.PointerConvertible, cglPixelFormat: interop.PointerConvertible, textureAttributes: interop.Object, cacheOut: interop.PointerConvertible): number;

export declare function CVOpenGLTextureCacheCreateTextureFromImage(allocator: interop.Object, textureCache: interop.Object, sourceImage: interop.Object, attributes: interop.Object, textureOut: interop.PointerConvertible): number;

export declare function CVOpenGLTextureCacheFlush(textureCache: interop.Object, options: number): void;

export declare function CVPixelFormatDescriptionCreateWithPixelFormatType(allocator: interop.Object, pixelFormat: number): interop.Object;

export declare function CVPixelFormatDescriptionArrayCreateWithAllPixelFormatTypes(allocator: interop.Object): interop.Object;

export declare function CVPixelFormatDescriptionRegisterDescriptionWithPixelFormatType(description: interop.Object, pixelFormat: number): void;

export declare function CVMetalTextureGetTypeID(): number;

export declare function CVMetalTextureGetTexture(image: interop.Object): MTLTexture;

export declare function CVMetalTextureIsFlipped(image: interop.Object): number;

export declare function CVMetalTextureGetCleanTexCoords(image: interop.Object, lowerLeft: interop.PointerConvertible, lowerRight: interop.PointerConvertible, upperRight: interop.PointerConvertible, upperLeft: interop.PointerConvertible): void;

export declare function CVMetalTextureCacheGetTypeID(): number;

export declare function CVMetalTextureCacheCreate(allocator: interop.Object, cacheAttributes: interop.Object, metalDevice: MTLDevice, textureAttributes: interop.Object, cacheOut: interop.PointerConvertible): number;

export declare function CVMetalTextureCacheCreateTextureFromImage(allocator: interop.Object, textureCache: interop.Object, sourceImage: interop.Object, textureAttributes: interop.Object, pixelFormat: interop.Enum<typeof MTLPixelFormat>, width: number, height: number, planeIndex: number, textureOut: interop.PointerConvertible): number;

export declare function CVMetalTextureCacheFlush(textureCache: interop.Object, options: number): void;
