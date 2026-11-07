// @ts-nocheck — build tooling follows the existing Node engine's annotation boundary.
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, realpathSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve, relative, isAbsolute, sep } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { discoverStories } from './discover.ts'
import { xplatWorkshop } from './vite.ts'
import { galleryEntries } from '../gallery.ts'
import { xplatBoundary, xplatNodeEnvDefine } from '@octane-xplat/cli/vite'

const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  )

/** Build a portable static Workshop without starting a development service. */
export async function buildStaticWorkshop({
  cwd = process.cwd(),
  config = {},
  outDir = 'dist/workshop',
  base = '/',
  target = 'web',
} = {}) {
  if (target !== 'web') {
    throw new Error('Workshop static publishing supports --target web only')
  }
  if (!/^\/(?:[^?#\\]*\/)?$/.test(base) || base.includes('..') || base.startsWith('//')) {
    throw new Error('Workshop base must be an absolute URL path ending in /')
  }
  const root = realpathSync(cwd)
  if (!existsSync(join(root, 'package.json'))) {
    throw new Error('Workshop requires a consumer package.json')
  }
  const destination = resolve(root, outDir)
  // Only a new/owned descendant output is accepted; never erase source or project roots.
  const rel = relative(root, destination)
  if (
    !rel ||
    rel.startsWith('..') ||
    isAbsolute(rel) ||
    !['dist', 'build', 'out'].includes(rel.split(sep)[0])
  ) {
    throw new Error('Workshop output must be inside the project dist/, build/, or out/ directory')
  }
  for (let at = destination; at !== root; at = resolve(at, '..')) {
    if (existsSync(at) && lstatSync(at).isSymbolicLink()) {
      throw new Error('Workshop output must not traverse symlinks')
    }
  }
  if (
    existsSync(destination) &&
    readdirSync(destination).length &&
    !existsSync(join(destination, 'workshop-build.json'))
  ) {
    throw new Error('Workshop refuses to replace an output directory it does not own')
  }
  const { entries, diagnostics } = discoverStories(root, { ...config.stories, target })
  if (diagnostics.length) {
    throw new Error(diagnostics.map((d) => d.message).join('\n'))
  }
  const gallery = galleryEntries(entries)
  let revision = null
  try {
    revision = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    /* A packed consumer need not be a Git checkout. */
  }
  const req = createRequire(join(root, 'package.json'))
  const load = (specifier) => import(pathToFileURL(realpathSync(req.resolve(specifier))).href)
  const [{ build }, { octane }] = await Promise.all([load('vite'), load('@octanejs/vite-plugin')])
  const assets = []
  for (const [name, path] of Object.entries(config.assets ?? {})) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      throw new Error('Invalid Workshop asset root name')
    }

    const dir = realpathSync(resolve(root, path))
    const visit = (at, prefix = '') => {
      for (const item of readdirSync(at, { withFileTypes: true })) {
        if (item.isSymbolicLink()) {
          throw new Error('Workshop static assets must not contain symlinks')
        }

        const fileName = `${prefix}${item.name}`
        if (item.isDirectory()) {
          visit(join(at, item.name), `${fileName}/`)
        } else {
          assets.push({
            type: 'asset',
            fileName: `@workshop-assets/${name}/${fileName}`,
            source: readFileSync(join(at, item.name)),
          })
        }
      }
    }

    visit(dir)
  }
  await build({
    root,
    configFile: false,
    base,
    mode: 'production',
    plugins: [
      ...xplatWorkshop({ cwd: root, config, target }),
      ...octane(),
      xplatBoundary('web'),
      {
        name: 'workshop-static-document',
        generateBundle(_options, bundle) {
          const script = Object.values(bundle).find((file) => file.type === 'chunk' && file.isEntry)
          if (!script) {
            throw new Error('Workshop build emitted no entry')
          }
          const css = Object.values(bundle)
            .filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
            .map((file) => `<link rel="stylesheet" href="${escape(base + file.fileName)}">`)
            .join('')
          const sections = gallery
            .map(
              (entry) =>
                `<section id="component=${escape(encodeURIComponent(entry.componentId))}"><h2>${escape(entry.title)}</h2><p>${escape(entry.componentId)}</p><a href="?view=story&amp;story=${escape(encodeURIComponent(entry.selected?.id ?? entry.variants[0].id))}">Open story</a></section>`,
            )
            .join('')
          this.emitFile({
            type: 'asset',
            fileName: 'index.html',
            source: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Component workshop</title>${css}</head><body><div id="workshop-root"><h1>Component workshop</h1>${sections}</div><script type="module" src="${escape(base + script.fileName)}"></script></body></html>`,
          })
          for (const asset of assets) {
            this.emitFile(asset)
          }
          this.emitFile({
            type: 'asset',
            fileName: 'workshop-build.json',
            source: JSON.stringify({
              version: 1,
              revision,
              components: gallery.length,
              stories: entries.length,
              unavailable: gallery.filter((e) => !e.selected).map((e) => e.componentId),
            }),
          })
        },
      },
    ],
    define: xplatNodeEnvDefine('production'),
    build: {
      outDir: destination,
      emptyOutDir: true,
      rollupOptions: { input: '\0xplat-workshop-entry' },
    },
  })
  return { outDir: destination, components: gallery.length, stories: entries.length }
}
