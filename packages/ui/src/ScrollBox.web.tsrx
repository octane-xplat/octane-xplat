import { ScrollView } from './ScrollView.web.tsrx';
import type { ScrollBoxProps } from './props';

/** Scrollable web content shell; native uses an inline View counterpart. */
export function ScrollBox(props: ScrollBoxProps) @{
	<ScrollView {...props}>{props.children}</ScrollView>
}
