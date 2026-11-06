// Optional header workflow checks. Uses the same external Playwright/Chromium setup as browser_improvements.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.resolve(process.argv[2]||'/tmp/xbrain-header-check');fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1366,height:768}});await context.route(/^https?:/,route=>route.abort());
const page=await context.newPage(),errors=[],results={};page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.type()==='confirm'?d.accept():d.dismiss());
const menu=name=>page.locator('#v1-menu-'+name),trigger=name=>page.locator('#v1-menu-'+name+'-trigger');
const choose=async(name,action)=>{await trigger(name).click();await menu(name).locator('[data-click-action="'+action+'"]').click();};
const deck=()=>page.evaluate(()=>JSON.stringify(XB.getDeck()));
try{
 await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 assert.equal(await page.locator('#v1-undo').isDisabled(),true);assert.equal(await page.locator('#v1-redo').isDisabled(),true);
 results.layouts=[];
 for(const width of [1440,1366,1024,768,640,390]){
  await page.setViewportSize({width,height:900});await page.locator('#v1-document-name').click();
  const geometry=await page.locator('#app-topbar').evaluate(root=>({width:innerWidth,height:root.offsetHeight,client:root.clientWidth,scroll:root.scrollWidth,buttons:[...root.querySelectorAll('.v1-header-actions>.v1-header-start>button,.v1-header-actions>.v1-header-end>button,.v1-header-actions [data-v1-menu-trigger]')].map(el=>({name:el.textContent.trim(),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}))}));
  assert.equal(geometry.scroll,geometry.client,JSON.stringify(geometry));
  for(const button of geometry.buttons)assert.ok(button.left>=0&&button.right<=width,JSON.stringify(button));
  results.layouts.push(geometry);await page.locator('#app-topbar').screenshot({path:path.join(dir,'header-'+width+'.png')});
  for(const name of ['file','add','ai','export','options']){
   await trigger(name).focus();await trigger(name).press('ArrowDown');assert.equal(await menu(name).isVisible(),true);
   const rect=await menu(name).boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width);
   const items=menu(name).locator('[role="menuitem"],[role="menuitemcheckbox"]');assert.equal(await items.first().evaluate(el=>el===document.activeElement),true);
   await page.keyboard.press('End');assert.equal(await items.last().evaluate(el=>el===document.activeElement),true);
   await page.keyboard.press('Home');await page.keyboard.press('ArrowUp');assert.equal(await items.last().evaluate(el=>el===document.activeElement),true);
   await page.keyboard.press('Escape');assert.equal(await menu(name).isVisible(),false);assert.equal(await trigger(name).evaluate(el=>el===document.activeElement),true);
  }
 }
 if(process.env.XB_BASELINE_HTML){
  const baseline=await context.newPage();await baseline.goto(pathToFileURL(process.env.XB_BASELINE_HTML).href);
  for(const width of [1440,1366]){await baseline.setViewportSize({width,height:900});await baseline.locator('#app-topbar').screenshot({path:path.join(dir,'baseline-header-'+width+'.png')});}
  await baseline.close();results.baselineCompared=true;
 }
 await page.setViewportSize({width:1366,height:768});
 for(const key of ['Enter','Space']){await trigger('file').focus();await trigger('file').press(key);assert.equal(await menu('file').isVisible(),true);await page.keyboard.press('Escape');}
 await trigger('file').click();await page.locator('#v1-document-name').click();assert.equal(await menu('file').isVisible(),false);
 await trigger('file').press('ArrowDown');await page.keyboard.press('Tab');assert.equal(await menu('file').isVisible(),false);
 assert.equal(await page.locator('.v1-header-menu:visible').count(),0);
 await trigger('file').press('ArrowDown');await page.keyboard.press('Control+x');assert.equal(await page.locator('.v1-cut').count(),0);await page.keyboard.press('Escape');
 results.keyboardMenus=true;
 const fixture={version:'1.0',metadata:{name:'Báo cáo vận hành Q4'},slides:[{type:'composer',title:'Overview',components:[{type:'text',text:'Verified content'}]},{type:'composer',title:'Details',components:[{type:'text',text:'Details'}]}]};
 const fixtureFile=path.join(dir,'input.json');fs.writeFileSync(fixtureFile,JSON.stringify(fixture));
 const [chooser]=await Promise.all([page.waitForEvent('filechooser'),choose('file','importDeckJSON')]);await chooser.setFiles(fixtureFile);await page.waitForFunction(()=>XB.getDeck().metadata.name==='Báo cáo vận hành Q4');
 assert.equal(await page.locator('#v1-document-name').innerText(),fixture.metadata.name);assert.equal(await page.locator('#v1-document-count').innerText(),'2 slide');
 await choose('file','saveLocalDraft');assert.equal(await page.locator('#v1-draft-status').innerText(),'Đã lưu nháp');
 const saved=await deck(),stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('xbrain-v1-draft')));assert.equal(stored.version,'1.0');assert.ok(stored.savedAt);
 await page.evaluate(()=>XB.updateSlide(0,{source:'Changed'}));assert.equal(await page.locator('#v1-draft-status').innerText(),'Có thay đổi');
 assert.equal(await page.locator('#v1-undo').isDisabled(),false);assert.equal(await page.locator('#v1-redo').isDisabled(),true);
 await page.locator('#v1-undo').click();assert.equal(await deck(),saved);assert.equal(await page.locator('#v1-draft-status').innerText(),'Đã lưu nháp');assert.equal(await page.locator('#v1-redo').isDisabled(),false);
 await page.locator('#v1-redo').click();assert.equal(await page.locator('#v1-draft-status').innerText(),'Có thay đổi');
 await choose('file','restoreLocalDraft');assert.equal(await page.locator('#v1-draft-status').innerText(),'Đã lưu nháp');assert.deepEqual(await page.evaluate(()=>XB.getDeck().slides),stored.slides);
 await page.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Quota exceeded');};});
 await choose('file','saveLocalDraft');assert.equal(await page.locator('#v1-draft-status').innerText(),'Chưa lưu được nháp');
 await page.evaluate(()=>{Storage.prototype.setItem=window.__setItem;delete window.__setItem;});await choose('file','saveLocalDraft');assert.equal(await page.locator('#v1-draft-status').innerText(),'Đã lưu nháp');
 const beforeInvalid=await deck(),invalidFile=path.join(dir,'invalid.json');fs.writeFileSync(invalidFile,JSON.stringify({...fixture,version:'2.0'}));
 const [invalidChooser]=await Promise.all([page.waitForEvent('filechooser'),choose('file','importDeckJSON')]);await invalidChooser.setFiles(invalidFile);await page.waitForFunction(()=>document.getElementById('import-deck-json').value==='');assert.equal(await deck(),beforeInvalid);assert.equal(await page.locator('#v1-document-name').innerText(),fixture.metadata.name);
 results.fileImportAndVersionGate=true;
 results.draftAndHistory=true;
 await page.locator('#v1-qa-trigger').click();assert.equal(await page.locator('#v1-qa-status').getAttribute('data-state'),'clean');
 await page.evaluate(()=>XB.updateSlide(0,{source:'Needs new QA'}));assert.equal(await page.locator('#v1-qa-label').innerText(),'Kiểm tra lại');assert.equal(await page.locator('#v1-qa-status').getAttribute('data-state'),'stale');
 await page.locator('#v1-undo').click();assert.equal(await page.locator('#v1-qa-status').getAttribute('data-state'),'clean');
 await page.locator('#v1-redo').click();assert.equal(await page.locator('#v1-qa-status').getAttribute('data-state'),'stale');
 await page.evaluate(()=>XB.replaceSlide(0,{type:'composer',title:'Missing data',components:[{type:'chart',variant:'scatter',data:[{label:'No X',value:1}]}]}));await page.locator('#v1-qa-trigger').click();assert.ok(Number(await page.locator('#v1-qa-status').innerText())>0);
 results.qaFreshness=true;
 await page.evaluate(d=>XB.setDeck(d),fixture);
 const unchanged=await deck();
 await choose('options','toggleInlineEdit');await trigger('options').click();assert.equal(await page.locator('#btn-toggle-edit').getAttribute('aria-checked'),'false');await menu('options').locator('[data-click-action="toggleInlineEdit"]').click();assert.equal(await deck(),unchanged);
 await choose('options','switchAppMode');assert.equal(await page.locator('#brand-system-view').isVisible(),true);
 await page.locator('#tab-btn-workspace').click();assert.equal(await page.locator('#tab-btn-workspace').getAttribute('aria-current'),'page');
 await page.locator('#tab-btn-gallery').click();assert.equal(await page.locator('#gallery-view').isVisible(),true);assert.equal(await page.locator('#tab-btn-gallery').getAttribute('aria-current'),'page');assert.equal(await page.locator('#tab-btn-gallery').innerText(),'Tổng quan');
 await page.locator('#tab-btn-workspace').click();
 await choose('options','openHeaderAbout');assert.equal(await page.locator('#v1-about-modal').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await trigger('options').evaluate(el=>el===document.activeElement),true);
 await choose('add','openAddSlideModal');assert.equal(await page.locator('#modal-add-slide').isVisible(),true);await page.keyboard.press('Escape');
 await choose('add','deckOpenLibrary');assert.equal(await page.locator('#v1-visual-modal').isVisible(),true);await page.keyboard.press('Escape');
 await choose('ai','openDataEditorModal');assert.equal(await page.locator('#modal-json-editor').isVisible(),true);await page.keyboard.press('Escape');
 await choose('ai','deckOpenDeckEditor');assert.equal(JSON.parse(await page.locator('#v1-deck-text').inputValue()).version,'1.0');await page.keyboard.press('Escape');
 await choose('ai','deckOpenContract');assert.equal(await page.locator('#v1-contract-modal').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await trigger('ai').evaluate(el=>el===document.activeElement),true);
 assert.equal(await deck(),unchanged);results.allGroupedActionsReachable=true;
 for(const [action,filename] of [['saveDeckJSON','xbrain-presentation-data-v1.json'],['downloadEditedHTML','index-edited.html']]){
  await trigger('export').click();const [download]=await Promise.all([page.waitForEvent('download'),menu('export').locator('[data-click-action="'+action+'"]').click()]);assert.equal(download.suggestedFilename(),filename);
  if(action==='saveDeckJSON')assert.equal(JSON.stringify(JSON.parse(fs.readFileSync(await download.path(),'utf8'))),await deck());
  else{
   const file=path.join(dir,'reopened.html');await download.saveAs(file);const reopened=await context.newPage();await reopened.goto(pathToFileURL(file).href);assert.equal(await reopened.locator('.v1-header-menu:visible').count(),0);assert.equal(await reopened.evaluate(()=>JSON.stringify(XB.getDeck())),unchanged);assert.equal(await reopened.locator('#v1-draft-status').innerText(),'Chưa lưu nháp');await reopened.locator('#v1-menu-ai-trigger').click();assert.equal(await reopened.locator('#v1-menu-ai').isVisible(),true);await reopened.close();
  }
 }
 results.exports=true;
 await page.evaluate(()=>{window.print=()=>{window.__printed=true;};});await choose('export','exportPrintPDF');await page.waitForFunction(()=>window.__printed===true);assert.equal(await page.locator('#print-all-slides-container .print-slide-page').count(),2);
 await page.locator('#v1-present').click();await page.waitForFunction(()=>document.body.classList.contains('presentation-fullscreen'));assert.equal(await page.locator('#app-topbar').isVisible(),false);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.body.classList.contains('presentation-fullscreen'));assert.equal(await page.locator('#app-topbar').isVisible(),true);assert.equal(await deck(),unchanged);
 results.printAndPresentation=true;
 await page.screenshot({path:path.join(dir,'studio-1366.png')});await trigger('ai').click();await page.screenshot({path:path.join(dir,'ai-menu.png')});await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);results.pageErrors=errors;
 fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
