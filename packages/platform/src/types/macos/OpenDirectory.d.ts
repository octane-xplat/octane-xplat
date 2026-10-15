import type { NSArray, NSCopying, NSData, NSDictionary, NSError, NSOperationQueue, NSRunLoop } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { SFAuthorization } from './SecurityFoundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const ODTrustTypeAnonymous: string;

export declare const ODTrustTypeJoined: string;

export declare const ODPacketEncryptionSSL: number;

export declare const ODPacketEncryptionRequired: number;

export declare const ODPacketEncryptionAllow: number;

export declare const ODPacketSigningAllow: number;

export declare const ODFrameworkErrorDomain: string;

export declare const kODBackOffSeconds: string;

export declare const kODPolicyAttributeDaysUntilExpiration: string;

export declare const kODPolicyAttributeExpiresOnDayOfWeek: string;

export declare const kODPolicyAttributeExpiresOnDate: string;

export declare const kODPolicyAttributeEnableOnDate: string;

export declare const kODPolicyAttributeLastPasswordChangeTime: string;

export declare const kODPolicyAttributeLastAuthenticationTime: string;

export declare const kODPolicyAttributeLastFailedAuthenticationTime: string;

export declare const kODPolicyAttributeMaximumFailedAuthentications: string;

export declare const kODPolicyAttributeFailedAuthentications: string;

export declare const kODPolicyAttributeCurrentDayOfWeek: string;

export declare const kODPolicyAttributeCurrentTimeOfDay: string;

export declare const kODPolicyAttributePasswordHashes: string;

export declare const kODPolicyAttributeRecordType: string;

export declare const kODPolicyAttributeRecordName: string;

export declare const kODPolicyCategoryPasswordContent: string;

export declare const kODPolicyCategoryAuthentication: string;

export declare const kODPolicyKeyContentDescription: string;

export declare const kODPolicyKeyIdentifier: string;

export declare const kODExpirationTimeNeverExpires: number;

export declare const kODExpirationTimeExpired: number;

export declare const kODPolicyTypeAccountMaximumMinutesOfNonUse: string;

export declare const kODPolicyTypeAccountMaximumFailedLogins: string;

export declare const kODPolicyTypeAccountExpiresOnDate: string;

export declare const kODPolicyTypePasswordRequiresSymbol: string;

export declare const kODPolicyTypePasswordRequiresMixedCase: string;

export declare const kODPolicyTypePasswordRequiresAlpha: string;

export declare const kODPolicyTypePasswordMinimumNumberOfCharacters: string;

export declare const kODAuthenticationTypeSetPolicyAsCurrent: string;

export declare const kODAuthenticationTypeSetNTHash: string;

export declare const kODAuthenticationTypeSetLMHash: string;

export declare const kODAuthenticationTypeSetCertificateHashAsCurrent: string;

export declare const kODAuthenticationTypeSMB_NT_Key: string;

export declare const kODAuthenticationTypeSMB_LM_Key: string;

export declare const kODAuthenticationTypeSMBWorkstationCredentialSessionKey: string;

export declare const kODAuthenticationTypeReadSecureHash: string;

export declare const kODAuthenticationTypeNewUserWithPolicy: string;

export declare const kODAuthenticationTypeNTLMv2: string;

export declare const kODAuthenticationTypeMSCHAP2: string;

export declare const kODAuthenticationTypeMPPEMasterKeys: string;

export declare const kODAuthenticationTypeKerberosTickets: string;

export declare const kODAuthenticationTypeGetGlobalPolicy: string;

export declare const kODAuthenticationTypeDeleteUser: string;

export declare const kODAuthenticationTypeDIGEST_MD5: string;

export declare const kODAuthenticationTypeChangePasswd: string;

export declare const kODAuthenticationTypeCRAM_MD5: string;

export declare const kODAuthenticationType2WayRandom: string;

export declare const kODAttributeTypeAttrListValueRefs: string;

export declare const kODAttributeTypeRecRefs: string;

export declare const kODAttributeTypeNodeRefs: string;

export declare const kODAttributeTypeAttrListRefCount: string;

export declare const kODAttributeTypeRecRefCount: string;

export declare const kODAttributeTypeProcessName: string;

export declare const kODAttributeTypePIDValue: string;

export declare const kODAttributeTypeVersion: string;

export declare const kODAttributeTypeNumTableList: string;

export declare const kODAttributeTypeConfigFile: string;

export declare const kODAttributeTypeBuildVersion: string;

export declare const kODAttributeTypeParentLocales: string;

export declare const kODAttributeTypeLocaleRelay: string;

export declare const kODAttributeTypeAdvertisedServices: string;

export declare const kODAttributeTypeNodeOptions: string;

export declare const kODAttributeTypeCustomSearchPath: string;

export declare const kODAttributeTypeAutomaticSearchPath: string;

export declare const kODAttributeTypeNetGroupTriplet: string;

export declare const kODAttributeTypeSubNodes: string;

export declare const kODAttributeTypeSchema: string;

export declare const kODAttributeTypeRecordType: string;

export declare const kODAttributeTypeAuthMethod: string;

export declare const kODAttributeTypeTimePackage: string;

export declare const kODAttributeTypeReadOnlyNode: string;

export declare const kODAttributeTypePwdAgingPolicy: string;

export declare const kODAttributeTypeOriginalHomeDirectory: string;

export declare const kODAttributeTypeKerberosRealm: string;

export declare const kODAttributeTypeCopyTimestamp: string;

export declare const kODAttributeTypeAuthCredential: string;

export declare const kODAttributeTypeAlias: string;

export declare const kODAttributeTypeURL: string;

export declare const kODAttributeTypeNameSuffix: string;

export declare const kODAttributeTypeResourceType: string;

export declare const kODAttributeTypeProtocols: string;

export declare const kODAttributeTypeProfiles: string;

export declare const kODAttributeTypePGPPublicKey: string;

export declare const kODAttributeTypePagerNumber: string;

export declare const kODAttributeTypeOrganizationName: string;

export declare const kODAttributeTypeNickName: string;

export declare const kODAttributeTypeIPAddress: string;

export declare const kODAttributeTypeHTML: string;

