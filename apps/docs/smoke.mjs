// Renders the production bundle in jsdom — catches boot hangs, empty
// render loops, and missing content without a browser. Run after build.
import { JSDOM } from 'jsdom';
import { readFileSync, readdirSync } from 'fs';

const js = 'dist/assets/' + readdirSync('dist/assets').find((f) => f.endsWith('.js'));
const dom = new JSDOM(readFileSync('dist/index.html', 'utf8'), { url: 'https://x.test/', runScripts: 'outside-only' });
const { window } = dom;
for (const k of ['document', 'window', 'HTMLElement', 'MutationObserver', 'CustomEvent', 'history', 'location']) {
	globalThis[k] = window[k];
}
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });

const watchdog = setTimeout(() => { console.error('FAIL: bundle eval hung (boot loop)'); process.exit(1); }, 10000);
window.eval(readFileSync(js, 'utf8'));
clearTimeout(watchdog);
await new Promise((r) => setTimeout(r, 400));

const root = window.document.getElementById('root');
const side = window.document.querySelectorAll('.side-item').length;
const checks = [
	['root mounted', root?.children.length > 0],
	['sidebar items', side >= 10],
	['doc content rendered', (root?.textContent || '').length > 500],
];
let fail = 0;
for (const [name, ok] of checks) { console.log((ok ? 'PASS' : 'FAIL') + ' ' + name); if (!ok) fail++; }
process.exit(fail ? 1 : 0);
