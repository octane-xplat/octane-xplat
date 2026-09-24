import { useState, useEffect } from 'octane';
import { View, Row, Text, Pressable } from '@octane-xplat/ui';

type Day = { id: string; name: string; icon: string; lo: number; hi: number };

const NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ICONS = ['☀', '⛅', '☁', '☂', '❄'];

function fakeForecast(): Day[] {
	return NAMES.map((name, i) => {
		const lo = 8 + Math.floor(Math.random() * 8);
		return {
			id: 'd' + i,
			name,
			icon: ICONS[Math.floor(Math.random() * ICONS.length)],
			lo,
			hi: lo + 4 + Math.floor(Math.random() * 8),
		};
	});
}

/** weather — async→state→render seam without a network.
 *  Proves: a simulated fetch (setTimeout + setState) drives a loading→data
 *  transition identical in shape to a real platform-services fetch (Q:
 *  platform-services surface). Repeat presses re-run the whole cycle.
 *  Also a live check on glyph coverage — ☀⛅☁☂❄ exercise Q18 fonts. */
export function Weather() @{
	const [days, setDays] = useState<Day[] | null>(null);
	const [gen, setGen] = useState(0);
	console.log('[demo] Weather render days=' + (days ? days.length : 'null'));

	useEffect(() => {
		setDays(null);
		const t = setTimeout(() => {
			console.log('[probe] weather loaded gen=' + gen);
			setDays(fakeForecast());
		}, 600);

		return () => clearTimeout(t);
	}, [gen]);

	<View className="vx-app flex-1 gap-4">
		<Row className="gap-4 items-center">
			<Text className="text-xl font-bold">Forecast</Text>
			<Pressable id="wx-refresh" onPress={() => setGen(gen + 1)} className="btn bg-primary">
				<Text className="text-onprimary">Refresh</Text>
			</Pressable>
		</Row>
		{/* Ternary in children position — the @if/@else version mounted
		    neither arm on native (docs/demos.md findings). */}
		{days === null
			? <Text className="cell">{'Loading…'}</Text>
			: <View className="gap-2">
				@for (const d of days; key d.id) {
					<Row className="wx-card gap-4 items-center">
						<Text className="wx-icon">{d.icon}</Text>
						<Text className="flex-1">{d.name}</Text>
						<Text>{d.lo + '° / ' + d.hi + '°'}</Text>
					</Row>
				}
			</View>
		}
	</View>
}
