import type { NSObject } from './Runtime'

import type { interop } from './objc-runtime'

export declare const kCFErrorDomainSystemConfiguration: interop.Pointer

export declare const kSCNetworkFlagsInterventionRequired: number

export declare const kSCNetworkFlagsConnectionAutomatic: number

export declare const kSCBondStatusDeviceAggregationStatus: interop.Pointer

export declare const kSCNetworkInterfaceTypeIPv4: interop.Pointer

export declare const kSCNetworkInterfaceTypeSerial: interop.Pointer

export declare const kSCNetworkInterfaceTypePPTP: interop.Pointer

export declare const kSCNetworkInterfaceTypeL2TP: interop.Pointer

export declare const kSCNetworkInterfaceTypeIPSec: interop.Pointer

export declare const kSCNetworkInterfaceTypeFireWire: interop.Pointer

export declare const kSCNetworkInterfaceType6to4: interop.Pointer

export declare const kSCPropUsersConsoleUserGID: interop.Pointer

export declare const kSCDynamicStorePropNetPrimaryInterface: interop.Pointer

export declare const kSCDynamicStorePropSetupLastUpdated: interop.Pointer

export declare const kSCDynamicStoreDomainSetup: interop.Pointer

export declare const kSCEntUsersConsoleUser: interop.Pointer

export declare const kSCValNetSMBNetBIOSNodeTypeMixed: interop.Pointer

export declare const kSCValNetSMBNetBIOSNodeTypeBroadcast: interop.Pointer

export declare const kSCPropNetSMBNetBIOSScope: interop.Pointer

export declare const kSCPropNetSMBNetBIOSNodeType: interop.Pointer

export declare const kSCPropNetSMBNetBIOSName: interop.Pointer

export declare const kSCPropNetProxiesProxyAutoConfigURLString: interop.Pointer

export declare const kSCPropNetProxiesSOCKSProxy: interop.Pointer

export declare const kSCPropNetProxiesRTSPEnable: interop.Pointer

export declare const kSCPropNetProxiesHTTPSEnable: interop.Pointer

export declare const kSCPropNetProxiesHTTPProxy: interop.Pointer

export declare const kSCPropNetProxiesHTTPPort: interop.Pointer

export declare const kSCPropNetProxiesGopherProxy: interop.Pointer

export declare const kSCPropNetProxiesGopherPort: interop.Pointer

export declare const kSCPropNetProxiesExcludeSimpleHostnames: interop.Pointer

export declare const kSCValNetL2TPTransportIPSec: interop.Pointer

export declare const kSCValNetL2TPIPSecSharedSecretEncryptionKeychain: interop.Pointer

export declare const kSCPropNetL2TPTransport: interop.Pointer

export declare const kSCPropNetPPPLCPReceiveACCM: interop.Pointer

export declare const kSCPropNetPPPLCPMTU: interop.Pointer

export declare const kSCPropNetPPPLCPCompressionACField: interop.Pointer

export declare const kSCPropNetPPPLCPEchoEnabled: interop.Pointer

export declare const kSCPropNetPPPIPCPUsePeerDNS: interop.Pointer

export declare const kSCPropNetPPPIPCPCompressionVJ: interop.Pointer

export declare const kSCPropNetPPPCommUseTerminalScript: interop.Pointer

export declare const kSCPropNetPPPCommTerminalScript: interop.Pointer

export declare const kSCPropNetPPPCommRemoteAddress: interop.Pointer

export declare const kSCValNetPPPAuthProtocolMSCHAP2: interop.Pointer

export declare const kSCValNetPPPAuthProtocolEAP: interop.Pointer

export declare const kSCValNetPPPAuthProtocolCHAP: interop.Pointer

export declare const kSCValNetPPPAuthPromptBefore: interop.Pointer

export declare const kSCValNetPPPAuthPasswordEncryptionToken: interop.Pointer

export declare const kSCPropNetPPPAuthPassword: interop.Pointer

export declare const kSCPropNetPPPAuthEAPPlugins: interop.Pointer

export declare const kSCPropNetPPPVerboseLogging: interop.Pointer

export declare const kSCPropNetPPPStatus: interop.Pointer

export declare const kSCPropNetPPPRetryConnectTime: interop.Pointer

export declare const kSCPropNetPPPLogfile: interop.Pointer

export declare const kSCPropNetPPPLastCause: interop.Pointer

export declare const kSCPropNetPPPDisconnectTime: interop.Pointer

export declare const kSCPropNetPPPDisconnectOnIdleTimer: interop.Pointer

export declare const kSCPropNetPPPDisconnectOnIdle: interop.Pointer

export declare const kSCPropNetPPPDisconnectOnFastUserSwitch: interop.Pointer

export declare const kSCPropNetPPPDialOnDemand: interop.Pointer

export declare const kSCPropNetPPPDeviceLastCause: interop.Pointer

export declare const kSCPropNetPPPConnectTime: interop.Pointer

export declare const kSCPropNetPPPACSPEnabled: interop.Pointer

export declare const kSCPropNetModemSpeaker: interop.Pointer

export declare const kSCPropNetModemNote: interop.Pointer

export declare const kSCPropNetModemHoldCallWaitingAudibleAlert: interop.Pointer

export declare const kSCPropNetModemDialMode: interop.Pointer

export declare const kSCPropNetModemDeviceVendor: interop.Pointer

export declare const kSCPropNetModemConnectSpeed: interop.Pointer

export declare const kSCPropNetModemConnectionScript: interop.Pointer

export declare const kSCPropNetModemAccessPointName: interop.Pointer

export declare const kSCValNetIPv6ConfigMethodRouterAdvertisement: interop.Pointer

export declare const kSCValNetIPv6ConfigMethodManual: interop.Pointer

