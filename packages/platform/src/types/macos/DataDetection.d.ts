import type { NSDate, NSTimeZone, NSURL } from './Foundation'

import { NSObject } from './Runtime'

export declare class DDMatchShipmentTrackingNumber extends DDMatch {
	readonly carrier: string

	readonly trackingNumber: string
}

export declare class DDMatchEmailAddress extends DDMatch {
	readonly emailAddress: string

	readonly label: string
}

export declare class DDMatchPhoneNumber extends DDMatch {
	readonly phoneNumber: string

	readonly label: string
}

export declare class DDMatchLink extends DDMatch {
	readonly URL: NSURL
}

export declare class DDMatchCalendarEvent extends DDMatch {
	readonly allDay: boolean

	readonly startDate: NSDate

	readonly startTimeZone: NSTimeZone

	readonly endDate: NSDate

	readonly endTimeZone: NSTimeZone

	isAllDay(): boolean
}

export declare class DDMatchFlightNumber extends DDMatch {
	readonly airline: string

	readonly flightNumber: string
}

export declare class DDMatchPostalAddress extends DDMatch {
	readonly street: string

	readonly city: string

	readonly state: string

	readonly postalCode: string

	readonly country: string
}

export declare class DDMatchMoneyAmount extends DDMatch {
	readonly currency: string

	readonly amount: number
}

export declare class DDMatch extends NSObject {
	readonly matchedString: string
}
