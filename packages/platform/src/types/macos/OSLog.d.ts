import type { NSArray, NSCoder, NSData, NSDate, NSNumber, NSPredicate, NSSecureCoding, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSEnumerator } from './Foundation'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const OSLogEntrySignpostType: {
  Undefined: 0,
  IntervalBegin: 1,
  IntervalEnd: 2,
  Event: 3,
};

export declare const OSLogEntryLogLevel: {
  Undefined: 0,
  Debug: 1,
  Info: 2,
  Notice: 3,
  Error: 4,
  Fault: 5,
};

export declare const OSLogMessageComponentArgumentCategory: {
  Undefined: 0,
  Data: 1,
  Double: 2,
  Int64: 3,
  String: 4,
  UInt64: 5,
};

export declare const OSLogEnumeratorOptions: {
  OSLogEnumeratorReverse: 1,
};

export declare const OSLogEntryStoreCategory: {
  Undefined: 0,
  Metadata: 1,
  ShortTerm: 2,
  LongTermAuto: 3,
  LongTerm1: 4,
  LongTerm3: 5,
  LongTerm7: 6,
  LongTerm14: 7,
  LongTerm30: 8,
};

export declare interface OSLogEntryWithPayload {
  readonly category: string;

  readonly components: NSArray;

  readonly formatString: string;

  readonly subsystem: string;
}

export declare class OSLogEntryWithPayload extends NativeObject implements OSLogEntryWithPayload {
}

export declare interface OSLogEntryFromProcess {
  readonly activityIdentifier: number;

  readonly process: string;

  readonly processIdentifier: number;

  readonly sender: string;

  readonly threadIdentifier: number;
}

export declare class OSLogEntryFromProcess extends NativeObject implements OSLogEntryFromProcess {
}

export declare class OSLogPosition extends NSObject {
}

export declare class OSLogEnumerator extends NSEnumerator {
}

export declare class OSLogEntryLog extends OSLogEntry implements OSLogEntryFromProcess, OSLogEntryWithPayload {
  readonly level: interop.Enum<typeof OSLogEntryLogLevel>;

  readonly activityIdentifier: number;

  readonly process: string;

  readonly processIdentifier: number;

  readonly sender: string;

  readonly threadIdentifier: number;

  readonly category: string;

  readonly components: NSArray;

  readonly formatString: string;

  readonly subsystem: string;
}

export declare class OSLogEntryActivity extends OSLogEntry implements OSLogEntryFromProcess {
  readonly parentActivityIdentifier: number;

  readonly activityIdentifier: number;

  readonly process: string;

  readonly processIdentifier: number;

  readonly sender: string;

  readonly threadIdentifier: number;
}

export declare class OSLogMessageComponent extends NSObject implements NSSecureCoding {
  readonly formatSubstring: string;

  readonly placeholder: string;

  readonly argumentCategory: interop.Enum<typeof OSLogMessageComponentArgumentCategory>;

  readonly argumentDataValue: NSData;

  readonly argumentDoubleValue: number;

  readonly argumentInt64Value: number;

  readonly argumentNumberValue: NSNumber;

  readonly argumentStringValue: string;

  readonly argumentUInt64Value: number;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class OSLogEntrySignpost extends OSLogEntry implements OSLogEntryFromProcess, OSLogEntryWithPayload {
  readonly signpostIdentifier: number;

  readonly signpostName: string;

  readonly signpostType: interop.Enum<typeof OSLogEntrySignpostType>;

  readonly activityIdentifier: number;

  readonly process: string;

  readonly processIdentifier: number;

  readonly sender: string;

  readonly threadIdentifier: number;

  readonly category: string;

  readonly components: NSArray;

  readonly formatString: string;

  readonly subsystem: string;
}

export declare class OSLogEntry extends NSObject {
  readonly composedMessage: string;

  readonly date: NSDate;

  readonly storeCategory: interop.Enum<typeof OSLogEntryStoreCategory>;
}

export declare class OSLogStore extends NSObject {
  static localStoreAndReturnError<This extends abstract new (...args: any) => any>(this: This, error: interop.PointerConvertible): InstanceType<This>;

  static storeWithURLError<This extends abstract new (...args: any) => any>(this: This, url: NSURL, error: interop.PointerConvertible): InstanceType<This>;

  init(): this;

  entriesEnumeratorWithOptionsPositionPredicateError(options: interop.Enum<typeof OSLogEnumeratorOptions>, position: OSLogPosition | null, predicate: NSPredicate | null, error: interop.PointerConvertible): OSLogEnumerator;

  entriesEnumeratorAndReturnError(error: interop.PointerConvertible): OSLogEnumerator;

  positionWithDate(date: NSDate): OSLogPosition;

  positionWithTimeIntervalSinceEnd(seconds: number): OSLogPosition;

  positionWithTimeIntervalSinceLatestBoot(seconds: number): OSLogPosition;
}

export declare class OSLogEntryBoundary extends OSLogEntry {
}
