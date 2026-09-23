// Real-browser smoke for the shared app — the web target's first runtime
// evidence. Serves apps/web/dist via `vite preview`, drives headless
// Chromium, asserts render + tab nav + chip→hash-route + interaction,
// and fails on any pageerror/console.error.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const webDir = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const PORT = 4319;
const BASE = `http://localhost:${PORT}`;

const preview = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT)], {
	cwd: webDir,
	stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((r) => preview.stdout.on('data', (d) => String(d).includes('Local') && r()));
await new Promise((r) => setTimeout(r, 500));

const results = [];
const errors = [];
const ok = (name, cond, extra = '') => {
	results.push([cond, name]);
	console.log('[smoke] ' + name + ': ' + (cond ? 'OK' : 'FAIL') + (extra ? ' ' + extra : ''));
};

try {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
	page.on('console', (m) => m.type() === 'error' && errors.push('console.error: ' + m.text()));

	await page.goto(BASE, { waitUntil: 'networkidle' });

	// Mount: Home tab content exists.
	await page.waitForSelector('text=Count: 0', { timeout: 10000 });
	ok('app mounts — Count: 0', true);

	// Interact: Increment bumps state.
	await page.click('text=Increment');
	await page.waitForSelector('text=Count: 1', { timeout: 3000 });
	ok('pressable onClick → state update', true);

	// Tab switch: web Tabs leaf renders a button row.
	await page.click('button:text("Demos")');
	await page.waitForSelector('text=Last opened:', { timeout: 3000 });
	ok('tab switch → demos catalog mounts', true);
	const chipCount = await page.locator('[role="button"]:has-text("Counter")').count();
	ok('gallery chips render', chipCount >= 1, 'chips=' + chipCount);

	// Chip click → navigate('demo',{id},{into}) → web leaf writes the hash.
	await page.click('[role="button"]:has-text("Counter")');
	await page.waitForFunction(() => location.hash.includes('demo'), null, { timeout: 3000 });
	const hash = await page.evaluate(() => location.hash);
	ok('chip → navigate writes hash route', hash.includes('demo') && hash.includes('counter'), hash);

	// Settings tab: sheet stub logs (the web leaf is a stub — assert the call path).
	const logs = [];
	page.on('console', (m) => logs.push(m.text()));
	await page.click('button:text("Settings")');
	await page.click('text=Open sheet');
	await page.waitForTimeout(300);
	ok('sheet stub invoked', logs.some((l) => l.includes('sheet open')));

	// No leaked platform failures.
	ok('zero pageerrors/console.error', errors.length === 0, errors[0] ?? '');

	await browser.close();
} finally {
	preview.kill();
}

const fails = results.filter(([c]) => !c).length;
console.log(`[smoke] ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
