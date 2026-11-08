// Browser regression for the React/Vite compiler and editable offline export.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=path.resolve(process.argv[2]||'/tmp/xbrain-agent-browser');fs.mkdirSync(dir,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xbrain-agent-browser-'));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'src/__tests__/fixtures/agent-native.json'),'utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1960,height:1200}});
const errors=[],requests=[],results={};
await context.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
try{
  const studio=await context.newPage();studio.on('pageerror',e=>errors.push(e.message));
  await studio.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
  await studio.waitForFunction(()=>window.XB && window.XBrainCompiler);
  const built=await studio.evaluate(doc=>{
    const options={strict:true,trust:'trusted',textSafety:1.6};
    const repaired=XBrainCompiler.repair(doc,options);
    const compiled=XBrainCompiler.compile(repaired.document,options);
    const css=[...document.querySelectorAll('head style')].map(s=>s.textContent).join('\n');
    const sprite=document.querySelector('svg.v1-svg-defs')?.outerHTML||'';
    return {repaired,compiled,html:XBrainCompiler.staticPage(compiled,{css,sprite}),measureSource:XBrainCompiler.measureSource()};
  },fixture);
  assert.equal(built.repaired.ok,true,JSON.stringify(built.repaired.diagnostics));
  assert.equal(built.compiled.ok,true,JSON.stringify(built.compiled.diagnostics));
  const staticFile=path.join(temp,'static.html');fs.writeFileSync(staticFile,built.html);
  const slides=await context.newPage();slides.on('pageerror',e=>errors.push(e.message));
  await slides.goto(pathToFileURL(staticFile).href);await slides.evaluate(()=>document.fonts.ready);
  const measured=await slides.evaluate(source=>(new Function('return ('+source+')'))()(document.body),built.measureSource);
  assert.equal(measured.length,0,JSON.stringify(measured));
  const text=await slides.locator('body').innerText();
  for(let i=0;i<31;i++)assert.ok(text.includes(`Item ${i}:`));
  assert.equal(await slides.locator('.v1-table tbody tr').count(),12);
  for(const id of ['table','list']){
    const slide=slides.locator(`section[data-xb-slide]:has([data-slide-id="${id}"])`).first();
    await slide.screenshot({path:path.join(dir,`after-${id}.png`)});
  }
  await slides.emulateMedia({media:'print'});
  assert.equal(await slides.locator('[data-xb-slide]').count(),built.compiled.slides.length);
  assert.equal((await slides.evaluate(source=>(new Function('return ('+source+')'))()(document.body),built.measureSource)).length,0);
  results.static={slides:built.compiled.slides.length,measured:measured.length,print:true};
  await slides.close();

  const overflowProbe=await studio.evaluate(()=>{
    const doc={version:'1.0',slides:[
      {type:'quote',content:{quoteVN:'Một câu trích dẫn rất dài '.repeat(30),author:'A'}},
      {type:'closing',content:{headline:'Thank you'}}]};
    const compiled=XBrainCompiler.compile(doc,{strict:true,trust:'trusted'});
    const css=[...document.querySelectorAll('head style')].map(s=>s.textContent).join('\n');
    return XBrainCompiler.staticPage(compiled,{css,sprite:document.querySelector('svg.v1-svg-defs')?.outerHTML||''});
  });
  const overflowFile=path.join(temp,'overflow.html');fs.writeFileSync(overflowFile,overflowProbe);
  const overflowPage=await context.newPage();await overflowPage.goto(pathToFileURL(overflowFile).href);
  const findings=await overflowPage.evaluate(source=>(new Function('return ('+source+')'))()(document.body),built.measureSource);
  assert.ok(findings.some(d=>d.code==='layout.measured-overflow'&&d.path==='/slides/0'),JSON.stringify(findings));
  assert.ok(!findings.some(d=>d.code==='layout.measured-overflow'&&d.path==='/slides/1'),JSON.stringify(findings));
  results.overflowProbe=true;await overflowPage.close();

  const app=path.join(temp,'editable.html');
  const authored={version:'1.0',slides:[
    {type:'composer',components:[{type:'html',html:'<b>Safe content</b><img src="data:image/png;base64,broken" onerror="globalThis.PWNED=1">'}]},
    {type:'custom-html',content:{title:'Safe HTML',html:'<b>Custom safe</b><img src=x onerror="globalThis.PWNED=2">'}},
    {type:'custom-diagram',content:{title:'Safe SVG',svg:'<svg onload="globalThis.PWNED=3"><text x="10" y="40">SVG safe</text></svg>'}}
  ]};
  const exported=await studio.evaluate(doc=>{XB.setDeck(doc);return XB.exportHTML();},authored);
  fs.writeFileSync(app,exported);
  const reopened=await context.newPage();reopened.on('pageerror',e=>errors.push(e.message));
  await reopened.goto(pathToFileURL(app).href);await reopened.waitForFunction(()=>window.XB&&XB.getDeck().slides.length===3);
  assert.ok((await reopened.locator('#active-slide-viewport').innerText()).includes('Safe content'));
  for(let i=0;i<3;i++){
    await reopened.evaluate(index=>XB.select(index),i);
    assert.ok(await reopened.locator('#active-slide-viewport [onerror],#active-slide-viewport [onload]').count()>0);
  }
  await reopened.evaluate(()=>XB.setDeck({version:'1.0',helpers:{attack:'(()=>{globalThis.PWNED=4;return ()=>1})()'},slides:[{type:'composer',components:[{type:'text',text:'Import is inert'}]}]}));
  assert.equal(await reopened.evaluate(()=>globalThis.PWNED),4);
  await reopened.evaluate(()=>XB.setDeck({version:'1.0',slides:[{type:'one-off',render:'globalThis.PWNED=5;return "ran";'}]}));
  assert.equal(await reopened.evaluate(()=>globalThis.PWNED),5);
  assert.ok((await reopened.locator('#active-slide-viewport').innerText()).includes('ran'));
  results.editable={reopenedViaFile:true,htmlAndSvgPreserved:true,helperAndSlideCodeExecuted:true,cdnRequests:requests.length};
  assert.equal(requests.length,0);assert.deepEqual(errors,[]);results.pageErrors=errors;
  fs.writeFileSync(path.join(dir,'browser-results.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await context.close();await browser.close();fs.rmSync(temp,{recursive:true,force:true});}