export declare const kODAttributeTypeGroupMembership: string;

export declare const kODAttributeTypeGroupMembers: string;

export declare const kODAttributeTypeEMailContacts: string;

export declare const kODAttributeTypeDNSName: string;

export declare const kODAttributeTypeDepartment: string;

export declare const kODAttributeTypeServicesLocator: string;

export declare const kODAttributeTypeBootParams: string;

export declare const kODAttributeTypeAuthenticationAuthority: string;

export declare const kODAttributeTypeAreaCode: string;

export declare const kODAttributeTypeAddressLine2: string;

export declare const kODAttributeTypeAddressLine1: string;

export declare const kODAttributeTypeNetworkNumber: string;

export declare const kODAttributeTypeDirRefs: string;

export declare const kODAttributeTypeRPCNumber: string;

export declare const kODAttributeTypeXMLPlist: string;

export declare const kODAttributeTypeWeblogURI: string;

export declare const kODAttributeTypeVFSDumpFreq: string;

export declare const kODAttributeTypeUserShell: string;

export declare const kODAttributeTypeTrustInformation: string;

export declare const kODAttributeTypeSetupOccupation: string;

export declare const kODAttributeTypeSetupLocation: string;

export declare const kODAttributeTypeSetupAutoRegister: string;

export declare const kODAttributeTypeSetupAdvertising: string;

export declare const kODAttributeTypeServiceType: string;

export declare const kODAttributeTypeSMBSID: string;

export declare const kODAttributeTypeSMBRID: string;

export declare const kODAttributeTypeSMBLogonTime: string;

export declare const kODAttributeTypeSMBLogoffTime: string;

export declare const kODAttributeTypeSMBHomeDrive: string;

export declare const kODAttributeTypeSMBHome: string;

export declare const kODAttributeTypeRelativeDNPrefix: string;

export declare const kODAttributeTypeRealUserID: string;

export declare const kODAttributeTypePrintServiceUserData: string;

export declare const kODAttributeTypePrintServiceInfoXML: string;

export declare const kODAttributeTypePrintServiceInfoText: string;

export declare const kODAttributeTypePrinterXRISupported: string;

export declare const kODAttributeTypePrinterMakeAndModel: string;

export declare const kODAttributeTypePrinter1284DeviceID: string;

export declare const kODAttributeTypePrimaryComputerList: string;

export declare const kODAttributeTypePresetUserIsAdmin: string;

export declare const kODAttributeTypePort: string;

export declare const kODAttributeTypePasswordServerLocation: string;

export declare const kODAttributeTypePasswordServerList: string;

export declare const kODAttributeTypeOwner: string;

export declare const kODAttributeTypeNote: string;

export declare const kODAttributeTypeMiddleName: string;

export declare const kODAttributeTypeKerberosServices: string;

export declare const kODAttributeTypeInternetAlias: string;

export declare const kODAttributeTypeHomeLocOwner: string;

export declare const kODAttributeTypeHomeDirectorySoftQuota: string;

export declare const kODAttributeTypeHomeDirectoryQuota: string;

export declare const kODAttributeTypeHardwareUUID: string;

export declare const kODAttributeTypeFirstName: string;

export declare const kODAttributeTypeDNSNameServer: string;

export declare const kODAttributeTypeDNSDomain: string;

export declare const kODAttributeTypeCertificateRevocationList: string;

export declare const kODAttributeTypeCACertificate: string;

export declare const kODAttributeTypeAllTypes: string;

export declare const kODAttributeTypeAdminLimits: string;

export declare const kODAttributeTypeMetaAugmentedAttributes: string;

export declare const kODAttributeTypeNativeOnly: string;

export declare const kODRecordTypeUsers: string;

export declare const kODRecordTypeSharePoints: string;

export declare const kODRecordTypeServer: string;

export declare const kODRecordTypeSMBServer: string;

export declare const kODRecordTypeResources: string;

export declare const kODRecordTypeRecordTypes: string;

export declare const kODRecordTypeQueryInformation: string;

export declare const kODRecordTypeProtocols: string;

export declare const kODRecordTypePrintService: string;

export declare const kODRecordTypePresetUsers: string;

export declare const kODRecordTypePresetComputers: string;

export declare const kODRecordTypePeople: string;

export declare const kODRecordTypeLocations: string;

export declare const kODRecordTypeLDAPServer: string;

export declare const kODRecordTypeFTPServer: string;

export declare const kODRecordTypeFileMakerServers: string;

export declare const kODRecordTypeConfiguration: string;

export declare const kODRecordTypeComputers: string;

export declare const kODRecordTypeComputerGroups: string;

export declare const kODRecordTypeComputerLists: string;

export declare const kODRecordTypeBootp: string;

export declare const kODRecordTypeAutoServerSetup: string;

export declare const kODRecordTypeAutomountMap: string;

export declare const kODRecordTypeAutomount: string;

export declare const kODRecordTypeAFPServer: string;

export declare const kODMatchLessThan: number;

export declare const kODMatchInsensitiveEndsWith: number;

export declare const kODMatchInsensitiveEqualTo: number;

export declare const kODMatchEndsWith: number;

export declare const kODMatchBeginsWith: number;

export declare const kODMatchEqualTo: number;

export declare const kODMatchAny: number;

export declare const kODNodeTypeConfigure: number;

export declare const kODNodeTypeNetwork: number;

export declare const kODModuleConfigOptionManInTheMiddle: interop.Pointer;

export declare const kODSessionProxyUsername: interop.Pointer;

export declare const kODErrorDomainFramework: interop.Pointer;

export declare const kODAuthenticationTypeNodeNativeClearTextOK: string;

export declare const kODNodeTypeContacts: number;

export declare const kODAuthenticationTypeGetKerberosPrincipal: string;

export declare const kODNodeOptionsQuerySkippedSubnode: interop.Pointer;

export declare const kODAttributeTypeMetaAutomountMap: string;

export declare const kODPolicyTypePasswordMaximumAgeInMinutes: string;

export declare const kODAttributeTypeMCXFlags: string;

export declare const kODRecordTypeEthernets: string;

export declare const ODPacketSigningDisabled: number;

