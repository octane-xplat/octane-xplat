import type { NSObject, NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NativeObject } from './objc-runtime'

export declare const _nw_content_context_default_message: NSObject

export declare const kNWErrorDomainPOSIX: interop.Pointer

export declare const nw_browse_result_change_result_removed: number

export declare const nw_browse_result_change_invalid: number

export declare const _nw_parameters_configure_protocol_default_configuration: (p1: NSObject) => void

export declare const _nw_connection_send_idempotent_content: (p1: NSObject) => void

export declare const nw_browse_result_change_identical: number

export declare const _nw_content_context_default_stream: NSObject

export declare const _nw_parameters_configure_protocol_disable: (p1: NSObject) => void

export declare const kNWErrorDomainDNS: interop.Pointer

export declare const nw_browse_result_change_interface_added: number

export declare const _nw_data_transfer_report_all_paths: number

export declare const nw_browse_result_change_result_added: number

export declare const _nw_content_context_final_send: NSObject

export declare const nw_browse_result_change_txt_record_changed: number

export declare const _nw_privacy_context_default_context: NSObject

export declare const kNWErrorDomainTLS: interop.Pointer

export declare const nw_browse_result_change_interface_removed: number

export declare const nw_ws_opcode_t: {
	nw_ws_opcode_invalid: -1
	nw_ws_opcode_cont: 0
	nw_ws_opcode_text: 1
	nw_ws_opcode_binary: 2
	nw_ws_opcode_close: 8
	nw_ws_opcode_ping: 9
	nw_ws_opcode_pong: 10
}

export declare const nw_connection_group_state_t: {
	nw_connection_group_state_invalid: 0
	nw_connection_group_state_waiting: 1
	nw_connection_group_state_ready: 2
	nw_connection_group_state_failed: 3
	nw_connection_group_state_cancelled: 4
}

export declare const nw_path_status_t: {
	nw_path_status_invalid: 0
	nw_path_status_satisfied: 1
	nw_path_status_unsatisfied: 2
	nw_path_status_satisfiable: 3
}

export declare const nw_ws_response_status_t: {
	nw_ws_response_status_invalid: 0
	nw_ws_response_status_accept: 1
	nw_ws_response_status_reject: 2
}

export declare const nw_listener_state_t: {
	nw_listener_state_invalid: 0
	nw_listener_state_waiting: 1
	nw_listener_state_ready: 2
	nw_listener_state_failed: 3
	nw_listener_state_cancelled: 4
}

export declare const nw_ip_version_t: {
	nw_ip_version_any: 0
	nw_ip_version_4: 4
	nw_ip_version_6: 6
}

export declare const nw_report_resolution_protocol_t: {
	nw_report_resolution_protocol_unknown: 0
	nw_report_resolution_protocol_udp: 1
	nw_report_resolution_protocol_tcp: 2
	nw_report_resolution_protocol_tls: 3
	nw_report_resolution_protocol_https: 4
}

export declare const nw_ws_close_code_t: {
	nw_ws_close_code_normal_closure: 1000
	nw_ws_close_code_going_away: 1001
	nw_ws_close_code_protocol_error: 1002
	nw_ws_close_code_unsupported_data: 1003
	nw_ws_close_code_no_status_received: 1005
	nw_ws_close_code_abnormal_closure: 1006
	nw_ws_close_code_invalid_frame_payload_data: 1007
	nw_ws_close_code_policy_violation: 1008
	nw_ws_close_code_message_too_big: 1009
	nw_ws_close_code_mandatory_extension: 1010
	nw_ws_close_code_internal_server_error: 1011
	nw_ws_close_code_tls_handshake: 1015
}

export declare const nw_browser_state_t: {
	nw_browser_state_invalid: 0
	nw_browser_state_ready: 1
	nw_browser_state_failed: 2
	nw_browser_state_cancelled: 3
	nw_browser_state_waiting: 4
}

export declare const nw_parameters_attribution_t: {
	nw_parameters_attribution_developer: 1
	nw_parameters_attribution_user: 2
}

export declare const nw_interface_radio_type_t: {
	nw_interface_radio_type_unknown: 0
	nw_interface_radio_type_wifi_b: 1
	nw_interface_radio_type_wifi_a: 2
	nw_interface_radio_type_wifi_g: 3
	nw_interface_radio_type_wifi_n: 4
	nw_interface_radio_type_wifi_ac: 5
	nw_interface_radio_type_wifi_ax: 6
	nw_interface_radio_type_cell_lte: 128
	nw_interface_radio_type_cell_endc_sub6: 129
	nw_interface_radio_type_cell_endc_mmw: 130
	nw_interface_radio_type_cell_nr_sa_sub6: 131
	nw_interface_radio_type_cell_nr_sa_mmw: 132
	nw_interface_radio_type_cell_wcdma: 133
	nw_interface_radio_type_cell_gsm: 134
	nw_interface_radio_type_cell_cdma: 135
	nw_interface_radio_type_cell_evdo: 136
}

export declare const nw_interface_type_t: {
	nw_interface_type_other: 0
	nw_interface_type_wifi: 1
	nw_interface_type_cellular: 2
	nw_interface_type_wired: 3
	nw_interface_type_loopback: 4
}

export declare const nw_txt_record_find_key_t: {
	nw_txt_record_find_key_invalid: 0
	nw_txt_record_find_key_not_present: 1
	nw_txt_record_find_key_no_value: 2
	nw_txt_record_find_key_empty_value: 3
	nw_txt_record_find_key_non_empty_value: 4
}

export declare const nw_report_resolution_source_t: {
	nw_report_resolution_source_query: 1
	nw_report_resolution_source_cache: 2
	nw_report_resolution_source_expired_cache: 3
}

export declare const nw_ip_local_address_preference_t: {
	nw_ip_local_address_preference_default: 0
	nw_ip_local_address_preference_temporary: 1
	nw_ip_local_address_preference_stable: 2
}

export declare const nw_link_quality_t: {
	nw_link_quality_unknown: 0
	nw_link_quality_minimal: 10
	nw_link_quality_moderate: 20
	nw_link_quality_good: 30
}

export declare const nw_connection_state_t: {
	nw_connection_state_invalid: 0
	nw_connection_state_waiting: 1
	nw_connection_state_preparing: 2
	nw_connection_state_ready: 3
	nw_connection_state_failed: 4
	nw_connection_state_cancelled: 5
}

export declare const nw_parameters_expired_dns_behavior_t: {
	nw_parameters_expired_dns_behavior_default: 0
	nw_parameters_expired_dns_behavior_allow: 1
	nw_parameters_expired_dns_behavior_prohibit: 2
}

