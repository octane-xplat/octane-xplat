import { TrayError } from './errors.js'
import {
  dispatchTraySelect,
  normalizeTrayOptions,
  normalizeTrayUpdate,
  resolvePlatformIcon,
  safeCall,
  type NormalizedTrayOptions,
} from './menu.js'

import type {
  AppResidency,
  Tray,
  TrayAvailability,
  TrayIcon,
  TrayMenuItem,
  TrayOptions,
  TrayRadioOption,
  TrayUpdate,
} from './types.js'

export type * from './types.js'
export { TrayError } from './errors.js'

// ---------------------------------------------------------------------------
// Win32 surface (packaged NativeScript Windows runtime).
// Verified on the packaged host: win32.call + interop.pointerFromBuffer,
// eval Workers with two-way postMessage, message-only windows, and
// Shell_NotifyIconW / Shell_NotifyIconGetRect end to end.
// ---------------------------------------------------------------------------

interface Win32Arg {
  type: string
  value: number | string
}

interface Win32Surface {
  call(dll: string, fn: string, ret: string, ...args: Win32Arg[]): unknown
}

interface NsInterop {
  pointerFromBuffer(buf: ArrayBuffer | ArrayBufferView): unknown
  pointerKey(value: unknown): string | number
}

interface NsWinRtLike {
  win32?: Win32Surface
  interop?: NsInterop
}

interface WorkerLike {
  postMessage(data: unknown): void
  onmessage: ((event: { data: unknown }) => void) | null
  terminate(): void
}

type WorkerCtor = new (source: string, options: { eval: boolean }) => WorkerLike

const projection = () => globalThis as { NSWinRT?: NsWinRtLike; Worker?: WorkerCtor }

const u32 = (value: number): Win32Arg => ({ type: 'u32', value })
const i32 = (value: number): Win32Arg => ({ type: 'i32', value })
const ptr = (value: number | bigint): Win32Arg => ({
  type: 'pointer',
  value: typeof value === 'bigint' ? Number(value) : value,
})

const call = (dll: string, fn: string, ret: string, ...args: Win32Arg[]) =>
  projection().NSWinRT!.win32!.call(dll, fn, ret, ...args)

const pinned: object[] = []
const bufferAddress = (buf: ArrayBuffer | ArrayBufferView): number => {
  const interop = projection().NSWinRT!.interop!
  const p = interop.pointerFromBuffer(buf)
  return typeof p === 'number' ? p : Number(interop.pointerKey(p))
}

const utf16ptr = (text: string): number => {
  const buf = new Uint16Array(text.length + 1)
  for (let i = 0; i < text.length; i++) {
    buf[i] = text.charCodeAt(i)
  }
  pinned.push(buf)
  return bufferAddress(buf)
}

// ---------------------------------------------------------------------------
// Menu serialization: the worker only needs a render model + stable command ids.
// ---------------------------------------------------------------------------

interface RenderRow {
  cmd: number
  kind: 'action' | 'checkbox' | 'radio' | 'submenu' | 'header' | 'separator'
  label: string
  disabled: boolean
  checked: boolean
  children?: RenderRow[]
}

interface MenuRegistry {
  rows: RenderRow[]
  byId: Map<number, { item: TrayMenuItem; option?: TrayRadioOption }>
}

function buildMenuModel(menu: readonly TrayMenuItem[] | undefined): MenuRegistry {
  const registry: MenuRegistry = { rows: [], byId: new Map() }
  let nextCmd = 1
  const push = (row: RenderRow, item: TrayMenuItem, option?: TrayRadioOption) => {
    registry.byId.set(row.cmd, { item, option })
    return row
  }
  const build = (items: readonly TrayMenuItem[]): RenderRow[] => {
    const rows: RenderRow[] = []
    for (const item of items) {
      switch (item.type) {
        case 'separator':
          rows.push({ cmd: 0, kind: 'separator', label: '', disabled: false, checked: false })
          break
        case 'action':
          rows.push(
            push(
              {
                cmd: nextCmd++,
                kind: 'action',
                label: item.label,
                disabled: !!item.isDisabled,
                checked: false,
              },
              item,
            ),
          )

          break
        case 'checkbox':
          rows.push(
            push(
              {
                cmd: nextCmd++,
                kind: 'checkbox',
                label: item.label,
                disabled: !!item.isDisabled,
                checked: item.value,
              },
              item,
            ),
          )

          break
        case 'radio-group': {
          if (item.label) {
            rows.push({ cmd: 0, kind: 'header', label: item.label, disabled: true, checked: false })
            rows.push({ cmd: 0, kind: 'separator', label: '', disabled: false, checked: false })
          }

          for (const option of item.items) {
            const value = option.value ?? option.key
            rows.push(
              push(
                {
                  cmd: nextCmd++,
                  kind: 'radio',
                  label: option.label,
                  disabled: !!item.isDisabled || !!option.isDisabled,
                  checked: value === item.value,
                },
                item,
                option,
              ),
            )
          }

          break
        }
        case 'submenu':
          rows.push({
            cmd: 0,
            kind: 'submenu',
            label: item.label,
            disabled: !!item.isDisabled,
            checked: false,
            children: build(item.items),
          })

          break
        case 'section': {
          rows.push({ cmd: 0, kind: 'header', label: item.label, disabled: true, checked: false })
          rows.push(...build(item.items))
          break
        }
      }
    }
    return rows
  }
  registry.rows = build(menu ?? [])
  return registry
}

