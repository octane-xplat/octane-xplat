/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const AVBErrorDomain: string

declare const AVBNullEUI64: number

declare const AVB17221EntityPropertyChanged: {
	TimeToLive: 1
	GUID: 2
	EntityID: 2
	VendorID: 4
	ModelID: 8
	EntityCapabilities: 16
	TalkerStreamSources: 32
	TalkerCapabilities: 64
	ListenerStreamSinks: 128
	ListenerCapabilities: 256
	ControllerCapabilities: 512
	AvailableIndex: 1024
	ASGrandmasterID: 2048
	GPTPGrandmasterID: 2048
	MACAddress: 4096
	AssociationID: 32768
	EntityType: 65536
	IdentifyControlIndex: 131072
	InterfaceIndex: 262144
	GPTPDomainNumber: 524288
}

declare const AVB17221AECPAddressAccessTLVMode: {
	Read: 0
	Write: 1
	Execute: 2
}

declare const AVB17221ACMPFlags: {
	None: 0
	ClassB: 1
	FastConnect: 2
	SavedState: 4
	StreamingWait: 8
	SupportsEncrypted: 16
	EncryptedPDU: 32
	StreamingTalkerFailed: 64
}

declare const AVB17221AECPStatusCode: {
	Success: 0
	NotImplemented: 1
	NoSuchDescriptor: 2
	EntityLocked: 3
	EntityAcquired: 4
	NotAuthorized: 5
	InsufficientPrivileges: 6
	BadArguments: 7
	NoResources: 8
	InProgress: 9
	EntityMisbehaving: 10
	NotSupported: 11
	StreamIsRunning: 12
	AddressAccessAddressTooLow: 2
	AddressAccessAddressTooHigh: 3
	AddressAccessAddressInvalid: 4
	AddressAccessTLVInvalid: 5
	AddressAccessDataInvalid: 6
	AddressAccessUnsupported: 7
	AVCFailure: 2
}

declare const AVB17221AECPMessageType: {
	AEMCommand: 0
	AEMResponse: 1
	AddressAccessCommand: 2
	AddressAccessResponse: 3
	LegacyAVCCommand: 4
	LegacyAVCResponse: 5
	VendorUniqueCommand: 6
	VendorUniqueResponse: 7
}

declare const AVB17221ADPControllerCapabilities: {
	AVB17221ADPControllerCapabilitiesImplemented: 1
}

declare const AVB17221ADPTalkerCapabilities: {
	Implemented: 1
	HasOtherSource: 512
	HasControlSource: 1024
	HasMediaClockSource: 2048
	HasSMPTESource: 4096
	HasMIDISource: 8192
	HasAudioSource: 16384
	HasVideoSource: -32768
}

declare const AVB17221ACMPStatusCode: {
	Success: 0
	ListenerUnknownID: 1
	TalkerUnknownID: 2
	TalkerDestMACFail: 3
	TalkerNoStreamIndex: 4
	TalkerNoBandwidth: 5
	TalkerExclusive: 6
	ListenerTalkerTimeout: 7
	ListenerExclusive: 8
	StateUnavailable: 9
	NotConnected: 10
	NoSuchConnection: 11
	UnableToSendMessage: 12
	TalkerMisbehaving: 13
	ListenerMisbehaving: 14
	SRPFace: 15
	ControllerNotAuthorized: 16
	IncompatibleRequest: 17
	NotSupported: 31
}

declare const AVB17221ACMPMessageType: {
	ConnectTXCommand: 0
	ConnectTXResponse: 1
	DisconnectTXCommand: 2
	DisconnectTXResponse: 3
	GetTXStateCommand: 4
	GetTXStateResponse: 5
	ConnectRXCommand: 6
	ConnectRXResponse: 7
	DisconnectRXCommand: 8
	DisconnectRXResponse: 9
	GetRXStateCommand: 10
	GetRXStateResponse: 11
	GetTXConnectionCommand: 12
	GetTXConnectionResponse: 13
}

declare const AVB17221ADPListenerCapabilities: {
	Implemented: 1
	HasOtherSink: 512
	HasControlSink: 1024
	HasMediaClockSink: 2048
	HasSMPTESink: 4096
	HasMIDISink: 8192
	HasAudioSink: 16384
	HasVideoSink: -32768
}

