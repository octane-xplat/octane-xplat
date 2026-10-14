/// <reference types="@nativescript/objc-node-api" />

declare const CC_LOCK_READER: number;

declare const CC_LOCK_UNLOCK: number;

declare const CC_CRED_V4: number;

declare const CC_ERR_CACHE_FULL: number;

declare const CC_ERR_CACHE_RELEASE: number;

declare const CC_BAD_PARM: number;

declare const CC_NOT_SUPP: number;

declare const CC_NO_EXIST: number;

declare const CC_LOCKED: number;

declare const CC_FORMAT: number;

declare const CC_NOMEM: number;

declare const CC_IO: number;

declare const CC_NOERROR: number;

declare const CC_API_VER_2: number;

declare const KRB_REALM_SZ: number;

declare const klCantDisplayUIErr: number;

declare const klPasswordMismatchErr: number;

declare const klCredentialsNeedValidationErr: number;

declare const klCredentialsBadAddressErr: number;

declare const klNoCredentialsErr: number;

declare const klCredentialsExpiredErr: number;

declare const klPrincipalDoesNotExistErr: number;

declare const klPreferencesReadErr: number;

declare const klBufferTooLargeErr: number;

declare const klBufferTooSmallErr: number;

declare const klBadV5ContextErr: number;

declare const klBadPrincipalErr: number;

declare const realmList_End: number;

declare const loginOption_DefaultForwardableTicket: number;

declare const loginOption_MaximalRenewableLifetime: number;

declare const loginOption_MaximalTicketLifetime: number;

declare const loginOption_RememberExtras: number;

declare const loginOption_RememberPrincipal: number;

declare const loginLibrary_UnknownDialog: number;

declare const loginLibrary_PrompterDialog: number;

declare const loginLibrary_ProgressDialog: number;

declare const loginLibrary_ChangePasswordDialog: number;

declare const kerberosVersion_V4: number;

declare const kerberosVersion_Any: number;

declare const gss_nt_krb5_principal: interop.Pointer;

declare const gss_mech_set_krb5_old: interop.Pointer;

declare const gss_mech_set_krb5: interop.Pointer;

declare const gss_nt_machine_uid_name: interop.Pointer;

declare const KRB5_C_RANDSOURCE_TRUSTEDPARTY: number;

declare const KRB5_C_RANDSOURCE_OSRAND: number;

declare const KRB5_C_RANDSOURCE_OLDAPI: number;

declare const cc_v4_key_size: number;

declare const cc_v4_ticket_size: number;

declare const cc_v4_realm_size: number;

declare const ccErrClientNotFound: number;

declare const ccErrBadInternalMessage: number;

declare const ccErrCCacheUnlocked: number;

declare const ccErrCCacheLocked: number;

declare const ccErrBadAPIVersion: number;

declare const ccErrInvalidLock: number;

declare const ccErrInvalidCredentialsIterator: number;

declare const ccErrInvalidCCacheIterator: number;

declare const ccErrInvalidCredentials: number;

declare const ccErrInvalidCCache: number;

declare const ccapi_version_6: number;

declare const ccapi_version_4: number;

declare const ccapi_version_3: number;

declare const CC_NOTFOUND: number;

declare const klBadLoginOptionsErr: number;

declare const klV5InitializationFailedErr: number;

declare const klServerInsecureErr: number;

declare const loginOption_MinimalTicketLifetime: number;

declare const klCantContactServerErr: number;

declare const klNoRealmsErr: number;

declare const gss_nt_string_uid_name: interop.Pointer;

declare const klMemFullErr: number;

declare const KRB_INSTANCE_SZ: number;

declare const loginOption_LoginName: number;

declare const ccErrBadLockType: number;

declare const ccErrCredentialsNotFound: number;

declare const KRB5_C_RANDSOURCE_MAX: number;

declare const gss_nt_service_name_v2: interop.Pointer;

declare const CC_LOCK_WRITER: number;

declare const ccErrServerInsecure: number;

declare const ccErrNotImplemented: number;

declare const ccIteratorEnd: number;

declare const klSystemDefaultDoesNotExistErr: number;

declare const gss_nt_service_name: interop.Pointer;

declare const CC_CRED_MAX: number;

declare const ccErrContextLocked: number;

declare const CC_CRED_V5: number;

declare const CC_BAD_API_VERSION: number;

declare const loginOption_DefaultTicketLifetime: number;

declare const klInsecurePasswordErr: number;

declare const CC_ERR_CRED_VERSION: number;

declare const loginLibrary_LoginDialog: number;

declare const gss_nt_user_name: interop.Pointer;

declare const ccErrBadParam: number;

declare const ccapi_version_5: number;

declare const kerberosVersion_V5: number;

declare const loginOption_LoginInstance: number;

declare const ccErrNoMem: number;

declare const krb5_gss_oid_array: interop.Pointer;

declare const klParameterErr: number;

declare const realmList_Start: number;

declare const CC_ERR_CACHE_ATTACH: number;

declare const ccErrContextUnlocked: number;

declare const ccErrBadCredentialsVersion: number;

declare const gss_nt_exported_name: interop.Pointer;

declare const klCacheDoesNotExistErr: number;

declare const CC_BADNAME: number;

declare const ccapi_version_max: number;

declare const klPreferencesWriteErr: number;

declare const klNoHostnameErr: number;

declare const ccErrTimeOffsetNotSet: number;

declare const klBadOptionValueErr: number;

declare const kerberosVersion_All: number;

declare const loginOption_MinimalRenewableLifetime: number;

declare const klUserCanceledErr: number;

declare const ccErrBadName: number;

declare const ccErrInvalidContext: number;

declare const ccErrServerUnavailable: number;

declare const loginOption_DefaultAddresslessTicket: number;

declare const klNoErr: number;

declare const MAX_V4_CRED_LEN: number;

declare const CC_END: number;

declare const CC_LOCK_NOBLOCK: number;

declare const loginLibrary_OptionsDialog: number;

declare const CC_CRED_UNKNOWN: number;

declare const gss_nt_krb5_name: interop.Pointer;

declare const gss_mech_set_krb5_both: interop.Pointer;

declare const ccNoError: number;

declare const KRB5_C_RANDSOURCE_EXTERNAL_PROTOCOL: number;

declare const CC_WRITE: number;

declare const ccErrContextNotFound: number;

declare const gss_mech_krb5_old: interop.Pointer;

declare const ccErrInvalidString: number;

declare const ccErrCCacheNotFound: number;

declare const klCapsLockErr: number;

declare const KRB5_C_RANDSOURCE_TIMING: number;

declare const loginOption_DefaultRenewableLifetime: number;

declare const klInvalidVersionErr: number;

declare const klRealmDoesNotExistErr: number;

declare const cc_v4_name_size: number;

declare const klPasswordChangeFailedErr: number;

declare const loginOption_DefaultRenewableTicket: number;

declare const loginOption_DefaultProxiableTicket: number;

declare const ccapi_version_7: number;

declare const klInvalidOptionErr: number;

declare const cc_v4_instance_size: number;

declare const ccErrServerCantBecomeUID: number;

declare const ccErrNeverDefault: number;

declare const ccapi_version_2: number;

declare const klBadPasswordErr: number;

declare const KRB_NAME_SZ: number;

declare const cc_lock_types: {
  cc_lock_read: 0,
  cc_lock_write: 1,
  cc_lock_upgrade: 2,
  cc_lock_downgrade: 3,
};

declare const krb5plugin_preauth_client_request_type: {
  krb5plugin_preauth_client_get_etype: 1,
  krb5plugin_preauth_client_free_etype: 2,
};

declare const krb5plugin_preauth_entry_request_type: {
  krb5plugin_preauth_entry_request_certificate: 1,
  krb5plugin_preauth_entry_max_time_skew: 2,
  krb5plugin_preauth_keys: 3,
  krb5plugin_preauth_request_body: 4,
};

declare const cc_lock_modes: {
  cc_lock_noblock: 0,
  cc_lock_block: 1,
};

declare const cc_credential_versions: {
  cc_credentials_v4: 1,
  cc_credentials_v5: 2,
  cc_credentials_v4_v5: 3,
};

declare const cc_string_to_key_type: {
  cc_v4_stk_afs: 0,
  cc_v4_stk_des: 1,
  cc_v4_stk_columbia_special: 2,
  cc_v4_stk_krb5: 3,
  cc_v4_stk_unknown: 4,
};

declare const locate_service_type: {
  locate_service_kdc: 1,
  locate_service_master_kdc: 2,
  locate_service_kadmin: 3,
  locate_service_krb524: 4,
  locate_service_kpasswd: 5,
};

