describe("node:stream", function () {
  const S = require("node:stream");
  it("should expose stream classes", function () {
    expect(S.Readable).toBeDefined();
    expect(S.Writable).toBeDefined();
    expect(S.Duplex).toBeDefined();
    expect(S.Transform).toBeDefined();
    expect(S.PassThrough).toBeDefined();
    expect(typeof S.pipeline).toBe("function");
    expect(typeof S.finished).toBe("function");
    expect(S.promises.pipeline).toBeDefined();
  });
  it("should flow data through a Readable", function (done) {
    const r = new S.Readable({
      read() { this.push("a"); this.push("b"); this.push(null); },
    });
    let out = "";
    r.on("data", (c) => { out += c; });
    r.on("end", () => { expect(out).toBe("ab"); done(); });
  });
  it("should write to a Writable and emit finish", function (done) {
    let seen = "";
    const w = new S.Writable({
      write(c, e, cb) { seen += c; cb(); },
    });
    w.on("finish", () => { expect(seen).toBe("xy"); done(); });
    w.write("x");
    w.end("y");
  });
  it("should pipe through a Transform", function (done) {
    const src = new S.Readable({
      read() { this.push("hi"); this.push(null); },
    });
    const t = new S.Transform({
      transform(c, e, cb) { cb(null, c.toString().toUpperCase()); },
    });
    let res = "";
    const sink = new S.Writable({
      write(c, e, cb) { res += c; cb(); },
    });
    S.pipeline(src, t, sink, (err) => {
      expect(err).toBeUndefined();
      expect(res).toBe("HI");
      done();
    });
  });
  it("should support async iteration and Readable.from", async function () {
    const r = S.Readable.from([1, 2, 3]);
    let sum = 0;
    for await (const v of r) sum += v;
    expect(sum).toBe(6);
  });
  it("should PassThrough data", function (done) {
    const pt = new S.PassThrough();
    let out = "";
    pt.on("data", (c) => { out += c; });
    pt.on("end", () => { expect(out).toBe("q"); done(); });
    pt.write("q");
    pt.end();
  });
  it("should error on write after end", function (done) {
    const w = new S.Writable();
    w.on("error", (e) => {
      expect(e.message).toBe("write after end");
      done();
    });
    w.end();
    w.write("z");
  });
  it("should pause and resume", function (done) {
    const r = new S.Readable({ objectMode: true });
    r.push(1);
    r.push(null);
    r.pause();
    expect(r.isPaused()).toBe(true);
    let n = 0;
    r.on("data", () => { n++; });
    r.on("end", () => { expect(n).toBe(1); done(); });
    r.resume();
  });
});
