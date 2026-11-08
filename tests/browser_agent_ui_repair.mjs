// Click-only scoped repair with explicit escalation and preservation.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 await page.locator('#v1-menu-ai-trigger').click();await page.getByRole('menuitem',{name:'AI Console'}).click();await page.locator('[data-testid="xb-agent-ready"][data-state="ready"]').waitFor();
 const items=Array.from({length:50},(_,i)=>`Item ${i}: original content`),doc={version:'1.0',slides:[{id:'list',type:'composer',title:'List',components:[{type:'list',items}]}]};
 await page.getByTestId('xb-agent-deck-input').fill(JSON.stringify(doc));await page.getByTestId('xb-agent-load-candidate').click();await page.locator('[data-testid="xb-agent-load-candidate"][data-state="success"]').waitFor();
 await page.getByTestId('xb-agent-scope').fill(JSON.stringify({slideId:'list',sourcePath:'/slides/0/components/0'}));await page.getByTestId('xb-agent-propose-repair').click();await page.locator('[data-testid="xb-agent-propose-repair"][data-state="success"]').waitFor();
 assert.match(await page.getByTestId('xb-agent-response-json').innerText(),/"scopeEscalation": "deck"/);
 await page.getByTestId('xb-agent-accept-repair').click();await page.locator('[data-testid="xb-agent-accept-repair"][data-state="error"]').waitFor();assert.match(await page.getByTestId('xb-agent-response-json').innerText(),/REPAIR_SCOPE_ESCALATION/);
 await page.getByTestId('xb-agent-accept-deck').check();await page.getByTestId('xb-agent-accept-repair').click();await page.locator('[data-testid="xb-agent-accept-repair"][data-state="success"]').waitFor();
 await page.getByRole('button',{name:'Show candidate JSON'}).click();await page.locator('[data-v1-agent-action="candidate"][data-state="success"]').waitFor();const response=JSON.parse(await page.getByTestId('xb-agent-response-json').innerText());
 assert.deepEqual(response.data.document.slides.flatMap(s=>(s.components||s.content.components).flatMap(c=>c.items||[])),items);await context.close();console.log('Agent Console scoped repair workflow passed');
}finally{await browser.close();}
