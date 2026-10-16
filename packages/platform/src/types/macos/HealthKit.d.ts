import type {
	NSArray,
	NSCoder,
	NSDate,
	NSDictionary,
	NSError,
	NSNumber,
	NSPredicate,
	NSSecureCoding,
	NSSet,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const HKObjectQueryNoLimit: number

export declare const HKMedicationGeneralFormUnknown: string

export declare const HKMedicationGeneralFormSuppository: string

export declare const HKMedicationGeneralFormSpray: string

export declare const HKMedicationGeneralFormPowder: string

export declare const HKMedicationGeneralFormInjection: string

export declare const HKMedicationGeneralFormInhaler: string

export declare const HKMedicationGeneralFormFoam: string

export declare const HKMedicationGeneralFormCapsule: string

export declare const HKMedicationGeneralFormDrops: string

export declare const HKMedicationGeneralFormCream: string

export declare const HKMedicationGeneralFormLotion: string

export declare const HKMedicationGeneralFormLiquid: string

export declare const HKMedicationGeneralFormDevice: string

export declare const HKMedicationGeneralFormPatch: string

export declare const HKMedicationGeneralFormOintment: string

export declare const HKCategoryTypeIdentifierAudioExposureEvent: string

export declare const HKMedicationGeneralFormGel: string

export declare const HKMedicationGeneralFormTablet: string

export declare const HKMedicationGeneralFormTopical: string

export declare const HKWorkoutSessionType: {
	Primary: 0
	Mirrored: 1
}

export declare const HKWorkoutSessionState: {
	NotStarted: 1
	Running: 2
	Ended: 3
	Paused: 4
	Prepared: 5
	Stopped: 6
}

export declare const HKCategoryValueAudioExposureEvent: {
	HKCategoryValueAudioExposureEventLoudEnvironment: 1
}

export declare const HKWorkoutActivityType: {
	Dance: 14
	DanceInspiredTraining: 15
	MixedMetabolicCardioTraining: 30
}

export declare function HKStateOfMindValenceClassificationForValence(valence: number): NSNumber

export declare interface HKWorkoutSessionDelegate extends NSObjectProtocol {
	workoutSessionDidChangeToStateFromStateDate(
		workoutSession: HKWorkoutSession,
		toState: interop.Enum<typeof HKWorkoutSessionState>,
		fromState: interop.Enum<typeof HKWorkoutSessionState>,
		date: NSDate,
	): void

	workoutSessionDidFailWithError(workoutSession: HKWorkoutSession, error: NSError): void

	workoutSessionDidGenerateEvent?(workoutSession: HKWorkoutSession, event: HKWorkoutEvent): void

	workoutSessionDidBeginActivityWithConfigurationDate?(
		workoutSession: HKWorkoutSession,
		workoutConfiguration: HKWorkoutConfiguration,
		date: NSDate,
	): void

	workoutSessionDidEndActivityWithConfigurationDate?(
		workoutSession: HKWorkoutSession,
		workoutConfiguration: HKWorkoutConfiguration,
		date: NSDate,
	): void

	workoutSessionDidReceiveDataFromRemoteWorkoutSession?(
		workoutSession: HKWorkoutSession,
		data: NSArray<interop.Object> | Array<interop.Object>,
	): void

	workoutSessionDidDisconnectFromRemoteDeviceWithError?(
		workoutSession: HKWorkoutSession,
		error: NSError | null,
	): void
}

export declare class HKWorkoutSessionDelegate
	extends NativeObject
	implements HKWorkoutSessionDelegate {}

export declare interface HKLiveWorkoutBuilderDelegate extends NSObjectProtocol {
	workoutBuilderDidCollectDataOfTypes(
		workoutBuilder: HKLiveWorkoutBuilder,
		collectedTypes: NSSet,
	): void

	workoutBuilderDidCollectEvent(workoutBuilder: HKLiveWorkoutBuilder): void

	workoutBuilderDidBeginActivity?(
		workoutBuilder: HKLiveWorkoutBuilder,
		workoutActivity: HKWorkoutActivity,
	): void

	workoutBuilderDidEndActivity?(
		workoutBuilder: HKLiveWorkoutBuilder,
		workoutActivity: HKWorkoutActivity,
	): void
}

export declare class HKLiveWorkoutBuilderDelegate
	extends NativeObject
	implements HKLiveWorkoutBuilderDelegate {}

export declare class HKLiveWorkoutDataSource extends NSObject {
	readonly typesToCollect: NSSet

	initWithHealthStoreWorkoutConfiguration(
		healthStore: HKHealthStore,
		configuration: HKWorkoutConfiguration | null,
	): this

	enableCollectionForTypePredicate(
		quantityType: HKQuantityType,
		predicate: NSPredicate | null,
	): void

	disableCollectionForType(quantityType: HKQuantityType): void
}

export declare class HKWorkoutBuilder extends NSObject {
	readonly device: HKDevice

	readonly startDate: NSDate

	readonly endDate: NSDate

	readonly workoutConfiguration: HKWorkoutConfiguration

	readonly metadata: NSDictionary

	readonly workoutEvents: NSArray

	initWithHealthStoreConfigurationDevice(
		healthStore: HKHealthStore,
		configuration: HKWorkoutConfiguration,
		device: HKDevice | null,
	): this

	beginCollectionWithStartDateCompletion(
		startDate: NSDate,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	addSamplesCompletion(
		samples: NSArray<interop.Object> | Array<interop.Object>,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	addWorkoutEventsCompletion(
		workoutEvents: NSArray<interop.Object> | Array<interop.Object>,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	addMetadataCompletion(
		metadata: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	endCollectionWithEndDateCompletion(
		endDate: NSDate,
		completion: (p1: boolean, p2: NSError) => void | null,
	): void

	finishWorkoutWithCompletion(completion: (p1: HKWorkout, p2: NSError) => void | null): void

	discardWorkout(): void

	elapsedTimeAtDate(date: NSDate): number

	statisticsForType(quantityType: HKQuantityType): HKStatistics

	seriesBuilderForType(seriesType: HKSeriesType): HKSeriesBuilder
}

export declare class HKSeriesSample extends NSObject {
	readonly count: number
}

export declare class HKSeriesBuilder extends NSObject {
	discard(): void
}

export declare class HKCumulativeQuantitySeriesSample extends NSObject {
	readonly sum: HKQuantity
}

export declare class HKLiveWorkoutZoneUpdate extends NSObject {
	readonly lastSampleProcessedDate: NSDate
}

export declare class HKWorkoutSession extends NSObject implements NSSecureCoding {
	readonly activityType: interop.Enum<typeof HKWorkoutActivityType>

	readonly locationType: interop.Enum<typeof HKWorkoutSessionLocationType>

	readonly workoutConfiguration: HKWorkoutConfiguration

	delegate: HKWorkoutSessionDelegate

	readonly state: interop.Enum<typeof HKWorkoutSessionState>

	readonly type: interop.Enum<typeof HKWorkoutSessionType>

	readonly startDate: NSDate

	readonly endDate: NSDate

	readonly currentActivity: HKWorkoutActivity

	prepare(): void

	startActivityWithDate(date: NSDate | null): void

	stopActivityWithDate(date: NSDate | null): void

	end(): void

	pause(): void

	resume(): void

	beginNewActivityWithConfigurationDateMetadata(
		workoutConfiguration: HKWorkoutConfiguration,
		date: NSDate,
		metadata:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	endCurrentActivityOnDate(date: NSDate): void

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class HKLiveWorkoutBuilder extends HKWorkoutBuilder {
	delegate: HKLiveWorkoutBuilderDelegate | null

	readonly workoutSession: HKWorkoutSession | null

	shouldCollectWorkoutEvents: boolean

	dataSource: HKLiveWorkoutDataSource

	readonly elapsedTime: number

	readonly currentWorkoutActivity: HKWorkoutActivity
}
