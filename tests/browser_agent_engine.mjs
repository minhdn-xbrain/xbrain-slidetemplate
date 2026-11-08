// Agent engine browser checks. Uses an externally supplied Playwright/Chromium installation.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadRuntime} from '../tools/xbrain.mjs';

const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.resolve(process.argv[2]||'/tmp/xbrain-agent-browser');fs.mkdirSync(dir,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'xbrain-agent-browser-'));
const rt=loadRuntime(),fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/agent-native.json'),'utf8'));
const results={},errors=[],requests=[];
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1960,height:1200}});
await context.route(/^https?:/,route=>{requests.push(route.request().url());return route.abort();});
try{
  for(const [label,htmlFile] of [['before',process.env.XB_BASELINE_HTML],['after',undefined]]){
    if(label==='before'&&!htmlFile)continue;
    const runtime=htmlFile?loadRuntime({htmlFile}):rt;
    const file=path.join(temp,label+'.html');
    let repaired,compiled,pipeline;
    if(label==='after'){
      pipeline=JSON.parse(execFileSync(process.execPath,[path.join(root,'tools/xbrain.mjs'),'pipeline',path.join(root,'tests/fixtures/agent-native.json'),'--require-browser','--offline','--json','-o',file],{encoding:'utf8'}));
      assert.equal(pipeline.published,true);assert.equal(pipeline.browser.measured,true);
      repaired={document:JSON.parse(fs.readFileSync(path.join(temp,'after.repaired.json'),'utf8')),changes:pipeline.changes};
      compiled=runtime.call('compile',repaired.document,pipeline.manifest.options);
    }else{
      repaired=runtime.call('repair',fixture);compiled=runtime.call('compile',repaired.document);
      fs.writeFileSync(file,runtime.call('staticPage',compiled,{css:runtime.parts.css,sprite:runtime.parts.sprite,fonts:''}));
    }
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
    // Use the current measurement implementation for both versions.
    const measured=await page.evaluate(src=>(new Function('return ('+src+')'))()(document.body),rt.call('measureSource'));
    results[label]={slides:compiled.slides.length,summary:compiled.summary,changes:repaired.changes,measured,...(pipeline?{attempts:pipeline.attempts,manifest:pipeline.manifest}:{})};
    for(const id of ['table','list']){
      const slide=page.locator(`section[data-xb-slide]:has([data-slide-id="${id}"])`).first();
      await slide.screenshot({path:path.join(dir,`${label}-${id}.png`)});
    }
    if(label==='after'){
      assert.equal(compiled.ok,true);assert.equal(measured.length,0,JSON.stringify(measured));
      const text=await page.locator('body').innerText();
      for(let i=0;i<31;i++)assert.ok(text.includes(`Item ${i}:`));
      const tables=await page.locator('.v1-table tbody tr').count();assert.equal(tables,12);
      await page.emulateMedia({media:'print'});
      assert.equal(await page.locator('[data-xb-slide]').count(),compiled.slides.length);
      assert.equal((await page.evaluate(src=>(new Function('return ('+src+')'))()(document.body),rt.call('measureSource'))).length,0);
      results.print={slides:compiled.slides.length,diagnostics:0};
    }
    await page.close();
  }
  const input=path.join(temp,'unsafe.json'),app=path.join(temp,'safe-app.html');
  fs.writeFileSync(input,JSON.stringify({version:'1.0',slides:[
    {type:'composer',components:[{type:'html',html:'<b>Safe content</b><img src="data:image/png;base64,broken" onerror="globalThis.PWNED=1">'}]},
    {type:'custom-html',content:{title:'Safe HTML',html:'<b>Custom safe</b><img src=x onerror="globalThis.PWNED=2">'}},
    {type:'custom-diagram',content:{title:'Safe SVG',svg:'<svg onload="globalThis.PWNED=3"><text x="10" y="40">SVG safe</text></svg>'}}
  ]}));
  execFileSync(process.execPath,[path.join(root,'tools/xbrain.mjs'),'build',input,'--app','--offline','-o',app]);
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(app).href);await page.waitForFunction(()=>window.XB&&XB.getDeck().slides.length===3);
  assert.ok((await page.locator('#active-slide-viewport').innerText()).includes('Safe content'));
  for(let i=0;i<3;i++){
    await page.evaluate(index=>XB.select(index),i);
    assert.equal(await page.locator('#active-slide-viewport [onerror],#active-slide-viewport [onload]').count(),0);
    assert.equal(await page.evaluate(()=>typeof globalThis.PWNED),'undefined');
  }
  // Future imports into the exported app keep the same untrusted policy.
  await page.evaluate(()=>XB.setDeck({version:'1.0',helpers:{attack:'(()=>{globalThis.PWNED=4;return ()=>1})()'},slides:[{type:'composer',components:[{type:'text',text:'Import is inert'}]}]}));
  assert.equal(await page.evaluate(()=>typeof globalThis.PWNED),'undefined');
  await page.evaluate(()=>XB.setDeck({version:'1.0',slides:[{type:'one-off',render:'globalThis.PWNED=5;return "ran";'}]}));
  assert.equal(await page.evaluate(()=>typeof globalThis.PWNED),'undefined');
  assert.ok((await page.locator('#active-slide-viewport').innerText()).includes('Code blocked'));
  results.editable={reopenedViaFile:true,htmlAndSvgSanitized:true,helperAndSlideCodeBlocked:true,cdnRequests:requests.length};
  assert.equal(requests.length,0);assert.deepEqual(errors,[]);results.pageErrors=errors;
  fs.writeFileSync(path.join(dir,'browser-results.json'),JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
}finally{await context.close();await browser.close();fs.rmSync(temp,{recursive:true,force:true});}
