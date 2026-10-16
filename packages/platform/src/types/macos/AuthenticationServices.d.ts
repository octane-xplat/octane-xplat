import type { NSAccessibilityButton, NSWindow } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSData,
	NSDictionary,
	NSError,
	NSHTTPURLResponse,
	NSPersonNameComponents,
	NSSecureCoding,
	NSURL,
	NSUUID,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSControl, NSViewController } from './AppKit'

import { NSExtensionContext } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const ASAuthorizationErrorDomain: string

export declare const ASAuthorizationAppleIDProviderCredentialRevokedNotification: string

export declare const ASAuthorizationOperationLogout: string

export declare const ASAuthorizationOperationRefresh: string

export declare const ASAuthorizationScopeEmail: string

export declare const ASAuthorizationScopeFullName: string

export declare const ASWebAuthenticationSessionErrorDomain: string

export declare const ASAuthorizationProviderAuthorizationOperationConfigurationRemoved: string

export declare const ASAuthorizationOperationImplicit: string

export declare const ASExtensionErrorDomain: string

export declare const ASAuthorizationOperationLogin: string

export declare const ASCredentialIdentityStoreErrorDomain: string

export declare const ASAuthorizationProviderExtensionRequestOptions: {
	None: 0
	UserInteractionEnabled: 1
	RegistrationRepair: 2
}

export declare const ASAuthorizationAppleIDButtonStyle: {
	White: 0
	WhiteOutline: 1
	Black: 2
}

export declare const ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState: {
	Authorized: 0
	Denied: 1
	NotDetermined: 2
}

export declare const ASAuthorizationError: {
	Unknown: 1000
	Canceled: 1001
	InvalidResponse: 1002
	NotHandled: 1003
	Failed: 1004
}

export declare const ASCredentialServiceIdentifierType: {
	Domain: 0
	URL: 1
}

export declare const ASWebAuthenticationSessionErrorCode: {
	CanceledLogin: 1
	PresentationContextNotProvided: 2
	PresentationContextInvalid: 3
}

export declare const ASUserDetectionStatus: {
	Unsupported: 0
	Unknown: 1
	LikelyReal: 2
}

export declare const ASExtensionErrorCode: {
	Failed: 0
	UserCanceled: 1
	UserInteractionRequired: 100
	CredentialIdentityNotFound: 101
}

export declare const ASAuthorizationAppleIDProviderCredentialState: {
	Revoked: 0
	Authorized: 1
	NotFound: 2
	Transferred: 3
}

export declare const ASAuthorizationProviderExtensionFederationType: {
	None: 0
	WSTrust: 1
	DynamicWSTrust: 2
}

export declare const ASAuthorizationAppleIDButtonType: {
	SignIn: 0
	Continue: 1
	SignUp: 2
	Default: 0
}

export declare const ASAuthorizationProviderExtensionUserSecureEnclaveKeyBiometricPolicy: {
	None: 0
	TouchIDOrWatchCurrentSet: 1
	TouchIDOrWatchAny: 2
	ReuseDuringUnlock: 4
	PasswordFallback: 8
}

export declare const ASPublicKeyCredentialClientDataCrossOriginValue: {
	NotSet: 0
	CrossOrigin: 1
	SameOriginWithAncestors: 2
}

export declare const ASAuthorizationPublicKeyCredentialAttachment: {
	ASAuthorizationPublicKeyCredentialAttachmentPlatform: 0
	Cross: 1
}

export declare const ASCredentialIdentityStoreErrorCode: {
	InternalError: 0
	StoreDisabled: 1
	StoreBusy: 2
}

export declare interface ASCredentialIdentity extends NSObjectProtocol {}

export declare class ASCredentialIdentity extends NativeObject implements ASCredentialIdentity {}

export declare interface ASWebAuthenticationSessionRequestDelegate extends NSObjectProtocol {
	authenticationSessionRequestDidCompleteWithCallbackURL?(
		authenticationSessionRequest: ASWebAuthenticationSessionRequest,
		callbackURL: NSURL,
	): void

	authenticationSessionRequestDidCancelWithError?(
		authenticationSessionRequest: ASWebAuthenticationSessionRequest,
		error: NSError,
	): void
}

