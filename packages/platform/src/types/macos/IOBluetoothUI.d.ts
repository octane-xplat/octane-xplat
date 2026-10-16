import type { NSImage, NSLayoutConstraint, NSWindow } from './AppKit'

import type { NSArray } from './Foundation'

import type { IOBluetoothDevice, IOBluetoothSDPUUID } from './IOBluetooth'

import type { interop } from './objc-runtime'

import { NSImageCell, NSTextFieldCell, NSView, NSWindowController } from './AppKit'

export declare const kIOBluetoothServiceBrowserControllerOptionsNone: number

export declare const kIOBluetoothServiceBrowserControllerOptionsAutoStartInquiry: number

export declare const kIOBluetoothServiceBrowserControllerOptionsDisconnectWhenDone: number

export declare const kIOBluetoothUIUserCanceledErr: number

export declare const kIOBluetoothUISuccess: number

export declare const BluetoothKeyboardReturnType: {
	ANSI: 0
	ISO: 1
	JIS: 2
	No: 3
}

export declare function IOBluetoothValidateHardwareWithDescription(
	cancelButtonTitle: interop.Object,
	descriptionText: interop.Object,
): number

export declare function IOBluetoothGetPairingController(): interop.Object

export declare function IOBluetoothGetDeviceSelectorController(): interop.Object

export declare class IOBluetoothServiceBrowserController extends NSWindowController {
	static serviceBrowserController(inOptions: number): IOBluetoothServiceBrowserController

	static browseDevicesOptions(outRecord: interop.PointerConvertible, inOptions: number): number

	static browseDevicesAsSheetForWindowOptionsWindow(
		outRecord: interop.PointerConvertible,
		inOptions: number,
		inWindow: NSWindow,
	): number

	static withServiceBrowserControllerRef(
		serviceBrowserControllerRef: interop.Object,
	): IOBluetoothServiceBrowserController

	getServiceBrowserControllerRef(): interop.Object

	discover(outRecord: interop.PointerConvertible): number

	discoverAsSheetForWindowWithRecord(
		sheetWindow: NSWindow,
		outRecord: interop.PointerConvertible,
	): number

	discoverWithDeviceAttributesServiceListServiceRecord(
		deviceAttributes: interop.PointerConvertible,
		serviceArray: NSArray<interop.Object> | Array<interop.Object>,
		outRecord: interop.PointerConvertible,
	): number

	setOptions(inOptions: number): void

	runModal(): number

	beginSheetModalForWindowModalDelegateDidEndSelectorContextInfo(
		sheetWindow: NSWindow,
		modalDelegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
	): number

	getResults(): NSArray

	getOptions(): number

	setSearchAttributes(searchAttributes: interop.PointerConvertible): void

	getSearchAttributes(): interop.Pointer

	addAllowedUUID(allowedUUID: IOBluetoothSDPUUID): void

	addAllowedUUIDArray(allowedUUIDArray: NSArray<interop.Object> | Array<interop.Object>): void

	clearAllowedUUIDs(): void

	setTitle(windowTitle: string): void

	getTitle(): string

	setDescriptionText(descriptionText: string): void

	getDescriptionText(): string

	setPrompt(prompt: string): void

	getPrompt(): string
}

export declare class IOBluetoothAccessibilityIgnoredImageCell extends NSImageCell {}

export declare class IOBluetoothPairingController extends NSWindowController {
	static pairingController(): IOBluetoothPairingController

	runModal(): number

	getResults(): NSArray

	setOptions(options: number): void

	getOptions(): number

	setSearchAttributes(searchAttributes: interop.PointerConvertible): void

	getSearchAttributes(): interop.Pointer

	addAllowedUUID(allowedUUID: IOBluetoothSDPUUID): void

	addAllowedUUIDArray(allowedUUIDArray: NSArray<interop.Object> | Array<interop.Object>): void

	clearAllowedUUIDs(): void

	setTitle(windowTitle: string): void

	getTitle(): string

	setDescriptionText(descriptionText: string): void

	getDescriptionText(): string

	setPrompt(prompt: string): void

	getPrompt(): string
}

export declare class IOBluetoothObjectPushUIController extends NSWindowController {
	initObjectPushWithBluetoothDeviceWithFilesDelegate(
		inDevice: IOBluetoothDevice,
		inFiles: NSArray<interop.Object> | Array<interop.Object>,
		inDelegate: interop.Object,
	): this

	runModal(): void

	runPanel(): void

	beginSheetModalForWindowModalDelegateDidEndSelectorContextInfo(
		sheetWindow: NSWindow,
		modalDelegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
	): number

	stop(): void

	setTitle(windowTitle: string): void

	getTitle(): string

	setIconImage(image: NSImage): void

	getDevice(): IOBluetoothDevice

	isTransferInProgress(): boolean
}

export declare class IOBluetoothPasskeyDisplay extends NSView {
	usePasskeyNotificaitons: boolean

	isIncomingRequest: boolean

	passkey: string

	returnImage: NSImage

	returnHighlightImage: NSImage

	centeredView: NSView

	backgroundImageConstraint: NSLayoutConstraint

	static sharedDisplayView(): IOBluetoothPasskeyDisplay

	setPasskeyForDeviceUsingSSP(inString: string, device: IOBluetoothDevice, isSSP: boolean): void

	advancePasskeyIndicator(): void

	retreatPasskeyIndicator(): void

	resetPasskeyIndicator(): void

	setupUIForDevice(device: IOBluetoothDevice): void

	setupUIForSSPDevice(device: IOBluetoothDevice): void

	setPasskeyString(inString: string): void

	setPasskeyIndicatorEnabled(inEnabled: boolean): void

	resetAll(): void
}

export declare class IOBluetoothAccessibilityIgnoredTextFieldCell extends NSTextFieldCell {}

export declare class IOBluetoothDeviceSelectorController extends NSWindowController {
	static deviceSelector(): IOBluetoothDeviceSelectorController

	runModal(): number

	beginSheetModalForWindowModalDelegateDidEndSelectorContextInfo(
		sheetWindow: NSWindow,
		modalDelegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
	): number

	getResults(): NSArray

	setOptions(options: number): void

	getOptions(): number

	setSearchAttributes(searchAttributes: interop.PointerConvertible): void

	getSearchAttributes(): interop.Pointer

	addAllowedUUID(allowedUUID: IOBluetoothSDPUUID): void

	addAllowedUUIDArray(allowedUUIDArray: NSArray<interop.Object> | Array<interop.Object>): void

	clearAllowedUUIDs(): void

	setTitle(windowTitle: string): void

	getTitle(): string

	setHeader(headerText: string): void

	getHeader(): string

	setDescriptionText(descriptionText: string): void

	getDescriptionText(): string

	setPrompt(prompt: string): void

	getPrompt(): string

	setCancel(prompt: string): void

	getCancel(): string
}
