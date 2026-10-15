import type { interop } from './objc-runtime'



export declare const kCGLRendererATIRadeonX2000ID: number;

export declare const kCGLRendererATIRage128ID: number;

export declare const kCGLRendererMesa3DFXID: number;

export declare const kCGLRendererIntelHD5000ID: number;

export declare const kCGLRendererIntelHDID: number;

export declare const kCGLRendererGeForceFXID: number;

export declare const kCGLRendererGeForce3ID: number;

export declare const kCGLRendererATIRadeon9700ID: number;

export declare const kCGLRendererATIRadeonID: number;

export declare const kCGLRendererGenericFloatID: number;

export declare const kCGLRendererGeForce2MXID: number;

export declare const kCGLRendererATIRadeon8500ID: number;

export declare const kCGLRendererGeForceID: number;

export declare const kCGLRendererVTBladeXP2ID: number;

export declare const kCGLRendererIntelX3100ID: number;

export declare const kCGLRendererAppleSWID: number;

export declare const kCGLRendererGenericID: number;

export declare const kCGLRendererIntelHD4000ID: number;

export declare const kCGLRendererATIRageProID: number;

export declare const kCGLRendererGeForce8xxxID: number;

export declare const kCGLRendererIntel900ID: number;

export declare const kCGLRendererATIRadeonX4000ID: number;

export declare const kCGLRendererATIRadeonX3000ID: number;

export declare const kCGLRendererATIRadeonX1000ID: number;

export declare const _CGLOpenGLProfile: {
  Version_Legacy: 4096,
  Version_3_2_Core: 12800,
  Version_GL3_Core: 12800,
  Version_GL4_Core: 16640,
};

export declare const _CGLGPURestartStatus: {
  None: 0,
  Caused: 1,
  Blacklisted: 2,
  Denied: 2,
};

export declare const _CGLError: {
  NoError: 0,
  BadAttribute: 10000,
  BadProperty: 10001,
  BadPixelFormat: 10002,
  BadRendererInfo: 10003,
  BadContext: 10004,
  BadDrawable: 10005,
  BadDisplay: 10006,
  BadState: 10007,
  BadValue: 10008,
  BadMatch: 10009,
  BadEnumeration: 10010,
  BadOffScreen: 10011,
  BadFullScreen: 10012,
  BadWindow: 10013,
  BadAddress: 10014,
  BadCodeModule: 10015,
  BadAlloc: 10016,
  BadConnection: 10017,
};

export declare const _CGLContextParameter: {
  SwapRectangle: 200,
  SwapInterval: 222,
  DispatchTableSize: 224,
  ClientStorage: 226,
  SurfaceTexture: 228,
  SurfaceOrder: 235,
  SurfaceOpacity: 236,
  SurfaceBackingSize: 304,
  SurfaceSurfaceVolatile: 306,
  ReclaimResources: 308,
  CurrentRendererID: 309,
  GPUVertexProcessing: 310,
  GPUFragmentProcessing: 311,
  HasDrawable: 314,
  MPSwapsInFlight: 315,
  GPURestartStatus: 317,
  AbortOnGPURestartStatusBlacklisted: 318,
  AbortOnGPURestartStatusDenied: 318,
  SupportGPURestart: 319,
  SupportSeparateAddressSpace: 320,
  ContextPriorityRequest: 608,
};

export declare const _CGLContextEnable: {
  SwapRectangle: 201,
  SwapLimit: 203,
  Rasterization: 221,
  StateValidation: 301,
  SurfaceBackingSize: 305,
  DisplayListOptimization: 307,
  MPEngine: 313,
  CrashOnRemovedFunctions: 316,
};

export declare const _CGLGlobalOption: {
  FormatCacheSize: 501,
  ClearFormatCache: 502,
  RetainRenderers: 503,
  UseBuildCache: 506,
  ResetLibrary: 504,
  UseErrorHandler: 505,
};

export declare const _CGLRendererProperty: {
  OffScreen: 53,
  RendererID: 70,
  Accelerated: 73,
  BackingStore: 76,
  Window: 80,
  Compliant: 83,
  DisplayMask: 84,
  BufferModes: 100,
  ColorModes: 103,
  AccumModes: 104,
  DepthModes: 105,
  StencilModes: 106,
  MaxAuxBuffers: 107,
  MaxSampleBuffers: 108,
  MaxSamples: 109,
  SampleModes: 110,
  SampleAlpha: 111,
  GPUVertProcCapable: 122,
  GPUFragProcCapable: 123,
  RendererCount: 128,
  Online: 129,
  AcceleratedCompute: 130,
  VideoMemoryMegabytes: 131,
  TextureMemoryMegabytes: 132,
  MajorGLVersion: 133,
  RegistryIDLow: 140,
  RegistryIDHigh: 141,
  Removable: 142,
  Robust: 75,
  MPSafe: 78,
  MultiScreen: 81,
  FullScreen: 54,
  VideoMemory: 120,
  TextureMemory: 121,
};

export declare const _CGLPixelFormatAttribute: {
  AllRenderers: 1,
  TripleBuffer: 3,
  DoubleBuffer: 5,
  ColorSize: 8,
  AlphaSize: 11,
  DepthSize: 12,
  StencilSize: 13,
  MinimumPolicy: 51,
  MaximumPolicy: 52,
  SampleBuffers: 55,
  Samples: 56,
  ColorFloat: 58,
  Multisample: 59,
  Supersample: 60,
  SampleAlpha: 61,
  RendererID: 70,
  NoRecovery: 72,
  Accelerated: 73,
  ClosestPolicy: 74,
  BackingStore: 76,
  BackingVolatile: 77,
  DisplayMask: 84,
  AllowOfflineRenderers: 96,
  AcceleratedCompute: 97,
  OpenGLProfile: 99,
  SupportsAutomaticGraphicsSwitching: 101,
  VirtualScreenCount: 128,
  AuxBuffers: 7,
  AccumSize: 14,
  AuxDepthStencil: 57,
  Stereo: 6,
  OffScreen: 53,
  Window: 80,
  Compliant: 83,
  PBuffer: 90,
  RemotePBuffer: 91,
  SingleRenderer: 71,
  Robust: 75,
  MPSafe: 78,
  MultiScreen: 81,
  FullScreen: 54,
};

export declare const CGLCPContextPriorityRequest: {
  High: 0,
  Normal: 1,
  Low: 2,
};

export declare class _CGLPrivateObject {
  constructor(init?: _CGLPrivateObject);
}

export declare class GLUtesselator {
  constructor(init?: GLUtesselator);
}

export declare class GLUquadric {
  constructor(init?: GLUquadric);
}

export declare class GLUnurbs {
  constructor(init?: GLUnurbs);
}

export declare class __GLIContextRec {
  constructor(init?: __GLIContextRec);
}

export declare class CGLShareGroupRec {
  constructor(init?: CGLShareGroupRec);
}

export declare class __GLsync {
  constructor(init?: __GLsync);
}

export declare class _CGLContextObject {
  constructor(init?: _CGLContextObject);
  rend: interop.Pointer;
  disp: __GLIFunctionDispatchRec;
  priv: interop.Pointer;
  stak: interop.Pointer;
}

