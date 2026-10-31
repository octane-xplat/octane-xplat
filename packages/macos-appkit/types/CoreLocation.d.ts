/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const kCLHeadingFilterNone: number

declare const kCLErrorUserInfoAlternateRegionKey: string

declare const kCLErrorDomain: string

declare const CLActivityType: {
	Other: 1
	AutomotiveNavigation: 2
	Fitness: 3
	OtherNavigation: 4
	Airborne: 5
}

declare const CLLiveUpdateConfiguration: {
	Default: 0
	AutomotiveNavigation: 1
	OtherNavigation: 2
	Fitness: 3
	Airborne: 4
}

declare const CLProximity: {
	Unknown: 0
	Immediate: 1
	Near: 2
	Far: 3
}

declare const CLServiceSessionAuthorizationRequirement: {
	None: 0
	WhenInUse: 1
	Always: 2
}

declare const CLDeviceOrientation: {
	Unknown: 0
	Portrait: 1
	PortraitUpsideDown: 2
	LandscapeLeft: 3
	LandscapeRight: 4
	FaceUp: 5
	FaceDown: 6
}

declare const CLAuthorizationStatus: {
	NotDetermined: 0
	Restricted: 1
	Denied: 2
	AuthorizedAlways: 3
	Authorized: 3
}

declare const CLRegionState: {
	Unknown: 0
	Inside: 1
	Outside: 2
}

declare const CLError: {
	LocationUnknown: 0
	Denied: 1
	Network: 2
	HeadingFailure: 3
	RegionMonitoringDenied: 4
	RegionMonitoringFailure: 5
	RegionMonitoringSetupDelayed: 6
	RegionMonitoringResponseDelayed: 7
	GeocodeFoundNoResult: 8
	GeocodeFoundPartialResult: 9
	GeocodeCanceled: 10
	DeferredFailed: 11
	DeferredNotUpdatingLocation: 12
	DeferredAccuracyTooLow: 13
	DeferredDistanceFiltered: 14
	DeferredCanceled: 15
	RangingUnavailable: 16
	RangingFailure: 17
	PromptDeclined: 18
	HistoricalLocationError: 19
}

declare const CLAccuracyAuthorization: {
	Full: 0
	Reduced: 1
}

declare const CLMonitoringState: {
	Unknown: 0
	Satisfied: 1
	Unsatisfied: 2
}

declare interface CLLocationManagerDelegate extends NSObjectProtocol {
	locationManagerDidUpdateToLocationFromLocation?(
		manager: CLLocationManager,
		newLocation: CLLocation,
		oldLocation: CLLocation,
	): void

	locationManagerDidUpdateLocations?(
		manager: CLLocationManager,
		locations: NSArray<interop.Object> | Array<interop.Object>,
	): void

	locationManagerDidUpdateHeading?(manager: CLLocationManager, newHeading: CLHeading): void

	locationManagerShouldDisplayHeadingCalibration?(manager: CLLocationManager): boolean

	locationManagerDidDetermineStateForRegion?(
		manager: CLLocationManager,
		state: interop.Enum<typeof CLRegionState>,
		region: CLRegion,
	): void

	locationManagerDidRangeBeaconsInRegion?(
		manager: CLLocationManager,
		beacons: NSArray<interop.Object> | Array<interop.Object>,
		region: CLBeaconRegion,
	): void

	locationManagerRangingBeaconsDidFailForRegionWithError?(
		manager: CLLocationManager,
		region: CLBeaconRegion,
		error: NSError,
	): void

	locationManagerDidRangeBeaconsSatisfyingConstraint?(
		manager: CLLocationManager,
		beacons: NSArray<interop.Object> | Array<interop.Object>,
		beaconConstraint: CLBeaconIdentityConstraint,
	): void

	locationManagerDidFailRangingBeaconsForConstraintError?(
		manager: CLLocationManager,
		beaconConstraint: CLBeaconIdentityConstraint,
		error: NSError,
	): void

	locationManagerDidEnterRegion?(manager: CLLocationManager, region: CLRegion): void

	locationManagerDidExitRegion?(manager: CLLocationManager, region: CLRegion): void

	locationManagerDidFailWithError?(manager: CLLocationManager, error: NSError): void

	locationManagerMonitoringDidFailForRegionWithError?(
		manager: CLLocationManager,
		region: CLRegion | null,
		error: NSError,
	): void

	locationManagerDidChangeAuthorizationStatus?(
		manager: CLLocationManager,
		status: interop.Enum<typeof CLAuthorizationStatus>,
	): void

