import type { CLPlacemark } from './CoreLocation'

import type { EKRecurrenceRule } from './EventKit'

import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSData,
	NSDate,
	NSDateComponents,
	NSDateInterval,
	NSError,
	NSMeasurement,
	NSNumber,
	NSPersonNameComponents,
	NSSecureCoding,
	NSURL,
	NSUserActivity,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const INPersonRelationshipDaughter: string

export declare const INPersonHandleLabelSchool: string

export declare const INPersonHandleLabelOther: string

export declare const INPersonHandleLabelPager: string

export declare const INPersonHandleLabelWorkFax: string

export declare const INPersonHandleLabelHomeFax: string

export declare const INPersonHandleLabelMain: string

export declare const INPersonHandleLabelWork: string

export declare const INPersonHandleLabelHome: string

export declare const IntentsVersionString: interop.Pointer

export declare const IntentsVersionNumber: number

export declare const INPersonRelationshipSon: string

export declare const INPersonHandleLabelMobile: string

export declare const INIntentErrorDomain: string

export declare const INPersonHandleLabeliPhone: string

export declare const INGetAvailableRestaurantReservationBookingDefaultsIntentResponseCode: {
	Success: 0
	Failure: 1
	Unspecified: 2
}

export declare const INGetAvailableRestaurantReservationBookingsIntentCode: {
	Success: 0
	Failure: 1
	FailureRequestUnsatisfiable: 2
	FailureRequestUnspecified: 3
}

export declare const INBookRestaurantReservationIntentCode: {
	Success: 0
	Denied: 1
	Failure: 2
	FailureRequiringAppLaunch: 3
	FailureRequiringAppLaunchMustVerifyCredentials: 4
	FailureRequiringAppLaunchServiceTemporarilyUnavailable: 5
}

export declare const INPersonSuggestionType: {
	None: 0
	SocialProfile: 1
	InstantMessageAddress: 2
}

export declare const INPersonHandleType: {
	Unknown: 0
	EmailAddress: 1
	PhoneNumber: 2
}

export declare const INTicketedEventCategory: {
	Unknown: 0
	Movie: 1
}

export declare const INReservationStatus: {
	Unknown: 0
	Canceled: 1
	Pending: 2
	Hold: 3
	Confirmed: 4
}

export declare const INReservationActionType: {
	Unknown: 0
	CheckIn: 1
}

export declare const INGetReservationDetailsIntentResponseCode: {
	Unspecified: 0
	Ready: 1
	InProgress: 2
	Success: 3
	Failure: 4
	FailureRequiringAppLaunch: 5
}

export declare const INInteractionDirection: {
	Unspecified: 0
	Outgoing: 1
	Incoming: 2
}

export declare const INIntentHandlingStatus: {
	Unspecified: 0
	Ready: 1
	InProgress: 2
	Success: 3
	Failure: 4
	DeferredToApplication: 5
	UserConfirmationRequired: 6
}

export declare const INIntentErrorCode: {
	InteractionOperationNotSupported: 1900
	DonatingInteraction: 1901
	DeletingAllInteractions: 1902
	DeletingInteractionWithIdentifiers: 1903
	DeletingInteractionWithGroupIdentifier: 1904
	IntentSupportedByMultipleExtension: 2001
	RestrictedIntentsNotSupportedByExtension: 2002
	NoHandlerProvidedForIntent: 2003
	InvalidIntentName: 2004
	NoAppAvailable: 2005
	RequestTimedOut: 3001
	MissingInformation: 3002
	InvalidUserVocabularyFileLocation: 4000
	ExtensionLaunchingTimeout: 5000
	ExtensionBringUpFailed: 5001
	ImageGeneric: 6000
	ImageNoServiceAvailable: 6001
	ImageStorageFailed: 6002
	ImageLoadingFailed: 6003
	ImageRetrievalFailed: 6004
	ImageProxyLoop: 6005
	ImageProxyInvalid: 6006
	ImageProxyTimeout: 6007
	ImageServiceFailure: 6008
	ImageScalingFailed: 6009
	PermissionDenied: 6010
	VoiceShortcutCreationFailed: 7000
	VoiceShortcutGetFailed: 7001
	VoiceShortcutDeleteFailed: 7002
	EncodingGeneric: 8000
	EncodingFailed: 8001
	DecodingGeneric: 9000
	UnableToCreateAppIntentRepresentation: 10000
	NoAppIntent: 10001
}

