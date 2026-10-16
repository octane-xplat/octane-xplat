import type {
	NSArray,
	NSCoder,
	NSCopying,
	NSData,
	NSDictionary,
	NSError,
	NSInputStream,
	NSOutputStream,
	NSProgress,
	NSSecureCoding,
	NSURL,
} from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'

export declare const kMCSessionMinimumNumberOfPeers: number

export declare const MCErrorDomain: string

export declare const kMCSessionMaximumNumberOfPeers: number

export declare const MCEncryptionPreference: {
	Optional: 0
	Required: 1
	None: 2
}

export declare const MCSessionState: {
	NotConnected: 0
	Connecting: 1
	Connected: 2
}

export declare const MCSessionSendDataMode: {
	Reliable: 0
	Unreliable: 1
}

export declare const MCErrorCode: {
	Unknown: 0
	NotConnected: 1
	InvalidParameter: 2
	Unsupported: 3
	TimedOut: 4
	Cancelled: 5
	Unavailable: 6
}

export declare interface MCAdvertiserAssistantDelegate extends NSObjectProtocol {
	advertiserAssistantWillPresentInvitation?(advertiserAssistant: MCAdvertiserAssistant): void

	advertiserAssistantDidDismissInvitation?(advertiserAssistant: MCAdvertiserAssistant): void
}

export declare class MCAdvertiserAssistantDelegate
	extends NativeObject
	implements MCAdvertiserAssistantDelegate {}

export declare interface MCNearbyServiceAdvertiserDelegate extends NSObjectProtocol {
	advertiserDidReceiveInvitationFromPeerWithContextInvitationHandler(
		advertiser: MCNearbyServiceAdvertiser,
		peerID: MCPeerID,
		context: NSData | null,
		invitationHandler: (p1: boolean, p2: MCSession) => void | null,
	): void

	advertiserDidNotStartAdvertisingPeer?(advertiser: MCNearbyServiceAdvertiser, error: NSError): void
}

export declare class MCNearbyServiceAdvertiserDelegate
	extends NativeObject
	implements MCNearbyServiceAdvertiserDelegate {}

export declare interface MCNearbyServiceBrowserDelegate extends NSObjectProtocol {
	browserFoundPeerWithDiscoveryInfo(
		browser: MCNearbyServiceBrowser,
		peerID: MCPeerID,
		info:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	browserLostPeer(browser: MCNearbyServiceBrowser, peerID: MCPeerID): void

	browserDidNotStartBrowsingForPeers?(browser: MCNearbyServiceBrowser, error: NSError): void
}

export declare class MCNearbyServiceBrowserDelegate
	extends NativeObject
	implements MCNearbyServiceBrowserDelegate {}

export declare interface MCSessionDelegate extends NSObjectProtocol {
	sessionPeerDidChangeState(
		session: MCSession,
		peerID: MCPeerID,
		state: interop.Enum<typeof MCSessionState>,
	): void

	sessionDidReceiveDataFromPeer(session: MCSession, data: NSData, peerID: MCPeerID): void

	sessionDidReceiveStreamWithNameFromPeer(
		session: MCSession,
		stream: NSInputStream,
		streamName: string,
		peerID: MCPeerID,
	): void

	sessionDidStartReceivingResourceWithNameFromPeerWithProgress(
		session: MCSession,
		resourceName: string,
		peerID: MCPeerID,
		progress: NSProgress,
	): void

	sessionDidFinishReceivingResourceWithNameFromPeerAtURLWithError(
		session: MCSession,
		resourceName: string,
		peerID: MCPeerID,
		localURL: NSURL | null,
		error: NSError | null,
	): void

	sessionDidReceiveCertificateFromPeerCertificateHandler?(
		session: MCSession,
		certificate: NSArray<interop.Object> | Array<interop.Object> | null,
		peerID: MCPeerID,
		certificateHandler: (p1: boolean) => void,
	): void
}

export declare class MCSessionDelegate extends NativeObject implements MCSessionDelegate {}

export declare interface MCBrowserViewControllerDelegate extends NSObjectProtocol {
	browserViewControllerDidFinish(browserViewController: MCBrowserViewController): void

	browserViewControllerWasCancelled(browserViewController: MCBrowserViewController): void

