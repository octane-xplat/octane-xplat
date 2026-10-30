/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { useEffect, useRef, useState } from 'octane'
import { GridLayout, isAndroid, isIOS } from '@nativescript/core'
import { createPortal } from '../../internal/platform/native-portal'
import { SizeProvider } from '../layout/size-context'
import type { OverlayProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyThemeClasses } from '../../theme/theme-host'
import { rootLayoutFor } from '../layout/root-layout'
import { createOverlayLifetime } from './overlay-lifetime'
import { addBackInterceptor } from '../../routing/back-interceptors'

type OpenOverlay = {
	host: GridLayout
	lifetime: ReturnType<typeof createOverlayLifetime>
	unbindTheme?: () => void
}

/** Renders children in a portal hosted above the current screen. */
export function Overlay(props: OverlayProps): unknown @{
	const shown = useRef<OpenOverlay | null>(null)
	const hostView = useRef<any>(null)
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const requestDismiss = () => {
		if (props.open === undefined) {
			setInternal(false)
		}

		props.onDismiss?.()
	}

	const dismiss = useRef(requestDismiss)
	dismiss.current = requestDismiss
	const modal = !!(props.shadeCover || props.isModal)

	const rootLayout = () => rootLayoutFor(hostView.current)

	const applyIosModal = (host: GridLayout) => {
		if (!isIOS) {
			return
		}

		const apply = () => {
			const v = (host as any).ios
			if (v) {
				v.accessibilityViewIsModal = modal
			}
		}

		if ((host as any).isLoaded) {
			apply()
		} else {
			;(host as any).once?.('loaded', apply)
		}
	}

	useEffect(() => {
		if (!open || !modal || !isAndroid) {
			return
		}

		return addBackInterceptor(() => {
			dismiss.current?.()
			return true
		})
	}, [open, modal])

	useEffect(() => {
		const current = shown.current
		if (!open) {
			current?.lifetime.close()
			return
		}

		if (current) {
			current.unbindTheme?.()
			current.unbindTheme = applyThemeClasses(current.host, cx('vx-overlay-host', props.className))
			current.host.testID = props.testID ?? ''
			current.host.accessibilityLabel = props.accessibilityLabel ?? ''
			if (props.style) {
				Object.assign(current.host.style, props.style)
			}

			current.host.accessibilityLabel = props.accessibilityLabel ?? ''
			Object.assign(current.host, isIOS ? props.ios : isAndroid ? props.android : undefined)
			applyIosModal(current.host)
			return
		}

		const rl = rootLayout()
		if (!rl) {
			return
		}

		const host = new GridLayout()
		const unbindTheme = applyThemeClasses(host, cx('vx-overlay-host', props.className))
		host.testID = props.testID ?? ''
		host.accessibilityLabel = props.accessibilityLabel ?? ''
		host.horizontalAlignment = 'stretch'
		host.verticalAlignment = 'stretch'
		if (props.style) {
			Object.assign(host.style, props.style)
		}

		host.accessibilityLabel = props.accessibilityLabel ?? ''
		Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined)
		applyIosModal(host)
		const lifetime = createOverlayLifetime(rl, host, null, 'Overlay', (dismissed) => {
			if (shown.current?.host === host) {
				shown.current = null
				setPortalHost(null)
			}

			if (dismissed) {
				dismiss.current?.()
			}
		})

		const opened = { host, lifetime, unbindTheme }
		lifetime.own(() => opened.unbindTheme?.())
		shown.current = opened
		setPortalHost(host)
		lifetime.open(
			props.shadeCover
				? {
						shadeCover: { opacity: 0.45, color: '#000000', tapToClose: true },
					}
				: {},
		)
	}, [
		open,
		props.children,
		props.shadeCover,
		props.isModal,
		props.className,
		props.style,
		props.accessibilityLabel,
		props.testID,
		props.ios,
		props.android,
	])

	useEffect(() => () => shown.current?.lifetime.close(), [])

	<>
		<masonview
			ref={(v: any) => {
				hostView.current = v
			}}
			style={mergeStyle(
				{ flexDirection: 'column' },
				mergeStyle({ display: 'flex' }, { width: 0, height: 0 }),
			)}
		/>
		{open && portalHost
			? createPortal(
					<>
						<SizeProvider value={null}>{props.children}</SizeProvider>
					</>,
					portalHost,
				)
			: null}
	</>
}
