import { describe, it, expect } from 'vitest'
import { styled } from './styled.tsrx'
import { getColorScheme } from '../../theme/colorScheme.web'

// styled.tsrx builds elements via universalComponent() — a plain
// {$$kind, component, props:{props,key,hasKey,hasChildren}} object — so
// composition is node-testable. (Compiled components can't be
// direct-called for inspection on web — the runtime owns invocation.)

const Base = ((props: any) => props) as any
const inner = (el: any) => el.props.props

describe('styled() (native leaf)', () => {
	const Btn = styled(Base, { base: 'btn', variants: { danger: 'bg-danger', flat: 'shadow-none' } })

	it('composes base + variant classes', () => {
		const el = Btn({ danger: true })
		expect(inner(el).className).toEqual(['btn', 'bg-danger'])
		expect(el.component).toBe(Base)
	})

	it('drops falsy variants and consumes variant props', () => {
		const el = Btn({ danger: false, flat: true, id: 'b1' })
		expect(inner(el).className).toEqual(['btn', 'shadow-none'])
		expect(inner(el).danger).toBeUndefined()
		expect(inner(el).flat).toBeUndefined()
		expect(inner(el).id).toBe('b1') // non-variant props pass through
	})

	it('appends caller className last', () => {
		const el = Btn({ danger: true, className: 'extra' })
		expect(inner(el).className).toEqual(['btn', 'bg-danger', 'extra'])
	})

	it('selects enumerated variant options and consumes the prop', () => {
		const Card = styled(Base, {
			base: 'card',
			variants: { tone: { danger: 'bg-danger', neutral: 'bg-neutral' } },
		})

		const el = Card({ tone: 'danger', id: 'c1' })
		expect(inner(el).className).toEqual(['card', 'bg-danger'])
		expect(inner(el).tone).toBeUndefined()
		expect(inner(el).id).toBe('c1')
	})

	it('applies defaultVariants when the prop is omitted', () => {
		const Card = styled(Base, {
			base: 'card',
			variants: {
				tone: { danger: 'bg-danger', neutral: 'bg-neutral' },
				flat: 'shadow-none',
			},
			defaultVariants: { tone: 'neutral', flat: true },
		})

		expect(inner(Card({})).className).toEqual(['card', 'bg-neutral', 'shadow-none'])
		// An explicit prop beats the default; a boolean default can turn off.
		expect(inner(Card({ tone: 'danger', flat: false })).className).toEqual(['card', 'bg-danger'])
	})
})

describe('getColorScheme (web leaf)', () => {
	it('falls back to light without matchMedia', () => {
		expect(getColorScheme()).toBe('light')
	})
})
