/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./AppKit.d.ts" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./Foundation.d.ts" />

declare const ASAuthorizationErrorDomain: string;

declare const ASAuthorizationAppleIDProviderCredentialRevokedNotification: string;

declare const ASAuthorizationOperationLogout: string;

declare const ASAuthorizationOperationRefresh: string;

declare const ASAuthorizationScopeEmail: string;

declare const ASAuthorizationScopeFullName: string;

declare const ASWebAuthenticationSessionErrorDomain: string;

declare const ASAuthorizationProviderAuthorizationOperationConfigurationRemoved: string;

declare const ASAuthorizationOperationImplicit: string;

declare const ASExtensionErrorDomain: string;

declare const ASAuthorizationOperationLogin: string;

declare const ASCredentialIdentityStoreErrorDomain: string;

declare const ASAuthorizationProviderExtensionRequestOptions: {
  None: 0,
  UserInteractionEnabled: 1,
  RegistrationRepair: 2,
};

declare const ASAuthorizationAppleIDButtonStyle: {
  White: 0,
  WhiteOutline: 1,
  Black: 2,
};

declare const ASAuthorizationWebBrowserPublicKeyCredentialManagerAuthorizationState: {
  Authorized: 0,
  Denied: 1,
  NotDetermined: 2,
};

declare const ASAuthorizationError: {
  Unknown: 1000,
  Canceled: 1001,
  InvalidResponse: 1002,
  NotHandled: 1003,
  Failed: 1004,
};

declare const ASCredentialServiceIdentifierType: {
  Domain: 0,
  URL: 1,
};

declare const ASWebAuthenticationSessionErrorCode: {
  CanceledLogin: 1,
  PresentationContextNotProvided: 2,
  PresentationContextInvalid: 3,
};

declare const ASUserDetectionStatus: {
  Unsupported: 0,
  Unknown: 1,
  LikelyReal: 2,
};

declare const ASExtensionErrorCode: {
  Failed: 0,
  UserCanceled: 1,
  UserInteractionRequired: 100,
  CredentialIdentityNotFound: 101,
};

declare const ASAuthorizationAppleIDProviderCredentialState: {
  Revoked: 0,
  Authorized: 1,
  NotFound: 2,
  Transferred: 3,
};

declare const ASAuthorizationProviderExtensionFederationType: {
  None: 0,
  WSTrust: 1,
  DynamicWSTrust: 2,
};

declare const ASAuthorizationAppleIDButtonType: {
  SignIn: 0,
  Continue: 1,
  SignUp: 2,
  Default: 0,
};

declare const ASAuthorizationProviderExtensionUserSecureEnclaveKeyBiometricPolicy: {
  None: 0,
  TouchIDOrWatchCurrentSet: 1,
  TouchIDOrWatchAny: 2,
  ReuseDuringUnlock: 4,
  PasswordFallback: 8,
};

declare const ASPublicKeyCredentialClientDataCrossOriginValue: {
  NotSet: 0,
  CrossOrigin: 1,
  SameOriginWithAncestors: 2,
};

declare const ASAuthorizationPublicKeyCredentialAttachment: {
  ASAuthorizationPublicKeyCredentialAttachmentPlatform: 0,
  Cross: 1,
};

declare const ASCredentialIdentityStoreErrorCode: {
  InternalError: 0,
  StoreDisabled: 1,
  StoreBusy: 2,
};

declare interface ASCredentialIdentity extends NSObjectProtocol {
}

declare class ASCredentialIdentity extends NativeObject implements ASCredentialIdentity {
}

declare interface ASWebAuthenticationSessionRequestDelegate extends NSObjectProtocol {
  authenticationSessionRequestDidCompleteWithCallbackURL?(authenticationSessionRequest: ASWebAuthenticationSessionRequest, callbackURL: NSURL): void;

  authenticationSessionRequestDidCancelWithError?(authenticationSessionRequest: ASWebAuthenticationSessionRequest, error: NSError): void;
}

declare class ASWebAuthenticationSessionRequestDelegate extends NativeObject implements ASWebAuthenticationSessionRequestDelegate {
}

