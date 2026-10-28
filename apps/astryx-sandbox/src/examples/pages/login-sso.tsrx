// Port of upstream templates/pages/login-sso/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/login-sso/.
// GAPS: `type="email"`/`type="password"` → `keyboardType`/`secure`;
// TextInput `onKeyDown` Enter → `onSubmit` (the field's return-key contract);
// Text `as="h2"` → `Heading level={2}` (`type` carries the display scale);
// Button `onClick` → `clickAction`; Link `size`/`type` props unported.
import { useState } from 'octane'
import {
	Avatar, Button, Card, Center, Divider, Heading, HStack, Icon, Link, Section,
	Text, TextInput, VStack,
} from '@octane-xplat/ui'

const BG_URL = '/template-assets/building.png'

const pageStyle = {
	minHeight: '100%',
	backgroundImage: `url(${BG_URL})`,
	backgroundSize: 'cover',
	backgroundPosition: 'center',
}

type SSOProvider = {
	name: string
	abbr: string
}
const SSO_PROVIDERS: Record<string, SSOProvider> = {
	'google.com': { name: 'Google Workspace', abbr: 'G' },
	'microsoft.com': { name: 'Microsoft Entra ID', abbr: 'M' },
	'okta.com': { name: 'Okta', abbr: 'O' },
	'meta.com': { name: 'Meta SSO', abbr: 'M' },
	'apple.com': { name: 'Apple Business', abbr: 'A' },
}

function getProvider(email: string) {
	const domain = email.split('@')[1]?.toLowerCase()
	return domain ? (SSO_PROVIDERS[domain] ?? null) : null
}

function isValidEmail(email: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

type Step = 'email' | 'sso-confirm' | 'password-fallback'

export function LoginSsoTemplate() @{
	const [step, setStep] = useState<Step>('email')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loginFailed, setLoginFailed] = useState(false)
	const [isLoading, setIsLoading] = useState(false)

	const provider = getProvider(email)
	const emailValid = isValidEmail(email)

	const handleContinue = () => {
		if (!emailValid) {
			return
		}
		if (provider) {
			setStep('sso-confirm')
		} else {
			setStep('password-fallback')
		}
	}

	const handleBack = () => {
		setStep('email')
		setLoginFailed(false)
		setIsLoading(false)
	}

	const handleSignIn = () => {
		if (!password) {
			setLoginFailed(true)
			return
		}
		setIsLoading(true)
		setLoginFailed(false)
		setTimeout(() => {
			setIsLoading(false)
			setLoginFailed(true)
		}, 2000)
	}

	<Center axis="both" padding={6} style={pageStyle}>
		<Card padding={8} width="100%" maxWidth={400}>
			<VStack gap={4} hAlign="stretch">
				{/* ── Step 1: Email entry ── */}
				{step === 'email' ? (
					<>
						<VStack gap={1} hAlign="center">
							<Heading level={2} type="display-1">
								Welcome back
							</Heading>
							<Text type="body" color="secondary" size="sm">
								Enter your details to sign in to your account
							</Text>
						</VStack>

						<VStack gap={2}>
							<TextInput
								label="Work email"
								isLabelHidden
								keyboardType="email"
								placeholder="you@company.com"
								value={email}
								onChange={setEmail}
								size="lg"
								onSubmit={handleContinue}
							/>
							<TextInput
								label="Password"
								isLabelHidden
								secure
								placeholder="Password"
								value={password}
								onChange={setPassword}
								size="lg"
							/>
						</VStack>

						<Link href="#" color="secondary">
							Having trouble signing in?
						</Link>

						<Button
							label="Sign in"
							variant="primary"
							size="lg"
							clickAction={handleContinue}
							isDisabled={!emailValid}
						/>

						<Divider label="Or sign in with" />

						<Button
							label="Continue with SSO"
							variant="secondary"
							size="lg"
							clickAction={handleContinue}
							isDisabled={!emailValid}
						/>

						<VStack hAlign="center">
							<Text type="supporting" color="secondary">
								Don’t have an account? <Link href="#">Request access</Link>
							</Text>
						</VStack>
					</>
				) : null}

				{/* ── Step 2a: SSO provider detected ── */}
				{step === 'sso-confirm' && provider ? (
					<>
						<VStack gap={2} hAlign="center">
							<Avatar name={provider.name} size={48} />
							<Heading level={2} type="display-3">
								Sign in with {provider.name}
							</Heading>
							<Text type="body" color="secondary" size="sm">
								You will be redirected back after signing in.
							</Text>
						</VStack>

						<Card padding={0}>
							<Section variant="muted" padding={4}>
								<HStack gap={2} vAlign="center">
									<Icon name="sandbox-shield-check" size={20} color="secondary" />
									<VStack gap={0}>
										<Text type="label">{provider.name}</Text>
										<Text type="supporting" color="secondary">
											{email}
										</Text>
									</VStack>
								</HStack>
							</Section>
						</Card>

						<VStack gap={3}>
							<Button
								label={`Continue with ${provider.name}`}
								variant="primary"
								size="lg"
								isLoading={isLoading}
								clickAction={() => setIsLoading(true)}
							/>
							<Button
								label="Use a different email"
								variant="ghost"
								size="lg"
								clickAction={handleBack}
							/>
						</VStack>
					</>
				) : null}

				{/* ── Step 2b: No SSO — password fallback ── */}
				{step === 'password-fallback' ? (
					<>
						<VStack gap={1} hAlign="center">
							<Heading level={2} type="display-1">
								Welcome back
							</Heading>
							<Text type="body" color="secondary" size="sm">
								{email}
							</Text>
						</VStack>

						<VStack gap={4}>
							<VStack gap={1}>
								<TextInput
									label="Password"
									secure
									value={password}
									size="lg"
									onChange={(v: string) => {
										setPassword(v)
										setLoginFailed(false)
									}}
									status={
										loginFailed
											? { type: 'error', message: 'Incorrect password. Try again.' }
											: undefined
									}
								/>
								{loginFailed ? (
									<VStack hAlign="end">
										<Link href="#" color="secondary">
											Forgot password?
										</Link>
									</VStack>
								) : null}
							</VStack>

							<Button
								label="Sign in"
								variant="primary"
								size="lg"
								isLoading={isLoading}
								clickAction={handleSignIn}
							/>
							<Button
								label="Use a different email"
								variant="ghost"
								size="lg"
								clickAction={handleBack}
							/>
						</VStack>
					</>
				) : null}
			</VStack>
		</Card>
	</Center>
}
