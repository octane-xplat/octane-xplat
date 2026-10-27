import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const labelColor = { semantic: 'label' }
const placeholderColor = { semantic: 'placeholder' }
const { syncNativeColors, setTextFieldPlaceholder } = runSlice(
	source.slice(source.indexOf('function syncNativeColors('), source.indexOf('function fontForStyle(')) +
		source.slice(source.indexOf('function setTextFieldPlaceholder('), source.indexOf('function makeTextField(')) +
		'\n({ syncNativeColors, setTextFieldPlaceholder })',
	{
		NSColor: { labelColor, placeholderTextColor: placeholderColor },
		nativeColor: (value: string) => ({ css: value }),
		setLabelText() {},
		NSFontAttributeName: 'font', NSForegroundColorAttributeName: 'color',
		NSAttributedString: { alloc: () => ({ initWithStringAttributes: (text: string, attributes: any) => ({ text, attributes }) }) },
	},
)

test('native colors preserve CSS and restore semantic defaults when it is removed', () => {
	const node: any = { type: 'label', view: { layer: {} }, props: {}, styleColor: '#123456' }
	syncNativeColors(node)
	assert.equal(node.view.textColor.css, '#123456')
	delete node.styleColor
	syncNativeColors(node)
	assert.equal(node.view.textColor, labelColor)
})

test('placeholder CSS survives unrelated color resets and falls back to AppKit', () => {
	const field: any = {}
	const props = { placeholder: 'Search', placeholderTextColor: '#abcdef' }
	setTextFieldPlaceholder(field, props, '#123456')
	assert.equal(field.placeholderAttributedString.attributes.color.css, '#123456')
	setTextFieldPlaceholder(field, props)
	assert.equal(field.placeholderAttributedString.attributes.color.css, '#abcdef')
	setTextFieldPlaceholder(field, { placeholder: 'Search' })
	assert.equal(field.placeholderAttributedString.attributes.color, placeholderColor)
	const node = { type: 'textfield', view: field, props, stylePlaceholderColor: '#123456' }
	syncNativeColors(node)
	assert.equal(field.placeholderAttributedString.attributes.color.css, '#123456')
})
