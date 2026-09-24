import type { GridProps } from './props';
import { applyEscapeProps } from './escape-props';

function parseTracks(spec?: string) {
	return spec?.split(',').map((part) => {
		const track = part.trim();
		if (track === 'auto') return 'auto';
		if (track.endsWith('*')) return `${track.slice(0, -1) || '1'}fr`;
		return /^\d+(?:\.\d+)?$/.test(track) ? `${track}px` : track;
	}).join(' ');
}

let warnedAboutGap = false;

export function Grid(props: GridProps) @{
	if (props.gap != null && !warnedAboutGap) {
		warnedAboutGap = true;
		console.warn('[Grid] gap is not supported; use child margins instead.');
	}

	<div
		className={['vx-grid', props.className]}
		style={{
			...props.style,
			...(props.rows ? { gridTemplateRows: parseTracks(props.rows) } : {}),
			...(props.columns ? { gridTemplateColumns: parseTracks(props.columns) } : {}),
		}}
		ref={(el: any) => applyEscapeProps(el, props)}
	>
		{props.children}
	</div>
}
