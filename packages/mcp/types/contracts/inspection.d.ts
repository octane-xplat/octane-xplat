import type { EvidenceRecord } from './evidence'

/** Qualified scope of Chromium inspection; never a universal component tree. */
export const CHROMIUM_INSPECTION_COVERAGE: string

/** Select exactly one named DOM host. Duplicate names fail rather than choosing the first. */
export interface StableControl {
	kind: 'id' | 'testID'
	name: string
}

export interface InspectedHost {
	id: string | null
	testID: string | null
	tag: string
	role: string | null
	/** Bounded to 500 characters; password and data-xplat-private hosts are redacted. */
	text: string
	value: string | null
	checked: boolean | null
	disabled: boolean
	hidden: boolean
	sensitive: boolean
	focused: boolean
	hitTarget: boolean
	/** Main-document CSS pixels, relative to the viewport. */
	frame: { x: number; y: number; width: number; height: number }
}

/** Returned by xplat_inspect; documentId must accompany subsequent interactions. */
export interface HostInspection {
	documentId: string
	controls: InspectedHost[]
	coverage: string
	limitations: string[]
	total: number
	nextOffset: number | null
	evidence: EvidenceRecord
}

/** Input submission proves delivery only; observe and assert the intended state separately. */
export interface HostInteraction extends HostInspection {
	inputSent: true
	assertion: string
}
