// Static HTTP-only libcurl + zlib; Schannel uses the Windows TLS/CA engine.
// Invoke from a reserved native build after prepareDependencies verified Git pins.
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const hash = value => createHash('sha256').update(value).digest('hex')
const pins = JSON.parse(readFileSync(new URL('./nim-dependencies.json', import.meta.url)))
export function prepareWindowsHttp(cache, environment = process.env) {
 if (process.platform !== 'win32') {return { flags: [], record: undefined }}
 assert.equal(process.arch, 'x64', 'Windows native HTTP is currently qualified only for x64')
 assert.ok(environment.INCLUDE && environment.LIB, 'Prepare the existing MSVC environment and forward INCLUDE/LIB through Turbo')
 function run(command, args, capture = false) {
  // The reservation owner supervises cancellation; killing cmake alone on a
  // timer can leave its Ninja/MSVC descendants compiling after the lease ends.
  const result = spawnSync(command, args, { env: environment, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' })
  assert.equal(result.status, 0, `${command} failed (${result.status ?? result.signal}): ${result.error?.message ?? result.stderr ?? ''}`)
  return result.stdout?.trim()
 }
 const compiler = run('where.exe', ['cl.exe'], true).split(/\r?\n/)[0]
 const visualStudio = resolve(dirname(compiler), '../../../../../../..')
 const tools = join(visualStudio, 'Common7/IDE/CommonExtensions/Microsoft/CMake')
 function tool(name, fallback) {
  const found = spawnSync('where.exe', [name], { env: environment, encoding: 'utf8' })
  const candidate = found.status === 0 ? found.stdout.trim().split(/\r?\n/)[0] : fallback
  assert.ok(existsSync(candidate), `Install the Visual Studio CMake tools or put ${name} on the build PATH`)
  return candidate
 }
 const cmake = tool('cmake.exe', join(tools, 'CMake/bin/cmake.exe'))
 const ninja = tool('ninja.exe', join(tools, 'Ninja/ninja.exe'))
 const options = { configuration: 'MinSizeRel', generator: 'Ninja', staticCrt: true, tls: 'Schannel',
  protocols: ['HTTP', 'HTTPS'], gzipDeflate: true, parallel: 4 }
 const identity = { version: 1, platform: process.platform, arch: process.arch, options,
  sources: { curl: pins.curlWindows, zlib: pins.zlibWindows },
  compiler: { path: compiler, sha256: hash(readFileSync(compiler)) },
  cmake: run(cmake, ['--version'], true).split('\n')[0], ninja: run(ninja, ['--version'], true),
  includeHash: hash(environment.INCLUDE), libHash: hash(environment.LIB),
  builderHash: hash(readFileSync(new URL(import.meta.url))) }
 const key = hash(JSON.stringify(identity))
 const output = join(cache, 'windows-http', key)
 const recordPath = join(output, 'build.json')
 let record
 if (existsSync(recordPath)) {
  record = JSON.parse(readFileSync(recordPath))
  assert.equal(record.key, key)
  for (const item of record.libraries) {assert.equal(hash(readFileSync(item.path)), item.sha256, 'Cached static HTTP library changed')}
 } else {
  mkdirSync(output, { recursive: true })
  const zlibSource = join(cache, 'dependencies', `zlibWindows-${pins.zlibWindows.revision}`)
  const curlSource = join(cache, 'dependencies', `curlWindows-${pins.curlWindows.revision}`)
  const zlibPrefix = join(output, 'zlib-prefix'), curlPrefix = join(output, 'curl-prefix')
  const common = ['-G', 'Ninja', `-DCMAKE_MAKE_PROGRAM=${ninja}`, `-DCMAKE_C_COMPILER=${compiler}`,
   '-DCMAKE_BUILD_TYPE=MinSizeRel', '-DCMAKE_MSVC_RUNTIME_LIBRARY=MultiThreaded']
  function build(source, name, prefix, flags) {
   const directory = join(output, name)
   // Imported-library paths also feed pkg-config metadata. CMake's curl
   // generator recognizes forward slashes as paths, rather than '-lC:\...'.
   const canonical = args => args.map(value => value.replaceAll('\\', '/'))
   run(cmake, canonical(['-S', source, '-B', directory, ...common, `-DCMAKE_INSTALL_PREFIX=${prefix}`, ...flags]))
   run(cmake, canonical(['--build', directory, '--parallel', '4']))
   run(cmake, canonical(['--install', directory]))
  }
  build(zlibSource, 'zlib', zlibPrefix, ['-DZLIB_BUILD_SHARED=OFF', '-DZLIB_BUILD_STATIC=ON', '-DZLIB_BUILD_TESTING=OFF'])
  function library(prefix) {
   const files = readdirSync(join(prefix, 'lib')).filter(name => name.endsWith('.lib'))
   assert.equal(files.length, 1, `Expected exactly one static library under ${prefix}`)
   return join(prefix, 'lib', files[0])
  }
  const zlib = library(zlibPrefix)
  const disabled = ['DICT','FILE','FTP','GOPHER','IMAP','LDAP','LDAPS','MQTT','POP3','RTSP','SMTP','TELNET','TFTP','WEBSOCKETS',
   'DOH','ALTSVC','HSTS','NETRC','MIME','IPFS']
  build(curlSource, 'curl', curlPrefix, ['-DBUILD_SHARED_LIBS=OFF', '-DBUILD_STATIC_LIBS=ON', '-DBUILD_CURL_EXE=OFF',
   '-DBUILD_TESTING=OFF', '-DBUILD_EXAMPLES=OFF', '-DBUILD_LIBCURL_DOCS=OFF', '-DBUILD_MISC_DOCS=OFF', '-DENABLE_CURL_MANUAL=OFF',
   '-DCURL_STATIC_CRT=ON', '-DCURL_USE_SCHANNEL=ON', '-DCURL_USE_OPENSSL=OFF', '-DENABLE_UNICODE=ON',
   '-DCURL_ZLIB=ON', `-DZLIB_LIBRARY=${zlib}`, `-DZLIB_INCLUDE_DIR=${join(zlibPrefix, 'include')}`, '-DZLIB_USE_STATIC_LIBS=ON',
   '-DCURL_BROTLI=OFF', '-DCURL_ZSTD=OFF', '-DUSE_NGHTTP2=OFF', '-DUSE_LIBIDN2=OFF', '-DCURL_USE_LIBPSL=OFF',
   '-DCURL_USE_LIBSSH2=OFF', '-DCURL_USE_PKGCONFIG=OFF', '-DENABLE_THREADED_RESOLVER=ON', '-DENABLE_UNIX_SOCKETS=OFF',
   ...disabled.map(name => `-DCURL_DISABLE_${name}=ON`)])
  const curl = library(curlPrefix)
  const metadata = readFileSync(join(curlPrefix, 'lib/pkgconfig/libcurl.pc'), 'utf8')
  const protocols = metadata.match(/^supported_protocols="([^"]+)"$/m)?.[1].trim().split(/\s+/).sort()
  assert.deepEqual(protocols, ['HTTP','HTTPS'], 'The static transport must contain only HTTP/HTTPS')
  const linkFields = [...metadata.matchAll(/^Libs(?:\.private)?:\s*(.*)$/gm)].flatMap(match => match[1].trim().split(/\s+/))
  const system = new Set()
  for (const field of linkFields) {
   const libraryPath = field.startsWith('-l') ? field.slice(2) : field
   if (field.startsWith('-L') || libraryPath.replaceAll('\\','/').toLowerCase() === zlib.replaceAll('\\','/').toLowerCase()) {continue}
   assert.match(field, /^-l[a-zA-Z0-9_.-]+$/, `Unexpected static link input: ${field}`)
   const name = field.slice(2)
   if (['curl','libcurl',basename(zlib, '.lib')].includes(name)) {continue}
   system.add(name+'.lib')
  }
  record = { key, identity, protocols, metadata, systemLibraries: [...system].sort(),
   libraries: [curl,zlib].map(path => ({ path, bytes: readFileSync(path).length, sha256: hash(readFileSync(path)) })) }
  writeFileSync(recordPath, JSON.stringify(record, null, 2)+'\n')
 }
 const libraries = [...record.libraries.map(item => item.path), ...record.systemLibraries]
 const link = libraries.map(path => '"'+path.replaceAll('\\','/')+'"').join(' ')
 return { record, flags: ['--cc:vcc', '--vcc.exe:cl.exe', '--vcc.cpp.exe:cl.exe', '--vcc.linkerexe:cl.exe', '--vcc.cpp.linkerexe:cl.exe',
  `-d:xplatNimWindowsCurlLink:${link}`] }
}
