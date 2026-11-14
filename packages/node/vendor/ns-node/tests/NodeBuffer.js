describe("node:buffer", function () {
  it("should require node:buffer", function () {
    const b = require("node:buffer");
    expect(b.Buffer).toBeDefined();
    expect(typeof b.Buffer.from).toBe("function");
  });
  it("should require bare buffer", function () {
    const b = require("buffer");
    expect(b.Buffer.from("x").toString()).toBe("x");
  });
  it("should create buffers via from/alloc/allocUnsafe", function () {
    const { Buffer } = require("node:buffer");
    expect(Buffer.from("hello").length).toBe(5);
    expect(Buffer.alloc(4).length).toBe(4);
    expect(Buffer.alloc(4, 0x41).toString()).toBe("AAAA");
    expect(Buffer.allocUnsafe(3).length).toBe(3);
    expect(Buffer.from([1, 2, 3]).length).toBe(3);
    const ab = new ArrayBuffer(4);
    new Uint8Array(ab).set([9, 8, 7, 6]);
    expect(Buffer.from(ab).length).toBe(4);
    expect(Buffer.from(ab)[0]).toBe(9);
  });
  it("should handle utf8 round trip", function () {
    const { Buffer } = require("node:buffer");
    const s = "héllo wörld";
    const b = Buffer.from(s, "utf8");
    expect(b.toString("utf8")).toBe(s);
    expect(Buffer.byteLength(s)).toBe(b.length);
    expect(Buffer.byteLength(s)).toBeGreaterThan(s.length);
  });
  it("should handle hex and base64 round trips", function () {
    const { Buffer } = require("node:buffer");
    const b = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
    expect(b.toString("hex")).toBe("deadbeef");
    expect(Buffer.from("deadbeef", "hex").equals(b)).toBe(true);
    const b64 = b.toString("base64");
    expect(Buffer.from(b64, "base64").equals(b)).toBe(true);
    expect(Buffer.from("hi").toString("base64")).toBe("aGk=");
  });
  it("should handle latin1 and utf16le", function () {
    const { Buffer } = require("node:buffer");
    expect(Buffer.from("abc", "latin1").toString("hex")).toBe("616263");
    const u16 = Buffer.from("ab", "utf16le");
    expect(u16.length).toBe(4);
    expect(u16.toString("utf16le")).toBe("ab");
    expect(Buffer.from("ab", "ucs2").toString("ucs2")).toBe("ab");
  });
  it("should slice, fill, copy, concat", function () {
    const { Buffer } = require("node:buffer");
    const b = Buffer.from("hello world");
    expect(b.slice(0, 5).toString()).toBe("hello");
    const f = Buffer.alloc(4).fill("x");
    expect(f.toString()).toBe("xxxx");
    const t = Buffer.alloc(5);
    Buffer.from("hello").copy(t, 0);
    expect(t.toString()).toBe("hello");
    expect(Buffer.concat([Buffer.from("ab"), Buffer.from("cd")]).toString())
      .toBe("abcd");
  });
  it("should compare, equals, indexOf, includes", function () {
    const { Buffer } = require("node:buffer");
    expect(Buffer.compare(Buffer.from("a"), Buffer.from("b"))).toBeLessThan(0);
    expect(Buffer.from("abc").equals(Buffer.from("abc"))).toBe(true);
    expect(Buffer.from("hello").indexOf("llo")).toBe(2);
    expect(Buffer.from("hello").includes("ell")).toBe(true);
    expect(Buffer.from("hello").lastIndexOf("l")).toBe(3);
    expect(Buffer.from("ab").indexOf("z")).toBe(-1);
  });
  it("should read/write numeric types", function () {
    const { Buffer } = require("node:buffer");
    const b = Buffer.alloc(16);
    b.writeUInt8(255, 0);
    b.writeInt8(-1, 1);
    b.writeUInt16LE(0x1234, 2);
    b.writeUInt32BE(0xdeadbeef, 4);
    b.writeDoubleLE(1.5, 8);
    expect(b.readUInt8(0)).toBe(255);
    expect(b.readInt8(1)).toBe(-1);
    expect(b.readUInt16LE(2)).toBe(0x1234);
    expect(b.readUInt32BE(4)).toBe(0xdeadbeef);
    expect(b.readDoubleLE(8)).toBe(1.5);
    expect(() => b.readUInt32LE(14)).toThrow();
  });
  it("should report isBuffer and isEncoding", function () {
    const { Buffer } = require("node:buffer");
    expect(Buffer.isBuffer(Buffer.alloc(1))).toBe(true);
    expect(Buffer.isBuffer(new Uint8Array(1))).toBe(false);
    expect(Buffer.isBuffer("nope")).toBe(false);
    expect(Buffer.isEncoding("hex")).toBe(true);
    expect(Buffer.isEncoding("bogus")).toBe(false);
  });
  it("should serialize to JSON", function () {
    const { Buffer } = require("node:buffer");
    const j = Buffer.from("ab").toJSON();
    expect(j.type).toBe("Buffer");
    expect(j.data).toEqual([97, 98]);
  });
});