// ---------------------------------------------------------------------------
// Icon resolution → serializable spec consumed by the worker.
// ---------------------------------------------------------------------------

const STOCK_ICONS: Record<string, number> = {
  application: 32512,
  error: 32513,
  question: 32514,
  warning: 32515,
  info: 32516,
  winlogo: 32517,
  shield: 32518,
}

type IconSpec = { kind: 'file'; path: string } | { kind: 'stock'; id: number }

function iconSpec(icon: TrayIcon): IconSpec {
  if (icon.type === 'named') {
    const numeric = Number(icon.name)
    const id =
      STOCK_ICONS[icon.name] ??
      (Number.isInteger(numeric) && numeric >= 0 && numeric <= 65535 ? numeric : undefined)

    if (id === undefined) {
      throw new TrayError(
        'invalid-icon',
        `unknown Windows stock icon name ${JSON.stringify(icon.name)}; use ${Object.keys(STOCK_ICONS).join(', ')}, a numeric icon id, or a file icon`,
      )
    }

    return { kind: 'stock', id }
  }
  if (!/\.(ico|cur|ani)$/i.test(icon.path)) {
    throw new TrayError(
      'invalid-icon',
      `Windows tray icons must be .ico/.cur/.ani files (got ${icon.path}); convert the image to .ico`,
    )
  }
  return { kind: 'file', path: icon.path }
}

// ---------------------------------------------------------------------------
// Worker source: owns the message-only window, icon, and message loop. The
// loop pumps Win32 messages for the tray window plus JS postMessage commands
// via __nsWorkerPollMessages (timers do not run in eval workers).
// ---------------------------------------------------------------------------

