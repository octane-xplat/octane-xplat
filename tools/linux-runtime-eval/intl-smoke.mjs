// Run directly under ns-linux before qualifying the runtime's ICU data.
const instant = new Date('2026-01-02T03:04:05Z')
const checks = []
function check(name, actual, expected) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
  }
  checks.push(name)
}

check('UTC date', new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
}).format(instant), 'January 2, 2026')
check('French month', new Intl.DateTimeFormat('fr-FR', {
  month: 'long', timeZone: 'UTC',
}).format(instant), 'janvier')
check('New York date', new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York',
}).format(instant), 'January 1, 2026')
check('Word segmentation', Array.from(
  new Intl.Segmenter('en', { granularity: 'word' }).segment('apple apricot'),
).filter((part) => part.isWordLike).map((part) => part.segment).join('|'), 'apple|apricot')
check('Grapheme segmentation', Array.from(
  new Intl.Segmenter('en', { granularity: 'grapheme' }).segment('e\u0301\ud83d\udc69\u200d\ud83d\udc69\u200d\ud83d\udc67\u200d\ud83d\udc66'),
).length, 2)
console.log('INTL_SMOKE ' + JSON.stringify({ checks: checks.length, failures: [] }))
