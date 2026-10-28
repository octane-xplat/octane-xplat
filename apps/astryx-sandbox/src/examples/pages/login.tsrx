// Port of upstream templates/pages/login/page.tsx (Astryx 0.6.4, MIT) — route /templates/login/.
// GAPS: `type="email"`/`type="password"` → `keyboardType`/`secure`; Button
// `onClick` → `clickAction`; Banner `container="card"` has no equivalent
// ('banner'|'section' only) — omitted.
import { useState } from 'octane'
import { Banner, Button, Card, Center, Heading, Icon, Text, TextInput, VStack } from '@octane-xplat/ui'

// Standalone auth page paints its own body background (no host shell).
const pageStyle = {
	minHeight: '100%',
	backgroundColor: 'var(--color-background-body)',
}
// Cap the column at 400px but let it shrink to fit narrow screens.
const contentStyle = {
	width: '100%',
	maxWidth: 400,
}

export function LoginTemplate() @{
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSignIn = () => {
		setError('')
		if (!email || !password) {
			setError('Please enter both email and password.')
			return
		}
		setIsLoading(true)
		setTimeout(() => setIsLoading(false), 2000)
	}

	<Center axis="both" padding={6} style={pageStyle}>
		<VStack gap={4} hAlign="center" style={contentStyle}>
			{/* Logo */}
			<VStack gap={2} hAlign="center">
				<Icon name="sandbox-cube" size={24} />
				<Text type="body" weight="bold" size="lg">
					Product Inc.
				</Text>
			</VStack>

			{/* Card */}
			<Card padding={8} width="100%">
				<VStack gap={4} hAlign="stretch">
					<VStack gap={1} hAlign="center">
						<Heading level={2}>Sign in</Heading>
						<Text type="body" color="secondary" size="sm">
							Enter your credentials to continue
						</Text>
					</VStack>

					{error ? <Banner status="error" title={error} /> : null}

					<TextInput
						label="Email"
						value={email}
						onChange={setEmail}
						placeholder="you@example.com"
						keyboardType="email"
						size="lg"
					/>

					<TextInput
						label="Password"
						value={password}
						onChange={setPassword}
						placeholder="Enter your password"
						secure
						size="lg"
					/>

					<Button
						label="Sign in"
						variant="primary"
						size="lg"
						isLoading={isLoading}
						clickAction={handleSignIn}
					/>
				</VStack>
			</Card>
		</VStack>
	</Center>
}
