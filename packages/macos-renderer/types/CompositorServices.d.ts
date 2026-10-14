/// <reference types="@nativescript/objc-node-api" />

declare class cp_drawable_array {
  constructor(init?: cp_drawable_array);
}

declare class cp_drawable {
  constructor(init?: cp_drawable);
}

declare class cp_drawable_render_context {
  constructor(init?: cp_drawable_render_context);
}

declare class cp_view {
  constructor(init?: cp_view);
}

declare class cp_view_texture_map {
  constructor(init?: cp_view_texture_map);
}

declare class cp_frame_timing {
  constructor(init?: cp_frame_timing);
}

declare class cp_tracking_area {
  constructor(init?: cp_tracking_area);
}

declare class cp_hover_effect {
  constructor(init?: cp_hover_effect);
}

declare class cp_frame {
  constructor(init?: cp_frame);
}

declare class cp_texture_topology {
  constructor(init?: cp_texture_topology);
}

declare function cp_layer_renderer_configuration_get_supports_mtl4(configuration: CP_OBJECT_cp_layer_renderer_configuration): boolean;

declare function cp_frame_monocular_frustum_matrix(frame: interop.PointerConvertible, normalized_device_coordinates_convension: interop.Enum<typeof cp_axis_direction_convention>, view_index: number, increase_tangents: unknown /* ext vector */, depth_range: unknown /* ext vector */): simd_float4x4;

declare function cp_frame_binocular_frustum_matrix(frame: interop.PointerConvertible, convention: interop.Enum<typeof cp_axis_direction_convention>, increase_tangents: unknown /* ext vector */, depth_range: unknown /* ext vector */): simd_float4x4;

