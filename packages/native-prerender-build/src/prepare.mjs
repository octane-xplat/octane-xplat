import { readFileSync, writeFileSync } from 'node:fs'
import {
  createUniversalRoot,
  createObjectContainer,
  createObjectDriver,
} from 'octane/universal/native'

import { StartupComponent } from 'xplat-prerender:component'
import { configureNativeBuildHost, nativeBuildHostEvidence } from './native-api.mjs'
import { projectStartup } from './project.mjs'
import { projectPreparedTree } from '@octane-xplat/native-prerender'

const input = JSON.parse(readFileSync(process.argv[2], 'utf8'))

configureNativeBuildHost(input.theme)

const container = createObjectContainer('nativescript')
const root = createUniversalRoot(container, createObjectDriver('nativescript'))
const prepared = root.prepare(StartupComponent, input.seed)

if (prepared.status !== 'prepared') {
  throw new Error('Native startup producer: preparation suspended')
}

try {
  const nodes = projectStartup(prepared.batch.commands)
  const logicalNodes = projectPreparedTree(prepared.batch.commands).nodes

  if (container.children.length !== 0) {
    throw new Error('Native startup producer mutated the object host')
  }

  writeFileSync(
    input.output,
    JSON.stringify({ nodes, logicalNodes, ...nativeBuildHostEvidence() }, null, 2),
  )
} finally {
  prepared.abort()
}

await root.unmount()
if (container.children.length !== 0) {
  throw new Error('Native startup producer retained object-host children')
}
