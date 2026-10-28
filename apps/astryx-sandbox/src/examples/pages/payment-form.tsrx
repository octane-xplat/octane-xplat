// Port of upstream templates/pages/payment-form/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/payment-form/.
// GAPS: upstream renders custom PayPal/Google-Pay brand buttons via inline
// styles — kept as styled Buttons; errors only appear after Place order is
// pressed (upstream `submitted` contract preserved).
import { useState } from 'octane'
import {
	Button, Card, Center, CheckboxInput, Divider, FormLayout, Heading,
	HStack, Icon, Layout, LayoutContent, NumberInput, RadioList,
	RadioListItem, Section, Selector, Stack, StackItem, Text, TextArea,
	TextInput, Thumbnail, useMediaQuery, VStack, pixel } from '@octane-xplat/ui'

const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'].map((m) => ({ value: m, label: m }))
const YEARS = Array.from({ length: 12 }, (_, i) => ({ value: String(2025 + i), label: String(2025 + i) }))

const US_STATES = [
	'California','Illinois','Massachusetts','New York','Oregon','Texas','Washington',
].map((s) => ({ value: s, label: s }))

const ORDER_ITEMS = [
	{ id: '1', name: 'Speckled Stoneware Mug', variant: 'Hand-thrown · 12 oz', price: 78, qty: 1, src: '/template-assets/light-product-1.png' },
	{ id: '2', name: 'Stoneware Dinner Plate', variant: 'Reactive glaze · 10 in', price: 72, qty: 1, src: '/template-assets/light-product-4.png' },
	{ id: '3', name: 'Cereal Bowl', variant: 'Speckled clay · 6 in', price: 80, qty: 1, src: '/template-assets/light-product-5.png' },
]

const DELIVERY_OPTIONS = [
	{ value: 'standard', label: 'Standard', window: '3–7 business days', price: 4.95 },
	{ value: 'expedited', label: 'Expedited', window: '1–2 business days', price: 9.95 },
	{ value: 'overnight', label: 'Overnight', window: 'Next business day by 5pm', price: 24.95 },
]

const TAX_RATE = 0.08
const fmt = (n: number) => `$${n.toFixed(2)}`

