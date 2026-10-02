import fs from 'node:fs'
import assert from 'node:assert/strict'
const log = fs.readFileSync(process.argv[2], 'utf8')
const records = new Map()
for (const line of log.split(/\r?\n/)) {
	const match = line.match(/\[(layout-padding-final|layout-percent-final)\] (\{.*\})/)
	if (match) {
		const row = JSON.parse(match[2])
		records.set(match[1] + ':' + row.stage + ':' + (row.name ?? ''), row)
	}
}

const near = (actual, expected) =>
	assert(Math.abs(actual - expected) <= 1, `expected ${expected}, received ${actual}`)

const get = (stage, name) => {
	const row = records.get('layout-padding-final:' + stage + ':' + name)
	assert(row, `missing ${stage}:${name}`)
	return row
}

for (const [stage, name, width, height, x, y] of [
	['initial', 'fixed', 170, 10, 17, 7],
	['initial', 'auto', 170, 10, 17, 7],
	['changed', 'fixed', 184, 10, 23, 9],
	['initial', 'percent', 170, 42, 17, 7],
	['changed', 'percent', 164, 40, 23, 9],
]) {
	const row = get(stage, name)
	const child = row.children[0]
	near(child.size.width, width)
	near(child.size.height, height)
	near(child.offset.X, x)
	near(child.offset.Y, y)
}

near(get('initial', 'auto').size.height, 28)
near(get('initial', 'empty').size.height, 18)
assert.equal(get('initial', 'empty').children.length, 0)
for (const name of ['row', 'row-reverse', 'column-reverse', 'wrap']) {
	const row = get('initial', name)
	assert.equal(row.children.length, 2)
	assert(
		row.children.every((c) => c.offset.X >= 16 && c.offset.Y >= 6),
		`${name} inset origin`,
	)
}

assert(get('initial', 'wrap').children[1].offset.Y > get('initial', 'wrap').children[0].offset.Y)
near(get('initial', 'oversized').children[0].size.width, 0)
for (const [stage, pw, ph, cw, ch] of [
	['initial', 200, 100, 200, 100],
	['resize', 300, 150, 300, 150],
	['numeric', 240, 120, 80, 20],
	['percentage-again', 240, 120, 120, 60],
	['reparent', 160, 80, 80, 40],
]) {
	const row = records.get('layout-percent-final:' + stage + ':')
	assert(row, `missing percent ${stage}`)
	near(row.parent.width, pw)
	near(row.parent.height, ph)
	near(row.child.width, cw)
	near(row.child.height, ch)
	assert(row.independent > 0, 'independent listener retained')
}

console.log(
	'PASS: native padding, dynamic content-box percentages, independent listeners and percentage lifecycle',
)