const WORKER_SOURCE = String.raw`
for (const name of ['setTimeout','clearTimeout','setInterval','clearInterval']) globalThis[name] ??= globalThis['__ns__'+name]
const w32 = globalThis.NSWinRT.win32
const interop = globalThis.NSWinRT.interop
const u32=(v)=>({type:'u32',value:v}), i32=(v)=>({type:'i32',value:v}), ptr=(v)=>({type:'pointer',value:v})
const call=(d,f,r,...a)=>w32.call(d,f,r,...a)
const bufferAddress=(b)=>{const p=interop.pointerFromBuffer(b);return typeof p==='number'?p:Number(interop.pointerKey(p))}
const pinned=[]
const utf16ptr=(s)=>{const b=new Uint16Array(s.length+1);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);pinned.push(b);return bufferAddress(b)}
const asciiptr=(s)=>{const b=new Uint8Array(s.length+1);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);pinned.push(b);return bufferAddress(b)}

// --- IPC: append-only JSONL files + thread-message wakeup --------------------
// File IO is proven on this runtime; JS postMessage is not (a blocked worker
// never flushes). CMD_PATH receives one JSON command per line, EVT_PATH emits
// one JSON event per line. The main side wakes us with PostThreadMessageW.
const CMD_PATH=__TRAY_CMD__,EVT_PATH=__TRAY_EVT__
const CMD_MSG=0x8002
const badHandle=(h)=>(!h||h>0x80000000||h===-1)
const append=(path,text)=>{
 const h=Number(call('kernel32.dll','CreateFileW','pointer',ptr(utf16ptr(path)),u32(0x40000000),u32(1),ptr(0),u32(4),u32(0),ptr(0)))
 if(badHandle(h))return
 call('kernel32.dll','SetFilePointer','u32',ptr(h),i32(0),ptr(0),u32(2))
 const bytes=new TextEncoder().encode(text)
 call('kernel32.dll','WriteFile','bool',ptr(h),ptr(bufferAddress(bytes)),u32(bytes.length),ptr(bufferAddress(new ArrayBuffer(8))),ptr(0))
 call('kernel32.dll','CloseHandle','bool',ptr(h))
}
const readAll=(path)=>{
 const h=Number(call('kernel32.dll','CreateFileW','pointer',ptr(utf16ptr(path)),u32(0x80000000),u32(3),ptr(0),u32(3),u32(0),ptr(0)))
 if(badHandle(h))return ''
 const size=Number(call('kernel32.dll','GetFileSize','u32',ptr(h),ptr(0)))
 if(!size){call('kernel32.dll','CloseHandle','bool',ptr(h));return ''}
 const buf=new ArrayBuffer(size+1)
 call('kernel32.dll','ReadFile','bool',ptr(h),ptr(bufferAddress(buf)),u32(size),ptr(bufferAddress(new ArrayBuffer(8))),ptr(0))
 call('kernel32.dll','CloseHandle','bool',ptr(h))
 return new TextDecoder().decode(buf.slice(0,size))
}
const post=(m)=>append(EVT_PATH,JSON.stringify(m)+'\n')
const postErr=(e)=>{try{post({t:'error',e:String(e&&e.message||e)})}catch(_){}}
let cmdOffset=0
const drainCommands=()=>{
 const text=readAll(CMD_PATH)
 if(text.length<=cmdOffset)return
 const chunk=text.slice(cmdOffset)
 cmdOffset=text.length
 for(const line of chunk.split('\n')){if(!line.trim())continue
  try{handleCommand(JSON.parse(line))}catch(e){postErr(e)}
 }
}

const clsBuf=new ArrayBuffer(96);const clsV=new DataView(clsBuf)
const nidBuf=new ArrayBuffer(1024);const nidV=new DataView(nidBuf)
const msgBuf=new ArrayBuffer(48);const msgV=new DataView(msgBuf)
const miiBuf=new ArrayBuffer(80);const miiV=new DataView(miiBuf)
const ptBuf=new ArrayBuffer(8);const ptV=new DataView(ptBuf)
const CBM=0x8001
const state={hwnd:0,hIcon:0,iconOwned:false,uid:0,ready:false,stopping:false,menuOnPrimary:false,menu:[]}
const nidA=bufferAddress(nidBuf),msgA=bufferAddress(msgBuf),clsA=bufferAddress(clsBuf),miiA=bufferAddress(miiBuf),ptA=bufferAddress(ptBuf)

const writeNid=(flags)=>{
 nidV.setUint32(0,976,true)
 nidV.setBigUint64(8,BigInt(state.hwnd),true)
 nidV.setUint32(16,state.uid,true)
 nidV.setUint32(20,flags,true)
 nidV.setUint32(24,CBM,true)
 nidV.setBigUint64(32,BigInt(state.hIcon),true)
}
const writeTip=(tip)=>{
 tip=tip||''
 for(let i=0;i<128;i++)nidV.setUint16(40+i*2,i<tip.length?tip.charCodeAt(i):0,true)
}

const loadIcon=(spec)=>{
 if(spec.kind==='file'){
  return Number(call('user32.dll','LoadImageW','pointer',ptr(0),ptr(utf16ptr(spec.path)),u32(1),i32(0),i32(0),u32(0x0010|0x0040)))
 }
 return Number(call('user32.dll','LoadIconW','pointer',ptr(0),ptr(spec.id)))
}

// MENUITEMINFOW: cbSize@0 fMask@4 fType@8 fState@12 wID@16 hSubMenu@24
// hbmpChecked@32 hbmpUnchecked@40 dwItemData@48 dwTypeData@56 cch@64 hbmpItem@72
const insItem=(menu,pos,o)=>{
 for(let i=0;i<80;i+=4)miiV.setUint32(i,0,true)
 miiV.setUint32(0,80,true)
 miiV.setUint32(4,o.mask,true)
 miiV.setUint32(8,o.ftype||0,true)
 miiV.setUint32(12,o.fstate||0,true)
 miiV.setUint32(16,o.wid||0,true)
 miiV.setBigUint64(24,BigInt(o.submenu||0),true)
 miiV.setBigUint64(56,BigInt(o.typeData||0),true)
 miiV.setUint32(64,o.cch||0,true)
 return call('user32.dll','InsertMenuItemW','bool',ptr(menu),u32(pos),u32(1),ptr(miiA))
}
// MIIM_STATE=0x1 MIIM_ID=0x2 MIIM_SUBMENU=0x4 MIIM_STRING=0x40 MIIM_FTYPE=0x100
// MFT_STRING=0 MFT_SEPARATOR=0x800 MFT_RADIOCHECK=0x200
// MFS_GRAYED=0x3 MFS_CHECKED=0x8
const buildMenu=(rows)=>{
 const h=Number(call('user32.dll','CreatePopupMenu','pointer'))
 rows.forEach((row,pos)=>{
  if(row.kind==='separator'){insItem(h,pos,{mask:0x100,ftype:0x800});return}
  const td=utf16ptr(row.label)
  if(row.kind==='submenu'){
   const sub=buildMenu(row.children||[])
   insItem(h,pos,{mask:0x4|0x40|0x1,fstate:row.disabled?3:0,submenu:sub,typeData:td,cch:row.label.length})
   return
  }
  if(row.kind==='header'){
   insItem(h,pos,{mask:0x1|0x40,fstate:3,typeData:td,cch:row.label.length})
   return
  }
  insItem(h,pos,{
   mask:0x2|0x1|0x40|(row.kind==='radio'?0x100:0),
   ftype:row.kind==='radio'?0x200:0,
   fstate:(row.disabled?3:0)|(row.checked?8:0),
   wid:row.cmd,
   typeData:td,
   cch:row.label.length,
  })
 })
 return h
}

const showMenu=()=>{
 if(!state.menu.length)return
 call('user32.dll','GetCursorPos','bool',ptr(ptA))
 const hMenu=buildMenu(state.menu)
 call('user32.dll','SetForegroundWindow','bool',ptr(state.hwnd))
 const sel=Number(call('user32.dll','TrackPopupMenu','i32',ptr(hMenu),u32(0x100|0x02),i32(ptV.getInt32(0,true)),i32(ptV.getInt32(4,true)),i32(0),ptr(state.hwnd),ptr(0)))
 call('user32.dll','DestroyMenu','bool',ptr(hMenu))
 if(sel>0)post({t:'menu',i:sel})
}

const handleMsg=()=>{
 const msg=msgV.getUint32(8,true)
 const l=Number(msgV.getBigUint64(24,true))
 if(msg===CMD_MSG){drainCommands();return}
 if(msg!==CBM)return
 const ev=l&0xffff
 if(ev===0x0202||ev===0x0400){
  // Left up / NIN_SELECT
  if(state.menuOnPrimary)showMenu()
  else post({t:'activate'})
 } else if(ev===0x0205||ev===0x0208||ev===0x007b){
  // Right up, right dbl-click, or NIN_POPUPOPEN (WM_CONTEXTMENU)
  if(state.menu.length)showMenu()
  else post({t:'activate'})
 }
}

const doInit=(m)=>{
 state.uid=m.uid
 const hUser=call('kernel32.dll','GetModuleHandleW','pointer',{type:'wstr',value:'user32.dll'})
 const defProc=Number(call('kernel32.dll','GetProcAddress','pointer',ptr(hUser),ptr(asciiptr('DefWindowProcW'))))
 const hInst=Number(call('kernel32.dll','GetModuleHandleW','pointer',ptr(0)))
 clsV.setUint32(0,80,true)
 clsV.setBigUint64(8,BigInt(defProc),true)
 clsV.setBigUint64(24,BigInt(hInst),true)
 clsV.setBigUint64(64,BigInt(utf16ptr(m.className)),true)
 if(!call('user32.dll','RegisterClassExW','u16',ptr(clsA))){post({t:'error',e:'RegisterClassExW failed'});return}
 state.hwnd=Number(call('user32.dll','CreateWindowExW','pointer',
  u32(0),ptr(utf16ptr(m.className)),ptr(utf16ptr('')),u32(0),
  i32(0),i32(0),i32(0),i32(0),{type:'i64',value:-3},ptr(0),ptr(hInst),ptr(0)))
 if(!state.hwnd){post({t:'error',e:'CreateWindowExW failed'});return}
 state.hIcon=loadIcon(m.icon)
 if(!state.hIcon){post({t:'error',e:'icon load failed'});return}
 state.iconOwned=m.icon.kind==='file'
 state.menu=m.menu||[]
 state.menuOnPrimary=!!m.menuOnPrimary
 writeNid(0x1|0x2|0x4)
 writeTip(m.tooltip)
 nidV.setUint32(816,4,true)
 if(!call('shell32.dll','Shell_NotifyIconW','bool',u32(0),ptr(nidA))){post({t:'error',e:'Shell_NotifyIconW(NIM_ADD) failed'});return}
 call('shell32.dll','Shell_NotifyIconW','bool',u32(4),ptr(nidA))
 state.ready=true
 post({t:'ready'})
}

const doUpdate=(m)=>{
 if(m.icon!==undefined){
  const h=loadIcon(m.icon)
  if(!h){post({t:'error',e:'icon load failed'});return}
  if(state.iconOwned&&state.hIcon)call('user32.dll','DestroyIcon','bool',ptr(state.hIcon))
  state.hIcon=h;state.iconOwned=m.icon.kind==='file'
  writeNid(0x2);call('shell32.dll','Shell_NotifyIconW','bool',u32(1),ptr(nidA))
 }
 if(m.tooltip!==undefined){writeNid(0x4);writeTip(m.tooltip);call('shell32.dll','Shell_NotifyIconW','bool',u32(1),ptr(nidA))}
 if(m.menu!==undefined)state.menu=m.menu||[]
 if(m.menuOnPrimary!==undefined)state.menuOnPrimary=!!m.menuOnPrimary
}

const getRect=(tag)=>{
 const ident=new ArrayBuffer(40);const identV=new DataView(ident)
 identV.setUint32(0,40,true);identV.setBigUint64(8,BigInt(state.hwnd),true);identV.setUint32(16,state.uid,true)
 const rect=new ArrayBuffer(16);const rectV=new DataView(rect)
 const hr=Number(call('shell32.dll','Shell_NotifyIconGetRect','i32',ptr(bufferAddress(ident)),ptr(bufferAddress(rect))))
 post({t:'rect',tag,hr:hr<0?('0x'+(hr>>>0).toString(16)):hr,box:[rectV.getInt32(0,true),rectV.getInt32(4,true),rectV.getInt32(8,true),rectV.getInt32(12,true)]})
}

const doDestroy=()=>{
 writeNid(0)
 call('shell32.dll','Shell_NotifyIconW','bool',u32(2),ptr(nidA))
 call('user32.dll','DestroyWindow','bool',ptr(state.hwnd))
 if(state.iconOwned&&state.hIcon)call('user32.dll','DestroyIcon','bool',ptr(state.hIcon))
 state.stopping=true
 post({t:'destroyed'})
}

const handleCommand=(m)=>{
 if(m.t==='init')doInit(m)
 else if(m.t==='update')doUpdate(m)
 else if(m.t==='selftest'){
  // Test-only hook: report the real notification-area rect and inject
  // synthetic clicks/keys through the real message queue.
  getRect(m.tag||'rect')
  const tid=Number(call('kernel32.dll','GetCurrentThreadId','u32'))
  if(m.click){call('user32.dll','PostMessageW','bool',ptr(state.hwnd),u32(CBM),ptr(state.uid),ptr(0x0202))}
  if(m.menuKey!==undefined){
   call('user32.dll','PostMessageW','bool',ptr(state.hwnd),u32(CBM),ptr(state.uid),ptr(0x0205))
   call('user32.dll','PostThreadMessageW','bool',u32(tid),u32(0x100),ptr(m.menuKey),ptr(0))
   call('user32.dll','PostThreadMessageW','bool',u32(tid),u32(0x102),ptr(m.menuKey),ptr(0))
   call('user32.dll','PostThreadMessageW','bool',u32(tid),u32(0x101),ptr(m.menuKey),ptr(0xC0000001))
  }
 } else if(m.t==='destroy'){doDestroy()}
}

const selfTid=Number(call('kernel32.dll','GetCurrentThreadId','u32'))
const loop=()=>{
 while(!state.stopping){
  call('user32.dll','MsgWaitForMultipleObjectsEx','u32',u32(0),ptr(0),u32(100),u32(0x04ff),u32(0))
  let guard=0
  while(call('user32.dll','PeekMessageW','bool',ptr(msgA),ptr(0),u32(0),u32(0),u32(1))&&guard++<200){
   handleMsg()
  }
  // TrackPopupMenu's modal pump eats thread-queue messages, so CMD_MSG
  // wakeups can be swallowed — the file itself is the real channel.
  drainCommands()
 }
}
try{post({t:'hello',tid:selfTid})}catch(e){}
try{loop()}catch(e){postErr(e)}
`