export declare class ASWebAuthenticationSessionRequestDelegate
	extends NativeObject
	implements ASWebAuthenticationSessionRequestDelegate {}

export declare interface ASAuthorizationProviderExtensionAuthorizationRequestHandler extends NSObjectProtocol {
	beginAuthorizationWithRequest(request: ASAuthorizationProviderExtensionAuthorizationRequest): void

	cancelAuthorizationWithRequest?(
		request: ASAuthorizationProviderExtensionAuthorizationRequest,
	): void
}

export declare class ASAuthorizationProviderExtensionAuthorizationRequestHandler
	extends NativeObject
	implements ASAuthorizationProviderExtensionAuthorizationRequestHandler {}

export declare interface ASAuthorizationProvider extends NSObjectProtocol {}

export declare class ASAuthorizationProvider
	extends NativeObject
	implements ASAuthorizationProvider {}

export declare interface ASAuthorizationControllerPresentationContextProviding extends NSObjectProtocol {
	presentationAnchorForAuthorizationController(controller: ASAuthorizationController): NSWindow
}

export declare class ASAuthorizationControllerPresentationContextProviding
	extends NativeObject
	implements ASAuthorizationControllerPresentationContextProviding {}

export declare interface ASWebAuthenticationSessionWebBrowserSessionHandling {
	beginHandlingWebAuthenticationSessionRequest(request: ASWebAuthenticationSessionRequest): void

	cancelWebAuthenticationSessionRequest(request: ASWebAuthenticationSessionRequest): void
}

export declare class ASWebAuthenticationSessionWebBrowserSessionHandling
	extends NativeObject
	implements ASWebAuthenticationSessionWebBrowserSessionHandling {}

export declare interface ASAuthorizationControllerDelegate extends NSObjectProtocol {
	authorizationControllerDidCompleteWithAuthorization?(
		controller: ASAuthorizationController,
		authorization: ASAuthorization,
	): void

	authorizationControllerDidCompleteWithError?(
		controller: ASAuthorizationController,
		error: NSError,
	): void
}

export declare class ASAuthorizationControllerDelegate
	extends NativeObject
	implements ASAuthorizationControllerDelegate {}

export declare interface ASAuthorizationCredential
	extends NSObjectProtocol, NSCopying, NSSecureCoding {}

export declare class ASAuthorizationCredential
	extends NativeObject
	implements ASAuthorizationCredential {}

export declare interface ASWebAuthenticationPresentationContextProviding extends NSObjectProtocol {
	presentationAnchorForWebAuthenticationSession(session: ASWebAuthenticationSession): NSWindow
}

export declare class ASWebAuthenticationPresentationContextProviding
	extends NativeObject
	implements ASWebAuthenticationPresentationContextProviding {}

