import { build } from 'vite'
import { linuxGtk } from '../../../packages/cli/src/linux-gtk/vite.ts'
import { native } from '../../../packages/cli/src/vite.ts'
import { fileURLToPath } from 'node:url'
import { resolve, join } from 'node:path'
import { mkdir, writeFile, readFile, symlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
const [target, destination] = process.argv.slice(2)
if (!['gtk', 'windows'].includes(target) || !destination)
  throw new Error('Expected gtk|windows and an output directory')
const root = fileURLToPath(
  new URL(
    target === 'gtk' ? '../../../packages/linux-gtk-renderer/' : '../../../tools/windows-host/',
    import.meta.url,
  ),
)
const entry = fileURLToPath(new URL(`desktop.${target}.mjs`, import.meta.url))
let config
if (target === 'gtk') {
  config = await linuxGtk('production', { root, entry, outDir: resolve(destination) })
} else {
  const output = resolve(destination)
  const consumer = output + '-consumer'
  await mkdir(join(consumer, 'src'), { recursive: true })
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
  manifest.name = 'layout-desktop-qualification'
  manifest.main = 'src/index.ts'
  await writeFile(join(consumer, 'package.json'), JSON.stringify(manifest))
  await writeFile(
    join(consumer, 'nativescript.config.ts'),
    "export default {id:'org.octanexplat.layoutqualification',appPath:'src',appResourcesPath:'App_Resources',bundler:'vite'}",
  )
  await writeFile(join(consumer, 'src/index.ts'), `import ${JSON.stringify(entry)}\n`)
  for (const name of ['node_modules', 'App_Resources']) {
    if (!existsSync(join(consumer, name))) await symlink(join(root, name), join(consumer, name))
  }
  process.env.NATIVESCRIPT_BUNDLER_ENV = JSON.stringify({ platform: 'windows', windows: true })
  process.chdir(consumer)
  config = await native('production', {
    extra: {
      root: consumer,
      build: { outDir: output },
      resolve: { dedupe: ['@nativescript/core', '@octane-xplat/nativescript-octane'] },
    },
  })
}
if (target === 'gtk') {
  const external = config.build.rollupOptions.external
  config.build.rollupOptions.external = (id, ...args) => id === 'system' || external(id, ...args)
}
await build({ ...config, configFile: false, logLevel: 'warn' })
