import type { NSData, NSDictionary, NSSet } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const PKPushTypeFileProvider: string;

export declare interface PKPushRegistryDelegate extends NSObjectProtocol {
  pushRegistryDidUpdatePushCredentialsForType(registry: PKPushRegistry, pushCredentials: PKPushCredentials, type: string): void;

  pushRegistryDidReceiveIncomingPushWithPayloadForTypeWithCompletionHandler?(registry: PKPushRegistry, payload: PKPushPayload, type: string, completion: () => void): void;

  pushRegistryDidInvalidatePushTokenForType?(registry: PKPushRegistry, type: string): void;
}

export declare class PKPushRegistryDelegate extends NativeObject implements PKPushRegistryDelegate {
}

export declare class PKPushPayload extends NSObject {
  readonly type: string;

  readonly dictionaryPayload: NSDictionary;
}

export declare class PKPushCredentials extends NSObject {
  readonly type: string;

  readonly token: NSData;
}

export declare class PKPushRegistry extends NSObject {
  delegate: PKPushRegistryDelegate;

  desiredPushTypes: NSSet;

  pushTokenForType(type: string): NSData;

  initWithQueue(queue: NSObject | null): this;
}
