import type { AVDepthData, AVPortraitEffectsMatte, AVSemanticSegmentationMatte } from './AVFoundation'

import type { NSBitmapImageRep, NSColor } from './AppKit'

import type { CGAffineTransform, CGPoint, CGRect, CGSize } from './CoreFoundation'

import type { MLModel } from './CoreML'

import type { NSArray, NSAttributedString, NSCoder, NSCopying, NSData, NSDictionary, NSSecureCoding, NSURL } from './Foundation'

import type { IOSurface } from './IOSurface'

import type { MTLCommandBuffer, MTLCommandQueue, MTLDevice, MTLTexture } from './Metal'

import type { IKFilterUIView } from './Quartz'

import type { interop } from './objc-runtime'

import { NSCompositingOperation } from './AppKit'

import { CGImagePropertyOrientation } from './ImageIO'

import { MTLPixelFormat } from './Metal'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const CIDetectorEyeBlink: string;

export declare const kCIAttributeTypeBoolean: string;

export declare const kCICategoryInterlaced: string;

export declare const kCICategoryBlur: string;

export declare const kCIAttributeMin: string;

export declare const kCICategoryFilterGenerator: string;

export declare const kCIOutputNativeSizeKey: string;

export declare const kCIInputNeutralChromaticityYKey: string;

export declare const kCIFormatRGBX16: number;

export declare const kCIFormatRG16: number;

export declare const CIFeatureTypeFace: string;

export declare const kCIFilterGeneratorExportedKeyName: string;

export declare const kCIAttributeMax: string;

export declare const kCIImageTextureTarget: string;

export declare const kCIFilterGeneratorExportedKey: string;

export declare const CIRAWDecoderVersion8DNG: string;

export declare const CIRAWDecoderVersion9: string;

export declare const CIRAWDecoderVersionNone: string;

export declare const kCIInputLinearSpaceFilter: string;

export declare const kCIInputEnableEDRModeKey: string;

export declare const kCIInputNoiseReductionContrastAmountKey: string;

export declare const kCIInputMoireAmountKey: string;

export declare const kCIInputEnableChromaticNoiseTrackingKey: string;

export declare const kCIInputImageOrientationKey: string;

export declare const kCIInputScaleFactorKey: string;

export declare const kCIInputNeutralTemperatureKey: string;

export declare const kCIInputNeutralChromaticityXKey: string;

export declare const kCIInputAmountKey: string;

export declare const kCISupportedDecoderVersionsKey: string;

export declare const kCIInputAllowDraftModeKey: string;

export declare const kCISamplerColorSpace: string;

export declare const kCISamplerFilterNearest: string;

export declare const kCISamplerWrapClamp: string;

export declare const kCISamplerWrapBlack: string;

export declare const kCISamplerWrapMode: string;

export declare const kCISamplerAffineMatrix: string;

export declare const kCIImageProviderUserInfo: string;

export declare const kCIImageProviderTileSize: string;

export declare const CIFeatureTypeRectangle: string;

export declare const CIDetectorReturnSubFeatures: string;

export declare const CIDetectorAspectRatio: string;

export declare const CIDetectorFocalLength: string;

export declare const CIDetectorNumberOfAngles: string;

export declare const CIDetectorTracking: string;

export declare const CIDetectorAccuracyLow: string;

export declare const CIDetectorAccuracy: string;

export declare const CIDetectorTypeQRCode: string;

export declare const CIDetectorTypeFace: string;

export declare const kCIInputTargetImageKey: string;

export declare const kCIInputShadingImageKey: string;

export declare const kCIInputMatteImageKey: string;

export declare const kCIInputMaskImageKey: string;

export declare const kCIInputGradientImageKey: string;

export declare const kCIInputBiasKey: string;

export declare const kCIInputBrightnessKey: string;

export declare const kCIInputColorKey: string;

export declare const kCIInputSaturationKey: string;

export declare const kCIInputEVKey: string;

export declare const kCIInputIntensityKey: string;

export declare const kCIInputCenterKey: string;

export declare const kCIInputAspectRatioKey: string;

export declare const kCIInputScaleKey: string;

export declare const kCIInputTransformKey: string;

export declare const kCIInputDisparityImageKey: string;

export declare const kCIInputDepthImageKey: string;

export declare const kCIInputImageKey: string;

export declare const kCIOutputImageKey: string;

export declare const kCIApplyOptionColorSpace: string;

export declare const kCIApplyOptionDefinition: string;

export declare const kCIApplyOptionExtent: string;

export declare const kCICategoryBuiltIn: string;

export declare const kCICategorySharpen: string;

export declare const kCICategoryGradient: string;

export declare const kCICategoryTransition: string;

export declare const kCICategoryCompositeOperation: string;

export declare const kCICategoryDistortionEffect: string;

export declare const kCIAttributeTypeGradient: string;

export declare const kCIAttributeTypeRectangle: string;

export declare const kCIAttributeTypePosition: string;

export declare const kCIAttributeTypeAngle: string;

export declare const kCIAttributeTypeScalar: string;

export declare const kCIAttributeTypeTime: string;

export declare const kCIUISetDevelopment: string;

export declare const kCIUISetIntermediate: string;

export declare const kCIUIParameterSet: string;

export declare const kCIAttributeDisplayName: string;

export declare const kCIAttributeName: string;

export declare const kCIAttributeSliderMax: string;

export declare const kCIAttributeSliderMin: string;

export declare const kCIAttributeType: string;

export declare const kCIAttributeReferenceDocumentation: string;

export declare const kCIAttributeDescription: string;

export declare const kCIAttributeFilterName: string;

export declare const kCIImageRepresentationSemanticSegmentationTeethMatteImage: string;

export declare const kCIImageRepresentationSemanticSegmentationHairMatteImage: string;

export declare const kCIImageRepresentationSemanticSegmentationSkinMatteImage: string;

export declare const kCIImageRepresentationPortraitEffectsMatteImage: string;

export declare const kCIImageRepresentationAVPortraitEffectsMatte: string;

export declare const kCIImageRepresentationDisparityImage: string;

export declare const kCIImageRepresentationDepthImage: string;

export declare const kCIImageRepresentationAVDepthData: string;

export declare const kCIContextAllowLowPower: string;

export declare const kCIInputNeutralLocationKey: string;

export declare const kCIContextPriorityRequestLow: string;

export declare const kCIContextUseSoftwareRenderer: string;

export declare const kCIContextHighQualityDownsample: string;

export declare const kCIContextWorkingFormat: string;

export declare const kCIInputWidthKey: string;

export declare const kCIFormatARGB8: number;

export declare const kCICategoryGeometryAdjustment: string;

export declare const kCIImageNearestSampling: string;

export declare const kCIFormatLAh: number;

export declare const kCIAttributeTypeInteger: string;

export declare const kCICategoryStylize: string;

export declare const kCIInputDecoderVersionKey: string;

export declare const kCIImageAutoAdjustLevel: string;

export declare const kCIImageAutoAdjustRedEye: string;

export declare const kCIImageAuxiliaryHDRGainMap: string;

export declare const kCIImageAuxiliarySemanticSegmentationTeethMatte: string;

export declare const kCIImageAuxiliaryDepth: string;

export declare const kCIImageApplyOrientationProperty: string;

export declare const kCIImageCacheImmediately: string;

export declare const kCIImageToneMapHDRtoSDR: string;

export declare const kCIFormatLAf: number;

export declare const kCIFormatLA8: number;

export declare const kCIFormatLh: number;

export declare const kCIFormatL8: number;

export declare const kCIFormatRGf: number;

export declare const kCIFormatRGh: number;

export declare const kCIFormatRG8: number;

export declare const kCIFormatR16: number;

export declare const kCIFormatA16: number;

export declare const kCIFormatA8: number;

export declare const kCIFormatRGBAh: number;

export declare const kCIFormatABGR8: number;

export declare const kCIFormatRGBX8: number;

export declare const kCIFormatRGBA8: number;

export declare const kCIFormatBGRA8: number;

export declare const CIFeatureTypeText: string;

export declare const kCIFormatRf: number;

export declare const kCIAttributeClass: string;

export declare const kCIInputWeightsKey: string;

export declare const kCISamplerFilterMode: string;

export declare const kCIInputExtentKey: string;

export declare const kCIAttributeTypeImage: string;

export declare const kCICategoryColorAdjustment: string;

export declare const kCIAttributeTypeTransform: string;

export declare const kCIAttributeFilterAvailable_Mac: string;

export declare const CIRAWDecoderVersion8: string;

export declare const kCIInputEnableSharpeningKey: string;

export declare const kCIFormatRGBAf: number;

export declare const kCIImageRepresentationSemanticSegmentationGlassesMatteImage: string;

export declare const CIDetectorTypeText: string;

export declare const kCIContextOutputColorSpace: string;

export declare const kCIInputTimeKey: string;

export declare const CIDetectorMaxFeatureCount: string;

export declare const kCIAttributeTypePosition3: string;

export declare const kCIImageAuxiliarySemanticSegmentationGlassesMatte: string;

export declare const kCIImageAuxiliaryPortraitEffectsMatte: string;

export declare const kCIInputLuminanceNoiseReductionAmountKey: string;

export declare const kCIContextName: string;

export declare const CIDetectorImageOrientation: string;

export declare const kCIFilterGeneratorExportedKeyTargetObject: string;

export declare const kCIImageAuxiliaryDisparity: string;

export declare const kCIInputAngleKey: string;

export declare const kCIInputNoiseReductionSharpnessAmountKey: string;

export declare const kCIInputBackgroundImageKey: string;

export declare const kCIInputNoiseReductionAmountKey: string;

export declare const kCIImageRepresentationHDRGainMapImage: string;

export declare const kCICategoryReduction: string;

export declare const kCIAttributeFilterAvailable_iOS: string;

export declare const kCIAttributeFilterDisplayName: string;

export declare const CIRAWDecoderVersion6: string;

export declare const kCIFormatL16: number;

export declare const kCIInputColorNoiseReductionAmountKey: string;

export declare const kCIAttributeTypeColor: string;

export declare const kCIFormatLA16: number;

export declare const kCIFormatR8: number;

export declare const kCIInputVersionKey: string;

export declare const kCIContextOutputPremultiplied: string;

export declare const kCICategoryHalftoneEffect: string;

export declare const kCIImageAuxiliarySemanticSegmentationHairMatte: string;

export declare const kCIFormatRGBA16: number;

export declare const kCIInputNoiseReductionDetailAmountKey: string;

export declare const kCIInputRadiusKey: string;

export declare const kCIImageRepresentationAVSemanticSegmentationMattes: string;

export declare const CIDetectorTypeRectangle: string;

export declare const kCIAttributeDefault: string;

export declare const kCIFormatAh: number;

export declare const kCIInputBoostShadowAmountKey: string;

export declare const kCIAttributeIdentity: string;

export declare const kCIImageAutoAdjustEnhance: string;

export declare const kCIContextCacheIntermediates: string;

export declare const kCIFormatRh: number;

export declare const kCIAttributeTypeOffset: string;

export declare const kCIAttributeFilterCategories: string;

export declare const kCIAttributeTypeDistance: string;

export declare const kCIContextWorkingColorSpace: string;

export declare const kCIInputRefractionKey: string;

export declare const kCIActiveKeys: string;

export declare const kCIInputSharpnessKey: string;

export declare const kCIAttributeTypeOpaqueColor: string;

export declare const kCIInputDisableGamutMapKey: string;

export declare const kCIInputBaselineExposureKey: string;

export declare const kCICategoryStillImage: string;

export declare const CIRAWDecoderVersion6DNG: string;

export declare const kCIUISetBasic: string;

export declare const kCICategoryColorEffect: string;

export declare const CIDetectorSmile: string;

export declare const kCIInputNeutralTintKey: string;

export declare const CIRAWDecoderVersion7DNG: string;

export declare const kCIImageAuxiliarySemanticSegmentationSkinMatte: string;

export declare const kCICategoryHighDynamicRange: string;

export declare const CIRAWDecoderVersion9DNG: string;

export declare const kCIInputIgnoreImageOrientationKey: string;

export declare const kCIImageTextureFormat: string;

export declare const CIDetectorAccuracyHigh: string;

export declare const kCISamplerFilterLinear: string;

export declare const kCICategoryVideo: string;

export declare const kCIUISetAdvanced: string;

export declare const kCIAttributeTypeCount: string;

export declare const kCICategoryGenerator: string;

export declare const CIFeatureTypeQRCode: string;

export declare const kCIImageAutoAdjustCrop: string;

export declare const kCIInputEnableVendorLensCorrectionKey: string;

export declare const CIDetectorMinFeatureSize: string;

export declare const kCIFormatLf: number;

export declare const kCIImageAutoAdjustFeatures: string;

export declare const kCIApplyOptionUserInfo: string;

export declare const kCICategoryTileEffect: string;

