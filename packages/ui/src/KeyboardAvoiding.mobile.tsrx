/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'octane'
import { refList } from './ref-list'
import { Application } from '@nativescript/core'
import { cx } from '@octane-xplat/lib'
import type { KeyboardAvoidanceBinding } from './keyboard-avoidance'
import { bindKeyboardAvoidance } from './keyboard-avoidance'
import { KeyboardAvoidanceContext, KeyboardAvoidanceProvider } from './keyboard-avoidance-context'
import { useConsumedInsets } from './inset-consumption'
import type { KeyboardAvoidingProps } from './props'

export function KeyboardAvoiding(props: KeyboardAvoidingProps) @{
	const enabled = props.enabled ?? true
	const [host, setHost] = useState<any>(null)
	const attach = useCallback((next: any) => setHost(next), [])

	const forwardedRef = useMemo(() => refList(attach, props.ref), [attach, props.ref])
	const [content, setContent] = useState<any>(null)
	const attachContent = useCallback((next: any) => setContent(next), [])
	const [provided, setProvided] = useState<{
		window?: object
		bottom: number
	}>({ bottom: 0 })

	const consumed = useConsumedInsets()
	const ancestor = useContext(KeyboardAvoidanceContext)
	const platformProps = Application.ios != null ? props.ios : props.android
	useEffect(() => {
		if (host && platformProps) {
			Object.assign(host, platformProps)
		}
	}, [host, platformProps])

	const options = useRef({
		safeBottom: consumed.bottom,
		ancestorWindow: ancestor.window,
		ancestorBottom: ancestor.bottom,
		offset: props.keyboardVerticalOffset,
	})

	options.current = {
		safeBottom: consumed.bottom,
		ancestorWindow: ancestor.window,
		ancestorBottom: ancestor.bottom,
		offset: props.keyboardVerticalOffset,
	}

	const binding = useRef<KeyboardAvoidanceBinding | null>(null)
	useEffect(() => {
		if (!enabled || !host || !content) {
			setProvided({ bottom: 0 })
			return
		}

		const own = bindKeyboardAvoidance(host, content, () => options.current, setProvided)
		binding.current = own
		return () => {
			binding.current = null
			own()
		}
	}, [enabled, host, content])

	useEffect(() => {
		binding.current?.update()
	}, [consumed.bottom, ancestor.window, ancestor.bottom, props.keyboardVerticalOffset])

	<scrollview
		id={props.id}
		className={cx('vx-keyboard-avoiding', props.className)}
		style={props.style}
		ref={forwardedRef}
	>
		<KeyboardAvoidanceProvider value={provided}>
			<masonview style={{ display: 'flex', flexDirection: 'column' }} ref={attachContent}>
				{props.children}
			</masonview>
		</KeyboardAvoidanceProvider>
	</scrollview>
}
