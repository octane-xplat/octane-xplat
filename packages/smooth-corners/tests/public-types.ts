import type { SmoothCornersProps } from '../src/props'

const valid: SmoothCornersProps = {
  corners: { radius: 24 },
  android: { elevation: 8 },
  className: ['panel', { active: true }],
  style: { width: 200 },
  children: 'Card',
}

void valid

// @ts-expect-error Layout belongs to an inner shared layout component.
const partialFlex: SmoothCornersProps = { corners: 24, flexDirection: 'row' }
// @ts-expect-error Dynamic styles are a property object; static CSS belongs in className.
const styleString: SmoothCornersProps = { corners: 24, style: 'width: 200px' }
// @ts-expect-error Corner names are checked.
const typo: SmoothCornersProps = { corners: { radius: 24, curve: 'squirkle' } }

void partialFlex
void styleString
void typo
