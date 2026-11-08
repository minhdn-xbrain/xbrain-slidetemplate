// Quality gates preserve content and require a fresh full-deck run.
import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'index.html')).href);
 const result=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();
  const ignored={version:'1.0',slides:[{id:'ignored',type:'composer',components:[{type:'text',text:'Visible',children:[{type:'text',text:'Must not disappear'}]}]}]};
  const ignoredDoc=await a.setCandidate({baseRevision:null,document:ignored}),ignoredRun=await a.render({revision:ignoredDoc.revision});
  // Altering returned objects must not alter the stored QA result.
  ignoredRun.data.qa.passed=true;for(const finding of ignoredRun.data.findings)finding.blocking=false;
  const ignoredInspect=await a.inspect({runId:ignoredRun.data.runId}),ignoredExport=await a.exportArtifact({revision:ignoredDoc.revision,format:'static-html'});
  const enhanced={version:'1.0',slides:[{id:'m',type:'composer',components:[{type:'mermaid',source:'graph TD; A-->B;'}]}]};
  const enhancedDoc=await a.setCandidate({baseRevision:ignoredDoc.revision,document:enhanced}),enhancedRun=await a.render({revision:enhancedDoc.revision}),enhancedExport=await a.exportArtifact({revision:enhancedDoc.revision,format:'static-html'});
  const image={version:'1.0',slides:[{id:'img',type:'composer',title:'Image',components:[{type:'image',src:'https://example.invalid/image.png',alt:'remote'}]}]};
  const imageDoc=await a.setCandidate({baseRevision:enhancedDoc.revision,document:image}),imageRun=await a.render({revision:imageDoc.revision}),imageExport=await a.exportArtifact({revision:imageDoc.revision,format:'static-html'});
  const changed=await a.applyPatch({baseRevision:imageDoc.revision,operations:[{op:'replace',path:'/slides/0/title',value:'Changed'}]});
  const inspection=await a.inspect({runId:imageRun.data.runId}),stale=await a.exportArtifact({revision:changed.revision,format:'static-html',qaRunId:imageRun.data.runId});
  return {ignoredInspect,ignoredExport,enhancedRun,enhancedExport,imageRun,imageExport,inspection,stale};
 });
 assert.ok(result.ignoredInspect.data.findings.some(x=>x.code==='data.unrendered-children'&&x.blocking));assert.equal(result.ignoredExport.error.code,'QA_GATE_FAILED');
 assert.ok(result.enhancedRun.data.findings.some(x=>x.code==='render.enhanced-only'&&x.blocking));assert.equal(result.enhancedExport.error.code,'QA_GATE_FAILED');
 assert.equal(result.imageRun.data.manifest.assetStatus,'failed');assert.equal(result.imageExport.ok,true,JSON.stringify(result.imageExport));
 assert.equal(result.inspection.data.fresh,false);assert.equal(result.stale.error.code,'QA_STALE');
 await context.close();console.log('Agent content quality, asset status and stale-run checks passed');
}finally{await browser.close();}
