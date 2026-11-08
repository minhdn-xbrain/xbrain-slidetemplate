"""Agent-facing regressions: contract parity, honest data, lossless repair and release gates."""
import json
import hashlib
import os
from pathlib import Path
import re
import tempfile
import unittest

import test_compiler as compiler
from test_compiler import ROOT, cli, codes, runtime


class AgentEngineTest(unittest.TestCase):
    compile = compiler.CompilerTest.compile
    deck = compiler.CompilerTest.deck

    def test_duplicate_projection_is_rejected_by_runtime(self):
        deck = self.deck({"type": "table", "data": [{"x": 1}], "transform": {"select": ["x", "x"]}})
        r = runtime("process.stdout.write(JSON.stringify(rt.call('validate',input)));", deck)
        self.assertIn("uniqueItems", {d.get("keyword") for d in r["diagnostics"]})

    def test_malformed_documents_return_diagnostics_in_every_stage(self):
        docs = [{"version": "1.0", "slides": value} for value in [None, {}, "wrong", [None], [42]]]
        docs += [self.deck({"type": "card", "children": {}}), self.deck({"type": "chart", "transform": {"select": 42}})]
        result = runtime("process.stdout.write(JSON.stringify(input.flatMap(d=>['validate','compile','qa','repair'].map(m=>{try { const r=rt.call(m,d);return {m,ok:r.ok,codes:r.diagnostics.map(x=>x.code)};}catch(e){return {m,threw:e.message};}}))));", docs)
        for r in result:
            self.assertNotIn("threw", r, r)
            self.assertFalse(r["ok"], r)
            self.assertIn("schema.invalid", r["codes"], r)

    def test_missing_document_version_is_never_repaired(self):
        doc = {"slides": [{"type": "cover", "content": {}}]}
        r = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", doc)
        self.assertFalse(r["ok"])
        self.assertEqual(r["changes"], [])
        self.assertEqual(r["document"], doc)

    def test_repair_preserves_out_of_range_business_values(self):
        doc = self.deck({"type": "progress", "value": 140}, {"type": "rating", "value": 9})
        r = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", doc)
        self.assertEqual([c["value"] for c in r["document"]["slides"][0]["components"]], [140, 9])
        self.assertFalse(r["ok"])

    def test_registry_series_limit_is_reported(self):
        row = {"label": "Q1", **{f"series{i}": i for i in range(1, 9)}}
        for variant in ["line", "grouped-bar", "heatmap"]:
            r = self.compile(self.deck({"type": "chart", "variant": variant, "data": [row | {"series9": 9}]}))
            self.assertIn("data.truncated", codes(r["diagnostics"]), variant)

    def test_missing_stack_value_is_not_encoded_as_zero(self):
        for variant in ["grouped-bar", "stacked-bar", "stacked-100", "marimekko"]:
            r = self.compile(self.deck({"type": "chart", "variant": variant, "data": [
                {"label": "Complete", "A": 2, "B": 3}, {"label": "Missing", "A": 5}]}))
            self.assertIn("data.non-numeric", codes(r["diagnostics"], "error"))
            self.assertNotIn('data-v="0"', r["slides"][0]["html"])

    def test_invalid_calendar_dates_and_reverse_intervals_are_errors(self):
        for start, end in [("2026-02-31", "2026-03-05"), ("2026-13", "2027-01"), (5, 2)]:
            r = self.compile(self.deck({"type": "diagram", "variant": "gantt", "nodes": [
                {"label": "Invalid task", "start": start, "end": end}]}))
            self.assertFalse(r["ok"], (start, end))
            self.assertNotIn('data-mark="task"', r["slides"][0]["html"])
        r = self.compile(self.deck({"type": "diagram", "variant": "gantt", "nodes": [
            {"label": "Leap day", "start": "2024-02-29", "end": "2024-03-01"}]}))
        self.assertTrue(r["ok"], r["diagnostics"])

    def test_legacy_chart_template_does_not_create_sample_data(self):
        r = self.compile({"version": "1.0", "slides": [{"type": "charts", "content": {}}]})
        self.assertFalse(r["ok"])
        self.assertNotIn("Sample mix", r["slides"][0]["html"])
        self.assertNotIn(">Labs", r["slides"][0]["html"])

    def test_list_pagination_preserves_items_and_is_idempotent(self):
        items = [f"Item {i:02}: Tiếng Việt có dấu và nội dung cần được giữ nguyên." for i in range(31)]
        doc = self.deck({"type": "card", "span": 12, "children": [{"type": "list", "items": items}]})
        r = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", doc)
        self.assertGreater(len(r["document"]["slides"]), 1)
        actual = [item for s in r["document"]["slides"] for c in s["components"] for child in c["children"] for item in child["items"]]
        self.assertEqual(actual, items)
        self.assertNotIn("layout.overflow", codes(r["diagnostics"]))
        again = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", r["document"])
        self.assertEqual(again["document"], r["document"])

    def test_pipeline_does_not_publish_a_failed_deck(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "deck.html"
            code, report = cli("pipeline", "-", "--offline", "--json", "-o", out,
                               stdin=json.dumps(self.deck({"type": "chart"})))
            self.assertEqual(code, 1)
            self.assertFalse(out.exists())
            self.assertFalse(json.loads(report)["published"])
            self.assertTrue(out.with_suffix(".qa.json").exists())

    def test_untrusted_editable_build_preserves_render_policy(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "app.html"
            code, report = cli("build", "-", "--app", "--offline", "-o", out,
                               stdin=json.dumps(self.deck({"type": "html", "html": '<b>Safe</b><img src=x onerror="globalThis.PWNED=1">'})))
            self.assertEqual(code, 0, report)
            html = out.read_text()
            self.assertTrue('const XB_RENDER_DEFAULTS=Object.freeze({"strict":true,"trust":"untrusted"});' in html)
            self.assertFalse(re.search(r'<script[^>]+src="https?://', html))

    def test_paragraph_pagination_preserves_every_character(self):
        text = "  " + "Một đoạn nội dung dài, có dấu.\n" * 120
        r = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));",
                    self.deck({"type": "paragraph", "text": text, "span": 12}))
        self.assertTrue(r["ok"], r["diagnostics"])
        self.assertGreater(len(r["document"]["slides"]), 1)
        self.assertEqual("".join(c["text"] for s in r["document"]["slides"] for c in s["components"]), text)

    def test_table_pagination_accounts_for_wrapped_cells(self):
        rows = [{"name": f"District {i}", "description": "Dữ liệu cần được trình bày đầy đủ. " * 8} for i in range(10)]
        r = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));",
                    self.deck({"type": "table", "span": 12, "columns": ["name", "description"], "data": rows}))
        self.assertTrue(r["ok"], r["diagnostics"])
        self.assertGreaterEqual(len(r["document"]["slides"]), 3)
        self.assertEqual([row for s in r["document"]["slides"] for c in s["components"] for row in c["data"]], rows)

    def test_pagination_cannot_erase_transform_errors(self):
        doc = self.deck({"type": "table", "span": 12, "data": [{"label": str(i), "value": i} for i in range(30)],
                         "transform": {"derive": {"bad": {"op": "divide", "args": [1, 0]}}}})
        r = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", doc)
        self.assertFalse(r["ok"])
        self.assertIn("data.derive", codes(r["diagnostics"]))
        self.assertIn("transform", r["document"]["slides"][0]["components"][0])

    def test_prototype_names_are_not_datasets(self):
        for name in ["constructor", "toString", "__proto__"]:
            r = self.compile(self.deck({"type": "chart", "dataRef": name}))
            self.assertIn("data.unknown-ref", codes(r["diagnostics"], "error"))

    def test_legacy_sankey_has_one_shared_scale(self):
        r = self.compile({"version": "1.0", "slides": [{"type": "sankey-flow", "content": {
            "sources": [{"label": "Source"}], "targets": [{"label": "One"}, {"label": "Two"}],
            "links": [{"from": 0, "to": 0, "value": 10}, {"from": 0, "to": 1, "value": 1000}]
        }}]})
        self.assertTrue(r["ok"], r["diagnostics"])
        marks = [(float(v), float(w)) for v, w in re.findall(r'data-mark="flow" data-v="([\d.]+)" data-w="([\d.]+)"', r["slides"][0]["html"])]
        self.assertEqual(len(marks), 2)
        self.assertAlmostEqual(marks[0][1] / marks[0][0], marks[1][1] / marks[1][0], places=8)

    def test_pipeline_quality_gate_and_reproducible_manifest(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "nested" / "deck.html"
            doc = self.deck({"type": "text", "text": "A long paragraph. " * 60, "span": 12})
            # A freeform short box keeps the warning reproducible without pagination.
            doc["slides"][0]["layout"] = "freeform"
            doc["slides"][0]["components"][0]["position"] = {"x": 0, "y": 0, "width": 600, "height": 100}
            code, report = cli("pipeline", "-", "--offline", "--json", "--fail-on", "text.overflow", "-o", out, stdin=json.dumps(doc))
            self.assertEqual(code, 1)
            r = json.loads(report)
            self.assertEqual(r["summary"]["errors"], 0)
            self.assertFalse(r["quality"]["passed"])
            self.assertFalse(out.exists())
            doc = self.deck({"type": "text", "text": "Hello"})
            runs = []
            for _ in range(2):
                code, report = cli("pipeline", "-", "--offline", "--json", "-o", out, stdin=json.dumps(doc))
                self.assertEqual(code, 0, report)
                runs.append(json.loads(report))
            self.assertEqual(runs[0], runs[1])
            self.assertEqual(runs[0]["manifest"]["htmlSha256"], hashlib.sha256(out.read_bytes()).hexdigest())
            # Failed retries leave an existing successful artifact byte-identical.
            before = out.read_bytes()
            code, report = cli("pipeline", "-", "--offline", "--json", "-o", out, stdin=json.dumps(self.deck({"type": "chart"})))
            self.assertEqual(code, 1)
            self.assertEqual(out.read_bytes(), before)

    def test_vm_method_names_are_data_and_microtasks_obey_timeout(self):
        r = runtime("""
        let rejected=false;try{rt.call('constructor.constructor(\"return process\")()');}catch(e){rejected=/Unsupported compiler method/.test(e.message);}
        const {loadRuntime:createRuntime}=await import('./tools/xbrain.mjs');const timed=createRuntime({trusted:true,timeout:1000});
        let timeout=false;try{timed.call('compile',input,{trust:'trusted'});}catch(e){timeout=/timed out/.test(e.message);}
        process.stdout.write(JSON.stringify({rejected,timeout}));
        """, {"version": "1.0", "slides": [{"type": "one-off", "render": "Promise.resolve().then(()=>{while(true){}});return '<b>Before timeout</b>';"}]})
        self.assertTrue(r["rejected"])
        self.assertTrue(r["timeout"])

    @unittest.skipUnless(os.environ.get("CHROME_PATH"), "set CHROME_PATH for measured auto-reflow")
    def test_browser_pipeline_reflows_and_replays_identically(self):
        with tempfile.TemporaryDirectory() as tmp:
            out, replay = Path(tmp) / "deck.html", Path(tmp) / "replay.html"
            code, report = cli("pipeline", ROOT / "tests/fixtures/agent-native.json", "--require-browser", "--offline", "--json", "-o", out)
            self.assertEqual(code, 0, report)
            r = json.loads(report)
            self.assertTrue(r["browser"]["measured"])
            self.assertEqual(r["attempts"][-1]["overflows"], 0)
            self.assertLessEqual(len(r["attempts"]), 3)
            safety = r["manifest"]["options"].get("textSafety", 1)
            code, report = cli("build", out.with_suffix(".repaired.json"), "--offline", "--text-safety", safety, "-o", replay)
            self.assertEqual(code, 0, report)
            self.assertEqual(out.read_bytes(), replay.read_bytes())


if __name__ == "__main__":
    unittest.main()
