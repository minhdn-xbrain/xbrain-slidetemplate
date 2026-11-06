"""Agent compiler checks: validate → render → QA → repair → build on real and edge-case decks.

Requires Node.js ≥ 18 and Python jsonschema ≥ 4.10. Chrome/Edge is optional (pixel QA test skips without it).
Run: python -m unittest discover -s tests -p 'test_*.py'
"""
import json
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "tools" / "xbrain.mjs"
FIX = ROOT / "tests" / "fixtures"
SCHEMA = ROOT / "contracts" / "xbrain-deck-v1.schema.json"


def cli(*args, stdin=None):
    """Run the CLI; returns (exit code, stdout)."""
    res = subprocess.run(["node", str(CLI), *map(str, args)], cwd=ROOT, input=stdin,
                         capture_output=True, text=True, encoding="utf-8", timeout=180)
    return res.returncode, res.stdout


def runtime(script, payload=None, trusted=False):
    """Run JS against the loaded runtime: `rt.call(...)` is available, `input` is the JSON payload."""
    code = ("import {loadRuntime} from './tools/xbrain.mjs';"
            f"const rt=loadRuntime({{trusted:{'true' if trusted else 'false'}}});"
            "const input=JSON.parse(require_stdin());" + script)
    code = code.replace("require_stdin()", "(await import('node:fs')).readFileSync(0,'utf8')")
    res = subprocess.run(["node", "--input-type=module", "-e", code], cwd=ROOT, input=json.dumps(payload),
                         capture_output=True, text=True, encoding="utf-8", timeout=180)
    if res.returncode:
        raise AssertionError(res.stderr)
    return json.loads(res.stdout)


def load(name):
    return json.loads((FIX / name).read_text(encoding="utf-8"))


def codes(diags, severity=None):
    return {d["code"] for d in diags if severity is None or d["severity"] == severity}


def svg_marks(html, kind):
    """(value, width, height, x, y) for every primary mark of a kind in compiled HTML."""
    out = []
    for tag in re.findall(r'<rect[^>]*data-mark="%s"[^>]*>' % kind, html):
        attr = lambda n: re.search(r'\s%s="([^"]*)"' % n, tag).group(1)
        out.append((float(attr("data-v")), float(attr("width")), float(attr("height")), float(attr("x")), float(attr("y"))))
    return out


class CompilerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.validator = Draft202012Validator(json.loads(SCHEMA.read_text(encoding="utf-8")))

    def compile(self, deck, **opts):
        return runtime("process.stdout.write(JSON.stringify(rt.call('compile',input.deck,input.opts)));",
                       {"deck": deck, "opts": opts}, trusted=opts.get("trust") == "trusted")

    def deck(self, *components, datasets=None):
        return {"version": "1.0", "datasets": datasets or {},
                "slides": [{"type": "composer", "title": "Test", "components": list(components)}]}

    # --- unified contract -------------------------------------------------------------------
    def test_schema_file_is_derived_from_runtime(self):
        code, out = cli("schema")
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(out), json.loads(SCHEMA.read_text(encoding="utf-8")),
                         "contracts/ schema is stale: run node tools/xbrain.mjs schema --write")

    def test_contract_lists_every_registered_variant_with_a_data_contract(self):
        code, out = cli("contract")
        contract = json.loads(out)
        schema = contract["schema"]["$defs"]
        self.assertEqual([v["id"] for v in contract["variants"]["chart"]], schema["chartVariant"]["enum"])
        for family in ("chart", "flow", "structure"):
            for v in contract["variants"][family]:
                self.assertTrue(v["data"], v["id"])
        self.assertTrue(all(l["contentSchema"] for l in contract["layouts"]))
        self.assertIn("data.missing", contract["diagnostics"])

    def test_builtin_validator_agrees_with_jsonschema(self):
        docs = [load("qbr-deck.json"), load("edge-cases.json"), load("untrusted.json"),
                json.loads((ROOT / "contracts/example-deck-v1.json").read_text(encoding="utf-8")),
                self.deck({"type": "text", "span": 0}), self.deck({"type": "chart", "variant": "flowchart"}),
                self.deck({"type": "diagram", "variant": "iceberg", "nodes": ["a"]}),
                {"version": "1.0", "slides": [{"type": "cover", "content": {"titel": "x"}}]},
                {"version": "1.0", "slides": [{"type": "cover"}]}, {"version": "1.0", "slides": []},
                {"version": "1.0", "slides": [{"type": "kpi", "content": {}, "render": "return ''"}]},
                {"version": "1.0", "layouts": {"x": {"group": "Z"}}, "slides": [{"type": "cover", "content": {}}]}]
        ours = runtime("process.stdout.write(JSON.stringify(input.map(d=>!rt.call('validate',d,{trust:'trusted'}).diagnostics.some(x=>x.code==='schema.invalid'))));", docs)
        for doc, valid in zip(docs, ours):
            with self.subTest(doc=json.dumps(doc)[:80]):
                self.assertEqual(valid, self.validator.is_valid(doc))

    # --- semantic visualization -------------------------------------------------------------
    def test_realistic_deck_compiles_clean_in_strict_untrusted_mode(self):
        code, out = cli("qa", FIX / "qbr-deck.json", "--json")
        report = json.loads(out)
        self.assertEqual(code, 0, out[:2000])
        self.assertEqual(report["summary"]["errors"], 0)
        self.assertEqual(report["summary"]["warnings"], 0)

    def test_builtin_slides_have_no_errors_in_strict_mode(self):
        result = runtime("const r=rt.call('qa',rt.call('builtinDeck'),{strict:true});process.stdout.write(JSON.stringify(r));", None, trusted=True)
        self.assertEqual(result["summary"]["slides"], 107)
        self.assertEqual(result["summary"]["errors"], 0, [d for d in result["diagnostics"] if d["severity"] == "error"][:5])

    def test_strict_mode_never_draws_sample_data(self):
        r = self.compile(self.deck({"type": "chart", "variant": "bar"}, {"type": "metric", "title": "No value"}))
        self.assertIn("data.missing", codes(r["diagnostics"], "error"))
        self.assertNotIn("Foundation", r["slides"][0]["html"])  # label of the built-in sample dataset
        self.assertIn("No data", r["slides"][0]["html"])
        legacy = self.compile(self.deck({"type": "chart", "variant": "bar"}), strict=False)
        self.assertIn("data.implicit-sample", codes(legacy["diagnostics"], "warning"))

    def test_bar_heights_are_proportional_and_negatives_go_below_zero(self):
        data = [{"label": "a", "value": 10}, {"label": "b", "value": 25}, {"label": "c", "value": 40}, {"label": "d", "value": -15}]
        html = self.compile(self.deck({"type": "chart", "variant": "bar", "data": data}))["slides"][0]["html"]
        bars = svg_marks(html, "bar")
        self.assertEqual([b[0] for b in bars], [10, 25, 40, -15])
        ratios = [h / abs(v) for v, w, h, x, y in bars]
        self.assertLess(max(ratios) / min(ratios) - 1, 0.005, ratios)  # geometry is rounded to 0.1 px
        zero = bars[0][4] + bars[0][2]
        self.assertAlmostEqual(bars[3][4], zero, delta=0.2)  # negative bar starts at the zero line

    def test_part_to_whole_and_area_encodings(self):
        rows = [{"label": "a", "value": 7}, {"label": "b", "value": 2}, {"label": "c", "value": 1}]
        r = self.compile(self.deck({"type": "chart", "variant": "waffle", "data": rows},
                                   {"type": "chart", "variant": "treemap", "data": rows}))
        html = r["slides"][0]["html"]
        cells = re.findall(r'data-mark="cell" data-v="(\d)"', html)
        self.assertEqual(len(cells), 100)
        self.assertEqual([cells.count(str(i)) for i in range(3)], [70, 20, 10])
        areas = svg_marks(html, "area")
        ratio = {round((w + 4) * (h + 4) / v, 1) for v, w, h, x, y in areas}
        self.assertLess(max(ratio) / min(ratio) - 1, 0.01)
        self.assertNotIn("semantic.mismatch", codes(r["diagnostics"]))

    def test_sankey_link_widths_follow_edge_values(self):
        html = self.compile(load("qbr-deck.json"))["slides"][10]["html"]
        flows = [(float(v), float(w)) for v, w in re.findall(r'data-mark="flow" data-v="([\d.]+)" data-w="([\d.]+)"', html)]
        self.assertEqual(sorted(v for v, _ in flows), [72, 164, 236, 412])
        self.assertLess(max(w / v for v, w in flows) / min(w / v for v, w in flows) - 1, 0.02)

    def test_gantt_bars_are_placed_by_date(self):
        html = self.compile(load("qbr-deck.json"))["slides"][7]["html"]
        tasks = re.findall(r'data-mark="task" data-v="([\d.]+)\.\.([\d.]+)" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"', html)
        self.assertEqual(len(tasks), 4)
        scale = {round(float(w) / (float(e) - float(s)), 3) for s, e, x, w in tasks}
        self.assertLess(max(scale) / min(scale) - 1, 0.01)

    def test_relations_come_only_from_edges(self):
        r = self.compile(self.deck({"type": "diagram", "variant": "network", "nodes": ["A", "B", "C"]},
                                   {"type": "diagram", "variant": "flowchart", "nodes": [{"id": "x", "label": "X"}], "edges": [{"from": "x", "to": "nope"}]}))
        self.assertIn("graph.edges-missing", codes(r["diagnostics"]))
        self.assertIn("graph.dangling-edge", codes(r["diagnostics"], "error"))
        self.assertNotIn("data-edge", r["slides"][0]["html"].split("data-variant=\"flowchart\"")[0])  # network drew no links

    def test_edge_case_deck_reports_each_problem(self):
        code, out = cli("qa", FIX / "edge-cases.json", "--json")
        found = codes(json.loads(out)["diagnostics"])
        self.assertEqual(code, 1)
        for expected in ["schema.invalid", "data.unknown-ref", "data.missing", "data.empty", "data.non-numeric",
                         "data.field-missing", "data.inconsistent", "graph.cycle", "graph.dangling-edge",
                         "layout.overflow", "layout.out-of-bounds", "layout.overlap", "content.truncated", "text.overflow"]:
            self.assertIn(expected, found)

    # --- repair -------------------------------------------------------------------------------
    def test_repair_fixes_typos_layout_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            first, second = Path(tmp) / "a.json", Path(tmp) / "b.json"
            code, out = cli("repair", FIX / "edge-cases.json", "-o", first, "--json")
            report = json.loads(out)
            actions = {(c["action"], c.get("to") if isinstance(c.get("to"), str) else None) for c in report["changes"]}
            for expected in [("rename", "title"), ("rename", "children"), ("replace", "pie"), ("replace", "revenue"),
                             ("replace", "diagram"), ("coerce", None), ("clamp", None), ("move", None), ("split-slide", None)]:
                self.assertIn(expected, actions)
            fixed = json.loads(first.read_text(encoding="utf-8"))
            found = codes(report["diagnostics"])
            self.assertTrue({"layout.overflow", "layout.out-of-bounds", "data.unknown-ref"}.isdisjoint(found))
            self.assertNotIn("schema.invalid", found)
            self.assertTrue(self.validator.is_valid(fixed))
            cli("repair", first, "-o", second)
            self.assertEqual(first.read_text(encoding="utf-8"), second.read_text(encoding="utf-8"))

    def test_wrong_version_is_rejected_before_any_change(self):
        code, out = cli("repair", FIX / "bad-version.json", "--json")
        self.assertEqual(code, 2)
        self.assertEqual(json.loads(out)["document"]["version"], "2.0")
        self.assertEqual(cli("validate", FIX / "bad-version.json")[0], 2)

    def test_raw_slide_array_is_wrapped(self):
        code, out = cli("repair", "-", "--json", stdin=json.dumps([{"type": "cover", "content": {}}]))
        self.assertEqual(code, 0, out)
        self.assertEqual(json.loads(out)["document"]["version"], "1.0")

    # --- safety & determinism -------------------------------------------------------------
    def test_untrusted_documents_run_no_code_and_lose_active_content(self):
        r = self.compile(load("untrusted.json"))
        html = "".join(s["html"] for s in r["slides"])
        for marker in ["LAYOUT-RAN", "HELPER-RAN", "SLIDE-RAN", "<script", "onerror", "onclick", "onload", "javascript:",
                       "<iframe", "@import", "evil.example", "foreignObject", "<animate", "data:image/svg"]:
            self.assertNotIn(marker.lower(), html.lower(), marker)
        self.assertIn("safe bold", html)
        self.assertIn("security.code-blocked", codes(r["diagnostics"], "error"))

    def test_trusted_code_runs_inside_the_vm_without_host_access(self):
        r = self.compile(load("untrusted.json"), trust="trusted")
        html = "".join(s["html"] for s in r["slides"])
        self.assertIn("LAYOUT-RAN-HELPER-RAN-undefined", html)  # helpers/layouts ran, but `process` does not exist
        self.assertIn("SLIDE-RAN</b>undefined", html)  # this.constructor.constructor reaches the sandbox realm only

    def test_compile_and_build_are_byte_identical_across_runs(self):
        with tempfile.TemporaryDirectory() as tmp:
            a, b = Path(tmp) / "a.html", Path(tmp) / "b.html"
            cli("build", FIX / "qbr-deck.json", "-o", a)
            cli("build", FIX / "qbr-deck.json", "-o", b)
            self.assertEqual(a.read_bytes(), b.read_bytes())
            static = a.read_text(encoding="utf-8")
            self.assertEqual(static.count('class="xb-page"'), 12)
            self.assertNotIn("<script", static)
            # Shared SVG resources must survive extraction when the sprite's hiding method changes.
            for resource in ("xbrain-logo-primary", "xbrain-logo-white", "techx-logo-color",
                             "techx-logo-white", "tx-clip-lr", "tx-clip-ul"):
                self.assertIn(f'id="{resource}"', static)
            app = Path(tmp) / "app.html"
            cli("build", FIX / "qbr-deck.json", "-o", app, "--app")
            embedded = re.search(r'<script id="v1-embedded-deck" type="application/json">(.*?)</script>', app.read_text(encoding="utf-8"), re.S).group(1)
            self.assertEqual(json.loads(embedded), load("qbr-deck.json"))
        one = self.compile(load("qbr-deck.json"))
        two = self.compile(load("qbr-deck.json"))
        self.assertEqual(one["hash"], two["hash"])
        self.assertEqual([s["html"] for s in one["slides"]], [s["html"] for s in two["slides"]])

    def test_pixel_qa_in_headless_browser(self):
        deck = {"version": "1.0", "slides": [
            {"type": "quote", "content": {"quoteVN": "Một câu trích dẫn rất dài " * 30, "author": "A"}},
            {"type": "closing", "content": {"headline": "Thank you"}}]}
        with tempfile.TemporaryDirectory() as tmp:
            f = Path(tmp) / "deck.json"
            f.write_text(json.dumps(deck), encoding="utf-8")
            code, out = cli("qa", f, "--browser", "--json")
        report = json.loads(out)
        if not report.get("browser"):
            self.skipTest("no Chrome/Edge available for pixel QA")
        measured = [d for d in report["diagnostics"] if d["code"] == "layout.measured-overflow"]
        self.assertTrue(any(d["path"] == "/slides/0" for d in measured), measured)
        self.assertFalse(any(d["path"] == "/slides/1" for d in measured), measured)


if __name__ == "__main__":
    unittest.main()
