import type { NSResponder, NSTextField, NSWindow } from './AppKit'

import type { NSArray, NSDictionary, NSError } from './Foundation'

import type { SFAuthorization } from './SecurityFoundation'

import type { interop } from './objc-runtime'

import { NSPanel, NSSavePanel, NSTableCellView, NSView, NSVisualEffectView } from './AppKit'

import { NSObject } from './Runtime'

import { AuthorizationFlags } from './Security'

export declare const SFDisplayViewException: string

export declare const SFAuthorizationPluginViewUserNameKey: string

export declare const SFCertificateViewDisclosureStateDidChange: string

export declare const SFAuthorizationPluginViewUserShortNameKey: string

export declare const SFViewType: {
	IdentityAnd: 0
	SFViewTypeCredentials: 1
}

export declare const SFAuthorizationViewState: {
	Startup: 0
	ViewLocked: 1
	ViewInProgress: 2
	ViewUnlocked: 3
}

export declare const SFButtonType: {
	Cancel: 0
	OK: 1
	Back: 0
	Login: 1
}

export declare class SFKeychainSettingsPanel extends NSPanel {
	static sharedKeychainSettingsPanel(): SFKeychainSettingsPanel

	runModalForSettingsKeychain(
		settings: interop.PointerConvertible,
		keychain: interop.Object,
	): number

	beginSheetForWindowModalDelegateDidEndSelectorContextInfoSettingsKeychain(
		docWindow: NSWindow,
		delegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
		settings: interop.PointerConvertible,
		keychain: interop.Object,
	): void
}

export declare class SFChooseIdentityTableCellView extends NSTableCellView {
	issuerTextField: NSTextField
}

export declare class SFCertificatePanel extends NSPanel {
	static sharedCertificatePanel(): SFCertificatePanel

	runModalForTrustShowGroup(trust: interop.Object, showGroup: boolean): number

	runModalForCertificatesShowGroup(
		certificates: NSArray<interop.Object> | Array<interop.Object>,
		showGroup: boolean,
	): number

	beginSheetForWindowModalDelegateDidEndSelectorContextInfoTrustShowGroup(
		docWindow: NSWindow,
		delegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
		trust: interop.Object,
		showGroup: boolean,
	): void

	beginSheetForWindowModalDelegateDidEndSelectorContextInfoCertificatesShowGroup(
		docWindow: NSWindow,
		delegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
		certificates: NSArray<interop.Object> | Array<interop.Object>,
		showGroup: boolean,
	): void

	setPolicies(policies: interop.Object): void

	policies(): NSArray

	setDefaultButtonTitle(title: string): void

	setAlternateButtonTitle(title: string): void

	setShowsHelp(showsHelp: boolean): void

	showsHelp(): boolean

	setHelpAnchor(anchor: string): void

	helpAnchor(): string

	certificateView(): SFCertificateView
}

export declare class SFAuthorizationPluginView extends NSObject {
	initWithCallbacksAndEngineRef(
		callbacks: interop.PointerConvertible,
		engineRef: interop.PointerConvertible,
	): this

	engineRef(): interop.Pointer

	callbacks(): interop.Pointer

	buttonPressed(inButtonType: interop.Enum<typeof SFButtonType>): void

	lastError(): NSError

	didActivate(): void

	willActivateWithUser(
		inUserInformation:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	didDeactivate(): void

	firstKeyView(): NSView

	firstResponder(): NSResponder

	lastKeyView(): NSView

	setEnabled(inEnabled: boolean): void

	viewForType(inType: interop.Enum<typeof SFViewType>): NSView

	displayView(): void

	setButtonEnabled(inButtonType: interop.Enum<typeof SFButtonType>, inEnabled: boolean): void

	updateView(): void
}

export declare class SFAuthorizationView extends NSView {
	setString(authorizationString: string): void

	setAuthorizationRights(authorizationRights: interop.PointerConvertible): void

	authorizationRights(): interop.Pointer

	authorization(): SFAuthorization

	updateStatus(inSender: interop.Object): boolean

	setAutoupdate(autoupdate: boolean): void

	setAutoupdateInterval(autoupdate: boolean, interval: number): void

	authorizationState(): interop.Enum<typeof SFAuthorizationViewState>

	setEnabled(enabled: boolean): void

	isEnabled(): boolean

	setFlags(flags: interop.Enum<typeof AuthorizationFlags>): void

	setDelegate(delegate: interop.Object): void

	delegate(): interop.Object

	authorize(inSender: interop.Object): boolean

	deauthorize(inSender: interop.Object): boolean
}

export declare class SFCertificateView extends NSVisualEffectView {
	setCertificate(certificate: interop.Object): void

	certificate(): interop.Object

	setPolicies(policies: interop.Object): void

	policies(): NSArray

	setEditableTrust(editable: boolean): void

	isEditable(): boolean

	setDisplayTrust(display: boolean): void

	isTrustDisplayed(): boolean

	saveTrustSettings(): void

	setDisplayDetails(display: boolean): void

	detailsDisplayed(): boolean

	setDetailsDisclosed(disclosed: boolean): void

	detailsDisclosed(): boolean

	setPoliciesDisclosed(disclosed: boolean): void

	policiesDisclosed(): boolean
}

export declare class SFCertificateTrustPanel extends SFCertificatePanel {
	static sharedCertificateTrustPanel(): SFCertificateTrustPanel

	runModalForTrustMessage(trust: interop.Object, message: string): number

	beginSheetForWindowModalDelegateDidEndSelectorContextInfoTrustMessage(
		docWindow: NSWindow,
		delegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
		trust: interop.Object,
		message: string,
	): void

	setInformativeText(informativeText: string): void

	informativeText(): string
}

export declare class SFKeychainSavePanel extends NSSavePanel {
	static sharedKeychainSavePanel(): SFKeychainSavePanel

	runModalForDirectoryFile(path: string | null, name: string | null): number
	runModalForDirectoryFile(path: string, name: string): number

	setPassword(password: string): void

	keychain(): interop.Object

	error(): NSError

	beginSheetForDirectoryFileModalForWindowModalDelegateDidEndSelectorContextInfo(
		path: string | null,
		name: string | null,
		docWindow: NSWindow | null,
		delegate: interop.Object | null,
		didEndSelector: string | null,
		contextInfo: interop.PointerConvertible,
	): void
	beginSheetForDirectoryFileModalForWindowModalDelegateDidEndSelectorContextInfo(
		path: string,
		name: string,
		docWindow: NSWindow,
		delegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
	): void
}

export declare class SFChooseIdentityPanel extends NSPanel {
	static sharedChooseIdentityPanel(): SFChooseIdentityPanel

	runModalForIdentitiesMessage(
		identities: NSArray<interop.Object> | Array<interop.Object>,
		message: string,
	): number

	beginSheetForWindowModalDelegateDidEndSelectorContextInfoIdentitiesMessage(
		docWindow: NSWindow,
		delegate: interop.Object,
		didEndSelector: string,
		contextInfo: interop.PointerConvertible,
		identities: NSArray<interop.Object> | Array<interop.Object>,
		message: string,
	): void

	identity(): interop.Object

	setPolicies(policies: interop.Object): void

	policies(): NSArray

	setDefaultButtonTitle(title: string): void

	setAlternateButtonTitle(title: string): void

	setShowsHelp(showsHelp: boolean): void

	showsHelp(): boolean

	setHelpAnchor(anchor: string): void

	helpAnchor(): string

	setInformativeText(informativeText: string): void

	informativeText(): string

	setDomain(domainString: string): void

	domain(): string
}
