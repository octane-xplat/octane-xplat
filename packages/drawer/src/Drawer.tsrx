/** @jsxImportSource @octane-xplat/jsx */
import { registerElement } from '@nativescript-community/octane'
import { Drawer as PluginDrawer, install } from '@nativescript-community/ui-drawer'
import { Application, isAndroid, isIOS } from '@nativescript/core'
import { useCallback, useEffect, useRef } from 'octane'
import { cx } from '@octane-xplat/lib'
import type { DrawerProps } from './props'
import { bindDrawer } from './native-binding'

// This module is reachable only through the opt-in drawer package. The
// upstream import also installs gesture lifecycle mixins; do not mark it pure.
install()
class DrawerHost extends PluginDrawer {
	onAnimationError?: (error: unknown) => void
	// Upstream open() does not await animateToPosition(). Catch at the actual
	// animation boundary so failures cannot escape its fire-and-forget call.
	override async animateToPosition(...args: Parameters<PluginDrawer['animateToPosition']>) {
		try {
			await super.animateToPosition(...args)
		} catch (error) {
			this.onAnimationError?.(error)
		}
	}
}

registerElement('xplatDrawer', DrawerHost)

/** Gesture-enabled mobile Drawer. Content and styling belong to the caller;
 * this is a custom native layout, not OS-provided menu chrome. */
export function Drawer(props: DrawerProps): unknown @{
	const latest = useRef(props)
	latest.current = props
	const host = useRef<DrawerHost | null>(null)
	const binding = useRef<ReturnType<typeof bindDrawer> | null>(null)
	const checkReady = useRef<(() => void) | null>(null)
	const onSlotLayout = useCallback(() => {
		queueMicrotask(() => checkReady.current?.())
	}, [])

	const attach = useCallback((view: DrawerHost | null) => {
		host.current = view
	}, [])

	useEffect(() => {
		const view = host.current
		if (!view) {
			return
		}

		const control = bindDrawer(view, () => ({
			...latest.current,
			reducedMotion:
				latest.current.reducedMotion ||
				(isIOS && UIAccessibilityIsReduceMotionEnabled()) ||
				(isAndroid &&
					android.provider.Settings.Global.getFloat(
						Application.android.context.getContentResolver(),
						android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
						1,
					) === 0),
		}))

		binding.current = control
		view.onAnimationError = control.reportError
		const ready = () => {
			if (
				view.isLoaded &&
				view.isSideReady('left') &&
				view.leftDrawer &&
				view.leftDrawer.getActualSize().width > 0
			) {
				control.ready()
			}
		}

		checkReady.current = ready
		const opened = () => control.settled(true)
		const closed = () => control.settled(false)
		const back = (event: { cancel: boolean }) => {
			if (view.isOpened('left')) {
				event.cancel = true
				control.dismiss()
			}
		}

		view.on('open', opened)
		view.on('close', closed)
		view.on('layoutChanged', ready)
		view.on('loaded', ready)
		if (isAndroid) {
			Application.android.on('activityBackPressed', back)
		}

		ready()
		return () => {
			control.dispose()
			view.off('open', opened)
			view.off('close', closed)
			view.off('layoutChanged', ready)
			view.off('loaded', ready)
			if (isAndroid) {
				Application.android.off('activityBackPressed', back)
			}

			view.onAnimationError = undefined
			binding.current = null
			checkReady.current = null
		}
	}, [])

	useEffect(() => {
		binding.current?.sync()
	}, [props.open])

	useEffect(() => {
		const bag = isIOS ? props.ios : props.android
		if (host.current && bag) {
			Object.assign(host.current, bag)
		}
	}, [props.ios, props.android])

	<xplatDrawer
		id={props.id}
		ref={attach}
		className={cx('vx-drawer', props.className)}
		style={props.style}
		gestureEnabled={props.isGestureEnabled !== false}
		backdropColor="rgba(0, 0, 0, 0.4)"
		backdropProperties={{ className: 'vx-drawer-backdrop' }}
	>
		<masonview className="vx-drawer-main" hostSlot="mainContent" style={{ display: 'grid' }}>
			{props.main}
		</masonview>
		<masonview
			hostSlot="leftDrawer"
			onLayoutChanged={onSlotLayout}
			className="vx-drawer-panel"
			accessibilityLabel={props.accessibilityLabel ?? 'Navigation'}
			style={{ display: 'grid', width: props.width ?? 280 }}
		>
			{props.drawer}
		</masonview>
	</xplatDrawer>
}
