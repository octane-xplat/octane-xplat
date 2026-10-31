/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />

declare const kCLDistanceFilterNone: number

declare const kCLLocationCoordinate2DInvalid: CLLocationCoordinate2D

declare const kCLLocationAccuracyKilometer: number

declare const kCLLocationAccuracyHundredMeters: number

declare const kCLLocationAccuracyNearestTenMeters: number

declare const kCLLocationAccuracyBest: number

declare const kCLLocationAccuracyBestForNavigation: number

declare const kCLLocationAccuracyThreeKilometers: number

declare const CLLocationDistanceMax: number

declare const CLTimeIntervalMax: number

declare const kCLLocationAccuracyReduced: number

declare class CLLocationCoordinate2D {
	constructor(init?: CLLocationCoordinate2D)
	latitude: number
	longitude: number
}

declare function CLLocationCoordinate2DIsValid(coord: CLLocationCoordinate2D): boolean

declare function CLLocationCoordinate2DMake(
	latitude: number,
	longitude: number,
): CLLocationCoordinate2D

declare class CLFloor extends NSObject implements NSCopying, NSSecureCoding {
	readonly level: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

declare class CLLocation extends NSObject implements NSCopying, NSSecureCoding, CKRecordValue {
	initWithLatitudeLongitude(latitude: number, longitude: number): this

	initWithCoordinateAltitudeHorizontalAccuracyVerticalAccuracyTimestamp(
		coordinate: CLLocationCoordinate2D,
		altitude: number,
		hAccuracy: number,
		vAccuracy: number,
		timestamp: NSDate,
	): this

	initWithCoordinateAltitudeHorizontalAccuracyVerticalAccuracyCourseSpeedTimestamp(
		coordinate: CLLocationCoordinate2D,
		altitude: number,
		hAccuracy: number,
		vAccuracy: number,
		course: number,
		speed: number,
		timestamp: NSDate,
	): this

	initWithCoordinateAltitudeHorizontalAccuracyVerticalAccuracyCourseCourseAccuracySpeedSpeedAccuracyTimestamp(
		coordinate: CLLocationCoordinate2D,
		altitude: number,
		hAccuracy: number,
		vAccuracy: number,
		course: number,
		courseAccuracy: number,
		speed: number,
		speedAccuracy: number,
		timestamp: NSDate,
	): this

	readonly coordinate: CLLocationCoordinate2D

	readonly altitude: number

	readonly horizontalAccuracy: number

	readonly verticalAccuracy: number

	readonly course: number

	readonly courseAccuracy: number

	readonly speed: number

	readonly speedAccuracy: number

	readonly timestamp: NSDate

	readonly floor: CLFloor

	getDistanceFrom(location: CLLocation): number

	distanceFromLocation(location: CLLocation): number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

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
