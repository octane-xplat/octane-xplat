import tempfile
import unittest
from pathlib import Path
import xml.etree.ElementTree as ET
from summarize import rows, summarize


def cell(value):
    result = ET.Element("value")
    result.text = str(value)
    return result


def event(time, kind, name, message="", pid=42):
    process = ET.Element("process")
    ET.SubElement(process, "pid").text = str(pid)
    return {"time": cell(time), "event-type": cell(kind), "name": cell(name),
            "message": cell(message), "process": process, "scope": cell("Process"),
            "identifier": cell("exclusive"), "subsystem": cell("org.octanexplat.animation")}


class TraceAnalysisTests(unittest.TestCase):
    def test_reference_cells_and_implicit_repeated_schema(self):
        xml = ('<trace-query-result><node><schema><col><mnemonic>start</mnemonic></col></schema>'
               '<row><start-time id="1" fmt="1 s">1000000000</start-time></row></node>'
               '<node><row><start-time ref="1"/></row></node></trace-query-result>')
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "export.xml"
            path.write_text(xml)
            parsed = rows(path)
        self.assertEqual(parsed[0]["start"].text, "1000000000")
        self.assertIs(parsed[1]["start"], parsed[0]["start"])

    def test_duplicate_tables_do_not_double_count_intervals(self):
        events = [event(0, "Event", "ScenarioName", "tween"),
                  event(1, "Begin", "Scenario"), event(1000000001, "End", "Scenario")]
        report = summarize(events + events, [], [], 42, "tween")
        self.assertEqual(len(report["intervals"]), 1)
        self.assertFalse(report["qualifiedBaseline"])
        self.assertTrue(any("found 1" in message for message in report["problems"]))

    def test_hitches_are_scoped_clipped_and_preserve_full_worst_stall(self):
        events = [event(0, "Event", "ScenarioName", "spring"),
                  event(1000000000, "Begin", "Scenario"), event(2000000000, "End", "Scenario")]
        process = events[0]["process"]
        hitches = [{"start": cell(950000000), "duration": cell(100000000), "process": process},
                   {"start": cell(3000000000), "duration": cell(800000000), "process": process},
                   {"start": cell(1100000000), "duration": cell(700000000),
                    "process": event(0, "Event", "", pid=99)["process"]}]
        result = summarize(events, hitches, [{"start": cell(1200000000)}], 42, "spring")["intervals"][0]
        self.assertEqual(result["hitchMs"], 50)
        self.assertEqual(result["worstHitchMs"], 100)
        self.assertEqual(result["hitchMsPerSecond"], 50)
        self.assertEqual(result["displayedSurfaceChanges"], 1)
        self.assertIsNone(result["frameCount"])

    def test_missing_label_and_unclosed_interval_cannot_qualify(self):
        report = summarize([event(1, "Begin", "Scenario"), event(3, "End", "Scenario"),
                            event(4, "Begin", "Scenario")], [], [], 42, "drag")
        self.assertFalse(report["qualifiedBaseline"])
        self.assertIn("Unclosed Scenario interval", report["problems"])
        self.assertEqual(report["intervals"], [])
