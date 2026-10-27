// GTK index — the GJS/GTK4 renderer surface. Only leaves proven on the GTK
// driver are exported; the shared barrel pulls platform leaves the gtk
// boundary forbids, so the gtk surface is curated like index.macos.ts.
export { Text } from './Text'
export { Pressable } from './Pressable'
export type { TextProps, PressableProps } from './props'
