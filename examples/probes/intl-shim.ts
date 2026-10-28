// NativeScript's JS runtime has no Intl. The ui shared barrel evaluates a
// module-scope `new Intl.Collator` in its table sources, which aborts bundle
// eval. This stub satisfies that construction; no probe check uses Intl.
if (!(globalThis as any).Intl) {
	const fmt = class {
		resolvedOptions() {
			return { locale: 'en' }
		}
		format(v: unknown) {
			return String(v)
		}
	}

	;(globalThis as any).Intl = {
		Collator: class {
			compare(a: string, b: string) {
				return String(a).localeCompare(String(b))
			}
		},
		NumberFormat: fmt,
		DateTimeFormat: fmt,
		RelativeTimeFormat: fmt,
		Locale: class {
			baseName: string
			constructor(locale: string) {
				this.baseName = locale ?? 'en'
			}
		},
	}
}
