import type { NSArray, NSCopying, NSData, NSDate, NSDecimalNumber, NSDictionary, NSError, NSLocale, NSMutableCopying, NSNumber, NSSet, NSURL, NSUUID } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const SKStoreProductParameterAdvertisingPartnerToken: string;

export declare const SKStoreProductParameterCampaignToken: string;

export declare const SKStoreProductParameterITunesItemIdentifier: string;

export declare const SKErrorDomain: string;

export declare const SKCloudServiceCapabilitiesDidChangeNotification: string;

export declare const SKReceiptPropertyIsRevoked: string;

export declare const SKDownloadTimeRemainingUnknown: number;

export declare const SKReceiptPropertyIsExpired: string;

export declare const SKReceiptPropertyIsVolumePurchase: string;

export declare const SKStoreProductParameterAffiliateToken: string;

export declare const SKStoreProductParameterProviderToken: string;

export declare const SKStorefrontIdentifierDidChangeNotification: string;

export declare const SKStorefrontCountryCodeDidChangeNotification: string;

export declare const SKStoreProductParameterProductIdentifier: string;

export declare const SKProductStorePromotionVisibility: {
  Default: 0,
  Show: 1,
  Hide: 2,
};

export declare const SKCloudServiceCapability: {
  None: 0,
  MusicCatalogPlayback: 1,
  MusicCatalogSubscriptionEligible: 2,
  AddToCloudMusicLibrary: 256,
};

export declare const SKErrorCode: {
  Unknown: 0,
  ClientInvalid: 1,
  PaymentCancelled: 2,
  PaymentInvalid: 3,
  PaymentNotAllowed: 4,
  StoreProductNotAvailable: 5,
  CloudServicePermissionDenied: 6,
  CloudServiceNetworkConnectionFailed: 7,
  CloudServiceRevoked: 8,
  PrivacyAcknowledgementRequired: 9,
  UnauthorizedRequestData: 10,
  InvalidOfferIdentifier: 11,
  InvalidSignature: 12,
  MissingOfferParams: 13,
  InvalidOfferPrice: 14,
  OverlayCancelled: 15,
  IneligibleForOffer: 18,
  UnsupportedPlatform: 19,
};

export declare const SKCloudServiceAuthorizationStatus: {
  NotDetermined: 0,
  Denied: 1,
  Restricted: 2,
  Authorized: 3,
};

export declare const SKDownloadState: {
  Waiting: 0,
  Active: 1,
  Paused: 2,
  Finished: 3,
  Failed: 4,
  Cancelled: 5,
};

export declare const SKProductPeriodUnit: {
  Day: 0,
  Week: 1,
  Month: 2,
  Year: 3,
};

export declare const SKProductDiscountType: {
  Introductory: 0,
  Subscription: 1,
};

export declare const SKProductDiscountPaymentMode: {
  PayAsYouGo: 0,
  PayUpFront: 1,
  FreeTrial: 2,
};

export declare const SKPaymentTransactionState: {
  Purchasing: 0,
  Purchased: 1,
  Failed: 2,
  Restored: 3,
  Deferred: 4,
};

export declare function SKTerminateForInvalidReceipt(): void;

export declare interface SKPaymentTransactionObserver extends NSObjectProtocol {
  paymentQueueUpdatedTransactions(queue: SKPaymentQueue, transactions: NSArray<interop.Object> | Array<interop.Object>): void;

  paymentQueueRemovedTransactions?(queue: SKPaymentQueue, transactions: NSArray<interop.Object> | Array<interop.Object>): void;

  paymentQueueRestoreCompletedTransactionsFailedWithError?(queue: SKPaymentQueue, error: NSError): void;

  paymentQueueRestoreCompletedTransactionsFinished?(queue: SKPaymentQueue): void;

  paymentQueueUpdatedDownloads?(queue: SKPaymentQueue, downloads: NSArray<interop.Object> | Array<interop.Object>): void;

  paymentQueueShouldAddStorePaymentForProduct?(queue: SKPaymentQueue, payment: SKPayment, product: SKProduct): boolean;

  paymentQueueDidChangeStorefront?(queue: SKPaymentQueue): void;

  paymentQueueDidRevokeEntitlementsForProductIdentifiers?(queue: SKPaymentQueue, productIdentifiers: NSArray<interop.Object> | Array<interop.Object>): void;
}

export declare class SKPaymentTransactionObserver extends NativeObject implements SKPaymentTransactionObserver {
}

export declare interface SKProductsRequestDelegate extends SKRequestDelegate {
  productsRequestDidReceiveResponse(request: SKProductsRequest, response: SKProductsResponse): void;
}

