describe("node:util", function () {
    function tryRequire(name) {
        try {
            return require(name);
        } catch (_) {
            return null;
        }
    }

    var util = tryRequire("node:util");

    it("should expose util and node:util", function () {
        expect(util).toBeDefined();
        expect(util).not.toBeNull();
        expect(tryRequire("util")).toBeDefined();
        expect(typeof util.format).toBe("function");
        expect(typeof util.inspect).toBe("function");
    });

    it("should format strings", function () {
        expect(util.format("%s-%d", "a", 3)).toBe("a-3");
        expect(util.format("%s %s %s", "a", "b")).toBe("a b %s");
        expect(util.format("%j", { a: 1 })).toBe('{"a":1}');
        expect(util.format(1, 2)).toBe("1 2");
        expect(util.format("%%")).toBe("%");
    });

    it("should inspect values", function () {
        expect(util.inspect("s")).toBe("'s'");
        expect(util.inspect([1, 2])).toBe("[ 1, 2 ]");
        expect(util.inspect({ a: 1 })).toBe("{ a: 1 }");
        var circ = {};
        circ.self = circ;
        expect(util.inspect(circ)).toContain("[Circular]");
        expect(util.inspect(function named() {})).toContain("named");
    });

    it("should implement inherits", function () {
        function Base() { this.base = true; }
        Base.prototype.b = function () { return "b"; };
        function Child() { Base.call(this); this.child = true; }
        util.inherits(Child, Base);
        var c = new Child();
        expect(c instanceof Base).toBe(true);
        expect(c.b()).toBe("b");
        expect(Child.super_).toBe(Base);
    });

    it("should implement isDeepStrictEqual", function () {
        expect(util.isDeepStrictEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
        expect(util.isDeepStrictEqual({ a: 1 }, { a: "1" })).toBe(false);
        expect(util.isDeepStrictEqual(NaN, NaN)).toBe(true);
        expect(util.isDeepStrictEqual(new Date(1000), new Date(1000))).toBe(true);
        expect(util.isDeepStrictEqual(new Map([["k", 1]]), new Map([["k", 1]]))).toBe(true);
    });

    it("should implement types checks", function () {
        var t = util.types;
        expect(t.isDate(new Date())).toBe(true);
        expect(t.isRegExp(/x/)).toBe(true);
        expect(t.isPromise(Promise.resolve())).toBe(true);
        expect(t.isNativeError(new Error())).toBe(true);
        expect(t.isUint8Array(new Uint8Array(4))).toBe(true);
        expect(t.isMap(new Map())).toBe(true);
        expect(t.isSet(new Set())).toBe(true);
        expect(t.isDate("2024")).toBe(false);
    });

    it("should implement promisify and callbackify", function (done) {
        var fn = util.promisify(function (a, b, cb) { cb(null, a + b); });
        fn(2, 3).then(function (v) {
            expect(v).toBe(5);
            var cbfn = util.callbackify(function (x) { return x * 2; });
            cbfn(4, function (err, v) {
                expect(err).toBe(null);
                expect(v).toBe(8);
                done();
            });
        });
    });

    it("should provide utf8 TextEncoder/TextDecoder", function () {
        var enc = new util.TextEncoder();
        var bytes = enc.encode("héllo");
        expect(bytes instanceof Uint8Array).toBe(true);
        var dec = new util.TextDecoder("utf-8");
        expect(dec.decode(bytes)).toBe("héllo");
        var roundTrip = dec.decode(enc.encode(""));
        expect(roundTrip).toBe("");
    });
});
