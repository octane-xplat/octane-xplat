// Copyright (c) Meta Platforms, Inc. and affiliates. MIT. Astryx 0.6.4.
type JobStatus = 'scheduled' | 'in_progress' | 'on_hold' | 'overdue' | 'completed'
type Priority = 'urgent' | 'high' | 'normal'

/** The authored shape. Dates are derived on load, so they live on ServiceJob. */
interface SeedJob {
	id: string
	summary: string
	customer: string
	address: string
	technician: string
	status: JobStatus
	priority: Priority
	/** ISO timestamp — the column sorts on this, so it stays a string. */
	scheduledAt: string
	/** Quote in whole dollars, kept numeric so it sorts and filters. */
	quoted: number
	equipment: string
}

export interface ServiceJob extends SeedJob, Record<string, unknown> {
	/**
	 * The same instant as scheduledAt, as a Date. Power search rejects a string
	 * date outright, so the date filters read this field while the column reads
	 * the string above.
	 */
	scheduledOn: Date
}

/**
 * The hue variants, not the semantic ones. `warning` and `error` paint a solid
 * fill straight from --color-warning / --color-error, and a theme is free to
 * tune those as ink for text rather than as a surface — the neutral theme does,
 * so Overdue comes out a muddy maroon block. The hue variants read their own
 * background/text pair, which is a tint in every theme, so a column of these
 * stays legible wherever the page is themed. Red is left to carry the one state
 * worth chasing.
 *
 * On hold is grey because nothing is wrong with it — the work is parked, not
 * late — and a colour there would pull the eye off the row that is.
 *
 * The happy path walks the hue wheel in the direction the work travels:
 * Scheduled blue, In progress teal, Completed green. Teal is the stop between
 * the other two, so the ramp reads as progress rather than as three unrelated
 * tags.
 */
export const STATUS_META: Record<
	JobStatus,
	{
		label: string
		badge: 'neutral' | 'blue' | 'teal' | 'green' | 'red'
	}
> = {
	scheduled: { label: 'Scheduled', badge: 'blue' },
	in_progress: { label: 'In progress', badge: 'teal' },
	on_hold: { label: 'On hold', badge: 'neutral' },
	overdue: { label: 'Overdue', badge: 'red' },
	completed: { label: 'Completed', badge: 'green' },
}

/**
 * Priority is a three-step ramp read down a column, which is what a dot is for:
 * the eye picks out the reds without reading a word. Normal is neutral, so a
 * table of ordinary work is quiet.
 */
export const PRIORITY_META: Record<
	Priority,
	{ label: string; dot: 'neutral' | 'warning' | 'error' }
> = {
	urgent: { label: 'Urgent', dot: 'error' },
	high: { label: 'High', dot: 'warning' },
	normal: { label: 'Normal', dot: 'neutral' },
}

/** Primary detail-pane action per state — keeps the panel feeling like a tool. */
export const NEXT_ACTION: Record<JobStatus, string> = {
	scheduled: 'Dispatch technician',
	in_progress: 'Mark complete',
	on_hold: 'Check parts order',
	overdue: 'Reschedule',
	completed: 'Create follow-up',
}

