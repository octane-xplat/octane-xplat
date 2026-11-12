// Tray feasibility probe — packaged NativeScript Windows runtime.
// Icon + message-window live on an eval Worker thread (the WinUI pump on the
// main thread would otherwise eat our callback messages). Logs to console.log
// AND C:\Users\alecs\xplat-tray-main.log via Win32 WriteFile.
for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']) {
  globalThis[name] ??= globalThis['__ns__' + name]
}

const api = globalThis.NSWinRT
const win32 = api && api.win32
const interop = api && api.interop
const u32 = (v) => ({ type: 'u32', value: v })
const i32 = (v) => ({ type: 'i32', value: v })
const ptr = (v) => ({ type: 'pointer', value: v })
const call = (dll, fn, ret, ...args) => win32.call(dll, fn, ret, ...args)
const bufferAddress = (buf) => {
  const p = interop.pointerFromBuffer(buf)

  return typeof p === 'number' ? p : Number(interop.pointerKey(p))
}

const pinned = []
const utf16ptr = (s) => {
  const b = new Uint16Array(s.length + 1)

  for (let i = 0; i < s.length; i++) {
    b[i] = s.charCodeAt(i)
  }

  pinned.push(b)
  return bufferAddress(b)
}

// ---------- file + console log ----------
const LOGF = 'C:\\Users\\alecs\\xplat-tray-main.log'
let fh = 0

try {
  fh = Number(
    call(
      'kernel32.dll',
      'CreateFileW',
      'pointer',
      ptr(utf16ptr(LOGF)),
      u32(0x40000000),
      u32(1),
      ptr(0),
      u32(4),
      u32(0x80),
      ptr(0),
    ),
  )
} catch {}

const wrB = new ArrayBuffer(8)
const wrV = new DataView(wrB)
const wrA = bufferAddress(wrB)
const log = (m) => {
  console.log('TRAY ' + m)
  if (!fh) {
    return
  }

  try {
    const bytes = new TextEncoder().encode('TRAY ' + m + '\n')

    call('kernel32.dll', 'SetFilePointer', 'u32', ptr(fh), i32(0), ptr(0), u32(2))
    wrV.setUint32(0, 0, true)
    call(
      'kernel32.dll',
      'WriteFile',
      'bool',
      ptr(fh),
      ptr(bufferAddress(bytes)),
      u32(bytes.length),
      ptr(wrA),
      ptr(0),
    )
  } catch {}
}

const step = (name, fn) => {
  try {
    const value = fn()

    log('OK ' + name + (value === undefined ? '' : ' ' + String(value)))
    return value
  } catch (error) {
    log('ERR ' + name + ' ' + String(error && (error.message ?? error)).slice(0, 300))
    return undefined
  }
}

step('GetTickCount', () => call('kernel32.dll', 'GetTickCount', 'u32'))
step('winui-window', () => {
  const ui = globalThis.Microsoft?.UI?.Xaml
  const w = new ui.Window()

  w.Title = 'XplatTrayProbe'
  w.Content = new ui.Controls.Grid()
  w.Activate()
  return 'activated'
})

