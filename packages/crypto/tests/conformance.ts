import { vectors } from './cavp-vectors'
import {
	Crypto,
	CryptoDigestAlgorithm,
	CryptoEncoding,
	AESEncryptionKey,
	AESSealedData,
	aesEncryptAsync,
	aesDecryptAsync,
	digest,
	digestStringAsync,
	getRandomBytes,
	getRandomBytesAsync,
	getRandomValues,
	randomUUID,
} from '../src/index'
import { decodeHex, hex } from '../src/bytes'
type Context = {
	assert(name: string, actual: unknown, expected?: unknown): void
	record(name: string, value: unknown): void
}
export async function run(ctx: Context) {
	const check = (name: string, actual: unknown, expected: unknown = true) =>
		ctx.assert(name, actual, expected)
	const rejects = async (action: () => unknown) => {
		try {
			await action()
			return false
		} catch {
			return true
		}
	}
	check('secure random capability', Crypto.capabilities.random)
	check(
		'SHA256 known vector',
		await digestStringAsync(CryptoDigestAlgorithm.SHA256, 'abc'),
		'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
	)
	check(
		'SHA256 empty input',
		await digestStringAsync('SHA-256', ''),
		'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
	)
	check(
		'SHA1 known vector',
		await digestStringAsync('SHA-1', 'abc'),
		'a9993e364706816aba3e25717850c26c9cd0d89d',
	)
	check(
		'SHA384 known vector',
		await digestStringAsync('SHA-384', 'abc'),
		'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
	)
	check(
		'SHA512 known vector',
		await digestStringAsync('SHA-512', 'abc'),
		'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
	)
	check(
		'padded base64 digest',
		await digestStringAsync('SHA-256', 'abc', { encoding: CryptoEncoding.BASE64 }),
		'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=',
	)
	const view = new Uint8Array([99, 97, 98, 99, 88]).subarray(1, 4)
	const pending = digest('SHA-256', view)
	view.fill(0)
	check(
		'hash snapshots offset view',
		hex(new Uint8Array(await pending)),
		'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
	)
	check('legacy MD2 unavailable', await rejects(() => digestStringAsync('MD2', 'abc')))
	if (Crypto.capabilities.digestAlgorithms.includes('MD5')) {
		check(
			'MD5 legacy interoperability',
			await digestStringAsync('MD5', 'abc'),
			'900150983cd24fb0d6963f7d28e17f72',
		)
	}
	const backing = new Uint8Array(28).fill(231),
		target = new Uint16Array(backing.buffer, 4, 10)
	check('random returns caller view', getRandomValues(target) === target)
	check(
		'random preserves outside view',
		backing.slice(0, 4).every((v) => v === 231) && backing.slice(24).every((v) => v === 231),
	)
	check(
		'random fills requested range',
		backing.slice(4, 24).some((v) => v !== 231),
	)
	check('random size bounds', await rejects(() => getRandomBytes(1025)))
	check('float arrays rejected', await rejects(() => getRandomValues(new Float32Array(4) as never)))
	check(
		'DataView rejected',
		await rejects(() => getRandomValues(new DataView(new ArrayBuffer(4)) as never)),
	)
	check('random quota enforced', await rejects(() => getRandomValues(new Uint8Array(65537))))
	check('empty random output', getRandomBytes(0).length, 0)
	check('async random output size', (await getRandomBytesAsync(32)).length, 32)
	check(
		'UUID version and variant',
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(randomUUID()),
	)
	const key = await AESEncryptionKey.import(new Uint8Array(16)),
		iv = new Uint8Array(12)
	const empty = await aesEncryptAsync(new Uint8Array(), key, { nonce: { bytes: iv } })
	check(
		'NIST zero-key empty AES128-GCM tag',
		hex(await empty.tag()),
		'58e2fccefa7e3061367f1d57a4e7455a',
	)
	check('empty authenticated decrypt', (await aesDecryptAsync(empty, key)).length, 0)
	const message = new Uint8Array(16),
		started = aesEncryptAsync(message, key, { nonce: { bytes: iv } })
	message.fill(91)
	iv.fill(4)
	const encrypted = await started
	check(
		'NIST block cipher/tag and input snapshot',
		hex(await encrypted.ciphertext({ includeTag: true })),
		'0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf',
	)
	check(
		'combined byte layout',
		hex(await encrypted.combined()),
		'0000000000000000000000000388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf',
	)
	const parsed = AESSealedData.fromCombined(await encrypted.combined('base64'))
	check(
		'combined parser decrypt',
		hex(await aesDecryptAsync(parsed, key)),
		'00000000000000000000000000000000',
	)
	const parts = AESSealedData.fromParts(
		await parsed.iv('base64'),
		await parsed.ciphertext(),
		await parsed.tag('base64'),
	)
	check(
		'parts parser sizes',
		parts.combinedSize === 44 && parts.ivSize === 12 && parts.tagSize === 16,
	)
	const exported = await key.bytes()
	exported.fill(4)
	check(
		'key export does not mutate owner',
		await key.encoded('hex'),
		'00000000000000000000000000000000',
	)
	const tag = await encrypted.tag()
	tag.fill(0)
	check(
		'sealed output does not mutate owner',
		hex(await encrypted.tag()),
		'ab6e47d42cec13bdf53a67b21257bddf',
	)
	const tampered = await parsed.combined()
	tampered[tampered.length - 1]! ^= 1
	check(
		'tampered tag rejects',
		await rejects(() => aesDecryptAsync(AESSealedData.fromCombined(tampered), key)),
	)
	const ciphertextTamper = await parsed.combined()
	ciphertextTamper[12]! ^= 1
	check(
		'tampered ciphertext rejects',
		await rejects(() => aesDecryptAsync(AESSealedData.fromCombined(ciphertextTamper), key)),
	)
	const aadKey = await AESEncryptionKey.import('feffe9928665731c6d6a8f9467308308', 'hex')
	const plaintext = decodeHex(
		'd9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b39',
	)
	const aad = decodeHex('feedfacedeadbeeffeedfacedeadbeefabaddad2')
	const authenticated = await aesEncryptAsync(plaintext, aadKey, {
		nonce: { bytes: decodeHex('cafebabefacedbaddecaf888') },
		additionalData: aad,
	})
	check(
		'NIST authenticated ciphertext',
		hex(await authenticated.ciphertext()),
		'42831ec2217774244b7221b784d0d49ce3aa212f2c02a4e035c17e2329aca12e21d514b25466931c7d8f6a5aac84aa051ba30b396a0aac973d58e091',
	)
	check(
		'NIST authenticated tag',
		hex(await authenticated.tag()),
		'5bc94fbc3221a5db94fae95ae7121a47',
	)
	check(
		'authenticated data roundtrip',
		hex(await aesDecryptAsync(authenticated, aadKey, { additionalData: aad })),
		hex(plaintext),
	)
	check(
		'wrong AAD rejects',
		await rejects(() =>
			aesDecryptAsync(authenticated, aadKey, { additionalData: new Uint8Array([1]) }),
		),
	)
	check(
		'wrong key rejects',
		await rejects(() => aesDecryptAsync(authenticated, key, { additionalData: aad })),
	)
	const key256 = await AESEncryptionKey.import(new Uint8Array(32))
	const encrypted256 = await aesEncryptAsync(new Uint8Array(16), key256, {
		nonce: { bytes: new Uint8Array(12) },
	})
	check(
		'NIST AES256-GCM block',
		hex(await encrypted256.ciphertext({ includeTag: true })),
		'cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919',
	)
	const generated = await AESEncryptionKey.generate()
	check('default key has 256 bits', generated.size, 256)
	const one = await aesEncryptAsync('AAECAw==', generated),
		two = await aesEncryptAsync(new Uint8Array([0, 1, 2, 3]), generated)
	check('fresh IV for repeated encryption', hex(await one.iv()) !== hex(await two.iv()))
	check(
		'binary string decrypt returns padded base64',
		await aesDecryptAsync(one, generated, { output: 'base64' }),
		'AAECAw==',
	)
	check('short key rejected', await rejects(() => AESEncryptionKey.import(new Uint8Array(15))))
	check(
		'nonportable nonce rejected',
		await rejects(() => aesEncryptAsync(new Uint8Array(), key, { nonce: { length: 16 } })),
	)
	check(
		'nonportable tag rejected',
		await rejects(() => aesEncryptAsync(new Uint8Array(), key, { tagLength: 12 })),
	)
	check(
		'truncated sealed data rejected',
		await rejects(() => AESSealedData.fromCombined(new Uint8Array(27))),
	)
	if (Crypto.capabilities.aesKeySizes.includes(192)) {
		const key192 = await AESEncryptionKey.generate(192),
			sealed192 = await aesEncryptAsync(new Uint8Array([1, 2, 3]), key192)
		check('AES192 roundtrip', hex(await aesDecryptAsync(sealed192, key192)), '010203')
	} else {
		check('AES192 explicitly unavailable', await rejects(() => AESEncryptionKey.generate(192)))
	}
	for (const vector of vectors) {
		if (!Crypto.capabilities.aesKeySizes.includes(vector.bits)) {
			continue
		}
		const vectorKey = await AESEncryptionKey.import(vector.key, 'hex')
		const encrypted = await aesEncryptAsync(decodeHex(vector.plaintext), vectorKey, {
			nonce: { bytes: decodeHex(vector.iv) },
			additionalData: decodeHex(vector.aad),
		})
		check(
			`CAVP AES${vector.bits} ciphertext ${vector.plaintext.length}`,
			hex(await encrypted.ciphertext()),
			vector.ciphertext,
		)
		check(
			`CAVP AES${vector.bits} tag ${vector.plaintext.length}`,
			hex(await encrypted.tag()),
			vector.tag,
		)
		check(
			`CAVP AES${vector.bits} decrypt ${vector.plaintext.length}`,
			hex(await aesDecryptAsync(encrypted, vectorKey, { additionalData: decodeHex(vector.aad) })),
			vector.plaintext,
		)
	}
	ctx.record('cryptoConformance', true)
}
