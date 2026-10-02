import type { AnimationResult } from './engine'

export interface PresenceMember {
	exit(): Promise<AnimationResult>
	enter(): void
}

// Membership is explicit: replacing an exit invalidates its completion token.
// Microtask completion lets every child register before an empty/instant exit ends.
export class PresenceState {
	private members = new Set<PresenceMember>()
	private pending = new Map<PresenceMember, number>()
	private sequence = 0
	private generation = 0
	private disposed = false
	private removed = false
	constructor(
		public present: boolean,
		private complete: () => void,
	) {}
	register(member: PresenceMember): () => void {
		this.members.add(member)
		if (!this.present) {
			this.restart(member)
		}

		return () => {
			this.members.delete(member)
			this.pending.delete(member)
			this.check()
		}
	}
	setPresent(present: boolean) {
		if (this.disposed || present === this.present) {
			return
		}

		this.present = present
		++this.generation
		this.removed = false
		this.pending.clear()
		if (present) {
			for (const member of this.members) {
				member.enter()
			}
		} else {
			for (const member of this.members) {
				this.restart(member)
			}

			this.check()
		}
	}
	restart(member: PresenceMember) {
		if (this.disposed || this.present || !this.members.has(member)) {
			return
		}

		const token = ++this.sequence
		this.pending.set(member, token)
		void member.exit().then((result) => {
			if (this.disposed || this.present || this.pending.get(member) !== token) {
				return
			}

			// Replacement is owned by the next restart. Cancellation cannot remove a live subtree.
			if (result !== 'finished') {
				return
			}

			this.pending.delete(member)
			this.check()
		})
	}
	private check() {
		const generation = this.generation
		queueMicrotask(() => {
			if (
				!this.disposed &&
				!this.present &&
				!this.removed &&
				!this.pending.size &&
				generation === this.generation
			) {
				this.removed = true
				this.complete()
			}
		})
	}
	destroy() {
		this.disposed = true
		++this.generation
		this.members.clear()
		this.pending.clear()
	}
}