export declare const kSCPropNetIPv6PrefixLength: interop.Pointer

export declare const kSCPropNetIPv6ConfigMethod: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodManual: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodLinkLocal: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodINFORM: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodBOOTP: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodAutomatic: interop.Pointer

export declare const kSCPropNetIPv4BroadcastAddresses: interop.Pointer

export declare const kSCPropNetIPv4SubnetMasks: interop.Pointer

export declare const kSCPropNetIPv4ConfigMethod: interop.Pointer

export declare const kSCPropNetIPv4Addresses: interop.Pointer

export declare const kSCValNetIPSecAuthenticationMethodHybrid: interop.Pointer

export declare const kSCValNetIPSecAuthenticationMethodCertificate: interop.Pointer

export declare const kSCValNetIPSecAuthenticationMethodSharedSecret: interop.Pointer

export declare const kSCPropNetIPSecXAuthPasswordEncryption: interop.Pointer

export declare const kSCPropNetIPSecXAuthPassword: interop.Pointer

export declare const kSCPropNetIPSecXAuthName: interop.Pointer

export declare const kSCPropNetIPSecXAuthEnabled: interop.Pointer

export declare const kSCPropNetIPSecStatus: interop.Pointer

export declare const kSCPropNetIPSecRemoteAddress: interop.Pointer

export declare const kSCPropNetIPSecConnectTime: interop.Pointer

export declare const kSCPropNetIPSecSharedSecretEncryption: interop.Pointer

export declare const kSCPropNetIPSecSharedSecret: interop.Pointer

export declare const kSCValNetInterfaceSubTypeL2TP: interop.Pointer

export declare const kSCValNetInterfaceSubTypePPTP: interop.Pointer

export declare const kSCValNetInterfaceSubTypePPPoE: interop.Pointer

export declare const kSCValNetInterfaceTypeIPSec: interop.Pointer

export declare const kSCValNetInterfaceTypePPP: interop.Pointer

export declare const kSCPropNetEthernetMTU: interop.Pointer

export declare const kSCPropNetDNSSupplementalMatchDomains: interop.Pointer

export declare const kSCPropNetDNSServerTimeout: interop.Pointer

export declare const kSCValNetL2TPTransportIP: interop.Pointer

export declare const kSCPropNetDNSServerPort: interop.Pointer

export declare const kSCPropNetDNSServerAddresses: interop.Pointer

export declare const kSCValNetAirPortJoinModeStrongest: interop.Pointer

export declare const kSCValNetAirPortJoinModeAutomatic: interop.Pointer

export declare const kSCPropNetAirPortAuthPasswordEncryption: interop.Pointer

export declare const kSCPropNetAirPortAuthPassword: interop.Pointer

export declare const kSCPropNetLocalHostName: interop.Pointer

export declare const kSCPropNetInterfaces: interop.Pointer

export declare const kSCPropNetPPPOverridePrimary: interop.Pointer

export declare const kSCEntNetSMB: interop.Pointer

export declare const kSCEntNetPPTP: interop.Pointer

export declare const kSCEntNetPPPSerial: interop.Pointer

export declare const kSCEntNetPPPoE: interop.Pointer

export declare const kSCEntNetL2TP: interop.Pointer

export declare const kSCEntNetIPv6: interop.Pointer

export declare const kSCEntNetInterface: interop.Pointer

export declare const kSCEntNetEthernet: interop.Pointer

export declare const kSCEntNetAirPort: interop.Pointer

export declare const kSCCompUsers: interop.Pointer

export declare const kSCCompInterface: interop.Pointer

export declare const kSCCompGlobal: interop.Pointer

export declare const kSCCompService: interop.Pointer

export declare const kSCCompNetwork: interop.Pointer

export declare const kSCPrefSystem: interop.Pointer

export declare const kSCPrefSets: interop.Pointer

export declare const kSCPrefNetworkServices: interop.Pointer

export declare const kSCPrefCurrentSet: interop.Pointer

export declare const kSCPropVersion: interop.Pointer

export declare const kSCPropMACAddress: interop.Pointer

export declare const kSCPropInterfaceName: interop.Pointer

export declare const kSCDynamicStoreUseSessionKeys: interop.Pointer

export declare const kSCStatusConnectionIgnore: number

export declare const kSCStatusReachabilityUnknown: number

export declare const kSCStatusStale: number

export declare const kSCStatusNoConfigFile: number

export declare const kSCStatusPrefsBusy: number

export declare const kSCStatusNotifierActive: number

export declare const kSCStatusAccessError: number

export declare const kSCStatusInvalidArgument: number

export declare const kSCStatusFailed: number

export declare const kSCStatusOK: number

export declare const kSCPropNetIPSecAuthenticationMethod: interop.Pointer

export declare const kSCStatusNeedLock: number

export declare const kSCPropUsersConsoleUserName: interop.Pointer

export declare const kSCPropNetModemHoldEnabled: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodPPP: interop.Pointer

export declare const kSCBondStatusLinkInvalid: number

export declare const kSCValNetIPSecXAuthPasswordEncryptionPrompt: interop.Pointer

export declare const kSCPropNetPPPAuthPasswordEncryption: interop.Pointer

export declare const kSCPropNetPPPLCPMRU: interop.Pointer

export declare const kSCDynamicStoreDomainFile: interop.Pointer

export declare const kSCPropNetPPPCCPEnabled: interop.Pointer

export declare const kSCPropNetIPv6Addresses: interop.Pointer

export declare const kSCNetworkInterfaceTypeIrDA: interop.Pointer

export declare const kSCPropNetPPPCommRedialCount: interop.Pointer

export declare const kSCPropNetProxiesGopherEnable: interop.Pointer

