export type ImageFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
interface AxisPosition { fraction: number; offset: number }
export interface ImagePosition { x: AxisPosition; y: AxisPosition }
export interface ImageRect { x: number; y: number; width: number; height: number }

const centered = (): ImagePosition => ({ x: { fraction: 0.5, offset: 0 }, y: { fraction: 0.5, offset: 0 } })
const horizontal = (value: string) => value === 'left' || value === 'right'
const vertical = (value: string) => value === 'top' || value === 'bottom'
function length(value: string): { value: number; percent: boolean } | null {
	const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px|%)?$/i.exec(value)
	if (!match || !Number.isFinite(Number(match[1])) || (!match[2] && Number(match[1]) !== 0)) {return null}
	return { value: Number(match[1]), percent: match[2] === '%' }
}
function fromEdge(edge: string, amount = { value: 0, percent: false }): AxisPosition {
	const end = edge === 'right' || edge === 'bottom'
	return amount.percent ? { fraction: end ? 1 - amount.value / 100 : amount.value / 100, offset: 0 } :
		{ fraction: end ? 1 : 0, offset: end ? -amount.value : amount.value }
}
function axis(value: string, isHorizontal: boolean): AxisPosition | null {
	if (value === 'center') {return { fraction: 0.5, offset: 0 }}
	if ((isHorizontal ? horizontal : vertical)(value)) {return fromEdge(value)}
	const amount = length(value)
	return amount ? fromEdge(isHorizontal ? 'left' : 'top', amount) : null
}

/** Keywords, px/percentage pairs and edge-offset groups emitted by the shared
 * Image serializer. Other CSS units and calc()/var() expressions are not parsed. */
export function parseImagePosition(value: unknown): ImagePosition | null {
	if (value == null || String(value).trim() === '') {return centered()}
	const result = centered()
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) {return null}
		result.x = fromEdge('left', { value, percent: false })
		return result
	}
	const tokens = String(value).trim().toLowerCase().split(/\s+/)
	if (tokens.length === 1) {
		if (vertical(tokens[0])) {result.y = fromEdge(tokens[0])}
		else {
			const x = axis(tokens[0], true)
			if (!x) {return null}
			result.x = x
		}
		return result
	}
	if (tokens.length === 2) {
		let [x, y] = tokens
		if (vertical(x) || horizontal(y)) {
			if (length(x) || length(y)) {return null
			;}[x, y] = [y, x]
		}
		const parsedX = axis(x, true), parsedY = axis(y, false)
		return parsedX && parsedY ? { x: parsedX, y: parsedY } : null
	}
	if (tokens.length !== 4) {return null}
	let hasX = false, hasY = false
	for (let index = 0; index < 4; index += 2) {
		const edge = tokens[index], amount = length(tokens[index + 1])
		const x = horizontal(edge), y = vertical(edge)
		if (!amount || (!x && !y) || (x && hasX) || (y && hasY)) {return null}
		if (x) { result.x = fromEdge(edge, amount); hasX = true }
		else { result.y = fromEdge(edge, amount); hasY = true }
	}
	return hasX && hasY ? result : null
}

/** CSS-style top-left content rectangle in the NSImage's logical point space. */
export function imageContentRect(
	fit: ImageFit, position: ImagePosition, width: number, height: number, imageWidth: number, imageHeight: number,
): ImageRect | null {
	if (![width, height, imageWidth, imageHeight].every((value) => Number.isFinite(value) && value > 0)) {return null}
	let scale = 1
	if (fit === 'cover') {scale = Math.max(width / imageWidth, height / imageHeight)}
	else if (fit === 'contain') {scale = Math.min(width / imageWidth, height / imageHeight)}
	else if (fit === 'scale-down') {scale = Math.min(1, width / imageWidth, height / imageHeight)}
	const drawnWidth = fit === 'fill' ? width : imageWidth * scale
	const drawnHeight = fit === 'fill' ? height : imageHeight * scale
	const rect = {
		x: (width - drawnWidth) * position.x.fraction + position.x.offset,
		y: (height - drawnHeight) * position.y.fraction + position.y.offset,
		width: drawnWidth, height: drawnHeight,
	}
	return Object.values(rect).every(Number.isFinite) ? rect : null
}
