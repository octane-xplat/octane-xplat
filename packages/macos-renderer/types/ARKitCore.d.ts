/// <reference types="@nativescript/objc-node-api" />

declare const ar_world_anchor_sharing_availability_t: {
	ar_world_anchor_sharing_availability_available: 0
	ar_world_anchor_sharing_availability_unavailable: 1
}

declare const ar_hand_chirality_t: {
	ar_hand_chirality_right: 0
	ar_hand_chirality_left: 1
}

declare const ar_hand_anchor_query_status_t: {
	ar_hand_anchor_query_status_success: 0
	ar_hand_anchor_query_status_failure: 1
}

declare const ar_hand_skeleton_joint_name_t: {
	ar_hand_skeleton_joint_name_wrist: 0
	ar_hand_skeleton_joint_name_thumb_knuckle: 1
	ar_hand_skeleton_joint_name_thumb_intermediate_base: 2
	ar_hand_skeleton_joint_name_thumb_intermediate_tip: 3
	ar_hand_skeleton_joint_name_thumb_tip: 4
	ar_hand_skeleton_joint_name_index_finger_metacarpal: 5
	ar_hand_skeleton_joint_name_index_finger_knuckle: 6
	ar_hand_skeleton_joint_name_index_finger_intermediate_base: 7
	ar_hand_skeleton_joint_name_index_finger_intermediate_tip: 8
	ar_hand_skeleton_joint_name_index_finger_tip: 9
	ar_hand_skeleton_joint_name_middle_finger_metacarpal: 10
	ar_hand_skeleton_joint_name_middle_finger_knuckle: 11
	ar_hand_skeleton_joint_name_middle_finger_intermediate_base: 12
	ar_hand_skeleton_joint_name_middle_finger_intermediate_tip: 13
	ar_hand_skeleton_joint_name_middle_finger_tip: 14
	ar_hand_skeleton_joint_name_ring_finger_metacarpal: 15
	ar_hand_skeleton_joint_name_ring_finger_knuckle: 16
	ar_hand_skeleton_joint_name_ring_finger_intermediate_base: 17
	ar_hand_skeleton_joint_name_ring_finger_intermediate_tip: 18
	ar_hand_skeleton_joint_name_ring_finger_tip: 19
	ar_hand_skeleton_joint_name_little_finger_metacarpal: 20
	ar_hand_skeleton_joint_name_little_finger_knuckle: 21
	ar_hand_skeleton_joint_name_little_finger_intermediate_base: 22
	ar_hand_skeleton_joint_name_little_finger_intermediate_tip: 23
	ar_hand_skeleton_joint_name_little_finger_tip: 24
	ar_hand_skeleton_joint_name_forearm_wrist: 25
	ar_hand_skeleton_joint_name_forearm_arm: 26
}

declare const ar_transform_correction_t: {
	ar_transform_correction_none: 0
	ar_transform_correction_rendered: 1
}

declare const ar_session_error_code_t: {
	ar_session_error_code_data_provider_not_authorized: 100
	ar_session_error_code_data_provider_failed_to_run: 101
}

declare const ar_authorization_status_t: {
	ar_authorization_status_not_determined: 0
	ar_authorization_status_allowed: 1
	ar_authorization_status_denied: 2
}

declare const ar_device_anchor_tracking_state_t: {
	ar_device_anchor_tracking_state_untracked: 0
	ar_device_anchor_tracking_state_orientation_tracked: 1
	ar_device_anchor_tracking_state_tracked: 2
}

declare const ar_hand_fidelity_t: {
	ar_hand_fidelity_nominal: 0
	ar_hand_fidelity_high: 1
}

declare const ar_data_provider_state_t: {
	ar_data_provider_state_initialized: 0
	ar_data_provider_state_running: 1
	ar_data_provider_state_paused: 2
	ar_data_provider_state_stopped: 3
}

declare const ar_authorization_type_t: {
	ar_authorization_type_none: 0
	ar_authorization_type_hand_tracking: 1
	ar_authorization_type_world_sensing: 2
	ar_authorization_type_camera_access: 8
	ar_authorization_type_accessory_tracking: 32
}