// Active work first, then recent completed jobs referenced as site history.
const seedJobs: SeedJob[] = [
	{
		id: 'SJ-2148',
		summary: 'No cooling — rooftop unit 3',
		customer: 'Harborview Grand Hotel',
		address: '1200 Harbor Blvd, Bayside',
		technician: 'Luis Camarena',
		status: 'in_progress',
		priority: 'urgent',
		scheduledAt: '2026-07-02T08:00:00Z',
		quoted: 1480,
		equipment: 'Trane RTU-3, 25-ton (2019)',
	},
	{
		id: 'SJ-2147',
		summary: 'Quarterly preventive maintenance',
		customer: 'Northgate Dental Group',
		address: '88 Northgate Mall, Suite 210',
		technician: 'Dana Whitfield',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-02T10:30:00Z',
		quoted: 420,
		equipment: 'Carrier split system, 5-ton',
	},
	{
		id: 'SJ-2146',
		summary: 'Walk-in freezer overshooting setpoint',
		customer: 'Beacon Street Bistro',
		address: '412 Beacon St',
		technician: 'Marcus Osei',
		status: 'on_hold',
		priority: 'high',
		scheduledAt: '2026-07-01T13:00:00Z',
		quoted: 2150,
		equipment: 'Kolpak walk-in, Copeland compressor',
	},
	{
		id: 'SJ-2145',
		summary: 'Thermostat replacement, suite 400',
		customer: 'Pinnacle Property Mgmt',
		address: '500 Commerce Tower, Floor 4',
		technician: 'Dana Whitfield',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-02T14:00:00Z',
		quoted: 310,
		equipment: 'Honeywell T6 Pro (2 units)',
	},
	{
		id: 'SJ-2144',
		summary: 'Boiler pilot fails to stay lit',
		customer: 'Elm & 5th Lofts',
		address: '501 Elm St',
		technician: 'Luis Camarena',
		status: 'overdue',
		priority: 'high',
		scheduledAt: '2026-07-01T09:00:00Z',
		quoted: 760,
		equipment: 'Weil-McLain CGa boiler (2011)',
	},
	{
		id: 'SJ-2143',
		summary: 'Condenser coil cleaning',
		customer: 'Riverside Athletic Club',
		address: '9 Riverside Way',
		technician: 'Priya Raman',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-03T07:30:00Z',
		quoted: 540,
		equipment: 'Lennox RTU, 20-ton (2018)',
	},
	{
		id: 'SJ-2142',
		summary: 'Intermittent short cycling',
		customer: 'Harborview Grand Hotel',
		address: '1200 Harbor Blvd, Bayside',
		technician: 'Marcus Osei',
		status: 'on_hold',
		priority: 'high',
		scheduledAt: '2026-07-01T15:30:00Z',
		quoted: 890,
		equipment: 'Trane RTU-1, 25-ton (2019)',
	},
	{
		id: 'SJ-2141',
		summary: 'Emergency steam leak, basement',
		customer: 'Elm & 5th Lofts',
		address: '501 Elm St',
		technician: 'Priya Raman',
		status: 'in_progress',
		priority: 'urgent',
		scheduledAt: '2026-07-01T06:00:00Z',
		quoted: 3200,
		equipment: 'Weil-McLain CGa boiler (2011)',
	},
	{
		id: 'SJ-2140',
		summary: 'Annual fire damper inspection',
		customer: 'Pinnacle Property Mgmt',
		address: '500 Commerce Tower, Floor 4',
		technician: 'Dana Whitfield',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-06T09:00:00Z',
		quoted: 1250,
		equipment: 'Building-wide duct network',
	},
	{
		id: 'SJ-2139',
		summary: 'Ice machine not producing',
		customer: 'Beacon Street Bistro',
		address: '412 Beacon St',
		technician: 'Luis Camarena',
		status: 'overdue',
		priority: 'urgent',
		scheduledAt: '2026-06-30T11:00:00Z',
		quoted: 680,
		equipment: 'Hoshizaki KM-660, air cooled',
	},
	{
		id: 'SJ-2138',
		summary: 'Makeup air unit rebalancing',
		customer: 'Northgate Dental Group',
		address: '88 Northgate Mall, Suite 210',
		technician: 'Priya Raman',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-07T13:00:00Z',
		quoted: 495,
		equipment: 'Greenheck MAU, 4000 CFM',
	},
	{
		id: 'SJ-2137',
		summary: 'Chiller low refrigerant alarm',
		customer: 'Summit Medical Plaza',
		address: '77 Summit Ridge Rd',
		technician: 'Marcus Osei',
		status: 'in_progress',
		priority: 'urgent',
		scheduledAt: '2026-07-01T08:30:00Z',
		quoted: 4100,
		equipment: 'Daikin air-cooled chiller, 80-ton',
	},
	{
		id: 'SJ-2136',
		summary: 'VAV box actuator replacement',
		customer: 'Summit Medical Plaza',
		address: '77 Summit Ridge Rd',
		technician: 'Dana Whitfield',
		status: 'scheduled',
		priority: 'high',
		scheduledAt: '2026-07-03T10:00:00Z',
		quoted: 720,
		equipment: 'Titus VAV, zones 12–15',
	},
	{
		id: 'SJ-2135',
		summary: 'Exhaust fan bearing noise',
		customer: 'Riverside Athletic Club',
		address: '9 Riverside Way',
		technician: 'Luis Camarena',
		status: 'on_hold',
		priority: 'normal',
		scheduledAt: '2026-06-30T14:30:00Z',
		quoted: 380,
		equipment: 'Greenheck exhaust fan, pool deck',
	},
	{
		id: 'SJ-2134',
		summary: 'Humidifier control board fault',
		customer: 'Summit Medical Plaza',
		address: '77 Summit Ridge Rd',
		technician: 'Priya Raman',
		status: 'overdue',
		priority: 'high',
		scheduledAt: '2026-06-29T09:30:00Z',
		quoted: 1340,
		equipment: 'DriSteem steam humidifier',
	},
	{
		id: 'SJ-2133',
		summary: 'Rooftop economizer stuck closed',
		customer: 'Northgate Dental Group',
		address: '88 Northgate Mall, Suite 210',
		technician: 'Marcus Osei',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-08T08:00:00Z',
		quoted: 610,
		equipment: 'Carrier split system, 5-ton',
	},
	{
		id: 'SJ-2132',
		summary: 'Hot water recirculation pump seized',
		customer: 'Elm & 5th Lofts',
		address: '501 Elm St',
		technician: 'Dana Whitfield',
		status: 'in_progress',
		priority: 'high',
		scheduledAt: '2026-07-01T12:00:00Z',
		quoted: 950,
		equipment: 'Taco 007 circulator',
	},
	{
		id: 'SJ-2131',
		summary: 'Split system quote, new tenant build',
		customer: 'Pinnacle Property Mgmt',
		address: '500 Commerce Tower, Floor 4',
		technician: 'Priya Raman',
		status: 'scheduled',
		priority: 'normal',
		scheduledAt: '2026-07-09T11:00:00Z',
		quoted: 8600,
		equipment: 'Proposed: Mitsubishi VRF, 6 zones',
	},
	{
		id: 'SJ-2101',
		summary: 'Compressor contactor replacement',
		customer: 'Harborview Grand Hotel',
		address: '1200 Harbor Blvd, Bayside',
		technician: 'Marcus Osei',
		status: 'completed',
		priority: 'high',
		scheduledAt: '2026-06-24T09:00:00Z',
		quoted: 640,
		equipment: 'Trane RTU-3, 25-ton (2019)',
	},
	{
		id: 'SJ-2095',
		summary: 'Pool dehumidifier service',
		customer: 'Riverside Athletic Club',
		address: '9 Riverside Way',
		technician: 'Dana Whitfield',
		status: 'completed',
		priority: 'normal',
		scheduledAt: '2026-06-22T08:00:00Z',
		quoted: 720,
		equipment: 'Seresco NP series dehumidifier',
	},
	{
		id: 'SJ-2088',
		summary: 'Refrigerant leak diagnostic',
		customer: 'Beacon Street Bistro',
		address: '412 Beacon St',
		technician: 'Luis Camarena',
		status: 'completed',
		priority: 'normal',
		scheduledAt: '2026-06-18T11:00:00Z',
		quoted: 390,
		equipment: 'Kolpak walk-in, Copeland compressor',
	},
	{
		id: 'SJ-2081',
		summary: 'Chiller annual certification',
		customer: 'Summit Medical Plaza',
		address: '77 Summit Ridge Rd',
		technician: 'Priya Raman',
		status: 'completed',
		priority: 'high',
		scheduledAt: '2026-06-15T07:00:00Z',
		quoted: 2450,
		equipment: 'Daikin air-cooled chiller, 80-ton',
	},
	{
		id: 'SJ-2067',
		summary: 'RTU belt and filter service',
		customer: 'Pinnacle Property Mgmt',
		address: '500 Commerce Tower, Floor 4',
		technician: 'Dana Whitfield',
		status: 'completed',
		priority: 'normal',
		scheduledAt: '2026-06-12T08:30:00Z',
		quoted: 280,
		equipment: 'York RTU, 15-ton (2016)',
	},
	{
		id: 'SJ-2044',
		summary: 'Cooling tower fan bearing replacement',
		customer: 'Harborview Grand Hotel',
		address: '1200 Harbor Blvd, Bayside',
		technician: 'Marcus Osei',
		status: 'completed',
		priority: 'high',
		scheduledAt: '2026-05-28T07:30:00Z',
		quoted: 1120,
		equipment: 'BAC cooling tower, cell 2',
	},
	{
		id: 'SJ-2019',
		summary: 'Spring maintenance visit',
		customer: 'Northgate Dental Group',
		address: '88 Northgate Mall, Suite 210',
		technician: 'Dana Whitfield',
		status: 'completed',
		priority: 'normal',
		scheduledAt: '2026-04-15T10:00:00Z',
		quoted: 420,
		equipment: 'Carrier split system, 5-ton',
	},
]

