// Shared doc metadata — imported by src/docs.ts, src/MdDoc.tsrx,
// src/App.tsrx, and scripts/build-llms.ts (Node type-strips this file).
// Keep it erasable-TS only: no enums, namespaces, or parameter properties.

// docs/ contains reader-facing app guides. Internal implementation and design
// records live under .agents/ and are linked as repository sources when useful.
export const GROUPS = [
  {
    dir: 'start',
    label: 'Start here',
    slugs: ['README', 'spec', 'toolchain', 'native-release', 'architecture'],
  },
  { dir: 'demos', label: 'Demos', slugs: ['browser-demos', 'goal-counter', 'packing-list'] },
  {
    dir: 'app',
    label: 'Build your app',
    slugs: [
      'primitives',
      'components',
      'component-libraries',
      'text-entry',
      'accessibility',
      'local-storage',
      'interactive-actions',
      'menus',
      'tables',
      'content-display',
      'markdown',
      'navigation',
      'navigation-ui',
      'drawer',
      'authentication',
      'search-selection',
      'command-palette',
      'power-search',
      'data',
      'readiness',
      'styling',
      'liquid-glass',
      'localization',
      'animation-gestures',
      'gestures',
      'keyboard-clipboard',
      'keyboard-shortcuts',
      'keyboard-shortcuts-api',
      'software-keyboard',
      'movie-capture',
      'virtual-list',
      'rich-text',
      'updates',
      'ui-api-migrations',
    ],
  },
  {
    dir: 'platform',
    label: 'Device features',
    slugs: [
      'module-resolution',
      'platform-services',
      'in-app-purchases',
      'background-work',
      'media-services',
      'keep-awake',
      'local-notifications',
      'push-notifications',
      'native-picker',
      'date-picker',
      'context-menu',
      'sheet',
      'macos-webview',
      'macos-native',
      'linux-package',
      'linux-gtk',
      'web-rendering',
      'windows-setup',
    ],
  },
  {
    dir: 'testing',
    label: 'Check your app',
    slugs: [
      'testing',
      'component-workshop',
      'test-identifiers',
      'maestro',
      'argent',
      'development-actions',
      'diagnostics',
      'production-errors',
      'image-performance',
      'known-limits',
    ],
  },
  {
    dir: 'packages',
    label: 'Packages',
    slugs: [
      'package-ads',
      'package-app',
      'package-app-menu',
      'package-audio',
      'package-auth',
      'package-background-tasks',
      'package-bamboo',
      'package-barcode-scanner',
      'package-billing',
      'package-biometrics',
      'package-calendar',
      'package-camera',
      'package-canvas',
      'package-charts',
      'package-build',

      'package-cli',
      'package-toolchain',
      'package-contacts',
      'package-context-menu',
      'package-create',
      'package-crypto',
      'package-css-engine',
      'package-date-picker',
      'package-demos',
      'package-desktop-webview',
      'package-devtools',
      'package-docs-search',
      'package-dnd-kit',
      'package-effects',
      'package-files',
      'package-form',
      'package-fingerprint',
      'package-firebase-analytics',
      'package-firebase-crashlytics',
      'package-geofencing',
      'package-geolocation',
      'package-gif',
      'package-global-shortcuts',
      'package-haptics',
      'package-icons',
      'package-image',
      'package-image-crop',
      'package-image-manipulator',
      'package-intersection-observer',
      'package-jsx',
      'package-keyboard',
      'package-lexical',
      'package-lib',
      'package-lightbox',
      'package-lingui',
      'package-lint',
      'package-linux-gtk-renderer',
      'package-lottie',
      'package-macos-appkit',
      'package-macos-build',
      'package-maps',
      'package-mcp',
      'package-media',
      'package-media-converter',
      'package-media-library',
      'package-media-probe',
      'package-motion',
      'package-nano-icons',
      'package-network',
      'package-notifications',
      'package-pager',
      'package-patches',
      'package-picker',
      'package-platform',
      'package-posthog',
      'package-print',
      'package-push',
      'package-recorder',
      'package-richtext',
      'package-rolling-text',
      'package-screen-orientation',
      'package-secure-storage',
      'package-sentry',
      'package-shaders',
      'package-share',
      'package-sheet',
      'package-shortcuts',
      'package-smooth-corners',
      'package-sounds',
      'package-speech-recognition',
      'package-splash-screen',
      'package-sqlite',
      'package-store-review',
      'package-stripe',
      'package-table',
      'package-tiptap',
      'package-tracking-transparency',
      'package-tray',
      'package-tsrx-typegen',
      'package-typegen-fixture',
      'package-tweaks',
      'package-ui',
      'package-updates',
      'package-video',
      'package-view-shot',
      'package-web-browser',
      'package-web-host',
      'package-workshop',
    ],
  },
  {
    dir: 'blog',
    label: 'Blog',
    slugs: ['nativescript-react-native-engines'],
  },
  { dir: 'api', label: 'API reference', slugs: [] },
  // No docs/ directory — the changelog page is generated from the repo's
  // root logs (apps/docs/src/changelog.ts), so the group holds its slug.
  { dir: 'releases', label: 'Releases', slugs: ['changelog'] },
]

