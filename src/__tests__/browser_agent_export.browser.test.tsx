// Strict export and Studio commit must use measured QA for the exact revision.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import { test } from 'vitest';

test('browser agent export', async () => {
const require=createRequire(import.meta.url),{chromium}=require(process.env.XB_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
try{
 const context=await browser.newContext();await context.route(/^https?:/,r=>r.abort());const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,'dist/index.html')).href);
 const results=await page.evaluate(async()=>{
  const a=XB.agent;await a.ready();const before=JSON.stringify(XB.getDeck()),state=(await a.getState()).data;
  const doc={version:'1.0',datasets:{attendance:[{online:true,value:1}]},slides:[{id:'one',type:'composer',title:'Overview',components:[{type:'text',text:'Verified content'}]}]};
  const created=await a.setCandidate({baseRevision:null,document:doc});
  const noQa=await a.exportArtifact({revision:created.revision,format:'static-html',profile:'agent-strict'});
  const run=await a.render({revision:created.revision});const inspection=await a.inspect({runId:run.data.runId});
  const noReview=await a.exportArtifact({revision:created.revision,format:'static-html',profile:'agent-strict-reviewed'});
  const marked=await a.markVisualReview({runId:run.data.runId,status:'approved',reviewer:'browser agent',evidence:'screenshot-1.png'});
  const reviewed=await a.exportArtifact({revision:created.revision,format:'static-html',profile:'agent-strict-reviewed'});
  const exported=await a.exportArtifact({revision:created.revision,format:'static-html',profile:'agent-strict'});
  const artifact=exported.ok?await a.getArtifact({artifactId:exported.data.artifactId}):null;
  Object.defineProperty(navigator,'userActivation',{configurable:true,value:{isActive:false}});
  const noGesture=await a.downloadArtifact({artifactId:exported.data.artifactId});Reflect.deleteProperty(navigator,'userActivation');
  const wrongStudio=await a.commitCandidate({baseRevision:created.revision,expectedStudioRevision:'stale',qaRunId:run.data.runId});
  const viewport=document.getElementById('active-slide-viewport'),native=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML')!;
  Object.defineProperty(viewport,'innerHTML',{configurable:true,get(){return native.get!.call(this);},set(){delete this.innerHTML;throw Error('forced render failure');}});
  const failedCommit=await a.commitCandidate({baseRevision:created.revision,expectedStudioRevision:state.studioRevision,qaRunId:run.data.runId});const afterFailed=JSON.stringify(XB.getDeck());
  const committed=await a.commitCandidate({baseRevision:created.revision,expectedStudioRevision:state.studioRevision,qaRunId:run.data.runId});
  const oldArtifact=await a.getArtifact({artifactId:exported.data.artifactId}),staleDownload=await a.downloadArtifact({artifactId:exported.data.artifactId});
  const after=JSON.stringify(XB.getDeck());XB.undo();const undone=JSON.stringify(XB.getDeck());XB.redo();const redone=JSON.stringify(XB.getDeck());
  return {noQa,run,inspection,noReview,marked,reviewed,exported,artifact,noGesture,wrongStudio,failedCommit,afterFailed,committed,oldArtifact,staleDownload,before,after,undone,redone};
 });
 assert.equal(results.noQa.error.code,'QA_NOT_MEASURED');assert.equal(results.inspection.data.qa.passed,true,JSON.stringify(results.inspection.data.qa));
 assert.equal(results.noReview.error.code,'VISUAL_REVIEW_REQUIRED');assert.equal(results.marked.data.visualReview,'agent-reported');assert.equal(results.reviewed.data.quality.visualReview,'agent-reported');
 assert.equal(results.exported.ok,true,JSON.stringify(results.exported));assert.equal(results.committed.ok,true,JSON.stringify(results.committed));
 assert.equal(results.noGesture.error.code,'DOWNLOAD_BLOCKED');assert.equal(results.wrongStudio.error.code,'REVISION_CONFLICT');
 assert.equal(results.failedCommit.ok,false);assert.equal(results.afterFailed,results.before);
 assert.equal(results.oldArtifact.data.fresh,false);assert.equal(results.staleDownload.error.code,'QA_STALE');
 assert.equal(results.undone,results.before);assert.equal(results.redone,results.after);
 const artifact=results.artifact.data.content;assert.ok(!/<script(?:\s|>)/i.test(artifact));
 const output='/tmp/xbrain-agent-static-test.html';fs.writeFileSync(output,artifact);const reopened=await context.newPage();await reopened.goto(pathToFileURL(output).href);assert.equal(await reopened.locator('[data-xb-slide]').count(),1);assert.match(await reopened.locator('body').innerText(),/Verified content/);
 await context.close();console.log('Agent strict export and Studio transaction checks passed');
}finally{await browser.close();}

});