// ---------- worker source: owns tray window + icon + queue ----------
const workerSource = `
for (const name of ['setTimeout','clearTimeout','setInterval','clearInterval']) globalThis[name] ??= globalThis['__ns__'+name]
const api = globalThis.NSWinRT
const win32 = api && api.win32
const interop = api && api.interop
const u32 = (v) => ({type:'u32',value:v})
const i32 = (v) => ({type:'i32',value:v})
const ptr = (v) => ({type:'pointer',value:v})
const wstr = (v) => ({type:'wstr',value:v})
const call = (dll,fn,ret,...args) => win32.call(dll,fn,ret,...args)
const bufferAddress = (buf) => { const p = interop.pointerFromBuffer(buf); return typeof p === 'number' ? p : Number(interop.pointerKey(p)) }
const pinned = []
const utf16ptr = (s) => { const b = new Uint16Array(s.length+1); for (let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); pinned.push(b); return bufferAddress(b) }
const asciiptr = (s) => { const b = new Uint8Array(s.length+1); for (let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); pinned.push(b); return bufferAddress(b) }
const LOGF = 'C:\\\\Users\\\\alecs\\\\xplat-tray-worker.log'
let fh = 0
try { fh = Number(call('kernel32.dll','CreateFileW','pointer',ptr(utf16ptr(LOGF)),u32(0x40000000),u32(1),ptr(0),u32(4),u32(0x80),ptr(0))) } catch(e) {}
const wrB = new ArrayBuffer(8); const wrV = new DataView(wrB); const wrA = bufferAddress(wrB)
const log = (m) => { if (!fh) return; try { const b = new TextEncoder().encode('TRAYW ' + m + '\\n'); call('kernel32.dll','SetFilePointer','u32',ptr(fh),i32(0),ptr(0),u32(2)); wrV.setUint32(0,0,true); call('kernel32.dll','WriteFile','bool',ptr(fh),ptr(bufferAddress(b)),u32(b.length),ptr(wrA),ptr(0)) } catch(e){} }
const step = (name,fn) => { try { const v = fn(); log('OK ' + name + (v===undefined?'':' '+String(v))); return v } catch(e){ log('ERR ' + name + ' ' + String(e && (e.message ?? e)).slice(0,300)); return undefined } }
const hex = (v) => '0x' + Number(v).toString(16)
const clsBuf = new ArrayBuffer(96); const clsV = new DataView(clsBuf); const clsA = bufferAddress(clsBuf)
const nidBuf = new ArrayBuffer(1024); const nidV = new DataView(nidBuf); const nidA = bufferAddress(nidBuf)
const identBuf = new ArrayBuffer(64); const identV = new DataView(identBuf); const identA = bufferAddress(identBuf)
const rectBuf = new ArrayBuffer(16); const rectV = new DataView(rectBuf); const rectA = bufferAddress(rectBuf)
const msgBuf = new ArrayBuffer(48); const msgV = new DataView(msgBuf); const msgA = bufferAddress(msgBuf)
const UID = 0x5459, CBM = 0x8001
const state = {}
step('tid', () => call('kernel32.dll','GetCurrentThreadId','u32'))
step('defproc', () => {
  const hUser = call('kernel32.dll','GetModuleHandleW','pointer',wstr('user32.dll'))
  state.defProc = Number(call('kernel32.dll','GetProcAddress','pointer',ptr(hUser),ptr(asciiptr('DefWindowProcW'))))
  return hex(state.defProc)
})
step('regclass', () => {
  const hInst = call('kernel32.dll','GetModuleHandleW','pointer',ptr(0))
  clsV.setUint32(0,80,true)
  clsV.setBigUint64(8,BigInt(state.defProc),true)
  clsV.setBigUint64(24,BigInt(Number(hInst)),true)
  clsV.setBigUint64(64,BigInt(utf16ptr('XplatTrayMsgWin')),true)
  return call('user32.dll','RegisterClassExW','u16',ptr(clsA))
})
step('msgwin', () => {
  state.hwnd = Number(call('user32.dll','CreateWindowExW','pointer',
    u32(0),ptr(utf16ptr('XplatTrayMsgWin')),ptr(utf16ptr('')),u32(0),
    i32(0),i32(0),i32(0),i32(0),{type:'i64',value:-3},ptr(0),
    ptr(call('kernel32.dll','GetModuleHandleW','pointer',ptr(0))),ptr(0)))
  return hex(state.hwnd)
})
step('loadicon', () => { state.hIcon = Number(call('user32.dll','LoadIconW','pointer',ptr(0),ptr(32512))); return hex(state.hIcon) })
const writeNid = (tip, flags) => {
  nidV.setUint32(0,976,true)
  nidV.setBigUint64(8,BigInt(state.hwnd),true)
  nidV.setUint32(16,UID,true)
  nidV.setUint32(20,flags,true)
  nidV.setUint32(24,CBM,true)
  nidV.setBigUint64(32,BigInt(state.hIcon),true)
  for (let i=0;i<tip.length && i<127;i++) nidV.setUint16(40+i*2,tip.charCodeAt(i),true)
}
step('NIM_ADD', () => { writeNid('xplat tray probe', 0x1|0x2|0x4); return call('shell32.dll','Shell_NotifyIconW','bool',u32(0),ptr(nidA)) })
step('NIM_SETVERSION', () => call('shell32.dll','Shell_NotifyIconW','bool',u32(4),ptr(nidA)))
const getRect = (label) => step(label, () => {
  identV.setUint32(0,40,true)
  identV.setBigUint64(8,BigInt(state.hwnd),true)
  identV.setUint32(16,UID,true)
  // guidItem @24 stays zero
  const hr = call('shell32.dll','Shell_NotifyIconGetRect','i32',ptr(identA),ptr(rectA))
  const r = [rectV.getInt32(0,true),rectV.getInt32(4,true),rectV.getInt32(8,true),rectV.getInt32(12,true)]
  return 'hr=0x' + (hr>>>0).toString(16) + ' rect=' + r.join(',')
})
getRect('GetRect')
step('NIM_MODIFY', () => { writeNid('xplat tray probe v2', 0x4); return call('shell32.dll','Shell_NotifyIconW','bool',u32(1),ptr(nidA)) })
log('READY hwnd=' + hex(state.hwnd) + ' uid=' + UID)
let pollErrs = 0
// block on own queue for the callback message (timers don't pump in eval workers)
step('PostMessage-self', () => call('user32.dll','PostMessageW','bool',ptr(state.hwnd),u32(CBM),ptr(UID),ptr(0x0202)))
step('GetMessageW', () => {
  const got = call('user32.dll','GetMessageW','bool',ptr(msgA),ptr(state.hwnd),u32(CBM),u32(CBM))
  const w = Number(msgV.getBigUint64(16,true)); const l = Number(msgV.getBigUint64(24,true))
  return 'got=' + got + ' wParam=' + w + ' lParam=0x' + l.toString(16)
})
step('NIM_DELETE', () => call('shell32.dll','Shell_NotifyIconW','bool',u32(2),ptr(nidA)))
getRect('GetRect-after-delete')
log('DONE')
`

step('worker', () => {
  const w = new Worker(workerSource, { eval: true })

  return typeof w
})

setTimeout(() => {
  log('DONE')
}, 45_000)
