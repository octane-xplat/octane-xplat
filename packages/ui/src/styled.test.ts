import { describe, it, expect } from 'vitest';
import { styled } from './styled.native.tsrx';
import { getColorScheme } from './theme/colorScheme.web.tsrx';

// styled.native.tsrx builds elements via universalComponent() — a plain
// {$$kind, component, props:{props,key,hasKey,hasChildren}} object — so
// composition is node-testable. (Compiled components can't be
// direct-called for inspection on web — the runtime owns invocation.)

const Base = ((props: any) => props) as any;
const inner = (el: any) => el.props.props;

describe('styled() (native leaf)', () => {
	const Btn = styled(Base, { base: 'btn', variants: { danger: 'bg-danger', flat: 'shadow-none' } });

	it('composes base + variant classes', () => {
		const el = Btn({ danger: true });
		expect(inner(el).className).toEqual(['btn', 'bg-danger']);
		expect(el.component).toBe(Base);
	});

	it('drops falsy variants and consumes variant props', () => {
		const el = Btn({ danger: false, flat: true, id: 'b1' });
		expect(inner(el).className).toEqual(['btn', 'shadow-none']);
		expect(inner(el).danger).toBeUndefined();
		expect(inner(el).flat).toBeUndefined();
		expect(inner(el).id).toBe('b1'); // non-variant props pass through
	});

	it('appends caller className last', () => {
		const el = Btn({ danger: true, className: 'extra' });
		expect(inner(el).className).toEqual(['btn', 'bg-danger', 'extra']);
	});
});

describe('getColorScheme (web leaf)', () => {
	it('falls back to light without matchMedia', () => {
		expect(getColorScheme()).toBe('light');
	});
});
