import { useRef } from 'octane'
import { Absolute, View, useMeasure } from '@octane-xplat/ui'
import type { PanEvent } from '@octane-xplat/ui'
import type { CropHandle, ImageCropProps, PixelCrop, Size } from './props'
import { constrainCrop, containFrame, convertToPercentCrop, dragCrop } from './geometry'
import { Gesture } from './Gesture'
import { Guide } from './Guide'
import { Source } from './Source'

const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const

/** Inline controlled selection. View.onPan delegates to the UI usePan leaves. */
export function ImageCrop(props: ImageCropProps) @{
	const measure = useMeasure()
	// Root hosts may offer more space than the explicitly sized image viewport.
	const viewport = { width: Math.min(props.width, measure.bounds?.width ?? props.width), height: Math.min(props.height, measure.bounds?.height ?? props.height) }
	const frame = containFrame(viewport, { width: props.imageWidth, height: props.imageHeight })
	const crop = constrainCrop(props.crop, frame, props)
	const gesture = useRef<{ handle: CropHandle; start: PixelCrop; size: Size; dx: number; dy: number; src: string } | null>(null)
	const pan = (handle: CropHandle, event: PanEvent) => {
		if (props.disabled || frame.width <= 0 || frame.height <= 0) { gesture.current = null; return }
		if (event.state === 'began') {
			gesture.current = { handle, start: crop, size: frame, dx: event.dx, dy: event.dy, src: props.src }
			return
		}

		const active = gesture.current
		if (!active || active.handle !== handle) return
		if (event.state === 'cancelled') { gesture.current = null; return }
		// Layout/source changes invalidate a gesture rather than mixing scales.
		if (active.src !== props.src || active.size.width !== frame.width || active.size.height !== frame.height) { gesture.current = null; return }
		const next = dragCrop(active.start, handle, event.dx - active.dx, event.dy - active.dy, frame, props)
		const percent = convertToPercentCrop(next, frame)
		props.onChange(next, percent)
		if (event.state === 'ended') {
			gesture.current = null
			props.onComplete?.(next, percent)
		}
	}

	const left = frame.x + crop.x, top = frame.y + crop.y

	<View id={props.id} ref={measure.ref} style={{ width: props.width, height: props.height }}>
		<Absolute style={viewport}>
			<Source src={props.src} alt={props.alt} width={viewport.width} height={viewport.height} />
			<Gesture id={props.id ? props.id + '-move' : undefined} left={left} top={top}
				style={{ width: crop.width, height: crop.height, borderWidth: 1, borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.13)' }}
				onPan={props.disabled ? undefined : (e: PanEvent) => pan('move', e)} />
			@if (props.ruleOfThirds) {
				@for (const fraction of [1 / 3, 2 / 3]; key fraction) {
					<>
						<Guide left={left + crop.width * fraction} top={top} style={{ width: 1, height: crop.height, backgroundColor: 'rgba(255,255,255,0.53)' }} />
						<Guide left={left} top={top + crop.height * fraction} style={{ width: crop.width, height: 1, backgroundColor: 'rgba(255,255,255,0.53)' }} />
					</>
				}
			}
			@for (const handle of handles; key handle) {
				const hx = handle.includes('w') ? 0 : handle.includes('e') ? crop.width : crop.width / 2
				const hy = handle.includes('n') ? 0 : handle.includes('s') ? crop.height : crop.height / 2
				// Keep hit regions inside the image, including at image edges.
				const x = Math.max(frame.x, Math.min(left + hx - 12, frame.x + frame.width - 24))
				const y = Math.max(frame.y, Math.min(top + hy - 12, frame.y + frame.height - 24))
				<Gesture id={props.id ? props.id + '-' + handle : undefined} left={x} top={y}
					accessibilityLabel={'Resize crop ' + handle} accessibilityState={{ disabled: props.disabled }}
					style={{ width: Math.min(24, frame.width), height: Math.min(24, frame.height), backgroundColor: props.disabled ? 'rgba(255,255,255,0.27)' : 'rgba(255,255,255,0.53)', borderWidth: 1, borderColor: '#ffffff' }}
					onPan={props.disabled ? undefined : (e: PanEvent) => pan(handle, e)} />
			}
		</Absolute>
	</View>
}
