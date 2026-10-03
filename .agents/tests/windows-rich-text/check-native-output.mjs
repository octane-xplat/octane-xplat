import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const log = readFileSync(process.argv[2], 'utf8')
assert.ok(!log.includes('[rich-text-native-error]'), 'native inspection must not fail')
const stages = new Map(
	log
		.split(/\r?\n/)
		.flatMap((line) => {
			const marker = '[rich-text-native] '
			const start = line.indexOf(marker)
			return start < 0 ? [] : [JSON.parse(line.slice(start + marker.length))]
		})
		.map((result) => [result.stage, result]),
)

for (const stage of [0, 1, 2, 3, 4]) {
	assert.ok(stages.has(stage), 'missing stage ' + stage)
}
const label = (stage, id) => {
	const value = stages.get(stage).labels.find((value) => value.id === id)
	assert.ok(value, 'missing label ' + id)
	assert.ok(value.size.width > 0 && value.size.height > 0, 'positive outer geometry ' + id)
	assert.ok(
		value.innerSize.width > 0 && value.innerSize.height > 0,
		'positive inner geometry ' + id,
	)

	assert.ok(Math.abs(value.size.width - 280) < 1, 'requested label width ' + id)
	return value
}

for (const stage of [0, 1, 2, 3]) {
	const explicit = label(stage, 'explicit')
	assert.equal(explicit.nativeText, 'First run bold run')
	assert.deepEqual(
		explicit.runs.map((run) => run.weight),
		[400, 700],
	)

	const deep = label(stage, 'deep')
	assert.equal(deep.nativeText, 'plain outer inner tail end')
	assert.deepEqual(
		deep.runs.map((run) => run.weight),
		[400, 700, 700, 700, 400],
	)

	assert.equal(deep.runs[2].style, 2, 'WinUI italic enum')
}

for (const stage of [0, 1, 2]) {
	const mixed = label(stage, 'mixed')
	assert.equal(mixed.nativeText, stage === 0 ? 'First run bold run end' : 'First run UPDATED end')
	assert.deepEqual(
		mixed.runs.map((run) => run.weight),
		stage === 2 ? [400, 400, 400] : [400, 700, 400],
	)

	if (stage === 2) {
		assert.equal(mixed.runs[1].style, 2, 'removed bold becomes italic')
	}
	assert.equal(mixed.runs.map((run) => run.text).join(''), mixed.nativeText)
}

assert.equal(label(0, 'order').nativeText, 'AB')
assert.equal(label(2, 'order').nativeText, 'BA')
assert.deepEqual(
	label(2, 'order').runs.map((run) => run.weight),
	[700, 400],
)

assert.equal(label(3, 'mixed').nativeText, 'First run  end')
assert.equal(label(3, 'mixed').formatted, false)
assert.equal(stages.get(4).contentEmpty, true)
assert.equal(stages.get(4).retainedFormatted, false)
console.log('Windows native run ordering, styling, geometry and unmount checks passed.')
