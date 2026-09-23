export function List(props: {
  className?: any;
  style?: any;
  id?: string;
  items: any[];
  renderItem: (item: any) => any;
}) @{
	<div id={props.id} className={['vx-list', props.className]} style={props.style}>
		@for (const item of props.items; key item.id) {
			{props.renderItem(item)}
		}
	</div>
}