export declare const nw_ip_ecn_flag_t: {
	nw_ip_ecn_flag_non_ect: 0
	nw_ip_ecn_flag_ect_0: 2
	nw_ip_ecn_flag_ect_1: 1
	nw_ip_ecn_flag_ce: 3
}

export declare const nw_ws_version_t: {
	nw_ws_version_invalid: 0
	nw_ws_version_13: 1
}

export declare const nw_path_unsatisfied_reason_t: {
	nw_path_unsatisfied_reason_not_available: 0
	nw_path_unsatisfied_reason_cellular_denied: 1
	nw_path_unsatisfied_reason_wifi_denied: 2
	nw_path_unsatisfied_reason_local_network_denied: 3
}

export declare const nw_multipath_service_t: {
	nw_multipath_service_disabled: 0
	nw_multipath_service_handover: 1
	nw_multipath_service_interactive: 2
	nw_multipath_service_aggregate: 3
}

export declare const nw_data_transfer_report_state_t: {
	nw_data_transfer_report_state_collecting: 1
	nw_data_transfer_report_state_collected: 2
}

export declare const nw_endpoint_type_t: {
	nw_endpoint_type_invalid: 0
	nw_endpoint_type_address: 1
	nw_endpoint_type_host: 2
	nw_endpoint_type_bonjour_service: 3
	nw_endpoint_type_url: 4
}

export declare const nw_quic_stream_type_t: {
	nw_quic_stream_type_unknown: 0
	nw_quic_stream_type_bidirectional: 1
	nw_quic_stream_type_unidirectional: 2
	nw_quic_stream_type_datagram: 3
}

export declare const nw_ethernet_channel_state_t: {
	nw_ethernet_channel_state_invalid: 0
	nw_ethernet_channel_state_waiting: 1
	nw_ethernet_channel_state_preparing: 2
	nw_ethernet_channel_state_ready: 3
	nw_ethernet_channel_state_failed: 4
	nw_ethernet_channel_state_cancelled: 5
}

export declare const nw_multipath_version_t: {
	nw_multipath_version_unspecified: -1
	nw_multipath_version_0: 0
	nw_multipath_version_1: 1
}

export declare const nw_framer_start_result_t: {
	nw_framer_start_result_ready: 1
	nw_framer_start_result_will_mark_ready: 2
}

export declare const nw_service_class_t: {
	nw_service_class_best_effort: 0
	nw_service_class_background: 1
	nw_service_class_interactive_video: 2
	nw_service_class_interactive_voice: 3
	nw_service_class_responsive_data: 4
	nw_service_class_signaling: 5
}

export declare const nw_error_domain_t: {
	nw_error_domain_invalid: 0
	nw_error_domain_posix: 1
	nw_error_domain_dns: 2
	nw_error_domain_tls: 3
}

export declare function nw_retain(obj: interop.PointerConvertible): interop.Pointer

export declare function nw_release(obj: interop.PointerConvertible): void

export declare function nw_txt_record_create_with_bytes(
	txt_bytes: interop.PointerConvertible,
	txt_len: number,
): NSObject

export declare function nw_txt_record_create_dictionary(): NSObject

export declare function nw_txt_record_copy(txt_record: NSObject): NSObject

export declare function nw_txt_record_find_key(
	txt_record: NSObject,
	key: string,
): interop.Enum<typeof nw_txt_record_find_key_t>

export declare function nw_txt_record_access_key(
	txt_record: NSObject,
	key: string,
	access_value: (
		p1: string,
		p2: interop.Enum<typeof nw_txt_record_find_key_t>,
		p3: interop.PointerConvertible,
		p4: number,
	) => boolean,
): boolean

export declare function nw_txt_record_set_key(
	txt_record: NSObject,
	key: string,
	value: interop.PointerConvertible,
	value_len: number,
): boolean

export declare function nw_txt_record_remove_key(txt_record: NSObject, key: string): boolean

export declare function nw_txt_record_get_key_count(txt_record: NSObject): number

export declare function nw_txt_record_access_bytes(
	txt_record: NSObject,
	access_bytes: (p1: interop.PointerConvertible, p2: number) => boolean,
): boolean

export declare function nw_txt_record_apply(
	txt_record: NSObject,
	applier: (
		p1: string,
		p2: interop.Enum<typeof nw_txt_record_find_key_t>,
		p3: interop.PointerConvertible,
		p4: number,
	) => boolean,
): boolean

export declare function nw_txt_record_is_equal(left: NSObject, right: NSObject): boolean

export declare function nw_txt_record_is_dictionary(txt_record: NSObject): boolean

export declare function nw_advertise_descriptor_create_bonjour_service(
	name: string,
	type: string,
	domain: string,
): NSObject

export declare function nw_advertise_descriptor_set_txt_record(
	advertise_descriptor: NSObject,
	txt_record: interop.PointerConvertible,
	txt_length: number,
): void

export declare function nw_advertise_descriptor_set_no_auto_rename(
	advertise_descriptor: NSObject,
	no_auto_rename: boolean,
): void

export declare function nw_advertise_descriptor_get_no_auto_rename(
	advertise_descriptor: NSObject,
): boolean

export declare function nw_advertise_descriptor_set_txt_record_object(
	advertise_descriptor: NSObject,
	txt_record: NSObject,
): void

export declare function nw_advertise_descriptor_copy_txt_record_object(
	advertise_descriptor: NSObject,
): NSObject

export declare function nw_protocol_definition_is_equal(
	definition1: NSObject,
	definition2: NSObject,
): boolean

export declare function nw_protocol_options_copy_definition(options: NSObject): NSObject

export declare function nw_protocol_metadata_copy_definition(metadata: NSObject): NSObject

export declare function nw_interface_get_type(
	interface: NSObject,
): interop.Enum<typeof nw_interface_type_t>

export declare function nw_interface_get_name(interface: NSObject): string

export declare function nw_interface_get_index(interface: NSObject): number

export declare function nw_endpoint_get_type(
	endpoint: NSObject,
): interop.Enum<typeof nw_endpoint_type_t>

export declare function nw_endpoint_create_host(hostname: string, port: string): NSObject

export declare function nw_endpoint_get_hostname(endpoint: NSObject): string

export declare function nw_endpoint_copy_port_string(endpoint: NSObject): string

export declare function nw_endpoint_get_port(endpoint: NSObject): number

export declare function nw_endpoint_create_address(address: interop.PointerConvertible): NSObject

