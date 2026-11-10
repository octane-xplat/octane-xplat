"""Nonvisual xctrace export analysis. Never substitutes surface counts for frames."""
import json
import sys
from pathlib import Path
import xml.etree.ElementTree as ET


def rows(path):
    root = ET.parse(path).getroot()
    identities = {e.get("id"): e for e in root.iter() if e.get("id")}

    def resolve(element):
        while element.get("ref"):
            element = identities[element.get("ref")]
        return element

    columns = None
    result = []
    for node in root.findall("node"):
        schema = node.find("schema")
        if schema is not None:
            columns = [col.findtext("mnemonic") for col in resolve(schema)]
        for row in node.findall("row"):
            if columns is None or len(row) != len(columns):
                raise ValueError("Missing or incompatible xctrace schema")
            result.append(dict(zip(columns, (resolve(cell) for cell in row))))
    return result


def text(cell):
    return cell.get("fmt", cell.text or "")


def number(cell):
    # Raw durations/timestamps are nanoseconds. Formatted strings are not data.
    return int(cell.text)


def process_id(cell):
    pid = cell.find("pid")
    if pid is None:
        raise ValueError("Missing process identity")
    return number(pid)


def summarize(signposts, hitches, surfaces, pid, scenario):
    events = []
    seen = set()
    for row in signposts:
        if text(row["subsystem"]) != "org.octanexplat.animation" or process_id(row["process"]) != pid:
            continue
        key = (number(row["time"]),) + tuple(text(row[k]) for k in ("event-type", "name", "identifier", "scope"))
        if key not in seen:
            seen.add(key)  # xctrace can export the same event in two tables.
            events.append(row)
    events.sort(key=lambda row: number(row["time"]))
    active = None
    label = None
    intervals = []
    problems = []
    for row in events:
        name, kind = text(row["name"]), text(row["event-type"])
        if name == "ScenarioName" and kind == "Event":
            label = text(row["message"])
        elif name == "Scenario" and kind == "Begin":
            if active is not None:
                problems.append("Overlapping Scenario begins")
            active = (number(row["time"]), label, text(row["identifier"]))
            label = None
        elif name == "Scenario" and kind == "End":
            if active is None or active[2] != text(row["identifier"]):
                problems.append("Unmatched Scenario end")
                continue
            start, name, _ = active
            end = number(row["time"])
            active = None
            if name != scenario or end <= start:
                problems.append("Missing scenario label or invalid interval")
                continue
            matching = [h for h in hitches if process_id(h["process"]) == pid
                        and number(h["start"]) < end
                        and number(h["start"]) + number(h["duration"]) > start]
            # Clip ratio to the measured window; preserve the whole isolated stall.
            hitch_ns = sum(min(end, number(h["start"]) + number(h["duration"]))
                           - max(start, number(h["start"])) for h in matching)
            intervals.append({
                "scenario": scenario,
                "startSeconds": start / 1e9,
                "durationSeconds": (end - start) / 1e9,
                "hitchMs": hitch_ns / 1e6,
                "worstHitchMs": max((number(h["duration"]) / 1e6 for h in matching), default=0),
                "hitchMsPerSecond": hitch_ns * 1000 / (end - start),
                "displayedSurfaceChanges": sum(start <= number(s["start"]) < end for s in surfaces),
                "frameCount": None,
            })
    if active is not None:
        problems.append("Unclosed Scenario interval")
    if len(intervals) != 6:
        problems.append(f"Expected warmup plus five trials; found {len(intervals)} intervals")
    problems.append("Positive presentation frame count unavailable; surface changes are not frame count")
    return {
        "qualifiedBaseline": False,
        "problems": problems,
        "intervals": intervals,
        "targetHitches": [{"startSeconds": number(h["start"]) / 1e9,
                           "durationMs": number(h["duration"]) / 1e6}
                          for h in hitches if process_id(h["process"]) == pid],
    }


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python3 summarize.py EXPORTED_TEST_STEM SCENARIO")
    stem, scenario = sys.argv[1:]
    toc = ET.parse(stem + ".toc.xml").getroot()
    target = toc.find("run/info/target")
    if target.find("device").get("platform") != "iOS":
        raise ValueError("Requires a physical iOS trace")
    pid = int(target.find("process").get("pid"))
    report = summarize(rows(stem + ".os-signpost.xml"), rows(stem + ".hitches.xml"),
                       rows(stem + ".displayed-surfaces-interval.xml"), pid, scenario)
    report["trace"] = str(Path(stem + ".trace").resolve())
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
