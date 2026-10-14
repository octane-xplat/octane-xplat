/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const HKObjectQueryNoLimit: number;

declare const HKMedicationGeneralFormUnknown: string;

declare const HKMedicationGeneralFormSuppository: string;

declare const HKMedicationGeneralFormSpray: string;

declare const HKMedicationGeneralFormPowder: string;

declare const HKMedicationGeneralFormInjection: string;

declare const HKMedicationGeneralFormInhaler: string;

declare const HKMedicationGeneralFormFoam: string;

declare const HKMedicationGeneralFormCapsule: string;

declare const HKMedicationGeneralFormDrops: string;

declare const HKMedicationGeneralFormCream: string;

declare const HKMedicationGeneralFormLotion: string;

declare const HKMedicationGeneralFormLiquid: string;

declare const HKMedicationGeneralFormDevice: string;

declare const HKMedicationGeneralFormPatch: string;

declare const HKMedicationGeneralFormOintment: string;

declare const HKCategoryTypeIdentifierAudioExposureEvent: string;

declare const HKMedicationGeneralFormGel: string;

declare const HKMedicationGeneralFormTablet: string;

declare const HKMedicationGeneralFormTopical: string;

declare const HKWorkoutSessionType: {
  Primary: 0,
  Mirrored: 1,
};

declare const HKWorkoutSessionState: {
  NotStarted: 1,
  Running: 2,
  Ended: 3,
  Paused: 4,
  Prepared: 5,
  Stopped: 6,
};

declare const HKCategoryValueAudioExposureEvent: {
  HKCategoryValueAudioExposureEventLoudEnvironment: 1,
};

declare const HKWorkoutActivityType: {
  Dance: 14,
  DanceInspiredTraining: 15,
  MixedMetabolicCardioTraining: 30,
};

declare function HKStateOfMindValenceClassificationForValence(valence: number): NSNumber;

declare interface HKWorkoutSessionDelegate extends NSObjectProtocol {
  workoutSessionDidChangeToStateFromStateDate(workoutSession: HKWorkoutSession, toState: interop.Enum<typeof HKWorkoutSessionState>, fromState: interop.Enum<typeof HKWorkoutSessionState>, date: NSDate): void;

  workoutSessionDidFailWithError(workoutSession: HKWorkoutSession, error: NSError): void;

  workoutSessionDidGenerateEvent?(workoutSession: HKWorkoutSession, event: HKWorkoutEvent): void;

  workoutSessionDidBeginActivityWithConfigurationDate?(workoutSession: HKWorkoutSession, workoutConfiguration: HKWorkoutConfiguration, date: NSDate): void;

  workoutSessionDidEndActivityWithConfigurationDate?(workoutSession: HKWorkoutSession, workoutConfiguration: HKWorkoutConfiguration, date: NSDate): void;

  workoutSessionDidReceiveDataFromRemoteWorkoutSession?(workoutSession: HKWorkoutSession, data: NSArray<interop.Object> | Array<interop.Object>): void;

  workoutSessionDidDisconnectFromRemoteDeviceWithError?(workoutSession: HKWorkoutSession, error: NSError | null): void;
}

declare class HKWorkoutSessionDelegate extends NativeObject implements HKWorkoutSessionDelegate {
}

declare interface HKLiveWorkoutBuilderDelegate extends NSObjectProtocol {
  workoutBuilderDidCollectDataOfTypes(workoutBuilder: HKLiveWorkoutBuilder, collectedTypes: NSSet): void;

  workoutBuilderDidCollectEvent(workoutBuilder: HKLiveWorkoutBuilder): void;

  workoutBuilderDidBeginActivity?(workoutBuilder: HKLiveWorkoutBuilder, workoutActivity: HKWorkoutActivity): void;

  workoutBuilderDidEndActivity?(workoutBuilder: HKLiveWorkoutBuilder, workoutActivity: HKWorkoutActivity): void;
}

