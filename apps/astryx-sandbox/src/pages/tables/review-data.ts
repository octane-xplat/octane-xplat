// Copyright (c) Meta Platforms, Inc. and affiliates. MIT. Astryx 0.6.4.
export interface ReviewRow extends Record<string, unknown> {
	id: string
	title: string
	prId: string
	lines: number
	reviewTime: string
	authorName: string
	authorAvatar: string
	reviewerAvatars: string[]
	testStatus: 'passed' | 'failed'
	created: string
	status: 'Needs review' | 'Waiting on author' | 'Changes planned' | 'Accepted'
}

// =============================================================================
// Mock Data
// =============================================================================

export const waitingForAWhile: ReviewRow[] = [
	{
		id: '1',
		title: '[astryx][FilterTokenList]: Promote out of beta',
		prId: 'PR-1042',
		lines: 3,
		reviewTime: '<20sec review',
		authorName: 'Alice Chen',
		authorAvatar: 'https://i.pravatar.cc/36?img=1',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=5', 'https://i.pravatar.cc/36?img=6'],
		testStatus: 'passed',
		created: 'Feb 24, 2025',
		status: 'Waiting on author',
	},
	{
		id: '2',
		title: '[astryx][Table] Fix column resize regression on Safari',
		prId: 'PR-1038',
		lines: 47,
		reviewTime: '~3min review',
		authorName: 'Bob Martinez',
		authorAvatar: 'https://i.pravatar.cc/36?img=2',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=7'],
		testStatus: 'failed',
		created: 'Feb 23, 2025',
		status: 'Changes planned',
	},
]

export const needsCodeReview: ReviewRow[] = [
	{
		id: '3',
		title: '[astryx][Avatar] Add AvatarStatusDot size scaling',
		prId: 'PR-1055',
		lines: 128,
		reviewTime: '~8min review',
		authorName: 'Carol Wu',
		authorAvatar: 'https://i.pravatar.cc/36?img=3',
		reviewerAvatars: [
			'https://i.pravatar.cc/36?img=8',
			'https://i.pravatar.cc/36?img=9',
			'https://i.pravatar.cc/36?img=10',
		],
		testStatus: 'passed',
		created: '19 hours ago',
		status: 'Needs review',
	},
	{
		id: '4',
		title: '[astryx][Badge] Introduce error variant with icon slot',
		prId: 'PR-1061',
		lines: 52,
		reviewTime: '~2min review',
		authorName: 'Dan Kim',
		authorAvatar: 'https://i.pravatar.cc/36?img=4',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=11'],
		testStatus: 'passed',
		created: '14 hours ago',
		status: 'Needs review',
	},
	{
		id: '5',
		title: '[astryx][Collapsible] Animate height transitions with CSS',
		prId: 'PR-1063',
		lines: 210,
		reviewTime: '~12min review',
		authorName: 'Eve Patel',
		authorAvatar: 'https://i.pravatar.cc/36?img=12',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=5', 'https://i.pravatar.cc/36?img=13'],
		testStatus: 'passed',
		created: '8 hours ago',
		status: 'Needs review',
	},
	{
		id: '6',
		title: '[astryx][TextInput] Add clearable prop with trailing icon',
		prId: 'PR-1067',
		lines: 34,
		reviewTime: '<1min review',
		authorName: 'Frank Lee',
		authorAvatar: 'https://i.pravatar.cc/36?img=14',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=6'],
		testStatus: 'failed',
		created: '5 hours ago',
		status: 'Needs review',
	},
	{
		id: '7',
		title: '[astryx][Layout] Support sticky header in LayoutHeader',
		prId: 'PR-1070',
		lines: 89,
		reviewTime: '~5min review',
		authorName: 'Grace Tan',
		authorAvatar: 'https://i.pravatar.cc/36?img=15',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=7', 'https://i.pravatar.cc/36?img=8'],
		testStatus: 'passed',
		created: '2 hours ago',
		status: 'Needs review',
	},
]

export const acceptedAndReady: ReviewRow[] = [
	{
		id: '8',
		title: '[astryx][StatusDot] Add isPulsing animation support',
		prId: 'PR-1048',
		lines: 22,
		reviewTime: '<30sec review',
		authorName: 'Hank Zhou',
		authorAvatar: 'https://i.pravatar.cc/36?img=9',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=1', 'https://i.pravatar.cc/36?img=2'],
		testStatus: 'passed',
		created: 'Feb 25, 2025',
		status: 'Accepted',
	},
	{
		id: '9',
		title: '[astryx][Card] Add isFullBleed prop for edge-to-edge content',
		prId: 'PR-1051',
		lines: 15,
		reviewTime: '<20sec review',
		authorName: 'Iris Nakamura',
		authorAvatar: 'https://i.pravatar.cc/36?img=10',
		reviewerAvatars: ['https://i.pravatar.cc/36?img=3'],
		testStatus: 'passed',
		created: 'Feb 26, 2025',
		status: 'Accepted',
	},
]
