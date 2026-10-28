// Port of upstream templates/pages/checkout-wizard/page.tsx (Astryx 0.6.4,
// MIT) — route /templates/checkout-wizard/.
// GAPS: upstream sizes the summary column off a host ResizeObserver;
// useMediaQuery approximates at the same 900px breakpoint. Collapsible order
// summary on narrow keeps the same trigger contract.
import { useMemo, useState } from 'octane'
import {
	Banner, Button, Card, CheckboxInput, Collapsible, Divider, FieldStatus,
	FormLayout, Heading, HStack, Icon, Layout, LayoutContent, LayoutHeader,
	LayoutFooter, NumberInput, RadioList, RadioListItem, Selector,
	StackItem, Step, Stepper, Text, TextArea, TextInput, Thumbnail,
	useMediaQuery, VStack, pixel,
} from '@octane-xplat/ui'

const STEPS = [
	{ label: 'Cart', icon: 'sandbox-shopping-cart' },
	{ label: 'Shipping', icon: 'sandbox-map-pin' },
	{ label: 'Delivery', icon: 'sandbox-truck' },
	{ label: 'Payment', icon: 'sandbox-credit-card' },
]

const CART_ITEMS = [
	{ id: 'mug', name: 'Speckled Stoneware Mug', variant: 'Hand-thrown · 12 oz', price: 78, qty: 2, src: '/template-assets/light-product-1.png', isLimited: false },
	{ id: 'plate', name: 'Stoneware Dinner Plate', variant: 'Reactive glaze · 10 in', price: 72, qty: 1, src: '/template-assets/light-product-4.png', isLimited: false },
	{ id: 'bowl', name: 'Cereal Bowl', variant: 'Speckled clay · 6 in', price: 80, qty: 1, src: '/template-assets/light-product-5.png', isLimited: true },
]

const COUNTRIES = [
	{ value: 'us', label: 'United States' },
	{ value: 'ca', label: 'Canada' },
	{ value: 'uk', label: 'United Kingdom' },
]

const US_STATES = ['California', 'Illinois', 'Massachusetts', 'New York', 'Oregon', 'Texas', 'Washington']

const DELIVERY_OPTIONS = [
	{ value: 'standard', label: 'Standard', window: '3–7 business days', price: 4.95 },
	{ value: 'expedited', label: 'Expedited', window: '1–2 business days', price: 9.95 },
	{ value: 'overnight', label: 'Overnight', window: 'Next business day by 5pm', price: 24.95 },
]

const PROMOS: Record<string, { label: string; rate: number }> = {
	WELCOME10: { label: 'WELCOME10 · 10% off', rate: 0.1 },
	CLAY20: { label: 'CLAY20 · 20% off', rate: 0.2 },
}

const TAX_RATE = 0.08
const FREE_SHIPPING_THRESHOLD = 300
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const POSTAL_CODE_RULES: Record<string, { label: string; pattern: RegExp; error: string }> = {
	us: { label: 'ZIP code', pattern: /^\d{5}(-\d{4})?$/, error: 'Enter a ZIP like 97205 or 97205-4417.' },
	ca: { label: 'Postal code', pattern: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, error: 'Enter a postal code like K1A 0B1.' },
	uk: { label: 'Postcode', pattern: /^.+$/, error: 'Enter a postcode.' },
}

const blockedMessage = (count: number) =>
	count === 1 ? 'One problem above needs fixing first.' : `${count} problems above need fixing first.`

const money = (n: number) => `$${n.toFixed(2)}`

