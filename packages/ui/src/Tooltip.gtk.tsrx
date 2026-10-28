/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { TooltipProps } from './props'
import { View } from './View'
import { Text } from './Text'
import { createPortal } from './native-portal'

/** Native GTK owns intent and popup geometry; the portal keeps content in
	* this component's universal root, including its context and updates. */
export function Tooltip(props: TooltipProps) @{
	const anchor = useRef<any>(null)
	const [session, setSession] = useState<any>(null)
	const [open, setOpen] = useState(false)
	const options = {
		disabled: props.disabled,
		openDelay: props.openDelay,
		closeDelay: props.closeDelay,
		placement: props.placement,
		onOpen: () => setOpen(true),
		onClose: () => setOpen(false),
	}
	const current = useRef(options)
	current.current = options
	useEffect(() => {
		const live = anchor.current.createTooltip(current.current)
		setSession(live)
		return () => live.dispose()
	}, [])
	useEffect(() => { session?.configure(options) }, [session, props.disabled, props.openDelay, props.closeDelay, props.placement])
	useEffect(() => {
		if (open) session?.show()
		else session?.hide()
	}, [session, open])
	const content = typeof props.content === 'string' || typeof props.content === 'number'
		? <Text>{props.content}</Text> : props.content

	<>
		<View id={props.id} className={props.className} style={props.style} ref={anchor}>{props.trigger}</View>
		{open && session ? createPortal(
			<View className={cx('vx-tooltip', props.contentClassName)} style={props.contentStyle}>{content}</View>,
			session.target,
		) : null}
	</>
}