export declare const kCIImageProperties: string;

export declare const kCICategoryNonSquarePixels: string;

export declare const kCIInputBoostKey: string;

export declare const kCIInputContrastKey: string;

export declare const kCIFormatAf: number;

export declare const kCIImageColorSpace: string;

export declare const CIRAWDecoderVersion7: string;

export declare const CIQRCodeErrorCorrectionLevel: {
  L: 76,
  M: 77,
  Q: 81,
  H: 72,
};

export declare const CIRenderDestinationAlphaMode: {
  None: 0,
  Premultiplied: 1,
  Unpremultiplied: 2,
};

export declare const CIDataMatrixCodeECCVersion: {
  Version000: 0,
  Version050: 50,
  Version080: 80,
  Version100: 100,
  Version140: 140,
  Version200: 200,
};

export declare interface CIFilterProtocol {
  readonly outputImage: CIImage;

}

export declare class CIFilterProtocol extends NativeObject implements CIFilterProtocol {
  static customAttributes(): NSDictionary;
}

export declare interface CIColorCurves extends CIFilterProtocol {
  inputImage: CIImage;

  curvesData: NSData;

  curvesDomain: CIVector;

  colorSpace: interop.Object;
}

export declare class CIColorCurves extends NativeObject implements CIColorCurves {
}

export declare interface CIBarsSwipeTransition extends CITransitionFilter {
  angle: number;

  width: number;

  barOffset: number;
}

export declare class CIBarsSwipeTransition extends NativeObject implements CIBarsSwipeTransition {
}

export declare interface CIDiscBlur extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIDiscBlur extends NativeObject implements CIDiscBlur {
}

export declare interface CIColumnAverage extends CIAreaReductionFilter {
}

export declare class CIColumnAverage extends NativeObject implements CIColumnAverage {
}

export declare interface CIAreaMinMaxRed extends CIAreaReductionFilter {
}

export declare class CIAreaMinMaxRed extends NativeObject implements CIAreaMinMaxRed {
}

export declare interface CIAreaMaximumAlpha extends CIAreaReductionFilter {
}

export declare class CIAreaMaximumAlpha extends NativeObject implements CIAreaMaximumAlpha {
}

export declare interface CIAreaHistogram extends CIAreaReductionFilter {
  scale: number;

  count: number;
}

export declare class CIAreaHistogram extends NativeObject implements CIAreaHistogram {
}

export declare interface CIAreaReductionFilter extends CIFilterProtocol {
  inputImage: CIImage;

  extent: CGRect;
}

export declare class CIAreaReductionFilter extends NativeObject implements CIAreaReductionFilter {
}

export declare interface CINoiseReduction extends CIFilterProtocol {
  inputImage: CIImage;

  noiseLevel: number;

  sharpness: number;
}

export declare class CINoiseReduction extends NativeObject implements CINoiseReduction {
}

export declare interface CIMorphologyRectangleMinimum extends CIFilterProtocol {
  inputImage: CIImage;

  width: number;

  height: number;
}

export declare class CIMorphologyRectangleMinimum extends NativeObject implements CIMorphologyRectangleMinimum {
}

export declare interface CIMorphologyRectangleMaximum extends CIFilterProtocol {
  inputImage: CIImage;

  width: number;

  height: number;
}

export declare class CIMorphologyRectangleMaximum extends NativeObject implements CIMorphologyRectangleMaximum {
}

export declare interface CISpotLight extends CIFilterProtocol {
  inputImage: CIImage;

  lightPosition: CIVector;

  lightPointsAt: CIVector;

  brightness: number;

  concentration: number;

  color: CIColor;
}

export declare class CISpotLight extends NativeObject implements CISpotLight {
}

export declare interface CISpotColor extends CIFilterProtocol {
  inputImage: CIImage;

  centerColor1: CIColor;

  replacementColor1: CIColor;

  closeness1: number;

  contrast1: number;

  centerColor2: CIColor;

  replacementColor2: CIColor;

  closeness2: number;

  contrast2: number;

  centerColor3: CIColor;

  replacementColor3: CIColor;

  closeness3: number;

  contrast3: number;
}

export declare class CISpotColor extends NativeObject implements CISpotColor {
}

export declare interface CIPointillize extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  center: CGPoint;
}

export declare class CIPointillize extends NativeObject implements CIPointillize {
}

export declare interface CIPixellate extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  scale: number;
}

export declare class CIPixellate extends NativeObject implements CIPixellate {
}

export declare interface CIHighlightShadowAdjust extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  shadowAmount: number;

  highlightAmount: number;
}

export declare class CIHighlightShadowAdjust extends NativeObject implements CIHighlightShadowAdjust {
}

export declare interface CIPerspectiveTransformWithExtent extends CIFourCoordinateGeometryFilter {
  extent: CGRect;
}

export declare class CIPerspectiveTransformWithExtent extends NativeObject implements CIPerspectiveTransformWithExtent {
}

export declare interface CIHexagonalPixellate extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  scale: number;
}

export declare class CIHexagonalPixellate extends NativeObject implements CIHexagonalPixellate {
}

export declare interface CIConvolution extends CIFilterProtocol {
  inputImage: CIImage;

  weights: CIVector;

  bias: number;
}

export declare class CIConvolution extends NativeObject implements CIConvolution {
}

export declare interface CIComicEffect extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIComicEffect extends NativeObject implements CIComicEffect {
}

export declare interface CIColorCrossPolynomial extends CIFilterProtocol {
  inputImage: CIImage;

  redCoefficients: CIVector;

  greenCoefficients: CIVector;

  blueCoefficients: CIVector;
}

export declare class CIColorCrossPolynomial extends NativeObject implements CIColorCrossPolynomial {
}

export declare interface CIBloom extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  intensity: number;
}

export declare class CIBloom extends NativeObject implements CIBloom {
}

export declare interface CITextImageGenerator extends CIFilterProtocol {
  text: string;

  fontName: string;

  fontSize: number;

  scaleFactor: number;
}

export declare class CITextImageGenerator extends NativeObject implements CITextImageGenerator {
}

export declare interface CIRoundedQRCodeGenerator extends CIFilterProtocol {
  message: NSData;

  correctionLevel: string;

  scale: number;

  roundedMarkers: number;

  roundedData: boolean;

  centerSpaceSize: number;

  color0: CIColor;

  color1: CIColor;
}

export declare class CIRoundedQRCodeGenerator extends NativeObject implements CIRoundedQRCodeGenerator {
}

export declare interface CIRandomGenerator extends CIFilterProtocol {
}

export declare class CIRandomGenerator extends NativeObject implements CIRandomGenerator {
}

export declare interface CIDisplacementDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  displacementImage: CIImage;

  scale: number;
}

export declare class CIDisplacementDistortion extends NativeObject implements CIDisplacementDistortion {
}

export declare interface CICode128BarcodeGenerator extends CIFilterProtocol {
  message: NSData;

  quietSpace: number;

  barcodeHeight: number;
}

export declare class CICode128BarcodeGenerator extends NativeObject implements CICode128BarcodeGenerator {
}

export declare interface CIBlurredRoundedRectangleGenerator extends CIFilterProtocol {
  extent: CGRect;

  radius: number;

  smoothness: number;

  sigma: number;

  color: CIColor;
}

export declare class CIBlurredRoundedRectangleGenerator extends NativeObject implements CIBlurredRoundedRectangleGenerator {
}

export declare interface CIBlurredRectangleGenerator extends CIFilterProtocol {
  extent: CGRect;

  sigma: number;

  color: CIColor;
}

export declare class CIBlurredRectangleGenerator extends NativeObject implements CIBlurredRectangleGenerator {
}

export declare interface CITriangleTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CITriangleTile extends NativeObject implements CITriangleTile {
}

export declare interface CISixfoldReflectedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CISixfoldReflectedTile extends NativeObject implements CISixfoldReflectedTile {
}

export declare interface CIPerspectiveTile extends CIFilterProtocol {
  inputImage: CIImage;

  topLeft: CGPoint;

  topRight: CGPoint;

  bottomRight: CGPoint;

  bottomLeft: CGPoint;
}

export declare class CIPerspectiveTile extends NativeObject implements CIPerspectiveTile {
}

export declare interface CIPersonSegmentation extends CIFilterProtocol {
  inputImage: CIImage;

  qualityLevel: number;
}

export declare class CIPersonSegmentation extends NativeObject implements CIPersonSegmentation {
}

export declare interface CIGlideReflectedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CIGlideReflectedTile extends NativeObject implements CIGlideReflectedTile {
}

export declare interface CIFourfoldRotatedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CIFourfoldRotatedTile extends NativeObject implements CIFourfoldRotatedTile {
}

export declare interface CIEightfoldReflectedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CIEightfoldReflectedTile extends NativeObject implements CIEightfoldReflectedTile {
}

export declare interface CIBoxBlur extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIBoxBlur extends NativeObject implements CIBoxBlur {
}

export declare interface CIVortexDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  angle: number;
}

export declare class CIVortexDistortion extends NativeObject implements CIVortexDistortion {
}

export declare interface CINinePartTiled extends CIFilterProtocol {
  inputImage: CIImage;

  breakpoint0: CGPoint;

  breakpoint1: CGPoint;

  growAmount: CGPoint;

  flipYTiles: boolean;
}

export declare class CINinePartTiled extends NativeObject implements CINinePartTiled {
}

export declare interface CILightTunnel extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  rotation: number;

  radius: number;
}

export declare class CILightTunnel extends NativeObject implements CILightTunnel {
}

export declare interface CIGlassLozenge extends CIFilterProtocol {
  inputImage: CIImage;

  point0: CGPoint;

  point1: CGPoint;

  radius: number;

  refraction: number;
}

export declare class CIGlassLozenge extends NativeObject implements CIGlassLozenge {
}

export declare interface CIDroste extends CIFilterProtocol {
  inputImage: CIImage;

  insetPoint0: CGPoint;

  insetPoint1: CGPoint;

  strands: number;

  periodicity: number;

  rotation: number;

  zoom: number;
}

export declare class CIDroste extends NativeObject implements CIDroste {
}

export declare interface CIAreaMinimumAlpha extends CIAreaReductionFilter {
}

export declare class CIAreaMinimumAlpha extends NativeObject implements CIAreaMinimumAlpha {
}

export declare interface CICircularWrap extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  angle: number;
}

export declare class CICircularWrap extends NativeObject implements CICircularWrap {
}

export declare interface CIBumpDistortionLinear extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  angle: number;

  scale: number;
}

export declare class CIBumpDistortionLinear extends NativeObject implements CIBumpDistortionLinear {
}

export declare interface CIBumpDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  scale: number;
}

export declare class CIBumpDistortion extends NativeObject implements CIBumpDistortion {
}

export declare interface CIParallelogramTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  acuteAngle: number;

  width: number;
}

export declare class CIParallelogramTile extends NativeObject implements CIParallelogramTile {
}

export declare interface CIXRay extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIXRay extends NativeObject implements CIXRay {
}

export declare interface CIThermal extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIThermal extends NativeObject implements CIThermal {
}

export declare interface CINinePartStretched extends CIFilterProtocol {
  inputImage: CIImage;

  breakpoint0: CGPoint;

  breakpoint1: CGPoint;

  growAmount: CGPoint;
}

export declare class CINinePartStretched extends NativeObject implements CINinePartStretched {
}

export declare interface CIGlassDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  textureImage: CIImage;

  center: CGPoint;

  scale: number;
}

export declare class CIGlassDistortion extends NativeObject implements CIGlassDistortion {
}

export declare interface CIPhotoEffect extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIPhotoEffect extends NativeObject implements CIPhotoEffect {
}

export declare interface CIMaskToAlpha extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIMaskToAlpha extends NativeObject implements CIMaskToAlpha {
}

export declare interface CIConvertLab extends CIFilterProtocol {
  inputImage: CIImage;

  normalize: boolean;
}

export declare class CIConvertLab extends NativeObject implements CIConvertLab {
}

export declare interface CIAreaAverage extends CIAreaReductionFilter {
}

export declare class CIAreaAverage extends NativeObject implements CIAreaAverage {
}

export declare interface CIColorPosterize extends CIFilterProtocol {
  inputImage: CIImage;

  levels: number;
}

export declare class CIColorPosterize extends NativeObject implements CIColorPosterize {
}

export declare interface CIColorMap extends CIFilterProtocol {
  inputImage: CIImage;

  gradientImage: CIImage;
}

export declare class CIColorMap extends NativeObject implements CIColorMap {
}

export declare interface CIWhitePointAdjust extends CIFilterProtocol {
  inputImage: CIImage;

  color: CIColor;
}

export declare class CIWhitePointAdjust extends NativeObject implements CIWhitePointAdjust {
}

export declare interface CIVibrance extends CIFilterProtocol {
  inputImage: CIImage;

  amount: number;
}