declare interface ASAuthorizationProviderExtensionAuthorizationRequestHandler extends NSObjectProtocol {
  beginAuthorizationWithRequest(request: ASAuthorizationProviderExtensionAuthorizationRequest): void;

  cancelAuthorizationWithRequest?(request: ASAuthorizationProviderExtensionAuthorizationRequest): void;
}

declare class ASAuthorizationProviderExtensionAuthorizationRequestHandler extends NativeObject implements ASAuthorizationProviderExtensionAuthorizationRequestHandler {
}

declare interface ASAuthorizationProvider extends NSObjectProtocol {
}

declare class ASAuthorizationProvider extends NativeObject implements ASAuthorizationProvider {
}

declare interface ASAuthorizationControllerPresentationContextProviding extends NSObjectProtocol {
  presentationAnchorForAuthorizationController(controller: ASAuthorizationController): NSWindow;
}

declare class ASAuthorizationControllerPresentationContextProviding extends NativeObject implements ASAuthorizationControllerPresentationContextProviding {
}

declare interface ASWebAuthenticationSessionWebBrowserSessionHandling {
  beginHandlingWebAuthenticationSessionRequest(request: ASWebAuthenticationSessionRequest): void;

  cancelWebAuthenticationSessionRequest(request: ASWebAuthenticationSessionRequest): void;
}

declare class ASWebAuthenticationSessionWebBrowserSessionHandling extends NativeObject implements ASWebAuthenticationSessionWebBrowserSessionHandling {
}

declare interface ASAuthorizationControllerDelegate extends NSObjectProtocol {
  authorizationControllerDidCompleteWithAuthorization?(controller: ASAuthorizationController, authorization: ASAuthorization): void;

  authorizationControllerDidCompleteWithError?(controller: ASAuthorizationController, error: NSError): void;
}

declare class ASAuthorizationControllerDelegate extends NativeObject implements ASAuthorizationControllerDelegate {
}

declare interface ASAuthorizationCredential extends NSObjectProtocol, NSCopying, NSSecureCoding {
}

declare class ASAuthorizationCredential extends NativeObject implements ASAuthorizationCredential {
}

declare interface ASWebAuthenticationPresentationContextProviding extends NSObjectProtocol {
  presentationAnchorForWebAuthenticationSession(session: ASWebAuthenticationSession): NSWindow;
}

declare class ASWebAuthenticationPresentationContextProviding extends NativeObject implements ASWebAuthenticationPresentationContextProviding {
}

declare class ASAuthorizationAppleIDButton extends NSControl implements NSAccessibilityButton {
  static buttonWithTypeStyle<This extends abstract new (...args: any) => any>(this: This, type: interop.Enum<typeof ASAuthorizationAppleIDButtonType>, style: interop.Enum<typeof ASAuthorizationAppleIDButtonStyle>): InstanceType<This>;

  initWithAuthorizationButtonTypeAuthorizationButtonStyle(type: interop.Enum<typeof ASAuthorizationAppleIDButtonType>, style: interop.Enum<typeof ASAuthorizationAppleIDButtonStyle>): this;

  cornerRadius: number;

  accessibilityLabel: string;

  accessibilityPerformPress(): boolean;

  accessibilityFrame: CGRect;

  accessibilityParent: interop.Object;

  isAccessibilityFocused(): boolean;

  accessibilityIdentifier: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

// @ts-ignore ClassDecl.tsIgnore
declare class ASCredentialProviderViewController extends NSViewController {
  // @ts-ignore MemberDecl.tsIgnore
  readonly extensionContext: ASCredentialProviderExtensionContext;

  prepareCredentialListForServiceIdentifiers(serviceIdentifiers: NSArray<interop.Object> | Array<interop.Object>): void;

  provideCredentialWithoutUserInteractionForIdentity(credentialIdentity: ASPasswordCredentialIdentity): void;

  prepareInterfaceToProvideCredentialForIdentity(credentialIdentity: ASPasswordCredentialIdentity): void;

  prepareInterfaceForExtensionConfiguration(): void;

  reportPublicKeyCredentialUpdateForRelyingPartyUserHandleNewName(relyingParty: string, userHandle: NSData, newName: string): void;

