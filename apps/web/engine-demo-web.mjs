import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 480, height: 900 } })
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
  if (m.text().includes('engine-demo')) console.log('console:', m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5200/democheck.html', { waitUntil: 'networkidle' })
await page.click('#menu-engine-demo')
await page.waitForFunction(
  () => /loaded|error/.test(document.getElementById('engine-status-pc')?.textContent ?? '') &&
        /loaded|error/.test(document.getElementById('engine-status-pixi')?.textContent ?? ''),
  { timeout: 40000 },
)
const read = async () => ({
  pc: await page.locator('#engine-status-pc').textContent(),
  pixi: await page.locator('#engine-status-pixi').textContent(),
  taps: await page.locator('#engine-taps').textContent(),
})
console.log('after-load:', JSON.stringify(await read()))
await page.click('#engine-rotate')
await page.waitForTimeout(800)
console.log('after-tap:', JSON.stringify(await read()))
console.log('console-errors:', JSON.stringify(errors.slice(0, 10)))
await browser.close()
