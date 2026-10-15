import type { NSOpenGLContext } from './AppKit'

import type { NSArray, NSBundle, NSCopying, NSData, NSDictionary, NSError, NSURL } from './Foundation'

import type { MDLAsset, MDLMesh, MDLMeshBuffer, MDLMeshBufferAllocator, MDLMeshBufferMap, MDLMeshBufferZone, MDLVertexDescriptor } from './ModelIO'

import type { interop } from './objc-runtime'

import { MDLMeshBufferType, MDLVertexFormat } from './ModelIO'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const GLKTextureLoaderGLErrorKey: string;

export declare const GLKTextureLoaderErrorKey: string;

export declare const GLKTextureLoaderSRGB: string;

export declare const kGLKModelErrorDomain: string;

export declare const kGLKModelErrorKey: string;

export declare const GLKTextureLoaderGenerateMipmaps: string;

export declare const GLKMatrix3Identity: _GLKMatrix3;

export declare const GLKQuaternionIdentity: _GLKQuaternion;

export declare const GLKTextureLoaderApplyPremultiplication: string;

export declare const GLKMatrix4Identity: _GLKMatrix4;

export declare const GLKTextureLoaderOriginBottomLeft: string;

export declare const GLKTextureLoaderGrayscaleAsAlpha: string;

export declare const GLKTextureLoaderErrorDomain: string;

export declare const GLKTextureLoaderError: {
  FileOrURLNotFound: 0,
  InvalidNSData: 1,
  InvalidCGImage: 2,
  UnknownPathType: 3,
  UnknownFileType: 4,
  PVRAtlasUnsupported: 5,
  CubeMapInvalidNumFiles: 6,
  CompressedTextureUpload: 7,
  UncompressedTextureUpload: 8,
  UnsupportedCubeMapDimensions: 9,
  UnsupportedBitDepth: 10,
  UnsupportedPVRFormat: 11,
  DataPreprocessingFailure: 12,
  MipmapUnsupported: 13,
  UnsupportedOrientation: 14,
  ReorientationFailure: 15,
  AlphaPremultiplicationFailure: 16,
  InvalidEAGLContext: 17,
  IncompatibleFormatSRGB: 18,
  UnsupportedTextureTarget: 19,
};

export declare const GLKFogMode: {
  Exp: 0,
  Exp2: 1,
  Linear: 2,
};

export declare const GLKTextureTarget: {
  Target2D: 3553,
  TargetCubeMap: 34067,
  TargetCt: 2,
};

export declare const GLKLightingType: {
  Vertex: 0,
  Pixel: 1,
};

export declare const GLKTextureEnvMode: {
  Replace: 0,
  Modulate: 1,
  Decal: 2,
};

export declare const GLKTextureInfoOrigin: {
  Unknown: 0,
  TopLeft: 1,
  BottomLeft: 2,
};

export declare const GLKVertexAttrib: {
  Position: 0,
  Normal: 1,
  Color: 2,
  TexCoord0: 3,
  TexCoord1: 4,
};

export declare const GLKTextureInfoAlphaState: {
  None: 0,
  NonPremultiplied: 1,
  Premultiplied: 2,
};

export declare class unnamed_13756198831570181614 {
  constructor(init?: unnamed_13756198831570181614);
  r: number;
  g: number;
  b: number;
}

export declare class _GLKMatrixStack {
  constructor(init?: _GLKMatrixStack);
}

export declare class unnamed_12075498946785748348 {
  constructor(init?: unnamed_12075498946785748348);
  x: number;
  y: number;
  z: number;
  w: number;
}

export declare class unnamed_414461565765460624 {
  constructor(init?: unnamed_414461565765460624);
  s: number;
  t: number;
  p: number;
}

export declare class unnamed_12990542358717777996 {
  constructor(init?: unnamed_12990542358717777996);
  x: number;
  y: number;
  z: number;
}

export declare class unnamed_17308238690117157823 {
  constructor(init?: unnamed_17308238690117157823);
  m00: number;
  m01: number;
  m10: number;
  m11: number;
}

