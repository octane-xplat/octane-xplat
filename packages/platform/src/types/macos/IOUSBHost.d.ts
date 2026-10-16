import type { NSArray, NSData, NSMutableData, NSNumber, NSUUID } from './Foundation'

import type {
	IOUSBDeviceRequest,
	IOUSBEndpointDescriptor,
	IOUSBSuperSpeedEndpointCompanionDescriptor,
	IOUSBSuperSpeedPlusIsochronousEndpointCompanionDescriptor,
} from './IOKit'

import type { IOUSBHostCIMessage } from './Kernel'

import type { interop } from './objc-runtime'

import {
	tIOUSBDescriptorType,
	tIOUSBDeviceRequestRecipientValue,
	tIOUSBDeviceRequestTypeValue,
} from './IOKit'

import {
	IOUSBHostCIControllerState,
	IOUSBHostCIDeviceSpeed,
	IOUSBHostCIDeviceState,
	IOUSBHostCIEndpointState,
	IOUSBHostCILinkState,
	IOUSBHostCIMessageStatus,
	IOUSBHostCIPortState,
} from './Kernel'

import { NSObject } from './Runtime'

export declare const IOUSBHostDefaultControlCompletionTimeout: number

export declare const IOUSBHostInterfacePropertyKeyAlternateSetting: string

export declare const IOUSBHostDevicePropertyKeyCurrentConfiguration: string

export declare const IOUSBHostDevicePropertyKeySerialNumberString: string

export declare const IOUSBHostDevicePropertyKeyVendorString: string

export declare const IOUSBHostMatchingPropertyKeyDeviceSubClass: string

export declare const IOUSBHostMatchingPropertyKeyInterfaceSubClass: string

export declare const IOUSBHostMatchingPropertyKeyInterfaceClass: string

export declare const IOUSBHostMatchingPropertyKeyProductIDArray: string

export declare const IOUSBHostErrorDomain: string

export declare const IOUSBHostVersionString: interop.Pointer

export declare const IOUSBHostVersionNumber: number

export declare const IOUSBHostMatchingPropertyKeyProductIDMask: string

export declare const IOUSBHostMatchingPropertyKeyProductID: string

export declare const IOUSBHostMatchingPropertyKeyInterfaceProtocol: string

export declare const IOUSBHostMatchingPropertyKeyInterfaceNumber: string

export declare const IOUSBHostMatchingPropertyKeySpeed: string

export declare const IOUSBHostMatchingPropertyKeyVendorID: string

export declare const IOUSBHostMatchingPropertyKeyDeviceReleaseNumber: string

export declare const IOUSBHostMatchingPropertyKeyDeviceProtocol: string

export declare const IOUSBHostDevicePropertyKeyContainerID: string

export declare const IOUSBHostMatchingPropertyKeyConfigurationValue: string

export declare const IOUSBHostMatchingPropertyKeyDeviceClass: string

export declare const IOUSBHostPropertyKeyLocationID: string

export declare const IOUSBHostAbortOption: {
	Asynchronous: 0
	Synchronous: 1
}

export declare const IOUSBHostIsochronousTransferOptions: {
	IOUSBHostIsochronousTransferOptionsNone: 0
}

export declare const IOUSBHostObjectDataOptions: {
	None: 0
	KernelUserShared: 1
}

export declare const IOUSBHostObjectDestroyOptions: {
	None: 0
	DeviceSurrender: 1
}

export declare const IOUSBHostObjectInitOptions: {
	None: 0
	DeviceCapture: 1
	DeviceSeize: 2
}

export declare const IOUSBHostIsochronousTransactionOptions: {
	None: 0
	Wrap: 1
}

export declare class IOUSBHostIOSourceDescriptors {
	constructor(init?: IOUSBHostIOSourceDescriptors)
	bcdUSB: number
	descriptor: IOUSBEndpointDescriptor
	ssCompanionDescriptor: IOUSBSuperSpeedEndpointCompanionDescriptor
	sspCompanionDescriptor: IOUSBSuperSpeedPlusIsochronousEndpointCompanionDescriptor
}

export declare class unnamed_4794104136170733004 {
	constructor(init?: unnamed_4794104136170733004)
	status: number
	requestCount: number
	completeCount: number
	reserved: number
	timeStamp: number
}

export declare class unnamed_13920030179087226621 {
	constructor(init?: unnamed_13920030179087226621)
	status: number
	requestCount: number
	offset: number
	completeCount: number
	timeStamp: number
	options: interop.Enum<typeof IOUSBHostIsochronousTransactionOptions>
}

