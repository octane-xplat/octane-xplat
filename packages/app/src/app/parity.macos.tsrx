/** @jsxImportSource @xplat/macos/renderer */
import { Screen, ScrollableArea, View } from '@octane-xplat/ui';
import { ParityStage } from '../parity/stage.tsrx';

/** Parity route — macOS variant. The AppKit host has no CSS scrollport
 *  (.vx-app's overflow is a web token), so the stage rides a real
 *  ScrollableArea; `id` lets automation scroll it. The .vx-app surface
 *  padding (24) lives inside the scroll document so scroll positions
 *  match the web's padded scroller exactly. */
export function Parity() @{
	<Screen id="parity-screen" className="vx-app">
		<ScrollableArea id="parity-scroll" className="flex-1">
			<View id="parity-pad" style={{ padding: 24 }}>
				<ParityStage />
			</View>
		</ScrollableArea>
	</Screen>
}