	locationManagerDidChangeAuthorization?(manager: CLLocationManager): void

	locationManagerDidStartMonitoringForRegion?(manager: CLLocationManager, region: CLRegion): void

	locationManagerDidPauseLocationUpdates?(manager: CLLocationManager): void

	locationManagerDidResumeLocationUpdates?(manager: CLLocationManager): void

	locationManagerDidFinishDeferredUpdatesWithError?(
		manager: CLLocationManager,
		error: NSError | null,
	): void

	locationManagerDidVisit?(manager: CLLocationManager, visit: CLVisit): void
}

declare class CLLocationManagerDelegate extends NativeObject implements CLLocationManagerDelegate {}

declare class CLVisit extends NSObject implements NSSecureCoding, NSCopying {
	readonly arrivalDate: NSDate

	readonly departureDate: NSDate

	readonly coordinate: CLLocationCoordinate2D

	readonly horizontalAccuracy: number

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

declare class CLLocationManager extends NSObject {
	static locationServicesEnabled(): boolean

	static headingAvailable(): boolean

	static significantLocationChangeMonitoringAvailable(): boolean

	static isMonitoringAvailableForClass(regionClass: interop.PointerConvertible): boolean

	static regionMonitoringAvailable(): boolean

	static regionMonitoringEnabled(): boolean

	static isRangingAvailable(): boolean

	readonly authorizationStatus: interop.Enum<typeof CLAuthorizationStatus>

	static authorizationStatus(): interop.Enum<typeof CLAuthorizationStatus>

	readonly accuracyAuthorization: interop.Enum<typeof CLAccuracyAuthorization>

	readonly authorizedForWidgetUpdates: boolean

	delegate: CLLocationManagerDelegate

	readonly locationServicesEnabled: boolean

	purpose: string

	activityType: interop.Enum<typeof CLActivityType>

	distanceFilter: number

	desiredAccuracy: number

	pausesLocationUpdatesAutomatically: boolean

	allowsBackgroundLocationUpdates: boolean

	readonly location: CLLocation

	readonly headingAvailable: boolean

	headingFilter: number

	headingOrientation: interop.Enum<typeof CLDeviceOrientation>

	readonly heading: CLHeading

	readonly maximumRegionMonitoringDistance: number

	readonly monitoredRegions: NSSet

	readonly rangedRegions: NSSet

	readonly rangedBeaconConstraints: NSSet

	requestWhenInUseAuthorization(): void

	requestAlwaysAuthorization(): void

	requestTemporaryFullAccuracyAuthorizationWithPurposeKeyCompletion(
		purposeKey: string,
		completion: (p1: NSError) => void | null,
	): void

	requestTemporaryFullAccuracyAuthorizationWithPurposeKey(purposeKey: string): void

	startUpdatingLocation(): void

	stopUpdatingLocation(): void

	requestLocation(): void

	startUpdatingHeading(): void

	dismissHeadingCalibrationDisplay(): void

	startMonitoringSignificantLocationChanges(): void

	stopMonitoringSignificantLocationChanges(): void

	startMonitoringForRegionDesiredAccuracy(region: CLRegion, accuracy: number): void

	stopMonitoringForRegion(region: CLRegion): void

	startMonitoringForRegion(region: CLRegion): void

	requestStateForRegion(region: CLRegion): void

	startRangingBeaconsInRegion(region: CLBeaconRegion): void

	stopRangingBeaconsInRegion(region: CLBeaconRegion): void

	startRangingBeaconsSatisfyingConstraint(constraint: CLBeaconIdentityConstraint): void

	stopRangingBeaconsSatisfyingConstraint(constraint: CLBeaconIdentityConstraint): void

	allowDeferredLocationUpdatesUntilTraveledTimeout(distance: number, timeout: number): void

	disallowDeferredLocationUpdates(): void

	static deferredLocationUpdatesAvailable(): boolean

	isAuthorizedForWidgetUpdates(): boolean

	startMonitoringVisits(): void

	stopMonitoringVisits(): void
}

declare class CLHeading extends NSObject implements NSCopying, NSSecureCoding {
	readonly magneticHeading: number

	readonly trueHeading: number

	readonly headingAccuracy: number

	readonly x: number

	readonly y: number

	readonly z: number

