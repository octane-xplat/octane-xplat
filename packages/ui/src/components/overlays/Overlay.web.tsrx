/** @jsxImportSource @octane-xplat/jsx/dom */
import { createPortal, useEffect, useRef, useState } from 'octane'
import { styleRecord } from '../../internal/layout/style-merge'
import type { OverlayProps } from '../../props'
import { useThemeScheme } from '../../theme/theme-scheme'
import { cx } from '@octane-xplat/lib'
import { isolateModalFocus } from './modal-focus.web'
import { SizeProvider } from '../layout/size-context'
import type { JSX } from 'octane/jsx-runtime'

/** Renders an in-window overlay through the DOM renderer's body portal. */
export function Overlay(props: OverlayProps): JSX.Element | null @{
	const dark = useThemeScheme() === 'dark'
	const layer = useRef<HTMLDivElement | null>(null)
	const panel = useRef<HTMLDivElement | null>(null)
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
	useEffect(() => {
		if (!open || !modal || !layer.current || !panel.current) {
			return
		}

		return isolateModalFocus(layer.current, panel.current, () => dismiss.current?.())
	}, [open, modal])

	@if (open) {
		<>
			{createPortal(
				<div
					ref={layer}
					data-vx-modal-layer={modal ? '' : undefined}
					className={cx('vx-overlay', dark && 'dark', props.className)}
					style={{ ...styleRecord(props.style), position: 'fixed', inset: 0 }}
					{...props.web}
				>
					@if (props.shadeCover) {
						<div className="vx-overlay-shade" onClick={requestDismiss} />
					}
					<div
						ref={panel}
						data-testid={props.testID}
						role={modal ? 'dialog' : undefined}
						aria-modal={modal ? true : undefined}
						aria-label={
							modal && !props.accessibilityLabelledBy ? props.accessibilityLabel : undefined
						}
						aria-labelledby={modal ? props.accessibilityLabelledBy : undefined}
						aria-describedby={modal ? props.accessibilityDescribedBy : undefined}
						className="vx-overlay-content"
						onClick={(event: any) => event.stopPropagation()}
					>
						<SizeProvider value={null}>{props.children}</SizeProvider>
					</div>
				</div>,
				document.body,
			)}
		</>
	}
}