export declare class __GLIFunctionDispatchRec {
  constructor(init?: __GLIFunctionDispatchRec);
  accum: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  alpha_func: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  are_textures_resident: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number | null;
  array_element: (p1: interop.PointerConvertible, p2: number) => void | null;
  begin: (p1: interop.PointerConvertible, p2: number) => void | null;
  bind_texture: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  bitmap: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  blend_func: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  call_list: (p1: interop.PointerConvertible, p2: number) => void | null;
  call_lists: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  clear: (p1: interop.PointerConvertible, p2: number) => void | null;
  clear_accum: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  clear_color: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  clear_depth: (p1: interop.PointerConvertible, p2: number) => void | null;
  clear_index: (p1: interop.PointerConvertible, p2: number) => void | null;
  clear_stencil: (p1: interop.PointerConvertible, p2: number) => void | null;
  clip_plane: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  color3b: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3bv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3ub: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3ubv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3uiv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color3us: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  color3usv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4b: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4bv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4ub: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4ubv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4uiv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color4us: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color4usv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  color_mask: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  color_material: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  color_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  copy_pixels: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  copy_tex_image1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number) => void | null;
  copy_tex_image2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number) => void | null;
  copy_tex_sub_image1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  copy_tex_sub_image2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number) => void | null;
  cull_face: (p1: interop.PointerConvertible, p2: number) => void | null;
  delete_lists: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  delete_textures: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  depth_func: (p1: interop.PointerConvertible, p2: number) => void | null;
  depth_mask: (p1: interop.PointerConvertible, p2: number) => void | null;
  depth_range: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  disable: (p1: interop.PointerConvertible, p2: number) => void | null;
  disable_client_state: (p1: interop.PointerConvertible, p2: number) => void | null;
  draw_arrays: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  draw_buffer: (p1: interop.PointerConvertible, p2: number) => void | null;
  draw_elements: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  draw_pixels: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  edge_flag: (p1: interop.PointerConvertible, p2: number) => void | null;
  edge_flag_pointer: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  edge_flagv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  enable: (p1: interop.PointerConvertible, p2: number) => void | null;
  enable_client_state: (p1: interop.PointerConvertible, p2: number) => void | null;
  end: (p1: interop.PointerConvertible) => void | null;
  end_list: (p1: interop.PointerConvertible) => void | null;
  eval_coord1d: (p1: interop.PointerConvertible, p2: number) => void | null;
  eval_coord1dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  eval_coord1f: (p1: interop.PointerConvertible, p2: number) => void | null;
  eval_coord1fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  eval_coord2d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  eval_coord2dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  eval_coord2f: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  eval_coord2fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  eval_mesh1: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  eval_mesh2: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  eval_point1: (p1: interop.PointerConvertible, p2: number) => void | null;
  eval_point2: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  feedback_buffer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  finish: (p1: interop.PointerConvertible) => void | null;
  flush: (p1: interop.PointerConvertible) => void | null;
  fogf: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  fogfv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  fogi: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  fogiv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  front_face: (p1: interop.PointerConvertible, p2: number) => void | null;
  frustum: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  gen_lists: (p1: interop.PointerConvertible, p2: number) => number | null;
  gen_textures: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_booleanv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_clip_plane: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_doublev: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_error: (p1: interop.PointerConvertible) => number | null;
  get_floatv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_integerv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_lightfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_lightiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_mapdv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_mapfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_mapiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_materialfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_materialiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_pixel_mapfv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_pixel_mapuiv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_pixel_mapusv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_pointerv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_polygon_stipple: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  get_string: (p1: interop.PointerConvertible, p2: number) => interop.Pointer | null;
  get_tex_envfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_enviv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_gendv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_genfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_geniv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_image: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_tex_level_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_tex_level_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_tex_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  hint: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  index_mask: (p1: interop.PointerConvertible, p2: number) => void | null;
  index_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  indexd: (p1: interop.PointerConvertible, p2: number) => void | null;
  indexdv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  indexf: (p1: interop.PointerConvertible, p2: number) => void | null;
  indexfv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  indexi: (p1: interop.PointerConvertible, p2: number) => void | null;
  indexiv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  indexs: (p1: interop.PointerConvertible, p2: number) => void | null;
  indexsv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  indexub: (p1: interop.PointerConvertible, p2: number) => void | null;
  indexubv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  init_names: (p1: interop.PointerConvertible) => void | null;
  interleaved_arrays: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  is_enabled: (p1: interop.PointerConvertible, p2: number) => number | null;
  is_list: (p1: interop.PointerConvertible, p2: number) => number | null;
  is_texture: (p1: interop.PointerConvertible, p2: number) => number | null;
  light_modelf: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  light_modelfv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  light_modeli: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  light_modeliv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  lightf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  lightfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  lighti: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  lightiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  line_stipple: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  line_width: (p1: interop.PointerConvertible, p2: number) => void | null;
  list_base: (p1: interop.PointerConvertible, p2: number) => void | null;
  load_identity: (p1: interop.PointerConvertible) => void | null;
  load_matrixd: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  load_matrixf: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  load_name: (p1: interop.PointerConvertible, p2: number) => void | null;
  logic_op: (p1: interop.PointerConvertible, p2: number) => void | null;
  map1d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  map1f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  map2d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: interop.PointerConvertible) => void | null;
  map2f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: interop.PointerConvertible) => void | null;
  map_grid1d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  map_grid1f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  map_grid2d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  map_grid2f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  materialf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  materialfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  materiali: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  materialiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  matrix_mode: (p1: interop.PointerConvertible, p2: number) => void | null;
  mult_matrixd: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  mult_matrixf: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  new_list: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  normal3b: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  normal3bv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  normal3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  normal3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  normal3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  normal3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  normal3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  normal3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  normal3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  normal3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  normal_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  ortho: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  pass_through: (p1: interop.PointerConvertible, p2: number) => void | null;
  pixel_mapfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  pixel_mapuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  pixel_mapusv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  pixel_storef: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  pixel_storei: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  pixel_transferf: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  pixel_transferi: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  pixel_zoom: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  point_size: (p1: interop.PointerConvertible, p2: number) => void | null;
  polygon_mode: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  polygon_offset: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  polygon_stipple: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  pop_attrib: (p1: interop.PointerConvertible) => void | null;
  pop_client_attrib: (p1: interop.PointerConvertible) => void | null;
  pop_matrix: (p1: interop.PointerConvertible) => void | null;
  pop_name: (p1: interop.PointerConvertible) => void | null;
  prioritize_textures: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => void | null;
  push_attrib: (p1: interop.PointerConvertible, p2: number) => void | null;
  push_client_attrib: (p1: interop.PointerConvertible, p2: number) => void | null;
  push_matrix: (p1: interop.PointerConvertible) => void | null;
  push_name: (p1: interop.PointerConvertible, p2: number) => void | null;
  raster_pos2d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  raster_pos2dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos2f: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  raster_pos2fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos2i: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  raster_pos2iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos2s: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  raster_pos2sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  raster_pos3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  raster_pos3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  raster_pos3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  raster_pos3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  raster_pos4dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos4f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  raster_pos4fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos4i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  raster_pos4iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  raster_pos4s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  raster_pos4sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  read_buffer: (p1: interop.PointerConvertible, p2: number) => void | null;
  read_pixels: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  rectd: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  rectdv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  rectf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  rectfv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  recti: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  rectiv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  rects: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  rectsv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  render_mode: (p1: interop.PointerConvertible, p2: number) => number | null;
  rotated: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  rotatef: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  scaled: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  scalef: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  scissor: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  select_buffer: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  shade_model: (p1: interop.PointerConvertible, p2: number) => void | null;
  stencil_func: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  stencil_mask: (p1: interop.PointerConvertible, p2: number) => void | null;
  stencil_op: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_coord1d: (p1: interop.PointerConvertible, p2: number) => void | null;
  tex_coord1dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord1f: (p1: interop.PointerConvertible, p2: number) => void | null;
  tex_coord1fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord1i: (p1: interop.PointerConvertible, p2: number) => void | null;
  tex_coord1iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord1s: (p1: interop.PointerConvertible, p2: number) => void | null;
  tex_coord1sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord2d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  tex_coord2dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord2f: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  tex_coord2fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord2i: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  tex_coord2iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord2s: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  tex_coord2sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_coord3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_coord3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_coord3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_coord3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  tex_coord4dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord4f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  tex_coord4fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord4i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  tex_coord4iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord4s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  tex_coord4sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  tex_coord_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  tex_envf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_envfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_envi: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_enviv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_gend: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_gendv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_genf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_genfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_geni: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_geniv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_image1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: interop.PointerConvertible) => void | null;
  tex_image2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: interop.PointerConvertible) => void | null;
  tex_parameterf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_parameteri: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  tex_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_sub_image1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  tex_sub_image2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: interop.PointerConvertible) => void | null;
  translated: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  translatef: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex2d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex2dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex2f: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex2fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex2i: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex2iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex2s: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex2sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex4dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex4f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex4fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex4i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex4iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex4s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex4sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  vertex_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  viewport: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  blend_func_separate: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  blend_color: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  blend_equation: (p1: interop.PointerConvertible, p2: number) => void | null;
  lock_arrays_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  unlock_arrays_EXT: (p1: interop.PointerConvertible) => void | null;
  client_active_texture: (p1: interop.PointerConvertible, p2: number) => void | null;
  active_texture: (p1: interop.PointerConvertible, p2: number) => void | null;
  multi_tex_coord1d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  multi_tex_coord1dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord1f: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  multi_tex_coord1fv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord1i: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  multi_tex_coord1iv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord1s: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  multi_tex_coord1sv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord2d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  multi_tex_coord2dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord2f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  multi_tex_coord2fv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord2i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  multi_tex_coord2iv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord2s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  multi_tex_coord2sv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  multi_tex_coord3dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  multi_tex_coord3fv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  multi_tex_coord3iv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  multi_tex_coord3sv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  multi_tex_coord4dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord4f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  multi_tex_coord4fv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord4i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  multi_tex_coord4iv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  multi_tex_coord4s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  multi_tex_coord4sv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  load_transpose_matrixd: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  load_transpose_matrixf: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  mult_transpose_matrixd: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  mult_transpose_matrixf: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  compressed_tex_image3D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: interop.PointerConvertible) => void | null;
  compressed_tex_image2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: interop.PointerConvertible) => void | null;
  compressed_tex_image1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  compressed_tex_sub_image3D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: number, p12: interop.PointerConvertible) => void | null;
  compressed_tex_sub_image2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: interop.PointerConvertible) => void | null;
  compressed_tex_sub_image1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  get_compressed_tex_image: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  secondary_color3b: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3bv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3ub: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3ubv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3uiv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color3us: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  secondary_color3usv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  secondary_color_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  vertex_array_range_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  flush_vertex_array_range_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  draw_range_elements: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  color_table: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  color_table_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  color_table_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  copy_color_table: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  get_color_table: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_color_table_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_color_table_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  color_sub_table: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  copy_color_sub_table: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  convolution_filter1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  convolution_filter2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  convolution_parameterf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  convolution_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  convolution_parameteri: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  convolution_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  copy_convolution_filter1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  copy_convolution_filter2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  get_convolution_filter: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_convolution_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_convolution_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_separable_filter: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => void | null;
  separable_filter2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => void | null;
  get_histogram: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_histogram_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_histogram_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_minmax: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_minmax_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_minmax_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  histogram: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  minmax: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  reset_histogram: (p1: interop.PointerConvertible, p2: number) => void | null;
  reset_minmax: (p1: interop.PointerConvertible, p2: number) => void | null;
  tex_image3D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: interop.PointerConvertible) => void | null;
  tex_sub_image3D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: number, p12: interop.PointerConvertible) => void | null;
  copy_tex_sub_image3D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number) => void | null;
  get_uniform_indices: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  get_active_uniformsiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible) => void | null;
  get_active_uniform_name: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: string) => void | null;
  get_uniform_block_index: (p1: interop.PointerConvertible, p2: number, p3: string) => number | null;
  get_active_uniform_blockiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_active_uniform_block_name: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: string) => void | null;
  uniform_block_binding: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  get_combiner_input_parameterfv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_combiner_input_parameteriv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_combiner_output_parameterfv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_combiner_output_parameteriv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_final_combiner_input_parameterfv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_final_combiner_input_parameteriv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  combiner_stage_parameterfv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_combiner_stage_parameterfv_NV: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  texture_range_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_parameter_pointerv_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  blend_equation_separate_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  sample_coverage: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  sample_pass: (p1: interop.PointerConvertible, p2: number) => void | null;
  pn_trianglesi_ATI: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  pn_trianglesf_ATI: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  gen_fences_APPLE: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  delete_fences_APPLE: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  set_fence_APPLE: (p1: interop.PointerConvertible, p2: number) => void | null;
  is_fence_APPLE: (p1: interop.PointerConvertible, p2: number) => number | null;
  test_fence_APPLE: (p1: interop.PointerConvertible, p2: number) => number | null;
  finish_fence_APPLE: (p1: interop.PointerConvertible, p2: number) => void | null;
  test_object_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  finish_object_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  bind_program_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  delete_programs_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_programs_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_program_ARB: (p1: interop.PointerConvertible, p2: number) => number | null;
  vertex_attrib1s_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex_attrib1f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex_attrib1d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex_attrib2s_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex_attrib2f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex_attrib2d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex_attrib3s_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attrib3f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attrib3d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attrib4s_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attrib4f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attrib4d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attrib4Nub_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attrib1sv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib1fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib1dv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib2sv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib2fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib2dv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib3sv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib3fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib3dv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4bv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4sv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4iv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4ubv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4usv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4uiv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4dv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4Nbv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4Nsv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4Niv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4Nubv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4Nusv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib4Nuiv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib_pointer_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible) => void | null;
  enable_vertex_attrib_array_ARB: (p1: interop.PointerConvertible, p2: number) => void | null;
  disable_vertex_attrib_array_ARB: (p1: interop.PointerConvertible, p2: number) => void | null;
  get_vertex_attribdv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_vertex_attribfv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_vertex_attribiv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_vertex_attrib_pointerv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  program_env_parameter4d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_env_parameter4dv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  program_env_parameter4f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_env_parameter4fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  program_local_parameter4d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_local_parameter4dv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  program_local_parameter4f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_local_parameter4fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_program_env_parameterdv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_program_env_parameterfv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_program_local_parameterdv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_program_local_parameterfv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  program_string_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_program_string_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_programiv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  enable_vertex_attrib_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  disable_vertex_attrib_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  is_vertex_attrib_enabled_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  map_vertex_attrib1d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  map_vertex_attrib1f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: interop.PointerConvertible) => void | null;
  map_vertex_attrib2d_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: number, p12: interop.PointerConvertible) => void | null;
  map_vertex_attrib2f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: number, p12: interop.PointerConvertible) => void | null;
  point_parameterf: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  point_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  point_parameteri: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  point_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  fog_coordf: (p1: interop.PointerConvertible, p2: number) => void | null;
  fog_coordfv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  fog_coordd: (p1: interop.PointerConvertible, p2: number) => void | null;
  fog_coorddv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  fog_coord_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  vertex_array_parameteri_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  bind_vertex_array_EXT: (p1: interop.PointerConvertible, p2: number) => void | null;
  delete_vertex_arrays_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_vertex_arrays_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_vertex_array_EXT: (p1: interop.PointerConvertible, p2: number) => number | null;
  element_pointer_APPLE: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  draw_element_array_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  draw_range_element_array_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  weightbv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightsv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightiv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightfv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightdv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightubv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightusv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weightuiv_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  weight_pointer_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  vertex_blend_ARB: (p1: interop.PointerConvertible, p2: number) => void | null;
  multi_draw_arrays: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number) => void | null;
  multi_draw_elements: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number) => void | null;
  window_pos2d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  window_pos2dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos2f: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  window_pos2fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos2i: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  window_pos2iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos2s: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  window_pos2sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  window_pos3dv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  window_pos3fv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  window_pos3iv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  window_pos3s: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  window_pos3sv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  active_stencil_face_EXT: (p1: interop.PointerConvertible, p2: number) => void | null;
  stencil_op_separate_ATI: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  stencil_func_separate_ATI: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  flush_render_APPLE: (p1: interop.PointerConvertible) => void | null;
  finish_render_APPLE: (p1: interop.PointerConvertible) => void | null;
  swap_APPLE: (p1: interop.PointerConvertible) => void | null;
  delete_object_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  get_handle_ARB: (p1: interop.PointerConvertible, p2: number) => interop.Pointer | null;
  detach_object_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  create_shader_object_ARB: (p1: interop.PointerConvertible, p2: number) => interop.Pointer | null;
  shader_source_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  compile_shader_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  create_program_object_ARB: (p1: interop.PointerConvertible) => interop.Pointer | null;
  attach_object_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  link_program_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  use_program_object_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  validate_program_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  uniform1f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  uniform2f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  uniform3f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  uniform4f_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  uniform1i_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  uniform2i_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  uniform3i_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  uniform4i_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  uniform1fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform2fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform3fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform4fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform1iv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform2iv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform3iv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform4iv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform_matrix2fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix3fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix4fv_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_object_parameterfv_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  get_object_parameteriv_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  get_info_log_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: string) => void | null;
  get_attached_objects_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  get_uniform_location_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string) => number | null;
  get_active_uniform_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: string) => void | null;
  get_uniformfv_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  get_uniformiv_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => void | null;
  get_shader_source_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: string) => void | null;
  bind_attrib_location_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string) => void | null;
  get_active_attrib_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: string) => void | null;
  get_attrib_location_ARB: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string) => number | null;
  clamp_color_ARB: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  gen_queries: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  delete_queries: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_query: (p1: interop.PointerConvertible, p2: number) => number | null;
  begin_query: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  end_query: (p1: interop.PointerConvertible, p2: number) => void | null;
  get_queryiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_query_objectiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_query_objectuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  bind_buffer: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  delete_buffers: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_buffers: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_buffer: (p1: interop.PointerConvertible, p2: number) => number | null;
  buffer_data: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => void | null;
  buffer_sub_data: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_buffer_sub_data: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  map_buffer: (p1: interop.PointerConvertible, p2: number, p3: number) => interop.Pointer | null;
  unmap_buffer: (p1: interop.PointerConvertible, p2: number) => number | null;
  get_buffer_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_buffer_pointerv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  depth_bounds_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  draw_buffers_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_shader: (p1: interop.PointerConvertible, p2: number) => number | null;
  is_program: (p1: interop.PointerConvertible, p2: number) => number | null;
  get_shaderiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_programiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_shader_info_log: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: string) => void | null;
  get_program_info_log: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: string) => void | null;
  stencil_func_separate: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  stencil_mask_separate: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  multi_draw_element_array_APPLE: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number) => void | null;
  multi_draw_range_element_array_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: number) => void | null;
  is_renderbuffer_EXT: (p1: interop.PointerConvertible, p2: number) => number | null;
  bind_renderbuffer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  delete_renderbuffers_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_renderbuffers_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  renderbuffer_storage_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  get_renderbuffer_parameteriv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  is_framebuffer_EXT: (p1: interop.PointerConvertible, p2: number) => number | null;
  bind_framebuffer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  delete_framebuffers_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_framebuffers_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  check_framebuffer_status_EXT: (p1: interop.PointerConvertible, p2: number) => number | null;
  framebuffer_texture1D_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  framebuffer_texture2D_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  framebuffer_texture3D_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  framebuffer_renderbuffer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  get_framebuffer_attachment_parameteriv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  generate_mipmap_EXT: (p1: interop.PointerConvertible, p2: number) => void | null;
  buffer_parameteri_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  flush_mapped_buffer_range_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  program_env_parameters4fv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_local_parameters4fv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  object_purgeable_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number | null;
  object_unpurgeable_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => number | null;
  get_object_parameteriv_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_parameteri_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  framebuffer_texture_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  framebuffer_texture_layer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  framebuffer_texture_face_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  bind_buffer_range_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  bind_buffer_offset_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  bind_buffer_base_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  begin_transform_feedback_EXT: (p1: interop.PointerConvertible, p2: number) => void | null;
  end_transform_feedback_EXT: (p1: interop.PointerConvertible) => void | null;
  transform_feedback_varyings_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => void | null;
  get_transform_feedback_varying_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: string) => void | null;
  get_integer_indexedv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_boolean_indexedv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform_buffer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  get_uniform_buffer_size_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  get_uniform_buffer_offset_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  clear_colorIi_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  clear_colorIui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  tex_parameterIiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  tex_parameterIuiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_parameterIiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_tex_parameterIuiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  vertex_attribI1i_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex_attribI2i_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex_attribI3i_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribI4i_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attribI1ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex_attribI2ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex_attribI3ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribI4ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attribI1iv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI2iv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI3iv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI4iv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI1uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI2uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI3uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI4uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI4bv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI4sv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI4ubv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI4usv_EXT: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribI_pointer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_vertex_attribIiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_vertex_attribIuiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform1ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  uniform2ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  uniform3ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  uniform4ui_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  uniform1uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform2uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform3uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform4uiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_uniformuiv_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  bind_frag_data_location_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: string) => void | null;
  get_frag_data_location_EXT: (p1: interop.PointerConvertible, p2: number, p3: string) => number | null;
  color_mask_indexed_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  enable_indexed_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  disable_indexed_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  is_enabled_indexed_EXT: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  uniform_matrix2x3fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix3x2fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix2x4fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix4x2fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix3x4fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix4x3fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  blit_framebuffer_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number, p11: number) => void | null;
  renderbuffer_storage_multisample_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  begin_conditional_render_NV: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  end_conditional_render_NV: (p1: interop.PointerConvertible) => void | null;
  get_attached_shaders: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  provoking_vertex_EXT: (p1: interop.PointerConvertible, p2: number) => void | null;
  vertex_attrib_divisor: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  draw_arrays_instanced: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  draw_elements_instanced: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number) => void | null;
  draw_elements_base_vertex: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number) => void | null;
  draw_range_elements_base_vertex: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: interop.PointerConvertible, p8: number) => void | null;
  draw_elements_instanced_base_vertex: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: number, p7: number) => void | null;
  multi_draw_elements_base_vertex: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number, p7: interop.PointerConvertible) => void | null;
  bind_vertex_array_ARB: (p1: interop.PointerConvertible, p2: number) => void | null;
  delete_vertex_arrays_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_vertex_arrays_ARB: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_vertex_array_ARB: (p1: interop.PointerConvertible, p2: number) => number | null;
  point_size_pointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  vertex_point_sizef_APPLE: (p1: interop.PointerConvertible, p2: number) => void | null;
  clear_bufferiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  clear_bufferuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  clear_bufferfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  clear_bufferfi: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  get_stringi: (p1: interop.PointerConvertible, p2: number, p3: number) => interop.Pointer | null;
  fence_sync: (p1: interop.PointerConvertible, p2: number, p3: number) => interop.Pointer | null;
  is_sync: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  delete_sync: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  client_wait_sync: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => number | null;
  wait_sync: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number) => void | null;
  get_integer64v_sync: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  get_synciv: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void | null;
  tex_image2D_multisample: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  tex_image3D_multisample: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number) => void | null;
  get_multisamplefv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  sample_maski: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  tex_buffer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  copy_buffer_sub_data: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  primitive_restart_index: (p1: interop.PointerConvertible, p2: number) => void | null;
  get_query_objecti64v: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_query_objectui64v: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  map_buffer_range: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => interop.Pointer | null;
  flush_mapped_buffer_range: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  query_counter: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  get_integer64i_v: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_buffer_parameteri64v: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  gen_samplers: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  delete_samplers: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_sampler: (p1: interop.PointerConvertible, p2: number) => number | null;
  bind_sampler: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  sampler_parameteri: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  sampler_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  sampler_parameterf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  sampler_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  sampler_parameterIiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  sampler_parameterIuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_sampler_parameteriv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_sampler_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_sampler_parameterIiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_sampler_parameterIuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  label_object_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: string) => void | null;
  get_object_label_EXT: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible, p6: string) => void | null;
  insert_event_marker_EXT: (p1: interop.PointerConvertible, p2: number, p3: string) => void | null;
  push_group_marker_EXT: (p1: interop.PointerConvertible, p2: number, p3: string) => void | null;
  pop_group_marker_EXT: (p1: interop.PointerConvertible) => void | null;
  use_program_stages: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  active_shader_program: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  create_shader_programv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => number | null;
  bind_program_pipeline: (p1: interop.PointerConvertible, p2: number) => void | null;
  delete_program_pipelines: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  gen_program_pipelines: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  is_program_pipeline: (p1: interop.PointerConvertible, p2: number) => number | null;
  get_program_pipelineiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  validate_program_pipeline: (p1: interop.PointerConvertible, p2: number) => void | null;
  get_program_pipeline_info_log: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: string) => void | null;
  program_uniform1i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  program_uniform2i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  program_uniform3i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  program_uniform4i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_uniform1f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  program_uniform2f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  program_uniform3f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  program_uniform4f: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_uniform1iv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform2iv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform3iv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform4iv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform1fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform2fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform3fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform4fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform_matrix2fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix3fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix4fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform1ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  program_uniform2ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  program_uniform3ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  program_uniform4ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_uniform1uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform2uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform3uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform4uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform_matrix2x3fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix3x2fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix2x4fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix4x2fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix3x4fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix4x3fv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  bind_frag_data_location_indexed: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: string) => void | null;
  get_frag_data_index: (p1: interop.PointerConvertible, p2: number, p3: string) => number | null;
  blend_func_i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  blend_func_separate_i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  blend_equation_i: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  blend_equation_separate_i: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  named_string_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: string, p5: number, p6: string) => void | null;
  delete_named_string_ARB: (p1: interop.PointerConvertible, p2: number, p3: string) => void | null;
  compile_shader_include_ARB: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  is_named_string_ARB: (p1: interop.PointerConvertible, p2: number, p3: string) => number | null;
  get_named_string_ARB: (p1: interop.PointerConvertible, p2: number, p3: string, p4: number, p5: interop.PointerConvertible, p6: string) => void | null;
  get_named_string_iv_ARB: (p1: interop.PointerConvertible, p2: number, p3: string, p4: number, p5: interop.PointerConvertible) => void | null;
  release_shader_compiler: (p1: interop.PointerConvertible) => void | null;
  shader_binary: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible, p6: number) => void | null;
  get_shader_precision_format: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible) => void | null;
  depth_rangef: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  clear_depthf: (p1: interop.PointerConvertible, p2: number) => void | null;
  vertex_attribP1ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribP2ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribP3ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribP4ui: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribP1uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  vertex_attribP2uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  vertex_attribP3uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  vertex_attribP4uiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_program_binary: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible) => void | null;
  program_binary: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number) => void | null;
  min_sample_shading: (p1: interop.PointerConvertible, p2: number) => void | null;
  viewport_arrayv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  viewport_indexedf: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  viewport_indexedfv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  scissor_arrayv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  scissor_indexed: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  scissor_indexedv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  depth_range_arrayv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  depth_range_indexed: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  get_floati_v: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_doublei_v: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  draw_arrays_indirect: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  draw_elements_indirect: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  patch_parameteri: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  patch_parameterfv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  bind_transform_feedback: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  gen_transform_feedbacks: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  delete_transform_feedbacks: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  pause_transform_feedback: (p1: interop.PointerConvertible) => void | null;
  resume_transform_feedback: (p1: interop.PointerConvertible) => void | null;
  is_transform_feedback: (p1: interop.PointerConvertible, p2: number) => number | null;
  draw_transform_feedback: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  begin_query_indexed: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  end_query_indexed: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  get_query_indexediv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  draw_transform_feedback_stream: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  program_uniform1d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  program_uniform2d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  program_uniform3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  program_uniform4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  program_uniform1dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  program_uniform_matrix2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix2x3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix3x2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix2x4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix4x2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix3x4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  program_uniform_matrix4x3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  uniform1d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  uniform2d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  uniform3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  uniform4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  uniform1dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  uniform_matrix2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix2x3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix3x2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix2x4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix4x2dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix3x4dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  uniform_matrix4x3dv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_uniformdv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  vertex_attribl1d: (p1: interop.PointerConvertible, p2: number, p3: number) => void | null;
  vertex_attribl2d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  vertex_attribl3d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  vertex_attribl4d: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  vertex_attribl1dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribl2dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribl3dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attribl4dv: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => void | null;
  vertex_attrib_lpointer: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_vertex_attrib_ldv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_subroutine_uniform_location: (p1: interop.PointerConvertible, p2: number, p3: number, p4: string) => number | null;
  get_subroutine_index: (p1: interop.PointerConvertible, p2: number, p3: number, p4: string) => number | null;
  get_active_subroutine_uniformiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  get_active_subroutine_uniform_name: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible, p7: string) => void | null;
  get_active_subroutine_name: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible, p7: string) => void | null;
  uniform_subroutinesuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_uniform_subroutineuiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible) => void | null;
  get_program_stageiv: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: interop.PointerConvertible) => void | null;
  get_internal_formativ: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: interop.PointerConvertible) => void | null;
  tex_storage1D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number) => void | null;
  tex_storage2D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number) => void | null;
  tex_storage3D: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number) => void | null;
  label_object_with_responsible_process_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: number) => void | null;
  texture_barrier_NV: (p1: interop.PointerConvertible) => void | null;
  multi_draw_elements_indirect_APPLE: (p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: number, p6: number) => void | null;
}