// ---------------------------------------------------------------------------
// App window enumeration: top-level windows owned by this process, found
// without callbacks via GetTopWindow/GetWindow(GW_HWNDNEXT).
// ---------------------------------------------------------------------------

const pidBuf = new ArrayBuffer(8)
const pidView = new DataView(pidBuf)

function appWindows(): number[] {
  const pid = Number(call('kernel32.dll', 'GetCurrentProcessId', 'u32'))
  const pidA = bufferAddress(pidBuf)
  const hwnds: number[] = []
  let hwnd = Number(call('user32.dll', 'GetTopWindow', 'pointer', ptr(0)))
  let guard = 0
  while (hwnd && guard++ < 512) {
    call('user32.dll', 'GetWindowThreadProcessId', 'u32', ptr(hwnd), ptr(pidA))
    if (pidView.getUint32(0, true) === pid) {
      hwnds.push(hwnd)
    }

    hwnd = Number(call('user32.dll', 'GetWindow', 'pointer', ptr(hwnd), u32(2)))
  }
  return hwnds
}

const anyAppWindowVisible = () =>
  appWindows().some((hwnd) => call('user32.dll', 'IsWindowVisible', 'bool', ptr(hwnd)))

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/** Report whether this host can create a tray item. */
export function getTrayAvailability(): Promise<TrayAvailability> {
  const { NSWinRT: nsrt, Worker: WorkerGlobal } = projection()
  if (!nsrt?.win32?.call || !nsrt.interop?.pointerFromBuffer || !WorkerGlobal) {
    return Promise.resolve({
      available: false,
      reason: 'unsupported-runtime',
      message:
        'the Windows host does not expose the Win32 FFI, buffer pointers, or workers needed for a notification-area icon',
    })
  }
  return Promise.resolve({ available: true, platform: 'windows' })
}