export declare const kODRecordTypeNetworks: string;

export declare const kODMatchInsensitiveContains: number;

export declare const kODAttributeTypeNodeSASLRealm: string;

export declare const kODAttributeTypeDateRecordCreated: string;

export declare const kODAttributeTypeCountry: string;

export declare const kODSessionProxyPassword: interop.Pointer;

export declare const kODAttributeTypeGroup: string;

export declare const ODTrustTypeUsingCredentials: string;

export declare const kODSessionProxyPort: interop.Pointer;

export declare const kODAttributeTypeBuilding: string;

export declare const kODAttributeTypeSMBUserWorkstations: string;

export declare const kODAttributeTypeUserCertificate: string;

export declare const kODAttributeTypeAuthorityRevocationList: string;

export declare const kODAttributeTypeEMailAddress: string;

export declare const kODPolicyAttributeCurrentDate: string;

export declare const kODPolicyKeyParameters: string;

export declare const kODAttributeTypeAccessControlEntry: string;

export declare const kODAttributeTypeMIME: string;

export declare const kODAuthenticationTypeSetPassword: string;

export declare const kODAuthenticationTypeWithAuthorizationRef: string;

export declare const kODModuleConfigOptionPacketEncryption: interop.Pointer;

export declare const kODAttributeTypeDirRefCount: string;

export declare const kODAttributeTypeProtocolNumber: string;

export declare const kODRecordTypePresetComputerLists: string;

export declare const kODAttributeTypeBirthday: string;

export declare const kODPolicyTypePasswordMaximumNumberOfCharacters: string;

export declare const kODAttributeTypeExpire: string;

export declare const kODAttributeTypeSMBGroupRID: string;

export declare const kODAttributeTypeTimeToLive: string;

export declare const kODAttributeTypeAutomountInformation: string;

export declare const kODRecordTypePresetComputerGroups: string;

export declare const kODAuthenticationTypeSecureHash: string;

export declare const kODAttributeTypePostalAddressContacts: string;

export declare const kODAttributeTypeStreet: string;

export declare const kODRecordTypeNetDomains: string;

export declare const kODAttributeTypeIPv6Address: string;

export declare const kODAttributeTypeMobileNumber: string;

export declare const kODAttributeTypeNetworkInterfaces: string;

export declare const kODAttributeTypeHomePhoneNumber: string;

export declare const kODAttributeTypeModificationTimestamp: string;

export declare const kODAttributeTypePhoneContacts: string;

export declare const kODAttributeTypeTotalSize: string;

export declare const kODAttributeTypeUserSMIMECertificate: string;

export declare const kODMatchInsensitiveBeginsWith: number;

export declare const kODAttributeTypeAttrListValueRefCount: string;

export declare const kODAttributeTypePrinterLPRQueue: string;

export declare const kODPolicyAttributeExpiresAtTimeOfDay: string;

export declare const kODAttributeTypeGUID: string;

export declare const kODAuthenticationTypeSetWorkstationPassword: string;

export declare const kODAttributeTypeRecordName: string;

export declare const kODAttributeTypeOperatingSystem: string;

export declare const kODAttributeTypeOrganizationInfo: string;

export declare const kODAttributeTypeAllAttributes: string;

export declare const kODAttributeTypeLDAPSearchBaseSuffix: string;

export declare const kODRecordTypeWebServer: string;

export declare const kODAuthenticationTypeSMBNTv2UserSessionKey: string;

export declare const kODAttributeTypeMCXSettings: string;

export declare const kODAttributeTypeOperatingSystemVersion: string;

export declare const kODPolicyAttributeNewPasswordRequiredTime: string;

export declare const kODAttributeTypeMetaAmbiguousName: string;

export declare const kODRecordTypePrintServiceUser: string;

export declare const kODRecordTypeHosts: string;

export declare const kODAttributeTypeSMBAcctFlags: string;

export declare const kODPolicyAttributeCreationTime: string;

export declare const kODRecordTypeNFS: string;

export declare const kODPolicyAttributePasswordHistory: string;

export declare const kODAuthenticationTypeSetGlobalPolicy: string;

export declare const kODAttributeTypeMailAttribute: string;

export declare const kODAttributeTypeMapCoordinates: string;

export declare const kODAuthenticationTypeSetPolicy: string;

export declare const kODAttributeTypeJobTitle: string;

export declare const kODAttributeTypeCompany: string;

export declare const kODRecordTypeNetGroups: string;

export declare const ODSessionProxyAddress: string;

export declare const kODAttributeTypeOriginalNFSHomeDirectory: string;

export declare const kODAttributeTypePrinterLPRHost: string;

export declare const kODAttributeTypePasswordPolicyOptions: string;

export declare const kODAttributeTypeSMBProfilePath: string;

export declare const kODAttributeTypeMapURI: string;

export declare const kODAttributeTypeTotalRefCount: string;

export declare const kODRecordTypeAliases: string;

export declare const kODAttributeTypeKeywords: string;

export declare const kODAttributeTypePassword: string;

export declare const kODAttributeTypeRelationships: string;

export declare const kODAttributeTypeSMBKickoffTime: string;

export declare const kODAttributeTypeIPAddressAndENetAddress: string;

export declare const kODAttributeTypeAuthenticationHint: string;

export declare const kODAttributeTypePluginIndex: string;

export declare const kODAuthenticationTypeCrypt: string;

export declare const kODAttributeTypeContactPerson: string;

export declare const ODSessionProxyPassword: string;

export declare const kODAttributeTypeIMHandle: string;

export declare const kODPolicyTypePasswordCannotBeAccountName: string;

export declare const kODAttributeTypeCreationTimestamp: string;

export declare const kODAttributeTypeUserPKCS12Data: string;

export declare const kODAttributeTypeFullName: string;

export declare const ODSessionProxyPort: string;

export declare const kODAttributeTypePhoneNumber: string;

export declare const kODPolicyAttributeEnableAtTimeOfDay: string;

export declare const kODRecordTypeRPC: string;

export declare const kODAttributeTypeOriginalNodeName: string;

export declare const kODAttributeTypeKDCConfigData: string;

