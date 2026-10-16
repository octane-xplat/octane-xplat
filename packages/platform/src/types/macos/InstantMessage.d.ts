import type { ABPerson } from './AddressBook'

import type { NSArray, NSDate, NSDictionary, NSNotificationCenter, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSComparisonResult } from './Foundation'

import { NSObject } from './Runtime'

export declare const IMAVRunning: number

export declare const IMAVRequested: number

export declare const IMCapabilityVideoConference: string

export declare const IMCapabilityAudioConference: string

export declare const IMCapabilityFileSharing: string

export declare const IMCapabilityFileTransfer: string

export declare const IMPersonAVBusyKey: string

export declare const IMPersonPictureDataKey: string

export declare const IMPersonEmailKey: string

export declare const IMPersonLastNameKey: string

export declare const IMPersonFirstNameKey: string

export declare const IMPersonIdleSinceKey: string

export declare const IMPersonStatusMessageKey: string

export declare const IMPersonStatusKey: string

export declare const IMPersonScreenNameKey: string

export declare const IMPersonStatusNoStatus: number

export declare const IMPersonStatusAway: number

export declare const IMServiceStatusLoggedIn: number

export declare const IMServiceStatusLoggingIn: number

export declare const IMServiceStatusLoggingOut: number

export declare const IMServiceStatusDisconnected: number

export declare const IMPersonInfoChangedNotification: string

export declare const IMPersonStatusChangedNotification: string

export declare const IMPersonStatusAvailable: number

export declare const IMAVPending: number

export declare const IMServiceStatusLoggedOut: number

export declare const IMServiceStatusChangedNotification: string

export declare const IMAVShuttingDown: number

export declare const IMPersonStatusOffline: number

export declare const IMVideoOptimizationDefault: number

export declare const IMVideoOptimizationStills: number

export declare const IMAVInactive: number

export declare const IMCapabilityDirectIM: string

export declare const IMStatusImagesChangedAppearanceNotification: string

export declare const IMPersonStatusIdle: number

export declare const IMPersonStatusUnknown: number

export declare const IMAVStartingUp: number

export declare const IMPersonServiceNameKey: string

export declare const IMCapabilityText: string

export declare const IMAVManagerStateChangedNotification: string

export declare const IMVideoOptimizationReplacement: number

export declare const IMAVManagerURLToShareChangedNotification: string

export declare const IMMyStatusChangedNotification: string

export declare const IMPersonCapabilitiesKey: string

export declare function IMComparePersonStatus(
	status: number,
	compareTo: number,
): interop.Enum<typeof NSComparisonResult>

export declare class IMService extends NSObject {
	static imageNameForStatus(status: number): string

	static allServices(): NSArray

	static serviceWithName(name: string): IMService

	static notificationCenter(): NSNotificationCenter

	static myStatus(): number

	static myIdleTime(): NSDate

	localizedName(): string

	localizedShortName(): string

	name(): string

	status(): number

	infoForScreenName(screenName: string): NSDictionary

	infoForAllScreenNames(): NSArray

	infoForPreferredScreenNames(): NSArray

	peopleWithScreenName(screenName: string): NSArray

	screenNamesForPerson(person: ABPerson): NSArray

	static imageURLForStatus(status: number): NSURL
}

export declare class IMAVControlBar extends NSObject {
	controls(): NSArray

	addControl(control: IMAVControl): void

	removeControl(control: IMAVControl): void

	removeAllControls(): void
}

export declare class IMAVSlider extends IMAVControl {
	minValue(): number

	setMinValue(aDouble: number): void

	maxValue(): number

	setMaxValue(aDouble: number): void

	static timeSlider(): IMAVSlider
}

export declare class IMAVControl extends NSObject {
	target(): interop.Object

	setTarget(anObject: interop.Object): void

	action(): string

	setAction(aSelector: string): void

	tag(): number

	setTag(anInt: number): void

	isEnabled(): boolean

	setEnabled(flag: boolean): void

	integerValue(): number

	setIntegerValue(anInteger: number): void

	intValue(): number

	setIntValue(anInt: number): void

	floatValue(): number

	setFloatValue(aFloat: number): void

	doubleValue(): number

	setDoubleValue(aDouble: number): void
}

export declare class IMAVButton extends IMAVControl {
	state(): number

	setState(value: number): void

	static playPauseButton(): IMAVButton

	static forwardButton(): IMAVButton

	static backwardButton(): IMAVButton

	static muteButton(): IMAVButton
}

export declare class IMAVManager extends NSObject {
	static sharedAVManager(): IMAVManager

	state(): number

	URLToShare(): NSURL

	setVideoDataSource(dataSource: interop.Object): void

	videoDataSource(): interop.Object

	setVideoOptimizationOptions(options: number): void

	videoOptimizationOptions(): number

	setNumberOfAudioChannels(count: number): void

	numberOfAudioChannels(): number

	audioDeviceUID(): string

	audioDeviceChannels(): NSArray

	controlBar(): IMAVControlBar

	start(): void

	stop(): void
}