  reportUnknownPublicKeyCredentialForRelyingPartyCredentialID(relyingParty: string, credentialID: NSData): void;

  reportAllAcceptedPublicKeyCredentialsForRelyingPartyUserHandleAcceptedCredentialIDs(relyingParty: string, userHandle: NSData, acceptedCredentialIDs: NSArray<interop.Object> | Array<interop.Object>): void;

  reportUnusedPasswordCredentialForDomainUserName(domain: string, userName: string): void;
}

declare class ASAuthorizationAppleIDCredential extends NSObject implements ASAuthorizationCredential {
  readonly user: string;

  readonly state: string;

  readonly authorizedScopes: NSArray;

  readonly authorizationCode: NSData;

  readonly identityToken: NSData;

  readonly email: string;

  readonly fullName: NSPersonNameComponents;

  readonly realUserStatus: interop.Enum<typeof ASUserDetectionStatus>;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class ASPasswordCredentialIdentity extends NSObject implements NSCopying, NSSecureCoding, ASCredentialIdentity {
  initWithServiceIdentifierUserRecordIdentifier(serviceIdentifier: ASCredentialServiceIdentifier, user: string, recordIdentifier: string | null): this;

  static identityWithServiceIdentifierUserRecordIdentifier<This extends abstract new (...args: any) => any>(this: This, serviceIdentifier: ASCredentialServiceIdentifier, user: string, recordIdentifier: string | null): InstanceType<This>;

  readonly serviceIdentifier: ASCredentialServiceIdentifier;

  readonly user: string;

  readonly recordIdentifier: string;

  rank: number;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class ASPasswordCredential extends NSObject implements ASAuthorizationCredential {
  initWithUserPassword(user: string, password: string): this;

  static credentialWithUserPassword<This extends abstract new (...args: any) => any>(this: This, user: string, password: string): InstanceType<This>;

  readonly user: string;

  readonly password: string;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class ASCredentialServiceIdentifier extends NSObject implements NSCopying, NSSecureCoding {
  initWithIdentifierType(identifier: string, type: interop.Enum<typeof ASCredentialServiceIdentifierType>): this;

  readonly identifier: string;

  readonly type: interop.Enum<typeof ASCredentialServiceIdentifierType>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class ASCredentialIdentityStore extends NSObject {
  static readonly sharedStore: ASCredentialIdentityStore;

  getCredentialIdentityStoreStateWithCompletion(completion: (p1: ASCredentialIdentityStoreState) => void): void;

  saveCredentialIdentitiesCompletion(credentialIdentities: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: boolean, p2: NSError) => void | null): void;

  removeCredentialIdentitiesCompletion(credentialIdentities: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: boolean, p2: NSError) => void | null): void;

  removeAllCredentialIdentitiesWithCompletion(completion: (p1: boolean, p2: NSError) => void | null): void;

  replaceCredentialIdentitiesWithIdentitiesCompletion(newCredentialIdentities: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: boolean, p2: NSError) => void | null): void;
}

declare class ASAuthorizationSingleSignOnCredential extends NSObject implements ASAuthorizationCredential {
  readonly state: string;

  readonly accessToken: NSData;

  readonly identityToken: NSData;

  readonly authorizedScopes: NSArray;