export declare const kODAttributeTypeMetaRecordName: string;

export declare const kODAttributeTypeComputers: string;

export declare const kODAttributeTypeMetaNodeLocation: string;

export declare const kODAttributeTypeNamePrefix: string;

export declare const kODAttributeTypeDataStamp: string;

export declare const kODAttributeTypeProfilesTimestamp: string;

export declare const kODAuthenticationTypeClearTextReadOnly: string;

export declare const kODAttributeTypeSMBPWDLastSet: string;

export declare const kODAttributeTypeHomeDirectory: string;

export declare const kODAttributeTypeJPEGPhoto: string;

export declare const kODPolicyTypeAccountMaximumMinutesUntilDisabled: string;

export declare const kODAttributeTypeCrossCertificatePair: string;

export declare const kODModuleConfigOptionQueryTimeout: interop.Pointer;

export declare const kODAttributeTypeCapacity: string;

export declare const kODRecordTypePresetGroups: string;

export declare const kODPolicyCategoryPasswordChange: string;

export declare const kODModuleConfigOptionConnectionSetupTimeout: interop.Pointer;

export declare const kODAttributeTypeFaxNumber: string;

export declare const kODAuthenticationTypeAPOP: string;

export declare const kODAttributeTypePrimaryLocale: string;

export declare const kODAttributeTypeSMBScriptPath: string;

export declare const kODAttributeTypeSearchPath: string;

export declare const kODRecordTypeServices: string;

export declare const kODAttributeTypeNFSHomeDirectory: string;

export declare const kODPolicyKeyEvaluationDetails: string;

export declare const kODAttributeTypeContactGUID: string;

export declare const kODAuthenticationTypeMPPEPrimaryKeys: string;

export declare const kODAuthenticationTypeSMB_NT_WithUserSessionKey: string;

export declare const kODAttributeTypeNodeRefCount: string;

export declare const kODAttributeTypeGroupServices: string;

export declare const kODAttributeTypePlugInInfo: string;

export declare const kODPolicyAttributePasswordHistoryDepth: string;

export declare const kODPolicyTypeAccountMinutesUntilFailedLoginReset: string;

export declare const kODPolicyAttributeExpiresEveryNDays: string;

export declare const kODRecordTypeMounts: string;

export declare const kODAuthenticationTypeGetEffectivePolicy: string;

export declare const kODMatchContains: number;

export declare const kODAuthenticationTypeSMB_NT_UserSessionKey: string;

export declare const kODAuthenticationTypeNewUser: string;

export declare const kODAttributeTypeLocation: string;

export declare const kODAttributeTypeState: string;

export declare const kODModuleConfigOptionPacketSigning: interop.Pointer;

export declare const kODAttributeTypePicture: string;

export declare const kODAttributeTypeCity: string;

export declare const kODAttributeTypeOwnerGUID: string;

export declare const kODPolicyTypePasswordChangeRequired: string;

export declare const kODAttributeTypePrinterURI: string;

export declare const kODAttributeTypeAltSecurityIdentities: string;

export declare const kODAttributeTypeENetAddress: string;

export declare const kODAttributeTypeLDAPReadReplicas: string;

export declare const kODAttributeTypeVFSLinkDir: string;

export declare const kODAttributeTypeSMBPrimaryGroupSID: string;

export declare const kODPolicyKeyPolicySatisfied: string;

export declare const kODAttributeTypePostalAddress: string;

export declare const kODAuthenticationTypeSetUserName: string;

export declare const kODAttributeTypeResourceInfo: string;

export declare const kODPolicyTypePasswordRequiresNumeric: string;

export declare const kODAttributeTypeFWVersion: string;

export declare const kODAttributeTypeConfigAvailable: string;

export declare const kODAuthenticationTypeGetPolicy: string;

export declare const kODAttributeTypePrinterType: string;

export declare const kODAttributeTypeComment: string;

export declare const kODNodeTypeLocalNodes: number;

export declare const ODSessionProxyUsername: string;

export declare const kODSessionProxyAddress: interop.Pointer;

export declare const kODAttributeTypeVFSPassNo: string;

export declare const kODPolicyAttributeEnableOnDayOfWeek: string;

export declare const kODSessionDefault: interop.Object;

export declare const kODAuthenticationTypeSetUserData: string;

export declare const kODNodeTypeAuthentication: number;

export declare const kODRecordTypeQTSServer: string;

export declare const kODAuthenticationTypeGetUserName: string;

export declare const kODAuthenticationTypeNodeNativeNoClearText: string;

export declare const kODAttributeTypePostalCode: string;

export declare const kODMatchGreaterThan: number;

export declare const kODAttributeTypeNodePath: string;

export declare const kODAttributeTypePasswordPlus: string;

export declare const kODRecordTypeGroups: string;

export declare const kODPolicyAttributePassword: string;

export declare const kODAttributeTypeNTDomainComputerAccount: string;

export declare const kODAttributeTypeUniqueID: string;

export declare const kODAttributeTypeLastName: string;

export declare const kODRecordTypePrinters: string;

export declare const kODAttributeTypePrimaryGroupID: string;

export declare const kODRecordTypeAttributeTypes: string;

export declare const kODAuthenticationTypeWriteSecureHash: string;

export declare const kODAttributeTypeSearchPolicy: string;

export declare const kODAttributeTypeNestedGroups: string;

export declare const kODAttributeTypeStandardOnly: string;

export declare const kODAttributeTypePrimaryNTDomain: string;

export declare const kODAttributeTypeLocaleSubnets: string;

export declare const kODAuthenticationType2WayRandomChangePasswd: string;

export declare const kODAuthenticationTypeClearText: string;

export declare const kODAttributeTypeNetGroups: string;

export declare const kODAttributeTypeVFSOpts: string;

export declare const ODPacketSigningRequired: number;

export declare const kODPolicyAttributeCurrentTime: string;

export declare const kODAttributeTypePrimaryComputerGUID: string;

export declare const kODRecordTypeAugments: string;

export declare const kODAttributeTypeLocalOnlySearchPath: string;

export declare const kODPolicyTypePasswordSelfModification: string;

export declare const kODAttributeTypeCoreFWVersion: string;

