// JSON.parse cases retain UTF-16 units, including raw/escaped mixtures.
export function jsonBoundarySources() {
 const sources = ['null', 'true', '0', '-0', '-0.0', '-0e0', '9007199254740993', '100000000000000016384',
  '1e400', '-1e400', '1e-10000', '"plain"', '"\\u0061"', '"\\\\ud800"',
  '{"\\ud83d\\ude00":1,"😀":2}', '{"\\ud800":1,"�":2}', '{"zero":-0,"arr":["\\udc00",1e400]}',
  '{"a":1,}', '"\\ud800\\uZZZZ"', '"\\uD800', '[1,,]']
 const codes = [0, 0x22, 0x5c, 0x307, 0xd7ff, 0xd800, 0xd801, 0xdbff, 0xdc00, 0xdc01, 0xdfff, 0xe000]
 const escape = code => `\\u${code.toString(16).padStart(4, '0')}`
 for (const a of codes) for (const b of codes) sources.push(`"${escape(a)}${escape(b)}"`)
 for (const a of [0xd800, 0xdbff, 0xdc00]) for (const b of [0xd800, 0xdc00, 0xdfff])
  for (const c of [0xd800, 0xdc00, 0x61]) sources.push(`"${escape(a)}${escape(b)}${escape(c)}"`)
 for (const high of [0xd800, 0xdbff]) for (const low of [0xdc00, 0xdfff]) {
  const h = String.fromCharCode(high), l = String.fromCharCode(low)
  const forms = [escape(high) + escape(low), escape(high) + l, h + escape(low), h + l]
  for (const a of forms) sources.push(`"${a}"`)
  for (const a of forms) for (const b of forms) sources.push(`{"${a}":1,"${b}":2,"${a}":3}`)
 }
 return sources.map(source => {
  try { JSON.parse(source); return { source, invalid: false } }
  catch { return { source, invalid: true } }
 })
}
