/** @jsxImportSource @nativescript-community/octane */
import {Text} from '../../../packages/ui/src/Text.tsrx'
import {signal$} from 'octane/signals'
const styled$ = signal$(true)
const word$ = signal$('bold run')
const show$ = signal$(true)
const order$ = signal$(['A','B'])
export function changeRichText(stage: number) {
	if (stage === 1) word$.set('UPDATED')
	if (stage === 2) {order$.set(['B','A']);styled$.set(false)}
	if (stage === 3) show$.set(false)
}
export function WindowsUICase() @{
	<stacklayout>
		<Text id="mixed" style={{width:280,fontSize:18}}>{'First run '}
			@if (show$.get()) {<Text style={styled$.get()?{fontWeight:'bold'}:{fontStyle:'italic'}}>{word$.get()}</Text>}
			{' end'}
		</Text>
		<Text id="deep" style={{width:280,fontSize:18}}>{'plain '}<Text style={{fontWeight:'bold'}}>{'outer '}<Text style={{fontStyle:'italic'}}>inner</Text>{' tail'}</Text>{' end'}</Text>
		<Text id="order" style={{width:280,fontSize:18}}>
			@for (const name of order$.get(); key name) {<Part name={name}/>}
		</Text>
		<label id="explicit" width={280} fontSize={18}><formattedstring><span text="First run "/><span text="bold run" fontWeight="bold"/></formattedstring></label>
	</stacklayout>
}
function Part(props: {name:string}) @{
	<Text style={{fontWeight:props.name==='B'?'bold':'normal'}}>{props.name}</Text>
}
