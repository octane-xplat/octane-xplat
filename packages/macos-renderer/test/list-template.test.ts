import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseListTemplate, validateListProps, listFactory } from '../src/list-template.ts'
import { templateProps } from '../src/template-props.ts'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

test('string template prop inventory matches every canonical shared tag and attribute', () => {
	const file = fileURLToPath(new URL('../../jsx/src/shared.d.ts', import.meta.url))
	const program = ts.createProgram([file], { strict: true }),
		checker = program.getTypeChecker()

	const source = program.getSourceFile(file)!
	const def: any = source.statements.find((node: any) => node.name?.text === 'NativeElements')
	const tags = checker.getTypeAtLocation(def).getProperties()
	assert.deepEqual(Object.keys(templateProps).sort(), tags.map((tag) => tag.name).sort())
	for (const tag of tags) {
		const type = checker.getTypeOfSymbolAtLocation(tag, def)
		assert.deepEqual(
			Object.keys(templateProps[tag.name]).sort(),
			type
				.getProperties()
				.map((prop) => prop.name)
				.filter((name) => !['ref', 'children', 'key'].includes(name))
				.sort(),
			tag.name,
		)
	}
})

const values = (markup: string, item: any) => (parseListTemplate(markup).render(item) as any).values

test('Builder XML nested tags, case, namespaces, entities and numeric/boolean/style conversion', () => {
	const template = parseListTemplate(
		'<MasonView xmlns="http://schemas.nativescript.org/tns.xsd" style="display: flex; flex-direction: row"><Label text="A &amp; B" maxLines="2" textWrap="false" style="font-size: 20; width: 120" /></MasonView>',
	)

	const tags: any[] = []
	template.validate(
		(tag, props) => tags.push([tag, props]),
		() => {},
	)

	// Layout attrs are style-only — `flexDirection` as an XML attribute is an
	// undeclared-prop error under the strict contract.
	assert.deepEqual(tags, [
		['masonview', { style: { display: 'flex', flexDirection: 'row' } }],
		['label', { text: 'A & B', maxLines: 2, textWrap: false, style: { fontSize: 20, width: 120 } }],
	])

	assert.equal((template.render({}) as any).plan.root.children[0].type, 'label')
})

test('Builder binding options preserve path, $value, expressions, named and positional options on rebind', () => {
	const markup =
		'<MasonView><Label text="{{ person.name }}"/><Label text="{{ $value }}"/><Label text="{{ count + 2 }}"/><Label text="{{ sourceProperty=count, expression=count * 3, twoWay=false }}"/><Label text="{{ count, count * 4, false }}"/></MasonView>'

	const first = values(markup, { person: { name: 'A' }, count: 2 })
	assert.equal(first[1].text, 'A')
	assert.equal(first[2].text.count, 2)
	assert.deepEqual(
		first.slice(3).map((entry: any) => entry.text),
		[4, 6, 8],
	)

	assert.equal(values(markup, { person: { name: 'B' }, count: 5 })[1].text, 'B')
	assert.equal(values('<Label text="{{ $value }}"/>', 'primitive')[0].text, 'primitive')
	assert.equal(values('<Label text="{{ missing.sub }}"/>', {})[0].text, undefined)
	assert.equal(
		values('<Label text="{{ count > 2 ? name.toUpperCase() : \'none\' }}"/>', {
			count: 3,
			name: 'ok',
		})[0].text,
		'OK',
	)

	assert.equal(
		values('<Label text="{{ count | format }}"/>', { count: 3, format: (n: number) => '#' + n })[0]
			.text,
		'#3',
	)
})

test('template failures are descriptive TypeErrors at the prop boundary, including lower precedence inputs', () => {
	for (const markup of [
		'<Label>',
		'<Unknown />',
		'<Label nope="1"/>',
		'<Label/><Label/>',
		'<!DOCTYPE Label><Label/>',
		'<Label text="{{ ( }}"/>',
	]) {
		assert.throws(
			() =>
				validateListProps({ renderItem: () => null, itemTemplate: markup }, (template) =>
					template.validate(
						() => {},
						() => {},
					),
				),
			{ name: 'TypeError' },
		)
	}

	assert.throws(
		() => validateListProps({ itemTemplates: [{ key: 'other', createView: () => ({}) }] }),
		/only the "default"/,
	)

	assert.throws(() => validateListProps({ itemTemplates: [{ key: 'default' }] }), /createView/)
	assert.throws(() => validateListProps({ items: {} }), /ItemsSource/)
	assert.throws(() => validateListProps({ items: { length: -1, getItem() {} } }), /ItemsSource/)
	validateListProps({ items: { length: 2, getItem: (index: number) => index } })
	const factory = () => ({})
	assert.equal(
		listFactory({
			itemTemplate: factory,
			itemTemplates: [{ key: 'default', createView: () => null }],
		}),
		factory,
	)

	assert.equal(
		listFactory({
			itemTemplate: '<Label/>',
			itemTemplates: [{ key: 'default', createView: factory }],
		}),
		factory,
	)
})
