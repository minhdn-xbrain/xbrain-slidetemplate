// Tabs on the same static origin keep independent candidates and do not write the legacy draft.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),server=http.createServer((req,res)=>{res.setHeader('content-type','text/html');res.end(fs.readFileSync(path.join(root,'dist/index.html')));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const a=await context.newPage(),b=await context.newPage(),url=`http://127.0.0.1:${server.address().port}/index.html`;await a.goto(url);await b.goto(url);
 const set=await a.evaluate(async()=>{localStorage.setItem('xbrain-v1-draft','sentinel');return XB.agent.setCandidate({baseRevision:null,document:{version:'1.0',slides:[{id:'a',type:'composer',title:'A',components:[{type:'text',text:'private'}]}]}});});
 const other=await b.evaluate(async()=>({state:await XB.agent.getState(),draft:localStorage.getItem('xbrain-v1-draft')}));
 assert.equal(set.ok,true);assert.equal(other.state.data.hasCandidate,false);assert.equal(other.state.data.candidateRevision,null);assert.equal(other.draft,'sentinel');
 await context.close();console.log('Agent session isolation checks passed');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