declare class krb5plugin_preauth_client_ftable_v1 {
  constructor(init?: krb5plugin_preauth_client_ftable_v1);
  name: string | null;
  pa_type_list: interop.Pointer;
  enctype_list: interop.Pointer;
  init: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  fini: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  flags: (p1: interop.PointerConvertible, p2: number) => number | null;
  request_init: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  request_fini: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => void | null;
  process: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number, p6: interop.PointerConvertible) => number, p12: interop.PointerConvertible, p13: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number, p6: interop.PointerConvertible) => number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number, p14: interop.PointerConvertible, p15: interop.PointerConvertible, p16: interop.PointerConvertible, p17: interop.PointerConvertible, p18: interop.PointerConvertible) => number | null;
  tryagain: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible) => number, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible, p12: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number, p6: interop.PointerConvertible) => number, p13: interop.PointerConvertible, p14: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number, p6: interop.PointerConvertible) => number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible) => number, p15: interop.PointerConvertible, p16: interop.PointerConvertible, p17: interop.PointerConvertible, p18: interop.PointerConvertible, p19: interop.PointerConvertible) => number | null;
  gic_opts: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: string, p5: string) => number | null;
}

declare class infoNC {
  constructor(init?: infoNC);
  name: string | null;
  principal: string | null;
  vers: number;
}

declare class cc_credentials_v4_compat {
  constructor(init?: cc_credentials_v4_compat);
  kversion: number;
  principal: unknown /* const array */;
  principal_instance: unknown /* const array */;
  service: unknown /* const array */;
  service_instance: unknown /* const array */;
  realm: unknown /* const array */;
  session_key: unknown /* const array */;
  kvno: number;
  str_to_key: number;
  issue_date: number;
  lifetime: number;
  address: number;
  ticket_sz: number;
  ticket: unknown /* const array */;
  oops: number;
}

declare class kim_identity_opaque {
  constructor(init?: kim_identity_opaque);
}

declare class unnamed_5704876307744677892 {
  constructor(init?: unnamed_5704876307744677892);
  version: number;
}

declare class unnamed_8971347763078900075 {
  constructor(init?: unnamed_8971347763078900075);
  length: number;
  elements: interop.Pointer;
}

declare class gss_ctx_id_struct {
  constructor(init?: gss_ctx_id_struct);
}

declare class _krb5_gic_opt_pa_data {
  constructor(init?: _krb5_gic_opt_pa_data);
  attr: string | null;
  value: string | null;
}

declare class _krb5_prompt {
  constructor(init?: _krb5_prompt);
  prompt: string | null;
  hidden: number;
  reply: interop.Pointer;
}

declare class credentials {
  constructor(init?: credentials);
}

declare class krb5_keytab_entry_st {
  constructor(init?: krb5_keytab_entry_st);
  magic: number;
  principal: interop.Pointer;
  timestamp: number;
  vno: number;
  key: _krb5_keyblock;
}

declare class _krb5_cccol_cursor {
  constructor(init?: _krb5_cccol_cursor);
}

declare class _krb5_cc_ops {
  constructor(init?: _krb5_cc_ops);
}

declare class _krb5_ccache {
  constructor(init?: _krb5_ccache);
}

declare class _passwd_phrase_element {
  constructor(init?: _passwd_phrase_element);
  magic: number;
  passwd: interop.Pointer;
  phrase: interop.Pointer;
}

declare class _krb5_cred_enc_part {
  constructor(init?: _krb5_cred_enc_part);
  magic: number;
  nonce: number;
  timestamp: number;
  usec: number;
  s_address: interop.Pointer;
  r_address: interop.Pointer;
  ticket_info: interop.Pointer;
}

declare class _krb5_cred_info {
  constructor(init?: _krb5_cred_info);
  magic: number;
  session: interop.Pointer;
  client: interop.Pointer;
  server: interop.Pointer;
  flags: number;
  times: _krb5_ticket_times;
  caddrs: interop.Pointer;
}

declare class _krb5_response {
  constructor(init?: _krb5_response);
  magic: number;
  message_type: number;
  response: _krb5_data;
  expected_nonce: number;
  request_time: number;
}

declare class _krb5_ap_rep_enc_part {
  constructor(init?: _krb5_ap_rep_enc_part);
  magic: number;
  ctime: number;
  cusec: number;
  subkey: interop.Pointer;
  seq_number: number;
}

declare class _krb5_error {
  constructor(init?: _krb5_error);
  magic: number;
  ctime: number;
  cusec: number;
  susec: number;
  stime: number;
  error: number;
  client: interop.Pointer;
  server: interop.Pointer;
  text: _krb5_data;
  e_data: _krb5_data;
}

declare class _krb5_last_req_entry {
  constructor(init?: _krb5_last_req_entry);
  magic: number;
  lr_type: number;
  value: number;
}

declare class _krb5_creds {
  constructor(init?: _krb5_creds);
  magic: number;
  client: interop.Pointer;
  server: interop.Pointer;
  keyblock: _krb5_keyblock;
  times: _krb5_ticket_times;
  is_skey: number;
  ticket_flags: number;
  addresses: interop.Pointer;
  ticket: _krb5_data;
  second_ticket: _krb5_data;
  authdata: interop.Pointer;
}

declare class _krb5_authenticator {
  constructor(init?: _krb5_authenticator);
  magic: number;
  client: interop.Pointer;
  checksum: interop.Pointer;
  cusec: number;
  ctime: number;
  subkey: interop.Pointer;
  seq_number: number;
  authorization_data: interop.Pointer;
}

declare class _krb5_enc_tkt_part {
  constructor(init?: _krb5_enc_tkt_part);
  magic: number;
  flags: number;
  session: interop.Pointer;
  client: interop.Pointer;
  transited: _krb5_transited;
  times: _krb5_ticket_times;
  caddrs: interop.Pointer;
  authorization_data: interop.Pointer;
}

declare class _krb5_ticket_times {
  constructor(init?: _krb5_ticket_times);
  authtime: number;
  starttime: number;
  endtime: number;
  renew_till: number;
}

declare class _krb5_enc_data {
  constructor(init?: _krb5_enc_data);
  magic: number;
  enctype: number;
  kvno: number;
  ciphertext: _krb5_data;
}

declare class _krb5_encrypt_block {
  constructor(init?: _krb5_encrypt_block);
  magic: number;
  crypto_entry: number;
  key: interop.Pointer;
}

declare class _krb5_auth_context {
  constructor(init?: _krb5_auth_context);
}

declare class _krb5_context {
  constructor(init?: _krb5_context);
}

declare class krb5_principal_data {
  constructor(init?: krb5_principal_data);
  magic: number;
  realm: _krb5_data;
  data: interop.Pointer;
  length: number;
  type: number;
}

declare class _krb5_data {
  constructor(init?: _krb5_data);
  magic: number;
  length: number;
  data: string | null;
}

declare class cc_string_d {
  constructor(init?: cc_string_d);
  data: string | null;
  functions: interop.Pointer;
  vector_functions: interop.Pointer;
}

declare class cc_string_f {
  constructor(init?: cc_string_f);
  release: (p1: interop.PointerConvertible) => number | null;
}

declare class cc_credentials_f {
  constructor(init?: cc_credentials_f);
  release: (p1: interop.PointerConvertible) => number | null;
  compare: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
}

declare class cc_credentials_union {
  constructor(init?: cc_credentials_union);
  version: number;
  credentials: unnamed_13715746505189883393;
}

declare class cc_ccache_iterator_d {
  constructor(init?: cc_ccache_iterator_d);
  functions: interop.Pointer;
  vector_functions: interop.Pointer;
}

