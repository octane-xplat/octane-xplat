import type { NSCopying, NSData, NSSet } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const CXCallDirectoryPhoneNumberMax: number;

export declare class CXProviderConfiguration extends NSObject implements NSCopying {
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
