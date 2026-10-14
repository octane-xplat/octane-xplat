/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const CXCallDirectoryPhoneNumberMax: number;

declare class CXProviderConfiguration extends NSObject implements NSCopying {
  readonly localizedName: string;

  ringtoneSound: string;

  iconTemplateImageData: NSData;

  maximumCallGroups: number;

  maximumCallsPerCallGroup: number;

  includesCallsInRecents: boolean;

  supportsVideo: boolean;

  supportsAudioTranslation: boolean;

  supportedHandleTypes: NSSet;

  init(): this;

  initWithLocalizedName(localizedName: string): this;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;
}

