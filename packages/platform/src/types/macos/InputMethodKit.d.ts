import type { NSMenu } from './AppKit'

import type { IMKTextInput } from './Carbon'

import type { CGPoint, CGRect } from './CoreFoundation'

import type {
	NSArray,
	NSAttributedString,
	NSBundle,
	NSDictionary,
	NSMutableDictionary,
	_NSRange,
} from './Foundation'

import type { interop } from './objc-runtime'

import { NSResponder } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const IMKCandidatesOpacityAttributeName: string

export declare const kIMKLocateCandidatesRightHint: number

export declare const kIMKLocateCandidatesBelowHint: number

export declare const kIMKLocateCandidatesAboveHint: number

export declare const kIMKSingleColumnScrollingCandidatePanel: number

export declare const IMKDelegateClass: string

export declare const IMKControllerClass: string

export declare const IMKModeDictionary: string

export declare const kIMKSingleRowSteppingCandidatePanel: number

export declare const kIMKAnnotation: number

export declare const kIMKMain: number

export declare const IMKCandidatesSendServerKeyEventFirst: string

export declare const kIMKCommandMenuItemName: string

export declare const kIMKSubList: number

export declare const kIMKCommandClientName: string

export declare const kIMKLocateCandidatesLeftHint: number

export declare const kIMKScrollingGridCandidatePanel: number

export declare interface IMKStateSetting {
	activateServer(sender: interop.Object): void

	deactivateServer(sender: interop.Object): void

	valueForTagClient(tag: number, sender: interop.Object): interop.Object

	setValueForTagClient(value: interop.Object, tag: number, sender: interop.Object): void

	modes(sender: interop.Object): NSDictionary

	recognizedEvents(sender: interop.Object): number

	showPreferences(sender: interop.Object): void
}

export declare class IMKStateSetting extends NativeObject implements IMKStateSetting {}

export declare interface IMKMouseHandling {
	mouseDownOnCharacterIndexCoordinateWithModifierContinueTrackingClient(
		index: number,
		point: CGPoint,
		flags: number,
		keepTracking: interop.PointerConvertible,
		sender: interop.Object,
	): boolean

	mouseUpOnCharacterIndexCoordinateWithModifierClient(
		index: number,
		point: CGPoint,
		flags: number,
		sender: interop.Object,
	): boolean

	mouseMovedOnCharacterIndexCoordinateWithModifierClient(
		index: number,
		point: CGPoint,
		flags: number,
		sender: interop.Object,
	): boolean
}

export declare class IMKMouseHandling extends NativeObject implements IMKMouseHandling {}

export declare class IMKServer extends NSObject implements IMKServerProxy {
	initWithNameBundleIdentifier(name: string, bundleIdentifier: string): this

	initWithNameControllerClassDelegateClass(
		name: string,
		controllerClassID: interop.PointerConvertible,
		delegateClassID: interop.PointerConvertible,
	): this

	bundle(): NSBundle

	paletteWillTerminate(): boolean

	lastKeyEventWasDeadKey(): boolean
}

export declare class IMKInputController
	extends NSObject
	implements IMKStateSetting, IMKMouseHandling
{
	initWithServerDelegateClient(
		server: IMKServer,
		delegate: interop.Object,
		inputClient: interop.Object,
	): this

	updateComposition(): void

	cancelComposition(): void

	compositionAttributesAtRange(range: _NSRange): NSMutableDictionary

	selectionRange(): _NSRange

	replacementRange(): _NSRange

	markForStyleAtRange(style: number, range: _NSRange): NSDictionary

	doCommandBySelectorCommandDictionary(
		aSelector: string,
		infoDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	hidePalettes(): void

	menu(): NSMenu

	delegate(): interop.Object

	setDelegate(newDelegate: interop.Object): void

	server(): IMKServer

	client(): IMKTextInput

	inputControllerWillClose(): void

	annotationSelectedForCandidate(
		annotationString: NSAttributedString,
		candidateString: NSAttributedString,
	): void

	candidateSelectionChanged(candidateString: NSAttributedString): void

	candidateSelected(candidateString: NSAttributedString): void

	activateServer(sender: interop.Object): void

	deactivateServer(sender: interop.Object): void

	valueForTagClient(tag: number, sender: interop.Object): interop.Object

	setValueForTagClient(value: interop.Object, tag: number, sender: interop.Object): void

	modes(sender: interop.Object): NSDictionary

	recognizedEvents(sender: interop.Object): number

	showPreferences(sender: interop.Object): void

	mouseDownOnCharacterIndexCoordinateWithModifierContinueTrackingClient(
		index: number,
		point: CGPoint,
		flags: number,
		keepTracking: interop.PointerConvertible,
		sender: interop.Object,
	): boolean

	mouseUpOnCharacterIndexCoordinateWithModifierClient(
		index: number,
		point: CGPoint,
		flags: number,
		sender: interop.Object,
	): boolean

	mouseMovedOnCharacterIndexCoordinateWithModifierClient(
		index: number,
		point: CGPoint,
		flags: number,
		sender: interop.Object,
	): boolean
}

export declare class IMKCandidates extends NSResponder {
	initWithServerPanelType(server: IMKServer, panelType: number): this

	initWithServerPanelTypeStyleType(server: IMKServer, panelType: number, style: number): this

	panelType(): number

	setPanelType(panelType: number): void

	show(locationHint: number): void

	hide(): void

	isVisible(): boolean

	updateCandidates(): void

	showAnnotation(annotationString: NSAttributedString): void

	showSublistSubListDelegate(
		candidates: NSArray<interop.Object> | Array<interop.Object>,
		delegate: interop.Object,
	): void

	candidateFrame(): CGRect

	setSelectionKeys(keyCodes: NSArray<interop.Object> | Array<interop.Object>): void

	selectionKeys(): NSArray

	setSelectionKeysKeylayout(layout: interop.Object): void

	selectionKeysKeylayout(): interop.Object

	setAttributes(
		attributes:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	attributes(): NSDictionary

	setDismissesAutomatically(flag: boolean): void

	dismissesAutomatically(): boolean

	selectedCandidate(): number

	setCandidateFrameTopLeft(point: CGPoint): void

	showChild(): void

	hideChild(): void

	attachChildToCandidateType(
		child: IMKCandidates,
		candidateIdentifier: number,
		theType: number,
	): void

	detachChild(candidateIdentifier: number): void

	setCandidateData(candidatesArray: NSArray<interop.Object> | Array<interop.Object>): void

	selectCandidateWithIdentifier(candidateIdentifier: number): boolean

	selectCandidate(candidateIdentifier: number): void

	showCandidates(): void

	candidateStringIdentifier(candidateString: interop.Object): number

	selectedCandidateString(): NSAttributedString

	candidateIdentifierAtLineNumber(lineNumber: number): number

	lineNumberForCandidateWithIdentifier(candidateIdentifier: number): number

	clearSelection(): void
}
