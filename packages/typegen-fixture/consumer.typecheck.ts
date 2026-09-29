import { Badge, Box, Card, createBadge, decode, format, type BoxProps } from 'tsrx-typegen-fixture'

const props: BoxProps<number> = { value: 42 }
Box(props)
Badge({ label: 'ready', tone: 'quiet' })
Card({ title: 'surface' })
Card.Header({ text: 'title' })
createBadge('fallback')({ label: 'explicit' })
format(props.value).toFixed()
const decodedNumber = decode(42)
decodedNumber.value.toFixed()

// @ts-expect-error value is required
Box({})

// @ts-expect-error inline label prop is required
Badge({})

// @ts-expect-error compound member keeps its own props
Card.Header({ text: 42 })

// @ts-expect-error factory component keeps its prop contract
createBadge('fallback')({ label: 42 })

// @ts-expect-error overloads preserve accepted inputs
decode(false)

// @ts-expect-error value remains generic and cannot be assigned to string
const label: string = format(props.value)

void label
