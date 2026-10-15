import type { NSArray, NSCoder, NSDate, NSError, NSPredicate, NSSecureCoding, NSSet, NSURL, _NSRange } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const CLSContextTopicComputerScienceAndEngineering: string;

export declare const CLSContextTopicWorldLanguage: string;

export declare const CLSContextTopicLiteracyAndWriting: string;

export declare const CLSContextTopicMath: string;

export declare const CLSPredicateKeyPathTitle: string;

export declare const CLSPredicateKeyPathIdentifier: string;

export declare const CLSContextTopicArtsAndMusic: string;

export declare const CLSContextTopicScience: string;

export declare const CLSErrorUnderlyingErrorsKey: string;

export declare const CLSPredicateKeyPathParent: string;

export declare const CLSPredicateKeyPathTopic: string;

export declare const CLSErrorObjectKey: string;

export declare const CLSContextTopicHealthAndFitness: string;

export declare const CLSPredicateKeyPathDateCreated: string;

export declare const CLSPredicateKeyPathUniversalLinkURL: string;

export declare const CLSErrorCodeDomain: string;

export declare const CLSContextTopicSocialScience: string;

export declare const CLSProgressReportingCapabilityKind: {
  Duration: 0,
  Percent: 1,
  Binary: 2,
  Quantity: 3,
  Score: 4,
};

export declare const CLSContextType: {
  None: 0,
  App: 1,
  Chapter: 2,
  Section: 3,
  Level: 4,
  Page: 5,
  Task: 6,
  Challenge: 7,
  Quiz: 8,
  Exercise: 9,
  Lesson: 10,
  Book: 11,
  Game: 12,
  Document: 13,
  Audio: 14,
  Video: 15,
  Course: 16,
  Custom: 17,
};

export declare const CLSBinaryValueType: {
  TrueFalse: 0,
  PassFail: 1,
  YesNo: 2,
  CorrectIncorrect: 3,
};

export declare const CLSErrorCode: {
  None: 0,
  ClassKitUnavailable: 1,
  InvalidArgument: 2,
  InvalidModification: 3,
  AuthorizationDenied: 4,
  DatabaseInaccessible: 5,
  Limits: 6,
  InvalidCreate: 7,
  InvalidUpdate: 8,
  PartialFailure: 9,
};

export declare interface CLSContextProvider {
  updateDescendantsOfContextCompletion(context: CLSContext, completion: (p1: NSError) => void | null): void;
}

export declare class CLSContextProvider extends NativeObject implements CLSContextProvider {
}

export declare interface CLSDataStoreDelegate extends NSObjectProtocol {
  createContextForIdentifierParentContextParentIdentifierPath(identifier: string, parentContext: CLSContext, parentIdentifierPath: NSArray<interop.Object> | Array<interop.Object>): CLSContext;
}

export declare class CLSDataStoreDelegate extends NativeObject implements CLSDataStoreDelegate {
}

export declare class CLSQuantityItem extends CLSActivityItem {
  quantity: number;

  initWithIdentifierTitle(identifier: string, title: string): this;
}

export declare class CLSActivityItem extends CLSObject {
  title: string;

  readonly identifier: string;
}

export declare class CLSActivity extends CLSObject {
  progress: number;

  readonly duration: number;

  primaryActivityItem: CLSActivityItem;

  addProgressRangeFromStartToEnd(start: number, end: number): void;

  addAdditionalActivityItem(activityItem: CLSActivityItem): void;

  readonly additionalActivityItems: NSArray;

  readonly started: boolean;

  start(): void;

  stop(): void;

  isStarted(): boolean;
}

export declare class CLSObject extends NSObject implements NSSecureCoding {
  readonly dateCreated: NSDate;

  readonly dateLastModified: NSDate;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class CLSDataStore extends NSObject {
  static readonly shared: CLSDataStore;

  readonly mainAppContext: CLSContext;

  readonly activeContext: CLSContext;

  readonly runningActivity: CLSActivity;

  delegate: CLSDataStoreDelegate;

  saveWithCompletion(completion: (p1: NSError) => void | null): void;

  completeAllAssignedActivitiesMatching(contextPath: NSArray<interop.Object> | Array<interop.Object>): void;

  contextsMatchingPredicateCompletion(predicate: NSPredicate, completion: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  contextsMatchingIdentifierPathCompletion(identifierPath: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null): void;

  removeContext(context: CLSContext): void;
}

export declare class CLSBinaryItem extends CLSActivityItem {
  value: boolean;

  readonly valueType: interop.Enum<typeof CLSBinaryValueType>;

  initWithIdentifierTitleType(identifier: string, title: string, valueType: interop.Enum<typeof CLSBinaryValueType>): this;
}

export declare class CLSScoreItem extends CLSActivityItem {
  score: number;

  maxScore: number;

  initWithIdentifierTitleScoreMaxScore(identifier: string, title: string, score: number, maxScore: number): this;
}

export declare class CLSProgressReportingCapability extends CLSObject {
  readonly kind: interop.Enum<typeof CLSProgressReportingCapabilityKind>;

  readonly details: string;

  initWithKindDetails(kind: interop.Enum<typeof CLSProgressReportingCapabilityKind>, details: string | null): this;
}

export declare class CLSContext extends CLSObject {
  readonly identifierPath: NSArray;

  readonly identifier: string;

  universalLinkURL: NSURL;

  readonly type: interop.Enum<typeof CLSContextType>;

  customTypeName: string;

  title: string;

  displayOrder: number;

  topic: string;

  assignable: boolean;

  suggestedAge: _NSRange;

  suggestedCompletionTime: _NSRange;

  readonly progressReportingCapabilities: NSSet;

  summary: string;

  thumbnail: interop.Object;

  initWithTypeIdentifierTitle(type: interop.Enum<typeof CLSContextType>, identifier: string, title: string): this;

  readonly active: boolean;

  becomeActive(): void;

  resignActive(): void;

  addProgressReportingCapabilities(capabilities: NSSet): void;

  resetProgressReportingCapabilities(): void;

  isAssignable(): boolean;

  isActive(): boolean;

  readonly parent: CLSContext;

  removeFromParent(): void;

  addChildContext(child: CLSContext): void;

  descendantMatchingIdentifierPathCompletion(identifierPath: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: CLSContext, p2: NSError) => void | null): void;

  readonly currentActivity: CLSActivity;

  createNewActivity(): CLSActivity;
}
