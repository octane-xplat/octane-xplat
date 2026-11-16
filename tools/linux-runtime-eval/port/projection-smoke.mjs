// Low-level projection contracts; run with test:renderer-fixture -- projection.
import GLib from 'gi://GLib'
import Gtk from 'gi://Gtk?version=4.0'

Gtk.init()
const failures=[]
let checks=0
const check=(name,ok)=>{checks++;if(!ok)failures.push(name)}
const same=(actual,expected)=>actual instanceof Uint8Array&&
  actual.length===expected.length&&actual.every((value,index)=>value===expected[index])

const decoded=GLib.base64_decode('AP9BAA==')
check('transfer-full byte array',same(decoded,[0,255,65,0]))
check('empty transfer-full byte array',same(GLib.base64_decode(''),[]))
const bytes=new GLib.Bytes(decoded)
decoded[1]=42
check('GBytes copies input',same(bytes.get_data(),[0,255,65,0]))
const borrowed=bytes.get_data()
borrowed[0]=99
check('borrowed byte array is copied',same(bytes.get_data(),[0,255,65,0]))
check('empty borrowed byte array',same(new GLib.Bytes(new Uint8Array()).get_data(),[]))
check('GBytes toArray convenience',same(new GLib.Bytes(new Uint8Array([2,0,3])).toArray(),[2,0,3]))
for(let i=0;i<100;i++){
  const data=GLib.base64_decode('AP9BAA==')
  if(!same(new GLib.Bytes(data).get_data(),[0,255,65,0]))throw Error('Byte array repeat failed')
}
check('repeated byte array conversion',true)
const entry=new Gtk.Entry()
const button=new Gtk.Button()
check('Entry implements Editable',entry instanceof Gtk.Editable)
check('Entry implements Accessible',entry instanceof Gtk.Accessible)
check('Button implements Accessible',button instanceof Gtk.Accessible)
check('Button does not implement Editable',!(button instanceof Gtk.Editable))
check('null is not Editable',!(null instanceof Gtk.Editable))
check('plain object is not Editable',!({} instanceof Gtk.Editable))
check('class inheritance still works',entry instanceof Gtk.Widget)
print('GTK_PROJECTION '+JSON.stringify({checks,failures,osInput:false,
  gtk:`${Gtk.get_major_version()}.${Gtk.get_minor_version()}.${Gtk.get_micro_version()}`}))
