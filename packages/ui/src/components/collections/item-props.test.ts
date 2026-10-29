import { describe, expectTypeOf, it } from 'vitest'
import type { ItemComponent, ItemProps, ListItemProps } from '../../props'

describe('Item row roles', () => {
	it('shares named content roles and disabled state with ListItem', () => {
		expectTypeOf<ItemProps['label']>().toEqualTypeOf<ListItemProps['label']>()
		expectTypeOf<ItemProps['description']>().toEqualTypeOf<ListItemProps['description']>()
		expectTypeOf<ItemProps['startContent']>().toEqualTypeOf<ListItemProps['startContent']>()
		expectTypeOf<ItemProps['endContent']>().toEqualTypeOf<ListItemProps['endContent']>()
		expectTypeOf<ItemProps['isDisabled']>().toEqualTypeOf<ListItemProps['isDisabled']>()
		expectTypeOf<keyof ItemComponent>().toEqualTypeOf<
			'StartContent' | 'Content' | 'Description' | 'EndContent'
		>()
	})

	it('does not accept the previous shorthand names', () => {
		const legacyTitle: ItemProps = {
			// @ts-expect-error use label instead of title
			title: 'Account',
		}

		const legacyDescription: ItemProps = {
			// @ts-expect-error use description instead of supportingText
			supportingText: 'Profile settings',
		}

		const legacyStartContent: ItemProps = {
			// @ts-expect-error use startContent instead of leading
			leading: 'A',
		}

		const legacyEndContent: ItemProps = {
			// @ts-expect-error use endContent instead of trailing
			trailing: '›',
		}

		const legacyDisabled: ItemProps = {
			// @ts-expect-error use isDisabled instead of disabled
			disabled: true,
		}

		void [legacyTitle, legacyDescription, legacyStartContent, legacyEndContent, legacyDisabled]
	})
})
