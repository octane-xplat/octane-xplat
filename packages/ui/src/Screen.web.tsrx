export function Screen(props: { className?: any; style?: any; children?: any }) @{
	<div className={['vx-screen', props.className]} style={props.style}>
		{props.children}
	</div>
}
