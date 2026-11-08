// A font-settle timeout must be observable and must block strict export.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
 const result=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();const created=await a.setCandidate({baseRevision:null,document:{version:'1.0',slides:[{id:'one',type:'composer',components:[{type:'text',text:'Timeout check'}]}]}});
  const proto=HTMLIFrameElement.prototype,original=Object.getOwnPropertyDescriptor(proto,'contentDocument');
  Object.defineProperty(proto,'contentDocument',{configurable:true,get(){const doc=original.get.call(this);return doc&&{body:doc.body,images:doc.images,fonts:{ready:new Promise(()=>{})},querySelectorAll:doc.querySelectorAll.bind(doc),querySelector:doc.querySelector.bind(doc)};}});
  try{const run=await a.render({revision:created.revision});const exported=await a.exportArtifact({revision:created.revision,format:'static-html',qaRunId:run.data.runId});return {run,exported};}
  finally{Object.defineProperty(proto,'contentDocument',original);}
 });
 assert.equal(result.run.data.manifest.fontStatus,'timeout');assert.equal(result.run.data.qa.passed,false);assert.equal(result.exported.error.code,'QA_GATE_FAILED');assert.ok(result.exported.error.details.gateReasons.some(x=>x.code==='ASSET_NOT_READY'));
 await context.close();console.log('Agent font timeout gate check passed');
}finally{await browser.close();}