  readonly authenticatedResponse: NSHTTPURLResponse;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class ASAuthorizationPasswordProvider extends NSObject implements ASAuthorizationProvider {
  createRequest(): ASAuthorizationPasswordRequest;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class ASAuthorizationOpenIDRequest extends ASAuthorizationRequest {
  get requestedScopes(): NSArray;
  set requestedScopes(value: NSArray<interop.Object> | Array<interop.Object>);

  state: string;

  nonce: string;

  requestedOperation: string;
}

declare class ASAuthorization extends NSObject {
  readonly provider: ASAuthorizationProvider;

  readonly credential: ASAuthorizationCredential;
}

declare class ASAuthorizationAppleIDProvider extends NSObject implements ASAuthorizationProvider {
  createRequest(): ASAuthorizationAppleIDRequest;

  getCredentialStateForUserIDCompletion(userID: string, completion: (p1: interop.Enum<typeof ASAuthorizationAppleIDProviderCredentialState>, p2: NSError) => void | null): void;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class ASAuthorizationController extends NSObject {
  readonly authorizationRequests: NSArray;

  delegate: ASAuthorizationControllerDelegate;

  presentationContextProvider: ASAuthorizationControllerPresentationContextProviding;

  initWithAuthorizationRequests(authorizationRequests: NSArray<interop.Object> | Array<interop.Object>): this;

  performRequests(): void;
}

declare class ASAuthorizationRequest extends NSObject implements NSCopying, NSSecureCoding {
  readonly provider: ASAuthorizationProvider;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class ASAuthorizationPasswordRequest extends ASAuthorizationRequest {
}

declare class ASAuthorizationSingleSignOnProvider extends NSObject implements ASAuthorizationProvider {
  static authorizationProviderWithIdentityProviderURL<This extends abstract new (...args: any) => any>(this: This, url: NSURL): InstanceType<This>;

  createRequest(): ASAuthorizationSingleSignOnRequest;

  readonly url: NSURL;

  readonly canPerformAuthorization: boolean;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;
}

declare class ASAuthorizationProviderExtensionAuthorizationRequest extends NSObject {
  doNotHandle(): void;

  cancel(): void;

  complete(): void;

  completeWithHTTPAuthorizationHeaders(httpAuthorizationHeaders: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  completeWithHTTPResponseHttpBody(httpResponse: NSHTTPURLResponse, httpBody: NSData | null): void;

  completeWithError(error: NSError): void;

  presentAuthorizationViewControllerWithCompletion(completion: (p1: boolean, p2: NSError) => void | null): void;

  readonly url: NSURL;

  readonly requestedOperation: string;

  readonly httpHeaders: NSDictionary;

  readonly httpBody: NSData;

  readonly realm: string;

  readonly extensionData: NSDictionary;

  readonly callerBundleIdentifier: string;

  readonly authorizationOptions: NSDictionary;

  readonly callerManaged: boolean;

  readonly callerTeamIdentifier: string;

  readonly localizedCallerDisplayName: string;

  isCallerManaged(): boolean;
}

declare class ASWebAuthenticationSessionRequest extends NSObject implements NSSecureCoding, NSCopying {
  readonly UUID: NSUUID;

  readonly URL: NSURL;

  readonly callbackURLScheme: string;

  readonly shouldUseEphemeralSession: boolean;

  delegate: ASWebAuthenticationSessionRequestDelegate;

  cancelWithError(error: NSError): void;

  completeWithCallbackURL(url: NSURL): void;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

declare class ASCredentialIdentityStoreState extends NSObject {
  readonly enabled: boolean;

  readonly supportsIncrementalUpdates: boolean;

  isEnabled(): boolean;
}

declare class ASWebAuthenticationSession extends NSObject {
  initWithURLCallbackURLSchemeCompletionHandler(URL: NSURL, callbackURLScheme: string | null, completionHandler: (p1: NSURL, p2: NSError) => void): this;

  presentationContextProvider: ASWebAuthenticationPresentationContextProviding | null;

  prefersEphemeralWebBrowserSession: boolean;

  readonly canStart: boolean;

  start(): boolean;

  cancel(): void;
}

declare class ASAuthorizationAppleIDRequest extends ASAuthorizationOpenIDRequest {
  user: string;
}

declare class ASWebAuthenticationSessionWebBrowserSessionManager extends NSObject {
  static readonly sharedManager: ASWebAuthenticationSessionWebBrowserSessionManager;

  sessionHandler: ASWebAuthenticationSessionWebBrowserSessionHandling;

  readonly wasLaunchedByAuthenticationServices: boolean;
}

declare class ASCredentialProviderExtensionContext extends NSExtensionContext {
  completeRequestWithSelectedCredentialCompletionHandler(credential: ASPasswordCredential, completionHandler: (p1: boolean) => void | null): void;

  completeExtensionConfigurationRequest(): void;

  cancelRequestWithError(error: NSError): void;
}

declare class ASAuthorizationSingleSignOnRequest extends ASAuthorizationOpenIDRequest {
  get authorizationOptions(): NSArray;
  set authorizationOptions(value: NSArray<interop.Object> | Array<interop.Object>);
}