export declare function nw_endpoint_copy_address_string(endpoint: NSObject): string

export declare function nw_endpoint_get_address(endpoint: NSObject): interop.Pointer

export declare function nw_endpoint_create_bonjour_service(
	name: string,
	type: string,
	domain: string,
): NSObject

export declare function nw_endpoint_get_bonjour_service_name(endpoint: NSObject): string

export declare function nw_endpoint_get_bonjour_service_type(endpoint: NSObject): string

export declare function nw_endpoint_get_bonjour_service_domain(endpoint: NSObject): string

export declare function nw_endpoint_create_url(url: string): NSObject

export declare function nw_endpoint_get_url(endpoint: NSObject): string

export declare function nw_resolver_config_create_https(url_endpoint: NSObject): NSObject

export declare function nw_resolver_config_create_tls(server_endpoint: NSObject): NSObject

export declare function nw_resolver_config_add_server_address(
	config: NSObject,
	server_address: NSObject,
): void

export declare function nw_privacy_context_create(description: string): NSObject

export declare function nw_privacy_context_flush_cache(privacy_context: NSObject): void

export declare function nw_privacy_context_disable_logging(privacy_context: NSObject): void

export declare function nw_privacy_context_require_encrypted_name_resolution(
	privacy_context: NSObject,
	require_encrypted_name_resolution: boolean,
	fallback_resolver_config: NSObject,
): void

export declare function nw_parameters_create_secure_tcp(
	configure_tls: (p1: NSObject) => void,
	configure_tcp: (p1: NSObject) => void,
): NSObject

export declare function nw_parameters_create_secure_udp(
	configure_dtls: (p1: NSObject) => void,
	configure_udp: (p1: NSObject) => void,
): NSObject

export declare function nw_parameters_create_custom_ip(
	custom_ip_protocol_number: number,
	configure_ip: (p1: NSObject) => void,
): NSObject

export declare function nw_parameters_create(): NSObject

export declare function nw_parameters_copy(parameters: NSObject): NSObject

export declare function nw_parameters_set_privacy_context(
	parameters: NSObject,
	privacy_context: NSObject,
): void

export declare function nw_parameters_require_interface(
	parameters: NSObject,
	interface: NSObject,
): void

export declare function nw_parameters_copy_required_interface(parameters: NSObject): NSObject

export declare function nw_parameters_prohibit_interface(
	parameters: NSObject,
	interface: NSObject,
): void

export declare function nw_parameters_clear_prohibited_interfaces(parameters: NSObject): void

export declare function nw_parameters_iterate_prohibited_interfaces(
	parameters: NSObject,
	iterate_block: (p1: NSObject) => boolean,
): void

export declare function nw_parameters_set_required_interface_type(
	parameters: NSObject,
	interface_type: interop.Enum<typeof nw_interface_type_t>,
): void

export declare function nw_parameters_get_required_interface_type(
	parameters: NSObject,
): interop.Enum<typeof nw_interface_type_t>

export declare function nw_parameters_prohibit_interface_type(
	parameters: NSObject,
	interface_type: interop.Enum<typeof nw_interface_type_t>,
): void

export declare function nw_parameters_clear_prohibited_interface_types(parameters: NSObject): void

export declare function nw_parameters_iterate_prohibited_interface_types(
	parameters: NSObject,
	iterate_block: (p1: interop.Enum<typeof nw_interface_type_t>) => boolean,
): void

export declare function nw_parameters_set_prohibit_expensive(
	parameters: NSObject,
	prohibit_expensive: boolean,
): void

export declare function nw_parameters_get_prohibit_expensive(parameters: NSObject): boolean

export declare function nw_parameters_set_prohibit_constrained(
	parameters: NSObject,
	prohibit_constrained: boolean,
): void

export declare function nw_parameters_get_prohibit_constrained(parameters: NSObject): boolean

export declare function nw_parameters_set_reuse_local_address(
	parameters: NSObject,
	reuse_local_address: boolean,
): void

export declare function nw_parameters_get_reuse_local_address(parameters: NSObject): boolean

export declare function nw_parameters_set_local_endpoint(
	parameters: NSObject,
	local_endpoint: NSObject,
): void

export declare function nw_parameters_copy_local_endpoint(parameters: NSObject): NSObject

export declare function nw_parameters_set_include_peer_to_peer(
	parameters: NSObject,
	include_peer_to_peer: boolean,
): void

export declare function nw_parameters_get_include_peer_to_peer(parameters: NSObject): boolean

export declare function nw_parameters_set_fast_open_enabled(
	parameters: NSObject,
	fast_open_enabled: boolean,
): void

export declare function nw_parameters_get_fast_open_enabled(parameters: NSObject): boolean

export declare function nw_parameters_set_service_class(
	parameters: NSObject,
	service_class: interop.Enum<typeof nw_service_class_t>,
): void

export declare function nw_parameters_get_service_class(
	parameters: NSObject,
): interop.Enum<typeof nw_service_class_t>

export declare function nw_parameters_set_multipath_service(
	parameters: NSObject,
	multipath_service: interop.Enum<typeof nw_multipath_service_t>,
): void

export declare function nw_parameters_get_multipath_service(
	parameters: NSObject,
): interop.Enum<typeof nw_multipath_service_t>

export declare function nw_parameters_copy_default_protocol_stack(parameters: NSObject): NSObject

export declare function nw_protocol_stack_prepend_application_protocol(
	stack: NSObject,
	protocol: NSObject,
): void

export declare function nw_protocol_stack_clear_application_protocols(stack: NSObject): void

export declare function nw_protocol_stack_iterate_application_protocols(
	stack: NSObject,
	iterate_block: (p1: NSObject) => void,
): void

export declare function nw_protocol_stack_copy_transport_protocol(stack: NSObject): NSObject

export declare function nw_protocol_stack_set_transport_protocol(
	stack: NSObject,
	protocol: NSObject,
): void

export declare function nw_protocol_stack_copy_internet_protocol(stack: NSObject): NSObject

export declare function nw_parameters_set_local_only(
	parameters: NSObject,
	local_only: boolean,
): void

export declare function nw_parameters_get_local_only(parameters: NSObject): boolean

export declare function nw_parameters_set_prefer_no_proxy(
	parameters: NSObject,
	prefer_no_proxy: boolean,
): void

export declare function nw_parameters_get_prefer_no_proxy(parameters: NSObject): boolean

export declare function nw_parameters_set_expired_dns_behavior(
	parameters: NSObject,
	expired_dns_behavior: interop.Enum<typeof nw_parameters_expired_dns_behavior_t>,
): void

