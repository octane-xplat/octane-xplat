const vibrate = (pattern: number | number[]) => {
	if (typeof navigator !== 'undefined') {
		navigator.vibrate?.(pattern)
	}
}

export const playPreset = () => vibrate([12, 35, 18])
export const playCustomPattern = () => vibrate([0, 35, 55, 75])
export const setRealtime = (_value: number) => {}
export const stopRealtime = () => vibrate(0)
