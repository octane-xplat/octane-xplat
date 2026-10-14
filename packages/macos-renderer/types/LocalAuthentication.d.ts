/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const LATouchIDAuthenticationMaximumAllowableReuseDuration: number;

declare const LAErrorDomain: string;

declare const LAError: {
  AuthenticationFailed: -1,
  UserCancel: -2,
  UserFallback: -3,
  SystemCancel: -4,
  PasscodeNotSet: -5,
  TouchIDNotAvailable: -6,
  TouchIDNotEnrolled: -7,
  TouchIDLockout: -8,
  AppCancel: -9,
  InvalidContext: -10,
  BiometryNotAvailable: -6,
  BiometryNotEnrolled: -7,
  BiometryLockout: -8,
  NotInteractive: -1004,
  WatchNotAvailable: -11,
};

declare const LAAccessControlOperation: {
  CreateItem: 0,
  UseItem: 1,
  CreateKey: 2,
  UseKeySign: 3,
  UseKeyDecrypt: 4,
  UseKeyKeyExchange: 5,
};

declare const LACredentialType: {
  ApplicationPassword: 0,
  SmartCardPIN: -3,
};

declare const LAPolicy: {
  WithBiometrics: 1,
  LAPolicyDeviceOwnerAuthentication: 2,
  WithWatch: 3,
  WithBiometricsOrWatch: 4,
};

declare const LABiometryType: {
  TypeNone: 0,
  None: 0,
  TypeTouchID: 1,
  TypeFaceID: 2,
};

declare class LAContext extends NSObject {
  canEvaluatePolicyError(policy: interop.Enum<typeof LAPolicy>, error: interop.PointerConvertible): boolean;

  evaluatePolicyLocalizedReasonReply(policy: interop.Enum<typeof LAPolicy>, localizedReason: string, reply: (p1: boolean, p2: NSError) => void | null): void;

  invalidate(): void;

  setCredentialType(credential: NSData | null, type: interop.Enum<typeof LACredentialType>): boolean;

  isCredentialSet(type: interop.Enum<typeof LACredentialType>): boolean;

  evaluateAccessControlOperationLocalizedReasonReply(accessControl: interop.Object, operation: interop.Enum<typeof LAAccessControlOperation>, localizedReason: string, reply: (p1: boolean, p2: NSError) => void | null): void;

  localizedFallbackTitle: string;

  maxBiometryFailures: NSNumber;

  localizedCancelTitle: string;

  touchIDAuthenticationAllowableReuseDuration: number;

  localizedReason: string;

  interactionNotAllowed: boolean;

  readonly biometryType: interop.Enum<typeof LABiometryType>;

  readonly evaluatedPolicyDomainState: NSData;
}

