// Optional browser regressions. Supply playwright-core and Chromium externally; no app dependency.
// XB_PLAYWRIGHT_MODULE=/path/to/playwright-core CHROME_PATH=/path/to/chrome node tests/browser_improvements.mjs [artifact-dir]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {loadRuntime} from '../tools/xbrain.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(process.argv[2]||'/tmp/xbrain-browser-improvements');fs.mkdirSync(dir,{recursive:true});
const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/recursive-pipeline.json'),'utf8'));
const rt=loadRuntime(),fixed=rt.call('repair',fixture),compiled=rt.call('compile',fixed.document);
assert.equal(fixed.ok,true);assert.equal(compiled.summary.errors,0);
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.route(/^https?:/,route=>route.abort());
const page=await context.newPage(),pageErrors=[],results={};page.on('pageerror',e=>pageErrors.push(e.message));page.on('dialog',d=>d.dismiss());
try{
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 const editorDeck={version:'1.0',slides:[{type:'composer',content:{title:'Nested title',subtitle:'Nested subtitle',components:[{type:'metric',title:'Count',value:7}]}}]};
 await page.evaluate(d=>XB.setDeck(d),editorDeck);
 const initial=await page.evaluate(()=>JSON.stringify(XB.getDeck()));
 const open=()=>page.locator('[data-click-action="openContentEditorModal"]').click();
 const field=keys=>page.locator(`#content-editor-fields [data-path='${JSON.stringify(keys)}']`);
 const save=()=>page.locator('[data-click-action="applyContentEditor"]').click();
 await open();assert.equal(await field(['title']).inputValue(),'Nested title');
 await field(['title']).fill('Edited title');await field(['components',0,'value']).fill('abc');await save();
 assert.equal(await page.evaluate(()=>JSON.stringify(XB.getDeck())),initial);
 assert.equal(await field(['components',0,'value']).getAttribute('aria-invalid'),'true');
 await field(['components',0,'value']).fill('10');await save();
 const edited=await page.evaluate(()=>JSON.stringify(XB.getDeck()));assert.notEqual(edited,initial);
 assert.equal(JSON.parse(edited).slides[0].content.title,'Edited title');
 assert.equal(JSON.parse(edited).slides[0].content.components[0].value,10);
 await page.evaluate(()=>{XB.render(0);XB.render(0);XBrainCompiler.qa(XB.getDeck());XB.undo();});
 assert.equal(await page.evaluate(()=>JSON.stringify(XB.getDeck())),initial);
 await page.evaluate(()=>XB.redo());assert.equal(await page.evaluate(()=>JSON.stringify(XB.getDeck())),edited);
 const inline=page.locator('#active-slide-viewport [data-field="title"]');await inline.fill('Inline title');await inline.blur();
 assert.equal(await page.evaluate(()=>XB.getDeck().slides[0].content.title),'Inline title');
 await open();assert.equal(await field(['title']).inputValue(),'Inline title');
 await page.locator('#modal-content-editor [data-click-action="closeContentEditorModal"]').first().click();
 await page.evaluate(()=>XB.undo());assert.equal(await page.evaluate(()=>JSON.stringify(XB.getDeck())),edited);
 await page.evaluate(()=>XB.redo());
 const invalidVersion=await page.evaluate(()=>{const before=JSON.stringify(XB.getDeck());try{XB.setDeck({version:'2.0',slides:[]});return false;}catch{return before===JSON.stringify(XB.getDeck());}});assert.equal(invalidVersion,true);
 results.editor={atomicValidation:true,undoRedo:true,inlineRoundTrip:true,invalidVersion:true,renderDoesNotRecordHistory:true};
 // Mixed root storage: title at slide level, components inside content.
 await page.evaluate(()=>XB.setDeck({version:'1.0',slides:[{type:'composer',title:'Top title',content:{components:[{type:'metric',value:0}]}}]}));
 await open();assert.equal(await field(['title']).inputValue(),'Top title');assert.equal(await field(['components',0,'value']).inputValue(),'0');
 await field(['components',0,'value']).fill('4');await save();assert.equal(await page.evaluate(()=>XB.getDeck().slides[0].content.components[0].value),4);
 results.editor.mixedRoot=true;
 results.containerTypes=[];
 for(const type of ['grid','columns','row','stack','card','group']){
  await page.evaluate(type=>XB.setDeck({version:'1.0',slides:[{type:'composer',title:type,components:[{type,span:12,children:[{type:'chart',variant:'bar',data:[{label:'A',value:1}]},{type:'text',text:'Sibling'}]}]}]}),type);
  const geometry=await page.evaluate(()=>{const root=document.querySelector('#active-slide-viewport .v1-scene>.v1-component'),inner=root.firstElementChild;return {root:root.getBoundingClientRect().width,inner:inner.getBoundingClientRect().width,qa:XBrainCompiler.qa(XB.getDeck(),{measure:true})};});
  assert.ok(geometry.inner<=geometry.root+1);assert.ok(geometry.inner>=geometry.root-2);assert.equal(geometry.qa.summary.errors,0);assert.equal(geometry.qa.diagnostics.filter(d=>d.measurement==='browser'||d.code==='layout.measured-overflow').length,0);
  results.containerTypes.push(type);
 }
 // Positive control: overlapping labels must be detected using actual browser rectangles.
 results.collisionPositive=await page.evaluate(()=>{
  const host=document.createElement('div');host.innerHTML='<section data-xb-slide="0" style="width:500px;height:200px"><svg width="500" height="200"><g transform="translate(30,10)"><text x="20" y="40" font-size="24">Overlapping one</text><text x="21" y="41" font-size="24">Overlapping two</text></g></svg></section>';document.body.appendChild(host);
  try{return XBrainCompiler.measure(host).filter(d=>d.code==='layout.text-collision');}finally{host.remove();}
 });assert.equal(results.collisionPositive.length,1);assert.ok(results.collisionPositive[0].overlap>.15);
 await page.evaluate(()=>XB.setDeck({version:'1.0',theme:{preset:'dark',tokens:{ink:'#EAF7FF'}},slides:[{type:'composer',title:'Dark theme',components:[{type:'chart',title:'Visible chart title',variant:'bar',data:[{label:'A',value:7}]}]}]}));
 results.theme=await page.evaluate(()=>({background:getComputedStyle(document.querySelector('.v1-slide')).backgroundColor,title:getComputedStyle(document.querySelector('.v1-slide h1')).color,logo:document.querySelector('.v1-slide-logo use').getAttribute('href'),chartHeadings:document.querySelectorAll('.v1-visual-heading').length}));
 assert.equal(results.theme.background,'rgb(66, 84, 83)');assert.equal(results.theme.title,'rgb(234, 247, 255)');assert.equal(results.theme.logo,'#xbrain-logo-white');assert.equal(results.theme.chartHeadings,1);
 await page.locator('#active-slide-viewport').screenshot({path:path.join(dir,'theme.png')});
 await page.evaluate(d=>XB.setDeck(d),fixed.document);
 results.qa=await page.evaluate(()=>XBrainCompiler.qa(XB.getDeck(),{measure:true}));
 assert.equal(results.qa.summary.errors,0);assert.equal(results.qa.diagnostics.filter(d=>d.code==='layout.measured-overflow'||d.measurement==='browser').length,0);
 for(const [id,name] of [['nested','nested'],['flows','sankey'],['dag','tree'],['scatter','scatter'],['radar','radar']]){
  await page.evaluate(id=>XB.select(XB.getDeck().slides.findIndex(s=>s.id===id)),id);
  await page.locator('#active-slide-viewport').screenshot({path:path.join(dir,name+'.png')});
 }
 await page.evaluate(()=>XB.select(0));
 for(const [width,height] of [[1366,768],[1440,900]]){await page.setViewportSize({width,height});await page.screenshot({path:path.join(dir,`studio-${width}.png`)});}
 await page.locator('#tab-btn-gallery').click();assert.equal(await page.locator('#gallery-view').isVisible(),true);await page.screenshot({path:path.join(dir,'gallery.png')});
 await page.locator('#tab-btn-workspace').click();
 const color=await page.evaluate(()=>{const ids=['scoped','unscoped'];return ids.map(id=>{const i=XB.getDeck().slides.findIndex(s=>s.id===id);XB.select(i);return getComputedStyle(document.querySelector('#active-slide-viewport .v1-text')).color;});});
 assert.equal(color[0],'rgb(195, 0, 0)');assert.notEqual(color[0],color[1]);results.colors=color;
 const beforeExport=await page.evaluate(()=>JSON.stringify(XB.getDeck()));
 fs.writeFileSync(path.join(dir,'exported-app.html'),await page.evaluate(()=>XB.exportHTML()));
 const reopened=await context.newPage();await reopened.goto(pathToFileURL(path.join(dir,'exported-app.html')).href);
 assert.equal(await reopened.evaluate(()=>JSON.stringify(XB.getDeck())),beforeExport);
 const reopenedTitle=reopened.locator('#active-slide-viewport [data-field="title"]');await reopenedTitle.fill('Reopened inline edit');await reopenedTitle.blur();assert.equal(await reopened.evaluate(()=>XB.getDeck().slides[0].title),'Reopened inline edit');
 await reopened.evaluate(()=>XB.undo());assert.equal(await reopened.evaluate(()=>JSON.stringify(XB.getDeck())),beforeExport);
 await reopened.close();results.offlineAppRoundTrip=true;
 fs.writeFileSync(path.join(dir,'static.html'),rt.call('staticPage',compiled,{css:rt.parts.css,sprite:rt.parts.sprite,fonts:''}));
 const staticPage=await context.newPage();await staticPage.goto(pathToFileURL(path.join(dir,'static.html')).href);
 results.static=await staticPage.evaluate(measureSource=>({pages:document.querySelectorAll('[data-xb-slide]').length,diagnostics:(new Function('return ('+measureSource+')'))()(document.body)}),rt.call('measureSource'));
 assert.equal(results.static.pages,compiled.slides.length);assert.equal(results.static.diagnostics.length,0);
 await staticPage.emulateMedia({media:'print'});await staticPage.pdf({path:path.join(dir,'print.pdf'),width:'1920px',height:'1080px',printBackground:true,preferCSSPageSize:true});
 results.print=await staticPage.evaluate(()=>({pages:document.querySelectorAll('[data-xb-slide]').length,enhancements:[...document.querySelectorAll('.v1-enhanced')].filter(e=>getComputedStyle(e).display!=='none').length}));
 await staticPage.close();
 // Compare the affected nested slide against an optional baseline runtime.
 if(process.env.XB_BASELINE_HTML){const baseline=await context.newPage();await baseline.goto(pathToFileURL(process.env.XB_BASELINE_HTML).href);await baseline.evaluate(d=>XB.setDeck({version:'1.0',slides:[d.slides[0]]}),fixture);await baseline.locator('#active-slide-viewport').screenshot({path:path.join(dir,'baseline-nested.png')});await baseline.close();results.baselineCompared=true;}
 assert.deepEqual(pageErrors,[]);results.pageErrors=pageErrors;
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({editor:results.editor,qa:results.qa.summary,static:results.static,print:results.print,pageErrors},null,2));
}finally{await browser.close();}
