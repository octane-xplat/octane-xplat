import type { NSArray, NSInputStream, NSOutputStream } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const EAConnectionIDNone: number

export declare const EAAccessoryDidConnectNotification: string

export declare const EABluetoothAccessoryPickerErrorDomain: string

export declare const EAAccessoryDidDisconnectNotification: string

export declare const EAAccessoryKey: string

export declare const EAWiFiUnconfiguredAccessoryProperties: {
	AirPlay: 1
	AirPrint: 2
	HomeKit: 4
}

export declare const EABluetoothAccessoryPickerErrorCode: {
	AlreadyConnected: 0
	ResultNotFound: 1
	ResultCancelled: 2
	ResultFailed: 3
}

export declare const EAWiFiUnconfiguredAccessoryConfigurationStatus: {
	Success: 0
	UserCancelledConfiguration: 1
	Failed: 2
}

export declare const EAWiFiUnconfiguredAccessoryBrowserState: {
	WiFiUnavailable: 0
	Stopped: 1
	Searching: 2
	Configuring: 3
}

export declare interface EAAccessoryDelegate extends NSObjectProtocol {
	accessoryDidDisconnect?(accessory: EAAccessory): void
}

export declare class EAAccessoryDelegate extends NativeObject implements EAAccessoryDelegate {}

export declare interface EAWiFiUnconfiguredAccessoryBrowserDelegate extends NSObjectProtocol {}

export declare class EAWiFiUnconfiguredAccessoryBrowserDelegate
	extends NativeObject
	implements EAWiFiUnconfiguredAccessoryBrowserDelegate {}

export declare class EASession extends NSObject {
	initWithAccessoryForProtocol(accessory: EAAccessory, protocolString: string): this

	readonly accessory: EAAccessory

	readonly protocolString: string

	readonly inputStream: NSInputStream

	readonly outputStream: NSOutputStream
}

export declare class EAAccessory extends NSObject {
	readonly connected: boolean

	readonly connectionID: number

	readonly manufacturer: string

	readonly name: string

	readonly modelNumber: string

	readonly serialNumber: string

	readonly firmwareRevision: string

	readonly hardwareRevision: string

	readonly dockType: string

	readonly protocolStrings: NSArray

	delegate: EAAccessoryDelegate

	isConnected(): boolean
}

export declare class EAAccessoryManager extends NSObject {
	static sharedAccessoryManager(): EAAccessoryManager

	registerForLocalNotifications(): void

	unregisterForLocalNotifications(): void

	readonly connectedAccessories: NSArray
}