export declare function nw_parameters_get_expired_dns_behavior(
	parameters: NSObject,
): interop.Enum<typeof nw_parameters_expired_dns_behavior_t>

export declare function nw_browse_descriptor_create_bonjour_service(
	type: string,
	domain: string,
): NSObject

export declare function nw_browse_descriptor_get_bonjour_service_type(descriptor: NSObject): string

export declare function nw_browse_descriptor_get_bonjour_service_domain(
	descriptor: NSObject,
): string

export declare function nw_browse_descriptor_set_include_txt_record(
	descriptor: NSObject,
	include_txt_record: boolean,
): void

export declare function nw_browse_descriptor_get_include_txt_record(descriptor: NSObject): boolean

export declare function nw_browse_result_copy_endpoint(result: NSObject): NSObject

export declare function nw_browse_result_get_changes(
	old_result: NSObject,
	new_result: NSObject,
): number

export declare function nw_browse_result_get_interfaces_count(result: NSObject): number

export declare function nw_browse_result_copy_txt_record_object(result: NSObject): NSObject

export declare function nw_browse_result_enumerate_interfaces(
	result: NSObject,
	enumerator: (p1: NSObject) => boolean,
): void

export declare function nw_error_get_error_domain(
	error: NSObject,
): interop.Enum<typeof nw_error_domain_t>

export declare function nw_error_get_error_code(error: NSObject): number

export declare function nw_error_copy_cf_error(error: NSObject): interop.Object

export declare function nw_browser_create(descriptor: NSObject, parameters: NSObject): NSObject

export declare function nw_browser_set_queue(browser: NSObject, queue: NSObject): void

export declare function nw_browser_set_browse_results_changed_handler(
	browser: NSObject,
	handler: (p1: NSObject, p2: NSObject, p3: boolean) => void,
): void

export declare function nw_browser_set_state_changed_handler(
	browser: NSObject,
	state_changed_handler: (p1: interop.Enum<typeof nw_browser_state_t>, p2: NSObject) => void,
): void

export declare function nw_browser_start(browser: NSObject): void

export declare function nw_browser_cancel(browser: NSObject): void

export declare function nw_browser_copy_parameters(browser: NSObject): NSObject

export declare function nw_browser_copy_browse_descriptor(browser: NSObject): NSObject

export declare function nw_path_get_status(path: NSObject): interop.Enum<typeof nw_path_status_t>

export declare function nw_path_get_unsatisfied_reason(
	path: NSObject,
): interop.Enum<typeof nw_path_unsatisfied_reason_t>

export declare function nw_path_enumerate_interfaces(
	path: NSObject,
	enumerate_block: (p1: NSObject) => boolean,
): void

export declare function nw_path_is_equal(path: NSObject, other_path: NSObject): boolean

export declare function nw_path_is_expensive(path: NSObject): boolean

export declare function nw_path_is_constrained(path: NSObject): boolean

export declare function nw_path_has_ipv4(path: NSObject): boolean

export declare function nw_path_has_ipv6(path: NSObject): boolean

export declare function nw_path_has_dns(path: NSObject): boolean

export declare function nw_path_uses_interface_type(
	path: NSObject,
	interface_type: interop.Enum<typeof nw_interface_type_t>,
): boolean

export declare function nw_path_copy_effective_local_endpoint(path: NSObject): NSObject

export declare function nw_path_copy_effective_remote_endpoint(path: NSObject): NSObject

export declare function nw_path_enumerate_gateways(
	path: NSObject,
	enumerate_block: (p1: NSObject) => boolean,
): void

export declare function nw_content_context_create(context_identifier: string): NSObject

export declare function nw_content_context_get_identifier(context: NSObject): string

export declare function nw_content_context_get_is_final(context: NSObject): boolean

export declare function nw_content_context_set_is_final(context: NSObject, is_final: boolean): void

export declare function nw_content_context_get_expiration_milliseconds(context: NSObject): number

export declare function nw_content_context_set_expiration_milliseconds(
	context: NSObject,
	expiration_milliseconds: number,
): void

export declare function nw_content_context_get_relative_priority(context: NSObject): number

export declare function nw_content_context_set_relative_priority(
	context: NSObject,
	relative_priority: number,
): void

export declare function nw_content_context_set_antecedent(
	context: NSObject,
	antecedent_context: NSObject,
): void

export declare function nw_content_context_copy_antecedent(context: NSObject): NSObject

export declare function nw_content_context_set_metadata_for_protocol(
	context: NSObject,
	protocol_metadata: NSObject,
): void

export declare function nw_content_context_copy_protocol_metadata(
	context: NSObject,
	protocol: NSObject,
): NSObject

export declare function nw_content_context_foreach_protocol_metadata(
	context: NSObject,
	foreach_block: (p1: NSObject, p2: NSObject) => void,
): void

export declare function nw_connection_create(endpoint: NSObject, parameters: NSObject): NSObject

export declare function nw_connection_copy_endpoint(connection: NSObject): NSObject

export declare function nw_connection_copy_parameters(connection: NSObject): NSObject

export declare function nw_connection_set_state_changed_handler(
	connection: NSObject,
	handler: (p1: interop.Enum<typeof nw_connection_state_t>, p2: NSObject) => void,
): void

export declare function nw_connection_set_viability_changed_handler(
	connection: NSObject,
	handler: (p1: boolean) => void,
): void

export declare function nw_connection_set_better_path_available_handler(
	connection: NSObject,
	handler: (p1: boolean) => void,
): void

export declare function nw_connection_set_path_changed_handler(
	connection: NSObject,
	handler: (p1: NSObject) => void,
): void

export declare function nw_connection_set_queue(connection: NSObject, queue: NSObject): void

export declare function nw_connection_start(connection: NSObject): void

export declare function nw_connection_restart(connection: NSObject): void

export declare function nw_connection_cancel(connection: NSObject): void

export declare function nw_connection_force_cancel(connection: NSObject): void

export declare function nw_connection_cancel_current_endpoint(connection: NSObject): void

export declare function nw_connection_receive(
	connection: NSObject,
	minimum_incomplete_length: number,
	maximum_length: number,
	completion: (p1: NSObject, p2: NSObject, p3: boolean, p4: NSObject) => void,
): void

export declare function nw_connection_receive_message(
	connection: NSObject,
	completion: (p1: NSObject, p2: NSObject, p3: boolean, p4: NSObject) => void,
): void

export declare function nw_connection_send(
	connection: NSObject,
	content: NSObject,
	context: NSObject,
	is_complete: boolean,
	completion: (p1: NSObject) => void,
): void