export declare const INRestaurantReservationUserBookingStatus: {
	Pending: 0
	Confirmed: 1
	Denied: 2
}

export declare const INPaymentMethodType: {
	Unknown: 0
	Checking: 1
	Savings: 2
	Brokerage: 3
	Debit: 4
	Credit: 5
	Prepaid: 6
	Store: 7
	ApplePay: 8
}

export declare const INGetUserCurrentRestaurantReservationBookingsIntentResponseCode: {
	Success: 0
	Failure: 1
	FailureRequestUnsatisfiable: 2
	Unspecified: 3
}

export declare const INRecurrenceFrequency: {
	Unknown: 0
	Minute: 1
	Hourly: 2
	Daily: 3
	Weekly: 4
	Monthly: 5
	Yearly: 6
}

export declare const INGetRestaurantGuestIntentResponseCode: {
	Success: 0
	Failure: 1
}

export declare interface INSpeakable extends NSObjectProtocol {
	readonly spokenPhrase: string

	readonly pronunciationHint: string

	readonly vocabularyIdentifier: string

	readonly alternativeSpeakableMatches: NSArray

	readonly identifier?: string
}

export declare class INSpeakable extends NativeObject implements INSpeakable {}

export declare interface INIntentHandlerProviding extends NSObjectProtocol {
	handlerForIntent(intent: INIntent): interop.Object
}

export declare class INIntentHandlerProviding
	extends NativeObject
	implements INIntentHandlerProviding {}

export declare class INBusReservation extends INReservation implements NSCopying, NSSecureCoding {
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLReservedSeatBusTrip(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		reservedSeat: INSeat | null,
		busTrip: INBusTrip | null,
	): this

	readonly reservedSeat: INSeat

	readonly busTrip: INBusTrip

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INTicketedEventReservation
	extends INReservation
	implements NSCopying, NSSecureCoding
{
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLReservedSeatEvent(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		reservedSeat: INSeat | null,
		event: INTicketedEvent,
	): this

	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsReservedSeatEvent(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		reservedSeat: INSeat | null,
		event: INTicketedEvent,
	): this

	readonly event: INTicketedEvent

	readonly reservedSeat: INSeat

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INRestaurantReservation
	extends INReservation
	implements NSCopying, NSSecureCoding
{
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLReservationDurationPartySizeRestaurantLocation(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		reservationDuration: INDateComponentsRange,
		partySize: NSNumber | null,
		restaurantLocation: CLPlacemark,
	): this

	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsReservationDurationPartySizeRestaurantLocation(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		reservationDuration: INDateComponentsRange,
		partySize: NSNumber | null,
		restaurantLocation: CLPlacemark,
	): this

	readonly reservationDuration: INDateComponentsRange

	readonly partySize: NSNumber

	readonly restaurantLocation: CLPlacemark

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INReservationAction extends NSObject implements NSCopying, NSSecureCoding {
	initWithTypeValidDurationUserActivity(
		type: interop.Enum<typeof INReservationActionType>,
		validDuration: INDateComponentsRange,
		userActivity: NSUserActivity,
	): this

	readonly type: interop.Enum<typeof INReservationActionType>

	readonly validDuration: INDateComponentsRange

	readonly userActivity: NSUserActivity

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INTimeIntervalResolutionResult extends INIntentResolutionResult {
	static successWithResolvedTimeInterval<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedTimeInterval: number,
	): InstanceType<This>

	static confirmationRequiredWithTimeIntervalToConfirm<
		This extends abstract new (...args: any) => any,
	>(this: This, timeIntervalToConfirm: number): InstanceType<This>
}

export declare class INObjectResolutionResult extends INIntentResolutionResult {
	static successWithResolvedObject<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedObject: INObject,
	): InstanceType<This>

	static disambiguationWithObjectsToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		objectsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithObjectToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		objectToConfirm: INObject | null,
	): InstanceType<This>
}

export declare class INEnumResolutionResult extends INIntentResolutionResult {
	static successWithResolvedValue<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedValue: number,
	): InstanceType<This>

	static confirmationRequiredWithValueToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		valueToConfirm: number,
	): InstanceType<This>
}

