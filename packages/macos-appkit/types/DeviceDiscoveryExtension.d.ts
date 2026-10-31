/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const DDErrorDomain: string

declare const DDDeviceProtocolStringInvalid: string

declare const DDDeviceProtocolStringDIAL: string

declare const DDEventType: {
	Unknown: 0
	DeviceFound: 40
	DeviceLost: 41
	DeviceChanged: 42
}

declare const DDErrorCode: {
	Success: 0
	Unknown: 350000
	BadParameter: 350001
	Unsupported: 350002
	Timeout: 350003
	Internal: 350004
	MissingEntitlement: 350005
	Permission: 350006
	Next: 350007
}

declare const DDDeviceWiFiAwareServiceRole: {
	Subscriber: 10
	Publisher: 20
}

declare const DDDeviceMediaPlaybackState: {
	NoContent: 0
	Paused: 1
	Playing: 2
}

declare const DDDeviceCategory: {
	HiFiSpeaker: 0
	HiFiSpeakerMultiple: 1
	TVWithMediaBox: 2
	TV: 3
	LaptopComputer: 4
	DesktopComputer: 5
	AccessorySetup: 6
}

declare const DDDeviceProtocol: {
	Invalid: 0
	DIAL: 1
}

declare const DDDeviceState: {
	Invalid: 0
	Activating: 10
	Activated: 20
	Authorized: 25
	Invalidating: 30
}

declare const DDDeviceSupports: {
	PairingLE: 2
	TransportBridging: 4
	HID: 8
}

declare function DDDeviceProtocolToString(inValue: interop.Enum<typeof DDDeviceProtocol>): string

declare function DDDeviceCategoryToString(inValue: interop.Enum<typeof DDDeviceCategory>): string

declare function DDDeviceStateToString(inValue: interop.Enum<typeof DDDeviceState>): string

declare function DDDeviceMediaPlaybackStateToString(
	inValue: interop.Enum<typeof DDDeviceMediaPlaybackState>,
): string

declare function DDEventTypeToString(inValue: interop.Enum<typeof DDEventType>): string

declare class DDDevice extends NSObject {
	initWithDisplayNameCategoryProtocolTypeIdentifier(
		displayName: string,
		category: interop.Enum<typeof DDDeviceCategory>,
		protocolType: UTType,
		identifier: string,
	): this

	deviceSupports: interop.Enum<typeof DDDeviceSupports>

	bluetoothIdentifier: NSUUID

	category: interop.Enum<typeof DDDeviceCategory>

	displayImageName: string

	displayName: string

	identifier: string

	mediaPlaybackState: interop.Enum<typeof DDDeviceMediaPlaybackState>

	mediaContentTitle: string

	mediaContentSubtitle: string

	networkEndpoint: NSObject

	protocol: interop.Enum<typeof DDDeviceProtocol>

	protocolType: UTType

	state: interop.Enum<typeof DDDeviceState>

	SSID: string

	supportsGrouping: boolean

	txtRecordData: NSData

	url: NSURL

	wifiAwareServiceName: string

	wifiAwareServiceRole: interop.Enum<typeof DDDeviceWiFiAwareServiceRole>

	wifiAwareModelName: string

	wifiAwareVendorName: string
}

declare class DDDeviceEvent extends NSObject {
	initWithEventTypeDevice(type: interop.Enum<typeof DDEventType>, device: DDDevice): this

	readonly device: DDDevice

	readonly eventType: interop.Enum<typeof DDEventType>
}

declare class DDDiscoverySession extends NSObject {
	reportEvent(inEvent: DDDeviceEvent): void
}