export declare class _cl_device_id {
  constructor(init?: _cl_device_id);
}

export declare class _CGLRendererInfoObject {
  constructor(init?: _CGLRendererInfoObject);
}

export declare class _CGLPBufferObject {
  constructor(init?: _CGLPBufferObject);
}

export declare class __GLISharedRec {
  constructor(init?: __GLISharedRec);
}

export declare class _CGLPixelFormatObject {
  constructor(init?: _CGLPixelFormatObject);
}

export declare function CGLSetCurrentContext(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLGetCurrentContext(): interop.Pointer;

export declare function CGLGetShareGroup(ctx: interop.PointerConvertible): interop.Pointer;

export declare function CGLGetDeviceFromGLRenderer(rendererID: number): interop.Pointer;

export declare function CGLTexImageIOSurface2D(ctx: interop.PointerConvertible, target: number, internal_format: number, width: number, height: number, format: number, type: number, ioSurface: interop.Object, plane: number): interop.Enum<typeof _CGLError>;

export declare function CGLChoosePixelFormat(attribs: interop.PointerConvertible, pix: interop.PointerConvertible, npix: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDestroyPixelFormat(pix: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDescribePixelFormat(pix: interop.PointerConvertible, pix_num: number, attrib: interop.Enum<typeof _CGLPixelFormatAttribute>, value: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLReleasePixelFormat(pix: interop.PointerConvertible): void;

export declare function CGLRetainPixelFormat(pix: interop.PointerConvertible): interop.Pointer;

export declare function CGLGetPixelFormatRetainCount(pix: interop.PointerConvertible): number;

export declare function CGLQueryRendererInfo(display_mask: number, rend: interop.PointerConvertible, nrend: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDestroyRendererInfo(rend: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDescribeRenderer(rend: interop.PointerConvertible, rend_num: number, prop: interop.Enum<typeof _CGLRendererProperty>, value: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLCreateContext(pix: interop.PointerConvertible, share: interop.PointerConvertible, ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDestroyContext(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLCopyContext(src: interop.PointerConvertible, dst: interop.PointerConvertible, mask: number): interop.Enum<typeof _CGLError>;

export declare function CGLRetainContext(ctx: interop.PointerConvertible): interop.Pointer;

export declare function CGLReleaseContext(ctx: interop.PointerConvertible): void;

export declare function CGLGetContextRetainCount(ctx: interop.PointerConvertible): number;

export declare function CGLGetPixelFormat(ctx: interop.PointerConvertible): interop.Pointer;

export declare function CGLCreatePBuffer(width: number, height: number, target: number, internalFormat: number, max_level: number, pbuffer: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDestroyPBuffer(pbuffer: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLDescribePBuffer(obj: interop.PointerConvertible, width: interop.PointerConvertible, height: interop.PointerConvertible, target: interop.PointerConvertible, internalFormat: interop.PointerConvertible, mipmap: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLTexImagePBuffer(ctx: interop.PointerConvertible, pbuffer: interop.PointerConvertible, source: number): interop.Enum<typeof _CGLError>;

export declare function CGLRetainPBuffer(pbuffer: interop.PointerConvertible): interop.Pointer;

export declare function CGLReleasePBuffer(pbuffer: interop.PointerConvertible): void;

export declare function CGLGetPBufferRetainCount(pbuffer: interop.PointerConvertible): number;

export declare function CGLSetOffScreen(ctx: interop.PointerConvertible, width: number, height: number, rowbytes: number, baseaddr: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLGetOffScreen(ctx: interop.PointerConvertible, width: interop.PointerConvertible, height: interop.PointerConvertible, rowbytes: interop.PointerConvertible, baseaddr: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLSetFullScreen(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLSetFullScreenOnDisplay(ctx: interop.PointerConvertible, display_mask: number): interop.Enum<typeof _CGLError>;

export declare function CGLSetPBuffer(ctx: interop.PointerConvertible, pbuffer: interop.PointerConvertible, face: number, level: number, screen: number): interop.Enum<typeof _CGLError>;

export declare function CGLGetPBuffer(ctx: interop.PointerConvertible, pbuffer: interop.PointerConvertible, face: interop.PointerConvertible, level: interop.PointerConvertible, screen: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLClearDrawable(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLFlushDrawable(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLEnable(ctx: interop.PointerConvertible, pname: interop.Enum<typeof _CGLContextEnable>): interop.Enum<typeof _CGLError>;

export declare function CGLDisable(ctx: interop.PointerConvertible, pname: interop.Enum<typeof _CGLContextEnable>): interop.Enum<typeof _CGLError>;

export declare function CGLIsEnabled(ctx: interop.PointerConvertible, pname: interop.Enum<typeof _CGLContextEnable>, enable: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLSetParameter(ctx: interop.PointerConvertible, pname: interop.Enum<typeof _CGLContextParameter>, params: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLGetParameter(ctx: interop.PointerConvertible, pname: interop.Enum<typeof _CGLContextParameter>, params: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLSetVirtualScreen(ctx: interop.PointerConvertible, screen: number): interop.Enum<typeof _CGLError>;

export declare function CGLGetVirtualScreen(ctx: interop.PointerConvertible, screen: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLUpdateContext(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLSetGlobalOption(pname: interop.Enum<typeof _CGLGlobalOption>, params: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLGetGlobalOption(pname: interop.Enum<typeof _CGLGlobalOption>, params: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLSetOption(pname: interop.Enum<typeof _CGLGlobalOption>, param: number): interop.Enum<typeof _CGLError>;

export declare function CGLGetOption(pname: interop.Enum<typeof _CGLGlobalOption>, param: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLLockContext(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLUnlockContext(ctx: interop.PointerConvertible): interop.Enum<typeof _CGLError>;

export declare function CGLGetVersion(majorvers: interop.PointerConvertible, minorvers: interop.PointerConvertible): void;

export declare function CGLErrorString(error: interop.Enum<typeof _CGLError>): string;

export declare function glCullFace(mode: number): void;

export declare function glFrontFace(mode: number): void;

export declare function glHint(target: number, mode: number): void;

export declare function glLineWidth(width: number): void;

export declare function glPointSize(size: number): void;

export declare function glPolygonMode(face: number, mode: number): void;

export declare function glScissor(x: number, y: number, width: number, height: number): void;

export declare function glTexParameterf(target: number, pname: number, param: number): void;

export declare function glTexParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexParameteri(target: number, pname: number, param: number): void;

export declare function glTexParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexImage1D(target: number, level: number, internalformat: number, width: number, border: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glDrawBuffer(mode: number): void;

export declare function glClear(mask: number): void;

export declare function glClearColor(red: number, green: number, blue: number, alpha: number): void;

export declare function glClearStencil(s: number): void;

export declare function glClearDepth(depth: number): void;

export declare function glStencilMask(mask: number): void;

export declare function glColorMask(red: number, green: number, blue: number, alpha: number): void;

export declare function glDepthMask(flag: number): void;

export declare function glDisable(cap: number): void;

export declare function glEnable(cap: number): void;

export declare function glFinish(): void;

export declare function glFlush(): void;

export declare function glBlendFunc(sfactor: number, dfactor: number): void;

export declare function glLogicOp(opcode: number): void;

export declare function glStencilFunc(func: number, ref: number, mask: number): void;

export declare function glStencilOp(fail: number, zfail: number, zpass: number): void;

export declare function glDepthFunc(func: number): void;

export declare function glPixelStoref(pname: number, param: number): void;

export declare function glPixelStorei(pname: number, param: number): void;

export declare function glReadBuffer(mode: number): void;

export declare function glReadPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glGetBooleanv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetDoublev(pname: number, params: interop.PointerConvertible): void;

export declare function glGetError(): number;

export declare function glGetFloatv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetIntegerv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetString(name: number): interop.Pointer;

export declare function glGetTexImage(target: number, level: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glGetTexParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexLevelParameterfv(target: number, level: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexLevelParameteriv(target: number, level: number, pname: number, params: interop.PointerConvertible): void;

export declare function glIsEnabled(cap: number): number;

export declare function glDepthRange(near: number, far: number): void;

export declare function glViewport(x: number, y: number, width: number, height: number): void;

export declare function glDrawArrays(mode: number, first: number, count: number): void;

export declare function glDrawElements(mode: number, count: number, type: number, indices: interop.PointerConvertible): void;

export declare function glPolygonOffset(factor: number, units: number): void;

export declare function glCopyTexImage1D(target: number, level: number, internalformat: number, x: number, y: number, width: number, border: number): void;

export declare function glCopyTexImage2D(target: number, level: number, internalformat: number, x: number, y: number, width: number, height: number, border: number): void;

export declare function glCopyTexSubImage1D(target: number, level: number, xoffset: number, x: number, y: number, width: number): void;

export declare function glCopyTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, x: number, y: number, width: number, height: number): void;

export declare function glTexSubImage1D(target: number, level: number, xoffset: number, width: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glBindTexture(target: number, texture: number): void;

export declare function glDeleteTextures(n: number, textures: interop.PointerConvertible): void;

export declare function glGenTextures(n: number, textures: interop.PointerConvertible): void;

export declare function glIsTexture(texture: number): number;

export declare function glBlendColor(red: number, green: number, blue: number, alpha: number): void;

export declare function glBlendEquation(mode: number): void;

export declare function glDrawRangeElements(mode: number, start: number, end: number, count: number, type: number, indices: interop.PointerConvertible): void;

export declare function glTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, width: number, height: number, depth: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glCopyTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, x: number, y: number, width: number, height: number): void;

export declare function glActiveTexture(texture: number): void;

export declare function glSampleCoverage(value: number, invert: number): void;

export declare function glCompressedTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexImage1D(target: number, level: number, internalformat: number, width: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, width: number, height: number, depth: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage1D(target: number, level: number, xoffset: number, width: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glGetCompressedTexImage(target: number, level: number, img: interop.PointerConvertible): void;

export declare function glBlendFuncSeparate(sfactorRGB: number, dfactorRGB: number, sfactorAlpha: number, dfactorAlpha: number): void;

export declare function glMultiDrawArrays(mode: number, first: interop.PointerConvertible, count: interop.PointerConvertible, drawcount: number): void;

export declare function glMultiDrawElements(mode: number, count: interop.PointerConvertible, type: number, indices: interop.PointerConvertible, drawcount: number): void;

export declare function glPointParameterf(pname: number, param: number): void;

export declare function glPointParameterfv(pname: number, params: interop.PointerConvertible): void;

export declare function glPointParameteri(pname: number, param: number): void;

export declare function glPointParameteriv(pname: number, params: interop.PointerConvertible): void;

export declare function glGenQueries(n: number, ids: interop.PointerConvertible): void;

export declare function glDeleteQueries(n: number, ids: interop.PointerConvertible): void;

export declare function glIsQuery(id: number): number;

export declare function glBeginQuery(target: number, id: number): void;

export declare function glEndQuery(target: number): void;

export declare function glGetQueryiv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectiv(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectuiv(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBindBuffer(target: number, buffer: number): void;

export declare function glDeleteBuffers(n: number, buffers: interop.PointerConvertible): void;

export declare function glGenBuffers(n: number, buffers: interop.PointerConvertible): void;

export declare function glIsBuffer(buffer: number): number;

export declare function glBufferData(target: number, size: number, data: interop.PointerConvertible, usage: number): void;

export declare function glBufferSubData(target: number, offset: number, size: number, data: interop.PointerConvertible): void;

export declare function glGetBufferSubData(target: number, offset: number, size: number, data: interop.PointerConvertible): void;

export declare function glMapBuffer(target: number, access: number): interop.Pointer;

export declare function glUnmapBuffer(target: number): number;

export declare function glGetBufferParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetBufferPointerv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBlendEquationSeparate(modeRGB: number, modeAlpha: number): void;

export declare function glDrawBuffers(n: number, bufs: interop.PointerConvertible): void;

export declare function glStencilOpSeparate(face: number, sfail: number, dpfail: number, dppass: number): void;

export declare function glStencilFuncSeparate(face: number, func: number, ref: number, mask: number): void;

export declare function glStencilMaskSeparate(face: number, mask: number): void;

export declare function glAttachShader(program: number, shader: number): void;

export declare function glBindAttribLocation(program: number, index: number, name: string): void;

export declare function glCompileShader(shader: number): void;

export declare function glCreateProgram(): number;

export declare function glCreateShader(type: number): number;

export declare function glDeleteProgram(program: number): void;

export declare function glDeleteShader(shader: number): void;

export declare function glDetachShader(program: number, shader: number): void;

export declare function glDisableVertexAttribArray(index: number): void;

export declare function glEnableVertexAttribArray(index: number): void;

export declare function glGetActiveAttrib(program: number, index: number, bufSize: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetActiveUniform(program: number, index: number, bufSize: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetAttachedShaders(program: number, maxCount: number, count: interop.PointerConvertible, shaders: interop.PointerConvertible): void;

export declare function glGetAttribLocation(program: number, name: string): number;

export declare function glGetProgramiv(program: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetProgramInfoLog(program: number, bufSize: number, length: interop.PointerConvertible, infoLog: string): void;

export declare function glGetShaderiv(shader: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetShaderInfoLog(shader: number, bufSize: number, length: interop.PointerConvertible, infoLog: string): void;

export declare function glGetShaderSource(shader: number, bufSize: number, length: interop.PointerConvertible, source: string): void;

export declare function glGetUniformLocation(program: number, name: string): number;

export declare function glGetUniformfv(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glGetUniformiv(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribdv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribfv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribiv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribPointerv(index: number, pname: number, pointer: interop.PointerConvertible): void;

export declare function glIsProgram(program: number): number;

export declare function glIsShader(shader: number): number;

export declare function glLinkProgram(program: number): void;

export declare function glShaderSource(shader: number, count: number, string: interop.PointerConvertible, length: interop.PointerConvertible): void;

export declare function glUseProgram(program: number): void;

export declare function glUniform1f(location: number, v0: number): void;

export declare function glUniform2f(location: number, v0: number, v1: number): void;

export declare function glUniform3f(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4f(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1i(location: number, v0: number): void;

export declare function glUniform2i(location: number, v0: number, v1: number): void;

export declare function glUniform3i(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4i(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform1iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glValidateProgram(program: number): void;

export declare function glVertexAttrib1d(index: number, x: number): void;

export declare function glVertexAttrib1dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib1f(index: number, x: number): void;

export declare function glVertexAttrib1fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib1s(index: number, x: number): void;

export declare function glVertexAttrib1sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2d(index: number, x: number, y: number): void;

export declare function glVertexAttrib2dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2f(index: number, x: number, y: number): void;

export declare function glVertexAttrib2fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2s(index: number, x: number, y: number): void;

export declare function glVertexAttrib2sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3d(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3f(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3s(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nbv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Niv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nsv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nub(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4Nubv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nuiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nusv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4bv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4d(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4f(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4iv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4s(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4ubv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4uiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4usv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribPointer(index: number, size: number, type: number, normalized: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glUniformMatrix2x3fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3x2fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2x4fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4x2fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3x4fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4x3fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glColorMaski(index: number, r: number, g: number, b: number, a: number): void;

export declare function glGetBooleani_v(target: number, index: number, data: interop.PointerConvertible): void;

export declare function glGetIntegeri_v(target: number, index: number, data: interop.PointerConvertible): void;

export declare function glEnablei(target: number, index: number): void;

export declare function glDisablei(target: number, index: number): void;

export declare function glIsEnabledi(target: number, index: number): number;

export declare function glBeginTransformFeedback(primitiveMode: number): void;

export declare function glEndTransformFeedback(): void;

export declare function glBindBufferRange(target: number, index: number, buffer: number, offset: number, size: number): void;

export declare function glBindBufferBase(target: number, index: number, buffer: number): void;

export declare function glTransformFeedbackVaryings(program: number, count: number, varyings: interop.PointerConvertible, bufferMode: number): void;

export declare function glGetTransformFeedbackVarying(program: number, index: number, bufSize: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glClampColor(target: number, clamp: number): void;

export declare function glBeginConditionalRender(id: number, mode: number): void;

export declare function glEndConditionalRender(): void;

export declare function glVertexAttribIPointer(index: number, size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glGetVertexAttribIiv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribIuiv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glVertexAttribI1i(index: number, x: number): void;

export declare function glVertexAttribI2i(index: number, x: number, y: number): void;

export declare function glVertexAttribI3i(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttribI4i(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttribI1ui(index: number, x: number): void;

export declare function glVertexAttribI2ui(index: number, x: number, y: number): void;

export declare function glVertexAttribI3ui(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttribI4ui(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttribI1iv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI2iv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI3iv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4iv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI1uiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI2uiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI3uiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4uiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4bv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4ubv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4usv(index: number, v: interop.PointerConvertible): void;

export declare function glGetUniformuiv(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glBindFragDataLocation(program: number, color: number, name: string): void;

export declare function glGetFragDataLocation(program: number, name: string): number;

export declare function glUniform1ui(location: number, v0: number): void;

export declare function glUniform2ui(location: number, v0: number, v1: number): void;

export declare function glUniform3ui(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4ui(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1uiv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2uiv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3uiv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4uiv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glTexParameterIiv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexParameterIuiv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameterIiv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameterIuiv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glClearBufferiv(buffer: number, drawbuffer: number, value: interop.PointerConvertible): void;

export declare function glClearBufferuiv(buffer: number, drawbuffer: number, value: interop.PointerConvertible): void;

export declare function glClearBufferfv(buffer: number, drawbuffer: number, value: interop.PointerConvertible): void;

export declare function glClearBufferfi(buffer: number, drawbuffer: number, depth: number, stencil: number): void;

export declare function glGetStringi(name: number, index: number): interop.Pointer;

export declare function glDrawArraysInstanced(mode: number, first: number, count: number, instancecount: number): void;

export declare function glDrawElementsInstanced(mode: number, count: number, type: number, indices: interop.PointerConvertible, instancecount: number): void;

export declare function glTexBuffer(target: number, internalformat: number, buffer: number): void;

export declare function glPrimitiveRestartIndex(index: number): void;

export declare function glGetInteger64i_v(target: number, index: number, data: interop.PointerConvertible): void;

export declare function glGetBufferParameteri64v(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glFramebufferTexture(target: number, attachment: number, texture: number, level: number): void;

export declare function glVertexAttribDivisor(index: number, divisor: number): void;

export declare function glMinSampleShading(value: number): void;

export declare function glBlendEquationi(buf: number, mode: number): void;

export declare function glBlendEquationSeparatei(buf: number, modeRGB: number, modeAlpha: number): void;

export declare function glBlendFunci(buf: number, src: number, dst: number): void;

export declare function glBlendFuncSeparatei(buf: number, srcRGB: number, dstRGB: number, srcAlpha: number, dstAlpha: number): void;

export declare function glIsRenderbuffer(renderbuffer: number): number;

export declare function glBindRenderbuffer(target: number, renderbuffer: number): void;

export declare function glDeleteRenderbuffers(n: number, renderbuffers: interop.PointerConvertible): void;

export declare function glGenRenderbuffers(n: number, renderbuffers: interop.PointerConvertible): void;

export declare function glRenderbufferStorage(target: number, internalformat: number, width: number, height: number): void;

export declare function glGetRenderbufferParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glIsFramebuffer(framebuffer: number): number;

export declare function glBindFramebuffer(target: number, framebuffer: number): void;

export declare function glDeleteFramebuffers(n: number, framebuffers: interop.PointerConvertible): void;

export declare function glGenFramebuffers(n: number, framebuffers: interop.PointerConvertible): void;

export declare function glCheckFramebufferStatus(target: number): number;

export declare function glFramebufferTexture1D(target: number, attachment: number, textarget: number, texture: number, level: number): void;

export declare function glFramebufferTexture2D(target: number, attachment: number, textarget: number, texture: number, level: number): void;

export declare function glFramebufferTexture3D(target: number, attachment: number, textarget: number, texture: number, level: number, zoffset: number): void;

export declare function glFramebufferRenderbuffer(target: number, attachment: number, renderbuffertarget: number, renderbuffer: number): void;

export declare function glGetFramebufferAttachmentParameteriv(target: number, attachment: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGenerateMipmap(target: number): void;

export declare function glBlitFramebuffer(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number, dstX1: number, dstY1: number, mask: number, filter: number): void;

export declare function glRenderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;

export declare function glFramebufferTextureLayer(target: number, attachment: number, texture: number, level: number, layer: number): void;

export declare function glMapBufferRange(target: number, offset: number, length: number, access: number): interop.Pointer;

export declare function glFlushMappedBufferRange(target: number, offset: number, length: number): void;

export declare function glBindVertexArray(array: number): void;

export declare function glDeleteVertexArrays(n: number, arrays: interop.PointerConvertible): void;

export declare function glGenVertexArrays(n: number, arrays: interop.PointerConvertible): void;

export declare function glIsVertexArray(array: number): number;

export declare function glGetUniformIndices(program: number, uniformCount: number, uniformNames: interop.PointerConvertible, uniformIndices: interop.PointerConvertible): void;

export declare function glGetActiveUniformsiv(program: number, uniformCount: number, uniformIndices: interop.PointerConvertible, pname: number, params: interop.PointerConvertible): void;

export declare function glGetActiveUniformName(program: number, uniformIndex: number, bufSize: number, length: interop.PointerConvertible, uniformName: string): void;

export declare function glGetUniformBlockIndex(program: number, uniformBlockName: string): number;

export declare function glGetActiveUniformBlockiv(program: number, uniformBlockIndex: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetActiveUniformBlockName(program: number, uniformBlockIndex: number, bufSize: number, length: interop.PointerConvertible, uniformBlockName: string): void;

export declare function glUniformBlockBinding(program: number, uniformBlockIndex: number, uniformBlockBinding: number): void;

export declare function glCopyBufferSubData(readTarget: number, writeTarget: number, readOffset: number, writeOffset: number, size: number): void;

export declare function glDrawElementsBaseVertex(mode: number, count: number, type: number, indices: interop.PointerConvertible, basevertex: number): void;

export declare function glDrawRangeElementsBaseVertex(mode: number, start: number, end: number, count: number, type: number, indices: interop.PointerConvertible, basevertex: number): void;

export declare function glDrawElementsInstancedBaseVertex(mode: number, count: number, type: number, indices: interop.PointerConvertible, instancecount: number, basevertex: number): void;

export declare function glMultiDrawElementsBaseVertex(mode: number, count: interop.PointerConvertible, type: number, indices: interop.PointerConvertible, drawcount: number, basevertex: interop.PointerConvertible): void;

export declare function glProvokingVertex(mode: number): void;

export declare function glFenceSync(condition: number, flags: number): interop.Pointer;

export declare function glIsSync(sync: interop.PointerConvertible): number;

export declare function glDeleteSync(sync: interop.PointerConvertible): void;

export declare function glClientWaitSync(sync: interop.PointerConvertible, flags: number, timeout: number): number;

export declare function glWaitSync(sync: interop.PointerConvertible, flags: number, timeout: number): void;

export declare function glGetInteger64v(pname: number, params: interop.PointerConvertible): void;

export declare function glGetSynciv(sync: interop.PointerConvertible, pname: number, bufSize: number, length: interop.PointerConvertible, values: interop.PointerConvertible): void;

export declare function glTexImage2DMultisample(target: number, samples: number, internalformat: number, width: number, height: number, fixedsamplelocations: number): void;

export declare function glTexImage3DMultisample(target: number, samples: number, internalformat: number, width: number, height: number, depth: number, fixedsamplelocations: number): void;

export declare function glGetMultisamplefv(pname: number, index: number, val: interop.PointerConvertible): void;

export declare function glSampleMaski(index: number, mask: number): void;

export declare function glBindFragDataLocationIndexed(program: number, colorNumber: number, index: number, name: string): void;

export declare function glGetFragDataIndex(program: number, name: string): number;

export declare function glGenSamplers(count: number, samplers: interop.PointerConvertible): void;

export declare function glDeleteSamplers(count: number, samplers: interop.PointerConvertible): void;

export declare function glIsSampler(sampler: number): number;

export declare function glBindSampler(unit: number, sampler: number): void;

export declare function glSamplerParameteri(sampler: number, pname: number, param: number): void;

export declare function glSamplerParameteriv(sampler: number, pname: number, param: interop.PointerConvertible): void;

export declare function glSamplerParameterf(sampler: number, pname: number, param: number): void;

export declare function glSamplerParameterfv(sampler: number, pname: number, param: interop.PointerConvertible): void;

export declare function glSamplerParameterIiv(sampler: number, pname: number, param: interop.PointerConvertible): void;

export declare function glSamplerParameterIuiv(sampler: number, pname: number, param: interop.PointerConvertible): void;

export declare function glGetSamplerParameteriv(sampler: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetSamplerParameterIiv(sampler: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetSamplerParameterfv(sampler: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetSamplerParameterIuiv(sampler: number, pname: number, params: interop.PointerConvertible): void;

export declare function glQueryCounter(id: number, target: number): void;

export declare function glGetQueryObjecti64v(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectui64v(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glVertexAttribP1ui(index: number, type: number, normalized: number, value: number): void;

export declare function glVertexAttribP1uiv(index: number, type: number, normalized: number, value: interop.PointerConvertible): void;

export declare function glVertexAttribP2ui(index: number, type: number, normalized: number, value: number): void;

export declare function glVertexAttribP2uiv(index: number, type: number, normalized: number, value: interop.PointerConvertible): void;

export declare function glVertexAttribP3ui(index: number, type: number, normalized: number, value: number): void;

export declare function glVertexAttribP3uiv(index: number, type: number, normalized: number, value: interop.PointerConvertible): void;

export declare function glVertexAttribP4ui(index: number, type: number, normalized: number, value: number): void;

export declare function glVertexAttribP4uiv(index: number, type: number, normalized: number, value: interop.PointerConvertible): void;

export declare function glDrawArraysIndirect(mode: number, indirect: interop.PointerConvertible): void;

export declare function glDrawElementsIndirect(mode: number, type: number, indirect: interop.PointerConvertible): void;

export declare function glUniform1d(location: number, x: number): void;

export declare function glUniform2d(location: number, x: number, y: number): void;

export declare function glUniform3d(location: number, x: number, y: number, z: number): void;

export declare function glUniform4d(location: number, x: number, y: number, z: number, w: number): void;

export declare function glUniform1dv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2dv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3dv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4dv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2x3dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2x4dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3x2dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3x4dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4x2dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4x3dv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glGetUniformdv(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glGetSubroutineUniformLocation(program: number, shadertype: number, name: string): number;

export declare function glGetSubroutineIndex(program: number, shadertype: number, name: string): number;

export declare function glGetActiveSubroutineUniformiv(program: number, shadertype: number, index: number, pname: number, values: interop.PointerConvertible): void;

export declare function glGetActiveSubroutineUniformName(program: number, shadertype: number, index: number, bufsize: number, length: interop.PointerConvertible, name: string): void;

export declare function glGetActiveSubroutineName(program: number, shadertype: number, index: number, bufsize: number, length: interop.PointerConvertible, name: string): void;

export declare function glUniformSubroutinesuiv(shadertype: number, count: number, indices: interop.PointerConvertible): void;

export declare function glGetUniformSubroutineuiv(shadertype: number, location: number, params: interop.PointerConvertible): void;

export declare function glGetProgramStageiv(program: number, shadertype: number, pname: number, values: interop.PointerConvertible): void;

export declare function glPatchParameteri(pname: number, value: number): void;

export declare function glPatchParameterfv(pname: number, values: interop.PointerConvertible): void;

export declare function glBindTransformFeedback(target: number, id: number): void;

export declare function glDeleteTransformFeedbacks(n: number, ids: interop.PointerConvertible): void;

export declare function glGenTransformFeedbacks(n: number, ids: interop.PointerConvertible): void;

export declare function glIsTransformFeedback(id: number): number;

export declare function glPauseTransformFeedback(): void;

export declare function glResumeTransformFeedback(): void;

export declare function glDrawTransformFeedback(mode: number, id: number): void;

export declare function glDrawTransformFeedbackStream(mode: number, id: number, stream: number): void;

export declare function glBeginQueryIndexed(target: number, index: number, id: number): void;

export declare function glEndQueryIndexed(target: number, index: number): void;

export declare function glGetQueryIndexediv(target: number, index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glReleaseShaderCompiler(): void;

export declare function glShaderBinary(count: number, shaders: interop.PointerConvertible, binaryformat: number, binary: interop.PointerConvertible, length: number): void;

export declare function glGetShaderPrecisionFormat(shadertype: number, precisiontype: number, range: interop.PointerConvertible, precision: interop.PointerConvertible): void;

export declare function glDepthRangef(n: number, f: number): void;

export declare function glClearDepthf(d: number): void;

export declare function glGetProgramBinary(program: number, bufSize: number, length: interop.PointerConvertible, binaryFormat: interop.PointerConvertible, binary: interop.PointerConvertible): void;

export declare function glProgramBinary(program: number, binaryFormat: number, binary: interop.PointerConvertible, length: number): void;

export declare function glProgramParameteri(program: number, pname: number, value: number): void;

export declare function glUseProgramStages(pipeline: number, stages: number, program: number): void;

export declare function glActiveShaderProgram(pipeline: number, program: number): void;

export declare function glCreateShaderProgramv(type: number, count: number, strings: interop.PointerConvertible): number;

export declare function glBindProgramPipeline(pipeline: number): void;

export declare function glDeleteProgramPipelines(n: number, pipelines: interop.PointerConvertible): void;

export declare function glGenProgramPipelines(n: number, pipelines: interop.PointerConvertible): void;

export declare function glIsProgramPipeline(pipeline: number): number;

export declare function glGetProgramPipelineiv(pipeline: number, pname: number, params: interop.PointerConvertible): void;

export declare function glProgramUniform1i(program: number, location: number, v0: number): void;

export declare function glProgramUniform1iv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform1f(program: number, location: number, v0: number): void;

export declare function glProgramUniform1fv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform1d(program: number, location: number, v0: number): void;

export declare function glProgramUniform1dv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform1ui(program: number, location: number, v0: number): void;

export declare function glProgramUniform1uiv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform2i(program: number, location: number, v0: number, v1: number): void;

export declare function glProgramUniform2iv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform2f(program: number, location: number, v0: number, v1: number): void;

export declare function glProgramUniform2fv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform2d(program: number, location: number, v0: number, v1: number): void;

export declare function glProgramUniform2dv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform2ui(program: number, location: number, v0: number, v1: number): void;

export declare function glProgramUniform2uiv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform3i(program: number, location: number, v0: number, v1: number, v2: number): void;

export declare function glProgramUniform3iv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform3f(program: number, location: number, v0: number, v1: number, v2: number): void;

export declare function glProgramUniform3fv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform3d(program: number, location: number, v0: number, v1: number, v2: number): void;

export declare function glProgramUniform3dv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform3ui(program: number, location: number, v0: number, v1: number, v2: number): void;

export declare function glProgramUniform3uiv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform4i(program: number, location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glProgramUniform4iv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform4f(program: number, location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glProgramUniform4fv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform4d(program: number, location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glProgramUniform4dv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniform4ui(program: number, location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glProgramUniform4uiv(program: number, location: number, count: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix2fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix3fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix4fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix2dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix3dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix4dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix2x3fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix3x2fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix2x4fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix4x2fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix3x4fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix4x3fv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix2x3dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix3x2dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix2x4dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix4x2dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix3x4dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glProgramUniformMatrix4x3dv(program: number, location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glValidateProgramPipeline(pipeline: number): void;

export declare function glGetProgramPipelineInfoLog(pipeline: number, bufSize: number, length: interop.PointerConvertible, infoLog: string): void;

export declare function glVertexAttribL1d(index: number, x: number): void;

export declare function glVertexAttribL2d(index: number, x: number, y: number): void;

export declare function glVertexAttribL3d(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttribL4d(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttribL1dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribL2dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribL3dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribL4dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribLPointer(index: number, size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glGetVertexAttribLdv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glViewportArrayv(first: number, count: number, v: interop.PointerConvertible): void;

export declare function glViewportIndexedf(index: number, x: number, y: number, w: number, h: number): void;

export declare function glViewportIndexedfv(index: number, v: interop.PointerConvertible): void;

export declare function glScissorArrayv(first: number, count: number, v: interop.PointerConvertible): void;

export declare function glScissorIndexed(index: number, left: number, bottom: number, width: number, height: number): void;

export declare function glScissorIndexedv(index: number, v: interop.PointerConvertible): void;

export declare function glDepthRangeArrayv(first: number, count: number, v: interop.PointerConvertible): void;

export declare function glDepthRangeIndexed(index: number, n: number, f: number): void;

export declare function glGetFloati_v(target: number, index: number, data: interop.PointerConvertible): void;

export declare function glGetDoublei_v(target: number, index: number, data: interop.PointerConvertible): void;

export declare function glBlendEquationiARB(buf: number, mode: number): void;

export declare function glBlendEquationSeparateiARB(buf: number, modeRGB: number, modeAlpha: number): void;

export declare function glBlendFunciARB(buf: number, src: number, dst: number): void;

export declare function glBlendFuncSeparateiARB(buf: number, srcRGB: number, dstRGB: number, srcAlpha: number, dstAlpha: number): void;

export declare function glVertexAttribDivisorARB(index: number, divisor: number): void;

export declare function glGetInternalformativ(target: number, internalformat: number, pname: number, bufSize: number, params: interop.PointerConvertible): void;

export declare function glMinSampleShadingARB(value: number): void;

export declare function glNamedStringARB(type: number, namelen: number, name: string, stringlen: number, string: string): void;

export declare function glDeleteNamedStringARB(namelen: number, name: string): void;

export declare function glCompileShaderIncludeARB(shader: number, count: number, path: interop.PointerConvertible, length: interop.PointerConvertible): void;

export declare function glIsNamedStringARB(namelen: number, name: string): number;

export declare function glGetNamedStringARB(namelen: number, name: string, bufSize: number, stringlen: interop.PointerConvertible, string: string): void;

export declare function glGetNamedStringivARB(namelen: number, name: string, pname: number, params: interop.PointerConvertible): void;

export declare function glTexStorage1D(target: number, levels: number, internalformat: number, width: number): void;

export declare function glTexStorage2D(target: number, levels: number, internalformat: number, width: number, height: number): void;

export declare function glTexStorage3D(target: number, levels: number, internalformat: number, width: number, height: number, depth: number): void;

export declare function glLabelObjectEXT(type: number, object: number, length: number, label: string): void;

export declare function glGetObjectLabelEXT(type: number, object: number, bufSize: number, length: interop.PointerConvertible, label: string): void;

export declare function glInsertEventMarkerEXT(length: number, marker: string): void;

export declare function glPushGroupMarkerEXT(length: number, marker: string): void;

export declare function glPopGroupMarkerEXT(): void;

export declare function glDepthBoundsEXT(zmin: number, zmax: number): void;

export declare function glFlushRenderAPPLE(): void;

export declare function glFinishRenderAPPLE(): void;

export declare function glSwapAPPLE(): void;

export declare function glObjectPurgeableAPPLE(objectType: number, name: number, option: number): number;

export declare function glObjectUnpurgeableAPPLE(objectType: number, name: number, option: number): number;

export declare function glGetObjectParameterivAPPLE(objectType: number, name: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTextureRangeAPPLE(target: number, length: number, pointer: interop.PointerConvertible): void;

export declare function glGetTexParameterPointervAPPLE(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTextureBarrierNV(): void;

export declare function glClampColorARB(target: number, clamp: number): void;

export declare function glDrawBuffersARB(n: number, bufs: interop.PointerConvertible): void;

export declare function glDrawElementsBaseVertex(mode: number, count: number, type: number, indices: interop.PointerConvertible, base_vertex: number): void;

export declare function glDrawRangeElementsBaseVertex(mode: number, start: number, end: number, count: number, type: number, indices: interop.PointerConvertible, base_vertex: number): void;

export declare function glDrawElementsInstancedBaseVertex(mode: number, count: number, type: number, indices: interop.PointerConvertible, primcount: number, base_vertex: number): void;

export declare function glMultiDrawElementsBaseVertex(mode: number, count: interop.PointerConvertible, type: number, indices: interop.PointerConvertible, primcount: number, base_vertex: interop.PointerConvertible): void;

export declare function glDrawArraysInstancedARB(mode: number, first: number, count: number, primcount: number): void;

export declare function glDrawElementsInstancedARB(mode: number, count: number, type: number, indices: interop.PointerConvertible, primcount: number): void;

export declare function glIsRenderbuffer(renderbuffer: number): number;

export declare function glBindRenderbuffer(target: number, renderbuffer: number): void;

export declare function glDeleteRenderbuffers(n: number, renderbuffers: interop.PointerConvertible): void;

export declare function glGenRenderbuffers(n: number, renderbuffers: interop.PointerConvertible): void;

export declare function glRenderbufferStorage(target: number, internalformat: number, width: number, height: number): void;

export declare function glGetRenderbufferParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glIsFramebuffer(framebuffer: number): number;

export declare function glBindFramebuffer(target: number, framebuffer: number): void;

export declare function glDeleteFramebuffers(n: number, framebuffers: interop.PointerConvertible): void;

export declare function glGenFramebuffers(n: number, framebuffers: interop.PointerConvertible): void;

export declare function glCheckFramebufferStatus(target: number): number;

export declare function glFramebufferTexture1D(target: number, attachment: number, textarget: number, texture: number, level: number): void;

export declare function glFramebufferTexture2D(target: number, attachment: number, textarget: number, texture: number, level: number): void;

export declare function glFramebufferTexture3D(target: number, attachment: number, textarget: number, texture: number, level: number, zoffset: number): void;

export declare function glFramebufferRenderbuffer(target: number, attachment: number, renderbuffertarget: number, renderbuffer: number): void;

export declare function glGetFramebufferAttachmentParameteriv(target: number, attachment: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGenerateMipmap(target: number): void;

export declare function glBlitFramebuffer(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number, dstX1: number, dstY1: number, mask: number, filter: number): void;

export declare function glRenderbufferStorageMultisample(target: number, samples: number, internalformat: number, width: number, height: number): void;

export declare function glFramebufferTextureLayer(target: number, attachment: number, texture: number, level: number, layer: number): void;

export declare function glVertexAttribDivisorARB(index: number, divisor: number): void;

export declare function glSampleCoverageARB(value: number, invert: number): void;

export declare function glActiveTextureARB(texture: number): void;

export declare function glClientActiveTextureARB(texture: number): void;

export declare function glMultiTexCoord1dARB(target: number, s: number): void;

export declare function glMultiTexCoord1dvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord1fARB(target: number, s: number): void;

export declare function glMultiTexCoord1fvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord1iARB(target: number, s: number): void;

export declare function glMultiTexCoord1ivARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord1sARB(target: number, s: number): void;

export declare function glMultiTexCoord1svARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2dARB(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2dvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2fARB(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2fvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2iARB(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2ivARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2sARB(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2svARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3dARB(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3dvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3fARB(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3fvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3iARB(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3ivARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3sARB(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3svARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4dARB(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4dvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4fARB(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4fvARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4iARB(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4ivARB(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4sARB(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4svARB(target: number, v: interop.PointerConvertible): void;

export declare function glGenQueriesARB(n: number, ids: interop.PointerConvertible): void;

export declare function glDeleteQueriesARB(n: number, ids: interop.PointerConvertible): void;

export declare function glIsQueryARB(id: number): number;

export declare function glBeginQueryARB(target: number, id: number): void;

export declare function glEndQueryARB(target: number): void;

export declare function glGetQueryivARB(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectivARB(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectuivARB(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glPointParameterfARB(pname: number, param: number): void;

export declare function glPointParameterfvARB(pname: number, params: interop.PointerConvertible): void;

export declare function glProvokingVertex(mode: number): void;

export declare function glDeleteObjectARB(obj: interop.PointerConvertible): void;

export declare function glGetHandleARB(pname: number): interop.Pointer;

export declare function glDetachObjectARB(containerObj: interop.PointerConvertible, attachedObj: interop.PointerConvertible): void;

export declare function glCreateShaderObjectARB(shaderType: number): interop.Pointer;

export declare function glShaderSourceARB(shaderObj: interop.PointerConvertible, count: number, string: interop.PointerConvertible, length: interop.PointerConvertible): void;

export declare function glCompileShaderARB(shaderObj: interop.PointerConvertible): void;

export declare function glCreateProgramObjectARB(): interop.Pointer;

export declare function glAttachObjectARB(containerObj: interop.PointerConvertible, obj: interop.PointerConvertible): void;

export declare function glLinkProgramARB(programObj: interop.PointerConvertible): void;

export declare function glUseProgramObjectARB(programObj: interop.PointerConvertible): void;

export declare function glValidateProgramARB(programObj: interop.PointerConvertible): void;

export declare function glUniform1fARB(location: number, v0: number): void;

export declare function glUniform2fARB(location: number, v0: number, v1: number): void;

export declare function glUniform3fARB(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4fARB(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1iARB(location: number, v0: number): void;

export declare function glUniform2iARB(location: number, v0: number, v1: number): void;

export declare function glUniform3iARB(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4iARB(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1fvARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2fvARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3fvARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4fvARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform1ivARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2ivARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3ivARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4ivARB(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2fvARB(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3fvARB(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4fvARB(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glGetObjectParameterfvARB(obj: interop.PointerConvertible, pname: number, params: interop.PointerConvertible): void;

export declare function glGetObjectParameterivARB(obj: interop.PointerConvertible, pname: number, params: interop.PointerConvertible): void;

export declare function glGetInfoLogARB(obj: interop.PointerConvertible, maxLength: number, length: interop.PointerConvertible, infoLog: string): void;

export declare function glGetAttachedObjectsARB(containerObj: interop.PointerConvertible, maxCount: number, count: interop.PointerConvertible, obj: interop.PointerConvertible): void;

export declare function glGetUniformLocationARB(programObj: interop.PointerConvertible, name: string): number;

export declare function glGetActiveUniformARB(programObj: interop.PointerConvertible, index: number, maxLength: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetUniformfvARB(programObj: interop.PointerConvertible, location: number, params: interop.PointerConvertible): void;

export declare function glGetUniformivARB(programObj: interop.PointerConvertible, location: number, params: interop.PointerConvertible): void;

export declare function glGetShaderSourceARB(obj: interop.PointerConvertible, maxLength: number, length: interop.PointerConvertible, source: string): void;

export declare function glFenceSync(condition: number, flags: number): interop.Pointer;

export declare function glIsSync(sync: interop.PointerConvertible): number;

export declare function glDeleteSync(sync: interop.PointerConvertible): void;

export declare function glClientWaitSync(sync: interop.PointerConvertible, flags: number, timeout: number): number;

export declare function glWaitSync(sync: interop.PointerConvertible, flags: number, timeout: number): void;

export declare function glGetInteger64v(pname: number, params: interop.PointerConvertible): void;

export declare function glGetSynciv(sync: interop.PointerConvertible, pname: number, bufSize: number, length: interop.PointerConvertible, values: interop.PointerConvertible): void;

export declare function glCompressedTexImage3DARB(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexImage2DARB(target: number, level: number, internalformat: number, width: number, height: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexImage1DARB(target: number, level: number, internalformat: number, width: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage3DARB(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, width: number, height: number, depth: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage2DARB(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage1DARB(target: number, level: number, xoffset: number, width: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glGetCompressedTexImageARB(target: number, level: number, data: interop.PointerConvertible): void;

export declare function glLoadTransposeMatrixfARB(m: interop.PointerConvertible): void;

export declare function glLoadTransposeMatrixdARB(m: interop.PointerConvertible): void;

export declare function glMultTransposeMatrixfARB(m: interop.PointerConvertible): void;

export declare function glMultTransposeMatrixdARB(m: interop.PointerConvertible): void;

export declare function glWeightbvARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightsvARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightivARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightfvARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightdvARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightubvARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightusvARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightuivARB(size: number, weights: interop.PointerConvertible): void;

export declare function glWeightPointerARB(size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glVertexBlendARB(count: number): void;

export declare function glBindBufferARB(target: number, buffer: number): void;

export declare function glDeleteBuffersARB(n: number, buffers: interop.PointerConvertible): void;

export declare function glGenBuffersARB(n: number, buffers: interop.PointerConvertible): void;

export declare function glIsBufferARB(buffer: number): number;

export declare function glBufferDataARB(target: number, size: number, data: interop.PointerConvertible, usage: number): void;

export declare function glBufferSubDataARB(target: number, offset: number, size: number, data: interop.PointerConvertible): void;

export declare function glGetBufferSubDataARB(target: number, offset: number, size: number, data: interop.PointerConvertible): void;

export declare function glMapBufferARB(target: number, access: number): interop.Pointer;

export declare function glUnmapBufferARB(target: number): number;

export declare function glGetBufferParameterivARB(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetBufferPointervARB(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBindProgramARB(target: number, program: number): void;

export declare function glDeleteProgramsARB(n: number, programs: interop.PointerConvertible): void;

export declare function glGenProgramsARB(n: number, programs: interop.PointerConvertible): void;

export declare function glIsProgramARB(program: number): number;

export declare function glProgramEnvParameter4dARB(target: number, index: number, x: number, y: number, z: number, w: number): void;

export declare function glProgramEnvParameter4dvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glProgramEnvParameter4fARB(target: number, index: number, x: number, y: number, z: number, w: number): void;

export declare function glProgramEnvParameter4fvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glProgramLocalParameter4dARB(target: number, index: number, x: number, y: number, z: number, w: number): void;

export declare function glProgramLocalParameter4dvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glProgramLocalParameter4fARB(target: number, index: number, x: number, y: number, z: number, w: number): void;

export declare function glProgramLocalParameter4fvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glGetProgramEnvParameterdvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glGetProgramEnvParameterfvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glProgramEnvParameters4fvEXT(target: number, index: number, count: number, params: interop.PointerConvertible): void;

export declare function glProgramLocalParameters4fvEXT(target: number, index: number, count: number, params: interop.PointerConvertible): void;

export declare function glGetProgramLocalParameterdvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glGetProgramLocalParameterfvARB(target: number, index: number, params: interop.PointerConvertible): void;

export declare function glProgramStringARB(target: number, format: number, len: number, string: interop.PointerConvertible): void;

export declare function glGetProgramStringARB(target: number, pname: number, string: interop.PointerConvertible): void;

export declare function glGetProgramivARB(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBindAttribLocationARB(programObj: interop.PointerConvertible, index: number, name: string): void;

export declare function glGetActiveAttribARB(programObj: interop.PointerConvertible, index: number, maxLength: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetAttribLocationARB(programObj: interop.PointerConvertible, name: string): number;

export declare function glVertexAttrib1dARB(index: number, x: number): void;

export declare function glVertexAttrib1dvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib1fARB(index: number, x: number): void;

export declare function glVertexAttrib1fvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib1sARB(index: number, x: number): void;

export declare function glVertexAttrib1svARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2dARB(index: number, x: number, y: number): void;

export declare function glVertexAttrib2dvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2fARB(index: number, x: number, y: number): void;

export declare function glVertexAttrib2fvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2sARB(index: number, x: number, y: number): void;

export declare function glVertexAttrib2svARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3dARB(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3dvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3fARB(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3fvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3sARB(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3svARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4NbvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4NivARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4NsvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4NubARB(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4NubvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4NuivARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4NusvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4bvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4dARB(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4dvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4fARB(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4fvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4ivARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4sARB(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4svARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4ubvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4uivARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4usvARB(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribPointerARB(index: number, size: number, type: number, normalized: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glDisableVertexAttribArrayARB(index: number): void;

export declare function glEnableVertexAttribArrayARB(index: number): void;

export declare function glGetVertexAttribPointervARB(index: number, pname: number, pointer: interop.PointerConvertible): void;

export declare function glGetVertexAttribdvARB(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribfvARB(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribivARB(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glWindowPos2dARB(x: number, y: number): void;

export declare function glWindowPos2dvARB(p: interop.PointerConvertible): void;

export declare function glWindowPos2fARB(x: number, y: number): void;

export declare function glWindowPos2fvARB(p: interop.PointerConvertible): void;

export declare function glWindowPos2iARB(x: number, y: number): void;

export declare function glWindowPos2ivARB(p: interop.PointerConvertible): void;

export declare function glWindowPos2sARB(x: number, y: number): void;

export declare function glWindowPos2svARB(p: interop.PointerConvertible): void;

export declare function glWindowPos3dARB(x: number, y: number, z: number): void;

export declare function glWindowPos3dvARB(p: interop.PointerConvertible): void;

export declare function glWindowPos3fARB(x: number, y: number, z: number): void;

export declare function glWindowPos3fvARB(p: interop.PointerConvertible): void;

export declare function glWindowPos3iARB(x: number, y: number, z: number): void;

export declare function glWindowPos3ivARB(p: interop.PointerConvertible): void;

export declare function glWindowPos3sARB(x: number, y: number, z: number): void;

export declare function glWindowPos3svARB(p: interop.PointerConvertible): void;

export declare function glUniformBufferEXT(program: number, location: number, buffer: number): void;

export declare function glGetUniformBufferSizeEXT(program: number, location: number): number;

export declare function glGetUniformOffsetEXT(program: number, location: number): number;

export declare function glBlendColorEXT(red: number, green: number, blue: number, alpha: number): void;

export declare function glBlendEquationSeparateEXT(modeRGB: number, modeAlpha: number): void;

export declare function glBlendFuncSeparateEXT(sfactorRGB: number, dfactorRGB: number, sfactorAlpha: number, dfactorAlpha: number): void;

export declare function glBlendEquationEXT(mode: number): void;

export declare function glLabelObjectEXT(type: number, object: number, length: number, label: string): void;

export declare function glGetObjectLabelEXT(type: number, object: number, bufSize: number, length: interop.PointerConvertible, label: string): void;

export declare function glInsertEventMarkerEXT(length: number, marker: string): void;

export declare function glPushGroupMarkerEXT(length: number, marker: string): void;

export declare function glPopGroupMarkerEXT(): void;

export declare function glDepthBoundsEXT(zmin: number, zmax: number): void;

export declare function glColorMaskIndexedEXT(index: number, r: number, g: number, b: number, a: number): void;

export declare function glEnableIndexedEXT(target: number, index: number): void;

export declare function glDisableIndexedEXT(target: number, index: number): void;

export declare function glIsEnabledIndexedEXT(target: number, index: number): number;

export declare function glDrawRangeElementsEXT(mode: number, start: number, end: number, count: number, type: number, indices: interop.PointerConvertible): void;

export declare function glFogCoordfEXT(coord: number): void;

export declare function glFogCoordfvEXT(coord: interop.PointerConvertible): void;

export declare function glFogCoorddEXT(coord: number): void;

export declare function glFogCoorddvEXT(coord: interop.PointerConvertible): void;

export declare function glFogCoordPointerEXT(type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glBlitFramebufferEXT(srcX0: number, srcY0: number, srcX1: number, srcY1: number, dstX0: number, dstY0: number, dstX1: number, dstY1: number, mask: number, filter: number): void;

export declare function glRenderbufferStorageMultisampleEXT(target: number, samples: number, internalformat: number, width: number, height: number): void;

export declare function glIsRenderbufferEXT(renderbuffer: number): number;

export declare function glBindRenderbufferEXT(target: number, renderbuffer: number): void;

export declare function glDeleteRenderbuffersEXT(n: number, renderbuffers: interop.PointerConvertible): void;

export declare function glGenRenderbuffersEXT(n: number, renderbuffers: interop.PointerConvertible): void;

export declare function glRenderbufferStorageEXT(target: number, internalformat: number, width: number, height: number): void;

export declare function glGetRenderbufferParameterivEXT(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glIsFramebufferEXT(framebuffer: number): number;

export declare function glBindFramebufferEXT(target: number, framebuffer: number): void;

export declare function glDeleteFramebuffersEXT(n: number, framebuffers: interop.PointerConvertible): void;

export declare function glGenFramebuffersEXT(n: number, framebuffers: interop.PointerConvertible): void;

export declare function glCheckFramebufferStatusEXT(target: number): number;

export declare function glFramebufferTexture1DEXT(target: number, attachment: number, textarget: number, texture: number, level: number): void;

export declare function glFramebufferTexture2DEXT(target: number, attachment: number, textarget: number, texture: number, level: number): void;

export declare function glFramebufferTexture3DEXT(target: number, attachment: number, textarget: number, texture: number, level: number, zoffset: number): void;

export declare function glFramebufferRenderbufferEXT(target: number, attachment: number, renderbuffertarget: number, renderbuffer: number): void;

export declare function glGetFramebufferAttachmentParameterivEXT(target: number, attachment: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGenerateMipmapEXT(target: number): void;

export declare function glProgramParameteriEXT(program: number, pname: number, value: number): void;

export declare function glFramebufferTextureEXT(target: number, attachment: number, texture: number, level: number): void;

export declare function glFramebufferTextureFaceEXT(target: number, attachment: number, texture: number, level: number, face: number): void;

export declare function glFramebufferTextureLayerEXT(target: number, attachment: number, texture: number, level: number, layer: number): void;

export declare function glVertexAttribI1iEXT(index: number, x: number): void;

export declare function glVertexAttribI2iEXT(index: number, x: number, y: number): void;

export declare function glVertexAttribI3iEXT(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttribI4iEXT(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttribI1uiEXT(index: number, x: number): void;

export declare function glVertexAttribI2uiEXT(index: number, x: number, y: number): void;

export declare function glVertexAttribI3uiEXT(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttribI4uiEXT(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttribI1ivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI2ivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI3ivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4ivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI1uivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI2uivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI3uivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4uivEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4bvEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4svEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4ubvEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribI4usvEXT(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribIPointerEXT(index: number, size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glGetVertexAttribIivEXT(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribIuivEXT(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glUniform1uiEXT(location: number, v0: number): void;

export declare function glUniform2uiEXT(location: number, v0: number, v1: number): void;

export declare function glUniform3uiEXT(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4uiEXT(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1uivEXT(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2uivEXT(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3uivEXT(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4uivEXT(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glGetUniformuivEXT(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glBindFragDataLocationEXT(program: number, colorNumber: number, name: string): void;

export declare function glGetFragDataLocationEXT(program: number, name: string): number;

export declare function glMultiDrawArraysEXT(mode: number, first: interop.PointerConvertible, count: interop.PointerConvertible, primcount: number): void;

export declare function glMultiDrawElementsEXT(mode: number, count: interop.PointerConvertible, type: number, indices: interop.PointerConvertible, primcount: number): void;

export declare function glProvokingVertexEXT(mode: number): void;

export declare function glSecondaryColor3bEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3bvEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3dEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3dvEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3fEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3fvEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3iEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3ivEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3sEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3svEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3ubEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3ubvEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3uiEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3uivEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3usEXT(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3usvEXT(v: interop.PointerConvertible): void;

export declare function glSecondaryColorPointerEXT(size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glActiveStencilFaceEXT(face: number): void;

export declare function glClearColorIiEXT(r: number, g: number, b: number, a: number): void;

export declare function glClearColorIuiEXT(r: number, g: number, b: number, a: number): void;

export declare function glTexParameterIivEXT(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexParameterIuivEXT(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameterIivEXT(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameterIuivEXT(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjecti64vEXT(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectui64vEXT(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBindBufferRangeEXT(target: number, index: number, buffer: number, offset: number, size: number): void;

export declare function glBindBufferOffsetEXT(target: number, index: number, buffer: number, offset: number): void;

export declare function glBindBufferBaseEXT(target: number, index: number, buffer: number): void;

export declare function glBeginTransformFeedbackEXT(primitiveMode: number): void;

export declare function glEndTransformFeedbackEXT(): void;

export declare function glTransformFeedbackVaryingsEXT(program: number, count: number, varyings: interop.PointerConvertible, bufferMode: number): void;

export declare function glGetTransformFeedbackVaryingEXT(program: number, index: number, bufSize: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetIntegerIndexedvEXT(param: number, index: number, values: interop.PointerConvertible): void;

export declare function glGetBooleanIndexedvEXT(param: number, index: number, values: interop.PointerConvertible): void;

export declare function glElementPointerAPPLE(type: number, pointer: interop.PointerConvertible): void;

export declare function glDrawElementArrayAPPLE(mode: number, first: number, count: number): void;

export declare function glDrawRangeElementArrayAPPLE(mode: number, start: number, end: number, first: number, count: number): void;

export declare function glMultiDrawElementArrayAPPLE(mode: number, first: interop.PointerConvertible, count: interop.PointerConvertible, primcount: number): void;

export declare function glMultiDrawRangeElementArrayAPPLE(mode: number, start: number, end: number, first: interop.PointerConvertible, count: interop.PointerConvertible, primcount: number): void;

export declare function glGenFencesAPPLE(n: number, fences: interop.PointerConvertible): void;

export declare function glDeleteFencesAPPLE(n: number, fences: interop.PointerConvertible): void;

export declare function glSetFenceAPPLE(fence: number): void;

export declare function glIsFenceAPPLE(fence: number): number;

export declare function glTestFenceAPPLE(fence: number): number;

export declare function glFinishFenceAPPLE(fence: number): void;

export declare function glTestObjectAPPLE(object: number, name: number): number;

export declare function glFinishObjectAPPLE(object: number, name: number): void;

export declare function glBufferParameteriAPPLE(target: number, pname: number, param: number): void;

export declare function glFlushMappedBufferRangeAPPLE(target: number, offset: number, size: number): void;

export declare function glFlushRenderAPPLE(): void;

export declare function glFinishRenderAPPLE(): void;

export declare function glSwapAPPLE(): void;

export declare function glObjectPurgeableAPPLE(objectType: number, name: number, option: number): number;

export declare function glObjectUnpurgeableAPPLE(objectType: number, name: number, option: number): number;

export declare function glGetObjectParameterivAPPLE(objectType: number, name: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTextureRangeAPPLE(target: number, length: number, pointer: interop.PointerConvertible): void;

export declare function glGetTexParameterPointervAPPLE(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBindVertexArrayAPPLE(id: number): void;

export declare function glDeleteVertexArraysAPPLE(n: number, ids: interop.PointerConvertible): void;

export declare function glGenVertexArraysAPPLE(n: number, ids: interop.PointerConvertible): void;

export declare function glIsVertexArrayAPPLE(id: number): number;

export declare function glVertexArrayRangeAPPLE(length: number, pointer: interop.PointerConvertible): void;

export declare function glFlushVertexArrayRangeAPPLE(length: number, pointer: interop.PointerConvertible): void;

export declare function glVertexArrayParameteriAPPLE(pname: number, param: number): void;

export declare function glPointSizePointerAPPLE(type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glVertexPointSizefAPPLE(size: number): void;

export declare function glEnableVertexAttribAPPLE(index: number, pname: number): void;

export declare function glDisableVertexAttribAPPLE(index: number, pname: number): void;

export declare function glIsVertexAttribEnabledAPPLE(index: number, pname: number): number;

export declare function glMapVertexAttrib1dAPPLE(index: number, size: number, u1: number, u2: number, stride: number, order: number, points: interop.PointerConvertible): void;

export declare function glMapVertexAttrib1fAPPLE(index: number, size: number, u1: number, u2: number, stride: number, order: number, points: interop.PointerConvertible): void;

export declare function glMapVertexAttrib2dAPPLE(index: number, size: number, u1: number, u2: number, ustride: number, uorder: number, v1: number, v2: number, vstride: number, vorder: number, points: interop.PointerConvertible): void;

export declare function glMapVertexAttrib2fAPPLE(index: number, size: number, u1: number, u2: number, ustride: number, uorder: number, v1: number, v2: number, vstride: number, vorder: number, points: interop.PointerConvertible): void;

export declare function glBlendEquationSeparateATI(equationRGB: number, equationAlpha: number): void;

export declare function glStencilOpSeparateATI(face: number, sfail: number, dpfail: number, dppass: number): void;

export declare function glStencilFuncSeparateATI(frontfunc: number, backfunc: number, ref: number, mask: number): void;

export declare function glBeginConditionalRenderNV(id: number, mode: number): void;

export declare function glEndConditionalRenderNV(): void;

export declare function glPointParameteriNV(pname: number, param: number): void;

export declare function glPointParameterivNV(pname: number, params: interop.PointerConvertible): void;

export declare function glTextureBarrierNV(): void;

export declare function glAccum(op: number, value: number): void;

export declare function glAlphaFunc(func: number, ref: number): void;

export declare function glAreTexturesResident(n: number, textures: interop.PointerConvertible, residences: interop.PointerConvertible): number;

export declare function glArrayElement(i: number): void;

export declare function glBegin(mode: number): void;

export declare function glBindTexture(target: number, texture: number): void;

export declare function glBitmap(width: number, height: number, xorig: number, yorig: number, xmove: number, ymove: number, bitmap: interop.PointerConvertible): void;

export declare function glBlendColor(red: number, green: number, blue: number, alpha: number): void;

export declare function glBlendEquation(mode: number): void;

export declare function glBlendEquationSeparate(modeRGB: number, modeAlpha: number): void;

export declare function glBlendFunc(sfactor: number, dfactor: number): void;

export declare function glCallList(list: number): void;

export declare function glCallLists(n: number, type: number, lists: interop.PointerConvertible): void;

export declare function glClear(mask: number): void;

export declare function glClearAccum(red: number, green: number, blue: number, alpha: number): void;

export declare function glClearColor(red: number, green: number, blue: number, alpha: number): void;

export declare function glClearDepth(depth: number): void;

export declare function glClearIndex(c: number): void;

export declare function glClearStencil(s: number): void;

export declare function glClipPlane(plane: number, equation: interop.PointerConvertible): void;

export declare function glColor3b(red: number, green: number, blue: number): void;

export declare function glColor3bv(v: interop.PointerConvertible): void;

export declare function glColor3d(red: number, green: number, blue: number): void;

export declare function glColor3dv(v: interop.PointerConvertible): void;

export declare function glColor3f(red: number, green: number, blue: number): void;

export declare function glColor3fv(v: interop.PointerConvertible): void;

export declare function glColor3i(red: number, green: number, blue: number): void;

export declare function glColor3iv(v: interop.PointerConvertible): void;

export declare function glColor3s(red: number, green: number, blue: number): void;

export declare function glColor3sv(v: interop.PointerConvertible): void;

export declare function glColor3ub(red: number, green: number, blue: number): void;

export declare function glColor3ubv(v: interop.PointerConvertible): void;

export declare function glColor3ui(red: number, green: number, blue: number): void;

export declare function glColor3uiv(v: interop.PointerConvertible): void;

export declare function glColor3us(red: number, green: number, blue: number): void;

export declare function glColor3usv(v: interop.PointerConvertible): void;

export declare function glColor4b(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4bv(v: interop.PointerConvertible): void;

export declare function glColor4d(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4dv(v: interop.PointerConvertible): void;

export declare function glColor4f(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4fv(v: interop.PointerConvertible): void;

export declare function glColor4i(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4iv(v: interop.PointerConvertible): void;

export declare function glColor4s(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4sv(v: interop.PointerConvertible): void;

export declare function glColor4ub(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4ubv(v: interop.PointerConvertible): void;

export declare function glColor4ui(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4uiv(v: interop.PointerConvertible): void;

export declare function glColor4us(red: number, green: number, blue: number, alpha: number): void;

export declare function glColor4usv(v: interop.PointerConvertible): void;

export declare function glColorMask(red: number, green: number, blue: number, alpha: number): void;

export declare function glColorMaterial(face: number, mode: number): void;

export declare function glColorPointer(size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glColorSubTable(target: number, start: number, count: number, format: number, type: number, data: interop.PointerConvertible): void;

export declare function glColorTable(target: number, internalformat: number, width: number, format: number, type: number, table: interop.PointerConvertible): void;

export declare function glColorTableParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glColorTableParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glConvolutionFilter1D(target: number, internalformat: number, width: number, format: number, type: number, image: interop.PointerConvertible): void;

export declare function glConvolutionFilter2D(target: number, internalformat: number, width: number, height: number, format: number, type: number, image: interop.PointerConvertible): void;

export declare function glConvolutionParameterf(target: number, pname: number, params: number): void;

export declare function glConvolutionParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glConvolutionParameteri(target: number, pname: number, params: number): void;

export declare function glConvolutionParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glCopyColorSubTable(target: number, start: number, x: number, y: number, width: number): void;

export declare function glCopyColorTable(target: number, internalformat: number, x: number, y: number, width: number): void;

export declare function glCopyConvolutionFilter1D(target: number, internalformat: number, x: number, y: number, width: number): void;

export declare function glCopyConvolutionFilter2D(target: number, internalformat: number, x: number, y: number, width: number, height: number): void;

export declare function glCopyPixels(x: number, y: number, width: number, height: number, type: number): void;

export declare function glCopyTexImage1D(target: number, level: number, internalformat: number, x: number, y: number, width: number, border: number): void;

export declare function glCopyTexImage2D(target: number, level: number, internalformat: number, x: number, y: number, width: number, height: number, border: number): void;

export declare function glCopyTexSubImage1D(target: number, level: number, xoffset: number, x: number, y: number, width: number): void;

export declare function glCopyTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, x: number, y: number, width: number, height: number): void;

export declare function glCopyTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, x: number, y: number, width: number, height: number): void;

export declare function glCullFace(mode: number): void;

export declare function glDeleteLists(list: number, range: number): void;

export declare function glDeleteTextures(n: number, textures: interop.PointerConvertible): void;

export declare function glDepthFunc(func: number): void;

export declare function glDepthMask(flag: number): void;

export declare function glDepthRange(zNear: number, zFar: number): void;

export declare function glDisable(cap: number): void;

export declare function glDisableClientState(array: number): void;

export declare function glDrawArrays(mode: number, first: number, count: number): void;

export declare function glDrawBuffer(mode: number): void;

export declare function glDrawElements(mode: number, count: number, type: number, indices: interop.PointerConvertible): void;

export declare function glDrawPixels(width: number, height: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glDrawRangeElements(mode: number, start: number, end: number, count: number, type: number, indices: interop.PointerConvertible): void;

export declare function glEdgeFlag(flag: number): void;

export declare function glEdgeFlagPointer(stride: number, pointer: interop.PointerConvertible): void;

export declare function glEdgeFlagv(flag: interop.PointerConvertible): void;

export declare function glEnable(cap: number): void;

export declare function glEnableClientState(array: number): void;

export declare function glEnd(): void;

export declare function glEndList(): void;

export declare function glEvalCoord1d(u: number): void;

export declare function glEvalCoord1dv(u: interop.PointerConvertible): void;

export declare function glEvalCoord1f(u: number): void;

export declare function glEvalCoord1fv(u: interop.PointerConvertible): void;

export declare function glEvalCoord2d(u: number, v: number): void;

export declare function glEvalCoord2dv(u: interop.PointerConvertible): void;

export declare function glEvalCoord2f(u: number, v: number): void;

export declare function glEvalCoord2fv(u: interop.PointerConvertible): void;

export declare function glEvalMesh1(mode: number, i1: number, i2: number): void;

export declare function glEvalMesh2(mode: number, i1: number, i2: number, j1: number, j2: number): void;

export declare function glEvalPoint1(i: number): void;

export declare function glEvalPoint2(i: number, j: number): void;

export declare function glFeedbackBuffer(size: number, type: number, buffer: interop.PointerConvertible): void;

export declare function glFinish(): void;

export declare function glFlush(): void;

export declare function glFogf(pname: number, param: number): void;

export declare function glFogfv(pname: number, params: interop.PointerConvertible): void;

export declare function glFogi(pname: number, param: number): void;

export declare function glFogiv(pname: number, params: interop.PointerConvertible): void;

export declare function glFrontFace(mode: number): void;

export declare function glFrustum(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): void;

export declare function glGenLists(range: number): number;

export declare function glGenTextures(n: number, textures: interop.PointerConvertible): void;

export declare function glGetBooleanv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetClipPlane(plane: number, equation: interop.PointerConvertible): void;

export declare function glGetColorTable(target: number, format: number, type: number, table: interop.PointerConvertible): void;

export declare function glGetColorTableParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetColorTableParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetConvolutionFilter(target: number, format: number, type: number, image: interop.PointerConvertible): void;

export declare function glGetConvolutionParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetConvolutionParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetDoublev(pname: number, params: interop.PointerConvertible): void;

export declare function glGetError(): number;

export declare function glGetFloatv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetHistogram(target: number, reset: number, format: number, type: number, values: interop.PointerConvertible): void;

export declare function glGetHistogramParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetHistogramParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetIntegerv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetLightfv(light: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetLightiv(light: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetMapdv(target: number, query: number, v: interop.PointerConvertible): void;

export declare function glGetMapfv(target: number, query: number, v: interop.PointerConvertible): void;

export declare function glGetMapiv(target: number, query: number, v: interop.PointerConvertible): void;

export declare function glGetMaterialfv(face: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetMaterialiv(face: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetMinmax(target: number, reset: number, format: number, type: number, values: interop.PointerConvertible): void;

export declare function glGetMinmaxParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetMinmaxParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetPixelMapfv(map: number, values: interop.PointerConvertible): void;

export declare function glGetPixelMapuiv(map: number, values: interop.PointerConvertible): void;

export declare function glGetPixelMapusv(map: number, values: interop.PointerConvertible): void;

export declare function glGetPointerv(pname: number, params: interop.PointerConvertible): void;

export declare function glGetPolygonStipple(mask: interop.PointerConvertible): void;

export declare function glGetSeparableFilter(target: number, format: number, type: number, row: interop.PointerConvertible, column: interop.PointerConvertible, span: interop.PointerConvertible): void;

export declare function glGetString(name: number): interop.Pointer;

export declare function glGetTexEnvfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexEnviv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexGendv(coord: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexGenfv(coord: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexGeniv(coord: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexImage(target: number, level: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glGetTexLevelParameterfv(target: number, level: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexLevelParameteriv(target: number, level: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetTexParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glHint(target: number, mode: number): void;

export declare function glHistogram(target: number, width: number, internalformat: number, sink: number): void;

export declare function glIndexMask(mask: number): void;

export declare function glIndexPointer(type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glIndexd(c: number): void;

export declare function glIndexdv(c: interop.PointerConvertible): void;

export declare function glIndexf(c: number): void;

export declare function glIndexfv(c: interop.PointerConvertible): void;

export declare function glIndexi(c: number): void;

export declare function glIndexiv(c: interop.PointerConvertible): void;

export declare function glIndexs(c: number): void;

export declare function glIndexsv(c: interop.PointerConvertible): void;

export declare function glIndexub(c: number): void;

export declare function glIndexubv(c: interop.PointerConvertible): void;

export declare function glInitNames(): void;

export declare function glInterleavedArrays(format: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glIsEnabled(cap: number): number;

export declare function glIsList(list: number): number;

export declare function glIsTexture(texture: number): number;

export declare function glLightModelf(pname: number, param: number): void;

export declare function glLightModelfv(pname: number, params: interop.PointerConvertible): void;

export declare function glLightModeli(pname: number, param: number): void;

export declare function glLightModeliv(pname: number, params: interop.PointerConvertible): void;

export declare function glLightf(light: number, pname: number, param: number): void;

export declare function glLightfv(light: number, pname: number, params: interop.PointerConvertible): void;

export declare function glLighti(light: number, pname: number, param: number): void;

export declare function glLightiv(light: number, pname: number, params: interop.PointerConvertible): void;

export declare function glLineStipple(factor: number, pattern: number): void;

export declare function glLineWidth(width: number): void;

export declare function glListBase(base: number): void;

export declare function glLoadIdentity(): void;

export declare function glLoadMatrixd(m: interop.PointerConvertible): void;

export declare function glLoadMatrixf(m: interop.PointerConvertible): void;

export declare function glLoadName(name: number): void;

export declare function glLogicOp(opcode: number): void;

export declare function glMap1d(target: number, u1: number, u2: number, stride: number, order: number, points: interop.PointerConvertible): void;

export declare function glMap1f(target: number, u1: number, u2: number, stride: number, order: number, points: interop.PointerConvertible): void;

export declare function glMap2d(target: number, u1: number, u2: number, ustride: number, uorder: number, v1: number, v2: number, vstride: number, vorder: number, points: interop.PointerConvertible): void;

export declare function glMap2f(target: number, u1: number, u2: number, ustride: number, uorder: number, v1: number, v2: number, vstride: number, vorder: number, points: interop.PointerConvertible): void;

export declare function glMapGrid1d(un: number, u1: number, u2: number): void;

export declare function glMapGrid1f(un: number, u1: number, u2: number): void;

export declare function glMapGrid2d(un: number, u1: number, u2: number, vn: number, v1: number, v2: number): void;

export declare function glMapGrid2f(un: number, u1: number, u2: number, vn: number, v1: number, v2: number): void;

export declare function glMaterialf(face: number, pname: number, param: number): void;

export declare function glMaterialfv(face: number, pname: number, params: interop.PointerConvertible): void;

export declare function glMateriali(face: number, pname: number, param: number): void;

export declare function glMaterialiv(face: number, pname: number, params: interop.PointerConvertible): void;

export declare function glMatrixMode(mode: number): void;

export declare function glMinmax(target: number, internalformat: number, sink: number): void;

export declare function glMultMatrixd(m: interop.PointerConvertible): void;

export declare function glMultMatrixf(m: interop.PointerConvertible): void;

export declare function glNewList(list: number, mode: number): void;

export declare function glNormal3b(nx: number, ny: number, nz: number): void;

export declare function glNormal3bv(v: interop.PointerConvertible): void;

export declare function glNormal3d(nx: number, ny: number, nz: number): void;

export declare function glNormal3dv(v: interop.PointerConvertible): void;

export declare function glNormal3f(nx: number, ny: number, nz: number): void;

export declare function glNormal3fv(v: interop.PointerConvertible): void;

export declare function glNormal3i(nx: number, ny: number, nz: number): void;

export declare function glNormal3iv(v: interop.PointerConvertible): void;

export declare function glNormal3s(nx: number, ny: number, nz: number): void;

export declare function glNormal3sv(v: interop.PointerConvertible): void;

export declare function glNormalPointer(type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glOrtho(left: number, right: number, bottom: number, top: number, zNear: number, zFar: number): void;

export declare function glPassThrough(token: number): void;

export declare function glPixelMapfv(map: number, mapsize: number, values: interop.PointerConvertible): void;

export declare function glPixelMapuiv(map: number, mapsize: number, values: interop.PointerConvertible): void;

export declare function glPixelMapusv(map: number, mapsize: number, values: interop.PointerConvertible): void;

export declare function glPixelStoref(pname: number, param: number): void;

export declare function glPixelStorei(pname: number, param: number): void;

export declare function glPixelTransferf(pname: number, param: number): void;

export declare function glPixelTransferi(pname: number, param: number): void;

export declare function glPixelZoom(xfactor: number, yfactor: number): void;

export declare function glPointSize(size: number): void;

export declare function glPolygonMode(face: number, mode: number): void;

export declare function glPolygonOffset(factor: number, units: number): void;

export declare function glPolygonStipple(mask: interop.PointerConvertible): void;

export declare function glPopAttrib(): void;

export declare function glPopClientAttrib(): void;

export declare function glPopMatrix(): void;

export declare function glPopName(): void;

export declare function glPrioritizeTextures(n: number, textures: interop.PointerConvertible, priorities: interop.PointerConvertible): void;

export declare function glPushAttrib(mask: number): void;

export declare function glPushClientAttrib(mask: number): void;

export declare function glPushMatrix(): void;

export declare function glPushName(name: number): void;

export declare function glRasterPos2d(x: number, y: number): void;

export declare function glRasterPos2dv(v: interop.PointerConvertible): void;

export declare function glRasterPos2f(x: number, y: number): void;

export declare function glRasterPos2fv(v: interop.PointerConvertible): void;

export declare function glRasterPos2i(x: number, y: number): void;

export declare function glRasterPos2iv(v: interop.PointerConvertible): void;

export declare function glRasterPos2s(x: number, y: number): void;

export declare function glRasterPos2sv(v: interop.PointerConvertible): void;

export declare function glRasterPos3d(x: number, y: number, z: number): void;

export declare function glRasterPos3dv(v: interop.PointerConvertible): void;

export declare function glRasterPos3f(x: number, y: number, z: number): void;

export declare function glRasterPos3fv(v: interop.PointerConvertible): void;

export declare function glRasterPos3i(x: number, y: number, z: number): void;

export declare function glRasterPos3iv(v: interop.PointerConvertible): void;

export declare function glRasterPos3s(x: number, y: number, z: number): void;

export declare function glRasterPos3sv(v: interop.PointerConvertible): void;

export declare function glRasterPos4d(x: number, y: number, z: number, w: number): void;

export declare function glRasterPos4dv(v: interop.PointerConvertible): void;

export declare function glRasterPos4f(x: number, y: number, z: number, w: number): void;

export declare function glRasterPos4fv(v: interop.PointerConvertible): void;

export declare function glRasterPos4i(x: number, y: number, z: number, w: number): void;

export declare function glRasterPos4iv(v: interop.PointerConvertible): void;

export declare function glRasterPos4s(x: number, y: number, z: number, w: number): void;

export declare function glRasterPos4sv(v: interop.PointerConvertible): void;

export declare function glReadBuffer(mode: number): void;

export declare function glReadPixels(x: number, y: number, width: number, height: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glRectd(x1: number, y1: number, x2: number, y2: number): void;

export declare function glRectdv(v1: interop.PointerConvertible, v2: interop.PointerConvertible): void;

export declare function glRectf(x1: number, y1: number, x2: number, y2: number): void;

export declare function glRectfv(v1: interop.PointerConvertible, v2: interop.PointerConvertible): void;

export declare function glRecti(x1: number, y1: number, x2: number, y2: number): void;

export declare function glRectiv(v1: interop.PointerConvertible, v2: interop.PointerConvertible): void;

export declare function glRects(x1: number, y1: number, x2: number, y2: number): void;

export declare function glRectsv(v1: interop.PointerConvertible, v2: interop.PointerConvertible): void;

export declare function glRenderMode(mode: number): number;

export declare function glResetHistogram(target: number): void;

export declare function glResetMinmax(target: number): void;

export declare function glRotated(angle: number, x: number, y: number, z: number): void;

export declare function glRotatef(angle: number, x: number, y: number, z: number): void;

export declare function glScaled(x: number, y: number, z: number): void;

export declare function glScalef(x: number, y: number, z: number): void;

export declare function glScissor(x: number, y: number, width: number, height: number): void;

export declare function glSelectBuffer(size: number, buffer: interop.PointerConvertible): void;

export declare function glSeparableFilter2D(target: number, internalformat: number, width: number, height: number, format: number, type: number, row: interop.PointerConvertible, column: interop.PointerConvertible): void;

export declare function glShadeModel(mode: number): void;

export declare function glStencilFunc(func: number, ref: number, mask: number): void;

export declare function glStencilMask(mask: number): void;

export declare function glStencilOp(fail: number, zfail: number, zpass: number): void;

export declare function glTexCoord1d(s: number): void;

export declare function glTexCoord1dv(v: interop.PointerConvertible): void;

export declare function glTexCoord1f(s: number): void;

export declare function glTexCoord1fv(v: interop.PointerConvertible): void;

export declare function glTexCoord1i(s: number): void;

export declare function glTexCoord1iv(v: interop.PointerConvertible): void;

export declare function glTexCoord1s(s: number): void;

export declare function glTexCoord1sv(v: interop.PointerConvertible): void;

export declare function glTexCoord2d(s: number, t: number): void;

export declare function glTexCoord2dv(v: interop.PointerConvertible): void;

export declare function glTexCoord2f(s: number, t: number): void;

export declare function glTexCoord2fv(v: interop.PointerConvertible): void;

export declare function glTexCoord2i(s: number, t: number): void;

export declare function glTexCoord2iv(v: interop.PointerConvertible): void;

export declare function glTexCoord2s(s: number, t: number): void;

export declare function glTexCoord2sv(v: interop.PointerConvertible): void;

export declare function glTexCoord3d(s: number, t: number, r: number): void;

export declare function glTexCoord3dv(v: interop.PointerConvertible): void;

export declare function glTexCoord3f(s: number, t: number, r: number): void;

export declare function glTexCoord3fv(v: interop.PointerConvertible): void;

export declare function glTexCoord3i(s: number, t: number, r: number): void;

export declare function glTexCoord3iv(v: interop.PointerConvertible): void;

export declare function glTexCoord3s(s: number, t: number, r: number): void;

export declare function glTexCoord3sv(v: interop.PointerConvertible): void;

export declare function glTexCoord4d(s: number, t: number, r: number, q: number): void;

export declare function glTexCoord4dv(v: interop.PointerConvertible): void;

export declare function glTexCoord4f(s: number, t: number, r: number, q: number): void;

export declare function glTexCoord4fv(v: interop.PointerConvertible): void;

export declare function glTexCoord4i(s: number, t: number, r: number, q: number): void;

export declare function glTexCoord4iv(v: interop.PointerConvertible): void;

export declare function glTexCoord4s(s: number, t: number, r: number, q: number): void;

export declare function glTexCoord4sv(v: interop.PointerConvertible): void;

export declare function glTexCoordPointer(size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glTexEnvf(target: number, pname: number, param: number): void;

export declare function glTexEnvfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexEnvi(target: number, pname: number, param: number): void;

export declare function glTexEnviv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexGend(coord: number, pname: number, param: number): void;

export declare function glTexGendv(coord: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexGenf(coord: number, pname: number, param: number): void;

export declare function glTexGenfv(coord: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexGeni(coord: number, pname: number, param: number): void;

export declare function glTexGeniv(coord: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexImage1D(target: number, level: number, internalformat: number, width: number, border: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexParameterf(target: number, pname: number, param: number): void;

export declare function glTexParameterfv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexParameteri(target: number, pname: number, param: number): void;

export declare function glTexParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glTexSubImage1D(target: number, level: number, xoffset: number, width: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, width: number, height: number, depth: number, format: number, type: number, pixels: interop.PointerConvertible): void;

export declare function glTranslated(x: number, y: number, z: number): void;

export declare function glTranslatef(x: number, y: number, z: number): void;

export declare function glVertex2d(x: number, y: number): void;

export declare function glVertex2dv(v: interop.PointerConvertible): void;

export declare function glVertex2f(x: number, y: number): void;

export declare function glVertex2fv(v: interop.PointerConvertible): void;

export declare function glVertex2i(x: number, y: number): void;

export declare function glVertex2iv(v: interop.PointerConvertible): void;

export declare function glVertex2s(x: number, y: number): void;

export declare function glVertex2sv(v: interop.PointerConvertible): void;

export declare function glVertex3d(x: number, y: number, z: number): void;

export declare function glVertex3dv(v: interop.PointerConvertible): void;

export declare function glVertex3f(x: number, y: number, z: number): void;

export declare function glVertex3fv(v: interop.PointerConvertible): void;

export declare function glVertex3i(x: number, y: number, z: number): void;

export declare function glVertex3iv(v: interop.PointerConvertible): void;

export declare function glVertex3s(x: number, y: number, z: number): void;

export declare function glVertex3sv(v: interop.PointerConvertible): void;

export declare function glVertex4d(x: number, y: number, z: number, w: number): void;

export declare function glVertex4dv(v: interop.PointerConvertible): void;

export declare function glVertex4f(x: number, y: number, z: number, w: number): void;

export declare function glVertex4fv(v: interop.PointerConvertible): void;

export declare function glVertex4i(x: number, y: number, z: number, w: number): void;

export declare function glVertex4iv(v: interop.PointerConvertible): void;

export declare function glVertex4s(x: number, y: number, z: number, w: number): void;

export declare function glVertex4sv(v: interop.PointerConvertible): void;

export declare function glVertexPointer(size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glViewport(x: number, y: number, width: number, height: number): void;

export declare function glSampleCoverage(value: number, invert: number): void;

export declare function glLoadTransposeMatrixf(m: interop.PointerConvertible): void;

export declare function glLoadTransposeMatrixd(m: interop.PointerConvertible): void;

export declare function glMultTransposeMatrixf(m: interop.PointerConvertible): void;

export declare function glMultTransposeMatrixd(m: interop.PointerConvertible): void;

export declare function glCompressedTexImage3D(target: number, level: number, internalformat: number, width: number, height: number, depth: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexImage2D(target: number, level: number, internalformat: number, width: number, height: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexImage1D(target: number, level: number, internalformat: number, width: number, border: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage3D(target: number, level: number, xoffset: number, yoffset: number, zoffset: number, width: number, height: number, depth: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage2D(target: number, level: number, xoffset: number, yoffset: number, width: number, height: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glCompressedTexSubImage1D(target: number, level: number, xoffset: number, width: number, format: number, imageSize: number, data: interop.PointerConvertible): void;

export declare function glGetCompressedTexImage(target: number, lod: number, img: interop.PointerConvertible): void;

export declare function glActiveTexture(texture: number): void;

export declare function glClientActiveTexture(texture: number): void;

export declare function glMultiTexCoord1d(target: number, s: number): void;

export declare function glMultiTexCoord1dv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord1f(target: number, s: number): void;

export declare function glMultiTexCoord1fv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord1i(target: number, s: number): void;

export declare function glMultiTexCoord1iv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord1s(target: number, s: number): void;

export declare function glMultiTexCoord1sv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2d(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2dv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2f(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2fv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2i(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2iv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord2s(target: number, s: number, t: number): void;

export declare function glMultiTexCoord2sv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3d(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3dv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3f(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3fv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3i(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3iv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord3s(target: number, s: number, t: number, r: number): void;

export declare function glMultiTexCoord3sv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4d(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4dv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4f(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4fv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4i(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4iv(target: number, v: interop.PointerConvertible): void;

export declare function glMultiTexCoord4s(target: number, s: number, t: number, r: number, q: number): void;

export declare function glMultiTexCoord4sv(target: number, v: interop.PointerConvertible): void;

export declare function glFogCoordf(coord: number): void;

export declare function glFogCoordfv(coord: interop.PointerConvertible): void;

export declare function glFogCoordd(coord: number): void;

export declare function glFogCoorddv(coord: interop.PointerConvertible): void;

export declare function glFogCoordPointer(type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glSecondaryColor3b(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3bv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3d(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3dv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3f(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3fv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3i(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3iv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3s(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3sv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3ub(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3ubv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3ui(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3uiv(v: interop.PointerConvertible): void;

export declare function glSecondaryColor3us(red: number, green: number, blue: number): void;

export declare function glSecondaryColor3usv(v: interop.PointerConvertible): void;

export declare function glSecondaryColorPointer(size: number, type: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glPointParameterf(pname: number, param: number): void;

export declare function glPointParameterfv(pname: number, params: interop.PointerConvertible): void;

export declare function glPointParameteri(pname: number, param: number): void;

export declare function glPointParameteriv(pname: number, params: interop.PointerConvertible): void;

export declare function glBlendFuncSeparate(srcRGB: number, dstRGB: number, srcAlpha: number, dstAlpha: number): void;

export declare function glMultiDrawArrays(mode: number, first: interop.PointerConvertible, count: interop.PointerConvertible, primcount: number): void;

export declare function glMultiDrawElements(mode: number, count: interop.PointerConvertible, type: number, indices: interop.PointerConvertible, primcount: number): void;

export declare function glWindowPos2d(x: number, y: number): void;

export declare function glWindowPos2dv(v: interop.PointerConvertible): void;

export declare function glWindowPos2f(x: number, y: number): void;

export declare function glWindowPos2fv(v: interop.PointerConvertible): void;

export declare function glWindowPos2i(x: number, y: number): void;

export declare function glWindowPos2iv(v: interop.PointerConvertible): void;

export declare function glWindowPos2s(x: number, y: number): void;

export declare function glWindowPos2sv(v: interop.PointerConvertible): void;

export declare function glWindowPos3d(x: number, y: number, z: number): void;

export declare function glWindowPos3dv(v: interop.PointerConvertible): void;

export declare function glWindowPos3f(x: number, y: number, z: number): void;

export declare function glWindowPos3fv(v: interop.PointerConvertible): void;

export declare function glWindowPos3i(x: number, y: number, z: number): void;

export declare function glWindowPos3iv(v: interop.PointerConvertible): void;

export declare function glWindowPos3s(x: number, y: number, z: number): void;

export declare function glWindowPos3sv(v: interop.PointerConvertible): void;

export declare function glGenQueries(n: number, ids: interop.PointerConvertible): void;

export declare function glDeleteQueries(n: number, ids: interop.PointerConvertible): void;

export declare function glIsQuery(id: number): number;

export declare function glBeginQuery(target: number, id: number): void;

export declare function glEndQuery(target: number): void;

export declare function glGetQueryiv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectiv(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetQueryObjectuiv(id: number, pname: number, params: interop.PointerConvertible): void;

export declare function glBindBuffer(target: number, buffer: number): void;

export declare function glDeleteBuffers(n: number, buffers: interop.PointerConvertible): void;

export declare function glGenBuffers(n: number, buffers: interop.PointerConvertible): void;

export declare function glIsBuffer(buffer: number): number;

export declare function glBufferData(target: number, size: number, data: interop.PointerConvertible, usage: number): void;

export declare function glBufferSubData(target: number, offset: number, size: number, data: interop.PointerConvertible): void;

export declare function glGetBufferSubData(target: number, offset: number, size: number, data: interop.PointerConvertible): void;

export declare function glMapBuffer(target: number, access: number): interop.Pointer;

export declare function glUnmapBuffer(target: number): number;

export declare function glGetBufferParameteriv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetBufferPointerv(target: number, pname: number, params: interop.PointerConvertible): void;

export declare function glDrawBuffers(n: number, bufs: interop.PointerConvertible): void;

export declare function glVertexAttrib1d(index: number, x: number): void;

export declare function glVertexAttrib1dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib1f(index: number, x: number): void;

export declare function glVertexAttrib1fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib1s(index: number, x: number): void;

export declare function glVertexAttrib1sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2d(index: number, x: number, y: number): void;

export declare function glVertexAttrib2dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2f(index: number, x: number, y: number): void;

export declare function glVertexAttrib2fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib2s(index: number, x: number, y: number): void;

export declare function glVertexAttrib2sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3d(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3f(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib3s(index: number, x: number, y: number, z: number): void;

export declare function glVertexAttrib3sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nbv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Niv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nsv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nub(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4Nubv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nuiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4Nusv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4bv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4d(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4dv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4f(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4fv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4iv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4s(index: number, x: number, y: number, z: number, w: number): void;

export declare function glVertexAttrib4sv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4ubv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4uiv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttrib4usv(index: number, v: interop.PointerConvertible): void;

export declare function glVertexAttribPointer(index: number, size: number, type: number, normalized: number, stride: number, pointer: interop.PointerConvertible): void;

export declare function glEnableVertexAttribArray(index: number): void;

export declare function glDisableVertexAttribArray(index: number): void;

export declare function glGetVertexAttribdv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribfv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribiv(index: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetVertexAttribPointerv(index: number, pname: number, pointer: interop.PointerConvertible): void;

export declare function glDeleteShader(shader: number): void;

export declare function glDetachShader(program: number, shader: number): void;

export declare function glCreateShader(type: number): number;

export declare function glShaderSource(shader: number, count: number, string: interop.PointerConvertible, length: interop.PointerConvertible): void;

export declare function glCompileShader(shader: number): void;

export declare function glCreateProgram(): number;

export declare function glAttachShader(program: number, shader: number): void;

export declare function glLinkProgram(program: number): void;

export declare function glUseProgram(program: number): void;

export declare function glDeleteProgram(program: number): void;

export declare function glValidateProgram(program: number): void;

export declare function glUniform1f(location: number, v0: number): void;

export declare function glUniform2f(location: number, v0: number, v1: number): void;

export declare function glUniform3f(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4f(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1i(location: number, v0: number): void;

export declare function glUniform2i(location: number, v0: number, v1: number): void;

export declare function glUniform3i(location: number, v0: number, v1: number, v2: number): void;

export declare function glUniform4i(location: number, v0: number, v1: number, v2: number, v3: number): void;

export declare function glUniform1fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4fv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform1iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform2iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform3iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniform4iv(location: number, count: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glIsShader(shader: number): number;

export declare function glIsProgram(program: number): number;

export declare function glGetShaderiv(shader: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetProgramiv(program: number, pname: number, params: interop.PointerConvertible): void;

export declare function glGetAttachedShaders(program: number, maxCount: number, count: interop.PointerConvertible, shaders: interop.PointerConvertible): void;

export declare function glGetShaderInfoLog(shader: number, bufSize: number, length: interop.PointerConvertible, infoLog: string): void;

export declare function glGetProgramInfoLog(program: number, bufSize: number, length: interop.PointerConvertible, infoLog: string): void;

export declare function glGetUniformLocation(program: number, name: string): number;

export declare function glGetActiveUniform(program: number, index: number, bufSize: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetUniformfv(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glGetUniformiv(program: number, location: number, params: interop.PointerConvertible): void;

export declare function glGetShaderSource(shader: number, bufSize: number, length: interop.PointerConvertible, source: string): void;

export declare function glBindAttribLocation(program: number, index: number, name: string): void;

export declare function glGetActiveAttrib(program: number, index: number, bufSize: number, length: interop.PointerConvertible, size: interop.PointerConvertible, type: interop.PointerConvertible, name: string): void;

export declare function glGetAttribLocation(program: number, name: string): number;

export declare function glStencilFuncSeparate(face: number, func: number, ref: number, mask: number): void;

export declare function glStencilOpSeparate(face: number, fail: number, zfail: number, zpass: number): void;

export declare function glStencilMaskSeparate(face: number, mask: number): void;

export declare function glUniformMatrix2x3fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3x2fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix2x4fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4x2fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix3x4fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function glUniformMatrix4x3fv(location: number, count: number, transpose: number, value: interop.PointerConvertible): void;

export declare function gluBeginCurve(nurb: interop.PointerConvertible): void;

export declare function gluBeginPolygon(tess: interop.PointerConvertible): void;

export declare function gluBeginSurface(nurb: interop.PointerConvertible): void;

export declare function gluBeginTrim(nurb: interop.PointerConvertible): void;

export declare function gluBuild1DMipmapLevels(target: number, internalFormat: number, width: number, format: number, type: number, level: number, base: number, max: number, data: interop.PointerConvertible): number;

export declare function gluBuild1DMipmaps(target: number, internalFormat: number, width: number, format: number, type: number, data: interop.PointerConvertible): number;

export declare function gluBuild2DMipmapLevels(target: number, internalFormat: number, width: number, height: number, format: number, type: number, level: number, base: number, max: number, data: interop.PointerConvertible): number;

export declare function gluBuild2DMipmaps(target: number, internalFormat: number, width: number, height: number, format: number, type: number, data: interop.PointerConvertible): number;

export declare function gluBuild3DMipmapLevels(target: number, internalFormat: number, width: number, height: number, depth: number, format: number, type: number, level: number, base: number, max: number, data: interop.PointerConvertible): number;

export declare function gluBuild3DMipmaps(target: number, internalFormat: number, width: number, height: number, depth: number, format: number, type: number, data: interop.PointerConvertible): number;

export declare function gluCheckExtension(extName: interop.PointerConvertible, extString: interop.PointerConvertible): number;

export declare function gluCylinder(quad: interop.PointerConvertible, base: number, top: number, height: number, slices: number, stacks: number): void;

export declare function gluDeleteNurbsRenderer(nurb: interop.PointerConvertible): void;

export declare function gluDeleteQuadric(quad: interop.PointerConvertible): void;

export declare function gluDeleteTess(tess: interop.PointerConvertible): void;

export declare function gluDisk(quad: interop.PointerConvertible, inner: number, outer: number, slices: number, loops: number): void;

export declare function gluEndCurve(nurb: interop.PointerConvertible): void;

export declare function gluEndPolygon(tess: interop.PointerConvertible): void;

export declare function gluEndSurface(nurb: interop.PointerConvertible): void;

export declare function gluEndTrim(nurb: interop.PointerConvertible): void;

export declare function gluErrorString(error: number): interop.Pointer;

export declare function gluGetNurbsProperty(nurb: interop.PointerConvertible, property: number, data: interop.PointerConvertible): void;

export declare function gluGetString(name: number): interop.Pointer;

export declare function gluGetTessProperty(tess: interop.PointerConvertible, which: number, data: interop.PointerConvertible): void;

export declare function gluLoadSamplingMatrices(nurb: interop.PointerConvertible, model: interop.PointerConvertible, perspective: interop.PointerConvertible, view: interop.PointerConvertible): void;

export declare function gluLookAt(eyeX: number, eyeY: number, eyeZ: number, centerX: number, centerY: number, centerZ: number, upX: number, upY: number, upZ: number): void;

export declare function gluNewNurbsRenderer(): interop.Pointer;

export declare function gluNewQuadric(): interop.Pointer;

export declare function gluNewTess(): interop.Pointer;

export declare function gluNextContour(tess: interop.PointerConvertible, type: number): void;

export declare function gluNurbsCallback(nurb: interop.PointerConvertible, which: number, CallBackFunc: () => void): void;

export declare function gluNurbsCallbackData(nurb: interop.PointerConvertible, userData: interop.PointerConvertible): void;

export declare function gluNurbsCallbackDataEXT(nurb: interop.PointerConvertible, userData: interop.PointerConvertible): void;

export declare function gluNurbsCurve(nurb: interop.PointerConvertible, knotCount: number, knots: interop.PointerConvertible, stride: number, control: interop.PointerConvertible, order: number, type: number): void;

export declare function gluNurbsProperty(nurb: interop.PointerConvertible, property: number, value: number): void;

export declare function gluNurbsSurface(nurb: interop.PointerConvertible, sKnotCount: number, sKnots: interop.PointerConvertible, tKnotCount: number, tKnots: interop.PointerConvertible, sStride: number, tStride: number, control: interop.PointerConvertible, sOrder: number, tOrder: number, type: number): void;

export declare function gluOrtho2D(left: number, right: number, bottom: number, top: number): void;

export declare function gluPartialDisk(quad: interop.PointerConvertible, inner: number, outer: number, slices: number, loops: number, start: number, sweep: number): void;

export declare function gluPerspective(fovy: number, aspect: number, zNear: number, zFar: number): void;

export declare function gluPickMatrix(x: number, y: number, delX: number, delY: number, viewport: interop.PointerConvertible): void;

export declare function gluProject(objX: number, objY: number, objZ: number, model: interop.PointerConvertible, proj: interop.PointerConvertible, view: interop.PointerConvertible, winX: interop.PointerConvertible, winY: interop.PointerConvertible, winZ: interop.PointerConvertible): number;

export declare function gluPwlCurve(nurb: interop.PointerConvertible, count: number, data: interop.PointerConvertible, stride: number, type: number): void;

export declare function gluQuadricCallback(quad: interop.PointerConvertible, which: number, CallBackFunc: () => void): void;

export declare function gluQuadricDrawStyle(quad: interop.PointerConvertible, draw: number): void;

export declare function gluQuadricNormals(quad: interop.PointerConvertible, normal: number): void;

export declare function gluQuadricOrientation(quad: interop.PointerConvertible, orientation: number): void;

export declare function gluQuadricTexture(quad: interop.PointerConvertible, texture: number): void;

export declare function gluScaleImage(format: number, wIn: number, hIn: number, typeIn: number, dataIn: interop.PointerConvertible, wOut: number, hOut: number, typeOut: number, dataOut: interop.PointerConvertible): number;

export declare function gluSphere(quad: interop.PointerConvertible, radius: number, slices: number, stacks: number): void;

export declare function gluTessBeginContour(tess: interop.PointerConvertible): void;

export declare function gluTessBeginPolygon(tess: interop.PointerConvertible, data: interop.PointerConvertible): void;

export declare function gluTessCallback(tess: interop.PointerConvertible, which: number, CallBackFunc: () => void): void;

export declare function gluTessEndContour(tess: interop.PointerConvertible): void;

export declare function gluTessEndPolygon(tess: interop.PointerConvertible): void;

export declare function gluTessNormal(tess: interop.PointerConvertible, valueX: number, valueY: number, valueZ: number): void;

export declare function gluTessProperty(tess: interop.PointerConvertible, which: number, data: number): void;

export declare function gluTessVertex(tess: interop.PointerConvertible, location: interop.PointerConvertible, data: interop.PointerConvertible): void;

export declare function gluUnProject(winX: number, winY: number, winZ: number, model: interop.PointerConvertible, proj: interop.PointerConvertible, view: interop.PointerConvertible, objX: interop.PointerConvertible, objY: interop.PointerConvertible, objZ: interop.PointerConvertible): number;

export declare function gluUnProject4(winX: number, winY: number, winZ: number, clipW: number, model: interop.PointerConvertible, proj: interop.PointerConvertible, view: interop.PointerConvertible, nearPlane: number, farPlane: number, objX: interop.PointerConvertible, objY: interop.PointerConvertible, objZ: interop.PointerConvertible, objW: interop.PointerConvertible): number;

export declare function gluBuild1DMipmapsCTX(ctx: interop.PointerConvertible, target: number, internalFormat: number, width: number, format: number, type: number, data: interop.PointerConvertible): number;

export declare function gluBuild2DMipmapsCTX(ctx: interop.PointerConvertible, target: number, internalFormat: number, width: number, height: number, format: number, type: number, data: interop.PointerConvertible): number;

export declare function gluBuild3DMipmapsCTX(ctx: interop.PointerConvertible, target: number, internalFormat: number, width: number, height: number, depth: number, format: number, type: number, data: interop.PointerConvertible): number;

export declare function gluBuild1DMipmapLevelsCTX(ctx: interop.PointerConvertible, target: number, internalFormat: number, width: number, format: number, type: number, level: number, base: number, max: number, data: interop.PointerConvertible): number;

export declare function gluBuild2DMipmapLevelsCTX(ctx: interop.PointerConvertible, target: number, internalFormat: number, width: number, height: number, format: number, type: number, level: number, base: number, max: number, data: interop.PointerConvertible): number;

export declare function gluBuild3DMipmapLevelsCTX(ctx: interop.PointerConvertible, target: number, internalFormat: number, width: number, height: number, depth: number, format: number, type: number, level: number, base: number, max: number, data: interop.PointerConvertible): number;

export declare function gluLookAtCTX(ctx: interop.PointerConvertible, eyeX: number, eyeY: number, eyeZ: number, centerX: number, centerY: number, centerZ: number, upX: number, upY: number, upZ: number): void;

export declare function gluNewNurbsRendererCTX(ctx: interop.PointerConvertible): interop.Pointer;

export declare function gluNewQuadricCTX(ctx: interop.PointerConvertible): interop.Pointer;

export declare function gluNewTessCTX(ctx: interop.PointerConvertible): interop.Pointer;

export declare function gluOrtho2DCTX(ctx: interop.PointerConvertible, left: number, right: number, bottom: number, top: number): void;

export declare function gluPerspectiveCTX(ctx: interop.PointerConvertible, fovy: number, aspect: number, zNear: number, zFar: number): void;

export declare function gluPickMatrixCTX(ctx: interop.PointerConvertible, x: number, y: number, delX: number, delY: number, viewport: interop.PointerConvertible): void;

export declare function gluScaleImageCTX(ctx: interop.PointerConvertible, format: number, wIn: number, hIn: number, typeIn: number, dataIn: interop.PointerConvertible, wOut: number, hOut: number, typeOut: number, dataOut: interop.PointerConvertible): number;

export declare function gluCylinderCTX(ctx: interop.PointerConvertible, qobj: interop.PointerConvertible, baseRadiusd: number, topRadiusd: number, heightd: number, slices: number, stacks: number): void;

export declare function gluDiskCTX(ctx: interop.PointerConvertible, qobj: interop.PointerConvertible, innerRadiusd: number, outerRadiusd: number, slices: number, loops: number): void;

export declare function gluPartialDiskCTX(ctx: interop.PointerConvertible, qobj: interop.PointerConvertible, innerRadiusd: number, outerRadiusd: number, slices: number, loops: number, startAngled: number, sweepAngled: number): void;

export declare function gluSphereCTX(ctx: interop.PointerConvertible, qobj: interop.PointerConvertible, radiusd: number, slices: number, stacks: number): void;
