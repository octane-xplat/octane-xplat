import { useRef, useState } from 'octane';
import { Row, Text, View, setTranslate } from '@octane-xplat/ui';
import type { PanEvent } from '@octane-xplat/ui';

type Track = { id: string; title: string; artist: string };

const TRACKS: Track[] = [
	{ id: 'a', title: 'Neon Coastline', artist: 'The Satellites' },
	{ id: 'b', title: 'Golden Hour', artist: 'Ivy Coast' },
	{ id: 'c', title: 'Paper Planes', artist: 'Wander' },
	{ id: 'd', title: 'Midnight Run', artist: 'Neon Coast' },
	{ id: 'e', title: 'Slow Wave', artist: 'Tide' },
	{ id: 'f', title: 'Signal Fires', artist: 'Mira' },
	{ id: 'g', title: 'Last Train Home', artist: 'Junction' },
];

const ROW_GAP = 8; // .reorder-row margin-bottom (demo.css)

/** Lift the dragged row above its siblings. z-index is real on native
 *  (NS 9: iOS layer.zPosition, Android ViewHelper.setZIndex) — the repo's
 *  "inert on native" warn lists predate that and are stale. */
const setLift = (el: any, on: boolean) => {
	if (!el) return;
	if ('nativeViewProtected' in el) {
		el.style.zIndex = on ? 1 : 0;
	} else {
		el.style.zIndex = on ? '1' : '';
	}
};

/** Post-layout height of a bound view: NS reports dips via getActualSize,
 *  DOM reports px via bounding rect — same number, matching units. */
const rowHeight = (el: any) =>
	'nativeViewProtected' in el ? el.getActualSize().height : el.getBoundingClientRect().height;

/** drag-to-reorder — the pan/imperative-write seam (docs/animation-gestures.md).
 *  Proves: onPan payload parity (began/moved/ended/cancelled, cumulative dy),
 *  per-frame setTranslate writes through `bind` without re-rendering, z-index
 *  lift on native, and one declarative commit at drop. Drag activates on
 *  first move so plain taps never lift a row. */
export function Reorder() @{
	const [items, setItems] = useState(TRACKS);
	const [lifted, setLifted] = useState<string | null>(null);
	const views = useRef(new Map<string, any>());
	const drag = useRef<{ id: string; from: number; hover: number; pitch: number; active: boolean } | null>(null);

	const clearShifts = () => items.forEach((t) => setTranslate(views.current.get(t.id)));

	const pan = (item: Track, e: PanEvent) => {
		const el = views.current.get(item.id);

		if (e.state === 'began') {
			const from = items.indexOf(item);
			drag.current = { id: item.id, from, hover: from, pitch: rowHeight(el) + ROW_GAP || 1, active: false };
			return;
		}

		const d = drag.current;
		if (!d || d.id !== item.id) return;

		if (e.state === 'moved') {
			if (!d.active) {
				d.active = true;
				setLifted(item.id);
				setLift(el, true);
			}

			const last = items.length - 1;
			d.hover = Math.min(last, Math.max(0, d.from + Math.round(e.dy / d.pitch)));
			setTranslate(el, 0, e.dy);
			items.forEach((sib, i) => {
				if (sib.id === d.id) return;
				const dir =
					d.from < d.hover && i > d.from && i <= d.hover ? -1
					: d.hover < d.from && i >= d.hover && i < d.from ? 1
					: 0;

				setTranslate(views.current.get(sib.id), 0, dir * d.pitch);
			});

			return;
		}

		drag.current = null;
		setLifted(null);
		setLift(el, false);
		if (e.state === 'ended' && d.hover !== d.from) {
			const next = items.slice();
			next.splice(d.from, 1);
			next.splice(d.hover, 0, item);
			setItems(next);
		}

		clearShifts();
	};

	<View className="vx-app flex-1 gap-4">
		<Text className="text-xl font-semibold">Playlist</Text>
		<View>
			@for (const t of items; index i; key t.id) {
				<Row
					id={'reorder-' + t.id}
					className={['reorder-row', lifted === t.id ? 'reorder-lifted' : '']}
					bind={(el: any) => el && views.current.set(t.id, el)}
					onPan={(e) => pan(t, e)}
				>
					<Text className="reorder-grip">{'≡'}</Text>
					<View className="flex-1">
						<Text className="font-semibold">{t.title}</Text>
						<Text className="text-sm text-muted">{t.artist}</Text>
					</View>
					<Text className="text-sm text-muted">{i + 1}</Text>
				</Row>
			}
		</View>
	</View>
}
