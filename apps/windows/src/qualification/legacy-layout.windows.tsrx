/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef } from 'octane'
import { FlexboxLayout, Label, LayoutBase, StackLayout } from '@nativescript/core'

/** This exercises NativeScript's own FlexboxLayout, separately from Mason.
 * Expected content bounds follow the retained native-padding probe. */
export function LegacyLayout(props: { revision: number }): unknown @{
	const container = useRef<LayoutBase | null>(null)
	const fixed = useRef<FlexboxLayout | null>(null)

	useEffect(() => {
		const target = container.current
		if (!target) {
			return
		}

		// The shared JSX facade deliberately excludes legacy layout tags.
		// Construct them through NativeScript only inside this binary probe.
		const stack = new StackLayout()
		stack.id = 'core20-legacy'
		stack.width = 240
		for (const name of ['fixed', 'auto', 'empty']) {
			const box = new FlexboxLayout()
			box.id = `core20-legacy-${name}`
			box.width = 200
			box.flexDirection = 'column'
			box.paddingLeft = 17
			box.paddingTop = 7
			box.paddingRight = 13
			box.paddingBottom = 11
			if (name === 'fixed') {
				box.height = 60
				fixed.current = box
			}

			if (name !== 'empty') {
				const label = new Label()
				label.id = `core20-legacy-${name}-child`
				label.text = `${name} padding child`
				label.height = 10
				box.addChild(label)
			}

			stack.addChild(box)
		}

		target.addChild(stack)
		return () => {
			fixed.current = null
			if (stack.parent === target) {
				target.removeChild(stack)
			}
		}
	}, [])

	useEffect(() => {
		const box = fixed.current
		if (box) {
			box.width = props.revision ? 220 : 200
			box.paddingLeft = props.revision ? 23 : 17
			box.paddingTop = props.revision ? 9 : 7
		}
	}, [props.revision])

	<masonview
		id="core20-legacy-host"
		className="core20-legacy-host"
		ref={container}
		style={{ display: 'flex' }}
	/>
}