export declare class CIVibrance extends NativeObject implements CIVibrance {
}

export declare interface CIToneCurve extends CIFilterProtocol {
  inputImage: CIImage;

  point0: CGPoint;

  point1: CGPoint;

  point2: CGPoint;

  point3: CGPoint;

  point4: CGPoint;
}

export declare class CIToneCurve extends NativeObject implements CIToneCurve {
}

export declare interface CITemperatureAndTint extends CIFilterProtocol {
  inputImage: CIImage;

  neutral: CIVector;

  targetNeutral: CIVector;
}

export declare class CITemperatureAndTint extends NativeObject implements CITemperatureAndTint {
}

export declare interface CISRGBToneCurveToLinear extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CISRGBToneCurveToLinear extends NativeObject implements CISRGBToneCurveToLinear {
}

export declare interface CILinearToSRGBToneCurve extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CILinearToSRGBToneCurve extends NativeObject implements CILinearToSRGBToneCurve {
}

export declare interface CIHueAdjust extends CIFilterProtocol {
  inputImage: CIImage;

  angle: number;
}

export declare class CIHueAdjust extends NativeObject implements CIHueAdjust {
}

export declare interface CIDepthToDisparity extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIDepthToDisparity extends NativeObject implements CIDepthToDisparity {
}

export declare interface CIBlendWithMask extends CIFilterProtocol {
  inputImage: CIImage;

  backgroundImage: CIImage;

  maskImage: CIImage;
}

export declare class CIBlendWithMask extends NativeObject implements CIBlendWithMask {
}

export declare interface CIColorThresholdOtsu extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIColorThresholdOtsu extends NativeObject implements CIColorThresholdOtsu {
}

export declare interface CIColorPolynomial extends CIFilterProtocol {
  inputImage: CIImage;

  redCoefficients: CIVector;

  greenCoefficients: CIVector;

  blueCoefficients: CIVector;

  alphaCoefficients: CIVector;
}

export declare class CIColorPolynomial extends NativeObject implements CIColorPolynomial {
}

export declare interface CIColorAbsoluteDifference extends CIFilterProtocol {
  inputImage: CIImage;

  inputImage2: CIImage;
}

export declare class CIColorAbsoluteDifference extends NativeObject implements CIColorAbsoluteDifference {
}

export declare interface CISwipeTransition extends CITransitionFilter {
  extent: CGRect;

  color: CIColor;

  angle: number;

  width: number;

  opacity: number;
}

export declare class CISwipeTransition extends NativeObject implements CISwipeTransition {
}

export declare interface CIRippleTransition extends CITransitionFilter {
  shadingImage: CIImage;

  center: CGPoint;

  extent: CGRect;

  width: number;

  scale: number;
}

export declare class CIRippleTransition extends NativeObject implements CIRippleTransition {
}

export declare interface CIPageCurlTransition extends CITransitionFilter {
  backsideImage: CIImage;

  shadingImage: CIImage;

  extent: CGRect;

  angle: number;

  radius: number;
}

export declare class CIPageCurlTransition extends NativeObject implements CIPageCurlTransition {
}

export declare interface CIFlashTransition extends CITransitionFilter {
  center: CGPoint;

  extent: CGRect;

  color: CIColor;

  maxStriationRadius: number;

  striationStrength: number;

  striationContrast: number;

  fadeThreshold: number;
}

export declare class CIFlashTransition extends NativeObject implements CIFlashTransition {
}

export declare interface CIColorControls extends CIFilterProtocol {
  inputImage: CIImage;

  saturation: number;

  brightness: number;

  contrast: number;
}

export declare class CIColorControls extends NativeObject implements CIColorControls {
}

export declare interface CILineScreen extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;

  sharpness: number;
}

export declare class CILineScreen extends NativeObject implements CILineScreen {
}

export declare interface CIDisintegrateWithMaskTransition extends CITransitionFilter {
  maskImage: CIImage;

  shadowRadius: number;

  shadowDensity: number;

  shadowOffset: CGPoint;
}

export declare class CIDisintegrateWithMaskTransition extends NativeObject implements CIDisintegrateWithMaskTransition {
}

export declare interface CIPinchDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  scale: number;
}

export declare class CIPinchDistortion extends NativeObject implements CIPinchDistortion {
}

export declare interface CICopyMachineTransition extends CITransitionFilter {
  extent: CGRect;

  color: CIColor;

  angle: number;

  width: number;

  opacity: number;
}

export declare class CICopyMachineTransition extends NativeObject implements CICopyMachineTransition {
}

export declare interface CISystemToneMap extends CIFilterProtocol {
  inputImage: CIImage;

  displayHeadroom: number;

  preferredDynamicRange: string;
}

export declare class CISystemToneMap extends NativeObject implements CISystemToneMap {
}

export declare interface CIAccordionFoldTransition extends CITransitionFilter {
  bottomHeight: number;

  numberOfFolds: number;

  foldShadowAmount: number;
}

export declare class CIAccordionFoldTransition extends NativeObject implements CIAccordionFoldTransition {
}

export declare interface CITransitionFilter extends CIFilterProtocol {
  inputImage: CIImage;

  targetImage: CIImage;

  time: number;
}

export declare class CITransitionFilter extends NativeObject implements CITransitionFilter {
}

export declare interface CIPerspectiveTransform extends CIFourCoordinateGeometryFilter {
}

export declare class CIPerspectiveTransform extends NativeObject implements CIPerspectiveTransform {
}

export declare interface CIPerspectiveRotate extends CIFilterProtocol {
  inputImage: CIImage;

  focalLength: number;

  pitch: number;

  yaw: number;

  roll: number;
}

export declare class CIPerspectiveRotate extends NativeObject implements CIPerspectiveRotate {
}

export declare interface CILanczosScaleTransform extends CIFilterProtocol {
  inputImage: CIImage;

  scale: number;

  aspectRatio: number;
}

export declare class CILanczosScaleTransform extends NativeObject implements CILanczosScaleTransform {
}

export declare interface CIKeystoneCorrectionVertical extends CIFourCoordinateGeometryFilter {
  focalLength: number;
}

export declare class CIKeystoneCorrectionVertical extends NativeObject implements CIKeystoneCorrectionVertical {
}

export declare interface CIKeystoneCorrectionCombined extends CIFourCoordinateGeometryFilter {
  focalLength: number;
}

export declare class CIKeystoneCorrectionCombined extends NativeObject implements CIKeystoneCorrectionCombined {
}

export declare interface CIOpTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  scale: number;

  angle: number;

  width: number;
}

export declare class CIOpTile extends NativeObject implements CIOpTile {
}

export declare interface CICircleSplashDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;
}

export declare class CICircleSplashDistortion extends NativeObject implements CICircleSplashDistortion {
}

export declare interface CIEdgePreserveUpsample extends CIFilterProtocol {
  inputImage: CIImage;

  smallImage: CIImage;

  spatialSigma: number;

  lumaSigma: number;
}

export declare class CIEdgePreserveUpsample extends NativeObject implements CIEdgePreserveUpsample {
}

export declare interface CIBicubicScaleTransform extends CIFilterProtocol {
  inputImage: CIImage;

  scale: number;

  aspectRatio: number;

  parameterB: number;

  parameterC: number;
}

export declare class CIBicubicScaleTransform extends NativeObject implements CIBicubicScaleTransform {
}

export declare interface CIMedian extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIMedian extends NativeObject implements CIMedian {
}

export declare interface CIHatchedScreen extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;

  sharpness: number;
}

export declare class CIHatchedScreen extends NativeObject implements CIHatchedScreen {
}

export declare interface CILabDeltaE extends CIFilterProtocol {
  inputImage: CIImage;

  image2: CIImage;
}

export declare class CILabDeltaE extends NativeObject implements CILabDeltaE {
}

export declare interface CIFalseColor extends CIFilterProtocol {
  inputImage: CIImage;

  color0: CIColor;

  color1: CIColor;
}

export declare class CIFalseColor extends NativeObject implements CIFalseColor {
}

export declare interface CIDotScreen extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;

  sharpness: number;
}

export declare class CIDotScreen extends NativeObject implements CIDotScreen {
}

export declare interface CICMYKHalftone extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  width: number;

  angle: number;

  sharpness: number;

  grayComponentReplacement: number;

  underColorRemoval: number;
}

export declare class CICMYKHalftone extends NativeObject implements CICMYKHalftone {
}

export declare interface CIRoundedRectangleStrokeGenerator extends CIFilterProtocol {
  extent: CGRect;

  radius: number;

  color: CIColor;

  width: number;
}

export declare class CIRoundedRectangleStrokeGenerator extends NativeObject implements CIRoundedRectangleStrokeGenerator {
}

export declare interface CICircularScreen extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  width: number;

  sharpness: number;
}

export declare class CICircularScreen extends NativeObject implements CICircularScreen {
}

export declare interface CIUnsharpMask extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  intensity: number;
}

export declare class CIUnsharpMask extends NativeObject implements CIUnsharpMask {
}

export declare interface CISmoothLinearGradient extends CIFilterProtocol {
  point0: CGPoint;

  point1: CGPoint;

  color0: CIColor;

  color1: CIColor;
}

export declare class CISmoothLinearGradient extends NativeObject implements CISmoothLinearGradient {
}

export declare interface CISignedDistanceGradientFromRedMask extends CIFilterProtocol {
  inputImage: CIImage;

  maximumDistance: number;
}

export declare class CISignedDistanceGradientFromRedMask extends NativeObject implements CISignedDistanceGradientFromRedMask {
}

export declare interface CILinearGradient extends CIFilterProtocol {
  point0: CGPoint;

  point1: CGPoint;

  color0: CIColor;

  color1: CIColor;
}

export declare class CILinearGradient extends NativeObject implements CILinearGradient {
}

export declare interface CIGaussianGradient extends CIFilterProtocol {
  center: CGPoint;

  color0: CIColor;

  color1: CIColor;

  radius: number;
}

export declare class CIGaussianGradient extends NativeObject implements CIGaussianGradient {
}

export declare interface CIDistanceGradientFromRedMask extends CIFilterProtocol {
  inputImage: CIImage;

  maximumDistance: number;
}

export declare class CIDistanceGradientFromRedMask extends NativeObject implements CIDistanceGradientFromRedMask {
}

export declare interface CISunbeamsGenerator extends CIFilterProtocol {
  center: CGPoint;

  color: CIColor;

  sunRadius: number;

  maxStriationRadius: number;

  striationStrength: number;

  striationContrast: number;

  time: number;
}

export declare class CISunbeamsGenerator extends NativeObject implements CISunbeamsGenerator {
}

export declare interface CIGaborGradients extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIGaborGradients extends NativeObject implements CIGaborGradients {
}

export declare interface CIDissolveTransition extends CITransitionFilter {
}

export declare class CIDissolveTransition extends NativeObject implements CIDissolveTransition {
}

export declare interface CIHeightFieldFromMask extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIHeightFieldFromMask extends NativeObject implements CIHeightFieldFromMask {
}

export declare interface CIAffineTile extends CIFilterProtocol {
  inputImage: CIImage;

  transform: CGAffineTransform;
}

export declare class CIAffineTile extends NativeObject implements CIAffineTile {
}

export declare interface CISixfoldRotatedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CISixfoldRotatedTile extends NativeObject implements CISixfoldRotatedTile {
}

export declare interface CIAreaMinMax extends CIAreaReductionFilter {
}

export declare class CIAreaMinMax extends NativeObject implements CIAreaMinMax {
}

export declare interface CIKaleidoscope extends CIFilterProtocol {
  inputImage: CIImage;

  count: number;

  center: CGPoint;

  angle: number;
}

export declare class CIKaleidoscope extends NativeObject implements CIKaleidoscope {
}

export declare interface CIHistogramDisplay extends CIFilterProtocol {
  inputImage: CIImage;

  height: number;

  highLimit: number;

  lowLimit: number;
}

export declare class CIHistogramDisplay extends NativeObject implements CIHistogramDisplay {
}

export declare interface CIAffineClamp extends CIFilterProtocol {
  inputImage: CIImage;

  transform: CGAffineTransform;
}

export declare class CIAffineClamp extends NativeObject implements CIAffineClamp {
}

export declare interface CIToneMapHeadroom extends CIFilterProtocol {
  inputImage: CIImage;

  sourceHeadroom: number;

  targetHeadroom: number;
}

export declare class CIToneMapHeadroom extends NativeObject implements CIToneMapHeadroom {
}

export declare interface CIMorphologyMinimum extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIMorphologyMinimum extends NativeObject implements CIMorphologyMinimum {
}

export declare interface CICheckerboardGenerator extends CIFilterProtocol {
  center: CGPoint;

  color0: CIColor;

  color1: CIColor;

  width: number;

  sharpness: number;
}

export declare class CICheckerboardGenerator extends NativeObject implements CICheckerboardGenerator {
}

