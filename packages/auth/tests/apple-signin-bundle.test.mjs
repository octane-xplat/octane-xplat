import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, test } from 'node:test'
import { createLogger, build } from 'vite'
import { octane } from 'octane/compiler/vite'
import { nativeScriptRenderer } from '@nativescript-community/octane/config'

// Issue #165 — a consumer bundling the package root for Android must not
// reference @nativescript/apple-sign-in's iOS-only SignInButton export.
// The platform leaf (apple-sign-in-button-view.*.ts) re-exports the plugin
// class on iOS and `undefined` elsewhere, so the shared component keeps one
// implementation and the Android graph never touches the plugin class.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dir = mkdtempSync(join(tmpdir(), 'xplat-auth-bundle-'))

after(() => rmSync(dir, { recursive: true, force: true }))

mkdirSync(join(dir, 'node_modules/@octane-xplat'), { recursive: true })
symlinkSync(packageRoot, join(dir, 'node_modules/@octane-xplat/auth'), 'dir')
writeFileSync(join(dir, 'package.json'), '{"type":"module","private":true}')
writeFileSync(
  join(dir, 'entry.ts'),
  "import { appleAuth, AppleSignInButton } from '@octane-xplat/auth'\n" +
    'export const probe = [appleAuth.supported, AppleSignInButton]\n',
)

// Mirrors the native extension chain in @octane-xplat/cli native:
// platform leaf → .mobile → unsuffixed default, with platform .js ahead of
// the shared default so plugin stubs (index.android.js) win.
const extensions = (target) => [
  `.${target}.tsrx`,
  '.mobile.tsrx',
  '.tsrx',
  `.${target}.tsx`,
  '.mobile.tsx',
  '.tsx',
  `.${target}.ts`,
  '.mobile.ts',
  `.${target}.js`,
  '.mobile.js',
  '.ts',
  '.jsx',
  '.js',
  '.json',
]

async function bundle(target) {
  const warnings = []
  const logger = createLogger('warn')
  const warn = logger.warn.bind(logger)

  logger.warn = (msg, options) => {
    warnings.push(msg)
    warn(msg, options)
  }

  const result = await build({
    configFile: false,
    root: dir,
    customLogger: logger,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      __ANDROID__: JSON.stringify(target === 'android'),
      __IOS__: JSON.stringify(target === 'ios'),
      __VISIONOS__: 'false',
      __WINDOWS__: 'false',
      __APPLE__: JSON.stringify(target === 'ios'),
      'global.isAndroid': JSON.stringify(target === 'android'),
      'global.isIOS': JSON.stringify(target === 'ios'),
    },
    plugins: [
      octane({
        renderers: {
          registry: { nativescript: nativeScriptRenderer },
          rules: [{ include: '**/*.{tsx,tsrx}', renderer: 'nativescript' }],
        },
      }),
    ],
    resolve: {
      conditions: ['native'],
      alias: [{ find: /^octane$/, replacement: 'octane/universal/native' }],
      extensions: extensions(target),
    },
    build: {
      write: false,
      minify: false,
      lib: { entry: join(dir, 'entry.ts'), formats: ['cjs'] },
      rolldownOptions: {
        moduleTypes: { '.tsrx': 'tsx' },
        external: (id) =>
          id === '@nativescript/core' ||
          id.startsWith('@nativescript/core/') ||
          id === '@nativescript-community/octane' ||
          id === '@nativescript-community/gesturehandler' ||
          id.startsWith('octane/'),
        output: { codeSplitting: false },
      },
    },
  })

  const code = (Array.isArray(result) ? result : [result])
    .flatMap((r) => r.output ?? [])
    .filter((o) => o.type === 'chunk')
    .map((o) => o.code)
    .join('\n')

  return { code, warnings }
}

test('android package-root bundle has no missing SignInButton export', async () => {
  const { code, warnings } = await bundle('android')

  assert.equal(
    warnings.filter((msg) => /SignInButton|IMPORT_IS_UNDEFINED/.test(msg)).length,
    0,
    warnings.join('\n'),
  )

  assert.ok(code.includes('Sign in with Apple'), 'fallback button text missing from bundle')
  assert.ok(
    !code.includes('apple-sign-in/index.ios.js'),
    'iOS plugin module leaked into android bundle',
  )
})

test('ios package-root bundle selects the platform button leaf', async () => {
  const { code } = await bundle('ios')

  assert.ok(
    code.includes('apple-sign-in/index.ios.js'),
    'ASAuthorizationAppleIDButton plugin module missing from ios bundle',
  )

  assert.ok(
    /registerElement\)\("applesigninbutton"/.test(code),
    'applesigninbutton element registration missing from ios bundle',
  )
})