export declare const kSCPropNetPPPAuthName: interop.Pointer

export declare const kSCDynamicStoreDomainPlugin: interop.Pointer

export declare const kSCPropNetIPv6Router: interop.Pointer

export declare const kSCValNetIPv6ConfigMethodLinkLocal: interop.Pointer

export declare const kSCValNetIPSecSharedSecretEncryptionKeychain: interop.Pointer

export declare const kSCPropNetModemSpeed: interop.Pointer

export declare const kSCPropNetPPPAuthPrompt: interop.Pointer

export declare const kSCPropNetModemHoldReminder: interop.Pointer

export declare const kSCPropNetPPPCommRedialInterval: interop.Pointer

export declare const kSCNetworkProtocolTypeSMB: interop.Pointer

export declare const kSCBondStatusOK: number

export declare const kSCPropSystemComputerName: interop.Pointer

export declare const kSCEntNetDHCP: interop.Pointer

export declare const kSCPropSystemComputerNameEncoding: interop.Pointer

export declare const kSCNetworkInterfaceTypeBond: interop.Pointer

export declare const kSCPropNetAirPortPreferredNetwork: interop.Pointer

export declare const kSCValNetInterfaceSubTypePPPSerial: interop.Pointer

export declare const kSCPropNetPPPUseSessionTimer: interop.Pointer

export declare const kSCPropNetPPPIdleReminderTimer: interop.Pointer

export declare const kSCPropNetIPSecLocalIdentifierType: interop.Pointer

export declare const kSCPropNetProxiesFTPProxy: interop.Pointer

export declare const kSCNetworkInterfaceTypeBluetooth: interop.Pointer

export declare const kSCPropNetDNSSearchOrder: interop.Pointer

export declare const kSCPropNetProxiesProxyAutoConfigEnable: interop.Pointer

export declare const kSCValNetInterfaceType6to4: interop.Pointer

export declare const kSCEntNetModem: interop.Pointer

export declare const kSCDynamicStoreDomainPrefs: interop.Pointer

export declare const kSCBondStatusUnknown: number

export declare const kSCPropNetLinkActive: interop.Pointer

export declare const kSCValNetIPv6ConfigMethodAutomatic: interop.Pointer

export declare const kSCValNetSMBNetBIOSNodeTypeHybrid: interop.Pointer

export declare const kSCPropNetPPPCommRedialEnabled: interop.Pointer

export declare const kSCValNetIPSecLocalIdentifierTypeKeyID: interop.Pointer

export declare const kSCPropNetInterfaceDeviceName: interop.Pointer

export declare const kSCPropNetPPPDisconnectOnLogout: interop.Pointer

export declare const kSCPropNetProxiesHTTPSProxy: interop.Pointer

export declare const kSCPropNetProxiesRTSPPort: interop.Pointer

export declare const kSCBondStatusDeviceDistributing: interop.Pointer

export declare const kSCPropUserDefinedName: interop.Pointer

export declare const kSCResvLink: interop.Pointer

export declare const kSCNetworkProtocolTypeDNS: interop.Pointer

export declare const kSCNetworkFlagsReachable: number

export declare const kSCNetworkInterfaceIPv4: interop.Pointer

export declare const kSCPropNetModemDataCompression: interop.Pointer

export declare const kSCValNetIPv6ConfigMethod6to4: interop.Pointer

export declare const kSCPropNetProxiesSOCKSEnable: interop.Pointer

export declare const kSCValNetIPv4ConfigMethodDHCP: interop.Pointer

export declare const kSCPropNet6to4Relay: interop.Pointer

export declare const kSCBondStatusNoPartner: number

export declare const kSCValNetPPPAuthProtocolPAP: interop.Pointer

export declare const kSCDynamicStorePropNetInterfaces: interop.Pointer

export declare const kSCPropNetIPv6Flags: interop.Pointer

export declare const kSCNetworkInterfaceTypeVLAN: interop.Pointer

export declare const kSCDynamicStorePropNetPrimaryService: interop.Pointer

export declare const kSCNetworkProtocolTypeProxies: interop.Pointer

export declare const kSCPropNetInterfaceHardware: interop.Pointer

export declare const kSCPropNetPPPIdleReminder: interop.Pointer

export declare const kSCEntNet6to4: interop.Pointer

export declare const kSCValNetModemDialModeIgnoreDialTone: interop.Pointer

export declare const kSCPropNetSMBWINSAddresses: interop.Pointer

export declare const kSCValNetPPPAuthProtocolMSCHAP1: interop.Pointer

export declare const kSCPropNetSMBWorkgroup: interop.Pointer

export declare const kSCPropNetDNSDomainName: interop.Pointer

export declare const kSCNetworkInterfaceTypeWWAN: interop.Pointer

export declare const kSCDynamicStorePropNetServiceIDs: interop.Pointer

export declare const kSCPropNetPPPLCPTransmitACCM: interop.Pointer

export declare const kSCStatusNoLink: number

export declare const kSCPropNetInterfaceSupportsModemOnHold: interop.Pointer

export declare const kSCPropNetProxiesProxyAutoConfigJavaScript: interop.Pointer

export declare const kSCPropNetModemDeviceModel: interop.Pointer

export declare const kSCPropNetIPSecLocalCertificate: interop.Pointer

export declare const kSCPropNetOverridePrimary: interop.Pointer

export declare const kSCPropNetAirPortJoinMode: interop.Pointer

export declare const kSCPropNetProxiesExceptionsList: interop.Pointer

export declare const kSCPropNetProxiesRTSPProxy: interop.Pointer

export declare const kSCBondStatusNotInActiveGroup: number

export declare const kSCNetworkInterfaceTypeEthernet: interop.Pointer