export declare interface CIRoundedRectangleGenerator extends CIFilterProtocol {
  extent: CGRect;

  radius: number;

  color: CIColor;
}

export declare class CIRoundedRectangleGenerator extends NativeObject implements CIRoundedRectangleGenerator {
}

export declare interface CIStarShineGenerator extends CIFilterProtocol {
  center: CGPoint;

  color: CIColor;

  radius: number;

  crossScale: number;

  crossAngle: number;

  crossOpacity: number;

  crossWidth: number;

  epsilon: number;
}

export declare class CIStarShineGenerator extends NativeObject implements CIStarShineGenerator {
}

export declare interface CIColorMatrix extends CIFilterProtocol {
  inputImage: CIImage;

  RVector: CIVector;

  GVector: CIVector;

  BVector: CIVector;

  AVector: CIVector;

  biasVector: CIVector;
}

export declare class CIColorMatrix extends NativeObject implements CIColorMatrix {
}

export declare interface CIAreaLogarithmicHistogram extends CIAreaReductionFilter {
  scale: number;

  count: number;

  minimumStop: number;

  maximumStop: number;
}

export declare class CIAreaLogarithmicHistogram extends NativeObject implements CIAreaLogarithmicHistogram {
}

export declare interface CIExposureAdjust extends CIFilterProtocol {
  inputImage: CIImage;

  EV: number;
}

export declare class CIExposureAdjust extends NativeObject implements CIExposureAdjust {
}

export declare interface CIFourfoldReflectedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;

  acuteAngle: number;
}

export declare class CIFourfoldReflectedTile extends NativeObject implements CIFourfoldReflectedTile {
}

export declare interface CIFourCoordinateGeometryFilter extends CIFilterProtocol {
  inputImage: CIImage;

  topLeft: CGPoint;

  topRight: CGPoint;

  bottomRight: CGPoint;

  bottomLeft: CGPoint;
}

export declare class CIFourCoordinateGeometryFilter extends NativeObject implements CIFourCoordinateGeometryFilter {
}

export declare interface CICrystallize extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  center: CGPoint;
}

export declare class CICrystallize extends NativeObject implements CICrystallize {
}

export declare interface CIPaletteCentroid extends CIFilterProtocol {
  inputImage: CIImage;

  paletteImage: CIImage;

  perceptual: boolean;
}

export declare class CIPaletteCentroid extends NativeObject implements CIPaletteCentroid {
}

export declare interface CIDepthOfField extends CIFilterProtocol {
  inputImage: CIImage;

  point0: CGPoint;

  point1: CGPoint;

  saturation: number;

  unsharpMaskRadius: number;

  unsharpMaskIntensity: number;

  radius: number;
}

export declare class CIDepthOfField extends NativeObject implements CIDepthOfField {
}

export declare interface CISepiaTone extends CIFilterProtocol {
  inputImage: CIImage;

  intensity: number;
}

export declare class CISepiaTone extends NativeObject implements CISepiaTone {
}

export declare interface CICoreMLModel extends CIFilterProtocol {
  inputImage: CIImage;

  model: MLModel;

  headIndex: number;

  softmaxNormalization: boolean;
}

export declare class CICoreMLModel extends NativeObject implements CICoreMLModel {
}

export declare interface CIColorThreshold extends CIFilterProtocol {
  inputImage: CIImage;

  threshold: number;
}

export declare class CIColorThreshold extends NativeObject implements CIColorThreshold {
}

export declare interface CITwelvefoldReflectedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;
}

export declare class CITwelvefoldReflectedTile extends NativeObject implements CITwelvefoldReflectedTile {
}

export declare interface CIColorCube extends CIFilterProtocol {
  inputImage: CIImage;

  cubeDimension: number;

  cubeData: NSData;
}

export declare class CIColorCube extends NativeObject implements CIColorCube {
}

export declare interface CILineOverlay extends CIFilterProtocol {
  inputImage: CIImage;

  NRNoiseLevel: number;

  NRSharpness: number;

  edgeIntensity: number;

  threshold: number;

  contrast: number;
}

export declare class CILineOverlay extends NativeObject implements CILineOverlay {
}

export declare interface CIKeystoneCorrectionHorizontal extends CIFourCoordinateGeometryFilter {
  focalLength: number;
}

export declare class CIKeystoneCorrectionHorizontal extends NativeObject implements CIKeystoneCorrectionHorizontal {
}

export declare interface CIDocumentEnhancer extends CIFilterProtocol {
  inputImage: CIImage;

  amount: number;
}

export declare class CIDocumentEnhancer extends NativeObject implements CIDocumentEnhancer {
}

export declare interface CIShadedMaterial extends CIFilterProtocol {
  inputImage: CIImage;

  shadingImage: CIImage;

  scale: number;
}

export declare class CIShadedMaterial extends NativeObject implements CIShadedMaterial {
}

export declare interface CIKMeans extends CIAreaReductionFilter {
  inputMeans: CIImage;

  count: number;

  passes: number;

  perceptual: boolean;
}

export declare class CIKMeans extends NativeObject implements CIKMeans {
}

export declare interface CITwirlDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  angle: number;
}

export declare class CITwirlDistortion extends NativeObject implements CITwirlDistortion {
}

export declare interface CIGaussianBlur extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIGaussianBlur extends NativeObject implements CIGaussianBlur {
}

export declare interface CIAttributedTextImageGenerator extends CIFilterProtocol {
  text: NSAttributedString;

  scaleFactor: number;
}

export declare class CIAttributedTextImageGenerator extends NativeObject implements CIAttributedTextImageGenerator {
}

export declare interface CIPlugInRegistration {
  load(host: interop.PointerConvertible): boolean;
}

export declare class CIPlugInRegistration extends NativeObject implements CIPlugInRegistration {
}

export declare interface CIRowAverage extends CIAreaReductionFilter {
}

export declare class CIRowAverage extends NativeObject implements CIRowAverage {
}

export declare interface CIMix extends CIFilterProtocol {
  inputImage: CIImage;

  backgroundImage: CIImage;

  amount: number;
}

export declare class CIMix extends NativeObject implements CIMix {
}

export declare interface CIMaximumScaleTransform extends CIFilterProtocol {
  inputImage: CIImage;

  scale: number;

  aspectRatio: number;
}

export declare class CIMaximumScaleTransform extends NativeObject implements CIMaximumScaleTransform {
}

export declare interface CIVignetteEffect extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  intensity: number;

  falloff: number;
}

export declare class CIVignetteEffect extends NativeObject implements CIVignetteEffect {
}

export declare interface CIStraighten extends CIFilterProtocol {
  inputImage: CIImage;

  angle: number;
}

export declare class CIStraighten extends NativeObject implements CIStraighten {
}

export declare interface CIColorInvert extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIColorInvert extends NativeObject implements CIColorInvert {
}

export declare interface CIAreaMinimum extends CIAreaReductionFilter {
}

export declare class CIAreaMinimum extends NativeObject implements CIAreaMinimum {
}

export declare interface CISobelGradients extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CISobelGradients extends NativeObject implements CISobelGradients {
}

export declare interface CIStretchCrop extends CIFilterProtocol {
  inputImage: CIImage;

  size: CGPoint;

  cropAmount: number;

  centerStretchAmount: number;
}

export declare class CIStretchCrop extends NativeObject implements CIStretchCrop {
}

export declare interface CIMeshGenerator extends CIFilterProtocol {
  width: number;

  color: CIColor;

  get mesh(): NSArray;
  set mesh(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class CIMeshGenerator extends NativeObject implements CIMeshGenerator {
}

export declare interface CIMorphologyGradient extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIMorphologyGradient extends NativeObject implements CIMorphologyGradient {
}

export declare interface CIEdges extends CIFilterProtocol {
  inputImage: CIImage;

  intensity: number;
}

export declare class CIEdges extends NativeObject implements CIEdges {
}

export declare interface CIGammaAdjust extends CIFilterProtocol {
  inputImage: CIImage;

  power: number;
}

export declare class CIGammaAdjust extends NativeObject implements CIGammaAdjust {
}

export declare interface CICompositeOperation extends CIFilterProtocol {
  inputImage: CIImage;

  backgroundImage: CIImage;
}

export declare class CICompositeOperation extends NativeObject implements CICompositeOperation {
}

export declare interface CIAreaMaximum extends CIAreaReductionFilter {
}

export declare class CIAreaMaximum extends NativeObject implements CIAreaMaximum {
}

export declare interface CIPDF417BarcodeGenerator extends CIFilterProtocol {
  message: NSData;

  minWidth: number;

  maxWidth: number;

  minHeight: number;

  maxHeight: number;

  dataColumns: number;

  rows: number;

  preferredAspectRatio: number;

  compactionMode: number;

  compactStyle: number;

  correctionLevel: number;

  alwaysSpecifyCompaction: number;
}

export declare class CIPDF417BarcodeGenerator extends NativeObject implements CIPDF417BarcodeGenerator {
}

export declare interface CIStripesGenerator extends CIFilterProtocol {
  center: CGPoint;

  color0: CIColor;

  color1: CIColor;

  width: number;

  sharpness: number;
}

export declare class CIStripesGenerator extends NativeObject implements CIStripesGenerator {
}

export declare interface CIBokehBlur extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  ringAmount: number;

  ringSize: number;

  softness: number;
}

export declare class CIBokehBlur extends NativeObject implements CIBokehBlur {
}

export declare interface CIColorCubeWithColorSpace extends CIFilterProtocol {
  inputImage: CIImage;

  cubeDimension: number;

  cubeData: NSData;

  colorSpace: interop.Object;
}

export declare class CIColorCubeWithColorSpace extends NativeObject implements CIColorCubeWithColorSpace {
}

export declare interface CIPerspectiveCorrection extends CIFourCoordinateGeometryFilter {
  crop: boolean;
}

export declare class CIPerspectiveCorrection extends NativeObject implements CIPerspectiveCorrection {
}

export declare interface CISaliencyMap extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CISaliencyMap extends NativeObject implements CISaliencyMap {
}

export declare interface CIImageProcessorOutput {
  readonly region: CGRect;

  readonly bytesPerRow: number;

  readonly format: number;

  readonly baseAddress: interop.Pointer;

  readonly surface: interop.Object;

  readonly pixelBuffer: interop.Object;

  readonly metalTexture: MTLTexture;

  readonly metalCommandBuffer: MTLCommandBuffer;
}

export declare class CIImageProcessorOutput extends NativeObject implements CIImageProcessorOutput {
}

export declare interface CIVignette extends CIFilterProtocol {
  inputImage: CIImage;

  intensity: number;

  radius: number;
}

export declare class CIVignette extends NativeObject implements CIVignette {
}

export declare interface CIColorClamp extends CIFilterProtocol {
  inputImage: CIImage;

  minComponents: CIVector;

  maxComponents: CIVector;
}

export declare class CIColorClamp extends NativeObject implements CIColorClamp {
}

export declare interface CIGloom extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  intensity: number;
}

export declare class CIGloom extends NativeObject implements CIGloom {
}

export declare interface CIMorphologyMaximum extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIMorphologyMaximum extends NativeObject implements CIMorphologyMaximum {
}

export declare interface CIHueSaturationValueGradient extends CIFilterProtocol {
  value: number;

  radius: number;

  softness: number;

  dither: number;

  colorSpace: interop.Object;
}

export declare class CIHueSaturationValueGradient extends NativeObject implements CIHueSaturationValueGradient {
}

export declare interface CIColorCubesMixedWithMask extends CIFilterProtocol {
  inputImage: CIImage;

  maskImage: CIImage;

  cubeDimension: number;

  cube0Data: NSData;

  cube1Data: NSData;

  colorSpace: interop.Object;
}

export declare class CIColorCubesMixedWithMask extends NativeObject implements CIColorCubesMixedWithMask {
}

export declare interface CIAztecCodeGenerator extends CIFilterProtocol {
  message: NSData;

  correctionLevel: number;

  layers: number;

  compactStyle: number;
}

export declare class CIAztecCodeGenerator extends NativeObject implements CIAztecCodeGenerator {
}

export declare interface CIImageProcessorInput {
  readonly region: CGRect;

  readonly bytesPerRow: number;

  readonly format: number;

  readonly baseAddress: interop.Pointer;

  readonly surface: interop.Object;

  readonly pixelBuffer: interop.Object;

  readonly metalTexture: MTLTexture;
}

export declare class CIImageProcessorInput extends NativeObject implements CIImageProcessorInput {
}

export declare interface CIDither extends CIFilterProtocol {
  inputImage: CIImage;

  intensity: number;
}

export declare class CIDither extends NativeObject implements CIDither {
}

export declare interface CIAreaBoundsRed extends CIAreaReductionFilter {
}

export declare class CIAreaBoundsRed extends NativeObject implements CIAreaBoundsRed {
}

export declare interface CIHoleDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;
}