export declare class unnamed_4456683272268209216 {
  constructor(init?: unnamed_4456683272268209216);
  s: number;
  t: number;
  p: number;
  q: number;
}

export declare class unnamed_1987043888548983542 {
  constructor(init?: unnamed_1987043888548983542);
  s: number;
  t: number;
}

export declare class unnamed_18333676802552446883 {
  constructor(init?: unnamed_18333676802552446883);
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
  m20: number;
  m21: number;
  m22: number;
}

export declare class GLKEffectPropertyPrv {
  constructor(init?: GLKEffectPropertyPrv);
}

export declare class unnamed_13099729933246841413 {
  constructor(init?: unnamed_13099729933246841413);
  x: number;
  y: number;
  z: number;
  w: number;
}

export declare class unnamed_8245068498102271316 {
  constructor(init?: unnamed_8245068498102271316);
  m00: number;
  m01: number;
  m02: number;
  m03: number;
  m10: number;
  m11: number;
  m12: number;
  m13: number;
  m20: number;
  m21: number;
  m22: number;
  m23: number;
  m30: number;
  m31: number;
  m32: number;
  m33: number;
}

export declare class unnamed_8556002418549998439 {
  constructor(init?: unnamed_8556002418549998439);
  r: number;
  g: number;
  b: number;
  a: number;
}

export declare class _GLKVertexAttributeParameters {
  constructor(init?: _GLKVertexAttributeParameters);
  type: number;
  size: number;
  normalized: number;
}

export declare class unnamed_10920541310666348545 {
  constructor(init?: unnamed_10920541310666348545);
  v: _GLKVector3;
  s: number;
}

export declare class unnamed_3431967864741148974 {
  constructor(init?: unnamed_3431967864741148974);
  x: number;
  y: number;
}

export type _GLKMatrix2Descriptor = 
  | { m2: unknown /* const array */ }
  | { m: unknown /* const array */ };

export declare class _GLKMatrix2 {
  constructor(init?: _GLKMatrix2Descriptor);
  m2: unknown /* const array */;
  m: unknown /* const array */;
}

export type _GLKQuaternionDescriptor = 
  | { q: unknown /* const array */ };

export declare class _GLKQuaternion {
  constructor(init?: _GLKQuaternionDescriptor);
  q: unknown /* const array */;
}

export type _GLKVector3Descriptor = 
  | { v: unknown /* const array */ };

export declare class _GLKVector3 {
  constructor(init?: _GLKVector3Descriptor);
  v: unknown /* const array */;
}

export type _GLKMatrix3Descriptor = 
  | { m: unknown /* const array */ };

export declare class _GLKMatrix3 {
  constructor(init?: _GLKMatrix3Descriptor);
  m: unknown /* const array */;
}

export type _GLKVector4Descriptor = 
  | { v: unknown /* const array */ };

export declare class _GLKVector4 {
  constructor(init?: _GLKVector4Descriptor);
  v: unknown /* const array */;
}

export type _GLKVector2Descriptor = 
  | { v: unknown /* const array */ };

export declare class _GLKVector2 {
  constructor(init?: _GLKVector2Descriptor);
  v: unknown /* const array */;
}

export type _GLKMatrix4Descriptor = 
  | { m: unknown /* const array */ };

export declare class _GLKMatrix4 {
  constructor(init?: _GLKMatrix4Descriptor);
  m: unknown /* const array */;
}

export declare function GLKQuaternionMakeWithMatrix3(matrix: _GLKMatrix3): _GLKQuaternion;

export declare function GLKQuaternionMakeWithMatrix4(matrix: _GLKMatrix4): _GLKQuaternion;

export declare function GLKQuaternionAngle(quaternion: _GLKQuaternion): number;

export declare function GLKQuaternionAxis(quaternion: _GLKQuaternion): _GLKVector3;

export declare function GLKQuaternionSlerp(quaternionStart: _GLKQuaternion, quaternionEnd: _GLKQuaternion, t: number): _GLKQuaternion;

export declare function GLKQuaternionRotateVector3Array(quaternion: _GLKQuaternion, vectors: interop.PointerConvertible, vectorCount: number): void;

