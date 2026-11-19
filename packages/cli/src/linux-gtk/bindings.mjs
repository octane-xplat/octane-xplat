// Experimental GTK object projection over NativeScript's generated C API.
// It intentionally fails on unsupported calls; it is not a general GJS replacement.
// v2 targets runtimes >= be71019d8: C-returned GObjects arrive as runtime-owned
// class objects that hold their own reference — the runtime owns GObject
// lifetimes; this layer only projects and observes.
import schema from 'virtual:gtk-schema'
const data = schema.namespaces
const t = interop.types
const C = globalThis
// `GObject *` as an interop type: callbacks/reads produce the runtime wrapper.
// v2 hard-requires runtimes >= be71019d8, which expose this type.
const OBJ = globalThis.__nsGObject?.object
if(!OBJ)throw Error('bindings v2 requires __nsGObject.object (runtime >= be71019d8)')
const pointer = value => value?.__native ?? value
const key = value => { const p = pointer(value); return p?.toBigInt ? p.toBigInt().toString() : p?.toString() }
const constructors = new Map(), byTypeName = new Map(), byGType = new Map()
const nativeMethods = new WeakSet(), classProperties = new Map()
const GI_SCOPE_NOTIFIED = 3
const proxies = new WeakMap()
// ptrKey -> GType name: every GObject proxy we create, until its weak notify.
export const pendingFinalizers = new Map()
const liveSignals = new Set()
const registry = new FinalizationRegistry((entry) => {
  if (entry === 'proxy') { bridgeStats.objects--; return }
  if (entry?.kind === 'glib-bytes') {
    C.g_bytes_unref(entry.native)
    return
  }
  if (entry?.kind === 'gsk-transform') {
    C.gsk_transform_unref(entry.native)
    return
  }
  if (entry?.kind === 'gtk-accessible-list') {
    C.g_boxed_free(C.gtk_accessible_list_get_type(),entry.native)
    return
  }
  if (entry.live) { entry.live = false; bridgeStats.signals--; liveSignals.delete(entry) }
})
const scopes = new Set(), permanent = { callbacks: new Set(), timers: new Set() }
let activeScope = null
export const bridgeStats = { objects: 0, finalized: 0, signals: 0, callbacks: 0, sources: 0 }
const fatal = error => { console.error('GTK_BINDING_ERROR', error.stack ?? String(error)); throw error }
const decode = p => typeof p==='string'?p:p?interop.stringFromCString(p):null
const snake = name => name.replace(/([a-z0-9])([A-Z])/g,'$1_$2').toLowerCase()
const fundamental = type => Number(g_type_fundamental(type))
const nativeType = p => new interop.Reference(t.ulong, new interop.Reference(t.pointer,p).value).value
const rawCtor = (ns,name,record=data[ns]?.[name]) => {
  const names = [record?.typeName, '_'+record?.typeName, '_'+ns+name, ns+name, snake(ns)+'_'+snake(name)+'_t', name]
  if(ns==='Gdk'&&name==='Rectangle')names.unshift('cairo_rectangle_int_t')
  for(const candidate of names)if(typeof C[candidate]==='function')return C[candidate]
  throw Error(`No C struct metadata for ${ns}.${name}: ${names.join(',')}`)
}
const scalar = type => {
  if(type.pointer)return t.pointer
  if(type.tag===16){if([5,6].includes(type.interface.kind))return t.int32;return t.pointer}
  return ({0:t.void,1:t.int32,2:t.int8,3:t.uint8,4:t.int16,5:t.uint16,6:t.int32,7:t.uint32,8:t.int64,9:t.uint64,10:t.float,11:t.double,12:t.ulong,13:t.pointer,14:t.pointer,15:t.pointer,21:t.int32})[type.tag]??t.pointer
}
const typeForRef = type => type.pointer||type.tag===16||type.tag===15?t.pointer:scalar(type)
const isObject = ref => ref && [7,8].includes(ref.kind)
const ptrSlot = interop.alloc(8)
// Bare pointer or runtime wrapper -> the runtime's JSObject wrapper. The
// wrapper cache makes this an identity: one GObject, one JS object.
const toWrapper = (p) => {
  if(!p)return null
  new interop.Reference(t.pointer, ptrSlot).value = p.__native ?? p
  return new interop.Reference(OBJ, ptrSlot).value
}
function fromNative(value,type,transfer=0){
  if(value==null)return value
  if(type.tag===1)return !!value
  if(type.tag===20){
    // GError callback arguments are borrowed; copy their fields before the
    // callback returns so the JS value cannot retain a dangling C pointer.
    try{
      const error=new interop.Reference(_GError,value).value
      const domain=Number(error.domain),code=Number(error.code),message=decode(error.message)
      return {domain,code,message,matches:(otherDomain,otherCode)=>domain===Number(otherDomain)&&code===Number(otherCode)}
    }finally{if(transfer===2)g_error_free(value)}
  }
  if(type.tag===13||type.tag===14){if(typeof value==='string')return value;const str=decode(value);if(transfer===2)g_free(value);return str}
  if(type.tag===15&&type.zero){const result=[];for(let i=0;;i++){const p=new interop.Reference(t.pointer,value.add(i*8)).value;if(!p)break;result.push(fromNative(p,type.element))}return result}
  if(type.tag===16){
    const ref=type.interface
    if([5,6].includes(ref.kind))return Number(value)
    if(ref.ns==='GObject'&&ref.name.startsWith('ParamSpec'))return value
    if(isObject(ref))return wrapObject(value,ref,transfer)
    if([3,4].includes(ref.kind)){
      if(ref.ns==='GLib'&&ref.name==='Bytes'){
        if(typeof C.g_bytes_unref!=='function'||(transfer!==2&&typeof C.g_bytes_ref!=='function'))throw Error('GLib.Bytes reference functions are unavailable')
        return wrapStruct(transfer===2?value:C.g_bytes_ref(value),ref,true,true)
      }
      if(ref.ns==='Gsk'&&ref.name==='Transform')return wrapStruct(transfer===2?value:C.gsk_transform_ref(value),ref,true,true)
      if(ref.ns==='Gtk'&&ref.name==='AccessibleList')return wrapStruct(value,ref,transfer===2,true)
      return wrapStruct(value,ref)
    }
  }
  return value
}
function projectGdkPopupInterface(target,type){
  const popup=getClass('Gdk','Popup')
  if(!popup.__gtype||!g_type_is_a(type,popup.__gtype))return
  // GtkNative.get_surface() is introspected as Gdk.Surface, while popup
  // surfaces implement the separate Gdk.Popup interface. GJS resolves the
  // instance's dynamic interface methods; mirror that for the probe wrapper.
  for(const name of Object.getOwnPropertyNames(popup.prototype)){
    if(name==='constructor'||Reflect.has(target,name))continue
    Object.defineProperty(target,name,Object.getOwnPropertyDescriptor(popup.prototype,name))
  }
}
const weakFinalized = (data, _dead) => {
  pendingFinalizers.delete(key(data))
  bridgeStats.finalized++
}
// GWeakNotify observes a dying instance. Its second pointer must stay raw:
// creating a GObject wrapper here would add a toggle ref during disposal.
const weakNotification = interop.callback(weakFinalized, {returns:t.void,args:[t.pointer,t.pointer]})
// The runtime wrapper always holds its own reference (#25), so for a
// transfer-full GObject return/out the caller's ref must be dropped after
// wrapping — except initially-unowned types, where the wrapper merely sank
// the floating ref and there is no extra ref to release.
const dropTransfer = (w, type) => {
  if(!g_type_is_a(type,g_initially_unowned_get_type()))g_object_unref(w)
}
function objectPropertySpec(w,name){
  const klass=new interop.Reference(t.pointer,w).value,id=key(klass)
  let properties=classProperties.get(id)
  if(!properties){properties=new Map();classProperties.set(id,properties)}
  if(!properties.has(name))properties.set(name,g_object_class_find_property(klass,name)??null)
  return properties.get(name)
}
function wrapObject(p,ref,transfer=0,prototype){
  if(!p)return null
  p = p.__native ?? p
  const type=nativeType(p)
  if(!g_type_is_a(type,g_object_get_type())){
    // Non-GObject fundamentals (GdkEvent): adopt native ownership of the ref.
    if(!g_type_is_a(type,gdk_event_get_type()))throw Error(`Unsupported fundamental ${ref.ns}.${ref.name}`)
    const owned=transfer===2?p:gdk_event_ref(p)
    const target=Object.create(getClass(ref.ns,ref.name).prototype)
    Object.assign(target,{__native:interop.adopt(owned,gdk_event_unref),__ref:ref,__gobject:false})
    bridgeStats.objects++;registry.register(target,'proxy',target);return target
  }
  const w=toWrapper(p)
  // Transfer-full returns/outs reach us at caller-ref + wrapper-ref (#25);
  // drop the caller's ref once regardless of whether the proxy is fresh.
  if(transfer===2)dropTransfer(w,type)
  const old=proxies.get(w)
  if(old)return old
  const name=decode(g_type_name(type))
  let selected=byGType.get(Number(type))??byTypeName.get(name)??getClass(ref.ns,ref.name)
  if(selected.__lazy)selected=getClass(...selected.__lazy)
  const resolvedRef=selected.__ref??ref
  const target=Object.create(prototype??selected.prototype)
  Object.assign(target,{__native:w,__ref:resolvedRef,__gobject:true,__conn:new Map()})
  projectGdkPopupInterface(target,type)
  const proxy=new Proxy(target,{
    get(obj,property,receiver){
      const present=Reflect.has(obj,property)
      const existing=present?Reflect.get(obj,property,receiver):undefined
      if(typeof property!=='string'||(present&&!nativeMethods.has(existing)))return existing
      // GJS resolves an introspected property before a same-named native method
      // (for example WebKit.WebView.is_loading).
      const propertyName=property.replaceAll('_','-')
      const spec=objectPropertySpec(w,propertyName)
      if(spec)return propertyGet(proxy,propertyName,spec)
      return existing
    },
    set(obj,property,value,receiver){
      const existing=Reflect.has(obj,property)?Reflect.get(obj,property,receiver):undefined
      if(typeof property==='string'&&!property.startsWith('__')&&(!Reflect.has(obj,property)||nativeMethods.has(existing))){
        const spec=objectPropertySpec(w,property.replaceAll('_','-'))
        if(spec){propertySet(proxy,property.replaceAll('_','-'),value,spec);return true}
      }
      return Reflect.set(obj,property,value,receiver)
    }
  })
  proxies.set(w,proxy)
  // We own no reference; a weak ref just lets teardown name whatever survives.
  pendingFinalizers.set(key(w),name)
  g_object_weak_ref(w,weakNotification,w)
  activeScope?.pending.set(key(w),name)
  bridgeStats.objects++;registry.register(proxy,'proxy',proxy);return proxy
}
function wrapStruct(native,ref,owned=false,force=false){
  if(!force&&native?.__native)return native
  const klass=getClass(ref.ns,ref.name),target=Object.create(klass.prototype)
  target.__native=native;target.__ref=ref
  const proxy=new Proxy(target,{
    get(obj,p,receiver){
      if(Reflect.has(obj,p))return Reflect.get(obj,p,receiver)
      // GJS's GBytes.toArray convenience — copies the buffer, then drops the
      // transfer-full reference the facade handed over.
      if(ref.ns==='GLib'&&ref.name==='Bytes'&&p==='toArray')return()=>{
        const out=obj.get_data().slice()
        if(!obj.__bytesFreed){obj.__bytesFreed=true;obj.unref()}
        return out
      }
      return obj.__native[p]
    },
    set(obj,p,value,receiver){if(typeof p==='string'&&!p.startsWith('__')&&p in obj.__native){obj.__native[p]=pointer(value);return true}return Reflect.set(obj,p,value,receiver)}
  })
  if(owned&&ref.ns==='GLib'&&ref.name==='Bytes'){
    const token={}
    const unref=proxy.unref
    target.unref=function(...args){registry.unregister(token);target.__bytesFreed=true;return unref.apply(proxy,args)}
    registry.register(proxy,{kind:'glib-bytes',native:pointer(native)},token)
  }
  if(owned&&ref.ns==='Gsk'&&ref.name==='Transform'){
    const token={}
    target.ref=()=>{
      if(target.__transformFreed)throw Error('Gsk.Transform already released')
      return wrapStruct(C.gsk_transform_ref(pointer(native)),ref,true,true)
    }
    target.unref=()=>{
      if(target.__transformFreed)throw Error('Gsk.Transform already released')
      target.__transformFreed=true;registry.unregister(token);C.gsk_transform_unref(pointer(native))
    }
    registry.register(proxy,{kind:'gsk-transform',native:pointer(native)},token)
  }
  if(owned&&ref.ns==='Gtk'&&ref.name==='AccessibleList'){
    registry.register(proxy,{kind:'gtk-accessible-list',native:pointer(native)})
  }
  return proxy
}
export const typeNameOf = value => decode(g_type_name(nativeType(pointer(value))))
function valueType(spec){return new interop.Reference(_GParamSpec,spec).value.value_type}
function fillValue(memory,value,type){
  if(value?.__ref?.ns==='GObject'&&value.__ref.name==='Value'){
    // Copy the initialized GValue, preserving ref-counted contents.
    g_value_init(memory,pointer(value).g_type);g_value_copy(pointer(value),memory);return
  }
  if(value?.__ref?.ns==='Gtk'&&value.__ref.name==='AccessibleList'){
    g_value_init(memory,C.gtk_accessible_list_get_type())
    // The GValue owns a copy; the returned boxed wrapper keeps its own copy.
    g_value_set_boxed(memory,pointer(value));return
  }
  type??=typeof value==='string'?64:typeof value==='boolean'?20:typeof value==='number'?24:80
  g_value_init(memory,type)
  const kind=fundamental(type)
  const setter=({20:g_value_set_boolean,24:g_value_set_int,28:g_value_set_uint,32:g_value_set_long,36:g_value_set_ulong,40:g_value_set_int64,44:g_value_set_uint64,48:g_value_set_enum,52:g_value_set_flags,56:g_value_set_float,60:g_value_set_double,64:g_value_set_string,68:g_value_set_pointer,72:g_value_set_boxed,80:g_value_set_object})[kind]
  if(!setter)throw Error(`Unsupported GValue fundamental ${kind}`)
  setter(memory,pointer(value))
}
function readValue(memory,type){
  const kind=fundamental(type)
  const getter=({20:g_value_get_boolean,24:g_value_get_int,28:g_value_get_uint,32:g_value_get_long,36:g_value_get_ulong,40:g_value_get_int64,44:g_value_get_uint64,48:g_value_get_enum,52:g_value_get_flags,56:g_value_get_float,60:g_value_get_double,64:g_value_get_string,68:g_value_get_pointer,72:g_value_get_boxed,80:g_value_get_object})[kind]
  if(!getter)throw Error(`Unsupported GValue read ${kind}`)
  if(kind===64&&Number(memory.g_type)!==Number(type))throw Error(`GValue mismatch expected ${type}, actual ${memory.g_type}`)
  const value=getter(memory)
  if(kind===64)return decode(value)
  if(kind===20)return !!value
  if(kind===80)return value?wrapObject(value,{ns:'GObject',name:'Object',kind:7}):null
  return value
}
function propertyGet(object,name,spec){const memory=new _GValue();const type=valueType(spec);g_value_init(memory,type);try{g_object_get_property(pointer(object),name,memory);return readValue(memory,type)}finally{g_value_unset(memory)}}
function propertySet(object,name,value,spec){const memory=new _GValue();fillValue(memory,value,valueType(spec));try{g_object_set_property(pointer(object),name,memory)}finally{g_value_unset(memory)}}
function makeObject(klass,props={}){
  const type=klass.__gtype,propertyNames=Object.keys(props),values=interop.alloc(propertyNames.length*24),strings=[]
  try{
    const nativeClass=g_type_class_ref(type)
    for(let i=0;i<propertyNames.length;i++){
      const name=propertyNames[i].replaceAll('_','-'),spec=g_object_class_find_property(nativeClass,name)
      if(!spec)throw Error(`Unknown constructor property ${klass.__ref.name}.${name}`)
      strings.push(interop.cstring(name));fillValue(values.add(i*24),props[propertyNames[i]],valueType(spec))
    }
    const names=new BigUint64Array(strings.map(p=>p.toBigInt()))
    const p=g_object_new_with_properties(type,propertyNames.length,names,values)
    g_type_class_unref(nativeClass)
    // GtkWindow is initially-unowned and presented windows are GTK-held;
    // transfer=0 asks wrapObject to leave the wrapper's sunk ref alone.
    return wrapObject(p,klass.__ref,g_type_is_a(type,gtk_window_get_type())?0:2,klass.prototype)
  }finally{for(let i=0;i<strings.length;i++)g_value_unset(values.add(i*24));interop.free(values)}
}
function allMethods(ns,name,result=new Map()){
  const info=data[ns][name]
  if(info.parent)allMethods(info.parent.ns,info.parent.name,result)
  for(const iface of info.interfaces??[])allMethods(iface.ns,iface.name,result)
  for(const [key,value]of Object.entries(info.methods??{}))result.set(key,value)
  return result
}
function installGType(klass,gtype){
  Object.defineProperties(klass,{
    __gtype:{value:gtype},
    $gtype:{value:{name:decode(g_type_name(gtype))}},
  })
  byGType.set(Number(gtype),klass)
}
function getClass(ns,name){
  const id=ns+'.'+name;if(constructors.has(id))return constructors.get(id)
  const record=data[ns]?.[name];if(!record)throw Error(`Unexported GI type ${id}`)
  if(record.values)return record.values
  const klass=function(...args){
    if([7,8].includes(record.kind))return makeObject(new.target,args[0])
    if((ns==='GLib'&&name==='Bytes')||(ns==='Gsk'&&name==='Transform')){
      if(typeof klass.new!=='function')throw Error(`${ns}.${name}.new is not available in the native projection`)
      return klass.new(...args)
    }
    const native=new (rawCtor(ns,name))()
    if(args[0]&&typeof args[0]==='object')Object.assign(native,args[0])
    return wrapStruct(native,{ns,name,kind:record.kind})
  }
  constructors.set(id,klass);klass.__ref={ns,name,kind:record.kind}
  if(record.typeName)byTypeName.set(record.typeName,klass)
  if(record.typeInit&&typeof C[record.typeInit]==='function')installGType(klass,C[record.typeInit]())
  // GObject interfaces are implemented through GType, outside JS's prototype chain.
  if(record.kind===8&&klass.__gtype)Object.defineProperty(klass,Symbol.hasInstance,{value:value=>
    value?.__gobject===true&&!!g_type_is_a(nativeType(pointer(value)),klass.__gtype)})
  if(record.parent)Object.setPrototypeOf(klass.prototype,getClass(record.parent.ns,record.parent.name).prototype)
  for(const [methodName,method]of allMethods(ns,name)){
    // Projected matrices own their aligned allocation through interop.adopt.
    if(method.symbol==='graphene_matrix_alloc'||method.symbol==='graphene_matrix_free')continue
    if(typeof C[method.symbol]!=='function')continue
    if(method.flags&1){
      const projected=function(...args){return invoke(method,args,this)}
      nativeMethods.add(projected)
      Object.defineProperty(klass.prototype,methodName,{value:projected,writable:true})
    }else Object.defineProperty(klass,methodName,{value:(...args)=>invoke(method,args),configurable:true})
  }
  // Signal/property sugar on top of the runtime's own wrapper methods; the
  // runtime owns the closure — it is freed on disconnect or instance finalize.
  if([7,8].includes(record.kind)){
    Object.assign(klass.prototype,{
      connect(signal,fn){return connect(this,signal,fn)},connect_after(signal,fn){return connect(this,signal,fn,true)},
      disconnect(id){const tok=this.__conn.get(id);this.__native.disconnect(id);if(tok?.live){tok.live=false;bridgeStats.signals--;liveSignals.delete(tok);this.__conn.delete(id)}},
      emit(signal,...args){return this.__native.emit(signal,...args.map(pointer))},
      get_property(name){const spec=g_object_class_find_property(new interop.Reference(t.pointer,this.__native).value,name);return propertyGet(this,name,spec)},
      set_property(name,value){const spec=g_object_class_find_property(new interop.Reference(t.pointer,this.__native).value,name);propertySet(this,name,value,spec)},
    })
  }
  if(record.kind===7&&klass.__gtype&&!Object.hasOwn(klass,'find_property')){
    Object.defineProperty(klass,'find_property',{value:name=>{
      const nativeClass=g_type_class_ref(klass.__gtype)
      try{
        const spec=g_object_class_find_property(nativeClass,name)
        return spec?interop.adopt(g_param_spec_ref(spec),g_param_spec_unref):null
      }finally{g_type_class_unref(nativeClass)}
    }})
  }
  return klass
}
// Out-structs that rawCtor's name candidates miss (the runtime exposes
// graphene structs only by tag, e.g. `_graphene_rect_t`) get raw memory plus
// an explicit float field map — `fields` carry absolute byte offsets.
const outStructLayouts={
  'Graphene.Rect':{size:16,fields:{origin:{x:0,y:4},size:{width:8,height:12}}},
  'Graphene.Point':{size:8,fields:{x:0,y:4}},
  'Graphene.Size':{size:8,fields:{width:0,height:4}},
}
function outStructFallback(ref){
  const layout=outStructLayouts[ref.ns+'.'+ref.name]
  if(!layout)throw Error(`No out-struct fallback for ${ref.ns}.${ref.name}`)
  const build=(buffer,fields)=>{
    const out={}
    for(const [name,value]of Object.entries(fields)){
      if(typeof value==='number')out[name]=new interop.Reference(t.float,buffer.add(value)).value
      else out[name]=build(buffer,value)
    }
    return out
  }
  return {alloc:()=>interop.alloc(layout.size),read:(buffer)=>build(buffer,layout.fields)}
}
function prepareArray(value,type,cleanup,hints){
  if(typeof value==='string')value=new TextEncoder().encode(value)
  if(ArrayBuffer.isView(value))return value
  if(type.element?.interface?.ns==='GObject'&&type.element.interface.name==='Value'){
    const memory=interop.alloc(value.length*24)
    value.forEach((v,i)=>fillValue(memory.add(i*24),v,hints?.[i]))
    cleanup.push(()=>{value.forEach((_,i)=>g_value_unset(memory.add(i*24)));interop.free(memory)})
    return memory
  }
  if([6,7].includes(type.element.tag)||[5,6].includes(type.element.interface?.kind))return new Int32Array(value)
  if(type.element.tag===3)return new Uint8Array(value)
  // guint64/gint64 element arrays (XplatMason child handles) carry plain numbers.
  if(type.element.tag===8)return new BigInt64Array(value.map(v=>BigInt(v)))
  if(type.element.tag===9)return new BigUint64Array(value.map(v=>BigInt(v)))
  const strings=[]
  const array=new BigUint64Array([...value.map(v=>{
    if(typeof v==='string'){const s=interop.cstring(v);strings.push(s);return s.toBigInt()}
    if(typeof v==='number')return BigInt(v)
    return pointer(v)?.toBigInt()??0n
  }),...(type.zero?[0n]:[])])
  cleanup.push(()=>void strings.length)
  return array
}
function callbackNative(fn,info,owner){
  const wrapped=(...args)=>{
    try{return pointer(fn(...info.args.map((arg,i)=>fromNative(args[i],arg.type))))}catch(e){fatal(e)}
  }
  // Keep args as raw pointers: object-typed callback args are marshalled
  // inside the trampoline; see triniwiz/linux-runtime#29. wrapObject upgrades
  // them in JS.
  const raw=interop.callback(wrapped,{returns:scalar(info.returns),args:info.args.map(a=>scalar(a.type))})
  owner.push(wrapped);bridgeStats.callbacks++
  return raw
}
function notifiedCallbackNative(fn,info){
  const owned=[]
  const callback=callbackNative(fn,info,owned)
  let released=false
  const destroy=()=>{
    if(released)return
    released=true
    // Native code is still executing the destroy trampoline on this stack.
    deferRelease(owned[0])
    deferRelease(destroy)
  }
  try{
    const notify=interop.callback(destroy,{returns:t.void,args:[t.pointer]})
    bridgeStats.callbacks++
    return {callback,notify,destroy}
  }catch(error){
    interop.release(owned[0]);bridgeStats.callbacks--
    throw error
  }
}
function invoke(info,values,self){
  const hidden=new Set(),out=[],args=[],cleanup=[],callbacks=[],retain=[]
  const notified=new Map()
  let nativeCallStarted=false
  const byteReturn=info.returns.tag===15&&info.returns.element?.tag===3&&info.returns.length>=0
  let byteLength
  try{
    for(const arg of info.args){if(arg.type.tag===15&&arg.type.length>=0)hidden.add(arg.type.length);if(arg.closure>=0)hidden.add(arg.closure);if(arg.destroy>=0)hidden.add(arg.destroy)}
    const lengths=new Map();let index=0
    let inputIndex=0
    info.args.forEach((arg,i)=>{
      if(hidden.has(i)||arg.direction===1)return
      const value=values[inputIndex++]
      if(arg.type.tag===15&&arg.type.length>=0&&value!=null)lengths.set(arg.type.length,typeof value==='string'?new TextEncoder().encode(value).length:value.length)
    })
    if(self){
      if(self.__ref?.ns==='Gsk'&&self.__ref.name==='Transform'){
        if(info.instanceTransfer===undefined)throw Error('Re-export GI schema with instance ownership metadata')
        if(self.__transformFreed)throw Error('Gsk.Transform already released')
        if(info.instanceTransfer===2)retain.push(()=>C.gsk_transform_ref(pointer(self)))
      }else if(info.instanceTransfer===2&&self.__gobject)retain.push(()=>g_object_ref(pointer(self)))
      args.push(pointer(self))
    }
    for(let i=0;i<info.args.length;i++){
      const arg=info.args[i],type=arg.type
      if(byteReturn&&i===info.returns.length){
        if(arg.direction!==1)throw Error('Byte array return length must be an out parameter')
        byteLength=new interop.Reference(typeForRef(type))
        args.push(byteLength);continue
      }
      if(hidden.has(i)){args.push(lengths.get(i)??null);continue}
      if(arg.direction===1){
        let memory,read
        if(type.tag===16&&[3,4].includes(type.interface.kind)){
          const ref=type.interface
          if(ref.ns==='Graphene'&&ref.name==='Matrix'){
            // Graphene owns the SIMD layout and alignment on each architecture.
            memory=interop.adopt(C.graphene_matrix_alloc(),C.graphene_matrix_free)
            if(!memory)throw Error('Graphene could not allocate a matrix')
            read=()=>wrapStruct(memory,ref)
          }else{
            try{memory=new (rawCtor(ref.ns,ref.name))();read=()=>wrapStruct(memory,ref)}
            catch{const flat=outStructFallback(ref);memory=flat.alloc();read=()=>flat.read(memory);cleanup.push(()=>interop.free(memory))}
          }
        }else{memory=new interop.Reference(typeForRef(type));read=()=>fromNative(memory.value,type,arg.transfer)}
        args.push(memory);out.push({type,read});continue
      }
      let value=values[index++]
      if(arg.direction===2&&!type.pointer&&type.tag>=1&&type.tag<=12){
        const memory=new interop.Reference(typeForRef(type))
        memory.value=value
        args.push(memory)
        out.push({type,read:()=>fromNative(memory.value,type,arg.transfer)})
        continue
      }
      if(type.tag===15&&value!=null){if(type.length>=0)lengths.set(type.length,typeof value==='string'?new TextEncoder().encode(value).length:value.length);const properties=data.Gtk.AccessibleProperty.values
        const stringProperties=['DESCRIPTION','KEY_SHORTCUTS','LABEL','ROLE_DESCRIPTION','VALUE_TEXT','PLACEHOLDER'].map(k=>properties[k])
        const doubleProperties=['VALUE_MIN','VALUE_MAX','VALUE_NOW'].map(k=>properties[k])
        const hints=info.symbol==='gtk_accessible_update_property_value'&&arg.name==='values'?values[0].map(p=>stringProperties.includes(p)?64:doubleProperties.includes(p)?60:undefined):undefined
        value=prepareArray(value,type,cleanup,hints)}
      else if(type.tag===17&&Array.isArray(value)){
        // GList input parameters borrow a native list, not the JS array.
        if(arg.transfer!==0)throw Error('Ownership-taking GList inputs are not projected')
        let list=null
        cleanup.push(()=>{if(list)g_list_free(list)})
        for(const item of value){
          if(!item?.__ref||!isObject(item.__ref))throw Error('GList inputs require projected GObjects')
          list=g_list_append(list,pointer(item))
        }
        value=list
      }
      else if(type.tag===16&&type.interface.kind===2&&typeof value==='function'){
        const callbackInfo=data[type.interface.ns][type.interface.name]
        if(arg.scope===GI_SCOPE_NOTIFIED&&arg.destroy>=0){
          const owned=notifiedCallbackNative(value,callbackInfo)
          notified.set(arg.destroy,owned)
          value=owned.callback
        }else value=callbackNative(value,callbackInfo,callbacks)
      }
      else if(type.tag===16&&type.interface.ns==='GObject'&&type.interface.name==='Value'&&arg.transfer===0&&typeof value==='string'){
        const boxed=new _GValue()
        fillValue(boxed,value)
        cleanup.push(()=>g_value_unset(boxed))
        value=boxed
      }
      else {
        // A transfer-full parameter consumes a native reference; add one for the
        // callee's consumption — the wrapper's own ref stays ours to release.
        if(arg.transfer===2&&value?.__ref){
          if(isObject(value.__ref))retain.push(()=>g_object_ref(pointer(value)))
          else if(value.__ref.ns==='Gsk'&&value.__ref.name==='Transform'){
            if(value.__transformFreed)throw Error('Gsk.Transform already released')
            retain.push(()=>C.gsk_transform_ref(pointer(value)))
          }
        }
        value=pointer(value)
      }
      args.push(value??null)
    }
    const error=info.throws?new interop.Reference(t.pointer):null
    if(error)args.push(error)
    for(const ref of retain)ref()
    for(const [index,owned] of notified)args[index+(self?1:0)]=owned.notify
    nativeCallStarted=true
    const raw=C[info.symbol](...args)
    if(error?.value){const native=new interop.Reference(_GError,error.value).value;const message=decode(native.message);g_error_free(error.value);throw Error(message)}
    const results=out.map(o=>o.read())
    const hasReturn=!(info.returns.tag===0&&!info.returns.pointer)&&!info.skipReturn
    if(hasReturn){
      if(byteReturn){
        // GI hides the length parameter and presents a copied Uint8Array.
        // Transfer-full C buffers belong to the caller; borrowed ones stay native.
        try{
          const length=Number(byteLength.value)
          if(!Number.isSafeInteger(length)||length<0)throw Error('Invalid byte array return length')
          if(length&&!raw)throw Error('Null byte array with nonzero length')
          results.unshift(length?new Uint8Array(interop.bufferFromData(raw,length)).slice():new Uint8Array())
        }finally{if(info.transfer===2&&raw)g_free(raw)}
      }else results.unshift(fromNative(raw,info.returns,info.transfer))
    }
    return results.length>1?results:results[0]
  }catch(error){throw Error(`${info.symbol}: ${error.message}`,{cause:error})}
  finally{
    for(const fn of cleanup)fn()
    if(!nativeCallStarted)for(const owned of notified.values())owned.destroy()
    // Only call-scoped callbacks are safe to release immediately. Longer-lived
    // callbacks remain associated with the current explicit ownership scope.
    for(const fn of callbacks)(activeScope??permanent).callbacks?.add(fn)
  }
}
function signalInfo(ref,name){
  const record=data[ref.ns]?.[ref.name]
  if(record?.signals?.[name])return record.signals[name]
  for(const iface of record?.interfaces??[]){const found=signalInfo(iface,name);if(found)return found}
  return record?.parent?signalInfo(record.parent,name):null
}
function connect(object,signal,handler,after=false){
  const info=signalInfo(object.__ref,signal.split('::')[0])
  const ref=object.__ref
  const converted=(self,...args)=>{
    try{
      // Runtime signal marshalling already converts scalars and wraps GObjects;
      // fromNative turns those into our proxies and passes the rest through.
      // Unknown signals keep the v1 shape: drop the trailing data pointer.
      const mapped=info?info.args.map((a,i)=>fromNative(args[i],a.type)):args.slice(0,-1)
      // The C closure keeps `converted` alive for as long as the connection
      // exists — capturing `object` here would pin the widget's own wrapper
      // and leak it. Recover the proxy from `self` instead.
      return pointer(handler(proxies.get(self)??wrapObject(self,ref),...mapped))
    }catch(e){fatal(e)}
  }
  const id=object.__native.connect(signal,converted,after)
  const token={live:true,type:typeNameOf(object),signal}
  object.__conn.set(id,token);liveSignals.add(token);registry.register(converted,token,converted)
  bridgeStats.signals++;return id
}
function registerClass(options,klass){
  if(typeof options==='function'){klass=options;options={}}
  const parent=Object.getPrototypeOf(klass),ref=parent.__ref,record=data[ref.ns][ref.name]
  const query=new _GTypeQuery();g_type_query(parent.__gtype,query)
  const owned=[]
  const init=classPointer=>{
    const classType=record.classStruct??data[record.parent?.ns]?.[record.parent?.name]?.classStruct
    const nativeClass=new interop.Reference(rawCtor(classType.ns,classType.name),classPointer).value
    for(const name of Object.getOwnPropertyNames(klass.prototype)){
      if(!name.startsWith('vfunc_'))continue
      const virtual=name.slice(6);let owner=record;while(!owner.vfuncs?.[virtual]&&owner.parent)owner=data[owner.parent.ns][owner.parent.name];const info=owner.vfuncs?.[virtual]
      if(!info)throw Error(`Unsupported inherited vfunc ${ref.ns}.${ref.name}.${virtual}`)
      const cb=(self,...args)=>{
        const instance=wrapObject(self,klass.__ref)
        const inputs=[],outputs=[]
        info.args.forEach((arg,i)=>{if(arg.direction===1)outputs.push([arg,args[i]]);else inputs.push(fromNative(args[i],arg.type))})
        const result=klass.prototype[name].apply(instance,inputs)
        if(outputs.length){const values=Array.isArray(result)?result:[result];outputs.forEach(([arg,p],i)=>{new interop.Reference(typeForRef(arg.type),p).value=values[i]})}
        return outputs.length?undefined:pointer(result)
      }
      owned.push(cb)
      const slot=new interop.Reference(rawCtor(owner.classStruct.ns,owner.classStruct.name),classPointer).value
      slot[virtual]=interop.callback(cb,{returns:scalar(info.returns),args:[t.pointer,...info.args.map(a=>a.direction===1?t.pointer:scalar(a.type))]})
    }
  }
  const gtype=g_type_register_static_simple(parent.__gtype,options.GTypeName??klass.name,query.class_size,init,query.instance_size,null,0)
  installGType(klass,gtype);Object.defineProperty(klass,'__ref',{value:ref})
  permanent.callbacks.add(init);owned.forEach(f=>permanent.callbacks.add(f))
  // super.vfunc_focus must call the actual parent's slot rather than recurse.
  if(record.classStruct){const parentPointer=g_type_class_ref(parent.__gtype);const native=new interop.Reference(rawCtor(record.classStruct.ns,record.classStruct.name),parentPointer).value
    for(const [name,info]of Object.entries(record.vfuncs??{}))if(!parent.prototype['vfunc_'+name])parent.prototype['vfunc_'+name]=function(...args){return fromNative(native[name](this.__native,...args.map(pointer)),info.returns)}
  }
  return klass
}
for(const [ns,records]of Object.entries(data))for(const [name,record]of Object.entries(records))if(record.typeName)byTypeName.set(record.typeName,{__lazy:[ns,name]})
// Resolve lazy constructor lookup before instance projection.
for(const [name,value]of byTypeName)if(value.__lazy)Object.defineProperty(value,'prototype',{get(){return getClass(...value.__lazy).prototype}})
export const namespaces={}
for(const [ns,records]of Object.entries(data))namespaces[ns]=new Proxy({}, {get(_,name){
  const record=records[name]
  if(!record)return undefined
  if(record.values)return record.values
  if('value'in record)return record.value
  if(record.symbol)return typeof C[record.symbol]==='function'? (...args)=>invoke(record,args):undefined
  return getClass(ns,name)
}})
// Constants not included in typelib exports or represented as fundamental macros.
namespaces.GObject=new Proxy(namespaces.GObject,{get(target,p){if(p==='registerClass')return registerClass;if(p==='TYPE_INT')return 24;if(p==='TYPE_BOOLEAN')return 20;if(p==='TYPE_DOUBLE')return 60;if(p==='TYPE_STRING')return 64;return target[p]}})
const timers=new Map()
const deferRelease=callback=>setTimeout(()=>{interop.release(callback);bridgeStats.callbacks--},0)
const addSource=(priority,ms,fn,idle=false)=>{
  let id
  const callback=()=>{
    try {
      const again=!!fn()
      if(!again){timers.delete(id);bridgeStats.sources--;deferRelease(callback)}
      return again
    }catch(error){fatal(error);return false}
  }
  id=idle?g_idle_add_full(priority,callback,null,null):g_timeout_add_full(priority,ms,callback,null,null)
  timers.set(id,callback);bridgeStats.sources++;bridgeStats.callbacks++
  activeScope?.timers.add(id)
  return id
}
const glibExtras={PRIORITY_DEFAULT:0,PRIORITY_DEFAULT_IDLE:200,SOURCE_REMOVE:false,SOURCE_CONTINUE:true,
  timeout_add:(priority,ms,fn)=>addSource(priority,ms,fn),
  idle_add:(priority,fn)=>addSource(priority,0,fn,true),
  source_remove:id=>{const callback=timers.get(id);if(!callback)return false;g_source_remove(id);timers.delete(id);bridgeStats.sources--;deferRelease(callback);return true},
}
namespaces.GLib=new Proxy(namespaces.GLib,{get(target,p){return p in glibExtras?glibExtras[p]:target[p]}})
C.imports={gi:new Proxy({versions:{}},{get(target,p){
  if(p in target)return target[p]
  // The facade "typelib" only exists when its compiled module is present —
  // report it missing like a real GIRepository lookup would.
  if(p==='XplatMason'&&data.XplatMason)return typeof C.xplat_mason_engine_new==='function'?namespaces.XplatMason:null
  return namespaces[p]??null
}}),system:{gc:()=>C.gc?.()}}
export function beginScope(){const scope=new Set();scope.pending=new Map();scope.callbacks=new Set();scope.timers=new Set();scopes.add(scope);activeScope=scope;return scope}
// Report what survives full teardown so probes can tell process-global
// anchors (Gtk.Settings watches, registered class init) from real leaks.
export function describeResidual(){
  const signals=[...liveSignals].filter(t=>t.live).map(t=>({type:t.type,signal:t.signal}))
  return {objects:[...pendingFinalizers.values()],signals,permanentCallbacks:permanent.callbacks.size,timers:[...timers.keys()]}
}
export function releaseScope(scope){
  activeScope=null
  for(const id of scope.timers)glibExtras.source_remove(id)
  for(const fn of scope.callbacks){interop.release(fn);bridgeStats.callbacks--}
  scope.callbacks.clear();scope.timers.clear()
  scopes.delete(scope);scope.clear()
}
// GType names of objects created under `scope` that have not finalized yet —
// scope.pending is a creation-time snapshot, liveness lives in
// pendingFinalizers.
export function pendingInScope(scope){
  return [...scope.pending.entries()].filter(([k])=>pendingFinalizers.has(k)).map(([,n])=>n)
}