export declare class CIHoleDistortion extends NativeObject implements CIHoleDistortion {
}

export declare interface CIModTransition extends CITransitionFilter {
  center: CGPoint;

  angle: number;

  radius: number;

  compression: number;
}

export declare class CIModTransition extends NativeObject implements CIModTransition {
}

export declare interface CIFilterConstructor {
  filterWithName(name: string): CIFilter;
}

export declare class CIFilterConstructor extends NativeObject implements CIFilterConstructor {
}

export declare interface CIMotionBlur extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;

  angle: number;
}

export declare class CIMotionBlur extends NativeObject implements CIMotionBlur {
}

export declare interface CILenticularHaloGenerator extends CIFilterProtocol {
  center: CGPoint;

  color: CIColor;

  haloRadius: number;

  haloWidth: number;

  haloOverlap: number;

  striationStrength: number;

  striationContrast: number;

  time: number;
}

export declare class CILenticularHaloGenerator extends NativeObject implements CILenticularHaloGenerator {
}

export declare interface CIRadialGradient extends CIFilterProtocol {
  center: CGPoint;

  radius0: number;

  radius1: number;

  color0: CIColor;

  color1: CIColor;
}

export declare class CIRadialGradient extends NativeObject implements CIRadialGradient {
}

export declare interface CICannyEdgeDetector extends CIFilterProtocol {
  inputImage: CIImage;

  gaussianSigma: number;

  perceptual: boolean;

  thresholdHigh: number;

  thresholdLow: number;

  hysteresisPasses: number;
}

export declare class CICannyEdgeDetector extends NativeObject implements CICannyEdgeDetector {
}

export declare interface CIMaximumComponent extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIMaximumComponent extends NativeObject implements CIMaximumComponent {
}

export declare interface CIQRCodeGenerator extends CIFilterProtocol {
  message: NSData;

  correctionLevel: string;
}

export declare class CIQRCodeGenerator extends NativeObject implements CIQRCodeGenerator {
}

export declare interface CIAreaAverageMaximumRed extends CIAreaReductionFilter {
}

export declare class CIAreaAverageMaximumRed extends NativeObject implements CIAreaAverageMaximumRed {
}

export declare interface CIColorMonochrome extends CIFilterProtocol {
  inputImage: CIImage;

  color: CIColor;

  intensity: number;
}

export declare class CIColorMonochrome extends NativeObject implements CIColorMonochrome {
}

export declare interface CIPageCurlWithShadowTransition extends CITransitionFilter {
  backsideImage: CIImage;

  extent: CGRect;

  angle: number;

  radius: number;

  shadowSize: number;

  shadowAmount: number;

  shadowExtent: CGRect;
}

export declare class CIPageCurlWithShadowTransition extends NativeObject implements CIPageCurlWithShadowTransition {
}

export declare interface CIDisparityToDepth extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIDisparityToDepth extends NativeObject implements CIDisparityToDepth {
}

export declare interface CIPalettize extends CIFilterProtocol {
  inputImage: CIImage;

  paletteImage: CIImage;

  perceptual: boolean;
}

export declare class CIPalettize extends NativeObject implements CIPalettize {
}

export declare interface CIMinimumComponent extends CIFilterProtocol {
  inputImage: CIImage;
}

export declare class CIMinimumComponent extends NativeObject implements CIMinimumComponent {
}

export declare interface CIZoomBlur extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  amount: number;
}

export declare class CIZoomBlur extends NativeObject implements CIZoomBlur {
}

export declare interface CIEdgeWork extends CIFilterProtocol {
  inputImage: CIImage;

  radius: number;
}

export declare class CIEdgeWork extends NativeObject implements CIEdgeWork {
}

export declare interface CISharpenLuminance extends CIFilterProtocol {
  inputImage: CIImage;

  sharpness: number;

  radius: number;
}

export declare class CISharpenLuminance extends NativeObject implements CISharpenLuminance {
}

export declare interface CIBarcodeGenerator extends CIFilterProtocol {
  barcodeDescriptor: CIBarcodeDescriptor;
}

export declare class CIBarcodeGenerator extends NativeObject implements CIBarcodeGenerator {
}

export declare interface CITriangleKaleidoscope extends CIFilterProtocol {
  inputImage: CIImage;

  point: CGPoint;

  size: number;

  rotation: number;

  decay: number;
}

export declare class CITriangleKaleidoscope extends NativeObject implements CITriangleKaleidoscope {
}

export declare interface CIFourfoldTranslatedTile extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  angle: number;

  width: number;

  acuteAngle: number;
}

export declare class CIFourfoldTranslatedTile extends NativeObject implements CIFourfoldTranslatedTile {
}

export declare interface CITorusLensDistortion extends CIFilterProtocol {
  inputImage: CIImage;

  center: CGPoint;

  radius: number;

  width: number;

  refraction: number;
}

export declare class CITorusLensDistortion extends NativeObject implements CITorusLensDistortion {
}

export declare interface CIMaskedVariableBlur extends CIFilterProtocol {
  inputImage: CIImage;

  mask: CIImage;

  radius: number;
}

export declare class CIMaskedVariableBlur extends NativeObject implements CIMaskedVariableBlur {
}

export declare class CIColor extends NSObject implements NSSecureCoding, NSCopying {
  static colorWithCGColor<This extends abstract new (...args: any) => any>(this: This, color: interop.Object): InstanceType<This>;

  static colorWithRedGreenBlueAlpha<This extends abstract new (...args: any) => any>(this: This, red: number, green: number, blue: number, alpha: number): InstanceType<This>;

  static colorWithRedGreenBlue<This extends abstract new (...args: any) => any>(this: This, red: number, green: number, blue: number): InstanceType<This>;

  static colorWithRedGreenBlueAlphaColorSpace<This extends abstract new (...args: any) => any>(this: This, red: number, green: number, blue: number, alpha: number, colorSpace: interop.Object): InstanceType<This>;

  static colorWithRedGreenBlueColorSpace<This extends abstract new (...args: any) => any>(this: This, red: number, green: number, blue: number, colorSpace: interop.Object): InstanceType<This>;

  static colorWithString<This extends abstract new (...args: any) => any>(this: This, representation: string): InstanceType<This>;

  initWithCGColor(color: interop.Object): this;

  initWithRedGreenBlueAlpha(red: number, green: number, blue: number, alpha: number): this;

  initWithRedGreenBlue(red: number, green: number, blue: number): this;

  initWithRedGreenBlueAlphaColorSpace(red: number, green: number, blue: number, alpha: number, colorSpace: interop.Object): this;

  initWithRedGreenBlueColorSpace(red: number, green: number, blue: number, colorSpace: interop.Object): this;

  readonly numberOfComponents: number;

  readonly components: interop.Pointer;

  readonly alpha: number;

  readonly colorSpace: interop.Object;

  readonly red: number;

  readonly green: number;

  readonly blue: number;

  readonly stringRepresentation: string;

  static readonly blackColor: CIColor;

  static readonly whiteColor: CIColor;

  static readonly grayColor: CIColor;

  static readonly redColor: CIColor;

  static readonly greenColor: CIColor;

  static readonly blueColor: CIColor;

  static readonly cyanColor: CIColor;

  static readonly magentaColor: CIColor;

  static readonly yellowColor: CIColor;

  static readonly clearColor: CIColor;

  initWithColor(color: NSColor): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIFeature extends NSObject {
  readonly type: string;

  readonly bounds: CGRect;
}

export declare class CIQRCodeFeature extends CIFeature implements NSSecureCoding, NSCopying {
  readonly bounds: CGRect;

  readonly topLeft: CGPoint;

  readonly topRight: CGPoint;

  readonly bottomLeft: CGPoint;

  readonly bottomRight: CGPoint;

  readonly messageString: string;

  readonly symbolDescriptor: CIQRCodeDescriptor;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIKernel extends NSObject {
  static kernelsWithString(string: string): NSArray;

  static kernelWithString<This extends abstract new (...args: any) => any>(this: This, string: string): InstanceType<This>;

  static kernelWithFunctionNameFromMetalLibraryDataError<This extends abstract new (...args: any) => any>(this: This, name: string, data: NSData, error: interop.PointerConvertible): InstanceType<This>;

  static kernelWithFunctionNameFromMetalLibraryDataOutputPixelFormatError<This extends abstract new (...args: any) => any>(this: This, name: string, data: NSData, format: number, error: interop.PointerConvertible): InstanceType<This>;

  static kernelNamesFromMetalLibraryData(data: NSData): NSArray;

  readonly name: string;

  setROISelector(method: string): void;

  applyWithExtentRoiCallbackArguments(extent: CGRect, callback: (p1: number, p2: CGRect) => CGRect, args: NSArray<interop.Object> | Array<interop.Object> | null): CIImage;
}

export declare class CIPDF417CodeDescriptor extends CIBarcodeDescriptor {
  readonly errorCorrectedPayload: NSData;

  readonly isCompact: boolean;

  readonly rowCount: number;

  readonly columnCount: number;

  initWithPayloadIsCompactRowCountColumnCount(errorCorrectedPayload: NSData, isCompact: boolean, rowCount: number, columnCount: number): this;

  static descriptorWithPayloadIsCompactRowCountColumnCount<This extends abstract new (...args: any) => any>(this: This, errorCorrectedPayload: NSData, isCompact: boolean, rowCount: number, columnCount: number): InstanceType<This>;
}

export declare class CIBlendKernel extends CIColorKernel {
  static kernelWithString<This extends abstract new (...args: any) => any>(this: This, string: string): InstanceType<This>;

  applyWithForegroundBackground(foreground: CIImage, background: CIImage): CIImage;

  applyWithForegroundBackgroundColorSpace(foreground: CIImage, background: CIImage, colorSpace: interop.Object): CIImage;

  static readonly componentAdd: CIBlendKernel;

  static readonly componentMultiply: CIBlendKernel;

  static readonly componentMin: CIBlendKernel;

  static readonly componentMax: CIBlendKernel;

  static readonly clear: CIBlendKernel;

  static readonly source: CIBlendKernel;

  static readonly destination: CIBlendKernel;

  static readonly sourceOver: CIBlendKernel;

  static readonly destinationOver: CIBlendKernel;

  static readonly sourceIn: CIBlendKernel;

  static readonly destinationIn: CIBlendKernel;

  static readonly sourceOut: CIBlendKernel;

  static readonly destinationOut: CIBlendKernel;

  static readonly sourceAtop: CIBlendKernel;

  static readonly destinationAtop: CIBlendKernel;

  static readonly exclusiveOr: CIBlendKernel;

  static readonly multiply: CIBlendKernel;

  static readonly screen: CIBlendKernel;

  static readonly overlay: CIBlendKernel;

  static readonly darken: CIBlendKernel;

  static readonly lighten: CIBlendKernel;

  static readonly colorDodge: CIBlendKernel;

  static readonly colorBurn: CIBlendKernel;

  static readonly hardLight: CIBlendKernel;

  static readonly softLight: CIBlendKernel;

  static readonly difference: CIBlendKernel;

  static readonly exclusion: CIBlendKernel;

  static readonly hue: CIBlendKernel;

  static readonly saturation: CIBlendKernel;

  static readonly color: CIBlendKernel;

  static readonly luminosity: CIBlendKernel;

  static readonly subtract: CIBlendKernel;

  static readonly divide: CIBlendKernel;

  static readonly linearBurn: CIBlendKernel;

  static readonly linearDodge: CIBlendKernel;

  static readonly vividLight: CIBlendKernel;

  static readonly linearLight: CIBlendKernel;

  static readonly pinLight: CIBlendKernel;

  static readonly hardMix: CIBlendKernel;

  static readonly darkerColor: CIBlendKernel;

  static readonly lighterColor: CIBlendKernel;
}

export declare class CIAztecCodeDescriptor extends CIBarcodeDescriptor {
  readonly errorCorrectedPayload: NSData;

  readonly isCompact: boolean;

  readonly layerCount: number;

  readonly dataCodewordCount: number;

  initWithPayloadIsCompactLayerCountDataCodewordCount(errorCorrectedPayload: NSData, isCompact: boolean, layerCount: number, dataCodewordCount: number): this;

  static descriptorWithPayloadIsCompactLayerCountDataCodewordCount<This extends abstract new (...args: any) => any>(this: This, errorCorrectedPayload: NSData, isCompact: boolean, layerCount: number, dataCodewordCount: number): InstanceType<This>;
}

export declare class CIPlugIn extends NSObject {
  static loadAllPlugIns(): void;

  static loadNonExecutablePlugIns(): void;

  static loadPlugInAllowNonExecutable(url: NSURL, allowNonExecutable: boolean): void;

  static loadPlugInAllowExecutableCode(url: NSURL, allowExecutableCode: boolean): void;

