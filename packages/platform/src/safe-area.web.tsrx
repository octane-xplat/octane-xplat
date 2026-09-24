// Safe-area insets — web leaf. env(safe-area-inset-*) only exists in CSS;
// measure it once through a probe element.
import { useEffect, useState } from 'octane';

export interface Insets {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

function measure(): Insets {
	const probe = document.createElement('div');
	probe.style.cssText =
		'position:fixed;top:0;left:0;pointer-events:none;visibility:hidden;' +
		'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);' +
		'padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);';
	document.body.appendChild(probe);
	const cs = getComputedStyle(probe);
	const insets = {
		top: parseFloat(cs.paddingTop) || 0,
		bottom: parseFloat(cs.paddingBottom) || 0,
		left: parseFloat(cs.paddingLeft) || 0,
		right: parseFloat(cs.paddingRight) || 0,
	};
	probe.remove();
	return insets;
}

export function useSafeAreaInsets(): Insets {
	const [insets, setInsets] = useState<Insets>({ top: 0, bottom: 0, left: 0, right: 0 });
	useEffect(() => {
		const update = () => setInsets(measure());
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return insets;
}
