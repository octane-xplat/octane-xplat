import type { NSWindow } from './AppKit'

import type { CNContact, CNPhoneNumber, CNPostalAddress } from './Contacts'

import type { NSArray, NSData, NSDate, NSDateInterval, NSDecimalNumber, NSDictionary, NSError, NSNumber, NSPersonNameComponents, NSSet, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSButton, NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const PKStoredValuePassBalanceTypeLoyaltyPoints: string;

export declare const PKStoredValuePassBalanceTypeCash: string;

export declare const PKPassLibrarySerialNumberUserInfoKey: string;

export declare const PKPassLibraryAddedPassesUserInfoKey: string;

export declare const PKPassLibraryRemotePaymentPassesDidChangeNotification: string;

export declare const PKPassLibraryDidChangeNotification: string;

export declare const PKAddSecureElementPassErrorDomain: string;

export declare const PKPaymentErrorContactFieldUserInfoKey: string;

export declare const PKPassKitErrorDomain: string;

export declare const PKContactFieldPhoneticName: string;

export declare const PKContactFieldPhoneNumber: string;

export declare const PKPaymentNetworkVPay: string;

export declare const PKPaymentNetworkVisa: string;

export declare const PKPaymentNetworkQuicPay: string;

export declare const PKPaymentNetworkPrivateLabel: string;

export declare const PKPaymentNetworkMaestro: string;

export declare const PKPaymentNetworkJCB: string;

export declare const PKPaymentNetworkIDCredit: string;

export declare const PKPaymentNetworkEftpos: string;

export declare const PKPaymentNetworkDiscover: string;

export declare const PKPaymentNetworkCartesBancaires: string;

export declare const PKEncryptionSchemeECC_V2: string;

export declare const PKPaymentNetworkGirocard: string;

export declare const PKShareSecureElementPassErrorDomain: string;

export declare const PKPaymentNetworkCarteBancaire: string;

export declare const PKPaymentNetworkCarteBancaires: string;

export declare const PKPassLibraryRemovedPassInfosUserInfoKey: string;

export declare const PKContactFieldEmailAddress: string;

export declare const PKPaymentNetworkBarcode: string;

export declare const PKPaymentNetworkMada: string;

export declare const PKPassLibraryRecoveredPassesUserInfoKey: string;

export declare const PKEncryptionSchemeRSA_V2: string;

export declare const PKPaymentNetworkElectron: string;

export declare const PKPassLibraryReplacementPassesUserInfoKey: string;

export declare const PKPaymentNetworkElo: string;

export declare const PKContactFieldPostalAddress: string;

export declare const PKPassLibraryPassTypeIdentifierUserInfoKey: string;

export declare const PKPaymentNetworkSuica: string;

export declare const PKPaymentErrorPostalAddressUserInfoKey: string;

export declare const PKPaymentNetworkAmex: string;

export declare const PKPaymentErrorDomain: string;

export declare const PKPaymentNetworkInterac: string;

export declare const PKContactFieldName: string;

export declare const PKPaymentNetworkChinaUnionPay: string;

export declare const PKPaymentNetworkMasterCard: string;

export declare const PKAddIdentityDocumentType: {
  IDCard: 0,
  MDL: 1,
  PhotoID: 2,
};

export declare const PKAddPaymentPassStyle: {
  Payment: 0,
  Access: 1,
};

export declare const PKMerchantCapability: {
  Capability3DS: 1,
  CapabilityEMV: 2,
  CapabilityCredit: 4,
  CapabilityDebit: 8,
};

export declare const PKPaymentSummaryItemType: {
  Final: 0,
  Pending: 1,
};

export declare const PKAutomaticPassPresentationSuppressionResult: {
  NotSupported: 0,
  AlreadyPresenting: 1,
  Denied: 2,
  Cancelled: 3,
  Success: 4,
};

export declare const PKAddSecureElementPassErrorCode: {
  Generic: 0,
  Unknown: 0,
  UserCanceled: 1,
  Unavailable: 2,
  InvalidConfiguration: 3,
  DeviceNotSupported: 4,
  DeviceNotReady: 5,
  OSVersionNotSupported: 6,
};

export declare const PKAddPaymentPassError: {
  Unsupported: 0,
  UserCancelled: 1,
  SystemCancelled: 2,
};

export declare const PKPaymentPassActivationState: {
  Activated: 0,
  RequiresActivation: 1,
  Activating: 2,
  Suspended: 3,
  Deactivated: 4,
};

export declare const PKSecureElementPassActivationState: {
  Activated: 0,
  RequiresActivation: 1,
  Activating: 2,
  Suspended: 3,
  Deactivated: 4,
};

export declare const PKPassType: {
  Barcode: 0,
  SecureElement: 1,
  Payment: 1,
  Any: -1,
};

export declare const PKPaymentButtonType: {
  Plain: 0,
  Buy: 1,
  SetUp: 2,
  InStore: 3,
  Donate: 4,
  Checkout: 5,
  Book: 6,
  Subscribe: 7,
  Reload: 8,
  AddMoney: 9,
  TopUp: 10,
  Order: 11,
  Rent: 12,
  Support: 13,
  Contribute: 14,
  Tip: 15,
};

export declare const PKBarcodeEventConfigurationDataType: {
  Unknown: 0,
  SigningKeyMaterial: 1,
  SigningCertificate: 2,
};

export declare const PKRadioTechnology: {
  None: 0,
  NFC: 1,
  Bluetooth: 2,
};

export declare const PKPaymentButtonStyle: {
  White: 0,
  WhiteOutline: 1,
  Black: 2,
  Automatic: 3,
};

export declare const PKPassKitErrorCode: {
  UnknownError: -1,
  InvalidDataError: 1,
  UnsupportedVersionError: 2,
  InvalidSignature: 3,
  NotEntitledError: 4,
};

export declare const PKVehicleConnectionSessionConnectionState: {
  Disconnected: 0,
  Connected: 1,
  Connecting: 2,
  FailedToConnect: 3,
};

export declare const PKPaymentErrorCode: {
  Unknown: -1,
  ShippingContactInvalid: 1,
  BillingContactInvalid: 2,
  ShippingAddressUnserviceable: 3,
};

export declare const PKAddressField: {
  None: 0,
  PostalAddress: 1,
  Phone: 2,
  Email: 4,
  Name: 8,
  All: 15,
};

export declare const PKShareSecureElementPassErrorCode: {
  Unknown: 0,
  Setup: 1,
};

export declare const PKPaymentMethodType: {
  Unknown: 0,
  Debit: 1,
  Credit: 2,
  Prepaid: 3,
  Store: 4,
  EMoney: 5,
};

export declare const PKShippingType: {
  Shipping: 0,
  Delivery: 1,
  StorePickup: 2,
  ServicePickup: 3,
};

export declare const PKVehicleConnectionErrorCode: {
  Unknown: 0,
  SessionUnableToStart: 1,
  SessionNotActive: 2,
};

export declare const PKAddShareablePassConfigurationPrimaryAction: {
  Add: 0,
  Share: 1,
};

export declare const PKPaymentAuthorizationStatus: {
  Success: 0,
  Failure: 1,
  InvalidBillingPostalAddress: 2,
  InvalidShippingPostalAddress: 3,
  InvalidShippingContact: 4,
  PINRequired: 5,
  PINIncorrect: 6,
  PINLockout: 7,
};

export declare const PKPassLibraryAddPassesStatus: {
  DidAdd: 0,
  ShouldReview: 1,
  DidCancelAdd: 2,
};

export declare interface PKPaymentAuthorizationViewControllerDelegate extends NSObjectProtocol {
  paymentAuthorizationViewControllerDidFinish(controller: PKPaymentAuthorizationViewController): void;

  paymentAuthorizationViewControllerDidAuthorizePaymentHandler?(controller: PKPaymentAuthorizationViewController, payment: PKPayment, completion: (p1: PKPaymentAuthorizationResult) => void): void;

  paymentAuthorizationViewControllerWillAuthorizePayment?(controller: PKPaymentAuthorizationViewController): void;

  paymentAuthorizationViewControllerDidRequestMerchantSessionUpdate?(controller: PKPaymentAuthorizationViewController, handler: (p1: PKPaymentRequestMerchantSessionUpdate) => void): void;

  paymentAuthorizationViewControllerDidSelectShippingMethodHandler?(controller: PKPaymentAuthorizationViewController, shippingMethod: PKShippingMethod, completion: (p1: PKPaymentRequestShippingMethodUpdate) => void): void;

  paymentAuthorizationViewControllerDidSelectShippingContactHandler?(controller: PKPaymentAuthorizationViewController, contact: PKContact, completion: (p1: PKPaymentRequestShippingContactUpdate) => void): void;

  paymentAuthorizationViewControllerDidSelectPaymentMethodHandler?(controller: PKPaymentAuthorizationViewController, paymentMethod: PKPaymentMethod, completion: (p1: PKPaymentRequestPaymentMethodUpdate) => void): void;

  paymentAuthorizationViewControllerDidAuthorizePaymentCompletion?(controller: PKPaymentAuthorizationViewController, payment: PKPayment, completion: (p1: interop.Enum<typeof PKPaymentAuthorizationStatus>) => void): void;

  paymentAuthorizationViewControllerDidSelectShippingMethodCompletion?(controller: PKPaymentAuthorizationViewController, shippingMethod: PKShippingMethod, completion: (p1: interop.Enum<typeof PKPaymentAuthorizationStatus>, p2: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  paymentAuthorizationViewControllerDidSelectShippingContactCompletion?(controller: PKPaymentAuthorizationViewController, contact: PKContact, completion: (p1: interop.Enum<typeof PKPaymentAuthorizationStatus>, p2: NSArray<interop.Object> | Array<interop.Object>, p3: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  paymentAuthorizationViewControllerDidSelectPaymentMethodCompletion?(controller: PKPaymentAuthorizationViewController, paymentMethod: PKPaymentMethod, completion: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;
}

export declare class PKPaymentAuthorizationViewControllerDelegate extends NativeObject implements PKPaymentAuthorizationViewControllerDelegate {
}

export declare interface PKPaymentInformationRequestHandling {
  handleInformationRequestCompletion(infoRequest: PKBarcodeEventMetadataRequest, completion: (p1: PKBarcodeEventMetadataResponse) => void): void;

  handleSignatureRequestCompletion(signatureRequest: PKBarcodeEventSignatureRequest, completion: (p1: PKBarcodeEventSignatureResponse) => void): void;

  handleConfigurationRequestCompletion(configurationRequest: PKBarcodeEventConfigurationRequest, completion: () => void): void;
}

export declare class PKPaymentInformationRequestHandling extends NativeObject implements PKPaymentInformationRequestHandling {
}

export declare interface PKPaymentAuthorizationControllerDelegate extends NSObjectProtocol {
  paymentAuthorizationControllerDidFinish(controller: PKPaymentAuthorizationController): void;

  paymentAuthorizationControllerDidAuthorizePaymentHandler?(controller: PKPaymentAuthorizationController, payment: PKPayment, completion: (p1: PKPaymentAuthorizationResult) => void): void;

  paymentAuthorizationControllerDidAuthorizePaymentCompletion?(controller: PKPaymentAuthorizationController, payment: PKPayment, completion: (p1: interop.Enum<typeof PKPaymentAuthorizationStatus>) => void): void;

  paymentAuthorizationControllerWillAuthorizePayment?(controller: PKPaymentAuthorizationController): void;

  paymentAuthorizationControllerDidRequestMerchantSessionUpdate?(controller: PKPaymentAuthorizationController, handler: (p1: PKPaymentRequestMerchantSessionUpdate) => void): void;

  paymentAuthorizationControllerDidSelectShippingMethodHandler?(controller: PKPaymentAuthorizationController, shippingMethod: PKShippingMethod, completion: (p1: PKPaymentRequestShippingMethodUpdate) => void): void;

  paymentAuthorizationControllerDidSelectShippingContactHandler?(controller: PKPaymentAuthorizationController, contact: PKContact, completion: (p1: PKPaymentRequestShippingContactUpdate) => void): void;

  paymentAuthorizationControllerDidSelectPaymentMethodHandler?(controller: PKPaymentAuthorizationController, paymentMethod: PKPaymentMethod, completion: (p1: PKPaymentRequestPaymentMethodUpdate) => void): void;

  paymentAuthorizationControllerDidSelectShippingMethodCompletion?(controller: PKPaymentAuthorizationController, shippingMethod: PKShippingMethod, completion: (p1: interop.Enum<typeof PKPaymentAuthorizationStatus>, p2: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  paymentAuthorizationControllerDidSelectShippingContactCompletion?(controller: PKPaymentAuthorizationController, contact: PKContact, completion: (p1: interop.Enum<typeof PKPaymentAuthorizationStatus>, p2: NSArray<interop.Object> | Array<interop.Object>, p3: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  paymentAuthorizationControllerDidSelectPaymentMethodCompletion?(controller: PKPaymentAuthorizationController, paymentMethod: PKPaymentMethod, completion: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  presentationWindowForPaymentAuthorizationController(controller: PKPaymentAuthorizationController): NSWindow;
}

export declare class PKPaymentAuthorizationControllerDelegate extends NativeObject implements PKPaymentAuthorizationControllerDelegate {
}

export declare interface PKVehicleConnectionDelegate extends NSObjectProtocol {
  sessionDidChangeConnectionState(newState: interop.Enum<typeof PKVehicleConnectionSessionConnectionState>): void;

  sessionDidReceiveData(data: NSData): void;
}

export declare class PKVehicleConnectionDelegate extends NativeObject implements PKVehicleConnectionDelegate {
}

export declare class PKVehicleConnectionSession extends NSObject {
  readonly delegate: PKVehicleConnectionDelegate | null;

  readonly connectionStatus: interop.Enum<typeof PKVehicleConnectionSessionConnectionState>;

  static sessionForPassDelegateCompletion(pass: PKSecureElementPass, delegate: PKVehicleConnectionDelegate, completion: (p1: PKVehicleConnectionSession, p2: NSError) => void | null): void;

  sendDataError(message: NSData, error: interop.PointerConvertible): boolean;

  invalidate(): void;
}

export declare class PKShareablePassMetadata extends NSObject {
  initWithProvisioningCredentialIdentifierCardConfigurationIdentifierSharingInstanceIdentifierPassThumbnailImageOwnerDisplayNameLocalizedDescription(credentialIdentifier: string, cardConfigurationIdentifier: string, sharingInstanceIdentifier: string, passThumbnailImage: interop.Object, ownerDisplayName: string, localizedDescription: string): this;

  initWithProvisioningCredentialIdentifierSharingInstanceIdentifierPassThumbnailImageOwnerDisplayNameLocalizedDescriptionAccountHashTemplateIdentifierRelyingPartyIdentifierRequiresUnifiedAccessCapableDevice(credentialIdentifier: string, sharingInstanceIdentifier: string, passThumbnailImage: interop.Object, ownerDisplayName: string, localizedDescription: string, accountHash: string, templateIdentifier: string, relyingPartyIdentifier: string, requiresUnifiedAccessCapableDevice: boolean): this;

  initWithProvisioningCredentialIdentifierSharingInstanceIdentifierCardTemplateIdentifierPreview(credentialIdentifier: string, sharingInstanceIdentifier: string, templateIdentifier: string, preview: PKShareablePassMetadataPreview): this;

  initWithProvisioningCredentialIdentifierSharingInstanceIdentifierCardConfigurationIdentifierPreview(credentialIdentifier: string, sharingInstanceIdentifier: string, templateIdentifier: string, preview: PKShareablePassMetadataPreview): this;

  readonly credentialIdentifier: string;

  readonly sharingInstanceIdentifier: string;

  readonly templateIdentifier: string;

  readonly cardTemplateIdentifier: string;

  readonly cardConfigurationIdentifier: string;

  requiresUnifiedAccessCapableDevice: boolean;

  serverEnvironmentIdentifier: string;

  readonly preview: PKShareablePassMetadataPreview;

  readonly passThumbnailImage: interop.Object;

  readonly localizedDescription: string;

  readonly ownerDisplayName: string;

  accountHash: string;

  relyingPartyIdentifier: string;
}

export declare class PKShareablePassMetadataPreview extends PKAddPassMetadataPreview {
  initWithTemplateIdentifier(templateIdentifier: string): this;

  static previewWithTemplateIdentifier<This extends abstract new (...args: any) => any>(this: This, templateIdentifier: string): InstanceType<This>;

  ownerDisplayName: string;

  readonly provisioningTemplateIdentifier: string;
}

export declare class PKPaymentMerchantSession extends NSObject {
  initWithDictionary(dictionary: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): this;
}

export declare class PKAddCarKeyPassConfiguration extends PKAddSecureElementPassConfiguration {
  init(): this;

  password: string;

  supportedRadioTechnologies: interop.Enum<typeof PKRadioTechnology>;

  manufacturerIdentifier: string;

  provisioningTemplateIdentifier: string;

  productPlanIdentifier: string;
}

export declare class PKAddPaymentPassRequestConfiguration extends NSObject {
  initWithEncryptionScheme(encryptionScheme: string): this;

  readonly encryptionScheme: string;

  style: interop.Enum<typeof PKAddPaymentPassStyle>;

  cardholderName: string;

  primaryAccountSuffix: string;

  get cardDetails(): NSArray;
  set cardDetails(value: NSArray<interop.Object> | Array<interop.Object>);

  localizedDescription: string;

  primaryAccountIdentifier: string;

  paymentNetwork: string;

  productIdentifiers: NSSet;

  requiresFelicaSecureElement: boolean;
}

export declare class PKPaymentButton extends NSButton {
  static buttonWithTypeStyle<This extends abstract new (...args: any) => any>(this: This, buttonType: interop.Enum<typeof PKPaymentButtonType>, buttonStyle: interop.Enum<typeof PKPaymentButtonStyle>): InstanceType<This>;

  initWithPaymentButtonTypePaymentButtonStyle(type: interop.Enum<typeof PKPaymentButtonType>, style: interop.Enum<typeof PKPaymentButtonStyle>): this;

  cornerRadius: number;
}

export declare class PKPaymentAuthorizationController extends NSObject {
  static canMakePayments(): boolean;

  static canMakePaymentsUsingNetworks(supportedNetworks: NSArray<interop.Object> | Array<interop.Object>): boolean;

  static canMakePaymentsUsingNetworksCapabilities(supportedNetworks: NSArray<interop.Object> | Array<interop.Object>, capabilties: interop.Enum<typeof PKMerchantCapability>): boolean;

  delegate: PKPaymentAuthorizationControllerDelegate;

  initWithPaymentRequest(request: PKPaymentRequest): this;

  presentWithCompletion(completion: (p1: boolean) => void | null): void;

  dismissWithCompletion(completion: () => void | null): void;
}

export declare class PKPaymentAuthorizationViewController extends NSViewController {
  static canMakePayments(): boolean;

  static canMakePaymentsUsingNetworks(supportedNetworks: NSArray<interop.Object> | Array<interop.Object>): boolean;

  static canMakePaymentsUsingNetworksCapabilities(supportedNetworks: NSArray<interop.Object> | Array<interop.Object>, capabilties: interop.Enum<typeof PKMerchantCapability>): boolean;

  delegate: PKPaymentAuthorizationViewControllerDelegate;

  initWithPaymentRequest(request: PKPaymentRequest): this;
}

export declare class PKPaymentToken extends NSObject {
  readonly paymentMethod: PKPaymentMethod;

  readonly paymentInstrumentName: string;

  readonly paymentNetwork: string;

  readonly transactionIdentifier: string;

  readonly paymentData: NSData;
}

export declare class PKPaymentRequestMerchantSessionUpdate extends NSObject {
  initWithStatusMerchantSession(status: interop.Enum<typeof PKPaymentAuthorizationStatus>, session: PKPaymentMerchantSession | null): this;

  status: interop.Enum<typeof PKPaymentAuthorizationStatus>;

  session: PKPaymentMerchantSession;
}

export declare class PKPaymentRequestPaymentMethodUpdate extends PKPaymentRequestUpdate {
  initWithErrorsPaymentSummaryItems(errors: NSArray<interop.Object> | Array<interop.Object> | null, paymentSummaryItems: NSArray<interop.Object> | Array<interop.Object>): this;

  get errors(): NSArray;
  set errors(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class PKPaymentRequestShippingContactUpdate extends PKPaymentRequestUpdate {
  initWithErrorsPaymentSummaryItemsShippingMethods(errors: NSArray<interop.Object> | Array<interop.Object> | null, paymentSummaryItems: NSArray<interop.Object> | Array<interop.Object>, shippingMethods: NSArray<interop.Object> | Array<interop.Object>): this;

  get shippingMethods(): NSArray;
  set shippingMethods(value: NSArray<interop.Object> | Array<interop.Object>);

  get errors(): NSArray;
  set errors(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class PKPaymentRequestUpdate extends NSObject {
  initWithPaymentSummaryItems(paymentSummaryItems: NSArray<interop.Object> | Array<interop.Object>): this;

  status: interop.Enum<typeof PKPaymentAuthorizationStatus>;

  get paymentSummaryItems(): NSArray;
  set paymentSummaryItems(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class PKSuicaPassProperties extends PKTransitPassProperties {
  static passPropertiesForPass<This extends abstract new (...args: any) => any>(this: This, pass: PKPass): InstanceType<This>;

  readonly transitBalance: NSDecimalNumber;

  readonly transitBalanceCurrencyCode: string;

  readonly inStation: boolean;

  readonly inShinkansenStation: boolean;

  readonly balanceAllowedForCommute: boolean;

  readonly lowBalanceGateNotificationEnabled: boolean;

  readonly greenCarTicketUsed: boolean;

  readonly blacklisted: boolean;

  isInStation(): boolean;

  isInShinkansenStation(): boolean;

  isBalanceAllowedForCommute(): boolean;

  isLowBalanceGateNotificationEnabled(): boolean;

  isGreenCarTicketUsed(): boolean;

  isBlacklisted(): boolean;
}

export declare class PKStoredValuePassBalance extends NSObject {
  readonly amount: NSDecimalNumber;

  readonly currencyCode: string;

  readonly balanceType: string;

  readonly expiryDate: NSDate;

  isEqualToBalance(balance: PKStoredValuePassBalance): boolean;
}

export declare class PKContact extends NSObject {
  name: NSPersonNameComponents;

  postalAddress: CNPostalAddress;

  phoneNumber: CNPhoneNumber;

  emailAddress: string;

  supplementarySubLocality: string;
}

export declare class PKPaymentPass extends PKSecureElementPass {
  readonly activationState: interop.Enum<typeof PKPaymentPassActivationState>;
}

export declare class PKSecureElementPass extends PKPass {
  readonly primaryAccountIdentifier: string;

  readonly primaryAccountNumberSuffix: string;

  readonly deviceAccountIdentifier: string;

  readonly deviceAccountNumberSuffix: string;

  readonly passActivationState: interop.Enum<typeof PKSecureElementPassActivationState>;

  readonly devicePassIdentifier: string;

  readonly pairedTerminalIdentifier: string;
}

export declare class PKIssuerProvisioningExtensionStatus extends NSObject {
  init(): this;

  requiresAuthentication: boolean;

  passEntriesAvailable: boolean;

  remotePassEntriesAvailable: boolean;
}

export declare class PKStoredValuePassProperties extends NSObject {
  static passPropertiesForPass<This extends abstract new (...args: any) => any>(this: This, pass: PKPass): InstanceType<This>;

  readonly expirationDate: NSDate;

  readonly balances: NSArray;
}

export declare class PKJapanIndividualNumberCardMetadata extends PKIdentityDocumentMetadata {
  initWithProvisioningCredentialIdentifierSharingInstanceIdentifierCardTemplateIdentifierPreview(credentialIdentifier: string, sharingInstanceIdentifier: string, templateIdentifier: string, preview: PKAddPassMetadataPreview): this;

  initWithProvisioningCredentialIdentifierSharingInstanceIdentifierCardConfigurationIdentifierPreview(credentialIdentifier: string, sharingInstanceIdentifier: string, cardConfigurationIdentifier: string, preview: PKAddPassMetadataPreview): this;

  authenticationPassword: string;

  signingPassword: string;

  preview: PKAddPassMetadataPreview;
}

export declare class PKObject extends NSObject {
}

export declare class PKPaymentMethod extends NSObject {
  readonly displayName: string;

  readonly network: string;

  readonly type: interop.Enum<typeof PKPaymentMethodType>;

  readonly paymentPass: PKPaymentPass;

  readonly secureElementPass: PKSecureElementPass;

  readonly billingAddress: CNContact;
}

export declare class PKPaymentAuthorizationResult extends NSObject {
  initWithStatusErrors(status: interop.Enum<typeof PKPaymentAuthorizationStatus>, errors: NSArray<interop.Object> | Array<interop.Object> | null): this;

  status: interop.Enum<typeof PKPaymentAuthorizationStatus>;

  get errors(): NSArray;
  set errors(value: NSArray<interop.Object> | Array<interop.Object>);
}

export declare class PKPassRelevantDate extends NSObject {
  readonly interval: NSDateInterval;

  readonly date: NSDate;
}

export declare class PKPaymentRequestShippingMethodUpdate extends PKPaymentRequestUpdate {
}

export declare class PKShippingMethod extends PKPaymentSummaryItem {
  identifier: string;

  detail: string;
}

export declare class PKIssuerProvisioningExtensionPassEntry extends NSObject {
  readonly identifier: string;

  readonly title: string;

  readonly art: interop.Object;
}

export declare class PKBarcodeEventSignatureRequest extends NSObject {
  readonly deviceAccountIdentifier: string;

  readonly transactionIdentifier: string;

  readonly barcodeIdentifier: string;

  readonly rawMerchantName: string;

  readonly merchantName: string;

  readonly transactionDate: NSDate;

  readonly currencyCode: string;

  readonly amount: NSNumber;

  readonly transactionStatus: string;

  readonly partialSignature: NSData;
}

export declare class PKIssuerProvisioningExtensionPaymentPassEntry extends PKIssuerProvisioningExtensionPassEntry {
  initWithIdentifierTitleArtAddRequestConfiguration(identifier: string, title: string, art: interop.Object, configuration: PKAddPaymentPassRequestConfiguration): this;

  readonly addRequestConfiguration: PKAddPaymentPassRequestConfiguration;
}

export declare class PKPaymentRequest extends NSObject {
  static availableNetworks(): NSArray;

  static paymentContactInvalidErrorWithContactFieldLocalizedDescription(field: string, localizedDescription: string | null): NSError;

  static paymentShippingAddressInvalidErrorWithKeyLocalizedDescription(postalAddressKey: string, localizedDescription: string | null): NSError;

  static paymentBillingAddressInvalidErrorWithKeyLocalizedDescription(postalAddressKey: string, localizedDescription: string | null): NSError;

  static paymentShippingAddressUnserviceableErrorWithLocalizedDescription(localizedDescription: string | null): NSError;

  merchantIdentifier: string;

  attributionIdentifier: string;

  countryCode: string;

  get supportedNetworks(): NSArray;
  set supportedNetworks(value: NSArray<interop.Object> | Array<interop.Object>);

  merchantCapabilities: interop.Enum<typeof PKMerchantCapability>;

  get paymentSummaryItems(): NSArray;
  set paymentSummaryItems(value: NSArray<interop.Object> | Array<interop.Object>);

  currencyCode: string;

  requiredBillingContactFields: NSSet;

  requiredBillingAddressFields: interop.Enum<typeof PKAddressField>;

  billingContact: PKContact;

  requiredShippingContactFields: NSSet;

  requiredShippingAddressFields: interop.Enum<typeof PKAddressField>;

  shippingContact: PKContact;

  get shippingMethods(): NSArray;
  set shippingMethods(value: NSArray<interop.Object> | Array<interop.Object>);

  shippingType: interop.Enum<typeof PKShippingType>;

  applicationData: NSData;

  supportedCountries: NSSet;
}

export declare class PKIdentityDocumentMetadata extends NSObject {
  readonly credentialIdentifier: string;

  readonly sharingInstanceIdentifier: string;

  readonly cardTemplateIdentifier: string;

  readonly cardConfigurationIdentifier: string;

  serverEnvironmentIdentifier: string;

  readonly issuingCountryCode: string;

  readonly documentType: interop.Enum<typeof PKAddIdentityDocumentType>;
}

export declare class PKPayment extends NSObject {
  readonly token: PKPaymentToken;

  readonly billingContact: PKContact;

  readonly shippingContact: PKContact;

  readonly shippingMethod: PKShippingMethod;
}

export declare class PKAddIdentityDocumentConfiguration extends PKAddSecureElementPassConfiguration {
  static configurationForMetadataCompletion(metadata: PKIdentityDocumentMetadata, completion: (p1: PKAddIdentityDocumentConfiguration, p2: NSError) => void | null): void;

  readonly metadata: PKIdentityDocumentMetadata;
}

export declare class PKBarcodeEventSignatureResponse extends NSObject {
  initWithSignedData(signedData: NSData): this;

  signedData: NSData;
}

export declare class PKLabeledValue extends NSObject {
  initWithLabelValue(label: string, value: string): this;

  readonly label: string;

  readonly value: string;
}

export declare class PKAddShareablePassConfiguration extends PKAddSecureElementPassConfiguration {
  static configurationForPassMetadataProvisioningPolicyIdentifierPrimaryActionCompletion(passMetadata: NSArray<interop.Object> | Array<interop.Object>, provisioningPolicyIdentifier: string, action: interop.Enum<typeof PKAddShareablePassConfigurationPrimaryAction>, completion: (p1: PKAddShareablePassConfiguration, p2: NSError) => void | null): void;

  static configurationForPassMetadataPrimaryActionCompletion(passMetadata: NSArray<interop.Object> | Array<interop.Object>, action: interop.Enum<typeof PKAddShareablePassConfigurationPrimaryAction>, completion: (p1: PKAddShareablePassConfiguration, p2: NSError) => void | null): void;

  readonly primaryAction: interop.Enum<typeof PKAddShareablePassConfigurationPrimaryAction>;

  readonly credentialsMetadata: NSArray;

  readonly provisioningPolicyIdentifier: string;
}

export declare class PKPass extends PKObject {
  initWithDataError(data: NSData, error: interop.PointerConvertible): this;

  readonly passType: interop.Enum<typeof PKPassType>;

  readonly paymentPass: PKPaymentPass;

  readonly secureElementPass: PKSecureElementPass;

  readonly serialNumber: string;

  readonly passTypeIdentifier: string;

  readonly webServiceURL: NSURL;

  readonly authenticationToken: string;

  readonly localizedName: string;

  readonly localizedDescription: string;

  readonly organizationName: string;

  readonly relevantDate: NSDate;

  readonly userInfo: NSDictionary;

  readonly passURL: NSURL;

  readonly remotePass: boolean;

  readonly deviceName: string;

  localizedValueForFieldKey(key: string): interop.Object;

  isRemotePass(): boolean;
}

export declare class PKAddPaymentPassRequest extends NSObject {
  init(): this;

  encryptedPassData: NSData;

  activationData: NSData;

  ephemeralPublicKey: NSData;

  wrappedKey: NSData;
}

export declare class PKBarcodeEventMetadataResponse extends NSObject {
  initWithPaymentInformation(paymentInformation: NSData): this;

  paymentInformation: NSData;
}

export declare class PKAddIdentityDocumentMetadata extends PKIdentityDocumentMetadata {
  initWithProvisioningCredentialIdentifierSharingInstanceIdentifierCardTemplateIdentifierIssuingCountryCodeDocumentTypePreview(credentialIdentifier: string, sharingInstanceIdentifier: string, templateIdentifier: string, issuingCountryCode: string, documentType: interop.Enum<typeof PKAddIdentityDocumentType>, preview: PKAddPassMetadataPreview): this;

  readonly preview: PKAddPassMetadataPreview;
}

export declare class PKPaymentInformationEventExtension extends NSObject {
}

export declare class PKBarcodeEventMetadataRequest extends NSObject {
  readonly deviceAccountIdentifier: string;

  readonly lastUsedBarcodeIdentifier: string;
}

export declare class PKAddSecureElementPassConfiguration extends NSObject {
  issuerIdentifier: string;

  localizedDescription: string;
}

export declare class PKPaymentSummaryItem extends NSObject {
  static summaryItemWithLabelAmount<This extends abstract new (...args: any) => any>(this: This, label: string, amount: NSDecimalNumber): InstanceType<This>;

  static summaryItemWithLabelAmountType<This extends abstract new (...args: any) => any>(this: This, label: string, amount: NSDecimalNumber, type: interop.Enum<typeof PKPaymentSummaryItemType>): InstanceType<This>;

  label: string;

  amount: NSDecimalNumber;

  type: interop.Enum<typeof PKPaymentSummaryItemType>;
}

export declare class PKPassLibrary extends NSObject {
  static isPassLibraryAvailable(): boolean;

  static requestAutomaticPassPresentationSuppressionWithResponseHandler(responseHandler: (p1: interop.Enum<typeof PKAutomaticPassPresentationSuppressionResult>) => void): number;

  static endAutomaticPassPresentationSuppressionWithRequestToken(requestToken: number): void;

  static isSuppressingAutomaticPassPresentation(): boolean;

  static isPaymentPassActivationAvailable(): boolean;

  isPaymentPassActivationAvailable(): boolean;

  readonly secureElementPassActivationAvailable: boolean;

  passes(): NSArray;

  passWithPassTypeIdentifierSerialNumber(identifier: string, serialNumber: string): PKPass;

  passesWithReaderIdentifier(readerIdentifier: string): NSSet;

  passesOfType(passType: interop.Enum<typeof PKPassType>): NSArray;

  remotePaymentPasses(): NSArray;

  readonly remoteSecureElementPasses: NSArray;

  removePass(pass: PKPass): void;

  containsPass(pass: PKPass): boolean;

  replacePassWithPass(pass: PKPass): boolean;

  addPassesWithCompletionHandler(passes: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: interop.Enum<typeof PKPassLibraryAddPassesStatus>) => void | null): void;

  openPaymentSetup(): void;

  presentPaymentPass(pass: PKPaymentPass): void;

  presentSecureElementPass(pass: PKSecureElementPass): void;

  canAddPaymentPassWithPrimaryAccountIdentifier(primaryAccountIdentifier: string): boolean;

  canAddSecureElementPassWithPrimaryAccountIdentifier(primaryAccountIdentifier: string): boolean;

  canAddFelicaPass(): boolean;

  activatePaymentPassWithActivationDataCompletion(paymentPass: PKPaymentPass, activationData: NSData, completion: (p1: boolean, p2: NSError) => void | null): void;

  activatePaymentPassWithActivationCodeCompletion(paymentPass: PKPaymentPass, activationCode: string, completion: (p1: boolean, p2: NSError) => void | null): void;

  activateSecureElementPassWithActivationDataCompletion(secureElementPass: PKSecureElementPass, activationData: NSData, completion: (p1: boolean, p2: NSError) => void | null): void;

  signDataWithSecureElementPassCompletion(signData: NSData, secureElementPass: PKSecureElementPass, completion: (p1: NSData, p2: NSData, p3: NSError) => void | null): void;

  encryptedServiceProviderDataForSecureElementPassCompletion(secureElementPass: PKSecureElementPass, completion: (p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, p2: NSError) => void | null): void;

  serviceProviderDataForSecureElementPassCompletion(secureElementPass: PKSecureElementPass, completion: (p1: NSData, p2: NSError) => void | null): void;

  isSecureElementPassActivationAvailable(): boolean;
}

export declare class PKAddPassMetadataPreview extends NSObject {
  initWithPassThumbnailLocalizedDescription(passThumbnail: interop.Object, description: string): this;

  static previewWithPassThumbnailLocalizedDescription<This extends abstract new (...args: any) => any>(this: This, passThumbnail: interop.Object, description: string): InstanceType<This>;

  readonly passThumbnailImage: interop.Object;

  readonly localizedDescription: string;
}

export declare class PKTransitPassProperties extends PKStoredValuePassProperties {
  readonly transitBalance: NSDecimalNumber;

  readonly transitBalanceCurrencyCode: string;

  readonly blacklisted: boolean;

  readonly expirationDate: NSDate;

  readonly inStation: boolean;

  isBlacklisted(): boolean;

  isInStation(): boolean;
}

export declare class PKBarcodeEventConfigurationRequest extends NSObject {
  readonly deviceAccountIdentifier: string;

  readonly configurationData: NSData;

  readonly configurationDataType: interop.Enum<typeof PKBarcodeEventConfigurationDataType>;
}