export declare function nw_connection_batch(connection: NSObject, batch_block: () => void): void

export declare function nw_connection_copy_description(connection: NSObject): string

export declare function nw_connection_copy_current_path(connection: NSObject): NSObject

export declare function nw_connection_copy_protocol_metadata(
	connection: NSObject,
	definition: NSObject,
): NSObject

export declare function nw_connection_get_maximum_datagram_size(connection: NSObject): number

export declare function nw_group_descriptor_create_multicast(multicast_group: NSObject): NSObject

export declare function nw_group_descriptor_add_endpoint(
	descriptor: NSObject,
	endpoint: NSObject,
): boolean

export declare function nw_group_descriptor_enumerate_endpoints(
	descriptor: NSObject,
	enumerate_block: (p1: NSObject) => boolean,
): void

export declare function nw_multicast_group_descriptor_set_specific_source(
	multicast_descriptor: NSObject,
	source: NSObject,
): void

export declare function nw_multicast_group_descriptor_set_disable_unicast_traffic(
	multicast_descriptor: NSObject,
	disable_unicast_traffic: boolean,
): void

export declare function nw_multicast_group_descriptor_get_disable_unicast_traffic(
	multicast_descriptor: NSObject,
): boolean

export declare function nw_connection_group_create(
	group_descriptor: NSObject,
	parameters: NSObject,
): NSObject

export declare function nw_connection_group_copy_descriptor(group: NSObject): NSObject

export declare function nw_connection_group_copy_parameters(group: NSObject): NSObject

export declare function nw_connection_group_set_queue(group: NSObject, queue: NSObject): void

export declare function nw_connection_group_set_state_changed_handler(
	group: NSObject,
	state_changed_handler: (
		p1: interop.Enum<typeof nw_connection_group_state_t>,
		p2: NSObject,
	) => void,
): void

export declare function nw_connection_group_set_receive_handler(
	group: NSObject,
	maximum_message_size: number,
	reject_oversized_messages: boolean,
	receive_handler: (p1: NSObject, p2: NSObject, p3: boolean) => void,
): void

export declare function nw_connection_group_start(group: NSObject): void

export declare function nw_connection_group_cancel(group: NSObject): void

export declare function nw_connection_group_copy_remote_endpoint_for_message(
	group: NSObject,
	context: NSObject,
): NSObject

export declare function nw_connection_group_copy_local_endpoint_for_message(
	group: NSObject,
	context: NSObject,
): NSObject

export declare function nw_connection_group_copy_path_for_message(
	group: NSObject,
	context: NSObject,
): NSObject

export declare function nw_connection_group_extract_connection_for_message(
	group: NSObject,
	context: NSObject,
): NSObject

export declare function nw_connection_group_reply(
	group: NSObject,
	inbound_message: NSObject,
	outbound_message: NSObject,
	content: NSObject,
): void

export declare function nw_connection_group_send_message(
	group: NSObject,
	content: NSObject,
	endpoint: NSObject,
	context: NSObject,
	completion: (p1: NSObject) => void,
): void

export declare function nw_connection_access_establishment_report(
	connection: NSObject,
	queue: NSObject,
	access_block: (p1: NSObject) => void,
): void

export declare function nw_establishment_report_get_duration_milliseconds(report: NSObject): number

export declare function nw_establishment_report_get_attempt_started_after_milliseconds(
	report: NSObject,
): number

export declare function nw_establishment_report_get_previous_attempt_count(report: NSObject): number

export declare function nw_establishment_report_get_used_proxy(report: NSObject): boolean

export declare function nw_establishment_report_get_proxy_configured(report: NSObject): boolean

export declare function nw_establishment_report_copy_proxy_endpoint(report: NSObject): NSObject

export declare function nw_resolution_report_get_source(
	resolution_report: NSObject,
): interop.Enum<typeof nw_report_resolution_source_t>

export declare function nw_resolution_report_get_milliseconds(resolution_report: NSObject): number

export declare function nw_resolution_report_get_endpoint_count(resolution_report: NSObject): number

export declare function nw_resolution_report_copy_successful_endpoint(
	resolution_report: NSObject,
): NSObject

export declare function nw_resolution_report_copy_preferred_endpoint(
	resolution_report: NSObject,
): NSObject

export declare function nw_resolution_report_get_protocol(
	resolution_report: NSObject,
): interop.Enum<typeof nw_report_resolution_protocol_t>

export declare function nw_establishment_report_enumerate_resolutions(
	report: NSObject,
	enumerate_block: (
		p1: interop.Enum<typeof nw_report_resolution_source_t>,
		p2: number,
		p3: number,
		p4: NSObject,
		p5: NSObject,
	) => boolean,
): void

export declare function nw_establishment_report_enumerate_resolution_reports(
	report: NSObject,
	enumerate_block: (p1: NSObject) => boolean,
): void

export declare function nw_establishment_report_enumerate_protocols(
	report: NSObject,
	enumerate_block: (p1: NSObject, p2: number, p3: number) => boolean,
): void

export declare function nw_connection_create_new_data_transfer_report(
	connection: NSObject,
): NSObject

export declare function nw_data_transfer_report_get_state(
	report: NSObject,
): interop.Enum<typeof nw_data_transfer_report_state_t>

export declare function nw_data_transfer_report_collect(
	report: NSObject,
	queue: NSObject,
	collect_block: (p1: NSObject) => void,
): void

export declare function nw_data_transfer_report_get_duration_milliseconds(report: NSObject): number

export declare function nw_data_transfer_report_get_path_count(report: NSObject): number

