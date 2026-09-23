/** @jsxImportSource @nativescript-community/octane */
export function Switch(props: {
	className?: any;
	style?: any;
	id?: string;
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}) @{
	<switch
		id={props.id}
		className={props.className}
		style={props.style}
		checked={props.checked}
		onCheckedChange={(e: any) => props.onCheckedChange?.(e.value)}
	/>
}