declare const AVB17221AEMCommandType: {
	AcquireEntity: 0
	LockEntity: 1
	EntityAvailable: 2
	ControllerAvailable: 3
	ReadDescriptor: 4
	WriteDescriptor: 5
	SetConfiguration: 6
	GetConfiguration: 7
	SetStreamFormat: 8
	GetStreamFormat: 9
	SetVideoFormat: 10
	GetVideoFormat: 11
	SetSensorFormat: 12
	GetSensorFormat: 13
	SetStreamInfo: 14
	GetStreamInfo: 15
	SetName: 16
	GetName: 17
	SetAssociationID: 18
	GetAssociationID: 19
	SetSamplingRate: 20
	GetSamplingRate: 21
	SetClockSource: 22
	GetClockSource: 23
	SetControl: 24
	GetControl: 25
	IncrementControl: 26
	DecrementControl: 27
	SetSignalSelector: 28
	GetSignalSelector: 29
	SetMixer: 30
	GetMixer: 31
	SetMatrix: 32
	GetMatrix: 33
	StartStreaming: 34
	StopStreaming: 35
	RegisterUnsolicitedNotification: 36
	DeregisterUnsolicitedNotification: 37
	IdentifyNotification: 38
	GetAVBInfo: 39
	GetASPath: 40
	GetCounters: 41
	Reboot: 42
	GetAudioMap: 43
	AddAudioMapping: 44
	RemoveAudioMapping: 45
	GetVideoMap: 46
	AddVideoMapping: 47
	RemoveVideoMapping: 48
	GetSensorMap: 49
	AddSensorMapping: 50
	RemoveSensorMapping: 51
	StartOperation: 52
	AbortOperation: 53
	OperationStatus: 54
	AuthenticationAddKey: 55
	AuthenticationDeleteKey: 56
	AuthenticationGetKeyList: 57
	AuthenticationGetKey: 58
	AuthenticationAddKeyToChain: 59
	AuthenticationDeleteKeyFromChain: 60
	AuthenticationGetKeychainList: 61
	AuthenticationGetIdentity: 62
	AuthenticationAddToken: 63
	AuthenticationDeleteToken: 64
	Authenticate: 65
	Deauthenticate: 66
	EnableTransportSecurity: 67
	DisableTransportSecurity: 68
	EnableStreamEncryption: 69
	DisableStreamEncryption: 70
	SetMemoryObjectLength: 71
	GetMemoryObjectLength: 72
	SetStreamBackup: 73
	GetStreamBackup: 74
}

declare const AVB17221ADPEntityCapabilities: {
	DFUMode: 1
	EFUMode: 1
	AddressAccessSupported: 2
	GatewayEntity: 4
	AEMSupported: 8
	LegacyAVC: 16
	AssociationIDSupported: 32
	AssociationIDValid: 64
	VendorUniqueSupported: 128
	ClassASupported: 256
	ClassBSupported: 512
	ASSupported: 1024
	GPTPSupported: 1024
	AEMAuthenticationSupported: 2048
	AEMAuthenticationRequired: 4096
	AEMPersistentAcquireSupported: 8192
	AEMIdenitifyControlIndexValid: 16384
	AEMInterfaceIndexValid: 32768
	GeneralControllerIgnore: 65536
	EntityNotReady: 131072
}

declare interface AVB17221ACMPClient {
	ACMPDidReceiveCommandOnInterface(
		message: AVB17221ACMPMessage,
		anInterface: AVB17221ACMPInterface,
	): boolean

	ACMPDidReceiveResponseOnInterface(
		message: AVB17221ACMPMessage,
		anInterface: AVB17221ACMPInterface,
	): boolean
}

declare class AVB17221ACMPClient extends NativeObject implements AVB17221ACMPClient {}

