describe("node:events", function () {
    function tryRequire(name) {
        try {
            return require(name);
        } catch (_) {
            return null;
        }
    }

    var events = tryRequire("node:events");
    var EventEmitter = events && events.EventEmitter;

    it("should expose events and node:events", function () {
        expect(events).toBeDefined();
        expect(events).not.toBeNull();
        expect(tryRequire("events")).toBeDefined();
        expect(EventEmitter).toBeDefined();
        expect(typeof EventEmitter).toBe("function");
    });

    it("should emit to listeners in order", function () {
        var e = new EventEmitter();
        var calls = [];
        e.on("data", function (a, b) { calls.push("first:" + a + ":" + b); });
        e.on("data", function () { calls.push("second"); });
        expect(e.emit("data", 1, 2)).toBe(true);
        expect(calls).toEqual(["first:1:2", "second"]);
        expect(e.emit("none")).toBe(false);
    });

    it("should support once and removeListener", function () {
        var e = new EventEmitter();
        var hits = [];
        e.once("tick", function (v) { hits.push(v); });
        e.emit("tick", 1);
        e.emit("tick", 2);
        expect(hits).toEqual([1]);

        var fn = function () {};
        e.on("x", fn);
        expect(e.listenerCount("x")).toBe(1);
        e.removeListener("x", fn);
        expect(e.listenerCount("x")).toBe(0);
    });

    it("should support prependListener and eventNames", function () {
        var e = new EventEmitter();
        var order = [];
        e.on("ev", function () { order.push("b"); });
        e.prependListener("ev", function () { order.push("a"); });
        e.emit("ev");
        expect(order).toEqual(["a", "b"]);
        expect(e.eventNames()).toEqual(["ev"]);
    });

    it("should throw unhandled error events", function () {
        var e = new EventEmitter();
        var thrown = null;
        try {
            e.emit("error", new Error("boom"));
        } catch (err) {
            thrown = err;
        }
        expect(thrown).not.toBeNull();
        expect(thrown.message).toBe("boom");

        var handled = [];
        e.on("error", function (err) { handled.push(err.message); });
        e.emit("error", new Error("caught"));
        expect(handled).toEqual(["caught"]);
    });

    it("should emit newListener and removeListener", function () {
        var e = new EventEmitter();
        var added = [];
        var removed = [];
        e.on("newListener", function (name) { added.push(name); });
        e.on("removeListener", function (name) { removed.push(name); });
        var fn = function () {};
        e.on("tick", fn);
        e.removeListener("tick", fn);
        // newListener fires for 'newListener' itself on first registration
        expect(added).toContain("tick");
        expect(removed).toEqual(["tick"]);
    });

    it("should implement removeAllListeners and maxListeners", function () {
        var e = new EventEmitter();
        e.on("a", function () {});
        e.on("b", function () {});
        expect(e.listenerCount("a")).toBe(1);
        e.removeAllListeners("a");
        expect(e.listenerCount("a")).toBe(0);
        expect(e.eventNames()).toEqual(["b"]);
        e.removeAllListeners();
        expect(e.eventNames()).toEqual([]);
        expect(e.setMaxListeners(2).getMaxListeners()).toBe(2);
        expect(e.getMaxListeners()).toBe(2);
    });

    it("should resolve events.once", function (done) {
        var e = new EventEmitter();
        events.once(e, "go").then(function (args) {
            expect(args).toEqual([42]);
            done();
        });
        e.emit("go", 42);
    });
});
