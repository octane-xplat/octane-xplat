import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const workflow = process.argv[2]

function run(args: string[]) {
  const result = spawnSync('bun', ['run', ...args], {
    cwd: repository,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) {
    throw result.error
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function task(name: string, owner: string) {
  run(['turbo', 'run', name, `--filter=${owner}`])
}

if (workflow === 'parity:macos') {
  run(['--filter', '@xplat/verification', 'parity:coverage'])
  task('parity', '@xplat/web')
  task('parity', '@xplat/macos')
  run(['node', 'tools/verification/parity-check.ts', '--targets=web,macos'])
} else if (workflow === 'smoke:macos') {
  for (const name of ['smoke', 'test:animation', 'test:layout-placement']) {
    task(name, '@xplat/macos')
  }

  for (const file of ['signals.ts', 'counter.tsrx', 'lottie.macos.tsrx']) {
    run([
      'probe',
      'run',
      `examples/probes/${file}`,
      '--target',
      'macos',
      ...(file.startsWith('lottie.') ? ['--deps', '@octane-xplat/lottie'] : []),
    ])
  }
} else {
  throw new Error('Expected parity:macos or smoke:macos')
}
