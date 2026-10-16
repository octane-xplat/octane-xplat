import type { simd_float4x4 } from './Runtime'

import type { interop } from './objc-runtime'

export declare class cp_drawable_array {
	constructor(init?: cp_drawable_array)
}

export declare class cp_drawable {
	constructor(init?: cp_drawable)
}

export declare class cp_drawable_render_context {
	constructor(init?: cp_drawable_render_context)
}

export declare class cp_view {
	constructor(init?: cp_view)
}

export declare class cp_view_texture_map {
	constructor(init?: cp_view_texture_map)
}

export declare class cp_frame_timing {
	constructor(init?: cp_frame_timing)
}

export declare class cp_tracking_area {
	constructor(init?: cp_tracking_area)
}

export declare class cp_hover_effect {
	constructor(init?: cp_hover_effect)
}

export declare class cp_frame {
	constructor(init?: cp_frame)
}

export declare class cp_texture_topology {
	constructor(init?: cp_texture_topology)
}

export declare function cp_layer_renderer_configuration_get_supports_mtl4(
	configuration: CP_OBJECT_cp_layer_renderer_configuration,
): boolean

export declare function cp_frame_monocular_frustum_matrix(
	frame: interop.PointerConvertible,
	normalized_device_coordinates_convension: interop.Enum<typeof cp_axis_direction_convention>,
	view_index: number,
	increase_tangents: unknown /* ext vector */,
	depth_range: unknown /* ext vector */,
): simd_float4x4

export declare function cp_frame_binocular_frustum_matrix(
	frame: interop.PointerConvertible,
	convention: interop.Enum<typeof cp_axis_direction_convention>,
	increase_tangents: unknown /* ext vector */,
	depth_range: unknown /* ext vector */,
): simd_float4x4
