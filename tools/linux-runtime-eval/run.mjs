import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const engine = process.env.LINUX_RUNTIME_EVAL_ENGINE ?? 'native'
if (!['native', 'gjs'].includes(engine)) {
  throw Error('LINUX_RUNTIME_EVAL_ENGINE must be native or gjs')
}
const executable = process.env.LINUX_RUNTIME_EVAL_EXECUTABLE
if (engine === 'native' && !executable) {
  throw Error('Set LINUX_RUNTIME_EVAL_EXECUTABLE to the prepared Linux ns-linux binary')
}
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`
const runtime = engine === 'gjs' ? ['gjs', '-m'] : [executable]
const command = [
  'timeout',
  '40s',
  'dbus-run-session',
  '--',
  'xvfb-run',
  '-a',
  'python3',
  resolve(import.meta.dirname, 'input.py'),
  ...runtime,
  resolve(import.meta.dirname, `dist/${engine}/slice.js`),
]
const vm = process.env.LINUX_RUNTIME_EVAL_VM
if (vm) {
  execFileSync('orb', ['-m', vm, 'bash', '-lc', command.map(quote).join(' ')], { stdio: 'inherit' })
} else {
  execFileSync(command[0], command.slice(1), { stdio: 'inherit' })
}
