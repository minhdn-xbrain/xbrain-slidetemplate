"""Contract checks against the React/Vite compiler and representative inputs.

Requires Node.js and Python jsonschema >= 4.10 (Draft 2020-12 support).
Run: python3 -m unittest discover -s src/__tests__ -p 'test_*.py'
"""
import json
from pathlib import Path
from test_compiler import runtime
import unittest

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = ROOT / "contracts/xbrain-deck-v1.schema.json"
# Complete decks authored only in JSON (no HTML changes); each must validate, load and render.
FIXTURES = ROOT / "src/__tests__/fixtures"
FIXTURE_DECKS = ["deck-partnership-proposal.json", "deck-quarterly-ops-report.json", "deck-template-as-code.json"]


class GeneratedSchemaTest(unittest.TestCase):
    def test_registered_chart_and_diagram_variants_are_accepted(self):
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        validator = Draft202012Validator(schema)
        for component in (
            {"type": "chart", "variant": "bar", "data": [{"label": "A", "value": 1}]},
            {"type": "diagram", "variant": "flowchart", "nodes": [{"id": "a", "label": "A"}]},
        ):
            deck = {"version": "1.0", "slides": [{"type": "composer", "components": [component]}]}
            with self.subTest(component=component):
                self.assertTrue(validator.is_valid(deck), list(validator.iter_errors(deck)))

# Inspect public React/Vite modules instead of extracting a script from index.html.
EXTRACT = r"""
const {DeckModel,LAYOUT_CATALOG,COMPONENT_RENDERERS,CHART_VARIANTS,DIAGRAM_VARIANTS,XBText}=modules;
const {DECK_DEFAULT_CONFIG}=await server.ssrLoadModule('/src/constants/layoutCatalog.ts');
const {createDraftRepository}=await server.ssrLoadModule('/src/store/studioControllers.ts');
const current=modules.XB.getDeck();
const normalized=DeckModel.normalize(current,LAYOUT_CATALOG,DECK_DEFAULT_CONFIG);
const array=DeckModel.normalize(current.slides,LAYOUT_CATALOG,DECK_DEFAULT_CONFIG);
const rejectedVersions=['0.9','2.0',1,null,undefined].map(version=>{
  try {DeckModel.normalize({...current,version},LAYOUT_CATALOG,DECK_DEFAULT_CONFIG);return false;}
  catch(error) {return error.message==='Expected JSON schema version 1.0';}
});
const storage=new Map(),reads=[];
const draft=createDraftRepository(()=>({
  getItem(key){reads.push(key);return storage.get(key)||null;},
  setItem(key,value){storage.set(key,value);}
}));
const emptyDraft=draft.load();draft.save(current);const savedDraft=draft.load();
const fixtures=Object.entries(input).map(([name,doc])=>{
  try {
    const result=rt.call('compile',doc,{strict:true,trust:'trusted'});
    const broken=result.slides.filter(s=>/LỖI RENDER|Không có layout|Unknown component/.test(s.html)).map(s=>(s.index+1)+':'+s.type);
    return {name,slides:result.slides.length,compileErrors:result.diagnostics.filter(d=>d.code==='code.compile').map(d=>d.message),broken};
  } catch(error) {return {name,error:error.message};}
});
const keys=items=>Object.fromEntries(Object.keys(items).map(key=>[key,true]));
process.stdout.write(JSON.stringify({textMetrics:{d:XBText.width('d'),dd:XBText.width('đ'),D:XBText.width('D'),DD:XBText.width('Đ'),decomposed:XBText.width('a\u0302\u0301'),composed:XBText.width('ấ'),linePlain:XBText.lineHeight('abc'),lineVN:XBText.lineHeight('Tiếng Việt')},document:current,layouts:LAYOUT_CATALOG.map(x=>x.type),
  components:Object.keys(COMPONENT_RENDERERS),visuals:{chart:keys(CHART_VARIANTS),flow:keys(DIAGRAM_VARIANTS.flow),structure:keys(DIAGRAM_VARIANTS.structure)},
  normalized:DeckModel.serialize(normalized.config,normalized.slides),rejectedVersions,
  draft:{empty:emptyDraft,saved:savedDraft,reads,keys:[...storage.keys()]},
  array:DeckModel.serialize(array.config,array.slides),fixtures}));
"""

class JsonContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        cls.validator = Draft202012Validator(cls.schema)
        fixtures = {p.name: json.loads(p.read_text(encoding="utf-8")) for p in FIXTURES.glob("deck-*.json")}
        cls.source = runtime(EXTRACT, fixtures)

    def assertValid(self, document):
        errors = list(self.validator.iter_errors(document))
        self.assertFalse(errors, "\n".join(
            f"{list(error.absolute_path)}: {error.message}" for error in errors[:8]
        ))

    def assertInvalid(self, document):
        self.assertFalse(self.validator.is_valid(document), document)

    @staticmethod
    def deck(component=None):
        slide = {"type": "cover", "content": {}} if component is None else {
            "type": "composer", "components": [component]
        }
        return {"version": "1.0", "slides": [slide]}

    def test_schema_meta_validation(self):
        Draft202012Validator.check_schema(self.schema)

    def test_authored_markup_style_and_url_match_v1_contract(self):
        self.assertValid(self.deck({"type": "html", "html": "<b>Author</b><script>void 0</script>",
                                    "style": {"color": "red", "fontFamily": '"Times New Roman", serif'}}))
        self.assertValid(self.deck({"type": "link", "text": "Action", "href": "javascript:void(0)"}))

    def test_arbitrary_json_field_names_in_transforms(self):
        self.assertValid(self.deck({"type": "table", "data": [{"__proto__": 1}],
                                    "transform": {"derive": {"__proto__": {"op": "add", "args": [1, 2]},
                                                             "constructor": {"field": "__proto__"}}}}))

    def test_all_builtin_slides(self):
        self.assertValid(self.source["document"])

    def test_registry_matches_contract(self):
        definitions = self.schema["$defs"]
        self.assertEqual(set(self.source["layouts"]), set(
            definitions["slide"]["properties"]["type"]["enum"]))
        self.assertEqual(set(self.source["components"]), set(
            definitions["componentType"]["enum"]))
        charts = set(self.source["visuals"]["chart"])
        diagrams = charts | set(self.source["visuals"]["flow"]) | set(self.source["visuals"]["structure"])
        self.assertEqual(charts, set(definitions["chartVariant"]["enum"]))
        self.assertEqual(diagrams, set(definitions["diagramVariant"]["enum"]))

    def test_executable_registry_constraints_are_exported_without_changing_v1(self):
        contract = runtime("process.stdout.write(JSON.stringify(rt.call('contract')));")
        self.assertEqual(contract["release"], "1.0.0")
        self.assertEqual(contract["schemaVersion"], "1.0")
        definitions = self.schema["$defs"]
        self.assertEqual(definitions["chartVariant"]["x-v1-constraints"], {
            v["id"]: v["constraints"] for v in contract["variants"]["chart"]
        })
        for layout in contract["layouts"]:
            self.assertEqual(layout["limits"], definitions["content-" + layout["type"]]["x-v1-limits"])
        for key in ["select", "exclude"]:
            self.assertInvalid(self.deck({"type": "table", "transform": {key: ["value", "value"]}}))

    def test_version_contract_and_normalization(self):
        for version in ["0.9", "2.0", 1, None]:
            with self.subTest(version=version):
                data = self.deck()
                data["version"] = version
                self.assertInvalid(data)
        self.assertInvalid({"slides": self.deck()["slides"]})
        self.assertInvalid(self.deck() | {"releaseVersion": "2.0.0"})
        self.assertValid(self.source["normalized"])
        self.assertValid(self.source["array"])
        self.assertTrue(all(self.source["rejectedVersions"]))

    def test_draft_repository_uses_one_v1_key(self):
        draft = self.source["draft"]
        self.assertIsNone(draft["empty"])
        self.assertEqual(draft["keys"], ["xbrain-v1-draft"])
        self.assertEqual(draft["reads"], ["xbrain-v1-draft", "xbrain-v1-draft"])
        self.assertValid(draft["saved"])
        self.assertEqual(draft["saved"]["slides"], self.source["document"]["slides"])

    def test_slide_count_limits(self):
        slide = {"type": "cover", "content": {}}
        for count in [1, 400]:
            self.assertValid({"version": "1.0", "slides": [slide] * count})
        for count in [0, 401]:
            self.assertInvalid({"version": "1.0", "slides": [slide] * count})

    def test_unknown_names_and_required_shapes(self):
        for slide in [
            {"type": "missing", "content": {}},
            {"type": "cover"},
            {"type": "cover", "content": []},
            {"type": "cover", "content": {"titel": "Typo"}},
            {"type": "composer", "components": {}},
            {"type": "composer", "components": [{"type": "missing"}]},
            {"type": "composer", "components": [{"type": "text", "childen": []}]},
        ]:
            with self.subTest(slide=slide):
                self.assertInvalid({"version": "1.0", "slides": [slide]})
        self.assertInvalid(self.deck() | {"datsets": {}})

    def test_template_array_and_row_shapes(self):
        for content in [
            {"barData": {}}, {"barData": [None]},
            {"barData": [{"pre": "seventy"}]},
        ]:
            self.assertInvalid({"version": "1.0", "slides": [{"type": "charts", "content": content}]})
        self.assertValid({"version": "1.0", "slides": [{"type": "strategy-pyramid", "content": {
            "levels": [{"title": "Foundation", "desc": "A supported fallback field"}]
        }}]})

    def test_component_layout_and_value_constraints(self):
        for component in [
            {"type": "text", "span": 0}, {"type": "text", "span": 13},
            {"type": "text", "height": -1}, {"type": "table", "columns": 2},
            {"type": "grid", "columns": ["label"]},
            {"type": "card", "children": {}}, {"type": "diagram", "nodes": [None]},
            {"type": "rating", "value": 6}, {"type": "progress", "value": "70%"},
            {"type": "text", "position": {"width": 100}},
        ]:
            with self.subTest(component=component):
                self.assertInvalid(self.deck(component))

    def test_vietnamese_text_metrics_and_line_padding(self):
        metrics = self.source['textMetrics']
        self.assertEqual(metrics['d'], metrics['dd'])
        self.assertEqual(metrics['D'], metrics['DD'])
        self.assertEqual(metrics['composed'], metrics['decomposed'])
        self.assertEqual(metrics['linePlain'], 1.18)
        self.assertEqual(metrics['lineVN'], 1.28)

    def test_relational_transforms_remain_v1_and_reject_executable_expressions(self):
        comp = {"type": "table", "data": [{"label": "A", "one": 2}], "transform": {
            "groupBy": "label", "agg": "avg", "offset": 0,
            "select": ["label", "one"], "exclude": ["unused"],
            "derive": {"delta": {"op": "subtract", "args": [{"field": "after"}, {"field": "before"}]}},
            "join": {"leftKey": "id", "rightDataset": "other", "rightKey": "id", "prefix": "other_"}
        }}
        self.assertValid(self.deck(comp))
        for transform in [{"agg": "median"}, {"offset": -1}, {"select": ["x", "x"]},
                          {"derive": {"x": "process.exit()"}},
                          {"derive": {"x": {"op": "eval", "args": [1, 2]}}},
                          {"derive": {"x": {"op": "divide", "args": [1]}}},
                          {"join": {"leftKey": "id", "rightDataset": "other"}}]:
            self.assertInvalid(self.deck(comp | {"transform": transform}))
        self.assertValid(self.deck({"type": "table", "data": {"url": "https://example.com/data.json", "value": [], "snapshot": {"sha256": "a" * 64}}}))

    def test_nested_components_and_aliases(self):
        self.assertValid({"version": "1.0", "slides": [{"type": "composer", "content": {
            "components": [{"type": "columns", "columns": 2, "components": [
                {"type": "paragraph", "text": "Nested"},
                {"type": "chart", "data": {"$ref": "datasets.skills"}}
            ]}]
        }}]})
        self.assertValid(self.deck({"type": "text", "position": {"x": 0, "width": 500}, "text": "Freeform"}))

    def test_variant_types(self):
        for component in [
            {"type": "chart", "variant": "flowchart"},
            {"type": "diagram", "variant": "mermaid-flowchart"},
            {"type": "diagram", "variant": "unknown"},
            {"type": "echarts", "options": []},
        ]:
            self.assertInvalid(self.deck(component))
        self.assertValid(self.deck({"type": "mermaid", "source": "flowchart LR\n A-->B"}))
        self.assertValid(self.deck({"type": "echarts", "options": {"series": [{"type": "line", "data": [1, 2]}]}}))

    def test_dataset_formats_and_references(self):
        sources = [
            [{"label": "A", "value": 2}], "label,value\nA,2",
            {"type": "json", "value": [{"label": "A", "value": 2}]},
            {"format": "tsv", "data": "label\tvalue\nA\t2"},
            {"type": "yaml", "value": "- label: A\n  value: 2"},
            {"type": "csv", "url": "https://example.com/data.csv", "value": "label,value\nA,2"},
        ]
        for source in sources:
            with self.subTest(source=source):
                self.assertValid(self.deck() | {"datasets": {"skills": source}})
        for source in [None, [None], {"type": "csv", "value": {}}, {"type": "wrong", "value": []}, {"type": "json", "value": [None]}]:
            self.assertInvalid(self.deck() | {"datasets": {"skills": source}})
        self.assertInvalid(self.deck({"type": "chart", "data": {"$ref": 123}}))

    def test_transform_contract(self):
        self.assertValid(self.deck({"type": "chart", "transform": {
            "filter": {"field": "value", "gt": 0}, "sortBy": "value", "order": "desc",
            "limit": 5, "groupBy": "track", "aggregateField": "value",
        }}))
        for transform in [{"limit": 2001}, {"order": "descending"}, {"filter": {"gt": 3}}]:
            self.assertInvalid(self.deck({"type": "chart", "transform": transform}))

    INTEGRATED_LAYOUTS = [
        "venn-diagram", "swot-analysis", "priority-matrix", "mind-map", "fishbone", "staircase",
        "concentric-circles", "value-chain", "decision-tree", "system-architecture", "kanban-board",
        "gantt-roadmap", "line-chart", "waterfall-chart", "bar-ranking", "radar-chart",
        "progress-rings", "custom-html", "custom-diagram",
    ]

    def test_integrated_layouts_have_sample_slides_and_strict_content(self):
        sample_types = {slide["type"] for slide in self.source["document"]["slides"]}
        for layout in self.INTEGRATED_LAYOUTS:
            with self.subTest(layout=layout):
                self.assertIn(layout, self.source["layouts"])
                self.assertIn(layout, sample_types)
                self.assertInvalid({"version": "1.0", "slides": [{"type": layout, "content": {"titel": "Typo"}}]})
                self.assertInvalid({"version": "1.0", "slides": [{"type": layout}]})
        for content in [
            {"items": [{"label": "A", "value": 1, "kind": "up"}]},
            {"items": [{"label": "A", "value": "10"}]},
        ]:
            self.assertInvalid({"version": "1.0", "slides": [{"type": "waterfall-chart", "content": content}]})
        self.assertInvalid({"version": "1.0", "slides": [{"type": "progress-rings", "content": {"rings": [{"value": 140}]}}]})
        self.assertValid({"version": "1.0", "slides": [{"type": "custom-diagram", "content": {
            "title": "Own SVG", "svg": "<rect width=\"10\" height=\"10\"/>"}}]})

    TEMPLATE_PACK_CHARTS = ["combo", "stacked-100", "diverging-bar"]
    TEMPLATE_PACK_DIAGRAMS = ["vertical-timeline", "pros-cons", "iceberg"]

    def test_template_pack_variants_have_sample_slides(self):
        def variants(components):
            for component in components or []:
                yield component.get("variant")
                yield from variants(component.get("children") or component.get("components"))
        used = {v for slide in self.source["document"]["slides"] for v in variants(slide.get("components"))}
        for variant in self.TEMPLATE_PACK_CHARTS:
            with self.subTest(variant=variant):
                self.assertIn(variant, self.source["visuals"]["chart"])
                self.assertIn(variant, used)
                self.assertValid(self.deck({"type": "chart", "variant": variant, "dataRef": "tracks"}))
                self.assertValid(self.deck({"type": "chart-card", "variant": variant, "title": "Card"}))
        for variant in self.TEMPLATE_PACK_DIAGRAMS:
            with self.subTest(variant=variant):
                self.assertIn(variant, self.source["visuals"]["flow"] | self.source["visuals"]["structure"])
                self.assertIn(variant, used)
                self.assertValid(self.deck({"type": "diagram", "variant": variant, "options": {"labels": ["A", "B"]},
                                            "nodes": [{"label": "A", "date": "JAN", "group": "con"}, "B"]}))
                self.assertInvalid(self.deck({"type": "chart", "variant": variant}))

    def test_semantic_data_fields_for_visuals(self):
        # Fields the native renderers read (dates, lanes, statuses, coordinates, RACI) stay valid v1 JSON.
        self.assertValid(self.deck({"type": "diagram", "variant": "gantt", "options": {"today": "2026-10-06"}, "nodes": [
            {"id": "a", "label": "Build", "start": "2026-10-01", "end": "2026-10-31", "lane": "Ops", "status": "Doing"},
            {"id": "b", "label": "Review", "start": 3, "end": 3, "kind": "milestone", "parent": "a", "x": 2, "y": 4,
             "group": "con", "raci": {"Ops": "R"}, "date": "2026-10"}],
            "edges": [{"from": "a", "to": "b", "label": "then", "value": 12, "kind": "return", "critical": True}]}))
        self.assertValid(self.deck({"type": "chart", "variant": "combo", "data": [{"label": "Q1", "value": 3, "target": 4}]}))
        self.assertInvalid(self.deck({"type": "diagram", "variant": "sankey", "edges": [{"from": "a"}]}))
        self.assertInvalid(self.deck({"type": "diagram", "variant": "gantt", "nodes": [{"label": "x", "value": "big"}]}))

    def test_template_as_code_contract(self):
        layout = {"group": "D", "name": "KPI Tiles", "frame": "dgPage", "sample": {"items": []},
                  "render": ["const items = c.items || [];", "return items.map(i => i.value).join('');"]}
        self.assertValid({"version": "1.0", "helpers": {"pill": "(t) => `<b>${t}</b>`"},
                          "layouts": {"kpi-tiles": layout},
                          "slides": [{"type": "kpi-tiles", "content": {"items": [{"value": "200"}]}}]})
        # a slide of a custom layout needs the layouts map; a slide carrying its own code does not
        self.assertInvalid({"version": "1.0", "slides": [{"type": "kpi-tiles", "content": {}}]})
        self.assertValid({"version": "1.0", "slides": [{"type": "one-off", "content": {}, "template": "<div>${c.x}</div>"}]})
        self.assertValid({"version": "1.0", "slides": [{"type": "cover", "content": {}, "render": "return '';", "css": ".a{}"}]})
        self.assertValid({"version": "1.0", "layouts": {"x": {"template": "", "group": "Z"}}, "slides": [{"type": "cover", "content": {}}]})
        for bad in [{"rendr": "return '';"}, {"group": "D"}, {"render": 42}, {"template": "", "group": 42}]:
            with self.subTest(layout=bad):
                self.assertInvalid({"version": "1.0", "layouts": {"x": bad}, "slides": [{"type": "cover", "content": {}}]})
        self.assertInvalid({"version": "1.0", "layouts": {"bad name": layout}, "slides": [{"type": "cover", "content": {}}]})
        self.assertInvalid({"version": "1.0", "helpers": [], "slides": [{"type": "cover", "content": {}}]})
        self.assertInvalid({"version": "1.0", "slides": [{"type": "one-off", "content": {}, "render": "", "titel": "x"}]})

    def test_fixture_decks_validate_against_schema(self):
        for name in FIXTURE_DECKS:
            with self.subTest(deck=name):
                deck = json.loads((FIXTURES / name).read_text(encoding="utf-8"))
                self.assertValid(deck)
                self.assertGreaterEqual(len(deck["slides"]), 5)

    def test_fixture_decks_load_and_render_in_runtime(self):
        results = {item["name"]: item for item in self.source["fixtures"]}
        for name in FIXTURE_DECKS:
            with self.subTest(deck=name):
                result = results.get(name)
                self.assertIsNotNone(result, "fixture not loaded")
                self.assertNotIn("error", result)
                self.assertGreaterEqual(result["slides"], 5)
                self.assertEqual(result["compileErrors"], [])
                self.assertEqual(result["broken"], [])

    def test_header_footer_chrome(self):
        chrome = {"headerLabel": "XBrain · Q3 Review", "website": "www.xbrain.com.vn", "address": "Da Nang"}
        self.assertValid({"version": "1.0", "chrome": chrome, "slides": [
            {"type": "title-body", "content": {"sectionTag": "INTRO"}, "chrome": {"website": "xbrain.vn"}},
            {"type": "one-off", "content": {}, "render": "return '';", "chrome": {"address": "Ha Noi"}},
        ]})
        for bad in [{"footer": "x"}, {"website": 1}, []]:
            with self.subTest(chrome=bad):
                self.assertInvalid({"version": "1.0", "chrome": bad, "slides": [{"type": "cover", "content": {}}]})
                self.assertInvalid({"version": "1.0", "slides": [{"type": "quote", "content": {}, "chrome": bad}]})

    def test_template_as_code_runtime(self):
        result = runtime("""
          const fails=fn=>{try{fn();return false;}catch(error){return error.message;}};
          const doc={version:'1.0',layouts:{'kpi-tiles':{group:'D',template:'<b>x</b>'}},slides:[{type:'kpi-tiles',content:{}}]};
          const withLayout=rt.call('compile',doc),withoutLayout=rt.call('compile',{version:'1.0',slides:doc.slides});
          const previous=globalThis.document;
          const toast={classList:{add(){},remove(){}}};
          globalThis.document={readyState:'loading',getElementById:id=>id==='v1-toast'?toast:null};
          try {
            const packVersions=['2.0',1,null].map(version=>fails(()=>modules.XB.import({version,layouts:{}})));
            const packWithoutVersion=fails(()=>modules.XB.import({layouts:{}}));
            const payloadWithoutVersion=fails(()=>modules.XB.import({xbrainSlides:true,slides:[]}));
            process.stdout.write(JSON.stringify({layoutSlideAccepted:withLayout.document.slides[0].type,
              layoutSlideWithoutLayouts:!withoutLayout.ok,packVersions,packWithoutVersion,payloadWithoutVersion,
              customLayoutsRegistered:modules.LAYOUT_CATALOG.filter(x=>x.custom).length}));
          } finally { if(previous===undefined)delete globalThis.document;else globalThis.document=previous; }
        """)
        version_error = "Expected JSON schema version 1.0"
        self.assertEqual(result["layoutSlideAccepted"], "kpi-tiles")
        self.assertTrue(result["layoutSlideWithoutLayouts"])
        self.assertEqual(result["packVersions"], [version_error] * 3)
        self.assertFalse(result["packWithoutVersion"])
        self.assertEqual(result["payloadWithoutVersion"], version_error)
        self.assertEqual(result["customLayoutsRegistered"], 0)

    def test_metadata_and_trusted_content_remain_supported(self):
        self.assertValid(self.deck({"type": "html", "html": "<strong>Example</strong>"}) | {
            "metadata": {"owner": "Team", "custom": {"key": 1}}, "customCss": ".v1-slide {color:#425453;}"
        })


if __name__ == "__main__":
    unittest.main()