export declare class ASAuthorizationAppleIDButton
	extends NSControl
	implements NSAccessibilityButton
{
	static buttonWithTypeStyle<This extends abstract new (...args: any) => any>(
		this: This,
		type: interop.Enum<typeof ASAuthorizationAppleIDButtonType>,
		style: interop.Enum<typeof ASAuthorizationAppleIDButtonStyle>,
	): InstanceType<This>

	initWithAuthorizationButtonTypeAuthorizationButtonStyle(
		type: interop.Enum<typeof ASAuthorizationAppleIDButtonType>,
		style: interop.Enum<typeof ASAuthorizationAppleIDButtonStyle>,
	): this

	cornerRadius: number

	accessibilityLabel: string

	accessibilityPerformPress(): boolean

	accessibilityFrame: CGRect

	accessibilityParent: interop.Object

	isAccessibilityFocused(): boolean

	accessibilityIdentifier: string

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class ASCredentialProviderViewController extends NSViewController {
	// @ts-ignore MemberDecl.tsIgnore
	readonly extensionContext: ASCredentialProviderExtensionContext

	prepareCredentialListForServiceIdentifiers(
		serviceIdentifiers: NSArray<interop.Object> | Array<interop.Object>,
	): void

	provideCredentialWithoutUserInteractionForIdentity(
		credentialIdentity: ASPasswordCredentialIdentity,
	): void

	prepareInterfaceToProvideCredentialForIdentity(
		credentialIdentity: ASPasswordCredentialIdentity,
	): void

	prepareInterfaceForExtensionConfiguration(): void

	reportPublicKeyCredentialUpdateForRelyingPartyUserHandleNewName(
		relyingParty: string,
		userHandle: NSData,
		newName: string,
	): void

	reportUnknownPublicKeyCredentialForRelyingPartyCredentialID(
		relyingParty: string,
		credentialID: NSData,
	): void

	reportAllAcceptedPublicKeyCredentialsForRelyingPartyUserHandleAcceptedCredentialIDs(
		relyingParty: string,
		userHandle: NSData,
		acceptedCredentialIDs: NSArray<interop.Object> | Array<interop.Object>,
	): void

	reportUnusedPasswordCredentialForDomainUserName(domain: string, userName: string): void
}

export declare class ASAuthorizationAppleIDCredential
	extends NSObject
	implements ASAuthorizationCredential
{
	readonly user: string

	readonly state: string

	readonly authorizedScopes: NSArray

	readonly authorizationCode: NSData

	readonly identityToken: NSData

	readonly email: string

	readonly fullName: NSPersonNameComponents

	readonly realUserStatus: interop.Enum<typeof ASUserDetectionStatus>

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class ASPasswordCredentialIdentity
	extends NSObject
	implements NSCopying, NSSecureCoding, ASCredentialIdentity
{
	initWithServiceIdentifierUserRecordIdentifier(
		serviceIdentifier: ASCredentialServiceIdentifier,
		user: string,
		recordIdentifier: string | null,
	): this

	static identityWithServiceIdentifierUserRecordIdentifier<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		serviceIdentifier: ASCredentialServiceIdentifier,
		user: string,
		recordIdentifier: string | null,
	): InstanceType<This>

	readonly serviceIdentifier: ASCredentialServiceIdentifier

	readonly user: string

	readonly recordIdentifier: string

	rank: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class ASPasswordCredential extends NSObject implements ASAuthorizationCredential {
	initWithUserPassword(user: string, password: string): this

	static credentialWithUserPassword<This extends abstract new (...args: any) => any>(
		this: This,
		user: string,
		password: string,
	): InstanceType<This>

	readonly user: string

	readonly password: string

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class ASCredentialServiceIdentifier
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	initWithIdentifierType(
		identifier: string,
		type: interop.Enum<typeof ASCredentialServiceIdentifierType>,
	): this

	readonly identifier: string

	readonly type: interop.Enum<typeof ASCredentialServiceIdentifierType>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class ASCredentialIdentityStore extends NSObject {
	static readonly sharedStore: ASCredentialIdentityStore

	getCredentialIdentityStoreStateWithCompletion(
		completion: (p1: ASCredentialIdentityStoreState) => void,
	): void

	saveCredentialIdentitiesCompletion(
		credentialIdentities: NSArray<interop.Object> | Array<interop.Object>,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	removeCredentialIdentitiesCompletion(
		credentialIdentities: NSArray<interop.Object> | Array<interop.Object>,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	removeAllCredentialIdentitiesWithCompletion(
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	replaceCredentialIdentitiesWithIdentitiesCompletion(
		newCredentialIdentities: NSArray<interop.Object> | Array<interop.Object>,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void
}

export declare class ASAuthorizationSingleSignOnCredential
	extends NSObject
	implements ASAuthorizationCredential
{
	readonly state: string

	readonly accessToken: NSData

	readonly identityToken: NSData

	readonly authorizedScopes: NSArray

	readonly authenticatedResponse: NSHTTPURLResponse

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class ASAuthorizationPasswordProvider
	extends NSObject
	implements ASAuthorizationProvider
{
	createRequest(): ASAuthorizationPasswordRequest

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class ASAuthorizationOpenIDRequest extends ASAuthorizationRequest {
	get requestedScopes(): NSArray
	set requestedScopes(value: NSArray<interop.Object> | Array<interop.Object>)

	state: string

	nonce: string

	requestedOperation: string
}

export declare class ASAuthorization extends NSObject {
	readonly provider: ASAuthorizationProvider

	readonly credential: ASAuthorizationCredential
}

export declare class ASAuthorizationAppleIDProvider
	extends NSObject
	implements ASAuthorizationProvider
{
	createRequest(): ASAuthorizationAppleIDRequest

	getCredentialStateForUserIDCompletion(
		userID: string,
		completion: (
			p1: interop.Enum<typeof ASAuthorizationAppleIDProviderCredentialState>,
			p2: NSError,
		) => void | null,
	): void

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class ASAuthorizationController extends NSObject {
	readonly authorizationRequests: NSArray

	delegate: ASAuthorizationControllerDelegate

	presentationContextProvider: ASAuthorizationControllerPresentationContextProviding

	initWithAuthorizationRequests(
		authorizationRequests: NSArray<interop.Object> | Array<interop.Object>,
	): this

	performRequests(): void
}

export declare class ASAuthorizationRequest extends NSObject implements NSCopying, NSSecureCoding {
	readonly provider: ASAuthorizationProvider

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class ASAuthorizationPasswordRequest extends ASAuthorizationRequest {}

export declare class ASAuthorizationSingleSignOnProvider
	extends NSObject
	implements ASAuthorizationProvider
{
	static authorizationProviderWithIdentityProviderURL<
		This extends abstract new (...args: any) => any,
	>(this: This, url: NSURL): InstanceType<This>

	createRequest(): ASAuthorizationSingleSignOnRequest

	readonly url: NSURL

	readonly canPerformAuthorization: boolean

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class ASAuthorizationProviderExtensionAuthorizationRequest extends NSObject {
	doNotHandle(): void

	cancel(): void

	complete(): void

	completeWithHTTPAuthorizationHeaders(
		httpAuthorizationHeaders:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
	): void

	completeWithHTTPResponseHttpBody(httpResponse: NSHTTPURLResponse, httpBody: NSData | null): void

	completeWithError(error: NSError): void

	presentAuthorizationViewControllerWithCompletion(
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	readonly url: NSURL

	readonly requestedOperation: string

	readonly httpHeaders: NSDictionary

	readonly httpBody: NSData

	readonly realm: string

	readonly extensionData: NSDictionary

	readonly callerBundleIdentifier: string

	readonly authorizationOptions: NSDictionary

	readonly callerManaged: boolean

	readonly callerTeamIdentifier: string

	readonly localizedCallerDisplayName: string

	isCallerManaged(): boolean
}

export declare class ASWebAuthenticationSessionRequest
	extends NSObject
	implements NSSecureCoding, NSCopying
{
	readonly UUID: NSUUID

	readonly URL: NSURL

	readonly callbackURLScheme: string

	readonly shouldUseEphemeralSession: boolean

	delegate: ASWebAuthenticationSessionRequestDelegate

	cancelWithError(error: NSError): void

	completeWithCallbackURL(url: NSURL): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class ASCredentialIdentityStoreState extends NSObject {
	readonly enabled: boolean

	readonly supportsIncrementalUpdates: boolean

	isEnabled(): boolean
}

export declare class ASWebAuthenticationSession extends NSObject {
	initWithURLCallbackURLSchemeCompletionHandler(
		URL: NSURL,
		callbackURLScheme: string | null,
		completionHandler: (p1: NSURL, p2: NSError) => void,
	): this

	presentationContextProvider: ASWebAuthenticationPresentationContextProviding | null

	prefersEphemeralWebBrowserSession: boolean

	readonly canStart: boolean

	start(): boolean

	cancel(): void
}

export declare class ASAuthorizationAppleIDRequest extends ASAuthorizationOpenIDRequest {
	user: string
}

export declare class ASWebAuthenticationSessionWebBrowserSessionManager extends NSObject {
	static readonly sharedManager: ASWebAuthenticationSessionWebBrowserSessionManager

	sessionHandler: ASWebAuthenticationSessionWebBrowserSessionHandling

	readonly wasLaunchedByAuthenticationServices: boolean
}

export declare class ASCredentialProviderExtensionContext extends NSExtensionContext {
	completeRequestWithSelectedCredentialCompletionHandler(
		credential: ASPasswordCredential,
		completionHandler: (p1: boolean) => void | null,
	): void

	completeExtensionConfigurationRequest(): void

	cancelRequestWithError(error: NSError): void
}

export declare class ASAuthorizationSingleSignOnRequest extends ASAuthorizationOpenIDRequest {
	get authorizationOptions(): NSArray
	set authorizationOptions(value: NSArray<interop.Object> | Array<interop.Object>)
}