export declare function GLKQuaternionRotateVector4Array(quaternion: _GLKQuaternion, vectors: interop.PointerConvertible, vectorCount: number): void;

export declare function GLKMatrix3Invert(matrix: _GLKMatrix3, isInvertible: interop.PointerConvertible): _GLKMatrix3;

export declare function GLKMatrix3InvertAndTranspose(matrix: _GLKMatrix3, isInvertible: interop.PointerConvertible): _GLKMatrix3;

export declare function GLKMatrix4Invert(matrix: _GLKMatrix4, isInvertible: interop.PointerConvertible): _GLKMatrix4;

export declare function GLKMatrix4InvertAndTranspose(matrix: _GLKMatrix4, isInvertible: interop.PointerConvertible): _GLKMatrix4;

export declare function GLKMatrixStackCreate(alloc: interop.Object): interop.Object;

export declare function GLKMatrixStackGetTypeID(): number;

export declare function GLKMatrixStackPush(stack: interop.Object): void;

export declare function GLKMatrixStackPop(stack: interop.Object): void;

export declare function GLKMatrixStackSize(stack: interop.Object): number;

export declare function GLKMatrixStackLoadMatrix4(stack: interop.Object, matrix: _GLKMatrix4): void;

export declare function GLKMatrixStackGetMatrix4(stack: interop.Object): _GLKMatrix4;

export declare function GLKMatrixStackGetMatrix3(stack: interop.Object): _GLKMatrix3;

export declare function GLKMatrixStackGetMatrix2(stack: interop.Object): _GLKMatrix2;

export declare function GLKMatrixStackGetMatrix4Inverse(stack: interop.Object): _GLKMatrix4;

export declare function GLKMatrixStackGetMatrix4InverseTranspose(stack: interop.Object): _GLKMatrix4;

export declare function GLKMatrixStackGetMatrix3Inverse(stack: interop.Object): _GLKMatrix3;

export declare function GLKMatrixStackGetMatrix3InverseTranspose(stack: interop.Object): _GLKMatrix3;

export declare function GLKMatrixStackMultiplyMatrix4(stack: interop.Object, matrix: _GLKMatrix4): void;

export declare function GLKMatrixStackMultiplyMatrixStack(stackLeft: interop.Object, stackRight: interop.Object): void;

export declare function GLKMatrixStackTranslate(stack: interop.Object, tx: number, ty: number, tz: number): void;

export declare function GLKMatrixStackTranslateWithVector3(stack: interop.Object, translationVector: _GLKVector3): void;

export declare function GLKMatrixStackTranslateWithVector4(stack: interop.Object, translationVector: _GLKVector4): void;

export declare function GLKMatrixStackScale(stack: interop.Object, sx: number, sy: number, sz: number): void;

export declare function GLKMatrixStackScaleWithVector3(stack: interop.Object, scaleVector: _GLKVector3): void;

export declare function GLKMatrixStackScaleWithVector4(stack: interop.Object, scaleVector: _GLKVector4): void;

export declare function GLKMatrixStackRotate(stack: interop.Object, radians: number, x: number, y: number, z: number): void;

export declare function GLKMatrixStackRotateWithVector3(stack: interop.Object, radians: number, axisVector: _GLKVector3): void;

export declare function GLKMatrixStackRotateWithVector4(stack: interop.Object, radians: number, axisVector: _GLKVector4): void;

export declare function GLKMatrixStackRotateX(stack: interop.Object, radians: number): void;

export declare function GLKMatrixStackRotateY(stack: interop.Object, radians: number): void;

export declare function GLKMatrixStackRotateZ(stack: interop.Object, radians: number): void;

export declare function GLKMathProject(object: _GLKVector3, model: _GLKMatrix4, projection: _GLKMatrix4, viewport: interop.PointerConvertible): _GLKVector3;

export declare function GLKMathUnproject(window: _GLKVector3, model: _GLKMatrix4, projection: _GLKMatrix4, viewport: interop.PointerConvertible, success: interop.PointerConvertible): _GLKVector3;

export declare function NSStringFromGLKMatrix2(matrix: _GLKMatrix2): string;

export declare function NSStringFromGLKMatrix3(matrix: _GLKMatrix3): string;

