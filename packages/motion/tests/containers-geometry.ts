/** The native probe runner selects the iOS/Android leaf. */
export function geometry(_view: any): {
	x: number
	y: number
	width: number
	layoutX: number
	modelWidth: number
} {
	throw new Error('Run the container probe on iOS or Android')
}
