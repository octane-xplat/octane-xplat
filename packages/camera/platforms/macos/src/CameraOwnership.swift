import Foundation

/// Shared by preview, movie and still-photo hosts. A busy source is never stolen.
enum CameraOwnership {
	private static let lock = NSLock()
	private static var owners: [String: ObjectIdentifier] = [:]

	static func claim(_ id: String, owner: AnyObject) -> Bool {
		lock.lock()
		defer { lock.unlock() }
		let token = ObjectIdentifier(owner)
		guard owners[id] == nil || owners[id] == token else { return false }
		owners[id] = token
		return true
	}

	static func release(_ id: String, owner: AnyObject) {
		lock.lock()
		defer { lock.unlock() }
		if owners[id] == ObjectIdentifier(owner) { owners.removeValue(forKey: id) }
	}
}
