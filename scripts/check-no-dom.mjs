#!/usr/bin/env node
// Static no-DOM sweep (invariants #4/#5): DOM globals must never appear in
// shared or native-targeted source. *.web.* files are exempt — the DOM is
// their platform. This catches leaks at lint time; the renderer's runtime
// validation (forbiddenGlobals, in the driver patch) is the backstop.
//
// Not flagged: setTimeout/fetch/console/requestAnimationFrame — NS installs
// those as real globals (see @nativescript/core/globals).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOTS = ['packages', 'apps/native/src']
const EXT = /\.(ts|tsx|tsrx)$/
// (?<![.'"\w]) — skip member access (obj.window), quoted strings, and
// identifier tails; bare globals still flag.
const PATTERNS = [
	/(?<![.'"\w])document\b/,
	/(?<![.'"\w])window\b/,
	/(?<![.'"\w])navigator\b/,
	/(?<![.'"\w])location\b/,
	/(?<![.'"\w])history\b/,
	/(?<![.'"\w])localStorage\b/,
	/(?<![.'"\w])sessionStorage\b/,
	/\bHTML[A-Z]\w*/,
	/\bgetComputedStyle\b/,
	/\bDOMParser\b/,
	/\bXMLSerializer\b/,
	/\bcreateElementNS\b/,
	/\bquerySelector(All)?\b/,
	/\binnerHTML\b/,
	/\bouterHTML\b/,
	/\bclassList\b/,
	/\balert\s*\(/,
	/\bconfirm\s*\(/,
	/\bprompt\s*\(/,
]

function* walk(dir) {
	let entries
	try {
		entries = readdirSync(dir)
	} catch {
		return
	}

	for (const e of entries) {
		const p = join(dir, e)
		const s = statSync(p)
		if (s.isDirectory()) {
			if (e === 'node_modules' || e === 'dist' || e === '.ns-vite-build') {
				continue
			}

			yield* walk(p)
		} else if (EXT.test(e) && !/\.web(\.test)?\.(ts|tsx|tsrx)$/.test(e)) {
			yield p
		}
	}
}

let hits = 0
for (const root of ROOTS) {
	for (const file of walk(join(process.cwd(), root))) {
		const lines = readFileSync(file, 'utf8').split('\n')
		for (let i = 0; i < lines.length; i++) {
			// Strip // comments and /* ... */ spans before matching.
			const line = lines[i].replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
			for (const re of PATTERNS) {
				const m = line.match(re)
				if (m) {
					console.log(`${relative(process.cwd(), file)}:${i + 1}  ${m[0]}  — ${lines[i].trim()}`)
					hits++
				}
			}
		}
	}
}

if (hits) {
	console.error(
		`\ncheck-no-dom: ${hits} DOM reference(s) in shared/native source — move them behind a platform-suffixed leaf.`,
	)

	process.exit(1)
}

console.log('check-no-dom: clean')
