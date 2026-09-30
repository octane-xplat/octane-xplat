// Renders the production bundle in jsdom — catches boot hangs, empty
// render loops, and missing content without a browser. Run after build.
import { JSDOM } from 'jsdom'
import { readFileSync, readdirSync } from 'fs'
import { docPath, titleOf } from './src/doc-meta.ts'
import { parseMd } from './src/md.ts'

const js = 'dist/assets/' + readdirSync('dist/assets').find((f) => f.endsWith('.js'))
const dom = new JSDOM(readFileSync('dist/index.html', 'utf8'), {
	url: 'https://x.test/',
	runScripts: 'outside-only',
})

const { window } = dom
for (const k of [
	'document',
	'window',
	'HTMLElement',
	'MutationObserver',
	'CustomEvent',
	'history',
	'location',
]) {
	globalThis[k] = window[k]
}

globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16)
window.requestAnimationFrame = globalThis.requestAnimationFrame
window.matchMedia ??= () => ({
	matches: false,
	addEventListener() {},
	removeEventListener() {},
	addListener() {},
	removeListener() {},
})

const watchdog = setTimeout(() => {
	console.error('FAIL: bundle eval hung (boot loop)')
	process.exit(1)
}, 10000)

window.eval(readFileSync(js, 'utf8'))
clearTimeout(watchdog)
await new Promise((r) => setTimeout(r, 400))

const root = window.document.getElementById('root')
const side = window.document.querySelectorAll('.side-item').length
const numbered = [...window.document.querySelectorAll('.li-marker')].some(
	(el) => el.textContent?.trim() === '1.',
)

const checks = [
	['root mounted', root?.children.length > 0],
	['sidebar items', side >= 10],
	['doc content rendered', (root?.textContent || '').length > 500],
	['numbered list markers', numbered],
]

let fail = 0
for (const [name, ok] of checks) {
	console.log((ok ? 'PASS' : 'FAIL') + ' ' + name)
	if (!ok) {
		fail++
	}
}

const assert = (name, ok) => {
	console.log((ok ? 'PASS' : 'FAIL') + ' ' + name)
	if (!ok) { fail++ }
}

const table = parseMd('| value | meaning |\n| --- | --- |\n| `ready \\| error` | status |')[0]
assert('escaped table pipe stays in its cell', table?.kind === 'table' && table.rows[1].length === 2 && table.rows[1][0] === '`ready | error`')
// Sidebar navs hold the route change for the 200ms content fade-out.
const settle = () => new Promise((resolve) => setTimeout(resolve, 280))
let scrolledTo
window.HTMLElement.prototype.scrollIntoView = function () { scrolledTo = this.id }

const firstFlow = [...root.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/toolchain#create-and-run')
assert('section link retains fragment', Boolean(firstFlow))
firstFlow?.click()
await settle()
assert('section navigation reaches heading', window.location.hash === '#create-and-run' && scrolledTo === 'create-and-run')

const pages = readdirSync('../../docs').filter((file) => file.endsWith('.md'))
for (const file of pages) {
	const slug = file.slice(0, -3)
	const title = titleOf(slug, readFileSync(`../../docs/${file}`, 'utf8'))
	const item = [...root.querySelectorAll('.side-item')].find((el) => el.textContent === title)
	item?.click()
	await settle()
	assert(`page ${slug}`, window.location.pathname === docPath(slug) && root.querySelector('.doc .h1')?.textContent === title)
}

const navigationNotes = [...root.querySelectorAll('.side-item')].find((el) => el.textContent === 'Navigation notes')
navigationNotes?.click()
await settle()
const labLink = [...root.querySelectorAll('.doc a')].find((a) => a.textContent === 'lab log')
assert('same-page fragment stays local', labLink?.getAttribute('href') === '#lab-log' && !labLink.hasAttribute('target'))
assert('same-page heading exists', Boolean(root.querySelector('#lab-log')))

process.exit(fail ? 1 : 0)
