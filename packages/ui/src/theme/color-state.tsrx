import { useEffect, useRef, useState } from 'octane'
import { clampHsb, hsbForValue, hsbToHex, normalizeHex, type Hsb } from './color'
import type { ColorValueProps } from '../props'

const DEFAULT_PLAIN = '#000000'

export interface ColorState {
	hsb: Hsb
	hex: string
	/** Commit a continuous change (drag step, keyboard step): updates the
	 *  controlled value via onChange; stores it when uncontrolled. */
	set: (hsb: Hsb) => void
	/** Commit a hex string — keeps the working hue when achromatic. */
	setHex: (hex: string) => void
	/** Signal a committed change — calls onChangeEnd with the live hex. */
	end: () => void
}

/** Controlled/uncontrolled color state in HSB. Holds its own working copy so
 *  a drag in the area never loses hue while the color reports achromatic;
 *  resyncs from `props.value` only when the normalized hex differs. */
export function useColorState(props: ColorValueProps, defaultValue?: string): ColorState {
	const initial = () =>
		hsbForValue(
			null,
			normalizeHex(props.value ?? props.defaultValue ?? defaultValue ?? DEFAULT_PLAIN) ??
				DEFAULT_PLAIN,
		)

	const [hsb, setHsb] = useState<Hsb>(initial)
	// Live copy for end(): the state read inside a host-bound pan callback can
	// be one render stale; the ref always carries the latest.
	const live = useRef(hsb)
	live.current = hsb

	const normalized = normalizeHex(props.value)
	useEffect(() => {
		if (normalized && normalized !== hsbToHex(live.current)) {
			setHsb(hsbForValue(live.current, normalized))
		}
	}, [normalized])

	const set = (next: Hsb) => {
		next = clampHsb(next)
		live.current = next
		if (props.value === undefined) {
			setHsb(next)
		}

		props.onChange?.(hsbToHex(next))
	}

	// Hex commit path (ColorField): goes through hsbForValue so achromatic
	// input keeps the working hue.
	const setHex = (hex: string) => set(hsbForValue(live.current, hex))
	const end = () => props.onChangeEnd?.(hsbToHex(live.current))

	return { hsb, hex: hsbToHex(hsb), set, setHex, end }
}
