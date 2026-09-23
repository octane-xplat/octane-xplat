import { useState, useEffect } from 'octane';
import { View, Text } from '@octane-xplat/ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

/** watch + watch-date — compact small-screen surface on a 1 Hz cadence.
 *  Proves: sustained per-second commits (~3.6k/hr — leak/staleness detector),
 *  date formatting without DOM globals, tight centered layout. */
export function WatchFace() @{
	const [now, setNow] = useState(new Date());
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);
	const date = DAYS[now.getDay()] + ' ' + MONTHS[now.getMonth()] + ' ' + now.getDate();
	const time = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
	<View className="vx-app flex-1 items-center justify-center gap-2">
		<Text className="demo-watch-time">{time}</Text>
		<Text className="demo-watch-date">{date}</Text>
	</View>
}
