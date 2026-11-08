// Exercise trusted rendering, browser measurement, stale runs and candidate isolation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1366,height:768}});await context.route(/^https?:/,r=>r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/qbr-deck.json'),'utf8'));
 const results=await page.evaluate(async doc=>{
  const a=XB.agent;await a.ready();const before=JSON.stringify(XB.getDeck());const loaded=await a.setCandidate({document:doc,baseRevision:null});
  const validation=await a.validate({revision:loaded.revision});const run=await a.render({revision:loaded.revision});const inspect=await a.inspect({runId:run.data.runId});
  const selected=await a.render({revision:loaded.revision,slides:[0]});const subset=await a.inspect({runId:selected.data.runId});
  const patch=await a.applyPatch({baseRevision:loaded.revision,operations:[{op:'add',path:'/metadata/name',value:'Changed'}]});const stale=await a.inspect({runId:run.data.runId});
  const bad=await a.validate({revision:loaded.revision});const rerender=await a.render({revision:patch.revision});const exported=await a.exportArtifact({revision:patch.revision,format:'static-html',qaRunId:rerender.data.runId});const after=JSON.stringify(XB.getDeck());
  const evil={version:'1.0',slides:[{id:'evil',type:'custom-html',content:{html:'<img src="https://attacker.invalid/x" onerror="parent.__executed=1"><script>parent.__executed=1</script><p>safe</p>'}}]};
  const loadEvil=await a.setCandidate({baseRevision:patch.revision,document:evil});const evilRun=await a.render({revision:loadEvil.revision});
  return {loaded,validation,run,inspect,selected,subset,patch,stale,bad,rerender,exported,before,after,evilRun,executed:!!window.__executed};
 },fixture);
 assert.equal(results.loaded.ok,true);assert.equal(results.validation.ok,true);assert.equal(results.validation.data.validation.valid,true);
 assert.equal(results.run.ok,true,JSON.stringify(results.run));assert.equal(results.inspect.data.qa.measurement,'browser-completed');assert.equal(results.inspect.data.qa.checkedSlides,12);assert.equal(results.inspect.data.qa.visualReview,'not-assessed');
 assert.equal(results.subset.data.qa.checkedSlides,1);assert.equal(results.subset.data.qa.passed,false);assert.equal(results.stale.data.fresh,false);assert.equal(results.bad.error.code,'REVISION_CONFLICT');assert.equal(results.before,results.after);assert.equal(results.executed,true);assert.equal(results.evilRun.ok,true);assert.deepEqual(errors,[]);
 assert.equal(results.rerender.data.qa.checkedSlides,12);assert.equal(results.exported.ok,true,JSON.stringify(results.exported));
 await context.close();console.log('Agent render, measurement and isolation checks passed');
} finally {await browser.close();}
