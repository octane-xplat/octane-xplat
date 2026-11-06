import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repository = fileURLToPath(new URL('../../', import.meta.url))
function run(args: string[], env: Record<string, string> = {}) {
  console.log(`\n$ bun run ${args.join(' ')}`)
  const result = spawnSync('bun', ['run', ...args], {
    cwd: repository,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const browsers = ['chromium', 'firefox', 'webkit']
run(['--cwd', 'apps/web', 'playwright', 'install', ...browsers])
for (const browser of browsers) {
  const env = { XPLAT_WEB_BROWSER: browser }
  for (const name of [
    'input:readiness',
    'test:id',
    'sqlite:readiness',
    'sheet:readiness',
    'smoke',
  ]) {
    run(['turbo', 'run', name, '--filter=@xplat/web'], env)
  }
  run(['turbo', 'run', 'test:e2e', '--filter=@octane-xplat/lightbox'], env)
}
run(['check:optional-services', '--browser'])
run(['check:consumer', '--smoke', 'web'], { XPLAT_WEB_BROWSERS: browsers.join(',') })
