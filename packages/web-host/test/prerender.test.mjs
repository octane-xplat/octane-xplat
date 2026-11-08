import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prerender } from '../src/build/prerender.ts'

const renderer = {
  href: (path) => path,
  render: async (request) => ({
    version: 1,
    url: new URL(request.url).pathname,
    status: 200,
    headers: [
      ['cache-control', 'public'],
      ['content-type', 'text/html'],
    ],
    html: 'page',
  }),
  document: async (page) => new Response(page.html, { headers: page.headers }),
}

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'xplat-static-'))

  try {
    await run(root, {
      origin: 'https://example.com',
      outDir: join(root, 'html'),
      cacheFile: join(root, 'cache.json'),
      revision: 'v1',
      paths: [{ destination: '/', key: 'v1' }],
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

test('validates paths and filesystem collisions before rendering', () =>
  fixture(async (_, options) => {
    for (const destination of [
      '//example.com/a',
      '/a?query=1',
      '/a#hash',
      '/a/../b',
      '/%2e%2e/b',
      '/a%2fb',
      '/a%5cb',
      '/a//b',
      '/a%00b',
      '/nul',
      '/a.',
    ]) {
      await assert.rejects(
        prerender(renderer, { ...options, paths: [{ destination, key: null }] }),
        /path|disk/i,
      )
    }

    for (const paths of [
      ['/a', '/a/'],
      ['/A', '/a'],
      ['/', '/index.html/nested'],
      ['/caf%C3%A9', '/café'],
    ]) {
      await assert.rejects(
        prerender(renderer, {
          ...options,
          paths: paths.map((destination) => ({ destination, key: null })),
        }),
        /collision/i,
      )
    }

    await assert.rejects(
      prerender(renderer, { ...options, cacheFile: join(options.outDir, 'cache') }),
      /outside/,
    )

    await assert.rejects(prerender(renderer, { ...options, revision: '' }), /revision/)
    await assert.rejects(
      prerender(renderer, { ...options, origin: 'https://example.com/private' }),
      /origin/,
    )

    await assert.rejects(
      prerender(renderer, { ...options, paths: [{ destination: '/' }] }),
      /content key/,
    )
  }))

test('preserves unowned output and refuses symlinks', () =>
  fixture(async (root, options) => {
    await mkdir(options.outDir)
    await writeFile(join(options.outDir, 'user.txt'), 'keep')
    await assert.rejects(prerender(renderer, options))
    assert.equal(await readFile(join(options.outDir, 'user.txt'), 'utf8'), 'keep')
    await symlink(options.outDir, join(root, 'alias'))
    await assert.rejects(prerender(renderer, { ...options, outDir: join(root, 'alias') }), /owned/)
  }))

test('serializes concurrent builds and releases the lock after failures', () =>
  fixture(async (_, options) => {
    let release, entered
    const ready = new Promise((resolve) => {
      entered = resolve
    })

    const wait = new Promise((resolve) => {
      release = resolve
    })

    const pending = prerender(
      {
        ...renderer,
        render: async (request) => {
          entered()
          await wait
          return renderer.render(request)
        },
      },
      options,
    )

    await ready
    await assert.rejects(prerender(renderer, options), { code: 'EEXIST' })
    release()
    await pending
    assert.equal((await prerender(renderer, options)).reused, 1)
    await assert.rejects(
      prerender(
        {
          ...renderer,
          document: async () => {
            throw new Error('document failed')
          },
        },
        options,
      ),
      /document failed/,
    )

    assert.equal(await readFile(join(options.outDir, 'index.html'), 'utf8'), 'page')
    assert.equal((await prerender(renderer, options)).reused, 1)
  }))

test('writes a marked not-found page to 404.html and reuses it like other pages', () =>
  fixture(async (_, options) => {
    const notFound = { destination: '/oops', key: 'nf-v1' }
    const renderer = {
      href: (path) => path,
      render: async (request) => {
        const url = new URL(request.url).pathname

        return {
          version: 1,
          url,
          status: url === '/oops' ? 404 : 200,
          headers: [
            ['cache-control', 'public'],
            ['content-type', 'text/html'],
          ],
          html: url === '/oops' ? 'missing' : 'page',
        }
      },
      document: async (page, request, documentOptions) =>
        new Response(page.html + (documentOptions?.fallback ? '|fallback' : ''), {
          status: page.status,
          headers: page.headers,
        }),
    }

    const settings = { ...options, notFound }

    assert.deepEqual(await prerender(renderer, settings), {
      rendered: 2,
      reused: 0,
      paths: ['/'],
      notFound: '/oops',
    })

    assert.equal(await readFile(join(options.outDir, '404.html'), 'utf8'), 'missing|fallback')
    assert.equal(await readFile(join(options.outDir, 'index.html'), 'utf8'), 'page')
    assert.deepEqual(await prerender(renderer, settings), {
      rendered: 0,
      reused: 2,
      paths: ['/'],
      notFound: '/oops',
    })
  }))

test('requires a public 404 page for the not-found output and reserves 404.html', () =>
  fixture(async (_, options) => {
    const notFound = { destination: '/oops', key: null }
    const notFoundRenderer = {
      ...renderer,
      render: async (request) => {
        const page = await renderer.render(request)

        if (new URL(request.url).pathname === '/oops') {
          page.status = 404
        }

        return page
      },
    }

    // A 200 page is rejected before the document is assembled.
    await assert.rejects(prerender(renderer, { ...options, notFound }), /404 page/)
    // The document response itself must also carry the 404.
    await assert.rejects(
      prerender(
        {
          ...notFoundRenderer,
          document: async (page) => new Response(page.html, { status: 200, headers: page.headers }),
        },
        { ...options, notFound },
      ),
      /404 page/,
    )

    assert.equal(
      (
        await prerender(
          {
            ...notFoundRenderer,
            document: async (page) =>
              new Response(page.html, { status: page.status, headers: page.headers }),
          },
          { ...options, notFound },
        )
      ).notFound,
      '/oops',
    )

    for (const destination of ['/404.html', '/404.HTML', '/404.html/nested']) {
      await assert.rejects(
        prerender(renderer, { ...options, paths: [{ destination, key: null }] }),
        /collision/,
        destination,
      )
    }
  }))

test('corrupt cache entries rerender and encoded paths map to decoded static files', () =>
  fixture(async (_, options) => {
    const settings = { ...options, paths: [{ destination: '/caf%C3%A9', key: 'v1' }] }

    await prerender(renderer, settings)
    assert.equal(await readFile(join(options.outDir, 'café/index.html'), 'utf8'), 'page')

    const cache = JSON.parse(await readFile(options.cacheFile, 'utf8'))

    Object.values(cache.pages)[0].content = '{corrupt'
    await writeFile(options.cacheFile, JSON.stringify(cache))
    assert.equal((await prerender(renderer, settings)).rendered, 1)
    assert.equal(
      (await prerender(renderer, { ...settings, origin: 'https://another.example' })).rendered,
      1,
    )
  }))
