/** @jsxImportSource @octane-xplat/jsx/dom */
import { useImperativeHandle, useEffect, useId, useRef, useState } from 'octane'
import type { ComplexSelectorHandle, ComplexSelectorProps } from '../../props'
import { ComplexSelectorView } from './ComplexSelectorView.web.tsrx'
import type { JSX } from 'octane/jsx-runtime'

/** Web field trigger and anchored render-function surface for custom pickers. */
export function ComplexSelector<Value>(props: ComplexSelectorProps<Value>): JSX.Element @{
	const triggerId = useId()
	const contentId = useId()
	const anchor = useRef<HTMLElement | null>(null)
	const [isOpen, setIsOpen] = useState(false)
	const [isBusy, setIsBusy] = useState(false)
	const [optimisticValue, setOptimisticValue] = useState(props.value)
	useEffect(() => {
		setOptimisticValue(props.value)
	}, [props.value])

	const setOpen = (next: boolean) => {
		setIsOpen(next)
		props.onOpenChange?.(next)
		if (!next) {
			anchor.current?.focus?.()
		}
	}

	const handle: ComplexSelectorHandle = {
		open: () => setOpen(true),
		close: () => setOpen(false),
		toggle: () => setOpen(!isOpen),
		isOpen: () => isOpen,
	}

	useImperativeHandle(props.ref, () => handle, [props.ref, isOpen])

	const commit = async (next: Value) => {
		const previous = optimisticValue
		setOptimisticValue(next)
		props.onChange?.(next)
		if (!props.changeAction) {
			return
		}

		setIsBusy(true)
		try {
			await props.changeAction(next)
		} catch {
			setOptimisticValue(previous)
			props.onChange?.(previous)
		} finally {
			setIsBusy(false)
		}
	}

	<ComplexSelectorView
		{...props}
		anchor={anchor}
		triggerId={triggerId}
		contentId={contentId}
		state={{ value: optimisticValue, open: isOpen, pending: isBusy }}
		onChange={commit}
		onOpenChange={setOpen}
	/>
}
