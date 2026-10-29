import { test } from 'node:test'
import assert from 'node:assert/strict'
import { syncHeadingAccessibility } from '../src/heading-accessibility.ts'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

function view(text = 'Account') {
	return { stringValue: text, accessibilityRole: 'AXStaticText', accessibilityTitle: null as string | null,
		accessibilityValue: text as unknown, invalidateIntrinsicContentSize() {} }
}

test('heading exposes levels 1–6 and current title without changing visible text', () => {
	const field = view()
	for (let level = 1; level <= 6; level++) {
		syncHeadingAccessibility(field, { accessibilityRole: 'heading', accessibilityHeadingLevel: level })
		assert.equal(field.accessibilityRole, 'AXHeading'); assert.equal(field.accessibilityValue, level); assert.equal(field.accessibilityTitle, 'Account'); assert.equal(field.stringValue, 'Account')
	}
	field.stringValue = 'Updated account'
	syncHeadingAccessibility(field, { accessibilityRole: 'heading' })
	assert.equal(field.accessibilityTitle, 'Updated account'); assert.equal(field.accessibilityValue, 2)
	for (const level of [null, '3', 0, 7, 2.5, NaN]) {
		syncHeadingAccessibility(field, { accessibilityRole: 'heading', accessibilityHeadingLevel: level }); assert.equal(field.accessibilityValue, 2)
	}
})
test('removing heading restores original role/title and a text-following value to current content', () => {
	const field = view()
	syncHeadingAccessibility(field, { accessibilityRole: 'heading', accessibilityHeadingLevel: 1 })
	field.stringValue = 'Renamed'
	syncHeadingAccessibility(field, {})
	assert.equal(field.accessibilityRole, 'AXStaticText'); assert.equal(field.accessibilityTitle, null); assert.equal(field.accessibilityValue, 'Renamed'); assert.equal(field.stringValue, 'Renamed')
	field.accessibilityValue = 'native custom value'; field.accessibilityTitle = 'native title'
	syncHeadingAccessibility(field, { accessibilityRole: 'heading', accessibilityHeadingLevel: 4 })
	syncHeadingAccessibility(field, { accessibilityRole: 'text' })
	assert.equal(field.accessibilityValue, 'native custom value'); assert.equal(field.accessibilityTitle, 'native title')
	const untouched = view('Sibling'); syncHeadingAccessibility(untouched, {}); assert.equal(untouched.accessibilityRole, 'AXStaticText'); assert.equal(untouched.accessibilityValue, 'Sibling')
})
test('real readable-host accessibility dispatch updates level and releases heading metadata', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('function applyAccessibility('), end = source.indexOf('/** Host updates carry', start)
	assert.ok(start >= 0 && end > start)
	const apply = runSlice(source.slice(start, end) + '\n;applyAccessibility', { syncHeadingAccessibility })
	const field = view(), node = { type: 'label', view: field, props: { accessibilityRole: 'heading', accessibilityHeadingLevel: 1 } }
	apply(node, 'accessibilityRole', 'heading'); assert.equal(field.accessibilityValue, 1)
	apply(node, 'accessibilityHeadingLevel', 3); assert.equal(field.accessibilityValue, 3)
	apply(node, 'accessibilityRole', undefined); assert.equal(field.accessibilityRole, 'AXStaticText'); assert.equal(field.accessibilityValue, 'Account')
})
test('real plain and formatted text writers refresh heading titles on the existing native owner', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url)), start = source.indexOf('function setLabelText('), end = source.indexOf('const keyboardSubscriptionsByNode', start)
	assert.ok(start >= 0 && end > start)
	const { setLabelText, syncText } = runSlice(source.slice(start, end) + '\n;({setLabelText,syncText})', {
		syncHeadingAccessibility, NSFontAttributeName: 'font', NSForegroundColorAttributeName: 'color', NSUnderlineStyleAttributeName: 'underline', NSKernAttributeName: 'kern',
		NSAttributedString: { alloc: () => ({ initWithStringAttributes: (text: string) => ({ string: text }) }) },
		composeAttributedText: () => ({ string: 'Rich account' }), fontForFamilyStyle() {}, nativeColor() {}, queueLayoutReconcile() {},
	})
	const field = view(), node = { type: 'label', view: field, props: { accessibilityRole: 'heading', accessibilityHeadingLevel: 3 }, children: [] as any[], container: {}, parent: null }
	Object.defineProperty(field, 'attributedStringValue', { set(value) { field.stringValue = value.string } })
	setLabelText(node, 'Plain account'); assert.equal(field.accessibilityTitle, 'Plain account'); assert.equal(field.accessibilityValue, 3)
	Object.assign(node.props, { style: { textDecoration: 'underline' } }); setLabelText(node, 'Decorated account'); assert.equal(field.accessibilityTitle, 'Decorated account')
	node.children = [{ type: 'span' }]; syncText(node); assert.equal(field.accessibilityTitle, 'Rich account'); assert.equal(field.accessibilityValue, 3); assert.equal(field.stringValue, 'Rich account')
})
