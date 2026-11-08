"""Regression scenarios for recursive layout, graph routing, relational data and isolation."""
import re
import unittest
from test_compiler import CompilerTest, codes, runtime


class ImprovementTest(unittest.TestCase):
    compile = CompilerTest.compile
    deck = CompilerTest.deck
    def test_recursive_container_geometry_and_deep_pagination(self):
        rows = [{"label": f"District-{i:02}", "value": i} for i in range(25)]
        table = {"type": "table", "dataRef": "districts", "columns": ["label", "value"]}
        deck = self.deck({"type": "card", "span": 12, "children": [
            {"type": "stack", "children": [table]}]}, datasets={"districts": rows})
        original = self.compile(deck)
        self.assertIn("layout.overflow", codes(original["diagnostics"]))
        fixed = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", deck)
        self.assertGreater(len(fixed["document"]["slides"]), 1)
        self.assertIn("split-slide", {c["action"] for c in fixed["changes"]})
        self.assertNotIn("layout.overflow", codes(fixed["diagnostics"]))
        self.assertNotIn("data.truncated", codes(fixed["diagnostics"]))
        compiled = self.compile(fixed["document"])
        html = "".join(s["html"] for s in compiled["slides"])
        for row in rows:
            self.assertEqual(html.count(f'>{row["label"]}</td>'), 1)
        again = runtime("process.stdout.write(JSON.stringify(rt.call('repair',input)));", fixed["document"])
        self.assertEqual(again["document"], fixed["document"])

    def test_nested_visuals_have_real_boxes_and_nonnegative_scale(self):
        deck = self.deck({"type": "columns", "span": 12, "children": [
            {"type": "card", "children": [{"type": "chart", "variant": "bar", "data": [{"label": "x", "value": 5}]}]},
            {"type": "stack", "children": [{"type": "chart", "variant": "bar", "data": [{"label": "x", "value": 7}]}]}]})
        r = self.compile(deck)
        self.assertNotIn("render.exception", codes(r["diagnostics"]))
        self.assertEqual(len(re.findall('data-variant="bar"', r["slides"][0]["html"])), 2)
        self.assertTrue(all(d.get("scale", 0) >= 0 for d in r["diagnostics"]))
        self.assertNotRegex(r["slides"][0]["html"], r'(?:height|width)="-')
        self.assertIn('grid-column:span 1;', r["slides"][0]["html"])

    def table(self, datasets, transform, source="left"):
        return self.compile(self.deck({"type": "table", "dataRef": source, "transform": transform}, datasets=datasets))

    def test_groupby_preserves_series_and_all_aggregation_modes(self):
        sets = {"left": [{"label": "A", "one": 2, "two": 10}, {"label": "A", "one": 4, "two": 20}]}
        for agg, values in {"sum": [6, 30], "avg": [3, 15], "min": [2, 10], "max": [4, 20], "count": [2, 2]}.items():
            with self.subTest(agg=agg):
                r = self.table(sets, {"groupBy": "label", "agg": agg})
                self.assertNotIn("schema.invalid", codes(r["diagnostics"]))
                cells = re.findall(r'<td>(.*?)</td>', r["slides"][0]["html"])
                self.assertEqual(cells, ["A", *map(str, values)])
        r = self.table(sets, {"groupBy": "label", "aggregateField": "one"})
        self.assertEqual(re.findall(r'<td>(.*?)</td>', r["slides"][0]["html"]), ["A", "6"])

    def test_join_derive_projection_and_pagination_are_pure(self):
        sets = {"left": [{"label": "A", "key": "a", "before": 8, "after": 12}, {"label": "B", "key": "b", "before": 4, "after": 10}],
                "right": [{"id": "a", "total": 40}, {"id": "b", "total": 20}]}
        tx = {"join": {"leftKey": "key", "rightDataset": "right", "rightKey": "id"},
              "derive": {"delta": {"op": "subtract", "args": [{"field": "after"}, {"field": "before"}]},
                         "pct": {"op": "percent", "args": [{"field": "delta"}, {"field": "total"}]}},
              "sortBy": "label", "order": "desc", "offset": 1, "limit": 1, "select": ["label", "delta", "pct"], "exclude": ["delta"]}
        r = self.table(sets, tx)
        self.assertNotIn("schema.invalid", codes(r["diagnostics"]))
        self.assertEqual(re.findall(r'<td>(.*?)</td>', r["slides"][0]["html"]), ["A", "10"])
        self.assertEqual(r["document"]["datasets"], sets)
        invalid = self.table(sets, {"derive": {"bad": {"op": "divide", "args": [1, 0]}}})
        self.assertIn("data.derive", codes(invalid["diagnostics"], "error"))
        duplicated = self.table(sets | {"right": [{"id": "a"}, {"id": "a"}]}, {"join": {"leftKey": "key", "rightDataset": "right", "rightKey": "id"}})
        self.assertIn("data.inconsistent", codes(duplicated["diagnostics"], "error"))

    def test_json_field_names_survive_join_derive_group_and_yaml(self):
        keys = ["__proto__", "constructor", "prototype"]
        right = [{"id": 1, "__proto__": 3, "constructor": 4, "prototype": 5}]
        joined = self.table({"left": [{"id": 1}], "right": right},
                            {"join": {"leftKey": "id", "rightKey": "id", "rightDataset": "right"},
                             "select": keys})
        self.assertTrue(joined["ok"], joined["diagnostics"])
        for value in (3, 4, 5):
            self.assertIn(f">{value}</td>", joined["slides"][0]["html"])
        derived = self.table({"left": [{"id": 1}]},
                             {"derive": {key: {"op": "add", "args": [1, n]} for n, key in enumerate(keys)},
                              "select": keys})
        self.assertTrue(derived["ok"], derived["diagnostics"])
        for value in (1, 2, 3):
            self.assertIn(f">{value}</td>", derived["slides"][0]["html"])
        grouped = self.table({"left": [{"label": "A", "__proto__": 3}, {"label": "A", "__proto__": 4}]},
                             {"groupBy": "label", "select": ["label", "__proto__"]})
        self.assertTrue(grouped["ok"], grouped["diagnostics"])
        self.assertIn(">7</td>", grouped["slides"][0]["html"])
        yaml = "- label: A\n  __proto__: 2\n  constructor: 3\n  prototype: 4\n"
        parsed = self.table({"left": {"type": "yaml", "value": yaml}}, {"select": keys})
        self.assertTrue(parsed["ok"], parsed["diagnostics"])
        for value in (2, 3, 4):
            self.assertIn(f">{value}</td>", parsed["slides"][0]["html"])


    def test_yaml_quotes_comments_hex_and_scalar_types(self):
        yaml = '- label: "A # safe" # comment\n  color: #F97C00\n  value: 2\n- label: B#hash\n  color: "#25AC9D"\n  value: "003"\n'
        r = self.table({"left": {"type": "yaml", "value": yaml}}, {})
        self.assertEqual(re.findall(r'<td>(.*?)</td>', r["slides"][0]["html"]),
                         ["A # safe", "#F97C00", "2", "B#hash", "#25AC9D", "003"])

    def test_feedback_arcs_and_shared_tree_child_preserve_edges(self):
        edges = [{"from": "A", "to": "B", "value": 10}, {"from": "B", "to": "C", "value": 6},
                 {"from": "C", "to": "A", "value": 2}, {"from": "A", "to": "D", "value": 4}, {"from": "D", "to": "C", "value": 4}]
        for variant in ["sankey", "flowchart", "tree"]:
            with self.subTest(variant=variant):
                r = self.compile(self.deck({"type": "diagram", "variant": variant, "nodes": [{"id": x, "label": x} for x in ["A", "B", "C", "D"]], "edges": edges}))
                self.assertIn("graph.cycle", codes(r["diagnostics"], "info"))
                self.assertNotIn("graph.cycle", codes(r["diagnostics"], "error"))
                self.assertNotIn("graph.multiple-parents", codes(r["diagnostics"]))
                html = r["slides"][0]["html"]
                self.assertIn('data-feedback="true"', html)
                for edge in edges:
                    self.assertIn(f'data-edge="{edge["from"]}-&gt;{edge["to"]}"', html)
                self.assertEqual(r["document"]["slides"][0]["components"][0]["edges"], edges)

    def test_sankey_skip_layer_routing_uses_dummy_gap(self):
        comp = {"type": "diagram", "variant": "sankey", "nodes": [{"id": x, "label": x} for x in ["A", "B", "C", "D"]], "edges": [
            {"from": "A", "to": "B", "value": 9}, {"from": "B", "to": "C", "value": 9},
            {"from": "C", "to": "D", "value": 9}, {"from": "A", "to": "D", "value": 3}]}
        r = self.compile(self.deck(comp))
        html = r["slides"][0]["html"]
        route = re.search(r'<path[^>]*data-edge="A-&gt;D"[^>]*d="([^"]+)"', html).group(1)
        self.assertGreaterEqual(route.count("C"), 5)  # route enters and leaves both reserved slots
        self.assertNotIn('data-node="v1-dummy', html)
        self.assertNotIn("semantic.mismatch", codes(r["diagnostics"]))

    def test_collision_qa_and_scatter_repulsion(self):
        svg = '<svg viewBox="0 0 500 300"><text x="30" y="40" font-size="20">First label</text><text x="31" y="41" font-size="20">Second label</text></svg>'
        r = self.compile(self.deck({"type": "svg", "svg": svg}))
        collisions = [d for d in r["diagnostics"] if d["code"] == "layout.text-collision"]
        self.assertEqual(len(collisions), 1)
        self.assertGreater(collisions[0]["overlap"], .15)
        self.assertEqual(len(collisions[0]["labels"]), 2)
        r = self.compile(self.deck({"type": "chart", "variant": "scatter", "data": [
            {"label": "One", "x": 1, "y": 2}, {"label": "Two", "x": 1, "y": 2}, {"label": "Three", "x": 1, "y": 2}]}))
        self.assertNotIn("layout.text-collision", codes(r["diagnostics"]))

    def test_author_markup_is_preserved_including_unclosed_tags(self):
        for tag in ["script", "style", "iframe", "object", "foreignObject"]:
            for ending in [">", "/> bleh"]:
                with self.subTest(tag=tag, ending=ending):
                    html = self.compile(self.deck({"type": "html", "html": f'<b>Safe</b><{tag}{ending}evilPayload();'}))["slides"][0]["html"]
                    self.assertIn("Safe", html)
                    self.assertIn("evilPayload", html)
        raw = '<svg><title>Accessible &amp; safe</title><text x="10" y="20">Label</text></svg><math><mfrac><mi>x</mi><mn>2</mn></mfrac></math>'
        html = self.compile(self.deck({"type": "html", "html": raw}))["slides"][0]["html"]
        self.assertIn('<title>Accessible &amp; safe</title>', html)
        self.assertIn('<math><mfrac><mi>x</mi><mn>2</mn></mfrac></math>', html)

    def test_author_css_is_preserved_without_scope_or_filter(self):
        deck = self.deck({"type": "text", "text": "Example"})
        deck["slides"][0].update(id="first", customCss='.v1-text,:is(.a,.b){color:red} @media print {.v1-slide{background:black}.v1-text{color:blue}} body{color:pink} @page{margin:0} .v1-slide + div{color:lime}.a{position:fixed;top:0}')
        r = self.compile(deck)
        html = r["slides"][0]["html"]
        css = re.search(r'<style>(.*?)</style>', html, re.S).group(1)
        self.assertIn('.v1-text,:is(.a,.b){color:red}', css)
        self.assertIn('@media print', css)
        for marker in ["body{", "@page", "position:fixed", "color:lime"]:
            self.assertIn(marker, css)
        self.assertNotIn("css.blocked", codes(r["diagnostics"]))

    def test_external_data_requires_an_inline_snapshot(self):
        deck = self.deck({"type": "table", "dataRef": "remote"}, datasets={"remote": {"type": "json", "url": "http://127.0.0.1:1/unused"}})
        r = self.compile(deck)
        self.assertIn("determinism.external-missing", codes(r["diagnostics"], "error"))
        deck["datasets"]["remote"]["value"] = '[{"label":"Real","value":42}]'
        compiled = self.compile(deck)
        self.assertNotIn("determinism.external-missing", codes(compiled["diagnostics"]))
        self.assertIn('>Real</td>', compiled["slides"][0]["html"])

    def test_css_tokenizer_keeps_braces_comments_and_commas_in_strings(self):
        deck = self.deck({'type': 'text', 'text': 'Safe'})
        deck['slides'][0]['customCss'] = '.v1-text::before{content:"{a,b} /* literal */";position:var(--fixed)}'
        result = self.compile(deck)
        html = result['slides'][0]['html']
        self.assertIn('content:"{a,b} /* literal */"', html)
        self.assertIn('position:var(--fixed)', html)
        self.assertNotIn('css.blocked', codes(result['diagnostics']))

    def test_component_depth_limit_is_reported_without_render_exception(self):
        component = {'type': 'text', 'text': 'Deep'}
        for i in range(10):
            component = {'type': 'stack', 'children': [component]}
        result = self.compile(self.deck(component))
        self.assertIn('layout.depth', codes(result['diagnostics'], 'error'))
        self.assertNotIn('render.exception', codes(result['diagnostics']))


    def test_chart_title_renders_once_and_dark_theme_resolves_background(self):
        deck = self.deck({'type': 'chart', 'title': 'Visible chart title', 'variant': 'bar', 'data': [{'label': 'A', 'value': 1}]})
        deck['theme'] = {'preset': 'dark', 'tokens': {'ink': '#EAF7FF'}}
        r = self.compile(deck)
        self.assertNotIn('render.exception', codes(r['diagnostics']))
        html = r['slides'][0]['html']
        self.assertEqual(len(re.findall('class="v1-visual-heading"', html)), 1)
        self.assertIn('>Visible chart title</strong>', html)
        self.assertIn('background:#425453;', html)
        self.assertIn('href="#xbrain-logo-white"', html)

    def test_scatter_missing_x_is_consistent_in_editor_and_strict_build(self):
        deck = self.deck({"type": "chart", "variant": "scatter", "data": [{"label": "a", "value": 1}]})
        for strict in [True, False]:
            html = self.compile(deck, strict=strict)["slides"][0]["html"]
            self.assertIn('No data', html)
            self.assertNotIn('data-mark="point"', html)


del CompilerTest
