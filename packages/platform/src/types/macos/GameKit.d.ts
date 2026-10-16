import type { NSImage, NSWindow } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type {
	NSArray,
	NSCoder,
	NSCoding,
	NSCopying,
	NSData,
	NSDate,
	NSError,
	NSSecureCoding,
	NSURL,
	_NSRange,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSResponder, NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const GKPlayerIDNoLongerAvailable: string

export declare const GKPlayerAuthenticationDidChangeNotificationName: string

export declare const GKTurnTimeoutNone: number

export declare const GKPlayerDidChangeNotificationName: string

export declare const GKErrorDomain: string

export declare const GKVoiceChatServiceErrorDomain: string

export declare const GKSessionErrorDomain: string

export declare const GKExchangeTimeoutNone: number

export declare const GKTurnTimeoutDefault: number

export declare const GKGameSessionErrorDomain: string

export declare const GKExchangeTimeoutDefault: number

export declare const GKMatchType: {
	PeerToPeer: 0
	Hosted: 1
	TurnBased: 2
}

export declare const GKTransportType: {
	Unreliable: 0
	Reliable: 1
}

export declare const GKVoiceChatPlayerState: {
	Connected: 0
	Disconnected: 1
	Speaking: 2
	Silent: 3
	Connecting: 4
}

export declare const GKPeerConnectionState: {
	Available: 0
	Unavailable: 1
	Connected: 2
	Disconnected: 3
	Connecting: 4
	ConnectedRelay: 5
}

export declare const GKMatchSendDataMode: {
	Reliable: 0
	Unreliable: 1
}

export declare const GKInviteRecipientResponse: {
	InviteRecipientResponseAccepted: 0
	InviteRecipientResponseDeclined: 1
	InviteRecipientResponseFailed: 2
	InviteRecipientResponseIncompatible: 3
	InviteRecipientResponseUnableToConnect: 4
	InviteRecipientResponseNoAnswer: 5
	InviteeResponseAccepted: 0
	InviteeResponseDeclined: 1
	InviteeResponseFailed: 2
	InviteeResponseIncompatible: 3
	InviteeResponseUnableToConnect: 4
	InviteeResponseNoAnswer: 5
}

export declare const GKAccessPointLocation: {
	TopLeading: 0
	TopTrailing: 1
	BottomLeading: 2
	BottomTrailing: 3
}

export declare const GKLeaderboardType: {
	Classic: 0
	Recurring: 1
}

export declare const GKLeaderboardPlayerScope: {
	Global: 0
	FriendsOnly: 1
}

export declare const GKLeaderboardTimeScope: {
	Today: 0
	Week: 1
	AllTime: 2
}

export declare const GKPhotoSize: {
	Small: 0
	Normal: 1
}

export declare const GKErrorCode: {
	Unknown: 1
	Cancelled: 2
	CommunicationsFailure: 3
	UserDenied: 4
	InvalidCredentials: 5
	NotAuthenticated: 6
	AuthenticationInProgress: 7
	InvalidPlayer: 8
	ScoreNotSet: 9
	ParentalControlsBlocked: 10
	PlayerStatusExceedsMaximumLength: 11
	PlayerStatusInvalid: 12
	MatchRequestInvalid: 13
	Underage: 14
	GameUnrecognized: 15
	NotSupported: 16
	InvalidParameter: 17
	UnexpectedConnection: 18
	ChallengeInvalid: 19
	TurnBasedMatchDataTooLarge: 20
	TurnBasedTooManySessions: 21
	TurnBasedInvalidParticipant: 22
	TurnBasedInvalidTurn: 23
	TurnBasedInvalidState: 24
	InvitationsDisabled: 25
	PlayerPhotoFailure: 26
	UbiquityContainerUnavailable: 27
	MatchNotConnected: 28
	GameSessionRequestInvalid: 29
	RestrictedToAutomatch: 30
	APINotAvailable: 31
	NotAuthorized: 32
	ConnectionTimeout: 33
	APIObsolete: 34
}

export declare const GKPlayerConnectionState: {
	Unknown: 0
	Connected: 1
	Disconnected: 2
}

export declare const GKChallengeState: {
	Invalid: 0
	Pending: 1
	Completed: 2
	Declined: 3
}

export declare const GKTurnBasedParticipantStatus: {
	Unknown: 0
	Invited: 1
	Declined: 2
	Matching: 3
	Active: 4
	Done: 5
}

export declare const GKSessionMode: {
	Server: 0
	Client: 1
	Peer: 2
}

export declare const GKConnectionState: {
	Not: 0
	GKConnectionStateConnected: 1
}

export declare const GKTurnBasedMatchStatus: {
	Unknown: 0
	Open: 1
	Ended: 2
	Matching: 3
}

export declare const GKTurnBasedExchangeStatus: {
	Unknown: 0
	Active: 1
	Complete: 2
	Resolved: 3
	Canceled: 4
}

export declare const GKGameSessionErrorCode: {
	Unknown: 1
	NotAuthenticated: 2
	SessionConflict: 3
	SessionNotShared: 4
	ConnectionCancelledByUser: 5
	ConnectionFailed: 6
	SessionHasMaxConnectedPlayers: 7
	SendDataNotConnected: 8
	SendDataNoRecipients: 9
	SendDataNotReachable: 10
	SendRateLimitReached: 11
	BadContainer: 12
	CloudQuotaExceeded: 13
	NetworkFailure: 14
	CloudDriveDisabled: 15
	InvalidSession: 16
}

export declare const GKMatchmakingMode: {
	Default: 0
	NearbyOnly: 1
	AutomatchOnly: 2
}

export declare const GKTurnBasedMatchOutcome: {
	None: 0
	Quit: 1
	Won: 2
	Lost: 3
	Tied: 4
	TimeExpired: 5
	First: 6
	Second: 7
	Third: 8
	Fourth: 9
	CustomRange: 16711680
}

export declare const GKGameCenterViewControllerState: {
	Default: -1
	Leaderboards: 0
	Achievements: 1
	Challenges: 2
	LocalPlayerProfile: 3
	Dashboard: 4
}

export declare const GKSendDataMode: {
	Reliable: 0
	Unreliable: 1
}

export declare interface GKGameActivityListener {}

export declare class GKGameActivityListener
	extends NativeObject
	implements GKGameActivityListener {}

export declare interface GKChallengeEventHandlerDelegate extends NSObjectProtocol {
	localPlayerDidSelectChallenge?(challenge: GKChallenge): void

	shouldShowBannerForLocallyReceivedChallenge?(challenge: GKChallenge): boolean

	localPlayerDidReceiveChallenge?(challenge: GKChallenge): void

	shouldShowBannerForLocallyCompletedChallenge?(challenge: GKChallenge): boolean

	localPlayerDidCompleteChallenge?(challenge: GKChallenge): void

	shouldShowBannerForRemotelyCompletedChallenge?(challenge: GKChallenge): boolean

	remotePlayerDidCompleteChallenge?(challenge: GKChallenge): void
}

export declare class GKChallengeEventHandlerDelegate
	extends NativeObject
	implements GKChallengeEventHandlerDelegate {}

export declare interface GKTurnBasedEventListener {
	playerDidRequestMatchWithOtherPlayers?(
		player: GKPlayer,
		playersToInvite: NSArray<interop.Object> | Array<interop.Object>,
	): void

	playerReceivedTurnEventForMatchDidBecomeActive?(
		player: GKPlayer,
		match: GKTurnBasedMatch,
		didBecomeActive: boolean,
	): void

	playerMatchEnded?(player: GKPlayer, match: GKTurnBasedMatch): void

	playerReceivedExchangeRequestForMatch?(
		player: GKPlayer,
		exchange: GKTurnBasedExchange,
		match: GKTurnBasedMatch,
	): void

	playerReceivedExchangeCancellationForMatch?(
		player: GKPlayer,
		exchange: GKTurnBasedExchange,
		match: GKTurnBasedMatch,
	): void

	playerReceivedExchangeRepliesForCompletedExchangeForMatch?(
		player: GKPlayer,
		replies: NSArray<interop.Object> | Array<interop.Object>,
		exchange: GKTurnBasedExchange,
		match: GKTurnBasedMatch,
	): void

	playerWantsToQuitMatch?(player: GKPlayer, match: GKTurnBasedMatch): void

	playerDidRequestMatchWithPlayers?(
		player: GKPlayer,
		playerIDsToInvite: NSArray<interop.Object> | Array<interop.Object>,
	): void
}

export declare class GKTurnBasedEventListener
	extends NativeObject
	implements GKTurnBasedEventListener {}

export declare interface GKAchievementViewControllerDelegate extends NSObjectProtocol {
	achievementViewControllerDidFinish(viewController: GKAchievementViewController): void
}

export declare class GKAchievementViewControllerDelegate
	extends NativeObject
	implements GKAchievementViewControllerDelegate {}

export declare interface GKSessionDelegate extends NSObjectProtocol {
	sessionPeerDidChangeState?(
		session: GKSession,
		peerID: string,
		state: interop.Enum<typeof GKPeerConnectionState>,
	): void

	sessionDidReceiveConnectionRequestFromPeer?(session: GKSession, peerID: string): void

	sessionConnectionWithPeerFailedWithError?(
		session: GKSession,
		peerID: string,
		error: NSError,
	): void

	sessionDidFailWithError?(session: GKSession, error: NSError): void
}

export declare class GKSessionDelegate extends NativeObject implements GKSessionDelegate {}

export declare interface GKMatchmakerViewControllerDelegate extends NSObjectProtocol {
	matchmakerViewControllerWasCancelled(viewController: GKMatchmakerViewController): void

	matchmakerViewControllerDidFailWithError(
		viewController: GKMatchmakerViewController,
		error: NSError,
	): void

	matchmakerViewControllerDidFindMatch?(
		viewController: GKMatchmakerViewController,
		match: GKMatch,
	): void

	matchmakerViewControllerDidFindHostedPlayers?(
		viewController: GKMatchmakerViewController,
		players: NSArray<interop.Object> | Array<interop.Object>,
	): void

	matchmakerViewControllerHostedPlayerDidAccept?(
		viewController: GKMatchmakerViewController,
		player: GKPlayer,
	): void

	matchmakerViewControllerDidFindPlayers?(
		viewController: GKMatchmakerViewController,
		playerIDs: NSArray<interop.Object> | Array<interop.Object>,
	): void

	matchmakerViewControllerDidReceiveAcceptFromHostedPlayer?(
		viewController: GKMatchmakerViewController,
		playerID: string,
	): void
}

export declare class GKMatchmakerViewControllerDelegate
	extends NativeObject
	implements GKMatchmakerViewControllerDelegate {}

export declare interface GKMatchDelegate extends NSObjectProtocol {
	matchDidReceiveDataFromRemotePlayer?(match: GKMatch, data: NSData, player: GKPlayer): void

	matchDidReceiveDataForRecipientFromRemotePlayer?(
		match: GKMatch,
		data: NSData,
		recipient: GKPlayer,
		player: GKPlayer,
	): void

	matchPlayerDidChangeConnectionState?(
		match: GKMatch,
		player: GKPlayer,
		state: interop.Enum<typeof GKPlayerConnectionState>,
	): void

	matchDidFailWithError?(match: GKMatch, error: NSError | null): void

	matchShouldReinviteDisconnectedPlayer?(match: GKMatch, player: GKPlayer): boolean

	matchDidReceiveDataFromPlayer?(match: GKMatch, data: NSData, playerID: string): void

	matchPlayerDidChangeState?(
		match: GKMatch,
		playerID: string,
		state: interop.Enum<typeof GKPlayerConnectionState>,
	): void

	matchShouldReinvitePlayer?(match: GKMatch, playerID: string): boolean
}

export declare class GKMatchDelegate extends NativeObject implements GKMatchDelegate {}

export declare interface GKLocalPlayerListener
	extends
		GKChallengeListener,
		GKGameActivityListener,
		GKInviteEventListener,
		GKTurnBasedEventListener,
		GKSavedGameListener {}

export declare class GKLocalPlayerListener extends NativeObject implements GKLocalPlayerListener {}

export declare interface GKTurnBasedEventHandlerDelegate {
	handleInviteFromGameCenter(playersToInvite: NSArray<interop.Object> | Array<interop.Object>): void

	handleTurnEventForMatchDidBecomeActive(match: GKTurnBasedMatch, didBecomeActive: boolean): void

	handleTurnEventForMatch?(match: GKTurnBasedMatch): void

	handleMatchEnded?(match: GKTurnBasedMatch): void
}

export declare class GKTurnBasedEventHandlerDelegate
	extends NativeObject
	implements GKTurnBasedEventHandlerDelegate {}

export declare interface GKGameSessionEventListener extends NSObjectProtocol {
	sessionDidAddPlayer?(session: GKGameSession, player: GKCloudPlayer): void

	sessionDidRemovePlayer?(session: GKGameSession, player: GKCloudPlayer): void

	sessionPlayerDidChangeConnectionState?(
		session: GKGameSession,
		player: GKCloudPlayer,
		newState: interop.Enum<typeof GKConnectionState>,
	): void

	sessionPlayerDidSaveData?(session: GKGameSession, player: GKCloudPlayer, data: NSData): void

	sessionDidReceiveDataFromPlayer?(
		session: GKGameSession,
		data: NSData,
		player: GKCloudPlayer,
	): void

	sessionDidReceiveMessageWithDataFromPlayer?(
		session: GKGameSession,
		message: string,
		data: NSData,
		player: GKCloudPlayer,
	): void
}

export declare class GKGameSessionEventListener
	extends NativeObject
	implements GKGameSessionEventListener {}

export declare interface GKViewController {}

export declare class GKViewController extends NativeObject implements GKViewController {}

export declare interface GKChallengesViewControllerDelegate {
	challengesViewControllerDidFinish(viewController: GKChallengesViewController): void
}

export declare class GKChallengesViewControllerDelegate
	extends NativeObject
	implements GKChallengesViewControllerDelegate {}

export declare interface GKSavedGameListener extends NSObjectProtocol {
	playerDidModifySavedGame?(player: GKPlayer, savedGame: GKSavedGame): void

	playerHasConflictingSavedGames?(
		player: GKPlayer,
		savedGames: NSArray<interop.Object> | Array<interop.Object>,
	): void
}

export declare class GKSavedGameListener extends NativeObject implements GKSavedGameListener {}

export declare interface GKLeaderboardViewControllerDelegate extends NSObjectProtocol {
	leaderboardViewControllerDidFinish(viewController: GKLeaderboardViewController): void
}

export declare class GKLeaderboardViewControllerDelegate
	extends NativeObject
	implements GKLeaderboardViewControllerDelegate {}

export declare interface GKVoiceChatClient extends NSObjectProtocol {
	voiceChatServiceSendDataToParticipantID(
		voiceChatService: GKVoiceChatService,
		data: NSData,
		participantID: string,
	): void

	participantID(): string

	voiceChatServiceSendRealTimeDataToParticipantID?(
		voiceChatService: GKVoiceChatService,
		data: NSData,
		participantID: string,
	): void

	voiceChatServiceDidStartWithParticipantID?(
		voiceChatService: GKVoiceChatService,
		participantID: string,
	): void

	voiceChatServiceDidNotStartWithParticipantIDError?(
		voiceChatService: GKVoiceChatService,
		participantID: string,
		error: NSError | null,
	): void

	voiceChatServiceDidStopWithParticipantIDError?(
		voiceChatService: GKVoiceChatService,
		participantID: string,
		error: NSError | null,
	): void

	voiceChatServiceDidReceiveInvitationFromParticipantIDCallID?(
		voiceChatService: GKVoiceChatService,
		participantID: string,
		callID: number,
	): void
}

export declare class GKVoiceChatClient extends NativeObject implements GKVoiceChatClient {}

export declare interface GKFriendRequestComposeViewControllerDelegate {
	friendRequestComposeViewControllerDidFinish(
		viewController: GKFriendRequestComposeViewController,
	): void
}

export declare class GKFriendRequestComposeViewControllerDelegate
	extends NativeObject
	implements GKFriendRequestComposeViewControllerDelegate {}

export declare interface GKTurnBasedMatchmakerViewControllerDelegate extends NSObjectProtocol {
	turnBasedMatchmakerViewControllerWasCancelled(
		viewController: GKTurnBasedMatchmakerViewController,
	): void

	turnBasedMatchmakerViewControllerDidFailWithError(
		viewController: GKTurnBasedMatchmakerViewController,
		error: NSError,
	): void

	turnBasedMatchmakerViewControllerDidFindMatch?(
		viewController: GKTurnBasedMatchmakerViewController,
		match: GKTurnBasedMatch,
	): void

	turnBasedMatchmakerViewControllerPlayerQuitForMatch?(
		viewController: GKTurnBasedMatchmakerViewController,
		match: GKTurnBasedMatch,
	): void
}

export declare class GKTurnBasedMatchmakerViewControllerDelegate
	extends NativeObject
	implements GKTurnBasedMatchmakerViewControllerDelegate {}

export declare interface GKChallengeListener extends NSObjectProtocol {
	playerWantsToPlayChallenge?(player: GKPlayer, challenge: GKChallenge): void

	playerDidReceiveChallenge?(player: GKPlayer, challenge: GKChallenge): void

	playerDidCompleteChallengeIssuedByFriend?(
		player: GKPlayer,
		challenge: GKChallenge,
		friendPlayer: GKPlayer,
	): void

	playerIssuedChallengeWasCompletedByFriend?(
		player: GKPlayer,
		challenge: GKChallenge,
		friendPlayer: GKPlayer,
	): void
}

export declare class GKChallengeListener extends NativeObject implements GKChallengeListener {}

export declare interface GKInviteEventListener {
	playerDidAcceptInvite?(player: GKPlayer, invite: GKInvite): void

	playerDidRequestMatchWithRecipients?(
		player: GKPlayer,
		recipientPlayers: NSArray<interop.Object> | Array<interop.Object>,
	): void

	playerDidRequestMatchWithPlayers?(
		player: GKPlayer,
		playerIDsToInvite: NSArray<interop.Object> | Array<interop.Object>,
	): void
}

export declare class GKInviteEventListener extends NativeObject implements GKInviteEventListener {}

export declare interface GKGameCenterControllerDelegate extends NSObjectProtocol {
	gameCenterViewControllerDidFinish(gameCenterViewController: GKGameCenterViewController): void
}

export declare class GKGameCenterControllerDelegate
	extends NativeObject
	implements GKGameCenterControllerDelegate {}

export declare class GKDialogController extends NSResponder {
	parentWindow: NSWindow

	presentViewController(viewController: NSViewController): boolean

	dismiss(sender: interop.Object): void

	static sharedDialogController(): GKDialogController
}

export declare class GKSession extends NSObject {
	initWithSessionIDDisplayNameSessionMode(
		sessionID: string,
		name: string,
		mode: interop.Enum<typeof GKSessionMode>,
	): this

	delegate: GKSessionDelegate

	readonly sessionID: string

	readonly displayName: string

	readonly sessionMode: interop.Enum<typeof GKSessionMode>

	readonly peerID: string

	available: boolean

	disconnectTimeout: number

	displayNameForPeer(peerID: string): string

	sendDataToPeersWithDataModeError(
		data: NSData,
		peers: NSArray<interop.Object> | Array<interop.Object>,
		mode: interop.Enum<typeof GKSendDataMode>,
		error: interop.PointerConvertible,
	): boolean

	sendDataToAllPeersWithDataModeError(
		data: NSData,
		mode: interop.Enum<typeof GKSendDataMode>,
		error: interop.PointerConvertible,
	): boolean

	setDataReceiveHandlerWithContext(
		handler: interop.Object,
		context: interop.PointerConvertible,
	): void

	connectToPeerWithTimeout(peerID: string, timeout: number): void

	cancelConnectToPeer(peerID: string): void

	acceptConnectionFromPeerError(peerID: string, error: interop.PointerConvertible): boolean

	denyConnectionFromPeer(peerID: string): void

	disconnectPeerFromAllPeers(peerID: string): void

	disconnectFromAllPeers(): void

	peersWithConnectionState(state: interop.Enum<typeof GKPeerConnectionState>): NSArray

	isAvailable(): boolean
}

export declare class GKSavedGame extends NSObject implements NSCopying {
	readonly name: string

	readonly deviceName: string

	readonly modificationDate: NSDate

	loadDataWithCompletionHandler(handler: (p1: NSData, p2: NSError) => void | null): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class GKCloudPlayer extends GKBasePlayer {
	static getCurrentSignedInPlayerForContainerCompletionHandler(
		containerName: string | null,
		handler: (p1: GKCloudPlayer, p2: NSError) => void | null,
	): void
}

export declare class GKTurnBasedMatchmakerViewController
	extends NSViewController
	implements GKViewController
{
	turnBasedMatchmakerDelegate: GKTurnBasedMatchmakerViewControllerDelegate

	showExistingMatches: boolean

	initWithMatchRequest(request: GKMatchRequest): this
}

export declare class GKMatchmakerViewController
	extends NSViewController
	implements GKViewController
{
	matchmakerDelegate: GKMatchmakerViewControllerDelegate

	readonly matchRequest: GKMatchRequest

	hosted: boolean

	matchmakingMode: interop.Enum<typeof GKMatchmakingMode>

	initWithMatchRequest(request: GKMatchRequest): this

	initWithInvite(invite: GKInvite): this

	addPlayersToMatch(match: GKMatch): void

	setHostedPlayerDidConnect(player: GKPlayer, connected: boolean): void

	defaultInvitationMessage: string

	isHosted(): boolean

	setHostedPlayerConnected(playerID: string, connected: boolean): void
}

export declare class GKMatchRequest extends NSObject {
	minPlayers: number

	maxPlayers: number

	playerGroup: number

	playerAttributes: number

	get recipients(): NSArray
	set recipients(value: NSArray<interop.Object> | Array<interop.Object>)

	inviteMessage: string

	defaultNumberOfPlayers: number

	restrictToAutomatch: boolean

	recipientResponseHandler: (
		p1: GKPlayer,
		p2: interop.Enum<typeof GKInviteRecipientResponse>,
	) => void

	inviteeResponseHandler: (p1: string, p2: interop.Enum<typeof GKInviteRecipientResponse>) => void

	static maxPlayersAllowedForMatchOfType(matchType: interop.Enum<typeof GKMatchType>): number

	get playersToInvite(): NSArray
	set playersToInvite(value: NSArray<interop.Object> | Array<interop.Object>)
}

export declare class GKTurnBasedExchangeReply extends NSObject {
	readonly recipient: GKTurnBasedParticipant

	readonly message: string

	readonly data: NSData

	readonly replyDate: NSDate
}

export declare class GKTurnBasedExchange extends NSObject {
	readonly exchangeID: string

	readonly sender: GKTurnBasedParticipant

	readonly recipients: NSArray

	readonly status: interop.Enum<typeof GKTurnBasedExchangeStatus>

	readonly message: string

	readonly data: NSData

	readonly sendDate: NSDate

	readonly timeoutDate: NSDate

	readonly completionDate: NSDate

	readonly replies: NSArray

	cancelWithLocalizableMessageKeyArgumentsCompletionHandler(
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	replyWithLocalizableMessageKeyArgumentsDataCompletionHandler(
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		data: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void
}

export declare class GKTurnBasedMatch extends NSObject {
	readonly matchID: string

	readonly creationDate: NSDate

	readonly participants: NSArray

	readonly status: interop.Enum<typeof GKTurnBasedMatchStatus>

	readonly currentParticipant: GKTurnBasedParticipant

	readonly matchData: NSData

	setLocalizableMessageWithKeyArguments(
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object> | null,
	): void

	message: string

	readonly matchDataMaximumSize: number

	readonly exchanges: NSArray

	readonly activeExchanges: NSArray

	readonly completedExchanges: NSArray

	readonly exchangeDataMaximumSize: number

	readonly exchangeMaxInitiatedExchangesPerPlayer: number

	static findMatchForRequestWithCompletionHandler(
		request: GKMatchRequest,
		completionHandler: (p1: GKTurnBasedMatch, p2: NSError) => void | null,
	): void

	static loadMatchesWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static loadMatchWithIDWithCompletionHandler(
		matchID: string,
		completionHandler: (p1: GKTurnBasedMatch, p2: NSError) => void | null,
	): void

	rematchWithCompletionHandler(
		completionHandler: (p1: GKTurnBasedMatch, p2: NSError) => void | null,
	): void

	acceptInviteWithCompletionHandler(
		completionHandler: (p1: GKTurnBasedMatch, p2: NSError) => void | null,
	): void

	declineInviteWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	removeWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	loadMatchDataWithCompletionHandler(
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): void

	endTurnWithNextParticipantsTurnTimeoutMatchDataCompletionHandler(
		nextParticipants: NSArray<interop.Object> | Array<interop.Object>,
		timeout: number,
		matchData: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void

	participantQuitInTurnWithOutcomeNextParticipantsTurnTimeoutMatchDataCompletionHandler(
		matchOutcome: interop.Enum<typeof GKTurnBasedMatchOutcome>,
		nextParticipants: NSArray<interop.Object> | Array<interop.Object>,
		timeout: number,
		matchData: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void

	participantQuitOutOfTurnWithOutcomeWithCompletionHandler(
		matchOutcome: interop.Enum<typeof GKTurnBasedMatchOutcome>,
		completionHandler: (p1: NSError) => void | null,
	): void

	endMatchInTurnWithMatchDataCompletionHandler(
		matchData: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void

	endMatchInTurnWithMatchDataScoresAchievementsCompletionHandler(
		matchData: NSData,
		scores: NSArray<interop.Object> | Array<interop.Object> | null,
		achievements: NSArray<interop.Object> | Array<interop.Object> | null,
		completionHandler: (p1: NSError) => void | null,
	): void

	endMatchInTurnWithMatchDataLeaderboardScoresAchievementsCompletionHandler(
		matchData: NSData,
		scores: NSArray<interop.Object> | Array<interop.Object>,
		achievements: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	saveCurrentTurnWithMatchDataCompletionHandler(
		matchData: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void

	saveMergedMatchDataWithResolvedExchangesCompletionHandler(
		matchData: NSData,
		exchanges: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	sendExchangeToParticipantsDataLocalizableMessageKeyArgumentsTimeoutCompletionHandler(
		participants: NSArray<interop.Object> | Array<interop.Object>,
		data: NSData,
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		timeout: number,
		completionHandler: (p1: GKTurnBasedExchange, p2: NSError) => void | null,
	): void

	sendReminderToParticipantsLocalizableMessageKeyArgumentsCompletionHandler(
		participants: NSArray<interop.Object> | Array<interop.Object>,
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	endTurnWithNextParticipantMatchDataCompletionHandler(
		nextParticipant: GKTurnBasedParticipant,
		matchData: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void

	participantQuitInTurnWithOutcomeNextParticipantMatchDataCompletionHandler(
		matchOutcome: interop.Enum<typeof GKTurnBasedMatchOutcome>,
		nextParticipant: GKTurnBasedParticipant,
		matchData: NSData,
		completionHandler: (p1: NSError) => void | null,
	): void
}

export declare class GKTurnBasedParticipant extends NSObject {
	readonly player: GKPlayer

	readonly lastTurnDate: NSDate

	readonly status: interop.Enum<typeof GKTurnBasedParticipantStatus>

	matchOutcome: interop.Enum<typeof GKTurnBasedMatchOutcome>

	readonly timeoutDate: NSDate

	readonly playerID: string
}

export declare class GKChallengesViewController
	extends NSViewController
	implements GKViewController
{
	challengeDelegate: GKChallengesViewControllerDelegate
}

export declare class GKChallengeEventHandler extends NSObject {
	static challengeEventHandler(): GKChallengeEventHandler

	delegate: GKChallengeEventHandlerDelegate
}

export declare class GKAchievementChallenge extends GKChallenge {
	readonly achievement: GKAchievement
}

export declare class GKScoreChallenge extends GKChallenge {
	readonly score: GKScore
}

export declare class GKLeaderboardEntry extends NSObject {
	readonly player: GKPlayer

	readonly rank: number

	readonly score: number

	readonly formattedScore: string

	readonly context: number

	readonly date: NSDate

	challengeComposeControllerWithMessagePlayersCompletionHandler(
		message: string | null,
		players: NSArray<interop.Object> | Array<interop.Object> | null,
		completionHandler: (
			p1: NSViewController,
			p2: boolean,
			p3: NSArray<interop.Object> | Array<interop.Object>,
		) => void | null,
	): NSViewController
}

export declare class GKAccessPoint extends NSObject {
	static readonly shared: GKAccessPoint

	active: boolean

	readonly visible: boolean

	readonly isPresentingGameCenter: boolean

	showHighlights: boolean

	location: interop.Enum<typeof GKAccessPointLocation>

	readonly frameInScreenCoordinates: CGRect

	parentWindow: NSWindow

	triggerAccessPointWithHandler(handler: () => void): void

	triggerAccessPointWithStateHandler(
		state: interop.Enum<typeof GKGameCenterViewControllerState>,
		handler: () => void,
	): void

	isActive(): boolean

	isVisible(): boolean
}

export declare class GKLeaderboard extends NSObject {
	readonly title: string

	readonly groupIdentifier: string

	readonly baseLeaderboardID: string

	readonly type: interop.Enum<typeof GKLeaderboardType>

	readonly startDate: NSDate

	readonly nextStartDate: NSDate

	readonly duration: number

	static loadLeaderboardsWithIDsCompletionHandler(
		leaderboardIDs: NSArray<interop.Object> | Array<interop.Object> | null,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	loadPreviousOccurrenceWithCompletionHandler(
		completionHandler: (p1: GKLeaderboard, p2: NSError) => void | null,
	): void

	static submitScoreContextPlayerLeaderboardIDsCompletionHandler(
		score: number,
		context: number,
		player: GKPlayer,
		leaderboardIDs: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	submitScoreContextPlayerCompletionHandler(
		score: number,
		context: number,
		player: GKPlayer,
		completionHandler: (p1: NSError) => void | null,
	): void

	loadEntriesForPlayerScopeTimeScopeRangeCompletionHandler(
		playerScope: interop.Enum<typeof GKLeaderboardPlayerScope>,
		timeScope: interop.Enum<typeof GKLeaderboardTimeScope>,
		range: _NSRange,
		completionHandler: (
			p1: GKLeaderboardEntry,
			p2: NSArray<interop.Object> | Array<interop.Object>,
			p3: number,
			p4: NSError,
		) => void | null,
	): void

	loadEntriesForPlayersTimeScopeCompletionHandler(
		players: NSArray<interop.Object> | Array<interop.Object>,
		timeScope: interop.Enum<typeof GKLeaderboardTimeScope>,
		completionHandler: (
			p1: GKLeaderboardEntry,
			p2: NSArray<interop.Object> | Array<interop.Object>,
			p3: NSError,
		) => void | null,
	): void

	category: string

	initWithPlayerIDs(playerIDs: NSArray<interop.Object> | Array<interop.Object> | null): this

	static loadCategoriesWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSArray<interop.Object> | Array<interop.Object>,
			p3: NSError,
		) => void | null,
	): void

	static setDefaultLeaderboardWithCompletionHandler(
		leaderboardIdentifier: string | null,
		completionHandler: (p1: NSError) => void | null,
	): void

	timeScope: interop.Enum<typeof GKLeaderboardTimeScope>

	playerScope: interop.Enum<typeof GKLeaderboardPlayerScope>

	identifier: string

	range: _NSRange

	readonly scores: NSArray

	readonly maxRange: number

	readonly localPlayerScore: GKScore

	readonly loading: boolean

	init(): this

	initWithPlayers(players: NSArray<interop.Object> | Array<interop.Object>): this

	loadScoresWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static loadLeaderboardsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	isLoading(): boolean

	loadImageWithCompletionHandler(completionHandler: (p1: NSImage, p2: NSError) => void | null): void
}

export declare class GKAchievement extends NSObject implements NSCoding, NSSecureCoding {
	static loadAchievementsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static resetAchievementsWithCompletionHandler(
		completionHandler: (p1: NSError) => void | null,
	): void

	initWithIdentifier(identifier: string | null): this

	initWithIdentifierPlayer(identifier: string | null, player: GKPlayer): this

	static reportAchievementsWithCompletionHandler(
		achievements: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	identifier: string

	percentComplete: number

	readonly completed: boolean

	readonly lastReportedDate: NSDate

	showsCompletionBanner: boolean

	readonly player: GKPlayer

	isCompleted(): boolean

	reportAchievementWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	readonly hidden: boolean

	isHidden(): boolean

	initWithIdentifierForPlayer(identifier: string | null, playerID: string): this

	readonly playerID: string

	selectChallengeablePlayersWithCompletionHandler(
		players: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static reportAchievementsWithEligibleChallengesWithCompletionHandler(
		achievements: NSArray<interop.Object> | Array<interop.Object>,
		challenges: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	issueChallengeToPlayersMessage(
		playerIDs: NSArray<interop.Object> | Array<interop.Object> | null,
		message: string | null,
	): void

	selectChallengeablePlayerIDsWithCompletionHandler(
		playerIDs: NSArray<interop.Object> | Array<interop.Object> | null,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	challengeComposeControllerWithMessagePlayersCompletionHandler(
		message: string | null,
		players: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (
			p1: NSViewController,
			p2: boolean,
			p3: NSArray<interop.Object> | Array<interop.Object>,
		) => void | null,
	): NSViewController

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readonly supportsSecureCoding: boolean
}

export declare class GKPlayer extends GKBasePlayer {
	scopedIDsArePersistent(): boolean

	readonly gamePlayerID: string

	readonly teamPlayerID: string

	readonly displayName: string

	readonly alias: string

	static anonymousGuestPlayerWithIdentifier<This extends abstract new (...args: any) => any>(
		this: This,
		guestIdentifier: string,
	): InstanceType<This>

	readonly guestIdentifier: string

	readonly isInvitable: boolean

	loadPhotoForSizeWithCompletionHandler(
		size: interop.Enum<typeof GKPhotoSize>,
		completionHandler: (p1: NSImage, p2: NSError) => void | null,
	): void

	readonly isFriend: boolean

	readonly playerID: string

	static loadPlayersForIdentifiersWithCompletionHandler(
		identifiers: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void
}

export declare class GKGameSession extends NSObject {
	readonly identifier: string

	readonly title: string

	readonly owner: GKCloudPlayer

	readonly players: NSArray

	readonly lastModifiedDate: NSDate

	readonly lastModifiedPlayer: GKCloudPlayer

	readonly maxNumberOfConnectedPlayers: number

	readonly badgedPlayers: NSArray

	static createSessionInContainerWithTitleMaxConnectedPlayersCompletionHandler(
		containerName: string | null,
		title: string,
		maxPlayers: number,
		completionHandler: (p1: GKGameSession, p2: NSError) => void | null,
	): void

	static loadSessionsInContainerCompletionHandler(
		containerName: string | null,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	static loadSessionWithIdentifierCompletionHandler(
		identifier: string,
		completionHandler: (p1: GKGameSession, p2: NSError) => void | null,
	): void

	static removeSessionWithIdentifierCompletionHandler(
		identifier: string,
		completionHandler: (p1: NSError) => void | null,
	): void

	getShareURLWithCompletionHandler(completionHandler: (p1: NSURL, p2: NSError) => void | null): void

	loadDataWithCompletionHandler(completionHandler: (p1: NSData, p2: NSError) => void | null): void

	saveDataCompletionHandler(
		data: NSData,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): void

	setConnectionStateCompletionHandler(
		state: interop.Enum<typeof GKConnectionState>,
		completionHandler: (p1: NSError) => void | null,
	): void

	playersWithConnectionState(state: interop.Enum<typeof GKConnectionState>): NSArray

	sendDataWithTransportTypeCompletionHandler(
		data: NSData,
		transport: interop.Enum<typeof GKTransportType>,
		completionHandler: (p1: NSError) => void | null,
	): void

	sendMessageWithLocalizedFormatKeyArgumentsDataToPlayersBadgePlayersCompletionHandler(
		key: string,
		arguments$: NSArray<interop.Object> | Array<interop.Object>,
		data: NSData | null,
		players: NSArray<interop.Object> | Array<interop.Object>,
		badgePlayers: boolean,
		completionHandler: (p1: NSError) => void | null,
	): void

	clearBadgeForPlayersCompletionHandler(
		players: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	static addEventListener(listener: NSObject): void

	static removeEventListener(listener: NSObject): void
}

export declare class GKAchievementDescription extends NSObject implements NSCoding, NSSecureCoding {
	static loadAchievementDescriptionsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	readonly identifier: string

	readonly groupIdentifier: string

	readonly title: string

	readonly achievedDescription: string

	readonly unachievedDescription: string

	readonly maximumPoints: number

	readonly hidden: boolean

	readonly replayable: boolean

	isHidden(): boolean

	isReplayable(): boolean

	readonly image: NSImage

	loadImageWithCompletionHandler(completionHandler: (p1: NSImage, p2: NSError) => void | null): void

	static incompleteAchievementImage(): NSImage

	static placeholderCompletedAchievementImage(): NSImage

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readonly supportsSecureCoding: boolean
}

export declare class GKGameCenterViewController
	extends NSViewController
	implements GKViewController
{
	gameCenterDelegate: GKGameCenterControllerDelegate

	initWithState(state: interop.Enum<typeof GKGameCenterViewControllerState>): this

	initWithLeaderboardIDPlayerScopeTimeScope(
		leaderboardID: string,
		playerScope: interop.Enum<typeof GKLeaderboardPlayerScope>,
		timeScope: interop.Enum<typeof GKLeaderboardTimeScope>,
	): this

	initWithLeaderboardPlayerScope(
		leaderboard: GKLeaderboard,
		playerScope: interop.Enum<typeof GKLeaderboardPlayerScope>,
	): this

	initWithAchievementID(achievementID: string): this

	viewState: interop.Enum<typeof GKGameCenterViewControllerState>

	leaderboardTimeScope: interop.Enum<typeof GKLeaderboardTimeScope>

	leaderboardIdentifier: string

	leaderboardCategory: string
}

export declare class GKChallenge extends NSObject implements NSCoding, NSSecureCoding {
	static loadReceivedChallengesWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	decline(): void

	readonly issuingPlayer: GKPlayer

	readonly receivingPlayer: GKPlayer

	readonly state: interop.Enum<typeof GKChallengeState>

	readonly issueDate: NSDate

	readonly completionDate: NSDate

	readonly message: string

	readonly issuingPlayerID: string

	readonly receivingPlayerID: string

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readonly supportsSecureCoding: boolean
}

export declare class GKFriendRequestComposeViewController
	extends NSViewController
	implements GKViewController
{
	static maxNumberOfRecipients(): number

	setMessage(message: string | null): void

	addRecipientPlayers(players: NSArray<interop.Object> | Array<interop.Object>): void

	addRecipientsWithPlayerIDs(playerIDs: NSArray<interop.Object> | Array<interop.Object>): void

	addRecipientsWithEmailAddresses(
		emailAddresses: NSArray<interop.Object> | Array<interop.Object>,
	): void

	composeViewDelegate: GKFriendRequestComposeViewControllerDelegate
}

export declare class GKLeaderboardScore extends NSObject {
	player: GKPlayer

	value: number

	context: number

	leaderboardID: string
}

export declare class GKMatchmaker extends NSObject {
	static sharedMatchmaker(): GKMatchmaker

	matchForInviteCompletionHandler(
		invite: GKInvite,
		completionHandler: (p1: GKMatch, p2: NSError) => void | null,
	): void

	findMatchForRequestWithCompletionHandler(
		request: GKMatchRequest,
		completionHandler: (p1: GKMatch, p2: NSError) => void | null,
	): void

	findPlayersForHostedRequestWithCompletionHandler(
		request: GKMatchRequest,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	addPlayersToMatchMatchRequestCompletionHandler(
		match: GKMatch,
		matchRequest: GKMatchRequest,
		completionHandler: (p1: NSError) => void | null,
	): void

	cancel(): void

	cancelPendingInviteToPlayer(player: GKPlayer): void

	finishMatchmakingForMatch(match: GKMatch): void

	queryPlayerGroupActivityWithCompletionHandler(
		playerGroup: number,
		completionHandler: (p1: number, p2: NSError) => void | null,
	): void

	queryActivityWithCompletionHandler(
		completionHandler: (p1: number, p2: NSError) => void | null,
	): void

	startBrowsingForNearbyPlayersWithHandler(
		reachableHandler: (p1: GKPlayer, p2: boolean) => void | null,
	): void

	stopBrowsingForNearbyPlayers(): void

	inviteHandler: (p1: GKInvite, p2: NSArray<interop.Object> | Array<interop.Object>) => void | null

	startBrowsingForNearbyPlayersWithReachableHandler(
		reachableHandler: (p1: string, p2: boolean) => void | null,
	): void

	cancelInviteToPlayer(playerID: string): void

	findPlayersForHostedMatchRequestWithCompletionHandler(
		request: GKMatchRequest,
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void
}

export declare class GKAchievementViewController extends GKGameCenterViewController {
	achievementDelegate: GKAchievementViewControllerDelegate
}

export declare class GKLocalPlayer extends GKPlayer implements GKSavedGameListener {
	static readonly local: GKLocalPlayer

	static readonly localPlayer: GKLocalPlayer

	readonly authenticated: boolean

	readonly underage: boolean

	readonly multiplayerGamingRestricted: boolean

	readonly personalizedCommunicationRestricted: boolean

	loadRecentPlayersWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	loadChallengableFriendsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	fetchItemsForIdentityVerificationSignature(
		completionHandler: (p1: NSURL, p2: NSData, p3: NSData, p4: number, p5: NSError) => void | null,
	): void

	isAuthenticated(): boolean

	isUnderage(): boolean

	isMultiplayerGamingRestricted(): boolean

	isPersonalizedCommunicationRestricted(): boolean

	registerListener(listener: GKLocalPlayerListener): void

	unregisterListener(listener: GKLocalPlayerListener): void

	unregisterAllListeners(): void

	setDefaultLeaderboardCategoryIDCompletionHandler(
		categoryID: string | null,
		completionHandler: (p1: NSError) => void | null,
	): void

	loadDefaultLeaderboardCategoryIDWithCompletionHandler(
		completionHandler: (p1: string, p2: NSError) => void | null,
	): void

	authenticateWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	loadFriendPlayersWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	generateIdentityVerificationSignatureWithCompletionHandler(
		completionHandler: (p1: NSURL, p2: NSData, p3: NSData, p4: number, p5: NSError) => void | null,
	): void

	loadDefaultLeaderboardIdentifierWithCompletionHandler(
		completionHandler: (p1: string, p2: NSError) => void | null,
	): void

	setDefaultLeaderboardIdentifierCompletionHandler(
		leaderboardIdentifier: string,
		completionHandler: (p1: NSError) => void | null,
	): void

	loadFriendsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	readonly friends: NSArray

	authenticateHandler: (p1: NSViewController, p2: NSError) => void | null

	fetchSavedGamesWithCompletionHandler(
		handler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null,
	): void

	saveGameDataWithNameCompletionHandler(
		data: NSData,
		name: string,
		handler: (p1: GKSavedGame, p2: NSError) => void | null,
	): void

	deleteSavedGamesWithNameCompletionHandler(
		name: string,
		handler: (p1: NSError) => void | null,
	): void

	resolveConflictingSavedGamesWithDataCompletionHandler(
		conflictingSavedGames: NSArray<interop.Object> | Array<interop.Object>,
		data: NSData,
		handler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null,
	): void

	playerDidModifySavedGame(player: GKPlayer, savedGame: GKSavedGame): void

	playerHasConflictingSavedGames(
		player: GKPlayer,
		savedGames: NSArray<interop.Object> | Array<interop.Object>,
	): void

	isEqual(object: interop.Object): boolean

	readonly hash: number

	readonly superclass: interop.Pointer

	class(): interop.Pointer

	self(): this

	performSelector(aSelector: string): interop.Object

	performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object

	performSelectorWithObjectWithObject(
		aSelector: string,
		object1: interop.Object,
		object2: interop.Object,
	): interop.Object

	readonly isProxy: boolean

	isKindOfClass(aClass: interop.PointerConvertible): boolean

	isMemberOfClass(aClass: interop.PointerConvertible): boolean

	conformsToProtocol(aProtocol: interop.PointerConvertible): boolean

	respondsToSelector(aSelector: string): boolean

	retain(): this

	release(): void

	autorelease(): this

	retainCount(): number

	readonly zone: interop.Pointer

	readonly description: string

	readonly debugDescription: string
}

export declare class GKTurnBasedEventHandler extends NSObject {
	static sharedTurnBasedEventHandler(): GKTurnBasedEventHandler

	delegate: NSObject
}

export declare class GKLeaderboardViewController extends GKGameCenterViewController {
	timeScope: interop.Enum<typeof GKLeaderboardTimeScope>

	category: string

	leaderboardDelegate: GKLeaderboardViewControllerDelegate
}

export declare class GKBasePlayer extends NSObject implements NSCopying {
	readonly playerID: string

	readonly displayName: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class GKMatch extends NSObject {
	readonly players: NSArray

	delegate: GKMatchDelegate

	readonly expectedPlayerCount: number

	sendDataToPlayersDataModeError(
		data: NSData,
		players: NSArray<interop.Object> | Array<interop.Object>,
		mode: interop.Enum<typeof GKMatchSendDataMode>,
		error: interop.PointerConvertible,
	): boolean

	sendDataToAllPlayersWithDataModeError(
		data: NSData,
		mode: interop.Enum<typeof GKMatchSendDataMode>,
		error: interop.PointerConvertible,
	): boolean

	disconnect(): void

	chooseBestHostingPlayerWithCompletionHandler(
		completionHandler: (p1: GKPlayer) => void | null,
	): void

	rematchWithCompletionHandler(completionHandler: (p1: GKMatch, p2: NSError) => void | null): void

	voiceChatWithName(name: string): GKVoiceChat

	chooseBestHostPlayerWithCompletionHandler(completionHandler: (p1: string) => void | null): void

	sendDataToPlayersWithDataModeError(
		data: NSData,
		playerIDs: NSArray<interop.Object> | Array<interop.Object>,
		mode: interop.Enum<typeof GKMatchSendDataMode>,
		error: interop.PointerConvertible,
	): boolean

	readonly playerIDs: NSArray
}

export declare class GKVoiceChat extends NSObject {
	start(): void

	stop(): void

	setPlayerMuted(player: GKPlayer, isMuted: boolean): void

	playerVoiceChatStateDidChangeHandler: (
		p1: GKPlayer,
		p2: interop.Enum<typeof GKVoiceChatPlayerState>,
	) => void

	readonly name: string

	active: boolean

	volume: number

	readonly players: NSArray

	static isVoIPAllowed(): boolean

	isActive(): boolean

	playerStateUpdateHandler: (p1: string, p2: interop.Enum<typeof GKVoiceChatPlayerState>) => void

	readonly playerIDs: NSArray

	setMuteForPlayer(isMuted: boolean, playerID: string): void
}

export declare class GKScore extends NSObject implements NSCoding, NSSecureCoding {
	initWithLeaderboardIdentifier(identifier: string): this

	initWithLeaderboardIdentifierPlayer(identifier: string, player: GKPlayer): this

	value: number

	readonly formattedValue: string

	leaderboardIdentifier: string

	context: number

	readonly date: NSDate

	readonly player: GKPlayer

	readonly rank: number

	shouldSetDefaultLeaderboard: boolean

	static reportScoresWithCompletionHandler(
		scores: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	reportScoreWithCompletionHandler(completionHandler: (p1: NSError) => void | null): void

	initWithCategory(category: string | null): this

	category: string

	initWithLeaderboardIdentifierForPlayer(identifier: string, playerID: string): this

	readonly playerID: string

	static reportScoresWithEligibleChallengesWithCompletionHandler(
		scores: NSArray<interop.Object> | Array<interop.Object>,
		challenges: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	static reportLeaderboardScoresWithEligibleChallengesWithCompletionHandler(
		scores: NSArray<interop.Object> | Array<interop.Object>,
		challenges: NSArray<interop.Object> | Array<interop.Object>,
		completionHandler: (p1: NSError) => void | null,
	): void

	issueChallengeToPlayersMessage(
		playerIDs: NSArray<interop.Object> | Array<interop.Object> | null,
		message: string | null,
	): void

	challengeComposeControllerWithMessagePlayersCompletionHandler(
		message: string | null,
		players: NSArray<interop.Object> | Array<interop.Object> | null,
		completionHandler: (
			p1: NSViewController,
			p2: boolean,
			p3: NSArray<interop.Object> | Array<interop.Object>,
		) => void | null,
	): NSViewController

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readonly supportsSecureCoding: boolean
}

export declare class GKNotificationBanner extends NSObject {
	static showBannerWithTitleMessageCompletionHandler(
		title: string | null,
		message: string | null,
		completionHandler: () => void | null,
	): void

	static showBannerWithTitleMessageDurationCompletionHandler(
		title: string | null,
		message: string | null,
		duration: number,
		completionHandler: () => void | null,
	): void
}

export declare class GKInvite extends NSObject {
	readonly sender: GKPlayer

	readonly hosted: boolean

	readonly playerGroup: number

	readonly playerAttributes: number

	readonly inviter: string

	isHosted(): boolean
}

export declare class GKLeaderboardSet extends NSObject implements NSCoding, NSSecureCoding {
	readonly title: string

	readonly groupIdentifier: string

	identifier: string

	static loadLeaderboardSetsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	loadLeaderboardsWithHandler(
		handler: (p1: NSArray<interop.Object> | Array<interop.Object>, p2: NSError) => void | null,
	): void

	loadLeaderboardsWithCompletionHandler(
		completionHandler: (
			p1: NSArray<interop.Object> | Array<interop.Object>,
			p2: NSError,
		) => void | null,
	): void

	loadImageWithCompletionHandler(completionHandler: (p1: NSImage, p2: NSError) => void | null): void

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this

	static readonly supportsSecureCoding: boolean
}
