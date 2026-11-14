describe("node:querystring", function () {
  it("should require node:querystring", function () {
    const qs = require("node:querystring");
    expect(typeof qs.parse).toBe("function");
    expect(typeof qs.stringify).toBe("function");
  });
  it("should stringify objects", function () {
    const qs = require("node:querystring");
    expect(qs.stringify({ a: 1, b: "x y" })).toBe("a=1&b=x%20y");
    expect(qs.stringify({ a: [1, 2] })).toBe("a=1&a=2");
    expect(qs.stringify({ a: 1 }, ";", ":")).toBe("a:1");
    expect(qs.stringify({})).toBe("");
  });
  it("should parse query strings", function () {
    const qs = require("node:querystring");
    expect({ ...qs.parse("a=1&b=2") }).toEqual({ a: "1", b: "2" });
    expect({ ...qs.parse("a=1&a=2") }).toEqual({ a: ["1", "2"] });
    expect({ ...qs.parse("b=x+y") }).toEqual({ b: "x y" });
    expect({ ...qs.parse("a=1;b=2", ";") }).toEqual({ a: "1", b: "2" });
    expect({ ...qs.parse("k") }).toEqual({ k: "" });
    expect({ ...qs.parse("") }).toEqual({});
  });
  it("should round trip", function () {
    const qs = require("node:querystring");
    const obj = { name: "A B", n: "42" };
    expect({ ...qs.parse(qs.stringify(obj)) }).toEqual(obj);
  });
  it("should expose escape/unescape", function () {
    const qs = require("node:querystring");
    expect(qs.escape("a b")).toBe("a%20b");
    expect(qs.unescape("a%20b")).toBe("a b");
    expect(qs.decode).toBe(qs.parse);
    expect(qs.encode).toBe(qs.stringify);
  });
});
