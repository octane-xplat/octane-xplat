// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, createRoot } from 'octane';
import { SegmentedControl } from './SegmentedControl.web.tsrx';

const options = [
	{ value: 'day', label: 'Day' },
	{ value: 'week', label: 'Week' },
	{ value: 'month', label: 'Month', disabled: true },
];

describe('SegmentedControl (web leaf)', () => {
	it('renders radiogroup semantics, marks the selected segment', () => {
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<SegmentedControl options={options} value="week" onValueChange={() => {}} />));
		const group = el.querySelector('.vx-segmented')!;
		expect(group.getAttribute('role')).toBe('radiogroup');
		const segs = el.querySelectorAll('.vx-segment');
		expect(segs).toHaveLength(3);
		expect(segs[1].classList.contains('vx-segment--on')).toBe(true);
		expect(segs[2].classList.contains('vx-segment--disabled')).toBe(true);
		root.unmount();
		el.remove();
	});

	it('uncontrolled defaultValue selects on mount; clicks switch + fire onValueChange', () => {
		const onValueChange = vi.fn();
		const el = document.createElement('div');
		document.body.appendChild(el);
		const root = createRoot(el);
		act(() => root.render(<SegmentedControl options={options} defaultValue="day" onValueChange={onValueChange} />));
		expect(el.querySelectorAll('.vx-segment')[0].classList.contains('vx-segment--on')).toBe(true);

		act(() => (el.querySelectorAll('.vx-segment')[1] as HTMLElement).click());
		expect(onValueChange).toHaveBeenCalledWith('week');
		expect(el.querySelectorAll('.vx-segment')[1].classList.contains('vx-segment--on')).toBe(true);

		// Disabled option does not select.
		act(() => (el.querySelectorAll('.vx-segment')[2] as HTMLElement).click());
		expect(onValueChange).toHaveBeenCalledTimes(1);
		root.unmount();
		el.remove();
	});
});
