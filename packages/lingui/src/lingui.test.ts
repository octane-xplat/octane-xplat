import { beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
	vi.resetModules()
})

const load = () => import('./lingui')
const catalog = (messages: Record<string, unknown>) => async () => ({ messages })

it('matchLocale prefers exact, then base language, then fallback', async () => {
	const { matchLocale } = await load()
	const supported = ['en', 'es', 'fr-FR']
	expect(matchLocale('fr-FR', supported, 'en')).toBe('fr-FR')
	expect(matchLocale('es-MX', supported, 'en')).toBe('es')
	expect(matchLocale('de', supported, 'en')).toBe('en')
	expect(matchLocale(undefined, supported, 'en')).toBe('en')
	expect(matchLocale('pt_BR', ['pt-BR'], 'en')).toBe('pt-BR')
})

it('catalogsFromGlob derives locales from the parent directory segment', async () => {
	const { catalogsFromGlob } = await load()
	const en = catalog({ a: 'A' })
	const es = catalog({ a: 'B' })
	const mapped = catalogsFromGlob({
		'../../locales/en/messages': en,
		'../../locales/es/messages': es,
	})

	expect(Object.keys(mapped).sort()).toEqual(['en', 'es'])
	expect(mapped.en).toBe(en)
})

it('initLingui falls back when nothing is persisted or detected', async () => {
	const { initLingui, getLocale, i18n } = await load()
	const active = await initLingui({
		catalogs: {
			en: catalog({ hello: 'Hello' }),
			fr: catalog({ hello: 'Bonjour' }),
		},
		fallback: 'en',
	})

	expect(active).toBe('en')
	expect(getLocale()).toBe('en')
	expect(i18n.locale).toBe('en')
})

it('initLingui prefers a persisted locale over detection', async () => {
	const { initLingui, getLocale } = await load()
	const save = vi.fn()
	const active = await initLingui({
		catalogs: {
			en: catalog({ hello: 'Hello' }),
			fr: catalog({ hello: 'Bonjour' }),
		},
		fallback: 'en',
		persist: { load: () => 'fr', save },
	})

	expect(active).toBe('fr')
	expect(getLocale()).toBe('fr')
	expect(save).toHaveBeenCalledWith('fr')
})

it('setLocale activates translated messages and notifies subscribers', async () => {
	const { initLingui, setLocale, subscribeLocale, i18n } = await load()
	await initLingui({
		catalogs: {
			en: catalog({ hello: 'Hello' }),
			fr: catalog({ hello: 'Bonjour' }),
		},
		fallback: 'en',
	})

	const seen: string[] = []
	subscribeLocale(() => seen.push('tick'))
	await setLocale('fr')
	expect(i18n._('hello')).toBe('Bonjour')
	expect(seen).toHaveLength(1)
	await expect(setLocale('de')).rejects.toThrow('no catalog registered')
})

it('initLingui rejects an unbacked fallback', async () => {
	const { initLingui } = await load()
	await expect(initLingui({ catalogs: { en: catalog({}) }, fallback: 'de' })).rejects.toThrow(
		'fallback',
	)
})
