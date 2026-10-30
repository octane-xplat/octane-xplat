import type { TriggerMenuState } from './useTriggerMenu'
import type { ChatComposerTriggerItem } from '../../props'
import type { JSX } from 'octane/jsx-runtime'

export type UseTriggerMenuResult = {
	state: TriggerMenuState
	handleInput: () => void
	handleKeyDown: (e: any) => boolean
	anchor: {
		current: unknown
	}
	selectItem: (item: ChatComposerTriggerItem) => void
	reset: () => void
	ariaProps:
		| {
				readonly role: 'textbox'
				readonly 'aria-multiline': 'true'
				readonly 'aria-expanded'?: undefined
				readonly 'aria-controls'?: undefined
				readonly 'aria-haspopup'?: undefined
		  }
		| {
				readonly role: 'combobox'
				readonly 'aria-expanded': true
				readonly 'aria-controls': string
				readonly 'aria-multiline'?: undefined
				readonly 'aria-haspopup'?: undefined
		  }
		| {
				readonly role: 'combobox'
				readonly 'aria-expanded': false
				readonly 'aria-haspopup': 'listbox'
				readonly 'aria-multiline'?: undefined
				readonly 'aria-controls'?: undefined
		  }
}

export type UseTriggerMenuWebResult = {
	state: TriggerMenuState
	handleInput: () => void
	handleKeyDown: (e: any) => boolean
	renderMenu: () => JSX.Element
	reset: () => void
	ariaProps:
		| {
				readonly role: 'textbox'
				readonly 'aria-multiline': 'true'
				readonly 'aria-expanded'?: undefined
				readonly 'aria-controls'?: undefined
				readonly 'aria-activedescendant'?: undefined
				readonly 'aria-haspopup'?: undefined
		  }
		| {
				readonly role: 'combobox'
				readonly 'aria-expanded': true
				readonly 'aria-controls': string
				readonly 'aria-activedescendant': string | undefined
				readonly 'aria-haspopup': 'listbox'
				readonly 'aria-multiline'?: undefined
		  }
		| {
				readonly role: 'combobox'
				readonly 'aria-expanded': false
				readonly 'aria-haspopup': 'listbox'
				readonly 'aria-multiline'?: undefined
				readonly 'aria-controls'?: undefined
				readonly 'aria-activedescendant'?: undefined
		  }
}