interface WorkerEvent {
  t: 'hello' | 'ready' | 'destroyed' | 'activate' | 'menu' | 'error' | 'rect'
  tid?: number
  i?: number
  e?: string
  tag?: string
  hr?: number | string
  box?: number[]
}

const CMD_MSG = 0x8002

// Append-only JSONL command/event files. The worker never flushes JS
// postMessage while its pump is blocked, so both directions go through files
// plus a PostThreadMessageW nudge — all verified primitives on this host.
const invalidHandle = (h: number) => !h || h > 0x80000000 || h === -1

const ipcAppend = (path: string, text: string): void => {
  // GENERIC_WRITE + FILE_SHARE_READ so the worker can keep reading while we
  // append; retry briefly because the peer's open can briefly deny the share.
  let h = 0
  for (let attempt = 0; attempt < 50; attempt++) {
    h = Number(
      call(
        'kernel32.dll',
        'CreateFileW',
        'pointer',
        ptr(utf16ptr(path)),
        u32(0x40000000),
        u32(1),
        ptr(0),
        u32(4),
        u32(0),
        ptr(0),
      ),
    )

    if (!invalidHandle(h)) {
      break
    }

    call('kernel32.dll', 'Sleep', 'void', u32(10))
  }
  if (invalidHandle(h)) {
    throw new TrayError('registration-failed', `cannot open tray IPC file ${path}`)
  }
  call('kernel32.dll', 'SetFilePointer', 'u32', ptr(h), i32(0), ptr(0), u32(2))
  const bytes = new TextEncoder().encode(text)
  call(
    'kernel32.dll',
    'WriteFile',
    'bool',
    ptr(h),
    ptr(bufferAddress(bytes)),
    u32(bytes.length),
    ptr(bufferAddress(new ArrayBuffer(8))),
    ptr(0),
  )
  call('kernel32.dll', 'CloseHandle', 'bool', ptr(h))
}

