export function List(props: {
  className?: any;
  style?: any;
  items: any[];
  renderItem: (item: any) => any;
}) @{
	<div className={['vx-list', props.className]} style={props.style}>
		@for (const item of props.items; key item.id) {
			{props.renderItem(item)}
		}
	</div>
}