const DAY_MS = 86_400_000

/** Read once at load, so a preset's filter value stays referentially stable. */
const NOW_MS = Date.now()

/**
 * The authored dates are fixed, so they slide into the past as this template
 * ages and an "Upcoming" filter would match nothing. Shifting the whole set on
 * load keeps the backlog straddling today, with the newest job about three
 * weeks out.
 */
const DATE_SHIFT_MS =
	NOW_MS + 21 * DAY_MS - Math.max(...seedJobs.map((j) => Date.parse(j.scheduledAt)))

/**
 * A job in the past can't still be waiting to happen, and one from months ago
 * isn't still under way, so an authored status only survives where the shifted
 * date still supports it.
 */
function statusForDate(authored: JobStatus, when: number): JobStatus {
	if (when > NOW_MS) {
		return 'scheduled'
	}
	// Recently missed work is still chaseable; anything older has been closed
	// out one way or another.
	const isRecent = when > NOW_MS - 45 * DAY_MS
	if (authored === 'scheduled') {
		return isRecent ? 'overdue' : 'completed'
	}
	if (authored === 'in_progress' && !isRecent) {
		return 'completed'
	}
	return authored
}

/**
 * The authored rows are cycled backwards through the calendar into a longer
 * backlog, so the infinite scroll below has several batches to fetch. A real
 * screen gets this from its Relay connection instead.
 */
export const allJobs: ServiceJob[] = Array.from({ length: 5 }, (_, cycle) =>
	seedJobs.map((job, index) => {
		// The per-row term decorrelates the cycles, so repeat visits to the same
		// site spread across the calendar instead of stacking up next to each
		// other once the table sorts by date.
		const cycleDays = cycle === 0 ? 0 : cycle * 37 + ((index * 13) % 29)
		const when = Date.parse(job.scheduledAt) + DATE_SHIFT_MS - cycleDays * DAY_MS
		const scheduledOn = new Date(when)
		return {
			...job,
			id: cycle === 0 ? job.id : `SJ-${1999 - (cycle - 1) * seedJobs.length - index}`,
			status: statusForDate(job.status, when),
			scheduledAt: scheduledOn.toISOString(),
			scheduledOn,
			quoted: cycle === 0 ? job.quoted : job.quoted + ((index * 17) % 9) * 10,
		}
	}),
).flat()
