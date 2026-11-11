import {
  copyFileSync,
  globSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'

import { dirname, join, relative } from 'node:path'
import { createRequire } from 'node:module'
import { build, defineConfig } from 'vite'

const require = createRequire(import.meta.url)

// Bundled into dist so the published CLI carries no runtime dependency on
// these packages: resolved package dir → emitted dist/vendor/ prefix.
const packageRoot = (specifier: string) => {
  let dir = dirname(require.resolve(specifier))

  for (let depth = 0; depth < 5; depth++) {
    try {
      statSync(join(dir, 'package.json'))
      return dir
    } catch {
      dir = dirname(dir)
    }
  }

  return dir
}

const vendoredRoots: [string, string][] = [
  [packageRoot('@octane-xplat/lib/route-pattern'), 'vendor/@octane-xplat/lib'],
  [packageRoot('create-octane-xplat/compatibility'), 'vendor/create-octane-xplat'],
]

const vendorName = (id: string | null | undefined) => {
  if (!id) {
    return undefined
  }

  const clean = id.split('?')[0]

  for (const [root, prefix] of vendoredRoots) {
    if (clean.startsWith(root + '/')) {
      return `${prefix}/${relative(root, clean).replace(/\.ts$/, '.js')}`
    }
  }

  return undefined
}

// The CLI runs under Bun — emit per-module ESM mirroring src/ so bins,
// spawned entries, and subpath exports resolve inside the published tarball.
export default defineConfig({
  build: {
    lib: {
      entry: globSync('src/**/*.ts').filter((f) => !f.endsWith('.d.ts') && !f.includes('.test.')),
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      // Module-per-file emit: every source file must survive as a module —
      // treeshaking drops `export {}` from type-only contract stubs, and an
      // empty .js is not a module to consumers' tsc.
      treeshake: false,
      // Bundle @octane-xplat/lib and create-octane-xplat/compatibility into
      // dist so the published CLI carries no runtime dependency on them.
      external: (id) =>
        id.startsWith('node:') ||
        (!id.startsWith('.') &&
          !id.startsWith('/') &&
          !id.endsWith('.ts') &&
          !id.startsWith('@octane-xplat/lib/') &&
          id !== 'create-octane-xplat/compatibility'),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: (chunk) => vendorName(chunk.facadeModuleId) ?? '[name].js',
        chunkFileNames: (chunk) => vendorName(chunk.moduleIds[0]) ?? '[name].js',
      },
    },
  },
  plugins: [
    {
      name: 'keep-empty-modules',
      apply: 'build',
      closeBundle() {
        // Type-only sources emit as empty files — rolldown drops the
        // `export {}` marker even with treeshake off, and a zero-byte .js
        // is not a module to consumers' tsc. Restore the marker.
        const restore = (dir: string) => {
          for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const p = join(dir, entry.name)

            if (entry.isDirectory()) {
              restore(p)
            } else if (entry.name.endsWith('.js') && statSync(p).size === 0) {
              writeFileSync(p, 'export {}\n')
            }
          }
        }

        restore('dist')
        // The bundled create-octane-xplat compatibility module loads
        // compatibility.json from the directory above its dist/ file.
        copyFileSync(
          join(vendoredRoots[1][0], 'compatibility.json'),
          'dist/vendor/create-octane-xplat/compatibility.json',
        )

        for (const name of ['native', 'macos']) {
          mkdirSync('dist/typecheck-globals', { recursive: true })
          writeFileSync(
            `dist/typecheck-globals/${name}.d.ts`,
            readFileSync(`src/typecheck-globals/${name}.d.ts`),
          )
        }
      },
    },
    {
      name: 'jsc-abort-globals',
      apply: 'build',
      async closeBundle() {
        const hostRequire = createRequire(new URL('./package.json', import.meta.url))
        const controller = hostRequire.resolve('abort-controller/package.json')
        const events = createRequire(controller).resolve('event-target-shim/package.json')
        const licenses = [controller, events]
          .map((path) => readFileSync(join(dirname(path), 'LICENSE'), 'utf8'))
          .join('\n\n')

        await build({
          configFile: false,
          build: {
            outDir: 'dist',
            emptyOutDir: false,
            lib: {
              entry: 'src/macos/jsc-host/abort-globals.mjs',
              formats: ['iife'],
              name: 'XplatAbortGlobals',
              fileName: () => 'macos/jsc-host/abort-globals.cjs',
            },
            minify: true,
          },
        })

        // Preserve complete MIT notices in the embedded host payload, including
        // after Vite's minifier removes comments from the generated IIFE.
        const asset = 'dist/macos/jsc-host/abort-globals.cjs'

        writeFileSync(asset, `/*!\n${licenses}\n*/\n${readFileSync(asset, 'utf8')}`)
      },
    },
  ],
})
