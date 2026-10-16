import type { DERItem, NSObject, NSObjectProtocol, audit_token_t } from './Runtime'

import type { interop } from './objc-runtime'

import { NativeObject } from './objc-runtime'

export declare const kSecAsn1SetOfUTCTimeTemplate: interop.Pointer

export declare const kSecAsn1SetOfUniversalStringTemplate: interop.Pointer

export declare const kSecAsn1SetOfOctetStringTemplate: interop.Pointer

export declare const kSecAsn1SetOfObjectIDTemplate: interop.Pointer

export declare const kSecAsn1SetOfNullTemplate: interop.Pointer

export declare const kSecAsn1SetOfIntegerTemplate: interop.Pointer

export declare const kSecAsn1SetOfGeneralizedTimeTemplate: interop.Pointer

export declare const kSecAsn1SetOfBitStringTemplate: interop.Pointer

export declare const kSecAsn1SetOfAnyTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfTeletexStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfVisibleStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfUTF8StringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfUTCTimeTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfUniversalStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfT61StringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfPrintableStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfOctetStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfObjectIDTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfNullTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfIntegerTemplate: interop.Pointer

export declare const kSecAsn1PointerToTeletexStringTemplate: interop.Pointer

export declare const kSecAsn1PointerToUTF8StringTemplate: interop.Pointer

export declare const kSecAsn1PointerToPrintableStringTemplate: interop.Pointer

export declare const kSecAsn1PointerToOctetStringTemplate: interop.Pointer

export declare const kSecAsn1PointerToObjectIDTemplate: interop.Pointer

export declare const kSecAsn1PointerToIntegerTemplate: interop.Pointer

export declare const kSecAsn1PointerToIA5StringTemplate: interop.Pointer

export declare const kSecAsn1PointerToGeneralizedTimeTemplate: interop.Pointer

export declare const kSecAsn1PointerToEnumeratedTemplate: interop.Pointer

export declare const kSecAsn1PointerToBitStringTemplate: interop.Pointer

export declare const kSecAsn1PointerToAnyTemplate: interop.Pointer

export declare const kSecAsn1TeletexStringTemplate: interop.Pointer

export declare const kSecAsn1UniversalStringTemplate: interop.Pointer

export declare const kSecAsn1PrintableStringTemplate: interop.Pointer

export declare const kSecAsn1ObjectIDTemplate: interop.Pointer

export declare const kSecAsn1UnsignedIntegerTemplate: interop.Pointer

export declare const kSecAsn1GeneralizedTimeTemplate: interop.Pointer

export declare const kSecAsn1EnumeratedTemplate: interop.Pointer

export declare const kSecAsn1BooleanTemplate: interop.Pointer

export declare const kSecAsn1BMPStringTemplate: interop.Pointer

export declare const kSecAsn1AnyTemplate: interop.Pointer

export declare const kSecAsn1BitStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfGeneralizedTimeTemplate: interop.Pointer

export declare const kSecAsn1PointerToUTCTimeTemplate: interop.Pointer

export declare const kSecAsn1SetOfUTF8StringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfIA5StringTemplate: interop.Pointer

export declare const kSecAsn1SetOfBMPStringTemplate: interop.Pointer

export declare const kSecAsn1SetOfVisibleStringTemplate: interop.Pointer

export declare const kSecAsn1SequenceOfBooleanTemplate: interop.Pointer

export declare const kSecAsn1SkipTemplate: interop.Pointer

export declare const kSecAsn1SetOfEnumeratedTemplate: interop.Pointer

export declare const errSecMissingAttributeMode: number

export declare const CSSMOID_DOTMAC_CERT_REQ_VALUE_USERNAME: cssm_data

export declare const CSSMOID_X509V3CertificateExtensionValue: cssm_data

export declare const TLS_RSA_WITH_RC4_128_SHA: number

export declare const CSSMOID_SerialNumber: cssm_data

export declare const kSecTransformErrorInvalidInputDictionary: number

export declare const kSecPolicyAppleIDValidation: interop.Pointer

export declare const CSSM_TP_CERTCHANGE_OK: number

export declare const CSSM_DL_DB_RECORD_CERT: number

export declare const CSSM_ERRCODE_ACL_CHANGE_FAILED: number

export declare const CSSMOID_KnowledgeInformation: cssm_data

export declare const kSecPolicyName: interop.Pointer

export declare const CSSM_ATTRIBUTE_KEY: number

export declare const CSSM_ALGMODE_WRAP: number

export declare const CSSMOID_secp521r1: cssm_data

export declare const CSSMERR_CL_FUNCTION_NOT_IMPLEMENTED: number

export declare const errSecOCSPResponderInternalError: number

export declare const CSSMERR_CL_INTERNAL_ERROR: number

export declare const errSecTimestampNotTrusted: number

export declare const CSSMOID_sect131r1: cssm_data

export declare const errSessionSuccess: number

export declare const TLS_DH_RSA_WITH_AES_256_CBC_SHA: number

export declare const CSSMERR_DL_INVALID_NEW_ACL_ENTRY: number

export declare const CSSM_WORDID__RESERVED_1: number

export declare const SSL_DHE_RSA_WITH_DES_CBC_SHA: number

export declare const CSSMERR_TP_INVALID_CRL_POINTER: number

export declare const CSSMERR_CSP_INVALID_DIGEST_ALGORITHM: number

export declare const CSSMOID_X509V3CertificateExtensionCritical: cssm_data

export declare const CSSM_ALGID_ConcatDataAndBase: number

export declare const CSSMERR_APPLE_DOTMAC_FAILED_CONSISTENCY_CHECK: number

export declare const CSSM_WORDID_SIGNED_SECRET: number

export declare const CSSM_ALGID_3DES_2KEY_EDE: number

export declare const CSSMERR_CSP_INVALID_ATTR_PASSPHRASE: number

export declare const kSecPolicyKU_KeyEncipherment: interop.Pointer

export declare const kSecOIDKERBv5_PKINIT_KP_KDC: interop.Pointer

export declare const CSSM_ADDR_NONE: number

export declare const CSSM_WORDID_D: number

export declare const errSecMissingAttributeEffectiveBits: number

export declare const CSSMOID_SupportedApplicationContext: cssm_data

export declare const kCMSEncoderDigestAlgorithmSHA1: interop.Pointer

export declare const CSSMERR_CSP_ALGID_MISMATCH: number

export declare const CSSMOID_SHA512: cssm_data

export declare const CSSMERR_CSSM_MODULE_MANAGER_NOT_FOUND: number

export declare const CSSM_CERT_BUNDLE_PFX: number

export declare const CSSMERR_APPLETP_CERT_NOT_FOUND_FROM_ISSUER: number

export declare const kSecOIDDOTMAC_CERT_EMAIL_ENCRYPT: interop.Pointer

export declare const CSSMOID_X9_62_EllCurve: cssm_data

export declare const CSSM_USEE_KRLE: number

export declare const CSSM_ACL_SUBJECT_TYPE_PREAUTH: number

export declare const CSSMERR_CSP_INVALID_NEW_ACL_OWNER: number

export declare const kSecOIDX509V1SubjectName: interop.Pointer

export declare const CSSMOID_PKCS12_pbeWithSHAAnd3Key3DESCBC: cssm_data

export declare const kSecOIDUseExemptions: interop.Pointer

export declare const kSecSerialNumberItemAttr: number

export declare const errSSLCrypto: number

export declare const kSecKeyAlgorithmECIESEncryptionStandardVariableIVX963SHA384AESGCM: interop.Pointer

export declare const kSecOIDCertIssuer: interop.Pointer

export declare const CSSM_SERVICE_CL: number

export declare const CSSMERR_CSP_INVALID_ATTR_SYMMETRIC_KEY_FORMAT: number

export declare const CSSMERR_CSP_INVALID_ATTR_KEY_LENGTH: number

export declare const CSSM_WORDID_CRL: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA384AESGCM: interop.Pointer

export declare const CSSM_ALGID_APPLE_YARROW: number

export declare const errSecInvalidTrustSettings: number

export declare const CSSMERR_CSP_OBJECT_USE_AUTH_DENIED: number

export declare const CSSMOID_RSAWithOAEP: cssm_data

export declare const CSSMERR_CSP_INVALID_ATTR_MODE: number

export declare const CSSMERR_CSSM_EVENT_NOTIFICATION_CALLBACK_NOT_FOUND: number

export declare const CSSMERR_DL_INVALID_INPUT_POINTER: number

export declare const kSecAsn1SequenceOfBitStringTemplate: interop.Pointer

export declare const errSecPublicKeyInconsistent: number

export declare const CSSMERR_CSSM_INVALID_ADDIN_FUNCTION_TABLE: number

export declare const errSecUnsupportedService: number

export declare const CSSM_WORDID__STAR_: number

export declare const CSSM_PADDING_APPLE_SSLv2: number

export declare const errSecMultipleValuesUnsupported: number

export declare const kSecCertTypeItemAttr: number

export declare const CSSMERR_TP_INVALID_ACTION_DATA: number

export declare const errSecModuleManagerNotFound: number

export declare const CSSM_ATTRIBUTE_OUTPUT_SIZE: number

export declare const errSecUnsupportedFormat: number

export declare const CSSM_ACL_SUBJECT_TYPE_PUBLIC_KEY: number

export declare const CSSMOID_APPLE_EXTENSION_CODE_SIGNING: cssm_data

export declare const CSSMERR_TP_NO_USER_INTERACTION: number

export declare const TLS_AES_128_GCM_SHA256: number

export declare const kSecOAEPEncodingParametersAttributeName: interop.Pointer

export declare const CSSM_ATTRIBUTE_PASSPHRASE: number

export declare const CSSMERR_TP_CRL_ALREADY_SIGNED: number

export declare const TLS_DH_RSA_WITH_AES_256_GCM_SHA384: number

export declare const errSecInvalidFormType: number

export declare const CSSMERR_APPLETP_OCSP_NO_SIGNER: number

export declare const CSSMOID_PKCS5_RC2_CBC: cssm_data

export declare const CSSMOID_APPLE_TP_APPLEID_SHARING: cssm_data

export declare const oidDescription: DERItem

export declare const CSSMERR_CSP_INVALID_CONTEXT: number

export declare const kSecCSDoNotValidateExecutable: number

export declare const CSSMOID_secp256r1: cssm_data

export declare const kSecAsn1IntegerTemplate: interop.Pointer

export declare const CSSM_DB_DATASTORES_UNKNOWN: number

export declare const CSSM_ALGCLASS_SYMMETRIC: number

export declare const oidNetscapeCertType: DERItem

export declare const CSSM_ALGID_SHA1WithECDSA: number

export declare const kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA1: interop.Pointer

export declare const CSSMERR_CSP_MISSING_ATTR_VERSION: number

export declare const CSSM_TP_CERTVERIFY_UNKNOWN: number

export declare const errSecNoFieldValues: number

export declare const CSSM_FEE_PRIME_TYPE_GENERAL: number

export declare const errSecSMIMEBadKeyUsage: number

export declare const kSecOIDExtendedUseCodeSigning: interop.Pointer

export declare const errSecRequestRejected: number

export declare const oidAnyExtendedKeyUsage: DERItem

export declare const kSecEncryptKey: interop.Pointer

export declare const CSSM_DB_INDEX_UNIQUE: number

export declare const CSSM_WORDID_DSA: number

export declare const errSSLModuleAttach: number

export declare const CSSM_WORDID_EXPORT_CLEAR: number

export declare const CSSMERR_TP_INVALID_TIMESTRING: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_22: number

export declare const CSSMERR_TP_CERT_REVOKED: number

export declare const kSecKeyAlgorithmECDHKeyExchangeStandardX963SHA384: interop.Pointer

export declare const CSSM_CERT_X_509v1: number

export declare const CSSM_ATTRIBUTE_CSP_HANDLE: number

export declare const errSecReadOnly: number

export declare const TLS_PSK_WITH_AES_128_GCM_SHA256: number

export declare const CSSMOID_X509V1IssuerNameStd: cssm_data

export declare const CSSM_CERT_ENCODING_MULTIPLE: number

export declare const CSSM_CSP_TOK_WRITE_PROTECTED: number

export declare const CSSMERR_CSP_ACL_ADD_FAILED: number

export declare const kSecKeyAlgorithmECDHKeyExchangeCofactorX963SHA512: interop.Pointer

export declare const errSecCSCancelled: number

export declare const kAuthorizationPluginInterfaceVersion: number

export declare const errSSLPeerUnexpectedMsg: number

export declare const errSecCSUnsupportedDigestAlgorithm: number

export declare const kSecTransformActionStartingExecution: interop.Pointer

export declare const CSSM_CERT_ENCODING_PGP: number

export declare const CSSM_SERVICE_AC: number

export declare const CSSM_CERT_ENCODING_NDR: number

export declare const CSSMERR_CSSM_EMM_UNLOAD_FAILED: number

export declare const CSSM_DL_DB_SCHEMA_PARSING_MODULE: number

export declare const CSSM_ALGID_JUNIPER: number

export declare const kSecAsn1SetOfPrintableStringTemplate: interop.Pointer

export declare const CSSM_ALGID_ExtractFromKey: number

export declare const kSecRandomDefault: interop.Pointer

export declare const CSSMOID_SHA1WithDSA: cssm_data

export declare const CSSM_ALGMODE_OFB_IV8: number

export declare const CSSM_ALGID_FEE_SHA1: number

export declare const CSSMERR_CL_FUNCTION_FAILED: number

export declare const oidSha512Rsa: DERItem

export declare const CSSM_CSP_RDR_HW: number

export declare const errSecMissingAttributePrivateKeyFormat: number

export declare const CSSMOID_sect113r2: cssm_data

export declare const kSecGuestAttributeMachPort: interop.Pointer

export declare const CSSM_ALGCLASS_UNIQUEGEN: number

export declare const kSecCodeInfoDefaultDesignatedLightweightCodeRequirement: interop.Pointer

export declare const CSSM_WORDID_ONE_TIME: number

export declare const CSSM_ERRCODE_OBJECT_ACL_REQUIRED: number

export declare const errSessionInvalidFlags: number

export declare const errSecInvaldCRLAuthority: number

export declare const CSSMERR_CSP_FUNCTION_FAILED: number

export declare const oidExtendedKeyUsageMicrosoftSGC: DERItem

export declare const errSecMobileMeServerAlreadyExists: number

export declare const kSecUseDataProtectionKeychain: interop.Pointer

export declare const CSSM_ALGID_MD2: number

export declare const CSSMERR_DL_DEVICE_RESET: number

export declare const kSecCodeInfoPList: interop.Pointer

export declare const errSecNotSigner: number

export declare const kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA224: interop.Pointer

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTRESUME: number

export declare const kSecAsn1SequenceOfAnyTemplate: interop.Pointer

export declare const SSL_DHE_RSA_EXPORT_WITH_DES40_CBC_SHA: number

export declare const CSSM_ERRCODE_SERVICE_NOT_AVAILABLE: number

export declare const TLS_PSK_WITH_NULL_SHA256: number

export declare const kSecOIDCrlNumber: interop.Pointer

export declare const CSSMERR_CSSM_INCOMPATIBLE_VERSION: number

export declare const CSSM_ALGID_DESX: number

export declare const CSSM_CONTEXT_EVENT_CREATE: number

export declare const CSSM_ERRCODE_INVALID_CERT_POINTER: number

export declare const CSSM_USEE_KEYEXCH: number

export declare const errSSLPeerHandshakeFail: number

export declare const CSSM_ALGID_HAVAL3: number

export declare const CSSMERR_AC_INVALID_INPUT_POINTER: number

export declare const CSSMOID_TimeStamping: cssm_data

export declare const errSecCSInvalidRuntimeVersion: number

export declare const errSecTimestampWaiting: number

export declare const kSecZLibEncoding: interop.Pointer

export declare const oidQtCps: DERItem

export declare const CSSM_WORDID_B: number

export declare const CSSM_ALGID_MD5Random: number

export declare const errSecHostNameMismatch: number

export declare const kSecCompressionRatio: interop.Pointer

export declare const CSSM_WORDID_RSA_PKCS1_SHA1: number

export declare const CSSM_WORDID_CANCELED: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA1AESGCM: interop.Pointer

export declare const errSecKeyIsSensitive: number

export declare const kSecKeyAlgorithmRSASignatureMessagePSSSHA384: interop.Pointer

export declare const CSSM_ERRCODE_ACL_BASE_CERTS_NOT_SUPPORTED: number

export declare const TLS_ECDH_ECDSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_ExtendedKeyUsageAny: cssm_data

export declare const CSSM_DL_DB_SCHEMA_ATTRIBUTES: number

export declare const kSecAttrAccessible: interop.Pointer

export declare const CSSMERR_CSSM_INVALID_POINTER: number

export declare const TLS_RSA_PSK_WITH_AES_256_CBC_SHA384: number

export declare const kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA512: interop.Pointer

export declare const TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA1: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_DELETE: number

export declare const CSSMOID_PKCS5_PBKDF2: cssm_data

export declare const kSecAsn1OctetStringTemplate: interop.Pointer

export declare const kSecAttrAccessGroupToken: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_PARTITION_ID: number

export declare const errSecMissingAttributeSymmetricKeyFormat: number

export declare const CSSMERR_DL_ENDOFDATA: number

export declare const CSSM_CERT_STATUS_IS_FROM_NET: number

export declare const CSSM_ALGID_3DES_3KEY_EDE: number

export declare const errSecTimestampBadDataFormat: number

export declare const CSSM_ALGID_PKCS5_PBKDF1_SHA1: number

export declare const CSSM_CONTEXT_EVENT_DELETE: number

export declare const CSSM_SAMPLE_TYPE_PREAUTH: number

export declare const CSSM_SAMPLE_TYPE_PROMPTED_PASSWORD: number

export declare const CSSM_WORDID_C: number

export declare const errSecIncompatibleFieldFormat: number

export declare const kSecAttrSyncViewHint: interop.Pointer

export declare const kSecUseNoAuthenticationUI: interop.Pointer

export declare const CSSMOID_SubjectAltName: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_WWDR_INTERMEDIATE: cssm_data

export declare const kSecUseOnlyUID: number

export declare const kSecAsn1UTF8StringTemplate: interop.Pointer

export declare const CSSMERR_TP_CERT_SUSPENDED: number

export declare const kSecMatchDiacriticInsensitive: interop.Pointer

export declare const CSSM_CERT_STATUS_IS_IN_INPUT_CERTS: number

export declare const CSSM_WORDID_PROPAGATE: number

export declare const CSSMOID_IssuingDistributionPoint: cssm_data

export declare const CSSMERR_DL_INVALID_NEW_OWNER: number

export declare const CSSM_ERRORCODE_MODULE_EXTENT: number

export declare const CSSMOID_PDA_DATE_OF_BIRTH: cssm_data

export declare const kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly: interop.Pointer

export declare const errSecMissingAttributeIterationCount: number

export declare const errSecCSHostProtocolStateError: number

export declare const errSecInternalError: number

export declare const CSSM_DL_PRIVATE_ERROR: number

export declare const errSecInvalidRequestInputs: number

export declare const errSecCSSignatureUntrusted: number

export declare const CSSM_ALGMODE_OFB: number

export declare const CSSM_CL_PRIVATE_ERROR: number

export declare const CSSMOID_PKCS9_CertTypes: cssm_data

export declare const TLS_RSA_WITH_AES_256_CBC_SHA256: number

export declare const CSSM_EVIDENCE_FORM_VERIFIER_TIME: number

export declare const CSSM_TP_CERTRECLAIM_STATUS_UNKNOWN: number

export declare const errSecTimestampServiceNotAvailable: number

export declare const errSecTimestampRejection: number

export declare const CSSMOID_DOTMAC_CERT_REQ_VALUE_RENEW: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_SYSINT2_INTERMEDIATE: cssm_data

export declare const CSSM_CRL_TYPE_X_509v2: number

export declare const kSecAttrProtocolNNTP: interop.Pointer

export declare const kSecAttrCanSign: interop.Pointer

export declare const kSecGuestAttributeSubarchitecture: interop.Pointer

export declare const errSecInvalidCertificateRef: number

export declare const CSSMERR_APPLETP_INVALID_ID_LINKAGE: number

export declare const errSecStagedOperationNotStarted: number

export declare const CSSM_ALGID__FIRST_UNUSED: number

export declare const kSecOIDMS_NTPrincipalName: interop.Pointer

export declare const oidSha1DsaCommonOIW: DERItem

export declare const CSSM_ACL_SUBJECT_TYPE_SYMMETRIC_KEY: number

export declare const CSSM_QUERY_TIMELIMIT_NONE: number

export declare const CSSMOID_sect131r2: cssm_data

export declare const kSecACLAuthorizationDecrypt: interop.Pointer

export declare const errSecCSReqUnsupported: number

export declare const oidRsa: DERItem

export declare const kSecOIDDOTMAC_CERT_IDENTITY: interop.Pointer

export declare const CSSMOID_secp160k1: cssm_data

export declare const CSSMERR_CSP_DEVICE_RESET: number

export declare const CSSMOID_PKIX_OCSP_SERVICE_LOCATOR: cssm_data

export declare const CSSMERR_TP_REJECTED_FORM: number

export declare const kSecTransformErrorMoreThanOneOutput: number

export declare const CSSMERR_CSP_INVALID_ATTR_SEED: number

export declare const CSSMERR_APPLETP_INCOMPLETE_REVOCATION_CHECK: number

export declare const CSSMOID_X509V2CRLVersion: cssm_data

export declare const CSSMOID_X509V1SubjectPublicKey: cssm_data

export declare const kSecOIDCommonName: interop.Pointer

export declare const errSecStagedOperationInProgress: number

export declare const CSSM_FEE_CURVE_TYPE_WEIERSTRASS: number

export declare const CSSM_ALGID_SECURE_PASSPHRASE: number

export declare const CSSMERR_CSSM_DEVICE_RESET: number

export declare const kSecDigestHMACSHA2: interop.Pointer

export declare const CSSMERR_CSP_MISSING_ATTR_KEY_LENGTH: number

export declare const CSSM_TP_CERTVERIFY_INVALID_AUTHORITY: number

export declare const CSSM_DB_NOT_EQUAL: number

export declare const CSSM_ALGID_SHA1HMAC: number

export declare const CSSMERR_DL_INVALID_DB_NAME: number

export declare const CSSM_CERT_BUNDLE_LAST: number

export declare const CSSMOID_UnstructuredAddress: cssm_data

export declare const CSSMERR_CL_DEVICE_RESET: number

export declare const CSSM_ALGID_RDES: number

export declare const CSSMOID_SubjectPicture: cssm_data

export declare const kSecKeyAlgorithmECIESEncryptionStandardX963SHA256AESGCM: interop.Pointer

export declare const kSecPropertyKeyValue: interop.Pointer

export declare const CSSM_CRL_PARSE_FORMAT_OID_NAMED: number

export declare const errSecCSInvalidPlatform: number

export declare const CSSMOID_X509V1CertificateIssuerUniqueId: cssm_data

export declare const errSecUnsupportedLocality: number

export declare const CSSM_SAMPLE_TYPE_KEYCHAIN_CHANGE_LOCK: number

export declare const CSSM_ALGID_3DES_2KEY: number

export declare const kSecCodeInfoDigestAlgorithm: interop.Pointer

export declare const CSSM_CSP_TOK_USER_PIN_EXPIRED: number

export declare const errSecNoBasicConstraintsCA: number

export declare const CSSM_WORDID_REVAL: number

export declare const CSSM_CL_BASE_ERROR: number

export declare const errSecInvalidKeyUsageForPolicy: number

export declare const errSecMissingAttributeEndDate: number

export declare const kSecDigestMD5: interop.Pointer

export declare const CSSMERR_DL_ACL_DELETE_FAILED: number

export declare const kSecOIDEmailProtection: interop.Pointer

export declare const errSecInvalidSampleValue: number

export declare const CSSMERR_DL_INVALID_ACL_BASE_CERTS: number

export declare const errSecInvalidPolicyIdentifiers: number

export declare const kSecMatchLimit: interop.Pointer

export declare const errSecOutputLengthError: number

export declare const errSecUnsupportedNumIndexes: number

export declare const CSSM_ASC_OPTIMIZE_TIME: number

export declare const CSSMOID_OAEP_ID_PSPECIFIED: cssm_data

export declare const errSecCSHostProtocolDedicationError: number

export declare const errSecInvalidLoginName: number

export declare const CSSMOID_QT_UNOTICE: cssm_data

export declare const CSSMOID_secp384r1: cssm_data

export declare const CSSMERR_DL_DEVICE_FAILED: number

export declare const errSecInvalidDigestAlgorithm: number

export declare const kSecAttrCanEncrypt: interop.Pointer

export declare const CSSM_ALGID_FASTHASH: number

export declare const CSSM_ERRCODE_INVALID_CRL_POINTER: number

export declare const CSSM_DL_REMOTEDIR: number

export declare const SSL_DH_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSM_ALGCLASS_NONE: number

export declare const errSecCertificateRevoked: number

export declare const kSecAttrPersistantReference: interop.Pointer

export declare const CSSMERR_CSP_INVALID_ATTR_PUBLIC_KEY_FORMAT: number

export declare const errSecInvalidSearchRef: number

export declare const CSSM_ERRCODE_OBJECT_MANIP_AUTH_DENIED: number

export declare const TLS_RSA_WITH_AES_256_CBC_SHA: number

export declare const CSSM_SAMPLE_TYPE_THRESHOLD: number

export declare const TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256: number

export declare const errSecNoCertificateModule: number

export declare const errSecSigningTimeMissing: number

export declare const kSecCodeInfoSignerInfoSKID: interop.Pointer

export declare const CSSM_WORDID_ACL: number

export declare const CSSM_ALGID_SKIPJACK: number

export declare const CSSM_WORDID_E: number

export declare const CSSM_ALGMODE_RELAYX: number

export declare const errSecInvalidData: number

export declare const CSSMERR_TP_INVALID_NAME: number

export declare const CSSMOID_sect163k1: cssm_data

export declare const CSSM_ALGID_SHARandom: number

export declare const oidSha512Ecdsa: DERItem

export declare const CSSMERR_TP_INVALID_SIGNATURE: number

export declare const CSSM_ATTRIBUTE_PARAM_KEY: number

export declare const TLS_DHE_PSK_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMERR_CSP_MISSING_ATTR_SYMMETRIC_KEY_FORMAT: number

export declare const CSSMOID_TEST_MOBILE_STORE_SIGNING_POLICY: cssm_data

export declare const CSSMERR_APPLETP_OCSP_RESP_SIG_REQUIRED: number

export declare const TLS_PSK_WITH_NULL_SHA384: number

export declare const errSecCodeSigningNoExtendedKeyUsage: number

export declare const CSSMERR_APPLEDL_INVALID_DATABASE_BLOB: number

export declare const CSSM_ALGID_FEED: number

export declare const CSSM_CERT_BUNDLE_ENCODING_DER: number

export declare const errSecMissingAttributeDLDBHandle: number

export declare const kSecGuestAttributePid: interop.Pointer

export declare const kSecKeyAlgorithmECIESEncryptionCofactorVariableIVX963SHA224AESGCM: interop.Pointer

export declare const CSSM_ALGMODE_ECB96: number

export declare const TLS_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const kSecCFErrorResourceAdded: interop.Pointer

export declare const CSSMERR_CL_NO_USER_INTERACTION: number

export declare const CSSM_NET_PROTO_CUSTOM: number

export declare const CSSMOID_APPLE_TP_PACKAGE_SIGNING: cssm_data

export declare const CSSMERR_DL_UNSUPPORTED_QUERY_LIMITS: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_ERR: number

export declare const CSSMERR_CSP_STAGED_OPERATION_NOT_STARTED: number

export declare const errSessionInvalidId: number

export declare const CSSM_LIST_TYPE_UNKNOWN: number

export declare const TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA: number

export declare const CSSMERR_TP_INVALID_CERT_AUTHORITY: number

export declare const CSSMERR_CL_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const CSSM_DL_DB_RECORD_GENERIC: number

export declare const gGuidAppleFileDL: cssm_guid

export declare const kSecOIDAPPLE_EKU_ICHAT_SIGNING: interop.Pointer

export declare const errSecInvalidResponseVector: number

export declare const TLS_ECDH_RSA_WITH_RC4_128_SHA: number

export declare const CSSMOID_APPLE_EXTENSION_SERVER_AUTHENTICATION: cssm_data

export declare const TLS_EMPTY_RENEGOTIATION_INFO_SCSV: number

export declare const kSecAttrCertificateEncoding: interop.Pointer

export declare const CSSMERR_DL_DB_LOCKED: number

export declare const CSSM_ALGMODE_NONE: number

export declare const kSecBase32Encoding: interop.Pointer

export declare const errSecInvalidPVC: number

export declare const errSecPVCReferentNotFound: number

export declare const CSSM_ERRCODE_INVALID_NETWORK_ADDR: number

export declare const oidExtendedKeyUsageTimeStamping: DERItem

export declare const CSSM_ERRCODE_INVALID_NEW_ACL_ENTRY: number

export declare const errSecInvalidSubjectName: number

export declare const SSL_RSA_EXPORT_WITH_DES40_CBC_SHA: number

export declare const TLS_RSA_PSK_WITH_NULL_SHA: number

export declare const errSecAppleInvalidKeyEndDate: number

export declare const errSecMissingEntitlement: number

export declare const CSSM_TP_CERTISSUE_STATUS_UNKNOWN: number

export declare const CSSM_WORDID_PAM_NAME: number

export declare const oidSha1Ecdsa: DERItem

export declare const kSecAsn1SequenceOfBMPStringTemplate: interop.Pointer

export declare const CSSM_KEYBLOB_RAW_FORMAT_OTHER: number

export declare const errSecTagNotFound: number

export declare const CSSM_WORDID_GENKEY: number

export declare const errSecCSNotAppLike: number

export declare const CSSMERR_CSP_INVALID_ACL_EDIT_MODE: number

export declare const kSecAttrProtocolPOP3: interop.Pointer

export declare const CSSMERR_CSP_INVALID_ATTR_RANDOM: number

export declare const errSecInvalidPassthroughID: number

export declare const errSecCSHostProtocolUnrelated: number

export declare const errSecNoDefaultKeychain: number

export declare const kSecAttrProtocolHTTPProxy: interop.Pointer

export declare const errSecInvalidAttributeLabel: number

export declare const errSecInvalidParsingModule: number

export declare const errSecSMIMEBadExtendedKeyUsage: number

export declare const kSecDigestHMACMD5: interop.Pointer

export declare const kSecAttrCreationDate: interop.Pointer

export declare const errSSLIllegalParam: number

export declare const kSecCertEncodingItemAttr: number

export declare const oidLocalityName: DERItem

export declare const CSSM_ALGID_SHA1: number

export declare const errSecInvalidDBLocation: number

export declare const errSecMissingAttributeInitVector: number

export declare const errSSLPeerUnsupportedCert: number

export declare const CSSMOID_GenerationQualifier: cssm_data

export declare const CSSMERR_CSSM_ADDIN_AUTHENTICATE_FAILED: number

export declare const errSecAlgorithmMismatch: number

export declare const CSSMERR_DL_INVALID_DB_LIST_POINTER: number

export declare const kSecOIDGivenName: interop.Pointer

export declare const TLS_DH_DSS_WITH_AES_256_CBC_SHA: number

export declare const CSSMERR_AC_MEMORY_ERROR: number

export declare const CSSMOID_QT_CPS: cssm_data

export declare const kSecAttrSecurityDomain: interop.Pointer

export declare const CSSM_CERT_STATUS_EXPIRED: number

export declare const CSSMERR_AC_INVALID_DB_LIST_POINTER: number

export declare const CSSMERR_CL_MEMORY_ERROR: number

export declare const CSSM_TP_AUTHORITY_REQUEST_CRLISSUE: number

export declare const CSSMERR_CL_INVALID_NUMBER_OF_FIELDS: number

export declare const CSSM_AC_BASE_ERROR: number

export declare const kSecAttrPort: interop.Pointer

export declare const CSSMOID_ANSI_DH_HYBRID2_SHA1: cssm_data

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_16: number

export declare const CSSMERR_CSP_MISSING_ATTR_INIT_VECTOR: number

export declare const CSSM_WORDID_EXPORT_WRAPPED: number

export declare const CSSMERR_APPLE_DOTMAC_NO_REQ_PENDING: number

export declare const CSSM_WORDID_KEYHOLDER: number

export declare const SSL_DH_anon_EXPORT_WITH_DES40_CBC_SHA: number

export declare const CSSMOID_APPLE_TP_PROFILE_SIGNING: cssm_data

export declare const errSecPrivilegeNotSupported: number

export declare const TLS_DHE_RSA_WITH_AES_256_GCM_SHA384: number

export declare const CSSM_TP_CERTCHANGE_REASON_HOLDRELEASE: number

export declare const kSecKeyEffectiveKeySize: number

export declare const CSSM_ALGMODE_OAEP_HASH: number

export declare const CSSM_WORDID_LE: number

export declare const CSSM_WORDID_OWNER: number

export declare const CSSMERR_DL_ACL_BASE_CERTS_NOT_SUPPORTED: number

export declare const CSSMOID_KERBv5_PKINIT_RKEY_DATA: cssm_data

export declare const CSSMOID_PKCS5_ENCRYPT_ALG: cssm_data

export declare const CSSMERR_APPLETP_CRL_BAD_URI: number

export declare const CSSMERR_DL_INVALID_ACL_EDIT_MODE: number

export declare const CSSM_WORDID_IBCHASH: number

export declare const CSSMERR_CSP_APPLE_ADD_APPLICATION_ACL_SUBJECT: number

export declare const errSecInvalidAttributePadding: number

export declare const kSecAttrProtocolHTTPS: interop.Pointer

export declare const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA1: interop.Pointer

export declare const TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_NetscapeCertSequence: cssm_data

export declare const errSecSMIMEEmailAddressesNotFound: number

export declare const kSecReturnAttributes: interop.Pointer

export declare const kSecAttrAuthenticationTypeHTTPDigest: interop.Pointer

export declare const CSSMERR_DL_RECORD_NOT_FOUND: number

export declare const CSSM_ERRCODE_INVALID_KR_HANDLE: number

export declare const CSSMERR_TP_FUNCTION_NOT_IMPLEMENTED: number

export declare const CSSMOID_APPLE_TP_ICHAT: cssm_data

export declare const kSecAttrAccessibleAfterFirstUnlock: interop.Pointer

export declare const errSecTimestampAddInfoNotAvailable: number

export declare const CSSMOID_APPLE_EKU_ICHAT_ENCRYPTION: cssm_data

export declare const CSSMOID_DOTMAC_CERT_REQ_ARCHIVE_REMOVE: cssm_data

export declare const errSecInvalidCertAuthority: number

export declare const CSSMERR_CSP_MISSING_ATTR_ROUNDS: number

export declare const CSSM_ATTRIBUTE_KRPROFILE_LOCAL: number

export declare const CSSM_APPLECSPDL_DB_GET_SETTINGS: number

export declare const errSecCertificateNameNotAllowed: number

export declare const CSSMOID_CollectiveStateProvinceName: cssm_data

export declare const oidMd5: DERItem

export declare const CSSM_ERRCODE_INVALID_DB_LIST_POINTER: number

export declare const errSecNotTrusted: number

export declare const CSSM_DB_RECORDTYPE_OPEN_GROUP_START: number

export declare const CSSMOID_APPLE_TP_PASSBOOK_SIGNING: cssm_data

export declare const CSSM_KEYATTR_PARTIAL: number

export declare const CSSMERR_AC_INVALID_DL_HANDLE: number

export declare const TLS_DH_anon_WITH_AES_256_CBC_SHA: number

export declare const kSecCodeInfoRequirementData: interop.Pointer

export declare const CSSMOID_APPLE_TP_REVOCATION: cssm_data

export declare const CSSMOID_secp192k1: cssm_data

export declare const CSSMOID_SigningTime: cssm_data

export declare const kSecPolicyTeamIdentifier: interop.Pointer

export declare const CSSM_KEYUSE_UNWRAP: number

export declare const CSSMOID_APPLE_TP_REVOCATION_OCSP: cssm_data

export declare const CSSM_DB_ATTRIBUTE_FORMAT_TIME_DATE: number

export declare const CSSM_ALGID_XORBaseAndData: number

export declare const CSSM_CSP_TOK_RNG: number

export declare const CSSMERR_DL_IN_DARK_WAKE: number

export declare const CSSM_TP_CRLISSUE_NOT_AUTHORIZED: number

export declare const CSSM_ATTRIBUTE_KEY_LENGTH: number

export declare const kSecCFErrorInfoPlist: interop.Pointer

export declare const SSL_DHE_DSS_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSM_TP_STOP_ON_NONE: number

export declare const CSSM_DL_UNKNOWN: number

export declare const kSecOIDX509V1SubjectPublicKeyCStruct: interop.Pointer

export declare const errSecCSRemoteSignerFirstSlotFull: number

export declare const CSSM_TP_CERTCHANGE_REASON_AFFILIATIONCHANGE: number

export declare const CSSM_DB_GREATER_THAN: number

export declare const CSSM_USEE_SSL: number

export declare const kSecTransformErrorInvalidType: number

export declare const errSecSMIMENoEmailAddress: number

export declare const CSSM_FEE_CURVE_TYPE_MONTGOMERY: number

export declare const CSSM_ATTRIBUTE_ALG_PARAMS: number

export declare const kSecOIDOrganizationalUnitName: interop.Pointer

export declare const CSSM_DB_CERT_USE_PRIVACY: number

export declare const kSecOIDAPPLE_EXTENSION_WWDR_INTERMEDIATE: interop.Pointer

export declare const CSSM_PADDING_NONE: number

export declare const kSecMatchPolicy: interop.Pointer

export declare const CSSMERR_DL_UNSUPPORTED_NUM_INDEXES: number

export declare const kSecAttrKeyTypeAES: interop.Pointer

export declare const kSecRevocationRequirePositiveResponse: number

export declare const CSSMERR_DL_INVALID_RECORD_INDEX: number

export declare const CSSM_ATTRIBUTE_NONE: number

export declare const errSecMissingAttributeKey: number

export declare const CSSM_CERT_ENCODING_CUSTOM: number

export declare const CSSMERR_CL_IN_DARK_WAKE: number

export declare const CSSMOID_CollectivePostOfficeBox: cssm_data

export declare const CSSM_ADDR_URL: number

export declare const CSSMERR_TP_INVALID_IDENTIFIER_POINTER: number

export declare const kSecMatchSubjectWholeString: interop.Pointer

export declare const kSecOIDX509V3CertificateExtensionsCStruct: interop.Pointer

export declare const CSSMOID_PKIX_OCSP: cssm_data

export declare const CSSM_WORDID_GE: number

export declare const CSSMOID_PKCS5_PBMAC1: cssm_data

export declare const CSSM_DB_ATTRIBUTE_FORMAT_STRING: number

export declare const errSecMissingAttributeVersion: number

export declare const errSecInvalidAttributeVersion: number

export declare const kSecModeNoneKey: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_DB_INSERT: number

export declare const kSecPropertyTypeURL: interop.Pointer

export declare const kSecOIDX509V1SubjectPublicKey: interop.Pointer

export declare const CSSM_TP_ACTION_CRL_SUFFICIENT: number

export declare const CSSM_CRL_PARSE_FORMAT_CUSTOM: number

export declare const CSSM_KEYBLOB_OTHER: number

export declare const kSecOIDCertificatePolicies: interop.Pointer

export declare const kSecAsn1PointerToUniversalStringTemplate: interop.Pointer

export declare const CSSM_WORDID_SYMMETRIC_KEY: number

export declare const errSSLClosedAbort: number

export declare const kSSLSessionConfig_TLSv1_fallback: interop.Pointer

export declare const errSecCSSignatureInvalid: number

export declare const kSecAsn1UTCTimeTemplate: interop.Pointer

export declare const errSessionAuthorizationDenied: number

export declare const TLS_RSA_WITH_AES_128_CBC_SHA: number

export declare const TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256: number

export declare const errSecInvalidSignature: number

export declare const CSSMOID_SearchGuide: cssm_data

export declare const CSSM_ERRCODE_OBJECT_ACL_NOT_SUPPORTED: number

export declare const errSecACLReplaceFailed: number

export declare const noSecuritySession: number

export declare const CSSM_ATTRIBUTE_FEE_PRIME_TYPE: number

export declare const CSSMERR_TP_INVALID_CRL_AUTHORITY: number

export declare const TLS_DHE_RSA_WITH_AES_128_GCM_SHA256: number

export declare const CSSMERR_DL_SAMPLE_VALUE_NOT_SUPPORTED: number

export declare const CSSMERR_APPLETP_INVALID_AUTHORITY_ID: number

export declare const errSecInsufficientCredentials: number

export declare const kSecAttrCanDerive: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_SIGN: number

export declare const CSSM_SAMPLE_TYPE_PROCESS: number

export declare const CSSM_WORDID_TAG: number

export declare const CSSM_KEYATTR_RETURN_NONE: number

export declare const CSSM_ALGID_SEAL: number

export declare const CSSMERR_AC_INVALID_DATA: number

export declare const kSecKeyAlgorithmECDSASignatureMessageX962SHA224: interop.Pointer

export declare const CSSMOID_APPLE_EKU_PROFILE_SIGNING: cssm_data

export declare const CSSM_ERRCODE_IN_DARK_WAKE: number

export declare const CSSM_EVIDENCE_FORM_CRL_THISTIME: number

export declare const kSecAttrProtocolAppleTalk: interop.Pointer

export declare const CSSMERR_CSP_INVALID_ATTR_KEY_TYPE: number

export declare const TLS_DH_DSS_WITH_AES_128_CBC_SHA: number

export declare const kSecCSFullReport: number

export declare const errSecMDSError: number

export declare const CSSM_WORDID_SUBJECT: number

export declare const CSSMERR_CSP_MISSING_ATTR_SUBPRIME: number

export declare const CSSM_ALGID_SAFER: number

export declare const kSecReturnPersistentRef: interop.Pointer

export declare const CSSMOID_PKCS9_X509Certificate: cssm_data

export declare const CSSM_WORDID_COMMENT: number

export declare const kSecAttrProtocolNNTPS: interop.Pointer

export declare const CSSM_CERT_BUNDLE_UNKNOWN: number

export declare const CSSMOID_PDA_COUNTRY_CITIZEN: cssm_data

export declare const CSSM_ALGID_MAYFLY: number

export declare const CSSMERR_CSP_INVALID_ATTR_SUBPRIME: number

export declare const CSSMOID_X509V1CRLRevokedCertificatesCStruct: cssm_data

export declare const CSSMERR_APPLEDL_FILE_TOO_BIG: number

export declare const kSecKeyAlgorithmECIESEncryptionCofactorVariableIVX963SHA512AESGCM: interop.Pointer

export declare const CSSMOID_PKCS12_secretBag: cssm_data

export declare const CSSMERR_TP_MDS_ERROR: number

export declare const kSecModeCFBKey: interop.Pointer

export declare const kSecCodeInfoCertificates: interop.Pointer

export declare const CSSMOID_PrivateKeyUsagePeriod: cssm_data

export declare const errSecDataNotAvailable: number

export declare const CSSM_CSSM_BASE_CSSM_ERROR: number

export declare const CSSMERR_DL_UNSUPPORTED_NUM_ATTRIBUTES: number

export declare const TLS_DHE_PSK_WITH_AES_128_GCM_SHA256: number

export declare const TLS_RSA_PSK_WITH_RC4_128_SHA: number

export declare const CSSM_ALGID_LUCIFER: number

export declare const errSecCSBadFrameworkVersion: number

export declare const errSecReadOnlyAttr: number

export declare const CSSM_ALGID_DES: number

export declare const TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA: number

export declare const CSSMERR_CSSM_INVALID_INPUT_POINTER: number

export declare const CSSMOID_X509V1SignatureAlgorithm: cssm_data

export declare const CSSMERR_DL_INVALID_FIELD_NAME: number

export declare const errSecInvalidSubjectKeyID: number

export declare const CSSMERR_DL_INVALID_OPEN_PARAMETERS: number

export declare const errSecUserCanceled: number

export declare const CSSMOID_X509V2CRLRevokedEntryExtensionType: cssm_data

export declare const TLS_ECDH_ECDSA_WITH_RC4_128_SHA: number

export declare const CSSM_ATTRIBUTE_SUBPRIME: number

export declare const CSSM_ALGID_LOKI: number

export declare const CSSM_EVIDENCE_FORM_POLICYINFO: number

export declare const kSecOIDX509V1IssuerNameLDAP: interop.Pointer

export declare const errSecParam: number

export declare const errSecEventNotificationCallbackNotFound: number

export declare const CSSMERR_CSP_KEY_LABEL_ALREADY_EXISTS: number

export declare const CSSM_DB_CERT_USE_SIGNING: number

export declare const CSSM_ALGID_SHA384WithRSA: number

export declare const CSSM_ALGID_DH: number

export declare const CSSM_LIST_TYPE_SEXPR: number

export declare const errSecServiceNotAvailable: number

export declare const CSSMERR_DL_INVALID_CL_HANDLE: number

export declare const CSSMOID_LocalityName: cssm_data

export declare const CSSMERR_AC_INTERNAL_ERROR: number

export declare const errSSLPeerAccessDenied: number

export declare const errSecSMIMESubjAltNameNotCritical: number

export declare const CSSMERR_TP_INVALID_CRL_ENCODING: number

export declare const CSSM_ATTRIBUTE_DL_DB_HANDLE: number

export declare const CSSMERR_CSP_MDS_ERROR: number

export declare const CSSMERR_CSP_UNSUPPORTED_KEY_LABEL: number

export declare const kSecKeyAlgorithmECDHKeyExchangeStandardX963SHA224: interop.Pointer

export declare const kSecSubjectItemAttr: number

export declare const CSSM_DB_TRANSACTIONAL_MODE: number

export declare const CSSMOID_ProtocolInformation: cssm_data

export declare const kSecMatchIssuers: interop.Pointer

export declare const CSSM_TP_CERTISSUE_NOT_AUTHORIZED: number

export declare const CSSM_ALGMODE_CUSTOM: number

export declare const errSecUnknownFormat: number

export declare const CSSM_DL_DB_RECORD_SYMMETRIC_KEY: number

export declare const CSSM_WORDID_KEYCHAIN_PROMPT: number

export declare const CSSM_KEYATTR_PRIVATE: number

export declare const CSSMERR_CL_INVALID_CRL_POINTER: number

export declare const errSecInvalidTupleCredendtials: number

export declare const kSecAttrCreator: interop.Pointer

export declare const kSecPolicyAppleSSL: interop.Pointer

export declare const kSecAttrKeyTypeRC2: interop.Pointer

export declare const CSSMOID_X509V2CRLSingleExtensionStruct: cssm_data

export declare const CSSM_TP_CERTCHANGE_WRONGCA: number

export declare const errSecLibraryReferenceNotFound: number

export declare const CSSM_FEE_PRIME_TYPE_DEFAULT: number

export declare const CSSM_DL_CUSTOM: number

export declare const CSSM_WORDID_X509V1: number

export declare const CSSM_ERRCODE_INVALID_TP_HANDLE: number

export declare const kAuthorizationFlagCanNotPreAuthorize: number

export declare const CSSM_ATTRIBUTE_DATA_KR_PROFILE: number

export declare const CSSM_CERT_PARSE_FORMAT_COMPLEX: number

export declare const TLS_PSK_WITH_AES_256_GCM_SHA384: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_VENDOR_DEFINED: number

export declare const errSecFunctionFailed: number

export declare const oidExtendedKeyUsageNetscapeSGC: DERItem

export declare const CSSM_WORDID_RSA_PKCS1: number

export declare const CSSM_ALGMODE_ECB128: number

export declare const CSSM_ERRCODE_INVALID_CERTGROUP_POINTER: number

export declare const CSSM_ALGID_ECC: number

export declare const CSSM_CL_TEMPLATE_PKIX_CERTTEMPLATE: number

export declare const errAuthorizationSuccess: number

export declare const kSecKeyNeverExtractable: number

export declare const CSSMERR_CSSM_INVALID_KEY_HIERARCHY: number

export declare const errSSLDecompressFail: number

export declare const CSSMERR_TP_INVALID_FIELD_POINTER: number

export declare const CSSMERR_APPLETP_OCSP_RESP_UNAUTHORIZED: number

export declare const oidSha224Rsa: DERItem

export declare const CSSM_WORDID_PROTECTED_PIN: number

export declare const errSecUnsupportedQueryLimits: number

export declare const CSSM_ALGMODE_SHUFFLE: number

export declare const CSSM_ALGID_MMB: number

export declare const CSSM_DL_DB_SCHEMA_INFO: number

export declare const CSSM_KEYBLOB_REF_FORMAT_SPKI: number

export declare const kSecOIDAPPLE_EXTENSION: interop.Pointer

export declare const kSecOIDAPPLE_EKU_ICHAT_ENCRYPTION: interop.Pointer

export declare const errAuthorizationInternal: number

export declare const errSecCSGuestInvalid: number

export declare const CSSMERR_TP_SERVICE_NOT_AVAILABLE: number

export declare const errSecCSObjectRequired: number

export declare const CSSM_CSP_STORES_PUBLIC_KEYS: number

export declare const errSecCSHelperFailed: number

export declare const errSecInsufficientClientID: number

export declare const kSecACLAuthorizationImportWrapped: interop.Pointer

export declare const kSecLineLength76: interop.Pointer

export declare const errSecCSStaticCodeNotFound: number

export declare const CSSMOID_CertificatePolicies: cssm_data

export declare const CSSMOID_secp224r1: cssm_data

export declare const CSSMERR_CSSM_ADDIN_LOAD_FAILED: number

export declare const errSecCSInvalidTeamIdentifier: number

export declare const TLS_RSA_WITH_NULL_SHA256: number

export declare const CSSM_ATTRIBUTE_INIT_VECTOR: number

export declare const kSecKeyAlgorithmECIESEncryptionCofactorX963SHA384AESGCM: interop.Pointer

export declare const oidSha512: DERItem

export declare const CSSMERR_DL_INVALID_CSP_HANDLE: number

export declare const oidExtendedKeyUsageServerAuth: DERItem

export declare const kSecCodeInfoEntitlements: interop.Pointer

export declare const CSSM_ERRCODE_INVALID_ACL_EDIT_MODE: number

export declare const errSecModuleManifestVerifyFailed: number

export declare const CSSMERR_APPLETP_IDENTIFIER_MISSING: number

export declare const CSSMOID_X509V2CRLRevokedEntrySingleExtensionCStruct: cssm_data

export declare const CSSM_WORDID_RSA: number

export declare const CSSMOID_X509V3CertificateCStruct: cssm_data

export declare const CSSMERR_CL_INVALID_BUNDLE_POINTER: number

export declare const errAuthorizationInvalidFlags: number

export declare const kSecKeyAlgorithmECDHKeyExchangeCofactorX963SHA1: interop.Pointer

export declare const kSecKeyDerive: number

export declare const CSSM_WORDID_DELETE: number

export declare const CSSMOID_AuthorityInfoAccess: cssm_data

export declare const kSecAsn1SetOfBooleanTemplate: interop.Pointer

export declare const errSecMultipleExecSegments: number

export declare const CSSMOID_SubjectEmailAddress: cssm_data

export declare const CSSMERR_TP_UNKNOWN_TAG: number

export declare const CSSM_CL_CUSTOM_CERT_TYPE: number

export declare const CSSM_TP_ACTION_DEFAULT: number

export declare const kSecKeyAlias: number

export declare const CSSM_ERRCODE_OPERATION_AUTH_DENIED: number

export declare const CSSM_WORDID_K_OF_N: number

export declare const kSecMatchTrustedOnly: interop.Pointer

export declare const CSSM_ALGID_SSL3PreMasterGen: number

export declare const kSecClassInternetPassword: interop.Pointer

export declare const errSecInvalidAttributeBlockSize: number

export declare const CSSMERR_CSP_PRIVATE_KEY_ALREADY_EXISTS: number

export declare const CSSMERR_CSP_INVALID_ATTR_BLOCK_SIZE: number

export declare const CSSM_ALGMODE_CFB_IV8: number

export declare const CSSMOID_X509V2CRLAllExtensionsStruct: cssm_data

export declare const CSSMOID_ECDSA_WithSpecified: cssm_data

export declare const kSecModeCBCKey: interop.Pointer

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA512: interop.Pointer

export declare const CSSM_MDS_BASE_ERROR: number

export declare const errSecNoPolicyModule: number

export declare const CSSMOID_APPLE_TP_TIMESTAMPING: cssm_data

export declare const CSSM_ALGID_ECDSA: number

export declare const CSSM_ADDR_SOCKADDR: number

export declare const CSSM_KEY_HIERARCHY_EXPORT: number

export declare const TLS_RSA_WITH_NULL_MD5: number

export declare const CSSMERR_CSP_INVALID_SAMPLE_VALUE: number

export declare const CSSM_PVC_NONE: number

export declare const errSecSMIMEKeyUsageNotCritical: number

export declare const CSSM_ATTRIBUTE_VERSION: number

export declare const kSecUseAuthenticationContext: interop.Pointer

export declare const kSecAttrPublicKeyHash: interop.Pointer

export declare const CSSM_ALGMODE_COUNTER: number

export declare const CSSM_ALGMODE_PCBC: number

export declare const TLS_ECDH_ECDSA_WITH_NULL_SHA: number

export declare const kSecOIDSRVName: interop.Pointer

export declare const kSecKeyAlgorithmRSASignatureMessagePSSSHA256: interop.Pointer

export declare const CSSMOID_X9_62_PrimeCurve: cssm_data

export declare const CSSMERR_AC_INVALID_CONTEXT_HANDLE: number

export declare const CSSM_ALGID_CAST5: number

export declare const CSSMERR_DL_UNSUPPORTED_RECORDTYPE: number

export declare const CSSM_DB_OR: number

export declare const CSSMOID_X509V1SignatureCStruct: cssm_data

export declare const kSecPolicyApplePayIssuerEncryption: interop.Pointer

export declare const errSecWrPerm: number

export declare const CSSM_ACL_KEYCHAIN_PROMPT_UNSIGNED_ACT: number

export declare const kSecAttrAuthenticationTypeNTLM: interop.Pointer

export declare const errSecKeyBlobTypeIncorrect: number

export declare const kSecMatchCaseInsensitive: interop.Pointer

export declare const errSecCSDetachedCertificates: number

export declare const CSSMERR_AC_NO_USER_INTERACTION: number

export declare const errSSLMissingExtension: number

export declare const CSSM_ALGID_VENDOR_DEFINED: number

export declare const oidExtendedKeyUsageClientAuth: DERItem

export declare const kSecInputIsRaw: interop.Object

export declare const CSSMOID_APPLE_X509_BASIC: cssm_data

export declare const CSSM_ALGID_RUNNING_COUNTER: number

export declare const CSSM_CERTGROUP_DATA: number

export declare const TLS_CHACHA20_POLY1305_SHA256: number

export declare const CSSM_ACL_AUTHORIZATION_EXPORT_CLEAR: number

export declare const CSSMOID_CollectiveTelexNumber: cssm_data

export declare const SSL_DH_anon_EXPORT_WITH_RC4_40_MD5: number

export declare const TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256: number

export declare const CSSMOID_ANSI_DH_HYBRID2: cssm_data

export declare const CSSM_TP_CERTCHANGE_REASON_UNKNOWN: number

export declare const oidFee: DERItem

export declare const CSSM_TP_CERTCHANGE_REASON_CACOMPROMISE: number

export declare const kSecCSContentInformation: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_SPKI: number

export declare const oidGoogleEmbeddedSignedCertificateTimestamp: DERItem

export declare const kSecCodeInfoImplicitDesignatedRequirement: interop.Pointer

export declare const CSSM_ACL_KEYCHAIN_PROMPT_INVALID_ACT: number

export declare const CSSMERR_TP_INVALID_NETWORK_ADDR: number

export declare const TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384: number

export declare const errSecCSInvalidAttributeValues: number

export declare const CSSMOID_SubjectInfoAccess: cssm_data

export declare const oidEmailAddress: DERItem

export declare const CSSM_NET_PROTO_UNSPECIFIED: number

export declare const kSecCodeInfoEntitlementsDict: interop.Pointer

export declare const errSecBadReq: number

export declare const CSSMOID_DOTMAC_CERT_REQ_EMAIL_SIGN: cssm_data

export declare const CSSM_DB_CERT_USE_SYSTEM: number

export declare const CSSMERR_CSP_INVALID_POINTER: number

export declare const kSecPropertyTypeString: interop.Pointer

export declare const CSSMOID_CertificateRevocationList: cssm_data

export declare const CSSM_ERRCODE_DEVICE_RESET: number

export declare const CSSMOID_PostalCode: cssm_data

export declare const CSSM_ACL_MATCH_BITS: number

export declare const errSSLPeerProtocolVersion: number

export declare const CSSMOID_CrlNumber: cssm_data

export declare const CSSM_ALGID_NRA: number

export declare const CSSMOID_APPLE_TP_ESCROW_SERVICE: cssm_data

export declare const kSecAsn1T61StringTemplate: interop.Pointer

export declare const CSSM_WORDID_PROMPTED_PASSWORD: number

export declare const errSecCodeSigningBadPathLengthConstraint: number

export declare const errSecMemoryError: number

export declare const kSecKeyAlgorithmECDSASignatureDigestX962SHA224: interop.Pointer

export declare const kSecAttrAuthenticationTypeDefault: interop.Pointer

export declare const CSSMERR_APPLETP_OCSP_BAD_REQUEST: number

export declare const CSSM_ACL_SUBJECT_TYPE_PROTECTED_PASSWORD: number

export declare const errSecVerifyFailed: number

export declare const kSecAsn1SequenceOfEnumeratedTemplate: interop.Pointer

export declare const CSSMERR_CSP_INVALID_DATA: number

export declare const errSecTimestampTimeNotAvailable: number

export declare const CSSM_ERRCODE_ACL_ADD_FAILED: number

export declare const kSecOIDX509V1SubjectPublicKeyAlgorithmParameters: interop.Pointer

export declare const kSecOIDSubjectDirectoryAttributes: interop.Pointer

export declare const TLS_NULL_WITH_NULL_NULL: number

export declare const CSSMOID_DOTMAC_CERT_REQ_IDENTITY: cssm_data

export declare const errSecCSRegularFile: number

export declare const CSSM_MDS_PRIVATE_ERROR: number

export declare const CSSMOID_AuthorityRevocationList: cssm_data

export declare const kSecOIDX509V3CertificateExtensionId: interop.Pointer

export declare const kSecPolicyAppleTimeStamping: interop.Pointer

export declare const CSSM_TP_CERTNOTARIZE_STATUS_UNKNOWN: number

export declare const errSecInvalidAttributeKeyLength: number

export declare const kSecKeySignRecover: number

export declare const errSecMissingAttributePrime: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_BLOB: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_PKCS1: number

export declare const CSSMOID_X509V1CRLIssuerNameCStruct: cssm_data

export declare const CSSM_TP_ACTION_FETCH_CRL_FROM_NET: number

export declare const CSSMOID_PresentationAddress: cssm_data

export declare const kSecTransformErrorAttributeNotFound: number

export declare const CSSMERR_TP_CERTIFICATE_CANT_OPERATE: number

export declare const CSSM_ATTRIBUTE_ROUNDS: number

export declare const CSSM_TP_CERTVERIFY_INVALID_NAME_TREE: number

export declare const kSecKeyAlgorithmECDSASignatureMessageX962SHA384: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_PREAUTH_END: number

export declare const TLS_ECDHE_PSK_WITH_CHACHA20_POLY1305_SHA256: number

export declare const CSSM_ATTRIBUTE_END_DATE: number

export declare const CSSM_TP_CERTVERIFY_REVOKED: number

export declare const CSSM_USEE_KRENT: number

export declare const CSSM_ATTRIBUTE_BLOCK_SIZE: number

export declare const CSSM_ALGID_RC5: number

export declare const CSSMERR_TP_REQUEST_REJECTED: number

export declare const CSSM_CERT_Intel: number

export declare const CSSMOID_X509V2CRLRevokedEntryExtensionId: cssm_data

export declare const oidMd2Rsa: DERItem

export declare const kSecKeyModifiable: number

export declare const CSSM_ATTRIBUTE_IV_SIZE: number

export declare const CSSMOID_AD_OCSP: cssm_data

export declare const kSecOAEPMessageLengthAttributeName: interop.Pointer

export declare const CSSM_APPLEFILEDL_TOGGLE_AUTOCOMMIT: number

export declare const CSSMOID_X509V1CRLNextUpdate: cssm_data

export declare const kSecOIDDOTMAC_CERT_EMAIL_SIGN: interop.Pointer

export declare const errSecCSRevokedNotarization: number

export declare const CSSMOID_X509V2CRLSingleExtensionCStruct: cssm_data

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_MSCAPI: number

export declare const CSSMOID_ECDSA_WithSHA384: cssm_data

export declare const errSecTimestampRevocationWarning: number

export declare const CSSM_TP_PRIVATE_ERROR: number

export declare const CSSM_WORDID_P: number

export declare const kSecACLAuthorizationGenKey: interop.Pointer

export declare const CSSM_WORDID_IMPORT_CLEAR: number

export declare const errSecFieldSpecifiedMultiple: number

export declare const CSSMOID_CollectiveOrganizationName: cssm_data

export declare const kSecPropertyTypeError: interop.Pointer

export declare const kSecAttrSubjectKeyID: interop.Pointer

export declare const kSecOIDX509V1SignatureAlgorithmTBS: interop.Pointer

export declare const CSSM_ALGID_MD5WithRSA: number

export declare const kSecIVKey: interop.Pointer

export declare const CSSMOID_X509V1CRLRevokedEntrySerialNumber: cssm_data

export declare const SSL_DH_DSS_EXPORT_WITH_DES40_CBC_SHA: number

export declare const CSSM_ALGMODE_CBCC: number

export declare const CSSM_TP_CERTRECLAIM_NOMATCH: number

export declare const kSecOIDNameConstraints: interop.Pointer

export declare const CSSM_ALGID_REDOC: number

export declare const errSecInvalidStopOnPolicy: number

export declare const CSSM_ALGMODE_CBC: number

export declare const errSecCSBadDiskImageFormat: number

export declare const oidMd5Rsa: DERItem

export declare const CSSMOID_X509V2CRLRevokedEntryExtensionValue: cssm_data

export declare const kSecCSRestrictToAppLike: number

export declare const CSSMOID_X9_62: cssm_data

export declare const CSSM_ACL_SUBJECT_TYPE_PREAUTH_SOURCE: number

export declare const CSSM_ATTRIBUTE_KEYATTR: number

export declare const kSecPolicyClient: interop.Pointer

export declare const CSSMOID_CertIssuer: cssm_data

export declare const CSSM_CERT_STATUS_TRUST_SETTINGS_IGNORED_ERROR: number

export declare const CSSM_ALGID_SHA1WithECNRA: number

export declare const kSecOIDSubjectAltName: interop.Pointer

export declare const kSecKeyAlgorithmECDSASignatureDigestX962SHA512: interop.Pointer

export declare const CSSMERR_CL_NO_FIELD_VALUES: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_26: number

export declare const CSSM_OK: number

export declare const CSSMOID_X509V2CRLRevokedEntryExtensionCritical: cssm_data

export declare const CSSMOID_HYBRID_COMPOSITE_MLDSA87_RSA3072_WithSHA512: cssm_data

export declare const kSecInputIsDigest: interop.Object

export declare const CSSM_KEYBLOB_RAW_FORMAT_OPENSSH2: number

export declare const CSSM_CRL_TYPE_X_509v1: number

export declare const CSSMERR_TP_INVALID_CALLBACK: number

export declare const SSL_RSA_WITH_IDEA_CBC_SHA: number

export declare const CSSM_ALGCLASS_RANDOMGEN: number

export declare const CSSM_PADDING_ZERO: number

export declare const CSSMOID_APPLE_TP_SSL: cssm_data

export declare const kSecAttrIssuer: interop.Pointer

export declare const errSSLUnsupportedExtension: number

export declare const kSecAttrIsPermanent: interop.Pointer

export declare const errSSLNoRootCert: number

export declare const errSecOCSPUnavailable: number

export declare const kSecKeySign: number

export declare const CSSMOID_X509V3CertificateExtensionCStruct: cssm_data

export declare const CSSMOID_PKCS7_DataWithAttributes: cssm_data

export declare const CSSM_DB_MODIFY_ATTRIBUTE_NONE: number

export declare const CSSMERR_CSP_INVALID_NEW_ACL_ENTRY: number

export declare const TLS_ECDH_RSA_WITH_NULL_SHA: number

export declare const errSecCSUnsigned: number

export declare const CSSMOID_SeeAlso: cssm_data

export declare const CSSM_WORDID_DBS_CREATE: number

export declare const kSecDigestSHA1: interop.Pointer

export declare const kSecOIDX509V1Version: interop.Pointer

export declare const CSSM_BASE_ERROR: number

export declare const CSSM_SAMPLE_TYPE_HASHED_PASSWORD: number

export declare const errAuthorizationInternalizeNotAllowed: number

export declare const kSecKeyAlgorithmECDSASignatureDigestX962: interop.Pointer

export declare const CSSM_ALGID_CAST3: number

export declare const errSecNoSuchAttr: number

export declare const kSecOIDX509V3CertificateNumberOfExtensions: interop.Pointer

export declare const kSecOIDX509V1SubjectNameStd: interop.Pointer

export declare const kSecAttrKeyTypeRSA: interop.Pointer

export declare const kSecCFErrorResourceSideband: interop.Pointer

export declare const CSSMERR_CSP_MISSING_ATTR_START_DATE: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA384: interop.Pointer

export declare const kSecAttrAuthenticationTypeRPA: interop.Pointer

export declare const kSecAttrCanWrap: interop.Pointer

export declare const CSSMERR_TP_INVALID_TUPLEGROUP_POINTER: number

export declare const errSecCoreFoundationUnknown: number

export declare const CSSMERR_DL_ACL_CHANGE_FAILED: number

export declare const CSSMERR_CSP_INVALID_ATTR_PRIME: number

export declare const CSSMERR_APPLEDL_INVALID_KEY_BLOB: number

export declare const errSecInvalidTuple: number

export declare const CSSM_ALGID_SHA1WithRSA: number

export declare const CSSM_DB_INDEX_ON_ATTRIBUTE: number

export declare const CSSMOID_DSA: cssm_data

export declare const errSecMobileMeRequestQueued: number

export declare const CSSM_ALGMODE_ECBPad: number

export declare const kSecOIDAPPLE_EXTENSION_APPLEID_INTERMEDIATE: interop.Pointer

export declare const CSSMOID_SubjectDirectoryAttributes: cssm_data

export declare const CSSM_ATTRIBUTE_FEE_CURVE_TYPE: number

export declare const kSecAttrSalt: interop.Pointer

export declare const CSSM_WORDID_DB_MODIFY: number

export declare const CSSM_WORDID_MD4: number

export declare const kSecPolicyKU_NonRepudiation: interop.Pointer

export declare const CSSMOID_X509V1SubjectPublicKeyAlgorithmParameters: cssm_data

export declare const CSSMOID_APPLE_TP_MACAPPSTORE_RECEIPT: cssm_data

export declare const CSSMERR_APPLEDL_INCOMPATIBLE_DATABASE_BLOB: number

export declare const CSSMERR_CSP_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const CSSMOID_PKCS5_pbeWithSHA1AndRC2: cssm_data

export declare const oidSha1RsaOIW: DERItem

export declare const errSecTrustSettingDeny: number

export declare const CSSMERR_CSSM_ADDIN_UNLOAD_FAILED: number

export declare const kSecImportItemLabel: interop.Pointer

export declare const CSSM_CERT_PARSE_FORMAT_TUPLE: number

export declare const CSSM_ACL_PREAUTH_TRACKING_UNKNOWN: number

export declare const CSSM_TP_CERTVERIFY_INVALID_CERTGROUP: number

export declare const CSSM_ALGID_FEEDEXP: number

export declare const SSL_RSA_WITH_IDEA_CBC_MD5: number

export declare const CSSMERR_CSP_INVALID_ATTR_ROUNDS: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_SINT32: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_28: number

export declare const oidLocalKeyId: DERItem

export declare const errSecOCSPBadRequest: number

export declare const errSecCRLNotFound: number

export declare const CSSM_NOTIFY_INSERT: number

export declare const CSSM_TP_CERTCHANGE_RELEASE: number

export declare const oidExtendedKeyUsageOCSPSigning: DERItem

export declare const CSSM_ATTRIBUTE_ITERATION_COUNT: number

export declare const CSSM_KEYATTR_RETURN_DEFAULT: number

export declare const CSSMOID_X509V1SignatureAlgorithmTBS: cssm_data

export declare const CSSMOID_APPLE_TP_MOBILE_STORE: cssm_data

export declare const TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384: number

export declare const kSecOIDInvalidityDate: interop.Pointer

export declare const errSecCSDbCorrupt: number

export declare const CSSMERR_CSP_INVALID_ACL_CHALLENGE_CALLBACK: number

export declare const kSecOIDAPPLE_EXTENSION_INTERMEDIATE_MARKER: interop.Pointer

export declare const TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384: number

export declare const CSSM_WORDID_MD5WITHRSA: number

export declare const CSSM_CERTGROUP_ENCODED_CERT: number

export declare const CSSMOID_APPLE_EKU_RESOURCE_SIGNING: cssm_data

export declare const CSSM_CERT_STATUS_TRUST_SETTINGS_FOUND_USER: number

export declare const kSecAsn1SetOfT61StringTemplate: interop.Pointer

export declare const errSecCSHostProtocolInvalidHash: number

export declare const CSSMERR_CL_USER_CANCELED: number

export declare const errSecInvalidKeyFormat: number

export declare const CSSM_KEYHEADER_VERSION: number

export declare const CSSM_WORDID_DB_INSERT: number

export declare const CSSM_ERRCODE_MDS_ERROR: number

export declare const TLS_DH_DSS_WITH_3DES_EDE_CBC_SHA: number

export declare const kSecOIDLocalityName: interop.Pointer

export declare const errSecModuleNotLoaded: number

export declare const CSSM_DL_DB_RECORD_INTERNET_PASSWORD: number

export declare const kSecClassGenericPassword: interop.Pointer

export declare const CSSM_WORDID_RSA_PKCS: number

export declare const kSecOIDSubjectSignatureBitmap: interop.Pointer

export declare const CSSMERR_CSP_UNSUPPORTED_KEYUSAGE_MASK: number

export declare const kSecPolicyKU_KeyCertSign: interop.Pointer

export declare const kSecTransformErrorInvalidAlgorithm: number

export declare const kSecCSDoNotValidateResources: number

export declare const CSSMOID_DOTMAC_CERT_REQ_SHARED_SERVICES: cssm_data

export declare const kSSLSessionConfig_RC4_fallback: interop.Pointer

export declare const CSSM_ALGID_SSL3MD5_MAC: number

export declare const errSSLHandshakeFail: number

export declare const CSSMERR_CSP_INVALID_ALGORITHM: number

export declare const CSSMERR_CL_INVALID_SCOPE: number

export declare const kSecOIDOCSPSigning: interop.Pointer

export declare const kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA384: interop.Pointer

export declare const CSSMERR_TP_INVALID_CL_HANDLE: number

export declare const errSecCSSignatureUnsupported: number

export declare const kSecCodeAttributeSubarchitecture: interop.Pointer

export declare const CSSM_WORDID_CUSTOM: number

export declare const CSSMOID_secp160r1: cssm_data

export declare const CSSMOID_X509V1CRLThisUpdate: cssm_data

export declare const CSSMOID_DOTMAC_CERT_REQ: cssm_data

export declare const CSSM_DB_MODIFY_ATTRIBUTE_DELETE: number

export declare const CSSMERR_CSSM_INVALID_PVC: number

export declare const oidAnyPolicy: DERItem

export declare const CSSM_EVIDENCE_FORM_CERT: number

export declare const errSSLPeerCertRevoked: number

export declare const CSSM_WORDID__FIRST_UNUSED: number

export declare const CSSM_ALGID_FIPS186Random: number

export declare const CSSM_CERT_STATUS_IS_ROOT: number

export declare const errSecCSResourcesNotSealed: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_NONE: number

export declare const CSSM_ATTRIBUTE_LABEL: number

export declare const CSSM_WORDID_SHA1WITHRSA: number

export declare const errSecInternalComponent: number

export declare const CSSMOID_StreetAddress: cssm_data

export declare const CSSMERR_CSSM_PRIVILEGE_NOT_GRANTED: number

export declare const kSecOIDX509V1IssuerNameCStruct: interop.Pointer

export declare const errSecInvalidAuthority: number

export declare const CSSMOID_SHA256WithRSA: cssm_data

export declare const CSSMOID_X509V1CRLRevokedEntryCStruct: cssm_data

export declare const errSecUnimplemented: number

export declare const CSSMERR_CL_INVALID_CRL_INDEX: number

export declare const kSecInputIsAttributeName: interop.Object

export declare const CSSMERR_DL_OBJECT_USE_AUTH_DENIED: number

export declare const errSecOCSPSignatureError: number

export declare const kSecACLAuthorizationKeychainItemRead: interop.Pointer

export declare const CSSM_ALGID_RIPEMD: number

export declare const CSSMOID_HouseIdentifier: cssm_data

export declare const errSecNoSuchClass: number

export declare const CSSMERR_AC_SERVICE_NOT_AVAILABLE: number

export declare const errSecInvalidValue: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA224: interop.Pointer

export declare const CSSM_TP_CERTRECLAIM_OK: number

export declare const errSecDeviceError: number

export declare const kSecTransformErrorAborted: number

export declare const oidSha1Dsa: DERItem

export declare const CSSMOID_APPLE_TP_REVOCATION_CRL: cssm_data

export declare const CSSM_CSP_HYBRID: number

export declare const errSecInvalidCRLType: number

export declare const SSL_NULL_WITH_NULL_NULL: number

export declare const CSSM_WORDID_RSA_PKCS1_MD5: number

export declare const errSSLBadConfiguration: number

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_NONE: number

export declare const CSSMOID_APPLE_TP_CODE_SIGNING: cssm_data

export declare const CSSM_ATTRIBUTE_PROMPT: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_OCTET_STRING: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_REDIRECT: number

export declare const CSSM_DB_ACCESS_RESET: number

export declare const errSecInvalidAction: number

export declare const errSecMissingAttributePassphrase: number

export declare const oidSha256Ecdsa: DERItem

export declare const CSSMOID_HYBRID_COMPOSITE_MLDSA87_RSA3072_WithSHA512_draft_13: cssm_data

export declare const CSSM_WORDID_PARTITION: number

export declare const CSSM_ASC_OPTIMIZE_ASCII: number

export declare const CSSMOID_FacsimileTelephoneNumber: cssm_data

export declare const errSecInvalidNumberOfFields: number

export declare const CSSM_WORDID_HASHED_SUBJECT: number

export declare const kSecACLAuthorizationExportClear: interop.Pointer

export declare const kSecOIDAPPLE_EKU_RESOURCE_SIGNING: interop.Pointer

export declare const errSecInvalidNewOwner: number

export declare const CSSM_ALGID_MD5: number

export declare const CSSMERR_CSP_INVALID_ATTR_WRAPPED_KEY_FORMAT: number

export declare const CSSMERR_DL_USER_CANCELED: number

export declare const CSSMOID_AuthorityKeyIdentifier: cssm_data

export declare const CSSMERR_CSP_ACL_DELETE_FAILED: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_18: number

export declare const kSecCSRequirementInformation: number

export declare const CSSMERR_DL_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const kSecAttrKeyTypeEC: interop.Pointer

export declare const CSSMERR_CSP_OBJECT_ACL_REQUIRED: number

export declare const errSecUnsupportedNumAttributes: number

export declare const kSecKeyEndDate: number

export declare const errSSLBadCipherSuite: number

export declare const CSSM_ALGMODE_BC: number

export declare const CSSM_PADDING_ONE: number

export declare const kSecKeyAlgorithmECDHKeyExchangeCofactorX963SHA384: interop.Pointer

export declare const TLS_ECDH_RSA_WITH_AES_256_CBC_SHA: number

export declare const CSSMERR_CSP_INVALID_ATTR_ITERATION_COUNT: number

export declare const CSSM_ACL_AUTHORIZATION_TAG_VENDOR_DEFINED_START: number

export declare const kSecCodeInfoUnique: interop.Pointer

export declare const SSL_DH_RSA_EXPORT_WITH_DES40_CBC_SHA: number

export declare const CSSMERR_TP_INSUFFICIENT_CREDENTIALS: number

export declare const CSSM_TP_CERTCHANGE_NONE: number

export declare const kSecKeyKeyCreator: number

export declare const CSSMERR_APPLETP_CODE_SIGN_DEVELOPMENT: number

export declare const CSSMERR_TP_INVALID_CRL_TYPE: number

export declare const CSSM_TP_ACTION_TRUST_SETTINGS: number

export declare const CSSMOID_CollectiveTelexTerminalIdentifier: cssm_data

export declare const CSSM_TP_ACTION_ALLOW_EXPIRED_ROOT: number

export declare const kSecAsn1SetOfIA5StringTemplate: interop.Pointer

export declare const CSSMERR_APPLETP_INVALID_CA: number

export declare const CSSM_WORDID_PRIVATE_KEY: number

export declare const CSSMERR_TP_INVALID_DB_LIST: number

export declare const CSSMOID_DOTMAC_CERT_REQ_ARCHIVE_FETCH: cssm_data

export declare const kSecAsn1PointerToBMPStringTemplate: interop.Pointer

export declare const errSecEMMUnloadFailed: number

export declare const errSecInvalidModifyMode: number

export declare const CSSM_WORDID_Q: number

export declare const kSecAsn1PointerToT61StringTemplate: interop.Pointer

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_NOT_AVAIL: number

export declare const kSecPropertyTypeDate: interop.Pointer

export declare const kSecKeyAlgorithmECDSASignatureRFC4754: interop.Pointer

export declare const errSecDecode: number

export declare const CSSM_ALGCLASS_CUSTOM: number

export declare const CSSM_PADDING_ALTERNATE: number

export declare const CSSMOID_KeyUsage: cssm_data

export declare const kSecOIDX509V1ValidityNotBefore: interop.Pointer

export declare const errSSLUnrecognizedName: number

export declare const kSecOIDX509V1SubjectPublicKeyAlgorithm: interop.Pointer

export declare const CSSMERR_TP_NOT_SIGNER: number

export declare const gGuidAppleDotMacDL: cssm_guid

export declare const CSSMERR_APPLETP_CRL_NOT_TRUSTED: number

export declare const CSSM_ALGID_SHA1WithDSA: number

export declare const kSecTransformActionExternalizeExtraData: interop.Pointer

export declare const CSSM_CRL_ENCODING_SEXPR: number

export declare const kSecPropertyTypeArray: interop.Pointer

export declare const CSSMERR_TP_REQUEST_LOST: number

export declare const errSecSSLBadExtendedKeyUsage: number

export declare const CSSM_WORDID_SDSIV1: number

export declare const CSSM_ALGID_OPENSSH1: number

export declare const errSecUnsupportedKeySize: number

export declare const errSecDataTooLarge: number

export declare const errSecCSBadTeamIdentifier: number

export declare const CSSM_ALGID_PKCS5_PBKDF2: number

export declare const TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA384: number

export declare const errSecInvalidTimeString: number

export declare const oidSha256: DERItem

export declare const CSSM_ACL_EDIT_MODE_REPLACE: number

export declare const CSSM_ALGID_SHA224: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_PKCS8: number

export declare const CSSM_ALGMODE_PKCS1_EMSA_V15: number

export declare const CSSM_KEYCLASS_SESSION_KEY: number

export declare const errSecOCSPResponseNonceMismatch: number

export declare const kSecAsn1SetOfTeletexStringTemplate: interop.Pointer

export declare const CSSMOID_sect113r1: cssm_data

export declare const CSSMERR_DL_FIELD_SPECIFIED_MULTIPLE: number

export declare const CSSMOID_sect193r2: cssm_data

export declare const CSSM_APPLEFILEDL_ROLLBACK: number

export declare const errSSLATSMinimumVersionViolation: number

export declare const TLS_PSK_WITH_AES_256_CBC_SHA: number

export declare const CSSM_SAMPLE_TYPE_PASSWORD: number

export declare const kSecCSCheckGatekeeperArchitectures: number

export declare const kSecCodeInfoChangedFiles: interop.Pointer

export declare const errSecInvalidKeyBlob: number

export declare const errSSLWeakPeerEphemeralDHKey: number

export declare const kSecCodeInfoPlatformIdentifier: interop.Pointer

export declare const CSSM_WORDID_ALPHA: number

export declare const kSecAttrPRF: interop.Pointer

export declare const CSSMERR_TP_INVALID_INDEX: number

export declare const errSecOCSPStatusUnrecognized: number

export declare const CSSM_DL_DB_RECORD_GENERIC_PASSWORD: number

export declare const CSSM_ERRCODE_CRL_ALREADY_SIGNED: number

export declare const errSecQuotaExceeded: number

export declare const errAuthorizationInvalidPointer: number

export declare const CSSM_ATTRIBUTE_RANDOM: number

export declare const CSSMOID_RSA: cssm_data

export declare const CSSMERR_CSP_INPUT_LENGTH_ERROR: number

export declare const CSSMOID_X_121Address: cssm_data

export declare const CSSMOID_PKCS9_FriendlyName: cssm_data

export declare const CSSMOID_DOTMAC_CERT_REQ_VALUE_ASYNC: cssm_data

export declare const CSSM_ALGID_BATON: number

export declare const CSSM_CERT_SDSIv1: number

export declare const CSSM_NET_PROTO_LDAPNS: number

export declare const kSecImportExportPassphrase: interop.Pointer

export declare const CSSMERR_DL_ACL_ENTRY_TAG_NOT_FOUND: number

export declare const CSSM_SAMPLE_TYPE_SIGNED_SECRET: number

export declare const CSSMOID_PKCS9_LocalKeyId: cssm_data

export declare const CSSM_WORDID_MD2WITHRSA: number

export declare const CSSMERR_CSP_OS_ACCESS_DENIED: number

export declare const CSSM_ALGID_MD4: number

export declare const CSSM_ALGID_GOST: number

export declare const CSSM_CONTEXT_EVENT_UPDATE: number

export declare const kSecAttrProtocolFTPAccount: interop.Pointer

export declare const CSSMERR_CSSM_NOT_INITIALIZED: number

export declare const kSecACLAuthorizationKeychainItemDelete: interop.Pointer

export declare const kSecCSDedicatedHost: number

export declare const TLS_PSK_WITH_NULL_SHA: number

export declare const CSSMERR_APPLETP_UNKNOWN_CRITICAL_EXTEN: number

export declare const errSecTimestampBadAlg: number

export declare const CSSMOID_BasicConstraints: cssm_data

export declare const CSSMERR_DL_UNSUPPORTED_FIELD_FORMAT: number

export declare const callerSecuritySession: number

export declare const CSSMOID_X509V2CRLTbsCertListCStruct: cssm_data

export declare const CSSMOID_X509V2CRLExtensionCritical: cssm_data

export declare const kSecAttrAccessibleAlwaysThisDeviceOnly: interop.Pointer

export declare const CSSMOID_SHA1WithDSA_JDK: cssm_data

export declare const kSecWritePermStatus: number

export declare const CSSM_ADDR_NAME: number

export declare const kSecAttrLabel: interop.Pointer

export declare const errSecTimestampRevocationNotification: number

export declare const CSSMOID_secp128r2: cssm_data

export declare const CSSM_PVC_APP: number

export declare const errSSLBadRecordMac: number

export declare const CSSMERR_DL_UNSUPPORTED_NUM_SELECTION_PREDS: number

export declare const kSSLSessionConfig_default: interop.Pointer

export declare const CSSMOID_APPLE_FEEDEXP: cssm_data

export declare const kSecDigestTypeAttribute: interop.Pointer

export declare const CSSMOID_PKCS12_keyBag: cssm_data

export declare const CSSM_CRLGROUP_CRL_PAIR: number

export declare const CSSMOID_PKCS7_EncryptedData: cssm_data

export declare const CSSM_WORDID_VENDOR_START: number

export declare const CSSM_ALGID_3DES_1KEY: number

export declare const CSSM_ALGID_ASC: number

export declare const CSSM_CRL_ENCODING_DER: number

export declare const errSecAttributeNotInContext: number

export declare const errSecRestrictedAPI: number

export declare const CSSMERR_CSP_INTERNAL_ERROR: number

export declare const CSSM_WORDID_THRESHOLD: number

export declare const TLS_ECDH_anon_WITH_AES_256_CBC_SHA: number

export declare const CSSM_SERVICE_CSP: number

export declare const CSSMOID_Title: cssm_data

export declare const CSSMOID_ExtendedCertificateAttributes: cssm_data

export declare const CSSMOID_X509V1CRLRevokedEntryRevocationDate: cssm_data

export declare const CSSMOID_X509V1CRLRevokedEntryStruct: cssm_data

export declare const errSecRequestDescriptor: number

export declare const CSSMOID_SHA512WithRSA: cssm_data

export declare const CSSMOID_MD4WithRSA: cssm_data

export declare const CSSMERR_CSP_INVALID_ATTR_VERSION: number

export declare const kSecKeyVerify: number

export declare const CSSM_ALGID_RC2: number

export declare const CSSMERR_DL_INVALID_RECORDTYPE: number

export declare const errSecCSDBAccess: number

export declare const errSecInvalidOutputVector: number

export declare const CSSMERR_CSP_INVALID_ATTR_PADDING: number

export declare const errSecAddinUnloadFailed: number

export declare const kSecCSUseSoftwareSigningCert: number

export declare const kSecDigestHMACSHA1: interop.Pointer

export declare const CSSMERR_CSP_BLOCK_SIZE_MISMATCH: number

export declare const CSSMOID_SHA384WithRSA: cssm_data

export declare const CSSM_USEE_WEAK: number

export declare const CSSMOID_X509V1SubjectNameStd: cssm_data

export declare const errSSLUnknownRootCert: number

export declare const TLS_PSK_WITH_AES_256_CBC_SHA384: number

export declare const errSecMissingAttributeSubprime: number

export declare const CSSMOID_CrossCertificatePair: cssm_data

export declare const CSSM_CERT_X_509_ATTRIBUTE: number

export declare const errSSLFatalAlert: number

export declare const kSecAttrKeyClassPublic: interop.Pointer

export declare const errSecNoStorageModule: number

export declare const CSSM_ALGID_ECES: number

export declare const CSSM_TP_CRLISSUE_STATUS_UNKNOWN: number

export declare const kSecAttrProtocolSSH: interop.Pointer

export declare const kSecAttrProtocolDAAP: interop.Pointer

export declare const oidAnsip384r1: DERItem

export declare const CSSM_CSSM_PRIVATE_ERROR: number

export declare const kSecKeyAlgorithmECDHKeyExchangeStandardX963SHA256: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_DB_MODIFY: number

export declare const CSSM_WORDID_DER: number

export declare const CSSMERR_AC_INVALID_VALIDITY_PERIOD: number

export declare const errSecCSOutdated: number

export declare const kSecCFErrorDetachedCertificates: interop.Pointer

export declare const CSSMERR_AC_INVALID_TP_HANDLE: number

export declare const CSSM_ACL_AUTHORIZATION_DERIVE: number

export declare const CSSMERR_CL_INVALID_PASSTHROUGH_ID: number

export declare const kSecOIDX509V1SubjectNameLDAP: interop.Pointer

export declare const kSecPolicyKU_KeyAgreement: interop.Pointer

export declare const kSecAttrProtocolLDAP: interop.Pointer

export declare const CSSM_TP_CERTCHANGE_HOLD: number

export declare const CSSM_WORDID_A: number

export declare const CSSM_ATTRIBUTE_BASE: number

export declare const CSSM_PKCS_OAEP_PSOURCE_Pspecified: number

export declare const kSecCFErrorPath: interop.Pointer

export declare const kSecAttrProtocolRTSPProxy: interop.Pointer

export declare const CSSMOID_APPLE_ISIGN: cssm_data

export declare const CSSM_CL_CUSTOM_CERT_BUNDLE_TYPE: number

export declare const CSSM_WORDID_DB_READ: number

export declare const CSSMERR_APPLETP_INVALID_EMPTY_SUBJECT: number

export declare const CSSM_ERRCODE_INVALID_OUTPUT_POINTER: number

export declare const CSSMOID_APPLE_TP_IP_SEC: cssm_data

export declare const errSecInvalidServiceMask: number

export declare const CSSM_ATTRIBUTE_ALG_ID: number

export declare const CSSMOID_APPLEID_CERT_POLICY: cssm_data

export declare const CSSMOID_DOTMAC_CERT_POLICY: cssm_data

export declare const errSSLNegotiation: number

export declare const errSecAppleSignatureMismatch: number

export declare const kSecKeyAlwaysSensitive: number

export declare const CSSMOID_APPLEID_SHARING_CERT_POLICY: cssm_data

export declare const errSecEndOfData: number

export declare const CSSM_WORDID_DBS_DELETE: number

export declare const CSSMERR_CSSM_PVC_ALREADY_CONFIGURED: number

export declare const TLS_DHE_PSK_WITH_NULL_SHA256: number

export declare const CSSM_CERT_BUNDLE_SPKI_SEQUENCE: number

export declare const CSSM_ACL_SUBJECT_TYPE_EXT_PAM_NAME: number

export declare const kSecOIDX509V1CertificateIssuerUniqueId: interop.Pointer

export declare const CSSMERR_CSSM_MODULE_MANIFEST_VERIFY_FAILED: number

export declare const CSSMERR_APPLETP_INVALID_KEY_USAGE: number

export declare const kSecAttrIsInvisible: interop.Pointer

export declare const CSSMERR_CSP_IN_DARK_WAKE: number

export declare const CSSM_TP_CERTISSUE_REJECTED: number

export declare const CSSMERR_DL_UNSUPPORTED_NUM_RECORDTYPES: number

export declare const CSSMERR_CSP_INVALID_ATTR_SALT: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_14: number

export declare const kSecKeyAlgorithmRSAEncryptionRaw: interop.Pointer

export declare const CSSMERR_APPLETP_OCSP_SIG_ERROR: number

export declare const CSSMOID_DH: cssm_data

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTVERIFY: number

export declare const CSSMERR_DL_OBJECT_ACL_NOT_SUPPORTED: number

export declare const CSSM_PRIVILEGE_SCOPE_THREAD: number

export declare const CSSMERR_DL_INVALID_DL_HANDLE: number

export declare const CSSMOID_BiometricInfo: cssm_data

export declare const CSSMERR_DL_INVALID_INDEX_INFO: number

export declare const kSecValueData: interop.Pointer

export declare const CSSMERR_DL_OBJECT_MANIP_AUTH_DENIED: number

export declare const oidBasicConstraints: DERItem

export declare const CSSMOID_CACertificate: cssm_data

export declare const CSSMOID_PKCS12_safeContentsBag: cssm_data

export declare const kSecTransformInvalidOverride: number

export declare const errSecMissingAttributeKeyLength: number

export declare const CSSMOID_X509V1ValidityNotBefore: cssm_data

export declare const CSSMERR_CSP_ATTACH_HANDLE_BUSY: number

export declare const CSSM_WORDID_KEYBAG_KEY: number

export declare const CSSMERR_TP_INVALID_CERTGROUP_POINTER: number

export declare const CSSMERR_APPLETP_OCSP_RESP_TRY_LATER: number

export declare const CSSMOID_MD5WithRSA: cssm_data

export declare const CSSMERR_TP_INVALID_REASON: number

export declare const CSSM_SAMPLE_TYPE_KEYCHAIN_LOCK: number

export declare const CSSM_NET_PROTO_NONE: number

export declare const CSSM_ALGID_NONE: number

export declare const CSSMOID_APPLE_TP_TEST_MOBILE_STORE: cssm_data

export declare const CSSM_WORDID_RSA_RAW: number

export declare const errSecKeyHeaderInconsistent: number

export declare const CSSM_ACL_AUTHORIZATION_PREAUTH_BASE: number

export declare const CSSMERR_TP_INVALID_RESPONSE_VECTOR: number

export declare const CSSM_KEYUSE_VERIFY_RECOVER: number

export declare const CSSMERR_CSSM_DEVICE_FAILED: number

export declare const CSSM_WORDID_TIME: number

export declare const CSSMOID_UserID: cssm_data

export declare const CSSMERR_CSSM_FUNCTION_NOT_IMPLEMENTED: number

export declare const CSSMERR_CL_VERIFICATION_FAILURE: number

export declare const CSSM_LIST_ELEMENT_DATUM: number

export declare const CSSMERR_CSSM_FUNCTION_INTEGRITY_FAIL: number

export declare const CSSMERR_CSP_MISSING_ATTR_WRAPPED_KEY_FORMAT: number

export declare const CSSM_TP_ACTION_LEAF_IS_CA: number

export declare const kSecTransformErrorInvalidConnection: number

export declare const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA256: interop.Pointer

export declare const CSSM_ERRCODE_ACL_REPLACE_FAILED: number

export declare const errSSLInappropriateFallback: number

export declare const gGuidCssm: cssm_guid

export declare const kSecOIDSubjectPicture: interop.Pointer

export declare const kSecNoGuest: number

export declare const CSSM_WORDID_DELTA_CRL: number

export declare const errSecAllocate: number

export declare const CSSM_ACL_MATCH_GID: number

export declare const CSSMERR_APPLETP_CRL_EXPIRED: number

export declare const kSecPolicyKU_DecipherOnly: interop.Pointer

export declare const CSSMOID_ANSI_DH_STATIC_SHA1: cssm_data

export declare const kSecTransformActionProcessData: interop.Pointer

export declare const CSSMERR_TP_UNSUPPORTED_SERVICE: number

export declare const CSSM_ACL_AUTHORIZATION_INTEGRITY: number

export declare const CSSM_DL_LDAP: number

export declare const CSSM_ATTRIBUTE_ASC_OPTIMIZATION: number

export declare const TLS_ECDHE_RSA_WITH_RC4_128_SHA: number

export declare const kSecPaddingKey: interop.Pointer

export declare const CSSMOID_X509V2CRLNumberOfExtensions: cssm_data

export declare const errAuthorizationInteractionNotAllowed: number

export declare const kSecOIDSubjectKeyIdentifier: interop.Pointer

export declare const CSSMOID_X509V3CertificateNumberOfExtensions: cssm_data

export declare const CSSM_ATTRIBUTE_RSA_BLINDING: number

export declare const CSSMOID_Member: cssm_data

export declare const kSecOIDTitle: interop.Pointer

export declare const errSecAlreadyLoggedIn: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_9: number

export declare const CSSM_CRL_TYPE_UNKNOWN: number

export declare const CSSM_EVIDENCE_FORM_CRL: number

export declare const CSSM_ACL_AUTHORIZATION_ANY: number

export declare const errSecCSBadBundleFormat: number

export declare const CSSM_KEYATTR_ALWAYS_SENSITIVE: number

export declare const CSSMOID_UniqueMember: cssm_data

export declare const CSSMOID_PKCS9_TimeStampToken: cssm_data

export declare const CSSMERR_CSSM_PVC_REFERENT_NOT_FOUND: number

export declare const kSecMatchLimitAll: interop.Pointer

export declare const CSSM_ACL_EDIT_MODE_ADD: number

export declare const errAuthorizationToolExecuteFailure: number

export declare const kSecOIDKeyUsage: interop.Pointer

export declare const kSecOIDEKU_IPSec: interop.Pointer

export declare const errSSLInternal: number

export declare const kSecKeyEncrypt: number

export declare const CSSM_WORDID_RSA_PKCS_MD5: number

export declare const CSSMERR_TP_USER_CANCELED: number

export declare const kSecTransformActionInternalizeExtraData: interop.Pointer

export declare const errSecMobileMeNoRequestPending: number

export declare const errSecACLNotSimple: number

export declare const TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256: number

export declare const CSSMERR_APPLETP_OCSP_RESP_MALFORMED_REQ: number

export declare const kSecACLAuthorizationAny: interop.Pointer

export declare const CSSMERR_CL_INVALID_OUTPUT_POINTER: number

export declare const errSecCSInfoPlistFailed: number

export declare const kSecCodeAttributeBundleVersion: interop.Pointer

export declare const kSecPropertyTypeWarning: interop.Pointer

export declare const kSecOIDBasicConstraints: interop.Pointer

export declare const CSSMERR_CSP_APPLE_INVALID_KEY_END_DATE: number

export declare const oidExtendedKeyUsage: DERItem

export declare const TLS_PSK_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_IssuingDistributionPoints: cssm_data

export declare const CSSM_WORDID_X509V3: number

export declare const errSecInvalidCallback: number

export declare const SSL_RSA_WITH_DES_CBC_SHA: number

export declare const CSSMERR_TP_INVALID_STOP_ON_POLICY: number

export declare const CSSM_TP_STOP_ON_POLICY: number

export declare const CSSMERR_APPLETP_RS_BAD_EXTENDED_KEY_USAGE: number

export declare const CSSMERR_AC_INVALID_TUPLE_CREDENTIALS: number

export declare const errSecDuplicateCallback: number

export declare const CSSMOID_AD_CA_REPOSITORY: cssm_data

export declare const kSecKeyAlgorithmECDSASignatureDigestX962SHA256: interop.Pointer

export declare const CSSM_TP_CERTCHANGE_STATUS_UNKNOWN: number

export declare const CSSMOID_APPLE_EXTENSION: cssm_data

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_PKCS7: number

export declare const CSSMERR_CSP_INVALID_CONTEXT_HANDLE: number

export declare const CSSMERR_AC_INVALID_POINTER: number

export declare const CSSM_WORDID_BIOMETRIC: number

export declare const kSecEncryptionMode: interop.Pointer

export declare const CSSM_NET_PROTO_OCSP: number

export declare const errSecDeviceFailed: number

export declare const errSecInvalidPasswordRef: number

export declare const CSSM_EVIDENCE_FORM_CERT_ID: number

export declare const CSSM_CRL_ENCODING_BER: number

export declare const CSSM_QUERY_SIZELIMIT_NONE: number

export declare const CSSMOID_ANSI_MQV2_SHA1: cssm_data

export declare const CSSM_WORDID_X9_ATTRIBUTE: number

export declare const kSecUseAuthenticationUISkip: interop.Pointer

export declare const kSecOIDCrlDistributionPoints: interop.Pointer

export declare const errSecMobileMeRequestAlreadyPending: number

export declare const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA224: interop.Pointer

export declare const CSSMOID_ANSI_DH_HYBRID1_SHA1: cssm_data

export declare const CSSMERR_CSSM_SCOPE_NOT_SUPPORTED: number

export declare const CSSM_KEYBLOB_REF_FORMAT_INTEGER: number

export declare const errSSLProtocol: number

export declare const CSSM_ALGMODE_PFB: number

export declare const CSSM_CSP_TOK_PROT_AUTHENTICATION: number

export declare const kSecCFErrorResourceAltered: interop.Pointer

export declare const CSSMERR_CL_INVALID_POINTER: number

export declare const kSecOIDKERBv5_PKINIT_KP_CLIENT_AUTH: interop.Pointer

export declare const errSecMobileMeRequestRedirected: number

export declare const CSSM_DB_ATTRIBUTE_NAME_AS_STRING: number

export declare const CSSM_WORDID_SEXPR: number

export declare const TLS_DH_RSA_WITH_AES_128_CBC_SHA: number

export declare const errSecInvalidAttributeKeyType: number

export declare const errSecInvalidBaseACLs: number

export declare const errSecOCSPResponderUnauthorized: number

export declare const CSSM_ERRCODE_INVALID_PASSTHROUGH_ID: number

export declare const CSSM_TP_ACTION_IMPLICIT_ANCHORS: number

export declare const kSecOIDAPPLE_EKU_SYSTEM_IDENTITY: interop.Pointer

export declare const CSSM_USEE_INSURANCE: number

export declare const CSSM_KEYUSE_DECRYPT: number

export declare const CSSMERR_DL_DATABASE_CORRUPT: number

export declare const CSSMERR_DL_INVALID_PASSTHROUGH_ID: number

export declare const CSSMOID_NetscapeSGC: cssm_data

export declare const CSSM_ALGID_LAST: number

export declare const kSecKeyAlgorithmRSASignatureMessagePSSSHA1: interop.Pointer

export declare const CSSMERR_APPLETP_OCSP_BAD_RESPONSE: number

export declare const kSSLSessionConfig_legacy: interop.Pointer

export declare const CSSMOID_PKCS9_Id_Ct_TSTInfo: cssm_data

export declare const kSecAttrPRFHmacAlgSHA512: interop.Pointer

export declare const CSSMERR_DL_SELF_CHECK_FAILED: number

export declare const errSecCertificateValidityPeriodTooLong: number

export declare const errSecInvalidAttributeSymmetricKeyFormat: number

export declare const CSSMOID_X509V1SubjectNameCStruct: cssm_data

export declare const kSecKeyAlgorithmECIESEncryptionCofactorX963SHA1AESGCM: interop.Pointer

export declare const CSSM_ALGID_3DES_2KEY_EEE: number

export declare const TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384: number

export declare const CSSM_FEE_CURVE_TYPE_ANSI_X9_62: number

export declare const CSSM_ALGMODE_PUBLIC_KEY: number

export declare const CSSM_ATTRIBUTE_DATA_VERSION: number

export declare const errSecInvalidAttributePrivateKeyFormat: number

export declare const CSSM_EVIDENCE_FORM_APPLE_CERTGROUP: number

export declare const errSecInvalidIdentifier: number

export declare const CSSMERR_APPLETP_IDP_FAIL: number

export declare const CSSMOID_APPLE_TP_PROVISIONING_PROFILE_SIGNING: cssm_data

export declare const kSecAsn1PointerToVisibleStringTemplate: interop.Pointer

export declare const CSSM_CERT_TUPLE: number

export declare const CSSMOID_PKCS7_EncryptedPrivateKeyInfo: cssm_data

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTREVOKE: number

export declare const CSSMERR_APPLETP_SMIME_BAD_KEY_USE: number

export declare const SSL_DH_DSS_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_ANSI_DH_PUB_NUMBER: cssm_data

export declare const gGuidAppleDotMacTP: cssm_guid

export declare const errSSLSessionNotFound: number

export declare const kSecKeyAlgorithmECDHKeyExchangeCofactor: interop.Pointer

export declare const CSSM_TP_CERTRECLAIM_REJECTED: number

export declare const kSecCFErrorResourceMissing: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_IMPORT_CLEAR: number

export declare const CSSM_ALGID_PKCS12_PBE_ENCR: number

export declare const kSecOIDX509V1CertificateSubjectUniqueId: interop.Pointer

export declare const CSSMOID_CollectiveFacsimileTelephoneNumber: cssm_data

export declare const kSecAttrType: interop.Pointer

export declare const CSSMERR_CSP_MISSING_ATTR_BLOCK_SIZE: number

export declare const SSL_FORTEZZA_DMS_WITH_NULL_SHA: number

export declare const errSecMobileMeServerServiceErr: number

export declare const CSSM_DL_DB_SCHEMA_INDEXES: number

export declare const CSSMERR_CSSM_MODULE_NOT_LOADED: number

export declare const CSSM_ATTRIBUTE_PUBLIC_KEY: number

export declare const kSecCodeInfoTime: interop.Pointer

export declare const CSSMERR_TP_INVALID_KEYCACHE_HANDLE: number

export declare const errSecCSHostProtocolInvalidAttribute: number

export declare const CSSMOID_APPLE_EXTENSION_PASSBOOK_SIGNING: cssm_data

export declare const CSSM_ERRCODE_ACL_CHALLENGE_CALLBACK_FAILED: number

export declare const kSecKeyAlgorithmECDSASignatureMessageX962SHA1: interop.Pointer

export declare const CSSMERR_APPLETP_CS_NO_BASIC_CONSTRAINTS: number

export declare const kSecKeyPrintName: number

export declare const CSSMOID_OID_QCS_SYNTAX_V1: cssm_data

export declare const CSSMERR_DL_INTERNAL_ERROR: number

export declare const CSSM_DB_RECORDTYPE_OPEN_GROUP_END: number

export declare const CSSM_ACL_CODE_SIGNATURE_OSX: number

export declare const CSSM_ATTACH_READ_ONLY: number

export declare const kSecValuePersistentRef: interop.Pointer

export declare const kSecOIDIssuingDistributionPoint: interop.Pointer

export declare const SSL_FORTEZZA_DMS_WITH_FORTEZZA_CBC_SHA: number

export declare const errSecNotAvailable: number

export declare const kSecKeyAlgorithmRSASignatureRaw: interop.Pointer

export declare const kSecOIDEmailAddress: interop.Pointer

export declare const CSSMOID_TelephoneNumber: cssm_data

export declare const TLS_DH_anon_WITH_AES_128_GCM_SHA256: number

export declare const CSSM_WORDID_NOT_BEFORE: number

export declare const TLS_DHE_PSK_WITH_AES_256_GCM_SHA384: number

export declare const gGuidAppleLDAPDL: cssm_guid

export declare const CSSM_USEE_DOMESTIC: number

export declare const errSecMissingAttributeSalt: number

export declare const CSSM_TP_CERTCHANGE_REVOKE: number

export declare const CSSMERR_TP_INVALID_INPUT_POINTER: number

export declare const CSSMERR_AC_INVALID_PASSTHROUGH_ID: number

export declare const CSSMERR_TP_OS_ACCESS_DENIED: number

export declare const kSecAttrAuthenticationTypeDPA: interop.Pointer

export declare const errSecInvalidTrustSetting: number

export declare const CSSM_DL_FFS: number

export declare const CSSM_ERRCODE_USER_CANCELED: number

export declare const CSSMOID_X509V1SerialNumber: cssm_data

export declare const CSSM_ALGCLASS_DIGEST: number

export declare const CSSM_WORDID_DB_EXEC_STORED_QUERY: number

export declare const kSecKeyApplicationTag: number

export declare const CSSMERR_AC_SELF_CHECK_FAILED: number

export declare const SSL_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_MD2WithRSA: cssm_data

export declare const CSSMERR_DL_INVALID_ACCESS_REQUEST: number

export declare const CSSMOID_ETSI_QCS_QC_SSCD: cssm_data

export declare const kSecOIDCSSMKeyStruct: interop.Pointer

export declare const errSecTimestampSystemFailure: number

export declare const kSecAttrIsNegative: interop.Pointer

export declare const kSecPaddingPKCS1Key: interop.Pointer

export declare const CSSM_DL_DB_RECORD_UNLOCK_REFERRAL: number

export declare const CSSM_EVIDENCE_FORM_APPLE_CERT_INFO: number

export declare const kSecOIDX509V3CertificateCStruct: interop.Pointer

export declare const CSSMOID_X509V1SubjectPublicKeyCStruct: cssm_data

export declare const CSSM_ERRCODE_UNKNOWN_TAG: number

export declare const TLS_DH_anon_WITH_RC4_128_MD5: number

export declare const CSSM_CRL_PARSE_FORMAT_TUPLE: number

export declare const CSSMERR_TP_INVALID_CONTEXT_HANDLE: number

export declare const gGuidAppleCSPDL: cssm_guid

export declare const SSL_RSA_WITH_RC2_CBC_MD5: number

export declare const CSSM_APPLECSPDL_DB_IS_LOCKED: number

export declare const errSecInDarkWake: number

export declare const CSSMERR_CSSM_INVALID_HANDLE_USAGE: number

export declare const CSSMERR_APPLEDL_DISK_FULL: number

export declare const CSSM_SAMPLE_TYPE_BIOMETRIC: number

export declare const CSSM_KEYBLOB_WRAPPED: number

export declare const kSecKeyAlgorithmECDHKeyExchangeStandardX963SHA1: interop.Pointer

export declare const CSSMERR_TP_INVALID_CERT_POINTER: number

export declare const errSecRecordModified: number

export declare const CSSM_FIELDVALUE_COMPLEX_DATA_TYPE: number

export declare const CSSM_ACL_AUTHORIZATION_GENKEY: number

export declare const CSSM_WORDID_KEA: number

export declare const kSecPublicKeyAttrs: interop.Pointer

export declare const CSSM_LIST_ELEMENT_WORDID: number

export declare const CSSM_ALGID_SHA256WithRSA: number

export declare const kSecCodeInfoTrust: interop.Pointer

export declare const CSSMERR_APPLETP_OCSP_STATUS_UNRECOGNIZED: number

export declare const kSecOIDX509V1SignatureCStruct: interop.Pointer

export declare const errSecCSCMSTooLarge: number

export declare const kSecTransformTransformName: interop.Pointer

export declare const CSSM_WORDID_PUBLIC_KEY: number

export declare const errSSLPeerInternalError: number

export declare const CSSMERR_CSP_NOT_LOGGED_IN: number

export declare const errSecInvalidIndexInfo: number

export declare const kSecTransformErrorMissingParameter: number

export declare const CSSMOID_X509V1CRLIssuerNameLDAP: cssm_data

export declare const CSSM_WORDID_SYSTEM: number

export declare const errSecCSBadObjectFormat: number

export declare const CSSMERR_APPLETP_OCSP_INVALID_ANCHOR_CERT: number

export declare const kSecClass: interop.Pointer

export declare const kSecMatchItemList: interop.Pointer

export declare const CSSM_ALGID_PKCS12_SHA1_PBE: number

export declare const CSSMOID_SHA256: cssm_data

export declare const kSecOIDADC_CERT_POLICY: interop.Pointer

export declare const errSSLNetworkTimeout: number

export declare const errSecUnsupportedKeyLabel: number

export declare const CSSMERR_CSP_VECTOR_OF_BUFS_UNSUPPORTED: number

export declare const CSSM_KEYUSE_ENCRYPT: number

export declare const CSSM_ALGID_ECNRA: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_10: number

export declare const CSSM_USEE_AUTHENTICATION: number

export declare const CSSM_FEE_CURVE_TYPE_DEFAULT: number

export declare const CSSMOID_PKIX_OCSP_NONCE: cssm_data

export declare const CSSMERR_TP_INVALID_ID: number

export declare const CSSMOID_PKIX_OCSP_CRL: cssm_data

export declare const CSSM_TP_FORM_TYPE_REGISTRATION: number

export declare const CSSMERR_TP_AUTHENTICATION_FAILED: number

export declare const kSecCodeInfoRequirements: interop.Pointer

export declare const CSSM_ERRCODE_OBJECT_USE_AUTH_DENIED: number

export declare const CSSM_LIST_ELEMENT_SUBLIST: number

export declare const CSSMOID_UserCertificate: cssm_data

export declare const kSecACLAuthorizationChangeOwner: interop.Pointer

export declare const kSecUseKeychain: interop.Pointer

export declare const CSSM_ACL_SUBJECT_TYPE_ANY: number

export declare const CSSMOID_PKCS5_pbeWithMD5AndRC2: cssm_data

export declare const CSSMERR_TP_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const CSSM_SERVICE_CSSM: number

export declare const errSessionInvalidAttributes: number

export declare const CSSMERR_CSP_MISSING_ATTR_EFFECTIVE_BITS: number

export declare const CSSM_ACL_AUTHORIZATION_CHANGE_ACL: number

export declare const CSSM_ALGID_SHA224WithECDSA: number

export declare const CSSMOID_APPLE_FEE_MD5: cssm_data

export declare const errSecInvalidName: number

export declare const TLS_RSA_WITH_AES_256_GCM_SHA384: number

export declare const oidMd4: DERItem

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_27: number

export declare const CSSM_CERT_PARSE_FORMAT_LAST: number

export declare const kSecOIDX509V1SignatureStruct: interop.Pointer

export declare const kSecAttrCanUnwrap: interop.Pointer

export declare const CSSM_TP_CERTISSUE_OKWITHSERVICEMODS: number

export declare const CSSM_WORDID_DATE: number

export declare const CSSMERR_APPLETP_CS_NO_EXTENDED_KEY_USAGE: number

export declare const CSSM_ADDR_CUSTOM: number

export declare const CSSMOID_PKCS5_HMAC_SHA1: cssm_data

export declare const kSecCodeInfoDesignatedRequirement: interop.Pointer

export declare const CSSM_TP_ACTION_REQUIRE_REV_PER_CERT: number

export declare const errSecNoTrustSettings: number

export declare const oidFriendlyName: DERItem

export declare const oidCommonName: DERItem

export declare const CSSMERR_CSP_INVALID_ATTR_END_DATE: number

export declare const kSecAttrKeyTypeDSA: interop.Pointer

export declare const oidQtUNotice: DERItem

export declare const oidAdOCSP: DERItem

export declare const kSecPaddingPKCS7Key: interop.Pointer

export declare const errSecInvalidAttributeIterationCount: number

export declare const kSecTransformOutputAttributeName: interop.Pointer

export declare const oidAuthorityInfoAccess: DERItem

export declare const oidInhibitAnyPolicy: DERItem

export declare const CSSMERR_TP_INVALID_REQUEST_INPUTS: number

export declare const oidAuthorityKeyIdentifier: DERItem

export declare const CSSMOID_PKCS9_CrlTypes: cssm_data

export declare const oidPolicyMappings: DERItem

export declare const oidCrlDistributionPoints: DERItem

export declare const oidNameConstraints: DERItem

export declare const oidIssuerAltName: DERItem

export declare const oidSubjectAltName: DERItem

export declare const oidKeyUsage: DERItem

export declare const oidSubjectKeyIdentifier: DERItem

export declare const oidAnsip521r1: DERItem

export declare const errSSLPeerDecodeError: number

export declare const TLS_RSA_WITH_AES_128_CBC_SHA256: number

export declare const oidSha384Ecdsa: DERItem

export declare const oidSha224Ecdsa: DERItem

export declare const kSecInputIsPlainText: interop.Pointer

export declare const kSecKeyAttributeName: interop.Pointer

export declare const CSSM_DB_RECORDTYPE_SCHEMA_START: number

export declare const errSecFileTooBig: number

export declare const errSecCRLNotTrusted: number

export declare const CSSMOID_ANSI_MQV1: cssm_data

export declare const errSecCSBadCallbackValue: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_11: number

export declare const CSSMOID_PKCS12_pbeWithSHAAnd2Key3DESCBC: cssm_data

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_AUTH: number

export declare const kSecModeECBKey: interop.Pointer

export declare const kSecPaddingPKCS5Key: interop.Pointer

export declare const errSSLDecryptionFail: number

export declare const CSSM_TP_CERTVERIFY_INVALID: number

export declare const CSSMERR_CSP_INVALID_ATTR_OUTPUT_SIZE: number

export declare const kSecDigestHMACKeyAttribute: interop.Pointer

export declare const errSSLClosedGraceful: number

export declare const kSecDigestLengthAttribute: interop.Pointer

export declare const SSL_DHE_DSS_WITH_DES_CBC_SHA: number

export declare const kSecDigestMD4: interop.Pointer

export declare const kSecDigestMD2: interop.Pointer

export declare const CSSM_WORDID_NDR: number

export declare const kSecLineLength64: interop.Pointer

export declare const CSSM_WORDID_SPKI: number

export declare const kSecTransformActionCanExecute: interop.Pointer

export declare const kSecTransformAbortAttributeName: interop.Pointer

export declare const CSSMOID_APPLE_TP_LOCAL_CERT_GEN: cssm_data

export declare const errSecInvalidAttributePrime: number

export declare const kSecTransformInputAttributeName: interop.Pointer

export declare const kSecTransformInvalidArgument: number

export declare const kSecTransformErrorInvalidLength: number

export declare const kSecTransformErrorInvalidOperation: number

export declare const kSecPolicyAppleiChat: interop.Pointer

export declare const kSecTransformAbortOriginatorKey: interop.Pointer

export declare const oidEcPrime256v1: DERItem

export declare const kSSLSessionConfig_3DES_fallback: interop.Pointer

export declare const kSecOIDDOTMAC_CERT_POLICY: interop.Pointer

export declare const kSSLSessionConfig_legacy_DHE: interop.Pointer

export declare const kSSLSessionConfig_TLSv1_RC4_fallback: interop.Pointer

export declare const TLS_DHE_DSS_WITH_AES_128_CBC_SHA: number

export declare const errSecInvalidAttributeOutputSize: number

export declare const kSSLSessionConfig_standard: interop.Pointer

export declare const errSecMissingAttributeRounds: number

export declare const CSSMERR_CSP_INVALID_KEY_LABEL: number

export declare const kSecUseOperationPrompt: interop.Pointer

export declare const kSSLSessionConfig_ATSv1_noPFS: interop.Pointer

export declare const CSSM_WORDID_DB_DELETE: number

export declare const errSecWrongSecVersion: number

export declare const kSecCodeInfoCdHashes: interop.Pointer

export declare const CSSM_PADDING_FF: number

export declare const CSSMERR_TP_INVALID_ACTION: number

export declare const kSecDigestSHA2: interop.Pointer

export declare const CSSM_WORDID_NULL: number

export declare const CSSMERR_CSP_MISSING_ATTR_ALG_PARAMS: number

export declare const kSecCodeInfoMainExecutable: interop.Pointer

export declare const kSecReturnData: interop.Pointer

export declare const kSecCodeInfoRuntimeVersion: interop.Pointer

export declare const kSecCodeInfoIdentifier: interop.Pointer

export declare const kSecCSRestrictSidebandData: number

export declare const CSSMOID_PKCS5_PBES2: cssm_data

export declare const kSecCodeInfoDigestAlgorithms: interop.Pointer

export declare const CSSM_CSP_HARDWARE: number

export declare const kSecCodeInfoChosenSignature: interop.Pointer

export declare const kSecCSSkipResourceDirectory: number

export declare const CSSM_CERT_PARSE_FORMAT_NONE: number

export declare const kSecCSSigningInformation: number

export declare const CSSMERR_CSP_KEY_BLOB_TYPE_INCORRECT: number

export declare const TLS_ECDH_RSA_WITH_AES_128_CBC_SHA256: number

export declare const kSecCSInternalInformation: number

export declare const errSecVerifyActionFailed: number

export declare const kSecGuestAttributeDynamicCodeInfoPlist: interop.Pointer

export declare const CSSMERR_DL_INVALID_OUTPUT_POINTER: number

export declare const CSSMERR_TP_VERIFY_ACTION_FAILED: number

export declare const kSecGuestAttributeDynamicCode: interop.Pointer

export declare const kSecGuestAttributeCanonical: interop.Pointer

export declare const CSSMERR_DL_INVALID_RECORD_UID: number

export declare const kSecCSUseAllArchitectures: number

export declare const CSSM_ASC_OPTIMIZE_SECURITY: number

export declare const CSSM_ATTRIBUTE_CUSTOM: number

export declare const CSSM_ALGID_ElGamal: number

export declare const CSSMOID_PKCS5_RC5_CBC: cssm_data

export declare const CSSM_ACL_KEYCHAIN_PROMPT_CURRENT_VERSION: number

export declare const kSecMatchEmailAddressIfPresent: interop.Pointer

export declare const CSSMERR_CSP_INVALID_ACCESS_CREDENTIALS: number

export declare const CSSM_WORDID_RSA_ISO9796: number

export declare const TLS_DH_anon_WITH_AES_128_CBC_SHA256: number

export declare const CSSM_CERT_MULTIPLE: number

export declare const errSecIncompatibleKeyBlob: number

export declare const kSecCSValidatePEH: number

export declare const CSSM_ACL_SUBJECT_TYPE_CODE_SIGNATURE: number

export declare const oidOrganizationalUnitName: DERItem

export declare const CSSM_KEYATTR_RETURN_REF: number

export declare const kSecCSCheckNestedCode: number

export declare const kSecCSBasicValidateOnly: number

export declare const CSSM_CRLGROUP_PARSED_CRL: number

export declare const kSecCodeAttributeUniversalFileOffset: interop.Pointer

export declare const kSecAttrAccessControl: interop.Pointer

export declare const kSecCodeAttributeArchitecture: interop.Pointer

export declare const kSecCFErrorRequirementSyntax: interop.Pointer

export declare const kSecCodeInfoStapledNotarizationTicket: interop.Pointer

export declare const errSecMobileMeCSRVerifyFailure: number

export declare const kSecCFErrorResourceRecursive: interop.Pointer

export declare const kSecAttrApplicationLabel: interop.Pointer

export declare const kSecCFErrorPattern: interop.Pointer

export declare const errSecCSMultipleSelfSigning: number

export declare const errSecCSRemoteSignerFailed: number

export declare const errSSLATSLeafCertificateHashAlgorithmViolation: number

export declare const kSecMatchSearchList: interop.Pointer

export declare const errSecMissingAttributeSeed: number

export declare const CSSM_CRL_ENCODING_CUSTOM: number

export declare const errSecCSInvalidAssociatedFileData: number

export declare const errSecCSInvalidSymlink: number

export declare const errSecCSBadResource: number

export declare const errSecCSWeakResourceEnvelope: number

export declare const kSecAttrAuthenticationTypeHTMLForm: interop.Pointer

export declare const errSecCSUnsealedFrameworkRoot: number

export declare const errSecCSBadMainExecutable: number

export declare const errSecCSAmbiguousBundleFormat: number

export declare const errSecCSDSStoreSymlink: number

export declare const errSecApplePublicKeyIncomplete: number

export declare const errSecCSBadLVArch: number

export declare const errSecCSVetoed: number

export declare const CSSM_TP_CONFIRM_ACCEPT: number

export declare const CSSM_ALGID_IDEA: number

export declare const kSecAttrKeyClassSymmetric: interop.Pointer

export declare const errSecCSNoMatches: number

export declare const errSecCSNoMainExecutable: number

export declare const kSecCSRestrictSymlinks: number

export declare const CSSM_ALGMODE_X9_31: number

export declare const errSecCSSigDBAccess: number

export declare const oidMd4Rsa: DERItem

export declare const kSecKeyAlgorithmRSASignatureDigestPKCS1v15Raw: interop.Pointer

export declare const CSSMOID_SubjectSignatureBitmap: cssm_data

export declare const errSecCSDBDenied: number

export declare const errSecCSNotSupported: number

export declare const TLS_ECDH_anon_WITH_RC4_128_SHA: number

export declare const errSecCSHostProtocolRelativePath: number

export declare const CSSMERR_DL_FUNCTION_NOT_IMPLEMENTED: number

export declare const errSecCSHostReject: number

export declare const kSecCodeInfoTotalSignatures: interop.Pointer

export declare const errSecCSReqFailed: number

export declare const errSecCSSigDBDenied: number

export declare const errSecCSResourceRulesInvalid: number

export declare const errSecCSResourcesInvalid: number

export declare const CSSM_PRIVILEGE_SCOPE_PROCESS: number

export declare const errSecCSSignatureFailed: number

export declare const kSecOIDAPPLE_EKU_CODE_SIGNING_DEV: interop.Pointer

export declare const errSecCSMultipleGuests: number

export declare const errSecCSNoSuchCode: number

export declare const SSL_RSA_EXPORT_WITH_RC2_CBC_40_MD5: number

export declare const errSecCSUnsupportedGuestAttributes: number

export declare const errSecCSInvalidObjectRef: number

export declare const kSecRevocationCRLMethod: number

export declare const CSSMOID_PKCS5_pbeWithMD2AndRC2: cssm_data

export declare const errSecCSUnimplemented: number

export declare const CSSMERR_AC_OS_ACCESS_DENIED: number

export declare const kSecCSMaxSignatures: number

export declare const kSecOIDX509V3SignedCertificateCStruct: interop.Pointer

export declare const kSecACLAuthorizationKeychainCreate: interop.Pointer

export declare const kSecOIDX509V3CertificateExtensionsStruct: interop.Pointer

export declare const kSecOIDX509V3CertificateExtensionCStruct: interop.Pointer

export declare const CSSMOID_PKCS7_DigestedData: cssm_data

export declare const kSecOIDX509V1ValidityNotAfter: interop.Pointer

export declare const CSSM_DL_DB_RECORD_ANY: number

export declare const kSecOIDX509V1SignatureAlgorithm: interop.Pointer

export declare const kSecOIDX509V1SerialNumber: interop.Pointer

export declare const CSSM_CSP_STORES_PRIVATE_KEYS: number

export declare const CSSMOID_secp160r2: cssm_data

export declare const kSecOIDTimeStamping: interop.Pointer

export declare const kSecOIDSurname: interop.Pointer

export declare const kSecOIDSubjectEmailAddress: interop.Pointer

export declare const kSecOIDStreetAddress: interop.Pointer

export declare const kSecOIDStateProvinceName: interop.Pointer

export declare const kSecOIDQC_Statements: interop.Pointer

export declare const kSecOIDPrivateKeyUsagePeriod: interop.Pointer

export declare const kSecAttrPRFHmacAlgSHA1: interop.Pointer

export declare const CSSMOID_ETSI_QCS_QC_RETENTION: cssm_data

export declare const CSSM_CERT_LAST: number

export declare const CSSM_ATTRIBUTE_WRAPPED_KEY_FORMAT: number

export declare const kSecOIDPolicyConstraints: interop.Pointer

export declare const kSecOIDNetscapeSGC: interop.Pointer

export declare const kSecOIDNetscapeCertType: interop.Pointer

export declare const kSecOIDMicrosoftSGC: interop.Pointer

export declare const kSecOIDIssuingDistributionPoints: interop.Pointer

export declare const kSecOIDIssuerAltName: interop.Pointer

export declare const kAuthorizationCallbacksVersion: number

export declare const kSecOIDExtendedKeyUsageAny: interop.Pointer

export declare const kSecOIDX509V3CertificateExtensionStruct: interop.Pointer

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_12: number

export declare const CSSMOID_APPLE_TP_SW_UPDATE_SIGNING: cssm_data

export declare const kSecOIDDeltaCrlIndicator: interop.Pointer

export declare const kSecOIDDOTMAC_CERT_EXTENSION: interop.Pointer

export declare const kSecTransformDebugAttributeName: interop.Pointer

export declare const errSSLXCertChainInvalid: number

export declare const kSecPolicyMacAppStoreReceipt: interop.Pointer

export declare const kSecOIDCrlReason: interop.Pointer

export declare const kSecOIDCollectiveStateProvinceName: interop.Pointer

export declare const kSecOIDClientAuth: interop.Pointer

export declare const kSecOIDBiometricInfo: interop.Pointer

export declare const CSSM_KEYATTR_NEVER_EXTRACTABLE: number

export declare const kSecOIDAuthorityKeyIdentifier: interop.Pointer

export declare const kSecOIDAuthorityInfoAccess: interop.Pointer

export declare const kSecKeyAlgorithmECDSASignatureDigestX962SHA1: interop.Pointer

export declare const kSecOIDAPPLE_EXTENSION_ITMS_INTERMEDIATE: interop.Pointer

export declare const CSSM_HINT_NONE: number

export declare const kSecOIDAPPLE_EXTENSION_CODE_SIGNING: interop.Pointer

export declare const kSecOIDAPPLE_EXTENSION_APPLE_SIGNING: interop.Pointer

export declare const CSSM_KEYATTR_EXTRACTABLE: number

export declare const kSecOIDAPPLE_EXTENSION_ADC_DEV_SIGNING: interop.Pointer

export declare const CSSM_CRL_ENCODING_MULTIPLE: number

export declare const CSSM_NET_PROTO_LDAP: number

export declare const TLS_RSA_PSK_WITH_AES_128_CBC_SHA: number

export declare const CSSMOID_MACAPPSTORE_CERT_POLICY: cssm_data

export declare const kSecAttrKeyClass: interop.Pointer

export declare const CSSMERR_TP_CERTGROUP_INCOMPLETE: number

export declare const CSSMOID_X509V2CRLExtensionType: cssm_data

export declare const kSecKeyAlgorithmECDHKeyExchangeCofactorX963SHA256: interop.Pointer

export declare const kSecCFErrorArchitecture: interop.Pointer

export declare const kSecAttrProtocolFTPS: interop.Pointer

export declare const CSSMOID_X509V2CRLAllExtensionsCStruct: cssm_data

export declare const CSSMOID_ANSI_DH_EPHEM: cssm_data

export declare const CSSMOID_PKIX_OCSP_BASIC: cssm_data

export declare const CSSM_ERRCODE_UNKNOWN_FORMAT: number

export declare const CSSMOID_X509V2CRLRevokedEntryAllExtensionsStruct: cssm_data

export declare const CSSM_WORDID_OBJECT_HASH: number

export declare const errSecInvalidKeychain: number

export declare const kSecPolicyApplePassbookSigning: interop.Pointer

export declare const kSecACLAuthorizationPartitionID: interop.Pointer

export declare const CSSMOID_X509V1CRLIssuerStruct: cssm_data

export declare const CSSMOID_X509V2CRLTbsCertListStruct: cssm_data

export declare const CSSMOID_X509V2CRLSignedCrlCStruct: cssm_data

export declare const CSSM_ALGID_FEAL: number

export declare const CSSMOID_X509V2CRLSignedCrlStruct: cssm_data

export declare const CSSMOID_MicrosoftSGC: cssm_data

export declare const CSSM_ALGMODE_CFB8: number

export declare const CSSM_DL_DB_RECORD_X509_CRL: number

export declare const CSSMOID_NetscapeCertType: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_ESCROW_SERVICE: cssm_data

export declare const CSSM_TP_CERTVERIFY_INVALID_POLICY_IDS: number

export declare const SSL_RSA_WITH_NULL_SHA: number

export declare const CSSMOID_APPLE_EXTENSION_DEVELOPER_AUTHENTICATION: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_AAI_INTERMEDIATE: cssm_data

export declare const CSSMOID_CounterSignature: cssm_data

export declare const kSecUseItemList: interop.Pointer

export declare const CSSMOID_APPLE_EXTENSION_ITMS_INTERMEDIATE: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_ADC_APPLE_SIGNING: cssm_data

export declare const CSSMERR_APPLETP_CRL_POLICY_FAIL: number

export declare const CSSMOID_APPLE_EXTENSION_APPLE_SIGNING: cssm_data

export declare const CSSMERR_DL_INVALID_ACL_SUBJECT_VALUE: number

export declare const CSSMOID_APPLE_EKU_PASSBOOK_SIGNING: cssm_data

export declare const CSSM_WORDID_MD5: number

export declare const kSecCSSingleThreaded: number

export declare const CSSMOID_APPLE_EKU_ICHAT_SIGNING: cssm_data

export declare const kSecSignatureAttributeName: interop.Object

export declare const CSSMOID_APPLE_EKU_CODE_SIGNING_DEV: cssm_data

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTUSERECOVER: number

export declare const errSecInvalidHandleUsage: number

export declare const CSSMOID_X509V3SignedCertificateCStruct: cssm_data

export declare const CSSMOID_MACAPPSTORE_RECEIPT_CERT_POLICY: cssm_data

export declare const kSecGuestAttributeHash: interop.Pointer

export declare const CSSMOID_PKCS12_pbeWithSHAAnd128BitRC4: cssm_data

export declare const kSecCFErrorResourceSeal: interop.Pointer

export declare const CSSMOID_ADC_CERT_POLICY: cssm_data

export declare const CSSMERR_TP_DEVICE_FAILED: number

export declare const CSSMOID_APPLE_CERT_POLICY: cssm_data

export declare const gGuidAppleX509CL: cssm_guid

export declare const CSSMOID_DOTMAC_CERT_EMAIL_SIGN: cssm_data

export declare const CSSMOID_DOTMAC_CERT_EXTENSION: cssm_data

export declare const CSSM_TP_FORM_TYPE_GENERIC: number

export declare const CSSMOID_ExtendedUseCodeSigning: cssm_data

export declare const CSSMERR_CSSM_MEMORY_ERROR: number

export declare const CSSMOID_QC_Statements: cssm_data

export declare const CSSMERR_CSP_VERIFY_FAILED: number

export declare const CSSMOID_ExtendedKeyUsage: cssm_data

export declare const errSecUnsupportedKeyFormat: number

export declare const CSSMOID_PolicyConstraints: cssm_data

export declare const CSSM_CL_CUSTOM_CERT_ENCODING: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA224AESGCM: interop.Pointer

export declare const CSSMOID_HoldInstructionCode: cssm_data

export declare const CSSMOID_IssuerAltName: cssm_data

export declare const kSSLSessionConfig_ATSv1: interop.Pointer

export declare const CSSMERR_CSSM_BUFFER_TOO_SMALL: number

export declare const kSecKeyDecrypt: number

export declare const CSSMOID_X509V1SignatureStruct: cssm_data

export declare const CSSMOID_X509V3CertificateExtensionType: cssm_data

export declare const CSSMOID_X509V3CertificateExtensionId: cssm_data

export declare const CSSMOID_X509V3CertificateExtensionStruct: cssm_data

export declare const CSSMOID_SHA1: cssm_data

export declare const CSSMOID_X509V3CertificateExtensionsCStruct: cssm_data

export declare const CSSMOID_X509V3CertificateExtensionsStruct: cssm_data

export declare const kSecOIDCollectiveStreetAddress: interop.Pointer

export declare const CSSM_ALGMODE_CBC_IV8: number

export declare const kSecRevocationUseAnyAvailableMethod: number

export declare const CSSMOID_X509V1CertificateSubjectUniqueId: cssm_data

export declare const errSecItemNotFound: number

export declare const SSL_DH_anon_WITH_DES_CBC_SHA: number

export declare const CSSMOID_CSSMKeyStruct: cssm_data

export declare const CSSM_CERT_PARSE_FORMAT_OID_NAMED: number

export declare const CSSMOID_X509V1ValidityNotAfter: cssm_data

export declare const CSSMOID_X509V1IssuerName: cssm_data

export declare const CSSMOID_X509V1Version: cssm_data

export declare const CSSMOID_X509V3SignedCertificate: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_MACAPPSTORE_RECEIPT: cssm_data

export declare const CSSMOID_PKCS9_SdsiCertificate: cssm_data

export declare const CSSMOID_sect409r1: cssm_data

export declare const CSSMOID_sect409k1: cssm_data

export declare const CSSMOID_sect283r1: cssm_data

export declare const kSecKeyWrap: number

export declare const kSecPaddingOAEPKey: interop.Pointer

export declare const CSSMOID_sect571r1: cssm_data

export declare const CSSMOID_sect283k1: cssm_data

export declare const CSSMOID_sect239k1: cssm_data

export declare const CSSMOID_sect233k1: cssm_data

export declare const CSSMOID_sect163r2: cssm_data

export declare const CSSMERR_CL_INVALID_CERTGROUP_POINTER: number

export declare const CSSMOID_OID_QCS_SYNTAX_V2: cssm_data

export declare const CSSMOID_secp224k1: cssm_data

export declare const CSSMERR_CSP_ACL_CHANGE_FAILED: number

export declare const CSSMOID_secp112r2: cssm_data

export declare const SSL_RSA_WITH_RC4_128_SHA: number

export declare const CSSMOID_secp112r1: cssm_data

export declare const kSecCodeInfoFormat: interop.Pointer

export declare const CSSMOID_X9_62_SigType: cssm_data

export declare const kSecOIDX509V1SubjectNameCStruct: interop.Pointer

export declare const CSSMOID_KERBv5_PKINIT_DH_KEY_DATA: cssm_data

export declare const CSSMOID_KERBv5_PKINIT_AUTH_DATA: cssm_data

export declare const CSSMOID_PKCS12_certBag: cssm_data

export declare const CSSMOID_PKCS12_shroudedKeyBag: cssm_data

export declare const CSSMOID_PKCS9_X509Crl: cssm_data

export declare const CSSM_APPLEFILEDL_TAKE_FILE_LOCK: number

export declare const kSecKeyAlgorithmRSASignatureMessagePSSSHA512: interop.Pointer

export declare const CSSM_DL_DB_RECORD_METADATA: number

export declare const CSSMOID_PKCS7_SignedAndEnvelopedData: cssm_data

export declare const CSSMOID_PKCS7_SignedData: cssm_data

export declare const CSSMOID_PKCS7_Data: cssm_data

export declare const kSecClassIdentity: interop.Pointer

export declare const CSSMOID_ETSI_QCS_QC_LIMIT_VALUE: cssm_data

export declare const CSSMOID_ETSI_QCS_QC_COMPLIANCE: cssm_data

export declare const CSSMOID_PDA_GENDER: cssm_data

export declare const errSSLPeerRecordOverflow: number

export declare const CSSM_WORDID_PROMPTED_BIOMETRIC: number

export declare const CSSMOID_PDA_PLACE_OF_BIRTH: cssm_data

export declare const CSSMOID_AD_TIME_STAMPING: cssm_data

export declare const CSSM_CERT_STATUS_NOT_VALID_YET: number

export declare const kSecTransformActionAttributeValidation: interop.Pointer

export declare const errSecCSSignatureNotVerifiable: number

export declare const CSSMERR_AC_MDS_ERROR: number

export declare const errSecCSBadDictionaryFormat: number

export declare const CSSMOID_ChallengePassword: cssm_data

export declare const gGuidAppleCSP: cssm_guid

export declare const errSecInvalidAttributeRandom: number

export declare const errSecPolicyNotFound: number

export declare const CSSMOID_MessageDigest: cssm_data

export declare const errSecCRLNotValidYet: number

export declare const CSSM_WORDID_HAVAL: number

export declare const CSSM_TP_STOP_ON_FIRST_FAIL: number

export declare const kSecKeyAlgorithmECDHKeyExchangeStandard: interop.Pointer

export declare const CSSMOID_UnstructuredName: cssm_data

export declare const CSSM_ALGMODE_VENDOR_DEFINED: number

export declare const CSSMOID_EmailAddress: cssm_data

export declare const CSSMOID_DNQualifier: cssm_data

export declare const CSSMOID_UniqueIdentifier: cssm_data

export declare const CSSMOID_secp128r1: cssm_data

export declare const CSSMOID_GivenName: cssm_data

export declare const kSecAsn1PointerToBooleanTemplate: interop.Pointer

export declare const SSL_RSA_EXPORT_WITH_RC4_40_MD5: number

export declare const CSSM_ERRCODE_SELF_CHECK_FAILED: number

export declare const CSSMOID_Name: cssm_data

export declare const errSecInvalidNetworkAddress: number

export declare const CSSMOID_UserPassword: cssm_data

export declare const CSSMERR_CSP_ACL_REPLACE_FAILED: number

export declare const CSSMOID_PreferredDeliveryMethod: cssm_data

export declare const CSSMOID_OrganizationalUnitName: cssm_data

export declare const CSSMOID_DestinationIndicator: cssm_data

export declare const errSecInvalidDatabaseBlob: number

export declare const CSSMOID_RegisteredAddress: cssm_data

export declare const CSSMOID_CollectiveInternationalISDNNumber: cssm_data

export declare const oidExtendedKeyUsageEmailProtection: DERItem

export declare const CSSMOID_InternationalISDNNumber: cssm_data

export declare const CSSM_ALGID_SHA384: number

export declare const CSSM_CSP_BASE_ERROR: number

export declare const CSSMOID_CollectiveTelephoneNumber: cssm_data

export declare const CSSMOID_APPLE_TP_PCS_ESCROW_SERVICE: cssm_data

export declare const CSSMOID_DES_CBC: cssm_data

export declare const CSSMERR_CSP_INVALID_ATTR_DL_DB_HANDLE: number

export declare const CSSMOID_PostOfficeBox: cssm_data

export declare const CSSMOID_CollectivePostalAddress: cssm_data

export declare const CSSMOID_PostalAddress: cssm_data

export declare const CSSMOID_BusinessCategory: cssm_data

export declare const CSSMOID_Description: cssm_data

export declare const kSecPolicyRevocationFlags: interop.Pointer

export declare const CSSMOID_CollectiveOrganizationalUnitName: cssm_data

export declare const kSecAsn1VisibleStringTemplate: interop.Pointer

export declare const errSSLATSCiphersuiteViolation: number

export declare const CSSMOID_CollectiveStreetAddress: cssm_data

export declare const CSSMOID_CommonName: cssm_data

export declare const CSSMOID_PKCS12_pbewithSHAAnd40BitRC2CBC: cssm_data

export declare const CSSMOID_PKCS12_pbeWithSHAAnd128BitRC2CBC: cssm_data

export declare const CSSM_USEE_MEDICAL: number

export declare const CSSM_WORDID_G: number

export declare const CSSMOID_X509V1IssuerNameLDAP: cssm_data

export declare const CSSMOID_PKCS12_pbeWithSHAAnd40BitRC4: cssm_data

export declare const CSSM_ATTRIBUTE_START_DATE: number

export declare const CSSMOID_PKCS5_pbeWithSHA1AndDES: cssm_data

export declare const oidStateOrProvinceName: DERItem

export declare const CSSMOID_PKCS5_pbeWithMD5AndDES: cssm_data

export declare const CSSM_ALGID_IntelPlatformRandom: number

export declare const CSSMOID_PKCS5_pbeWithMD2AndDES: cssm_data

export declare const oidSha1Rsa: DERItem

export declare const CSSMERR_DL_INVALID_NEW_ACL_OWNER: number

export declare const CSSMOID_PKCS5_DIGEST_ALG: cssm_data

export declare const CSSMERR_DL_DATASTORE_ALREADY_EXISTS: number

export declare const CSSMOID_DOTMAC_CERT_REQ_ARCHIVE_STORE: cssm_data

export declare const CSSMOID_DOTMAC_CERT_REQ_ARCHIVE_LIST: cssm_data

export declare const errSecInvalidACL: number

export declare const kSecACLAuthorizationExportWrapped: interop.Pointer

export declare const CSSMOID_APPLE_ECDSA: cssm_data

export declare const CSSMOID_APPLE_FEED: cssm_data

export declare const errSecCSUnsealedAppRoot: number

export declare const TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384: number

export declare const CSSMOID_APPLE_ASC: cssm_data

export declare const CSSMERR_CSP_INVALID_LOGIN_NAME: number

export declare const CSSM_PKCS_OAEP_MGF_NONE: number

export declare const CSSMOID_APPLE_TP_PKINIT_SERVER: cssm_data

export declare const CSSMOID_APPLE_TP_PKINIT_CLIENT: cssm_data

export declare const CSSMOID_APPLE_TP_CODE_SIGN: cssm_data

export declare const CSSMOID_APPLE_TP_EAP: cssm_data

export declare const CSSMOID_APPLE_TP_CSR_GEN: cssm_data

export declare const CSSM_ERRCODE_INVALID_DATA: number

export declare const oidAdCAIssuer: DERItem

export declare const CSSMERR_CSP_INVALID_INPUT_POINTER: number

export declare const CSSMOID_SHA224: cssm_data

export declare const CSSMERR_CSP_INVALID_OUTPUT_POINTER: number

export declare const kSecCodeInfoStatus: interop.Pointer

export declare const TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_SHA1WithDSA_CMS: cssm_data

export declare const CSSM_ERRCODE_INVALID_ACL_BASE_CERTS: number

export declare const CSSMOID_X509V1SignatureAlgorithmParameters: cssm_data

export declare const CSSMOID_DSA_JDK: cssm_data

export declare const CSSMERR_DL_OS_ACCESS_DENIED: number

export declare const CSSMOID_ANSI_MQV1_SHA1: cssm_data

export declare const CSSMOID_ANSI_DH_EPHEM_SHA1: cssm_data

export declare const CSSMOID_ANSI_DH_HYBRID1: cssm_data

export declare const CSSMOID_ANSI_DH_ONE_FLOW: cssm_data

export declare const CSSMOID_APPLE_TP_RESOURCE_SIGN: cssm_data

export declare const CSSMOID_ANSI_DH_STATIC: cssm_data

export declare const errSecMissingAttributeRandom: number

export declare const CSSM_SAMPLE_TYPE_RETRY_ID: number

export declare const CSSM_ALGMODE_PRIVATE_WRAP: number

export declare const CSSMOID_OAEP_MGF1: cssm_data

export declare const errSecInvalidKeyLabel: number

export declare const CSSMOID_SHA1WithRSA_OIW: cssm_data

export declare const CSSM_ALGID_DSA_BSAFE: number

export declare const CSSM_DB_ATTRIBUTE_NAME_AS_INTEGER: number

export declare const errSSLClosedNoNotify: number

export declare const CSSMOID_SHA224WithRSA: cssm_data

export declare const CSSMOID_SHA1WithRSA: cssm_data

export declare const TLS_DHE_PSK_WITH_AES_256_CBC_SHA384: number

export declare const CSSM_HINT_ADDRESS_SP: number

export declare const CSSM_HINT_ADDRESS_APP: number

export declare const CSSMERR_DL_MEMORY_ERROR: number

export declare const CSSMOID_MD4: cssm_data

export declare const CSSMOID_APPLE_EXTENSION_PROVISIONING_PROFILE_SIGNING: cssm_data

export declare const kSecOIDDescription: interop.Pointer

export declare const kSecAttrKeyClassPrivate: interop.Pointer

export declare const kSecAttrProtocol: interop.Pointer

export declare const errSessionValueNotSet: number

export declare const errAuthorizationBadAddress: number

export declare const CSSM_ATTRIBUTE_MODE: number

export declare const CSSM_DL_DB_RECORD_ALL_KEYS: number

export declare const CSSM_CRL_TYPE_SPKI: number

export declare const errAuthorizationToolEnvironmentError: number

export declare const errAuthorizationDenied: number

export declare const errAuthorizationInvalidTag: number

export declare const CSSM_PKCS5_PBKDF2_PRF_HMAC_SHA1: number

export declare const errAuthorizationInvalidRef: number

export declare const SSL_RSA_WITH_DES_CBC_MD5: number

export declare const errSecUnsupportedFieldFormat: number

export declare const TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256: number

export declare const TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384: number

export declare const CSSM_WORDID_PREAUTH_SOURCE: number

export declare const CSSMOID_SubjectKeyIdentifier: cssm_data

export declare const CSSMERR_APPLETP_UNKNOWN_QUAL_CERT_STATEMENT: number

export declare const CSSM_TP_CERTCHANGE_NOT_AUTHORIZED: number

export declare const TLS_ECDH_RSA_WITH_AES_256_CBC_SHA384: number

export declare const kSecTransformErrorInvalidInput: number

export declare const TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256: number

export declare const CSSM_PADDING_CUSTOM: number

export declare const TLS_AES_256_GCM_SHA384: number

export declare const CSSM_WORDID_SUBJECT_INFO: number

export declare const TLS_RSA_PSK_WITH_NULL_SHA256: number

export declare const TLS_RSA_PSK_WITH_AES_128_CBC_SHA256: number

export declare const TLS_DHE_PSK_WITH_NULL_SHA384: number

export declare const TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256: number

export declare const TLS_DHE_RSA_WITH_AES_128_CBC_SHA: number

export declare const errSSLPeerBadRecordMac: number

export declare const CSSM_CERT_BUNDLE_PGP_KEYRING: number

export declare const CSSMOID_DOTMAC_CERT_REQ_EMAIL_ENCRYPT: cssm_data

export declare const TLS_RSA_PSK_WITH_AES_256_GCM_SHA384: number

export declare const kSecCSDynamicInformation: number

export declare const CSSMOID_X509V2CRLExtensionId: cssm_data

export declare const TLS_DH_DSS_WITH_AES_256_GCM_SHA384: number

export declare const TLS_DH_RSA_WITH_AES_128_GCM_SHA256: number

export declare const errSecCSUnsupportedAlgorithm: number

export declare const TLS_RSA_WITH_AES_128_GCM_SHA256: number

export declare const TLS_RSA_PSK_WITH_AES_256_CBC_SHA: number

export declare const TLS_DHE_PSK_WITH_AES_128_CBC_SHA: number

export declare const TLS_PSK_WITH_AES_128_CBC_SHA: number

export declare const kSecCSStrictValidate: number

export declare const TLS_DH_anon_WITH_AES_256_CBC_SHA256: number

export declare const TLS_DH_anon_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_InhibitAnyPolicy: cssm_data

export declare const CSSM_ATTRIBUTE_DATA_RANGE: number

export declare const CSSMERR_CSP_INVALID_ACL_SUBJECT_VALUE: number

export declare const TLS_DHE_RSA_WITH_AES_256_CBC_SHA256: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_UNIMPL: number

export declare const TLS_DHE_DSS_WITH_AES_256_CBC_SHA256: number

export declare const TLS_DH_RSA_WITH_AES_128_CBC_SHA256: number

export declare const TLS_DHE_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSMOID_X9_62_PubKeyType: cssm_data

export declare const CSSM_ERRCODE_INVALID_NEW_ACL_OWNER: number

export declare const errSecDuplicateItem: number

export declare const TLS_DHE_DSS_WITH_AES_256_GCM_SHA384: number

export declare const TLS_PSK_WITH_CHACHA20_POLY1305_SHA256: number

export declare const CSSM_ERRCODE_INVALID_ACL_SUBJECT_VALUE: number

export declare const CSSMERR_CSP_INVALID_KEY_REFERENCE: number

export declare const TLS_ECDH_anon_WITH_3DES_EDE_CBC_SHA: number

export declare const TLS_ECDH_RSA_WITH_AES_128_CBC_SHA: number

export declare const TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA: number

export declare const kSecPolicyApplePKINITClient: interop.Pointer

export declare const CSSMERR_CSP_PUBLIC_KEY_INCONSISTENT: number

export declare const TLS_ECDHE_ECDSA_WITH_NULL_SHA: number

export declare const TLS_DHE_RSA_WITH_AES_256_CBC_SHA: number

export declare const TLS_DHE_DSS_WITH_AES_256_CBC_SHA: number

export declare const errSecCSFileHardQuarantined: number

export declare const CSSM_ALGID_WrapSET_OAEP: number

export declare const errSecIDPFailure: number

export declare const SSL_DH_anon_WITH_3DES_EDE_CBC_SHA: number

export declare const SSL_DH_anon_WITH_RC4_128_MD5: number

export declare const SSL_DHE_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSM_TP_CERTCHANGE_OKWITHNEWTIME: number

export declare const SSL_DHE_DSS_EXPORT_WITH_DES40_CBC_SHA: number

export declare const CSSM_ALGID_WrapLynks: number

export declare const SSL_RSA_WITH_NULL_MD5: number

export declare const CSSM_WORDID_DECRYPT: number

export declare const kSecBase64Encoding: interop.Pointer

export declare const kSecOIDPolicyMappings: interop.Pointer

export declare const kSecSharedPassword: interop.Pointer

export declare const kSSLSessionConfig_TLSv1_3DES_fallback: interop.Pointer

export declare const errSessionInternal: number

export declare const kSecTrustCertificateTransparencyWhiteList: interop.Pointer

export declare const kSecTrustEvaluationDate: interop.Pointer

export declare const CSSM_KEYUSE_DERIVE: number

export declare const kSecPropertyTypeTitle: interop.Pointer

export declare const kSecImportItemIdentity: interop.Pointer

export declare const CSSMOID_DOTMAC_CERT_REQ_VALUE_PASSWORD: cssm_data

export declare const kSecImportItemKeyID: interop.Pointer

export declare const kSecImportExportKeychain: interop.Pointer

export declare const kSecReadPermStatus: number

export declare const kSecUnlockStateStatus: number

export declare const CSSM_APPLEX509CL_VERIFY_CSR: number

export declare const CSSM_ATTRIBUTE_DATA_KEY: number

export declare const CSSM_CERT_STATUS_TRUST_SETTINGS_FOUND_SYSTEM: number

export declare const CSSM_CERT_STATUS_TRUST_SETTINGS_FOUND_ADMIN: number

export declare const errSSLRecordOverflow: number

export declare const CSSM_ALGID_BLOWFISH: number

export declare const CSSM_WORDID_RIPEMD: number

export declare const TLS_RSA_PSK_WITH_NULL_SHA384: number

export declare const CSSM_TP_ACTION_FETCH_CERT_FROM_NET: number

export declare const CSSMOID_DistinguishedName: cssm_data

export declare const CSSM_TP_ACTION_REQUIRE_CRL_PER_CERT: number

export declare const CSSM_KEYATTR_PUBLIC_KEY_ENCRYPT: number

export declare const CSSM_ASC_OPTIMIZE_TIME_SIZE: number

export declare const CSSM_ASC_OPTIMIZE_SIZE: number

export declare const CSSM_ASC_OPTIMIZE_DEFAULT: number

export declare const CSSMOID_PKIX_OCSP_ARCHIVE_CUTOFF: cssm_data

export declare const CSSMOID_MD2: cssm_data

export declare const kSecOIDX509V3Certificate: interop.Pointer

export declare const CSSM_FEE_PRIME_TYPE_MERSENNE: number

export declare const CSSM_ATTRIBUTE_VERIFY_PASSPHRASE: number

export declare const CSSM_ATTRIBUTE_VENDOR_DEFINED: number

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_OPENSSH1: number

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_OPENSSL: number

export declare const CSSM_APPLECSP_PUBKEY: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_24: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_23: number

export declare const CSSM_ERRCODE_MODULE_MANIFEST_VERIFY_FAILED: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_21: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_20: number

export declare const CSSM_DB_NONE: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_8: number

export declare const kSecAttrKeyType: interop.Pointer

export declare const CSSMOID_DSA_CMS: cssm_data

export declare const CSSM_APPLESCPDL_CSP_GET_KEYHANDLE: number

export declare const errSecInvalidAttributePublicKeyFormat: number

export declare const CSSM_APPLECSPDL_DB_GET_HANDLE: number

export declare const errSSLEarlyDataRejected: number

export declare const CSSM_APPLECSPDL_DB_SET_SETTINGS: number

export declare const CSSM_APPLECSPDL_DB_LOCK: number

export declare const CSSM_ACL_SUBJECT_TYPE_PARTITION: number

export declare const CSSMERR_CL_INVALID_BUNDLE_INFO: number

export declare const kSecHonorRoot: number

export declare const CSSMERR_APPLE_DOTMAC_CSR_VERIFY_FAIL: number

export declare const CSSM_NET_PROTO_CMPS: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_IS_PENDING: number

export declare const CSSM_CERT_ENCODING_UNKNOWN: number

export declare const errSecCSBadNestedCode: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_QUEUED: number

export declare const errSecInvalidDBList: number

export declare const CSSMOID_MD5: cssm_data

export declare const errAuthorizationExternalizeNotAllowed: number

export declare const CSSMERR_DL_OBJECT_ACL_REQUIRED: number

export declare const CSSMERR_APPLETP_CA_PIN_MISMATCH: number

export declare const errSecInvalidAccessCredentials: number

export declare const kSecTrustRevocationValidUntilDate: interop.Pointer

export declare const CSSMERR_APPLETP_EXT_KEYUSAGE_NOT_CRITICAL: number

export declare const CSSMERR_APPLETP_TRUST_SETTING_DENY: number

export declare const CSSMERR_APPLETP_RS_BAD_CERT_CHAIN_LENGTH: number

export declare const CSSM_WORDID_RSA_PKCS1_SIG: number

export declare const errSecTimestampMissing: number

export declare const CSSMERR_APPLETP_CS_BAD_CERT_CHAIN_LENGTH: number

export declare const CSSMERR_APPLETP_OCSP_NONCE_MISMATCH: number

export declare const CSSMERR_CSSM_SERVICE_NOT_AVAILABLE: number

export declare const CSSM_TP_BASE_TP_ERROR: number

export declare const errSecInvalidAttributeMode: number

export declare const errSecCSWeakResourceRules: number

export declare const CSSMERR_APPLETP_OCSP_RESP_INTERNAL_ERR: number

export declare const CSSMOID_MOBILE_STORE_SIGNING_POLICY: cssm_data

export declare const CSSMERR_APPLETP_OCSP_NOT_TRUSTED: number

export declare const CSSMERR_APPLETP_NETWORK_FAILURE: number

export declare const CSSMERR_APPLETP_OCSP_UNAVAILABLE: number

export declare const CSSMOID_APPLE_TP_QA_PROFILE_SIGNING: cssm_data

export declare const CSSM_APPLEX509CL_OBTAIN_CSR: number

export declare const oidSha1Fee: DERItem

export declare const CSSMERR_TP_INVALID_POLICY_IDENTIFIERS: number

export declare const errSSLPeerNoRenegotiation: number

export declare const CSSMERR_APPLETP_SMIME_SUBJ_ALT_NAME_NOT_CRIT: number

export declare const CSSMERR_APPLETP_SMIME_KEYUSAGE_NOT_CRITICAL: number

export declare const CSSMERR_APPLETP_SMIME_BAD_EXT_KEY_USE: number

export declare const CSSMERR_APPLETP_BAD_CERT_FROM_ISSUER: number

export declare const CSSMERR_APPLETP_CRL_INVALID_ANCHOR_CERT: number

export declare const CSSM_ALGID_KHAFRE: number

export declare const CSSMERR_APPLETP_CRL_SERVER_DOWN: number

export declare const errSecInvalidIndex: number

export declare const CSSMERR_APPLETP_PATH_LEN_CONSTRAINT: number

export declare const kSecIdentityDomainDefault: interop.Pointer

export declare const CSSMERR_APPLETP_NO_BASIC_CONSTRAINTS: number

export declare const TLS_ECDHE_ECDSA_WITH_RC4_128_SHA: number

export declare const CSSMERR_APPLETP_HOSTNAME_MISMATCH: number

export declare const errSecInvalidTupleGroup: number

export declare const CSSM_DL_DB_RECORD_PUBLIC_KEY: number

export declare const CSSMERR_APPLEDL_INCOMPATIBLE_KEY_BLOB: number

export declare const kSecCodeInfoTeamIdentifier: interop.Pointer

export declare const CSSM_APPLE_UNLOCK_TYPE_KEYBAG: number

export declare const CSSM_APPLE_UNLOCK_TYPE_KEY_DIRECT: number

export declare const CSSMOID_APPLE_EXTENSION_INTERMEDIATE_MARKER: cssm_data

export declare const CSSM_APPLEFILEDL_MAKE_BACKUP: number

export declare const CSSM_WORDID_PREAUTH: number

export declare const CSSMOID_APPLE_TP_SMIME: cssm_data

export declare const CSSM_DL_DB_RECORD_EXTENDED_ATTRIBUTE: number

export declare const CSSM_ALGID_MQV: number

export declare const CSSMERR_CSP_APPLE_SIGNATURE_MISMATCH: number

export declare const errSecInvalidRoot: number

export declare const CSSMERR_TP_IN_DARK_WAKE: number

export declare const CSSMERR_AC_IN_DARK_WAKE: number

export declare const CSSMOID_KERBv5_PKINIT_KP_CLIENT_AUTH: cssm_data

export declare const CSSMERR_CL_DEVICE_FAILED: number

export declare const kSecAttrProtocolSOCKS: interop.Pointer

export declare const CSSMERR_CSP_DEVICE_FAILED: number

export declare const CSSM_TP_CERTCHANGE_REASON_SUPERCEDED: number

export declare const kSecKeyAlgorithmECIESEncryptionStandardX963SHA384AESGCM: interop.Pointer

export declare const CSSMERR_AC_DEVICE_RESET: number

export declare const CSSMERR_AC_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const CSSMOID_ANSI_DH_ONE_FLOW_SHA1: cssm_data

export declare const kSecRevocationNetworkAccessDisabled: number

export declare const CSSMERR_CSSM_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const errSecInvalidValidityPeriod: number

export declare const CSSM_ALGCLASS_KEYGEN: number

export declare const CSSMERR_DL_SERVICE_NOT_AVAILABLE: number

export declare const CSSM_EVIDENCE_FORM_CRL_ID: number

export declare const CSSMERR_CL_INVALID_INPUT_POINTER: number

export declare const CSSMERR_CSP_SERVICE_NOT_AVAILABLE: number

export declare const errSecUnsupportedNumSelectionPreds: number

export declare const CSSM_ALGMODE_CFB16: number

export declare const CSSMERR_CSP_MISSING_ATTR_SEED: number

export declare const CSSMERR_CSP_USER_CANCELED: number

export declare const CSSMOID_Surname: cssm_data

export declare const CSSMERR_AC_USER_CANCELED: number

export declare const CSSMOID_TelexTerminalIdentifier: cssm_data

export declare const CSSM_ALGID_SSL3PrimaryDerive: number

export declare const CSSM_CUSTOM_COMMON_ERROR_EXTENT: number

export declare const CSSM_TP_ACTION_REQUIRE_CRL_IF_PRESENT: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_OPENSSL: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_OPENSSH: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_X509: number

export declare const oidPolicyConstraints: DERItem

export declare const kSecPropertyTypeNumber: interop.Pointer

export declare const CSSM_ALGID_ECDSA_SPECIFIED: number

export declare const CSSM_CSP_PRIVATE_ERROR: number

export declare const CSSM_ERRCODE_FUNCTION_FAILED: number

export declare const kSecMatchSubjectContains: interop.Pointer

export declare const CSSM_ALGID_SHA384WithECDSA: number

export declare const CSSM_TP_CERTVERIFY_VALID: number

export declare const CSSM_ALGID_ENTROPY_DEFAULT: number

export declare const errSecInvalidAttributePassphrase: number

export declare const TLS_AES_128_CCM_8_SHA256: number

export declare const CSSM_CERT_PARSE_FORMAT_MULTIPLE: number

export declare const CSSMERR_TP_INVALID_NUMBER_OF_FIELDS: number

export declare const CSSM_ALGID_PKCS5_PBKDF1_MD5: number

export declare const CSSM_ALGID_FEE_MD5: number

export declare const CSSM_ALGID_FEE: number

export declare const CSSMERR_APPLETP_UNKNOWN_CERT_EXTEN: number

export declare const kSecAttrDescription: interop.Pointer

export declare const CSSM_WORDID_RIPEMAC: number

export declare const CSSM_ALGID_ECMQV: number

export declare const kSecACLAuthorizationKeychainDelete: interop.Pointer

export declare const CSSM_ACL_PREAUTH_TRACKING_AUTHORIZED: number

export declare const CSSM_CSSM_BASE_ERROR: number

export declare const errSecEMMLoadFailed: number

export declare const CSSM_ACL_PREAUTH_TRACKING_BLOCKED: number

export declare const CSSM_ACL_PREAUTH_TRACKING_COUNT_MASK: number

export declare const errSecKeySizeNotAllowed: number

export declare const CSSM_ACL_AUTHORIZATION_DECRYPT: number

export declare const CSSM_ACL_KEYCHAIN_PROMPT_INVALID: number

export declare const CSSMERR_APPLEDL_INVALID_OPEN_PARAMETERS: number

export declare const CSSM_TP_CERT_PUBLISH: number

export declare const CSSM_ALGID_SHA224WithRSA: number

export declare const CSSM_ACL_MATCH_UID: number

export declare const TLS_RSA_WITH_RC4_128_MD5: number

export declare const CSSM_ACL_CODE_SIGNATURE_INVALID: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_COMPLEX: number

export declare const CSSM_ACL_AUTHORIZATION_CHANGE_OWNER: number

export declare const errSecSelfCheckFailed: number

export declare const CSSMERR_CSP_INVALID_ATTR_LABEL: number

export declare const CSSM_WORDID_HASH: number

export declare const CSSM_SAMPLE_TYPE_KEYBAG_KEY: number

export declare const CSSMOID_PKIX_OCSP_RESPONSE: cssm_data

export declare const errSSLClientCertRequested: number

export declare const CSSM_SAMPLE_TYPE_ASYMMETRIC_KEY: number

export declare const kSecOIDSubjectInfoAccess: interop.Pointer

export declare const CSSM_SAMPLE_TYPE_SYMMETRIC_KEY: number

export declare const CSSM_ATTRIBUTE_DATA_CSSM_DATA: number

export declare const CSSM_SAMPLE_TYPE_COMMENT: number

export declare const CSSM_ACL_SUBJECT_TYPE_PROCESS: number

export declare const CSSM_WORDID_ASYMMETRIC_KEY: number

export declare const TLS_DHE_RSA_WITH_AES_128_CBC_SHA256: number

export declare const CSSMERR_CSP_MISSING_ATTR_DL_DB_HANDLE: number

export declare const CSSM_WORDID_KEY: number

export declare const errSecAppleInvalidKeyStartDate: number

export declare const CSSM_CERT_PARSE_FORMAT_SEXPR: number

export declare const CSSM_KEYCLASS_PUBLIC_KEY: number

export declare const CSSMOID_AD_CA_ISSUERS: cssm_data

export declare const CSSM_WORDID_PROCESS: number

export declare const CSSM_CRL_ENCODING_BLOOM: number

export declare const CSSMERR_DL_ACL_SUBJECT_TYPE_NOT_SUPPORTED: number

export declare const CSSM_ERRORCODE_CUSTOM_OFFSET: number

export declare const CSSM_DL_DB_RECORD_X509_CERTIFICATE: number

export declare const CSSMERR_AC_INVALID_DB_LIST: number

export declare const CSSMERR_CSP_MISSING_ATTR_PRIME: number

export declare const TLS_AES_128_CCM_SHA256: number

export declare const errSecInvalidAlgorithmParms: number

export declare const CSSMERR_DL_STALE_UNIQUE_RECORD: number

export declare const errSecPassphraseRequired: number

export declare const CSSMERR_DL_INVALID_PARSING_MODULE: number

export declare const CSSMOID_X509V1Signature: cssm_data

export declare const CSSM_DL_DB_RECORD_USER_TRUST: number

export declare const CSSM_ATTRIBUTE_DATA_DL_DB_HANDLE: number

export declare const CSSMERR_DL_MULTIPLE_VALUES_UNSUPPORTED: number

export declare const errSecMissingAttributePublicKeyFormat: number

export declare const CSSMERR_DL_INVALID_QUERY: number

export declare const CSSMOID_ContentType: cssm_data

export declare const CSSM_WORDID_SHA1WITHDSA: number

export declare const CSSMERR_DL_MISSING_VALUE: number

export declare const CSSMERR_CSP_OBJECT_ACL_NOT_SUPPORTED: number

export declare const TLS_DH_RSA_WITH_AES_256_CBC_SHA256: number

export declare const kSecPolicyKU_EncipherOnly: interop.Pointer

export declare const CSSMERR_DL_DATASTORE_IS_OPEN: number

export declare const CSSM_SAMPLE_TYPE_SIGNED_NONCE: number

export declare const CSSMERR_DL_DATASTORE_DOESNOT_EXIST: number

export declare const CSSMERR_CSP_INVALID_ACL_ENTRY_TAG: number

export declare const CSSMERR_DL_UNSUPPORTED_INDEX_INFO: number

export declare const CSSM_DL_BASE_DL_ERROR: number

export declare const CSSMOID_ObjectClass: cssm_data

export declare const CSSM_APPLEDL_OPEN_PARAMETERS_VERSION: number

export declare const CSSMERR_DL_ACL_ADD_FAILED: number

export declare const CSSMERR_DL_INVALID_ACL_CHALLENGE_CALLBACK: number

export declare const CSSMERR_DL_INVALID_SAMPLE_VALUE: number

export declare const errSSLPeerUnknownCA: number

export declare const kSecKeyStartDate: number

export declare const CSSM_ATTRIBUTE_ALERT_TITLE: number

export declare const kSecAttrComment: interop.Pointer

export declare const oidGoogleOCSPSignedCertificateTimestamp: DERItem

export declare const kSecKeyKeyExchangeParameterRequestedSize: interop.Pointer

export declare const kSecAttrKeyType3DES: interop.Pointer

export declare const CSSMOID_APPLE_FEE_SHA1: cssm_data

export declare const CSSM_DL_DB_RECORD_POLICY: number

export declare const CSSMERR_CL_INVALID_RESULTS_HANDLE: number

export declare const CSSM_CL_BASE_CL_ERROR: number

export declare const CSSM_WORDID_NHASH: number

export declare const CSSM_CSP_TOK_SESSION_KEY_PASSWORD: number

export declare const kSecPolicyAppleEAP: interop.Pointer

export declare const CSSMERR_CL_UNKNOWN_TAG: number

export declare const CSSMERR_CL_UNKNOWN_FORMAT: number

export declare const CSSM_ERRCODE_DEVICE_FAILED: number

export declare const kSecACLAuthorizationLogin: interop.Pointer

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA256AESGCM: interop.Pointer

export declare const CSSMERR_CL_CRL_ALREADY_SIGNED: number

export declare const TLS_DHE_DSS_WITH_AES_128_CBC_SHA256: number

export declare const CSSMERR_CL_OS_ACCESS_DENIED: number

export declare const TLS_ECDH_anon_WITH_NULL_SHA: number

export declare const CSSMERR_CL_SELF_CHECK_FAILED: number

export declare const CSSM_WORDID_ISSUER: number

export declare const kSecIssuerItemAttr: number

export declare const CSSMERR_AC_INVALID_OUTPUT_POINTER: number

export declare const CSSMERR_AC_INVALID_REQUESTOR: number

export declare const CSSMERR_AC_INVALID_BASE_ACLS: number

export declare const kSecAttrIsSensitive: interop.Pointer

export declare const CSSMERR_AC_FUNCTION_FAILED: number

export declare const CSSM_CERT_X_509v2: number

export declare const CSSMERR_AC_FUNCTION_NOT_IMPLEMENTED: number

export declare const CSSM_WORDID__UNK_: number

export declare const kSecAttrSubject: interop.Pointer

export declare const errSecCRLBadURI: number

export declare const errSecUnknownQualifiedCertStatement: number

export declare const CSSMERR_CSP_MISSING_ATTR_ITERATION_COUNT: number

export declare const CSSMERR_TP_UNSUPPORTED_ADDR_TYPE: number

export declare const CSSM_CERT_SPKI: number

export declare const errSecInteractionNotAllowed: number

export declare const errSecMissingAttributeLabel: number

export declare const CSSM_CRL_PARSE_FORMAT_NONE: number

export declare const kSecTransformErrorDomain: interop.Pointer

export declare const CSSMERR_APPLETP_CRL_NOT_FOUND: number

export declare const errSecCSStaticCodeChanged: number

export declare const kSecKeyExtractable: number

export declare const CSSMERR_TP_INVALID_FORM_TYPE: number

export declare const kSecOIDAPPLE_EKU_CODE_SIGNING: interop.Pointer

export declare const CSSMERR_TP_INVALID_CERTIFICATE: number

export declare const CSSMERR_CSSM_NO_USER_INTERACTION: number

export declare const errSSLPeerInsufficientSecurity: number

export declare const CSSMERR_TP_CERT_NOT_VALID_YET: number

export declare const kSecAsn1IA5StringTemplate: interop.Pointer

export declare const errSecMissingAttributeStartDate: number

export declare const CSSMOID_APPLE_EKU_CODE_SIGNING: cssm_data

export declare const CSSMERR_TP_INVALID_CRLGROUP_POINTER: number

export declare const CSSMERR_TP_INVALID_CERTGROUP: number

export declare const CSSMERR_CSP_UNSUPPORTED_KEYATTR_MASK: number

export declare const CSSMERR_TP_INVALID_DL_HANDLE: number

export declare const errSecInvalidRequestor: number

export declare const CSSMERR_TP_UNKNOWN_FORMAT: number

export declare const SSL_DH_RSA_WITH_DES_CBC_SHA: number

export declare const CSSM_ELAPSED_TIME_COMPLETE: number

export declare const CSSMERR_TP_INVALID_DATA: number

export declare const CSSM_ALGID_PKCS5_PBKDF1_MD2: number

export declare const kSecClassCertificate: interop.Pointer

export declare const CSSM_ALGID_SHA512WithECDSA: number

export declare const CSSMERR_TP_SELF_CHECK_FAILED: number

export declare const CSSMOID_sect571k1: cssm_data

export declare const CSSM_TP_BASE_ERROR: number

export declare const CSSM_CERT_BUNDLE_PKCS7_SIGNED_ENVELOPED_DATA: number

export declare const CSSMERR_TP_INVALID_POINTER: number

export declare const kSecCodeInfoFlags: interop.Pointer

export declare const CSSMERR_CSP_CRYPTO_DATA_CALLBACK_FAILED: number

export declare const CSSM_ALGID_ConcatBaseAndKey: number

export declare const CSSM_ALGID_NHASH: number

export declare const CSSMERR_CSP_ACL_CHALLENGE_CALLBACK_FAILED: number

export declare const CSSMERR_CSP_DEVICE_VERIFY_FAILED: number

export declare const kSecAttrProtocolTelnetS: interop.Pointer

export declare const CSSMERR_CSP_PRIVATE_KEY_NOT_FOUND: number

export declare const CSSMERR_CSP_QUERY_SIZE_UNKNOWN: number

export declare const CSSMERR_CSP_INVALID_SIGNATURE: number

export declare const TLS_DH_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const errSecAppleSSLv2Rollback: number

export declare const CSSMERR_CSP_MISSING_ATTR_PRIVATE_KEY_FORMAT: number

export declare const CSSM_TP_CERT_DIR_UPDATE: number

export declare const CSSMERR_CSP_INVALID_ATTR_PRIVATE_KEY_FORMAT: number

export declare const CSSM_KEYBLOB_REF_FORMAT_OTHER: number

export declare const CSSMERR_CSP_INVALID_ATTR_ACCESS_CREDENTIALS: number

export declare const kSecAttrProtocolFTP: interop.Pointer

export declare const CSSM_SERVICE_KR: number

export declare const kSecKeyPrivate: number

export declare const CSSM_ACL_SUBJECT_TYPE_KEYCHAIN_PROMPT: number

export declare const CSSMOID_DomainComponent: cssm_data

export declare const CSSMERR_CSP_MISSING_ATTR_BASE: number

export declare const errSecDeviceReset: number

export declare const CSSMERR_TP_INTERNAL_ERROR: number

export declare const errSecInvalidTupleCredentials: number

export declare const kSecAttrProtocolIRCS: interop.Pointer

export declare const CSSMERR_CSP_MISSING_ATTR_END_DATE: number

export declare const CSSM_CL_CUSTOM_CERT_PARSE_FORMAT: number

export declare const errSSLDecodeError: number

export declare const CSSMERR_CSP_INVALID_ATTR_START_DATE: number

export declare const CSSMERR_DL_INVALID_VALUE: number

export declare const CSSMERR_CSP_MISSING_ATTR_KEY_TYPE: number

export declare const kSecKeyUnwrap: number

export declare const CSSMERR_CSP_MISSING_ATTR_LABEL: number

export declare const errSecInvalidAttributeInitVector: number

export declare const CSSMERR_CSP_INVALID_ATTR_ALG_PARAMS: number

export declare const kSecKeyKeyExchangeParameterSharedInfo: interop.Pointer

export declare const CSSM_ALGID_SSL3MD5: number

export declare const CSSMERR_CSP_MISSING_ATTR_RANDOM: number

export declare const CSSMERR_CSP_INVALID_ATTR_INIT_VECTOR: number

export declare const CSSMERR_CSP_INVALID_OUTPUT_VECTOR: number

export declare const CSSMERR_CSP_DEVICE_ERROR: number

export declare const kSecTransformTransformIsNotRegistered: number

export declare const CSSMERR_CSP_INVALID_DATA_COUNT: number

export declare const CSSM_KEYBLOB_REFERENCE: number

export declare const CSSMERR_CSP_INVALID_KEY_FORMAT: number

export declare const CSSMERR_CL_INVALID_CERT_POINTER: number

export declare const CSSMOID_APPLE_EKU_SYSTEM_IDENTITY: cssm_data

export declare const CSSM_ACL_MATCH_HONOR_ROOT: number

export declare const CSSMERR_CSP_INVALID_KEYUSAGE_MASK: number

export declare const TLS_DH_DSS_WITH_AES_256_CBC_SHA256: number

export declare const CSSMERR_TP_INVALID_IDENTIFIER: number

export declare const CSSM_QUERY_RETURN_DATA: number

export declare const CSSMERR_CSP_INVALID_KEY_POINTER: number

export declare const CSSMERR_CSP_UNSUPPORTED_KEY_SIZE: number

export declare const CSSMERR_CSP_UNSUPPORTED_KEY_FORMAT: number

export declare const CSSMERR_CSP_KEY_USAGE_INCORRECT: number

export declare const CSSMERR_CSP_INVALID_KEY: number

export declare const CSSM_ALGID_PH: number

export declare const CSSMERR_CSP_DEVICE_MEMORY_ERROR: number

export declare const CSSMERR_CSP_PRIVILEGE_NOT_SUPPORTED: number

export declare const CSSMERR_CSP_OUTPUT_LENGTH_ERROR: number

export declare const CSSMERR_CSP_INVALID_INPUT_VECTOR: number

export declare const CSSM_CSP_BASE_CSP_ERROR: number

export declare const CSSMERR_CSP_MISSING_ATTR_PADDING: number

export declare const CSSMERR_CSSM_INTERNAL_ERROR: number

export declare const CSSMERR_CSSM_INVALID_ADDIN_HANDLE: number

export declare const CSSMERR_CSP_INVALID_ACL_BASE_CERTS: number

export declare const kSecEncodeTypeAttribute: interop.Pointer

export declare const CSSMOID_secp256k1: cssm_data

export declare const CSSM_KEYATTR_MODIFIABLE: number

export declare const CSSM_ERRCODE_INTERNAL_ERROR: number

export declare const CSSM_ALGMODE_ISO_9796: number

export declare const CSSM_CERT_BUNDLE_ENCODING_CUSTOM: number

export declare const CSSMERR_TP_INVALID_DB_LIST_POINTER: number

export declare const kSecAttrProtocolIPP: interop.Pointer

export declare const CSSMERR_CSSM_INVALID_SERVICE_MASK: number

export declare const kSecAttrServer: interop.Pointer

export declare const CSSMERR_CSSM_USER_CANCELED: number

export declare const CSSMOID_ECDSA_WithSHA512: cssm_data

export declare const CSSMERR_CSSM_EMM_AUTHENTICATE_FAILED: number

export declare const CSSMERR_CSSM_LIB_REF_NOT_FOUND: number

export declare const CSSMERR_CSP_PRIVILEGE_NOT_GRANTED: number

export declare const CSSM_ALGID_HAVAL5: number

export declare const errSecAttachHandleBusy: number

export declare const errSecNoSuchKeychain: number

export declare const kSecKeyAlgorithmECIESEncryptionCofactorX963SHA224AESGCM: interop.Pointer

export declare const CSSMERR_CSSM_OS_ACCESS_DENIED: number

export declare const CSSM_CERT_BUNDLE_ENCODING_PGP: number

export declare const errSecMobileMeServerNotAvailable: number

export declare const CSSMERR_CSSM_SELF_CHECK_FAILED: number

export declare const TLS_DH_anon_WITH_AES_128_CBC_SHA: number

export declare const CSSM_KEYCLASS_PRIVATE_KEY: number

export declare const CSSM_ERRCODE_INVALID_CRYPTO_DATA: number

export declare const CSSMERR_AC_INVALID_DB_HANDLE: number

export declare const CSSMOID_TelexNumber: cssm_data

export declare const CSSM_ERRCODE_INVALID_AC_HANDLE: number

export declare const CSSM_ERRCODE_INVALID_CL_HANDLE: number

export declare const CSSM_ALGID_ECDH: number

export declare const CSSM_TP_CERTVERIFY_INVALID_CERT_VALUE: number

export declare const CSSM_ERRCODE_INVALID_DB_HANDLE: number

export declare const CSSM_ERRCODE_VERIFICATION_FAILURE: number

export declare const errSSLPeerAuthCompleted: number

export declare const CSSM_ERRCODE_INVALID_NUMBER_OF_FIELDS: number

export declare const CSSM_ACL_PROCESS_SELECTOR_CURRENT_VERSION: number

export declare const errSecCertificateIsCA: number

export declare const CSSM_ERRCODE_INVALID_FIELD_POINTER: number

export declare const CSSM_ERRCODE_INCOMPATIBLE_VERSION: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_19: number

export declare const CSSM_ERRCODE_ACL_DELETE_FAILED: number

export declare const CSSM_WORDID_ISSUER_INFO: number

export declare const errSecConversionError: number

export declare const CSSMOID_Initials: cssm_data

export declare const CSSM_ERRCODE_INVALID_GUID: number

export declare const CSSM_ERRCODE_FUNCTION_NOT_IMPLEMENTED: number

export declare const CSSM_ERRCODE_INVALID_INPUT_POINTER: number

export declare const CSSM_ERRCODE_INVALID_POINTER: number

export declare const CSSMOID_DOTMAC_CERT_REQ_VALUE_HOSTNAME: cssm_data

export declare const CSSM_ERRCODE_MEMORY_ERROR: number

export declare const CSSM_ACL_AUTHORIZATION_DB_DELETE: number

export declare const CSSMERR_TP_INVALID_ANCHOR_CERT: number

export declare const CSSM_AC_PRIVATE_ERROR: number

export declare const CSSM_ALGID_SHA256: number

export declare const errSecInvalidKeyHierarchy: number

export declare const CSSM_KR_PRIVATE_ERROR: number

export declare const CSSMERR_CSP_MISSING_ATTR_OUTPUT_SIZE: number

export declare const errSecAppleAddAppACLSubject: number

export declare const CSSM_CRLGROUP_ENCODED_CRL: number

export declare const CSSM_APPLE_UNLOCK_TYPE_WRAPPED_PRIVATE: number

export declare const CSSM_KR_BASE_ERROR: number

export declare const kSecGuestAttributeArchitecture: interop.Pointer

export declare const CSSM_DL_BASE_ERROR: number

export declare const CSSMERR_CSSM_INVALID_SUBSERVICEID: number

export declare const kSecImportItemCertChain: interop.Pointer

export declare const CSSMERR_CSP_INVALID_PASSTHROUGH_ID: number

export declare const errSecRejectedForm: number

export declare const CSSM_ERRORCODE_COMMON_EXTENT: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_SERVICE_ERROR: number

export declare const CSSM_CERT_ENCODING_DER: number

export declare const CSSM_ALGID_SHA1HMAC_LEGACY: number

export declare const kSecPolicyOid: interop.Pointer

export declare const kSecAttrIsExtractable: interop.Pointer

export declare const errSSLATSMinimumKeySizeViolation: number

export declare const kSecPolicyApplePKINITServer: interop.Pointer

export declare const errSecInvalidCertificateGroup: number

export declare const kSecPolicyAppleSMIME: interop.Pointer

export declare const oidSha256Rsa: DERItem

export declare const errSSLCertExpired: number

export declare const kSecPolicyAppleX509Basic: interop.Pointer

export declare const errSecInvalidAttributeStartDate: number

export declare const errSecUnknownCertExtension: number

export declare const kSecKeyAlgorithmECDHKeyExchangeCofactorX963SHA224: interop.Pointer

export declare const kSecAttrSynchronizableAny: interop.Pointer

export declare const kSecAttrCanDecrypt: interop.Pointer

export declare const CSSM_ACL_KEYCHAIN_PROMPT_REQUIRE_PASSPHRASE: number

export declare const kSecOIDAPPLE_EXTENSION_AAI_INTERMEDIATE: interop.Pointer

export declare const CSSMERR_CSP_MISSING_ATTR_MODE: number

export declare const kSecCodeInfoSource: interop.Pointer

export declare const CSSMERR_CSP_INVALID_KEYATTR_MASK: number

export declare const CSSMOID_CrlDistributionPoints: cssm_data

export declare const CSSM_ALGID_MD2WithRSA: number

export declare const kSecKeyAlgorithmECIESEncryptionCofactorVariableIVX963SHA384AESGCM: interop.Pointer

export declare const kSecKeyAlgorithmECIESEncryptionCofactorVariableIVX963SHA256AESGCM: interop.Pointer

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_APPLE_CUSTOM: number

export declare const CSSM_ALGMODE_CFBPadIV8: number

export declare const kSecKeyAlgorithmECIESEncryptionStandardVariableIVX963SHA512AESGCM: interop.Pointer

export declare const kSecKeyAlgorithmECIESEncryptionStandardVariableIVX963SHA256AESGCM: interop.Pointer

export declare const kSecKeyAlgorithmECIESEncryptionCofactorX963SHA512AESGCM: interop.Pointer

export declare const CSSM_ALGCLASS_ASYMMETRIC: number

export declare const CSSM_ERRCODE_INVALID_DL_HANDLE: number

export declare const CSSM_WORDID_PREFIX: number

export declare const kSecOIDX509V1Signature: interop.Pointer

export declare const CSSMERR_CSSM_MODULE_MANAGER_INITIALIZE_FAIL: number

export declare const CSSMOID_ECDSA_WithSHA1: cssm_data

export declare const CSSM_ERRCODE_NO_USER_INTERACTION: number

export declare const CSSM_WORDID_ENCRYPT: number

export declare const kSecAttrTokenID: interop.Pointer

export declare const kSecKeyAlgorithmECIESEncryptionStandardX963SHA224AESGCM: interop.Pointer

export declare const errSecInvalidGUID: number

export declare const errSecOCSPResponderMalformedReq: number

export declare const CSSMERR_CSP_MEMORY_ERROR: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA256: interop.Pointer

export declare const oidMd2: DERItem

export declare const errSecMissingQualifiedCertStatement: number

export declare const CSSMERR_CSP_APPLE_PUBLIC_KEY_INCOMPLETE: number

export declare const CSSM_NET_PROTO_CMP: number

export declare const CSSM_TP_ACTION_ALLOW_EXPIRED: number

export declare const CSSM_ALGID_DSA: number

export declare const CSSM_WORDID_RANGE: number

export declare const kSecKeyAlgorithmECDSASignatureMessageX962SHA256: interop.Pointer

export declare const kSecKeyLabel: number

export declare const CSSM_ACL_SUBJECT_TYPE_PROMPTED_PASSWORD: number

export declare const errSSLCertNotYetValid: number

export declare const kSecAttrProtocolSMB: interop.Pointer

export declare const CSSM_AC_BASE_AC_ERROR: number

export declare const kSecKeyAlgorithmRSASignatureDigestPSSSHA384: interop.Pointer

export declare const CSSMERR_DL_INVALID_MODIFY_MODE: number

export declare const kSecKeyAlgorithmRSASignatureDigestPSSSHA224: interop.Pointer

export declare const CSSM_EVIDENCE_FORM_APPLE_HEADER: number

export declare const kSecKeyAlgorithmRSASignatureDigestPSSSHA1: interop.Pointer

export declare const kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA256: interop.Pointer

export declare const errSecInputLengthError: number

export declare const kSecKeyAlgorithmRSASignatureDigestPSSSHA512: interop.Pointer

export declare const kSecKeyVerifyRecover: number

export declare const CSSMERR_CSSM_INVALID_OUTPUT_POINTER: number

export declare const CSSMERR_DL_NO_USER_INTERACTION: number

export declare const kSecKeySensitive: number

export declare const oidPrivateKeyUsagePeriod: DERItem

export declare const kSecKeyKeyType: number

export declare const CSSM_TP_CERTNOTARIZE_NOT_AUTHORIZED: number

export declare const errSecTimestampUnacceptedExtension: number

export declare const kSecAttrPersistentReference: interop.Pointer

export declare const CSSM_ERRCODE_ACL_ENTRY_TAG_NOT_FOUND: number

export declare const kSecKeyPermanent: number

export declare const kSecEncodeLineLengthAttribute: interop.Pointer

export declare const CSSM_PADDING_RANDOM: number

export declare const CSSMERR_TP_INVALID_AUTHORITY: number

export declare const kSecOIDX509V1IssuerNameStd: interop.Pointer

export declare const CSSMERR_AC_INVALID_REQUEST_DESCRIPTOR: number

export declare const kSecACLAuthorizationChangeACL: interop.Pointer

export declare const kSecACLAuthorizationDerive: interop.Pointer

export declare const CSSM_ALGID_KEYCHAIN_KEY: number

export declare const CSSMERR_TP_MEMORY_ERROR: number

export declare const kSecACLAuthorizationDelete: interop.Pointer

export declare const errSecInvalidKeyUsageMask: number

export declare const errSecNoDefaultAuthority: number

export declare const CSSM_KEYUSE_SIGN: number

export declare const kSecUseOnlyGID: number

export declare const kSecAttrTokenIDSecureEnclave: interop.Pointer

export declare const kSecUseAuthenticationUIAllow: interop.Pointer

export declare const CSSMERR_TP_NOT_TRUSTED: number

export declare const kSecUseAuthenticationUI: interop.Pointer

export declare const kSecTrustExtendedValidation: interop.Pointer

export declare const kSecValueRef: interop.Pointer

export declare const CSSM_ATTRIBUTE_PADDING: number

export declare const CSSM_ACL_KEYCHAIN_PROMPT_UNSIGNED: number

export declare const oidSubjectInfoAccess: DERItem

export declare const errSecInvalidItemRef: number

export declare const CSSM_TP_KEY_ARCHIVE: number

export declare const CSSM_WORDID_ONLINE: number

export declare const kSecMatchLimitOne: interop.Pointer

export declare const kSecMatchValidOnDate: interop.Pointer

export declare const kSecAttrRounds: interop.Pointer

export declare const kSecAttrProtocolRTSP: interop.Pointer

export declare const CSSMOID_X509V1CRLNumberOfRevokedCertEntries: cssm_data

export declare const kSecAttrKeyTypeCAST: interop.Pointer

export declare const kSecAttrKeyTypeRC4: interop.Pointer

export declare const CSSM_ALGID_KEA: number

export declare const CSSM_ALGMODE_PKCS1_EME_V15: number

export declare const errSecNoAccessForItem: number

export declare const errSecCSResourceDirectoryFailed: number

export declare const kSecOIDX509V3SignedCertificate: interop.Pointer

export declare const kSecPolicyAppleCodeSigning: interop.Pointer

export declare const kSecAttrProtocolIMAPS: interop.Pointer

export declare const kSecAttrProtocolLDAPS: interop.Pointer

export declare const kSecAttrProtocolEPPC: interop.Pointer

export declare const CSSMERR_CSSM_MDS_ERROR: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_CCA: number

export declare const kSecAttrProtocolTelnet: interop.Pointer

export declare const CSSM_ALGMODE_CBC128: number

export declare const kSecAttrAccessibleWhenUnlockedThisDeviceOnly: interop.Pointer

export declare const kSecAttrAccessibleAlways: interop.Pointer

export declare const CSSMOID_DOTMAC_CERT_EMAIL_ENCRYPT: cssm_data

export declare const errSecAuthFailed: number

export declare const kSecAttrAccessibleWhenUnlocked: interop.Pointer

export declare const CSSM_ERRCODE_INVALID_CSP_HANDLE: number

export declare const CSSMOID_sect193r1: cssm_data

export declare const kSecAttrEffectiveKeySize: interop.Pointer

export declare const CSSM_CERTGROUP_CERT_PAIR: number

export declare const kSecAttrKeySizeInBits: interop.Pointer

export declare const CSSM_TP_CRLISSUE_INVALID_DOMAIN: number

export declare const errSecDatastoreIsOpen: number

export declare const errSecInvalidCRLGroup: number

export declare const CSSMOID_CollectivePostalCode: cssm_data

export declare const CSSM_WORDID_ENTRY: number

export declare const kSecOIDX509V3CertificateExtensionType: interop.Pointer

export declare const CSSMERR_AC_INVALID_CL_HANDLE: number

export declare const CSSM_FALSE: number

export declare const CSSM_ATTRIBUTE_DATA_NONE: number

export declare const kSecAttrPath: interop.Pointer

export declare const kSecReturnRef: interop.Pointer

export declare const kSecAttrGeneric: interop.Pointer

export declare const kSecAttrModificationDate: interop.Pointer

export declare const CSSMERR_DL_UNSUPPORTED_LOCALITY: number

export declare const kSecAttrSynchronizable: interop.Pointer

export declare const kSecAttrAccessGroup: interop.Pointer

export declare const CSSM_USEE_LAST: number

export declare const kSecAttrAccess: interop.Pointer

export declare const errSSLUnexpectedRecord: number

export declare const kSecClassKey: interop.Pointer

export declare const kSecIdentityDomainKerberosKDC: interop.Pointer

export declare const errSecInteractionRequired: number

export declare const CSSM_TP_CERTCHANGE_REJECTED: number

export declare const kSecPropertyTypeData: interop.Pointer

export declare const CSSM_ATTRIBUTE_PUBLIC_KEY_FORMAT: number

export declare const kSecPropertyKeyLabel: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_IMPORT_WRAPPED: number

export declare const kSecAttrPRFHmacAlgSHA384: interop.Pointer

export declare const CSSM_CERT_BUNDLE_ENCODING_SEXPR: number

export declare const kSecPublicKeyHashItemAttr: number

export declare const CSSMOID_APPLE_EXTENSION_APPLEID_INTERMEDIATE: cssm_data

export declare const CSSM_DB_FILESYSTEMSCAN_MODE: number

export declare const CSSM_DL_ODBC: number

export declare const kSecPolicyAppleIPsec: interop.Pointer

export declare const CSSM_ACL_AUTHORIZATION_EXPORT_WRAPPED: number

export declare const errSecCertificateCannotOperate: number

export declare const CSSM_DB_AND: number

export declare const CSSM_ALGID_RIPEMAC: number

export declare const CSSM_DB_CONTAINS_INITIAL_SUBSTRING: number

export declare const CSSM_DB_EQUAL: number

export declare const CSSM_DB_ACCESS_PRIVILEGED: number

export declare const kSecMatchSubjectEndsWith: interop.Pointer

export declare const kSecTransformActionAttributeNotification: interop.Pointer

export declare const CSSM_CSP_STORES_SESSION_KEYS: number

export declare const CSSM_DB_CERT_USE_REVOKED: number

export declare const CSSM_DB_CERT_USE_TRUSTED: number

export declare const CSSM_WORDID_PUBLIC_KEY_FROM_CERT: number

export declare const CSSM_DL_DB_RECORD_PRIVATE_KEY: number

export declare const CSSM_DB_RECORDTYPE_APP_DEFINED_START: number

export declare const CSSM_WORDID_IMPORT_WRAPPED: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_UINT32: number

export declare const errSecCSResourceNotSupported: number

export declare const TLS_DH_anon_WITH_AES_256_GCM_SHA384: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_BIG_NUM: number

export declare const CSSM_KEY_HIERARCHY_NONE: number

export declare const kSecKeyAlgorithmRSASignatureMessagePSSSHA224: interop.Pointer

export declare const CSSMERR_DL_INCOMPATIBLE_FIELD_FORMAT: number

export declare const errSecInvalidCRLIndex: number

export declare const CSSM_DB_ATTRIBUTE_NAME_AS_OID: number

export declare const errSecQuerySizeUnknown: number

export declare const errSecMissingAttributePadding: number

export declare const CSSM_ALGID_CDMF: number

export declare const CSSM_CERT_BUNDLE_ENCODING_BER: number

export declare const CSSMERR_DL_UNSUPPORTED_QUERY: number

export declare const CSSM_CERT_BUNDLE_PKCS12: number

export declare const CSSM_CERT_BUNDLE_PKCS7_SIGNED_DATA: number

export declare const CSSM_DL_PKCS11: number

export declare const CSSM_CERT_BUNDLE_CUSTOM: number

export declare const CSSMOID_secp192r1: cssm_data

export declare const kSecACLAuthorizationSign: interop.Pointer

export declare const CSSM_CSP_TOK_PRIVATE_KEY_PASSWORD: number

export declare const CSSM_ALGID_SSL3MasterDerive: number

export declare const CSSM_TP_CERTVERIFY_UNKNOWN_CRITICAL_EXT: number

export declare const CSSM_TP_CERTVERIFY_INVALID_SIGNATURE: number

export declare const TLS_ECDH_RSA_WITH_3DES_EDE_CBC_SHA: number

export declare const CSSM_WORDID_SIGNED_NONCE: number

export declare const CSSM_CERT_ENCODING_LAST: number

export declare const kSecACLAuthorizationImportClear: interop.Pointer

export declare const CSSMERR_CSP_ALREADY_LOGGED_IN: number

export declare const CSSM_DB_CONTAINS: number

export declare const CSSM_TP_CERTCHANGE_REASON_SUSPECTEDCOMPROMISE: number

export declare const CSSM_TP_CERTCHANGE_REASON_CEASEOPERATION: number

export declare const CSSMERR_APPLETP_SMIME_NO_EMAIL_ADDRS: number

export declare const CSSMERR_AC_DEVICE_FAILED: number

export declare const CSSM_TP_CERTISSUE_WILL_BE_REVOKED: number

export declare const oidEcPubKey: DERItem

export declare const CSSMERR_TP_NO_DEFAULT_AUTHORITY: number

export declare const CSSM_ELAPSED_TIME_UNKNOWN: number

export declare const CSSM_TP_CONFIRM_REJECT: number

export declare const oidCountryName: DERItem

export declare const CSSM_TP_CONFIRM_STATUS_UNKNOWN: number

export declare const CSSM_EVIDENCE_FORM_TUPLEGROUP: number

export declare const CSSM_EVIDENCE_FORM_CRL_NEXTTIME: number

export declare const CSSMERR_DL_MDS_ERROR: number

export declare const CSSMOID_CountryName: cssm_data

export declare const CSSMERR_CSP_STAGED_OPERATION_IN_PROGRESS: number

export declare const CSSM_ACL_AUTHORIZATION_MAC: number

export declare const CSSMOID_StateProvinceName: cssm_data

export declare const kSecAttrAuthenticationTypeHTTPBasic: interop.Pointer

export declare const CSSM_CL_CUSTOM_CRL_PARSE_FORMAT: number

export declare const CSSM_CRL_TYPE_MULTIPLE: number

export declare const CSSMERR_CL_MDS_ERROR: number

export declare const CSSMOID_X509V1SubjectPublicKeyAlgorithm: cssm_data

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_PKCS8: number

export declare const CSSM_WORDID_SIGN: number

export declare const CSSM_CRL_PARSE_FORMAT_COMPLEX: number

export declare const errSecPrivilegeNotGranted: number

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTNOTARIZE: number

export declare const CSSM_SAMPLE_TYPE_PROTECTED_BIOMETRIC: number

export declare const CSSM_DB_ACCESS_WRITE: number

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTSUSPEND: number

export declare const CSSM_TP_AUTHORITY_REQUEST_CERTISSUE: number

export declare const CSSM_ACL_SUBJECT_TYPE_PROTECTED_BIOMETRIC: number

export declare const CSSM_ALGCLASS_MAC: number

export declare const CSSM_KEYBLOB_RAW: number

export declare const CSSM_ALGMODE_PBC: number

export declare const CSSM_VALUE_NOT_AVAILABLE: number

export declare const errSecIncompatibleDatabaseBlob: number

export declare const CSSM_ALGID_PBE_OPENSSL_MD5: number

export declare const CSSM_CSP_STORES_GENERIC: number

export declare const CSSM_CSP_STORES_CERTIFICATES: number

export declare const TLS_DHE_PSK_WITH_AES_256_CBC_SHA: number

export declare const CSSMERR_APPLEDL_QUOTA_EXCEEDED: number

export declare const CSSMERR_DL_RECORD_MODIFIED: number

export declare const CSSM_KEYCLASS_SECRET_PART: number

export declare const CSSMOID_AliasedEntryName: cssm_data

export declare const kSecImportItemTrust: interop.Pointer

export declare const CSSM_CSP_RDR_EXISTS: number

export declare const CSSM_CSP_RDR_TOKENPRESENT: number

export declare const kSecPolicyAppleRevocation: interop.Pointer

export declare const CSSM_CSP_TOK_CLOCK_EXISTS: number

export declare const CSSM_PADDING_PKCS1: number

export declare const errSecOCSPResponderTryLater: number

export declare const CSSM_PADDING_PKCS5: number

export declare const CSSM_ATTRIBUTE_SYMMETRIC_KEY_FORMAT: number

export declare const CSSM_ALGID_3DES_3KEY_EEE: number

export declare const CSSM_ATTRIBUTE_PRIVATE_KEY_FORMAT: number

export declare const CSSMOID_CerticomEllCurve: cssm_data

export declare const kSecKeyKeySizeInBits: number

export declare const errSSLPeerUserCancelled: number

export declare const CSSM_ATTRIBUTE_ROUNDS_RANGE: number

export declare const oidSha1: DERItem

export declare const CSSMERR_TP_INVALID_CALLERAUTH_CONTEXT_POINTER: number

export declare const CSSM_ACL_AUTHORIZATION_DBS_CREATE: number

export declare const oidSha384: DERItem

export declare const CSSM_APPLEFILEDL_COMMIT: number

export declare const CSSMERR_TP_INVALID_CRL: number

export declare const CSSMERR_DL_INVALID_UNIQUE_INDEX_DATA: number

export declare const CSSM_ATTRIBUTE_PRIME: number

export declare const errSecMissingAttributeAccessCredentials: number

export declare const kSecOAEPMGF1DigestAlgorithmAttributeName: interop.Pointer

export declare const kSecCodeInfoTimestamp: interop.Pointer

export declare const kSecAttrProtocolFTPProxy: interop.Pointer

export declare const CSSM_DB_ACCESS_READ: number

export declare const CSSM_WORDID_DO: number

export declare const CSSM_ATTRIBUTE_KEYUSAGE: number

export declare const kSecACLAuthorizationKeychainItemInsert: interop.Pointer

export declare const CSSMERR_CSSM_ATTRIBUTE_NOT_IN_CONTEXT: number

export declare const CSSM_ERRCODE_INVALID_CONTEXT_HANDLE: number

export declare const CSSM_DB_INDEX_ON_RECORD: number

export declare const kSecCSCheckAllArchitectures: number

export declare const CSSM_ATTRIBUTE_KEY_TYPE: number

export declare const CSSM_ATTRIBUTE_SALT: number

export declare const kSecModeOFBKey: interop.Pointer

export declare const CSSM_ALGID_MD2Random: number

export declare const CSSM_ATTRIBUTE_TYPE_MASK: number

export declare const CSSMOID_OrganizationName: cssm_data

export declare const CSSMERR_APPLETP_MISSING_REQUIRED_EXTENSION: number

export declare const CSSM_ATTRIBUTE_DATA_DATE: number

export declare const CSSM_ATTRIBUTE_DATA_CRYPTO_DATA: number

export declare const CSSMOID_PKCS7_EnvelopedData: cssm_data

export declare const kSecMatchBits: number

export declare const errSecTrustNotAvailable: number

export declare const CSSM_ALGCLASS_SIGNATURE: number

export declare const CSSMERR_CSP_MISSING_ATTR_PASSPHRASE: number

export declare const CSSM_ALGMODE_LAST: number

export declare const CSSM_PKCS_OAEP_MGF1_SHA1: number

export declare const CSSM_ALGMODE_PKCS1_EME_OAEP: number

export declare const errSecMissingAttributeKeyType: number

export declare const oidEcPrime192v1: DERItem

export declare const CSSM_ALGMODE_CFB32: number

export declare const CSSM_ALGMODE_CBC64: number

export declare const kSecOIDOrganizationName: interop.Pointer

export declare const CSSMOID_KERBv5_PKINIT_KP_KDC: cssm_data

export declare const CSSM_ALGMODE_ECB64: number

export declare const CSSMERR_TP_INVALID_TUPLE: number

export declare const CSSM_ALGMODE_PRIVATE_KEY: number

export declare const CSSMERR_CSP_ACL_SUBJECT_TYPE_NOT_SUPPORTED: number

export declare const kSecAttrPRFHmacAlgSHA224: interop.Pointer

export declare const errSSLCertificateRequired: number

export declare const kSecOIDHoldInstructionCode: interop.Pointer

export declare const CSSM_ALGMODE_OFBNLF: number

export declare const CSSM_ALGMODE_OFBPadIV8: number

export declare const CSSM_ALGMODE_CFB: number

export declare const CSSM_ALGMODE_CBCPadIV8: number

export declare const CSSM_TP_CERTISSUE_OKWITHCERTMODS: number

export declare const CSSMERR_CSP_MISSING_ATTR_SALT: number

export declare const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA512: interop.Pointer

export declare const kSecKeyAlgorithmRSASignatureDigestPSSSHA256: interop.Pointer

export declare const kSecTransformErrorUnsupportedAttribute: number

export declare const CSSMOID_X9_62_C_TwoCurve: cssm_data

export declare const CSSM_ALGID_MD5HMAC: number

export declare const CSSM_ALGID_HAVAL4: number

export declare const CSSM_ALGID_UTC: number

export declare const CSSMERR_CSP_NO_USER_INTERACTION: number

export declare const CSSM_ALGID_ECAES: number

export declare const CSSM_WORDID_SEQUENCE: number

export declare const CSSMERR_TP_VERIFICATION_FAILURE: number

export declare const kSSLSessionConfig_anonymous: interop.Pointer

export declare const CSSM_ALGID_FortezzaTimestamp: number

export declare const CSSM_ALGID_SSL3SHA1: number

export declare const kSecAttrPRFHmacAlgSHA256: interop.Pointer

export declare const CSSMERR_CL_INVALID_CONTEXT_HANDLE: number

export declare const CSSM_ALGID_3DES: number

export declare const CSSM_NOTIFY_REMOVE: number

export declare const CSSM_ALGID_SSL3KeyAndMacDerive: number

export declare const kSecAttrAuthenticationType: interop.Pointer

export declare const CSSMOID_DOTMAC_CERT_REQ_VALUE_IS_PENDING: cssm_data

export declare const CSSM_ALGID_SSL3PrePrimaryGen: number

export declare const oidSha384Rsa: DERItem

export declare const CSSM_ALGID_ConcatBaseAndData: number

export declare const CSSMERR_CSP_INVALID_ATTR_KEY: number

export declare const CSSM_ALGID_ConcatKeyAndBase: number

export declare const CSSM_TP_CERTNOTARIZE_OKWITHOUTFIELDS: number

export declare const kSecTrustOrganizationName: interop.Pointer

export declare const CSSM_CRL_PARSE_FORMAT_LAST: number

export declare const CSSMOID_DOTMAC_CERT_IDENTITY: cssm_data

export declare const TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA: number

export declare const CSSMOID_APPLE_FEE: cssm_data

export declare const CSSM_ALGID_DESRandom: number

export declare const kSecACLAuthorizationKeychainItemModify: interop.Pointer

export declare const CSSMOID_SHA384: cssm_data

export declare const CSSM_ALGID_RSA: number

export declare const CSSM_ALGID_CRAB: number

export declare const errSSLPeerExportRestriction: number

export declare const CSSM_ALGID_CAST: number

export declare const CSSM_ALGID_RC4: number

export declare const oidEntrustVersInfo: DERItem

export declare const CSSM_ALGID_3DES_3KEY: number

export declare const CSSM_ALGID_3DES_1KEY_EEE: number

export declare const errSecMissingAlgorithmParms: number

export declare const CSSM_ALGID_TIGER: number

export declare const CSSM_ALGID_HAVAL: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_REAL: number

export declare const CSSM_ALGID_KHUFU: number

export declare const kSecAttrService: interop.Pointer

export declare const CSSM_ALGID_CUSTOM: number

export declare const CSSM_KEYUSE_WRAP: number

export declare const CSSM_KEYUSE_SIGN_RECOVER: number

export declare const TLS_PSK_WITH_AES_128_CBC_SHA256: number

export declare const CSSM_TP_CRLISSUE_REJECTED: number

export declare const CSSM_CERT_PARSE_FORMAT_CUSTOM: number

export declare const CSSM_KEYUSE_ANY: number

export declare const CSSM_KEYATTR_SENSITIVE: number

export declare const CSSM_WORDID_PROTECTED_BIOMETRIC: number

export declare const CSSM_KEYATTR_PERMANENT: number

export declare const errSecOCSPNoSigner: number

export declare const CSSMERR_APPLETP_INVALID_EXTENDED_KEY_USAGE: number

export declare const CSSMERR_CL_INVALID_CACHE_HANDLE: number

export declare const oidSha1DsaOIW: DERItem

export declare const CSSM_KEYCLASS_OTHER: number

export declare const errSecACLAddFailed: number

export declare const CSSM_CERT_STATUS_TRUST_SETTINGS_DENY: number

export declare const CSSM_WORDID_SHA1: number

export declare const CSSMOID_PKIX_OCSP_NOCHECK: cssm_data

export declare const CSSM_KEYBLOB_RAW_FORMAT_FIPS186: number

export declare const kSecTransformErrorNotInitializedCorrectly: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_MSCAPI: number

export declare const errSecMissingRequiredExtension: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_PKCS3: number

export declare const CSSM_ACL_SUBJECT_TYPE_LOGIN_NAME: number

export declare const CSSM_TP_CRLISSUE_NOT_CURRENT: number

export declare const CSSMERR_DL_INVALID_SELECTION_TAG: number

export declare const errSecUnknownTag: number

export declare const CSSM_SAMPLE_TYPE_KEYCHAIN_PROMPT: number

export declare const CSSMERR_DL_INVALID_RESULTS_HANDLE: number

export declare const CSSM_ACL_EDIT_MODE_DELETE: number

export declare const CSSMOID_sect163r1: cssm_data

export declare const CSSM_ALGID_SHA512: number

export declare const CSSM_ACL_AUTHORIZATION_ENCRYPT: number

export declare const CSSM_ACL_AUTHORIZATION_LOGIN: number

export declare const CSSM_ALGID_SHA512WithRSA: number

export declare const CSSM_ACL_SUBJECT_TYPE_PROMPTED_BIOMETRIC: number

export declare const CSSMERR_TP_FUNCTION_FAILED: number

export declare const CSSM_ACL_SUBJECT_TYPE_HASHED_SUBJECT: number

export declare const CSSM_DB_MODIFY_ATTRIBUTE_REPLACE: number

export declare const CSSM_ATTRIBUTE_KRPROFILE_REMOTE: number

export declare const CSSM_ACL_SUBJECT_TYPE_PASSWORD: number

export declare const CSSM_ACL_SUBJECT_TYPE_THRESHOLD: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_17: number

export declare const CSSM_CERTGROUP_PARSED_CERT: number

export declare const CSSM_WORDID_NOT_AFTER: number

export declare const kSecPropertyTypeSection: interop.Pointer

export declare const CSSM_CERT_ENCODING_SEXPR: number

export declare const CSSM_PKCS_OAEP_PSOURCE_NONE: number

export declare const CSSM_CERT_ENCODING_BER: number

export declare const CSSM_CERT_X9_ATTRIBUTE: number

export declare const CSSM_CERT_PGP: number

export declare const CSSM_CERT_X_509v3: number

export declare const kSecOIDCountryName: interop.Pointer

export declare const CSSM_SAMPLE_TYPE_PROMPTED_BIOMETRIC: number

export declare const kSecTrustResultValue: interop.Pointer

export declare const kSecOIDServerAuth: interop.Pointer

export declare const CSSM_LIST_TYPE_CUSTOM: number

export declare const TLS_RSA_PSK_WITH_AES_128_GCM_SHA256: number

export declare const kSecAttrAuthenticationTypeMSN: interop.Pointer

export declare const CSSM_KEY_HIERARCHY_INTEG: number

export declare const CSSM_WORDID_X509V2: number

export declare const CSSM_WORDID_X509_ATTRIBUTE: number

export declare const errSecPkcs12VerifyFailure: number

export declare const CSSM_WORDID_VERSION: number

export declare const CSSM_WORDID_URI: number

export declare const errSSLPeerCertUnknown: number

export declare const CSSM_ATTRIBUTE_ACCESS_CREDENTIALS: number

export declare const CSSMOID_OCSPSigning: cssm_data

export declare const CSSM_WORDID_SIGNATURE: number

export declare const CSSM_CERT_ACL_ENTRY: number

export declare const CSSM_PADDING_SIGRAW: number

export declare const CSSM_WORDID_RSA_PKCS_SHA1: number

export declare const CSSM_PADDING_PKCS7: number

export declare const errSecCSHostProtocolContradiction: number

export declare const CSSM_TP_CERTNOTARIZE_OK: number

export declare const errSecCSInvalidEntitlements: number

export declare const CSSM_SERVICE_DL: number

export declare const errSecNoBasicConstraints: number

export declare const CSSM_WORDID_PASSWORD: number

export declare const CSSM_CRL_PARSE_FORMAT_MULTIPLE: number

export declare const errSecInvalidAttributeRounds: number

export declare const CSSM_ATTRIBUTE_DATA_UINT32: number

export declare const TLS_DHE_DSS_WITH_AES_128_GCM_SHA256: number

export declare const CSSM_WORDID_LOGIN_NAME: number

export declare const CSSM_WORDID_LOGIN: number

export declare const errSecNotLoggedIn: number

export declare const CSSM_WORDID_L: number

export declare const CSSM_WORDID_NUMERIC: number

export declare const kSecTransformPreviousErrorKey: interop.Pointer

export declare const errSecInvalidAttributeWrappedKeyFormat: number

export declare const oidCertificatePolicies: DERItem

export declare const CSSMERR_DL_INVALID_DB_LOCATION: number

export declare const kSecAttrKeyTypeECDSA: interop.Pointer

export declare const kSecRevocationOCSPMethod: number

export declare const kSecAttrProtocolPOP3S: interop.Pointer

export declare const CSSM_WORDID_HASHED_PASSWORD: number

export declare const errSecSuccess: number

export declare const kSecAttrProtocolAFP: interop.Pointer

export declare const errSecCodeSigningDevelopment: number

export declare const errSecCSInvalidFlags: number

export declare const CSSM_WORDID_ELGAMAL: number

export declare const CSSMOID_APPLE_EXTENSION_ADC_DEV_SIGNING: cssm_data

export declare const CSSM_WORDID_DISPLAY: number

export declare const CSSM_WORDID_DERIVE: number

export declare const CSSM_DB_RECORDTYPE_SCHEMA_END: number

export declare const errSSLPeerCertExpired: number

export declare const CSSM_SERVICE_TP: number

export declare const kSecCodeInfoCMS: interop.Pointer

export declare const CSSMERR_CSSM_IN_DARK_WAKE: number

export declare const kSecGuestAttributeAudit: interop.Pointer

export declare const kSecPropertyKeyType: interop.Pointer

export declare const CSSM_WORDID_N: number

export declare const CSSM_WORDID_NAME: number

export declare const CSSMERR_CSSM_EMM_LOAD_FAILED: number

export declare const CSSM_WORDID_BINARY: number

export declare const errSecPVCAlreadyConfigured: number

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_25: number

export declare const CSSMOID_Owner: cssm_data

export declare const CSSMERR_CSP_INVALID_CRYPTO_DATA: number

export declare const CSSM_USEE_FINANCIAL: number

export declare const CSSM_INVALID_HANDLE: number

export declare const CSSM_USEE_NONE: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_PGP: number

export declare const CSSM_SAMPLE_TYPE_PROTECTED_PASSWORD: number

export declare const kSecMatchSubjectStartsWith: interop.Pointer

export declare const CSSM_MODULE_STRING_SIZE: number

export declare const CSSMERR_TP_INVALID_DB_HANDLE: number

export declare const errSSLATSCertificateHashAlgorithmViolation: number

export declare const errSecOCSPBadResponse: number

export declare const CSSMERR_CSSM_INVALID_ATTRIBUTE: number

export declare const errSSLATSViolation: number

export declare const CSSMOID_X509V2CRLRevokedEntryAllExtensionsCStruct: cssm_data

export declare const errSSLConfigurationFailed: number

export declare const TLS_ECDHE_PSK_WITH_AES_256_CBC_SHA: number

export declare const CSSMERR_APPLETP_CRL_NOT_VALID_YET: number

export declare const errSSLTransportReset: number

export declare const CSSM_DB_RECORDTYPE_APP_DEFINED_END: number

export declare const TLS_DHE_PSK_WITH_RC4_128_SHA: number

export declare const errSSLClientHelloReceived: number

export declare const CSSM_WORDID_SET: number

export declare const errSecCallbackFailed: number

export declare const errSecInvalidAttributeSubprime: number

export declare const CSSM_APPLEFILEDL_MAKE_COPY: number

export declare const CSSM_DB_CERT_USE_OWNER: number

export declare const errSSLHostNameMismatch: number

export declare const errSecUnsupportedKeyAttributeMask: number

export declare const CSSM_ERRCODE_PRIVILEGE_NOT_GRANTED: number

export declare const CSSMOID_APPLE_EKU_QA_PROFILE_SIGNING: cssm_data

export declare const errAuthorizationCanceled: number

export declare const kSecPropertyKeyLocalizedLabel: interop.Pointer

export declare const CSSMERR_APPLETP_CS_BAD_PATH_LENGTH: number

export declare const kSecAttrProtocolHTTPSProxy: interop.Pointer

export declare const errSecCertificatePolicyNotAllowed: number

export declare const errSecInvalidCRL: number

export declare const CSSM_CRL_ENCODING_UNKNOWN: number

export declare const kSecKeyKeyClass: number

export declare const errSecTimestampUnacceptedPolicy: number

export declare const CSSMERR_CSP_INVALID_KEY_CLASS: number

export declare const errSecTimestampInvalid: number

export declare const errSecExtendedKeyUsageNotCritical: number

export declare const CSSMERR_APPLETP_SSL_BAD_EXT_KEY_USE: number

export declare const CSSMOID_X509V1SubjectNameLDAP: cssm_data

export declare const CSSM_APPLECSP_KEYDIGEST: number

export declare const CSSMOID_sect233r1: cssm_data

export declare const errSecDatabaseLocked: number

export declare const errSecMobileMeServerError: number

export declare const errSecUnsupportedNumRecordTypes: number

export declare const CSSM_KEYBLOB_RAW_FORMAT_BSAFE: number

export declare const kSecOIDExtendedKeyUsage: interop.Pointer

export declare const errSecUnsupportedIndexInfo: number

export declare const TLS_ECDH_anon_WITH_AES_128_CBC_SHA: number

export declare const errSecInvalidEncoding: number

export declare const TLS_DHE_DSS_WITH_3DES_EDE_CBC_SHA: number

export declare const kSecOIDX509V3CertificateExtensionValue: interop.Pointer

export declare const errSecInvalidAccessRequest: number

export declare const errSecUnsupportedAddressType: number

export declare const CSSM_ERRCODE_INVALID_ACL_CHALLENGE_CALLBACK: number

export declare const CSSM_WORDID_PGP: number

export declare const CSSMERR_DL_INVALID_NETWORK_ADDR: number

export declare const CSSM_TP_CERTNOTARIZE_REJECTED: number

export declare const errSecMissingAttributeBase: number

export declare const errSecInvalidReason: number

export declare const kSecAttrKeyTypeDES: interop.Pointer

export declare const CSSMOID_X509V1SubjectName: cssm_data

export declare const errSecAddinLoadFailed: number

export declare const SSL_RSA_WITH_RC4_128_MD5: number

export declare const CSSMERR_CSP_SAMPLE_VALUE_NOT_SUPPORTED: number

export declare const errSecInvalidCRLAuthority: number

export declare const kSecKeyAlgorithmECDSASignatureDigestX962SHA384: interop.Pointer

export declare const TLS_PSK_WITH_RC4_128_SHA: number

export declare const errSecCertificateExpired: number

export declare const CSSM_CERT_STATUS_IS_IN_ANCHORS: number

export declare const CSSMERR_CSP_OBJECT_MANIP_AUTH_DENIED: number

export declare const kSecTransformActionFinalize: interop.Pointer

export declare const errSecInvalidSubServiceID: number

export declare const CSSM_TP_CERTRECLAIM_NOT_AUTHORIZED: number

export declare const errSecMissingAttributeWrappedKeyFormat: number

export declare const CSSMOID_ClientAuth: cssm_data

export declare const errSecInvalidExtendedKeyUsage: number

export declare const kSecOIDX509V3CertificateExtensionCritical: interop.Pointer

export declare const errSecInvalidAttributeAccessCredentials: number

export declare const errSecDataNotModifiable: number

export declare const errSecInvalidAttributeDLDBHandle: number

export declare const CSSMOID_ECDSA_WithSHA224: cssm_data

export declare const errSecInvalidAttributeBase: number

export declare const errSecACLChangeFailed: number

export declare const errSecInvalidAttributeEffectiveBits: number

export declare const CSSMERR_TP_INVALID_CSP_HANDLE: number

export declare const kSecPolicyKU_DigitalSignature: interop.Pointer

export declare const errSecDeviceVerifyFailed: number

export declare const errSecMissingAttributeBlockSize: number

export declare const errSecInvalidAttributeSeed: number

export declare const errSecInvalidAttributeSalt: number

export declare const kSecAttrApplicationTag: interop.Pointer

export declare const CSSM_DL_DB_RECORD_CRL: number

export declare const errSecInvalidAttributeKey: number

export declare const errSecInvalidContext: number

export declare const CSSM_WORDID_DSA_SHA1: number

export declare const errSecCSCMSConstructionFailed: number

export declare const errSecInvalidInputVector: number

export declare const CSSM_DB_CONTAINS_FINAL_SUBSTRING: number

export declare const CSSMERR_CSP_INVALID_ATTR_EFFECTIVE_BITS: number

export declare const CSSMERR_CSP_APPLE_SSLv2_ROLLBACK: number

export declare const CSSM_FEE_PRIME_TYPE_FEE: number

export declare const errSSLBadCertificateStatusResponse: number

export declare const CSSMERR_DL_ACL_REPLACE_FAILED: number

export declare const oidMd5Fee: DERItem

export declare const CSSM_ALGID_ECDH_X963_KDF: number

export declare const CSSM_ALGID_SSL3SHA1_MAC: number

export declare const errSecModuleManagerInitializeFailed: number

export declare const errSecInvalidAlgorithm: number

export declare const CSSMERR_DL_FUNCTION_FAILED: number

export declare const errSecResourceSignBadExtKeyUsage: number

export declare const kSecUseAuthenticationUIFail: interop.Pointer

export declare const errSecInvalidKeyRef: number

export declare const CSSM_CERT_STATUS_TRUST_SETTINGS_TRUST: number

export declare const CSSMERR_TP_INVALID_PASSTHROUGH_ID: number

export declare const errSecInvalidScope: number

export declare const errSecIncompatibleVersion: number

export declare const CSSMOID_PKCS12_crlBag: cssm_data

export declare const CSSMERR_APPLETP_UNKNOWN_CRL_EXTEN: number

export declare const errSecACLDeleteFailed: number

export declare const CSSMOID_ecPublicKey: cssm_data

export declare const errSecVerificationFailure: number

export declare const kSecOIDAPPLE_CERT_POLICY: interop.Pointer

export declare const errSecCRLAlreadySigned: number

export declare const errSecInvalidPointer: number

export declare const kCMSEncoderDigestAlgorithmSHA256: interop.Pointer

export declare const kSecPrivateKeyAttrs: interop.Pointer

export declare const CSSMOID_DeltaCrlIndicator: cssm_data

export declare const errSecInvalidKeyAttributeMask: number

export declare const errSecNotInitialized: number

export declare const CSSM_WORDID_KEYCHAIN_LOCK: number

export declare const errSecMobileMeFailedConsistencyCheck: number

export declare const CSSM_TP_CERTVERIFY_INVALID_CRL_DIST_PT: number

export declare const CSSMOID_X509V2CRLRevokedEntrySingleExtensionStruct: cssm_data

export declare const errSecOCSPNotTrustedToAnchor: number

export declare const CSSM_TP_CRL_DISTRIBUTE: number

export declare const CSSM_ACL_AUTHORIZATION_DBS_DELETE: number

export declare const CSSMERR_CSPDL_APPLE_DL_CONVERSION_ERROR: number

export declare const errSecInvalidID: number

export declare const CSSMOID_CrlReason: cssm_data

export declare const errSecCodeSigningBadCertChainLength: number

export declare const errSecMultiplePrivKeys: number

export declare const CSSM_WORDID_CERT: number

export declare const TLS_RSA_PSK_WITH_3DES_EDE_CBC_SHA: number

export declare const errSecNetworkFailure: number

export declare const kSecKeyAlgorithmRSAEncryptionPKCS1: interop.Pointer

export declare const TLS_DH_DSS_WITH_AES_128_GCM_SHA256: number

export declare const errSecCertificateDuplicateExtension: number

export declare const errSecCRLPolicyFailed: number

export declare const CSSM_TP_CERTVERIFY_INVALID_POLICY: number

export declare const CSSM_ERRCODE_INVALID_ACL_ENTRY_TAG: number

export declare const errSecCRLExpired: number

export declare const errSecCSResourcesNotFound: number

export declare const CSSM_ATTRIBUTE_SEED: number

export declare const CSSMERR_CSP_ACL_ENTRY_TAG_NOT_FOUND: number

export declare const errSecUnknownCriticalExtensionFlag: number

export declare const kSecAttrAccount: interop.Pointer

export declare const errSecInvalidAuthorityKeyID: number

export declare const errSecInvalidCRLEncoding: number

export declare const kSecTransformOperationNotSupportedOnGroup: number

export declare const errSecInvalidOwnerEdit: number

export declare const kSecAttrCertificateType: interop.Pointer

export declare const kSecAttrCanVerify: interop.Pointer

export declare const CSSM_KEYBLOB_REF_FORMAT_STRING: number

export declare const CSSM_ALGID_SHA256WithECDSA: number

export declare const CSSM_TP_CERTVERIFY_INVALID_BASIC_CONSTRAINTS: number

export declare const CSSM_CL_TEMPLATE_INTERMEDIATE_CERT: number

export declare const CSSM_ALGCLASS_DERIVEKEY: number

export declare const errSecBufferTooSmall: number

export declare const CSSMERR_APPLETP_LEAF_PIN_MISMATCH: number

export declare const CSSMOID_X509V3Certificate: cssm_data

export declare const CSSMERR_CSP_OPERATION_AUTH_DENIED: number

export declare const CSSMERR_APPLETP_INVALID_SUBJECT_ID: number

export declare const oidExtendedKeyUsageCodeSigning: DERItem

export declare const CSSM_ATTRIBUTE_DATA_ACCESS_CREDENTIALS: number

export declare const CSSM_ACL_SUBJECT_TYPE_BIOMETRIC: number

export declare const TLS_DHE_PSK_WITH_AES_128_CBC_SHA256: number

export declare const errSSLPeerBadCert: number

export declare const errSecOpWr: number

export declare const CSSMOID_Certicom: cssm_data

export declare const errSecIO: number

export declare const errSecDskFull: number

export declare const errSecDiskFull: number

export declare const kSecACLAuthorizationMAC: interop.Pointer

export declare const CSSMOID_CollectivePhysicalDeliveryOfficeName: cssm_data

export declare const CSSM_PVC_SP: number

export declare const CSSM_NET_PROTO_FTPS: number

export declare const kSecAttrProtocolIMAP: interop.Pointer

export declare const CSSMERR_CSP_ACL_BASE_CERTS_NOT_SUPPORTED: number

export declare const errSecKeyUsageIncorrect: number

export declare const CSSMERR_DL_INVALID_ACL_ENTRY_TAG: number

export declare const errSSLPeerDecompressFail: number

export declare const errSecUnsupportedVectorOfBuffers: number

export declare const CSSMERR_TP_CERT_EXPIRED: number

export declare const CSSM_NET_PROTO_FTP: number

export declare const CSSMOID_PhysicalDeliveryOfficeName: cssm_data

export declare const errSSLATSCertificateTrustViolation: number

export declare const CSSM_TP_CRLISSUE_UNKNOWN_IDENTIFIER: number

export declare const CSSM_NOTIFY_FAULT: number

export declare const CSSMOID_EnhancedSearchGuide: cssm_data

export declare const kSecCFErrorGuestAttributes: interop.Pointer

export declare const kSecOIDSerialNumber: interop.Pointer

export declare const kSecKeyAlgorithmECIESEncryptionStandardX963SHA1AESGCM: interop.Pointer

export declare const errSecPathLengthConstraintExceeded: number

export declare const oidExtendedKeyUsageIPSec: DERItem

export declare const CSSM_ALGMODE_ECB: number

export declare const errSecMissingValue: number

export declare const CSSMERR_CSSM_INVALID_CONTEXT_HANDLE: number

export declare const errSSLWouldBlock: number

export declare const CSSMERR_DL_INVALID_ACCESS_CREDENTIALS: number

export declare const CSSM_EVIDENCE_FORM_UNSPECIFIC: number

export declare const CSSM_DL_DB_RECORD_APPLESHARE_PASSWORD: number

export declare const CSSMERR_DL_INVALID_DB_HANDLE: number

export declare const oidOrganizationName: DERItem

export declare const CSSM_APPLECSPDL_DB_CHANGE_PASSWORD: number

export declare const errSecureDownloadInvalidDownload: number

export declare const CSSM_NET_PROTO_X500DAP: number

export declare const kSecKeyAlgorithmECIESEncryptionStandardVariableIVX963SHA224AESGCM: interop.Pointer

export declare const CSSM_CERT_UNKNOWN: number

export declare const CSSMOID_ECDSA_WithSHA256: cssm_data

export declare const kSecKeyAlgorithmECIESEncryptionCofactorX963SHA256AESGCM: interop.Pointer

export declare const CSSM_APPLEFILEDL_DELETE_FILE: number

export declare const errSecCSHostProtocolNotProxy: number

export declare const CSSM_NET_PROTO_LDAPS: number

export declare const kSecACLAuthorizationEncrypt: interop.Pointer

export declare const CSSM_DB_LESS_THAN: number

export declare const CSSM_WORDID_BER: number

export declare const errSecBlockSizeMismatch: number

export declare const CSSM_ACL_SUBJECT_TYPE_ASYMMETRIC_KEY: number

export declare const kSecRevocationPreferCRL: number

export declare const CSSM_ALGID_IBCHASH: number

export declare const CSSMOID_PKCS5_DES_EDE3_CBC: cssm_data

export declare const CSSM_DB_INDEX_NONUNIQUE: number

export declare const CSSM_ATTRIBUTE_EFFECTIVE_BITS: number

export declare const CSSM_WORDID_KEYCHAIN_CHANGE_LOCK: number

export declare const errSecCertificateSuspended: number

export declare const CSSMOID_X509V1CRLRevokedCertificatesStruct: cssm_data

export declare const CSSMERR_CL_SERVICE_NOT_AVAILABLE: number

export declare const kSecTrustRevocationChecked: interop.Pointer

export declare const CSSM_WORDID_INTEL: number

export declare const kSecImportExportAccess: interop.Pointer

export declare const CSSM_WORDID_MAC: number

export declare const CSSM_ERRCODE_ACL_SUBJECT_TYPE_NOT_SUPPORTED: number

export declare const errSecCSInternalError: number

export declare const errSecUnsupportedOperator: number

export declare const errSecIncompleteCertRevocationCheck: number

export declare const CSSM_CSP_TOK_USER_PIN_INITIALIZED: number

export declare const CSSMOID_ServerAuth: cssm_data

export declare const errSecUnknownCRLExtension: number

export declare const kSecTransformErrorAbortInProgress: number

export declare const SSL_NO_SUCH_CIPHERSUITE: number

export declare const CSSM_ATTRIBUTE_DATA_STRING: number

export declare const CSSM_ESTIMATED_TIME_UNKNOWN: number

export declare const CSSMERR_DL_UNSUPPORTED_OPERATOR: number

export declare const kSecCSCalculateCMSDigest: number

export declare const CSSM_ALGMODE_CBCPD: number

export declare const CSSM_TRUE: number

export declare const CSSMOID_APPLE_EXTENSION_APPLEID_SHARING: cssm_data

export declare const CSSMERR_DL_OPERATION_AUTH_DENIED: number

export declare const CSSMOID_ANSI_DH_HYBRID_ONEFLOW: cssm_data

export declare const kSecAttrKeyTypeECSECPrimeRandom: interop.Pointer

export declare const errSecInvalidAttributeEndDate: number

export declare const kSecDecodeTypeAttribute: interop.Pointer

export declare const kSecAttrProtocolIRC: interop.Pointer

export declare const CSSMERR_TP_INVALID_CRLGROUP: number

export declare const CSSM_KEYUSE_VERIFY: number

export declare const errSSLUnexpectedMessage: number

export declare const CSSMERR_APPLETP_INVALID_ROOT: number

export declare const errSSLBadCert: number

export declare const kSecKeyAlgorithmECDHKeyExchangeStandardX963SHA512: interop.Pointer

export declare const CSSM_KEYATTR_RETURN_DATA: number

export declare const CSSMOID_X509V2CRLRevokedEntryNumberOfExtensions: cssm_data

export declare const kSecMatchWidthInsensitive: interop.Pointer

export declare const errSecMissingAttributeOutputSize: number

export declare const CSSM_DB_INDEX_ON_UNKNOWN: number

export declare const CSSM_ALGID_MADRYGA: number

export declare const errSecFunctionIntegrityFail: number

export declare const errSecInvalidQuery: number

export declare const errSecResourceSignBadCertChainLength: number

export declare const CSSM_TP_CERTVERIFY_SUSPENDED: number

export declare const errSSLConnectionRefused: number

export declare const errSecInvalidRecord: number

export declare const errAuthorizationInvalidSet: number

export declare const CSSM_PKCS_OAEP_MGF1_MD5: number

export declare const CSSM_ACL_AUTHORIZATION_DB_READ: number

export declare const kSecAttrSerialNumber: interop.Pointer

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_ALREADY_EXIST: number

export declare const CSSM_TP_CERT_NOTIFY_RENEW: number

export declare const CSSM_TP_CERTISSUE_OK: number

export declare const CSSM_WORDID_PROTECTED_PASSWORD: number

export declare const kSecKeyAlgorithmECDSASignatureMessageX962SHA512: interop.Pointer

export declare const CSSM_PADDING_CIPHERSTEALING: number

export declare const CSSMOID_X509V1IssuerNameCStruct: cssm_data

export declare const CSSMOID_EKU_IPSec: cssm_data

export declare const TLS_ECDHE_RSA_WITH_NULL_SHA: number

export declare const CSSM_ERRCODE_OS_ACCESS_DENIED: number

export declare const CSSM_ALGID_GenericSecret: number

export declare const CSSM_DB_ATTRIBUTE_FORMAT_MULTI_UINT32: number

export declare const TLS_DHE_PSK_WITH_NULL_SHA: number

export declare const CSSMERR_AC_INVALID_ENCODING: number

export declare const CSSM_DB_MODIFY_ATTRIBUTE_ADD: number

export declare const kSecKeyAlgorithmECIESEncryptionStandardX963SHA512AESGCM: interop.Pointer

export declare const errSecCSUnsignedNestedCode: number

export declare const CSSM_WORDID_SHA1WITHECDSA: number

export declare const CSSMERR_CSP_MISSING_ATTR_PUBLIC_KEY_FORMAT: number

export declare const CSSMERR_CSP_SELF_CHECK_FAILED: number

export declare const errSecCreateChainFailed: number

export declare const CSSM_ATTRIBUTE_DESCRIPTION: number

export declare const errSecDuplicateKeychain: number

export declare const SSL_RSA_WITH_3DES_EDE_CBC_MD5: number

export declare const CSSMERR_TP_INVALID_OUTPUT_POINTER: number

export declare const errSecCSRemoteSignerSecondSlotFull: number

export declare const CSSM_TP_STOP_ON_FIRST_PASS: number

export declare const CSSMOID_RoleOccupant: cssm_data

export declare const errSecOCSPResponderSignatureRequired: number

export declare const errSecInvalidBundleInfo: number

export declare const CSSMERR_TP_DEVICE_RESET: number

export declare const CSSM_WORDID__NLU_: number

export declare const kSecACLAuthorizationIntegrity: interop.Pointer

export declare const kSecCSGenerateGuestHash: number

export declare const CSSM_CRL_PARSE_FORMAT_SEXPR: number

export declare const kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly: interop.Pointer

export declare const CSSM_CSP_SOFTWARE: number

export declare const kSecAsn1PointerToNullTemplate: interop.Pointer

export declare const CSSM_ALGMODE_OFB64: number

export declare const errSecCRLServerDown: number

export declare const CSSMERR_DL_INVALID_POINTER: number

export declare const CSSMOID_PKCS3: cssm_data

export declare const CSSM_ALGID_AES: number

export declare const errSecUnsupportedKeyUsageMask: number

export declare const kSecTransformErrorNameAlreadyRegistered: number

export declare const CSSM_WORDID_VENDOR_END: number

export declare const CSSM_ERRCODE_SAMPLE_VALUE_NOT_SUPPORTED: number

export declare const errSecCertificateNotValidYet: number

export declare const CSSM_CRLGROUP_DATA: number

export declare const CSSM_TP_CERTCHANGE_REASON_KEYCOMPROMISE: number

export declare const kSecOIDAPPLE_EXTENSION_ADC_APPLE_SIGNING: interop.Pointer

export declare const CSSM_TP_CRLISSUE_OK: number

export declare const CSSM_ACL_SUBJECT_TYPE_COMMENT: number

export declare const CSSMERR_CL_INVALID_DATA: number

export declare const CSSM_ERRCODE_INSUFFICIENT_CLIENT_IDENTIFICATION: number

export declare const errSecInvalidAddinFunctionTable: number

export declare const CSSM_PADDING_VENDOR_DEFINED: number

export declare const CSSM_WORDID_MD2: number

export declare const CSSMERR_APPLE_DOTMAC_REQ_SERVER_PARAM: number

export declare const CSSMERR_CSP_KEY_HEADER_INCONSISTENT: number

export declare const errSecureDownloadInvalidTicket: number

export declare const CSSMOID_PolicyMappings: cssm_data

export declare const errSecCSReqInvalid: number

export declare const CSSMERR_CSSM_INVALID_GUID: number

export declare const kSecPropertyTypeSuccess: interop.Pointer

export declare const CSSM_KEYBLOB_WRAPPED_FORMAT_OTHER: number

export declare const kSecKeyAlgorithmRSAEncryptionOAEPSHA512AESGCM: interop.Pointer

export declare const gGuidAppleX509TP: cssm_guid

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_15: number

export declare const CSSMOID_DOTMAC_CERT: cssm_data

export declare const TLS_ECDH_ECDSA_WITH_AES_256_CBC_SHA: number

export declare const CSSMERR_CSP_MISSING_ATTR_KEY: number

export declare const CSSM_TP_CERTNOTARIZE_OKWITHSERVICEMODS: number

export declare const kSecOIDNetscapeCertSequence: interop.Pointer

export declare const TLS_RSA_WITH_NULL_SHA: number

export declare const CSSM_DL_MEMORY: number

export declare const CSSMERR_CL_INVALID_FIELD_POINTER: number

export declare const errSSLUnknownPSKIdentity: number

export declare const errSecInvalidIDLinkage: number

export declare const kSecPolicyKU_CRLSign: interop.Pointer

export declare const kSecTrustCertificateTransparency: interop.Pointer

export declare const kSecAttrProtocolHTTP: interop.Pointer

export declare const CSSM_WORDID_PIN: number

export declare const oidMSNTPrincipalName: DERItem

export declare const CSSM_WORDID_RIPEMD160: number

export declare const errSecTimestampBadRequest: number

export declare const errSecCSNotAHost: number

export declare const CSSMERR_CSP_APPLE_INVALID_KEY_START_DATE: number

export declare const CSSMOID_PDA_COUNTRY_RESIDENCE: cssm_data

export declare const CSSM_APPLE_PRIVATE_CSPDL_CODE_13: number

export declare const CSSMOID_X9_62_FieldType: cssm_data

export declare const CSSMERR_DL_ACL_CHALLENGE_CALLBACK_FAILED: number

export declare const CSSMOID_ANSI_MQV2: cssm_data

export declare const oidSha224: DERItem

export declare const kSecPaddingNoneKey: interop.Pointer

export declare const CSSMOID_InvalidityDate: cssm_data

export declare const CSSM_CSP_TOK_LOGIN_REQUIRED: number

export declare const CSSMERR_CSP_INVALID_ATTR_BASE: number

export declare const errSSLPeerDecryptError: number

export declare const CSSM_PRIVILEGE_SCOPE_NONE: number

export declare const CSSM_TP_CERTVERIFY_EXPIRED: number

export declare const errSSLBufferOverflow: number

export declare const CSSM_ERRCODE_INVALID_SAMPLE_VALUE: number

export declare const CSSMOID_NameConstraints: cssm_data

export declare const CSSMERR_TP_INVALID_TUPLEGROUP: number

export declare const CSSMERR_CL_SCOPE_NOT_SUPPORTED: number

export declare const CSSM_ALGID_REDOC3: number

export declare const errSecInvalidHandle: number

export declare const TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256: number

export declare const CSSM_ERRCODE_INVALID_DB_LIST: number

export declare const gGuidAppleSdCSPDL: cssm_guid

export declare const CSSM_ERRCODE_INVALID_ACCESS_CREDENTIALS: number

export declare const errSecCSTooBig: number

export declare const kSecTransformTransformIsExecuting: number

export declare const CSSMERR_CSP_MISSING_ATTR_ACCESS_CREDENTIALS: number

export declare const CSSMERR_CSP_FUNCTION_NOT_IMPLEMENTED: number

export declare const kSecSubjectKeyIdentifierItemAttr: number

export declare const errSecInvalidPrefsDomain: number

export declare const SSL_DH_DSS_WITH_DES_CBC_SHA: number

export declare const kSecPolicyKU_DataEncipherment: interop.Pointer

export declare const kSecOIDX509V1IssuerName: interop.Pointer

export declare const CSSM_ALGID_PKCS12_PBE_MAC: number

export declare const TLS_DH_DSS_WITH_AES_128_CBC_SHA256: number

export declare const CSSMERR_APPLETP_SMIME_EMAIL_ADDRS_NOT_FOUND: number

export declare const CSSM_CERT_BUNDLE_ENCODING_UNKNOWN: number

export declare const CSSM_ATTRIBUTE_KEY_LENGTH_RANGE: number

export declare const kSecOIDX509V1SignatureAlgorithmParameters: interop.Pointer

export declare const errSecCodeSigningNoBasicConstraints: number

export declare const TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA256: number

export declare const CSSM_APPLECSPDL_DB_UNLOCK: number

export declare const errSecRequestLost: number

export declare const kSecKeyAlgorithmRSASignatureDigestPKCS1v15SHA384: interop.Pointer

export declare const kSecAttrProtocolSMTP: interop.Pointer

export declare const errSSLPeerDecryptionFail: number

export declare const kSecAsn1NullTemplate: interop.Pointer

export declare const CSSMERR_CSSM_FUNCTION_FAILED: number

export declare const CSSM_TP_CERTVERIFY_NOT_VALID_YET: number

export declare const TLS_ECDH_ECDSA_WITH_AES_128_CBC_SHA: number

export declare const CSSMOID_UseExemptions: cssm_data

export declare const CSSMOID_EmailProtection: cssm_data

export declare const cssm_appledl_open_parameters_mask: {
	kCSSM_APPLEDL_MASK_MODE: 1
}

export declare const SessionAttributeBits: {
	IsRoot: 1
	HasGraphicAccess: 16
	HasTTY: 32
	IsRemote: 4096
}

export declare const AuthorizationResult: {
	Allow: 0
	Deny: 1
	Undefined: 2
	UserCanceled: 3
}

export declare const __CE_DataType: {
	AuthorityKeyID: 0
	SubjectKeyID: 1
	KeyUsage: 2
	SubjectAltName: 3
	IssuerAltName: 4
	ExtendedKeyUsage: 5
	BasicConstraints: 6
	CertPolicies: 7
	NetscapeCertType: 8
	CrlNumber: 9
	DeltaCrl: 10
	CrlReason: 11
	CrlDistributionPoints: 12
	IssuingDistributionPoint: 13
	AuthorityInfoAccess: 14
	Other: 15
	QC_Statements: 16
	NameConstraints: 17
	PolicyMappings: 18
	PolicyConstraints: 19
	InhibitAnyPolicy: 20
}

export declare const SecKeyUsage: {
	Unspecified: 0
	DigitalSignature: 1
	NonRepudiation: 2
	ContentCommitment: 2
	KeyEncipherment: 4
	DataEncipherment: 8
	KeyAgreement: 16
	KeyCertSign: 32
	CRLSign: 64
	EncipherOnly: 128
	DecipherOnly: 256
	Critical: -2147483648
	All: 2147483647
}

export declare const _SecureDownloadTrustCallbackResult: {
	DoNotEvaluateSigner: 0
	EvaluateSigner: 1
	FailEvaluation: 2
}

export declare const SecPadding: {
	None: 0
	PKCS1: 1
	OAEP: 2
	SigRaw: 16384
	PKCS1MD2: 32768
	PKCS1MD5: 32769
	PKCS1SHA1: 32770
	PKCS1SHA224: 32771
	PKCS1SHA256: 32772
	PKCS1SHA384: 32773
	PKCS1SHA512: 32774
}

export declare const SSLSessionState: {
	Idle: 0
	Handshake: 1
	Connected: 2
	Closed: 3
	Aborted: 4
}

export declare const AuthorizationContextFlags: {
	Extractable: 1
	Volatile: 2
	Sticky: 4
}

export declare const SecCodeSignatureFlags: {
	Host: 1
	Adhoc: 2
	ForceHard: 256
	ForceKill: 512
	ForceExpiration: 1024
	Restrict: 2048
	Enforcement: 4096
	LibraryValidation: 8192
	Runtime: 65536
	LinkerSigned: 131072
}

export declare const SecProtocolType: {
	FTP: 1718906912
	FTPAccount: 1718906977
	HTTP: 1752462448
	IRC: 1769104160
	NNTP: 1852732528
	POP3: 1886351411
	SMTP: 1936553072
	SOCKS: 1936685088
	IMAP: 1768776048
	LDAP: 1818517872
	AppleTalk: 1635019883
	AFP: 1634103328
	Telnet: 1952803950
	SSH: 1936943136
	FTPS: 1718906995
	HTTPS: 1752461427
	HTTPProxy: 1752461432
	HTTPSProxy: 1752462200
	FTPProxy: 1718907000
	CIFS: 1667851891
	SMB: 1936548384
	RTSP: 1920234352
	RTSPProxy: 1920234360
	DAAP: 1684103536
	EPPC: 1701867619
	IPP: 1768976416
	NNTPS: 1853124723
	LDAPS: 1818521715
	TelnetS: 1952803955
	IMAPS: 1768779891
	IRCS: 1769104243
	POP3S: 1886351475
	CVSpserver: 1668707184
	SVN: 1937141280
	Any: 0
}

export declare const SecRequirementType: {
	HostRequirementType: 1
	GuestRequirementType: 2
	DesignatedRequirementType: 3
	LibraryRequirementType: 4
	PluginRequirementType: 5
	InvalidRequirementType: 6
	RequirementTypeCount: 6
}

export declare const SecTrustSettingsResult: {
	Invalid: 0
	TrustRoot: 1
	TrustAsRoot: 2
	Deny: 3
	Unspecified: 4
}

export declare const SecTrustOptionFlags: {
	AllowExpired: 1
	LeafIsCA: 2
	FetchIssuerFromNet: 4
	AllowExpiredRoot: 8
	RequireRevPerCert: 16
	UseTrustSettings: 32
	ImplicitAnchors: 64
}

export declare const SecExternalFormat: {
	Unknown: 0
	OpenSSL: 1
	SSH: 2
	BSAFE: 3
	RawKey: 4
	WrappedPKCS8: 5
	WrappedOpenSSL: 6
	WrappedSSH: 7
	WrappedLSH: 8
	X509Cert: 9
	PEMSequence: 10
	PKCS7: 11
	PKCS12: 12
	NetscapeCertSequence: 13
	SSHv2: 14
}

export declare const SecKeychainEvent: {
	Lock: 1
	Unlock: 2
	Add: 3
	Delete: 4
	Update: 5
	PasswordChanged: 6
	DefaultChanged: 9
	DataAccess: 10
	KeychainListChanged: 11
	TrustSettingsChanged: 12
}

export declare const SecPreferencesDomain: {
	User: 0
	System: 1
	Common: 2
	Dynamic: 3
}

export declare const SSLAuthenticate: {
	Never: 0
	Always: 1
	Try: 2
}

export declare const SecItemImportExportFlags: {
	kSecItemPemArmour: 1
}

export declare const SSLProtocol: {
	SSLProtocolUnknown: 0
	TLSProtocol1: 4
	TLSProtocol11: 7
	TLSProtocol12: 8
	DTLSProtocol1: 9
	TLSProtocol13: 10
	DTLSProtocol12: 11
	TLSProtocolMaxSupported: 999
	SSLProtocol2: 1
	SSLProtocol3: 2
	SSLProtocol3Only: 3
	TLSProtocol1Only: 5
	SSLProtocolAll: 6
}

export declare const __CE_GeneralNameType: {
	OtherName: 0
	RFC822Name: 1
	DNSName: 2
	X400Address: 3
	DirectoryName: 4
	EdiPartyName: 5
	URI: 6
	IPAddress: 7
	RegisteredID: 8
}

export declare const AuthorizationFlags: {
	Defaults: 0
	InteractionAllowed: 1
	ExtendRights: 2
	PartialRights: 4
	DestroyRights: 8
	PreAuthorize: 16
	SkipInternalAuth: 512
	NoData: 1048576
}

export declare const SecTrustResultType: {
	Invalid: 0
	Proceed: 1
	Confirm: 2
	Deny: 3
	Unspecified: 4
	RecoverableTrustFailure: 5
	FatalTrustFailure: 6
	OtherError: 7
}

export declare const SecKeychainEventMask: {
	LockEvent: 2
	UnlockEvent: 4
	AddEvent: 8
	DeleteEvent: 16
	UpdateEvent: 32
	PasswordChangedEvent: 64
	DefaultChangedEvent: 512
	DataAccessEvent: 1024
	KeychainListChanged: 2048
	TrustSettingsChangedEvent: 4096
	EveryEvent: -1
}

export declare const SecTrustSettingsKeyUsage: {
	Signature: 1
	EnDecryptData: 2
	EnDecryptKey: 4
	SignCert: 8
	SignRevocation: 16
	KeyExchange: 32
	Any: -1
}

export declare const SecKeySizes: {
	SecDefaultKeySize: 0
	Sec3DES192: 192
	SecAES128: 128
	SecAES192: 192
	SecAES256: 256
	Secp192r1: 192
	Secp256r1: 256
	Secp384r1: 384
	Secp521r1: 521
	SecRSAMin: 1024
	SecRSAMax: 4096
}

export declare const SecExternalItemType: {
	Unknown: 0
	PrivateKey: 1
	PublicKey: 2
	SessionKey: 3
	Certificate: 4
	Aggregate: 5
}

export declare const extension_data_format: {
	ENCODED: 0
	PARSED: 1
	PAIR: 2
}

export declare const SSLSessionOption: {
	BreakOnServerAuth: 0
	BreakOnCertRequested: 1
	BreakOnClientAuth: 2
	FalseStart: 3
	SendOneByteRecord: 4
	AllowServerIdentityChange: 5
	Fallback: 6
	BreakOnClientHello: 7
	AllowRenegotiation: 8
	EnableSessionTickets: 9
}

export declare const SSLConnectionType: {
	Stream: 0
	Datagram: 1
}

export declare const SecAuthenticationType: {
	NTLM: 1835824238
	MSN: 1634628461
	DPA: 1633775716
	RPA: 1633775730
	HTTPBasic: 1886680168
	HTTPDigest: 1685353576
	HTMLForm: 1836216166
	Default: 1953261156
	Any: 0
}

export declare const SSLClientCertificateState: {
	None: 0
	Requested: 1
	Sent: 2
	Rejected: 3
}

export declare const CMSSignedAttributes: {
	None: 0
	SmimeCapabilities: 1
	SmimeEncryptionKeyPrefs: 2
	SmimeMSEncryptionKeyPrefs: 4
	SigningTime: 8
	AppleCodesigningHashAgility: 16
	AppleCodesigningHashAgilityV2: 32
	AppleExpirationTime: 64
}

export declare const SSLCiphersuiteGroup: {
	Default: 0
	Compatibility: 1
	Legacy: 2
	ATS: 3
	ATSCompatibility: 4
}

export declare const SecCSFlags: {
	DefaultFlags: 0
	ConsiderExpiration: -2147483648
	EnforceRevocationChecks: 1073741824
	NoNetworkAccess: 536870912
	ReportProgress: 268435456
	CheckTrustedAnchors: 134217728
	QuickCheck: 67108864
	ApplyEmbeddedPolicy: 33554432
	StripDisallowedXattrs: 16777216
	MatchGuestRequirementInKernel: 8388608
}

export declare const SSLProtocolSide: {
	Server: 0
	Client: 1
}

export declare const SecTrustSettingsDomain: {
	User: 0
	Admin: 1
	System: 2
}

export declare const SecKeychainPromptSelector: {
	RequirePassphase: 1
	Unsigned: 16
	UnsignedAct: 32
	Invalid: 64
	InvalidAct: 128
}

export declare const SecCodeStatus: {
	Valid: 1
	Hard: 256
	Kill: 512
	Debugged: 268435456
	Platform: 67108864
}

export declare const SecKeyOperationType: {
	Sign: 0
	Verify: 1
	Encrypt: 2
	Decrypt: 3
	KeyExchange: 4
}

export declare const tls_ciphersuite_t: {
	RSA_WITH_3DES_EDE_CBC_SHA: 10
	RSA_WITH_AES_128_CBC_SHA: 47
	RSA_WITH_AES_256_CBC_SHA: 53
	RSA_WITH_AES_128_GCM_SHA256: 156
	RSA_WITH_AES_256_GCM_SHA384: 157
	RSA_WITH_AES_128_CBC_SHA256: 60
	RSA_WITH_AES_256_CBC_SHA256: 61
	ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA: -16376
	ECDHE_ECDSA_WITH_AES_128_CBC_SHA: -16375
	ECDHE_ECDSA_WITH_AES_256_CBC_SHA: -16374
	ECDHE_RSA_WITH_3DES_EDE_CBC_SHA: -16366
	ECDHE_RSA_WITH_AES_128_CBC_SHA: -16365
	ECDHE_RSA_WITH_AES_256_CBC_SHA: -16364
	ECDHE_ECDSA_WITH_AES_128_CBC_SHA256: -16349
	ECDHE_ECDSA_WITH_AES_256_CBC_SHA384: -16348
	ECDHE_RSA_WITH_AES_128_CBC_SHA256: -16345
	ECDHE_RSA_WITH_AES_256_CBC_SHA384: -16344
	ECDHE_ECDSA_WITH_AES_128_GCM_SHA256: -16341
	ECDHE_ECDSA_WITH_AES_256_GCM_SHA384: -16340
	ECDHE_RSA_WITH_AES_128_GCM_SHA256: -16337
	ECDHE_RSA_WITH_AES_256_GCM_SHA384: -16336
	ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256: -13144
	ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256: -13143
	AES_128_GCM_SHA256: 4865
	AES_256_GCM_SHA384: 4866
	CHACHA20_POLY1305_SHA256: 4867
}

export declare const SecCredentialType: {
	Default: 0
	WithUI: 1
	NoUI: 2
}

export declare const SecCSDigestAlgorithm: {
	NoHash: 0
	HashSHA1: 1
	HashSHA256: 2
	HashSHA256Truncated: 3
	HashSHA384: 4
	HashSHA512: 5
}

export declare const SecKeyImportExportFlags: {
	ImportOnlyOne: 1
	SecurePassphrase: 2
	NoAccessControl: 4
}

export declare const SessionCreationFlags: {
	sessionKeepCurrentBootstrap: 32768
}

export declare const tls_protocol_version_t: {
	TLSv10: 769
	TLSv11: 770
	TLSv12: 771
	TLSv13: 772
	DTLSv10: -257
	DTLSv12: -259
}

export declare const SecItemAttr: {
	CreationDateItemAttr: 1667522932
	ModDateItemAttr: 1835295092
	DescriptionItemAttr: 1684370275
	CommentItemAttr: 1768123764
	CreatorItemAttr: 1668445298
	TypeItemAttr: 1954115685
	ScriptCodeItemAttr: 1935897200
	LabelItemAttr: 1818321516
	InvisibleItemAttr: 1768846953
	NegativeItemAttr: 1852139361
	CustomIconItemAttr: 1668641641
	AccountItemAttr: 1633903476
	ServiceItemAttr: 1937138533
	GenericItemAttr: 1734700641
	SecurityDomainItemAttr: 1935961454
	ServerItemAttr: 1936881266
	AuthenticationTypeItemAttr: 1635023216
	PortItemAttr: 1886351988
	PathItemAttr: 1885434984
	VolumeItemAttr: 1986817381
	AddressItemAttr: 1633969266
	SignatureItemAttr: 1936943463
	ProtocolItemAttr: 1886675820
	CertificateType: 1668577648
	CertificateEncoding: 1667591779
	CrlType: 1668445296
	CrlEncoding: 1668443747
	Alias: 1634494835
}

export declare const tls_ciphersuite_group_t: {
	tls_ciphersuite_group_default: 0
	tls_ciphersuite_group_compatibility: 1
	tls_ciphersuite_group_legacy: 2
	tls_ciphersuite_group_ats: 3
	tls_ciphersuite_group_ats_compatibility: 4
}

export declare const SecAccessControlCreateFlags: {
	UserPresence: 1
	BiometryAny: 2
	TouchIDAny: 2
	BiometryCurrentSet: 8
	TouchIDCurrentSet: 8
	DevicePasscode: 16
	Watch: 32
	Or: 16384
	And: 32768
	PrivateKeyUsage: 1073741824
	ApplicationPassword: 2147483648
}

export declare const CMSCertificateChainMode: {
	None: 0
	SignerOnly: 1
	Chain: 2
	ChainWithRoot: 3
	ChainWithRootOrFail: 4
}

export declare const SecTransformMetaAttributeType: {
	Value: 0
	Name: 1
	Ref: 2
	Required: 3
	RequiresOutboundConnection: 4
	Deferred: 5
	Stream: 6
	CanCycle: 7
	Externalize: 8
	HasOutboundConnections: 9
	HasInboundConnection: 10
}

export declare const __CE_CrlDistributionPointNameType: {
	FullName: 0
	NameRelativeToCrlIssuer: 1
}

export declare const CMSSignerStatus: {
	Unsigned: 0
	Valid: 1
	NeedsDetachedContent: 2
	InvalidSignature: 3
	InvalidCert: 4
	InvalidIndex: 5
}

export declare const SecItemClass: {
	InternetPassword: 1768842612
	GenericPassword: 1734700656
	AppleSharePassword: 1634953328
	Certificate: -2147479552
	PublicKey: 15
	PrivateKey: 16
	SymmetricKey: 17
}

export declare class SecAsn1Coder {
	constructor(init?: SecAsn1Coder)
}

export declare class cssm_db_parsing_module_info {
	constructor(init?: cssm_db_parsing_module_info)
	RecordType: number
	ModuleSubserviceUid: cssm_subservice_uid
}

export declare class cssm_kea_derive_params {
	constructor(init?: cssm_kea_derive_params)
	Rb: cssm_data
	Yb: cssm_data
}

export declare class cssm_x509ext_basicConstraints {
	constructor(init?: cssm_x509ext_basicConstraints)
	cA: number
	pathLenConstraintPresent: number
	pathLenConstraint: number
}

export declare class __CE_GeneralNames {
	constructor(init?: __CE_GeneralNames)
	numNames: number
	generalName: interop.Pointer
}

export declare class cssm_guid {
	constructor(init?: cssm_guid)
	Data1: number
	Data2: number
	Data3: number
	Data4: unknown /* const array */
}

export declare class SecAsn1Template_struct {
	constructor(init?: SecAsn1Template_struct)
	kind: number
	offset: number
	sub: interop.Pointer
	size: number
}

export declare class __CE_NameConstraints {
	constructor(init?: __CE_NameConstraints)
	permitted: interop.Pointer
	excluded: interop.Pointer
}

export declare class cssm_x509ext_policyQualifiers {
	constructor(init?: cssm_x509ext_policyQualifiers)
	numberOfPolicyQualifiers: number
	policyQualifier: interop.Pointer
}

export declare class cssm_subservice_uid {
	constructor(init?: cssm_subservice_uid)
	Guid: cssm_guid
	Version: cssm_version
	SubserviceId: number
	SubserviceType: number
}

export declare class cssm_resource_control_context {
	constructor(init?: cssm_resource_control_context)
	AccessCred: interop.Pointer
	InitialAclEntry: cssm_acl_entry_input
}

export declare class cssm_name_list {
	constructor(init?: cssm_name_list)
	NumStrings: number
	String: interop.Pointer
}

export declare class AuthorizationPluginInterface {
	constructor(init?: AuthorizationPluginInterface)
	version: number
	PluginDestroy: (p1: interop.PointerConvertible) => number | null
	MechanismCreate: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: string,
		p4: interop.PointerConvertible,
	) => number | null
	MechanismInvoke: (p1: interop.PointerConvertible) => number | null
	MechanismDeactivate: (p1: interop.PointerConvertible) => number | null
	MechanismDestroy: (p1: interop.PointerConvertible) => number | null
}

export declare class AuthorizationValue {
	constructor(init?: AuthorizationValue)
	length: number
	data: interop.Pointer
}

export declare class cssm_list {
	constructor(init?: cssm_list)
	ListType: number
	Head: interop.Pointer
	Tail: interop.Pointer
}

export declare class SecAsn1PubKeyInfo {
	constructor(init?: SecAsn1PubKeyInfo)
	algorithm: SecAsn1AlgId
	subjectPublicKey: cssm_data
}

export declare class cssm_module_funcs {
	constructor(init?: cssm_module_funcs)
	ServiceType: number
	NumberOfServiceFuncs: number
	ServiceFuncs: interop.Pointer
}

export declare class __SecKey {
	constructor(init?: __SecKey)
}

export declare class __CE_GeneralName {
	constructor(init?: __CE_GeneralName)
	nameType: interop.Enum<typeof __CE_GeneralNameType>
	berEncoded: number
	name: cssm_data
}

export declare class cssm_selection_predicate {
	constructor(init?: cssm_selection_predicate)
	DbOperator: number
	Attribute: cssm_db_attribute_data
}

export declare class x509_validity {
	constructor(init?: x509_validity)
	notBefore: cssm_x509_time
	notAfter: cssm_x509_time
}

export declare class AuthorizationExternalForm {
	constructor(init?: AuthorizationExternalForm)
	bytes: unknown /* const array */
}

export declare class cssm_db_attribute_data {
	constructor(init?: cssm_db_attribute_data)
	Info: cssm_db_attribute_info
	NumberOfValues: number
	Value: interop.Pointer
}

export declare class __SecTrust {
	constructor(init?: __SecTrust)
}

export declare class __CE_ExtendedKeyUsage {
	constructor(init?: __CE_ExtendedKeyUsage)
	numPurposes: number
	purposes: interop.Pointer
}

export declare class __CE_PolicyQualifierInfo {
	constructor(init?: __CE_PolicyQualifierInfo)
	policyQualifierId: cssm_data
	qualifier: cssm_data
}

export declare class cssm_range {
	constructor(init?: cssm_range)
	Min: number
	Max: number
}

export declare class cssm_context {
	constructor(init?: cssm_context)
	ContextType: number
	AlgorithmType: number
	NumberOfAttributes: number
	ContextAttributes: interop.Pointer
	CSPHandle: number
	Privileged: number
	EncryptionProhibited: number
	WorkFactor: number
	Reserved: number
}

export declare class __CE_GeneralSubtree {
	constructor(init?: __CE_GeneralSubtree)
	base: interop.Pointer
	minimum: number
	maximumPresent: number
	maximum: number
}

export declare class OpaqueSecureDownload {
	constructor(init?: OpaqueSecureDownload)
}

export declare class SecKeychainCallbackInfo {
	constructor(init?: SecKeychainCallbackInfo)
	version: number
	item: interop.Object | null
	keychain: interop.Object | null
	pid: number
}

export declare class AuthorizationValueVector {
	constructor(init?: AuthorizationValueVector)
	count: number
	values: interop.Pointer
}

export declare class __SecRequirement {
	constructor(init?: __SecRequirement)
}

export declare class cssm_x509ext_pair {
	constructor(init?: cssm_x509ext_pair)
	tagAndValue: cssm_x509_extensionTagAndValue
	parsedValue: interop.Pointer
}

export declare class cssm_x509_extension {
	constructor(init?: cssm_x509_extension)
	extnId: cssm_data
	critical: number
	format: interop.Enum<typeof extension_data_format>
	value: cssm_x509ext_value
	BERvalue: cssm_data
}

export declare class cssm_crl_pair {
	constructor(init?: cssm_crl_pair)
	EncodedCrl: cssm_encoded_crl
	ParsedCrl: cssm_parsed_crl
}

export declare class __SecPolicy {
	constructor(init?: __SecPolicy)
}

export declare class cssm_csp_operational_statistics {
	constructor(init?: cssm_csp_operational_statistics)
	UserAuthenticated: number
	DeviceFlags: number
	TokenMaxSessionCount: number
	TokenOpenedSessionCount: number
	TokenMaxRWSessionCount: number
	TokenOpenedRWSessionCount: number
	TokenTotalPublicMem: number
	TokenFreePublicMem: number
	TokenTotalPrivateMem: number
	TokenFreePrivateMem: number
}

export declare class cssm_kr_policy_info {
	constructor(init?: cssm_kr_policy_info)
	krbNotAllowed: number
	numberOfEntries: number
	policyEntry: interop.Pointer
}

export declare class cssm_x509_revoked_cert_list {
	constructor(init?: cssm_x509_revoked_cert_list)
	numberOfRevokedCertEntries: number
	revokedCertEntry: interop.Pointer
}

export declare class cssm_tp_certnotarize_output {
	constructor(init?: cssm_tp_certnotarize_output)
	NotarizeStatus: number
	NotarizedCertGroup: interop.Pointer
	PerformedServiceRequests: number
}

export declare class cssm_db_record_attribute_info {
	constructor(init?: cssm_db_record_attribute_info)
	DataRecordType: number
	NumberOfAttributes: number
	AttributeInfo: interop.Pointer
}

export declare class cssm_db_index_info {
	constructor(init?: cssm_db_index_info)
	IndexType: number
	IndexedDataLocation: number
	Info: cssm_db_attribute_info
}

export declare class cssm_state_funcs {
	constructor(init?: cssm_state_funcs)
	cssm_GetAttachFunctions: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	cssm_ReleaseAttachFunctions: (p1: number) => number | null
	cssm_GetAppMemoryFunctions: (p1: number, p2: interop.PointerConvertible) => number | null
	cssm_IsFuncCallValid: (
		p1: number,
		p2: () => void,
		p3: () => void,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	cssm_DeregisterManagerServices: (p1: interop.PointerConvertible) => number | null
	cssm_DeliverModuleManagerEvent: (p1: interop.PointerConvertible) => number | null
}

export declare class cssm_x509_revoked_cert_entry {
	constructor(init?: cssm_x509_revoked_cert_entry)
	certificateSerialNumber: cssm_data
	revocationDate: cssm_x509_time
	extensions: cssm_x509_extensions
}

export declare class __CE_PolicyMappings {
	constructor(init?: __CE_PolicyMappings)
	numPolicyMappings: number
	policyMappings: interop.Pointer
}

export declare class cssm_x509_tbs_certificate {
	constructor(init?: cssm_x509_tbs_certificate)
	version: cssm_data
	serialNumber: cssm_data
	signature: SecAsn1AlgId
	issuer: cssm_x509_name
	validity: x509_validity
	subject: cssm_x509_name
	subjectPublicKeyInfo: SecAsn1PubKeyInfo
	issuerUniqueIdentifier: cssm_data
	subjectUniqueIdentifier: cssm_data
	extensions: cssm_x509_extensions
}

export declare class CSSM_APPLE_TP_CRL_OPTIONS {
	constructor(init?: CSSM_APPLE_TP_CRL_OPTIONS)
	Version: number
	CrlFlags: number
	crlStore: interop.Pointer
}

export declare class cssm_list_element {
	constructor(init?: cssm_list_element)
	NextElement: interop.Pointer
	WordID: number
	ElementType: number
	Element: unnamed_15258739881161876285
}

export declare class cssm_version {
	constructor(init?: cssm_version)
	Major: number
	Minor: number
}

export declare class cssm_crypto_data {
	constructor(init?: cssm_crypto_data)
	Param: cssm_data
	Callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	CallerCtx: interop.Pointer
}

export declare class cssm_x509_signature {
	constructor(init?: cssm_x509_signature)
	algorithmIdentifier: SecAsn1AlgId
	encrypted: cssm_data
}

export declare class cssm_query_size_data {
	constructor(init?: cssm_query_size_data)
	SizeInputBlock: number
	SizeOutputBlock: number
}

export declare class mds_funcs {
	constructor(init?: mds_funcs)
	DbOpen: (
		p1: number,
		p2: string,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	DbClose: (p1: cssm_dl_db_handle) => number | null
	GetDbNames: (p1: number, p2: interop.PointerConvertible) => number | null
	GetDbNameFromHandle: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	FreeNameList: (p1: number, p2: interop.PointerConvertible) => number | null
	DataInsert: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	DataDelete: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	DataModify: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
	DataGetFirst: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	DataGetNext: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	DataAbortQuery: (p1: cssm_dl_db_handle, p2: number) => number | null
	DataGetFromUniqueRecordId: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	FreeUniqueRecord: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	CreateRelation: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: string,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	DestroyRelation: (p1: cssm_dl_db_handle, p2: number) => number | null
}

export declare class OpaqueSecTransformImplementation {
	constructor(init?: OpaqueSecTransformImplementation)
}

export declare class SSLContext {
	constructor(init?: SSLContext)
}

export declare class __OpaqueAuthorizationEngine {
	constructor(init?: __OpaqueAuthorizationEngine)
}

export declare class _CMSDecoder {
	constructor(init?: _CMSDecoder)
}

export declare class cssm_memory_funcs {
	constructor(init?: cssm_memory_funcs)
	malloc_func: (p1: number, p2: interop.PointerConvertible) => interop.Pointer | null
	free_func: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null
	realloc_func: (
		p1: interop.PointerConvertible,
		p2: number,
		p3: interop.PointerConvertible,
	) => interop.Pointer | null
	calloc_func: (p1: number, p2: number, p3: interop.PointerConvertible) => interop.Pointer | null
	AllocRef: interop.Pointer
}

export declare class SecKeychainAttributeInfo {
	constructor(init?: SecKeychainAttributeInfo)
	count: number
	tag: interop.Pointer
	format: interop.Pointer
}

export declare class CSSM_APPLE_CL_CSR_REQUEST {
	constructor(init?: CSSM_APPLE_CL_CSR_REQUEST)
	subjectNameX509: interop.Pointer
	signatureAlg: number
	signatureOid: cssm_data
	cspHand: number
	subjectPublicKey: interop.Pointer
	subjectPrivateKey: interop.Pointer
	challengeString: string | null
}

export declare class CSSM_APPLE_TP_NAME_OID {
	constructor(init?: CSSM_APPLE_TP_NAME_OID)
	string: string | null
	oid: interop.Pointer
}

export declare class SecItemImportExportKeyParameters {
	constructor(init?: SecItemImportExportKeyParameters)
	version: number
	flags: interop.Enum<typeof SecKeyImportExportFlags>
	passphrase: interop.Object | null
	alertTitle: interop.Object | null
	alertPrompt: interop.Object | null
	accessRef: interop.Object | null
	keyUsage: interop.Object | null
	keyAttributes: interop.Object | null
}

export declare class cssm_manager_event_notification {
	constructor(init?: cssm_manager_event_notification)
	DestinationModuleManagerType: number
	SourceModuleManagerType: number
	Event: number
	EventId: number
	EventData: cssm_data
}

export declare class cssm_x509_time {
	constructor(init?: cssm_x509_time)
	timeType: number
	time: cssm_data
}

export declare class cssm_acl_edit {
	constructor(init?: cssm_acl_edit)
	EditMode: number
	OldEntryHandle: number
	NewEntry: interop.Pointer
}

export declare class __CE_BasicConstraints {
	constructor(init?: __CE_BasicConstraints)
	cA: number
	pathLenConstraintPresent: number
	pathLenConstraint: number
}

export declare class __SecKeychainItem {
	constructor(init?: __SecKeychainItem)
}

export declare class cssm_kr_name {
	constructor(init?: cssm_kr_name)
	Type: number
	Length: number
	Name: string | null
}

export declare class __SecCode {
	constructor(init?: __SecCode)
}

export declare class cssm_db_attribute_info {
	constructor(init?: cssm_db_attribute_info)
	AttributeNameFormat: number
	Label: cssm_db_attribute_label
	AttributeFormat: number
}

export declare class CSSM_APPLE_TP_SMIME_OPTIONS {
	constructor(init?: CSSM_APPLE_TP_SMIME_OPTIONS)
	Version: number
	IntendedUsage: number
	SenderEmailLen: number
	SenderEmail: string | null
}

export declare class _CMSEncoder {
	constructor(init?: _CMSEncoder)
}

export declare class cssm_spi_cl_funcs {
	constructor(init?: cssm_spi_cl_funcs)
	CertCreateTemplate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CertGetAllTemplateFields: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CertSign: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	CertVerify: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
	CertVerifyWithKey: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	CertGetFirstFieldValue: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	CertGetNextFieldValue: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	CertAbortQuery: (p1: number, p2: number) => number | null
	CertGetKeyInfo: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	CertGetAllFields: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	FreeFields: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	FreeFieldValue: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	CertCache: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	CertGetFirstCachedFieldValue: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	CertGetNextCachedFieldValue: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CertAbortCache: (p1: number, p2: number) => number | null
	CertGroupToSignedBundle: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CertGroupFromVerifiedBundle: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CertDescribeFormat: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	CrlCreateTemplate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CrlSetFields: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CrlAddCert: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	CrlRemoveCert: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CrlSign: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	CrlVerify: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
	CrlVerifyWithKey: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	IsCertInCrl: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CrlGetFirstFieldValue: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	CrlGetNextFieldValue: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	CrlAbortQuery: (p1: number, p2: number) => number | null
	CrlGetAllFields: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CrlCache: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	IsCertInCachedCrl: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CrlGetFirstCachedFieldValue: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	CrlGetNextCachedFieldValue: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
	) => number | null
	CrlGetAllCachedRecordFields: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CrlAbortCache: (p1: number, p2: number) => number | null
	CrlDescribeFormat: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	PassThrough: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
}

export declare class cssm_db_schema_attribute_info {
	constructor(init?: cssm_db_schema_attribute_info)
	AttributeId: number
	AttributeName: string | null
	AttributeNameID: cssm_data
	DataType: number
}

export declare class cssm_x509ext_policyInfo {
	constructor(init?: cssm_x509ext_policyInfo)
	policyIdentifier: cssm_data
	policyQualifiers: cssm_x509ext_policyQualifiers
}

export declare class cssm_tuplegroup {
	constructor(init?: cssm_tuplegroup)
	NumberOfTuples: number
	Tuples: interop.Pointer
}

export declare class SecKeychainSettings {
	constructor(init?: SecKeychainSettings)
	version: number
	lockOnSleep: number
	useLockInterval: number
	lockInterval: number
}

export declare class cssm_dl_db_list {
	constructor(init?: cssm_dl_db_list)
	NumHandles: number
	DLDBHandle: interop.Pointer
}

export declare class cssm_krsubservice {
	constructor(init?: cssm_krsubservice)
	SubServiceId: number
	Description: string | null
	WrappedProduct: cssm_kr_wrappedproductinfo
}

export declare class cssm_dbinfo {
	constructor(init?: cssm_dbinfo)
	NumberOfRecordTypes: number
	DefaultParsingModules: interop.Pointer
	RecordAttributeNames: interop.Pointer
	RecordIndexes: interop.Pointer
	IsLocal: number
	AccessPath: string | null
	Reserved: interop.Pointer
}

export declare class cssm_encoded_crl {
	constructor(init?: cssm_encoded_crl)
	CrlType: number
	CrlEncoding: number
	CrlBlob: cssm_data
}

export declare class cssm_tp_certverify_input {
	constructor(init?: cssm_tp_certverify_input)
	CLHandle: number
	Cert: interop.Pointer
	VerifyContext: interop.Pointer
}

export declare class __CE_QC_Statements {
	constructor(init?: __CE_QC_Statements)
	numQCStatements: number
	qcStatements: interop.Pointer
}

export declare class __SecPassword {
	constructor(init?: __SecPassword)
}

export declare class cssm_tp_crlissue_output {
	constructor(init?: cssm_tp_crlissue_output)
	IssueStatus: number
	Crl: interop.Pointer
	CrlNextTime: string | null
}

export declare class cssm_tp_verify_context_result {
	constructor(init?: cssm_tp_verify_context_result)
	NumberOfEvidences: number
	Evidence: interop.Pointer
}

export declare class OpaquePolicySearchRef {
	constructor(init?: OpaquePolicySearchRef)
}

export declare class AuthorizationOpaqueRef {
	constructor(init?: AuthorizationOpaqueRef)
}

export declare class cssm_manager_registration_info {
	constructor(init?: cssm_manager_registration_info)
	Initialize: (p1: number, p2: number) => number | null
	Terminate: () => number | null
	RegisterDispatchTable: (p1: interop.PointerConvertible) => number | null
	DeregisterDispatchTable: () => number | null
	EventNotifyManager: (p1: interop.PointerConvertible) => number | null
	RefreshFunctionTable: (p1: interop.PointerConvertible, p2: number) => number | null
}

export declare class cssm_spi_tp_funcs {
	constructor(init?: cssm_spi_tp_funcs)
	SubmitCredRequest: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	RetrieveCredResult: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	ConfirmCredResult: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	ReceiveConfirmation: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CertReclaimKey: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	CertReclaimAbort: (p1: number, p2: number) => number | null
	FormRequest: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: number,
		p4: interop.PointerConvertible,
	) => number | null
	FormSubmit: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	CertGroupVerify: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	CertCreateTemplate: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CertGetAllTemplateFields: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CertSign: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	CrlVerify: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	CrlCreateTemplate: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CertRevoke: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: number,
		p10: interop.PointerConvertible,
	) => number | null
	CertRemoveFromCrlTemplate: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	CrlSign: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	ApplyCrlToDb: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	CertGroupConstruct: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	CertGroupPrune: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	CertGroupToTupleGroup: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	TupleGroupToCertGroup: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	PassThrough: (
		p1: number,
		p2: number,
		p3: number,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
}

export declare class cssm_spi_kr_funcs {
	constructor(init?: cssm_spi_kr_funcs)
	RegistrationRequest: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	RegistrationRetrieve: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	GenerateRecoveryFields: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
	) => number | null
	ProcessRecoveryFields: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
	) => number | null
	RecoveryRequest: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	RecoveryRetrieve: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	GetRecoveredObject: (
		p1: number,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	RecoveryRequestAbort: (p1: number, p2: number) => number | null
	PassThrough: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
}

export declare class cssm_query {
	constructor(init?: cssm_query)
	RecordType: number
	Conjunctive: number
	NumSelectionPredicates: number
	SelectionPredicate: interop.Pointer
	QueryLimits: cssm_query_limits
	QueryFlags: number
}

export declare class cssm_applecspdl_db_settings_parameters {
	constructor(init?: cssm_applecspdl_db_settings_parameters)
	idleTimeout: number
	lockOnSleep: number
}

export declare class cssm_spi_csp_funcs {
	constructor(init?: cssm_spi_csp_funcs)
	EventNotify: (p1: number, p2: number, p3: number, p4: interop.PointerConvertible) => number | null
	QuerySize: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	SignData: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	SignDataInit: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	SignDataUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	SignDataFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	VerifyData: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	VerifyDataInit: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	VerifyDataUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	VerifyDataFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	DigestData: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	DigestDataInit: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	DigestDataUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	DigestDataClone: (p1: number, p2: number, p3: number) => number | null
	DigestDataFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	GenerateMac: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	GenerateMacInit: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	GenerateMacUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	GenerateMacFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	VerifyMac: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
	) => number | null
	VerifyMacInit: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	VerifyMacUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	VerifyMacFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	EncryptData: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: number,
	) => number | null
	EncryptDataInit: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	EncryptDataUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	EncryptDataFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	DecryptData: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
		p7: number,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: number,
	) => number | null
	DecryptDataInit: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	DecryptDataUpdate: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	DecryptDataFinal: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	QueryKeySizeInBits: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	GenerateKey: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: number,
	) => number | null
	GenerateKeyPair: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: number,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: number,
		p9: number,
		p10: interop.PointerConvertible,
		p11: interop.PointerConvertible,
		p12: interop.PointerConvertible,
		p13: number,
	) => number | null
	GenerateRandom: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	GenerateAlgorithmParams: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	WrapKey: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: number,
	) => number | null
	UnwrapKey: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
		p7: number,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: interop.PointerConvertible,
		p11: interop.PointerConvertible,
		p12: number,
	) => number | null
	DeriveKey: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
	) => number | null
	FreeKey: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
	) => number | null
	PassThrough: (
		p1: number,
		p2: number,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	Login: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	Logout: (p1: number) => number | null
	ChangeLoginAcl: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ObtainPrivateKeyFromPublicKey: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	RetrieveUniqueId: (p1: number, p2: interop.PointerConvertible) => number | null
	RetrieveCounter: (p1: number, p2: interop.PointerConvertible) => number | null
	VerifyDevice: (p1: number, p2: interop.PointerConvertible) => number | null
	GetTimeValue: (p1: number, p2: number, p3: interop.PointerConvertible) => number | null
	GetOperationalStatistics: (p1: number, p2: interop.PointerConvertible) => number | null
	GetLoginAcl: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	GetKeyAcl: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	ChangeKeyAcl: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	GetKeyOwner: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	ChangeKeyOwner: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	GetLoginOwner: (p1: number, p2: interop.PointerConvertible) => number | null
	ChangeLoginOwner: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
}

export declare class cssm_upcalls {
	constructor(init?: cssm_upcalls)
	malloc_func: (p1: number, p2: number) => interop.Pointer | null
	free_func: (p1: number, p2: interop.PointerConvertible) => void | null
	realloc_func: (p1: number, p2: interop.PointerConvertible, p3: number) => interop.Pointer | null
	calloc_func: (p1: number, p2: number, p3: number) => interop.Pointer | null
	CcToHandle_func: (p1: number, p2: interop.PointerConvertible) => number | null
	GetModuleInfo_func: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
		p9: interop.PointerConvertible,
		p10: number,
	) => number | null
}

export declare class __SecTask {
	constructor(init?: __SecTask)
}

export declare class CSSM_APPLE_TP_SSL_OPTIONS {
	constructor(init?: CSSM_APPLE_TP_SSL_OPTIONS)
	Version: number
	ServerNameLen: number
	ServerName: string | null
	Flags: number
}

export declare class CSSM_APPLE_TP_CERT_REQUEST {
	constructor(init?: CSSM_APPLE_TP_CERT_REQUEST)
	cspHand: number
	clHand: number
	serialNumber: number
	numSubjectNames: number
	subjectNames: interop.Pointer
	numIssuerNames: number
	issuerNames: interop.Pointer
	issuerNameX509: interop.Pointer
	certPublicKey: interop.Pointer
	issuerPrivateKey: interop.Pointer
	signatureAlg: number
	signatureOid: cssm_data
	notBefore: number
	notAfter: number
	numExtensions: number
	extensions: interop.Pointer
	challengeString: string | null
}

export declare class cssm_applecspdl_db_change_password_parameters {
	constructor(init?: cssm_applecspdl_db_change_password_parameters)
	accessCredentials: interop.Pointer
}

export declare class cssm_appledl_open_parameters {
	constructor(init?: cssm_appledl_open_parameters)
	length: number
	version: number
	autoCommit: number
	mask: number
	mode: number
}

export declare class cssm_acl_keychain_prompt_selector {
	constructor(init?: cssm_acl_keychain_prompt_selector)
	version: number
	flags: number
}

export declare class cssm_evidence {
	constructor(init?: cssm_evidence)
	EvidenceForm: number
	Evidence: interop.Pointer
}

export declare class cssm_acl_process_subject_selector {
	constructor(init?: cssm_acl_process_subject_selector)
	version: number
	mask: number
	uid: number
	gid: number
}

export declare class __CE_DataAndType {
	constructor(init?: __CE_DataAndType)
	type: interop.Enum<typeof __CE_DataType>
	extension: CE_Data
	critical: number
}

export declare class __SecCertificate {
	constructor(init?: __SecCertificate)
}

export declare class __CE_PolicyMapping {
	constructor(init?: __CE_PolicyMapping)
	issuerDomainPolicy: cssm_data
	subjectDomainPolicy: cssm_data
}

export declare class cssm_x509_extensionTagAndValue {
	constructor(init?: cssm_x509_extensionTagAndValue)
	type: number
	value: cssm_data
}

export declare class __CE_GeneralSubtrees {
	constructor(init?: __CE_GeneralSubtrees)
	numSubtrees: number
	subtrees: interop.Pointer
}

export declare class __CE_IssuingDistributionPoint {
	constructor(init?: __CE_IssuingDistributionPoint)
	distPointName: interop.Pointer
	onlyUserCertsPresent: number
	onlyUserCerts: number
	onlyCACertsPresent: number
	onlyCACerts: number
	onlySomeReasonsPresent: number
	onlySomeReasons: number
	indirectCrlPresent: number
	indirectCrl: number
}

export declare class __CE_QC_Statement {
	constructor(init?: __CE_QC_Statement)
	statementId: cssm_data
	semanticsInfo: interop.Pointer
	otherInfo: interop.Pointer
}

export declare class AuthorizationItem {
	constructor(init?: AuthorizationItem)
	name: string | null
	valueLength: number
	value: interop.Pointer
	flags: number
}

export declare class __CE_AuthorityInfoAccess {
	constructor(init?: __CE_AuthorityInfoAccess)
	numAccessDescriptions: number
	accessDescriptions: interop.Pointer
}

export declare class __CE_AccessDescription {
	constructor(init?: __CE_AccessDescription)
	accessMethod: cssm_data
	accessLocation: __CE_GeneralName
}

export declare class __CE_CRLDistributionPoint {
	constructor(init?: __CE_CRLDistributionPoint)
	distPointName: interop.Pointer
	reasonsPresent: number
	reasons: number
	crlIssuer: interop.Pointer
}

export declare class __CE_CertPolicies {
	constructor(init?: __CE_CertPolicies)
	numPolicies: number
	policies: interop.Pointer
}

export declare class __CE_PolicyInformation {
	constructor(init?: __CE_PolicyInformation)
	certPolicyId: cssm_data
	numPolicyQualifiers: number
	policyQualifiers: interop.Pointer
}

export declare class cssm_tp_certissue_input {
	constructor(init?: cssm_tp_certissue_input)
	CSPSubserviceUid: cssm_subservice_uid
	CLHandle: number
	NumberOfTemplateFields: number
	SubjectCertFields: interop.Pointer
	MoreServiceRequests: number
	NumberOfServiceControls: number
	ServiceControls: interop.Pointer
	UserCredentials: interop.Pointer
}

export declare class __CE_AuthorityKeyID {
	constructor(init?: __CE_AuthorityKeyID)
	keyIdentifierPresent: number
	keyIdentifier: cssm_data
	generalNamesPresent: number
	generalNames: interop.Pointer
	serialNumberPresent: number
	serialNumber: cssm_data
}

export declare class __CE_OtherName {
	constructor(init?: __CE_OtherName)
	typeId: cssm_data
	value: cssm_data
}

export declare class __SecRandom {
	constructor(init?: __SecRandom)
}

export declare class cssm_x509_name {
	constructor(init?: cssm_x509_name)
	numberOfRDNs: number
	RelativeDistinguishedName: interop.Pointer
}

export declare class cssm_db_unique_record {
	constructor(init?: cssm_db_unique_record)
	RecordLocator: cssm_db_index_info
	RecordIdentifier: cssm_data
}

export declare class cssm_fieldgroup {
	constructor(init?: cssm_fieldgroup)
	NumberOfFields: number
	Fields: interop.Pointer
}

export declare class cssm_x509_signed_crl {
	constructor(init?: cssm_x509_signed_crl)
	tbsCertList: cssm_x509_tbs_certlist
	signature: cssm_x509_signature
}

export declare class cssm_tp_authority_id {
	constructor(init?: cssm_tp_authority_id)
	AuthorityCert: interop.Pointer
	AuthorityLocation: interop.Pointer
}

export declare class cssm_x509ext_policyQualifierInfo {
	constructor(init?: cssm_x509ext_policyQualifierInfo)
	policyQualifierId: cssm_data
	value: cssm_data
}

export declare class cssm_net_address {
	constructor(init?: cssm_net_address)
	AddressType: number
	Address: cssm_data
}

export declare class cssm_x509_signed_certificate {
	constructor(init?: cssm_x509_signed_certificate)
	certificate: cssm_x509_tbs_certificate
	signature: cssm_x509_signature
}

export declare class cssm_spi_ac_funcs {
	constructor(init?: cssm_spi_ac_funcs)
	AuthCompute: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	PassThrough: (
		p1: number,
		p2: number,
		p3: number,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
}

export declare class cssm_x509_extensions {
	constructor(init?: cssm_x509_extensions)
	numberOfExtensions: number
	extensions: interop.Pointer
}

export declare class AuthorizationCallbacks {
	constructor(init?: AuthorizationCallbacks)
	version: number
	SetResult: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof AuthorizationResult>,
	) => number | null
	RequestInterrupt: (p1: interop.PointerConvertible) => number | null
	DidDeactivate: (p1: interop.PointerConvertible) => number | null
	GetContextValue: (
		p1: interop.PointerConvertible,
		p2: string,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	SetContextValue: (
		p1: interop.PointerConvertible,
		p2: string,
		p3: interop.Enum<typeof AuthorizationContextFlags>,
		p4: interop.PointerConvertible,
	) => number | null
	GetHintValue: (
		p1: interop.PointerConvertible,
		p2: string,
		p3: interop.PointerConvertible,
	) => number | null
	SetHintValue: (
		p1: interop.PointerConvertible,
		p2: string,
		p3: interop.PointerConvertible,
	) => number | null
	GetArguments: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetSessionId: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetImmutableHintValue: (
		p1: interop.PointerConvertible,
		p2: string,
		p3: interop.PointerConvertible,
	) => number | null
	GetLAContext: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null
	GetTokenIdentities: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetTKTokenWatcher: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => number | null
	RemoveHintValue: (p1: interop.PointerConvertible, p2: string) => number | null
	RemoveContextValue: (p1: interop.PointerConvertible, p2: string) => number | null
}

export declare class cssm_x509_rdn {
	constructor(init?: cssm_x509_rdn)
	numberOfPairs: number
	AttributeTypeAndValue: interop.Pointer
}

export declare class cssm_db_schema_index_info {
	constructor(init?: cssm_db_schema_index_info)
	AttributeId: number
	IndexId: number
	IndexType: number
	IndexedDataLocation: number
}

export declare class cssm_dl_pkcs11_attributes {
	constructor(init?: cssm_dl_pkcs11_attributes)
	DeviceAccessFlags: number
}

export declare class cssm_query_limits {
	constructor(init?: cssm_query_limits)
	TimeLimit: number
	SizeLimit: number
}

export declare class cssm_applecspdl_db_is_locked_parameters {
	constructor(init?: cssm_applecspdl_db_is_locked_parameters)
	isLocked: number
}

export declare class cssm_cert_bundle {
	constructor(init?: cssm_cert_bundle)
	BundleHeader: cssm_cert_bundle_header
	Bundle: cssm_data
}

export declare class cssm_func_name_addr {
	constructor(init?: cssm_func_name_addr)
	Name: unknown /* const array */
	Address: () => void | null
}

export declare class cssm_tp_crlissue_input {
	constructor(init?: cssm_tp_crlissue_input)
	CLHandle: number
	CrlIdentifier: number
	CrlThisTime: string | null
	PolicyIdentifier: interop.Pointer
	CallerCredentials: interop.Pointer
}

export declare class cssm_tp_certreclaim_input {
	constructor(init?: cssm_tp_certreclaim_input)
	CLHandle: number
	NumberOfSelectionFields: number
	SelectionFields: interop.Pointer
	UserCredentials: interop.Pointer
}

export declare class cssm_tp_certnotarize_input {
	constructor(init?: cssm_tp_certnotarize_input)
	CLHandle: number
	NumberOfFields: number
	MoreFields: interop.Pointer
	SignScope: interop.Pointer
	ScopeSize: number
	MoreServiceRequests: number
	NumberOfServiceControls: number
	ServiceControls: interop.Pointer
	UserCredentials: interop.Pointer
}

export declare class cssm_tp_certverify_output {
	constructor(init?: cssm_tp_certverify_output)
	VerifyStatus: number
	NumberOfEvidence: number
	Evidence: interop.Pointer
}

export declare class cssm_db_record_index_info {
	constructor(init?: cssm_db_record_index_info)
	DataRecordType: number
	NumberOfIndexes: number
	IndexInfo: interop.Pointer
}

export declare class cssm_tp_certchange_output {
	constructor(init?: cssm_tp_certchange_output)
	ActionStatus: number
	RevokeInfo: cssm_field
}

export declare class cssm_tp_confirm_response {
	constructor(init?: cssm_tp_confirm_response)
	NumberOfResponses: number
	Responses: interop.Pointer
}

export declare class cssm_tp_request_set {
	constructor(init?: cssm_tp_request_set)
	NumberOfRequests: number
	Requests: interop.Pointer
}

export declare class cssm_tp_verify_context {
	constructor(init?: cssm_tp_verify_context)
	Action: number
	ActionData: cssm_data
	Crls: cssm_crlgroup
	Cred: interop.Pointer
}

export declare class cssm_crlgroup {
	constructor(init?: cssm_crlgroup)
	CrlType: number
	CrlEncoding: number
	NumberOfCrls: number
	GroupCrlList: unnamed_7980318924438224609
	CrlGroupType: number
}

export declare class cssm_parsed_crl {
	constructor(init?: cssm_parsed_crl)
	CrlType: number
	ParsedCrlFormat: number
	ParsedCrl: interop.Pointer
}

export declare class cssm_tp_callerauth_context {
	constructor(init?: cssm_tp_callerauth_context)
	Policy: cssm_tp_policyinfo
	VerifyTime: string | null
	VerificationAbortOn: number
	CallbackWithVerifiedCert: (
		p1: number,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	NumberOfAnchorCerts: number
	AnchorCerts: interop.Pointer
	DBList: interop.Pointer
	CallerCredentials: interop.Pointer
}

export declare class cssm_tp_policyinfo {
	constructor(init?: cssm_tp_policyinfo)
	NumberOfPolicyIds: number
	PolicyIds: interop.Pointer
	PolicyControl: interop.Pointer
}

export declare class cssm_field {
	constructor(init?: cssm_field)
	FieldOid: cssm_data
	FieldValue: cssm_data
}

export declare class cssm_pkcs5_pbkdf2_params {
	constructor(init?: cssm_pkcs5_pbkdf2_params)
	Passphrase: cssm_data
	PseudoRandomFunction: number
}

export declare class cssm_base_certs {
	constructor(init?: cssm_base_certs)
	TPHandle: number
	CLHandle: number
	Certs: cssm_certgroup
}

export declare class cssm_pkcs1_oaep_params {
	constructor(init?: cssm_pkcs1_oaep_params)
	HashAlgorithm: number
	HashParams: cssm_data
	MGF: number
	MGFParams: cssm_data
	PSource: number
	PSourceParams: cssm_data
}

export declare class cssm_kr_profile {
	constructor(init?: cssm_kr_profile)
	UserName: cssm_kr_name
	UserCertificate: interop.Pointer
	KRSCertChain: interop.Pointer
	LE_KRANum: number
	LE_KRACertChainList: interop.Pointer
	ENT_KRANum: number
	ENT_KRACertChainList: interop.Pointer
	INDIV_KRANum: number
	INDIV_KRACertChainList: interop.Pointer
	INDIV_AuthenticationInfo: interop.Pointer
	KRSPFlags: number
	KRSPExtensions: interop.Pointer
}

export declare class cssm_context_attribute {
	constructor(init?: cssm_context_attribute)
	AttributeType: number
	AttributeLength: number
	Attribute: cssm_context_attribute_value
}

export declare class __CE_CRLDistPointsSyntax {
	constructor(init?: __CE_CRLDistPointsSyntax)
	numDistPoints: number
	distPoints: interop.Pointer
}

export declare class cssm_dl_db_handle {
	constructor(init?: cssm_dl_db_handle)
	DLHandle: number
	DBHandle: number
}

export declare class cssm_key {
	constructor(init?: cssm_key)
	KeyHeader: cssm_keyheader
	KeyData: cssm_data
}

export declare class __CE_SemanticsInformation {
	constructor(init?: __CE_SemanticsInformation)
	semanticsIdentifier: interop.Pointer
	nameRegistrationAuthorities: interop.Pointer
}

export declare class cssm_access_credentials {
	constructor(init?: cssm_access_credentials)
	EntryTag: unknown /* const array */
	BaseCerts: cssm_base_certs
	Samples: cssm_samplegroup
	Callback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CallerCtx: interop.Pointer
}

export declare class cssm_parsed_cert {
	constructor(init?: cssm_parsed_cert)
	CertType: number
	ParsedCertFormat: number
	ParsedCert: interop.Pointer
}

export declare class cssm_encoded_cert {
	constructor(init?: cssm_encoded_cert)
	CertType: number
	CertEncoding: number
	CertBlob: cssm_data
}

export declare class CSSM_TUPLE {
	constructor(init?: CSSM_TUPLE)
	Issuer: cssm_list
	Subject: cssm_list
	Delegate: number
	AuthorizationTag: cssm_list
	ValidityPeriod: cssm_list
}

export declare class cssm_spi_dl_funcs {
	constructor(init?: cssm_spi_dl_funcs)
	DbOpen: (
		p1: number,
		p2: string,
		p3: interop.PointerConvertible,
		p4: number,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
	) => number | null
	DbClose: (p1: cssm_dl_db_handle) => number | null
	DbCreate: (
		p1: number,
		p2: string,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: number,
		p6: interop.PointerConvertible,
		p7: interop.PointerConvertible,
		p8: interop.PointerConvertible,
	) => number | null
	DbDelete: (
		p1: number,
		p2: string,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CreateRelation: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: string,
		p4: number,
		p5: interop.PointerConvertible,
		p6: number,
		p7: interop.PointerConvertible,
	) => number | null
	DestroyRelation: (p1: cssm_dl_db_handle, p2: number) => number | null
	Authenticate: (p1: cssm_dl_db_handle, p2: number, p3: interop.PointerConvertible) => number | null
	GetDbAcl: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	ChangeDbAcl: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetDbOwner: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	ChangeDbOwner: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number | null
	GetDbNames: (p1: number, p2: interop.PointerConvertible) => number | null
	GetDbNameFromHandle: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	FreeNameList: (p1: number, p2: interop.PointerConvertible) => number | null
	DataInsert: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	DataDelete: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	DataModify: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: number,
	) => number | null
	DataGetFirst: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
		p6: interop.PointerConvertible,
	) => number | null
	DataGetNext: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
		p5: interop.PointerConvertible,
	) => number | null
	DataAbortQuery: (p1: cssm_dl_db_handle, p2: number) => number | null
	DataGetFromUniqueRecordId: (
		p1: cssm_dl_db_handle,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	FreeUniqueRecord: (p1: cssm_dl_db_handle, p2: interop.PointerConvertible) => number | null
	PassThrough: (
		p1: cssm_dl_db_handle,
		p2: number,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
}

export declare class __SecKeychainSearch {
	constructor(init?: __SecKeychainSearch)
}

export declare class cssm_data {
	constructor(init?: cssm_data)
	Length: number
	Data: interop.Pointer
}

export declare class __SecACL {
	constructor(init?: __SecACL)
}

export declare class __SecAccess {
	constructor(init?: __SecAccess)
}

export declare class SecKeychainAttributeList {
	constructor(init?: SecKeychainAttributeList)
	count: number
	attr: interop.Pointer
}

export declare class __SecKeychain {
	constructor(init?: __SecKeychain)
}

export declare class __SecAccessControl {
	constructor(init?: __SecAccessControl)
}

export declare class __SecIdentity {
	constructor(init?: __SecIdentity)
}

export declare class CSSM_TP_APPLE_EVIDENCE_HEADER {
	constructor(init?: CSSM_TP_APPLE_EVIDENCE_HEADER)
	Version: number
}

export declare class cssm_tp_certchange_input {
	constructor(init?: cssm_tp_certchange_input)
	Action: number
	Reason: number
	CLHandle: number
	Cert: interop.Pointer
	ChangeInfo: interop.Pointer
	StartTime: string | null
	CallerCredentials: interop.Pointer
}

export declare class cssm_tp_result_set {
	constructor(init?: cssm_tp_result_set)
	NumberOfResults: number
	Results: interop.Pointer
}

export declare class cssm_x509_tbs_certlist {
	constructor(init?: cssm_x509_tbs_certlist)
	version: cssm_data
	signature: SecAsn1AlgId
	issuer: cssm_x509_name
	thisUpdate: cssm_x509_time
	nextUpdate: cssm_x509_time
	revokedCertificates: interop.Pointer
	extensions: cssm_x509_extensions
}

export declare class cssm_key_size {
	constructor(init?: cssm_key_size)
	LogicalKeySizeInBits: number
	EffectiveKeySizeInBits: number
}

export declare class kr_policy_list_item {
	constructor(init?: kr_policy_list_item)
}

export declare class SecAsn1AlgId {
	constructor(init?: SecAsn1AlgId)
	algorithm: cssm_data
	parameters: cssm_data
}

export declare class cssm_x509_type_value_pair {
	constructor(init?: cssm_x509_type_value_pair)
	type: cssm_data
	valueType: number
	value: cssm_data
}

export declare class cssm_date {
	constructor(init?: cssm_date)
	Year: unknown /* const array */
	Month: unknown /* const array */
	Day: unknown /* const array */
}

export declare class __CE_DistributionPointName {
	constructor(init?: __CE_DistributionPointName)
	nameType: interop.Enum<typeof __CE_CrlDistributionPointNameType>
	dpn: unnamed_14832579640269053219
}

export declare class cssm_cert_pair {
	constructor(init?: cssm_cert_pair)
	EncodedCert: cssm_encoded_cert
	ParsedCert: cssm_parsed_cert
}

export declare class cssm_pkcs5_pbkdf1_params {
	constructor(init?: cssm_pkcs5_pbkdf1_params)
	Passphrase: cssm_data
	InitVector: cssm_data
}

export declare class cssm_kr_policy_list_item {
	constructor(init?: cssm_kr_policy_list_item)
	next: interop.Pointer
	AlgorithmId: number
	Mode: number
	MaxKeyLength: number
	MaxRounds: number
	WorkFactor: number
	PolicyFlags: number
	AlgClass: number
}

export declare class cssm_db_record_attribute_data {
	constructor(init?: cssm_db_record_attribute_data)
	DataRecordType: number
	SemanticInformation: number
	NumberOfAttributes: number
	AttributeData: interop.Pointer
}

export declare class __SecTrustedApplication {
	constructor(init?: __SecTrustedApplication)
}

export declare class cssm_keyheader {
	constructor(init?: cssm_keyheader)
	HeaderVersion: number
	CspId: cssm_guid
	BlobType: number
	Format: number
	AlgorithmId: number
	KeyClass: number
	LogicalKeySizeInBits: number
	KeyAttr: number
	KeyUsage: number
	StartDate: cssm_date
	EndDate: cssm_date
	WrapAlgorithmId: number
	WrapMode: number
	Reserved: number
}

export declare class cssm_acl_validity_period {
	constructor(init?: cssm_acl_validity_period)
	StartDate: cssm_data
	EndDate: cssm_data
}

export declare class cssm_certgroup {
	constructor(init?: cssm_certgroup)
	CertType: number
	CertEncoding: number
	NumCerts: number
	GroupList: unnamed_6461885391313129559
	CertGroupType: number
	Reserved: interop.Pointer
}

export declare class cssm_acl_entry_info {
	constructor(init?: cssm_acl_entry_info)
	EntryPublicInfo: cssm_acl_entry_prototype
	EntryHandle: number
}

export declare class CSSM_APPLE_TP_ACTION_DATA {
	constructor(init?: CSSM_APPLE_TP_ACTION_DATA)
	Version: number
	ActionFlags: number
}

export declare class OpaqueSecIdentitySearchRef {
	constructor(init?: OpaqueSecIdentitySearchRef)
}

export declare class __CE_PolicyConstraints {
	constructor(init?: __CE_PolicyConstraints)
	requireExplicitPolicyPresent: number
	requireExplicitPolicy: number
	inhibitPolicyMappingPresent: number
	inhibitPolicyMapping: number
}

export declare class AuthorizationItemSet {
	constructor(init?: AuthorizationItemSet)
	count: number
	items: interop.Pointer
}

export declare class cssm_samplegroup {
	constructor(init?: cssm_samplegroup)
	NumberOfSamples: number
	Samples: interop.Pointer
}

export declare class cssm_kr_wrappedproductinfo {
	constructor(init?: cssm_kr_wrappedproductinfo)
	StandardVersion: cssm_version
	StandardDescription: unknown /* const array */
	ProductVersion: cssm_version
	ProductDescription: unknown /* const array */
	ProductVendor: unknown /* const array */
	ProductFlags: number
}

export declare class cssm_acl_owner_prototype {
	constructor(init?: cssm_acl_owner_prototype)
	TypedSubject: cssm_list
	Delegate: number
}

export declare class SecKeychainAttribute {
	constructor(init?: SecKeychainAttribute)
	tag: number
	length: number
	data: interop.Pointer
}

export declare class cssm_acl_entry_input {
	constructor(init?: cssm_acl_entry_input)
	Prototype: cssm_acl_entry_prototype
	Callback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
		p4: interop.PointerConvertible,
	) => number | null
	CallerContext: interop.Pointer
}

export declare class cssm_authorizationgroup {
	constructor(init?: cssm_authorizationgroup)
	NumberOfAuthTags: number
	AuthTags: interop.Pointer
}

export declare class cssm_sample {
	constructor(init?: cssm_sample)
	TypedSample: cssm_list
	Verifier: interop.Pointer
}

export declare class cssm_tp_certreclaim_output {
	constructor(init?: cssm_tp_certreclaim_output)
	ReclaimStatus: number
	ReclaimedCertGroup: interop.Pointer
	KeyCacheHandle: number
}

export declare class CSSM_TP_APPLE_EVIDENCE_INFO {
	constructor(init?: CSSM_TP_APPLE_EVIDENCE_INFO)
	StatusBits: number
	NumStatusCodes: number
	StatusCodes: interop.Pointer
	Index: number
	DlDbHandle: cssm_dl_db_handle
	UniqueRecord: interop.Pointer
}

export declare class cssm_cert_bundle_header {
	constructor(init?: cssm_cert_bundle_header)
	BundleType: number
	BundleEncoding: number
}

export declare class cssm_tp_certissue_output {
	constructor(init?: cssm_tp_certissue_output)
	IssueStatus: number
	CertGroup: interop.Pointer
	PerformedServiceRequests: number
}

export declare class cssm_acl_entry_prototype {
	constructor(init?: cssm_acl_entry_prototype)
	TypedSubject: cssm_list
	Delegate: number
	Authorization: cssm_authorizationgroup
	TimeRange: cssm_acl_validity_period
	EntryTag: unknown /* const array */
}

export declare class SecKeyImportExportParameters {
	constructor(init?: SecKeyImportExportParameters)
	version: number
	flags: interop.Enum<typeof SecKeyImportExportFlags>
	passphrase: interop.Object | null
	alertTitle: interop.Object | null
	alertPrompt: interop.Object | null
	accessRef: interop.Object | null
	keyUsage: number
	keyAttributes: number
}

export type unnamed_7980318924438224609Descriptor =
	| { CrlList: interop.PointerConvertible }
	| { EncodedCrlList: interop.PointerConvertible }
	| { ParsedCrlList: interop.PointerConvertible }
	| { PairCrlList: interop.PointerConvertible }

export declare class unnamed_7980318924438224609 {
	constructor(init?: unnamed_7980318924438224609Descriptor)
	CrlList: interop.Pointer
	EncodedCrlList: interop.Pointer
	ParsedCrlList: interop.Pointer
	PairCrlList: interop.Pointer
}

export type cssm_x509ext_valueDescriptor =
	| { tagAndValue: interop.PointerConvertible }
	| { parsedValue: interop.PointerConvertible }
	| { valuePair: interop.PointerConvertible }

export declare class cssm_x509ext_value {
	constructor(init?: cssm_x509ext_valueDescriptor)
	tagAndValue: interop.Pointer
	parsedValue: interop.Pointer
	valuePair: interop.Pointer
}

export type CE_DataDescriptor =
	| { authorityKeyID: __CE_AuthorityKeyID }
	| { subjectKeyID: cssm_data }
	| { keyUsage: number }
	| { subjectAltName: __CE_GeneralNames }
	| { issuerAltName: __CE_GeneralNames }
	| { extendedKeyUsage: __CE_ExtendedKeyUsage }
	| { basicConstraints: __CE_BasicConstraints }
	| { certPolicies: __CE_CertPolicies }
	| { netscapeCertType: number }
	| { crlNumber: number }
	| { deltaCrl: number }
	| { crlReason: number }
	| { crlDistPoints: __CE_CRLDistPointsSyntax }
	| { issuingDistPoint: __CE_IssuingDistributionPoint }
	| { authorityInfoAccess: __CE_AuthorityInfoAccess }
	| { qualifiedCertStatements: __CE_QC_Statements }
	| { nameConstraints: __CE_NameConstraints }
	| { policyMappings: __CE_PolicyMappings }
	| { policyConstraints: __CE_PolicyConstraints }
	| { inhibitAnyPolicy: number }
	| { rawData: cssm_data }

export declare class CE_Data {
	constructor(init?: CE_DataDescriptor)
	authorityKeyID: __CE_AuthorityKeyID
	subjectKeyID: cssm_data
	keyUsage: number
	subjectAltName: __CE_GeneralNames
	issuerAltName: __CE_GeneralNames
	extendedKeyUsage: __CE_ExtendedKeyUsage
	basicConstraints: __CE_BasicConstraints
	certPolicies: __CE_CertPolicies
	netscapeCertType: number
	crlNumber: number
	deltaCrl: number
	crlReason: number
	crlDistPoints: __CE_CRLDistPointsSyntax
	issuingDistPoint: __CE_IssuingDistributionPoint
	authorityInfoAccess: __CE_AuthorityInfoAccess
	qualifiedCertStatements: __CE_QC_Statements
	nameConstraints: __CE_NameConstraints
	policyMappings: __CE_PolicyMappings
	policyConstraints: __CE_PolicyConstraints
	inhibitAnyPolicy: number
	rawData: cssm_data
}

export type unnamed_14832579640269053219Descriptor =
	| { fullName: interop.PointerConvertible }
	| { rdn: interop.PointerConvertible }

export declare class unnamed_14832579640269053219 {
	constructor(init?: unnamed_14832579640269053219Descriptor)
	fullName: interop.Pointer
	rdn: interop.Pointer
}

export type cssm_db_attribute_labelDescriptor =
	| { AttributeName: string | null }
	| { AttributeOID: cssm_data }
	| { AttributeID: number }

export declare class cssm_db_attribute_label {
	constructor(init?: cssm_db_attribute_labelDescriptor)
	AttributeName: string | null
	AttributeOID: cssm_data
	AttributeID: number
}

export type unnamed_6461885391313129559Descriptor =
	| { CertList: interop.PointerConvertible }
	| { EncodedCertList: interop.PointerConvertible }
	| { ParsedCertList: interop.PointerConvertible }
	| { PairCertList: interop.PointerConvertible }

export declare class unnamed_6461885391313129559 {
	constructor(init?: unnamed_6461885391313129559Descriptor)
	CertList: interop.Pointer
	EncodedCertList: interop.Pointer
	ParsedCertList: interop.Pointer
	PairCertList: interop.Pointer
}

export type unnamed_15258739881161876285Descriptor = { Sublist: cssm_list } | { Word: cssm_data }

export declare class unnamed_15258739881161876285 {
	constructor(init?: unnamed_15258739881161876285Descriptor)
	Sublist: cssm_list
	Word: cssm_data
}

export type cssm_context_attribute_valueDescriptor =
	| { String: string | null }
	| { Uint32: number }
	| { AccessCredentials: interop.PointerConvertible }
	| { Key: interop.PointerConvertible }
	| { Data: interop.PointerConvertible }
	| { Padding: number }
	| { Date: interop.PointerConvertible }
	| { Range: interop.PointerConvertible }
	| { CryptoData: interop.PointerConvertible }
	| { Version: interop.PointerConvertible }
	| { DLDBHandle: interop.PointerConvertible }
	| { KRProfile: interop.PointerConvertible }

export declare class cssm_context_attribute_value {
	constructor(init?: cssm_context_attribute_valueDescriptor)
	String: string | null
	Uint32: number
	AccessCredentials: interop.Pointer
	Key: interop.Pointer
	Data: interop.Pointer
	Padding: number
	Date: interop.Pointer
	Range: interop.Pointer
	CryptoData: interop.Pointer
	Version: interop.Pointer
	DLDBHandle: interop.Pointer
	KRProfile: interop.Pointer
}

export declare function SecCopyErrorMessageString(
	status: number,
	reserved: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateGetTypeID(): number

export declare function SecCertificateCreateWithData(
	allocator: interop.Object,
	data: interop.Object,
): interop.Object

export declare function SecCertificateCopyData(certificate: interop.Object): interop.Object

export declare function SecCertificateCopySubjectSummary(
	certificate: interop.Object,
): interop.Object

export declare function SecCertificateCopyCommonName(
	certificate: interop.Object,
	commonName: interop.PointerConvertible,
): number

export declare function SecCertificateCopyEmailAddresses(
	certificate: interop.Object,
	emailAddresses: interop.PointerConvertible,
): number

export declare function SecCertificateCopyNormalizedIssuerSequence(
	certificate: interop.Object,
): interop.Object

export declare function SecCertificateCopyNormalizedSubjectSequence(
	certificate: interop.Object,
): interop.Object

export declare function SecCertificateCopyKey(certificate: interop.Object): interop.Object

export declare function SecCertificateCopyPublicKey(
	certificate: interop.Object,
	key: interop.PointerConvertible,
): number

export declare function SecCertificateCopySerialNumberData(
	certificate: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateCopySerialNumber(
	certificate: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateCreateFromData(
	data: interop.PointerConvertible,
	type: number,
	encoding: number,
	certificate: interop.PointerConvertible,
): number

export declare function SecCertificateAddToKeychain(
	certificate: interop.Object,
	keychain: interop.Object,
): number

export declare function SecCertificateGetData(
	certificate: interop.Object,
	data: interop.PointerConvertible,
): number

export declare function SecCertificateGetType(
	certificate: interop.Object,
	certificateType: interop.PointerConvertible,
): number

export declare function SecCertificateGetSubject(
	certificate: interop.Object,
	subject: interop.PointerConvertible,
): number

export declare function SecCertificateGetIssuer(
	certificate: interop.Object,
	issuer: interop.PointerConvertible,
): number

export declare function SecCertificateGetCLHandle(
	certificate: interop.Object,
	clHandle: interop.PointerConvertible,
): number

export declare function SecCertificateGetAlgorithmID(
	certificate: interop.Object,
	algid: interop.PointerConvertible,
): number

export declare function SecCertificateCopyPreference(
	name: interop.Object,
	keyUsage: number,
	certificate: interop.PointerConvertible,
): number

export declare function SecCertificateCopyPreferred(
	name: interop.Object,
	keyUsage: interop.Object,
): interop.Object

export declare function SecCertificateSetPreference(
	certificate: interop.Object,
	name: interop.Object,
	keyUsage: number,
	date: interop.Object,
): number

export declare function SecCertificateSetPreferred(
	certificate: interop.Object,
	name: interop.Object,
	keyUsage: interop.Object,
): number

export declare function SecCertificateCopyValues(
	certificate: interop.Object,
	keys: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateCopyLongDescription(
	alloc: interop.Object,
	certificate: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateCopyShortDescription(
	alloc: interop.Object,
	certificate: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateCopyNormalizedIssuerContent(
	certificate: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecCertificateCopyNormalizedSubjectContent(
	certificate: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecIdentityGetTypeID(): number

export declare function SecIdentityCreate(
	allocator: interop.Object,
	certificate: interop.Object,
	privateKey: interop.Object,
): interop.Object

export declare function SecIdentityCreateWithCertificate(
	keychainOrArray: interop.Object,
	certificateRef: interop.Object,
	identityRef: interop.PointerConvertible,
): number

export declare function SecIdentityCopyCertificate(
	identityRef: interop.Object,
	certificateRef: interop.PointerConvertible,
): number

export declare function SecIdentityCopyPrivateKey(
	identityRef: interop.Object,
	privateKeyRef: interop.PointerConvertible,
): number

export declare function SecIdentityCopyPreference(
	name: interop.Object,
	keyUsage: number,
	validIssuers: interop.Object,
	identity: interop.PointerConvertible,
): number

export declare function SecIdentityCopyPreferred(
	name: interop.Object,
	keyUsage: interop.Object,
	validIssuers: interop.Object,
): interop.Object

export declare function SecIdentitySetPreference(
	identity: interop.Object,
	name: interop.Object,
	keyUsage: number,
): number

export declare function SecIdentitySetPreferred(
	identity: interop.Object,
	name: interop.Object,
	keyUsage: interop.Object,
): number

export declare function SecIdentityCopySystemIdentity(
	domain: interop.Object,
	idRef: interop.PointerConvertible,
	actualDomain: interop.PointerConvertible,
): number

export declare function SecIdentitySetSystemIdentity(
	domain: interop.Object,
	idRef: interop.Object,
): number

export declare function SecAccessControlGetTypeID(): number

export declare function SecAccessControlCreateWithFlags(
	allocator: interop.Object,
	protection: interop.Object,
	flags: interop.Enum<typeof SecAccessControlCreateFlags>,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecItemCopyMatching(
	query: interop.Object,
	result: interop.PointerConvertible,
): number

export declare function SecItemAdd(
	attributes: interop.Object,
	result: interop.PointerConvertible,
): number

export declare function SecItemUpdate(
	query: interop.Object,
	attributesToUpdate: interop.Object,
): number

export declare function SecItemDelete(query: interop.Object): number

export declare function SecAccessGetTypeID(): number

export declare function SecAccessCreate(
	descriptor: interop.Object,
	trustedlist: interop.Object,
	accessRef: interop.PointerConvertible,
): number

export declare function SecAccessCreateFromOwnerAndACL(
	owner: interop.PointerConvertible,
	aclCount: number,
	acls: interop.PointerConvertible,
	accessRef: interop.PointerConvertible,
): number

export declare function SecAccessCreateWithOwnerAndACL(
	userId: number,
	groupId: number,
	ownerType: number,
	acls: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecAccessGetOwnerAndACL(
	accessRef: interop.Object,
	owner: interop.PointerConvertible,
	aclCount: interop.PointerConvertible,
	acls: interop.PointerConvertible,
): number

export declare function SecAccessCopyOwnerAndACL(
	accessRef: interop.Object,
	userId: interop.PointerConvertible,
	groupId: interop.PointerConvertible,
	ownerType: interop.PointerConvertible,
	aclList: interop.PointerConvertible,
): number

export declare function SecAccessCopyACLList(
	accessRef: interop.Object,
	aclList: interop.PointerConvertible,
): number

export declare function SecAccessCopySelectedACLList(
	accessRef: interop.Object,
	action: number,
	aclList: interop.PointerConvertible,
): number

export declare function SecAccessCopyMatchingACLList(
	accessRef: interop.Object,
	authorizationTag: interop.Object,
): interop.Object

export declare function SecKeyGetTypeID(): number

export declare function SecKeyCreatePair(
	keychainRef: interop.Object,
	algorithm: number,
	keySizeInBits: number,
	contextHandle: number,
	publicKeyUsage: number,
	publicKeyAttr: number,
	privateKeyUsage: number,
	privateKeyAttr: number,
	initialAccess: interop.Object,
	publicKey: interop.PointerConvertible,
	privateKey: interop.PointerConvertible,
): number

export declare function SecKeyGenerate(
	keychainRef: interop.Object,
	algorithm: number,
	keySizeInBits: number,
	contextHandle: number,
	keyUsage: number,
	keyAttr: number,
	initialAccess: interop.Object,
	keyRef: interop.PointerConvertible,
): number

export declare function SecKeyGetCSSMKey(
	key: interop.Object,
	cssmKey: interop.PointerConvertible,
): number

export declare function SecKeyGetCSPHandle(
	keyRef: interop.Object,
	cspHandle: interop.PointerConvertible,
): number

export declare function SecKeyGetCredentials(
	keyRef: interop.Object,
	operation: number,
	credentialType: interop.Enum<typeof SecCredentialType>,
	outCredentials: interop.PointerConvertible,
): number

export declare function SecKeyGenerateSymmetric(
	parameters: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyCreateFromData(
	parameters: interop.Object,
	keyData: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyGeneratePairAsync(
	parameters: interop.Object,
	deliveryQueue: NSObject,
	result: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void,
): void

export declare function SecKeyDeriveFromPassword(
	password: interop.Object,
	parameters: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyWrapSymmetric(
	keyToWrap: interop.Object,
	wrappingKey: interop.Object,
	parameters: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyUnwrapSymmetric(
	keyToUnwrap: interop.PointerConvertible,
	unwrappingKey: interop.Object,
	parameters: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyGeneratePair(
	parameters: interop.Object,
	publicKey: interop.PointerConvertible,
	privateKey: interop.PointerConvertible,
): number

export declare function SecKeyCreateRandomKey(
	parameters: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyCreateWithData(
	keyData: interop.Object,
	attributes: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyGetBlockSize(key: interop.Object): number

export declare function SecKeyCopyExternalRepresentation(
	key: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyCopyAttributes(key: interop.Object): interop.Object

export declare function SecKeyCopyPublicKey(key: interop.Object): interop.Object

export declare function SecKeyCreateSignature(
	key: interop.Object,
	algorithm: interop.PointerConvertible,
	dataToSign: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyVerifySignature(
	key: interop.Object,
	algorithm: interop.PointerConvertible,
	signedData: interop.Object,
	signature: interop.Object,
	error: interop.PointerConvertible,
): number

export declare function SecKeyCreateEncryptedData(
	key: interop.Object,
	algorithm: interop.PointerConvertible,
	plaintext: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyCreateDecryptedData(
	key: interop.Object,
	algorithm: interop.PointerConvertible,
	ciphertext: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyCopyKeyExchangeResult(
	privateKey: interop.Object,
	algorithm: interop.PointerConvertible,
	publicKey: interop.Object,
	parameters: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecKeyIsAlgorithmSupported(
	key: interop.Object,
	operation: interop.Enum<typeof SecKeyOperationType>,
	algorithm: interop.PointerConvertible,
): number

export declare function SecPolicyGetTypeID(): number

export declare function SecPolicyCopyProperties(policyRef: interop.Object): interop.Object

export declare function SecPolicyCreateBasicX509(): interop.Object

export declare function SecPolicyCreateSSL(server: number, hostname: interop.Object): interop.Object

export declare function SecPolicyCreateRevocation(revocationFlags: number): interop.Object

export declare function SecPolicyCreateWithProperties(
	policyIdentifier: interop.Object,
	properties: interop.Object,
): interop.Object

export declare function SecPolicyCreateWithOID(policyOID: interop.Object): interop.Object

export declare function SecPolicyGetOID(
	policyRef: interop.Object,
	oid: interop.PointerConvertible,
): number

export declare function SecPolicyGetValue(
	policyRef: interop.Object,
	value: interop.PointerConvertible,
): number

export declare function SecPolicySetValue(
	policyRef: interop.Object,
	value: interop.PointerConvertible,
): number

export declare function SecPolicySetProperties(
	policyRef: interop.Object,
	properties: interop.Object,
): number

export declare function SecPolicyGetTPHandle(
	policyRef: interop.Object,
	tpHandle: interop.PointerConvertible,
): number

export declare function SecRandomCopyBytes(
	rnd: interop.PointerConvertible,
	count: number,
	bytes: interop.PointerConvertible,
): number

export declare function cssmPerror(how: string, error: number): void

export declare function cssmOidToAlg(
	oid: interop.PointerConvertible,
	alg: interop.PointerConvertible,
): boolean

export declare function cssmAlgToOid(algId: number): interop.Pointer

export declare function SecKeychainGetTypeID(): number

export declare function SecKeychainGetVersion(returnVers: interop.PointerConvertible): number

export declare function SecKeychainOpen(
	pathName: string,
	keychain: interop.PointerConvertible,
): number

export declare function SecKeychainCreate(
	pathName: string,
	passwordLength: number,
	password: interop.PointerConvertible,
	promptUser: number,
	initialAccess: interop.Object,
	keychain: interop.PointerConvertible,
): number

export declare function SecKeychainDelete(keychainOrArray: interop.Object): number

export declare function SecKeychainSetSettings(
	keychain: interop.Object,
	newSettings: interop.PointerConvertible,
): number

export declare function SecKeychainCopySettings(
	keychain: interop.Object,
	outSettings: interop.PointerConvertible,
): number

export declare function SecKeychainUnlock(
	keychain: interop.Object,
	passwordLength: number,
	password: interop.PointerConvertible,
	usePassword: number,
): number

export declare function SecKeychainLock(keychain: interop.Object): number

export declare function SecKeychainLockAll(): number

export declare function SecKeychainCopyDefault(keychain: interop.PointerConvertible): number

export declare function SecKeychainSetDefault(keychain: interop.Object): number

export declare function SecKeychainCopySearchList(searchList: interop.PointerConvertible): number

export declare function SecKeychainSetSearchList(searchList: interop.Object): number

export declare function SecKeychainCopyDomainDefault(
	domain: interop.Enum<typeof SecPreferencesDomain>,
	keychain: interop.PointerConvertible,
): number

export declare function SecKeychainSetDomainDefault(
	domain: interop.Enum<typeof SecPreferencesDomain>,
	keychain: interop.Object,
): number

export declare function SecKeychainCopyDomainSearchList(
	domain: interop.Enum<typeof SecPreferencesDomain>,
	searchList: interop.PointerConvertible,
): number

export declare function SecKeychainSetDomainSearchList(
	domain: interop.Enum<typeof SecPreferencesDomain>,
	searchList: interop.Object,
): number

export declare function SecKeychainSetPreferenceDomain(
	domain: interop.Enum<typeof SecPreferencesDomain>,
): number

export declare function SecKeychainGetPreferenceDomain(domain: interop.PointerConvertible): number

export declare function SecKeychainGetStatus(
	keychain: interop.Object,
	keychainStatus: interop.PointerConvertible,
): number

export declare function SecKeychainGetPath(
	keychain: interop.Object,
	ioPathLength: interop.PointerConvertible,
	pathName: string,
): number

export declare function SecKeychainAttributeInfoForItemID(
	keychain: interop.Object,
	itemID: number,
	info: interop.PointerConvertible,
): number

export declare function SecKeychainFreeAttributeInfo(info: interop.PointerConvertible): number

export declare function SecKeychainAddCallback(
	callbackFunction: (
		p1: interop.Enum<typeof SecKeychainEvent>,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number,
	eventMask: interop.Enum<typeof SecKeychainEventMask>,
	userContext: interop.PointerConvertible,
): number

export declare function SecKeychainRemoveCallback(
	callbackFunction: (
		p1: interop.Enum<typeof SecKeychainEvent>,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number,
): number

export declare function SecKeychainAddInternetPassword(
	keychain: interop.Object,
	serverNameLength: number,
	serverName: string,
	securityDomainLength: number,
	securityDomain: string,
	accountNameLength: number,
	accountName: string,
	pathLength: number,
	path: string,
	port: number,
	protocol: interop.Enum<typeof SecProtocolType>,
	authenticationType: interop.Enum<typeof SecAuthenticationType>,
	passwordLength: number,
	passwordData: interop.PointerConvertible,
	itemRef: interop.PointerConvertible,
): number

export declare function SecKeychainFindInternetPassword(
	keychainOrArray: interop.Object,
	serverNameLength: number,
	serverName: string,
	securityDomainLength: number,
	securityDomain: string,
	accountNameLength: number,
	accountName: string,
	pathLength: number,
	path: string,
	port: number,
	protocol: interop.Enum<typeof SecProtocolType>,
	authenticationType: interop.Enum<typeof SecAuthenticationType>,
	passwordLength: interop.PointerConvertible,
	passwordData: interop.PointerConvertible,
	itemRef: interop.PointerConvertible,
): number

export declare function SecKeychainAddGenericPassword(
	keychain: interop.Object,
	serviceNameLength: number,
	serviceName: string,
	accountNameLength: number,
	accountName: string,
	passwordLength: number,
	passwordData: interop.PointerConvertible,
	itemRef: interop.PointerConvertible,
): number

export declare function SecKeychainFindGenericPassword(
	keychainOrArray: interop.Object,
	serviceNameLength: number,
	serviceName: string,
	accountNameLength: number,
	accountName: string,
	passwordLength: interop.PointerConvertible,
	passwordData: interop.PointerConvertible,
	itemRef: interop.PointerConvertible,
): number

export declare function SecKeychainSetUserInteractionAllowed(state: number): number

export declare function SecKeychainGetUserInteractionAllowed(
	state: interop.PointerConvertible,
): number

export declare function SecKeychainGetCSPHandle(
	keychain: interop.Object,
	cspHandle: interop.PointerConvertible,
): number

export declare function SecKeychainGetDLDBHandle(
	keychain: interop.Object,
	dldbHandle: interop.PointerConvertible,
): number

export declare function SecKeychainCopyAccess(
	keychain: interop.Object,
	access: interop.PointerConvertible,
): number

export declare function SecKeychainSetAccess(
	keychain: interop.Object,
	access: interop.Object,
): number

export declare function SecKeychainItemExport(
	keychainItemOrArray: interop.Object,
	outputFormat: interop.Enum<typeof SecExternalFormat>,
	flags: interop.Enum<typeof SecItemImportExportFlags>,
	keyParams: interop.PointerConvertible,
	exportedData: interop.PointerConvertible,
): number

export declare function SecItemExport(
	secItemOrArray: interop.Object,
	outputFormat: interop.Enum<typeof SecExternalFormat>,
	flags: interop.Enum<typeof SecItemImportExportFlags>,
	keyParams: interop.PointerConvertible,
	exportedData: interop.PointerConvertible,
): number

export declare function SecKeychainItemImport(
	importedData: interop.Object,
	fileNameOrExtension: interop.Object,
	inputFormat: interop.PointerConvertible,
	itemType: interop.PointerConvertible,
	flags: interop.Enum<typeof SecItemImportExportFlags>,
	keyParams: interop.PointerConvertible,
	importKeychain: interop.Object,
	outItems: interop.PointerConvertible,
): number

export declare function SecItemImport(
	importedData: interop.Object,
	fileNameOrExtension: interop.Object,
	inputFormat: interop.PointerConvertible,
	itemType: interop.PointerConvertible,
	flags: interop.Enum<typeof SecItemImportExportFlags>,
	keyParams: interop.PointerConvertible,
	importKeychain: interop.Object,
	outItems: interop.PointerConvertible,
): number

export declare function SecPKCS12Import(
	pkcs12_data: interop.Object,
	options: interop.Object,
	items: interop.PointerConvertible,
): number

export declare function SecTrustGetTypeID(): number

export declare function SecTrustCreateWithCertificates(
	certificates: interop.Object,
	policies: interop.Object,
	trust: interop.PointerConvertible,
): number

export declare function SecTrustSetPolicies(trust: interop.Object, policies: interop.Object): number

export declare function SecTrustCopyPolicies(
	trust: interop.Object,
	policies: interop.PointerConvertible,
): number

export declare function SecTrustSetNetworkFetchAllowed(
	trust: interop.Object,
	allowFetch: number,
): number

export declare function SecTrustGetNetworkFetchAllowed(
	trust: interop.Object,
	allowFetch: interop.PointerConvertible,
): number

export declare function SecTrustSetAnchorCertificates(
	trust: interop.Object,
	anchorCertificates: interop.Object,
): number

export declare function SecTrustSetAnchorCertificatesOnly(
	trust: interop.Object,
	anchorCertificatesOnly: number,
): number

export declare function SecTrustCopyCustomAnchorCertificates(
	trust: interop.Object,
	anchors: interop.PointerConvertible,
): number

export declare function SecTrustSetVerifyDate(
	trust: interop.Object,
	verifyDate: interop.Object,
): number

export declare function SecTrustGetVerifyTime(trust: interop.Object): number

export declare function SecTrustEvaluate(
	trust: interop.Object,
	result: interop.PointerConvertible,
): number

export declare function SecTrustEvaluateAsync(
	trust: interop.Object,
	queue: NSObject,
	result: (p1: interop.PointerConvertible, p2: interop.Enum<typeof SecTrustResultType>) => void,
): number

export declare function SecTrustEvaluateWithError(
	trust: interop.Object,
	error: interop.PointerConvertible,
): boolean

export declare function SecTrustEvaluateAsyncWithError(
	trust: interop.Object,
	queue: NSObject,
	result: (p1: interop.PointerConvertible, p2: boolean, p3: interop.PointerConvertible) => void,
): number

export declare function SecTrustGetTrustResult(
	trust: interop.Object,
	result: interop.PointerConvertible,
): number

export declare function SecTrustCopyPublicKey(trust: interop.Object): interop.Object

export declare function SecTrustCopyKey(trust: interop.Object): interop.Object

export declare function SecTrustGetCertificateCount(trust: interop.Object): number

export declare function SecTrustGetCertificateAtIndex(
	trust: interop.Object,
	ix: number,
): interop.Object

export declare function SecTrustCopyExceptions(trust: interop.Object): interop.Object

export declare function SecTrustSetExceptions(
	trust: interop.Object,
	exceptions: interop.Object,
): boolean

export declare function SecTrustCopyProperties(trust: interop.Object): interop.Object

export declare function SecTrustCopyResult(trust: interop.Object): interop.Object

export declare function SecTrustSetOCSPResponse(
	trust: interop.Object,
	responseData: interop.Object,
): number

export declare function SecTrustSetSignedCertificateTimestamps(
	trust: interop.Object,
	sctArray: interop.Object,
): number

export declare function SecTrustSetOptions(
	trustRef: interop.Object,
	options: interop.Enum<typeof SecTrustOptionFlags>,
): number

export declare function SecTrustSetParameters(
	trustRef: interop.Object,
	action: number,
	actionData: interop.Object,
): number

export declare function SecTrustSetKeychains(
	trust: interop.Object,
	keychainOrArray: interop.Object,
): number

export declare function SecTrustGetResult(
	trustRef: interop.Object,
	result: interop.PointerConvertible,
	certChain: interop.PointerConvertible,
	statusChain: interop.PointerConvertible,
): number

export declare function SecTrustGetCssmResult(
	trust: interop.Object,
	result: interop.PointerConvertible,
): number

export declare function SecTrustGetCssmResultCode(
	trust: interop.Object,
	resultCode: interop.PointerConvertible,
): number

export declare function SecTrustGetTPHandle(
	trust: interop.Object,
	handle: interop.PointerConvertible,
): number

export declare function SecTrustCopyAnchorCertificates(anchors: interop.PointerConvertible): number

export declare function SecAddSharedWebCredential(
	fqdn: interop.Object,
	account: interop.Object,
	password: interop.Object,
	completionHandler: (p1: interop.PointerConvertible) => void,
): void

export declare function SecRequestSharedWebCredential(
	fqdn: interop.Object,
	account: interop.Object,
	completionHandler: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void,
): void

export declare function SecCreateSharedWebCredentialPassword(): interop.Object

export declare function sec_retain(obj: interop.PointerConvertible): interop.Pointer

export declare function sec_release(obj: interop.PointerConvertible): void

export declare function sec_trust_create(trust: interop.Object): NSObject

export declare function sec_trust_copy_ref(trust: NSObject): interop.Object

export declare function sec_identity_create(identity: interop.Object): NSObject

export declare function sec_identity_create_with_certificates(
	identity: interop.Object,
	certificates: interop.Object,
): NSObject

export declare function sec_identity_access_certificates(
	identity: NSObject,
	handler: (p1: NSObject) => void,
): boolean

export declare function sec_identity_copy_ref(identity: NSObject): interop.Object

export declare function sec_identity_copy_certificates_ref(identity: NSObject): interop.Object

export declare function sec_certificate_create(certificate: interop.Object): NSObject

export declare function sec_certificate_copy_ref(certificate: NSObject): interop.Object

export declare function sec_protocol_metadata_get_negotiated_protocol(metadata: NSObject): string

export declare function sec_protocol_metadata_copy_peer_public_key(metadata: NSObject): NSObject

export declare function sec_protocol_metadata_get_negotiated_tls_protocol_version(
	metadata: NSObject,
): interop.Enum<typeof tls_protocol_version_t>

export declare function sec_protocol_metadata_get_negotiated_protocol_version(
	metadata: NSObject,
): interop.Enum<typeof SSLProtocol>

export declare function sec_protocol_metadata_get_negotiated_tls_ciphersuite(
	metadata: NSObject,
): interop.Enum<typeof tls_ciphersuite_t>

export declare function sec_protocol_metadata_get_negotiated_ciphersuite(metadata: NSObject): number

export declare function sec_protocol_metadata_get_early_data_accepted(metadata: NSObject): boolean

export declare function sec_protocol_metadata_access_peer_certificate_chain(
	metadata: NSObject,
	handler: (p1: NSObject) => void,
): boolean

export declare function sec_protocol_metadata_access_ocsp_response(
	metadata: NSObject,
	handler: (p1: NSObject) => void,
): boolean

export declare function sec_protocol_metadata_access_supported_signature_algorithms(
	metadata: NSObject,
	handler: (p1: number) => void,
): boolean

export declare function sec_protocol_metadata_access_distinguished_names(
	metadata: NSObject,
	handler: (p1: NSObject) => void,
): boolean

export declare function sec_protocol_metadata_access_pre_shared_keys(
	metadata: NSObject,
	handler: (p1: NSObject, p2: NSObject) => void,
): boolean

export declare function sec_protocol_metadata_get_server_name(metadata: NSObject): string

export declare function sec_protocol_metadata_peers_are_equal(
	metadataA: NSObject,
	metadataB: NSObject,
): boolean

export declare function sec_protocol_metadata_challenge_parameters_are_equal(
	metadataA: NSObject,
	metadataB: NSObject,
): boolean

export declare function sec_protocol_metadata_create_secret(
	metadata: NSObject,
	label_len: number,
	label: string,
	exporter_length: number,
): NSObject

export declare function sec_protocol_metadata_create_secret_with_context(
	metadata: NSObject,
	label_len: number,
	label: string,
	context_len: number,
	context: interop.PointerConvertible,
	exporter_length: number,
): NSObject

export declare function sec_protocol_options_are_equal(
	optionsA: NSObject,
	optionsB: NSObject,
): boolean

export declare function sec_protocol_options_set_local_identity(
	options: NSObject,
	identity: NSObject,
): void

export declare function sec_protocol_options_append_tls_ciphersuite(
	options: NSObject,
	ciphersuite: interop.Enum<typeof tls_ciphersuite_t>,
): void

export declare function sec_protocol_options_add_tls_ciphersuite(
	options: NSObject,
	ciphersuite: number,
): void

export declare function sec_protocol_options_append_tls_ciphersuite_group(
	options: NSObject,
	group: interop.Enum<typeof tls_ciphersuite_group_t>,
): void

export declare function sec_protocol_options_add_tls_ciphersuite_group(
	options: NSObject,
	group: interop.Enum<typeof SSLCiphersuiteGroup>,
): void

export declare function sec_protocol_options_set_tls_min_version(
	options: NSObject,
	version: interop.Enum<typeof SSLProtocol>,
): void

export declare function sec_protocol_options_set_min_tls_protocol_version(
	options: NSObject,
	version: interop.Enum<typeof tls_protocol_version_t>,
): void

export declare function sec_protocol_options_get_default_min_tls_protocol_version(): interop.Enum<
	typeof tls_protocol_version_t
>

export declare function sec_protocol_options_get_default_min_dtls_protocol_version(): interop.Enum<
	typeof tls_protocol_version_t
>

export declare function sec_protocol_options_set_tls_max_version(
	options: NSObject,
	version: interop.Enum<typeof SSLProtocol>,
): void

export declare function sec_protocol_options_set_max_tls_protocol_version(
	options: NSObject,
	version: interop.Enum<typeof tls_protocol_version_t>,
): void

export declare function sec_protocol_options_get_default_max_tls_protocol_version(): interop.Enum<
	typeof tls_protocol_version_t
>

export declare function sec_protocol_options_get_default_max_dtls_protocol_version(): interop.Enum<
	typeof tls_protocol_version_t
>

export declare function sec_protocol_options_add_tls_application_protocol(
	options: NSObject,
	application_protocol: string,
): void

export declare function sec_protocol_options_set_tls_server_name(
	options: NSObject,
	server_name: string,
): void

export declare function sec_protocol_options_set_tls_diffie_hellman_parameters(
	options: NSObject,
	params: NSObject,
): void

export declare function sec_protocol_options_add_pre_shared_key(
	options: NSObject,
	psk: NSObject,
	psk_identity: NSObject,
): void

export declare function sec_protocol_options_set_tls_pre_shared_key_identity_hint(
	options: NSObject,
	psk_identity_hint: NSObject,
): void

export declare function sec_protocol_options_set_pre_shared_key_selection_block(
	options: NSObject,
	psk_selection_block: (p1: NSObject, p2: NSObject, p3: (p1: NSObject) => void) => void,
	psk_selection_queue: NSObject,
): void

export declare function sec_protocol_options_set_tls_tickets_enabled(
	options: NSObject,
	tickets_enabled: boolean,
): void

export declare function sec_protocol_options_set_tls_is_fallback_attempt(
	options: NSObject,
	is_fallback_attempt: boolean,
): void

export declare function sec_protocol_options_set_tls_resumption_enabled(
	options: NSObject,
	resumption_enabled: boolean,
): void

export declare function sec_protocol_options_set_tls_false_start_enabled(
	options: NSObject,
	false_start_enabled: boolean,
): void

export declare function sec_protocol_options_set_tls_ocsp_enabled(
	options: NSObject,
	ocsp_enabled: boolean,
): void

export declare function sec_protocol_options_set_tls_sct_enabled(
	options: NSObject,
	sct_enabled: boolean,
): void

export declare function sec_protocol_options_set_tls_renegotiation_enabled(
	options: NSObject,
	renegotiation_enabled: boolean,
): void

export declare function sec_protocol_options_set_peer_authentication_required(
	options: NSObject,
	peer_authentication_required: boolean,
): void

export declare function sec_protocol_options_set_key_update_block(
	options: NSObject,
	key_update_block: (p1: NSObject, p2: () => void) => void,
	key_update_queue: NSObject,
): void

export declare function sec_protocol_options_set_challenge_block(
	options: NSObject,
	challenge_block: (p1: NSObject, p2: (p1: NSObject) => void) => void,
	challenge_queue: NSObject,
): void

export declare function sec_protocol_options_set_verify_block(
	options: NSObject,
	verify_block: (p1: NSObject, p2: NSObject, p3: (p1: boolean) => void) => void,
	verify_block_queue: NSObject,
): void

export declare function AuthorizationCreate(
	rights: interop.PointerConvertible,
	environment: interop.PointerConvertible,
	flags: interop.Enum<typeof AuthorizationFlags>,
	authorization: interop.PointerConvertible,
): number

export declare function AuthorizationFree(
	authorization: interop.PointerConvertible,
	flags: interop.Enum<typeof AuthorizationFlags>,
): number

export declare function AuthorizationCopyRights(
	authorization: interop.PointerConvertible,
	rights: interop.PointerConvertible,
	environment: interop.PointerConvertible,
	flags: interop.Enum<typeof AuthorizationFlags>,
	authorizedRights: interop.PointerConvertible,
): number

export declare function AuthorizationCopyRightsAsync(
	authorization: interop.PointerConvertible,
	rights: interop.PointerConvertible,
	environment: interop.PointerConvertible,
	flags: interop.Enum<typeof AuthorizationFlags>,
	callbackBlock: (p1: number, p2: interop.PointerConvertible) => void,
): void

export declare function AuthorizationCopyInfo(
	authorization: interop.PointerConvertible,
	tag: string,
	info: interop.PointerConvertible,
): number

export declare function AuthorizationMakeExternalForm(
	authorization: interop.PointerConvertible,
	extForm: interop.PointerConvertible,
): number

export declare function AuthorizationCreateFromExternalForm(
	extForm: interop.PointerConvertible,
	authorization: interop.PointerConvertible,
): number

export declare function AuthorizationFreeItemSet(set: interop.PointerConvertible): number

export declare function AuthorizationExecuteWithPrivileges(
	authorization: interop.PointerConvertible,
	pathToTool: string,
	options: interop.Enum<typeof AuthorizationFlags>,
	arguments$: interop.PointerConvertible,
	communicationsPipe: interop.PointerConvertible,
): number

export declare function AuthorizationCopyPrivilegedReference(
	authorization: interop.PointerConvertible,
	flags: interop.Enum<typeof AuthorizationFlags>,
): number

export declare function SessionGetInfo(
	session: number,
	sessionId: interop.PointerConvertible,
	attributes: interop.PointerConvertible,
): number

export declare function SessionCreate(
	flags: interop.Enum<typeof SessionCreationFlags>,
	attributes: interop.Enum<typeof SessionAttributeBits>,
): number

export declare function CSSM_Init(
	Version: interop.PointerConvertible,
	Scope: number,
	CallerGuid: interop.PointerConvertible,
	KeyHierarchy: number,
	PvcPolicy: interop.PointerConvertible,
	Reserved: interop.PointerConvertible,
): number

export declare function CSSM_Terminate(): number

export declare function CSSM_ModuleLoad(
	ModuleGuid: interop.PointerConvertible,
	KeyHierarchy: number,
	AppNotifyCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
		p5: number,
	) => number,
	AppNotifyCallbackCtx: interop.PointerConvertible,
): number

export declare function CSSM_ModuleUnload(
	ModuleGuid: interop.PointerConvertible,
	AppNotifyCallback: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
		p4: number,
		p5: number,
	) => number,
	AppNotifyCallbackCtx: interop.PointerConvertible,
): number

export declare function CSSM_Introduce(
	ModuleID: interop.PointerConvertible,
	KeyHierarchy: number,
): number

export declare function CSSM_Unintroduce(ModuleID: interop.PointerConvertible): number

export declare function CSSM_ModuleAttach(
	ModuleGuid: interop.PointerConvertible,
	Version: interop.PointerConvertible,
	MemoryFuncs: interop.PointerConvertible,
	SubserviceID: number,
	SubServiceType: number,
	AttachFlags: number,
	KeyHierarchy: number,
	FunctionTable: interop.PointerConvertible,
	NumFunctionTable: number,
	Reserved: interop.PointerConvertible,
	NewModuleHandle: interop.PointerConvertible,
): number

export declare function CSSM_ModuleDetach(ModuleHandle: number): number

export declare function CSSM_SetPrivilege(Privilege: number): number

export declare function CSSM_GetPrivilege(Privilege: interop.PointerConvertible): number

export declare function CSSM_GetModuleGUIDFromHandle(
	ModuleHandle: number,
	ModuleGUID: interop.PointerConvertible,
): number

export declare function CSSM_GetSubserviceUIDFromHandle(
	ModuleHandle: number,
	SubserviceUID: interop.PointerConvertible,
): number

export declare function CSSM_ListAttachedModuleManagers(
	NumberOfModuleManagers: interop.PointerConvertible,
	ModuleManagerGuids: interop.PointerConvertible,
): number

export declare function CSSM_GetAPIMemoryFunctions(
	AddInHandle: number,
	AppMemoryFuncs: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateSignatureContext(
	CSPHandle: number,
	AlgorithmID: number,
	AccessCred: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateSymmetricContext(
	CSPHandle: number,
	AlgorithmID: number,
	Mode: number,
	AccessCred: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	InitVector: interop.PointerConvertible,
	Padding: number,
	Reserved: interop.PointerConvertible,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateDigestContext(
	CSPHandle: number,
	AlgorithmID: number,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateMacContext(
	CSPHandle: number,
	AlgorithmID: number,
	Key: interop.PointerConvertible,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateRandomGenContext(
	CSPHandle: number,
	AlgorithmID: number,
	Seed: interop.PointerConvertible,
	Length: number,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateAsymmetricContext(
	CSPHandle: number,
	AlgorithmID: number,
	AccessCred: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	Padding: number,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateDeriveKeyContext(
	CSPHandle: number,
	AlgorithmID: number,
	DeriveKeyType: number,
	DeriveKeyLengthInBits: number,
	AccessCred: interop.PointerConvertible,
	BaseKey: interop.PointerConvertible,
	IterationCount: number,
	Salt: interop.PointerConvertible,
	Seed: interop.PointerConvertible,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreateKeyGenContext(
	CSPHandle: number,
	AlgorithmID: number,
	KeySizeInBits: number,
	Seed: interop.PointerConvertible,
	Salt: interop.PointerConvertible,
	StartDate: interop.PointerConvertible,
	EndDate: interop.PointerConvertible,
	Params: interop.PointerConvertible,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_CSP_CreatePassThroughContext(
	CSPHandle: number,
	Key: interop.PointerConvertible,
	NewContextHandle: interop.PointerConvertible,
): number

export declare function CSSM_GetContext(
	CCHandle: number,
	Context: interop.PointerConvertible,
): number

export declare function CSSM_FreeContext(Context: interop.PointerConvertible): number

export declare function CSSM_SetContext(
	CCHandle: number,
	Context: interop.PointerConvertible,
): number

export declare function CSSM_DeleteContext(CCHandle: number): number

export declare function CSSM_GetContextAttribute(
	Context: interop.PointerConvertible,
	AttributeType: number,
	ContextAttribute: interop.PointerConvertible,
): number

export declare function CSSM_UpdateContextAttributes(
	CCHandle: number,
	NumberOfAttributes: number,
	ContextAttributes: interop.PointerConvertible,
): number

export declare function CSSM_DeleteContextAttributes(
	CCHandle: number,
	NumberOfAttributes: number,
	ContextAttributes: interop.PointerConvertible,
): number

export declare function CSSM_CSP_Login(
	CSPHandle: number,
	AccessCred: interop.PointerConvertible,
	LoginName: interop.PointerConvertible,
	Reserved: interop.PointerConvertible,
): number

export declare function CSSM_CSP_Logout(CSPHandle: number): number

export declare function CSSM_CSP_GetLoginAcl(
	CSPHandle: number,
	SelectionTag: interop.PointerConvertible,
	NumberOfAclInfos: interop.PointerConvertible,
	AclInfos: interop.PointerConvertible,
): number

export declare function CSSM_CSP_ChangeLoginAcl(
	CSPHandle: number,
	AccessCred: interop.PointerConvertible,
	AclEdit: interop.PointerConvertible,
): number

export declare function CSSM_GetKeyAcl(
	CSPHandle: number,
	Key: interop.PointerConvertible,
	SelectionTag: interop.PointerConvertible,
	NumberOfAclInfos: interop.PointerConvertible,
	AclInfos: interop.PointerConvertible,
): number

export declare function CSSM_ChangeKeyAcl(
	CSPHandle: number,
	AccessCred: interop.PointerConvertible,
	AclEdit: interop.PointerConvertible,
	Key: interop.PointerConvertible,
): number

export declare function CSSM_GetKeyOwner(
	CSPHandle: number,
	Key: interop.PointerConvertible,
	Owner: interop.PointerConvertible,
): number

export declare function CSSM_ChangeKeyOwner(
	CSPHandle: number,
	AccessCred: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	NewOwner: interop.PointerConvertible,
): number

export declare function CSSM_CSP_GetLoginOwner(
	CSPHandle: number,
	Owner: interop.PointerConvertible,
): number

export declare function CSSM_CSP_ChangeLoginOwner(
	CSPHandle: number,
	AccessCred: interop.PointerConvertible,
	NewOwner: interop.PointerConvertible,
): number

export declare function CSSM_SignData(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
	DigestAlgorithm: number,
	Signature: interop.PointerConvertible,
): number

export declare function CSSM_SignDataInit(CCHandle: number): number

export declare function CSSM_SignDataUpdate(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
): number

export declare function CSSM_SignDataFinal(
	CCHandle: number,
	Signature: interop.PointerConvertible,
): number

export declare function CSSM_VerifyData(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
	DigestAlgorithm: number,
	Signature: interop.PointerConvertible,
): number

export declare function CSSM_VerifyDataInit(CCHandle: number): number

export declare function CSSM_VerifyDataUpdate(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
): number

export declare function CSSM_VerifyDataFinal(
	CCHandle: number,
	Signature: interop.PointerConvertible,
): number

export declare function CSSM_DigestData(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
	Digest: interop.PointerConvertible,
): number

export declare function CSSM_DigestDataInit(CCHandle: number): number

export declare function CSSM_DigestDataUpdate(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
): number

export declare function CSSM_DigestDataClone(
	CCHandle: number,
	ClonednewCCHandle: interop.PointerConvertible,
): number

export declare function CSSM_DigestDataFinal(
	CCHandle: number,
	Digest: interop.PointerConvertible,
): number

export declare function CSSM_GenerateMac(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
	Mac: interop.PointerConvertible,
): number

export declare function CSSM_GenerateMacInit(CCHandle: number): number

export declare function CSSM_GenerateMacUpdate(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
): number

export declare function CSSM_GenerateMacFinal(
	CCHandle: number,
	Mac: interop.PointerConvertible,
): number

export declare function CSSM_VerifyMac(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
	Mac: interop.PointerConvertible,
): number

export declare function CSSM_VerifyMacInit(CCHandle: number): number

export declare function CSSM_VerifyMacUpdate(
	CCHandle: number,
	DataBufs: interop.PointerConvertible,
	DataBufCount: number,
): number

export declare function CSSM_VerifyMacFinal(
	CCHandle: number,
	Mac: interop.PointerConvertible,
): number

export declare function CSSM_QuerySize(
	CCHandle: number,
	Encrypt: number,
	QuerySizeCount: number,
	DataBlockSizes: interop.PointerConvertible,
): number

export declare function CSSM_EncryptData(
	CCHandle: number,
	ClearBufs: interop.PointerConvertible,
	ClearBufCount: number,
	CipherBufs: interop.PointerConvertible,
	CipherBufCount: number,
	bytesEncrypted: interop.PointerConvertible,
	RemData: interop.PointerConvertible,
): number

export declare function CSSM_EncryptDataP(
	CCHandle: number,
	ClearBufs: interop.PointerConvertible,
	ClearBufCount: number,
	CipherBufs: interop.PointerConvertible,
	CipherBufCount: number,
	bytesEncrypted: interop.PointerConvertible,
	RemData: interop.PointerConvertible,
	Privilege: number,
): number

export declare function CSSM_EncryptDataInit(CCHandle: number): number

export declare function CSSM_EncryptDataInitP(CCHandle: number, Privilege: number): number

export declare function CSSM_EncryptDataUpdate(
	CCHandle: number,
	ClearBufs: interop.PointerConvertible,
	ClearBufCount: number,
	CipherBufs: interop.PointerConvertible,
	CipherBufCount: number,
	bytesEncrypted: interop.PointerConvertible,
): number

export declare function CSSM_EncryptDataFinal(
	CCHandle: number,
	RemData: interop.PointerConvertible,
): number

export declare function CSSM_DecryptData(
	CCHandle: number,
	CipherBufs: interop.PointerConvertible,
	CipherBufCount: number,
	ClearBufs: interop.PointerConvertible,
	ClearBufCount: number,
	bytesDecrypted: interop.PointerConvertible,
	RemData: interop.PointerConvertible,
): number

export declare function CSSM_DecryptDataP(
	CCHandle: number,
	CipherBufs: interop.PointerConvertible,
	CipherBufCount: number,
	ClearBufs: interop.PointerConvertible,
	ClearBufCount: number,
	bytesDecrypted: interop.PointerConvertible,
	RemData: interop.PointerConvertible,
	Privilege: number,
): number

export declare function CSSM_DecryptDataInit(CCHandle: number): number

export declare function CSSM_DecryptDataInitP(CCHandle: number, Privilege: number): number

export declare function CSSM_DecryptDataUpdate(
	CCHandle: number,
	CipherBufs: interop.PointerConvertible,
	CipherBufCount: number,
	ClearBufs: interop.PointerConvertible,
	ClearBufCount: number,
	bytesDecrypted: interop.PointerConvertible,
): number

export declare function CSSM_DecryptDataFinal(
	CCHandle: number,
	RemData: interop.PointerConvertible,
): number

export declare function CSSM_QueryKeySizeInBits(
	CSPHandle: number,
	CCHandle: number,
	Key: interop.PointerConvertible,
	KeySize: interop.PointerConvertible,
): number

export declare function CSSM_GenerateKey(
	CCHandle: number,
	KeyUsage: number,
	KeyAttr: number,
	KeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	Key: interop.PointerConvertible,
): number

export declare function CSSM_GenerateKeyP(
	CCHandle: number,
	KeyUsage: number,
	KeyAttr: number,
	KeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	Privilege: number,
): number

export declare function CSSM_GenerateKeyPair(
	CCHandle: number,
	PublicKeyUsage: number,
	PublicKeyAttr: number,
	PublicKeyLabel: interop.PointerConvertible,
	PublicKey: interop.PointerConvertible,
	PrivateKeyUsage: number,
	PrivateKeyAttr: number,
	PrivateKeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	PrivateKey: interop.PointerConvertible,
): number

export declare function CSSM_GenerateKeyPairP(
	CCHandle: number,
	PublicKeyUsage: number,
	PublicKeyAttr: number,
	PublicKeyLabel: interop.PointerConvertible,
	PublicKey: interop.PointerConvertible,
	PrivateKeyUsage: number,
	PrivateKeyAttr: number,
	PrivateKeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	PrivateKey: interop.PointerConvertible,
	Privilege: number,
): number

export declare function CSSM_GenerateRandom(
	CCHandle: number,
	RandomNumber: interop.PointerConvertible,
): number

export declare function CSSM_CSP_ObtainPrivateKeyFromPublicKey(
	CSPHandle: number,
	PublicKey: interop.PointerConvertible,
	PrivateKey: interop.PointerConvertible,
): number

export declare function CSSM_WrapKey(
	CCHandle: number,
	AccessCred: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	DescriptiveData: interop.PointerConvertible,
	WrappedKey: interop.PointerConvertible,
): number

export declare function CSSM_UnwrapKey(
	CCHandle: number,
	PublicKey: interop.PointerConvertible,
	WrappedKey: interop.PointerConvertible,
	KeyUsage: number,
	KeyAttr: number,
	KeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	UnwrappedKey: interop.PointerConvertible,
	DescriptiveData: interop.PointerConvertible,
): number

export declare function CSSM_WrapKeyP(
	CCHandle: number,
	AccessCred: interop.PointerConvertible,
	Key: interop.PointerConvertible,
	DescriptiveData: interop.PointerConvertible,
	WrappedKey: interop.PointerConvertible,
	Privilege: number,
): number

export declare function CSSM_UnwrapKeyP(
	CCHandle: number,
	PublicKey: interop.PointerConvertible,
	WrappedKey: interop.PointerConvertible,
	KeyUsage: number,
	KeyAttr: number,
	KeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	UnwrappedKey: interop.PointerConvertible,
	DescriptiveData: interop.PointerConvertible,
	Privilege: number,
): number

export declare function CSSM_DeriveKey(
	CCHandle: number,
	Param: interop.PointerConvertible,
	KeyUsage: number,
	KeyAttr: number,
	KeyLabel: interop.PointerConvertible,
	CredAndAclEntry: interop.PointerConvertible,
	DerivedKey: interop.PointerConvertible,
): number

export declare function CSSM_FreeKey(
	CSPHandle: number,
	AccessCred: interop.PointerConvertible,
	KeyPtr: interop.PointerConvertible,
	Delete: number,
): number

export declare function CSSM_GenerateAlgorithmParams(
	CCHandle: number,
	ParamBits: number,
	Param: interop.PointerConvertible,
): number

export declare function CSSM_CSP_GetOperationalStatistics(
	CSPHandle: number,
	Statistics: interop.PointerConvertible,
): number

export declare function CSSM_GetTimeValue(
	CSPHandle: number,
	TimeAlgorithm: number,
	TimeData: interop.PointerConvertible,
): number

export declare function CSSM_RetrieveUniqueId(
	CSPHandle: number,
	UniqueID: interop.PointerConvertible,
): number

export declare function CSSM_RetrieveCounter(
	CSPHandle: number,
	Counter: interop.PointerConvertible,
): number

export declare function CSSM_VerifyDevice(
	CSPHandle: number,
	DeviceCert: interop.PointerConvertible,
): number

export declare function CSSM_CSP_PassThrough(
	CCHandle: number,
	PassThroughId: number,
	InData: interop.PointerConvertible,
	OutData: interop.PointerConvertible,
): number

export declare function CSSM_TP_SubmitCredRequest(
	TPHandle: number,
	PreferredAuthority: interop.PointerConvertible,
	RequestType: number,
	RequestInput: interop.PointerConvertible,
	CallerAuthContext: interop.PointerConvertible,
	EstimatedTime: interop.PointerConvertible,
	ReferenceIdentifier: interop.PointerConvertible,
): number

export declare function CSSM_TP_RetrieveCredResult(
	TPHandle: number,
	ReferenceIdentifier: interop.PointerConvertible,
	CallerAuthCredentials: interop.PointerConvertible,
	EstimatedTime: interop.PointerConvertible,
	ConfirmationRequired: interop.PointerConvertible,
	RetrieveOutput: interop.PointerConvertible,
): number

export declare function CSSM_TP_ConfirmCredResult(
	TPHandle: number,
	ReferenceIdentifier: interop.PointerConvertible,
	CallerAuthCredentials: interop.PointerConvertible,
	Responses: interop.PointerConvertible,
	PreferredAuthority: interop.PointerConvertible,
): number

export declare function CSSM_TP_ReceiveConfirmation(
	TPHandle: number,
	ReferenceIdentifier: interop.PointerConvertible,
	Responses: interop.PointerConvertible,
	ElapsedTime: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertReclaimKey(
	TPHandle: number,
	CertGroup: interop.PointerConvertible,
	CertIndex: number,
	KeyCacheHandle: number,
	CSPHandle: number,
	CredAndAclEntry: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertReclaimAbort(TPHandle: number, KeyCacheHandle: number): number

export declare function CSSM_TP_FormRequest(
	TPHandle: number,
	PreferredAuthority: interop.PointerConvertible,
	FormType: number,
	BlankForm: interop.PointerConvertible,
): number

export declare function CSSM_TP_FormSubmit(
	TPHandle: number,
	FormType: number,
	Form: interop.PointerConvertible,
	ClearanceAuthority: interop.PointerConvertible,
	RepresentedAuthority: interop.PointerConvertible,
	Credentials: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertGroupVerify(
	TPHandle: number,
	CLHandle: number,
	CSPHandle: number,
	CertGroupToBeVerified: interop.PointerConvertible,
	VerifyContext: interop.PointerConvertible,
	VerifyContextResult: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertCreateTemplate(
	TPHandle: number,
	CLHandle: number,
	NumberOfFields: number,
	CertFields: interop.PointerConvertible,
	CertTemplate: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertGetAllTemplateFields(
	TPHandle: number,
	CLHandle: number,
	CertTemplate: interop.PointerConvertible,
	NumberOfFields: interop.PointerConvertible,
	CertFields: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertSign(
	TPHandle: number,
	CLHandle: number,
	CCHandle: number,
	CertTemplateToBeSigned: interop.PointerConvertible,
	SignerCertGroup: interop.PointerConvertible,
	SignerVerifyContext: interop.PointerConvertible,
	SignerVerifyResult: interop.PointerConvertible,
	SignedCert: interop.PointerConvertible,
): number

export declare function CSSM_TP_CrlVerify(
	TPHandle: number,
	CLHandle: number,
	CSPHandle: number,
	CrlToBeVerified: interop.PointerConvertible,
	SignerCertGroup: interop.PointerConvertible,
	VerifyContext: interop.PointerConvertible,
	RevokerVerifyResult: interop.PointerConvertible,
): number

export declare function CSSM_TP_CrlCreateTemplate(
	TPHandle: number,
	CLHandle: number,
	NumberOfFields: number,
	CrlFields: interop.PointerConvertible,
	NewCrlTemplate: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertRevoke(
	TPHandle: number,
	CLHandle: number,
	CSPHandle: number,
	OldCrlTemplate: interop.PointerConvertible,
	CertGroupToBeRevoked: interop.PointerConvertible,
	RevokerCertGroup: interop.PointerConvertible,
	RevokerVerifyContext: interop.PointerConvertible,
	RevokerVerifyResult: interop.PointerConvertible,
	Reason: number,
	NewCrlTemplate: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertRemoveFromCrlTemplate(
	TPHandle: number,
	CLHandle: number,
	CSPHandle: number,
	OldCrlTemplate: interop.PointerConvertible,
	CertGroupToBeRemoved: interop.PointerConvertible,
	RevokerCertGroup: interop.PointerConvertible,
	RevokerVerifyContext: interop.PointerConvertible,
	RevokerVerifyResult: interop.PointerConvertible,
	NewCrlTemplate: interop.PointerConvertible,
): number

export declare function CSSM_TP_CrlSign(
	TPHandle: number,
	CLHandle: number,
	CCHandle: number,
	CrlToBeSigned: interop.PointerConvertible,
	SignerCertGroup: interop.PointerConvertible,
	SignerVerifyContext: interop.PointerConvertible,
	SignerVerifyResult: interop.PointerConvertible,
	SignedCrl: interop.PointerConvertible,
): number

export declare function CSSM_TP_ApplyCrlToDb(
	TPHandle: number,
	CLHandle: number,
	CSPHandle: number,
	CrlToBeApplied: interop.PointerConvertible,
	SignerCertGroup: interop.PointerConvertible,
	ApplyCrlVerifyContext: interop.PointerConvertible,
	ApplyCrlVerifyResult: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertGroupConstruct(
	TPHandle: number,
	CLHandle: number,
	CSPHandle: number,
	DBList: interop.PointerConvertible,
	ConstructParams: interop.PointerConvertible,
	CertGroupFrag: interop.PointerConvertible,
	CertGroup: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertGroupPrune(
	TPHandle: number,
	CLHandle: number,
	DBList: interop.PointerConvertible,
	OrderedCertGroup: interop.PointerConvertible,
	PrunedCertGroup: interop.PointerConvertible,
): number

export declare function CSSM_TP_CertGroupToTupleGroup(
	TPHandle: number,
	CLHandle: number,
	CertGroup: interop.PointerConvertible,
	TupleGroup: interop.PointerConvertible,
): number

export declare function CSSM_TP_TupleGroupToCertGroup(
	TPHandle: number,
	CLHandle: number,
	TupleGroup: interop.PointerConvertible,
	CertTemplates: interop.PointerConvertible,
): number

export declare function CSSM_TP_PassThrough(
	TPHandle: number,
	CLHandle: number,
	CCHandle: number,
	DBList: interop.PointerConvertible,
	PassThroughId: number,
	InputParams: interop.PointerConvertible,
	OutputParams: interop.PointerConvertible,
): number

export declare function CSSM_AC_AuthCompute(
	ACHandle: number,
	BaseAuthorizations: interop.PointerConvertible,
	Credentials: interop.PointerConvertible,
	NumberOfRequestors: number,
	Requestors: interop.PointerConvertible,
	RequestedAuthorizationPeriod: interop.PointerConvertible,
	RequestedAuthorization: interop.PointerConvertible,
	AuthorizationResult: interop.PointerConvertible,
): number

export declare function CSSM_AC_PassThrough(
	ACHandle: number,
	TPHandle: number,
	CLHandle: number,
	CCHandle: number,
	DBList: interop.PointerConvertible,
	PassThroughId: number,
	InputParams: interop.PointerConvertible,
	OutputParams: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertCreateTemplate(
	CLHandle: number,
	NumberOfFields: number,
	CertFields: interop.PointerConvertible,
	CertTemplate: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGetAllTemplateFields(
	CLHandle: number,
	CertTemplate: interop.PointerConvertible,
	NumberOfFields: interop.PointerConvertible,
	CertFields: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertSign(
	CLHandle: number,
	CCHandle: number,
	CertTemplate: interop.PointerConvertible,
	SignScope: interop.PointerConvertible,
	ScopeSize: number,
	SignedCert: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertVerify(
	CLHandle: number,
	CCHandle: number,
	CertToBeVerified: interop.PointerConvertible,
	SignerCert: interop.PointerConvertible,
	VerifyScope: interop.PointerConvertible,
	ScopeSize: number,
): number

export declare function CSSM_CL_CertVerifyWithKey(
	CLHandle: number,
	CCHandle: number,
	CertToBeVerified: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGetFirstFieldValue(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	CertField: interop.PointerConvertible,
	ResultsHandle: interop.PointerConvertible,
	NumberOfMatchedFields: interop.PointerConvertible,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGetNextFieldValue(
	CLHandle: number,
	ResultsHandle: number,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertAbortQuery(CLHandle: number, ResultsHandle: number): number

export declare function CSSM_CL_CertGetKeyInfo(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	Key: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGetAllFields(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	NumberOfFields: interop.PointerConvertible,
	CertFields: interop.PointerConvertible,
): number

export declare function CSSM_CL_FreeFields(
	CLHandle: number,
	NumberOfFields: number,
	Fields: interop.PointerConvertible,
): number

export declare function CSSM_CL_FreeFieldValue(
	CLHandle: number,
	CertOrCrlOid: interop.PointerConvertible,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertCache(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	CertHandle: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGetFirstCachedFieldValue(
	CLHandle: number,
	CertHandle: number,
	CertField: interop.PointerConvertible,
	ResultsHandle: interop.PointerConvertible,
	NumberOfMatchedFields: interop.PointerConvertible,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGetNextCachedFieldValue(
	CLHandle: number,
	ResultsHandle: number,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertAbortCache(CLHandle: number, CertHandle: number): number

export declare function CSSM_CL_CertGroupToSignedBundle(
	CLHandle: number,
	CCHandle: number,
	CertGroupToBundle: interop.PointerConvertible,
	BundleInfo: interop.PointerConvertible,
	SignedBundle: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertGroupFromVerifiedBundle(
	CLHandle: number,
	CCHandle: number,
	CertBundle: interop.PointerConvertible,
	SignerCert: interop.PointerConvertible,
	CertGroup: interop.PointerConvertible,
): number

export declare function CSSM_CL_CertDescribeFormat(
	CLHandle: number,
	NumberOfFields: interop.PointerConvertible,
	OidList: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlCreateTemplate(
	CLHandle: number,
	NumberOfFields: number,
	CrlTemplate: interop.PointerConvertible,
	NewCrl: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlSetFields(
	CLHandle: number,
	NumberOfFields: number,
	CrlTemplate: interop.PointerConvertible,
	OldCrl: interop.PointerConvertible,
	ModifiedCrl: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlAddCert(
	CLHandle: number,
	CCHandle: number,
	Cert: interop.PointerConvertible,
	NumberOfFields: number,
	CrlEntryFields: interop.PointerConvertible,
	OldCrl: interop.PointerConvertible,
	NewCrl: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlRemoveCert(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	OldCrl: interop.PointerConvertible,
	NewCrl: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlSign(
	CLHandle: number,
	CCHandle: number,
	UnsignedCrl: interop.PointerConvertible,
	SignScope: interop.PointerConvertible,
	ScopeSize: number,
	SignedCrl: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlVerify(
	CLHandle: number,
	CCHandle: number,
	CrlToBeVerified: interop.PointerConvertible,
	SignerCert: interop.PointerConvertible,
	VerifyScope: interop.PointerConvertible,
	ScopeSize: number,
): number

export declare function CSSM_CL_CrlVerifyWithKey(
	CLHandle: number,
	CCHandle: number,
	CrlToBeVerified: interop.PointerConvertible,
): number

export declare function CSSM_CL_IsCertInCrl(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	Crl: interop.PointerConvertible,
	CertFound: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlGetFirstFieldValue(
	CLHandle: number,
	Crl: interop.PointerConvertible,
	CrlField: interop.PointerConvertible,
	ResultsHandle: interop.PointerConvertible,
	NumberOfMatchedFields: interop.PointerConvertible,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlGetNextFieldValue(
	CLHandle: number,
	ResultsHandle: number,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlAbortQuery(CLHandle: number, ResultsHandle: number): number

export declare function CSSM_CL_CrlGetAllFields(
	CLHandle: number,
	Crl: interop.PointerConvertible,
	NumberOfCrlFields: interop.PointerConvertible,
	CrlFields: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlCache(
	CLHandle: number,
	Crl: interop.PointerConvertible,
	CrlHandle: interop.PointerConvertible,
): number

export declare function CSSM_CL_IsCertInCachedCrl(
	CLHandle: number,
	Cert: interop.PointerConvertible,
	CrlHandle: number,
	CertFound: interop.PointerConvertible,
	CrlRecordIndex: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlGetFirstCachedFieldValue(
	CLHandle: number,
	CrlHandle: number,
	CrlRecordIndex: interop.PointerConvertible,
	CrlField: interop.PointerConvertible,
	ResultsHandle: interop.PointerConvertible,
	NumberOfMatchedFields: interop.PointerConvertible,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlGetNextCachedFieldValue(
	CLHandle: number,
	ResultsHandle: number,
	Value: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlGetAllCachedRecordFields(
	CLHandle: number,
	CrlHandle: number,
	CrlRecordIndex: interop.PointerConvertible,
	NumberOfFields: interop.PointerConvertible,
	CrlFields: interop.PointerConvertible,
): number

export declare function CSSM_CL_CrlAbortCache(CLHandle: number, CrlHandle: number): number

export declare function CSSM_CL_CrlDescribeFormat(
	CLHandle: number,
	NumberOfFields: interop.PointerConvertible,
	OidList: interop.PointerConvertible,
): number

export declare function CSSM_CL_PassThrough(
	CLHandle: number,
	CCHandle: number,
	PassThroughId: number,
	InputParams: interop.PointerConvertible,
	OutputParams: interop.PointerConvertible,
): number

export declare function CSSM_DL_DbOpen(
	DLHandle: number,
	DbName: string,
	DbLocation: interop.PointerConvertible,
	AccessRequest: number,
	AccessCred: interop.PointerConvertible,
	OpenParameters: interop.PointerConvertible,
	DbHandle: interop.PointerConvertible,
): number

export declare function CSSM_DL_DbClose(DLDBHandle: cssm_dl_db_handle): number

export declare function CSSM_DL_DbCreate(
	DLHandle: number,
	DbName: string,
	DbLocation: interop.PointerConvertible,
	DBInfo: interop.PointerConvertible,
	AccessRequest: number,
	CredAndAclEntry: interop.PointerConvertible,
	OpenParameters: interop.PointerConvertible,
	DbHandle: interop.PointerConvertible,
): number

export declare function CSSM_DL_DbDelete(
	DLHandle: number,
	DbName: string,
	DbLocation: interop.PointerConvertible,
	AccessCred: interop.PointerConvertible,
): number

export declare function CSSM_DL_CreateRelation(
	DLDBHandle: cssm_dl_db_handle,
	RelationID: number,
	RelationName: string,
	NumberOfAttributes: number,
	pAttributeInfo: interop.PointerConvertible,
	NumberOfIndexes: number,
	pIndexInfo: interop.PointerConvertible,
): number

export declare function CSSM_DL_DestroyRelation(
	DLDBHandle: cssm_dl_db_handle,
	RelationID: number,
): number

export declare function CSSM_DL_Authenticate(
	DLDBHandle: cssm_dl_db_handle,
	AccessRequest: number,
	AccessCred: interop.PointerConvertible,
): number

export declare function CSSM_DL_GetDbAcl(
	DLDBHandle: cssm_dl_db_handle,
	SelectionTag: interop.PointerConvertible,
	NumberOfAclInfos: interop.PointerConvertible,
	AclInfos: interop.PointerConvertible,
): number

export declare function CSSM_DL_ChangeDbAcl(
	DLDBHandle: cssm_dl_db_handle,
	AccessCred: interop.PointerConvertible,
	AclEdit: interop.PointerConvertible,
): number

export declare function CSSM_DL_GetDbOwner(
	DLDBHandle: cssm_dl_db_handle,
	Owner: interop.PointerConvertible,
): number

export declare function CSSM_DL_ChangeDbOwner(
	DLDBHandle: cssm_dl_db_handle,
	AccessCred: interop.PointerConvertible,
	NewOwner: interop.PointerConvertible,
): number

export declare function CSSM_DL_GetDbNames(
	DLHandle: number,
	NameList: interop.PointerConvertible,
): number

export declare function CSSM_DL_GetDbNameFromHandle(
	DLDBHandle: cssm_dl_db_handle,
	DbName: interop.PointerConvertible,
): number

export declare function CSSM_DL_FreeNameList(
	DLHandle: number,
	NameList: interop.PointerConvertible,
): number

export declare function CSSM_DL_DataInsert(
	DLDBHandle: cssm_dl_db_handle,
	RecordType: number,
	Attributes: interop.PointerConvertible,
	Data: interop.PointerConvertible,
	UniqueId: interop.PointerConvertible,
): number

export declare function CSSM_DL_DataDelete(
	DLDBHandle: cssm_dl_db_handle,
	UniqueRecordIdentifier: interop.PointerConvertible,
): number

export declare function CSSM_DL_DataModify(
	DLDBHandle: cssm_dl_db_handle,
	RecordType: number,
	UniqueRecordIdentifier: interop.PointerConvertible,
	AttributesToBeModified: interop.PointerConvertible,
	DataToBeModified: interop.PointerConvertible,
	ModifyMode: number,
): number

export declare function CSSM_DL_DataGetFirst(
	DLDBHandle: cssm_dl_db_handle,
	Query: interop.PointerConvertible,
	ResultsHandle: interop.PointerConvertible,
	Attributes: interop.PointerConvertible,
	Data: interop.PointerConvertible,
	UniqueId: interop.PointerConvertible,
): number

export declare function CSSM_DL_DataGetNext(
	DLDBHandle: cssm_dl_db_handle,
	ResultsHandle: number,
	Attributes: interop.PointerConvertible,
	Data: interop.PointerConvertible,
	UniqueId: interop.PointerConvertible,
): number

export declare function CSSM_DL_DataAbortQuery(
	DLDBHandle: cssm_dl_db_handle,
	ResultsHandle: number,
): number

export declare function CSSM_DL_DataGetFromUniqueRecordId(
	DLDBHandle: cssm_dl_db_handle,
	UniqueRecord: interop.PointerConvertible,
	Attributes: interop.PointerConvertible,
	Data: interop.PointerConvertible,
): number

export declare function CSSM_DL_FreeUniqueRecord(
	DLDBHandle: cssm_dl_db_handle,
	UniqueRecord: interop.PointerConvertible,
): number

export declare function CSSM_DL_PassThrough(
	DLDBHandle: cssm_dl_db_handle,
	PassThroughId: number,
	InputParams: interop.PointerConvertible,
	OutputParams: interop.PointerConvertible,
): number

export declare function MDS_Initialize(
	pCallerGuid: interop.PointerConvertible,
	pMemoryFunctions: interop.PointerConvertible,
	pDlFunctions: interop.PointerConvertible,
	hMds: interop.PointerConvertible,
): number

export declare function MDS_Terminate(MdsHandle: number): number

export declare function MDS_Install(MdsHandle: number): number

export declare function MDS_Uninstall(MdsHandle: number): number

export declare function SecACLGetTypeID(): number

export declare function SecACLCreateFromSimpleContents(
	access: interop.Object,
	applicationList: interop.Object,
	description: interop.Object,
	promptSelector: interop.PointerConvertible,
	newAcl: interop.PointerConvertible,
): number

export declare function SecACLCreateWithSimpleContents(
	access: interop.Object,
	applicationList: interop.Object,
	description: interop.Object,
	promptSelector: interop.Enum<typeof SecKeychainPromptSelector>,
	newAcl: interop.PointerConvertible,
): number

export declare function SecACLRemove(aclRef: interop.Object): number

export declare function SecACLCopySimpleContents(
	acl: interop.Object,
	applicationList: interop.PointerConvertible,
	description: interop.PointerConvertible,
	promptSelector: interop.PointerConvertible,
): number

export declare function SecACLCopyContents(
	acl: interop.Object,
	applicationList: interop.PointerConvertible,
	description: interop.PointerConvertible,
	promptSelector: interop.PointerConvertible,
): number

export declare function SecACLSetSimpleContents(
	acl: interop.Object,
	applicationList: interop.Object,
	description: interop.Object,
	promptSelector: interop.PointerConvertible,
): number

export declare function SecACLSetContents(
	acl: interop.Object,
	applicationList: interop.Object,
	description: interop.Object,
	promptSelector: interop.Enum<typeof SecKeychainPromptSelector>,
): number

export declare function SecACLGetAuthorizations(
	acl: interop.Object,
	tags: interop.PointerConvertible,
	tagCount: interop.PointerConvertible,
): number

export declare function SecACLCopyAuthorizations(acl: interop.Object): interop.Object

export declare function SecACLSetAuthorizations(
	acl: interop.Object,
	tags: interop.PointerConvertible,
	tagCount: number,
): number

export declare function SecACLUpdateAuthorizations(
	acl: interop.Object,
	authorizations: interop.Object,
): number

export declare function SecIdentitySearchGetTypeID(): number

export declare function SecIdentitySearchCreate(
	keychainOrArray: interop.Object,
	keyUsage: number,
	searchRef: interop.PointerConvertible,
): number

export declare function SecIdentitySearchCopyNext(
	searchRef: interop.Object,
	identity: interop.PointerConvertible,
): number

export declare function SecKeychainItemGetTypeID(): number

export declare function SecKeychainItemModifyAttributesAndData(
	itemRef: interop.Object,
	attrList: interop.PointerConvertible,
	length: number,
	data: interop.PointerConvertible,
): number

export declare function SecKeychainItemCreateFromContent(
	itemClass: interop.Enum<typeof SecItemClass>,
	attrList: interop.PointerConvertible,
	length: number,
	data: interop.PointerConvertible,
	keychainRef: interop.Object,
	initialAccess: interop.Object,
	itemRef: interop.PointerConvertible,
): number

export declare function SecKeychainItemModifyContent(
	itemRef: interop.Object,
	attrList: interop.PointerConvertible,
	length: number,
	data: interop.PointerConvertible,
): number

export declare function SecKeychainItemCopyContent(
	itemRef: interop.Object,
	itemClass: interop.PointerConvertible,
	attrList: interop.PointerConvertible,
	length: interop.PointerConvertible,
	outData: interop.PointerConvertible,
): number

export declare function SecKeychainItemFreeContent(
	attrList: interop.PointerConvertible,
	data: interop.PointerConvertible,
): number

export declare function SecKeychainItemCopyAttributesAndData(
	itemRef: interop.Object,
	info: interop.PointerConvertible,
	itemClass: interop.PointerConvertible,
	attrList: interop.PointerConvertible,
	length: interop.PointerConvertible,
	outData: interop.PointerConvertible,
): number

export declare function SecKeychainItemFreeAttributesAndData(
	attrList: interop.PointerConvertible,
	data: interop.PointerConvertible,
): number

export declare function SecKeychainItemDelete(itemRef: interop.Object): number

export declare function SecKeychainItemCopyKeychain(
	itemRef: interop.Object,
	keychainRef: interop.PointerConvertible,
): number

export declare function SecKeychainItemCreateCopy(
	itemRef: interop.Object,
	destKeychainRef: interop.Object,
	initialAccess: interop.Object,
	itemCopy: interop.PointerConvertible,
): number

export declare function SecKeychainItemCreatePersistentReference(
	itemRef: interop.Object,
	persistentItemRef: interop.PointerConvertible,
): number

export declare function SecKeychainItemCopyFromPersistentReference(
	persistentItemRef: interop.Object,
	itemRef: interop.PointerConvertible,
): number

export declare function SecKeychainItemGetDLDBHandle(
	keyItemRef: interop.Object,
	dldbHandle: interop.PointerConvertible,
): number

export declare function SecKeychainItemGetUniqueRecordID(
	itemRef: interop.Object,
	uniqueRecordID: interop.PointerConvertible,
): number

export declare function SecKeychainItemCopyAccess(
	itemRef: interop.Object,
	access: interop.PointerConvertible,
): number

export declare function SecKeychainItemSetAccess(
	itemRef: interop.Object,
	access: interop.Object,
): number

export declare function SecKeychainSearchGetTypeID(): number

export declare function SecKeychainSearchCreateFromAttributes(
	keychainOrArray: interop.Object,
	itemClass: interop.Enum<typeof SecItemClass>,
	attrList: interop.PointerConvertible,
	searchRef: interop.PointerConvertible,
): number

export declare function SecKeychainSearchCopyNext(
	searchRef: interop.Object,
	itemRef: interop.PointerConvertible,
): number

export declare function SecPolicySearchGetTypeID(): number

export declare function SecPolicySearchCreate(
	certType: number,
	policyOID: interop.PointerConvertible,
	value: interop.PointerConvertible,
	searchRef: interop.PointerConvertible,
): number

export declare function SecPolicySearchCopyNext(
	searchRef: interop.Object,
	policyRef: interop.PointerConvertible,
): number

export declare function SecTrustedApplicationGetTypeID(): number

export declare function SecTrustedApplicationCreateFromPath(
	path: string,
	app: interop.PointerConvertible,
): number

export declare function SecTrustedApplicationCopyData(
	appRef: interop.Object,
	data: interop.PointerConvertible,
): number

export declare function SecTrustedApplicationSetData(
	appRef: interop.Object,
	data: interop.Object,
): number

export declare function SecTrustSettingsCopyTrustSettings(
	certRef: interop.Object,
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
	trustSettings: interop.PointerConvertible,
): number

export declare function SecTrustSettingsSetTrustSettings(
	certRef: interop.Object,
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
	trustSettingsDictOrArray: interop.Object,
): number

export declare function SecTrustSettingsRemoveTrustSettings(
	certRef: interop.Object,
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
): number

export declare function SecTrustSettingsCopyCertificates(
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
	certArray: interop.PointerConvertible,
): number

export declare function SecTrustSettingsCopyModificationDate(
	certRef: interop.Object,
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
	modificationDate: interop.PointerConvertible,
): number

export declare function SecTrustSettingsCreateExternalRepresentation(
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
	trustSettings: interop.PointerConvertible,
): number

export declare function SecTrustSettingsImportExternalRepresentation(
	domain: interop.Enum<typeof SecTrustSettingsDomain>,
	trustSettings: interop.Object,
): number

export declare function SecStaticCodeGetTypeID(): number

export declare function SecStaticCodeCreateWithPath(
	path: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	staticCode: interop.PointerConvertible,
): number

export declare function SecStaticCodeCreateWithPathAndAttributes(
	path: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	attributes: interop.Object,
	staticCode: interop.PointerConvertible,
): number

export declare function SecStaticCodeCheckValidity(
	staticCode: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.Object,
): number

export declare function SecStaticCodeCheckValidityWithErrors(
	staticCode: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.Object,
	errors: interop.PointerConvertible,
): number

export declare function SecCodeGetTypeID(): number

export declare function SecCodeCopySelf(
	flags: interop.Enum<typeof SecCSFlags>,
	self: interop.PointerConvertible,
): number

export declare function SecCodeCopyStaticCode(
	code: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	staticCode: interop.PointerConvertible,
): number

export declare function SecCodeCopyHost(
	guest: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	host: interop.PointerConvertible,
): number

export declare function SecCodeCopyGuestWithAttributes(
	host: interop.Object,
	attributes: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	guest: interop.PointerConvertible,
): number

export declare function SecCodeCreateWithXPCMessage(
	message: NSObject,
	flags: interop.Enum<typeof SecCSFlags>,
	target: interop.PointerConvertible,
): number

export declare function SecCodeCheckValidity(
	code: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.Object,
): number

export declare function SecCodeCheckValidityWithErrors(
	code: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.Object,
	errors: interop.PointerConvertible,
): number

export declare function SecCodeValidateFileResource(
	code: interop.Object,
	relativePath: interop.Object,
	fileData: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
): number

export declare function SecCodeCopyPath(
	staticCode: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	path: interop.PointerConvertible,
): number

export declare function SecCodeCopyDesignatedRequirement(
	code: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.PointerConvertible,
): number

export declare function SecCodeCopySigningInformation(
	code: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	information: interop.PointerConvertible,
): number

export declare function SecCodeMapMemory(
	code: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
): number

export declare function SecHostCreateGuest(
	host: number,
	status: number,
	path: interop.Object,
	attributes: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	newGuest: interop.PointerConvertible,
): number

export declare function SecHostRemoveGuest(
	host: number,
	guest: number,
	flags: interop.Enum<typeof SecCSFlags>,
): number

export declare function SecHostSelectGuest(
	guestRef: number,
	flags: interop.Enum<typeof SecCSFlags>,
): number

export declare function SecHostSelectedGuest(
	flags: interop.Enum<typeof SecCSFlags>,
	guestRef: interop.PointerConvertible,
): number

export declare function SecHostSetGuestStatus(
	guestRef: number,
	status: number,
	attributes: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
): number

export declare function SecHostSetHostingPort(
	hostingPort: number,
	flags: interop.Enum<typeof SecCSFlags>,
): number

export declare function SecRequirementGetTypeID(): number

export declare function SecRequirementCreateWithData(
	data: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.PointerConvertible,
): number

export declare function SecRequirementCreateWithString(
	text: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	requirement: interop.PointerConvertible,
): number

export declare function SecRequirementCreateWithStringAndErrors(
	text: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	errors: interop.PointerConvertible,
	requirement: interop.PointerConvertible,
): number

export declare function SecRequirementCopyData(
	requirement: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	data: interop.PointerConvertible,
): number

export declare function SecRequirementCopyString(
	requirement: interop.Object,
	flags: interop.Enum<typeof SecCSFlags>,
	text: interop.PointerConvertible,
): number

export declare function SecTaskGetTypeID(): number

export declare function SecTaskCreateWithAuditToken(
	allocator: interop.Object,
	token: audit_token_t,
): interop.Object

export declare function SecTaskCreateFromSelf(allocator: interop.Object): interop.Object

export declare function SecTaskCopyValueForEntitlement(
	task: interop.Object,
	entitlement: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecTaskCopyValuesForEntitlements(
	task: interop.Object,
	entitlements: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecTaskCopySigningIdentifier(
	task: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function AuthorizationRightGet(
	rightName: string,
	rightDefinition: interop.PointerConvertible,
): number

export declare function AuthorizationRightSet(
	authRef: interop.PointerConvertible,
	rightName: string,
	rightDefinition: interop.Object,
	descriptionKey: interop.Object,
	bundle: interop.Object,
	localeTableName: interop.Object,
): number

export declare function AuthorizationRightRemove(
	authRef: interop.PointerConvertible,
	rightName: string,
): number

export declare function CMSDecoderGetTypeID(): number

export declare function CMSDecoderCreate(cmsDecoderOut: interop.PointerConvertible): number

export declare function CMSDecoderUpdateMessage(
	cmsDecoder: interop.Object,
	msgBytes: interop.PointerConvertible,
	msgBytesLen: number,
): number

export declare function CMSDecoderFinalizeMessage(cmsDecoder: interop.Object): number

export declare function CMSDecoderSetDetachedContent(
	cmsDecoder: interop.Object,
	detachedContent: interop.Object,
): number

export declare function CMSDecoderCopyDetachedContent(
	cmsDecoder: interop.Object,
	detachedContentOut: interop.PointerConvertible,
): number

export declare function CMSDecoderSetSearchKeychain(
	cmsDecoder: interop.Object,
	keychainOrArray: interop.Object,
): number

export declare function CMSDecoderGetNumSigners(
	cmsDecoder: interop.Object,
	numSignersOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerStatus(
	cmsDecoder: interop.Object,
	signerIndex: number,
	policyOrArray: interop.Object,
	evaluateSecTrust: number,
	signerStatusOut: interop.PointerConvertible,
	secTrustOut: interop.PointerConvertible,
	certVerifyResultCodeOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerEmailAddress(
	cmsDecoder: interop.Object,
	signerIndex: number,
	signerEmailAddressOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerCert(
	cmsDecoder: interop.Object,
	signerIndex: number,
	signerCertOut: interop.PointerConvertible,
): number

export declare function CMSDecoderIsContentEncrypted(
	cmsDecoder: interop.Object,
	isEncryptedOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopyEncapsulatedContentType(
	cmsDecoder: interop.Object,
	eContentTypeOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopyAllCerts(
	cmsDecoder: interop.Object,
	certsOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopyContent(
	cmsDecoder: interop.Object,
	contentOut: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerSigningTime(
	cmsDecoder: interop.Object,
	signerIndex: number,
	signingTime: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerTimestamp(
	cmsDecoder: interop.Object,
	signerIndex: number,
	timestamp: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerTimestampWithPolicy(
	cmsDecoder: interop.Object,
	timeStampPolicy: interop.Object,
	signerIndex: number,
	timestamp: interop.PointerConvertible,
): number

export declare function CMSDecoderCopySignerTimestampCertificates(
	cmsDecoder: interop.Object,
	signerIndex: number,
	certificateRefs: interop.PointerConvertible,
): number

export declare function CMSEncoderGetTypeID(): number

export declare function CMSEncoderCreate(cmsEncoderOut: interop.PointerConvertible): number

export declare function CMSEncoderSetSignerAlgorithm(
	cmsEncoder: interop.Object,
	digestAlgorithm: interop.Object,
): number

export declare function CMSEncoderAddSigners(
	cmsEncoder: interop.Object,
	signerOrArray: interop.Object,
): number

export declare function CMSEncoderCopySigners(
	cmsEncoder: interop.Object,
	signersOut: interop.PointerConvertible,
): number

export declare function CMSEncoderAddRecipients(
	cmsEncoder: interop.Object,
	recipientOrArray: interop.Object,
): number

export declare function CMSEncoderCopyRecipients(
	cmsEncoder: interop.Object,
	recipientsOut: interop.PointerConvertible,
): number

export declare function CMSEncoderSetHasDetachedContent(
	cmsEncoder: interop.Object,
	detachedContent: number,
): number

export declare function CMSEncoderGetHasDetachedContent(
	cmsEncoder: interop.Object,
	detachedContentOut: interop.PointerConvertible,
): number

export declare function CMSEncoderSetEncapsulatedContentType(
	cmsEncoder: interop.Object,
	eContentType: interop.PointerConvertible,
): number

export declare function CMSEncoderSetEncapsulatedContentTypeOID(
	cmsEncoder: interop.Object,
	eContentTypeOID: interop.Object,
): number

export declare function CMSEncoderCopyEncapsulatedContentType(
	cmsEncoder: interop.Object,
	eContentTypeOut: interop.PointerConvertible,
): number

export declare function CMSEncoderAddSupportingCerts(
	cmsEncoder: interop.Object,
	certOrArray: interop.Object,
): number

export declare function CMSEncoderCopySupportingCerts(
	cmsEncoder: interop.Object,
	certsOut: interop.PointerConvertible,
): number

export declare function CMSEncoderAddSignedAttributes(
	cmsEncoder: interop.Object,
	signedAttributes: interop.Enum<typeof CMSSignedAttributes>,
): number

export declare function CMSEncoderSetCertificateChainMode(
	cmsEncoder: interop.Object,
	chainMode: interop.Enum<typeof CMSCertificateChainMode>,
): number

export declare function CMSEncoderGetCertificateChainMode(
	cmsEncoder: interop.Object,
	chainModeOut: interop.PointerConvertible,
): number

export declare function CMSEncoderUpdateContent(
	cmsEncoder: interop.Object,
	content: interop.PointerConvertible,
	contentLen: number,
): number

export declare function CMSEncoderCopyEncodedContent(
	cmsEncoder: interop.Object,
	encodedContentOut: interop.PointerConvertible,
): number

export declare function CMSEncode(
	signers: interop.Object,
	recipients: interop.Object,
	eContentType: interop.PointerConvertible,
	detachedContent: number,
	signedAttributes: interop.Enum<typeof CMSSignedAttributes>,
	content: interop.PointerConvertible,
	contentLen: number,
	encodedContentOut: interop.PointerConvertible,
): number

export declare function CMSEncodeContent(
	signers: interop.Object,
	recipients: interop.Object,
	eContentTypeOID: interop.Object,
	detachedContent: number,
	signedAttributes: interop.Enum<typeof CMSSignedAttributes>,
	content: interop.PointerConvertible,
	contentLen: number,
	encodedContentOut: interop.PointerConvertible,
): number

export declare function CMSEncoderCopySignerTimestamp(
	cmsEncoder: interop.Object,
	signerIndex: number,
	timestamp: interop.PointerConvertible,
): number

export declare function CMSEncoderCopySignerTimestampWithPolicy(
	cmsEncoder: interop.Object,
	timeStampPolicy: interop.Object,
	signerIndex: number,
	timestamp: interop.PointerConvertible,
): number

export declare function SSLContextGetTypeID(): number

export declare function SSLCreateContext(
	alloc: interop.Object,
	protocolSide: interop.Enum<typeof SSLProtocolSide>,
	connectionType: interop.Enum<typeof SSLConnectionType>,
): interop.Object

export declare function SSLNewContext(
	isServer: number,
	contextPtr: interop.PointerConvertible,
): number

export declare function SSLDisposeContext(context: interop.Object): number

export declare function SSLGetSessionState(
	context: interop.Object,
	state: interop.PointerConvertible,
): number

export declare function SSLSetSessionOption(
	context: interop.Object,
	option: interop.Enum<typeof SSLSessionOption>,
	value: number,
): number

export declare function SSLGetSessionOption(
	context: interop.Object,
	option: interop.Enum<typeof SSLSessionOption>,
	value: interop.PointerConvertible,
): number

export declare function SSLSetIOFuncs(
	context: interop.Object,
	readFunc: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number,
	writeFunc: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => number,
): number

export declare function SSLSetSessionConfig(context: interop.Object, config: interop.Object): number

export declare function SSLSetProtocolVersionMin(
	context: interop.Object,
	minVersion: interop.Enum<typeof SSLProtocol>,
): number

export declare function SSLGetProtocolVersionMin(
	context: interop.Object,
	minVersion: interop.PointerConvertible,
): number

export declare function SSLSetProtocolVersionMax(
	context: interop.Object,
	maxVersion: interop.Enum<typeof SSLProtocol>,
): number

export declare function SSLGetProtocolVersionMax(
	context: interop.Object,
	maxVersion: interop.PointerConvertible,
): number

export declare function SSLSetProtocolVersionEnabled(
	context: interop.Object,
	protocol: interop.Enum<typeof SSLProtocol>,
	enable: number,
): number

export declare function SSLGetProtocolVersionEnabled(
	context: interop.Object,
	protocol: interop.Enum<typeof SSLProtocol>,
	enable: interop.PointerConvertible,
): number

export declare function SSLSetProtocolVersion(
	context: interop.Object,
	version: interop.Enum<typeof SSLProtocol>,
): number

export declare function SSLGetProtocolVersion(
	context: interop.Object,
	protocol: interop.PointerConvertible,
): number

export declare function SSLSetCertificate(context: interop.Object, certRefs: interop.Object): number

export declare function SSLSetConnection(
	context: interop.Object,
	connection: interop.PointerConvertible,
): number

export declare function SSLGetConnection(
	context: interop.Object,
	connection: interop.PointerConvertible,
): number

export declare function SSLSetPeerDomainName(
	context: interop.Object,
	peerName: string,
	peerNameLen: number,
): number

export declare function SSLGetPeerDomainNameLength(
	context: interop.Object,
	peerNameLen: interop.PointerConvertible,
): number

export declare function SSLGetPeerDomainName(
	context: interop.Object,
	peerName: string,
	peerNameLen: interop.PointerConvertible,
): number

export declare function SSLCopyRequestedPeerNameLength(
	ctx: interop.Object,
	peerNameLen: interop.PointerConvertible,
): number

export declare function SSLCopyRequestedPeerName(
	context: interop.Object,
	peerName: string,
	peerNameLen: interop.PointerConvertible,
): number

export declare function SSLSetDatagramHelloCookie(
	dtlsContext: interop.Object,
	cookie: interop.PointerConvertible,
	cookieLen: number,
): number

export declare function SSLSetMaxDatagramRecordSize(
	dtlsContext: interop.Object,
	maxSize: number,
): number

export declare function SSLGetMaxDatagramRecordSize(
	dtlsContext: interop.Object,
	maxSize: interop.PointerConvertible,
): number

export declare function SSLGetNegotiatedProtocolVersion(
	context: interop.Object,
	protocol: interop.PointerConvertible,
): number

export declare function SSLGetNumberSupportedCiphers(
	context: interop.Object,
	numCiphers: interop.PointerConvertible,
): number

export declare function SSLGetSupportedCiphers(
	context: interop.Object,
	ciphers: interop.PointerConvertible,
	numCiphers: interop.PointerConvertible,
): number

export declare function SSLGetNumberEnabledCiphers(
	context: interop.Object,
	numCiphers: interop.PointerConvertible,
): number

export declare function SSLSetEnabledCiphers(
	context: interop.Object,
	ciphers: interop.PointerConvertible,
	numCiphers: number,
): number

export declare function SSLGetEnabledCiphers(
	context: interop.Object,
	ciphers: interop.PointerConvertible,
	numCiphers: interop.PointerConvertible,
): number

export declare function SSLSetSessionTicketsEnabled(
	context: interop.Object,
	enabled: number,
): number

export declare function SSLSetEnableCertVerify(
	context: interop.Object,
	enableVerify: number,
): number

export declare function SSLGetEnableCertVerify(
	context: interop.Object,
	enableVerify: interop.PointerConvertible,
): number

export declare function SSLSetAllowsExpiredCerts(
	context: interop.Object,
	allowsExpired: number,
): number

export declare function SSLGetAllowsExpiredCerts(
	context: interop.Object,
	allowsExpired: interop.PointerConvertible,
): number

export declare function SSLSetAllowsExpiredRoots(
	context: interop.Object,
	allowsExpired: number,
): number

export declare function SSLGetAllowsExpiredRoots(
	context: interop.Object,
	allowsExpired: interop.PointerConvertible,
): number

export declare function SSLSetAllowsAnyRoot(context: interop.Object, anyRoot: number): number

export declare function SSLGetAllowsAnyRoot(
	context: interop.Object,
	anyRoot: interop.PointerConvertible,
): number

export declare function SSLSetTrustedRoots(
	context: interop.Object,
	trustedRoots: interop.Object,
	replaceExisting: number,
): number

export declare function SSLCopyTrustedRoots(
	context: interop.Object,
	trustedRoots: interop.PointerConvertible,
): number

export declare function SSLCopyPeerCertificates(
	context: interop.Object,
	certs: interop.PointerConvertible,
): number

export declare function SSLCopyPeerTrust(
	context: interop.Object,
	trust: interop.PointerConvertible,
): number

export declare function SSLSetPeerID(
	context: interop.Object,
	peerID: interop.PointerConvertible,
	peerIDLen: number,
): number

export declare function SSLGetPeerID(
	context: interop.Object,
	peerID: interop.PointerConvertible,
	peerIDLen: interop.PointerConvertible,
): number

export declare function SSLGetNegotiatedCipher(
	context: interop.Object,
	cipherSuite: interop.PointerConvertible,
): number

export declare function SSLSetALPNProtocols(
	context: interop.Object,
	protocols: interop.Object,
): number

export declare function SSLCopyALPNProtocols(
	context: interop.Object,
	protocols: interop.PointerConvertible,
): number

export declare function SSLSetOCSPResponse(
	context: interop.Object,
	response: interop.Object,
): number

export declare function SSLSetEncryptionCertificate(
	context: interop.Object,
	certRefs: interop.Object,
): number

export declare function SSLSetClientSideAuthenticate(
	context: interop.Object,
	auth: interop.Enum<typeof SSLAuthenticate>,
): number

export declare function SSLAddDistinguishedName(
	context: interop.Object,
	derDN: interop.PointerConvertible,
	derDNLen: number,
): number

export declare function SSLSetCertificateAuthorities(
	context: interop.Object,
	certificateOrArray: interop.Object,
	replaceExisting: number,
): number

export declare function SSLCopyCertificateAuthorities(
	context: interop.Object,
	certificates: interop.PointerConvertible,
): number

export declare function SSLCopyDistinguishedNames(
	context: interop.Object,
	names: interop.PointerConvertible,
): number

export declare function SSLGetClientCertificateState(
	context: interop.Object,
	clientState: interop.PointerConvertible,
): number

export declare function SSLSetDiffieHellmanParams(
	context: interop.Object,
	dhParams: interop.PointerConvertible,
	dhParamsLen: number,
): number

export declare function SSLGetDiffieHellmanParams(
	context: interop.Object,
	dhParams: interop.PointerConvertible,
	dhParamsLen: interop.PointerConvertible,
): number

export declare function SSLSetRsaBlinding(context: interop.Object, blinding: number): number

export declare function SSLGetRsaBlinding(
	context: interop.Object,
	blinding: interop.PointerConvertible,
): number

export declare function SSLHandshake(context: interop.Object): number

export declare function SSLReHandshake(context: interop.Object): number

export declare function SSLWrite(
	context: interop.Object,
	data: interop.PointerConvertible,
	dataLength: number,
	processed: interop.PointerConvertible,
): number

export declare function SSLRead(
	context: interop.Object,
	data: interop.PointerConvertible,
	dataLength: number,
	processed: interop.PointerConvertible,
): number

export declare function SSLGetBufferedReadSize(
	context: interop.Object,
	bufferSize: interop.PointerConvertible,
): number

export declare function SSLGetDatagramWriteSize(
	dtlsContext: interop.Object,
	bufSize: interop.PointerConvertible,
): number

export declare function SSLClose(context: interop.Object): number

export declare function SSLSetError(context: interop.Object, status: number): number

export declare function SecTransformGetTypeID(): number

export declare function SecGroupTransformGetTypeID(): number

export declare function SecTransformCreateFromExternalRepresentation(
	dictionary: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecTransformCopyExternalRepresentation(
	transformRef: interop.Object,
): interop.Object

export declare function SecTransformCreateGroupTransform(): interop.Object

export declare function SecTransformConnectTransforms(
	sourceTransformRef: interop.Object,
	sourceAttributeName: interop.Object,
	destinationTransformRef: interop.Object,
	destinationAttributeName: interop.Object,
	group: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecTransformSetAttribute(
	transformRef: interop.Object,
	key: interop.Object,
	value: interop.Object,
	error: interop.PointerConvertible,
): number

export declare function SecTransformGetAttribute(
	transformRef: interop.Object,
	key: interop.Object,
): interop.Object

export declare function SecTransformFindByName(
	transform: interop.Object,
	name: interop.Object,
): interop.Object

export declare function SecTransformExecute(
	transformRef: interop.Object,
	errorRef: interop.PointerConvertible,
): interop.Object

export declare function SecTransformExecuteAsync(
	transformRef: interop.Object,
	deliveryQueue: NSObject,
	deliveryBlock: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: number,
	) => void,
): void

export declare function SecTransformSetAttributeAction(
	ref: interop.PointerConvertible,
	action: interop.Object,
	attribute: interop.Object,
	newAction: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => interop.Pointer,
): interop.Object

export declare function SecTransformSetDataAction(
	ref: interop.PointerConvertible,
	action: interop.Object,
	newAction: (p1: interop.PointerConvertible) => interop.Pointer,
): interop.Object

export declare function SecTransformSetTransformAction(
	ref: interop.PointerConvertible,
	action: interop.Object,
	newAction: () => interop.Pointer,
): interop.Object

export declare function SecTranformCustomGetAttribute(
	ref: interop.PointerConvertible,
	attribute: interop.Object,
	type: interop.Enum<typeof SecTransformMetaAttributeType>,
): interop.Object

export declare function SecTransformCustomGetAttribute(
	ref: interop.PointerConvertible,
	attribute: interop.Object,
	type: interop.Enum<typeof SecTransformMetaAttributeType>,
): interop.Object

export declare function SecTransformCustomSetAttribute(
	ref: interop.PointerConvertible,
	attribute: interop.Object,
	type: interop.Enum<typeof SecTransformMetaAttributeType>,
	value: interop.Object,
): interop.Object

export declare function SecTransformPushbackAttribute(
	ref: interop.PointerConvertible,
	attribute: interop.Object,
	value: interop.Object,
): interop.Object

export declare function SecTransformRegister(
	uniqueName: interop.Object,
	createTransformFunction: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => () => interop.Pointer,
	error: interop.PointerConvertible,
): number

export declare function SecTransformCreate(
	name: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecTransformNoData(): interop.Object

export declare function SecEncodeTransformCreate(
	encodeType: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecDecodeTransformCreate(
	DecodeType: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecDigestTransformCreate(
	digestType: interop.Object,
	digestLength: number,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecDigestTransformGetTypeID(): number

export declare function SecEncryptTransformCreate(
	keyRef: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecDecryptTransformCreate(
	keyRef: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecDecryptTransformGetTypeID(): number

export declare function SecEncryptTransformGetTypeID(): number

export declare function SecSignTransformCreate(
	key: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecVerifyTransformCreate(
	key: interop.Object,
	signature: interop.Object,
	error: interop.PointerConvertible,
): interop.Object

export declare function SecTransformCreateReadTransformWithReadStream(
	inputStream: interop.Object,
): interop.Object

export declare function AuthorizationPluginCreate(
	callbacks: interop.PointerConvertible,
	outPlugin: interop.PointerConvertible,
	outPluginInterface: interop.PointerConvertible,
): number

export declare function SecAsn1CoderCreate(coder: interop.PointerConvertible): number

export declare function SecAsn1CoderRelease(coder: interop.PointerConvertible): number

export declare function SecAsn1Decode(
	coder: interop.PointerConvertible,
	src: interop.PointerConvertible,
	len: number,
	templates: interop.PointerConvertible,
	dest: interop.PointerConvertible,
): number

export declare function SecAsn1DecodeData(
	coder: interop.PointerConvertible,
	src: interop.PointerConvertible,
	templ: interop.PointerConvertible,
	dest: interop.PointerConvertible,
): number

export declare function SecAsn1EncodeItem(
	coder: interop.PointerConvertible,
	src: interop.PointerConvertible,
	templates: interop.PointerConvertible,
	dest: interop.PointerConvertible,
): number

export declare function SecAsn1Malloc(
	coder: interop.PointerConvertible,
	len: number,
): interop.Pointer

export declare function SecAsn1AllocItem(
	coder: interop.PointerConvertible,
	item: interop.PointerConvertible,
	len: number,
): number

export declare function SecAsn1AllocCopy(
	coder: interop.PointerConvertible,
	src: interop.PointerConvertible,
	len: number,
	dest: interop.PointerConvertible,
): number

export declare function SecAsn1AllocCopyItem(
	coder: interop.PointerConvertible,
	src: interop.PointerConvertible,
	dest: interop.PointerConvertible,
): number

export declare function SecAsn1OidCompare(
	oid1: interop.PointerConvertible,
	oid2: interop.PointerConvertible,
): boolean

export declare function SecureDownloadCreateWithTicket(
	ticket: interop.Object,
	setup: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
	) => interop.Enum<typeof _SecureDownloadTrustCallbackResult>,
	setupContext: interop.PointerConvertible,
	evaluate: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof SecTrustResultType>,
		p3: interop.PointerConvertible,
	) => interop.Enum<typeof SecTrustResultType>,
	evaluateContext: interop.PointerConvertible,
	downloadRef: interop.PointerConvertible,
): number

export declare function SecureDownloadCopyURLs(
	downloadRef: interop.PointerConvertible,
	urls: interop.PointerConvertible,
): number

export declare function SecureDownloadCopyName(
	downloadRef: interop.PointerConvertible,
	name: interop.PointerConvertible,
): number

export declare function SecureDownloadCopyCreationDate(
	downloadRef: interop.PointerConvertible,
	date: interop.PointerConvertible,
): number

export declare function SecureDownloadGetDownloadSize(
	downloadRef: interop.PointerConvertible,
	downloadSize: interop.PointerConvertible,
): number

export declare function SecureDownloadUpdateWithData(
	downloadRef: interop.PointerConvertible,
	data: interop.Object,
): number

export declare function SecureDownloadFinished(downloadRef: interop.PointerConvertible): number

export declare function SecureDownloadRelease(downloadRef: interop.PointerConvertible): number

export declare function SecureDownloadCopyTicketLocation(
	url: interop.Object,
	ticketLocation: interop.PointerConvertible,
): number

export declare interface OS_sec_protocol_options extends NSObjectProtocol {}

export declare class OS_sec_protocol_options
	extends NativeObject
	implements OS_sec_protocol_options {}

export declare interface OS_sec_protocol_metadata extends NSObjectProtocol {}

export declare class OS_sec_protocol_metadata
	extends NativeObject
	implements OS_sec_protocol_metadata {}

export declare interface OS_sec_object extends NSObjectProtocol {}

export declare class OS_sec_object extends NativeObject implements OS_sec_object {}

export declare interface OS_sec_trust extends NSObjectProtocol {}

export declare class OS_sec_trust extends NativeObject implements OS_sec_trust {}

export declare interface OS_sec_certificate extends NSObjectProtocol {}

export declare class OS_sec_certificate extends NativeObject implements OS_sec_certificate {}

export declare interface OS_sec_identity extends NSObjectProtocol {}

export declare class OS_sec_identity extends NativeObject implements OS_sec_identity {}