	browserViewControllerShouldPresentNearbyPeerWithDiscoveryInfo?(
		browserViewController: MCBrowserViewController,
		peerID: MCPeerID,
		info:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): boolean
}

export declare class MCBrowserViewControllerDelegate
	extends NativeObject
	implements MCBrowserViewControllerDelegate {}

export declare class MCNearbyServiceAdvertiser extends NSObject {
	initWithPeerDiscoveryInfoServiceType(
		myPeerID: MCPeerID,
		info:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		serviceType: string,
	): this

	startAdvertisingPeer(): void

	stopAdvertisingPeer(): void

	delegate: MCNearbyServiceAdvertiserDelegate

	readonly myPeerID: MCPeerID

	readonly discoveryInfo: NSDictionary

	readonly serviceType: string
}

export declare class MCNearbyServiceBrowser extends NSObject {
	initWithPeerServiceType(myPeerID: MCPeerID, serviceType: string): this

	startBrowsingForPeers(): void

	stopBrowsingForPeers(): void

	invitePeerToSessionWithContextTimeout(
		peerID: MCPeerID,
		session: MCSession,
		context: NSData | null,
		timeout: number,
	): void

	delegate: MCNearbyServiceBrowserDelegate

	readonly myPeerID: MCPeerID

	readonly serviceType: string
}

export declare class MCPeerID extends NSObject implements NSCopying, NSSecureCoding {
	initWithDisplayName(myDisplayName: string): this

	readonly displayName: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object

	static readonly supportsSecureCoding: boolean

	encodeWithCoder(coder: NSCoder): void

	initWithCoder(coder: NSCoder): this
}

export declare class MCAdvertiserAssistant extends NSObject {
	initWithServiceTypeDiscoveryInfoSession(
		serviceType: string,
		info:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
		session: MCSession,
	): this

	start(): void

	stop(): void

	delegate: MCAdvertiserAssistantDelegate

	readonly session: MCSession

	readonly discoveryInfo: NSDictionary

	readonly serviceType: string
}

export declare class MCBrowserViewController
	extends NSViewController
	implements MCNearbyServiceBrowserDelegate
{
	initWithServiceTypeSession(serviceType: string, session: MCSession): this

	initWithBrowserSession(browser: MCNearbyServiceBrowser, session: MCSession): this

	delegate: MCBrowserViewControllerDelegate

	readonly browser: MCNearbyServiceBrowser

	readonly session: MCSession

	minimumNumberOfPeers: number

	maximumNumberOfPeers: number

	browserFoundPeerWithDiscoveryInfo(
		browser: MCNearbyServiceBrowser,
		peerID: MCPeerID,
		info:
			| NSDictionary<interop.Object, interop.Object>
			| Record<interop.Object, interop.Object>
			| null,
	): void

	browserLostPeer(browser: MCNearbyServiceBrowser, peerID: MCPeerID): void

	browserDidNotStartBrowsingForPeers(browser: MCNearbyServiceBrowser, error: NSError): void

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

export declare class MCSession extends NSObject {
	initWithPeer(myPeerID: MCPeerID): this

	initWithPeerSecurityIdentityEncryptionPreference(
		myPeerID: MCPeerID,
		identity: NSArray<interop.Object> | Array<interop.Object> | null,
		encryptionPreference: interop.Enum<typeof MCEncryptionPreference>,
	): this

	sendDataToPeersWithModeError(
		data: NSData,
		peerIDs: NSArray<interop.Object> | Array<interop.Object>,
		mode: interop.Enum<typeof MCSessionSendDataMode>,
		error: interop.PointerConvertible,
	): boolean

	disconnect(): void

	sendResourceAtURLWithNameToPeerWithCompletionHandler(
		resourceURL: NSURL,
		resourceName: string,
		peerID: MCPeerID,
		completionHandler: (p1: NSError) => void | null,
	): NSProgress

	startStreamWithNameToPeerError(
		streamName: string,
		peerID: MCPeerID,
		error: interop.PointerConvertible,
	): NSOutputStream

	delegate: MCSessionDelegate

	readonly myPeerID: MCPeerID

	readonly securityIdentity: NSArray

	readonly encryptionPreference: interop.Enum<typeof MCEncryptionPreference>

	readonly connectedPeers: NSArray

	nearbyConnectionDataForPeerWithCompletionHandler(
		peerID: MCPeerID,
		completionHandler: (p1: NSData, p2: NSError) => void | null,
	): void

	connectPeerWithNearbyConnectionData(peerID: MCPeerID, data: NSData): void

	cancelConnectPeer(peerID: MCPeerID): void
}