const ipcRead = (path: string): string => {
  const h = Number(
    call(
      'kernel32.dll',
      'CreateFileW',
      'pointer',
      ptr(utf16ptr(path)),
      u32(0x80000000),
      u32(3),
      ptr(0),
      u32(3),
      u32(0),
      ptr(0),
    ),
  )
  if (invalidHandle(h)) {
    return ''
  }
  const size = Number(call('kernel32.dll', 'GetFileSize', 'u32', ptr(h), ptr(0)))
  if (!size) {
    call('kernel32.dll', 'CloseHandle', 'bool', ptr(h))
    return ''
  }
  const buf = new ArrayBuffer(size + 1)
  call(
    'kernel32.dll',
    'ReadFile',
    'bool',
    ptr(h),
    ptr(bufferAddress(buf)),
    u32(size),
    ptr(bufferAddress(new ArrayBuffer(8))),
    ptr(0),
  )
  call('kernel32.dll', 'CloseHandle', 'bool', ptr(h))
  return new TextDecoder().decode(buf.slice(0, size))
}

function ipcPaths(tag: string): { cmd: string; evt: string } {
  const buf = new ArrayBuffer(520)
  const view = new DataView(buf)
  call('kernel32.dll', 'GetTempPathW', 'u32', u32(260), ptr(bufferAddress(buf)))
  let dir = ''
  for (let i = 0; i < 260; i++) {
    const c = view.getUint16(i * 2, true)
    if (!c) {
      break
    }

    dir += String.fromCharCode(c)
  }
  const pid = Number(call('kernel32.dll', 'GetCurrentProcessId', 'u32'))
  const uniq = `${pid}-${tag}-${Math.floor(Math.random() * 0xffffffff).toString(16)}`
  return {
    cmd: `${dir}xplat-tray-${uniq}-cmd.jsonl`,
    evt: `${dir}xplat-tray-${uniq}-evt.jsonl`,
  }
}