declare const ar_device_anchor_query_status_t: {
	ar_device_anchor_query_status_success: 0
	ar_device_anchor_query_status_failure: 1
}

declare const ar_world_tracking_error_code_t: {
	ar_world_tracking_error_code_add_anchor_failed: 200
	ar_world_tracking_error_code_anchor_max_limit_reached: 201
	ar_world_tracking_error_code_remove_anchor_failed: 202
}

declare function ar_retain(object: interop.PointerConvertible): interop.Pointer

declare function ar_release(object: interop.PointerConvertible): void

declare interface OS_ar_world_tracking_provider extends OS_ar_data_provider {}

declare class OS_ar_world_tracking_provider
	extends NativeObject
	implements OS_ar_world_tracking_provider {}

declare interface OS_ar_world_tracking_configuration extends NSObjectProtocol {}

declare class OS_ar_world_tracking_configuration
	extends NativeObject
	implements OS_ar_world_tracking_configuration {}

declare interface OS_ar_world_anchor extends OS_ar_trackable_anchor {}

declare class OS_ar_world_anchor extends NativeObject implements OS_ar_world_anchor {}

declare interface OS_ar_hand_tracking_configuration extends NSObjectProtocol {}

declare class OS_ar_hand_tracking_configuration
	extends NativeObject
	implements OS_ar_hand_tracking_configuration {}

declare interface OS_ar_hand_anchor extends OS_ar_trackable_anchor {}

declare class OS_ar_hand_anchor extends NativeObject implements OS_ar_hand_anchor {}

declare interface OS_ar_data extends NSObjectProtocol {}

declare class OS_ar_data extends NativeObject implements OS_ar_data {}

declare interface OS_ar_strings extends NSObjectProtocol {}

declare class OS_ar_strings extends NativeObject implements OS_ar_strings {}

declare interface OS_ar_session extends NSObjectProtocol {}

declare class OS_ar_session extends NativeObject implements OS_ar_session {}

declare interface OS_ar_device extends NSObjectProtocol {}

declare class OS_ar_device extends NativeObject implements OS_ar_device {}

declare interface OS_ar_error extends NSObjectProtocol {}

declare class OS_ar_error extends NativeObject implements OS_ar_error {}

declare interface OS_ar_trackable_anchor extends OS_ar_anchor {}

declare class OS_ar_trackable_anchor extends NativeObject implements OS_ar_trackable_anchor {}

declare interface OS_ar_anchor extends NSObjectProtocol {}

declare class OS_ar_anchor extends NativeObject implements OS_ar_anchor {}

declare interface OS_ar_data_provider extends NSObjectProtocol {}

declare class OS_ar_data_provider extends NativeObject implements OS_ar_data_provider {}

declare interface OS_ar_authorization_results extends NSObjectProtocol {}

declare class OS_ar_authorization_results
	extends NativeObject
	implements OS_ar_authorization_results {}

declare interface OS_ar_hand_tracking_provider extends OS_ar_data_provider {}

declare class OS_ar_hand_tracking_provider
	extends NativeObject
	implements OS_ar_hand_tracking_provider {}

declare interface OS_ar_data_providers extends NSObjectProtocol {}

declare class OS_ar_data_providers extends NativeObject implements OS_ar_data_providers {}

declare interface OS_ar_hand_skeleton extends NSObjectProtocol {}

declare class OS_ar_hand_skeleton extends NativeObject implements OS_ar_hand_skeleton {}

declare interface OS_ar_device_anchor extends OS_ar_trackable_anchor {}

declare class OS_ar_device_anchor extends NativeObject implements OS_ar_device_anchor {}

declare interface OS_ar_world_anchors extends NSObjectProtocol {}

declare class OS_ar_world_anchors extends NativeObject implements OS_ar_world_anchors {}

declare interface OS_ar_authorization_result extends NSObjectProtocol {}

declare class OS_ar_authorization_result
	extends NativeObject
	implements OS_ar_authorization_result {}

declare interface OS_ar_skeleton_joint extends NSObjectProtocol {}

declare class OS_ar_skeleton_joint extends NativeObject implements OS_ar_skeleton_joint {}
