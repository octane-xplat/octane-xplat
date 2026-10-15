import type { NSArray, NSDate, NSDictionary, NSError } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const ACAccountStoreDidChangeNotification: string;

export declare const ACLinkedInPermissionsKey: string;

export declare const ACFacebookAudienceFriends: string;

export declare const ACFacebookAudienceEveryone: string;

export declare const ACAccountTypeIdentifierLinkedIn: string;

export declare const ACAccountTypeIdentifierFacebook: string;

export declare const ACAccountTypeIdentifierTwitter: string;

export declare const ACTencentWeiboAppIdKey: string;

export declare const ACFacebookPermissionsKey: string;

export declare const ACLinkedInAppIdKey: string;

export declare const ACFacebookAudienceKey: string;

export declare const ACFacebookAudienceOnlyMe: string;

export declare const ACAccountTypeIdentifierTencentWeibo: string;

export declare const ACFacebookAppIdKey: string;

export declare const ACAccountTypeIdentifierSinaWeibo: string;

export declare const ACErrorDomain: string;

export declare const ACErrorCode: {
  Unknown: 1,
  AccountMissingRequiredProperty: 2,
  AccountAuthenticationFailed: 3,
  AccountTypeInvalid: 4,
  AccountAlreadyExists: 5,
  AccountNotFound: 6,
  PermissionDenied: 7,
  AccessInfoInvalid: 8,
  ClientPermissionDenied: 9,
  AccessDeniedByProtectionPolicy: 10,
  CredentialNotFound: 11,
  FetchCredentialFailed: 12,
  StoreCredentialFailed: 13,
  RemoveCredentialFailed: 14,
  UpdatingNonexistentAccount: 15,
  InvalidClientBundleID: 16,
  DeniedByPlugin: 17,
  CoreDataSaveFailed: 18,
  FailedSerializingAccountInfo: 19,
  InvalidCommand: 20,
  MissingTransportMessageID: 21,
  CredentialItemNotFound: 22,
  CredentialItemNotExpired: 23,
};

export declare const ACAccountCredentialRenewResult: {
  Renewed: 0,
  Rejected: 1,
  Failed: 2,
};

export declare class ACAccountStore extends NSObject {
  readonly accounts: NSArray;

  accountWithIdentifier(identifier: string): ACAccount;

  accountTypeWithAccountTypeIdentifier(typeIdentifier: string): ACAccountType;

  accountsWithAccountType(accountType: ACAccountType): NSArray;

  saveAccountWithCompletionHandler(account: ACAccount, completionHandler: (p1: boolean, p2: NSError) => void): void;

  requestAccessToAccountsWithTypeOptionsCompletion(accountType: ACAccountType, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, completion: (p1: boolean, p2: NSError) => void): void;

  renewCredentialsForAccountCompletion(account: ACAccount, completionHandler: (p1: interop.Enum<typeof ACAccountCredentialRenewResult>, p2: NSError) => void): void;

  removeAccountWithCompletionHandler(account: ACAccount, completionHandler: (p1: boolean, p2: NSError) => void): void;
}

export declare class ACAccountCredential extends NSObject {
  initWithOAuthTokenTokenSecret(token: string, secret: string): this;

  initWithOAuth2TokenRefreshTokenExpiryDate(token: string, refreshToken: string, expiryDate: NSDate): this;

  oauthToken: string;
}

export declare class ACAccountType extends NSObject {
  readonly accountTypeDescription: string;

  readonly identifier: string;

  readonly accessGranted: boolean;
}

export declare class ACAccount extends NSObject {
  initWithAccountType(type: ACAccountType): this;

  readonly identifier: string;

  accountType: ACAccountType;

  accountDescription: string;

  username: string;

  credential: ACAccountCredential;
}