/** Create a tray item; rejects with `TrayError` on unsupported hosts or invalid options. */
export function createTray(options: TrayOptions): Promise<Tray> {
  return getTrayAvailability().then((availability) => {
    if (!availability.available) {
      throw new TrayError(availability.reason, availability.message)
    }
    const state = normalizeTrayOptions(options, 'windows')
    const registry = buildMenuModel(state.menu)
    return new Promise<Tray>((resolve, reject) => {
      const Worker = projection().Worker!
      const paths = ipcPaths(options.id)
      const source = WORKER_SOURCE.replace('__TRAY_CMD__', JSON.stringify(paths.cmd)).replace(
        '__TRAY_EVT__',
        JSON.stringify(paths.evt),
      )
      const worker = new Worker(source, { eval: true })
      const tray = new WindowsTray(options.id, state, registry, worker, paths)
      tray.attach(resolve, reject)
    })
  })
}

class WindowsTray implements Tray {
  readonly id: string
  isReady = false
  private state: NormalizedTrayOptions
  private registry: MenuRegistry
  private worker: WorkerLike
  private paths: { cmd: string; evt: string }
  private workerTid = 0
  private evtOffset = 0
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private destroyed = false
  private rectListeners = new Map<string, (box: number[] | null) => void>()

  constructor(
    id: string,
    state: NormalizedTrayOptions,
    registry: MenuRegistry,
    worker: WorkerLike,
    paths: { cmd: string; evt: string },
  ) {
    this.id = id
    this.state = state
    this.registry = registry
    this.worker = worker
    this.paths = paths
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  attach(resolve: (tray: Tray) => void, reject: (error: unknown) => void) {
    const timeout = setTimeout(() => {
      this.disposePoll()
      this.worker.terminate()
      reject(
        new TrayError('registration-failed', 'Windows tray worker did not become ready within 15s'),
      )
    }, 15_000)
    this.pollTimer = setInterval(() => {
      try {
        const text = ipcRead(this.paths.evt)
        if (text.length <= this.evtOffset) {
          return
        }

        const chunk = text.slice(this.evtOffset)
        this.evtOffset = text.length
        for (const line of chunk.split('\n')) {
          if (!line.trim()) {
            continue
          }

          this.dispatch(JSON.parse(line) as WorkerEvent, resolve, reject, timeout)
        }
      } catch (error) {
        console.error('[tray] Windows event poll failed', error)
      }
    }, 150)
  }

  private dispatch(
    msg: WorkerEvent,
    resolve: (tray: Tray) => void,
    reject: (error: unknown) => void,
    timeout: ReturnType<typeof setTimeout>,
  ) {
    switch (msg.t) {
      case 'hello':
        this.workerTid = msg.tid ?? 0
        this.sendCommand({
          t: 'init',
          uid: 0x5459,
          className: `XplatTray_${this.id.replace(/[^A-Za-z0-9]/g, '_')}_${Math.floor(Math.random() * 0xffff).toString(16)}`,
          icon: iconSpec(this.state.icon),
          tooltip: this.state.tooltip ?? '',
          menu: this.registry.rows,
          menuOnPrimary: !this.state.onActivate && !!this.state.menu?.length,
        })

        break
      case 'ready':
        this.isReady = true
        clearTimeout(timeout)
        resolve(this)
        break
      case 'destroyed':
        this.disposePoll()
        this.worker.terminate()
        break
      case 'activate':
        this.handleActivate()
        break
      case 'menu':
        this.handleMenuCommand(msg.i ?? 0)
        break
      case 'rect': {
        const listener = this.rectListeners.get(msg.tag ?? '')
        if (listener) {
          this.rectListeners.delete(msg.tag ?? '')
          listener(msg.hr === 0 ? (msg.box ?? null) : null)
        }

        break
      }
      case 'error':
        if (!this.isReady) {
          clearTimeout(timeout)
          this.disposePoll()
          this.worker.terminate()
          reject(new TrayError('registration-failed', `Windows tray worker failed: ${msg.e}`))
        } else {
          console.error(`[tray] Windows worker error: ${msg.e}`)
        }

        break
    }
  }

  private sendCommand(command: Record<string, unknown>): void {
    ipcAppend(this.paths.cmd, JSON.stringify(command) + '\n')
    if (this.workerTid) {
      call(
        'user32.dll',
        'PostThreadMessageW',
        'bool',
        u32(this.workerTid),
        u32(CMD_MSG),
        ptr(0),
        ptr(0),
      )
    }
  }

  /** Test-only: ask the worker for its real notification-area rect. */
  probeRect(tag: string): Promise<number[] | null> {
    return new Promise((resolve) => {
      this.rectListeners.set(tag, resolve)
      this.sendCommand({ t: 'selftest', tag })
    })
  }

  /** Test-only: inject a synthetic activation/menu event through the real queue. */
  probeInput(input: { click?: boolean; menuKey?: number }): void {
    this.sendCommand({ t: 'selftest', ...input })
  }

  private disposePoll() {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  update(changes: TrayUpdate): void {
    this.assertLive()
    const normalized = normalizeTrayUpdate(changes, 'windows')
    const msg: Record<string, unknown> = { t: 'update' }
    if (normalized.icon !== undefined) {
      const resolved = resolvePlatformIcon(normalized.icon, 'windows')
      msg.icon = iconSpec(resolved)
      this.state.icon = resolved
    }
    if (normalized.tooltip !== undefined) {
      this.state.tooltip = normalized.tooltip ?? undefined
      msg.tooltip = this.state.tooltip ?? ''
    }
    if (normalized.title !== undefined) {
      this.state.title = normalized.title ?? undefined
    }
    if (normalized.menu !== undefined) {
      this.registry = buildMenuModel(normalized.menu ?? undefined)
      msg.menu = this.registry.rows
      this.state.menu = normalized.menu ?? undefined
    }
    if (normalized.onActivate !== undefined) {
      this.state.onActivate = normalized.onActivate ?? undefined
    }
    msg.menuOnPrimary = !this.state.onActivate && !!this.state.menu?.length
    this.sendCommand(msg)
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }
    this.destroyed = true
    try {
      this.sendCommand({ t: 'destroy' })
    } catch {
      this.worker.terminate()
    }
  }

  handleActivate() {
    if (this.state.onActivate) {
      safeCall(this.state.onActivate)
    }
  }

  handleMenuCommand(cmd: number) {
    const entry = this.registry.byId.get(cmd)
    if (entry) {
      dispatchTraySelect(entry.item, entry.option)
    }
  }

  private assertLive() {
    if (this.destroyed) {
      throw new TrayError('destroyed', `tray ${this.id} is destroyed`)
    }
  }
}

function requireWin32() {
  const { NSWinRT: nsrt } = projection()
  if (!nsrt?.win32?.call || !nsrt.interop?.pointerFromBuffer) {
    throw new TrayError(
      'unsupported-runtime',
      'the Windows host does not expose the Win32 FFI needed for tray and window helpers',
    )
  }
}

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  requireWin32()
  const hwnds = appWindows()
  for (const hwnd of hwnds) {
    call('user32.dll', 'ShowWindow', 'bool', ptr(hwnd), i32(5)) // SW_SHOW
  }
  if (hwnds.length > 0) {
    call('user32.dll', 'SetForegroundWindow', 'bool', ptr(hwnds[0]))
  }
  return hwnds.length > 0
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  requireWin32()
  for (const hwnd of appWindows()) {
    call('user32.dll', 'ShowWindow', 'bool', ptr(hwnd), i32(0)) // SW_HIDE
  }
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  if (areAppWindowsVisible()) {
    hideAppWindows()
    return false
  }
  return showAppWindows()
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  requireWin32()
  return anyAppWindowVisible()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(_options?: { hideWindowsOnClose?: boolean }): AppResidency {
  requireWin32()
  // The packaged Windows host keeps the process alive while JS runs; there is
  // no last-window-close lifetime to intercept from JS. The returned handle is
  // an inert hold so callers can keep uniform resident semantics.
  return { release() {} }
}
