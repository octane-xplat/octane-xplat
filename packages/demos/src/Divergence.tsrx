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
 *  dv-basis: flex-grow without guards — under the shared `* {flex-shrink:0}`
 *            normalization (RN semantics) the wide text can't shrink, so the
 *            row overflows on both engines. The dv-fix row shows the shrink +
 *            min-w-0 opt-in that lets the grow child compress again. */
export function Divergence() @{
	<Screen className="vx-app flex-1 gap-6">
		<Text className="text-xl font-semibold">Layout edge cases</Text>

		<View className="sink-section">
			<Text className="section-label">flex-grow fill</Text>
			<Row id="dv-grow" className="dv-row">
				<Text id="dv-grow-text">grow text</Text>
				<View id="dv-grow-fill" className="dv-grow-fill" />
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">line-height</Text>
			<Row className="dv-row items-center">
				<Text id="dv-lh" className="dv-lh">LineHeight gyÊ</Text>
				<Text id="dv-lh2" style={{ lineHeight: 40 }}>inline lh</Text> {/* xplat-disable-line */}
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">trailing item — margin-left:auto vs justify</Text>
			<Row className="dv-row">
				<Text>lead</Text>
				<Text id="dv-auto" className="dv-auto">trail</Text>
			</Row>
			<Row className="dv-row" justifyContent="space-between">
				<Text>lead</Text>
				<Text id="dv-auto-fix">trail</Text>
			</Row>
		</View>

		<View className="sink-section">
			<Text className="section-label">overflow squeeze vs shrink + min-w-0</Text>
			<Row className="dv-row dv-row-tight">
				<Text id="dv-wide" className="dv-wide">long intrinsic text that wants a lot of width on its own</Text>
				<View id="dv-sib" className="dv-sib" />
			</Row>
			<Row className="dv-row dv-row-tight">
				{/* shrink goes on a container, not the Label — iOS re-measures
				    a shrunk label at the compressed spec (it wraps taller) but
				    still reports intrinsic frame width. A View reports the
				    shrunk size, which is what the sweep can assert on. */}
				<View id="dv-wide-fix" className="grow shrink min-w-0">
					<Text>long intrinsic text that wants a lot of width on its own</Text>
				</View>
				<View id="dv-sib-fix" className="dv-sib" />
			</Row>
		</View>

		{/* The collapse needs a CONTENT-SIZED row — a direct Screen child
		    fills the rootlayout cell, so wrap in a column. Composer shape:
		    fixed avatar + grow body with intrinsic-height content. */}
		<View className="sink-section">
			<Text className="section-label">row collapse</Text>
			<View id="dv-collapse" className="gap-4">
				<Row id="dv-collapse-row" className="items-start shrink-0">
					<View id="dv-coll-avatar" className="dv-avatar" style={{ width: 46, height: 46 }} />
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
		</View>
	</Screen>
}
