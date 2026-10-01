// Renders the production bundle in jsdom — catches boot hangs, empty
// render loops, and missing content without a browser. Run after build.
// `pnpm smoke:keys` builds with development diagnostics enabled too.
import { JSDOM } from 'jsdom'
import { readFileSync, readdirSync } from 'fs'
import { docPath, titleOf } from './src/doc-meta.ts'
import { inlineSpans, parseMd } from './src/md.ts'

const js = 'dist/assets/' + readdirSync('dist/assets').find((f) => f.endsWith('.js'))
const dom = new JSDOM(readFileSync('dist/index.html', 'utf8'), {
	url: 'https://x.test/',
	runScripts: 'outside-only',
})

const { window } = dom
const keyDiagnostics = []
for (const level of ['warn', 'error']) {
	const report = console[level].bind(console)
	console[level] = (...args) => {
		const message = args.map(String).join(' ')
		if (message.includes('each element in an array child') || message.includes('two children with the same key')) {
			keyDiagnostics.push(message)
		}

		report(...args)
	}
}

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
	['constellation elements rendered inline', root?.querySelectorAll('.constellation svg polygon').length > 100],
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

const promptCard = root.querySelector('.agent-prompt')
assert('front page includes one agent prompt after the introduction', root.querySelectorAll('.agent-prompt').length === 1 && promptCard?.previousElementSibling?.classList.contains('lede'))
const promptText = promptCard?.querySelector('p')?.textContent
const expandPrompt = promptCard?.querySelector('.agent-prompt-expand')
expandPrompt?.click()
await new Promise((r) => setTimeout(r, 30))
assert('agent prompt expands', expandPrompt?.getAttribute('aria-expanded') === 'true' && promptCard?.querySelector('.agent-prompt-text.is-expanded'))
expandPrompt?.click()
await new Promise((r) => setTimeout(r, 30))
assert('agent prompt collapses', expandPrompt?.getAttribute('aria-expanded') === 'false')
let copiedPrompt
Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => { copiedPrompt = text } } })
promptCard?.querySelector('[aria-label="Copy prompt"]')?.click()
await new Promise((r) => setTimeout(r, 30))
assert('copy includes the complete setup prompt and announces success', copiedPrompt === promptText && promptText?.includes('/llms-full.txt') && promptCard?.querySelector('[role="status"]')?.textContent === 'Prompt copied')
const promptActions = promptCard?.querySelector('details')
promptActions.open = true
window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
assert('Escape dismisses prompt actions', !promptActions.open)
assert('ChatGPT action includes the full prompt', new URL(promptCard.querySelector('.agent-prompt-menu a').href).searchParams.get('q') === promptText)
window.navigator.clipboard.writeText = async () => { throw new Error('Clipboard unavailable') }
promptCard?.querySelector('[aria-label="Copy prompt"]')?.click()
await new Promise((r) => setTimeout(r, 30))
assert('clipboard failure shows manual-copy guidance and expands the prompt', promptCard?.querySelector('.agent-prompt-status.is-error')?.textContent.includes('Select the prompt text') && expandPrompt?.getAttribute('aria-expanded') === 'true')

const highlights = [...root.querySelectorAll('.doc mark.highlight')]
assert('Xplat page renders both highlights', highlights.length === 2 && highlights[0].textContent === 'one TypeScript codebase' && highlights[1].textContent === 'Prove the loop first')
assert('highlight keeps its section link', highlights[1]?.querySelector('a')?.getAttribute('href') === '/toolchain#create-and-run')

const mixedHighlight = inlineSpans('before ==**bold** *italic* `code` [link](spec.md)== after')
assert('highlight composes with inline formatting', mixedHighlight[0].text === 'before ' && !mixedHighlight[0].highlight
	&& mixedHighlight.some((s) => s.highlight && s.bold && s.text === 'bold')
	&& mixedHighlight.some((s) => s.highlight && s.italic && s.text === 'italic')
	&& mixedHighlight.some((s) => s.highlight && s.mono && s.text === 'code')
	&& mixedHighlight.some((s) => s.highlight && s.href === 'spec.md' && s.text === 'link')
	&& mixedHighlight.at(-1).text === ' after' && !mixedHighlight.at(-1).highlight)

assert('highlight inside bold stays bold', inlineSpans('**==important==**').some((s) => s.highlight && s.bold && s.text === 'important'))
assert('code keeps highlight markers literal', inlineSpans('`==literal==`')[0].text === '==literal==' && !inlineSpans('`==literal==`')[0].highlight)
assert('unclosed or empty highlights stay literal', ['==unfinished', '====', '===literal==='].every((text) => inlineSpans(text).every((s) => !s.highlight) && inlineSpans(text).map((s) => s.text).join('') === text))
assert('single equals inside highlight stays text', inlineSpans('==x = y==')[0].text === 'x = y' && inlineSpans('==x = y==')[0].highlight)
assert('fenced code keeps highlight markers literal', parseMd('```md\n==literal==\n```')[0].text === '==literal==')

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
assert('setup card stays on the front page', !root.querySelector('.agent-prompt'))

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

// Cmd-K palette: open via the global shortcut, query for an API symbol,
// and select the top hit — it should route to that doc (+anchor).
window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'k', metaKey: true }))
await settle()
const paletteInput = window.document.getElementById('palette-input')
assert('palette opens on cmd-k', Boolean(paletteInput))

paletteInput.value = 'pushRoute'
paletteInput.dispatchEvent(new window.Event('input', { bubbles: true }))
await settle()
const topHit = window.document.querySelector('.hit')
assert('search finds api symbols', topHit?.textContent?.includes('pushRoute'))

topHit?.click()
await settle()
assert(
	'palette hit navigates',
	!window.document.getElementById('palette-input')
		&& window.location.pathname === docPath('navigation')
		&& root.querySelector('.doc .h1')?.textContent === 'Moving between screens',
)

assert('no missing or duplicate child keys', keyDiagnostics.length === 0)
assert('constellation survives navigation', root.querySelectorAll('.constellation svg polygon').length > 100)

process.exit(fail ? 1 : 0)
