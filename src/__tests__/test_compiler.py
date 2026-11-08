"""Compiler checks: validate → render → QA → repair on real and edge-case decks.

Requires Node.js ≥ 22.15 and Python jsonschema ≥ 4.10.
Run: python -m unittest discover -s src/__tests__ -p 'test_*.py'
"""
import json
import atexit
from pathlib import Path
import re
import subprocess
import unittest

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[2]
FIX = ROOT / "src" / "__tests__" / "fixtures"
SCHEMA = ROOT / "contracts" / "xbrain-deck-v1.schema.json"


_host = None


def _close_host():
    global _host
    if _host:
        _host.stdin.close()
        _host.wait(timeout=15)
        _host.stdout.close()
        _host = None


atexit.register(_close_host)


def runtime(script, payload=None, trusted=False):
    """Exercise the TypeScript compiler via one Vite module runner per test process."""
    global _host
    if _host is None:
        _host = subprocess.Popen(["node", str(ROOT / "src/__tests__/compiler-test-host.mjs")], cwd=ROOT,
                                 stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding="utf-8")
    _host.stdin.write(json.dumps({"script": script, "input": payload}) + "\n")
    _host.stdin.flush()
    line = _host.stdout.readline()
    if not line:
        raise AssertionError("Vite compiler test host exited unexpectedly")
    result = json.loads(line)
    if "error" in result:
        raise AssertionError(result["error"])
    return json.loads(result["output"])


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
        schema = runtime("process.stdout.write(JSON.stringify(rt.call('schema')));")
        self.assertEqual(schema, json.loads(SCHEMA.read_text(encoding="utf-8")),
                         "contracts/ schema is stale: run npm run schema")

    def test_contract_lists_every_registered_variant_with_a_data_contract(self):
        contract = runtime("process.stdout.write(JSON.stringify(rt.call('contract')));")
        schema = contract["schema"]["$defs"]
        self.assertEqual([v["id"] for v in contract["variants"]["chart"]], schema["chartVariant"]["enum"])
        for family in ("chart", "flow", "structure"):
            for v in contract["variants"][family]:
                self.assertTrue(v["data"], v["id"])
        self.assertTrue(all(l["contentSchema"] for l in contract["layouts"]))
        self.assertIn("data.missing", contract["diagnostics"])

    def test_builtin_validator_agrees_with_jsonschema(self):
        docs = [load("qbr-deck.json"), load("edge-cases.json"), load("untrusted.json"),
                load("deck-quarterly-ops-report.json"),
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
    def test_compiler_defaults_to_trusted_author_code(self):
        deck = load("deck-template-as-code.json")
        result = runtime("process.stdout.write(JSON.stringify(rt.call('compile',input)));", deck, trusted=True)
        self.assertEqual(result["options"]["trust"], "trusted")
        self.assertFalse(codes(result["diagnostics"], "error"), result["diagnostics"])
        report = runtime("process.stdout.write(JSON.stringify(rt.call('qa',input)));", deck)
        self.assertEqual(report["options"]["trust"], "trusted")

    def test_realistic_deck_compiles_clean_in_strict_mode(self):
        report = runtime("process.stdout.write(JSON.stringify(rt.call('qa',input)));", load("qbr-deck.json"))
        self.assertTrue(report["ok"], report)
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
        report = runtime("process.stdout.write(JSON.stringify(rt.call('qa',input)));", load("edge-cases.json"))
        found = codes(report["diagnostics"])
        self.assertFalse(report["ok"])
        for expected in ["schema.invalid", "data.unknown-ref", "data.missing", "data.empty", "data.non-numeric",
                         "data.field-missing", "data.inconsistent", "graph.cycle", "graph.dangling-edge",
                         "layout.overflow", "layout.out-of-bounds", "layout.overlap", "content.truncated", "text.overflow"]:
            self.assertIn(expected, found)

    # --- repair -------------------------------------------------------------------------------
    def test_repair_fixes_typos_layout_and_is_idempotent(self):
        report = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", load("edge-cases.json"))
        actions = {(c["action"], c.get("to") if isinstance(c.get("to"), str) else None) for c in report["changes"]}
        for expected in [("rename", "title"), ("rename", "children"), ("replace", "pie"), ("replace", "revenue"),
                         ("replace", "diagram"), ("coerce", None), ("clamp", None), ("move", None), ("split-slide", None)]:
            self.assertIn(expected, actions)
        fixed = report["document"]
        found = codes(report["diagnostics"])
        self.assertTrue({"layout.overflow", "layout.out-of-bounds", "data.unknown-ref"}.isdisjoint(found))
        self.assertNotIn("schema.invalid", found)
        self.assertTrue(self.validator.is_valid(fixed))
        again = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", fixed)
        self.assertEqual(fixed, again["document"])

    def test_wrong_version_is_rejected_before_any_change(self):
        result = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", load("bad-version.json"))
        self.assertFalse(result["ok"])
        self.assertEqual(result["document"]["version"], "2.0")
        self.assertEqual(result["changes"], [])

    def test_raw_slide_array_is_wrapped(self):
        result = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", [{"type": "cover", "content": {}}])
        self.assertTrue(result["ok"], result)
        self.assertEqual(result["document"]["version"], "1.0")

    # --- safety & determinism -------------------------------------------------------------
    def test_legacy_trust_option_does_not_filter_author_content(self):
        r = self.compile(load("untrusted.json"), trust="untrusted")
        html = "".join(s["html"] for s in r["slides"])
        for marker in ["LAYOUT-RAN", "HELPER-RAN", "SLIDE-RAN", "<script", "onerror", "javascript:", "<iframe"]:
            self.assertIn(marker.lower(), html.lower(), marker)
        self.assertEqual(r["options"]["trust"], "trusted")
        self.assertFalse(any(d["code"].startswith("security.") for d in r["diagnostics"]))

    def test_trusted_code_runs_in_the_compiler(self):
        r = self.compile(load("untrusted.json"), trust="trusted")
        html = "".join(s["html"] for s in r["slides"])
        self.assertIn("LAYOUT-RAN-HELPER-RAN", html)
        self.assertIn("SLIDE-RAN</b>", html)

    def test_compile_and_build_are_byte_identical_across_runs(self):
        pages = runtime("""
        const assets=await server.ssrLoadModule('/src/lib/xbrainAssets.ts');
        const build=()=>rt.call('staticPage',rt.call('compile',input),{css:assets.XBRAIN_EMBEDDED_CSS,sprite:assets.XBRAIN_SVG_SPRITE});
        process.stdout.write(JSON.stringify([build(),build()]));
        """, load("qbr-deck.json"))
        self.assertEqual(pages[0], pages[1])
        static = pages[0]
        self.assertEqual(static.count('class="xb-page"'), 12)
        self.assertNotIn("<script", static)
        for resource in ("xbrain-logo-primary", "xbrain-logo-white", "techx-logo-color",
                         "techx-logo-white", "tx-clip-lr", "tx-clip-ul"):
            self.assertIn(f'id="{resource}"', static)
        one = self.compile(load("qbr-deck.json"))
        two = self.compile(load("qbr-deck.json"))
        self.assertEqual(one["hash"], two["hash"])
        self.assertEqual([s["html"] for s in one["slides"]], [s["html"] for s in two["slides"]])

if __name__ == "__main__":
    unittest.main()
