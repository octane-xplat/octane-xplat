import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const NSHandleOtherExceptionMask: number;

export declare const NSHandleUncaughtSystemExceptionMask: number;

export declare const NSLogUncaughtSystemExceptionMask: number;

export declare const NSUncaughtRuntimeErrorException: string;

export declare const NSUncaughtSystemExceptionException: string;

export declare const NSLogOtherExceptionMask: number;

export declare const NSHandleUncaughtRuntimeErrorMask: number;

export declare const NSHangOnUncaughtExceptionMask: number;

export declare const NSHangOnTopLevelExceptionMask: number;

export declare const NSStackTraceKey: string;

export declare const NSHangOnOtherExceptionMask: number;

export declare const NSLogTopLevelExceptionMask: number;

export declare const NSHangOnUncaughtRuntimeErrorMask: number;

export declare const NSLogUncaughtRuntimeErrorMask: number;

export declare const NSHandleUncaughtExceptionMask: number;

export declare const NSHandleTopLevelExceptionMask: number;

export declare const NSHangOnUncaughtSystemExceptionMask: number;

export declare const NSLogUncaughtExceptionMask: number;

export declare function NSExceptionHandlerResume(): void;

export declare class NSExceptionHandler extends NSObject {
  static defaultExceptionHandler(): NSExceptionHandler;

  setExceptionHandlingMask(aMask: number): void;

  exceptionHandlingMask(): number;

  setExceptionHangingMask(aMask: number): void;

  exceptionHangingMask(): number;

  setDelegate(anObject: interop.Object): void;

  delegate(): interop.Object;
}