export declare class INEnergyResolutionResult extends INIntentResolutionResult {
	static successWithResolvedEnergy<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedEnergy: NSMeasurement,
	): InstanceType<This>

	static disambiguationWithEnergyToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		energyToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithEnergyToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		energyToConfirm: NSMeasurement | null,
	): InstanceType<This>
}

export declare class INVolumeResolutionResult extends INIntentResolutionResult {
	static successWithResolvedVolume<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedVolume: NSMeasurement,
	): InstanceType<This>

	static disambiguationWithVolumeToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		volumeToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithVolumeToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		volumeToConfirm: NSMeasurement | null,
	): InstanceType<This>
}

export declare class INTemperatureResolutionResult extends INIntentResolutionResult {
	static successWithResolvedTemperature<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedTemperature: NSMeasurement,
	): InstanceType<This>

	static disambiguationWithTemperaturesToDisambiguate<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		temperaturesToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithTemperatureToConfirm<
		This extends abstract new (...args: any) => any,
	>(this: This, temperatureToConfirm: NSMeasurement | null): InstanceType<This>
}

export declare class INPlacemarkResolutionResult extends INIntentResolutionResult {
	static successWithResolvedPlacemark<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedPlacemark: CLPlacemark,
	): InstanceType<This>

	static disambiguationWithPlacemarksToDisambiguate<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		placemarksToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithPlacemarkToConfirm<
		This extends abstract new (...args: any) => any,
	>(this: This, placemarkToConfirm: CLPlacemark | null): InstanceType<This>
}

export declare class INIntegerResolutionResult extends INIntentResolutionResult {
	static successWithResolvedValue<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedValue: number,
	): InstanceType<This>

	static confirmationRequiredWithValueToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		valueToConfirm: NSNumber | null,
	): InstanceType<This>
}

export declare class INPerson extends NSObject implements NSCopying, NSSecureCoding, INSpeakable {
	initWithPersonHandleNameComponentsDisplayNameImageContactIdentifierCustomIdentifier(
		personHandle: INPersonHandle,
		nameComponents: NSPersonNameComponents | null,
		displayName: string | null,
		image: INImage | null,
		contactIdentifier: string | null,
		customIdentifier: string | null,
	): this

	initWithPersonHandleNameComponentsDisplayNameImageContactIdentifierCustomIdentifierRelationship(
		personHandle: INPersonHandle,
		nameComponents: NSPersonNameComponents | null,
		displayName: string | null,
		image: INImage | null,
		contactIdentifier: string | null,
		customIdentifier: string | null,
		relationship: string | null,
	): this

	initWithPersonHandleNameComponentsDisplayNameImageContactIdentifierCustomIdentifierIsMe(
		personHandle: INPersonHandle,
		nameComponents: NSPersonNameComponents | null,
		displayName: string | null,
		image: INImage | null,
		contactIdentifier: string | null,
		customIdentifier: string | null,
		isMe: boolean,
	): this

	readonly personHandle: INPersonHandle

	readonly nameComponents: NSPersonNameComponents

	readonly displayName: string

	readonly image: INImage

	readonly contactIdentifier: string

	readonly customIdentifier: string

	readonly relationship: string

	readonly aliases: NSArray

	readonly suggestionType: interop.Enum<typeof INPersonSuggestionType>

	initWithPersonHandleNameComponentsDisplayNameImageContactIdentifierCustomIdentifierAliasesSuggestionType(
		personHandle: INPersonHandle,
		nameComponents: NSPersonNameComponents | null,
		displayName: string | null,
		image: INImage | null,
		contactIdentifier: string | null,
		customIdentifier: string | null,
		aliases: NSArray<interop.Object> | Array<interop.Object> | null,
		suggestionType: interop.Enum<typeof INPersonSuggestionType>,
	): this

	readonly isMe: boolean

	readonly handle: string

	initWithHandleNameComponentsContactIdentifier(
		handle: string,
		nameComponents: NSPersonNameComponents,
		contactIdentifier: string | null,
	): this

	initWithHandleDisplayNameContactIdentifier(
		handle: string,
		displayName: string | null,
		contactIdentifier: string | null,
	): this

	initWithHandleNameComponentsDisplayNameImageContactIdentifier(
		handle: string,
		nameComponents: NSPersonNameComponents | null,
		displayName: string | null,
		image: INImage | null,
		contactIdentifier: string | null,
	): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	readonly spokenPhrase: string

