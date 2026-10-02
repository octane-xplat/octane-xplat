/** @jsxImportSource @nativescript-community/octane */
import {Text} from '../../../packages/ui/src/Text.tsrx'
import {isAndroid,isIOS} from '@nativescript/core'
import {signal$} from 'octane/signals'
import type {ProbeContext} from '../../../scripts/probe/context'
const styled$=signal$(true);
const word$=signal$('bold');const show$=signal$(true);const reverse$=signal$(false);
export default function RichTextProbe() @{
 <stacklayout>
  <Text id="rich" style={{width:280,fontSize:18}}>{'First run '}@if(show$.get()) {<Text style={styled$.get()?{fontWeight:'bold'}:{fontStyle:'italic'}}>{word$.get()}<Text style={{fontStyle:'italic'}}> deep</Text>{' tail'}</Text>}{' end'}</Text>
  <label id="ordered"><span text={reverse$.get()?'B':'A'}/>{' / '}<span text={reverse$.get()?'A':'B'} fontWeight="bold"/></label>
  <label id="explicit"><formattedstring><span text="First run "/><span text="bold run" fontWeight="bold"/></formattedstring></label>
 </stacklayout>
}
const combined=(view:any)=>view.formattedText?.toString()??view.text;
export async function run(ctx:ProbeContext) {
 await ctx.waitFor(()=>ctx.find('rich')?.formattedText?.spans.length>0);
 const label=ctx.find('rich') as any;
 ctx.assert('mixed nested text',combined(label),'First run bold deep tail end');
 if(isAndroid) {
  await ctx.waitFor(()=>String(label.nativeViewProtected?.getText())==='First run bold deep tail end');
  ctx.assert('Android native TextView text',String(label.nativeViewProtected.getText()),'First run bold deep tail end');
  const styled=label.nativeViewProtected.getText();
  const nativeStyles=styled.getSpans(0,styled.length(),org.nativescript.widgets.CustomTypefaceSpan.class);
  const styles=[];for(let i=0;i<nativeStyles.length;i++) {
   const paint=new android.text.TextPaint();nativeStyles[i].updateMeasureState(paint);
   styles.push({style:paint.getTypeface().getStyle(),start:styled.getSpanStart(nativeStyles[i]),end:styled.getSpanEnd(nativeStyles[i])});
  }
  ctx.record('Android native style spans',styles);
  ctx.assert('Android native bold',styles.some(run=>run.style===1),true);
  ctx.assert('Android native bold italic',styles.some(run=>run.style===3),true);
 }
 if(isIOS) {
  await ctx.waitFor(()=>String(label.nativeViewProtected?.attributedText?.string)==='First run bold deep tail end');
  const attributed=label.nativeViewProtected.attributedText;
  ctx.assert('iOS native UILabel text',String(attributed.string),'First run bold deep tail end');
  const bold=attributed.attributeAtIndexEffectiveRange(NSFontAttributeName,10,null).fontDescriptor.symbolicTraits;
  const italic=attributed.attributeAtIndexEffectiveRange(NSFontAttributeName,15,null).fontDescriptor.symbolicTraits;
  ctx.record('iOS native font traits',{bold,italic});
  ctx.assert('iOS native bold',(bold&2)!==0,true);
  ctx.assert('iOS native bold italic',(italic&3)===3,true);
 }
 const weights=[];for(let i=0;i<label.formattedText.spans.length;i++) weights.push(label.formattedText.spans.getItem(i).fontWeight);
 ctx.record('run weights',weights);ctx.assert('bold nested run',weights[1],'bold');
 ctx.assert('explicit FormattedString',combined(ctx.find('explicit')),'First run bold run');
 word$.set('UPDATED');await ctx.waitFor(()=>combined(label).includes('UPDATED'));
 ctx.assert('reactive text',combined(label),'First run UPDATED deep tail end');
 if(isAndroid) {
  await ctx.waitFor(()=>String(label.nativeViewProtected.getText()).includes('UPDATED'));
  ctx.assert('Android native reactive text',String(label.nativeViewProtected.getText()),'First run UPDATED deep tail end');
 }
 styled$.set(false);await ctx.waitFor(()=>label.formattedText.spans.getItem(1).fontWeight==='normal');
 ctx.assert('removed inline bold reveals normal',label.formattedText.spans.getItem(1).fontWeight,'normal');
 if(isAndroid) {
  const styled=label.nativeViewProtected.getText();
  const fonts=styled.getSpans(10,11,org.nativescript.widgets.CustomTypefaceSpan.class);
  const paint=new android.text.TextPaint();fonts[0].updateMeasureState(paint);
  ctx.assert('Android native formatting update',paint.getTypeface().getStyle(),2);
 }
 if(isIOS) {
  const font=label.nativeViewProtected.attributedText.attributeAtIndexEffectiveRange(NSFontAttributeName,10,null);
  ctx.assert('iOS native formatting update',font.fontDescriptor.symbolicTraits&3,1);
 }
 reverse$.set(true);await ctx.waitFor(()=>combined(ctx.find('ordered'))==='B / A');
 ctx.assert('ordered spans',combined(ctx.find('ordered')),'B / A');
 show$.set(false);await ctx.waitFor(()=>combined(label)==='First run  end');
 ctx.assert('remove rich content',combined(label),'First run  end');ctx.assert('plain owner restored',label.formattedText==null,true);
 ctx.record('native label size',label.getActualSize());
}
