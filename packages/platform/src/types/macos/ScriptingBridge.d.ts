import type { NSArray, NSCoder, NSCoding, NSDictionary, NSError, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { LSLaunchFlags } from './CoreServices'

import { NSMutableArray } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare interface SBApplicationDelegate {
  eventDidFailWithError(event: interop.PointerConvertible, error: NSError): interop.Object;
}

export declare class SBApplicationDelegate extends NativeObject implements SBApplicationDelegate {
}

export declare class SBElementArray<ObjectType = interop.Object> extends NSMutableArray {
  objectWithName(name: string): ObjectType;

  objectWithID(identifier: interop.Object): ObjectType;

  objectAtLocation(location: interop.Object): ObjectType;

  arrayByApplyingSelector(selector: string): NSArray;

  arrayByApplyingSelectorWithObject(aSelector: string, argument: interop.Object): NSArray;

  get(): NSArray;
}

export declare class SBApplication extends SBObject implements NSCoding {
  initWithBundleIdentifier(ident: string): this;

  initWithURL(url: NSURL): this;

  initWithProcessIdentifier(pid: number): this;

  static applicationWithBundleIdentifier(ident: string): SBApplication;

  static applicationWithURL(url: NSURL): SBApplication;

  static applicationWithProcessIdentifier(pid: number): SBApplication;

  classForScriptingClass(className: string): interop.Pointer;

  readonly running: boolean;

  activate(): void;

  delegate: SBApplicationDelegate;

  launchFlags: interop.Enum<typeof LSLaunchFlags>;

  sendMode: number;

  timeout: number;

  isRunning(): boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class SBObject extends NSObject implements NSCoding {
  init(): this;

  initWithProperties(properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): this;

  initWithData(data: interop.Object): this;

  get(): interop.Object;

  lastError(): NSError;

  initWithElementCodePropertiesData(code: number, properties: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, data: interop.Object | null): this;

  propertyWithCode(code: number): SBObject;

  propertyWithClassCode(cls: interop.PointerConvertible, code: number): SBObject;

  elementArrayWithCode(code: number): SBElementArray;

  sendEventIdParameters(eventClass: number, eventID: number, firstParamCode: number): interop.Object;

  setTo(value: interop.Object | null): void;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}
