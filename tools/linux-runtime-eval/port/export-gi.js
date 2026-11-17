// Build-time typelib description. Execute with GJS on the target Linux host.
const GI = imports.gi.GIRepository
const GLib = imports.gi.GLib
const repo = GI.Repository.get_default()
for (const [ns, version] of [['Gtk','4.0'],['Gdk','4.0'],['Gsk','4.0'],['Graphene','1.0'],['Pango','1.0'],['GdkPixbuf','2.0'],['Gio','2.0'],['GObject','2.0'],['GLib','2.0']]) {
  imports.gi.versions[ns] = version
  void imports.gi[ns]
}
// Optional: the renderer's Mason facade — present only when its typelib is
// reachable (GI_TYPELIB_PATH / XPLAT_MASON_TYPELIB + loader library path).
try { imports.gi.versions.XplatMason = '1.0'; void imports.gi.XplatMason } catch {}
// WebKit is optional on the build host; include it when its 6.0 typelibs exist.
for (const ns of ['JavaScriptCore','WebKit']) {
  try { imports.gi.versions[ns] = '6.0'; void imports.gi[ns] } catch {}
}
const ref = info => info ? { ns: info.get_namespace(), name: info.get_name(), kind: info.get_type() } : null
function type(info) {
  const tag=GI.type_info_get_tag(info), result={tag,pointer:GI.type_info_is_pointer(info)}
  if(tag===GI.TypeTag.INTERFACE)result.interface=ref(GI.type_info_get_interface(info))
  if(tag===GI.TypeTag.ARRAY){result.element=type(GI.type_info_get_param_type(info,0));result.length=GI.type_info_get_array_length(info);result.fixed=GI.type_info_get_array_fixed_size(info);result.zero=GI.type_info_is_zero_terminated(info)}
  return result
}
function callable(info) {
  const args=[]
  for(let i=0;i<GI.callable_info_get_n_args(info);i++){
    const arg=GI.callable_info_get_arg(info,i)
    args.push({name:arg.get_name(),type:type(GI.arg_info_get_type(arg)),direction:GI.arg_info_get_direction(arg),transfer:GI.arg_info_get_ownership_transfer(arg),scope:GI.arg_info_get_scope(arg),closure:GI.arg_info_get_closure(arg),destroy:GI.arg_info_get_destroy(arg),nullable:GI.arg_info_may_be_null(arg)})
  }
  return {name:info.get_name(),args,returns:type(GI.callable_info_get_return_type(info)),transfer:GI.callable_info_get_caller_owns(info),instanceTransfer:GI.callable_info_get_instance_ownership_transfer(info),skipReturn:GI.callable_info_skip_return(info),throws:GI.callable_info_can_throw_gerror(info)}
}
function methods(info,prefix){const result={};for(let i=0;i<GI[prefix+'_get_n_methods'](info);i++){const m=GI[prefix+'_get_method'](info,i);result[m.get_name()]={...callable(m),symbol:GI.function_info_get_symbol(m),flags:GI.function_info_get_flags(m)}}return result}
const output={namespaces:{}}
for(const ns of repo.get_loaded_namespaces()){
  if(!['Gtk','Gdk','Gsk','Graphene','Pango','GdkPixbuf','Gio','GObject','GLib','cairo','XplatMason','JavaScriptCore','WebKit'].includes(ns))continue
  const records={};output.namespaces[ns]=records
  for(let i=0;i<repo.get_n_infos(ns);i++){
    const info=repo.get_info(ns,i),kind=info.get_type(),name=info.get_name()
    if(kind===GI.InfoType.OBJECT||kind===GI.InfoType.INTERFACE||kind===GI.InfoType.STRUCT||kind===GI.InfoType.BOXED){
      const prefix=kind===GI.InfoType.OBJECT?'object_info':kind===GI.InfoType.INTERFACE?'interface_info':'struct_info'
      const record={kind,methods:methods(info,prefix),typeName:GI.registered_type_info_get_type_name(info),typeInit:GI.registered_type_info_get_type_init(info)}
      if(kind===GI.InfoType.OBJECT){record.parent=ref(GI.object_info_get_parent(info));record.interfaces=[];for(let j=0;j<GI.object_info_get_n_interfaces(info);j++)record.interfaces.push(ref(GI.object_info_get_interface(info,j)));record.classStruct=ref(GI.object_info_get_class_struct(info))}
      if(kind===GI.InfoType.OBJECT||kind===GI.InfoType.INTERFACE){record.signals={};for(let j=0;j<GI[prefix+'_get_n_signals'](info);j++){const signal=GI[prefix+'_get_signal'](info,j);record.signals[signal.get_name()]=callable(signal)};record.vfuncs={};for(let j=0;j<GI[prefix+'_get_n_vfuncs'](info);j++){const v=GI[prefix+'_get_vfunc'](info,j);record.vfuncs[v.get_name()]=callable(v)}}
      records[name]=record
    }else if(kind===GI.InfoType.ENUM||kind===GI.InfoType.FLAGS){const values={};for(let j=0;j<GI.enum_info_get_n_values(info);j++){const value=GI.enum_info_get_value(info,j);values[value.get_name().toUpperCase()]=GI.value_info_get_value(value)}records[name]={kind,values}}
    else if(kind===GI.InfoType.FUNCTION)records[name]={kind,...callable(info),symbol:GI.function_info_get_symbol(info),flags:GI.function_info_get_flags(info)}
    else if(kind===GI.InfoType.CALLBACK)records[name]={kind,...callable(info)}
    else if(kind===GI.InfoType.CONSTANT){const tag=GI.type_info_get_tag(GI.constant_info_get_type(info));if(tag===8||tag===9)continue;const value=imports.gi[ns][name];if(['number','string','boolean'].includes(typeof value))records[name]={kind,value}}
  }
}
GLib.file_set_contents(ARGV[0],JSON.stringify(output))
print(JSON.stringify({exported:ARGV[0],namespaces:Object.keys(output.namespaces),gtkRecords:Object.keys(output.namespaces.Gtk).length}))