export declare class SKProductsRequestDelegate extends NativeObject implements SKProductsRequestDelegate {
}

export declare interface SKRequestDelegate extends NSObjectProtocol {
  requestDidFinish?(request: SKRequest): void;

  requestDidFailWithError?(request: SKRequest, error: NSError): void;
}

export declare class SKRequestDelegate extends NativeObject implements SKRequestDelegate {
}

export declare interface SKStoreProductViewControllerDelegate extends NSObjectProtocol {
  productViewControllerDidFinish?(viewController: SKStoreProductViewController): void;
}

export declare class SKStoreProductViewControllerDelegate extends NativeObject implements SKStoreProductViewControllerDelegate {
}

export declare interface SKPaymentQueueDelegate extends NSObjectProtocol {
  paymentQueueShouldContinueTransactionInStorefront?(paymentQueue: SKPaymentQueue, transaction: SKPaymentTransaction, newStorefront: SKStorefront): boolean;
}

export declare class SKPaymentQueueDelegate extends NativeObject implements SKPaymentQueueDelegate {
}

export declare class SKStoreReviewController extends NSObject {
  static requestReview(): void;
}

export declare class SKStoreProductViewController extends NSViewController {
  delegate: SKStoreProductViewControllerDelegate;

  loadProductWithParametersCompletionBlock(parameters: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, block: (p1: boolean, p2: NSError) => void | null): void;
}

export declare class SKStorefront extends NSObject {
  readonly countryCode: string;

  readonly identifier: string;
}

export declare class SKProductsResponse extends NSObject {
  readonly products: NSArray;

  readonly invalidProductIdentifiers: NSArray;
}

export declare class SKProduct extends NSObject {
  readonly localizedDescription: string;

  readonly localizedTitle: string;

  readonly price: NSDecimalNumber;

  readonly priceLocale: NSLocale;

  readonly productIdentifier: string;

  readonly isDownloadable: boolean;

  readonly downloadable: boolean;

  readonly isFamilyShareable: boolean;

  readonly contentLengths: NSArray;

  readonly downloadContentLengths: NSArray;

  readonly contentVersion: string;

  readonly downloadContentVersion: string;

  readonly subscriptionPeriod: SKProductSubscriptionPeriod;

  readonly introductoryPrice: SKProductDiscount;

  readonly subscriptionGroupIdentifier: string;

  readonly discounts: NSArray;
}

export declare class SKArcadeService extends NSObject {
  static registerArcadeAppWithRandomFromLibRandomFromLibLengthResultHandler(randomFromLib: NSData, randomFromLibLength: number, resultHandler: (p1: NSData, p2: number, p3: NSData, p4: number, p5: NSError) => void | null): void;

  static arcadeSubscriptionStatusWithNonceResultHandler(nonce: number, resultHandler: (p1: NSData, p2: number, p3: NSData, p4: number, p5: NSError) => void | null): void;

  static repairArcadeApp(): void;
}

export declare class SKDownload extends NSObject {
  readonly state: interop.Enum<typeof SKDownloadState>;

  readonly contentLength: NSNumber;

  readonly expectedContentLength: number;

  readonly contentIdentifier: string;

  readonly contentURL: NSURL;

  readonly contentVersion: string;

  readonly error: NSError;

  readonly progress: number;

  readonly timeRemaining: number;

  readonly transaction: SKPaymentTransaction;

  static contentURLForProductID(productID: string): NSURL;

  static deleteContentForProductID(productID: string): void;
}

export declare class SKPaymentDiscount extends NSObject {
  initWithIdentifierKeyIdentifierNonceSignatureTimestamp(identifier: string, keyIdentifier: string, nonce: NSUUID, signature: string, timestamp: NSNumber): this;

  readonly identifier: string;

  readonly keyIdentifier: string;

  readonly nonce: NSUUID;

  readonly signature: string;

  readonly timestamp: NSNumber;
}

export declare class SKPayment extends NSObject implements NSCopying, NSMutableCopying {
  static paymentWithProduct<This extends abstract new (...args: any) => any>(this: This, product: SKProduct): InstanceType<This>;

  readonly productIdentifier: string;

  readonly requestData: NSData;

  readonly quantity: number;

  readonly applicationUsername: string;

  readonly simulatesAskToBuyInSandbox: boolean;

  readonly paymentDiscount: SKPaymentDiscount;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;
}

export declare class SKProductsRequest extends SKRequest {
  initWithProductIdentifiers(productIdentifiers: NSSet): this;

  // @ts-ignore MemberDecl.tsIgnore
  delegate: SKProductsRequestDelegate;
}

