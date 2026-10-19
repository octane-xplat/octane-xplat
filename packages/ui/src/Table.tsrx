/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { Key, TableProps, TableColumn } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

function rowKey<T extends object>(props: TableProps<T>, row: T, index: number): Key {
	if (typeof props.idKey === 'function') return props.idKey(row, index);
	if (props.idKey !== undefined) {
		return (((row as Record<PropertyKey, unknown>)[props.idKey]) ?? index) as Key;
	}
	const named = row as { id?: Key; key?: Key };
	return named.id ?? named.key ?? index;
}

/** Table — self-drawn grid. Bounded and unvirtualized: large datasets
 *  belong to the platform UITableView/RecyclerView subpaths. */
export function Table<T extends object = Record<string, any>>(props: TableProps<T>) @{
	const cellStyle = (col: TableColumn<keyof T & Key>) => ({
		...(col.width != null ? { width: col.width } : { flexGrow: 1 }),
		...(col.align ? { textAlignment: col.align } : {}),
	});

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-table', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		<masonview className="vx-table-head" style={{display: "flex"}}>
			@for (const col of props.columns; key col.key) {
				<masonview className="vx-table-cell vx-table-th" style={mergeStyle({display: "flex"}, cellStyle(col))}>
					<label text={col.label ?? String(col.key)} />
				</masonview>
			}
		</masonview>
		{props.rows.length === 0 && props.empty != null
			? <masonview className="vx-table-empty" style={{display: "flex"}}>{props.empty}</masonview>
			: @for (const e of props.rows.map((row, ri) => ({ row, ri })); key String(rowKey(props, e.row, e.ri))) {
				<masonview className={cx('vx-table-row', props.onRowPress && 'vx-table-row--pressable')} onTap={props.onRowPress ? () => props.onRowPress!(e.row, e.ri) : undefined} style={{display: "flex"}}>
					@for (const col of props.columns; key col.key) {
						<masonview className="vx-table-cell" style={mergeStyle({display: "flex"}, cellStyle(col))}>
							{props.renderCell ? props.renderCell({ row: e.row, column: col, rowIndex: e.ri }) : <label text={String((e.row as Record<Key, unknown>)[col.key] ?? '')} />}
						</masonview>
					}
				</masonview>
			}}
	</masonview>
}
