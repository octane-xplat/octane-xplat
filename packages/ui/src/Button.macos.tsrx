/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'octane'
import type { NSView } from '@octane-xplat/platform/macos'
import { openUrl } from '@octane-xplat/platform'
import { cx } from '@octane-xplat/lib'
import type { ButtonProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { TextSlot } from './text-slot'
import { ActivityIndicator } from './ActivityIndicator.macos.tsrx'
import { Icon } from './Icon.macos.tsrx'
import { useButtonGroup } from './button-group-context'
import { useSize } from './size-context'
import { mergeStyle } from './style-merge'
import { sanitizeUrl } from './safe-url'
import { reportActionError } from './action-error'
import { refList } from './ref-list'

export function Button(props: ButtonProps) @{
	const group = useButtonGroup()
	const size = useSize(props.size ?? group?.size, 'md')
	const [pending, setPending] = useState(false)
	const actions = useRef(new Set<symbol>())
	const attached = useRef(true), host = useRef<NSView | null>(null)
	const live = useRef({ props, group }); live.current = { props, group }
	// A caller ref may change during an accepted action; only teardown retires it.
	const bind = useCallback((view: NSView | null) => { host.current = view }, [])
	const ref = useMemo(() => refList(bind, props.ref), [bind, props.ref])
	useLayoutEffect(() => {
		attached.current = true
		return () => { attached.current = false; actions.current.clear() }
	}, [])
	const busy = Boolean(props.isLoading || pending)
	const isDisabled = Boolean(props.isDisabled || group?.isDisabled)
	const disabled = isDisabled || (busy && !props.isInterruptible)
	const press = () => {
		const { props, group } = live.current
		const busy = Boolean(props.isLoading || actions.current.size)
		if (!attached.current || !host.current || props.isDisabled || group?.isDisabled || (busy && !props.isInterruptible)) return
		// URL dispatch is an external effect too; claim before it can reenter.
		const token = Symbol('button-action')
		actions.current.add(token)
		const settle = () => {
			if (!actions.current.delete(token) || !attached.current) return
			setPending(actions.current.size > 0)
		}
		try {
			if (props.href != null) {
				const url = sanitizeUrl(props.href)
				if (url != null) openUrl(url)
			}
		} catch (error) { settle(); throw error }
		try {
			const action = props.clickAction?.()
			if (action && typeof action.then === 'function') {
				if (attached.current && actions.current.has(token)) setPending(true)
				Promise.resolve(action).then(settle, (error) => {
					settle()
					reportActionError(error, props.onActionError)
				})
			} else settle()
		} catch (error) { settle(); reportActionError(error, props.onActionError) }
	}
	const icon = typeof props.icon === 'string' ? <Icon name={props.icon} /> : props.icon
	const label = props.children != null ? <TextSlot className="vx-button-label">{props.children}</TextSlot>
		: props.label != null ? <label className="vx-button-label" text={props.label} /> : null
	const content = props.isIconOnly ? (icon ?? label) : <>{icon}{label}{props.endContent}</>

	<Pressable {...props}
		ref={ref}
		disabled={disabled} onPress={press}
		className={cx('vx-button', `vx-button--${props.variant ?? 'secondary'}`, `vx-button--size-${size}`,
			group && `vx-button--group-${group.position}`, props.isIconOnly && 'vx-button--icon',
			props.elevation && props.elevation !== 'none' && `vx-button--elev-${props.elevation}`,
			busy && 'vx-button--loading', isDisabled && 'vx-button--disabled', props.className)}
		style={mergeStyle(busy ? { display: 'grid', gridTemplateRows: '1fr', gridTemplateColumns: '1fr' } : {}, props.style)}
		accessibilityRole={props.accessibilityRole ?? 'button'}
		accessibilityLabel={props.accessibilityLabel ?? (props.isIconOnly || busy ? props.label : undefined)}
		accessibilityState={{ ...props.accessibilityState, busy: busy || undefined }}
		accessibilityValue={props.accessibilityValue ?? (busy ? 'Loading' : undefined)}>
		<masonview className={cx('vx-button-content', busy && 'vx-button-content--hidden')}
			style={busy ? { gridRow: '1', gridColumn: '1', justifySelf: 'stretch', alignSelf: 'stretch' } : undefined}>
			{content}
		</masonview>
		{busy ? <masonview className="vx-button-spinner" accessible={false}
			style={{ gridRow: '1', gridColumn: '1', justifySelf: 'center', alignSelf: 'center' }}>
			<ActivityIndicator />
		</masonview> : null}
	</Pressable>
}
