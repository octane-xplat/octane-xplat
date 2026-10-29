import test from 'node:test'
import assert from 'node:assert/strict'
import { xplatGtkSlotDedupe } from '../src/linux-gtk/vite.ts'

const transform = (code, id = '/pkg/ui/src/Widget.tsrx') =>
	xplatGtkSlotDedupe().transform(code, id)

test('dedupes a repeated withSlot binding inside one module', () => {
	const code = [
		"import { hookSlots as _$hookSlots, withSlot as _$withSlot } from '@octane-xplat/linux-gtk';",
		"import { useState, withSlot as _$withSlot } from '@octane-xplat/linux-gtk';",
		"const x = _$withSlot(a, b);",
	].join('\n')
	const out = transform(code)
	assert.ok(out)
	assert.equal(out.code.match(/withSlot as _\$withSlot\b/g)?.length, 1)
	assert.ok(out.code.includes("import { useState } from '@octane-xplat/linux-gtk';"))
	assert.ok(out.code.includes("_$withSlot(a, b)"))
})

test('keeps the original specifier and drops an emptied statement', () => {
	const code = [
		"import { withSlot as _$withSlot } from 'octane';",
		"import { withSlot as _$withSlot } from 'octane';",
	].join('\n')
	const out = transform(code)
	assert.ok(out)
	assert.ok(out.code.includes("import { withSlot as _$withSlot } from 'octane';"))
	assert.equal(out.code.split("from 'octane'").length - 1, 1)
})

test('aliases a later local name to the first binding', () => {
	const code = [
		"import { withSlot as _$withSlot } from 'octane';",
		"import { withSlot as _$withSlot$1 } from 'octane';",
		"const x = _$withSlot$1(a);",
	].join('\n')
	const out = transform(code)
	assert.ok(out)
	assert.equal(out.code.match(/withSlot as _\$withSlot\b/g)?.length, 1)
	assert.ok(!out.code.includes('_$withSlot$1'))
	assert.ok(out.code.includes('_$withSlot(a)'))
})

test('throws when the same export is imported from different specifiers', () => {
	const code = [
		"import { withSlot as _$withSlot } from 'octane';",
		"import { withSlot as _$withSlot } from '@octane-xplat/linux-gtk';",
	].join('\n')
	assert.throws(() => transform(code), /different|imported from/)
})

test('leaves single imports and non-tsrx files untouched', () => {
	const single = "import { withSlot as _$withSlot } from 'octane';"
	assert.equal(transform(single), undefined)
	const plain = "import { withSlot as _$withSlot, hookSlots as _$hookSlots } from 'octane';"
	assert.equal(transform(plain, '/pkg/ui/src/helper.ts'), undefined)
	assert.equal(transform('const x = 1'), undefined)
})
