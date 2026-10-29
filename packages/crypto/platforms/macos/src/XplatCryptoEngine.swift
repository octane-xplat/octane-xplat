import Foundation
import CryptoKit

@objc(XplatCryptoEngine)
@objcMembers
public final class XplatCryptoEngine: NSObject {
    public static func perform(_ request: String) -> String {
        do {
            guard let data = request.data(using: .utf8),
                  let value = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let operation = value["operation"] as? String,
                  let input = value["data"] as? String, let bytes = Data(base64Encoded: input) else { throw CryptoKitError.incorrectParameterSize }
            let result: Data
            if operation == "digest" {
                switch value["algorithm"] as? String {
                case "SHA-1": result = Data(Insecure.SHA1.hash(data: bytes))
                case "SHA-256": result = Data(SHA256.hash(data: bytes))
                case "SHA-384": result = Data(SHA384.hash(data: bytes))
                case "SHA-512": result = Data(SHA512.hash(data: bytes))
                case "MD5": result = Data(Insecure.MD5.hash(data: bytes))
                default: throw CryptoKitError.incorrectParameterSize
                }
            } else {
                guard operation == "encrypt" || operation == "decrypt",
                      let rawKey = value["key"] as? String, let keyBytes = Data(base64Encoded: rawKey),
                      [16, 24, 32].contains(keyBytes.count),
                      let rawIV = value["iv"] as? String, let iv = Data(base64Encoded: rawIV), iv.count == 12,
                      let rawAAD = value["aad"] as? String, let aad = Data(base64Encoded: rawAAD) else { throw CryptoKitError.incorrectParameterSize }
                let key = SymmetricKey(data: keyBytes), nonce = try AES.GCM.Nonce(data: iv)
                if operation == "encrypt" {
                    let sealed = try AES.GCM.seal(bytes, using: key, nonce: nonce, authenticating: aad)
                    result = sealed.ciphertext + sealed.tag
                } else {
                    guard bytes.count >= 16 else { throw CryptoKitError.incorrectParameterSize }
                    let sealed = try AES.GCM.SealedBox(nonce: nonce, ciphertext: bytes.dropLast(16), tag: bytes.suffix(16))
                    result = try AES.GCM.open(sealed, using: key, authenticating: aad)
                }
            }
            return response(["ok": true, "data": result.base64EncodedString()])
        } catch { return response(["ok": false]) }
    }
    private static func response(_ value: [String: Any]) -> String {
        return String(data: try! JSONSerialization.data(withJSONObject: value), encoding: .utf8)!
    }
}
