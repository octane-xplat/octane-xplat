import { configDefaults, defineConfig } from 'vitest/config'
import native from './vitest.native.config.mts'

// Render-cost microbenchmarks for the hot native primitives. They compile
// exactly like the native unit tests (universal runtime + object driver) and
// run in one forked worker. `--jitless` approximates NativeScript iOS, whose
// V8 runs without JIT; set XPLAT_UI_BENCH_JIT=1 to measure with the JIT.
const jitless = process.env.XPLAT_UI_BENCH_JIT !== '1'

export default defineConfig({
  ...native,
  test: {
    ...native.test,
    include: ['bench/**/*.bench.mobile.tsrx'],
    exclude: [...configDefaults.exclude],
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    execArgv: [...(jitless ? ['--jitless'] : []), '--expose-gc'],
    testTimeout: 600_000,
  },
})
