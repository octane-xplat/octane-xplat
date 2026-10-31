/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useEffect, useId, useRef, useState } from 'octane'
import type { TooltipOptions, TooltipReturn } from '../../props'
import { View } from '../layout/View'
import { Text } from '../content/Text'
import { createPortal } from '../../internal/platform/native-portal'

/** GTK positioning and interaction can belong to different native views.
 * Slider uses the thumb for position and the control for hover/focus. This
 * hook stays outside the GTK root until its remaining options are qualified. */
export function useTooltip(options: TooltipOptions = {}): TooltipReturn {
	const id = useId()
	const [position, setPosition] = useState<any>(null)
	const [interaction, setInteraction] = useState<any>(null)
	const [session, setSession] = useState<any>(null)
	const activeSession = useRef<any>(null)
	const [internal, setInternal] = useState(options.isDefaultOpen ?? false)
	const current = useRef(options)
	current.current = options
	const enabled = options.isEnabled !== false
	const open = enabled && (options.isOpen === undefined ? internal : options.isOpen)
	const opened = useRef(open)
	opened.current = open
	const configuration = () => {
		const value = current.current
		const side = value.placement ?? 'above'
		const rtl = interaction?.get_direction?.() === 2
		const placement = side === 'above' ? 'top' : side === 'below' ? 'bottom'
			: side === 'start' ? rtl ? 'right' : 'left'
			: side === 'end' ? rtl ? 'left' : 'right' : side
		return {
			interactionTarget: interaction,
			placement,
			disabled: value.isEnabled === false || value.isOpen === false,
			openDelay: value.delay ?? 200,
			closeDelay: value.hideDelay ?? 0,
			onOpen() {
				if (current.current.isOpen === undefined) setInternal(true)
				if (!opened.current) current.current.onShow?.()
			},
			onClose() {
				if (current.current.isOpen === undefined) setInternal(false)
				if (opened.current) current.current.onHide?.()
			},
		}
	}
	useEffect(() => {
		if (!enabled || !position || !interaction) {
			setSession(null)
			if (!enabled) setInternal(false)
			return
		}
		const live = position.createTooltip(configuration())
		activeSession.current = live
		setSession(live)
		const loaded = () => { if (opened.current) live.show() }
		position.on('loaded', loaded)
		return () => { activeSession.current = null; position.off('loaded', loaded); live.dispose() }
	}, [enabled, position, interaction])
	useEffect(() => { session?.configure(configuration()) }, null)
	useEffect(() => {
		if (open) session?.show()
		else session?.hide()
	}, [session, open])
	const positionRef = useCallback((view: any) => setPosition(view), [])
	const interactionRef = useCallback((view: any) => setInteraction(view), [])
	const ref = useCallback((view: any) => { positionRef(view); interactionRef(view) }, [])
	return {
		ref, positionRef, interactionRef, anchorId: id, describedBy: id,
		renderTooltip(children, props) {
			if (!open || !session || activeSession.current !== session) return null
			const content = typeof children === 'string' || typeof children === 'number' ? <Text>{children}</Text> : children
			return createPortal(<View id={id} className={['vx-tooltip', props?.className]} style={props?.style}>{content}</View>, session.target)
		},
	}
}