declare class cc_ccache_iterator_f {
  constructor(init?: cc_ccache_iterator_f);
  release: (p1: interop.PointerConvertible) => number | null;
  next: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  clone: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

declare class cc_ccache_d {
  constructor(init?: cc_ccache_d);
  functions: interop.Pointer;
  vector_functions: interop.Pointer;
}

declare class cc_context_f {
  constructor(init?: cc_context_f);
  release: (p1: interop.PointerConvertible) => number | null;
  get_change_time: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  get_default_ccache_name: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  open_ccache: (p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible) => number | null;
  open_default_ccache: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  create_ccache: (p1: interop.PointerConvertible, p2: string, p3: number, p4: string, p5: interop.PointerConvertible) => number | null;
  create_default_ccache: (p1: interop.PointerConvertible, p2: number, p3: string, p4: interop.PointerConvertible) => number | null;
  create_new_ccache: (p1: interop.PointerConvertible, p2: number, p3: string, p4: interop.PointerConvertible) => number | null;
  new_ccache_iterator: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  lock: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  unlock: (p1: interop.PointerConvertible) => number | null;
  compare: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  wait_for_change: (p1: interop.PointerConvertible) => number | null;
}

declare class cc_credentials_iterator_f {
  constructor(init?: cc_credentials_iterator_f);
  release: (p1: interop.PointerConvertible) => number | null;
  next: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  clone: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

declare class _krb5_ticket {
  constructor(init?: _krb5_ticket);
  magic: number;
  server: interop.Pointer;
  enc_part: _krb5_enc_data;
  enc_part2: interop.Pointer;
}

declare class _krb5_preauth_client_rock {
  constructor(init?: _krb5_preauth_client_rock);
}

declare class _krb5_pwd_data {
  constructor(init?: _krb5_pwd_data);
  magic: number;
  sequence_count: number;
  element: interop.Pointer;
}

declare class _krb5_tkt_authent {
  constructor(init?: _krb5_tkt_authent);
  magic: number;
  ticket: interop.Pointer;
  authenticator: interop.Pointer;
  ap_options: number;
}

declare class cred_union {
  constructor(init?: cred_union);
  cred_type: number;
  cred: cred_ptr_union_compat;
}

declare class _krb5_kdc_req {
  constructor(init?: _krb5_kdc_req);
  magic: number;
  msg_type: number;
  padata: interop.Pointer;
  kdc_options: number;
  client: interop.Pointer;
  server: interop.Pointer;
  from: number;
  till: number;
  rtime: number;
  nonce: number;
  nktypes: number;
  ktype: interop.Pointer;
  addresses: interop.Pointer;
  authorization_data: _krb5_enc_data;
  unenc_authdata: interop.Pointer;
  second_ticket: interop.Pointer;
}

declare class _krb5_octet_data {
  constructor(init?: _krb5_octet_data);
  magic: number;
  length: number;
  data: interop.Pointer;
}

declare class _krb5_kdc_rep {
  constructor(init?: _krb5_kdc_rep);
  magic: number;
  msg_type: number;
  padata: interop.Pointer;
  client: interop.Pointer;
  ticket: interop.Pointer;
  enc_part: _krb5_enc_data;
  enc_part2: interop.Pointer;
}

declare class ccache_cit {
  constructor(init?: ccache_cit);
}

declare class unnamed_1230767297392062464 {
  constructor(init?: unnamed_1230767297392062464);
  count: number;
  elements: interop.Pointer;
}

declare class kim_options_opaque {
  constructor(init?: kim_options_opaque);
}

declare class _krb5_get_init_creds_opt {
  constructor(init?: _krb5_get_init_creds_opt);
  flags: number;
  tkt_life: number;
  renew_life: number;
  forwardable: number;
  proxiable: number;
  etype_list: interop.Pointer;
  etype_list_length: number;
  address_list: interop.Pointer;
  preauth_list: interop.Pointer;
  preauth_list_length: number;
  salt: interop.Pointer;
}

declare class _krb5_cryptosystem_entry {
  constructor(init?: _krb5_cryptosystem_entry);
}

declare class _krb5_address {
  constructor(init?: _krb5_address);
  magic: number;
  addrtype: number;
  length: number;
  contents: interop.Pointer;
}

declare class apple_gss_krb5_authdata_if_relevant_key {
  constructor(init?: apple_gss_krb5_authdata_if_relevant_key);
  type: number;
  length: number;
  data: interop.Pointer;
}

declare class _krb5_ap_rep {
  constructor(init?: _krb5_ap_rep);
  magic: number;
  enc_part: _krb5_enc_data;
}

declare class cc_credentials_iterator_d {
  constructor(init?: cc_credentials_iterator_d);
  functions: interop.Pointer;
  vector_functions: interop.Pointer;
}

declare class unnamed_2227238517119808899 {
  constructor(init?: unnamed_2227238517119808899);
  version: number;
  initiate: number;
  endtime: number;
  send_seq: number;
  recv_seq: number;
  protocol: number;
  rfc1964_kd: gss_krb5_rfc1964_keydata;
  cfx_kd: gss_krb5_cfx_keydata;
}

declare class _krb5_checksum {
  constructor(init?: _krb5_checksum);
  magic: number;
  checksum_type: number;
  length: number;
  contents: interop.Pointer;
}

declare class gss_cred_id_struct {
  constructor(init?: gss_cred_id_struct);
}

declare class cc_ccache_f {
  constructor(init?: cc_ccache_f);
  release: (p1: interop.PointerConvertible) => number | null;
  destroy: (p1: interop.PointerConvertible) => number | null;
  set_default: (p1: interop.PointerConvertible) => number | null;
  get_credentials_version: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  get_name: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  get_principal: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  set_principal: (p1: interop.PointerConvertible, p2: number, p3: string) => number | null;
  store_credentials: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  remove_credentials: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  new_credentials_iterator: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  move: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  lock: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  unlock: (p1: interop.PointerConvertible) => number | null;
  get_last_default_time: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  get_change_time: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  compare: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  get_kdc_time_offset: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number | null;
  set_kdc_time_offset: (p1: interop.PointerConvertible, p2: number, p3: number) => number | null;
  clear_kdc_time_offset: (p1: interop.PointerConvertible, p2: number) => number | null;
  wait_for_change: (p1: interop.PointerConvertible) => number | null;
}

declare class _krb5_keyblock {
  constructor(init?: _krb5_keyblock);
  magic: number;
  enctype: number;
  length: number;
  contents: interop.Pointer;
}

declare class _krb5_enc_kdc_rep_part {
  constructor(init?: _krb5_enc_kdc_rep_part);
  magic: number;
  msg_type: number;
  session: interop.Pointer;
  last_req: interop.Pointer;
  nonce: number;
  key_exp: number;
  flags: number;
  times: _krb5_ticket_times;
  server: interop.Pointer;
  caddrs: interop.Pointer;
}

declare class cc_credentials_v5_t {
  constructor(init?: cc_credentials_v5_t);
  client: string | null;
  server: string | null;
  keyblock: cc_data;
  authtime: number;
  starttime: number;
  endtime: number;
  renew_till: number;
  is_skey: number;
  ticket_flags: number;
  addresses: interop.Pointer;
  ticket: cc_data;
  second_ticket: cc_data;
  authdata: interop.Pointer;
}

declare class _krb5_verify_init_creds_opt {
  constructor(init?: _krb5_verify_init_creds_opt);
  flags: number;
  ap_req_nofail: number;
}

declare class _profile_t {
  constructor(init?: _profile_t);
}

declare class error_table {
  constructor(init?: error_table);
  messages: interop.Pointer;
  base: number;
  count: number;
}

declare class _krb5_authdata {
  constructor(init?: _krb5_authdata);
  magic: number;
  ad_type: number;
  length: number;
  contents: interop.Pointer;
}

declare class unnamed_2859326158316158292 {
  constructor(init?: unnamed_2859326158316158292);
  length: number;
  value: interop.Pointer;
}

declare class unnamed_12969026422328130762 {
  constructor(init?: unnamed_12969026422328130762);
  sign_alg: number;
  seal_alg: number;
  ctx_key: gss_krb5_lucid_key;
}

declare class _krb5_ap_req {
  constructor(init?: _krb5_ap_req);
  magic: number;
  ap_options: number;
  ticket: interop.Pointer;
  authenticator: _krb5_enc_data;
}

declare class _krb5_pa_data {
  constructor(init?: _krb5_pa_data);
  magic: number;
  pa_type: number;
  length: number;
  contents: interop.Pointer;
}

declare class cc_credentials_d {
  constructor(init?: cc_credentials_d);
  data: interop.Pointer;
  functions: interop.Pointer;
  otherFunctions: interop.Pointer;
}

declare class _krb5_key_data {
  constructor(init?: _krb5_key_data);
}

declare class _krb5_cred {
  constructor(init?: _krb5_cred);
  magic: number;
  tickets: interop.Pointer;
  enc_part: _krb5_enc_data;
  enc_part2: interop.Pointer;
}

declare class krb5_rc_st {
  constructor(init?: krb5_rc_st);
}

declare class cc_data {
  constructor(init?: cc_data);
  type: number;
  length: number;
  data: interop.Pointer;
}

declare class krb5plugin_service_locate_ftable {
  constructor(init?: krb5plugin_service_locate_ftable);
  minor_version: number;
  init: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  fini: (p1: interop.PointerConvertible) => void | null;
  lookup: (p1: interop.PointerConvertible, p2: interop.Enum<typeof locate_service_type>, p3: string, p4: number, p5: number, p6: (p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible) => number, p7: interop.PointerConvertible) => number | null;
}

declare class unnamed_6447586739844879008 {
  constructor(init?: unnamed_6447586739844879008);
  have_acceptor_subkey: number;
  ctx_key: gss_krb5_lucid_key;
  acceptor_subkey: gss_krb5_lucid_key;
}

declare class _krb5_kt {
  constructor(init?: _krb5_kt);
}

declare class _krb5_db_entry_new {
  constructor(init?: _krb5_db_entry_new);
}

declare class cc_credentials_v5_compat {
  constructor(init?: cc_credentials_v5_compat);
  client: string | null;
  server: string | null;
  keyblock: cc_data;
  authtime: number;
  starttime: number;
  endtime: number;
  renew_till: number;
  is_skey: number;
  ticket_flags: number;
  addresses: interop.Pointer;
  ticket: cc_data;
  second_ticket: cc_data;
  authdata: interop.Pointer;
}

declare class unnamed_3856970353115069321 {
  constructor(init?: unnamed_3856970353115069321);
  type: number;
  length: number;
  data: interop.Pointer;
}

declare class gss_name_struct {
  constructor(init?: gss_name_struct);
}

declare class _krb5_transited {
  constructor(init?: _krb5_transited);
  magic: number;
  tr_type: number;
  tr_contents: _krb5_data;
}

declare class cc_credentials_v4_t {
  constructor(init?: cc_credentials_v4_t);
  version: number;
  principal: unknown /* const array */;
  principal_instance: unknown /* const array */;
  service: unknown /* const array */;
  service_instance: unknown /* const array */;
  realm: unknown /* const array */;
  session_key: unknown /* const array */;
  kvno: number;
  string_to_key_type: number;
  issue_date: number;
  lifetime: number;
  address: number;
  ticket_size: number;
  ticket: unknown /* const array */;
}

declare class cc_context_d {
  constructor(init?: cc_context_d);
  functions: interop.Pointer;
  vector_functions: interop.Pointer;
}

declare class unnamed_9316543074634143380 {
  constructor(init?: unnamed_9316543074634143380);
  initiator_addrtype: number;
  initiator_address: gss_buffer_desc_struct;
  acceptor_addrtype: number;
  acceptor_address: gss_buffer_desc_struct;
  application_data: gss_buffer_desc_struct;
}

declare class krb5_replay_data {
  constructor(init?: krb5_replay_data);
  timestamp: number;
  usec: number;
  seq: number;
}

declare class krb5plugin_preauth_server_ftable_v1 {
  constructor(init?: krb5plugin_preauth_server_ftable_v1);
  name: string | null;
  pa_type_list: interop.Pointer;
  init_proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  fini_proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
  flags_proc: (p1: interop.PointerConvertible, p2: number) => number | null;
  edata_proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, p6: interop.PointerConvertible, p7: interop.PointerConvertible) => number | null;
  verify_proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible) => number | null;
  return_proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: interop.PointerConvertible) => number, p11: interop.PointerConvertible, p12: interop.PointerConvertible) => number | null;
  freepa_reqcontext_proc: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
}

