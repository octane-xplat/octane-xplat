// Icon registrations for the sandbox shell and ported examples.
//
// Two upstream icon sets are folded into the Xplat registry, both MIT:
// - sandbox shell icons, hand-ported from facebook/astryx
//   apps/sandbox/src/app/icons.tsx (Lucide/Feather-style strokes, Meta).
// - Heroicons 24/outline path data (Tailwind Labs) used by block templates.
// The Xplat registry renders glyph `markup` inside a shared <svg> shell, so
// each entry carries its own stroke attributes.

import { registerIcons } from '@octane-xplat/ui'

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
const HERO = 'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'

const stroke = (inner: string) => `<g ${STROKE}>${inner}</g>`
const hero = (inner: string) => `<g ${HERO}>${inner}</g>`

registerIcons({
	// --- sandbox shell (ported from upstream icons.tsx) ---
	'sandbox-home': {
		markup: stroke('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
	},
	'sandbox-box': {
		markup: stroke('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),
	},
	'sandbox-app-window': {
		markup: stroke('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>'),
	},
	'sandbox-blocks': {
		markup: stroke('<rect x="2" y="2" width="8.5" height="8.5" rx="1"/><rect x="13.5" y="2" width="8.5" height="8.5" rx="1"/><rect x="2" y="13.5" width="8.5" height="8.5" rx="1"/><rect x="13.5" y="13.5" width="8.5" height="8.5" rx="1"/>'),
	},
	'sandbox-palette': {
		markup: stroke('<circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.7-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/>'),
	},
	'sandbox-sun': {
		markup: stroke('<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'),
	},
	'sandbox-moon': {
		markup: stroke('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
	},
	'sandbox-wrench': {
		markup: stroke('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'),
	},
	'sandbox-external-link': {
		markup: stroke('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
	},
	// PreviewShell chrome icons (ported from upstream PreviewShell.tsx)
	'sandbox-sidebar': {
		markup: stroke('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>'),
	},
	'sandbox-chevron-down': {
		markup: stroke('<polyline points="6 9 12 15 18 9"/>'),
	},
	'sandbox-copy': {
		markup: stroke('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
	},
	'sandbox-check': {
		markup: stroke('<polyline points="20 6 9 17 4 12"/>'),
	},

	// --- Heroicons 24/outline used by ported block templates ---
	'sandbox-plus': {
		markup: hero('<path d="M12 4.5v15m7.5-7.5h-15"/>'),
	},
	'sandbox-pencil-square': {
		markup: hero('<path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/><path d="M16.863 4.487L19.5 7.125"/>'),
	},
	'sandbox-arrow-down-tray': {
		markup: hero('<path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>'),
	},
	'sandbox-trash': {
		markup: hero('<path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>'),
	},
	'sandbox-document-duplicate': {
		markup: hero('<path d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-7.5a2.25 2.25 0 012.25-2.25h6z"/>'),
	},
	'sandbox-share': {
		markup: hero('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
	},
	'sandbox-map-pin': {
		markup: hero('<path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>'),
	},
	'sandbox-arrow-right': {
		markup: hero('<path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>'),
	},
	'sandbox-arrow-left': {
		markup: hero('<path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>'),
	},
	'sandbox-arrow-up': {
		markup: hero('<path d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"/>'),
	},
	'sandbox-uturn-left': {
		markup: hero('<path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>'),
	},
	'sandbox-flag': {
		markup: hero('<path d="M3 3v1.5M3 21v-6m0 0l2.77-.676a9 9 0 016.208.682l.034.018c.035.017.068.036.102.054a8.96 8.96 0 004.787.928l2.695-.54a1.125 1.125 0 00.904-1.097V6.227c0-.597-.483-1.079-1.08-1.079-.198 0-.393.04-.578.11l-2.695.9a8.96 8.96 0 01-4.787-.928l-.034-.018a8.978 8.978 0 00-6.31-.736L3 5.25"/>'),
	},
	'sandbox-calendar': {
		markup: hero('<path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>'),
	},
	'sandbox-tag': {
		markup: hero('<path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path d="M6 6h.008v.008H6V6z"/>'),
	},
	'sandbox-user': {
		markup: hero('<path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>'),
	},
	'sandbox-folder': {
		markup: hero('<path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>'),
	},
})