	readonly timestamp: NSDate

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class CLBeacon extends NSObject implements NSCopying, NSSecureCoding {
	readonly timestamp: NSDate

	readonly UUID: NSUUID

	readonly proximityUUID: NSUUID

	readonly major: NSNumber

	readonly minor: NSNumber

	readonly proximity: interop.Enum<typeof CLProximity>

	readonly accuracy: number

	readonly rssi: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class CLBeaconIdentityConstraint extends NSObject implements NSCopying, NSSecureCoding {
	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class CLCircularRegion extends CLRegion {
	initWithCenterRadiusIdentifier(
		center: CLLocationCoordinate2D,
		radius: number,
		identifier: string,
	): this

	readonly center: CLLocationCoordinate2D

	readonly radius: number

	containsCoordinate(coordinate: CLLocationCoordinate2D): boolean
}

declare class CLRegion extends NSObject implements NSCopying, NSSecureCoding {
	initCircularRegionWithCenterRadiusIdentifier(
		center: CLLocationCoordinate2D,
		radius: number,
		identifier: string,
	): this

	readonly center: CLLocationCoordinate2D

	readonly radius: number

	readonly identifier: string

	notifyOnEntry: boolean

	notifyOnExit: boolean

	containsCoordinate(coordinate: CLLocationCoordinate2D): boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class CLGeocoder extends NSObject {
	readonly geocoding: boolean

	reverseGeocodeLocationCompletionHandler(
		location: CLLocation,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	reverseGeocodeLocationPreferredLocaleCompletionHandler(
		location: CLLocation,
		locale: NSLocale | null,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	geocodeAddressDictionaryCompletionHandler(
		addressDictionary:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	geocodeAddressStringInRegionCompletionHandler(
		addressString: string,
		region: CLRegion | null,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	geocodeAddressStringInRegionPreferredLocaleCompletionHandler(
		addressString: string,
		region: CLRegion | null,
		locale: NSLocale | null,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	geocodeAddressStringCompletionHandler(
		addressString: string,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	cancelGeocode(): void

	isGeocoding(): boolean

	geocodePostalAddressCompletionHandler(
		postalAddress: CNPostalAddress,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void

	geocodePostalAddressPreferredLocaleCompletionHandler(
		postalAddress: CNPostalAddress,
		locale: NSLocale | null,
		completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void,
	): void
}

declare class CLBeaconRegion extends CLRegion {
	initWithUUIDIdentifier(uuid: NSUUID, identifier: string): this

	initWithProximityUUIDIdentifier(proximityUUID: NSUUID, identifier: string): this

	initWithUUIDMajorIdentifier(uuid: NSUUID, major: number, identifier: string): this

	initWithProximityUUIDMajorIdentifier(
		proximityUUID: NSUUID,
		major: number,
		identifier: string,
	): this

	initWithUUIDMajorMinorIdentifier(
		uuid: NSUUID,
		major: number,
		minor: number,
		identifier: string,
	): this

	initWithProximityUUIDMajorMinorIdentifier(
		proximityUUID: NSUUID,
		major: number,
		minor: number,
		identifier: string,
	): this

	initWithBeaconIdentityConstraintIdentifier(
		beaconIdentityConstraint: CLBeaconIdentityConstraint,
		identifier: string,
	): this

	peripheralDataWithMeasuredPower(measuredPower: NSNumber | null): NSMutableDictionary

	readonly beaconIdentityConstraint: CLBeaconIdentityConstraint

	readonly UUID: NSUUID

	readonly proximityUUID: NSUUID

	readonly major: NSNumber

	readonly minor: NSNumber

	notifyEntryStateOnDisplay: boolean
}

declare class CLPlacemark extends NSObject implements NSCopying, NSSecureCoding {
	initWithPlacemark(placemark: CLPlacemark): this

	readonly location: CLLocation

	readonly region: CLRegion

	readonly timeZone: NSTimeZone

	readonly addressDictionary: NSDictionary

	readonly name: string

	readonly thoroughfare: string

	readonly subThoroughfare: string

	readonly locality: string

	readonly subLocality: string

	readonly administrativeArea: string

	readonly subAdministrativeArea: string

	readonly postalCode: string

	readonly ISOcountryCode: string

	readonly country: string

	readonly inlandWater: string

	readonly ocean: string

	readonly areasOfInterest: NSArray

	readonly postalAddress: CNPostalAddress

	static placemarkWithLocationNamePostalAddress<This extends abstract new (...args: any) => any>(
		this: This,
		location: CLLocation,
		name: string | null,
		postalAddress: CNPostalAddress | null,
	): InstanceType<This>

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}
