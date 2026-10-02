/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useRef } from 'octane'
import { useThemeScheme } from './theme/theme-scheme'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { cx } from './cx'

/** Imperative content gets the same handle, scrolling and live theme as a
 * declaration. Context stays inside this detached root. */
export function ImperativeSheetPanel(props: { component: any; params: any; close: (result?: any) => void }) @{
	const dark = useThemeScheme() === 'dark'
	const dismissal = useLayerDismissal({ active: true, dismiss: () => props.close('closed'), restoreFocus: false })
	const view = useRef<any>(null)
	useEffect(() => { (globalThis as any).__xplatAppKit?.setSurfaceAppearance?.(view.current, dark) }, [dark])

	<LayerDepthProvider value={dismissal.depth}>
	<flexboxlayout flexDirection="column" ref={view} className={cx('vx-sheet', 'vx-bottom-sheet', dark && 'ns-dark')}>
		<label className="vx-sheet-grabber" accessibilityLabel="Drag to resize sheet">―</label>
		<scrollview><{props.component} params={props.params} close={props.close} /></scrollview>
	</flexboxlayout>
	</LayerDepthProvider>
}
