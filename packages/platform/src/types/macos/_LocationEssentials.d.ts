import type { CKRecordValue } from './CloudKit'

import type { NSCoder, NSCopying, NSDate, NSSecureCoding } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const kCLDistanceFilterNone: number

export declare const kCLLocationCoordinate2DInvalid: CLLocationCoordinate2D

export declare const kCLLocationAccuracyKilometer: number

export declare const kCLLocationAccuracyHundredMeters: number

export declare const kCLLocationAccuracyNearestTenMeters: number

export declare const kCLLocationAccuracyBest: number

export declare const kCLLocationAccuracyBestForNavigation: number

export declare const kCLLocationAccuracyThreeKilometers: number

export declare const CLLocationDistanceMax: number

export declare const CLTimeIntervalMax: number

export declare const kCLLocationAccuracyReduced: number

export declare class CLLocationCoordinate2D {
	constructor(init?: CLLocationCoordinate2D)
	latitude: number
	longitude: number
}

export declare function CLLocationCoordinate2DIsValid(coord: CLLocationCoordinate2D): boolean

export declare function CLLocationCoordinate2DMake(
	latitude: number,
	longitude: number,
): CLLocationCoordinate2D

export declare class CLFloor extends NSObject implements NSCopying, NSSecureCoding {
	readonly level: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class CLLocation
	extends NSObject
	implements NSCopying, NSSecureCoding, CKRecordValue
{
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
