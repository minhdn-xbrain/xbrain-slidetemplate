// Click-only workflow on a static host: no page.evaluate is used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mode=process.argv[2]||'http',temp=fs.mkdtempSync(path.join(os.tmpdir(),'xbrain-ui-tls-'));
const unexpected=[];
const handler=(req,res)=>{if(req.url!=='/index.html'&&req.url!=='/'){if(req.url!=='/favicon.ico')unexpected.push(req.url);res.writeHead(404);res.end();return;}res.setHeader('content-type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'index.html')));};
let server;
if(mode==='https'){
 const key=path.join(temp,'key.pem'),cert=path.join(temp,'cert.pem');execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',key,'-out',cert,'-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
 server=https.createServer({key:fs.readFileSync(key),cert:fs.readFileSync(cert)},handler);
}else server=http.createServer(handler);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext({viewport:{width:1366,height:768},acceptDownloads:true,ignoreHTTPSErrors:true});await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(mode==='file'?pathToFileURL(path.join(root,'index.html')).href:`${mode}://127.0.0.1:${server.address().port}/index.html`);
 await page.locator('#v1-menu-ai-trigger').click();await page.getByRole('menuitem',{name:'AI Console'}).click();
 await page.locator('[data-testid="xb-agent-ready"][data-state="ready"]').waitFor();
 await page.getByRole('button',{name:'Schema / Contract',exact:true}).click();await page.locator('[data-v1-agent-action="contract"][data-state="success"]').waitFor();assert.match(await page.getByTestId('xb-agent-response-json').innerText(),/"schemaVersion": "1.0"/);
 const fixture={version:'1.0',slides:Array.from({length:12},(_,i)=>({id:'slide-'+(i+1),type:'composer',title:'Slide '+(i+1),components:[{type:'text',text:'Verified '+(i+1)}]}))};
 await page.getByTestId('xb-agent-deck-input').fill(JSON.stringify(fixture));
 const click=async id=>{const b=page.getByTestId(id);await b.click();await b.locator('xpath=self::*[@data-state="success"]').waitFor();};
 await click('xb-agent-load-candidate');assert.equal(await page.getByTestId('xb-agent-deck-tree').locator('li').count(),12);
 await click('xb-agent-validate');await click('xb-agent-render');await click('xb-agent-inspect');
 assert.match(await page.getByTestId('xb-agent-qa-summary').innerText(),/12\/12 measured/);
 await page.screenshot({path:'/tmp/xbrain-agent-console-'+mode+'.png'});
 await page.getByTestId('xb-agent-slide-slide-3').click();await page.locator('[data-testid="xb-agent-preview"][data-slide-id="slide-3"]').waitFor();
 await page.getByTestId('xb-agent-preview').frameLocator('iframe').getByText('Verified 3').waitFor();
 await page.getByTestId('xb-agent-preview').screenshot({path:'/tmp/xbrain-agent-preview-'+mode+'.png'});
 await page.getByTestId('xb-agent-render-scope').selectOption('selected');await click('xb-agent-render');assert.match(await page.getByTestId('xb-agent-qa-summary').innerText(),/1\/12 measured/);
 await page.getByTestId('xb-agent-export-static').click();await page.locator('[data-testid="xb-agent-export-static"][data-state="error"]').waitFor();assert.match(await page.getByTestId('xb-agent-response-json').innerText(),/QA_NOT_MEASURED/);
 await page.getByTestId('xb-agent-render-scope').selectOption('all');await page.getByTestId('xb-agent-scope').fill(JSON.stringify({slideId:'slide-3',sourcePath:'/slides/2/components/0'}));
 await page.getByTestId('xb-agent-patch-input').fill(JSON.stringify([{op:'replace',path:'/slides/2/components/0/text',value:'Changed through patch'}]));
 await click('xb-agent-patch-preview');await click('xb-agent-apply-patch');assert.match(await page.getByTestId('xb-agent-preview-status').innerText(),/stale/);await click('xb-agent-render');
 assert.match(await page.getByTestId('xb-agent-qa-summary').innerText(),/QA: passed/);
 await click('xb-agent-export-static');const [download]=await Promise.all([page.waitForEvent('download'),page.getByTestId('xb-agent-download').click()]);
 const output='/tmp/xbrain-agent-ui-export-'+mode+'.html';await download.saveAs(output);const reopened=await context.newPage();await reopened.goto(pathToFileURL(output).href);
 assert.equal(await reopened.locator('[data-xb-slide]').count(),12);assert.equal(await reopened.locator('script').count(),0);assert.match(await reopened.locator('body').innerText(),/Changed through patch/);
 await page.getByRole('button',{name:'Studio',exact:true}).click();assert.equal(await page.locator('#v1-agent-console').isHidden(),true);assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
 await context.close();console.log('Agent Console click-only '+mode+' workflow passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true});}
