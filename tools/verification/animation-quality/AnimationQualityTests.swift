import XCTest

// Add to a dedicated iOS UI-testing target. Scheme: Release, debugger/coverage/
// diagnostics/automatic screenshots OFF. Never run this in lightweight PR CI.
final class AnimationQualityTests: XCTestCase {
    private let app = XCUIApplication(bundleIdentifier: "org.octanexplat.animationquality")

    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        // The recording runner launches the installed Release app before attaching.
        // activate() also launches it for standalone functional execution.
        app.activate()
        XCTAssertTrue(app.staticTexts["status"].waitForExistence(timeout: 15))
    }

    private func button(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    private func play(_ scenario: String) {
        button("select-" + scenario).tap()
        button("start").tap()
        if scenario == "drag" {
            let card = button("card")
            XCTAssertEqual(app.staticTexts["status"].label, "running")
            card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
                .press(forDuration: 0.05, thenDragTo: card.coordinate(withNormalizedOffset: CGVector(dx: 2, dy: 0.5)))
        } else if scenario == "scroll" {
            button("scroller").swipeUp(velocity: .slow)
            button("scroller").swipeDown(velocity: .slow)
        } else if scenario == "sheet" {
            XCTAssertTrue(button("close-sheet").waitForExistence(timeout: 5))
            button("close-sheet").tap()
            XCTAssertTrue(button("close-sheet").waitForNonExistence(timeout: 5))
        }
        if scenario == "drag" {
            XCTAssertEqual(app.staticTexts["status"].label, "drag-ended")
        }
        // Fixed tail includes spring settlement. Keep this duration unchanged
        // between baselines; use Instruments' active-animation durations.
        Thread.sleep(forTimeInterval: 2)
        button("finish").tap()
    }

    private func benchmark(_ scenario: String) {
        let options = XCTMeasureOptions()
        options.iterationCount = 5
        measure(metrics: [XCTOSSignpostMetric(subsystem: "org.octanexplat.animation", category: "Quality", name: "Scenario")], options: options) {
            play(scenario)
        }
    }
    func testTween() { benchmark("tween") }
    func testSpring() { benchmark("spring") }
    func testDrag() { benchmark("drag") }
    func testRetarget() { benchmark("retarget") }
    func testLayout() { benchmark("layout") }
    func testShared() { benchmark("shared") }
    func testSheet() {
        benchmark("sheet")
        // Keep the same owner through all presentations, then release it.
        button("select-tween").tap()
        button("finish").tap()
    }
    func testScroll() { benchmark("scroll") }

    // Instruments owns presentation collection in these cases. Running a second
    // XCTOSSignpostMetric collector at the same time can leave incomplete windows.
    private func presentation(_ scenario: String) {
        for _ in 0..<6 { play(scenario) }
    }
    func testPresentationTween() { presentation("tween") }
    func testPresentationSpring() { presentation("spring") }
    func testPresentationDrag() { presentation("drag") }
    func testPresentationRetarget() { presentation("retarget") }
    func testPresentationLayout() { presentation("layout") }
    func testPresentationShared() { presentation("shared") }
    func testPresentationSheet() {
        presentation("sheet")
        button("select-tween").tap()
        button("finish").tap()
    }
    func testPresentationScroll() { presentation("scroll") }

    // Explicit diagnostic recording only; excluded from the recorder's default suite.
    func testDiagnosticCosts() {
        button("diagnostic").tap()
        play("spring")
        play("layout")
        play("retarget")
    }

    func testDisposalAndResume() {
        button("select-spring").tap()
        button("start").tap()
        button("dispose").tap()
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertFalse(button("card").exists)
        let idle = NSPredicate(format: "label == %@", "idle")
        let expectation = XCTNSPredicateExpectation(predicate: idle, object: app.staticTexts["status"])
        let outcome = XCTWaiter.wait(for: [expectation], timeout: 15)
        let status = app.staticTexts["status"].label
        button("finish").tap()
        XCTAssertEqual(outcome, .completed, "Idle check ended with status: " + status)
    }
}
