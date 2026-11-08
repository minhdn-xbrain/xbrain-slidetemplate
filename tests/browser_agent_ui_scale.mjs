// Large tree stays lazy, and user-provided labels remain text.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();const requests=[];await context.route(/^https?:/,r=>{requests.push(r.request().url());r.abort();});const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'index.html')).href);requests.length=0;
 await page.locator('#v1-menu-ai-trigger').click();await page.getByRole('menuitem',{name:'AI Console'}).click();
 const slides=Array.from({length:400},(_,i)=>({id:'s'+i,type:'composer',title:i===0?'<img src="https://attacker.invalid/ui" onerror="alert(1)">':'Slide '+i,components:[{type:'text',text:'Content '+i}]}));
 await page.getByTestId('xb-agent-deck-input').fill(JSON.stringify({version:'1.0',slides}));await page.getByTestId('xb-agent-load-candidate').click();await page.locator('[data-testid="xb-agent-load-candidate"][data-state="success"]').waitFor();
 assert.equal(await page.getByTestId('xb-agent-deck-tree').locator('li').count(),80);assert.equal(await page.getByTestId('xb-agent-deck-tree').locator('img').count(),0);
 assert.match(await page.getByTestId('xb-agent-slide-s0').innerText(),/<img/);await page.getByTestId('xb-agent-more-slides').click();
 await page.getByTestId('xb-agent-slide-s159').waitFor();assert.equal(await page.getByTestId('xb-agent-deck-tree').locator('li').count(),160);
 await page.setViewportSize({width:390,height:844});const geometry=await page.getByTestId('xb-agent-console').evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth}));assert.equal(geometry.scroll,geometry.client,JSON.stringify(geometry));
 assert.deepEqual(requests.filter(url=>url.includes('attacker.invalid')),[]);await context.close();console.log('Agent large Console tree and text safety checks passed');
}finally{await browser.close();}