export declare function nw_data_transfer_report_get_received_ip_packet_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_sent_ip_packet_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_received_transport_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_received_transport_duplicate_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_received_transport_out_of_order_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_sent_transport_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_sent_transport_retransmitted_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_transport_smoothed_rtt_milliseconds(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_transport_minimum_rtt_milliseconds(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_transport_rtt_variance(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_received_application_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_get_sent_application_byte_count(
	report: NSObject,
	path_index: number,
): number

export declare function nw_data_transfer_report_copy_path_interface(
	report: NSObject,
	path_index: number,
): NSObject

export declare function nw_ethernet_channel_create(
	ether_type: number,
	interface: NSObject,
): NSObject

export declare function nw_ethernet_channel_set_state_changed_handler(
	ethernet_channel: NSObject,
	handler: (p1: interop.Enum<typeof nw_ethernet_channel_state_t>, p2: NSObject) => void,
): void

export declare function nw_ethernet_channel_set_queue(
	ethernet_channel: NSObject,
	queue: NSObject,
): void

export declare function nw_ethernet_channel_start(ethernet_channel: NSObject): void

export declare function nw_ethernet_channel_cancel(ethernet_channel: NSObject): void

export declare function nw_ethernet_channel_set_receive_handler(
	ethernet_channel: NSObject,
	handler: (
		p1: NSObject,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => void,
): void

export declare function nw_ethernet_channel_send(
	ethernet_channel: NSObject,
	content: NSObject,
	vlan_tag: number,
	remote_address: interop.PointerConvertible,
	completion: (p1: NSObject) => void,
): void

export declare function nw_framer_protocol_create_message(definition: NSObject): NSObject

export declare function nw_protocol_metadata_is_framer_message(metadata: NSObject): boolean

export declare function nw_framer_message_create(framer: NSObject): NSObject

export declare function nw_framer_message_set_value(
	message: NSObject,
	key: string,
	value: interop.PointerConvertible,
	dispose_value: (p1: interop.PointerConvertible) => void,
): void

export declare function nw_framer_message_access_value(
	message: NSObject,
	key: string,
	access_value: (p1: interop.PointerConvertible) => boolean,
): boolean

export declare function nw_framer_message_set_object_value(
	message: NSObject,
	key: string,
	value: interop.Object,
): void

export declare function nw_framer_message_copy_object_value(
	message: NSObject,
	key: string,
): interop.Object

export declare function nw_framer_create_definition(
	identifier: string,
	flags: number,
	start_handler: (p1: NSObject) => interop.Enum<typeof nw_framer_start_result_t>,
): NSObject

export declare function nw_framer_create_options(framer_definition: NSObject): NSObject

export declare function nw_framer_set_input_handler(
	framer: NSObject,
	input_handler: (p1: NSObject) => number,
): void

export declare function nw_framer_set_output_handler(
	framer: NSObject,
	output_handler: (p1: NSObject, p2: NSObject, p3: number, p4: boolean) => void,
): void

export declare function nw_framer_set_wakeup_handler(
	framer: NSObject,
	wakeup_handler: (p1: NSObject) => void,
): void

export declare function nw_framer_set_stop_handler(
	framer: NSObject,
	stop_handler: (p1: NSObject) => boolean,
): void

export declare function nw_framer_set_cleanup_handler(
	framer: NSObject,
	cleanup_handler: (p1: NSObject) => void,
): void

export declare function nw_framer_mark_ready(framer: NSObject): void

export declare function nw_framer_prepend_application_protocol(
	framer: NSObject,
	protocol_options: NSObject,
): boolean

export declare function nw_framer_mark_failed_with_error(framer: NSObject, error_code: number): void

export declare function nw_framer_parse_input(
	framer: NSObject,
	minimum_incomplete_length: number,
	maximum_length: number,
	temp_buffer: interop.PointerConvertible,
	parse: (p1: interop.PointerConvertible, p2: number, p3: boolean) => number,
): boolean

export declare function nw_framer_deliver_input(
	framer: NSObject,
	input_buffer: interop.PointerConvertible,
	input_length: number,
	message: NSObject,
	is_complete: boolean,
): void

export declare function nw_framer_deliver_input_no_copy(
	framer: NSObject,
	input_length: number,
	message: NSObject,
	is_complete: boolean,
): boolean

export declare function nw_framer_pass_through_input(framer: NSObject): void

export declare function nw_framer_parse_output(
	framer: NSObject,
	minimum_incomplete_length: number,
	maximum_length: number,
	temp_buffer: interop.PointerConvertible,
	parse: (p1: interop.PointerConvertible, p2: number, p3: boolean) => number,
): boolean

export declare function nw_framer_write_output(
	framer: NSObject,
	output_buffer: interop.PointerConvertible,
	output_length: number,
): void

export declare function nw_framer_write_output_data(framer: NSObject, output_data: NSObject): void

export declare function nw_framer_write_output_no_copy(
	framer: NSObject,
	output_length: number,
): boolean

export declare function nw_framer_pass_through_output(framer: NSObject): void

export declare function nw_framer_schedule_wakeup(framer: NSObject, milliseconds: number): void

export declare function nw_framer_async(framer: NSObject, async_block: () => void): void

export declare function nw_framer_copy_remote_endpoint(framer: NSObject): NSObject

export declare function nw_framer_copy_local_endpoint(framer: NSObject): NSObject

export declare function nw_framer_copy_parameters(framer: NSObject): NSObject

export declare function nw_protocol_copy_ip_definition(): NSObject

export declare function nw_ip_options_set_version(
	options: NSObject,
	version: interop.Enum<typeof nw_ip_version_t>,
): void

export declare function nw_ip_options_set_hop_limit(options: NSObject, hop_limit: number): void

export declare function nw_ip_options_set_use_minimum_mtu(
	options: NSObject,
	use_minimum_mtu: boolean,
): void

export declare function nw_ip_options_set_disable_fragmentation(
	options: NSObject,
	disable_fragmentation: boolean,
): void

export declare function nw_ip_options_set_calculate_receive_time(
	options: NSObject,
	calculate_receive_time: boolean,
): void

export declare function nw_ip_options_set_local_address_preference(
	options: NSObject,
	preference: interop.Enum<typeof nw_ip_local_address_preference_t>,
): void

export declare function nw_ip_options_set_disable_multicast_loopback(
	options: NSObject,
	disable_multicast_loopback: boolean,
): void

export declare function nw_ip_create_metadata(): NSObject

export declare function nw_protocol_metadata_is_ip(metadata: NSObject): boolean

export declare function nw_ip_metadata_set_ecn_flag(
	metadata: NSObject,
	ecn_flag: interop.Enum<typeof nw_ip_ecn_flag_t>,
): void

export declare function nw_ip_metadata_get_ecn_flag(
	metadata: NSObject,
): interop.Enum<typeof nw_ip_ecn_flag_t>

export declare function nw_ip_metadata_set_service_class(
	metadata: NSObject,
	service_class: interop.Enum<typeof nw_service_class_t>,
): void

export declare function nw_ip_metadata_get_service_class(
	metadata: NSObject,
): interop.Enum<typeof nw_service_class_t>

export declare function nw_ip_metadata_get_receive_time(metadata: NSObject): number

export declare function nw_listener_create_with_port(port: string, parameters: NSObject): NSObject

export declare function nw_listener_create_with_launchd_key(
	parameters: NSObject,
	launchd_key: string,
): NSObject

export declare function nw_listener_create(parameters: NSObject): NSObject

export declare function nw_listener_create_with_connection(
	connection: NSObject,
	parameters: NSObject,
): NSObject

export declare function nw_listener_set_queue(listener: NSObject, queue: NSObject): void

export declare function nw_listener_set_state_changed_handler(
	listener: NSObject,
	handler: (p1: interop.Enum<typeof nw_listener_state_t>, p2: NSObject) => void,
): void

export declare function nw_listener_set_new_connection_handler(
	listener: NSObject,
	handler: (p1: NSObject) => void,
): void

export declare function nw_listener_get_new_connection_limit(listener: NSObject): number

export declare function nw_listener_set_new_connection_limit(
	listener: NSObject,
	new_connection_limit: number,
): void

export declare function nw_listener_set_advertise_descriptor(
	listener: NSObject,
	advertise_descriptor: NSObject,
): void

export declare function nw_listener_set_advertised_endpoint_changed_handler(
	listener: NSObject,
	handler: (p1: NSObject, p2: boolean) => void,
): void

export declare function nw_listener_get_port(listener: NSObject): number

export declare function nw_listener_start(listener: NSObject): void

export declare function nw_listener_cancel(listener: NSObject): void

export declare function nw_path_monitor_create(): NSObject

export declare function nw_path_monitor_create_with_type(
	required_interface_type: interop.Enum<typeof nw_interface_type_t>,
): NSObject

export declare function nw_path_monitor_prohibit_interface_type(
	monitor: NSObject,
	interface_type: interop.Enum<typeof nw_interface_type_t>,
): void

export declare function nw_path_monitor_set_cancel_handler(
	monitor: NSObject,
	cancel_handler: () => void,
): void

export declare function nw_path_monitor_set_update_handler(
	monitor: NSObject,
	update_handler: (p1: NSObject) => void,
): void

export declare function nw_path_monitor_set_queue(monitor: NSObject, queue: NSObject): void

export declare function nw_path_monitor_start(monitor: NSObject): void

export declare function nw_path_monitor_cancel(monitor: NSObject): void

export declare function nw_protocol_copy_tcp_definition(): NSObject

export declare function nw_tcp_create_options(): NSObject

export declare function nw_tcp_options_set_no_delay(options: NSObject, no_delay: boolean): void

export declare function nw_tcp_options_set_no_push(options: NSObject, no_push: boolean): void

export declare function nw_tcp_options_set_no_options(options: NSObject, no_options: boolean): void

export declare function nw_tcp_options_set_enable_keepalive(
	options: NSObject,
	enable_keepalive: boolean,
): void

export declare function nw_tcp_options_set_keepalive_count(
	options: NSObject,
	keepalive_count: number,
): void

export declare function nw_tcp_options_set_keepalive_idle_time(
	options: NSObject,
	keepalive_idle_time: number,
): void

export declare function nw_tcp_options_set_keepalive_interval(
	options: NSObject,
	keepalive_interval: number,
): void

export declare function nw_tcp_options_set_maximum_segment_size(
	options: NSObject,
	maximum_segment_size: number,
): void

export declare function nw_tcp_options_set_connection_timeout(
	options: NSObject,
	connection_timeout: number,
): void

export declare function nw_tcp_options_set_persist_timeout(
	options: NSObject,
	persist_timeout: number,
): void

export declare function nw_tcp_options_set_retransmit_connection_drop_time(
	options: NSObject,
	retransmit_connection_drop_time: number,
): void

export declare function nw_tcp_options_set_retransmit_fin_drop(
	options: NSObject,
	retransmit_fin_drop: boolean,
): void

export declare function nw_tcp_options_set_disable_ack_stretching(
	options: NSObject,
	disable_ack_stretching: boolean,
): void

export declare function nw_tcp_options_set_enable_fast_open(
	options: NSObject,
	enable_fast_open: boolean,
): void

export declare function nw_tcp_options_set_disable_ecn(
	options: NSObject,
	disable_ecn: boolean,
): void

export declare function nw_protocol_metadata_is_tcp(metadata: NSObject): boolean

export declare function nw_tcp_get_available_receive_buffer(metadata: NSObject): number

export declare function nw_tcp_get_available_send_buffer(metadata: NSObject): number

export declare function nw_protocol_copy_tls_definition(): NSObject

export declare function nw_tls_create_options(): NSObject

export declare function nw_tls_copy_sec_protocol_options(options: NSObject): NSObject

export declare function nw_protocol_metadata_is_tls(metadata: NSObject): boolean

export declare function nw_tls_copy_sec_protocol_metadata(metadata: NSObject): NSObject

export declare function nw_protocol_copy_udp_definition(): NSObject

export declare function nw_udp_create_options(): NSObject

export declare function nw_udp_options_set_prefer_no_checksum(
	options: NSObject,
	prefer_no_checksum: boolean,
): void

export declare function nw_udp_create_metadata(): NSObject

export declare function nw_protocol_metadata_is_udp(metadata: NSObject): boolean

export declare function nw_protocol_copy_ws_definition(): NSObject

export declare function nw_ws_create_options(
	version: interop.Enum<typeof nw_ws_version_t>,
): NSObject

export declare function nw_ws_options_add_additional_header(
	options: NSObject,
	name: string,
	value: string,
): void

export declare function nw_ws_options_add_subprotocol(options: NSObject, subprotocol: string): void

export declare function nw_ws_options_set_auto_reply_ping(
	options: NSObject,
	auto_reply_ping: boolean,
): void

export declare function nw_ws_options_set_skip_handshake(
	options: NSObject,
	skip_handshake: boolean,
): void

export declare function nw_ws_options_set_maximum_message_size(
	options: NSObject,
	maximum_message_size: number,
): void

export declare function nw_protocol_metadata_is_ws(metadata: NSObject): boolean

export declare function nw_ws_create_metadata(opcode: interop.Enum<typeof nw_ws_opcode_t>): NSObject

export declare function nw_ws_metadata_get_opcode(
	metadata: NSObject,
): interop.Enum<typeof nw_ws_opcode_t>

export declare function nw_ws_metadata_set_close_code(
	metadata: NSObject,
	close_code: interop.Enum<typeof nw_ws_close_code_t>,
): void

export declare function nw_ws_metadata_get_close_code(
	metadata: NSObject,
): interop.Enum<typeof nw_ws_close_code_t>

export declare function nw_ws_metadata_set_pong_handler(
	metadata: NSObject,
	client_queue: NSObject,
	pong_handler: (p1: NSObject) => void,
): void

export declare function nw_ws_request_enumerate_subprotocols(
	request: NSObject,
	enumerator: (p1: string) => boolean,
): boolean

export declare function nw_ws_request_enumerate_additional_headers(
	request: NSObject,
	enumerator: (p1: string, p2: string) => boolean,
): boolean

export declare function nw_ws_response_create(
	status: interop.Enum<typeof nw_ws_response_status_t>,
	selected_subprotocol: string,
): NSObject

export declare function nw_ws_response_get_status(
	response: NSObject,
): interop.Enum<typeof nw_ws_response_status_t>

export declare function nw_ws_response_get_selected_subprotocol(response: NSObject): string

export declare function nw_ws_response_add_additional_header(
	response: NSObject,
	name: string,
	value: string,
): void

export declare function nw_ws_metadata_copy_server_response(metadata: NSObject): NSObject

export declare function nw_ws_response_enumerate_additional_headers(
	response: NSObject,
	enumerator: (p1: string, p2: string) => boolean,
): boolean

export declare function nw_ws_options_set_client_request_handler(
	options: NSObject,
	client_queue: NSObject,
	handler: (p1: NSObject) => NSObject,
): void

export declare interface OS_nw_protocol_definition extends NSObjectProtocol {}

export declare class OS_nw_protocol_definition
	extends NativeObject
	implements OS_nw_protocol_definition {}

export declare interface OS_nw_txt_record extends NSObjectProtocol {}

export declare class OS_nw_txt_record extends NativeObject implements OS_nw_txt_record {}

export declare interface OS_nw_path extends NSObjectProtocol {}

export declare class OS_nw_path extends NativeObject implements OS_nw_path {}

export declare interface OS_nw_browser extends NSObjectProtocol {}

export declare class OS_nw_browser extends NativeObject implements OS_nw_browser {}

export declare interface OS_nw_protocol_stack extends NSObjectProtocol {}

export declare class OS_nw_protocol_stack extends NativeObject implements OS_nw_protocol_stack {}

export declare interface OS_nw_establishment_report extends NSObjectProtocol {}

export declare class OS_nw_establishment_report
	extends NativeObject
	implements OS_nw_establishment_report {}

export declare interface OS_nw_listener extends NSObjectProtocol {}

export declare class OS_nw_listener extends NativeObject implements OS_nw_listener {}

export declare interface OS_nw_error extends NSObjectProtocol {}

export declare class OS_nw_error extends NativeObject implements OS_nw_error {}

export declare interface OS_nw_ws_response extends NSObjectProtocol {}

export declare class OS_nw_ws_response extends NativeObject implements OS_nw_ws_response {}

export declare interface OS_nw_resolution_report extends NSObjectProtocol {}

export declare class OS_nw_resolution_report
	extends NativeObject
	implements OS_nw_resolution_report {}

export declare interface OS_nw_ws_request extends NSObjectProtocol {}

export declare class OS_nw_ws_request extends NativeObject implements OS_nw_ws_request {}

export declare interface OS_nw_path_monitor extends NSObjectProtocol {}

export declare class OS_nw_path_monitor extends NativeObject implements OS_nw_path_monitor {}

export declare interface OS_nw_group_descriptor extends NSObjectProtocol {}

export declare class OS_nw_group_descriptor
	extends NativeObject
	implements OS_nw_group_descriptor {}

export declare interface OS_nw_connection extends NSObjectProtocol {}

export declare class OS_nw_connection extends NativeObject implements OS_nw_connection {}

export declare interface OS_nw_browse_descriptor extends NSObjectProtocol {}

export declare class OS_nw_browse_descriptor
	extends NativeObject
	implements OS_nw_browse_descriptor {}

export declare interface OS_nw_parameters extends NSObjectProtocol {}

export declare class OS_nw_parameters extends NativeObject implements OS_nw_parameters {}

export declare interface OS_nw_proxy_config extends NSObjectProtocol {}

export declare class OS_nw_proxy_config extends NativeObject implements OS_nw_proxy_config {}

export declare interface OS_nw_resolver_config extends NSObjectProtocol {}

export declare class OS_nw_resolver_config extends NativeObject implements OS_nw_resolver_config {}

export declare interface OS_nw_endpoint extends NSObjectProtocol {}

export declare class OS_nw_endpoint extends NativeObject implements OS_nw_endpoint {}

export declare interface OS_nw_interface extends NSObjectProtocol {}

export declare class OS_nw_interface extends NativeObject implements OS_nw_interface {}

export declare interface OS_nw_object extends NSObjectProtocol {}

export declare class OS_nw_object extends NativeObject implements OS_nw_object {}

export declare interface OS_nw_browse_result extends NSObjectProtocol {}

export declare class OS_nw_browse_result extends NativeObject implements OS_nw_browse_result {}

export declare interface OS_nw_advertise_descriptor extends NSObjectProtocol {}

export declare class OS_nw_advertise_descriptor
	extends NativeObject
	implements OS_nw_advertise_descriptor {}

export declare interface OS_nw_data_transfer_report extends NSObjectProtocol {}

export declare class OS_nw_data_transfer_report
	extends NativeObject
	implements OS_nw_data_transfer_report {}

export declare interface OS_nw_protocol_options extends NSObjectProtocol {}

export declare class OS_nw_protocol_options
	extends NativeObject
	implements OS_nw_protocol_options {}

export declare interface OS_nw_connection_group extends NSObjectProtocol {}

export declare class OS_nw_connection_group
	extends NativeObject
	implements OS_nw_connection_group {}

export declare interface OS_nw_relay_hop extends NSObjectProtocol {}

export declare class OS_nw_relay_hop extends NativeObject implements OS_nw_relay_hop {}

export declare interface OS_nw_ethernet_channel extends NSObjectProtocol {}

export declare class OS_nw_ethernet_channel
	extends NativeObject
	implements OS_nw_ethernet_channel {}

export declare interface OS_nw_privacy_context extends NSObjectProtocol {}

export declare class OS_nw_privacy_context extends NativeObject implements OS_nw_privacy_context {}

export declare interface OS_nw_content_context extends NSObjectProtocol {}

export declare class OS_nw_content_context extends NativeObject implements OS_nw_content_context {}

export declare interface OS_nw_protocol_metadata extends NSObjectProtocol {}

export declare class OS_nw_protocol_metadata
	extends NativeObject
	implements OS_nw_protocol_metadata {}

export declare interface OS_nw_framer extends NSObjectProtocol {}

export declare class OS_nw_framer extends NativeObject implements OS_nw_framer {}
