import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { produceNativeStartup } from '@octane-xplat/native-prerender-build'
import { artifactNodeCount } from '@octane-xplat/native-prerender'

const source = import.meta.dirname
const parent = join(homedir(), 'agent-scratch/octane-xplat/native-prerender-home-producer')
mkdirSync(parent, { recursive: true })
const outputDir = mkdtempSync(join(parent, 'run-'))
const result = await produceNativeStartup({
  projectDir: process.env.XPLAT_PRERENDER_TOOLCHAIN_ROOT ?? resolve(source, '..'),
  configurationFile: resolve(process.env.XPLAT_PRERENDER_PRODUCER_CONFIG ?? join(source, 'producer/home.config.json')),
  outputDir,
  platform: process.env.XPLAT_PRERENDER_HOME_PLATFORM ?? 'ios',
})
const trees = result.artifact.trees ?? [result.artifact]
console.log('Home producer output: ' + result.directory)
console.log(JSON.stringify({
  trees: trees.length,
  binds: trees.map((tree) => tree.bind),
  visualNodes: trees.map((tree) => tree.nodes.filter((node) => node.kind !== '#text').length),
  logicalNodes: artifactNodeCount(result.artifact),
  themes: trees[0].variants
    ? Object.keys(trees[0].variants)
    : trees.map((tree) => tree.bind.systemAppearance),
  bytes: readFileSync(join(outputDir, 'startup.bin')).length,
  buildHash: result.manifest.buildHash,
}))
