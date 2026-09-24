import { useEffect, useState } from 'octane';

export interface SafeAreaInsets { top: number; right: number; bottom: number; left: number; }

function measure(): SafeAreaInsets {
	if (!document.body) return { top: 0, right: 0, bottom: 0, left: 0 };
	const probe = document.createElement('div');
	probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;' +
		'padding:env(safe-area-inset-top) env(safe-area-inset-right) ' +
		'env(safe-area-inset-bottom) env(safe-area-inset-left);' +
		'padding:constant(safe-area-inset-top) constant(safe-area-inset-right) ' +
		'constant(safe-area-inset-bottom) constant(safe-area-inset-left);';
	document.body.appendChild(probe);
	const style = getComputedStyle(probe);
	const insets = {
		top: parseFloat(style.paddingTop) || 0,
		right: parseFloat(style.paddingRight) || 0,
		bottom: parseFloat(style.paddingBottom) || 0,
		left: parseFloat(style.paddingLeft) || 0,
	};
	probe.remove();
	return insets;
}

/** Approximate CSS safe-area values, measured on mount and viewport resize. */
export function useSafeAreaInsets(): SafeAreaInsets {
	const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, right: 0, bottom: 0, left: 0 });
	useEffect(() => {
		const update = () => setInsets(measure());
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return insets;
}