export declare const kODAttributeTypeKDCAuthKey: string;

export declare const kODModuleConfigOptionConnectionIdleDisconnect: interop.Pointer;

export declare const kODRecordTypeCertificateAuthorities: string;

export declare const kODAttributeTypeMapGUID: string;

export declare const kODAuthenticationTypeNTLMv2WithSessionKey: string;

export declare const kODAttributeTypeAttrListRefs: string;

export declare const kODAuthenticationTypeGetUserData: string;

export declare const ODPacketEncryptionDisabled: number;

export declare const kODAttributeTypeAddressLine3: string;

export declare const kODAuthenticationTypeSetPasswordAsCurrent: string;

export declare const kODAttributeTypeVFSType: string;

export declare const kODPolicyKeyContent: string;

export declare const kODAttributeTypeFunctionalState: string;

export declare const kODPolicyTypePasswordHistory: string;

export declare const kODAttributeTypeLDAPWriteReplicas: string;

export declare const kODRecordTypeHostServices: string;

export declare const ODFrameworkErrors: {
  Success: 0,
  SessionLocalOnlyDaemonInUse: 1000,
  SessionNormalDaemonInUse: 1001,
  SessionDaemonNotRunning: 1002,
  SessionDaemonRefused: 1003,
  SessionProxyCommunicationError: 1100,
  SessionProxyVersionMismatch: 1101,
  SessionProxyIPUnreachable: 1102,
  SessionProxyUnknownHost: 1103,
  NodeUnknownName: 2000,
  NodeUnknownType: 2001,
  NodeDisabled: 2002,
  NodeConnectionFailed: 2100,
  NodeUnknownHost: 2200,
  QuerySynchronize: 3000,
  QueryInvalidMatchType: 3100,
  QueryUnsupportedMatchType: 3101,
  QueryTimeout: 3102,
  RecordReadOnlyNode: 4000,
  RecordPermissionError: 4001,
  RecordParameterError: 4100,
  RecordInvalidType: 4101,
  RecordAlreadyExists: 4102,
  RecordTypeDisabled: 4103,
  RecordNoLongerExists: 4104,
  RecordAttributeUnknownType: 4200,
  RecordAttributeNotFound: 4201,
  RecordAttributeValueSchemaError: 4202,
  RecordAttributeValueNotFound: 4203,
  CredentialsInvalid: 5000,
  CredentialsMethodNotSupported: 5100,
  CredentialsNotAuthorized: 5101,
  CredentialsParameterError: 5102,
  CredentialsOperationFailed: 5103,
  CredentialsServerUnreachable: 5200,
  CredentialsServerNotFound: 5201,
  CredentialsServerError: 5202,
  CredentialsServerTimeout: 5203,
  CredentialsContactPrimary: 5204,
  CredentialsContactMaster: 5204,
  CredentialsServerCommunicationError: 5205,
  CredentialsAccountNotFound: 5300,
  CredentialsAccountDisabled: 5301,
  CredentialsAccountExpired: 5302,
  CredentialsAccountInactive: 5303,
  CredentialsAccountTemporarilyLocked: 5304,
  CredentialsAccountLocked: 5305,
  CredentialsPasswordExpired: 5400,
  CredentialsPasswordChangeRequired: 5401,
  CredentialsPasswordQualityFailed: 5402,
  CredentialsPasswordTooShort: 5403,
  CredentialsPasswordTooLong: 5404,
  CredentialsPasswordNeedsLetter: 5405,
  CredentialsPasswordNeedsDigit: 5406,
  CredentialsPasswordChangeTooSoon: 5407,
  CredentialsPasswordUnrecoverable: 5408,
  CredentialsInvalidLogonHours: 5500,
  CredentialsInvalidComputer: 5501,
  PolicyUnsupported: 6000,
  PolicyOutOfRange: 6001,
  PluginOperationNotSupported: 10000,
  PluginError: 10001,
  DaemonError: 10002,
  PluginOperationTimeout: 10003,
};

export declare class __ODSession {
  constructor(init?: __ODSession);
}

export declare class __ODRecord {
  constructor(init?: __ODRecord);
}

export declare class __ODNode {
  constructor(init?: __ODNode);
}

export declare class __ODQuery {
  constructor(init?: __ODQuery);
}

export declare class __ODContext {
  constructor(init?: __ODContext);
}

export declare function ODContextGetTypeID(): number;

export declare function ODNodeGetTypeID(): number;

