import type { TextAreaProps } from './props'
import { styleRecord } from './style-merge'

/** GTK font layouts report logical pixels. Clear generated ref overrides
 * when authored constraints take over so CSS lengths remain declarative. */
export function fitTextArea(
	view: any,
	props: Pick<TextAreaProps, 'rows' | 'autoGrow' | 'maxRows' | 'style'>,
): () => void {
	if (!view) {
		return () => {}
	}
	const fit = () => {
		const style = styleRecord(props.style)
		const explicitHeight = style?.height != null
		// Buffer line ranges may still be invalid during loaded/text updates.
		const fontLine = view.create_pango_layout('Mg').get_pixel_size()[1]
		// create_pango_layout copies the font, but not GTK CSS line-height.
		// Read the resolved style so ancestor selectors participate too.
		const spacing = view.style.lineHeight
		const pixels =
			typeof spacing === 'number'
				? spacing
				: typeof spacing === 'string' && /^\d+(?:\.\d+)?(?:px|dip)?$/.test(spacing.trim())
					? Number.parseFloat(spacing)
					: undefined
		const line = pixels != null && pixels > 0 ? Math.ceil(pixels) : fontLine
		const rows = props.rows ?? (props.autoGrow ? 1 : 3)
		view.style.minHeight = explicitHeight || style?.minHeight != null ? undefined : rows * line
		view.style.maxHeight =
			explicitHeight || style?.maxHeight != null
				? undefined
				: props.maxRows
					? props.maxRows * line
					: props.autoGrow
						? undefined
						: rows * line
	}
	let tick: number | null = null
	const stop = () => {
		if (tick !== null) {
			view.remove_tick_callback(tick)
		}
		tick = null
	}
	const schedule = () => {
		stop()
		let frames = 0
		// GTK validates font CSS across the frame boundary. Refit after that
		// validation, then stop; leave no permanent frame-clock reader.
		tick = view.add_tick_callback(() => {
			fit()
			if (++frames < 2) {
				return true
			}
			tick = null
			return false
		})
	}
	fit()
	schedule()
	const mapped = view.connect('map', schedule)
	const unmapped = view.connect('unmap', stop)
	const classes = view.connect('notify::css-classes', schedule)
	view.on('fontChanged', schedule)
	return () => {
		stop()
		view.disconnect(mapped)
		view.disconnect(unmapped)
		view.disconnect(classes)
		view.off('fontChanged', schedule)
	}
}
