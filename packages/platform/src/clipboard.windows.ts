import { Windows, NSWinRT } from '@octane-xplat/platform/windows'

export type Clipboard = {
	readonly canCopy: boolean
	writeText: typeof writeText
	readText: typeof readText
	write: typeof writeText
	read: typeof readText
}

const transfer = () => Windows?.ApplicationModel?.DataTransfer

async function writeText(text: string): Promise<boolean> {
	try {
		const api = transfer()
		if (!api?.Clipboard || !api.DataPackage) {
			return false
		}

		const content = new api.DataPackage()
		content.SetText(text)
		api.Clipboard.SetContent(content)
		api.Clipboard.Flush()
		return true
	} catch {
		return false
	}
}

async function readText(): Promise<string | null> {
	try {
		const api = transfer()
		if (!api?.Clipboard || !NSWinRT?.toPromise) {
			return null
		}

		const content = api.Clipboard.GetContent()
		if (!content.Contains(api.StandardDataFormats.Text)) {
			return null
		}

		const value = await NSWinRT.toPromise(content.GetTextAsync())
		return value == null || value === '' ? null : String(value)
	} catch {
		return null
	}
}

/** WinRT text clipboard. OS access failures return false/null, as on mobile. */
export const clipboard: Clipboard = {
	get canCopy(): boolean {
		return !!(transfer()?.Clipboard && transfer()?.DataPackage)
	},
	writeText,
	readText,
	write: writeText,
	read: readText,
}