export function PaymentFormTemplate() @{
	const isMobile = useMediaQuery('(max-width: 768px)')

	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [address, setAddress] = useState('')
	const [city, setCity] = useState('')
	const [zip, setZip] = useState('')
	const [state, setState] = useState('')
	const [phone, setPhone] = useState('')
	const [saveInfo, setSaveInfo] = useState(false)
	const [email, setEmail] = useState('')
	const [emailOffers, setEmailOffers] = useState(false)
	const [deliveryMethod, setDeliveryMethod] = useState('standard')
	const [paymentMethod, setPaymentMethod] = useState('card')
	const [cardNumber, setCardNumber] = useState('')
	const [expiry, setExpiry] = useState('')
	const [expYear, setExpYear] = useState('')
	const [billingMatchesShipping, setBillingMatchesShipping] = useState(true)
	const [billingAddress, setBillingAddress] = useState('')
	const [billingCity, setBillingCity] = useState('')
	const [billingZip, setBillingZip] = useState('')
	const [billingState, setBillingState] = useState('')
	const [addGiftMessage, setAddGiftMessage] = useState(false)
	const [giftTo, setGiftTo] = useState('')
	const [giftFrom, setGiftFrom] = useState('')
	const [giftMessage, setGiftMessage] = useState('')
	const [cvc, setCvc] = useState('')
	const [cardName, setCardName] = useState('')
	const [promo, setPromo] = useState('')
	const [quantities, setQuantities] = useState<Record<string, number>>({
		'1': 1, '2': 1, '3': 1,
	})
	const [submitted, setSubmitted] = useState(false)

	const items = ORDER_ITEMS.map((item) => ({ ...item, qty: quantities[item.id] ?? item.qty }))
	const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
	const delivery = DELIVERY_OPTIONS.find((o) => o.value === deliveryMethod) ?? DELIVERY_OPTIONS[0]
	const shipping = delivery.price
	const tax = subtotal * TAX_RATE
	const total = subtotal + shipping + tax

	const errors = submitted
		? {
				firstName: !firstName.trim() ? 'Required' : undefined,
				lastName: !lastName.trim() ? 'Required' : undefined,
				address: !address.trim() ? 'Required' : undefined,
				city: !city.trim() ? 'Required' : undefined,
				zip: !zip.trim() ? 'Required' : undefined,
				state: !state ? 'Required' : undefined,
				email: !email.trim() ? 'Required' : undefined,
				phone: !phone.trim() ? 'Required' : undefined,
				expiry: !expiry ? 'Required' : undefined,
				expYear: !expYear ? 'Required' : undefined,
				cvc: !cvc.trim() ? 'Required' : undefined,
				cardNumber: paymentMethod === 'card' && !cardNumber.trim() ? 'Required' : undefined,
				cardName: paymentMethod === 'card' && !cardName.trim() ? 'Required' : undefined,
				billingAddress: !billingMatchesShipping && !billingAddress.trim() ? 'Required' : undefined,
				billingCity: !billingMatchesShipping && !billingCity.trim() ? 'Required' : undefined,
				billingZip: !billingMatchesShipping && !billingZip.trim() ? 'Required' : undefined,
				billingState: !billingMatchesShipping && !billingState ? 'Required' : undefined,
			}
		: {}

	const err = (key: keyof typeof errors) =>
		errors[key] ? { type: 'error' as const, message: errors[key] } : undefined

	<Layout
		height="fill"
		content={
			<LayoutContent padding={0}>
				<Center axis="horizontal">
					<Section variant="transparent" maxWidth={1100} width="100%" padding={6}>
						<VStack gap={5}>
							<VStack gap={6}>
								<VStack gap={2}>
									<Heading type="display-1" level={1}>
										Payment Request
									</Heading>
									<Text type="body" color="secondary">
										Review your order and complete your purchase. All
										transactions are secured with 256-bit SSL encryption.
									</Text>
								</VStack>
								<Divider />
							</VStack>

							<Stack direction={isMobile ? 'vertical' : 'horizontal'} gap={8}>
								<StackItem size="fill">
									<VStack gap={6}>
										{/* Contact */}
										<VStack gap={3}>
											<HStack hAlign="between" vAlign="center">
												<Text type="large" weight="bold">Contact</Text>
												<Button label="Sign in" variant="ghost" size="sm" clickAction={() => {}} />
											</HStack>
											<Text type="supporting" color="secondary">
												Sign in for faster checkout, or continue as a guest.
											</Text>
											<TextInput
												label="Email" value={email} onChange={(v) => setEmail(v ?? '')}
												placeholder="you@example.com" status={err('email')}
											/>
											<CheckboxInput
												label="Email me with news and offers"
												value={emailOffers} onChange={(v) => setEmailOffers(v ?? '')}
											/>
										</VStack>
										<Divider />

										{/* Shipping */}
										<VStack gap={3}>
											<Text type="large" weight="bold">Shipping address</Text>
											<FormLayout direction={isMobile ? 'vertical' : 'horizontal'}>
												<TextInput label="First name" value={firstName} onChange={(v) => setFirstName(v ?? '')} status={err('firstName')} />
												<TextInput label="Last name" value={lastName} onChange={(v) => setLastName(v ?? '')} status={err('lastName')} />
											</FormLayout>
											<TextInput label="Address" value={address} onChange={(v) => setAddress(v ?? '')} status={err('address')} />
											<FormLayout direction={isMobile ? 'vertical' : 'horizontal'}>
												<TextInput label="City" value={city} onChange={(v) => setCity(v ?? '')} status={err('city')} />
												<Selector label="State" options={US_STATES} value={state} onValueChange={(v) => setState(v ?? '')} status={err('state')} />
												<TextInput label="ZIP" value={zip} onChange={(v) => setZip(v ?? '')} status={err('zip')} />
											</FormLayout>
											<TextInput label="Phone" value={phone} onChange={(v) => setPhone(v ?? '')} placeholder="For delivery questions" status={err('phone')} />
											<CheckboxInput
												label="Save my information for next time"
												value={saveInfo} onChange={(v) => setSaveInfo(v ?? '')}
											/>
										</VStack>
										<Divider />

										{/* Delivery */}
										<VStack gap={3}>
											<Text type="large" weight="bold">Delivery method</Text>
											<Text type="supporting" color="secondary">
												Estimates start the day your order ships.
											</Text>
											<RadioList value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v ?? '')} label="Delivery method" isLabelHidden>
												{DELIVERY_OPTIONS.map((o) => (
													<RadioListItem
														key={o.value}
														value={o.value}
														label={o.label}
														description={`${o.window} · ${fmt(o.price)}`}
													/>
												))}
											</RadioList>
										</VStack>
										<Divider />

										{/* Payment */}
										<VStack gap={3}>
											<Text type="large" weight="bold">Payment</Text>
											<Text type="supporting" color="secondary">
												All transactions are secure and encrypted.
											</Text>
											<HStack gap={2}>
												<StackItem size="fill">
													<Button
														label="PayPal"
														variant="secondary"
														style={{ backgroundColor: '#ffc439', color: '#003087' }}
														clickAction={() => setPaymentMethod('paypal')}
													/>
												</StackItem>
												<StackItem size="fill">
													<Button
														label="G Pay"
														variant="secondary"
														style={{ backgroundColor: '#000', color: '#fff' }}
														clickAction={() => setPaymentMethod('gpay')}
													/>
												</StackItem>
											</HStack>
											<Divider />
											<Text type="supporting" color="secondary">Or pay with card</Text>
											<RadioList value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? '')} label="Payment method" isLabelHidden>
												<RadioListItem value="card" label="Card" />
												<RadioListItem value="paypal" label="PayPal" />
												<RadioListItem value="gpay" label="Google Pay" />
											</RadioList>
											{paymentMethod === 'card' ? (
												<VStack gap={3}>
													<TextInput
														label="Card number" value={cardNumber} onChange={(v) => setCardNumber(v ?? '')}
														placeholder="4242 4242 4242 4242" status={err('cardNumber')}
													/>
													<TextInput
														label="Name on card" value={cardName} onChange={(v) => setCardName(v ?? '')} status={err('cardName')}
													/>
													<FormLayout direction="horizontal">
														<Selector label="Exp. month" options={MONTHS} value={expiry} onValueChange={(v) => setExpiry(v ?? '')} status={err('expiry')} />
														<Selector label="Exp. year" options={YEARS} value={expYear} onValueChange={(v) => setExpYear(v ?? '')} status={err('expYear')} />
														<TextInput label="CVC" value={cvc} onChange={(v) => setCvc(v ?? '')} placeholder="123" status={err('cvc')} />
													</FormLayout>
												</VStack>
											) : null}
											<CheckboxInput
												label="Billing address is the same as shipping"
												value={billingMatchesShipping}
												onChange={(v) => setBillingMatchesShipping(v ?? '')}
											/>
											{!billingMatchesShipping ? (
												<VStack gap={3}>
													<TextInput label="Billing address" value={billingAddress} onChange={(v) => setBillingAddress(v ?? '')} status={err('billingAddress')} />
													<FormLayout direction="horizontal">
														<TextInput label="City" value={billingCity} onChange={(v) => setBillingCity(v ?? '')} status={err('billingCity')} />
														<Selector label="State" options={US_STATES} value={billingState} onValueChange={(v) => setBillingState(v ?? '')} status={err('billingState')} />
														<TextInput label="ZIP" value={billingZip} onChange={(v) => setBillingZip(v ?? '')} status={err('billingZip')} />
													</FormLayout>
												</VStack>
											) : null}
										</VStack>
										<Divider />

										{/* Gift */}
										<VStack gap={3}>
											<Text type="large" weight="bold">Gift options</Text>
											<CheckboxInput
												label="Add a gift message"
												value={addGiftMessage} onChange={(v) => setAddGiftMessage(v ?? '')}
											/>
											{addGiftMessage ? (
												<VStack gap={3}>
													<FormLayout direction="horizontal">
														<TextInput label="To" value={giftTo} onChange={(v) => setGiftTo(v ?? '')} />
														<TextInput label="From" value={giftFrom} onChange={(v) => setGiftFrom(v ?? '')} />
													</FormLayout>
													<TextArea label="Gift message" rows={3} maxLength={300} value={giftMessage} onChange={(v) => setGiftMessage(v ?? '')} />
												</VStack>
											) : null}
											<VStack gap={2}>
												<HStack gap={2} vAlign="center">
													<Icon name="sandbox-shield-check" size={16} color="secondary" />
													<Text type="supporting" color="secondary">Secure 256-bit SSL encrypted payment</Text>
												</HStack>
												<HStack gap={2} vAlign="center">
													<Icon name="sandbox-lock-closed" size={16} color="secondary" />
													<Text type="supporting" color="secondary">Card details are never stored</Text>
												</HStack>
												<HStack gap={2} vAlign="center">
													<Icon name="sandbox-check-circle" size={16} color="secondary" />
													<Text type="supporting" color="secondary">30-day returns, guaranteed</Text>
												</HStack>
											</VStack>
											<HStack gap={3}>
												<Button label={`Pay ${fmt(total)}`} variant="primary" clickAction={() => setSubmitted(true)} />
												<Button label="Cancel" variant="ghost" clickAction={() => {}} />
											</HStack>
										</VStack>
									</VStack>
								</StackItem>

								{/* Order summary */}
								<StackItem
									style={isMobile ? { order: -1 } : { width: 360, position: 'sticky' as const, top: 'var(--spacing-6)', alignSelf: 'flex-start' as const }}
								>
									<Card padding={5}>
										<VStack gap={4}>
											<Text type="large" weight="bold">Order summary</Text>
											<VStack gap={4}>
												{items.map((item) => (
													<HStack key={item.id} gap={3} vAlign="center">
														<Thumbnail src={item.src} label={item.name} />
														<StackItem size="fill">
															<VStack gap={0.5}>
																<HStack hAlign="between" vAlign="start">
																	<Text type="body" weight="medium" maxLines={1}>{item.name}</Text>
																	<Text type="body" weight="bold">{fmt(item.price * item.qty)}</Text>
																</HStack>
																<Text type="supporting" color="secondary">{item.variant}</Text>
																<NumberInput
																	label={`Quantity for ${item.name}`}
																	isLabelHidden
																	value={item.qty}
																	onValueChange={(v) => setQuantities((q) => ({ ...q, [item.id]: v ?? 0 }))}
																	min={0} max={10} step={1} size="sm"
																/>
															</VStack>
														</StackItem>
													</HStack>
												))}
											</VStack>
											<HStack gap={2}>
												<StackItem size="fill">
													<TextInput label="Promo code" isLabelHidden value={promo} onChange={(v) => setPromo(v ?? '')} placeholder="Promo code" />
												</StackItem>
												<Button label="Apply" variant="secondary" clickAction={() => {}} />
											</HStack>
											<Divider />
											<VStack gap={2}>
												<Text type="large" weight="bold">Order total</Text>
												<HStack hAlign="between">
													<Text type="body" color="secondary">Subtotal</Text>
													<Text type="body">{fmt(subtotal)}</Text>
												</HStack>
												<HStack hAlign="between">
													<Text type="body" color="secondary">Shipping · {delivery.label}</Text>
													<Text type="body">{fmt(shipping)}</Text>
												</HStack>
												<HStack hAlign="between">
													<Text type="body" color="secondary">Tax</Text>
													<Text type="body">{fmt(tax)}</Text>
												</HStack>
												<Divider />
												<HStack hAlign="between">
													<Text type="large" weight="bold">Total</Text>
													<Text type="large" weight="bold">{fmt(total)}</Text>
												</HStack>
											</VStack>
											<HStack gap={2} vAlign="center">
												<Icon name="sandbox-truck" size={16} color="secondary" />
												<Text type="supporting" color="secondary">
													{delivery.window}
												</Text>
											</HStack>
										</VStack>
									</Card>
								</StackItem>
							</Stack>
						</VStack>
					</Section>
				</Center>
			</LayoutContent>
		}
	/>
}