type cred_ptr_union_compatDescriptor = 
  | { pV4Cred: interop.PointerConvertible }
  | { pV5Cred: interop.PointerConvertible };

declare class cred_ptr_union_compat {
  constructor(init?: cred_ptr_union_compatDescriptor);
  pV4Cred: interop.Pointer;
  pV5Cred: interop.Pointer;
}

type unnamed_13715746505189883393Descriptor = 
  | { credentials_v4: interop.PointerConvertible }
  | { credentials_v5: interop.PointerConvertible };

declare class unnamed_13715746505189883393 {
  constructor(init?: unnamed_13715746505189883393Descriptor);
  credentials_v4: interop.Pointer;
  credentials_v5: interop.Pointer;
}

declare function cc_initialize(out_context: interop.PointerConvertible, in_version: number, out_supported_version: interop.PointerConvertible, out_vendor: interop.PointerConvertible): number;

declare function com_err(progname: string, code: number, format: string): void;

declare function com_err_va(progname: string, code: number, format: string, args: string): void;

declare function error_message(code: number): string;

declare function set_com_err_hook(handler: (p1: string, p2: number, p3: string, p4: string) => void): (p1: string, p2: number, p3: string, p4: string) => void;

declare function reset_com_err_hook(): (p1: string, p2: number, p3: string, p4: string) => void;

declare function add_error_table(et: interop.PointerConvertible): number;

declare function remove_error_table(et: interop.PointerConvertible): number;

declare function profile_init(files: interop.PointerConvertible, ret_profile: interop.PointerConvertible): number;

declare function profile_init_path(filelist: string, ret_profile: interop.PointerConvertible): number;

declare function profile_configuration_updated(): void;

declare function profile_flush(profile: interop.PointerConvertible): number;

declare function profile_flush_to_file(profile: interop.PointerConvertible, outfile: string): number;

declare function profile_flush_to_buffer(profile: interop.PointerConvertible, bufp: interop.PointerConvertible): number;

declare function profile_free_buffer(profile: interop.PointerConvertible, buf: string): void;

declare function profile_is_writable(profile: interop.PointerConvertible, writable: interop.PointerConvertible): number;

declare function profile_is_modified(profile: interop.PointerConvertible, modified: interop.PointerConvertible): number;

declare function profile_abandon(profile: interop.PointerConvertible): void;

declare function profile_release(profile: interop.PointerConvertible): void;

declare function profile_get_values(profile: interop.PointerConvertible, names: interop.PointerConvertible, ret_values: interop.PointerConvertible): number;

declare function profile_free_list(list: interop.PointerConvertible): void;

declare function profile_get_string(profile: interop.PointerConvertible, name: string, subname: string, subsubname: string, def_val: string, ret_string: interop.PointerConvertible): number;

declare function profile_get_integer(profile: interop.PointerConvertible, name: string, subname: string, subsubname: string, def_val: number, ret_default: interop.PointerConvertible): number;

declare function profile_get_boolean(profile: interop.PointerConvertible, name: string, subname: string, subsubname: string, def_val: number, ret_default: interop.PointerConvertible): number;

declare function profile_get_relation_names(profile: interop.PointerConvertible, names: interop.PointerConvertible, ret_names: interop.PointerConvertible): number;

declare function profile_get_subsection_names(profile: interop.PointerConvertible, names: interop.PointerConvertible, ret_names: interop.PointerConvertible): number;

declare function profile_iterator_create(profile: interop.PointerConvertible, names: interop.PointerConvertible, flags: number, ret_iter: interop.PointerConvertible): number;

declare function profile_iterator_free(iter_p: interop.PointerConvertible): void;

declare function profile_iterator(iter_p: interop.PointerConvertible, ret_name: interop.PointerConvertible, ret_value: interop.PointerConvertible): number;

declare function profile_release_string(str: string): void;

declare function profile_update_relation(profile: interop.PointerConvertible, names: interop.PointerConvertible, old_value: string, new_value: string): number;

declare function profile_clear_relation(profile: interop.PointerConvertible, names: interop.PointerConvertible): number;

declare function profile_rename_section(profile: interop.PointerConvertible, names: interop.PointerConvertible, new_name: string): number;

declare function profile_add_relation(profile: interop.PointerConvertible, names: interop.PointerConvertible, new_value: string): number;

declare function initialize_prof_error_table(): void;

declare function krb5_is_referral_realm(p1: interop.PointerConvertible): number;

declare function krb5_c_encrypt(context: interop.PointerConvertible, key: interop.PointerConvertible, usage: number, cipher_state: interop.PointerConvertible, input: interop.PointerConvertible, output: interop.PointerConvertible): number;

declare function krb5_c_decrypt(context: interop.PointerConvertible, key: interop.PointerConvertible, usage: number, cipher_state: interop.PointerConvertible, input: interop.PointerConvertible, output: interop.PointerConvertible): number;

declare function krb5_c_encrypt_length(context: interop.PointerConvertible, enctype: number, inputlen: number, length: interop.PointerConvertible): number;

declare function krb5_c_block_size(context: interop.PointerConvertible, enctype: number, blocksize: interop.PointerConvertible): number;

declare function krb5_c_init_state(context: interop.PointerConvertible, key: interop.PointerConvertible, usage: number, new_state: interop.PointerConvertible): number;

declare function krb5_c_free_state(context: interop.PointerConvertible, key: interop.PointerConvertible, state: interop.PointerConvertible): number;

declare function krb5_c_make_random_key(context: interop.PointerConvertible, enctype: number, k5_random_key: interop.PointerConvertible): number;

declare function krb5_c_random_add_entropy(context: interop.PointerConvertible, randsource_id: number, data: interop.PointerConvertible): number;

