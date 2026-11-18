import { readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

export const primitiveModules = {
  Button: 'src/components/actions/Button.tsrx',
  Pressable: 'src/components/actions/Pressable.tsrx',
  View: 'src/components/layout/View.tsrx',
  Text: 'src/components/content/Text.tsrx',
  VStack: 'src/components/layout/VStack.tsrx',
  HStack: 'src/components/layout/HStack.tsrx',
  SafeArea: 'src/components/layout/SafeArea.tsrx',
  Screen: 'src/components/layout/Screen.tsrx',
  ScrollableArea: 'src/components/layout/ScrollableArea.tsrx',
  Spinner: { path: 'src/components/feedback/ActivityIndicator.tsrx', export: 'ActivityIndicator' },
  Icon: 'src/components/media/Icon.tsrx',
  Image: 'src/components/media/Image.tsrx',
}

function packageRoot(entry, name) {
  let directory = dirname(realpathSync(entry))

  for (;;) {
    try {
      if (JSON.parse(readFileSync(join(directory, 'package.json'))).name === name) {
        return directory
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    const parent = dirname(directory)

    if (parent === directory) {
      throw new Error('Could not locate package root: ' + name)
    }

    directory = parent
  }
}

/** Resolve app tools through its package ancestry, never the worker's globals. */
export function resolveProject(projectDir) {
  if (typeof projectDir !== 'string' || !projectDir) {
    throw new Error('Native startup projectDir is required')
  }

  const root = realpathSync(resolve(projectDir))
  const manifest = JSON.parse(readFileSync(join(root, 'package.json')))
  const declared = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.optionalDependencies,
  }

  const require = createRequire(join(root, 'package.json'))
  const normalizer = declared['@octane-xplat/build']
    ? '@octane-xplat/build/vite'
    : declared['@octane-xplat/cli']
      ? '@octane-xplat/cli/vite'
      : undefined

  if (!normalizer) {
    throw new Error('Native startup project must declare @octane-xplat/build or @octane-xplat/cli')
  }

  const uiRoot = packageRoot(require.resolve('@octane-xplat/ui'), '@octane-xplat/ui')
  const ownRequire = createRequire(import.meta.url)
  const cssRoot = packageRoot(
    ownRequire.resolve('@octane-xplat/css-engine'),
    '@octane-xplat/css-engine',
  )

  return {
    root,
    require,
    uiRoot,
    cssRoot,
    cssRequire: createRequire(join(cssRoot, 'package.json')),
    normalizerPath: require.resolve(normalizer),
  }
}
