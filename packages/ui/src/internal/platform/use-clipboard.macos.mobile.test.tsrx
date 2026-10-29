// AppKit lane runs the shared hook contracts with fake clipboard/announcement
// producers and the universal object driver. This does not access NSPasteboard
// or establish native input, effect, timer or VoiceOver behavior.
import './use-clipboard.mobile.test.tsrx'