declare function krb5_c_random_make_octets(context: interop.PointerConvertible, data: interop.PointerConvertible): number;

declare function krb5_c_random_os_entropy(context: interop.PointerConvertible, strong: number, success: interop.PointerConvertible): number;

declare function krb5_c_random_seed(context: interop.PointerConvertible, data: interop.PointerConvertible): number;

declare function krb5_c_string_to_key(context: interop.PointerConvertible, enctype: number, string: interop.PointerConvertible, salt: interop.PointerConvertible, key: interop.PointerConvertible): number;

declare function krb5_c_string_to_key_with_params(context: interop.PointerConvertible, enctype: number, string: interop.PointerConvertible, salt: interop.PointerConvertible, params: interop.PointerConvertible, key: interop.PointerConvertible): number;

declare function krb5_c_enctype_compare(context: interop.PointerConvertible, e1: number, e2: number, similar: interop.PointerConvertible): number;

declare function krb5_c_make_checksum(context: interop.PointerConvertible, cksumtype: number, key: interop.PointerConvertible, usage: number, input: interop.PointerConvertible, cksum: interop.PointerConvertible): number;

declare function krb5_c_verify_checksum(context: interop.PointerConvertible, key: interop.PointerConvertible, usage: number, data: interop.PointerConvertible, cksum: interop.PointerConvertible, valid: interop.PointerConvertible): number;

declare function krb5_c_checksum_length(context: interop.PointerConvertible, cksumtype: number, length: interop.PointerConvertible): number;

declare function krb5_c_keyed_checksum_types(context: interop.PointerConvertible, enctype: number, count: interop.PointerConvertible, cksumtypes: interop.PointerConvertible): number;

declare function krb5_c_valid_enctype(ktype: number): number;

declare function krb5_c_valid_cksumtype(ctype: number): number;

declare function krb5_c_is_coll_proof_cksum(ctype: number): number;

declare function krb5_c_is_keyed_cksum(ctype: number): number;

declare function krb5_encrypt(context: interop.PointerConvertible, inptr: interop.PointerConvertible, outptr: interop.PointerConvertible, size: number, eblock: interop.PointerConvertible, ivec: interop.PointerConvertible): number;

declare function krb5_decrypt(context: interop.PointerConvertible, inptr: interop.PointerConvertible, outptr: interop.PointerConvertible, size: number, eblock: interop.PointerConvertible, ivec: interop.PointerConvertible): number;

declare function krb5_process_key(context: interop.PointerConvertible, eblock: interop.PointerConvertible, key: interop.PointerConvertible): number;

declare function krb5_finish_key(context: interop.PointerConvertible, eblock: interop.PointerConvertible): number;

declare function krb5_string_to_key(context: interop.PointerConvertible, eblock: interop.PointerConvertible, keyblock: interop.PointerConvertible, data: interop.PointerConvertible, salt: interop.PointerConvertible): number;

declare function krb5_init_random_key(context: interop.PointerConvertible, eblock: interop.PointerConvertible, keyblock: interop.PointerConvertible, ptr: interop.PointerConvertible): number;

declare function krb5_finish_random_key(context: interop.PointerConvertible, eblock: interop.PointerConvertible, ptr: interop.PointerConvertible): number;

declare function krb5_random_key(context: interop.PointerConvertible, eblock: interop.PointerConvertible, ptr: interop.PointerConvertible, keyblock: interop.PointerConvertible): number;

declare function krb5_eblock_enctype(context: interop.PointerConvertible, eblock: interop.PointerConvertible): number;

declare function krb5_use_enctype(context: interop.PointerConvertible, eblock: interop.PointerConvertible, enctype: number): number;

declare function krb5_encrypt_size(length: number, crypto: number): number;

declare function krb5_checksum_size(context: interop.PointerConvertible, ctype: number): number;

declare function krb5_calculate_checksum(context: interop.PointerConvertible, ctype: number, in_: interop.PointerConvertible, in_length: number, seed: interop.PointerConvertible, seed_length: number, outcksum: interop.PointerConvertible): number;

declare function krb5_verify_checksum(context: interop.PointerConvertible, ctype: number, cksum: interop.PointerConvertible, in_: interop.PointerConvertible, in_length: number, seed: interop.PointerConvertible, seed_length: number): number;

declare function krb5_cc_get_name(context: interop.PointerConvertible, cache: interop.PointerConvertible): string;

declare function krb5_cc_gen_new(context: interop.PointerConvertible, cache: interop.PointerConvertible): number;

declare function krb5_cc_initialize(context: interop.PointerConvertible, cache: interop.PointerConvertible, principal: interop.PointerConvertible): number;

declare function krb5_cc_destroy(context: interop.PointerConvertible, cache: interop.PointerConvertible): number;

declare function krb5_cc_close(context: interop.PointerConvertible, cache: interop.PointerConvertible): number;

declare function krb5_cc_store_cred(context: interop.PointerConvertible, cache: interop.PointerConvertible, creds: interop.PointerConvertible): number;

declare function krb5_cc_retrieve_cred(context: interop.PointerConvertible, cache: interop.PointerConvertible, flags: number, mcreds: interop.PointerConvertible, creds: interop.PointerConvertible): number;

declare function krb5_cc_get_principal(context: interop.PointerConvertible, cache: interop.PointerConvertible, principal: interop.PointerConvertible): number;

