import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error('Set ' + name)
  return realpathSync(value)
}
const generator = required('XPLAT_PRERENDER_METADATA_GENERATOR')
const mason = required('XPLAT_PRERENDER_MASON_SDK')
const core = required('XPLAT_PRERENDER_CORE_ROOT')
const root = resolve(homedir(), 'agent-scratch/octane-xplat/native-prerender-control-metadata')
mkdirSync(root, { recursive: true })
// Each invocation must validate its own output, never YAML left by an earlier run.
const work = mkdtempSync(join(root, 'run-'))
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: work,
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.status !== 0)
    throw new Error(command + ': ' + (result.error?.message ?? result.stderr))
  return result.stdout.trim()
}
const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'])
const sdkVersion = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version'])
const resourcesRoot = join(dirname(generator), 'lib/clang')
const resourceVersions = readdirSync(resourcesRoot).filter((name) =>
  existsSync(join(resourcesRoot, name, 'include')),
)
if (resourceVersions.length !== 1) throw new Error('Expected one packaged Clang resource version')
const resources = join(resourcesRoot, resourceVersions[0])
const widgets = join(core, 'platforms/ios/TNSWidgets.xcframework/ios-arm64_x86_64-simulator')
const headers = [
  'UIKit/UIKitDefines.h',
  'Foundation/Foundation.h',
  'UIKit/UIKit.h',
  'QuartzCore/QuartzCore.h',
  'CoreText/CoreText.h',
  'WebKit/WebKit.h',
  'TNSWidgets/TNSWidgets.h',
  'UIView+NativeScript.h',
  'NativeScriptUtils.h',
  'NativeScriptEmbedder.h',
  'MasonCore/Mason.h',
  'MasonCore/MasonCore-Swift.h',
]
writeFileSync(
  join(work, 'input.h'),
  headers.map((header) => '#import <' + header + '>').join('\n') + '\n',
)
const args = [
  '-input-umbrella',
  join(work, 'input.h'),
  '-output-yaml',
  join(work, 'yaml'),
  '-output-bin',
  join(work, 'metadata.bin'),
  '-output-umbrella',
  join(work, 'umbrella.h'),
  'Xclang',
  '-isysroot',
  sdk,
  '-target',
  'arm64-apple-ios' + sdkVersion + '-simulator',
  '-std=gnu99',
  '-resource-dir',
  resources,
  '-F' + join(sdk, 'System/Library/SubFrameworks'),
  '-F' + mason,
  '-I' + join(mason, 'include'),
  '-I' + join(core, 'platforms/ios/src'),
  '-F' + widgets,
  '-Wno-deprecated-declarations',
]
const result = spawnSync(generator, args, {
  cwd: work,
  encoding: 'utf8',
  timeout: 180000,
  maxBuffer: 32 * 1024 * 1024,
})
writeFileSync(join(work, 'stdout.log'), result.stdout ?? '')
writeFileSync(join(work, 'stderr.log'), result.stderr ?? '')
writeFileSync(
  join(work, 'command.json'),
  JSON.stringify({ generator, args, status: result.status }, null, 2),
)
// This generator can return zero after fatal Clang diagnostics. Never accept that as a pass.
if (result.status !== 0 || /(?:fatal )?error:/i.test(result.stderr ?? ''))
  throw new Error('Metadata generation failed; inspect ' + join(work, 'stderr.log'))
const yaml = readdirSync(join(work, 'yaml'))
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => readFileSync(join(work, 'yaml', name), 'utf8'))
  .join('\n')
const classes = [
  'UIView',
  'UILabel',
  'UIApplication',
  'UIWindowScene',
  'TNSLabel',
  'NativeScriptEmbedder',
  'NSCMason',
  'MasonUIView',
  'MasonNode',
  'MasonStyle',
]
for (const name of classes) {
  const item = yaml.match(
    new RegExp('^  - Name: +' + name + '\\s*$([\\s\\S]*?)(?=^  - Name:|$(?![\\s\\S]))', 'm'),
  )
  if (!item || !/^    Type: +Interface\s*$/m.test(item[0]))
    throw new Error('Missing native interface metadata: ' + name)
}
const protocols = ['WKNavigationDelegate', 'WKUIDelegate', 'NativeScriptEmbedderDelegate']
for (const name of protocols) {
  const item = yaml.match(
    new RegExp('^  - Name: +' + name + '\\s*$([\\s\\S]*?)(?=^  - Name:|$(?![\\s\\S]))', 'm'),
  )
  if (!item || !/^    Type: +Protocol\s*$/m.test(item[0]))
    throw new Error('Missing native protocol metadata: ' + name)
}
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const requiredMethods = [
  'nativeScriptSetTextDecorationAndTransformTextDecorationLetterSpacingLineHeight',
  'nativeScriptSetFormattedTextDecorationAndTransformLetterSpacingLineHeight',
  'nativeScriptSetFormattedTextStrokeColor',
]
for (const name of requiredMethods) {
  if (!new RegExp('JsName: +' + name + '\\s*$', 'm').test(yaml))
    throw new Error('Missing NativeScript text helper metadata: ' + name)
}
const manifest = {
  sdkVersion,
  generatorHash: hash(generator),
  inputHash: hash(join(work, 'input.h')),
  masonHash: hash(join(mason, 'MasonCore.framework/MasonCore')),
  widgetsHash: hash(join(widgets, 'TNSWidgets.framework/TNSWidgets')),
  metadataHash: hash(join(work, 'metadata.bin')),
  requiredInterfaces: classes,
  requiredProtocols: protocols,
  requiredMethods,
  nativeHelperHeaderHashes: Object.fromEntries(
    ['UIView+NativeScript.h', 'NativeScriptUtils.h', 'NativeScriptEmbedder.h'].map((name) => [
      name,
      hash(join(core, 'platforms/ios/src', name)),
    ]),
  ),
  qualification:
    'Clean header generation and interface presence only; native bridge/runtime behavior remains separate.',
}
writeFileSync(join(work, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(JSON.stringify({ work, ...manifest }, null, 2))
