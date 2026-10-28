import { NSBezierPath, NSCompositingOperation, NSGraphicsContext } from '@octane-xplat/platform/macos'
import type { NSImageView } from '@octane-xplat/platform/macos'
import { imageContentRect, parseImagePosition, type ImageFit, type ImagePosition } from './image-fit.ts'

interface DrawingStyle { fit?: string; position?: ImagePosition }
const styles = new WeakMap<object, DrawingStyle>()
const nativeScaling = { contain: 3, cover: 3, fill: 1, none: 2, 'scale-down': 0 } as const
const nativeFit: Record<number, ImageFit> = { 0: 'scale-down', 1: 'fill', 2: 'none', 3: 'contain' }
let warnedPosition = false

/** Preserve native NSImageView behavior when no authored fit/position remains. */
export function setImageDrawingStyle(view: NSImageView, name: 'objectFit' | 'objectPosition', value: unknown): void {
	const style = styles.get(view) ?? {}
	if (name === 'objectFit') {
		if (value == null) delete style.fit
		else style.fit = String(value)
		const fit = String(value)
		view.imageScaling = Object.hasOwn(nativeScaling, fit) ? nativeScaling[fit as ImageFit] : 0
	} else if (value == null) delete style.position
	else {
		const position = parseImagePosition(value)
		if (!position && !warnedPosition) {
			warnedPosition = true
			console.warn('[macos-image] objectPosition supports keywords, px and percentages; unsupported values use center')
		}
		style.position = position ?? parseImagePosition(undefined)!
	}
	if (style.fit === undefined && style.position === undefined) styles.delete(view)
	else styles.set(view, style)
	view.needsDisplay = true
}

/** Return false for unstyled or not-yet-drawable native content. NSImageView still owns the
 * image, intrinsic measurement and accessibility; only drawing is normalized. */
export function drawImageContent(view: NSImageView): boolean {
	const style = styles.get(view)
	if (!style) return false
	const image = view.image
	if (!image) return false
	const bounds = view.bounds
	const fit = style.fit && Object.hasOwn(nativeScaling, style.fit) ? style.fit as ImageFit : nativeFit[Number(view.imageScaling)] ?? 'scale-down'
	const rect = imageContentRect(fit, style.position ?? parseImagePosition(undefined)!,
		Number(bounds.size.width), Number(bounds.size.height), Number(image.size.width), Number(image.size.height))
	if (!rect) return false
	const destination = {
		origin: { x: bounds.origin.x + rect.x, y: bounds.origin.y + (view.flipped ? rect.y : bounds.size.height - rect.y - rect.height) },
		size: { width: rect.width, height: rect.height },
	}
	NSGraphicsContext.saveGraphicsState()
	try {
		NSBezierPath.clipRect(bounds)
		image.drawInRectFromRectOperationFractionRespectFlippedHints(destination,
			{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
			NSCompositingOperation.SourceOver, 1, true, null)
	} finally { NSGraphicsContext.restoreGraphicsState() }
	return true
}
