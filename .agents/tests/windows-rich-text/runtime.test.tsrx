/** @jsxImportSource @nativescript-community/octane */
import {afterEach, expect, it, vi} from 'vitest';
vi.mock('@nativescript/core', async () => {
 const mock = await import('./core-mock');
 return {...mock.createCoreMock(), Application:{ios:false,android:false},isIOS:false,isAndroid:false};
});
vi.mock('@nativescript/core/ui/core/properties', async () => {const mock=await import('./core-mock');return {_getStyleProperties:()=>mock.styleProperties}});
import {createContext, useContext, useLayoutEffect} from 'octane';
import {createNativeScriptRoot, flushUniversalSync} from '@nativescript-community/octane';
import {signal$} from 'octane/signals';
import {MockLayoutBase, MockTextBase} from './core-mock';
import {Text} from '../../../packages/ui/src/Text.tsrx';
const value$ = signal$('bold');
const order$ = signal$(['one','two']);
const show$ = signal$(true);
const depthContext: any = createContext('outside');
let mounts = 0, cleanups = 0;
function Piece(props: {name:string}) @{
 const prefix = useContext(depthContext);
 useLayoutEffect(()=>{mounts++;return ()=>{cleanups++;}},[]);
 <Text style={{fontWeight:'bold'}}>{prefix}{props.name}{value$.get()}<Text style={{fontStyle:'italic'}}>deep</Text>end</Text>
}
function Scope(props: {children?:any}) {return depthContext({value:'inside:',children:props.children})}
function Case() @{
 <Scope><Text id="nested">{"plain "} @if(show$.get()) {
  @for(const name of order$.get(); key name) {<Piece name={name}/>}
 }{" tail"}</Text></Scope>
}
let root: ReturnType<typeof createNativeScriptRoot>;
afterEach(()=>root?.unmount());
it('keeps normal Text JSX in its source root and context across reactive reorder/removal/unmount',()=>{
 mounts=0;cleanups=0;show$.set(true);order$.set(['one','two']);value$.set('bold');
 const host = new MockLayoutBase(); root=createNativeScriptRoot(host as never); root.render(Case as never); flushUniversalSync(()=>{});
 const label=host.children[0] as MockTextBase;
 const text=()=>label.formattedText ? [...label.formattedText.spans].map(s=>s.text).join('') : label.text;
 expect(text()).toBe('plain inside:onebolddeependinside:twobolddeepend tail');
 expect(mounts).toBe(2);expect(cleanups).toBe(0);
 value$.set('updated');flushUniversalSync(()=>{});expect(text()).toContain('oneupdateddeepend');expect(mounts).toBe(2);
 order$.set(['two','one']);flushUniversalSync(()=>{});expect(text()).toBe('plain inside:twoupdateddeependinside:oneupdateddeepend tail');expect(cleanups).toBe(0);
 order$.set(['one']);flushUniversalSync(()=>{});expect(text()).toBe('plain inside:oneupdateddeepend tail');expect(cleanups).toBe(1);
 show$.set(false);flushUniversalSync(()=>{});expect(text()).toBe('plain  tail');expect(cleanups).toBe(2);expect(label.formattedText).toBeNull();
 root.unmount();expect(host.children).toHaveLength(0);
});