export declare const kSCNetworkFlagsTransientConnection: number

export declare const kSCValNetAirPortJoinModePreferred: interop.Pointer

export declare const kSCNetworkProtocolTypeIPv4: interop.Pointer

export declare const kSCPropNetInterfaceType: interop.Pointer

export declare const kSCBondStatusDeviceCollecting: interop.Pointer

export declare const kSCPropNetProxiesHTTPEnable: interop.Pointer

export declare const kSCPropNetAirPortSavePasswords: interop.Pointer

export declare const kSCValNetPPPAuthPromptAfter: interop.Pointer

export declare const kSCResvInactive: interop.Pointer

export declare const kSCPropNetProxiesSOCKSPort: interop.Pointer

export declare const kSCValNetModemDialModeManual: interop.Pointer

export declare const kSCPropNetIPv4DHCPClientID: interop.Pointer

export declare const kSCPropNetProxiesProxyAutoDiscoveryEnable: interop.Pointer

export declare const kSCDynamicStorePropSetupCurrentSet: interop.Pointer

export declare const kSCPropNetPPPCommDisplayTerminalWindow: interop.Pointer

export declare const kSCValNetAirPortJoinModeRanked: interop.Pointer

export declare const kSCDynamicStoreDomainState: interop.Pointer

export declare const kSCPropNetPPPPlugins: interop.Pointer

export declare const kSCNetworkInterfaceTypePPP: interop.Pointer

export declare const kSCEntNetIPSec: interop.Pointer

export declare const kSCPropNetL2TPIPSecSharedSecret: interop.Pointer

export declare const kSCPropNetProxiesFTPEnable: interop.Pointer

export declare const kSCPropNetPPPLCPCompressionPField: interop.Pointer

export declare const kSCEntNetDNS: interop.Pointer

export declare const kSCPropNetInterfaceSubType: interop.Pointer

export declare const kSCNetworkFlagsIsDirect: number

export declare const kSCStatusConnectionNoService: number

export declare const kSCPropNetEthernetMediaOptions: interop.Pointer

export declare const kSCNetworkFlagsIsLocalAddress: number

export declare const kSCPropNetPPPSessionTimer: interop.Pointer

export declare const kSCValNetInterfaceTypeEthernet: interop.Pointer

export declare const kSCStatusMaxLink: number

export declare const kSCCompAnyRegex: interop.Pointer

export declare const kSCPropNetDNSSupplementalMatchOrders: interop.Pointer

export declare const kSCPropNetPPPCommConnectDelay: interop.Pointer

export declare const kSCPropNetAirPortPowerEnabled: interop.Pointer

export declare const kSCPropNetModemHoldDisconnectOnAnswer: interop.Pointer

export declare const kSCValNetIPSecXAuthPasswordEncryptionKeychain: interop.Pointer

export declare const kSCPropNetEthernetMediaSubType: interop.Pointer

export declare const kSCValNetModemDialModeWaitForDialTone: interop.Pointer

export declare const kSCPropNetProxiesFTPPassive: interop.Pointer

export declare const kSCPropNetModemPulseDial: interop.Pointer

export declare const kSCEntNetPPP: interop.Pointer

export declare const kSCPropNetModemConnectionPersonality: interop.Pointer

export declare const kSCStatusNoStoreSession: number

export declare const kSCPropNetProxiesHTTPSPort: interop.Pointer

export declare const kSCValNetPPPAuthPasswordEncryptionKeychain: interop.Pointer

export declare const kSCPropNetProxiesFTPPort: interop.Pointer

export declare const kSCPropNetDNSSearchDomains: interop.Pointer

export declare const kSCPropNetModemDeviceContextID: interop.Pointer

export declare const kSCStatusNoPrefsSession: number

export declare const kSCValNetAirPortAuthPasswordEncryptionKeychain: interop.Pointer

export declare const kSCPropNetIPv6DestAddresses: interop.Pointer

export declare const kSCPropNetIPv4Router: interop.Pointer

export declare const kSCPropNetAirPortAllowNetCreation: interop.Pointer

export declare const kSCNetworkInterfaceTypeIEEE80211: interop.Pointer

export declare const kSCPropNetModemHoldReminderTime: interop.Pointer

export declare const kSCPropNetServiceOrder: interop.Pointer

export declare const kSCEntNetIPv4: interop.Pointer

export declare const kSCPropNetPPPAuthProtocol: interop.Pointer

export declare const kSCPropNetModemErrorCorrection: interop.Pointer

export declare const kSCPropNetLinkDetaching: interop.Pointer

export declare const kSCStatusNoStoreServer: number

export declare const kSCValNetInterfaceTypeFireWire: interop.Pointer

export declare const kSCValNetSMBNetBIOSNodeTypePeer: interop.Pointer

export declare const kSCCompSystem: interop.Pointer

export declare const kSCPropNetDNSOptions: interop.Pointer

export declare const kSCPropNetDNSSortList: interop.Pointer

export declare const kSCValNetAirPortJoinModeRecent: interop.Pointer

export declare const kSCPropNetPPPLCPEchoInterval: interop.Pointer

export declare const kSCPropUsersConsoleUserUID: interop.Pointer

export declare const kSCPropNetPPPLCPEchoFailure: interop.Pointer

export declare const kSCCompHostNames: interop.Pointer

export declare const kSCStatusNoKey: number

export declare const kSCEntNetLink: interop.Pointer

export declare const kSCPropNetPPPDisconnectOnSleep: interop.Pointer

export declare const kSCPropNetIPSecLocalIdentifier: interop.Pointer

export declare const kSCPropNetL2TPIPSecSharedSecretEncryption: interop.Pointer

export declare const kSCPropNetPPPCCPMPPE40Enabled: interop.Pointer

