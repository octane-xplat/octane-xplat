import { Microsoft } from '@octane-xplat/platform/windows'

/** Announce result updates through the status element's WinUI automation peer. */
export function announceCommandPalette(view: any, message: string): void {
	const element = view?.nativeViewProtected
	const peers = Microsoft?.UI?.Xaml?.Automation?.Peers
	if (!element || !message || !peers?.FrameworkElementAutomationPeer) {
		return
	}

	const peer =
		peers.FrameworkElementAutomationPeer.FromElement(element) ??
		peers.FrameworkElementAutomationPeer.CreatePeerForElement(element)
	peer?.RaiseNotificationEvent?.(
		peers.AutomationNotificationKind.Other,
		peers.AutomationNotificationProcessing.MostRecent,
		message,
		'octane-command-palette',
	)
}
