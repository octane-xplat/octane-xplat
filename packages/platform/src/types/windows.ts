// WinRT host surface — the NativeScript-Windows runtime projects the WinUI/XAML
// API onto globals whose projection isn't typed upstream, so the escape hatch
// is the `any`-typed host objects the runtime exposes.
const g = globalThis as Record<string, any>

export const Windows: any = g.Windows
export const Microsoft: any = g.Microsoft
export const NSWinRT: any = g.NSWinRT