declare interface AVB17221EntityDiscoveryDelegate {
	didAddRemoteEntityOn17221EntityDiscovery(
		newEntity: AVB17221Entity,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didRemoveRemoteEntityOn17221EntityDiscovery(
		oldEntity: AVB17221Entity,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didRediscoverRemoteEntityOn17221EntityDiscovery(
		entity: AVB17221Entity,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didUpdateRemoteEntityChangedPropertiesOn17221EntityDiscovery(
		entity: AVB17221Entity,
		changedProperties: interop.Enum<typeof AVB17221EntityPropertyChanged>,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didAddLocalEntityOn17221EntityDiscovery(
		newEntity: AVB17221Entity,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didRemoveLocalEntityOn17221EntityDiscovery(
		oldEntity: AVB17221Entity,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didRediscoverLocalEntityOn17221EntityDiscovery(
		entity: AVB17221Entity,
		entityDiscovery: AVB17221EntityDiscovery,
	): void

	didUpdateLocalEntityChangedPropertiesOn17221EntityDiscovery(
		entity: AVB17221Entity,
		changedProperties: interop.Enum<typeof AVB17221EntityPropertyChanged>,
		entityDiscovery: AVB17221EntityDiscovery,
	): void
}

declare class AVB17221EntityDiscoveryDelegate
	extends NativeObject
	implements AVB17221EntityDiscoveryDelegate {}

declare interface AVB17221AECPClient {
	AECPDidReceiveCommandOnInterface(
		message: AVB17221AECPMessage,
		anInterface: AVB17221AECPInterface,
	): boolean

	AECPDidReceiveResponseOnInterface(
		message: AVB17221AECPMessage,
		anInterface: AVB17221AECPInterface,
	): boolean
}

declare class AVB17221AECPClient extends NativeObject implements AVB17221AECPClient {}

declare class AVB17221AECPInterface extends AVB1722ControlInterface {
	static AECPInterfaceWithInterface(anInterface: AVBInterface): AVB17221AECPInterface

	static AECPInterfaceWithInterfaceNamed(anInterfaceName: string): AVB17221AECPInterface

	setCommandHandlerForEntityID(handler: AVB17221AECPClient, targetEntityID: number): boolean

	removeCommandHandlerForEntityID(targetEntityID: number): void

	setResponseHandlerForControllerEntityID(
		handler: AVB17221AECPClient,
		controllerEntityID: number,
	): boolean

	removeResponseHandlerForControllerEntityID(controllerEntityID: number): void

	sendCommandToMACAddressCompletionHandler(
		message: AVB17221AECPMessage,
		destMAC: AVBMACAddress,
		completionHandler: (p1: NSError, p2: AVB17221AECPMessage) => void,
	): boolean

	sendResponseToMACAddressError(
		message: AVB17221AECPMessage,
		destMAC: AVBMACAddress,
		error: interop.PointerConvertible,
	): boolean
}

declare class AVB17221AECPAVCMessage extends AVB17221AECPMessage {
	commandResponse: NSData
}

declare class AVB17221AECPAddressAccessMessage extends AVB17221AECPMessage {
	get tlvs(): NSArray
	set tlvs(value: NSArray<interop.Object> | Array<interop.Object>)

	static commandMessage(): AVB17221AECPAddressAccessMessage

	static responseMessage(): AVB17221AECPAddressAccessMessage
}

declare class AVBMACAddress extends NSObject implements NSCopying {
	initWithBytes(bytes: interop.PointerConvertible): this

	readonly bytes: interop.Pointer

	dataRepresentation: NSData

	stringRepresentation: string

	multicast: boolean

	isMulticast(): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class AVBEthernetInterface extends AVBInterface {}

declare class AVBCentralManager extends NSObject {
	startControllerMatching(): void

	didAddInterface(interface: AVBInterface): void

	didRemoveInterface(interface: AVBInterface): void

	streamingEnabledInterfacesOnly(): boolean

	static nextAvailableDynamicEntityID(): number

	static releaseDynamicEntityID(entityID: number): void

	static nextAvailableDynamicEntityModelID(): number

	static releaseDynamicEntityModelID(entityModelID: number): void
}

declare class AVB17221AECPVendorMessage extends AVB17221AECPMessage {
	protocolID: number

	protocolSpecificData: NSData
}

declare class AVBInterface extends NSObject {
	readonly interfaceName: string

	readonly entityDiscovery: AVB17221EntityDiscovery

	readonly aecp: AVB17221AECPInterface

	readonly acmp: AVB17221ACMPInterface

	static macAddressForInterfaceNamed(anInterfaceName: string): AVBMACAddress

	static supportedInterfaces(): NSArray

	static isAVBEnabledOnInterfaceNamed(anInterfaceName: string): boolean

	static isAVBCapableInterfaceNamed(anInterfaceName: string): boolean

	initWithInterfaceName(anInterfaceName: string): this

	static myEntityID(): number
}

declare class AVB17221ACMPMessage extends NSObject implements NSCopying {
	messageType: interop.Enum<typeof AVB17221ACMPMessageType>

	status: interop.Enum<typeof AVB17221ACMPStatusCode>

	streamID: number

	controllerEntityID: number

	talkerEntityID: number

	listenerEntityID: number

	talkerUniqueID: number

	listenerUniqueID: number

	destinationMAC: AVBMACAddress

	connectionCount: number

	sequenceID: number

	flags: interop.Enum<typeof AVB17221ACMPFlags>

	vlanID: number

	sourceMAC: AVBMACAddress

	static errorForStatusCode(statusCode: interop.Enum<typeof AVB17221ACMPStatusCode>): NSError

	errorForStatusCode(): NSError

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class AVB17221Entity extends NSObject {
	localEntity: boolean

	timeToLive: number

	entityID: number

	entityModelID: number

	entityCapabilities: interop.Enum<typeof AVB17221ADPEntityCapabilities>

	talkerStreamSources: number

	talkerCapabilities: interop.Enum<typeof AVB17221ADPTalkerCapabilities>

	listenerStreamSinks: number

	listenerCapabilities: interop.Enum<typeof AVB17221ADPListenerCapabilities>

	controllerCapabilities: interop.Enum<typeof AVB17221ADPControllerCapabilities>

	availableIndex: number

	gPTPGrandmasterID: number

	gPTPDomainNumber: number

	identifyControlIndex: number

	interfaceIndex: number

	associationID: number

	get macAddresses(): NSArray
	set macAddresses(value: NSArray<interop.Object> | Array<interop.Object>)

	entityDiscovery: AVB17221EntityDiscovery

	isLocalEntity(): boolean
}

declare class AVB17221ACMPInterface extends AVB1722ControlInterface {
	readonly multicastDestinationAddress: AVBMACAddress

	static ACMPInterfaceWithInterface(anInterface: AVBInterface): AVB17221ACMPInterface

	static ACMPInterfaceWithInterfaceNamed(anInterfaceName: string): AVB17221ACMPInterface

	setHandlerForEntityID(handler: AVB17221ACMPClient, targetEntityID: number): boolean

	removeHandlerForEntityID(targetEntityID: number): void

	sendACMPResponseMessageError(
		message: AVB17221ACMPMessage,
		error: interop.PointerConvertible,
	): boolean

	sendACMPCommandMessageCompletionHandler(
		message: AVB17221ACMPMessage,
		completionHandler: (p1: NSError, p2: AVB17221ACMPMessage) => void,
	): boolean
}

declare class AVB1722ControlInterface extends NSObject {
	readonly interfaceName: string

	readonly interface: AVBInterface

	initWithInterfaceName(anInterfaceName: string): this

	initWithInterface(anInterface: AVBInterface): this
}

declare class AVB17221AECPAddressAccessTLV extends NSObject {
	mode: interop.Enum<typeof AVB17221AECPAddressAccessTLVMode>

	address: number

	memoryData: NSData
}

declare class AVB17221EntityDiscovery extends NSObject {
	interfaceName: string

	readonly interface: AVBInterface

	discoveryDelegate: AVB17221EntityDiscoveryDelegate

	initWithInterfaceName(anInterfaceName: string): this

	primeIterators(): void

	discoverEntities(): boolean

	discoverEntity(entityID: number): boolean

	addLocalEntityError(anEntity: AVB17221Entity, error: interop.PointerConvertible): boolean

	removeLocalEntityError(guid: number, error: interop.PointerConvertible): boolean

	changeEntityWithEntityIDToNewGPTPGrandmasterIDError(
		entityID: number,
		gPTPGrandmasterID: number,
		error: interop.PointerConvertible,
	): boolean
}

declare class AVB17221AECPMessage extends NSObject implements NSCopying {
	messageType: interop.Enum<typeof AVB17221AECPMessageType>

	status: interop.Enum<typeof AVB17221AECPStatusCode>

	targetEntityID: number

	controllerEntityID: number

	sequenceID: number

	sourceMAC: AVBMACAddress

	static errorForStatusCode(statusCode: interop.Enum<typeof AVB17221AECPStatusCode>): NSError

	errorForStatusCode(): NSError

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class AVB17221AECPAEMMessage extends AVB17221AECPMessage {
	commandType: interop.Enum<typeof AVB17221AEMCommandType>

	unsolicited: boolean

	controllerRequest: boolean

	commandSpecificData: NSData

	static commandMessage(): AVB17221AECPAEMMessage

	static responseMessage(): AVB17221AECPAEMMessage

	static responseMessageFromCommandMessage(
		commandMessage: AVB17221AECPAEMMessage,
	): AVB17221AECPAEMMessage

	isUnsolicited(): boolean

	isControllerRequest(): boolean
}