// The index doc lives at '/', not /README.
export const INDEX_SLUG = 'README'

// Reading-order rank for guides — group order, then position in its list.
// Unlisted slugs (a new doc awaiting curation) sort to the end of their
// group alphabetically, so new docs never vanish.
export function rankOf(slug: string, dir: string): number {
  const gi = GROUPS.findIndex((g) => g.dir === (dir || 'start'))

  if (gi === -1) {
    return 1000
  }

  const si = GROUPS[gi].slugs.indexOf(slug)

  return gi * 100 + (si === -1 ? 99 : si)
}

export function titleOf(slug: string, md: string): string {
  const h = md.match(/^#\s+(.+)$/m)

  if (h) {
    return h[1].replace(/[`*_]/g, '').trim()
  }

  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// The first blockquote after the H1 is the page's purpose — reused as the
// link description in generated indexes (llms.txt). Flatten to one line.
export function purposeOf(md: string): string {
  const lines = md.split('\n')
  const h1 = lines.findIndex((l) => /^#\s+/.test(l))
  const quote: string[] = []

  for (let i = h1 + 1; i < lines.length; i++) {
    const l = lines[i]

    if (l.startsWith('>')) {
      quote.push(l.replace(/^>\s?/, ''))
    } else if (l.trim() === '') {
      if (quote.length) {
        break
      }
    } else {
      break
    }
  }

  return quote.join(' ').replace(/\s+/g, ' ').trim()
}

// Slug for a doc file at corpus-relative path dir/name.md. The root index is
// 'README'; a directory's own README/index becomes the directory name.
export function slugFor(dir: string, base: string): string {
  if (base === 'README' || base === 'index') {
    return dir ? dir.split('/').pop()! : INDEX_SLUG
  }

  return base
}

// Resolve an intra-doc markdown link to a doc slug. Links are real relative
// paths (GitHub renders them), resolved against the linking doc's dir:
// 'x.md', './x.md', '../app/x.md', 'notes/x.md' all work. A README/index
// target resolves to its directory's slug. Returns null for non-doc hrefs.
export function docSlugFor(href: string, dir: string): string | null {
  const clean = href.split('#', 1)[0].split('?', 1)[0]

  if (!clean.endsWith('.md')) {
    return null
  }

  const segs: string[] = []

  for (const s of [...(dir ? dir.split('/') : []), ...clean.split('/')]) {
    if (!s || s === '.') {
      continue
    }

    if (s === '..') {
      if (!segs.length) {
        return null // escapes the corpus — a repo path, not a doc
      }

      segs.pop()
    } else {
      segs.push(s)
    }
  }

  const base = segs.pop()?.replace(/\.md$/, '')

  return base === undefined ? null : slugFor(segs.join('/'), base)
}

// Repo-relative path for a non-doc href — the GitHub target of source links.
// Hrefs that escape the corpus via '../' are already repo-relative; anything
// else resolves inside docs/ (dir-aware, so '../evidence/x.json' from a note
// stays under docs/).
export function repoPathFor(href: string, dir: string): string {
  const clean = href.split('#', 1)[0].split('?', 1)[0]
  const segs: string[] = []
  let escapes = 0

  for (const s of [...(dir ? dir.split('/') : []), ...clean.split('/')]) {
    if (!s || s === '.') {
      continue
    }

    if (s === '..') {
      if (segs.length) {
        segs.pop()
      } else {
        escapes++
      }
    } else {
      segs.push(s)
    }
  }

  const path = escapes ? segs.join('/') : 'docs/' + segs.join('/')

  return path + (clean.endsWith('/') ? '/' : '')
}

// Site path for a doc — mirrors MdDoc's link mapping and App's route lookup.
export function docPath(slug: string): string {
  return slug === INDEX_SLUG ? '/' : `/${slug}`
}
