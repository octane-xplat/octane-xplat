import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { InlineConfig } from 'vite'
import { devtoolsPanels } from './panels.ts'

const packageRoot = fileURLToPath(new URL('../../', import.meta.url))

/** The toolchain comes from the selected app. The bundled shell and its TS
 *  configuration come from this installed DevTools package. */
export async function devtoolsWebConfig(
  toolsRoot: string,
  outDir: string,
  mode: string,
  project: string | null = null,
): Promise<InlineConfig> {
  const require = createRequire(join(toolsRoot, 'package.json'))
  const load = (name: string) => import(pathToFileURL(require.resolve(name)).href)
  const [{ octane }, { css, boundary, nodeEnvDefine }] = await Promise.all([
    load('@octanejs/vite-plugin'),
    load('@octane-xplat/cli/vite'),
  ])

  const root = join(packageRoot, 'src', 'panel')

  return {
    // The package's default tsconfig references generated typecheck projects.
    tsconfig: join(root, 'tsconfig.browser.json'),
    root,
    plugins: [css('web'), ...octane(), boundary('web'), devtoolsPanels({ root: project ?? root })],
    define: {
      ...nodeEnvDefine(mode),
      __XPLAT_DEVTOOLS_PROJECT__: JSON.stringify(project),
    },
    base: './',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: join(root, 'index.html') },
    },
    resolve: {
      conditions: ['web'],
      extensions: [
        '.web.tsrx',
        '.tsrx',
        '.web.tsx',
        '.tsx',
        '.web.ts',
        '.mjs',
        '.mts',
        '.ts',
        '.jsx',
        '.js',
        '.json',
      ],
      dedupe: ['octane'],
    },
  }
}

export async function buildDevtoolsWeb(project: string, outDir: string) {
  const require = createRequire(join(project, 'package.json'))
  const { build } = await import(pathToFileURL(require.resolve('vite')).href)
  await build({
    ...(await devtoolsWebConfig(project, outDir, 'production', project)),
    configFile: false,
  })
}