	readonly pronunciationHint: string

	readonly vocabularyIdentifier: string

	readonly alternativeSpeakableMatches: NSArray

	readonly identifier: string

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class INObject extends NSObject implements INSpeakable, NSCopying, NSSecureCoding {
	initWithIdentifierDisplayStringPronunciationHint(
		identifier: string | null,
		displayString: string,
		pronunciationHint: string | null,
	): this

	initWithIdentifierDisplayString(identifier: string | null, displayString: string): this

	initWithIdentifierDisplayStringSubtitleStringDisplayImage(
		identifier: string | null,
		displayString: string,
		subtitleString: string | null,
		displayImage: INImage | null,
	): this

	initWithIdentifierDisplayStringPronunciationHintSubtitleStringDisplayImage(
		identifier: string | null,
		displayString: string,
		pronunciationHint: string | null,
		subtitleString: string | null,
		displayImage: INImage | null,
	): this

	readonly identifier: string

	readonly displayString: string

	readonly pronunciationHint: string

	subtitleString: string

	displayImage: INImage

	get alternativeSpeakableMatches(): NSArray
	set alternativeSpeakableMatches(value: NSArray<interop.Object> | Array<interop.Object>)

	readonly spokenPhrase: string

	readonly vocabularyIdentifier: string

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INTicketedEvent extends NSObject implements NSCopying, NSSecureCoding {
	initWithCategoryNameEventDurationLocation(
		category: interop.Enum<typeof INTicketedEventCategory>,
		name: string,
		eventDuration: INDateComponentsRange,
		location: CLPlacemark | null,
	): this

	readonly category: interop.Enum<typeof INTicketedEventCategory>

	readonly name: string

	readonly eventDuration: INDateComponentsRange

	readonly location: CLPlacemark

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INPaymentMethod extends NSObject implements NSCopying, NSSecureCoding {
	initWithTypeNameIdentificationHintIcon(
		type: interop.Enum<typeof INPaymentMethodType>,
		name: string | null,
		identificationHint: string | null,
		icon: INImage | null,
	): this

	readonly type: interop.Enum<typeof INPaymentMethodType>

	readonly name: string

	readonly icon: INImage

	readonly identificationHint: string

	static applePayPaymentMethod<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INFileResolutionResult extends INIntentResolutionResult {
	static successWithResolvedFile<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedFile: INFile,
	): InstanceType<This>

	static disambiguationWithFilesToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		filesToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithFileToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		fileToConfirm: INFile | null,
	): InstanceType<This>
}

export declare class INBoatTrip extends NSObject implements NSCopying, NSSecureCoding {
	initWithProviderBoatNameBoatNumberTripDurationDepartureBoatTerminalLocationArrivalBoatTerminalLocation(
		provider: string | null,
		boatName: string | null,
		boatNumber: string | null,
		tripDuration: INDateComponentsRange,
		departureBoatTerminalLocation: CLPlacemark,
		arrivalBoatTerminalLocation: CLPlacemark,
	): this

	readonly provider: string

	readonly boatName: string

	readonly boatNumber: string

	readonly tripDuration: INDateComponentsRange

	readonly departureBoatTerminalLocation: CLPlacemark

	readonly arrivalBoatTerminalLocation: CLPlacemark

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INAirportGate extends NSObject implements NSCopying, NSSecureCoding {
	initWithAirportTerminalGate(
		airport: INAirport,
		terminal: string | null,
		gate: string | null,
	): this

	readonly airport: INAirport

	readonly terminal: string

	readonly gate: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INGetReservationDetailsIntentResponse extends INIntentResponse {
	initWithCodeUserActivity(
		code: interop.Enum<typeof INGetReservationDetailsIntentResponseCode>,
		userActivity: NSUserActivity | null,
	): this

	readonly code: interop.Enum<typeof INGetReservationDetailsIntentResponseCode>

	get reservations(): NSArray
	set reservations(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class INObjectCollection<ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	readonly sections: NSArray

	readonly allItems: NSArray

	usesIndexedCollation: boolean

	initWithSections(sections: NSArray<interop.Object> | Array<interop.Object>): this

	initWithItems(items: NSArray<interop.Object> | Array<interop.Object>): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INObjectSection<ObjectType = interop.Object>
	extends NSObject
	implements NSCopying, NSSecureCoding
{
	readonly title: string

	readonly items: NSArray

	initWithTitleItems(
		title: string | null,
		items: NSArray<interop.Object> | Array<interop.Object>,
	): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INInteraction extends NSObject implements NSSecureCoding, NSCopying {
	initWithIntentResponse(intent: INIntent, response: INIntentResponse | null): this

	donateInteractionWithCompletion(completion: (p1: NSError) => void | null): void

	static deleteAllInteractionsWithCompletion(completion: (p1: NSError) => void | null): void

	static deleteInteractionsWithIdentifiersCompletion(
		identifiers: NSArray<interop.Object> | Array<interop.Object>,
		completion: (p1: NSError) => void | null,
	): void

	static deleteInteractionsWithGroupIdentifierCompletion(
		groupIdentifier: string,
		completion: (p1: NSError) => void | null,
	): void

	readonly intent: INIntent

	readonly intentResponse: INIntentResponse

	readonly intentHandlingStatus: interop.Enum<typeof INIntentHandlingStatus>

	direction: interop.Enum<typeof INInteractionDirection>

	dateInterval: NSDateInterval

	identifier: string

	groupIdentifier: string

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class INGetReservationDetailsIntent extends INIntent {
	initWithReservationContainerReferenceReservationItemReferences(
		reservationContainerReference: INSpeakableString | null,
		reservationItemReferences: NSArray<interop.Object> | Array<interop.Object> | null,
	): this

	readonly reservationContainerReference: INSpeakableString

	readonly reservationItemReferences: NSArray
}

export declare class INIntentResponse extends NSObject implements NSCopying, NSSecureCoding {
	userActivity: NSUserActivity

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INIntent extends NSObject implements NSCopying, NSSecureCoding {
	readonly identifier: string

	readonly intentDescription: string

	suggestedInvocationPhrase: string

	setImageForParameterNamed(image: INImage | null, parameterName: string): void

	imageForParameterNamed(parameterName: string): INImage | null

	keyImage(): INImage | null

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INReservation extends NSObject implements NSCopying, NSSecureCoding {
	readonly itemReference: INSpeakableString

	readonly reservationNumber: string

	readonly bookingTime: NSDate

	readonly reservationStatus: interop.Enum<typeof INReservationStatus>

	readonly reservationHolderName: string

	readonly actions: NSArray

	readonly URL: NSURL

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INPaymentMethodResolutionResult extends INIntentResolutionResult {
	static successWithResolvedPaymentMethod<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedPaymentMethod: INPaymentMethod,
	): InstanceType<This>

	static disambiguationWithPaymentMethodsToDisambiguate<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		paymentMethodsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithPaymentMethodToConfirm<
		This extends abstract new (...args: any) => any,
	>(this: This, paymentMethodToConfirm: INPaymentMethod | null): InstanceType<This>
}

export declare class INIntentResolutionResult extends NSObject {
	static needsValue<This extends abstract new (...args: any) => any>(this: This): InstanceType<This>

	static notRequired<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static unsupported<This extends abstract new (...args: any) => any>(
		this: This,
	): InstanceType<This>

	static unsupportedWithReason<This extends abstract new (...args: any) => any>(
		this: This,
		reason: number,
	): InstanceType<This>

	static confirmationRequiredWithItemToConfirmForReason<
		This extends abstract new (...args: any) => any,
	>(this: This, itemToConfirm: interop.Object, reason: number): InstanceType<This>
}

export declare class INBoatReservation extends INReservation implements NSCopying, NSSecureCoding {
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLReservedSeatBoatTrip(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		reservedSeat: INSeat | null,
		boatTrip: INBoatTrip | null,
	): this

	readonly reservedSeat: INSeat

	readonly boatTrip: INBoatTrip

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INSpeedResolutionResult extends INIntentResolutionResult {
	static successWithResolvedSpeed<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedSpeed: NSMeasurement,
	): InstanceType<This>

	static disambiguationWithSpeedToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		speedToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithSpeedToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		speedToConfirm: NSMeasurement | null,
	): InstanceType<This>
}

export declare class INTrainTrip extends NSObject implements NSCopying, NSSecureCoding {
	initWithProviderTrainNameTrainNumberTripDurationDepartureStationLocationDeparturePlatformArrivalStationLocationArrivalPlatform(
		provider: string | null,
		trainName: string | null,
		trainNumber: string | null,
		tripDuration: INDateComponentsRange,
		departureStationLocation: CLPlacemark,
		departurePlatform: string | null,
		arrivalStationLocation: CLPlacemark,
		arrivalPlatform: string | null,
	): this

	readonly provider: string

	readonly trainName: string

	readonly trainNumber: string

	readonly tripDuration: INDateComponentsRange

	readonly departureStationLocation: CLPlacemark

	readonly departurePlatform: string

	readonly arrivalStationLocation: CLPlacemark

	readonly arrivalPlatform: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INShortcut extends NSObject implements NSSecureCoding, NSCopying {
	readonly intent: INIntent

	readonly userActivity: NSUserActivity

	initWithIntent(intent: INIntent): this

	initWithUserActivity(userActivity: NSUserActivity): this

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class INDateComponentsResolutionResult extends INIntentResolutionResult {
	static successWithResolvedDateComponents<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedDateComponents: NSDateComponents,
	): InstanceType<This>

	static disambiguationWithDateComponentsToDisambiguate<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		dateComponentsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithDateComponentsToConfirm<
		This extends abstract new (...args: any) => any,
	>(this: This, dateComponentsToConfirm: NSDateComponents | null): InstanceType<This>
}

export declare class INDateComponentsRange extends NSObject implements NSCopying, NSSecureCoding {
	initWithStartDateComponentsEndDateComponents(
		startDateComponents: NSDateComponents | null,
		endDateComponents: NSDateComponents | null,
	): this

	initWithStartDateComponentsEndDateComponentsRecurrenceRule(
		startDateComponents: NSDateComponents | null,
		endDateComponents: NSDateComponents | null,
		recurrenceRule: INRecurrenceRule | null,
	): this

	readonly startDateComponents: NSDateComponents

	readonly endDateComponents: NSDateComponents

	readonly recurrenceRule: INRecurrenceRule

	initWithEKRecurrenceRule(recurrenceRule: EKRecurrenceRule): this

	EKRecurrenceRule(): EKRecurrenceRule

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INCurrencyAmountResolutionResult extends INIntentResolutionResult {
	static successWithResolvedCurrencyAmount<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedCurrencyAmount: INCurrencyAmount,
	): InstanceType<This>

	static disambiguationWithCurrencyAmountsToDisambiguate<
		This extends abstract new (...args: any) => any,
	>(
		this: This,
		currencyAmountsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithCurrencyAmountToConfirm<
		This extends abstract new (...args: any) => any,
	>(this: This, currencyAmountToConfirm: INCurrencyAmount | null): InstanceType<This>
}

export declare class INSeat extends NSObject implements NSCopying, NSSecureCoding {
	initWithSeatSectionSeatRowSeatNumberSeatingType(
		seatSection: string | null,
		seatRow: string | null,
		seatNumber: string | null,
		seatingType: string | null,
	): this

	readonly seatSection: string

	readonly seatRow: string

	readonly seatNumber: string

	readonly seatingType: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INRentalCarReservation
	extends INReservation
	implements NSCopying, NSSecureCoding
{
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLRentalCarRentalDurationPickupLocationDropOffLocation(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		rentalCar: INRentalCar,
		rentalDuration: INDateComponentsRange,
		pickupLocation: CLPlacemark | null,
		dropOffLocation: CLPlacemark | null,
	): this

	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsRentalCarRentalDurationPickupLocationDropOffLocation(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		rentalCar: INRentalCar,
		rentalDuration: INDateComponentsRange,
		pickupLocation: CLPlacemark | null,
		dropOffLocation: CLPlacemark | null,
	): this

	readonly rentalCar: INRentalCar

	readonly rentalDuration: INDateComponentsRange

	readonly pickupLocation: CLPlacemark

	readonly dropOffLocation: CLPlacemark

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INStringResolutionResult extends INIntentResolutionResult {
	static successWithResolvedString<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedString: string,
	): InstanceType<This>

	static disambiguationWithStringsToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		stringsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithStringToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		stringToConfirm: string | null,
	): InstanceType<This>
}

export declare class INFlight extends NSObject implements NSCopying, NSSecureCoding {
	initWithAirlineFlightNumberBoardingTimeFlightDurationDepartureAirportGateArrivalAirportGate(
		airline: INAirline,
		flightNumber: string,
		boardingTime: INDateComponentsRange | null,
		flightDuration: INDateComponentsRange,
		departureAirportGate: INAirportGate,
		arrivalAirportGate: INAirportGate,
	): this

	readonly airline: INAirline

	readonly flightNumber: string

	readonly boardingTime: INDateComponentsRange

	readonly flightDuration: INDateComponentsRange

	readonly departureAirportGate: INAirportGate

	readonly arrivalAirportGate: INAirportGate

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INPersonResolutionResult extends INIntentResolutionResult {
	static successWithResolvedPerson<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedPerson: INPerson,
	): InstanceType<This>

	static disambiguationWithPeopleToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		peopleToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithPersonToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		personToConfirm: INPerson | null,
	): InstanceType<This>
}

export declare class INRentalCar extends NSObject implements NSCopying, NSSecureCoding {
	initWithRentalCompanyNameTypeMakeModelRentalCarDescription(
		rentalCompanyName: string,
		type: string | null,
		make: string | null,
		model: string | null,
		rentalCarDescription: string | null,
	): this

	readonly rentalCompanyName: string

	readonly type: string

	readonly make: string

	readonly model: string

	readonly rentalCarDescription: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INAirport extends NSObject implements NSCopying, NSSecureCoding {
	initWithNameIataCodeIcaoCode(
		name: string | null,
		iataCode: string | null,
		icaoCode: string | null,
	): this

	readonly name: string

	readonly iataCode: string

	readonly icaoCode: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INBusTrip extends NSObject implements NSCopying, NSSecureCoding {
	initWithProviderBusNameBusNumberTripDurationDepartureBusStopLocationDeparturePlatformArrivalBusStopLocationArrivalPlatform(
		provider: string | null,
		busName: string | null,
		busNumber: string | null,
		tripDuration: INDateComponentsRange,
		departureBusStopLocation: CLPlacemark,
		departurePlatform: string | null,
		arrivalBusStopLocation: CLPlacemark,
		arrivalPlatform: string | null,
	): this

	readonly provider: string

	readonly busName: string

	readonly busNumber: string

	readonly tripDuration: INDateComponentsRange

	readonly departureBusStopLocation: CLPlacemark

	readonly departurePlatform: string

	readonly arrivalBusStopLocation: CLPlacemark

	readonly arrivalPlatform: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INBooleanResolutionResult extends INIntentResolutionResult {
	static successWithResolvedValue<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedValue: boolean,
	): InstanceType<This>

	static confirmationRequiredWithValueToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		valueToConfirm: NSNumber | null,
	): InstanceType<This>
}

export declare class INSpeakableString
	extends NSObject
	implements INSpeakable, NSCopying, NSSecureCoding
{
	initWithVocabularyIdentifierSpokenPhrasePronunciationHint(
		vocabularyIdentifier: string,
		spokenPhrase: string,
		pronunciationHint: string | null,
	): this

	initWithSpokenPhrase(spokenPhrase: string): this

	readonly spokenPhrase: string

	readonly pronunciationHint: string

	readonly vocabularyIdentifier: string

	readonly alternativeSpeakableMatches: NSArray

	readonly identifier: string

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INImage extends NSObject implements NSCopying, NSSecureCoding {
	static imageNamed<This extends abstract new (...args: any) => any>(
		this: This,
		name: string,
	): InstanceType<This>

	static imageWithImageData<This extends abstract new (...args: any) => any>(
		this: This,
		imageData: NSData,
	): InstanceType<This>

	static imageWithURL<This extends abstract new (...args: any) => any>(
		this: This,
		URL: NSURL,
	): InstanceType<This>

	static imageWithURLWidthHeight<This extends abstract new (...args: any) => any>(
		this: This,
		URL: NSURL,
		width: number,
		height: number,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INTrainReservation extends INReservation implements NSCopying, NSSecureCoding {
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLReservedSeatTrainTrip(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		reservedSeat: INSeat | null,
		trainTrip: INTrainTrip,
	): this

	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsReservedSeatTrainTrip(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		reservedSeat: INSeat | null,
		trainTrip: INTrainTrip,
	): this

	readonly reservedSeat: INSeat

	readonly trainTrip: INTrainTrip

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INDoubleResolutionResult extends INIntentResolutionResult {
	static successWithResolvedValue<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedValue: number,
	): InstanceType<This>

	static confirmationRequiredWithValueToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		valueToConfirm: NSNumber | null,
	): InstanceType<This>
}

export declare class INLengthResolutionResult extends INIntentResolutionResult {
	static successWithResolvedLength<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedLength: NSMeasurement,
	): InstanceType<This>

	static disambiguationWithLengthsToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		lengthsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithLengthToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		lengthToConfirm: NSMeasurement | null,
	): InstanceType<This>
}

export declare class INURLResolutionResult extends INIntentResolutionResult {
	static successWithResolvedURL<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedURL: NSURL,
	): InstanceType<This>

	static disambiguationWithURLsToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		urlsToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithURLToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		urlToConfirm: NSURL | null,
	): InstanceType<This>
}

export declare class INFile extends NSObject implements NSSecureCoding {
	static fileWithDataFilenameTypeIdentifier(
		data: NSData,
		filename: string,
		typeIdentifier: string | null,
	): INFile

	static fileWithFileURLFilenameTypeIdentifier(
		fileURL: NSURL,
		filename: string | null,
		typeIdentifier: string | null,
	): INFile

	readonly data: NSData

	filename: string

	readonly typeIdentifier: string

	readonly fileURL: NSURL

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INLodgingReservation
	extends INReservation
	implements NSCopying, NSSecureCoding
{
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLLodgingBusinessLocationReservationDurationNumberOfAdultsNumberOfChildren(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		lodgingBusinessLocation: CLPlacemark,
		reservationDuration: INDateComponentsRange,
		numberOfAdults: NSNumber | null,
		numberOfChildren: NSNumber | null,
	): this

	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsLodgingBusinessLocationReservationDurationNumberOfAdultsNumberOfChildren(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		lodgingBusinessLocation: CLPlacemark,
		reservationDuration: INDateComponentsRange,
		numberOfAdults: NSNumber | null,
		numberOfChildren: NSNumber | null,
	): this

	readonly lodgingBusinessLocation: CLPlacemark

	readonly reservationDuration: INDateComponentsRange

	readonly numberOfAdults: NSNumber

	readonly numberOfChildren: NSNumber

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INFlightReservation
	extends INReservation
	implements NSCopying, NSSecureCoding
{
	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsURLReservedSeatFlight(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		URL: NSURL | null,
		reservedSeat: INSeat | null,
		flight: INFlight,
	): this

	initWithItemReferenceReservationNumberBookingTimeReservationStatusReservationHolderNameActionsReservedSeatFlight(
		itemReference: INSpeakableString,
		reservationNumber: string | null,
		bookingTime: NSDate | null,
		reservationStatus: interop.Enum<typeof INReservationStatus>,
		reservationHolderName: string | null,
		actions: NSArray<interop.Object> | Array<interop.Object> | null,
		reservedSeat: INSeat | null,
		flight: INFlight,
	): this

	readonly reservedSeat: INSeat

	readonly flight: INFlight

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INPersonHandle extends NSObject implements NSCopying, NSSecureCoding {
	readonly value: string

	readonly type: interop.Enum<typeof INPersonHandleType>

	readonly label: string

	initWithValueTypeLabel(
		value: string | null,
		type: interop.Enum<typeof INPersonHandleType>,
		label: string | null,
	): this

	initWithValueType(value: string | null, type: interop.Enum<typeof INPersonHandleType>): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INAirline extends NSObject implements NSCopying, NSSecureCoding {
	initWithNameIataCodeIcaoCode(
		name: string | null,
		iataCode: string | null,
		icaoCode: string | null,
	): this

	readonly name: string

	readonly iataCode: string

	readonly icaoCode: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class INExtension extends NSObject implements INIntentHandlerProviding {
	handlerForIntent(intent: INIntent): interop.Object

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class INMassResolutionResult extends INIntentResolutionResult {
	static successWithResolvedMass<This extends abstract new (...args: any) => any>(
		this: This,
		resolvedMass: NSMeasurement,
	): InstanceType<This>

	static disambiguationWithMassToDisambiguate<This extends abstract new (...args: any) => any>(
		this: This,
		massToDisambiguate: NSArray<interop.Object> | Array<interop.Object>,
	): InstanceType<This>

	static confirmationRequiredWithMassToConfirm<This extends abstract new (...args: any) => any>(
		this: This,
		massToConfirm: NSMeasurement | null,
	): InstanceType<This>
}