export declare class SKRequest extends NSObject {
  delegate: SKRequestDelegate;

  cancel(): void;

  start(): void;
}

export declare class SKProductStorePromotionController extends NSObject {
  static defaultController<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  fetchStorePromotionVisibilityForProductCompletionHandler(product: SKProduct, completionHandler: (p1: interop.Enum<typeof SKProductStorePromotionVisibility>, p2: NSError) => void | null): void;

  updateStorePromotionVisibilityForProductCompletionHandler(promotionVisibility: interop.Enum<typeof SKProductStorePromotionVisibility>, product: SKProduct, completionHandler: (p1: NSError) => void | null): void;

  fetchStorePromotionOrderWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  updateStorePromotionOrderCompletionHandler(promotionOrder: NSArray<interop.Object> | Array<interop.Object>, completionHandler: (p1: NSError) => void | null): void;
}

export declare class SKPaymentTransaction extends NSObject {
  readonly error: NSError;

  readonly originalTransaction: SKPaymentTransaction;

  readonly payment: SKPayment;

  readonly downloads: NSArray;

  readonly transactionDate: NSDate;

  readonly transactionIdentifier: string;

  readonly transactionState: interop.Enum<typeof SKPaymentTransactionState>;
}

export declare class SKReceiptRefreshRequest extends SKRequest {
  initWithReceiptProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): this;

  readonly receiptProperties: NSDictionary;
}

export declare class SKPaymentQueue extends NSObject {
  delegate: SKPaymentQueueDelegate;

  readonly storefront: SKStorefront;

  static defaultQueue<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>;

  static canMakePayments(): boolean;

  addPayment(payment: SKPayment): void;

  restoreCompletedTransactions(): void;

  restoreCompletedTransactionsWithApplicationUsername(username: string | null): void;

  finishTransaction(transaction: SKPaymentTransaction): void;

  startDownloads(downloads: NSArray<interop.Object> | Array<interop.Object>): void;

  pauseDownloads(downloads: NSArray<interop.Object> | Array<interop.Object>): void;

  resumeDownloads(downloads: NSArray<interop.Object> | Array<interop.Object>): void;

  cancelDownloads(downloads: NSArray<interop.Object> | Array<interop.Object>): void;

  addTransactionObserver(observer: SKPaymentTransactionObserver): void;

  removeTransactionObserver(observer: SKPaymentTransactionObserver): void;

  readonly transactionObservers: NSArray;

  readonly transactions: NSArray;
}

export declare class SKProductDiscount extends NSObject {
  readonly price: NSDecimalNumber;

  readonly priceLocale: NSLocale;

  readonly identifier: string;

  readonly subscriptionPeriod: SKProductSubscriptionPeriod;

  readonly numberOfPeriods: number;

  readonly paymentMode: interop.Enum<typeof SKProductDiscountPaymentMode>;

  readonly type: interop.Enum<typeof SKProductDiscountType>;
}

export declare class SKMutablePayment extends SKPayment {
  // @ts-ignore MemberDecl.tsIgnore
  applicationUsername: string;

  // @ts-ignore MemberDecl.tsIgnore
  paymentDiscount: SKPaymentDiscount;

  // @ts-ignore MemberDecl.tsIgnore
  productIdentifier: string;

  // @ts-ignore MemberDecl.tsIgnore
  quantity: number;

  // @ts-ignore MemberDecl.tsIgnore
  requestData: NSData;

  // @ts-ignore MemberDecl.tsIgnore
  simulatesAskToBuyInSandbox: boolean;
}

export declare class SKCloudServiceController extends NSObject {
  static authorizationStatus(): interop.Enum<typeof SKCloudServiceAuthorizationStatus>;

  static requestAuthorization(completionHandler: (p1: interop.Enum<typeof SKCloudServiceAuthorizationStatus>) => void): void;

  requestCapabilitiesWithCompletionHandler(completionHandler: (p1: interop.Enum<typeof SKCloudServiceCapability>, p2: NSError) => void | null): void;

  requestStorefrontCountryCodeWithCompletionHandler(completionHandler: (p1: string, p2: NSError) => void | null): void;

  requestStorefrontIdentifierWithCompletionHandler(completionHandler: (p1: string, p2: NSError) => void | null): void;

  requestUserTokenForDeveloperTokenCompletionHandler(developerToken: string, completionHandler: (p1: string, p2: NSError) => void | null): void;
}

export declare class SKProductSubscriptionPeriod extends NSObject {
  readonly numberOfUnits: number;

  readonly unit: interop.Enum<typeof SKProductPeriodUnit>;
}
