/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const VSErrorInfoKeyUnsupportedProviderIdentifier: string;

declare const VSErrorInfoKeySAMLResponseStatus: string;

declare const VSErrorInfoKeySAMLResponse: string;

declare const VSCheckAccessOptionPrompt: string;

declare const VSAccountProviderAuthenticationSchemeSAML: string;

declare const VSErrorDomain: string;

declare const VSErrorInfoKeyAccountProviderResponse: string;

declare const VSAccountProviderAuthenticationSchemeAPI: string;

declare const VSErrorCode: {
  AccessNotGranted: 0,
  UnsupportedProvider: 1,
  UserCancelled: 2,
  ServiceTemporarilyUnavailable: 3,
  ProviderRejected: 4,
  InvalidVerificationToken: 5,
  Rejected: 6,
  Unsupported: 7,
};

declare const VSSubscriptionAccessLevel: {
  Unknown: 0,
  FreeWithAccount: 1,
  Paid: 2,
};

declare const VSAccountAccessStatus: {
  NotDetermined: 0,
  Restricted: 1,
  Denied: 2,
  Granted: 3,
};

declare interface VSAccountManagerDelegate extends NSObjectProtocol {
  accountManagerShouldAuthenticateAccountProviderWithIdentifier?(accountManager: VSAccountManager, accountProviderIdentifier: string): boolean;
}

declare class VSAccountManagerDelegate extends NativeObject implements VSAccountManagerDelegate {
}

declare class VSAccountMetadataRequest extends NSObject {
  channelIdentifier: string;

  get supportedAccountProviderIdentifiers(): NSArray;
  set supportedAccountProviderIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>);

  get featuredAccountProviderIdentifiers(): NSArray;
  set featuredAccountProviderIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>);

  verificationToken: string;

  includeAccountProviderIdentifier: boolean;

  includeAuthenticationExpirationDate: boolean;

  localizedVideoTitle: string;

  interruptionAllowed: boolean;

  forceAuthentication: boolean;

  get attributeNames(): NSArray;
  set attributeNames(value: NSArray<interop.Object> | Array<interop.Object>);

  get supportedAuthenticationSchemes(): NSArray;
  set supportedAuthenticationSchemes(value: NSArray<interop.Object> | Array<interop.Object>);

  accountProviderAuthenticationToken: string;

  get applicationAccountProviders(): NSArray;
  set applicationAccountProviders(value: NSArray<interop.Object> | Array<interop.Object>);

  isInterruptionAllowed(): boolean;
}

declare class VSAccountMetadata extends NSObject {
  readonly accountProviderIdentifier: string;

  readonly authenticationExpirationDate: NSDate;

  readonly verificationData: NSData;

  readonly SAMLAttributeQueryResponse: string;

  readonly accountProviderResponse: VSAccountProviderResponse;
}

declare class VSAccountApplicationProvider extends NSObject {
  initWithLocalizedDisplayNameIdentifier(localizedDisplayName: string, identifier: string): this;

  readonly localizedDisplayName: string;

  readonly identifier: string;
}

declare class VSSubscription extends NSObject {
  expirationDate: NSDate;

  accessLevel: interop.Enum<typeof VSSubscriptionAccessLevel>;

  get tierIdentifiers(): NSArray;
  set tierIdentifiers(value: NSArray<interop.Object> | Array<interop.Object>);

  billingIdentifier: string;
}

declare class VSAccountManager extends NSObject {
  delegate: VSAccountManagerDelegate | null;
}

declare class VSAccountManagerResult extends NSObject {
  cancel(): void;
}

declare class VSAccountProviderResponse extends NSObject {
  readonly authenticationScheme: string;

  readonly status: string;

  readonly body: string;
}

declare class VSSubscriptionRegistrationCenter extends NSObject {
  static defaultSubscriptionRegistrationCenter(): VSSubscriptionRegistrationCenter;

  setCurrentSubscription(currentSubscription: VSSubscription | null): void;
}

