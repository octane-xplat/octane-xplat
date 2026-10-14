import { Frame, GridLayout } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal'
import type { ModalHandle, ModalOpenOptions, ModalOpenResult, OpenModal } from '../props'
import { applyThemeClasses } from '../theme/theme-host'
import { modalPresenter } from '../modal-presenter'

/** Open a component in its own NativeScript modal root and resolve on close. */
export const openModal: OpenModal = (Component, params, options = {}) => {
	let closeModal: ((result?: ModalOpenResult) => void) | undefined
	const handle = new Promise<ModalOpenResult>((resolve, reject) => {
		const presenter = modalPresenter(Frame.topmost())
		if (!presenter) {
			reject(
				new Error(
					'openModal dropped — no live presenter. The topmost frame has no loaded currentPage (a page mid-navigation), or no frame is active yet.',
				),
			)

			return
		}

		const host = new GridLayout()
		const unbindTheme = applyThemeClasses(host, 'vx-modal-host')
		const root = createNativeScriptRoot(host) as any
		let finished = false
		const finish = (result?: ModalOpenResult) => {
			if (finished) {
				return
			}

			finished = true
			unbindTheme()
			root.unmount?.()
			host.removeChildren?.()
			resolve(result)
		}

		const close = (result?: ModalOpenResult) => host.closeModal(result)
		closeModal = (result?: ModalOpenResult) => {
			// closeModal on a never-presented host throws — treat the close as
			// completing the request either way so the handle always settles.
			try {
				close(result)
			} catch {
				finish(result)
			}
		}

		root.render(Component as unknown as UniversalComponent, { params, close })

		const fullscreen = options.presentation
			? options.presentation === 'fullscreen'
			: (options.fullscreen ?? true)

		// showModal takes (viewToShow, options). On Android fullscreen=false is
		// a centered dialog sized to its content.
		presenter.showModal(host, {
			context: {},
			closeCallback: finish,
			fullscreen,
			animated: options.animated ?? true,
		})
	}) as ModalHandle

	handle.close = (result?: ModalOpenResult) => closeModal?.(result)
	return handle
}

export type { ModalOpenOptions }