export declare const kSCPropNetPPPCCPMPPE128Enabled: interop.Pointer

export declare const kSCEntNetProxies: interop.Pointer

export declare const kSCStatusLocked: number

export declare const kSCStatusKeyExists: number

export declare const kSCNetworkProtocolTypeIPv6: interop.Pointer

export declare const kSCPropNetIPv4DestAddresses: interop.Pointer

export declare const kSCPropNetPPPCommAlternateRemoteAddress: interop.Pointer

export declare const kSCEntNetFireWire: interop.Pointer

export declare const kSCNetworkFlagsConnectionRequired: number

export declare const kSCNetworkInterfaceTypeModem: interop.Pointer

export declare const SCNetworkConnectionPPPStatus: {
	Disconnected: 0
	Initializing: 1
	ConnectingLink: 2
	DialOnTraffic: 3
	NegotiatingLink: 4
	Authenticating: 5
	WaitingForCallBack: 6
	NegotiatingNetwork: 7
	Connected: 8
	Terminating: 9
	DisconnectingLink: 10
	HoldingLinkOff: 11
	Suspended: 12
	WaitingForRedial: 13
}

export declare const SCNetworkConnectionStatus: {
	Invalid: -1
	Disconnected: 0
	Connecting: 1
	Connected: 2
	Disconnecting: 3
}

export declare const SCPreferencesNotification: {
	Commit: 1
	Apply: 2
}

export declare const SCNetworkReachabilityFlags: {
	TransientConnection: 1
	Reachable: 2
	ConnectionRequired: 4
	ConnectionOnTraffic: 8
	InterventionRequired: 16
	ConnectionOnDemand: 32
	IsLocalAddress: 65536
	IsDirect: 131072
	ConnectionAutomatic: 8
}