  static loadNonExecutablePlugIn(url: NSURL): void;
}

export declare class CIDataMatrixCodeDescriptor extends CIBarcodeDescriptor {
  readonly errorCorrectedPayload: NSData;

  readonly rowCount: number;

  readonly columnCount: number;

  readonly eccVersion: interop.Enum<typeof CIDataMatrixCodeECCVersion>;

  initWithPayloadRowCountColumnCountEccVersion(errorCorrectedPayload: NSData, rowCount: number, columnCount: number, eccVersion: interop.Enum<typeof CIDataMatrixCodeECCVersion>): this;

  static descriptorWithPayloadRowCountColumnCountEccVersion<This extends abstract new (...args: any) => any>(this: This, errorCorrectedPayload: NSData, rowCount: number, columnCount: number, eccVersion: interop.Enum<typeof CIDataMatrixCodeECCVersion>): InstanceType<This>;
}

export declare class CIFilterShape extends NSObject implements NSCopying {
  static shapeWithRect<This extends abstract new (...args: any) => any>(this: This, r: CGRect): InstanceType<This>;

  initWithRect(r: CGRect): this;

  transformByInterior(m: CGAffineTransform, flag: boolean): CIFilterShape;

  insetByXY(dx: number, dy: number): CIFilterShape;

  unionWith(s2: CIFilterShape): CIFilterShape;

  unionWithRect(r: CGRect): CIFilterShape;

  intersectWith(s2: CIFilterShape): CIFilterShape;

  intersectWithRect(r: CGRect): CIFilterShape;

  readonly extent: CGRect;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIImageProcessorKernel extends NSObject {
  static processWithInputsArgumentsOutputError(inputs: NSArray<interop.Object> | Array<interop.Object> | null, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, output: CIImageProcessorOutput, error: interop.PointerConvertible): boolean;

  static roiForInputArgumentsOutputRect(inputIndex: number, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outputRect: CGRect): CGRect;

  static formatForInputAtIndex(inputIndex: number): number;

  static readonly outputFormat: number;

  static readonly outputIsOpaque: boolean;

  static readonly synchronizeInputs: boolean;

  static applyWithExtentInputsArgumentsError(extent: CGRect, inputs: NSArray<interop.Object> | Array<interop.Object> | null, arguments$: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, error: interop.PointerConvertible): CIImage;
}

export declare class CITextFeature extends CIFeature {
  readonly bounds: CGRect;

  readonly topLeft: CGPoint;

  readonly topRight: CGPoint;

  readonly bottomLeft: CGPoint;

  readonly bottomRight: CGPoint;

  readonly subFeatures: NSArray;
}

export declare class CIColorKernel extends CIKernel {
  static kernelWithString<This extends abstract new (...args: any) => any>(this: This, string: string): InstanceType<This>;

  applyWithExtentArguments(extent: CGRect, args: NSArray<interop.Object> | Array<interop.Object> | null): CIImage;
}

export declare class CIFilter extends NSObject implements NSSecureCoding, NSCopying {
  readonly outputImage: CIImage;

  name: string;

  enabled: boolean;

  readonly inputKeys: NSArray;

  readonly outputKeys: NSArray;

  setDefaults(): void;

  readonly attributes: NSDictionary;

