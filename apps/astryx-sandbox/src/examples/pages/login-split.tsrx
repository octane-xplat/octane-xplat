// Port of upstream templates/pages/login-split/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/login-split/.
// GAPS: `type="email"`/`type="password"` → `keyboardType`/`secure`; Button
// `onClick` → `clickAction`; Link `size`/`type` props unported (surrounding
// Text carries `type="supporting"`); Grid `gap`/`align`/`justify` are not
// props — they move into style. The @container rules live in
// styles/login-split.css.
import { useState } from 'octane'
import {
	Button, Card, Center, Divider, EmptyState, Grid, Heading, HStack, Icon, Link, Section,
	StackItem, Text, TextInput, VStack,
} from '@octane-xplat/ui'
import './styles/login-split.css'

const COVER_IMAGE_URL = '/template-assets/light-working-vertical-1.png'
const APPLE_LOGO_URL = '/template-assets/AppleLogo.png'
const GOOGLE_LOGO_URL = '/template-assets/GoogleLogo.png'

// Grid emits minmax(MIN, 1fr) where MIN is a hard floor, so MIN plus the
// grid inset and page padding must fit the narrowest phone or the column is
// clipped. 320 − 2×24 (page) − 2×16 (stacked inset) = 240.
const COLUMN_MIN_WIDTH = 240
// minHeight:100% fills the host so the centered card never leaves an unpainted
// band; Center's padding prop keeps it off the surface edges.
const pageStyle = {
	minHeight: '100%',
	backgroundColor: 'var(--color-background-body)',
}
const cardWrap = {
	width: '100%',
	maxWidth: 1000,
	marginInline: 'auto',
}
const coverImage = {
	width: '100%',
	height: '100%',
	objectFit: 'cover' as const,
}

export function LoginSplitTemplate() @{
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loginFailed, setLoginFailed] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [isSuccess, setIsSuccess] = useState(false)

	const handleLogin = () => {
		if (!email || !password) {
			setLoginFailed(true)
			return
		}
		setIsLoading(true)
		setLoginFailed(false)
		setTimeout(() => {
			setIsLoading(false)
			setIsSuccess(true)
		}, 2000)
	}

	<Center axis="both" padding={6} style={pageStyle}>
		<VStack gap={4} width="100%">
			<div style={cardWrap}>
				<Card padding={0} width="100%">
					<Grid
						columns={{ minWidth: COLUMN_MIN_WIDTH, repeat: 'fit' }}
						style={{ gap: 32, alignItems: 'stretch' }}
						className="tp-login-split-grid">
						{/* Form */}
						<Section variant="transparent" padding={0} height="100%">
							<VStack gap={4} height="100%">
								<HStack gap={2} vAlign="center">
									<Icon name="sandbox-squares-plus" size={20} />
									<Text type="body" weight="bold">
										Product Inc.
									</Text>
								</HStack>

								<StackItem size="fill">
									<Center axis="vertical" height="100%">
										{isSuccess ? (
											<EmptyState
												title="You're signed in"
												description="Redirecting to your dashboard…"
												icon={<Icon name="sandbox-check-circle" size={24} />}
											/>
										) : (
											<VStack gap={4} hAlign="stretch" width="100%">
												<VStack gap={1}>
													<Heading level={2} type="display-1">
														Welcome back
													</Heading>
													<Text type="body" color="secondary" size="sm">
														Login to your Product Inc. account
													</Text>
												</VStack>

												<VStack gap={2}>
													<TextInput
														label="Email"
														isLabelHidden
														keyboardType="email"
														placeholder="name@company.com"
														value={email}
														onChange={setEmail}
														size="lg"
													/>
													<VStack gap={1}>
														<TextInput
															label="Password"
															isLabelHidden
															placeholder="Enter your password"
															secure
															value={password}
															onChange={(v: string) => {
																setPassword(v)
																setLoginFailed(false)
															}}
															size="lg"
															status={
																loginFailed
																	? { type: 'error', message: 'Incorrect password. Try again.' }
																	: undefined
															}
														/>
														{loginFailed ? (
															<VStack hAlign="end">
																<Link href="#" color="secondary">
																	Forgot your password?
																</Link>
															</VStack>
														) : null}
													</VStack>
												</VStack>

												<Button
													label="Login"
													variant="primary"
													size="lg"
													isLoading={isLoading}
													clickAction={handleLogin}
												/>

												<Divider label="Or continue with" />

												<Grid columns={2} style={{ gap: 12, justifyItems: 'stretch' }}>
													<Button
														label="Apple"
														variant="secondary"
														icon={<img src={APPLE_LOGO_URL} alt="" width={16} height={16} />}
														size="lg"
													/>
													<Button
														label="Google"
														variant="secondary"
														icon={<img src={GOOGLE_LOGO_URL} alt="" width={16} height={16} />}
														size="lg"
													/>
												</Grid>
											</VStack>
										)}
									</Center>
								</StackItem>

								{!isSuccess ? (
									<Text type="supporting" color="secondary">
										Don’t have an account? <Link href="#">Sign up</Link>
									</Text>
								) : null}
							</VStack>
						</Section>

						{/* Cover image — the transparent Card clips it to rounded
						    corners (overflow:clip + radius), so the image needs no radius. */}
						<div className="tp-login-split-image">
							<Card variant="transparent" padding={0} width="100%" height="100%">
								<img
									style={coverImage}
									src={COVER_IMAGE_URL}
									alt="Two people working at a desk"
								/>
							</Card>
						</div>
					</Grid>
				</Card>
			</div>

			<VStack hAlign="center">
				<Text type="supporting" color="secondary">
					By clicking continue, you agree to our <Link href="#">Terms of Service</Link> and{' '}
					<Link href="#">Privacy Policy</Link>.
				</Text>
			</VStack>
		</VStack>
	</Center>
}
