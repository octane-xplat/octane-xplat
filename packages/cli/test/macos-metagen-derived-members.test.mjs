import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const hostRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../src/macos/jsc-host')
const generator = join(hostRoot, 'prebuilt/macos/objc-metadata-generator')
const fixtureRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures/metagen-derived-members',
)

// Upstream metagen ran convertMethodToPropertyIfNeeded backwards at three
// sites (NativeScript/runtimes#106): ClassDecl::postProcessMembers walked
// derivedClassRefs, and ProtocolDecl::postProcessMembers walked
// implementerRefs and derivedProtocolRefs — each rewrote an ANCESTOR's
// method record into a property carrying a DESCENDANT's getter/setter
// selectors. The shipped metadata inherited NSView.autoscroll from
// NSMatrix (isAutoscroll/setAutoscroll: on a class that implements
// neither) and NSObject.candidates, plus 37 protocol records; messaging
// those selectors aborted the host. The maintained patch drops the three
// reversed call sites so property synthesis only flows ancestor ->
// descendant (the superclass and refined-protocol walks). This runs the
// shipped generator over the MiniKit fixture — ancestors declaring
// methods, transitive descendants declaring same-jsified-name properties —
// and asserts the emitted members keep their declared kind and selectors.
const membersBySymbol = (symbols, name) =>
  Object.fromEntries(
    (symbols.find((symbol) => symbol.name === name)?.members ?? []).map((member) => [
      member.jsName,
      member,
    ]),
  )

test(
  'metadata generator does not synthesize ancestor properties from descendant members',
  { skip: process.platform !== 'darwin' && 'requires the macOS metadata generator' },
  (t) => {
    if (!existsSync(generator)) {
      return t.skip('prebuilt objc-metadata-generator is not installed')
    }
    // The generator links the Command Line Tools libclang at runtime.
    const check = spawnSync(generator, ['--xplat-check'], { encoding: 'utf8' })
    if (check.status !== 0) {
      return t.skip(`generator self-check failed: ${check.stderr.trim()}`)
    }
    const sdk = spawnSync('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], {
      encoding: 'utf8',
    })
    if (sdk.status !== 0) {
      return t.skip('no macOS SDK available for the generator run')
    }

    const dir = mkdtempSync(join(tmpdir(), 'xplat-metagen-derived-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))

    const result = spawnSync(
      generator,
      [
        'import=<MiniKit/MiniKit.h>',
        `include=${join(fixtureRoot, 'MiniKit.framework')}`,
        `json=${dir}`,
        '-output-bin',
        join(dir, 'mini.nsmd'),
        '-output-umbrella',
        join(dir, 'umbrella.h'),
        'Xclang',
        `-F${fixtureRoot}`,
        '-isysroot',
        sdk.stdout.trim(),
        '-std=gnu99',
        `-target ${process.arch}-apple-macos11.0`,
      ],
      { encoding: 'utf8', timeout: 60_000 },
    )
    assert.equal(
      result.status,
      0,
      `generator exited ${result.status} ${result.signal ?? ''}\n${result.stderr}`,
    )

    const { symbols } = JSON.parse(readFileSync(join(dir, 'MiniKit.json'), 'utf8'))
    const byName = (name) => membersBySymbol(symbols, name)

    // Ancestor methods keep their declared kind and selectors — the
    // descendant's isThingOn/makeThingOn: accessors must not leak up.
    assert.deepEqual(byName('MiniRoot').scrollThing, {
      jsName: 'scrollThing',
      kind: 'method',
      selector: 'scrollThing:',
    })
    assert.deepEqual(byName('MiniRoot').plainCount, {
      jsName: 'plainCount',
      kind: 'method',
      selector: 'plainCount',
    })
    // The mid-chain redeclaration stays a method (the phantom used to
    // cascade through it into MiniRoot).
    assert.deepEqual(byName('MiniMid').scrollThing, {
      jsName: 'scrollThing',
      kind: 'method',
      selector: 'scrollThing:',
    })
    // The descendant's own declared property still emits as a property
    // with its custom accessors.
    assert.deepEqual(byName('MiniLeaf').scrollThing, {
      jsName: 'scrollThing',
      kind: 'property',
      selector: 'isThingOn',
      setterSelector: 'makeThingOn:',
    })
    assert.equal(byName('MiniLeaf').plainCount?.kind, 'property')
    // Unrelated subclasses of the same root are untouched.
    assert.equal(byName('MiniUnrelated').scrollThing, undefined)

    // The protocol-side reversal: the base protocol's method used to
    // borrow the implementer's (or refined protocol's) property record.
    assert.deepEqual(byName('MiniBaseProto').sharedThing, {
      jsName: 'sharedThing',
      kind: 'method',
      selector: 'sharedThing',
    })
    // The refined protocol's own declaration and the implementing
    // class's declaration remain properties.
    assert.equal(byName('MiniRefinedProto').sharedThing?.kind, 'property')
    assert.equal(byName('MiniImpl').sharedThing?.kind, 'property')
  },
)