export function CheckoutWizardTemplate() @{
	const isNarrow = useMediaQuery('(max-width: 900px)')

	const [step, setStep] = useState(0)
	const [attempted, setAttempted] = useState<ReadonlySet<number>>(new Set())
	const [isComplete, setIsComplete] = useState(false)

	const [quantities, setQuantities] = useState<Record<string, number>>(() =>
		Object.fromEntries(CART_ITEMS.map((item) => [item.id, item.qty])),
	)
	const [promoInput, setPromoInput] = useState('')
	const [promoWasChecked, setPromoWasChecked] = useState(false)
	const [appliedPromo, setAppliedPromo] = useState<string | null>(null)

	const [email, setEmail] = useState('')
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [address, setAddress] = useState('')
	const [apartment, setApartment] = useState('')
	const [city, setCity] = useState('')
	const [state, setState] = useState('')
	const [postalCode, setPostalCode] = useState('')
	const [country, setCountry] = useState('us')

	const [delivery, setDelivery] = useState('standard')
	const [deliveryNote, setDeliveryNote] = useState('')
	const [isGift, setIsGift] = useState(false)

	const [cardNumber, setCardNumber] = useState('')
	const [cardName, setCardName] = useState('')
	const [expiry, setExpiry] = useState('')
	const [cvc, setCvc] = useState('')
	const [billingMatches, setBillingMatches] = useState(true)

	const items = CART_ITEMS.map((item) => ({ ...item, qty: quantities[item.id] ?? item.qty })).filter((item) => item.qty > 0)
	const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
	const promo = appliedPromo ? PROMOS[appliedPromo] : undefined
	const discount = promo ? subtotal * promo.rate : 0
	const deliveryOption = DELIVERY_OPTIONS.find((o) => o.value === delivery) ?? DELIVERY_OPTIONS[0]
	const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD && delivery === 'standard' ? 0 : deliveryOption.price
	const tax = (subtotal - discount) * TAX_RATE
	const total = subtotal - discount + shipping + tax
	const itemCount = items.reduce((sum, item) => sum + item.qty, 0)
	const postalRule = POSTAL_CODE_RULES[country] ?? POSTAL_CODE_RULES.us

	const errorsByStep = useMemo<Array<Record<string, string>>>(() => {
		const cart: Record<string, string> = {}
		if (items.length === 0) {cart.items = 'Your cart is empty.'}

		const shippingStep: Record<string, string> = {}
		if (!EMAIL_PATTERN.test(email)) {shippingStep.email = 'Enter an email address for order updates.'}
		if (!firstName.trim()) {shippingStep.firstName = 'Required'}
		if (!lastName.trim()) {shippingStep.lastName = 'Required'}
		if (!address.trim()) {shippingStep.address = 'Required'}
		if (!city.trim()) {shippingStep.city = 'Required'}
		if (country === 'us' && !state) {shippingStep.state = 'Required'}
		if (!postalRule.pattern.test(postalCode.trim())) {shippingStep.postalCode = postalRule.error}

		const payment: Record<string, string> = {}
		if (cardNumber.replace(/\D/g, '').length < 15) {payment.cardNumber = 'Enter the full card number.'}
		if (!cardName.trim()) {payment.cardName = 'Required'}
		if (!/^\d{2}\s?\/\s?\d{2}$/.test(expiry.trim())) {payment.expiry = 'Use MM/YY.'}
		if (cvc.trim().length < 3) {payment.cvc = 'Use the 3–4 digit code.'}

		return [cart, shippingStep, {}, payment]
	}, [items.length, email, firstName, lastName, address, city, state, country, postalCode, cardNumber, cardName, expiry, cvc, postalRule])

	const shownErrors = (index: number) => (attempted.has(index) ? errorsByStep[index] : {})
	const currentErrors = shownErrors(step)
	const isLastStep = step === STEPS.length - 1

	const goNext = () => {
		setAttempted((prev) => new Set(prev).add(step))
		if (Object.keys(errorsByStep[step]).length !== 0) {return}
		if (isLastStep) {
			setIsComplete(true)
			return
		}
		setStep((s) => s + 1)
	}

	const applyPromo = () => {
		const code = promoInput.trim().toUpperCase()
		setPromoWasChecked(true)
		setAppliedPromo(PROMOS[code] ? code : null)
	}

	const summaryBody = (
		<VStack gap={3}>
			{items.map((item) => (
				<HStack key={item.id} gap={3} vAlign="center">
					<Thumbnail src={item.src} label={item.name} />
					<StackItem size="fill">
						<Text type="body" maxLines={1}>{item.name}</Text>
						<Text type="supporting" color="secondary">Qty {item.qty}</Text>
					</StackItem>
					<Text type="body">{money(item.price * item.qty)}</Text>
				</HStack>
			))}
			<Divider />
			<HStack hAlign="between">
				<Text type="body" color="secondary">Subtotal</Text>
				<Text type="body">{money(subtotal)}</Text>
			</HStack>
			{discount > 0 ? (
				<HStack hAlign="between">
					<Text type="body" color="secondary">Discount · {promo?.label}</Text>
					<Text type="body" style={{ color: 'var(--color-text-success, #067647)' }}>−{money(discount)}</Text>
				</HStack>
			) : null}
			<HStack hAlign="between">
				<Text type="body" color="secondary">Shipping</Text>
				<Text type="body">{shipping === 0 ? 'Free' : money(shipping)}</Text>
			</HStack>
			<HStack hAlign="between">
				<Text type="body" color="secondary">Estimated tax</Text>
				<Text type="body">{money(tax)}</Text>
			</HStack>
			<Divider />
			<HStack hAlign="between" vAlign="center">
				<Text type="label">Total</Text>
				<Heading level={3}>{money(total)}</Heading>
			</HStack>
		</VStack>
	)

	const summaryCard = isNarrow ? (
		<Collapsible
			trigger={`Order summary · ${money(total)}`}
			defaultOpen={false}
		>
			<VStack paddingBlockStart={3}>{summaryBody}</VStack>
		</Collapsible>
	) : (
		<Card padding={5}>
			<VStack gap={4}>
				<Text type="label">Order summary</Text>
				{summaryBody}
			</VStack>
		</Card>
	)

	const actions = (
		<HStack gap={3} vAlign="center">
			<Button
				label={step === 0 ? 'Continue shopping' : 'Back'}
				variant="secondary"
				clickAction={() => setStep((s) => Math.max(0, s - 1))}
			/>
			<StackItem size="fill" />
			{Object.keys(currentErrors).length > 0 ? (
				<FieldStatus type="error" variant="detached" message={blockedMessage(Object.keys(currentErrors).length)} />
			) : null}
			<Button
				label={isLastStep ? `Place order · ${money(total)}` : 'Continue'}
				variant="primary"
				clickAction={goNext}
			/>
		</HStack>
	)

	<Layout
		height="fill"
		header={
			<LayoutHeader padding={6} hasDivider>
				<VStack gap={6}>
					<HStack gap={3} vAlign="center">
						<StackItem size="fill">
							<Heading level={1}>Checkout</Heading>
						</StackItem>
						<Text type="supporting" color="secondary">
							{itemCount} {itemCount === 1 ? 'item' : 'items'} · {money(total)}
						</Text>
					</HStack>
					<Stepper
						activeStep={step}
						orientation="horizontal"
						onStepClick={(index) => {
							if (index > step) {setAttempted((prev) => new Set(prev).add(step))}
							setStep(index)
						}}
						accessibilityLabel="Checkout progress"

						indicatorPosition="on-track"
					>
						{STEPS.map((s, i) => (
							<Step
								key={s.label}
								step={i}
								label={s.label}
								status={Object.keys(shownErrors(i)).length > 0 ? 'error' : undefined}
							/>
						))}
					</Stepper>
				</VStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent>
				<Layout
					content={
						<VStack gap={6} padding={isNarrow ? 4 : 6}>
							{isNarrow ? summaryCard : null}
							{isComplete ? (
								<VStack gap={4}>
									<Banner status="success" title="Order placed" />
									<Heading level={2}>Thanks for your order</Heading>
									<Text type="body" color="secondary">
										Order #TC-48291 is confirmed. A receipt is on its way to{' '}
										{email || 'your inbox'} — delivery {deliveryOption.window.toLowerCase()}.
									</Text>
								</VStack>
							) : null}

							{!isComplete && step === 0 ? (
								<VStack gap={5}>
									<VStack gap={1}>
										<Heading level={2}>Review your cart</Heading>
										<Text type="supporting" color="secondary">
											Quantities update the summary on the right. Free standard shipping over {money(FREE_SHIPPING_THRESHOLD)}.
										</Text>
									</VStack>
									{currentErrors.items ? (
										<Banner status="error" title={currentErrors.items} />
									) : null}
									<VStack gap={4}>
										{items.map((item) => (
											<HStack key={item.id} gap={4} vAlign="center">
												<Thumbnail src={item.src} label={item.name} />
												<StackItem size="fill">
													<VStack gap={0.5}>
														<Text type="label" maxLines={1}>{item.name}</Text>
														<Text type="supporting" color="secondary">{item.variant}</Text>
														{item.isLimited ? (
															<Text type="supporting" style={{ color: 'var(--color-text-warning, #b54708)' }}>Only a few left</Text>
														) : null}
													</VStack>
												</StackItem>
												<NumberInput
													label={`Quantity for ${item.name}`}
													isLabelHidden
													value={item.qty}
													onValueChange={(v) => setQuantities((q) => ({ ...q, [item.id]: v ?? 0 }))}
													min={0} max={10} step={1}
												/>
												<Text type="body" style={{ width: 64, textAlign: 'right' }}>
													{money(item.price * item.qty)}
												</Text>
												<Button
													label={`Remove ${item.name}`}
													variant="ghost" size="sm"
													icon={<Icon name="sandbox-x-mark" size={16} />}
													clickAction={() => setQuantities((q) => ({ ...q, [item.id]: 0 }))}
												/>
											</HStack>
										))}
									</VStack>
									<Divider />
									<VStack gap={2}>
										<HStack gap={2} vAlign="end">
											<StackItem size="fill">
												<TextInput
													label="Promo code"
													value={promoInput}
													onChange={(v) => setPromoInput(v ?? '')}
													placeholder="WELCOME10"
												/>
											</StackItem>
											<Button label="Apply" variant="secondary" clickAction={applyPromo} />
										</HStack>
										{promoWasChecked && !appliedPromo ? (
											<Text type="supporting" style={{ color: 'var(--color-text-error, #d92d20)' }}>That code is not valid.</Text>
										) : null}
										{appliedPromo ? (
											<Text type="supporting" style={{ color: 'var(--color-text-success, #067647)' }}>{PROMOS[appliedPromo].label} applied.</Text>
										) : null}
									</VStack>
								</VStack>
							) : null}

							{!isComplete && step === 1 ? (
								<FormLayout defaultOptionality="optional">
									<VStack gap={1}>
										<Heading level={2}>Where should it go?</Heading>
										<Text type="supporting" color="secondary">
											We only use these details to deliver this order.
										</Text>
									</VStack>
									<TextInput
										label="Email" isRequired value={email} onChange={(v) => setEmail(v ?? '')}
										placeholder="you@example.com"
										status={currentErrors.email ? { type: 'error', message: currentErrors.email } : undefined}
									/>
									<FormLayout direction={isNarrow ? 'vertical' : 'horizontal'} defaultOptionality="optional">
										<TextInput
											label="First name" isRequired value={firstName} onChange={(v) => setFirstName(v ?? '')}
											status={currentErrors.firstName ? { type: 'error', message: currentErrors.firstName } : undefined}
										/>
										<TextInput
											label="Last name" isRequired value={lastName} onChange={(v) => setLastName(v ?? '')}
											status={currentErrors.lastName ? { type: 'error', message: currentErrors.lastName } : undefined}
										/>
									</FormLayout>
									<Selector
										label="Country" options={COUNTRIES} value={country} onValueChange={(v) => setCountry(v ?? '')}
									/>
									<TextInput
										label="Address" isRequired value={address} onChange={(v) => setAddress(v ?? '')}
										placeholder="Street and number"
										status={currentErrors.address ? { type: 'error', message: currentErrors.address } : undefined}
									/>
									<TextInput
										label="Apartment, suite, etc." value={apartment} onChange={(v) => setApartment(v ?? '')}
									/>
									<FormLayout direction={isNarrow ? 'vertical' : 'horizontal'} defaultOptionality="optional">
										<TextInput
											label="City" isRequired value={city} onChange={(v) => setCity(v ?? '')}
											status={currentErrors.city ? { type: 'error', message: currentErrors.city } : undefined}
										/>
										{country === 'us' ? (
											<Selector
												label="State" isRequired options={US_STATES.map((s) => ({ value: s, label: s }))}
												value={state} onValueChange={(v) => setState(v ?? '')}
												status={currentErrors.state ? { type: 'error', message: currentErrors.state } : undefined}
											/>
										) : null}
										<TextInput
											label={postalRule.label} isRequired value={postalCode} onChange={(v) => setPostalCode(v ?? '')}
											status={currentErrors.postalCode ? { type: 'error', message: currentErrors.postalCode } : undefined}
										/>
									</FormLayout>
								</FormLayout>
							) : null}

							{!isComplete && step === 2 ? (
								<FormLayout defaultOptionality="optional">
									<VStack gap={1}>
										<Heading level={2}>How fast do you need it?</Heading>
										<Text type="supporting" color="secondary">
											Delivery estimates start the day your order ships.
										</Text>
									</VStack>
									<RadioList value={delivery} onValueChange={(v) => setDelivery(v ?? '')} label="Delivery speed" isLabelHidden>
										{DELIVERY_OPTIONS.map((o) => (
											<RadioListItem
												key={o.value}
												value={o.value}
												label={o.label}
												description={`${o.window} · ${o.price === 0 ? 'Free' : money(o.price)}`}
											/>
										))}
									</RadioList>
									<Divider />
									<CheckboxInput
										label="This order is a gift"
										value={isGift}
										onChange={(v) => setIsGift(v ?? '')}
										description="No prices on the packing slip."
									/>
									{isGift ? (
										<TextArea
											label="Gift note" rows={2} maxLength={200} value={deliveryNote} onChange={(v) => setDeliveryNote(v ?? '')}
											placeholder="Happy birthday — hope the glaze matches the kitchen."
										/>
									) : null}
								</FormLayout>
							) : null}

							{!isComplete && step === 3 ? (
								<FormLayout defaultOptionality="optional">
									<VStack gap={1}>
										<Heading level={2}>Payment</Heading>
										<Text type="supporting" color="secondary">
											This is a demo checkout — nothing is charged.
										</Text>
									</VStack>
									<TextInput
										label="Card number" isRequired value={cardNumber} onChange={(v) => setCardNumber(v ?? '')}
										placeholder="4242 4242 4242 4242"
										status={currentErrors.cardNumber ? { type: 'error', message: currentErrors.cardNumber } : undefined}
									/>
									<TextInput
										label="Name on card" isRequired value={cardName} onChange={(v) => setCardName(v ?? '')}
										status={currentErrors.cardName ? { type: 'error', message: currentErrors.cardName } : undefined}
									/>
									<FormLayout direction={isNarrow ? 'vertical' : 'horizontal'} defaultOptionality="optional">
										<TextInput
											label="Expiry" isRequired value={expiry} onChange={(v) => setExpiry(v ?? '')}
											placeholder="MM/YY"
											status={currentErrors.expiry ? { type: 'error', message: currentErrors.expiry } : undefined}
										/>
										<TextInput
											label="CVC" isRequired value={cvc} onChange={(v) => setCvc(v ?? '')}
											placeholder="123"
											status={currentErrors.cvc ? { type: 'error', message: currentErrors.cvc } : undefined}
										/>
									</FormLayout>
									<Divider />
									<CheckboxInput
										label="Billing address is the same as shipping"
										value={billingMatches}
										onChange={(v) => setBillingMatches(v ?? '')}
									/>
									<Banner
										status="info"
										title="Secure checkout"
										description="Card details are encrypted in transit and never stored on this page."
									/>
								</FormLayout>
							) : null}

							{!isComplete ? actions : null}
						</VStack>
					}
					end={isNarrow ? undefined : <StackItem style={{ width: 340, padding: 6 }}>{summaryCard}</StackItem>}
				/>
			</LayoutContent>
		}
	/>
}