export declare function ODNodeCreateWithNodeType(allocator: interop.Object, session: interop.Object, nodeType: number, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCreateWithName(allocator: interop.Object, session: interop.Object, nodeName: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCreateCopy(allocator: interop.Object, node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopySubnodeNames(node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopyUnreachableSubnodeNames(node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeGetName(node: interop.Object): interop.Object;

export declare function ODNodeCopyDetails(node: interop.Object, keys: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopySupportedRecordTypes(node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopySupportedAttributes(node: interop.Object, recordType: string, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeSetCredentials(node: interop.Object, recordType: string, recordName: interop.Object, password: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODNodeSetCredentialsExtended(node: interop.Object, recordType: string, authType: string, authItems: interop.Object, outAuthItems: interop.PointerConvertible, outContext: interop.PointerConvertible, error: interop.PointerConvertible): boolean;

export declare function ODNodeSetCredentialsUsingKerberosCache(node: interop.Object, cacheName: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODNodeCreateRecord(node: interop.Object, recordType: string, recordName: interop.Object, attributeDict: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopyRecord(node: interop.Object, recordType: string, recordName: interop.Object, attributes: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCustomCall(node: interop.Object, customCode: number, data: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCustomFunction(node: interop.Object, function$: interop.Object, payload: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopyPolicies(node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeCopySupportedPolicies(node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodeSetPolicies(node: interop.Object, policies: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODNodeSetPolicy(node: interop.Object, policyType: string, value: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODNodeRemovePolicy(node: interop.Object, policyType: string, error: interop.PointerConvertible): boolean;

export declare function ODNodeAddAccountPolicy(node: interop.Object, policy: interop.Object, category: string, error: interop.PointerConvertible): boolean;

export declare function ODNodeRemoveAccountPolicy(node: interop.Object, policy: interop.Object, category: string, error: interop.PointerConvertible): boolean;

export declare function ODNodeSetAccountPolicies(node: interop.Object, policies: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODNodeCopyAccountPolicies(node: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODNodePasswordContentCheck(node: interop.Object, password: interop.Object, recordName: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODQueryGetTypeID(): number;

export declare function ODQueryCreateWithNode(allocator: interop.Object, node: interop.Object, recordTypeOrList: interop.Object, attribute: string, matchType: number, queryValueOrList: interop.Object, returnAttributeOrList: interop.Object, maxResults: number, error: interop.PointerConvertible): interop.Object;

export declare function ODQueryCreateWithNodeType(allocator: interop.Object, nodeType: number, recordTypeOrList: interop.Object, attribute: string, matchType: number, queryValueOrList: interop.Object, returnAttributeOrList: interop.Object, maxResults: number, error: interop.PointerConvertible): interop.Object;

export declare function ODQueryCopyResults(query: interop.Object, allowPartialResults: boolean, error: interop.PointerConvertible): interop.Object;

export declare function ODQuerySynchronize(query: interop.Object): void;

export declare function ODQuerySetCallback(query: interop.Object, callback: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible, p4: interop.PointerConvertible) => void, userInfo: interop.PointerConvertible): void;

export declare function ODQueryScheduleWithRunLoop(query: interop.Object, runLoop: interop.Object, runLoopMode: interop.Object): void;

export declare function ODQueryUnscheduleFromRunLoop(query: interop.Object, runLoop: interop.Object, runLoopMode: interop.Object): void;

export declare function ODQuerySetDispatchQueue(query: interop.Object, queue: NSObject): void;

export declare function ODRecordGetTypeID(): number;

export declare function ODRecordSetNodeCredentials(record: interop.Object, username: interop.Object, password: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordSetNodeCredentialsExtended(record: interop.Object, recordType: string, authType: string, authItems: interop.Object, outAuthItems: interop.PointerConvertible, outContext: interop.PointerConvertible, error: interop.PointerConvertible): boolean;

export declare function ODRecordSetNodeCredentialsUsingKerberosCache(record: interop.Object, cacheName: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordCopyPasswordPolicy(allocator: interop.Object, record: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordVerifyPassword(record: interop.Object, password: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordVerifyPasswordExtended(record: interop.Object, authType: string, authItems: interop.Object, outAuthItems: interop.PointerConvertible, outContext: interop.PointerConvertible, error: interop.PointerConvertible): boolean;

export declare function ODRecordChangePassword(record: interop.Object, oldPassword: interop.Object, newPassword: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordGetRecordType(record: interop.Object): interop.Object;

export declare function ODRecordGetRecordName(record: interop.Object): interop.Object;

export declare function ODRecordCopyValues(record: interop.Object, attribute: string, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordSetValue(record: interop.Object, attribute: string, valueOrValues: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordAddValue(record: interop.Object, attribute: string, value: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordRemoveValue(record: interop.Object, attribute: string, value: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordCopyDetails(record: interop.Object, attributes: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordSynchronize(record: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordDelete(record: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordAddMember(group: interop.Object, member: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordRemoveMember(group: interop.Object, member: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordContainsMember(group: interop.Object, member: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordCopyPolicies(record: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordCopyEffectivePolicies(record: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordCopySupportedPolicies(record: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordSetPolicies(record: interop.Object, policies: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordSetPolicy(record: interop.Object, policy: string, value: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordRemovePolicy(record: interop.Object, policy: string, error: interop.PointerConvertible): boolean;

export declare function ODRecordAddAccountPolicy(record: interop.Object, policy: interop.Object, category: string, error: interop.PointerConvertible): boolean;

export declare function ODRecordRemoveAccountPolicy(record: interop.Object, policy: interop.Object, category: string, error: interop.PointerConvertible): boolean;

export declare function ODRecordSetAccountPolicies(record: interop.Object, policies: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordCopyAccountPolicies(record: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODRecordAuthenticationAllowed(record: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordPasswordChangeAllowed(record: interop.Object, newPassword: interop.Object, error: interop.PointerConvertible): boolean;

export declare function ODRecordWillPasswordExpire(record: interop.Object, willExpireIn: number): boolean;

export declare function ODRecordWillAuthenticationsExpire(record: interop.Object, willExpireIn: number): boolean;

export declare function ODRecordSecondsUntilPasswordExpires(record: interop.Object): number;

export declare function ODRecordSecondsUntilAuthenticationsExpire(record: interop.Object): number;

export declare function ODSessionGetTypeID(): number;

export declare function ODSessionCreate(allocator: interop.Object, options: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare function ODSessionCopyNodeNames(allocator: interop.Object, session: interop.Object, error: interop.PointerConvertible): interop.Object;

export declare interface ODQueryDelegate extends NSObjectProtocol {
  queryFoundResultsError(inQuery: ODQuery, inResults: NSArray<interop.Object> | Array<interop.Object>, inError: NSError): void;
}

export declare class ODQueryDelegate extends NativeObject implements ODQueryDelegate {
}

export declare class ODContext extends NSObject {
}

export declare class ODRecordMap extends NSObject {
  native: string;

  get odPredicate(): NSDictionary;
  set odPredicate(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  readonly attributes: NSDictionary;

  readonly standardAttributeTypes: NSArray;

  static recordMap<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  attributeMapForStandardAttribute(standardAttribute: string): ODAttributeMap;

  setAttributeMapForStandardAttribute(attributeMap: ODAttributeMap, standardAttribute: string): void;
}

export declare class ODMappings extends NSObject {
  comment: string;

  templateName: string;

  identifier: string;

  readonly recordTypes: NSArray;

  function$: string;

  get functionAttributes(): NSArray;
  set functionAttributes(value: NSArray<interop.Object> | Array<interop.Object>);

  static mappings<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  recordMapForStandardRecordType(stdType: string): ODRecordMap;

  setRecordMapForStandardRecordType(map: ODRecordMap, stdType: string): void;

  function(): string;
}

export declare class ODConfiguration extends NSObject {
  nodeName: string;

  comment: string;

  defaultMappings: ODMappings;

  templateName: string;

  get virtualSubnodes(): NSArray;
  set virtualSubnodes(value: NSArray<interop.Object> | Array<interop.Object>);

  hideRegistration: boolean;

  preferredDestinationHostName: string;

  preferredDestinationHostPort: number;

  readonly trustAccount: string;

  readonly trustMetaAccount: string;

  readonly trustKerberosPrincipal: string;

  readonly trustType: string;

  readonly trustUsesMutualAuthentication: boolean;

  readonly trustUsesKerberosKeytab: boolean;

  readonly trustUsesSystemKeychain: boolean;

  packetSigning: number;

  packetEncryption: number;

  manInTheMiddleProtection: boolean;

  queryTimeoutInSeconds: number;

  connectionSetupTimeoutInSeconds: number;

  connectionIdleTimeoutInSeconds: number;

  get defaultModuleEntries(): NSArray;
  set defaultModuleEntries(value: NSArray<interop.Object> | Array<interop.Object>);

  get authenticationModuleEntries(): NSArray;
  set authenticationModuleEntries(value: NSArray<interop.Object> | Array<interop.Object>);

  get discoveryModuleEntries(): NSArray;
  set discoveryModuleEntries(value: NSArray<interop.Object> | Array<interop.Object>);

  get generalModuleEntries(): NSArray;
  set generalModuleEntries(value: NSArray<interop.Object> | Array<interop.Object>);

  static configuration<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  static suggestedTrustAccount(hostname: string): string;

  static suggestedTrustPassword(length: number): string;

  saveUsingAuthorizationError(authorization: SFAuthorization, error: interop.PointerConvertible): boolean;

  addTrustTypeTrustAccountTrustPasswordUsernamePasswordJoinExistingError(trustType: string, account: string, accountPassword: string, username: string, password: string, join: boolean, error: interop.PointerConvertible): boolean;

  removeTrustUsingUsernamePasswordDeleteTrustAccountError(username: string, password: string, deleteAccount: boolean, error: interop.PointerConvertible): boolean;
}

export declare class ODQuery extends NSObject implements NSCopying {
  static queryWithNodeForRecordTypesAttributeMatchTypeQueryValuesReturnAttributesMaximumResultsError(inNode: ODNode, inRecordTypeOrList: interop.Object, inAttribute: string, inMatchType: number, inQueryValueOrList: interop.Object, inReturnAttributeOrList: interop.Object, inMaximumResults: number, outError: interop.PointerConvertible): ODQuery;

  initWithNodeForRecordTypesAttributeMatchTypeQueryValuesReturnAttributesMaximumResultsError(inNode: ODNode, inRecordTypeOrList: interop.Object, inAttribute: string, inMatchType: number, inQueryValueOrList: interop.Object, inReturnAttributeOrList: interop.Object, inMaximumResults: number, outError: interop.PointerConvertible): this;

  resultsAllowingPartialError(inAllowPartialResults: boolean, outError: interop.PointerConvertible): NSArray;

  delegate: ODQueryDelegate;

  scheduleInRunLoopForMode(inRunLoop: NSRunLoop, inMode: string): void;

  removeFromRunLoopForMode(inRunLoop: NSRunLoop, inMode: string): void;

  synchronize(): void;

  operationQueue: NSOperationQueue;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class ODNode extends NSObject {
  static nodeWithSessionTypeError<This extends abstract new (...args: any) => any>(this: This, inSession: ODSession, inType: number, outError: interop.PointerConvertible): InstanceType<This>;

  static nodeWithSessionNameError<This extends abstract new (...args: any) => any>(this: This, inSession: ODSession, inName: string, outError: interop.PointerConvertible): InstanceType<This>;

  initWithSessionTypeError(inSession: ODSession, inType: number, outError: interop.PointerConvertible): this;

  initWithSessionNameError(inSession: ODSession, inName: string, outError: interop.PointerConvertible): this;

  subnodeNamesAndReturnError(outError: interop.PointerConvertible): NSArray;

  unreachableSubnodeNamesAndReturnError(outError: interop.PointerConvertible): NSArray;

  readonly nodeName: string;

  nodeDetailsForKeysError(inKeys: NSArray<interop.Object> | Array<interop.Object>, outError: interop.PointerConvertible): NSDictionary;

  supportedRecordTypesAndReturnError(outError: interop.PointerConvertible): NSArray;

  supportedAttributesForRecordTypeError(inRecordType: string, outError: interop.PointerConvertible): NSArray;

  setCredentialsWithRecordTypeRecordNamePasswordError(inRecordType: string, inRecordName: string, inPassword: string, outError: interop.PointerConvertible): boolean;

  setCredentialsWithRecordTypeAuthenticationTypeAuthenticationItemsContinueItemsContextError(inRecordType: string, inType: string, inItems: NSArray<interop.Object> | Array<interop.Object>, outItems: interop.PointerConvertible, outContext: interop.PointerConvertible, outError: interop.PointerConvertible): boolean;

  setCredentialsUsingKerberosCacheError(inCacheName: string, outError: interop.PointerConvertible): boolean;

  createRecordWithRecordTypeNameAttributesError(inRecordType: string, inRecordName: string, inAttributes: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): ODRecord;

  recordWithRecordTypeNameAttributesError(inRecordType: string, inRecordName: string, inAttributes: interop.Object, outError: interop.PointerConvertible): ODRecord;

  customCallSendDataError(inCustomCode: number, inSendData: NSData, outError: interop.PointerConvertible): NSData;

  customFunctionPayloadError(function$: string, payload: interop.Object, error: interop.PointerConvertible): interop.Object;

  readonly configuration: ODConfiguration;

  policiesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  supportedPoliciesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  setPoliciesError(policies: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, error: interop.PointerConvertible): boolean;

  setPolicyValueError(policy: string, value: interop.Object, error: interop.PointerConvertible): boolean;

  removePolicyError(policy: string, error: interop.PointerConvertible): boolean;

  addAccountPolicyToCategoryError(policy: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, category: string, error: interop.PointerConvertible): boolean;

  removeAccountPolicyFromCategoryError(policy: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, category: string, error: interop.PointerConvertible): boolean;

  setAccountPoliciesError(policies: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, error: interop.PointerConvertible): boolean;

  accountPoliciesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  passwordContentCheckForRecordNameError(password: string, recordName: string, error: interop.PointerConvertible): boolean;
}

export declare class ODRecord extends NSObject {
  setNodeCredentialsPasswordError(inUsername: string, inPassword: string, outError: interop.PointerConvertible): boolean;

  setNodeCredentialsWithRecordTypeAuthenticationTypeAuthenticationItemsContinueItemsContextError(inRecordType: string, inType: string, inItems: NSArray<interop.Object> | Array<interop.Object>, outItems: interop.PointerConvertible, outContext: interop.PointerConvertible, outError: interop.PointerConvertible): boolean;

  setNodeCredentialsUsingKerberosCacheError(inCacheName: string, outError: interop.PointerConvertible): boolean;

  passwordPolicyAndReturnError(outError: interop.PointerConvertible): NSDictionary;

  verifyPasswordError(inPassword: string, outError: interop.PointerConvertible): boolean;

  verifyExtendedWithAuthenticationTypeAuthenticationItemsContinueItemsContextError(inType: string, inItems: NSArray<interop.Object> | Array<interop.Object>, outItems: interop.PointerConvertible, outContext: interop.PointerConvertible, outError: interop.PointerConvertible): boolean;

  changePasswordToPasswordError(oldPassword: string, newPassword: string, outError: interop.PointerConvertible): boolean;

  synchronizeAndReturnError(outError: interop.PointerConvertible): boolean;

  readonly recordType: string;

  readonly recordName: string;

  recordDetailsForAttributesError(inAttributes: NSArray<interop.Object> | Array<interop.Object>, outError: interop.PointerConvertible): NSDictionary;

  valuesForAttributeError(inAttribute: string, outError: interop.PointerConvertible): NSArray;

  setValueForAttributeError(inValueOrValues: interop.Object, inAttribute: string, outError: interop.PointerConvertible): boolean;

  removeValuesForAttributeError(inAttribute: string, outError: interop.PointerConvertible): boolean;

  addValueToAttributeError(inValue: interop.Object, inAttribute: string, outError: interop.PointerConvertible): boolean;

  removeValueFromAttributeError(inValue: interop.Object, inAttribute: string, outError: interop.PointerConvertible): boolean;

  deleteRecordAndReturnError(outError: interop.PointerConvertible): boolean;

  policiesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  effectivePoliciesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  supportedPoliciesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  setPoliciesError(policies: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, error: interop.PointerConvertible): boolean;

  setPolicyValueError(policy: string, value: interop.Object, error: interop.PointerConvertible): boolean;

  removePolicyError(policy: string, error: interop.PointerConvertible): boolean;

  addAccountPolicyToCategoryError(policy: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, category: string, error: interop.PointerConvertible): boolean;

  removeAccountPolicyFromCategoryError(policy: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, category: string, error: interop.PointerConvertible): boolean;

  setAccountPoliciesError(policies: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, error: interop.PointerConvertible): boolean;

  accountPoliciesAndReturnError(error: interop.PointerConvertible): NSDictionary;

  authenticationAllowedAndReturnError(error: interop.PointerConvertible): boolean;

  passwordChangeAllowedError(newPassword: string, error: interop.PointerConvertible): boolean;

  willPasswordExpire(willExpireIn: number): boolean;

  willAuthenticationsExpire(willExpireIn: number): boolean;

  readonly secondsUntilPasswordExpires: number;

  readonly secondsUntilAuthenticationsExpire: number;

  addMemberRecordError(inRecord: ODRecord, outError: interop.PointerConvertible): boolean;

  removeMemberRecordError(inRecord: ODRecord, outError: interop.PointerConvertible): boolean;

  isMemberRecordError(inRecord: ODRecord, outError: interop.PointerConvertible): boolean;
}

export declare class ODAttributeMap extends NSObject {
  customQueryFunction: string;

  customTranslationFunction: string;

  get customAttributes(): NSArray;
  set customAttributes(value: NSArray<interop.Object> | Array<interop.Object>);

  value: string;

  static attributeMapWithValue<This extends abstract new (...args: any) => any>(this: This, value: string): InstanceType<This>;

  static attributeMapWithStaticValue<This extends abstract new (...args: any) => any>(this: This, staticValue: string): InstanceType<This>;

  setStaticValue(staticValue: string): void;

  setVariableSubstitution(variableSubstitution: string): void;
}

export declare class ODModuleEntry extends NSObject {
  mappings: ODMappings;

  readonly supportedOptions: NSArray;

  name: string;

  xpcServiceName: string;

  uuidString: string;

  static moduleEntryWithNameXpcServiceName<This extends abstract new (...args: any) => any>(this: This, name: string, xpcServiceName: string): InstanceType<This>;

  setOptionValue(optionName: string, value: interop.Object): void;

  option(optionName: string): interop.Object;
}

export declare class ODSession extends NSObject {
  static defaultSession(): ODSession;

  static sessionWithOptionsError<This extends abstract new (...args: any) => any>(this: This, inOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): InstanceType<This>;

  initWithOptionsError(inOptions: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, outError: interop.PointerConvertible): this;

  nodeNamesAndReturnError(outError: interop.PointerConvertible): NSArray;

  readonly configurationTemplateNames: NSArray;

  readonly mappingTemplateNames: NSArray;

  configurationAuthorizationAllowingUserInteractionError(allowInteraction: boolean, error: interop.PointerConvertible): SFAuthorization;

  configurationForNodename(nodename: string): ODConfiguration;

  addConfigurationAuthorizationError(configuration: ODConfiguration, authorization: SFAuthorization, error: interop.PointerConvertible): boolean;

  deleteConfigurationAuthorizationError(configuration: ODConfiguration, authorization: SFAuthorization, error: interop.PointerConvertible): boolean;

  deleteConfigurationWithNodenameAuthorizationError(nodename: string, authorization: SFAuthorization, error: interop.PointerConvertible): boolean;
}