declare class HKLiveWorkoutBuilderDelegate extends NativeObject implements HKLiveWorkoutBuilderDelegate {
}

declare class HKLiveWorkoutDataSource extends NSObject {
  readonly typesToCollect: NSSet;

  initWithHealthStoreWorkoutConfiguration(healthStore: HKHealthStore, configuration: HKWorkoutConfiguration | null): this;

  enableCollectionForTypePredicate(quantityType: HKQuantityType, predicate: NSPredicate | null): void;

  disableCollectionForType(quantityType: HKQuantityType): void;
}

declare class HKWorkoutBuilder extends NSObject {
  readonly device: HKDevice;

  readonly startDate: NSDate;

  readonly endDate: NSDate;

  readonly workoutConfiguration: HKWorkoutConfiguration;

  readonly metadata: NSDictionary;

  readonly workoutEvents: NSArray;

  initWithHealthStoreConfigurationDevice(healthStore: HKHealthStore, configuration: HKWorkoutConfiguration, device: HKDevice | null): this;

  beginCollectionWithStartDateCompletion(startDate: NSDate, completion: (p1: boolean, p2: NSError) => void | null): void;

  addSamplesCompletion(samples: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: boolean, p2: NSError) => void | null): void;

  addWorkoutEventsCompletion(workoutEvents: NSArray<interop.Object> | Array<interop.Object>, completion: (p1: boolean, p2: NSError) => void | null): void;

  addMetadataCompletion(metadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>, completion: (p1: boolean, p2: NSError) => void | null): void;

  endCollectionWithEndDateCompletion(endDate: NSDate, completion: (p1: boolean, p2: NSError) => void | null): void;

  finishWorkoutWithCompletion(completion: (p1: HKWorkout, p2: NSError) => void | null): void;

  discardWorkout(): void;

  elapsedTimeAtDate(date: NSDate): number;

  statisticsForType(quantityType: HKQuantityType): HKStatistics;

  seriesBuilderForType(seriesType: HKSeriesType): HKSeriesBuilder;
}

declare class HKSeriesSample extends NSObject {
  readonly count: number;
}

declare class HKSeriesBuilder extends NSObject {
  discard(): void;
}

declare class HKCumulativeQuantitySeriesSample extends NSObject {
  readonly sum: HKQuantity;
}

declare class HKLiveWorkoutZoneUpdate extends NSObject {
  readonly lastSampleProcessedDate: NSDate;
}

declare class HKWorkoutSession extends NSObject implements NSSecureCoding {
  readonly activityType: interop.Enum<typeof HKWorkoutActivityType>;

  readonly locationType: interop.Enum<typeof HKWorkoutSessionLocationType>;

  readonly workoutConfiguration: HKWorkoutConfiguration;

  delegate: HKWorkoutSessionDelegate;

  readonly state: interop.Enum<typeof HKWorkoutSessionState>;

  readonly type: interop.Enum<typeof HKWorkoutSessionType>;

  readonly startDate: NSDate;

  readonly endDate: NSDate;

  readonly currentActivity: HKWorkoutActivity;

  prepare(): void;

  startActivityWithDate(date: NSDate | null): void;

  stopActivityWithDate(date: NSDate | null): void;

  end(): void;

  pause(): void;

  resume(): void;

  beginNewActivityWithConfigurationDateMetadata(workoutConfiguration: HKWorkoutConfiguration, date: NSDate, metadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  endCurrentActivityOnDate(date: NSDate): void;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

declare class HKLiveWorkoutBuilder extends HKWorkoutBuilder {
  delegate: HKLiveWorkoutBuilderDelegate | null;

  readonly workoutSession: HKWorkoutSession | null;

  shouldCollectWorkoutEvents: boolean;

  dataSource: HKLiveWorkoutDataSource;

  readonly elapsedTime: number;

  readonly currentWorkoutActivity: HKWorkoutActivity;
}