export declare function IOUSBGetNextDescriptor(
	configurationDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetNextDescriptorWithType(
	configurationDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
	type: number,
): interop.Pointer

export declare function IOUSBGetNextAssociatedDescriptor(
	configurationDescriptor: interop.PointerConvertible,
	parentDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetNextAssociatedDescriptorWithType(
	configurationDescriptor: interop.PointerConvertible,
	parentDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
	type: number,
): interop.Pointer

export declare function IOUSBGetNextInterfaceAssociationDescriptor(
	configurationDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetNextInterfaceDescriptor(
	configurationDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetNextEndpointDescriptor(
	configurationDescriptor: interop.PointerConvertible,
	interfaceDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetNextCapabilityDescriptor(
	bosDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetNextCapabilityDescriptorWithType(
	bosDescriptor: interop.PointerConvertible,
	currentDescriptor: interop.PointerConvertible,
	type: number,
): interop.Pointer

export declare function IOUSBGetUSB20ExtensionDeviceCapabilityDescriptor(
	bosDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetSuperSpeedDeviceCapabilityDescriptor(
	bosDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetSuperSpeedPlusDeviceCapabilityDescriptor(
	bosDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetContainerIDDescriptor(
	bosDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetPlatformCapabilityDescriptor(
	bosDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetPlatformCapabilityDescriptorWithUUID(
	bosDescriptor: interop.PointerConvertible,
	uuid: unknown /* const array */,
): interop.Pointer

export declare function IOUSBGetBillboardDescriptor(
	bosDescriptor: interop.PointerConvertible,
): interop.Pointer

export declare function IOUSBGetEndpointDirection(descriptor: interop.PointerConvertible): number

export declare function IOUSBGetEndpointAddress(descriptor: interop.PointerConvertible): number

export declare function IOUSBGetEndpointNumber(descriptor: interop.PointerConvertible): number

export declare function IOUSBGetEndpointType(descriptor: interop.PointerConvertible): number

export declare function IOUSBGetEndpointUsageType(descriptor: interop.PointerConvertible): number

export declare function IOUSBGetEndpointSynchronizationType(
	descriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointMaxPacketSize(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointBurstSize(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
	companionDescriptor: interop.PointerConvertible,
	sspCompanionDescriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointMult(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
	companionDescriptor: interop.PointerConvertible,
	sspCompanionDescriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointIntervalEncodedMicroframes(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointIntervalMicroframes(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointIntervalFrames(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointMaxStreamsEncoded(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
	companionDescriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetEndpointMaxStreams(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
	companionDescriptor: interop.PointerConvertible,
): number

export declare function IOUSBGetConfigurationMaxPowerMilliAmps(
	usbDeviceSpeed: number,
	descriptor: interop.PointerConvertible,
): number

export declare class IOUSBHostCIDeviceStateMachine extends NSObject {
	initWithInterfaceCommandError(
		interface: IOUSBHostControllerInterface,
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	inspectCommandError(
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	respondToCommandStatusError(
		command: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		error: interop.PointerConvertible,
	): boolean

	respondToCommandStatusDeviceAddressError(
		command: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		deviceAddress: number,
		error: interop.PointerConvertible,
	): boolean

	readonly deviceState: interop.Enum<typeof IOUSBHostCIDeviceState>

	readonly completeRoute: number

	readonly deviceAddress: number

	readonly controllerInterface: IOUSBHostControllerInterface
}

export declare class IOUSBHostControllerInterface extends NSObject {
	initWithCapabilitiesQueueInterruptRateHzErrorCommandHandlerDoorbellHandlerInterestHandler(
		capabilities: NSData,
		queue: NSObject | null,
		interruptRateHz: number,
		error: interop.PointerConvertible,
		commandHandler: (p1: IOUSBHostControllerInterface, p2: IOUSBHostCIMessage) => void,
		doorbellHandler: (
			p1: IOUSBHostControllerInterface,
			p2: interop.PointerConvertible,
			p3: number,
		) => void,
		interestHandler: (
			p1: interop.PointerConvertible,
			p2: number,
			p3: number,
			p4: interop.PointerConvertible,
		) => void | null,
	): this

	destroy(): void

	readonly queue: NSObject

	enqueueInterruptError(
		interrupt: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	enqueueInterruptExpediteError(
		interrupt: interop.PointerConvertible,
		expedite: boolean,
		error: interop.PointerConvertible,
	): boolean

	enqueueInterruptsCountError(
		interrupts: interop.PointerConvertible,
		count: number,
		error: interop.PointerConvertible,
	): boolean

	enqueueInterruptsCountExpediteError(
		interrupts: interop.PointerConvertible,
		count: number,
		expedite: boolean,
		error: interop.PointerConvertible,
	): boolean

	interruptRateHz: number

	descriptionForMessage(message: interop.PointerConvertible): string

	readonly controllerStateMachine: IOUSBHostCIControllerStateMachine

	getPortStateMachineForCommandError(
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): IOUSBHostCIPortStateMachine

	getPortStateMachineForPortError(
		port: number,
		error: interop.PointerConvertible,
	): IOUSBHostCIPortStateMachine

	readonly capabilities: interop.Pointer

	capabilitiesForPort(port: number): interop.Pointer

	readonly uuid: NSUUID
}

export declare class IOUSBHostCIPortStateMachine extends NSObject {
	initWithInterfacePortNumberError(
		interface: IOUSBHostControllerInterface,
		portNumber: number,
		error: interop.PointerConvertible,
	): this

	inspectCommandError(
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	respondToCommandStatusError(
		command: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		error: interop.PointerConvertible,
	): boolean

	readonly portNumber: number

	readonly portState: interop.Enum<typeof IOUSBHostCIPortState>

	readonly portStatus: number

	readonly controllerInterface: IOUSBHostControllerInterface

	powered: boolean

	connected: boolean

	overcurrent: boolean

	updateLinkStateSpeedInhibitLinkStateChangeError(
		linkState: interop.Enum<typeof IOUSBHostCILinkState>,
		speed: interop.Enum<typeof IOUSBHostCIDeviceSpeed>,
		inhibitLinkStateChange: boolean,
		error: interop.PointerConvertible,
	): boolean

	readonly linkState: interop.Enum<typeof IOUSBHostCILinkState>

	readonly speed: interop.Enum<typeof IOUSBHostCIDeviceSpeed>
}

export declare class IOUSBHostStream extends IOUSBHostIOSource {
	readonly hostPipe: IOUSBHostPipe

	readonly streamID: number

	abortWithOptionError(
		option: interop.Enum<typeof IOUSBHostAbortOption>,
		error: interop.PointerConvertible,
	): boolean

	abortWithError(error: interop.PointerConvertible): boolean

	sendIORequestWithDataBytesTransferredError(
		data: NSMutableData | null,
		bytesTransferred: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	enqueueIORequestWithDataErrorCompletionHandler(
		data: NSMutableData | null,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean
}

export declare class IOUSBHostIOSource extends NSObject {
	readonly hostInterface: IOUSBHostInterface

	readonly deviceAddress: number

	readonly endpointAddress: number
}

export declare class IOUSBHostInterface extends IOUSBHostObject {
	static createMatchingDictionaryWithVendorIDProductIDBcdDeviceInterfaceNumberConfigurationValueInterfaceClassInterfaceSubclassInterfaceProtocolSpeedProductIDArray(
		vendorID: NSNumber | null,
		productID: NSNumber | null,
		bcdDevice: NSNumber | null,
		interfaceNumber: NSNumber | null,
		configurationValue: NSNumber | null,
		interfaceClass: NSNumber | null,
		interfaceSubclass: NSNumber | null,
		interfaceProtocol: NSNumber | null,
		speed: NSNumber | null,
		productIDArray: NSArray<interop.Object> | Array<interop.Object> | null,
	): interop.Object

	initWithIOServiceOptionsQueueErrorInterestHandler(
		ioService: number,
		options: interop.Enum<typeof IOUSBHostObjectInitOptions>,
		queue: NSObject | null,
		error: interop.PointerConvertible,
		interestHandler: (
			p1: IOUSBHostObject,
			p2: number,
			p3: interop.PointerConvertible,
		) => void | null,
	): this

	readonly idleTimeout: number

	setIdleTimeoutError(idleTimeout: number, error: interop.PointerConvertible): boolean

	readonly configurationDescriptor: interop.Pointer

	readonly interfaceDescriptor: interop.Pointer

	selectAlternateSettingError(alternateSetting: number, error: interop.PointerConvertible): boolean

	copyPipeWithAddressError(address: number, error: interop.PointerConvertible): IOUSBHostPipe
}

export declare class IOUSBHostDevice extends IOUSBHostObject {
	static createMatchingDictionaryWithVendorIDProductIDBcdDeviceDeviceClassDeviceSubclassDeviceProtocolSpeedProductIDArray(
		vendorID: NSNumber | null,
		productID: NSNumber | null,
		bcdDevice: NSNumber | null,
		deviceClass: NSNumber | null,
		deviceSubclass: NSNumber | null,
		deviceProtocol: NSNumber | null,
		speed: NSNumber | null,
		productIDArray: NSArray<interop.Object> | Array<interop.Object> | null,
	): interop.Object

	configureWithValueMatchInterfacesError(
		value: number,
		matchInterfaces: boolean,
		error: interop.PointerConvertible,
	): boolean

	configureWithValueError(value: number, error: interop.PointerConvertible): boolean

	readonly configurationDescriptor: interop.Pointer

	resetWithError(error: interop.PointerConvertible): boolean
}

export declare class IOUSBHostObject extends NSObject {
	initWithIOServiceOptionsQueueErrorInterestHandler(
		ioService: number,
		options: interop.Enum<typeof IOUSBHostObjectInitOptions>,
		queue: NSObject | null,
		error: interop.PointerConvertible,
		interestHandler: (
			p1: IOUSBHostObject,
			p2: number,
			p3: interop.PointerConvertible,
		) => void | null,
	): this

	initWithIOServiceQueueErrorInterestHandler(
		ioService: number,
		queue: NSObject | null,
		error: interop.PointerConvertible,
		interestHandler: (
			p1: IOUSBHostObject,
			p2: number,
			p3: interop.PointerConvertible,
		) => void | null,
	): this

	destroy(): void

	destroyWithOptions(options: interop.Enum<typeof IOUSBHostObjectDestroyOptions>): void

	readonly ioService: number

	readonly queue: NSObject

	sendDeviceRequestDataBytesTransferredCompletionTimeoutError(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		bytesTransferred: interop.PointerConvertible,
		completionTimeout: number,
		error: interop.PointerConvertible,
	): boolean

	sendDeviceRequestDataBytesTransferredError(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		bytesTransferred: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	sendDeviceRequestError(request: IOUSBDeviceRequest, error: interop.PointerConvertible): boolean

	enqueueDeviceRequestDataCompletionTimeoutErrorCompletionHandler(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		completionTimeout: number,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	enqueueDeviceRequestDataErrorCompletionHandler(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	enqueueDeviceRequestErrorCompletionHandler(
		request: IOUSBDeviceRequest,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	abortDeviceRequestsWithOptionError(
		option: interop.Enum<typeof IOUSBHostAbortOption>,
		error: interop.PointerConvertible,
	): boolean

	abortDeviceRequestsWithError(error: interop.PointerConvertible): boolean

	descriptorWithTypeLengthIndexLanguageIDRequestTypeRequestRecipientError(
		type: interop.Enum<typeof tIOUSBDescriptorType>,
		length: interop.PointerConvertible,
		index: number,
		languageID: number,
		requestType: interop.Enum<typeof tIOUSBDeviceRequestTypeValue>,
		requestRecipient: interop.Enum<typeof tIOUSBDeviceRequestRecipientValue>,
		error: interop.PointerConvertible,
	): interop.Pointer

	descriptorWithTypeLengthIndexLanguageIDError(
		type: interop.Enum<typeof tIOUSBDescriptorType>,
		length: interop.PointerConvertible,
		index: number,
		languageID: number,
		error: interop.PointerConvertible,
	): interop.Pointer

	descriptorWithTypeLengthError(
		type: interop.Enum<typeof tIOUSBDescriptorType>,
		length: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): interop.Pointer

	readonly deviceDescriptor: interop.Pointer

	readonly capabilityDescriptors: interop.Pointer

	configurationDescriptorWithIndexError(
		index: number,
		error: interop.PointerConvertible,
	): interop.Pointer

	configurationDescriptorWithConfigurationValueError(
		configurationValue: number,
		error: interop.PointerConvertible,
	): interop.Pointer

	stringWithIndexLanguageIDError(
		index: number,
		languageID: number,
		error: interop.PointerConvertible,
	): string

	stringWithIndexError(index: number, error: interop.PointerConvertible): string

	readonly deviceAddress: number

	frameNumberWithTime(time: interop.PointerConvertible): number

	currentMicroframeWithTimeError(
		time: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): number

	referenceMicroframeWithTimeError(
		time: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): number

	ioDataWithCapacityError(capacity: number, error: interop.PointerConvertible): NSMutableData
}

export declare class IOUSBHostPipe extends IOUSBHostIOSource {
	readonly originalDescriptors: interop.Pointer

	readonly descriptors: interop.Pointer

	adjustPipeWithDescriptorsError(
		descriptors: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	readonly idleTimeout: number

	setIdleTimeoutError(idleTimeout: number, error: interop.PointerConvertible): boolean

	clearStallWithError(error: interop.PointerConvertible): boolean

	sendControlRequestDataBytesTransferredCompletionTimeoutError(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		bytesTransferred: interop.PointerConvertible,
		completionTimeout: number,
		error: interop.PointerConvertible,
	): boolean

	sendControlRequestDataBytesTransferredError(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		bytesTransferred: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	sendControlRequestError(request: IOUSBDeviceRequest, error: interop.PointerConvertible): boolean

	enqueueControlRequestDataCompletionTimeoutErrorCompletionHandler(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		completionTimeout: number,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	enqueueControlRequestDataErrorCompletionHandler(
		request: IOUSBDeviceRequest,
		data: NSMutableData | null,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	enqueueControlRequestErrorCompletionHandler(
		request: IOUSBDeviceRequest,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	abortWithOptionError(
		option: interop.Enum<typeof IOUSBHostAbortOption>,
		error: interop.PointerConvertible,
	): boolean

	abortWithError(error: interop.PointerConvertible): boolean

	sendIORequestWithDataBytesTransferredCompletionTimeoutError(
		data: NSMutableData | null,
		bytesTransferred: interop.PointerConvertible,
		completionTimeout: number,
		error: interop.PointerConvertible,
	): boolean

	enqueueIORequestWithDataCompletionTimeoutErrorCompletionHandler(
		data: NSMutableData | null,
		completionTimeout: number,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: number) => void | null,
	): boolean

	sendIORequestWithDataFrameListFrameListCountFirstFrameNumberError(
		data: NSMutableData,
		frameList: interop.PointerConvertible,
		frameListCount: number,
		firstFrameNumber: number,
		error: interop.PointerConvertible,
	): boolean

	enqueueIORequestWithDataFrameListFrameListCountFirstFrameNumberErrorCompletionHandler(
		data: NSMutableData,
		frameList: interop.PointerConvertible,
		frameListCount: number,
		firstFrameNumber: number,
		error: interop.PointerConvertible,
		completionHandler: (p1: number, p2: interop.PointerConvertible) => void | null,
	): boolean

	enableStreamsWithError(error: interop.PointerConvertible): boolean

	disableStreamsWithError(error: interop.PointerConvertible): boolean

	copyStreamWithStreamIDError(streamID: number, error: interop.PointerConvertible): IOUSBHostStream
}

export declare class IOUSBHostCIControllerStateMachine extends NSObject {
	initWithInterfaceError(
		interface: IOUSBHostControllerInterface,
		error: interop.PointerConvertible,
	): this

	inspectCommandError(
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	respondToCommandStatusError(
		command: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		error: interop.PointerConvertible,
	): boolean

	respondToCommandStatusFrameTimestampError(
		command: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		frame: number,
		timestamp: number,
		error: interop.PointerConvertible,
	): boolean

	enqueueUpdatedFrameTimestampError(
		frame: number,
		timestamp: number,
		error: interop.PointerConvertible,
	): boolean

	readonly controllerState: interop.Enum<typeof IOUSBHostCIControllerState>

	readonly controllerInterface: IOUSBHostControllerInterface
}

export declare class IOUSBHostCIEndpointStateMachine extends NSObject {
	initWithInterfaceCommandError(
		interface: IOUSBHostControllerInterface,
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): this

	inspectCommandError(
		command: interop.PointerConvertible,
		error: interop.PointerConvertible,
	): boolean

	respondToCommandStatusError(
		command: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		error: interop.PointerConvertible,
	): boolean

	processDoorbellError(doorbell: number, error: interop.PointerConvertible): boolean

	enqueueTransferCompletionForMessageStatusTransferLengthError(
		message: interop.PointerConvertible,
		status: interop.Enum<typeof IOUSBHostCIMessageStatus>,
		transferLength: number,
		error: interop.PointerConvertible,
	): boolean

	readonly endpointState: interop.Enum<typeof IOUSBHostCIEndpointState>

	readonly deviceAddress: number

	readonly endpointAddress: number

	readonly currentTransferMessage: interop.Pointer

	readonly controllerInterface: IOUSBHostControllerInterface
}
