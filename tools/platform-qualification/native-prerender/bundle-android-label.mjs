import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

const [core, work, entry, masonRuntime, attachmentMode] = process.argv.slice(2)
if (!core || !work || !entry) throw new Error('Expected Core root, work directory and label entry')
const require = createRequire(join(core, 'package.json'))
const inputs = {}
const inputDir = join(work, 'label-js-inputs')
mkdirSync(inputDir)
const result = await Bun.build({
  entrypoints: [entry],
  outdir: join(work, 'label-bundle'),
  format: 'cjs',
  target: 'browser',
  define: {
    XPLAT_PRERENDER_ADOPT_PARENT: String(attachmentMode === 'adopt'),
    __ANDROID__: 'true',
    __IOS__: 'false',
    __APPLE__: 'false',
    __VISIONOS__: 'false',
    __WINDOWS__: 'false',
    __DEV__: 'false',
    __COMMONJS__: 'true',
    __CSS_PARSER__: '"css-tree"',
  },
  plugins: [
    {
      name: 'pinned-android-core',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === '~/package.json')
            return { path: join(work, 'app/src/main/assets/app/package.json') }
          if (args.path === 'css-tree')
            return { path: require.resolve('css-tree/dist/csstree.esm') }
          let base
          if (args.path.startsWith('xplat-prerender:mason/')) {
            if (!masonRuntime) throw new Error('Mason runtime root missing')
            base = join(masonRuntime, args.path.slice('xplat-prerender:mason/'.length))
          } else if (args.path.startsWith('@nativescript/core'))
            base = core + args.path.slice('@nativescript/core'.length)
          else if (args.path.startsWith('.')) base = resolve(dirname(args.importer), args.path)
          else return
          for (const path of [
            base + '.android.js',
            join(base, 'index.android.js'),
            base + '.js',
            join(base, 'index.js'),
            base,
          ]) {
            if (existsSync(path) && /\.(?:m?js|json)$/.test(path)) return { path }
          }
        })
        build.onLoad({ filter: /\.(?:m?js|json)$/ }, (args) => {
          const contents = readFileSync(args.path)
          const sha256 = createHash('sha256').update(contents).digest('hex')
          const copy = join(inputDir, sha256)
          writeFileSync(copy, contents)
          inputs[args.path] = { copy, sha256 }
          return {
            contents: contents.toString(),
            loader: args.path.endsWith('.json') ? 'json' : 'js',
          }
        })
      },
    },
  ],
})
if (!result.success) throw new Error(result.logs.join('\n'))
const bundle = readFileSync(result.outputs[0].path, 'utf8')
writeFileSync(join(work, 'app/src/main/assets/app/main.js'), bundle)
writeFileSync(join(work, 'label-js-inputs.json'), JSON.stringify(inputs, null, 2))
