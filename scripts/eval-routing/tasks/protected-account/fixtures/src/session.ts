// A tiny stand-in for an authentication service. Keep these exports.
let user: { name: string } | null = null

export function signIn(name: string) {
	user = { name }
}

export function signOut() {
	user = null
}

export function currentUser(): { name: string } | null {
	return user
}
