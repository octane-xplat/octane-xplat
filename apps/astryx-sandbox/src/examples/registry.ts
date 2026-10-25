// Implemented-example registry — template route name → the ported Octane
// element rendered for /templates/<name>/. The coverage ledger derives
// 'ported' status from this map; adding an example flips its row.

import { ButtonShowcase } from './button/ButtonShowcase'
import { ButtonVariants } from './button/ButtonVariants'
import { ButtonSizeVariants } from './button/ButtonSizeVariants'
import { ButtonFloating } from './button/ButtonFloating'
import { ButtonWithIcon } from './button/ButtonWithIcon'
import { ButtonWithEndSlot } from './button/ButtonWithEndSlot'
import { TextShowcase } from './text/TextShowcase'
import { TextTypes } from './text/TextTypes'
import { TextColors } from './text/TextColors'
import { TextHeadingLevels } from './text/TextHeadingLevels'
import { TextInline } from './text/TextInline'
import { TextTruncation } from './text/TextTruncation'
import { TextWeight } from './text/TextWeight'
import { TextWordBreak } from './text/TextWordBreak'
import { TextWrap } from './text/TextWrap'

const examples: Record<string, () => any> = {
	ButtonShowcase,
	ButtonVariants,
	ButtonSizeVariants,
	ButtonFloating,
	ButtonWithIcon,
	ButtonWithEndSlot,
	TextShowcase,
	TextTypes,
	TextColors,
	TextHeadingLevels,
	TextInline,
	TextTruncation,
	TextWeight,
	TextWordBreak,
	TextWrap,
}

export const portedExamples = new Set(Object.keys(examples))

export function exampleFor(name: string): any {
	const component = examples[name]
	return component ? component() : undefined
}
