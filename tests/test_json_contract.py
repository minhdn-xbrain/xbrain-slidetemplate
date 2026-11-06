"""Contract checks against the actual standalone HTML and representative inputs.

Requires Node.js and Python jsonschema >= 4.10 (Draft 2020-12 support).
Run: python3 -m unittest discover -s tests -p 'test_*.py'
"""
import json
from pathlib import Path
import subprocess
import unittest

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "contracts/xbrain-deck-v1.schema.json"
EXAMPLE = ROOT / "contracts/example-deck-v1.json"
# Complete decks authored only in JSON (no HTML changes); each must validate, load and render.
FIXTURES = ROOT / "tests/fixtures"
FIXTURE_DECKS = ["deck-partnership-proposal.json", "deck-quarterly-ops-report.json", "deck-template-as-code.json"]

# Run the app declarations in a VM with inert event registration, without opening
# a browser or changing the delivered HTML. Fail if the app entry cannot be found.
EXTRACT = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('xbrain-presentation-system-v1.0.0.html', 'utf8');
const match = html.match(/<script>\s*\/\/ Application modules[\s\S]*?<\/script>/);
if (!match) throw Error('Cannot locate the application script');
let script = match[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
if (!/\}\)\(\);\s*$/.test(script)) throw Error('Cannot locate the private scope end');
script = script.replace(/\}\)\(\);\s*$/, `
  const current=deckDocument();
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
  const emptyDraft=draft.load();
  draft.save(current);
  const savedDraft=draft.load();
  const fails=fn=>{try{fn();return false;}catch(error){return error.message;}};
  const layoutDoc={version:'1.0',layouts:{'kpi-tiles':{group:'D',template:'<b>x</b>'}},slides:[{type:'kpi-tiles',content:{}}]};
  const templateAsCode={
    layoutSlideAccepted:DeckModel.normalize(layoutDoc,xbCatalogFor(layoutDoc,layoutDoc.layouts),DECK_DEFAULT_CONFIG).slides[0].type,
    layoutSlideWithoutLayouts:fails(()=>DeckModel.normalize({version:'1.0',slides:layoutDoc.slides},xbCatalogFor({slides:layoutDoc.slides},undefined),DECK_DEFAULT_CONFIG)),
    packVersions:['2.0',1,null].map(version=>fails(()=>xbRequireVersion({version},true))),
    packWithoutVersion:fails(()=>xbRequireVersion({},true)),
    payloadWithoutVersion:fails(()=>xbSlidesFromPayload({xbrainSlides:true,slides:[]})),
    customLayoutsRegistered:LAYOUT_CATALOG.filter(x=>x.custom).length
  };
  // Load each fixture deck the way the studio does (validate, register its layouts/helpers),
  // then render every slide as a thumbnail and collect error pages. Runs last: it replaces the deck.
  const fixtures=Object.entries(FIXTURES).map(([name,doc])=>{
    try {
      const next=DeckModel.normalize(doc,xbCatalogFor(doc,doc.layouts),DECK_DEFAULT_CONFIG);
      xbSyncCustom({layouts:doc.layouts,helpers:doc.helpers});
      DECK_CONFIG=next.config; slides=next.slides;
      const broken=slides.map((s,i)=>/LỖI RENDER|Không có layout|Unknown component/.test(renderSlideHTML(s,i,true))?(i+1)+':'+s.type:null).filter(Boolean);
      return {name,slides:slides.length,compileErrors:XB_ERRORS.slice(),broken};
    } catch(error) { return {name,error:error.message}; }
  });
  xbSyncCustom({}); // drop fixture layouts so the registry checks below see only built-in layouts
  globalThis.result={document:current,layouts:LAYOUT_CATALOG.map(x=>x.type),
    components:Object.keys(COMPONENT_RENDERERS),visuals:DECK_DESCRIPTORS,
    normalized:DeckModel.serialize(normalized.config,normalized.slides),rejectedVersions,
    draft:{empty:emptyDraft,saved:savedDraft,reads,keys:[...storage.keys()]},
    array:DeckModel.serialize(array.config,array.slides),templateAsCode,fixtures};
})();`);
const FIXTURES={};
if (fs.existsSync('tests/fixtures'))
  for (const f of fs.readdirSync('tests/fixtures').filter(f=>f.endsWith('.json')).sort())
    FIXTURES[f]=JSON.parse(fs.readFileSync('tests/fixtures/'+f,'utf8'));
const context={window:{addEventListener(){}},document:{addEventListener(){}},console:{...console,error(){}},FIXTURES};
vm.runInNewContext(script,context,{timeout:5000});
process.stdout.write(JSON.stringify(context.result));
"""


class JsonContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        cls.validator = Draft202012Validator(cls.schema)
        cls.example = json.loads(EXAMPLE.read_text(encoding="utf-8"))
        cls.source = json.loads(subprocess.run(
            ["node", "-e", EXTRACT], cwd=ROOT, check=True,
            capture_output=True, text=True, encoding="utf-8", timeout=15,
        ).stdout)

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

    def test_examples_and_all_builtin_slides(self):
        self.assertValid(self.example)
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
        for bad in [{"rendr": "return '';"}, {"group": "D"}, {"render": 42}, {"template": "", "group": "Z"}]:
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
        result = self.source["templateAsCode"]
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