  applyArgumentsOptions(k: CIKernel, args: NSArray<interop.Object> | Array<interop.Object> | null, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  apply(k: CIKernel): CIImage;

  isEnabled(): boolean;

  static filterWithName(name: string): CIFilter;

  static filterWithNameKeysAndValues(name: string, key0: interop.Object): CIFilter;

  static filterWithNameWithInputParameters(name: string, params: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIFilter;

  static filterNamesInCategory(category: string | null): NSArray;

  static filterNamesInCategories(categories: NSArray<interop.Object> | Array<interop.Object> | null): NSArray;

  static registerFilterNameConstructorClassAttributes(name: string, anObject: CIFilterConstructor, attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  static localizedNameForFilterName(filterName: string): string;

  static localizedNameForCategory(category: string): string;

  static localizedDescriptionForFilterName(filterName: string): string;

  static localizedReferenceDocumentationForFilterName(filterName: string): NSURL;

  static serializedXMPFromFiltersInputImageExtent(filters: NSArray<interop.Object> | Array<interop.Object>, extent: CGRect): NSData;

  static filterArrayFromSerializedXMPInputImageExtentError(xmpData: NSData, extent: CGRect, outError: interop.PointerConvertible): NSArray;

  static filterWithImageURLOptions(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): CIFilter;

  static filterWithImageDataOptions(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): CIFilter;

  static filterWithCVPixelBufferPropertiesOptions(pixelBuffer: interop.Object, properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): CIFilter;

  static supportedRawCameraModels(): NSArray;

  viewForUIConfigurationExcludedKeys(inUIConfiguration: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, inKeys: NSArray<interop.Object> | Array<interop.Object>): IKFilterUIView;

  static gaussianGradientFilter(): CIFilter;

  static hueSaturationValueGradientFilter(): CIFilter;

  static linearGradientFilter(): CIFilter;

  static radialGradientFilter(): CIFilter;

  static smoothLinearGradientFilter(): CIFilter;

  static sharpenLuminanceFilter(): CIFilter;

  static unsharpMaskFilter(): CIFilter;

  static circularScreenFilter(): CIFilter;

  static CMYKHalftone(): CIFilter;

  static dotScreenFilter(): CIFilter;

  static hatchedScreenFilter(): CIFilter;

  static lineScreenFilter(): CIFilter;

  static bicubicScaleTransformFilter(): CIFilter;

  static edgePreserveUpsampleFilter(): CIFilter;

  static keystoneCorrectionCombinedFilter(): CIFilter;

  static keystoneCorrectionHorizontalFilter(): CIFilter;

  static keystoneCorrectionVerticalFilter(): CIFilter;

  static lanczosScaleTransformFilter(): CIFilter;

  static perspectiveCorrectionFilter(): CIFilter;

  static perspectiveRotateFilter(): CIFilter;

  static perspectiveTransformFilter(): CIFilter;

  static perspectiveTransformWithExtentFilter(): CIFilter;

  static straightenFilter(): CIFilter;

  static accordionFoldTransitionFilter(): CIFilter;

  static barsSwipeTransitionFilter(): CIFilter;

  static copyMachineTransitionFilter(): CIFilter;

  static disintegrateWithMaskTransitionFilter(): CIFilter;

  static dissolveTransitionFilter(): CIFilter;

  static flashTransitionFilter(): CIFilter;

  static modTransitionFilter(): CIFilter;

  static pageCurlTransitionFilter(): CIFilter;

  static pageCurlWithShadowTransitionFilter(): CIFilter;

  static rippleTransitionFilter(): CIFilter;

  static swipeTransitionFilter(): CIFilter;

  static additionCompositingFilter(): CIFilter;

  static colorBlendModeFilter(): CIFilter;

  static colorBurnBlendModeFilter(): CIFilter;

  static colorDodgeBlendModeFilter(): CIFilter;

  static darkenBlendModeFilter(): CIFilter;

  static differenceBlendModeFilter(): CIFilter;

  static divideBlendModeFilter(): CIFilter;

  static exclusionBlendModeFilter(): CIFilter;

  static hardLightBlendModeFilter(): CIFilter;

  static hueBlendModeFilter(): CIFilter;

  static lightenBlendModeFilter(): CIFilter;

  static linearBurnBlendModeFilter(): CIFilter;

  static linearDodgeBlendModeFilter(): CIFilter;

  static luminosityBlendModeFilter(): CIFilter;

  static maximumCompositingFilter(): CIFilter;

  static minimumCompositingFilter(): CIFilter;

  static multiplyBlendModeFilter(): CIFilter;

  static multiplyCompositingFilter(): CIFilter;

  static overlayBlendModeFilter(): CIFilter;

  static pinLightBlendModeFilter(): CIFilter;

  static saturationBlendModeFilter(): CIFilter;

  static screenBlendModeFilter(): CIFilter;

  static softLightBlendModeFilter(): CIFilter;

  static sourceAtopCompositingFilter(): CIFilter;

  static sourceInCompositingFilter(): CIFilter;

  static sourceOutCompositingFilter(): CIFilter;

  static sourceOverCompositingFilter(): CIFilter;

  static subtractBlendModeFilter(): CIFilter;

  static colorAbsoluteDifferenceFilter(): CIFilter;

  static colorClampFilter(): CIFilter;

  static colorControlsFilter(): CIFilter;

  static colorMatrixFilter(): CIFilter;

  static colorPolynomialFilter(): CIFilter;

  static colorThresholdFilter(): CIFilter;

  static colorThresholdOtsuFilter(): CIFilter;

  static depthToDisparityFilter(): CIFilter;

  static disparityToDepthFilter(): CIFilter;

  static exposureAdjustFilter(): CIFilter;

  static gammaAdjustFilter(): CIFilter;

  static hueAdjustFilter(): CIFilter;

  static linearToSRGBToneCurveFilter(): CIFilter;

  static sRGBToneCurveToLinearFilter(): CIFilter;

  static temperatureAndTintFilter(): CIFilter;

  static toneCurveFilter(): CIFilter;

  static vibranceFilter(): CIFilter;

  static whitePointAdjustFilter(): CIFilter;

  static colorCrossPolynomialFilter(): CIFilter;

  static colorCubeFilter(): CIFilter;

  static colorCubesMixedWithMaskFilter(): CIFilter;

  static colorCubeWithColorSpaceFilter(): CIFilter;

  static colorCurvesFilter(): CIFilter;

  static colorInvertFilter(): CIFilter;

  static colorMapFilter(): CIFilter;

  static colorMonochromeFilter(): CIFilter;

  static colorPosterizeFilter(): CIFilter;

  static ditherFilter(): CIFilter;

  static documentEnhancerFilter(): CIFilter;

  static falseColorFilter(): CIFilter;

  static LabDeltaE(): CIFilter;

  static maskToAlphaFilter(): CIFilter;

  static maximumComponentFilter(): CIFilter;

  static minimumComponentFilter(): CIFilter;

  static paletteCentroidFilter(): CIFilter;

  static palettizeFilter(): CIFilter;

  static photoEffectChromeFilter(): CIFilter;

  static photoEffectFadeFilter(): CIFilter;

  static photoEffectInstantFilter(): CIFilter;

  static photoEffectMonoFilter(): CIFilter;

  static photoEffectNoirFilter(): CIFilter;

  static photoEffectProcessFilter(): CIFilter;

  static photoEffectTonalFilter(): CIFilter;

  static photoEffectTransferFilter(): CIFilter;

  static sepiaToneFilter(): CIFilter;

  static thermalFilter(): CIFilter;

  static vignetteFilter(): CIFilter;

  static vignetteEffectFilter(): CIFilter;

  static xRayFilter(): CIFilter;

  static bumpDistortionFilter(): CIFilter;

  static bumpDistortionLinearFilter(): CIFilter;

  static circleSplashDistortionFilter(): CIFilter;

  static circularWrapFilter(): CIFilter;

  static displacementDistortionFilter(): CIFilter;

  static drosteFilter(): CIFilter;

  static glassDistortionFilter(): CIFilter;

  static glassLozengeFilter(): CIFilter;

  static holeDistortionFilter(): CIFilter;

  static lightTunnelFilter(): CIFilter;

  static ninePartStretchedFilter(): CIFilter;

  static ninePartTiledFilter(): CIFilter;

  static pinchDistortionFilter(): CIFilter;

  static stretchCropFilter(): CIFilter;

  static torusLensDistortionFilter(): CIFilter;

  static twirlDistortionFilter(): CIFilter;

  static vortexDistortionFilter(): CIFilter;

  static affineClampFilter(): CIFilter;

  static affineTileFilter(): CIFilter;

  static eightfoldReflectedTileFilter(): CIFilter;

  static fourfoldReflectedTileFilter(): CIFilter;

  static fourfoldRotatedTileFilter(): CIFilter;

  static fourfoldTranslatedTileFilter(): CIFilter;

  static glideReflectedTileFilter(): CIFilter;

  static kaleidoscopeFilter(): CIFilter;

  static opTileFilter(): CIFilter;

  static parallelogramTileFilter(): CIFilter;

  static perspectiveTileFilter(): CIFilter;

  static sixfoldReflectedTileFilter(): CIFilter;

  static sixfoldRotatedTileFilter(): CIFilter;

  static triangleKaleidoscopeFilter(): CIFilter;

  static triangleTileFilter(): CIFilter;

  static twelvefoldReflectedTileFilter(): CIFilter;

  static attributedTextImageGeneratorFilter(): CIFilter;

  static aztecCodeGeneratorFilter(): CIFilter;

  static barcodeGeneratorFilter(): CIFilter;

  static checkerboardGeneratorFilter(): CIFilter;

  static code128BarcodeGeneratorFilter(): CIFilter;

  static lenticularHaloGeneratorFilter(): CIFilter;

  static meshGeneratorFilter(): CIFilter;

  static PDF417BarcodeGenerator(): CIFilter;

  static QRCodeGenerator(): CIFilter;

  static randomGeneratorFilter(): CIFilter;

  static roundedRectangleGeneratorFilter(): CIFilter;

  static starShineGeneratorFilter(): CIFilter;

  static stripesGeneratorFilter(): CIFilter;

  static sunbeamsGeneratorFilter(): CIFilter;

  static textImageGeneratorFilter(): CIFilter;

  static blendWithAlphaMaskFilter(): CIFilter;

  static blendWithBlueMaskFilter(): CIFilter;

  static blendWithMaskFilter(): CIFilter;

  static blendWithRedMaskFilter(): CIFilter;

  static bloomFilter(): CIFilter;

  static comicEffectFilter(): CIFilter;

  static convolution3X3Filter(): CIFilter;

  static convolution5X5Filter(): CIFilter;

  static convolution7X7Filter(): CIFilter;

  static convolution9HorizontalFilter(): CIFilter;

  static convolution9VerticalFilter(): CIFilter;

  static coreMLModelFilter(): CIFilter;

  static crystallizeFilter(): CIFilter;

  static depthOfFieldFilter(): CIFilter;

  static edgesFilter(): CIFilter;

  static edgeWorkFilter(): CIFilter;

  static gaborGradientsFilter(): CIFilter;

  static gloomFilter(): CIFilter;

  static heightFieldFromMaskFilter(): CIFilter;

  static hexagonalPixellateFilter(): CIFilter;

  static highlightShadowAdjustFilter(): CIFilter;

  static lineOverlayFilter(): CIFilter;

  static mixFilter(): CIFilter;

  static pixellateFilter(): CIFilter;

  static pointillizeFilter(): CIFilter;

  static saliencyMapFilter(): CIFilter;

  static shadedMaterialFilter(): CIFilter;

  static spotColorFilter(): CIFilter;

  static spotLightFilter(): CIFilter;

  static bokehBlurFilter(): CIFilter;

  static boxBlurFilter(): CIFilter;

  static discBlurFilter(): CIFilter;

  static gaussianBlurFilter(): CIFilter;

  static maskedVariableBlurFilter(): CIFilter;

  static medianFilter(): CIFilter;

  static morphologyGradientFilter(): CIFilter;

  static morphologyMaximumFilter(): CIFilter;

  static morphologyMinimumFilter(): CIFilter;

  static morphologyRectangleMaximumFilter(): CIFilter;

  static morphologyRectangleMinimumFilter(): CIFilter;

  static motionBlurFilter(): CIFilter;

  static noiseReductionFilter(): CIFilter;

  static zoomBlurFilter(): CIFilter;

  static areaAverageFilter(): CIFilter;

  static areaHistogramFilter(): CIFilter;

  static areaMaximumFilter(): CIFilter;

  static areaMaximumAlphaFilter(): CIFilter;

  static areaMinimumFilter(): CIFilter;

  static areaMinimumAlphaFilter(): CIFilter;

  static areaMinMaxFilter(): CIFilter;

  static areaMinMaxRedFilter(): CIFilter;

  static columnAverageFilter(): CIFilter;

  static histogramDisplayFilter(): CIFilter;

  static KMeansFilter(): CIFilter;

  static rowAverageFilter(): CIFilter;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIImageAccumulator extends NSObject {
  static imageAccumulatorWithExtentFormat<This extends abstract new (...args: any) => any>(this: This, extent: CGRect, format: number): InstanceType<This>;

  static imageAccumulatorWithExtentFormatColorSpace<This extends abstract new (...args: any) => any>(this: This, extent: CGRect, format: number, colorSpace: interop.Object): InstanceType<This>;

  initWithExtentFormat(extent: CGRect, format: number): this;

  initWithExtentFormatColorSpace(extent: CGRect, format: number, colorSpace: interop.Object): this;

  readonly extent: CGRect;

  readonly format: number;

  image(): CIImage;

  setImage(image: CIImage): void;

  setImageDirtyRect(image: CIImage, dirtyRect: CGRect): void;

  clear(): void;
}

export declare class CIImage extends NSObject implements NSSecureCoding, NSCopying {
  static imageWithCGImage(image: interop.Object): CIImage;

  static imageWithCGImageOptions(image: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithCGImageSourceIndexOptions(source: interop.Object, index: number, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithCGLayer(layer: interop.Object): CIImage;

  static imageWithCGLayerOptions(layer: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithBitmapDataBytesPerRowSizeFormatColorSpace(data: NSData, bytesPerRow: number, size: CGSize, format: number, colorSpace: interop.Object | null): CIImage;

  static imageWithTextureSizeFlippedColorSpace(name: number, size: CGSize, flipped: boolean, colorSpace: interop.Object | null): CIImage;

  static imageWithTextureSizeFlippedOptions(name: number, size: CGSize, flipped: boolean, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithMTLTextureOptions(texture: MTLTexture, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithContentsOfURL(url: NSURL): CIImage;

  static imageWithContentsOfURLOptions(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithData(data: NSData): CIImage;

  static imageWithDataOptions(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithCVImageBuffer(imageBuffer: interop.Object): CIImage;

  static imageWithCVImageBufferOptions(imageBuffer: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithCVPixelBuffer(pixelBuffer: interop.Object): CIImage;

  static imageWithCVPixelBufferOptions(pixelBuffer: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithIOSurface(surface: interop.Object): CIImage;

  static imageWithIOSurfaceOptions(surface: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  static imageWithColor(color: CIColor): CIImage;

  static emptyImage(): CIImage;

  static readonly blackImage: CIImage;

  static readonly whiteImage: CIImage;

  static readonly grayImage: CIImage;

  static readonly redImage: CIImage;

  static readonly greenImage: CIImage;

  static readonly blueImage: CIImage;

  static readonly cyanImage: CIImage;

  static readonly magentaImage: CIImage;

  static readonly yellowImage: CIImage;

  static readonly clearImage: CIImage;

  initWithCGImage(image: interop.Object): this;

  initWithCGImageOptions(image: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithCGImageSourceIndexOptions(source: interop.Object, index: number, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithCGLayer(layer: interop.Object): this;

  initWithCGLayerOptions(layer: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithData(data: NSData): this;

  initWithDataOptions(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithBitmapDataBytesPerRowSizeFormatColorSpace(data: NSData, bytesPerRow: number, size: CGSize, format: number, colorSpace: interop.Object | null): this;

  initWithTextureSizeFlippedColorSpace(name: number, size: CGSize, flipped: boolean, colorSpace: interop.Object | null): this;

  initWithTextureSizeFlippedOptions(name: number, size: CGSize, flipped: boolean, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithMTLTextureOptions(texture: MTLTexture, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithContentsOfURL(url: NSURL): this;

  initWithContentsOfURLOptions(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithIOSurface(surface: interop.Object): this;

  initWithIOSurfaceOptions(surface: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithIOSurfacePlaneFormatOptions(surface: interop.Object, plane: number, format: number, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithCVImageBuffer(imageBuffer: interop.Object): this;

  initWithCVImageBufferOptions(imageBuffer: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithCVPixelBuffer(pixelBuffer: interop.Object): this;

  initWithCVPixelBufferOptions(pixelBuffer: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithColor(color: CIColor): this;

  imageByApplyingTransform(matrix: CGAffineTransform): CIImage;

  imageByApplyingTransformHighQualityDownsample(matrix: CGAffineTransform, highQualityDownsample: boolean): CIImage;

  imageByApplyingOrientation(orientation: number): CIImage;

  imageTransformForOrientation(orientation: number): CGAffineTransform;

  imageByApplyingCGOrientation(orientation: interop.Enum<typeof CGImagePropertyOrientation>): CIImage;

  imageTransformForCGOrientation(orientation: interop.Enum<typeof CGImagePropertyOrientation>): CGAffineTransform;

  imageByCompositingOverImage(dest: CIImage): CIImage;

  imageByCroppingToRect(rect: CGRect): CIImage;

  imageByClampingToExtent(): CIImage;

  imageByClampingToRect(rect: CGRect): CIImage;

  imageByApplyingFilterWithInputParameters(filterName: string, params: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  imageByApplyingFilter(filterName: string): CIImage;

  imageByColorMatchingColorSpaceToWorkingSpace(colorSpace: interop.Object): CIImage;

  imageByColorMatchingWorkingSpaceToColorSpace(colorSpace: interop.Object): CIImage;

  imageByPremultiplyingAlpha(): CIImage;

  imageByUnpremultiplyingAlpha(): CIImage;

  imageBySettingAlphaOneInExtent(extent: CGRect): CIImage;

  imageByApplyingGaussianBlurWithSigma(sigma: number): CIImage;

  imageBySettingProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): CIImage;

  imageBySamplingLinear(): CIImage;

  imageBySamplingNearest(): CIImage;

  imageByInsertingIntermediate(): CIImage;

  imageByInsertingIntermediate(cache: boolean): CIImage;

  readonly extent: CGRect;

  readonly opaque: boolean;

  readonly properties: NSDictionary;

  readonly definition: CIFilterShape;

  readonly url: NSURL;

  readonly colorSpace: interop.Object;

  readonly pixelBuffer: interop.Object;

  readonly CGImage: interop.Object;

  regionOfInterestForImageInRect(image: CIImage, rect: CGRect): CGRect;

  isOpaque(): boolean;

  autoAdjustmentFilters(): NSArray;

  autoAdjustmentFiltersWithOptions(options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): NSArray;

  readonly depthData: AVDepthData;

  initWithDepthDataOptions(data: AVDepthData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithDepthData(data: AVDepthData): this;

  static imageWithDepthDataOptions<This extends abstract new (...args: any) => any>(this: This, data: AVDepthData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  static imageWithDepthData<This extends abstract new (...args: any) => any>(this: This, data: AVDepthData): InstanceType<This>;

  readonly portraitEffectsMatte: AVPortraitEffectsMatte;

  initWithPortaitEffectsMatteOptions(matte: AVPortraitEffectsMatte, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithPortaitEffectsMatte(matte: AVPortraitEffectsMatte): this;

  static imageWithPortaitEffectsMatteOptions<This extends abstract new (...args: any) => any>(this: This, matte: AVPortraitEffectsMatte, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  static imageWithPortaitEffectsMatte<This extends abstract new (...args: any) => any>(this: This, matte: AVPortraitEffectsMatte): InstanceType<This>;

  readonly semanticSegmentationMatte: AVSemanticSegmentationMatte;

  initWithSemanticSegmentationMatteOptions(matte: AVSemanticSegmentationMatte, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  initWithSemanticSegmentationMatte(matte: AVSemanticSegmentationMatte): this;

  static imageWithSemanticSegmentationMatteOptions<This extends abstract new (...args: any) => any>(this: This, matte: AVSemanticSegmentationMatte, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  static imageWithSemanticSegmentationMatte<This extends abstract new (...args: any) => any>(this: This, matte: AVSemanticSegmentationMatte): InstanceType<This>;

  initWithBitmapImageRep(bitmapImageRep: NSBitmapImageRep): this;

  drawInRectFromRectOperationFraction(rect: CGRect, fromRect: CGRect, op: interop.Enum<typeof NSCompositingOperation>, delta: number): void;

  drawAtPointFromRectOperationFraction(point: CGPoint, fromRect: CGRect, op: interop.Enum<typeof NSCompositingOperation>, delta: number): void;

  static imageWithImageProviderSizeFormatColorSpaceOptions(provider: interop.Object, width: number, height: number, format: number, colorSpace: interop.Object | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIImage;

  initWithImageProviderSizeFormatColorSpaceOptions(provider: interop.Object, width: number, height: number, format: number, colorSpace: interop.Object | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIQRCodeDescriptor extends CIBarcodeDescriptor {
  readonly errorCorrectedPayload: NSData;

  readonly symbolVersion: number;

  readonly maskPattern: number;

  readonly errorCorrectionLevel: interop.Enum<typeof CIQRCodeErrorCorrectionLevel>;

  initWithPayloadSymbolVersionMaskPatternErrorCorrectionLevel(errorCorrectedPayload: NSData, symbolVersion: number, maskPattern: number, errorCorrectionLevel: interop.Enum<typeof CIQRCodeErrorCorrectionLevel>): this;

  static descriptorWithPayloadSymbolVersionMaskPatternErrorCorrectionLevel<This extends abstract new (...args: any) => any>(this: This, errorCorrectedPayload: NSData, symbolVersion: number, maskPattern: number, errorCorrectionLevel: interop.Enum<typeof CIQRCodeErrorCorrectionLevel>): InstanceType<This>;
}

export declare class CIRenderTask extends NSObject {
  waitUntilCompletedAndReturnError(error: interop.PointerConvertible): CIRenderInfo;
}

export declare class CIVector extends NSObject implements NSCopying, NSSecureCoding {
  static vectorWithValuesCount<This extends abstract new (...args: any) => any>(this: This, values: interop.PointerConvertible, count: number): InstanceType<This>;

  static vectorWithX<This extends abstract new (...args: any) => any>(this: This, x: number): InstanceType<This>;

  static vectorWithXY<This extends abstract new (...args: any) => any>(this: This, x: number, y: number): InstanceType<This>;

  static vectorWithXYZ<This extends abstract new (...args: any) => any>(this: This, x: number, y: number, z: number): InstanceType<This>;

  static vectorWithXYZW<This extends abstract new (...args: any) => any>(this: This, x: number, y: number, z: number, w: number): InstanceType<This>;

  static vectorWithCGPoint<This extends abstract new (...args: any) => any>(this: This, p: CGPoint): InstanceType<This>;

  static vectorWithCGRect<This extends abstract new (...args: any) => any>(this: This, r: CGRect): InstanceType<This>;

  static vectorWithCGAffineTransform<This extends abstract new (...args: any) => any>(this: This, t: CGAffineTransform): InstanceType<This>;

  static vectorWithString<This extends abstract new (...args: any) => any>(this: This, representation: string): InstanceType<This>;

  initWithValuesCount(values: interop.PointerConvertible, count: number): this;

  initWithX(x: number): this;

  initWithXY(x: number, y: number): this;

  initWithXYZ(x: number, y: number, z: number): this;

  initWithXYZW(x: number, y: number, z: number, w: number): this;

  initWithCGPoint(p: CGPoint): this;

  initWithCGRect(r: CGRect): this;

  initWithCGAffineTransform(t: CGAffineTransform): this;

  initWithString(representation: string): this;

  valueAtIndex(index: number): number;

  readonly count: number;

  readonly X: number;

  readonly Y: number;

  readonly Z: number;

  readonly W: number;

  readonly CGPointValue: CGPoint;

  readonly CGRectValue: CGRect;

  readonly CGAffineTransformValue: CGAffineTransform;

  readonly stringRepresentation: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class CIFilterGenerator extends NSObject implements NSSecureCoding, NSCopying, CIFilterConstructor {
  static filterGenerator(): CIFilterGenerator;

  static filterGeneratorWithContentsOfURL(aURL: NSURL): CIFilterGenerator;

  initWithContentsOfURL(aURL: NSURL): this;

  connectObjectWithKeyToObjectWithKey(sourceObject: interop.Object, sourceKey: string | null, targetObject: interop.Object, targetKey: string): void;

  disconnectObjectWithKeyToObjectWithKey(sourceObject: interop.Object, sourceKey: string, targetObject: interop.Object, targetKey: string): void;

  exportKeyFromObjectWithName(key: string, targetObject: interop.Object, exportedKeyName: string | null): void;

  removeExportedKey(exportedKeyName: string): void;

  readonly exportedKeys: NSDictionary;

  setAttributesForExportedKey(attributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, key: string): void;

  get classAttributes(): NSDictionary;
  set classAttributes(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  filter(): CIFilter;

  registerFilterName(name: string): void;

  writeToURLAtomically(aURL: NSURL, flag: boolean): boolean;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  filterWithName(name: string): CIFilter;
}

export declare class CIFaceFeature extends CIFeature {
  readonly bounds: CGRect;

  readonly hasLeftEyePosition: boolean;

  readonly leftEyePosition: CGPoint;

  readonly hasRightEyePosition: boolean;

  readonly rightEyePosition: CGPoint;

  readonly hasMouthPosition: boolean;

  readonly mouthPosition: CGPoint;

  readonly hasTrackingID: boolean;

  readonly trackingID: number;

  readonly hasTrackingFrameCount: boolean;

  readonly trackingFrameCount: number;

  readonly hasFaceAngle: boolean;

  readonly faceAngle: number;

  readonly hasSmile: boolean;

  readonly leftEyeClosed: boolean;

  readonly rightEyeClosed: boolean;
}

export declare class CIDetector extends NSObject {
  static detectorOfTypeContextOptions(type: string, context: CIContext | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIDetector;

  featuresInImage(image: CIImage): NSArray;

  featuresInImageOptions(image: CIImage, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): NSArray;
}

export declare class CIContext extends NSObject {
  static contextWithCGLContextPixelFormatColorSpaceOptions(cglctx: interop.PointerConvertible, pixelFormat: interop.PointerConvertible, colorSpace: interop.Object | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIContext;

  static contextWithCGLContextPixelFormatOptions(cglctx: interop.PointerConvertible, pixelFormat: interop.PointerConvertible, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIContext;

  static contextWithCGContextOptions(cgctx: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIContext;

  static contextWithOptions(options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIContext;

  static context(): CIContext;

  initWithOptions(options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  init(): this;

  static contextWithMTLDevice(device: MTLDevice): CIContext;

  static contextWithMTLDeviceOptions(device: MTLDevice, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIContext;

  static contextWithMTLCommandQueue(commandQueue: MTLCommandQueue): CIContext;

  static contextWithMTLCommandQueueOptions(commandQueue: MTLCommandQueue, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIContext;

  readonly workingColorSpace: interop.Object;

  readonly workingFormat: number;

  drawImageAtPointFromRect(image: CIImage, atPoint: CGPoint, fromRect: CGRect): void;

  drawImageInRectFromRect(image: CIImage, inRect: CGRect, fromRect: CGRect): void;

  createCGLayerWithSizeInfo(size: CGSize, info: interop.Object | null): interop.Object;

  renderToBitmapRowBytesBoundsFormatColorSpace(image: CIImage, data: interop.PointerConvertible, rowBytes: number, bounds: CGRect, format: number, colorSpace: interop.Object | null): void;

  renderToIOSurfaceBoundsColorSpace(image: CIImage, surface: interop.Object, bounds: CGRect, colorSpace: interop.Object | null): void;

  renderToCVPixelBuffer(image: CIImage, buffer: interop.Object): void;

  renderToCVPixelBufferBoundsColorSpace(image: CIImage, buffer: interop.Object, bounds: CGRect, colorSpace: interop.Object | null): void;

  renderToMTLTextureCommandBufferBoundsColorSpace(image: CIImage, texture: MTLTexture, commandBuffer: MTLCommandBuffer | null, bounds: CGRect, colorSpace: interop.Object): void;

  reclaimResources(): void;

  clearCaches(): void;

  createCGImageFromRect(image: CIImage, fromRect: CGRect): interop.Object;

  createCGImageFromRectFormatColorSpace(image: CIImage, fromRect: CGRect, format: number, colorSpace: interop.Object | null): interop.Object;

  createCGImageFromRectFormatColorSpaceDeferred(image: CIImage, fromRect: CGRect, format: number, colorSpace: interop.Object | null, deferred: boolean): interop.Object;

  static offlineGPUCount(): number;

  static contextForOfflineGPUAtIndex(index: number): CIContext;

  static contextForOfflineGPUAtIndexColorSpaceOptionsSharedContext(index: number, colorSpace: interop.Object | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, sharedContext: interop.PointerConvertible): CIContext;

  TIFFRepresentationOfImageFormatColorSpaceOptions(image: CIImage, format: number, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSData;

  JPEGRepresentationOfImageColorSpaceOptions(image: CIImage, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSData;

  HEIFRepresentationOfImageFormatColorSpaceOptions(image: CIImage, format: number, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSData;

  PNGRepresentationOfImageFormatColorSpaceOptions(image: CIImage, format: number, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): NSData;

  writeTIFFRepresentationOfImageToURLFormatColorSpaceOptionsError(image: CIImage, url: NSURL, format: number, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, errorPtr: interop.PointerConvertible): boolean;

  writePNGRepresentationOfImageToURLFormatColorSpaceOptionsError(image: CIImage, url: NSURL, format: number, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, errorPtr: interop.PointerConvertible): boolean;

  writeJPEGRepresentationOfImageToURLColorSpaceOptionsError(image: CIImage, url: NSURL, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, errorPtr: interop.PointerConvertible): boolean;

  writeHEIFRepresentationOfImageToURLFormatColorSpaceOptionsError(image: CIImage, url: NSURL, format: number, colorSpace: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, errorPtr: interop.PointerConvertible): boolean;

  depthBlurEffectFilterForImageURLOptions(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIFilter;

  depthBlurEffectFilterForImageDataOptions(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIFilter;

  depthBlurEffectFilterForImageDisparityImagePortraitEffectsMatteOrientationOptions(image: CIImage, disparityImage: CIImage, portraitEffectsMatte: CIImage | null, orientation: interop.Enum<typeof CGImagePropertyOrientation>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIFilter;

  depthBlurEffectFilterForImageDisparityImagePortraitEffectsMatteHairSemanticSegmentationOrientationOptions(image: CIImage, disparityImage: CIImage, portraitEffectsMatte: CIImage | null, hairSemanticSegmentation: CIImage | null, orientation: interop.Enum<typeof CGImagePropertyOrientation>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIFilter;

  depthBlurEffectFilterForImageDisparityImagePortraitEffectsMatteHairSemanticSegmentationGlassesMatteGainMapOrientationOptions(image: CIImage, disparityImage: CIImage, portraitEffectsMatte: CIImage | null, hairSemanticSegmentation: CIImage | null, glassesMatte: CIImage | null, gainMap: CIImage | null, orientation: interop.Enum<typeof CGImagePropertyOrientation>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): CIFilter;

  startTaskToRenderFromRectToDestinationAtPointError(image: CIImage, fromRect: CGRect, destination: CIRenderDestination, atPoint: CGPoint, error: interop.PointerConvertible): CIRenderTask;

  startTaskToRenderToDestinationError(image: CIImage, destination: CIRenderDestination, error: interop.PointerConvertible): CIRenderTask;

  prepareRenderFromRectToDestinationAtPointError(image: CIImage, fromRect: CGRect, destination: CIRenderDestination, atPoint: CGPoint, error: interop.PointerConvertible): boolean;

  startTaskToClearError(destination: CIRenderDestination, error: interop.PointerConvertible): CIRenderTask;
}

export declare class CISampler extends NSObject implements NSCopying {
  static samplerWithImage<This extends abstract new (...args: any) => any>(this: This, im: CIImage): InstanceType<This>;

  static samplerWithImageKeysAndValues<This extends abstract new (...args: any) => any>(this: This, im: CIImage, key0: interop.Object): InstanceType<This>;

  static samplerWithImageOptions<This extends abstract new (...args: any) => any>(this: This, im: CIImage, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): InstanceType<This>;

  initWithImage(im: CIImage): this;

  initWithImageKeysAndValues(im: CIImage, key0: interop.Object): this;

  initWithImageOptions(im: CIImage, dict: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly definition: CIFilterShape;

  readonly extent: CGRect;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIWarpKernel extends CIKernel {
  static kernelWithString<This extends abstract new (...args: any) => any>(this: This, string: string): InstanceType<This>;

  applyWithExtentRoiCallbackInputImageArguments(extent: CGRect, callback: (p1: number, p2: CGRect) => CGRect, image: CIImage, args: NSArray<interop.Object> | Array<interop.Object> | null): CIImage;
}

export declare class CIRenderInfo extends NSObject {
  readonly kernelExecutionTime: number;

  readonly passCount: number;

  readonly pixelsProcessed: number;
}

export declare class CIBarcodeDescriptor extends NSObject implements NSSecureCoding, NSCopying {
  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class CIRenderDestination extends NSObject {
  initWithPixelBuffer(pixelBuffer: interop.Object): this;

  initWithIOSurface(surface: IOSurface): this;

  initWithMTLTextureCommandBuffer(texture: MTLTexture, commandBuffer: MTLCommandBuffer | null): this;

  initWithWidthHeightPixelFormatCommandBufferMtlTextureProvider(width: number, height: number, pixelFormat: interop.Enum<typeof MTLPixelFormat>, commandBuffer: MTLCommandBuffer | null, block: () => MTLTexture | null): this;

  initWithGLTextureTargetWidthHeight(texture: number, target: number, width: number, height: number): this;

  initWithBitmapDataWidthHeightBytesPerRowFormat(data: interop.PointerConvertible, width: number, height: number, bytesPerRow: number, format: number): this;

  readonly width: number;

  readonly height: number;

  alphaMode: interop.Enum<typeof CIRenderDestinationAlphaMode>;

  flipped: boolean;

  dithered: boolean;

  clamped: boolean;

  colorSpace: interop.Object;

  blendKernel: CIBlendKernel;

  blendsInDestinationColorSpace: boolean;

  isFlipped(): boolean;

  isDithered(): boolean;

  isClamped(): boolean;
}

export declare class CIRectangleFeature extends CIFeature {
  readonly bounds: CGRect;

  readonly topLeft: CGPoint;

  readonly topRight: CGPoint;

  readonly bottomLeft: CGPoint;

  readonly bottomRight: CGPoint;
}