export declare class SCNetworkConnectionContext {
	constructor(init?: SCNetworkConnectionContext)
	version: number
	info: interop.Pointer
	retain: (p1: interop.PointerConvertible) => interop.Pointer | null
	release: (p1: interop.PointerConvertible) => void | null
	copyDescription: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class __SCNetworkConnection {
	constructor(init?: __SCNetworkConnection)
}

export declare class SCNetworkReachabilityContext {
	constructor(init?: SCNetworkReachabilityContext)
	version: number
	info: interop.Pointer
	retain: (p1: interop.PointerConvertible) => interop.Pointer | null
	release: (p1: interop.PointerConvertible) => void | null
	copyDescription: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class __SCNetworkService {
	constructor(init?: __SCNetworkService)
}

export declare class __SCBondStatus {
	constructor(init?: __SCBondStatus)
}

export declare class SCPreferencesContext {
	constructor(init?: SCPreferencesContext)
	version: number
	info: interop.Pointer
	retain: (p1: interop.PointerConvertible) => interop.Pointer | null
	release: (p1: interop.PointerConvertible) => void | null
	copyDescription: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class __SCPreferences {
	constructor(init?: __SCPreferences)
}

export declare class SCDynamicStoreContext {
	constructor(init?: SCDynamicStoreContext)
	version: number
	info: interop.Pointer
	retain: (p1: interop.PointerConvertible) => interop.Pointer | null
	release: (p1: interop.PointerConvertible) => void | null
	copyDescription: (p1: interop.PointerConvertible) => interop.Pointer | null
}

export declare class __SCDynamicStore {
	constructor(init?: __SCDynamicStore)
}

export declare class __SCNetworkInterface {
	constructor(init?: __SCNetworkInterface)
}

export declare class __SCNetworkReachability {
	constructor(init?: __SCNetworkReachability)
}

export declare class __SCNetworkProtocol {
	constructor(init?: __SCNetworkProtocol)
}

export declare class __SCNetworkSet {
	constructor(init?: __SCNetworkSet)
}

export declare function SCDynamicStoreGetTypeID(): number

export declare function SCDynamicStoreCreate(
	allocator: interop.Object,
	name: interop.Object,
	callout: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): interop.Object

export declare function SCDynamicStoreCreateWithOptions(
	allocator: interop.Object,
	name: interop.Object,
	storeOptions: interop.Object,
	callout: (
		p1: interop.PointerConvertible,
		p2: interop.PointerConvertible,
		p3: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): interop.Object

export declare function SCDynamicStoreCreateRunLoopSource(
	allocator: interop.Object,
	store: interop.Object,
	order: number,
): interop.Object

export declare function SCDynamicStoreSetDispatchQueue(
	store: interop.Object,
	queue: NSObject,
): number

export declare function SCDynamicStoreCopyKeyList(
	store: interop.Object,
	pattern: interop.Object,
): interop.Object

export declare function SCDynamicStoreAddValue(
	store: interop.Object,
	key: interop.Object,
	value: interop.Object,
): number

export declare function SCDynamicStoreAddTemporaryValue(
	store: interop.Object,
	key: interop.Object,
	value: interop.Object,
): number

export declare function SCDynamicStoreCopyValue(
	store: interop.Object,
	key: interop.Object,
): interop.Object

export declare function SCDynamicStoreCopyMultiple(
	store: interop.Object,
	keys: interop.Object,
	patterns: interop.Object,
): interop.Object

export declare function SCDynamicStoreSetValue(
	store: interop.Object,
	key: interop.Object,
	value: interop.Object,
): number

export declare function SCDynamicStoreSetMultiple(
	store: interop.Object,
	keysToSet: interop.Object,
	keysToRemove: interop.Object,
	keysToNotify: interop.Object,
): number

export declare function SCDynamicStoreRemoveValue(
	store: interop.Object,
	key: interop.Object,
): number

export declare function SCDynamicStoreNotifyValue(
	store: interop.Object,
	key: interop.Object,
): number

export declare function SCDynamicStoreSetNotificationKeys(
	store: interop.Object,
	keys: interop.Object,
	patterns: interop.Object,
): number

export declare function SCDynamicStoreCopyNotifiedKeys(store: interop.Object): interop.Object

export declare function SCDynamicStoreKeyCreate(
	allocator: interop.Object,
	fmt: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateNetworkGlobalEntity(
	allocator: interop.Object,
	domain: interop.Object,
	entity: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateNetworkInterface(
	allocator: interop.Object,
	domain: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateNetworkInterfaceEntity(
	allocator: interop.Object,
	domain: interop.Object,
	ifname: interop.Object,
	entity: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateNetworkServiceEntity(
	allocator: interop.Object,
	domain: interop.Object,
	serviceID: interop.Object,
	entity: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateComputerName(
	allocator: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateConsoleUser(
	allocator: interop.Object,
): interop.Object

export declare function SCDynamicStoreKeyCreateHostNames(allocator: interop.Object): interop.Object

export declare function SCDynamicStoreKeyCreateLocation(allocator: interop.Object): interop.Object

export declare function SCDynamicStoreKeyCreateProxies(allocator: interop.Object): interop.Object

export declare function SCDynamicStoreCopyComputerName(
	store: interop.Object,
	nameEncoding: interop.PointerConvertible,
): interop.Object

export declare function SCDynamicStoreCopyConsoleUser(
	store: interop.Object,
	uid: interop.PointerConvertible,
	gid: interop.PointerConvertible,
): interop.Object

export declare function SCDynamicStoreCopyLocalHostName(store: interop.Object): interop.Object

export declare function SCDynamicStoreCopyLocation(store: interop.Object): interop.Object

export declare function SCDynamicStoreCopyProxies(store: interop.Object): interop.Object

export declare function SCPreferencesGetTypeID(): number

export declare function SCPreferencesCreate(
	allocator: interop.Object,
	name: interop.Object,
	prefsID: interop.Object,
): interop.Object

export declare function SCPreferencesCreateWithAuthorization(
	allocator: interop.Object,
	name: interop.Object,
	prefsID: interop.Object,
	authorization: interop.PointerConvertible,
): interop.Object

export declare function SCPreferencesLock(prefs: interop.Object, wait: number): number

export declare function SCPreferencesCommitChanges(prefs: interop.Object): number

export declare function SCPreferencesApplyChanges(prefs: interop.Object): number

export declare function SCPreferencesUnlock(prefs: interop.Object): number

export declare function SCPreferencesGetSignature(prefs: interop.Object): interop.Object

export declare function SCPreferencesCopyKeyList(prefs: interop.Object): interop.Object

export declare function SCPreferencesGetValue(
	prefs: interop.Object,
	key: interop.Object,
): interop.Object

export declare function SCPreferencesAddValue(
	prefs: interop.Object,
	key: interop.Object,
	value: interop.Object,
): number

export declare function SCPreferencesSetValue(
	prefs: interop.Object,
	key: interop.Object,
	value: interop.Object,
): number

export declare function SCPreferencesRemoveValue(prefs: interop.Object, key: interop.Object): number

export declare function SCPreferencesSetCallback(
	prefs: interop.Object,
	callout: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof SCPreferencesNotification>,
		p3: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function SCPreferencesScheduleWithRunLoop(
	prefs: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): number

export declare function SCPreferencesUnscheduleFromRunLoop(
	prefs: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): number

export declare function SCPreferencesSetDispatchQueue(
	prefs: interop.Object,
	queue: NSObject,
): number

export declare function SCPreferencesSynchronize(prefs: interop.Object): void

export declare function SCPreferencesPathCreateUniqueChild(
	prefs: interop.Object,
	prefix: interop.Object,
): interop.Object

export declare function SCPreferencesPathGetValue(
	prefs: interop.Object,
	path: interop.Object,
): interop.Object

export declare function SCPreferencesPathGetLink(
	prefs: interop.Object,
	path: interop.Object,
): interop.Object

export declare function SCPreferencesPathSetValue(
	prefs: interop.Object,
	path: interop.Object,
	value: interop.Object,
): number

export declare function SCPreferencesPathSetLink(
	prefs: interop.Object,
	path: interop.Object,
	link: interop.Object,
): number

export declare function SCPreferencesPathRemoveValue(
	prefs: interop.Object,
	path: interop.Object,
): number

export declare function SCPreferencesSetComputerName(
	prefs: interop.Object,
	name: interop.Object,
	nameEncoding: number,
): number

export declare function SCPreferencesSetLocalHostName(
	prefs: interop.Object,
	name: interop.Object,
): number

export declare function SCNetworkInterfaceGetTypeID(): number

export declare function SCNetworkInterfaceCopyAll(): interop.Object

export declare function SCNetworkInterfaceGetSupportedInterfaceTypes(
	interface: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceGetSupportedProtocolTypes(
	interface: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceCreateWithInterface(
	interface: interop.Object,
	interfaceType: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceGetBSDName(interface: interop.Object): interop.Object

export declare function SCNetworkInterfaceGetConfiguration(
	interface: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceGetExtendedConfiguration(
	interface: interop.Object,
	extendedType: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceGetHardwareAddressString(
	interface: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceGetInterface(interface: interop.Object): interop.Object

export declare function SCNetworkInterfaceGetInterfaceType(
	interface: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceGetLocalizedDisplayName(
	interface: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceSetConfiguration(
	interface: interop.Object,
	config: interop.Object,
): number

export declare function SCNetworkInterfaceSetExtendedConfiguration(
	interface: interop.Object,
	extendedType: interop.Object,
	config: interop.Object,
): number

export declare function SCNetworkInterfaceCopyMediaOptions(
	interface: interop.Object,
	current: interop.PointerConvertible,
	active: interop.PointerConvertible,
	available: interop.PointerConvertible,
	filter: number,
): number

export declare function SCNetworkInterfaceCopyMediaSubTypes(
	available: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceCopyMediaSubTypeOptions(
	available: interop.Object,
	subType: interop.Object,
): interop.Object

export declare function SCNetworkInterfaceCopyMTU(
	interface: interop.Object,
	mtu_cur: interop.PointerConvertible,
	mtu_min: interop.PointerConvertible,
	mtu_max: interop.PointerConvertible,
): number

export declare function SCNetworkInterfaceSetMediaOptions(
	interface: interop.Object,
	subtype: interop.Object,
	options: interop.Object,
): number

export declare function SCNetworkInterfaceSetMTU(interface: interop.Object, mtu: number): number

export declare function SCNetworkInterfaceForceConfigurationRefresh(
	interface: interop.Object,
): number

export declare function SCBondInterfaceCopyAll(prefs: interop.Object): interop.Object

export declare function SCBondInterfaceCopyAvailableMemberInterfaces(
	prefs: interop.Object,
): interop.Object

export declare function SCBondInterfaceCreate(prefs: interop.Object): interop.Object

export declare function SCBondInterfaceRemove(bond: interop.Object): number

export declare function SCBondInterfaceGetMemberInterfaces(bond: interop.Object): interop.Object

export declare function SCBondInterfaceGetOptions(bond: interop.Object): interop.Object

export declare function SCBondInterfaceSetMemberInterfaces(
	bond: interop.Object,
	members: interop.Object,
): number

export declare function SCBondInterfaceSetLocalizedDisplayName(
	bond: interop.Object,
	newName: interop.Object,
): number

export declare function SCBondInterfaceSetOptions(
	bond: interop.Object,
	newOptions: interop.Object,
): number

export declare function SCBondInterfaceCopyStatus(bond: interop.Object): interop.Object

export declare function SCBondStatusGetTypeID(): number

export declare function SCBondStatusGetMemberInterfaces(bondStatus: interop.Object): interop.Object

export declare function SCBondStatusGetInterfaceStatus(
	bondStatus: interop.Object,
	interface: interop.Object,
): interop.Object

export declare function SCVLANInterfaceCopyAll(prefs: interop.Object): interop.Object

export declare function SCVLANInterfaceCopyAvailablePhysicalInterfaces(): interop.Object

export declare function SCVLANInterfaceCreate(
	prefs: interop.Object,
	physical: interop.Object,
	tag: interop.Object,
): interop.Object

export declare function SCVLANInterfaceRemove(vlan: interop.Object): number

export declare function SCVLANInterfaceGetPhysicalInterface(vlan: interop.Object): interop.Object

export declare function SCVLANInterfaceGetTag(vlan: interop.Object): interop.Object

export declare function SCVLANInterfaceGetOptions(vlan: interop.Object): interop.Object

export declare function SCVLANInterfaceSetPhysicalInterfaceAndTag(
	vlan: interop.Object,
	physical: interop.Object,
	tag: interop.Object,
): number

export declare function SCVLANInterfaceSetLocalizedDisplayName(
	vlan: interop.Object,
	newName: interop.Object,
): number

export declare function SCVLANInterfaceSetOptions(
	vlan: interop.Object,
	newOptions: interop.Object,
): number

export declare function SCNetworkProtocolGetTypeID(): number

export declare function SCNetworkProtocolGetConfiguration(protocol: interop.Object): interop.Object

export declare function SCNetworkProtocolGetEnabled(protocol: interop.Object): number

export declare function SCNetworkProtocolGetProtocolType(protocol: interop.Object): interop.Object

export declare function SCNetworkProtocolSetConfiguration(
	protocol: interop.Object,
	config: interop.Object,
): number

export declare function SCNetworkProtocolSetEnabled(
	protocol: interop.Object,
	enabled: number,
): number

export declare function SCNetworkServiceGetTypeID(): number

export declare function SCNetworkServiceAddProtocolType(
	service: interop.Object,
	protocolType: interop.Object,
): number

export declare function SCNetworkServiceCopyAll(prefs: interop.Object): interop.Object

export declare function SCNetworkServiceCopyProtocols(service: interop.Object): interop.Object

export declare function SCNetworkServiceCreate(
	prefs: interop.Object,
	interface: interop.Object,
): interop.Object

export declare function SCNetworkServiceCopy(
	prefs: interop.Object,
	serviceID: interop.Object,
): interop.Object

export declare function SCNetworkServiceEstablishDefaultConfiguration(
	service: interop.Object,
): number

export declare function SCNetworkServiceGetEnabled(service: interop.Object): number

export declare function SCNetworkServiceGetInterface(service: interop.Object): interop.Object

export declare function SCNetworkServiceGetName(service: interop.Object): interop.Object

export declare function SCNetworkServiceCopyProtocol(
	service: interop.Object,
	protocolType: interop.Object,
): interop.Object

export declare function SCNetworkServiceGetServiceID(service: interop.Object): interop.Object

export declare function SCNetworkServiceRemove(service: interop.Object): number

export declare function SCNetworkServiceRemoveProtocolType(
	service: interop.Object,
	protocolType: interop.Object,
): number

export declare function SCNetworkServiceSetEnabled(service: interop.Object, enabled: number): number

export declare function SCNetworkServiceSetName(
	service: interop.Object,
	name: interop.Object,
): number

export declare function SCNetworkSetGetTypeID(): number

export declare function SCNetworkSetAddService(set: interop.Object, service: interop.Object): number

export declare function SCNetworkSetContainsInterface(
	set: interop.Object,
	interface: interop.Object,
): number

export declare function SCNetworkSetCopyAll(prefs: interop.Object): interop.Object

export declare function SCNetworkSetCopyCurrent(prefs: interop.Object): interop.Object

export declare function SCNetworkSetCopyServices(set: interop.Object): interop.Object

export declare function SCNetworkSetCreate(prefs: interop.Object): interop.Object

export declare function SCNetworkSetCopy(
	prefs: interop.Object,
	setID: interop.Object,
): interop.Object

export declare function SCNetworkSetGetName(set: interop.Object): interop.Object

export declare function SCNetworkSetGetSetID(set: interop.Object): interop.Object

export declare function SCNetworkSetGetServiceOrder(set: interop.Object): interop.Object

export declare function SCNetworkSetRemove(set: interop.Object): number

export declare function SCNetworkSetRemoveService(
	set: interop.Object,
	service: interop.Object,
): number

export declare function SCNetworkSetSetCurrent(set: interop.Object): number

export declare function SCNetworkSetSetName(set: interop.Object, name: interop.Object): number

export declare function SCNetworkSetSetServiceOrder(
	set: interop.Object,
	newOrder: interop.Object,
): number

export declare function SCNetworkCheckReachabilityByAddress(
	address: interop.PointerConvertible,
	addrlen: number,
	flags: interop.PointerConvertible,
): number

export declare function SCNetworkCheckReachabilityByName(
	nodename: string,
	flags: interop.PointerConvertible,
): number

export declare function SCNetworkInterfaceRefreshConfiguration(ifName: interop.Object): number

export declare function SCNetworkReachabilityCreateWithAddress(
	allocator: interop.Object,
	address: interop.PointerConvertible,
): interop.Object

export declare function SCNetworkReachabilityCreateWithAddressPair(
	allocator: interop.Object,
	localAddress: interop.PointerConvertible,
	remoteAddress: interop.PointerConvertible,
): interop.Object

export declare function SCNetworkReachabilityCreateWithName(
	allocator: interop.Object,
	nodename: string,
): interop.Object

export declare function SCNetworkReachabilityGetTypeID(): number

export declare function SCNetworkReachabilityGetFlags(
	target: interop.Object,
	flags: interop.PointerConvertible,
): number

export declare function SCNetworkReachabilitySetCallback(
	target: interop.Object,
	callout: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof SCNetworkReachabilityFlags>,
		p3: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): number

export declare function SCNetworkReachabilityScheduleWithRunLoop(
	target: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): number

export declare function SCNetworkReachabilityUnscheduleFromRunLoop(
	target: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): number

export declare function SCNetworkReachabilitySetDispatchQueue(
	target: interop.Object,
	queue: NSObject,
): number

export declare function SCNetworkConnectionGetTypeID(): number

export declare function SCNetworkConnectionCopyUserPreferences(
	selectionOptions: interop.Object,
	serviceID: interop.PointerConvertible,
	userOptions: interop.PointerConvertible,
): number

export declare function SCNetworkConnectionCreateWithServiceID(
	allocator: interop.Object,
	serviceID: interop.Object,
	callout: (
		p1: interop.PointerConvertible,
		p2: interop.Enum<typeof SCNetworkConnectionStatus>,
		p3: interop.PointerConvertible,
	) => void,
	context: interop.PointerConvertible,
): interop.Object

export declare function SCNetworkConnectionCopyServiceID(connection: interop.Object): interop.Object

export declare function SCNetworkConnectionGetStatus(
	connection: interop.Object,
): interop.Enum<typeof SCNetworkConnectionStatus>

export declare function SCNetworkConnectionCopyExtendedStatus(
	connection: interop.Object,
): interop.Object

export declare function SCNetworkConnectionCopyStatistics(
	connection: interop.Object,
): interop.Object

export declare function SCNetworkConnectionStart(
	connection: interop.Object,
	userOptions: interop.Object,
	linger: number,
): number

export declare function SCNetworkConnectionStop(
	connection: interop.Object,
	forceDisconnect: number,
): number

export declare function SCNetworkConnectionCopyUserOptions(
	connection: interop.Object,
): interop.Object

export declare function SCNetworkConnectionScheduleWithRunLoop(
	connection: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): number

export declare function SCNetworkConnectionUnscheduleFromRunLoop(
	connection: interop.Object,
	runLoop: interop.Object,
	runLoopMode: interop.Object,
): number

export declare function SCNetworkConnectionSetDispatchQueue(
	connection: interop.Object,
	queue: NSObject,
): number

export declare function SCCopyLastError(): interop.Object

export declare function SCError(): number

export declare function SCErrorString(status: number): string

export declare function CNSetSupportedSSIDs(ssidArray: interop.Object): number

export declare function CNMarkPortalOnline(interfaceName: interop.Object): number

export declare function CNMarkPortalOffline(interfaceName: interop.Object): number

export declare function CNCopySupportedInterfaces(): interop.Object

export declare function DHCPClientPreferencesSetApplicationOptions(
	applicationID: interop.Object,
	options: interop.PointerConvertible,
	count: number,
): number

export declare function DHCPClientPreferencesCopyApplicationOptions(
	applicationID: interop.Object,
	count: interop.PointerConvertible,
): interop.Pointer

export declare function SCDynamicStoreCopyDHCPInfo(
	store: interop.Object,
	serviceID: interop.Object,
): interop.Object

export declare function DHCPInfoGetOptionData(info: interop.Object, code: number): interop.Object

export declare function DHCPInfoGetLeaseStartTime(info: interop.Object): interop.Object

export declare function DHCPInfoGetLeaseExpirationTime(info: interop.Object): interop.Object
