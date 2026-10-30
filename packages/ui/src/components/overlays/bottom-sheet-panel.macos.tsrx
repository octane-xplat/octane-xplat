/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import { appKitHost, hostGlobal } from '../../internal/platform/host-bridge'
import { useEffect, useRef } from 'octane'
import { useThemeScheme } from '../../theme/theme-scheme'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { cx } from '@octane-xplat/lib'

/** Imperative content gets the same handle, scrolling and live theme as a
 * declaration. Context stays inside this detached root. */
export function ImperativeSheetPanel(props: {
	component: any
	params: any
	close: (result?: any) => void
}): unknown @{
	const dark = useThemeScheme() === 'dark'
	const dismissal = useLayerDismissal({
		active: true,
		dismiss: () => props.close('closed'),
		restoreFocus: false,
	})

	const view = useRef<any>(null)
	useEffect(() => {
		appKitHost()?.setSurfaceAppearance?.(view.current, dark)
	}, [dark])

	<LayerDepthProvider value={dismissal.depth}>
		<masonview
			ref={view}
			className={cx('vx-sheet', 'vx-bottom-sheet', dark && 'ns-dark')}
			style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
		>
			<label className="vx-sheet-grabber" accessibilityLabel="Drag to resize sheet">
				―
			</label>
			<scrollview>
				<{props.component}
					params={props.params}
					close={props.close}
				/>
			</scrollview>
		</masonview>
	</LayerDepthProvider>
}
