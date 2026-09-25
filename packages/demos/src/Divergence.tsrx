import { Row, Screen, Text, View } from '@octane-xplat/ui';

/** Flex/text divergence probes — the spots where NS FlexboxLayout isn't web
 *  flexbox and identical markup renders differently. Each case is sized/
 *  positioned so the sweep can measure getActualSize/getLocationOnScreen:
 *  dv-grow:  auto-height row with a flex-grow child — NS's grow pass
 *            re-measures children at a zero height spec; the web keeps the
 *            declared 40. (text-coral patched this with min-height guards.)
 *  dv-lh:    line-height on a Label — iOS text can clip or mis-measure.
 *  dv-auto:  margin-left:auto trailing — unsupported on NS; web pushes the
 *            trailing item to the row's right edge.
 *  dv-basis: flex-grow without guards — measured IDENTICAL on web: the
 *            fixed sibling shrinks below its declared width (flex items
 *            default to min-width:auto = min-content on both engines).
 *            The dv-fix row shows the shrink-0 + min-w-0 utilities. */
export function Divergence() @{
	<Screen className="vx-app flex-1 gap-4">
		<Text className="text-xl font-bold">Divergence probes</Text>

		<Row id="dv-grow" className="dv-row">
			<Text id="dv-grow-text">grow text</Text>
			<View id="dv-grow-fill" className="dv-grow-fill" />
		</Row>

		<Row className="dv-row items-center">
			<Text id="dv-lh" className="dv-lh">LineHeight gyÊ</Text>
			<Text id="dv-lh2" style={{ lineHeight: 40 }}>inline lh</Text> {/* xplat-disable-line */}
		</Row>

		<Row className="dv-row">
			<Text>lead</Text>
			<Text id="dv-auto" className="dv-auto">trail</Text>
		</Row>

		<Row className="dv-row" justifyContent="space-between">
			<Text>lead</Text>
			<Text id="dv-auto-fix">trail via justify</Text>
		</Row>

		<Row className="dv-row">
			<Text id="dv-wide" className="dv-wide">long intrinsic text that wants a lot of width on its own</Text>
			<View id="dv-sib" className="dv-sib" />
		</Row>

		<Row className="dv-row">
			<Text id="dv-wide-fix" className="dv-wide min-w-0">long intrinsic text with min-w-0 guard</Text>
			<View id="dv-sib-fix" className="dv-sib shrink-0" />
		</Row>

		{/* The collapse needs a CONTENT-SIZED row — a direct Screen child
		    fills the rootlayout cell, so wrap in a column. Composer shape:
		    fixed avatar + grow body with intrinsic-height content. */}
		<View id="dv-collapse" className="gap-4">
			<Row id="dv-collapse-row" className="items-start shrink-0">
				<View id="dv-coll-avatar" style={{ width: 46, height: 46 }} />
				<View id="dv-coll-body" className="grow min-w-0" style={{ width: 0, marginLeft: 12 }}>
					<Text id="dv-coll-text">tall intrinsic text that should keep the row open at its own measured height and wraps across lines</Text>
					<Row id="dv-coll-actions"><Text>actions</Text></Row>
				</View>
			</Row>
			{/* Same shape, all-grow children — the text-coral regression. */}
			<Row id="dv-collapse-allgrow" className="shrink-0">
				<View className="grow"><Text id="dv-ag-text">all-grow children, tall intrinsic text that should keep the row open at its own height</Text></View>
				<View className="grow"><Text>second grow child</Text></View>
			</Row>
		</View>
	</Screen>
}
