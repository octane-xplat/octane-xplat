/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useMemo, useRef } from 'octane'
import { GridLayout } from '@nativescript/core'
import { useOwnedContent } from './use-owned-content'
import type { ContentRoot } from './owned-content'

class CellHost extends GridLayout {
	releaseContent?: () => void
	disposeNativeView() {
		this.releaseContent?.()
		super.disposeNativeView()
	}
}

function CellContent(props: { renderItem: (item: any, index: number) => any; item: any; index: number }) {
	return <>{props.renderItem(props.item, props.index)}</>
}

/** Template hosts belong to the native list; their content belongs to this outlet. */
export function useNativeListCells(renderItem: (item: any, index: number) => any, items: any[]) {
	const content = useOwnedContent()
	const latest = useRef({ renderItem, items })
	latest.current = { renderItem, items }
	const pool = useMemo(() => {
		const cells = new Map<CellHost, { root: ContentRoot; index: number; item: any; renderItem: typeof renderItem | null }>()
		let closed = false
		const render = (cell: ReturnType<typeof cells.get>) => {
			if (!cell || closed) return
			const current = latest.current
			const item = current.items[cell.index]
			if (cell.item === item && cell.renderItem === current.renderItem) return
			cell.item = item
			cell.renderItem = current.renderItem
			cell.root.render(CellContent, { item, index: cell.index, renderItem: current.renderItem })
		}

		return {
			template: () => new CellHost(),
			bind(args: any) {
				if (closed) return
				let host = args.view as CellHost
				if (!(host instanceof CellHost)) args.view = host = new CellHost()
				let cell = cells.get(host)
				if (!cell) {
					cell = { root: content.owner.createRoot(host), index: args.index, item: undefined, renderItem: null! }
					cells.set(host, cell)
					host.releaseContent = () => {
						cell!.root.unmount()
						cells.delete(host)
						host.releaseContent = undefined
					}
				}

				if (cell.index !== args.index) cell.renderItem = null!
				cell.index = args.index
				render(cell)
			},
			update() { for (const [host, cell] of cells) { if (cell.index >= latest.current.items.length) host.releaseContent?.(); else render(cell) } },
			dispose() {
				closed = true
				for (const host of [...cells.keys()]) host.releaseContent?.()
			},
		}
	}, [content.owner])

	useEffect(() => { pool.update() }, [pool, renderItem, items])
	useEffect(() => () => pool.dispose(), [pool])
	return { itemTemplate: pool.template, onItemLoading: pool.bind, element: content.element }
}
