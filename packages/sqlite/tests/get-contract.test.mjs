import assert from 'node:assert/strict'
import { readdirSync, readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import test from 'node:test'

// Guards nativescript-community/sqlite#50: in the plugin's 3.x line, iOS
// get()/getArray() handed a fresh FMResultSet to helpers that read
// `resultDictionary` before the cursor was stepped — every get() rejected.
// The 4.x rewrite removed that path: get/getArray decode the same exec
// result as select/selectArray, so they cannot diverge. The leaf delegates
// to the plugin directly (verified on an iOS 27.0 simulator — get/getArray
// return null/row/first-row across empty, single and multi-row results and
// reject with SqliteError on invalid SQL and a closed database). This test
// fails if a version bump reintroduces the defect's shape: an FMDB-style
// cursor reader, or a get()/getArray() that no longer shares select's
// request machinery — either calls for a fresh runtime check.

const require = createRequire(import.meta.url)
const sqliteAnchor = dirname(
	realpathSync(require.resolve('@nativescript-community/sqlite/package.json')),
)

const fromSqlite = createRequire(join(sqliteAnchor, 'resolve-anchor.js'))
const packageRoot = (name) => dirname(fromSqlite.resolve(`${name}/package.json`))

const SQLITE_PACKAGES = [
	'@nativescript-community/sqlite',
	'@nativescript-community/sqlite-core',
	'@nativescript-community/sqlite-napi',
	'@nativescript-community/sqlite-default-engine',
	'@nativescript-community/sqlite-bridge',
]

test('plugin family carries no pre-step cursor row access', () => {
	const offenders = []
	for (const name of SQLITE_PACKAGES) {
		const root = packageRoot(name)
		const files = readdirSync(root, { recursive: true }).filter(
			(file) => typeof file === 'string' && /\.[cm]?js$/.test(file),
		)

		for (const file of files) {
			if (/getRaw|resultDictionary|FMResultSet/.test(readFileSync(join(root, file), 'utf8'))) {
				offenders.push(`${name}/${file}`)
			}
		}
	}
	assert.deepEqual(
		offenders,
		[],
		'FMDB-style cursor row access (getRaw/resultDictionary/FMResultSet) reappeared — get()/getArray() would read the row before the cursor advances (sqlite#50)',
	)
})

test('sqlite-core get/getArray share the select request path', () => {
	const source = readFileSync(
		join(packageRoot('@nativescript-community/sqlite-core'), 'database.js'),
		'utf8',
	)
	for (const method of ['select', 'selectArray', 'get', 'getArray']) {
		const body = source.match(
			new RegExp(`(?:async )?${method}\\(query, params, options\\) \\{([\\s\\S]*?)\\n\\s*\\}`),
		)?.[1]

		assert.ok(body, `could not read ${method}()'s body in installed database.js`)
		assert.ok(
			/this\.query\(query, params, options, (?:true|false)\)/.test(body),
			`${method}() no longer shares query()'s exec path — re-verify the sqlite#50 row-access contract before consuming this plugin version`,
		)
	}
})