export declare function NSStringFromGLKMatrix4(matrix: _GLKMatrix4): string;

export declare function NSStringFromGLKVector2(vector: _GLKVector2): string;

export declare function NSStringFromGLKVector3(vector: _GLKVector3): string;

export declare function NSStringFromGLKVector4(vector: _GLKVector4): string;

export declare function NSStringFromGLKQuaternion(quaternion: _GLKQuaternion): string;

export declare function GLKVertexAttributeParametersFromModelIO(vertexFormat: interop.Enum<typeof MDLVertexFormat>): _GLKVertexAttributeParameters;

export declare interface GLKNamedEffect {
  prepareToDraw(): void;
}

export declare class GLKNamedEffect extends NativeObject implements GLKNamedEffect {
}

export declare class GLKTextureLoader extends NSObject {
  static textureWithContentsOfFileOptionsError(path: string, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static textureWithContentsOfURLOptionsError(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static textureWithNameScaleFactorBundleOptionsError(name: string, scaleFactor: number, bundle: NSBundle | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static textureWithContentsOfDataOptionsError(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static textureWithCGImageOptionsError(cgImage: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static cubeMapWithContentsOfFilesOptionsError(paths: NSArray<interop.Object> | Array<interop.Object>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static cubeMapWithContentsOfFileOptionsError(path: string, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  static cubeMapWithContentsOfURLOptionsError(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, outError: interop.PointerConvertible): GLKTextureInfo;

  initWithShareContext(context: NSOpenGLContext): this;

  textureWithContentsOfFileOptionsQueueCompletionHandler(path: string, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  textureWithContentsOfURLOptionsQueueCompletionHandler(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  textureWithNameScaleFactorBundleOptionsQueueCompletionHandler(name: string, scaleFactor: number, bundle: NSBundle | null, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  textureWithContentsOfDataOptionsQueueCompletionHandler(data: NSData, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  textureWithCGImageOptionsQueueCompletionHandler(cgImage: interop.Object, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  cubeMapWithContentsOfFilesOptionsQueueCompletionHandler(paths: NSArray<interop.Object> | Array<interop.Object>, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  cubeMapWithContentsOfFileOptionsQueueCompletionHandler(path: string, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;

  cubeMapWithContentsOfURLOptionsQueueCompletionHandler(url: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, queue: NSObject | null, block: (p1: GLKTextureInfo, p2: NSError) => void): void;
}

export declare class GLKTextureInfo extends NSObject implements NSCopying {
  readonly name: number;

  readonly target: number;

  readonly width: number;

  readonly height: number;

  readonly depth: number;

  readonly alphaState: interop.Enum<typeof GLKTextureInfoAlphaState>;

  readonly textureOrigin: interop.Enum<typeof GLKTextureInfoOrigin>;

  readonly containsMipmaps: boolean;

  readonly mimapLevelCount: number;

  readonly arrayLength: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class GLKEffectPropertyLight extends GLKEffectProperty {
  enabled: number;

  position: _GLKVector4;

  ambientColor: _GLKVector4;

  diffuseColor: _GLKVector4;

  specularColor: _GLKVector4;

  spotDirection: _GLKVector3;

  spotExponent: number;

  spotCutoff: number;

  constantAttenuation: number;

  linearAttenuation: number;

  quadraticAttenuation: number;

  transform: GLKEffectPropertyTransform;
}

export declare class GLKMeshBuffer extends NSObject implements MDLMeshBuffer {
  readonly length: number;

  readonly allocator: GLKMeshBufferAllocator;

  readonly glBufferName: number;

  readonly offset: number;

  // @ts-ignore MemberDecl.tsIgnore
  readonly zone: MDLMeshBufferZone;

  readonly type: interop.Enum<typeof MDLMeshBufferType>;

  fillDataOffset(data: NSData, offset: number): void;

  map(): MDLMeshBufferMap;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly description: string;

  readonly debugDescription: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class GLKReflectionMapEffect extends GLKBaseEffect implements GLKNamedEffect {
  prepareToDraw(): void;

  readonly textureCubeMap: GLKEffectPropertyTexture;

  matrix: _GLKMatrix3;
}

export declare class GLKEffectPropertyTexture extends GLKEffectProperty {
  enabled: number;

  name: number;

  target: interop.Enum<typeof GLKTextureTarget>;

  envMode: interop.Enum<typeof GLKTextureEnvMode>;
}

export declare class GLKMeshBufferAllocator extends NSObject implements MDLMeshBufferAllocator {
  newZone(capacity: number): MDLMeshBufferZone;

  newZoneForBuffersWithSizeAndType(sizes: NSArray<interop.Object> | Array<interop.Object>, types: NSArray<interop.Object> | Array<interop.Object>): MDLMeshBufferZone;

  newBufferType(length: number, type: interop.Enum<typeof MDLMeshBufferType>): MDLMeshBuffer;

  newBufferWithDataType(data: NSData, type: interop.Enum<typeof MDLMeshBufferType>): MDLMeshBuffer;

  newBufferFromZoneLengthType(zone: MDLMeshBufferZone | null, length: number, type: interop.Enum<typeof MDLMeshBufferType>): MDLMeshBuffer;

  newBufferFromZoneDataType(zone: MDLMeshBufferZone | null, data: NSData, type: interop.Enum<typeof MDLMeshBufferType>): MDLMeshBuffer;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

export declare class GLKEffectPropertyMaterial extends GLKEffectProperty {
  ambientColor: _GLKVector4;

  diffuseColor: _GLKVector4;

  specularColor: _GLKVector4;

  emissiveColor: _GLKVector4;

  shininess: number;
}

export declare class GLKSkyboxEffect extends NSObject implements GLKNamedEffect {
  prepareToDraw(): void;

  draw(): void;

  center: _GLKVector3;

  xSize: number;

  ySize: number;

  zSize: number;

  readonly textureCubeMap: GLKEffectPropertyTexture;

  readonly transform: GLKEffectPropertyTransform;

  label: string;
}

export declare class GLKMesh extends NSObject {
  initWithMeshError(mesh: MDLMesh, error: interop.PointerConvertible): this;

  static newMeshesFromAssetSourceMeshesError(asset: MDLAsset, sourceMeshes: interop.PointerConvertible, error: interop.PointerConvertible): NSArray;

  readonly vertexCount: number;

  readonly vertexBuffers: NSArray;

  readonly vertexDescriptor: MDLVertexDescriptor;

  readonly submeshes: NSArray;

  readonly name: string;
}

export declare class GLKEffectPropertyTransform extends GLKEffectProperty {
  modelviewMatrix: _GLKMatrix4;

  projectionMatrix: _GLKMatrix4;

  readonly normalMatrix: _GLKMatrix3;
}

export declare class GLKSubmesh extends NSObject {
  readonly type: number;

  readonly mode: number;

  readonly elementCount: number;

  readonly elementBuffer: GLKMeshBuffer;

  readonly mesh: GLKMesh;

  readonly name: string;
}

export declare class GLKEffectPropertyFog extends GLKEffectProperty {
  enabled: number;

  mode: number;

  color: _GLKVector4;

  density: number;

  start: number;

  end: number;
}

export declare class GLKBaseEffect extends NSObject implements GLKNamedEffect {
  prepareToDraw(): void;

  colorMaterialEnabled: number;

  lightModelTwoSided: number;

  useConstantColor: number;

  readonly transform: GLKEffectPropertyTransform;

  readonly light0: GLKEffectPropertyLight;

  readonly light1: GLKEffectPropertyLight;

  readonly light2: GLKEffectPropertyLight;

  lightingType: interop.Enum<typeof GLKLightingType>;

  lightModelAmbientColor: _GLKVector4;

  readonly material: GLKEffectPropertyMaterial;

  readonly texture2d0: GLKEffectPropertyTexture;

  readonly texture2d1: GLKEffectPropertyTexture;

  get textureOrder(): NSArray;
  set textureOrder(value: NSArray<interop.Object> | Array<interop.Object>);

  constantColor: _GLKVector4;

  readonly fog: GLKEffectPropertyFog;

  label: string;
}

export declare class GLKEffectProperty extends NSObject {
}