declare function krb5_cc_start_seq_get(context: interop.PointerConvertible, cache: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_cc_next_cred(context: interop.PointerConvertible, cache: interop.PointerConvertible, cursor: interop.PointerConvertible, creds: interop.PointerConvertible): number;

declare function krb5_cc_end_seq_get(context: interop.PointerConvertible, cache: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_cc_remove_cred(context: interop.PointerConvertible, cache: interop.PointerConvertible, flags: number, creds: interop.PointerConvertible): number;

declare function krb5_cc_set_flags(context: interop.PointerConvertible, cache: interop.PointerConvertible, flags: number): number;

declare function krb5_cc_get_type(context: interop.PointerConvertible, cache: interop.PointerConvertible): string;

declare function krb5_cc_move(context: interop.PointerConvertible, src: interop.PointerConvertible, dst: interop.PointerConvertible): number;

declare function krb5_cc_last_change_time(context: interop.PointerConvertible, ccache: interop.PointerConvertible, change_time: interop.PointerConvertible): number;

declare function krb5_cc_lock(context: interop.PointerConvertible, ccache: interop.PointerConvertible): number;

declare function krb5_cc_unlock(context: interop.PointerConvertible, ccache: interop.PointerConvertible): number;

declare function krb5_cc_cache_match(context: interop.PointerConvertible, client: interop.PointerConvertible, id: interop.PointerConvertible): number;

declare function krb5_cccol_cursor_new(context: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_cccol_cursor_next(context: interop.PointerConvertible, cursor: interop.PointerConvertible, ccache: interop.PointerConvertible): number;

declare function krb5_cccol_cursor_free(context: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_cccol_last_change_time(context: interop.PointerConvertible, change_time: interop.PointerConvertible): number;

declare function krb5_cccol_lock(context: interop.PointerConvertible): number;

declare function krb5_cccol_unlock(context: interop.PointerConvertible): number;

declare function krb5_cc_new_unique(context: interop.PointerConvertible, type: string, hint: string, id: interop.PointerConvertible): number;

declare function krb5_kt_get_type(p1: interop.PointerConvertible, keytab: interop.PointerConvertible): string;

declare function krb5_kt_get_name(context: interop.PointerConvertible, keytab: interop.PointerConvertible, name: string, namelen: number): number;

declare function krb5_kt_close(context: interop.PointerConvertible, keytab: interop.PointerConvertible): number;

declare function krb5_kt_get_entry(context: interop.PointerConvertible, keytab: interop.PointerConvertible, principal: interop.PointerConvertible, vno: number, enctype: number, entry: interop.PointerConvertible): number;

declare function krb5_kt_start_seq_get(context: interop.PointerConvertible, keytab: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_kt_next_entry(context: interop.PointerConvertible, keytab: interop.PointerConvertible, entry: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_kt_end_seq_get(context: interop.PointerConvertible, keytab: interop.PointerConvertible, cursor: interop.PointerConvertible): number;

declare function krb5_init_context(p1: interop.PointerConvertible): number;

declare function krb5_init_secure_context(p1: interop.PointerConvertible): number;

declare function krb5_free_context(p1: interop.PointerConvertible): void;

declare function krb5_copy_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_set_default_tgs_enctypes(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_get_permitted_enctypes(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_is_thread_safe(): number;

declare function krb5_server_decrypt_ticket_keytab(context: interop.PointerConvertible, kt: interop.PointerConvertible, ticket: interop.PointerConvertible): number;

declare function krb5_free_tgt_creds(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_get_credentials(p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_get_credentials_validate(p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_get_credentials_renew(p1: interop.PointerConvertible, p2: number, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_mk_req(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string, p5: string, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible): number;

declare function krb5_mk_req_extended(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible): number;

declare function krb5_mk_rep(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_rd_rep(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_mk_error(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_rd_error(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_rd_safe(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_rd_priv(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_parse_name(p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible): number;

declare function krb5_parse_name_flags(p1: interop.PointerConvertible, p2: string, p3: number, p4: interop.PointerConvertible): number;

declare function krb5_unparse_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_unparse_name_ext(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_unparse_name_flags(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible): number;

declare function krb5_unparse_name_flags_ext(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_set_principal_realm(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string): number;

declare function krb5_address_search(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_address_compare(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_address_order(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_realm_compare(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_principal_compare(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_init_keyblock(p1: interop.PointerConvertible, enctype: number, length: number, out: interop.PointerConvertible): number;

declare function krb5_copy_keyblock(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_keyblock_contents(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_creds(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_data(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_principal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_addresses(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_ticket(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_authdata(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_authenticator(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_copy_checksum(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_get_server_rcache(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_build_principal_ext(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string): number;

declare function krb5_build_principal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string): number;

declare function krb5_build_principal_alloc_va(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string, p5: string): number;

declare function krb5_425_conv_principal(p1: interop.PointerConvertible, name: string, instance: string, realm: string, princ: interop.PointerConvertible): number;

declare function krb5_524_conv_principal(context: interop.PointerConvertible, princ: interop.PointerConvertible, name: string, inst: string, realm: string): number;

declare function krb5_524_convert_creds(context: interop.PointerConvertible, v5creds: interop.PointerConvertible, v4creds: interop.PointerConvertible): number;

declare function krb5_kt_resolve(p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible): number;

declare function krb5_kt_default_name(p1: interop.PointerConvertible, p2: string, p3: number): number;

declare function krb5_kt_default(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_free_keytab_entry_contents(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_kt_remove_entry(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_kt_add_entry(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_principal2salt(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_cc_resolve(p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible): number;

declare function krb5_cc_default_name(p1: interop.PointerConvertible): string;

declare function krb5_cc_set_default_name(p1: interop.PointerConvertible, p2: string): number;

declare function krb5_cc_default(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_cc_copy_creds(context: interop.PointerConvertible, incc: interop.PointerConvertible, outcc: interop.PointerConvertible): number;

declare function krb5_cc_get_config(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: string, p5: interop.PointerConvertible): number;

declare function krb5_cc_set_config(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: string, p5: interop.PointerConvertible): number;

declare function krb5_is_config_principal(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_free_principal(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_authenticator(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_addresses(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_authdata(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_ticket(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_error(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_creds(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_cred_contents(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_checksum(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_checksum_contents(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_keyblock(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_keyblock_contents(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_ap_rep_enc_part(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_data(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_data_contents(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_free_unparsed_name(p1: interop.PointerConvertible, p2: string): void;

declare function krb5_free_cksumtypes(p1: interop.PointerConvertible, p2: interop.PointerConvertible): void;

declare function krb5_us_timeofday(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_timeofday(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_os_localaddr(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_get_default_realm(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_set_default_realm(p1: interop.PointerConvertible, p2: string): number;

declare function krb5_free_default_realm(p1: interop.PointerConvertible, p2: string): void;

declare function krb5_sname_to_principal(p1: interop.PointerConvertible, p2: string, p3: string, p4: number, p5: interop.PointerConvertible): number;

declare function krb5_change_password(context: interop.PointerConvertible, creds: interop.PointerConvertible, newpw: string, result_code: interop.PointerConvertible, result_code_string: interop.PointerConvertible, result_string: interop.PointerConvertible): number;

declare function krb5_set_password(context: interop.PointerConvertible, creds: interop.PointerConvertible, newpw: string, change_password_for: interop.PointerConvertible, result_code: interop.PointerConvertible, result_code_string: interop.PointerConvertible, result_string: interop.PointerConvertible): number;

declare function krb5_set_password_using_ccache(context: interop.PointerConvertible, ccache: interop.PointerConvertible, newpw: string, change_password_for: interop.PointerConvertible, result_code: interop.PointerConvertible, result_code_string: interop.PointerConvertible, result_string: interop.PointerConvertible): number;

declare function krb5_get_profile(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_rd_req(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible): number;

declare function krb5_kt_read_service_key(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: number, p5: number, p6: interop.PointerConvertible): number;

declare function krb5_mk_safe(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_mk_priv(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_sendauth(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: string, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible, p12: interop.PointerConvertible, p13: interop.PointerConvertible): number;

declare function krb5_recvauth(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: string, p5: interop.PointerConvertible, p6: number, p7: interop.PointerConvertible, p8: interop.PointerConvertible): number;

declare function krb5_recvauth_version(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible): number;

declare function krb5_mk_ncred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_mk_1cred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_rd_cred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function krb5_fwd_tgt_creds(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, forwardable: number, p8: interop.PointerConvertible): number;

declare function krb5_auth_con_init(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_auth_con_free(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_auth_con_setflags(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number): number;

declare function krb5_auth_con_getflags(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_set_checksum_func(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => number, p4: interop.PointerConvertible): number;

declare function krb5_auth_con_get_checksum_func(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_auth_con_setaddrs(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_auth_con_getaddrs(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_auth_con_setports(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_auth_con_setuseruserkey(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getkey(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getsendsubkey(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getrecvsubkey(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_setsendsubkey(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_setrecvsubkey(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getlocalseqnumber(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getremoteseqnumber(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_setrcache(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getrcache(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_auth_con_getauthenticator(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_read_password(p1: interop.PointerConvertible, p2: string, p3: string, p4: string, p5: interop.PointerConvertible): number;

declare function krb5_aname_to_localname(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: string): number;

declare function krb5_get_host_realm(p1: interop.PointerConvertible, p2: string, p3: interop.PointerConvertible): number;

declare function krb5_free_host_realm(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function krb5_kuserok(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string): number;

declare function krb5_auth_con_genaddrs(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number): number;

declare function krb5_set_real_time(p1: interop.PointerConvertible, p2: number, p3: number): number;

declare function krb5_get_time_offsets(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function krb5_string_to_enctype(p1: string, p2: interop.PointerConvertible): number;

declare function krb5_string_to_salttype(p1: string, p2: interop.PointerConvertible): number;

declare function krb5_string_to_cksumtype(p1: string, p2: interop.PointerConvertible): number;

declare function krb5_string_to_timestamp(p1: string, p2: interop.PointerConvertible): number;

declare function krb5_string_to_deltat(p1: string, p2: interop.PointerConvertible): number;

declare function krb5_enctype_to_string(p1: number, p2: string, p3: number): number;

declare function krb5_salttype_to_string(p1: number, p2: string, p3: number): number;

declare function krb5_cksumtype_to_string(p1: number, p2: string, p3: number): number;

declare function krb5_timestamp_to_string(p1: number, p2: string, p3: number): number;

declare function krb5_timestamp_to_sfstring(p1: number, p2: string, p3: number, p4: string): number;

declare function krb5_deltat_to_string(p1: number, p2: string, p3: number): number;

declare function krb5_prompter_posix(context: interop.PointerConvertible, data: interop.PointerConvertible, name: string, banner: string, num_prompts: number, prompts: interop.Pointer): number;

declare function krb5_get_init_creds_opt_alloc(context: interop.PointerConvertible, opt: interop.PointerConvertible): number;

declare function krb5_get_init_creds_opt_free(context: interop.PointerConvertible, opt: interop.PointerConvertible): void;

declare function krb5_get_init_creds_opt_init(opt: interop.PointerConvertible): void;

declare function krb5_get_init_creds_opt_set_tkt_life(opt: interop.PointerConvertible, tkt_life: number): void;

declare function krb5_get_init_creds_opt_set_renew_life(opt: interop.PointerConvertible, renew_life: number): void;

declare function krb5_get_init_creds_opt_set_forwardable(opt: interop.PointerConvertible, forwardable: number): void;

declare function krb5_get_init_creds_opt_set_proxiable(opt: interop.PointerConvertible, proxiable: number): void;

declare function krb5_get_init_creds_opt_set_canonicalize(opt: interop.PointerConvertible, canonicalize: number): void;

declare function krb5_get_init_creds_opt_set_etype_list(opt: interop.PointerConvertible, etype_list: interop.PointerConvertible, etype_list_length: number): void;

declare function krb5_get_init_creds_opt_set_address_list(opt: interop.PointerConvertible, addresses: interop.PointerConvertible): void;

declare function krb5_get_init_creds_opt_set_preauth_list(opt: interop.PointerConvertible, preauth_list: interop.PointerConvertible, preauth_list_length: number): void;

declare function krb5_get_init_creds_opt_set_salt(opt: interop.PointerConvertible, salt: interop.PointerConvertible): void;

declare function krb5_get_init_creds_opt_set_change_password_prompt(opt: interop.PointerConvertible, prompt: number): void;

declare function krb5_get_init_creds_opt_set_pa(context: interop.PointerConvertible, opt: interop.PointerConvertible, attr: string, value: string): number;

declare function krb5_get_init_creds_opt_set_process_last_req(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number, p4: interop.PointerConvertible): number;

declare function krb5_get_init_creds_password(context: interop.PointerConvertible, creds: interop.PointerConvertible, client: interop.PointerConvertible, password: string, prompter: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: string, p4: string, p5: number, p6: interop.PointerConvertible) => number, data: interop.PointerConvertible, start_time: number, in_tkt_service: string, k5_gic_options: interop.PointerConvertible): number;

declare function krb5_get_init_creds_keytab(context: interop.PointerConvertible, creds: interop.PointerConvertible, client: interop.PointerConvertible, arg_keytab: interop.PointerConvertible, start_time: number, in_tkt_service: string, k5_gic_options: interop.PointerConvertible): number;

declare function krb5_verify_init_creds_opt_init(k5_vic_options: interop.PointerConvertible): void;

declare function krb5_verify_init_creds_opt_set_ap_req_nofail(k5_vic_options: interop.PointerConvertible, ap_req_nofail: number): void;

declare function krb5_verify_init_creds(context: interop.PointerConvertible, creds: interop.PointerConvertible, ap_req_server: interop.PointerConvertible, ap_req_keytab: interop.PointerConvertible, ccache: interop.PointerConvertible, k5_vic_options: interop.PointerConvertible): number;

declare function krb5_get_validated_creds(context: interop.PointerConvertible, creds: interop.PointerConvertible, client: interop.PointerConvertible, ccache: interop.PointerConvertible, in_tkt_service: string): number;

declare function krb5_get_renewed_creds(context: interop.PointerConvertible, creds: interop.PointerConvertible, client: interop.PointerConvertible, ccache: interop.PointerConvertible, in_tkt_service: string): number;

declare function krb5_decode_ticket(code: interop.PointerConvertible, rep: interop.PointerConvertible): number;

declare function krb5_appdefault_string(context: interop.PointerConvertible, appname: string, realm: interop.PointerConvertible, option: string, default_value: string, ret_value: interop.PointerConvertible): void;

declare function krb5_appdefault_boolean(context: interop.PointerConvertible, appname: string, realm: interop.PointerConvertible, option: string, default_value: number, ret_value: interop.PointerConvertible): void;

declare function krb5_get_prompt_types(context: interop.PointerConvertible): interop.Pointer;

declare function krb5_set_error_message(p1: interop.PointerConvertible, p2: number, p3: string): void;

declare function krb5_vset_error_message(p1: interop.PointerConvertible, p2: number, p3: string, p4: string): void;

declare function krb5_get_error_message(p1: interop.PointerConvertible, p2: number): string;

declare function krb5_free_error_message(p1: interop.PointerConvertible, p2: string): void;

declare function krb5_clear_error_message(p1: interop.PointerConvertible): void;

declare function initialize_krb5_error_table(): void;

declare function initialize_k524_error_table(): void;

declare function initialize_asn1_error_table(): void;

declare function gss_acquire_cred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: number, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible): number;

declare function gss_release_cred(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_init_sec_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible, p12: interop.PointerConvertible, p13: interop.PointerConvertible): number;

declare function gss_accept_sec_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible): number;

declare function gss_process_context_token(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_delete_sec_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_context_time(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_get_mic(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function gss_verify_mic(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function gss_wrap(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible): number;

declare function gss_unwrap(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible): number;

declare function gss_display_status(p1: interop.PointerConvertible, p2: number, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible): number;

declare function gss_indicate_mechs(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_compare_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function gss_display_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function gss_import_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function gss_release_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_release_buffer(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_release_oid_set(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_inquire_cred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible): number;

declare function gss_inquire_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible, p8: interop.PointerConvertible, p9: interop.PointerConvertible): number;

declare function gss_wrap_size_limit(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: number, p6: interop.PointerConvertible): number;

declare function gss_add_cred(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: number, p6: number, p7: number, p8: interop.PointerConvertible, p9: interop.PointerConvertible, p10: interop.PointerConvertible, p11: interop.PointerConvertible): number;

declare function gss_inquire_cred_by_mech(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible): number;

declare function gss_export_sec_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_import_sec_context(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_release_oid(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_create_empty_oid_set(p1: interop.PointerConvertible, p2: interop.PointerConvertible): number;

declare function gss_add_oid_set_member(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_test_oid_set_member(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function gss_str_to_oid(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_oid_to_str(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_inquire_names_for_mech(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_inquire_mechs_for_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_sign(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function gss_verify(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible): number;

declare function gss_seal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: number, p4: number, p5: interop.PointerConvertible, p6: interop.PointerConvertible, p7: interop.PointerConvertible): number;

declare function gss_unseal(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible, p5: interop.PointerConvertible, p6: interop.PointerConvertible): number;

declare function gss_export_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_duplicate_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible): number;

declare function gss_canonicalize_name(p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible): number;

declare function krb5_gss_register_acceptor_identity(p1: string): number;

declare function gss_krb5_get_tkt_flags(minor_status: interop.PointerConvertible, context_handle: interop.PointerConvertible, ticket_flags: interop.PointerConvertible): number;

declare function gss_krb5_copy_ccache(minor_status: interop.PointerConvertible, cred_handle: interop.PointerConvertible, out_ccache: interop.PointerConvertible): number;

declare function gss_krb5_ccache_name(minor_status: interop.PointerConvertible, name: string, out_name: interop.PointerConvertible): number;

declare function gss_krb5_set_allowable_enctypes(minor_status: interop.PointerConvertible, cred: interop.PointerConvertible, num_ktypes: number, ktypes: interop.PointerConvertible): number;

declare function gss_krb5_export_lucid_sec_context(minor_status: interop.PointerConvertible, context_handle: interop.PointerConvertible, version: number, kctx: interop.PointerConvertible): number;

declare function apple_gss_krb5_export_authdata_if_relevant_context(minor_status: interop.PointerConvertible, context_handle: interop.PointerConvertible, version: number, kctx: interop.PointerConvertible): number;

declare function apple_gss_krb5_free_authdata_if_relevant(minor_status: interop.PointerConvertible, kctx: interop.PointerConvertible): number;

declare function gss_krb5_free_lucid_sec_context(minor_status: interop.PointerConvertible, kctx: interop.PointerConvertible): number;

declare function gss_krb5_ui(p1: interop.PointerConvertible, p2: number): number;

declare function KLAcquireTickets(inPrincipal: interop.PointerConvertible, outPrincipal: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLAcquireNewTickets(inPrincipal: interop.PointerConvertible, outPrincipal: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLAcquireTicketsWithPassword(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, inPassword: string, outCredCacheName: interop.PointerConvertible): number;

declare function KLAcquireNewTicketsWithPassword(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, inPassword: string, outCredCacheName: interop.PointerConvertible): number;

declare function KLSetApplicationOptions(inAppOptions: interop.PointerConvertible): number;

declare function KLGetApplicationOptions(outAppOptions: interop.PointerConvertible): number;

declare function KLAcquireInitialTickets(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, outPrincipal: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLAcquireNewInitialTickets(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, outPrincipal: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLDestroyTickets(inPrincipal: interop.PointerConvertible): number;

declare function KLChangePassword(inPrincipal: interop.PointerConvertible): number;

declare function KLAcquireInitialTicketsWithPassword(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, inPassword: string, outCredCacheName: interop.PointerConvertible): number;

declare function KLAcquireNewInitialTicketsWithPassword(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, inPassword: string, outCredCacheName: interop.PointerConvertible): number;

declare function KLAcquireNewInitialTicketCredentialsWithPassword(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, inPassword: string, inV5Context: interop.PointerConvertible, outGotV4Credentials: interop.PointerConvertible, outGotV5Credentials: interop.PointerConvertible, outV4Credentials: interop.PointerConvertible, outV5Credentials: interop.PointerConvertible): number;

declare function KLStoreNewInitialTicketCredentials(inPrincipal: interop.PointerConvertible, inV5Context: interop.PointerConvertible, inV4Credentials: interop.PointerConvertible, inV5Credentials: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLVerifyInitialTickets(inPrincipal: interop.PointerConvertible, inFailIfNoHostKey: number, outCredCacheName: interop.PointerConvertible): number;

declare function KLVerifyInitialTicketCredentials(inV4Credentials: interop.PointerConvertible, inV5Credentials: interop.PointerConvertible, inFailIfNoHostKey: number): number;

declare function KLAcquireNewInitialTicketsWithKeytab(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, inKeytabName: string, outCredCacheName: interop.PointerConvertible): number;

declare function KLRenewInitialTickets(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, outPrincipal: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLValidateInitialTickets(inPrincipal: interop.PointerConvertible, inLoginOptions: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLLastChangedTime(outLastChangedTime: interop.PointerConvertible): number;

declare function KLCacheHasValidTickets(inPrincipal: interop.PointerConvertible, inKerberosVersion: number, outFoundValidTickets: interop.PointerConvertible, outPrincipal: interop.PointerConvertible, outCredCacheName: interop.PointerConvertible): number;

declare function KLTicketStartTime(inPrincipal: interop.PointerConvertible, inKerberosVersion: number, outStartTime: interop.PointerConvertible): number;

declare function KLTicketExpirationTime(inPrincipal: interop.PointerConvertible, inKerberosVersion: number, outExpirationTime: interop.PointerConvertible): number;

declare function KLSetSystemDefaultCache(inPrincipal: interop.PointerConvertible): number;

declare function KLHandleError(inError: number, inDialogIdentifier: number, inShowAlert: number): number;

declare function KLGetErrorString(inError: number, outErrorString: interop.PointerConvertible): number;

declare function KLCancelAllDialogs(): number;

declare function KLChangePasswordWithPasswords(inPrincipal: interop.PointerConvertible, inOldPassword: string, inNewPassword: string, outRejected: interop.PointerConvertible, outRejectionError: interop.PointerConvertible, outRejectionDescription: interop.PointerConvertible): number;

declare function KLSetIdleCallback(inCallback: (p1: number) => void, inRefCon: number): number;

declare function KLGetIdleCallback(inCallback: interop.PointerConvertible, inRefCon: interop.PointerConvertible): number;

declare function KLGetDefaultLoginOption(inOption: number, ioBuffer: interop.PointerConvertible, ioBufferSize: interop.PointerConvertible): number;

declare function KLSetDefaultLoginOption(inOption: number, inBuffer: interop.PointerConvertible, inBufferSize: number): number;

declare function KLFindKerberosRealmByName(inRealmName: string, outIndex: interop.PointerConvertible): number;

declare function KLGetKerberosRealm(inIndex: number, outRealmName: interop.PointerConvertible): number;

declare function KLSetKerberosRealm(inIndex: number, inRealmName: string): number;

declare function KLRemoveKerberosRealm(inIndex: number): number;

declare function KLInsertKerberosRealm(inInsertBeforeIndex: number, inRealmName: string): number;

declare function KLRemoveAllKerberosRealms(): number;

declare function KLCountKerberosRealms(): number;

declare function KLGetKerberosDefaultRealm(outIndex: interop.PointerConvertible): number;

declare function KLGetKerberosDefaultRealmByName(outRealmName: interop.PointerConvertible): number;

declare function KLSetKerberosDefaultRealm(inIndex: number): number;

declare function KLSetKerberosDefaultRealmByName(inRealm: string): number;

declare function KLCreatePrincipalFromTriplet(inName: string, inInstance: string, inRealm: string, outPrincipal: interop.PointerConvertible): number;

declare function KLCreatePrincipalFromString(inFullPrincipal: string, inKerberosVersion: number, outPrincipal: interop.PointerConvertible): number;

declare function KLCreatePrincipalFromKerberos5Principal(inKerberos5Principal: interop.PointerConvertible, outPrincipal: interop.PointerConvertible): number;

declare function KLCreatePrincipalFromPrincipal(inPrincipal: interop.PointerConvertible, outPrincipal: interop.PointerConvertible): number;

declare function KLGetTripletFromPrincipal(inPrincipal: interop.PointerConvertible, outName: interop.PointerConvertible, outInstance: interop.PointerConvertible, outRealm: interop.PointerConvertible): number;

declare function KLGetStringFromPrincipal(inPrincipal: interop.PointerConvertible, inKerberosVersion: number, outFullPrincipal: interop.PointerConvertible): number;

declare function KLGetDisplayStringFromPrincipal(inPrincipal: interop.PointerConvertible, inKerberosVersion: number, outFullPrincipal: interop.PointerConvertible): number;

declare function KLComparePrincipal(inFirstPrincipal: interop.PointerConvertible, inSecondPrincipal: interop.PointerConvertible, outAreEquivalent: interop.PointerConvertible): number;

declare function KLDisposePrincipal(inPrincipal: interop.PointerConvertible): number;

declare function KLCreateLoginOptions(outOptions: interop.PointerConvertible): number;

declare function KLLoginOptionsSetTicketLifetime(ioOptions: interop.PointerConvertible, inTicketLifetime: number): number;

declare function KLLoginOptionsSetForwardable(ioOptions: interop.PointerConvertible, inForwardable: number): number;

declare function KLLoginOptionsSetProxiable(ioOptions: interop.PointerConvertible, inProxiable: number): number;

declare function KLLoginOptionsSetRenewableLifetime(ioOptions: interop.PointerConvertible, inRenewableLifetime: number): number;

declare function KLLoginOptionsSetAddressless(ioOptions: interop.PointerConvertible, inAddressless: number): number;

declare function KLLoginOptionsSetTicketStartTime(ioOptions: interop.PointerConvertible, inStartTime: number): number;

declare function KLLoginOptionsSetServiceName(ioOptions: interop.PointerConvertible, inServiceName: string): number;

declare function KLDisposeLoginOptions(ioOptions: interop.PointerConvertible): number;

declare function KLDisposeString(inStringToDispose: string): number;

declare function cc_shutdown(io_context: interop.PointerConvertible): number;

declare function cc_get_NC_info(in_context: interop.PointerConvertible, out_info: interop.PointerConvertible): number;

declare function cc_get_change_time(in_context: interop.PointerConvertible, out_change_time: interop.PointerConvertible): number;

declare function cc_open(in_context: interop.PointerConvertible, in_name: string, in_version: number, in_flags: number, out_ccache: interop.PointerConvertible): number;

declare function cc_create(in_context: interop.PointerConvertible, in_name: string, in_principal: string, in_version: number, in_flags: number, out_ccache: interop.PointerConvertible): number;

declare function cc_close(in_context: interop.PointerConvertible, ioCCache: interop.PointerConvertible): number;

declare function cc_destroy(in_context: interop.PointerConvertible, io_ccache: interop.PointerConvertible): number;

declare function cc_seq_fetch_NCs_begin(in_context: interop.PointerConvertible, out_nc_iterator: interop.PointerConvertible): number;

declare function cc_seq_fetch_NCs_next(in_context: interop.PointerConvertible, out_ccache: interop.PointerConvertible, in_nc_iterator: interop.PointerConvertible): number;

declare function cc_seq_fetch_NCs_end(in_context: interop.PointerConvertible, io_nc_iterator: interop.PointerConvertible): number;

declare function cc_get_name(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, out_name: interop.PointerConvertible): number;

declare function cc_get_cred_version(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, out_version: interop.PointerConvertible): number;

declare function cc_set_principal(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, in_version: number, in_principal: string): number;

declare function cc_get_principal(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, out_principal: interop.PointerConvertible): number;

declare function cc_store(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, in_credentials: cred_union): number;

declare function cc_remove_cred(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, in_credentials: cred_union): number;

declare function cc_seq_fetch_creds_begin(in_context: interop.PointerConvertible, in_ccache: interop.PointerConvertible, out_ccache_iterator: interop.PointerConvertible): number;

declare function cc_seq_fetch_creds_next(in_context: interop.PointerConvertible, out_cred_union: interop.PointerConvertible, in_ccache_iterator: interop.PointerConvertible): number;

declare function cc_seq_fetch_creds_end(in_context: interop.PointerConvertible, io_ccache_iterator: interop.PointerConvertible): number;

declare function cc_free_principal(in_context: interop.PointerConvertible, io_principal: interop.PointerConvertible): number;

declare function cc_free_name(in_context: interop.PointerConvertible, io_name: interop.PointerConvertible): number;

declare function cc_free_creds(in_context: interop.PointerConvertible, io_cred_union: interop.PointerConvertible): number;

declare function cc_free_NC_info(in_context: interop.PointerConvertible, io_info: interop.PointerConvertible): number;

