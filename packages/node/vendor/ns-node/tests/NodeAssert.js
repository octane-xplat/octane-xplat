describe("node:assert", function () {
    function tryRequire(name) {
        try {
            return require(name);
        } catch (_) {
            return null;
        }
    }

    var assert = tryRequire("node:assert");

    function catchAssertion(fn) {
        try {
            fn();
        } catch (e) {
            return e;
        }
        return null;
    }

    it("should expose assert and node:assert", function () {
        expect(assert).toBeDefined();
        expect(assert).not.toBeNull();
        expect(tryRequire("assert")).toBeDefined();
        expect(typeof assert.ok).toBe("function");
        expect(assert.AssertionError).toBeDefined();
    });

    it("should implement ok/fail/equal family", function () {
        assert.ok(1);
        assert.equal(1, "1");
        assert.strictEqual(1, 1);
        assert.notStrictEqual(1, "1");
        assert.notEqual(1, 2);

        var e = catchAssertion(function () { assert.strictEqual(1, "1"); });
        expect(e instanceof assert.AssertionError).toBe(true);
        expect(e.code).toBe("ERR_ASSERTION");
        expect(e.operator).toBe("strictEqual");
    });

    it("should implement deep equality", function () {
        assert.deepStrictEqual({ a: [1, 2], b: { c: 3 } }, { a: [1, 2], b: { c: 3 } });
        assert.notDeepStrictEqual({ a: 1 }, { a: 2 });
        assert.deepEqual({ a: 1 }, { a: "1" });
        var e = catchAssertion(function () {
            assert.deepStrictEqual({ a: 1 }, { a: "1" });
        });
        expect(e instanceof assert.AssertionError).toBe(true);
    });

    it("should implement throws/doesNotThrow", function () {
        assert.throws(function () { throw new Error("x"); });
        assert.throws(function () { throw new Error("x"); }, Error);
        assert.throws(function () { throw new TypeError("x"); }, /TypeError/);
        assert.doesNotThrow(function () {});
        var e = catchAssertion(function () { assert.throws(function () {}); });
        expect(e instanceof assert.AssertionError).toBe(true);
    });

    it("should implement rejects/doesNotReject", function (done) {
        assert.rejects(function () { return Promise.reject(new Error("no")); })
            .then(function () {
                return assert.rejects(Promise.reject(new TypeError("t")), TypeError);
            })
            .then(function () {
                return assert.doesNotReject(Promise.resolve(5));
            })
            .then(function () { done(); })
            .catch(function (e) { done.fail(e); });
    });

    it("should implement ifError and match", function () {
        assert.ifError(null);
        assert.ifError(undefined);
        var e = catchAssertion(function () { assert.ifError(new Error("x")); });
        expect(e).not.toBeNull();
        assert.match("hello world", /world/);
        assert.doesNotMatch("hello", /xyz/);
        var e2 = catchAssertion(function () { assert.match("hello", /xyz/); });
        expect(e2 instanceof assert.AssertionError).toBe(true);
    });

    it("should expose assert.strict", function () {
        expect(typeof assert.strict).toBe("function");
        var e = catchAssertion(function () {
            assert.strict.deepEqual({ a: 1 }, { a: "1" });
        });
        expect(e instanceof assert.AssertionError).toBe(true);
    });
});
